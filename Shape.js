class Object{
	constructor(shape, translation, scale, rotation, axis = [0,1,0], texture_scale = null, name = null){
		this.shape = shape;
		this.translation = translation;
		this.scale = scale;
		this.rotation = rotation;
		this.axis = axis;
		this.texture_scale = texture_scale; // This will determine how many times a texture will repeat.
		this.name = name;
	}

	draw(){
		this.shape.draw();
	}
}

class Shape{
	constructor(vertices, indices, normals, textureCoords, lightPosition,
		gl, noShadowProgram, shadowMapProgram, shadowProgram, buffers){
		this.vertices = vertices;
		this.indices = indices;
		this.normals = normals;
		this.textureCoords = textureCoords; // Set textureCoords to null if no texture is needed.
		this.gl = gl;
		this.noShadowProgram = noShadowProgram;
		this.shadowMapProgram = shadowMapProgram;
		this.shadowProgram = shadowProgram;
		this.buffers = buffers;
		this.material = { diffusivity: 3.5, smoothness: 40, shininess: 0.8 }; // Default material properties

		this.shadowMapCube = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.shadowMapCube);
		gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
		gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
		for (var i = 0; i < 6; i++) {
			gl.texImage2D(
				gl.TEXTURE_CUBE_MAP_POSITIVE_X + i,
				0, gl.RGBA,
				textureSize, textureSize,
				0, gl.RGBA,
				gl.UNSIGNED_BYTE, null
			);
		}

		this.shapeColor = null;
		this.use_texture = false;
		this.texture = gl.createTexture()
		this.lightPosition = lightPosition;

		// Setup shadow map cameras and perspective
		this.shadowMapCameras = [
			// Positive X
			new Camera(
				this.lightPosition,
				vec3.add(vec3.create(), this.lightPosition, vec3.fromValues(1, 0, 0)),
				vec3.fromValues(0, -1, 0)
			),
			// Negative X
			new Camera(
				this.lightPosition,
				vec3.add(vec3.create(), this.lightPosition, vec3.fromValues(-1, 0, 0)),
				vec3.fromValues(0, -1, 0)
			),
			// Positive Y
			new Camera(
				this.lightPosition,
				vec3.add(vec3.create(), this.lightPosition, vec3.fromValues(0, 1, 0)),
				vec3.fromValues(0, 0, 1)
			),
			// Negative Y
			new Camera(
				this.lightPosition,
				vec3.add(vec3.create(), this.lightPosition, vec3.fromValues(0, -1, 0)),
				vec3.fromValues(0, 0, -1)
			),
			// Positive Z
			new Camera(
				this.lightPosition,
				vec3.add(vec3.create(), this.lightPosition, vec3.fromValues(0, 0, 1)),
				vec3.fromValues(0, -1, 0)
			),
			// Negative Z
			new Camera(
				this.lightPosition,
				vec3.add(vec3.create(), this.lightPosition, vec3.fromValues(0, 0, -1)),
				vec3.fromValues(0, -1, 0)
			),
		];
		this.shadowMapViewMatrices = [
			mat4.create(),
			mat4.create(),
			mat4.create(),
			mat4.create(),
			mat4.create(),
			mat4.create()
		];
		this.shadowMapProj = mat4.create();
		this.shadowClipNearFar = vec2.fromValues(0.05, 15.0);
		mat4.perspective(
			this.shadowMapProj,
			glMatrix.toRadian(90),
			1.0,
			this.shadowClipNearFar[0],
			this.shadowClipNearFar[1]
		);


		this.noShadowUniforms = {
			samplerLocation: this.gl.getUniformLocation(this.noShadowProgram, 'sampler'),
			useTextureLocation: this.gl.getUniformLocation(this.noShadowProgram, 'USE_TEXTURE'),
			diffusivityLocation: this.gl.getUniformLocation(this.noShadowProgram, 'diffusivity'),
			smoothnessLocation: this.gl.getUniformLocation(this.noShadowProgram, 'smoothness'),
			shininessLocation: this.gl.getUniformLocation(this.noShadowProgram, 'shininess'),
			shapeColorLocation: this.gl.getUniformLocation(this.noShadowProgram, 'shapeColor')
		};
		this.noShadowAttribs = {
			positionAttribLocation: this.gl.getAttribLocation(this.noShadowProgram, 'vertPosition'),
			normalAttribLocation: this.gl.getAttribLocation(this.noShadowProgram, 'vertNormal'),
			textureCoordAttribLocation: this.gl.getAttribLocation(this.noShadowProgram, 'texCoord')
		};

