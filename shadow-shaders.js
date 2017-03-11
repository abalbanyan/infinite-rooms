var shadowVertexShaderText = `
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
varying vec3 fragPos;
varying vec3 fragNorm;
varying vec4 lightPos;

void main(){
	N = normalize( mWorldNormal * vertNormal);

	vec4 object_space_pos = vec4(vertPosition, 1.0);
	gl_Position = mProj * mView * mWorld * object_space_pos;
	vec3 texCoord_transformed = textureTransform * vec3(texCoord, 1.0);
	fragTexCoord = texCoord_transformed.xy;

	pos = (mView * mWorld * object_space_pos).xyz;
	E = normalize(-pos);

	for(int i = 0; i < N_LIGHTS; i++){
        L[i] = normalize((mView * lightPosition[i]).xyz - lightPosition[i].w * pos);
		H[i] = normalize(L[i] + E);

        dist[i]  = lightPosition[i].w > 0.0 ? distance((mView * lightPosition[i]).xyz, pos) : distance( attenuation_factor[i] * -lightPosition[i].xyz, object_space_pos.xyz );
	}
	fragPos = (mWorld * vec4(vertPosition, 1.0)).xyz;
	fragNorm = (mWorld * vec4(vertNormal, 0.0)).xyz;
	lightPos = lightPosition[0];
}`;

var shadowFragmentShaderText = `
precision mediump float;

const int N_LIGHTS = 1;

uniform samplerCube lightShadowMap;
uniform vec2 shadowClipNearFar;
varying vec3 fragPos;
varying vec3 fragNorm;
varying vec4 lightPos;
uniform vec4 lightColor[N_LIGHTS];

varying vec4 VERTEX_COLOR; // VERTEX_COLOR
varying vec3 N, E, pos;
varying vec3 L[N_LIGHTS], H[N_LIGHTS];
varying float dist[N_LIGHTS];
uniform float ambient, diffusivity, shininess, smoothness, attenuation_factor[N_LIGHTS];

uniform sampler2D texture;
uniform sampler2D normalMap;
varying vec2 fragTexCoord;

uniform vec4 shapeColor;  // Should really be called "shapeColor"...

// Control Flags
uniform bool USE_TEXTURE;
uniform bool USE_NORMAL_MAP;

void main(){
	vec3 vec3LightPos = lightPos.xyz;
	vec3 toLightNormal = normalize(vec3LightPos - fragPos);

	float fromLightToFrag =
		(length(fragPos - vec3LightPos) - shadowClipNearFar.x)
		/
		(shadowClipNearFar.y - shadowClipNearFar.x);

	float shadowMapValue = textureCube(lightShadowMap, -toLightNormal).r;

	vec4 tex_color;
	if(USE_TEXTURE){
	 	tex_color = texture2D(texture, fragTexCoord);
	}

	if(USE_TEXTURE){
		gl_FragColor = vec4(tex_color.xyz * ambient, tex_color.w);
	}
	else {
		gl_FragColor = vec4(shapeColor.xyz * ambient, shapeColor.w);
	}

	vec3 bumped_N = N; // numped_N is just the normal N if USE_NORMAL_MAP is off.
	vec4 normalMap_color;
	if(USE_NORMAL_MAP && USE_TEXTURE){
		normalMap_color = texture2D(normalMap, fragTexCoord);
		bumped_N = normalize(N + normalMap_color.rgb - 0.5*vec3(1,1,1));
	}

	for( int i = 0; i < N_LIGHTS; i++ ){
		float attenuation_multiplier = 1.0 / (1.0 + attenuation_factor[i] * (dist[i] * dist[i]));
		float diffuse  = max(dot(L[i], bumped_N), 0.0);
		float specular = pow(max(dot(H[i], bumped_N), 0.0), smoothness);

		if ((shadowMapValue + 0.005) >= fromLightToFrag){
			if(USE_TEXTURE)
				gl_FragColor.xyz += attenuation_multiplier * (tex_color.xyz * diffusivity * diffuse + lightColor[i].xyz * shininess * specular );
			else
				gl_FragColor.xyz += attenuation_multiplier * (shapeColor.xyz * diffusivity * diffuse + lightColor[i].xyz * shininess * specular );
		}
	}
	gl_FragColor.a = gl_FragColor.w;
}`;
