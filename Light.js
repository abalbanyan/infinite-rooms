class Light{
	constructor(lightPosition, lightColor, lightAttenuation, lightAmbience, gl, program){
		this.gl = gl;
		this.program = program;
		this.lightPosition = lightPosition;
		this.lightColor = lightColor;
		this.lightAttenuation = lightAttenuation;
		this.ambience = lightAmbience;

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

	changeProgram(newProgram){
		this.program = newProgram;
		this.lightPositionLocation = this.gl.getUniformLocation(this.program, 'lightPosition');
		this.lightColorLocation = this.gl.getUniformLocation(this.program, 'lightColor');
		this.lightAttenuationLocation = this.gl.getUniformLocation(this.program, 'attenuation_factor');
		this.ambientLocation = this.gl.getUniformLocation(this.program, 'ambient');

		this.gl.uniform4fv(this.lightPositionLocation, this.lightPosition);
		this.gl.uniform4fv(this.lightColorLocation, this.lightColor);
		this.gl.uniform1f(this.lightAttenuationLocation, this.lightAttenuation);
		this.gl.uniform1f(this.ambientLocation, this.ambience);
	}
};
