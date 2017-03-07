class Light{
	constructor(lightPosition, lightColor, lightAttenuation, lightAmbience, gl, program){
		this.gl = gl;
		this.program = program;

		this.lightPositionLocation = gl.getUniformLocation(program, 'lightPosition');
		this.lightColorLocation = gl.getUniformLocation(program, 'lightColor');
		this.lightAttenuationLocation = gl.getUniformLocation(program, 'attenuation_factor');
		this.ambientLocation = gl.getUniformLocation(program, 'ambient');

		gl.uniform4fv(this.lightPositionLocation, lightPosition);
		gl.uniform4fv(this.lightColorLocation, lightColor);
		gl.uniform1f(this.lightAttenuationLocation, lightAttenuation);
		gl.uniform1f(this.ambientLocation, lightAmbience);

		this.ambience = lightAmbience; 
	}

	setAmbience(ambience){
		this.ambience = ambience;
		this.gl.uniform1f(this.ambientLocation, ambience);
	}
};
