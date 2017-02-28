class Shape{
	constructor(vertices, indices, normals, textureCoords, gl, program, buffers){
		this.vertices = vertices;
		this.indices = indices;
		this.normals = normals;
		this.textureCoords = textureCoords; // Set textureCoords to null if no texture is needed.
		this.gl = gl;
		this.program = program;
		this.buffers = buffers;
		this.material = { diffusivity: 1.5, smoothness: 40, shininess: 0.5 }; // Default material properties
		//this.material.diffusivity = 1.5;
		//this.material.smoothness = 40;
		//this.material.shininess = 0.5;

		this.use_texture = false;
		this.texture = gl.createTexture()

		this.positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
		this.samplerLocation = gl.getUniformLocation(program, 'sampler')
		this.normalAttribLocation = gl.getAttribLocation(program, 'vertNormal');
		this.textureCoordAttribLocation = gl.getAttribLocation(program, 'texCoord');
		this.useTextureLocation = gl.getUniformLocation(program, 'USE_TEXTURE');
		this.diffusivityLocation = gl.getUniformLocation(program, 'diffusivity');
		this.smoothnessLocation = gl.getUniformLocation(program, 'smoothness');
		this.shininessLocation = gl.getUniformLocation(program, 'shininess');
	}

	// This function causes the shape to display a texture when it is drawn.
	// @source: A string specifying the path to the texture.
	attachTexture(source){
		var gl = this.gl;
		var texture = this.texture;
		this.use_texture = true;
		var img = new Image()
		img.onload = function(){
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texImage2D(
				gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE,
				img
			);
			gl.bindTexture(gl.TEXTURE_2D, null);
		}
		img.src = source;
	}

	disableTexture(){
		this.use_texture = false;
	}

	setMaterialProperties(new_diffusivity, new_smoothness, new_shininess){
		this.material.diffusivity = new_diffusivity;
		this.material.smoothness = new_smoothness;
		this.material.shininess = new_shininess;
	}

	// Binds and buffers data, then draws the shape.
	draw(){
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.vertexBuffer); // The active buffer is now an ARRAY_BUFFER, vertexBuffer.
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.vertices), this.gl.STATIC_DRAW); 	// This uses whatever buffer is active. Float32Array is needed because webGL only uses 32 bit floats.  gl.STATIC_DRAW means we are sending the information once and not changing it.

		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.buffers.indexBuffer);
		this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), this.gl.STATIC_DRAW);

		this.gl.vertexAttribPointer( this.positionAttribLocation,
		3, // Number of elements per attribute
		this.gl.FLOAT, // Type of elements
		this.gl.FALSE, // Normalization?
		3 * Float32Array.BYTES_PER_ELEMENT, // Size of individual vertex in bytes.
		0 // Offset from beginning of single vertex to this attribute.
		);
		this.gl.enableVertexAttribArray( this.positionAttribLocation);

		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.normalBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.normals), this.gl.STATIC_DRAW);

		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.buffers.indexNormalBuffer);
		this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), this.gl.STATIC_DRAW);

		this.gl.vertexAttribPointer(this.normalAttribLocation,
			3,
			this.gl.FLOAT,
			this.gl.FALSE,
			3 * Float32Array.BYTES_PER_ELEMENT,
			0
		);
		this.gl.enableVertexAttribArray(this.normalAttribLocation);

		// Setup materials for lighting
		this.gl.uniform1f(this.diffusivityLocation, this.material.diffusivity);
		this.gl.uniform1f(this.smoothnessLocation, this.material.smoothness);
		this.gl.uniform1f(this.shininessLocation, this.material.shininess);

		if(this.use_texture){
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.texCoordBuffer);
			this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.textureCoords), this.gl.STATIC_DRAW);

			this.gl.enableVertexAttribArray(this.textureCoordAttribLocation);
			this.gl.vertexAttribPointer(this.textureCoordAttribLocation, 2, this.gl.FLOAT, false, 0, 0);

			this.gl.activeTexture(this.gl.TEXTURE0);
			this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
			this.gl.uniform1i(this.samplerLocation, 0);
			this.gl.uniform1i(this.useTextureLocation, 1);

			this.gl.drawElements(this.gl.TRIANGLES, this.indices.length, this.gl.UNSIGNED_SHORT, 0);

			this.gl.disableVertexAttribArray(this.textureCoordAttribLocation); // This is important!
		}
		else {
			this.gl.uniform1i(this.useTextureLocation, 0);

			this.gl.drawElements(this.gl.TRIANGLES, this.indices.length, this.gl.UNSIGNED_SHORT, 0);
		}

	}

}

// Overloading isn't supported in JavaScript...
class ShapeFromMesh extends Shape{
	constructor(mesh, gl, program, buffers){
		this.vertices = mesh.vertices;
		this.indices = mesh.indices;
		this.normals = mesh.normals;
		this.textureCoords = mesh.textureCoords; // Set textureCoords to null if no texture is needed.
		this.gl = gl;
		this.program = program;
		this.buffers = buffers;

		this.use_texture = false;
		this.texture = gl.createTexture()

		this.positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
		this.samplerLocation = gl.getUniformLocation(program, 'sampler')
		this.normalAttribLocation = gl.getAttribLocation(program, 'vertNormal');
		this.textureCoordAttribLocation = gl.getAttribLocation(program, 'texCoord');
		this.useTextureLocation = gl.getUniformLocation(program, 'USE_TEXTURE');
	}
}

// Notes:
/*
	A static method can be called without instantiating the class in JS.
	The "super" keyword can be used to call functions on an object's parent.
	"this" has to be used EVERYWHERE IT SUCKS

*/
