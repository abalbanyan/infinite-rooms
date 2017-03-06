// Shaders

// I use a somewhat modified version of Garret's shaders here. 
// Most changes involve the implementation of textures with lighting.
var vertexShaderText = `
precision mediump float;

const int N_LIGHTS = 1; 

attribute vec3 vertPosition;
attribute vec3 vertNormal;
attribute vec2 texCoord; // TODO: bind something random to this when there is no texture.

uniform vec4 shapeColor;

uniform mat4 mWorld;
uniform mat4 mView;
uniform mat4 mProj;
uniform mat3 textureTransform;

uniform mat3 mWorldNormal; 

uniform vec4 lightPosition[N_LIGHTS], lightColor[N_LIGHTS];
uniform float ambient, diffusivity, shininess, smoothness, attenuation_factor[N_LIGHTS];

varying vec4 VERTEX_COLOR;
varying vec3 N, E, pos;
varying vec3 L[N_LIGHTS], H[N_LIGHTS];
varying float dist[N_LIGHTS];
varying vec2 fragTexCoord;

// Control Flags
uniform bool GOURAUD;
uniform bool COLOR_NORMALS, COLOR_VERTICES;

void main(){
	N = normalize( mWorldNormal * vertNormal);

	vec4 object_space_pos = vec4(vertPosition, 1.0);
	gl_Position = mProj * mView * mWorld * object_space_pos;
	
	vec3 texCoord_transformed = textureTransform * vec3(texCoord, 1.0);
	fragTexCoord = texCoord_transformed.xy;

	if( COLOR_NORMALS || COLOR_VERTICES )
	{
		VERTEX_COLOR   = COLOR_NORMALS ? ( vec4( N[0] > 0.0 ? N[0] : 0.0 * -N[0],             // In normals mode, rgb color = xyz quantity.  Flash if it's negative.
											N[1] > 0.0 ? N[1] : 0.0 * -N[1],
											N[2] > 0.0 ? N[2] : 0.0 * -N[2] , 1.0 ) ) : shapeColor;
		VERTEX_COLOR.a = VERTEX_COLOR.w;
		return;
	}

	pos = (mView * mWorld * object_space_pos).xyz;
	E = normalize(-pos);

	for(int i = 0; i < N_LIGHTS; i++){
        L[i] = normalize((mView * lightPosition[i]).xyz - lightPosition[i].w * pos);
		H[i] = normalize(L[i] + E);

        dist[i]  = lightPosition[i].w > 0.0 ? distance((mView * lightPosition[i]).xyz, pos) : distance( attenuation_factor[i] * -lightPosition[i].xyz, object_space_pos.xyz );
	}

	if(GOURAUD){
		VERTEX_COLOR = vec4(shapeColor.xyz * ambient, shapeColor.w);
		for(int i = 0; i < N_LIGHTS; i++){
			float attenuation_multiplier = 1.0 /  (1.0 + attenuation_factor[i] * (dist[i] * dist[i]));

			float diffuse  = max(dot(L[i], N), 0.0);
			float specular = pow(max(dot(H[i], N), 0.0), smoothness);                                                                               // TODO

            VERTEX_COLOR.xyz += attenuation_multiplier * (shapeColor.xyz * diffusivity * diffuse 
            												+ lightColor[i].xyz * shininess * specular );
		}
	}
	
}`;

var fragmentShaderText = `
precision mediump float;

const int N_LIGHTS = 1;

uniform vec4 lightColor[N_LIGHTS];

varying vec4 VERTEX_COLOR; // VERTEX_COLOR
varying vec3 N, E, pos;
varying vec3 L[N_LIGHTS], H[N_LIGHTS];
varying float dist[N_LIGHTS];
uniform float ambient, diffusivity, shininess, smoothness, attenuation_factor[N_LIGHTS];

uniform sampler2D texture;
varying vec2 fragTexCoord;

uniform vec4 shapeColor;  // Should really be called "shapeColor"...

// Control Flags
uniform bool GOURAUD; // Note that GOURAUD supercedes USE_TEXTURE.
uniform bool USE_TEXTURE;
uniform bool COLOR_NORMALS;
uniform bool USE_AMBIENCE;


void main(){
	if(GOURAUD || COLOR_NORMALS){
		gl_FragColor = VERTEX_COLOR;
		return;
	}
	vec4 tex_color;
	if(USE_TEXTURE){
	 	tex_color = texture2D(texture, fragTexCoord);
	}

	if(USE_TEXTURE){
		gl_FragColor = vec4(tex_color.xyz * (USE_AMBIENCE? ambient : 1.0), tex_color.w);
	} 
	else {
		gl_FragColor = vec4(shapeColor.xyz * (USE_AMBIENCE? ambient : 1.0), shapeColor.w);
	}
	if(!USE_AMBIENCE){
		return;
	}

	for( int i = 0; i < N_LIGHTS; i++ ){
		float attenuation_multiplier = 1.0 / (1.0 + attenuation_factor[i] * (dist[i] * dist[i]));
		float diffuse  = max(dot(L[i], N), 0.0);
		float specular = pow(max(dot(H[i], N), 0.0), smoothness);

		if(USE_TEXTURE)
			gl_FragColor.xyz += attenuation_multiplier * (tex_color.xyz * diffusivity * diffuse + lightColor[i].xyz * shininess * specular );
		else
			gl_FragColor.xyz += attenuation_multiplier * (shapeColor.xyz * diffusivity * diffuse + lightColor[i].xyz * shininess * specular );
	}
	gl_FragColor.a = gl_FragColor.w;
}`;