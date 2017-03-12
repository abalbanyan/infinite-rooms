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
uniform float theta;

varying vec4 VERTEX_COLOR;
varying vec3 N, E, pos;
varying vec3 L[N_LIGHTS], H[N_LIGHTS];
varying float dist[N_LIGHTS];
varying vec2 fragTexCoord;
varying vec3 fragPos;
varying vec3 fragNorm;
varying vec4 lightPos;
varying mat3 fragWorldNormal;

uniform bool WATER;


void main(){
	N = normalize( mWorldNormal * vertNormal);
	fragWorldNormal = mWorldNormal;

	vec4 object_space_pos = vec4(vertPosition, 1.0);

	if(WATER)
		object_space_pos.y += sin(object_space_pos.z * theta * 0.5) +  cos(object_space_pos.z * theta * 0.8)+ cos(object_space_pos.x * theta * 0.7) ;

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
varying mat3 fragWorldNormal;
uniform float ambient, diffusivity, shininess, smoothness, attenuation_factor[N_LIGHTS];
uniform float theta;

uniform sampler2D normalMap;

uniform sampler2D texture;
varying vec2 fragTexCoord;

uniform vec4 shapeColor;  // Should really be called "shapeColor"...

// Control Flags
uniform bool USE_TEXTURE;
uniform bool USE_NORMAL_MAP;
uniform bool SHADOWS_OFF;
uniform bool TEXTURE_DISTORTION;
uniform bool WATER;

void main(){
	vec3 vec3LightPos = lightPos.xyz;
	vec3 toLightNormal = normalize(vec3LightPos - fragPos);

	float fromLightToFrag =
		(length(fragPos - vec3LightPos) - shadowClipNearFar.x)
		/
		(shadowClipNearFar.y - shadowClipNearFar.x);

	float shadowMapValue = textureCube(lightShadowMap, -toLightNormal).r;

	vec4 tex_color;
	vec2 tex = fragTexCoord;
	if(USE_TEXTURE){
		if(TEXTURE_DISTORTION){
			tex.x += 2.0 * sin(theta);
			tex.y += cos(theta);
		}
		if(WATER){
			tex.x += 0.2 * sin(theta);
			tex.y += 0.1 * cos(theta);
		}

	 	tex_color = texture2D(texture, tex);

		 if(TEXTURE_DISTORTION){
			tex_color.x += sin(theta); //* tex_color.r;
		 	tex_color.y += cos(theta); //* tex_color.g;
			tex_color.z += sin(-theta); //* tex_color.g;
			tex_color.a += 0.3 * sin(3.0 * theta);
		 }
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
		bumped_N = texture2D(normalMap, fragTexCoord).rgb;
		bumped_N = normalize(bumped_N * 2.0 - 1.0);
		bumped_N = normalize(fragWorldNormal * bumped_N);
	}

	for( int i = 0; i < N_LIGHTS; i++ ){
		float attenuation_multiplier = 1.0 / (1.0 + attenuation_factor[i] * (dist[i] * dist[i]));
		float diffuse  = max(dot(L[i], bumped_N), 0.0);
		float specular = pow(max(dot(H[i], bumped_N), 0.0), smoothness);

		if ( ((shadowMapValue + 0.005) >= fromLightToFrag) || SHADOWS_OFF ){
			if(USE_TEXTURE)
				gl_FragColor.xyz += attenuation_multiplier * (tex_color.xyz * diffusivity * diffuse + lightColor[i].xyz * shininess * specular );
			else
				gl_FragColor.xyz += attenuation_multiplier * (shapeColor.xyz * diffusivity * diffuse + lightColor[i].xyz * shininess * specular );
		}
	}
	gl_FragColor.a = gl_FragColor.w;
}`;