		this.shadowMapUniforms = {
			pointLightPosition: this.gl.getUniformLocation(this.shadowMapProgram, 'pointLightPosition'),
			shadowClipNearFar: this.gl.getUniformLocation(this.shadowMapProgram, 'shadowClipNearFar')
		};
		this.shadowMapAttribs = {
			positionAttribLocation: this.gl.getAttribLocation(this.shadowMapProgram, 'vertPosition')
		};
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
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
		//	gl.generateMipmap(gl.TEXTURE_2D);
			gl.bindTexture(gl.TEXTURE_2D, null);
		}
		img.src = source;
	}

	// Use this when no texture is attached.
	setColor(color){
		this.shapeColor = color;
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
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.vertexBuffer); // The active buffer is now an ARRAY_BUFFER, vertexBuffer.
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.vertices), this.gl.STATIC_DRAW); 	// This uses whatever buffer is active. Float32Array is needed because webGL only uses 32 bit floats.  gl.STATIC_DRAW means we are sending the information once and not changing it.

		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.buffers.indexBuffer);
		this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), this.gl.STATIC_DRAW);

		this.gl.vertexAttribPointer( this.noShadowAttribs.positionAttribLocation,
		3, // Number of elements per attribute
		this.gl.FLOAT, // Type of elements
		this.gl.FALSE, // Normalization?
		3 * Float32Array.BYTES_PER_ELEMENT, // Size of individual vertex in bytes.
		0 // Offset from beginning of single vertex to this attribute.
		);
		this.gl.enableVertexAttribArray( this.noShadowAttribs.positionAttribLocation);

		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.normalBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.normals), this.gl.STATIC_DRAW);

		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.buffers.indexNormalBuffer);
		this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), this.gl.STATIC_DRAW);

		this.gl.vertexAttribPointer(this.noShadowAttribs.normalAttribLocation,
			3,
			this.gl.FLOAT,
			this.gl.FALSE,
			3 * Float32Array.BYTES_PER_ELEMENT,
			0
		);
		this.gl.enableVertexAttribArray(this.noShadowAttribs.normalAttribLocation);

		// Setup materials for lighting
		this.gl.uniform1f(this.noShadowUniforms.diffusivityLocation, this.material.diffusivity);
		this.gl.uniform1f(this.noShadowUniforms.smoothnessLocation, this.material.smoothness);
		this.gl.uniform1f(this.noShadowUniforms.shininessLocation, this.material.shininess);

		// Set color if a color was specified.
		if(this.shapeColor != null) this.gl.uniform4fv(this.noShadowUniforms.shapeColorLocation, this.shapeColor);

		if(this.use_texture){
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.texCoordBuffer);
			this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.textureCoords), this.gl.STATIC_DRAW);

			this.gl.enableVertexAttribArray(this.noShadowAttribs.textureCoordAttribLocation);
			this.gl.vertexAttribPointer(this.noShadowAttribs.textureCoordAttribLocation, 2, this.gl.FLOAT, false, 0, 0);

			this.gl.activeTexture(this.gl.TEXTURE0);
			this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
			this.gl.uniform1i(this.noShadowUniforms.samplerLocation, 0);
			this.gl.uniform1i(this.noShadowUniforms.useTextureLocation, 1);

			this.gl.drawElements(this.gl.TRIANGLES, this.indices.length, this.gl.UNSIGNED_SHORT, 0);

			this.gl.disableVertexAttribArray(this.noShadowAttribs.textureCoordAttribLocation); // This is important!
		}
		else {
			this.gl.uniform1i(this.noShadowUniforms.useTextureLocation, 0);

			this.gl.drawElements(this.gl.TRIANGLES, this.indices.length, this.gl.UNSIGNED_SHORT, 0);
		}

	}

	generateShadowMap(){
		var gl = this.gl;

		// Set GL state status
		gl.useProgram(this.ShadowMapProgram);
		gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.shadowMapCube);
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.buffers.shadowMapFrameBuffer);
		gl.bindRenderbuffer(gl.RENDERBUFFER, this.buffers.shadowMapRenderBuffer);

		gl.viewport(0, 0, textureSize, textureSize);
		gl.enable(gl.DEPTH_TEST);
		gl.enable(gl.CULL_FACE);

		// Set per-frame uniforms
		gl.uniform2fv(
			this.ShadowMapGenProgram.uniforms.shadowClipNearFar,
			this.shadowClipNearFar
		);
		gl.uniform3fv(
			this.ShadowMapGenProgram.uniforms.pointLightPosition,
			this.lightPosition
		);
		gl.uniformMatrix4fv(
			this.ShadowMapGenProgram.uniforms.mProj,
			gl.FALSE,
			this.shadowMapProj
		);

		for (var i = 0; i < this.shadowMapCameras.length; i++) {
			// Set per light uniforms
			gl.uniformMatrix4fv(
				this.ShadowMapGenProgram.uniforms.mView,
				gl.FALSE,
				this.shadowMapCameras[i].GetViewMatrix(this.shadowMapViewMatrices[i])
			);

			// Set framebuffer destination
			gl.framebufferTexture2D(
				gl.FRAMEBUFFER,
				gl.COLOR_ATTACHMENT0,
				gl.TEXTURE_CUBE_MAP_POSITIVE_X + i,
				this.shadowMapCube,
				0
			);
			gl.framebufferRenderbuffer(
				gl.FRAMEBUFFER,
				gl.DEPTH_ATTACHMENT,
				gl.RENDERBUFFER,
				this.shadowMapRenderbuffer
			);

			gl.clearColor(0, 0, 0, 1);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

			// Draw meshes
			for (var j = 0; j < this.Meshes.length; j++) {
				// Per object uniforms
				gl.uniformMatrix4fv(
					this.ShadowMapGenProgram.uniforms.mWorld,
					gl.FALSE,
					this.Meshes[j].world
				);

				// Set attributes
				gl.bindBuffer(gl.ARRAY_BUFFER, this.Meshes[j].vbo);
				gl.vertexAttribPointer(
					this.ShadowMapGenProgram.attribs.vPos,
					3, gl.FLOAT, gl.FALSE,
					0, 0
				);
				gl.enableVertexAttribArray(this.ShadowMapGenProgram.attribs.vPos);

				gl.bindBuffer(gl.ARRAY_BUFFER, null);

				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.Meshes[j].ibo);
				gl.drawElements(gl.TRIANGLES, this.Meshes[j].nPoints, gl.UNSIGNED_SHORT, 0);
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
		}
	}

	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.bindRenderbuffer(gl.RENDERBUFFER, null);
	gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
	}

}


// Notes:
/*
	A static method can be called without instantiating the class in JS.
	The "super" keyword can be used to call functions on an object's parent.
	"this" has to be used EVERYWHERE IT SUCKS

*/
