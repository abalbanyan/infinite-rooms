class Light{
	constructor(lightPosition, lightColor, lightAttenuation, lightAmbience, gl, program){
		this.gl = gl;
		this.program = program;
		this.lightPosition = lightPosition;

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
	translateLight(translation){
		this.lightPosition[0] = this.lightPosition[0] + translation[0];
		this.lightPosition[1] = this.lightPosition[1] + translation[1];
		this.lightPosition[2] = this.lightPosition[2] + translation[2];
		this.gl.uniform4fv(this.lightPositionLocation, this.lightPosition);

	}

	setAmbience(ambience){
		this.ambience = ambience;
		this.gl.uniform1f(this.ambientLocation, ambience);
	}
};
