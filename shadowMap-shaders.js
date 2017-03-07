var shadowMapVertexShaderText = `
precision mediump float;

uniform mat4 mProj;
uniform mat4 mView;
uniform mat4 mWorld;

attribute vec3 vertPosition;

varying vec3 fPos;

void main()
{
	fPos = (mWorld * vec4(vertPosition, 1.0)).xyz;

	gl_Position = mProj * mView * vec4(fPos, 1.0);
}`;

var shadowMapFragmentShaderText = `
precision mediump float;

uniform vec4 pointLightPosition;
uniform vec2 shadowClipNearFar;

varying vec3 fPos;

void main()
{
	vec3 vec3LightPosition = pointLightPosition.xyz;
	vec3 fromLightToFrag = (fPos - vec3LightPosition);

	float lightFragDist =
		(length(fromLightToFrag) - shadowClipNearFar.x)
		/
		(shadowClipNearFar.y - shadowClipNearFar.x);

	gl_FragColor = vec4(lightFragDist, lightFragDist, lightFragDist, 1.0);
}
`;
