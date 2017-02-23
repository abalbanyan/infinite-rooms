

window.onload = function(){
	console.log("Starting.")
	var canvas = document.getElementById('webgl-canvas');
	canvas.width  = 960 * 1.5//window.innerWidth - 250;
	canvas.height = 540 * 1.5//window.innerHeight - 250;

	var gl = canvas.getContext('webgl'); // For Chrome and Firefox, all that's needed.

    ////////////////// Compile Shaders ////////////////

	// Send the shaders to the gpu and compile them.
	var vertexShader = gl.createShader(gl.VERTEX_SHADER);
	var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(vertexShader, vertexShaderText);
	gl.shaderSource(fragmentShader, fragmentShaderText);
	gl.compileShader(vertexShader);
	if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)){
		console.error("ERROR compiling vertex shader.", gl.getShaderInfoLog(vertexShader));
	}
	gl.compileShader(fragmentShader);
	if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)){
		console.error("ERROR compiling fragment shader.", gl.getShaderInfoLog(fragmentShader));
	}
	// Set up the program using the shaders.
	var program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);
	gl.useProgram(program); 
	gl.enable(gl.DEPTH_TEST);

    ////////////////// Create Buffers /////////////////

	// Chunks of memory on GPU that are ready to use.
	var vertexBuffer = gl.createBuffer(); 
	var indexBuffer = gl.createBuffer();
	var normalBuffer = gl.createBuffer();
	var indexNormalBuffer = gl.createBuffer();
	var texCoordBuffer = gl.createBuffer();
	var buffers = {vertexBuffer:vertexBuffer, indexBuffer:indexBuffer, normalBuffer:normalBuffer, 
					indexNormalBuffer:indexNormalBuffer, texCoordBuffer:texCoordBuffer};

	/////////////////// Initialize Matrices ///////////

	var shapeColorLoc = gl.getUniformLocation(program, 'shapeColor');
	var mWorldLoc = gl.getUniformLocation(program, 'mWorld');
	var mViewLoc = gl.getUniformLocation(program, 'mView');
	var mProjLoc = gl.getUniformLocation(program, 'mProj');
	var mWorldNormalLoc = gl.getUniformLocation(program, 'mWorldNormal');

	// These are all initiliazed to 0.
	var worldMatrix = new Float32Array(16);
	var viewMatrix = new Float32Array(16);
	var projMatrix = new Float32Array(16);
	
	var cameraWorldMatrix = new Float32Array(16);
	var cameraWorldNormalMatrixHelper = new Float32Array(16);
	var cameraWorldNormalMatrix = new Float32Array(9);

	var fovY = 50;
	mat4.identity(worldMatrix);
	mat4.lookAt(viewMatrix, [0, 20, -30], [0,0,0], [0,1,0]); // Eye, Point, Up. The camera is initialized using lookAt. I promise I don't use it anywhere else!
 	mat4.perspective(projMatrix, glMatrix.toRadian(fovY), canvas.width / canvas.height, 0.1, 1000.0); // fovy, aspect ratio, near, far

	gl.uniformMatrix4fv(mWorldLoc, gl.FALSE, worldMatrix);
	gl.uniformMatrix4fv(mViewLoc, gl.FALSE, viewMatrix);
	gl.uniformMatrix4fv(mProjLoc, gl.FALSE, projMatrix);
	
	gl.uniformMatrix4fv(mWorldLoc, gl.FALSE, cameraWorldMatrix);
	gl.uniformMatrix3fv(mWorldNormalLoc, gl.FALSE, cameraWorldNormalMatrix);

	var identityMatrix = new Float32Array(16);		mat4.identity(identityMatrix);
	var rotationMatrix = new Float32Array(16);
	var translationMatrix = new Float32Array(16);
	var scalingMatrix = new Float32Array(16);
	var tempViewMatrix = new Float32Array(16);
	var resetViewMatrix = new Float32Array(16);

	
	//////////////// Textures /////////////////////////////

	var use_texture_loc = gl.getUniformLocation(program, 'USE_TEXTURE');
	gl.uniform1i(use_texture_loc, 0);
	
	//////////////// Lighting /////////////////////////////

	var lightPositions = [0.0, 0.0, 0.0, 1.0];
	var lightColors = [1,0.3,0.1,1];
	var lightAttenuations = [2.0/10000.0];

	var lightPos_loc = gl.getUniformLocation(program, 'lightPosition');
	var lightColor_loc = gl.getUniformLocation(program, 'lightColor');
	var ambient_loc = gl.getUniformLocation(program, 'ambient');
	var diffusivity_loc = gl.getUniformLocation(program, 'diffusivity');
	var shininess_loc = gl.getUniformLocation(program, 'shininess');
	var smoothness_loc = gl.getUniformLocation(program, 'smoothness');
	var attenuation_factor_loc = gl.getUniformLocation(program, 'attenuation_factor');
	var gouraud_loc = gl.getUniformLocation(program, 'GOURAUD');
	var color_normals_loc = gl.getUniformLocation(program, 'COLOR_NORMALS');
	var color_vertices_loc = gl.getUniformLocation(program, 'COLOR_VERTICES');

	gl.uniform4fv(lightPos_loc, lightPositions);
	gl.uniform4fv(lightColor_loc, lightColors);
	gl.uniform1f(attenuation_factor_loc, lightAttenuations);

	function setLightProperties(materialProperties){
		gl.uniform1f(diffusivity_loc, materialProperties.diffusivity);
		gl.uniform1f(shininess_loc, materialProperties.shininessObj);
		gl.uniform1f(smoothness_loc, materialProperties.smoothnessObj);
	}

	gl.uniform1i(gouraud_loc, 0);
	gl.uniform1i(color_normals_loc, 0);
	gl.uniform1i(color_vertices_loc, 0);


	////////////////////// Control ///////////////////////

	fovY = 45;
	mat4.perspective(projMatrix, glMatrix.toRadian(fovY), canvas.width / canvas.height, 0.1, 1000.0); // fovy, aspect ratio, near, far
	gl.uniformMatrix4fv(mProjLoc, gl.FALSE, projMatrix);
	var heading = 0; // Degrees
	var pitch = 0;
	var N = 1;
	var ambientLight = 0.8;
	mat4.mul(resetViewMatrix, viewMatrix, identityMatrix); // Used to reset camera.

	document.onkeydown = function(e){
		e = e || window.event;
		switch(e.keyCode){
			case 187:
				ambientLight += (ambientLight < 1.4)? 0.1 : 0.0;
				break;
			case 189:
				ambientLight -= (ambientLight > 0.0)? 0.1 : 0.0;
				break;
			case 37: // left 
				heading -= N;
				mat4.rotate(rotationMatrix, identityMatrix, glMatrix.toRadian(-N), [0,1,0]);
				mat4.mul(viewMatrix, rotationMatrix, viewMatrix);
				gl.uniformMatrix4fv(mViewLoc, gl.FALSE, viewMatrix);
				break;
			case 39: // right
				heading += N;
				mat4.rotate(rotationMatrix, identityMatrix, glMatrix.toRadian(N), [0,1,0]);
				mat4.mul(viewMatrix, rotationMatrix, viewMatrix);
				gl.uniformMatrix4fv(mViewLoc, gl.FALSE, viewMatrix);
				break;
			case 38: // up
				pitch += N;
				mat4.rotate(rotationMatrix, identityMatrix, glMatrix.toRadian(-N), [1,0,0]);
				mat4.mul(viewMatrix, rotationMatrix, viewMatrix);
				gl.uniformMatrix4fv(mViewLoc, gl.FALSE, viewMatrix);
				break;
			case 40: // down
				pitch -= N;
				mat4.rotate(rotationMatrix, identityMatrix, glMatrix.toRadian(N), [1,0,0]);
				mat4.mul(viewMatrix, rotationMatrix, viewMatrix);
				gl.uniformMatrix4fv(mViewLoc, gl.FALSE, viewMatrix);
				break;
			case 32: // space - move in
				mat4.translate(translationMatrix, identityMatrix, [0,0,N]);
				mat4.mul(viewMatrix, translationMatrix, viewMatrix);
				gl.uniformMatrix4fv(mViewLoc, gl.FALSE, viewMatrix);
				break;
			case 82: // r - reset
				mat4.mul(viewMatrix, resetViewMatrix, identityMatrix);
				gl.uniformMatrix4fv(mViewLoc, gl.FALSE, viewMatrix);

				mat4.perspective(projMatrix, glMatrix.toRadian(fovY), canvas.width / canvas.height, 0.1, 1000.0); // fovy, aspect ratio, near, far
				gl.uniformMatrix4fv(mProjLoc, gl.FALSE, projMatrix);
				heading = 0; pitch = 0;
				N = 1;
				ambientLight = 0.8;

				break;

			case 49:
			case 50:
			case 51:
			case 52:
			case 53:
			case 54:
			case 55:
			case 56:
			case 57:
				N = e.keyCode-48; break;
		}
	}

	////////////////////// Objects /////////////////////

	var materialProperties = {diffusivity: 1.5, smoothnessObj: 40, shininessObj: 0.5}; // Just a sample. Should eventually associate a materialProperty with each object.

	var images = ["textures/dirt.png", "textures/wood.png", "textures/diamond.png", "textures/space.png"];
	var objects = [];
	for(var i = 0; i < 2; i++){
		var cube = new Shape(cubeMesh.vertices, cubeMesh.indices, cubeMesh.normals, cubeMesh.textureCoords, gl, program, buffers);
		cube.attachTexture(images[i]);
		objects.push(cube);
	}

	var sphere = new Shape(sphereMesh.vertices, sphereMesh.indices, sphereMesh.normals, sphereMesh.textureCoords, gl, program, buffers);
	sphere.attachTexture(images[2]);
	objects.push(sphere);

	var sphere = new Shape(sphereMesh.vertices, sphereMesh.indices, sphereMesh.normals, sphereMesh.textureCoords, gl, program, buffers);
	sphere.attachTexture(images[3]);
	objects.push(sphere);

	////////////////////// Render Loop /////////////////
	var isAttached = 0;
	var distance = 4;
	var loop = function(){
		gl.clearColor(0, 0, 0, 1.0); // R G B A
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		theta = performance.now() / 1000 / 6 *  2 * Math.PI;

		var i = 0;
		objects.forEach(function(object){

			gl.uniform1f(ambient_loc, ambientLight);
			setLightProperties(materialProperties);
			gl.uniform4fv(shapeColorLoc, [1,1,1,1]);


			// Begin transformations.
			mat4.identity(worldMatrix);
			mat4.translate(translationMatrix, identityMatrix, [((i/distance)%2)? -i : i+distance ,0,0]);
			mat4.mul(worldMatrix, translationMatrix, worldMatrix);
			i += distance;

			// This is needed for lighting.
			mat4.mul(cameraWorldMatrix, viewMatrix, worldMatrix);
			mat4.invert(cameraWorldMatrix, cameraWorldMatrix);
			mat4.transpose(cameraWorldMatrix, cameraWorldMatrix);
			mat3.fromMat4(cameraWorldNormalMatrix, cameraWorldMatrix);
			gl.uniformMatrix3fv(mWorldNormalLoc, gl.FALSE, cameraWorldNormalMatrix);

			gl.uniformMatrix4fv(mWorldLoc, gl.FALSE, worldMatrix);

			object.draw();
		});
		requestAnimationFrame(loop);
	}
	requestAnimationFrame(loop);
}
