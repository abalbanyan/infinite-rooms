

window.onload = function(){

	console.log("Starting.")
	var canvas = document.getElementById('webgl-canvas');
	canvas.width  = 960 * 1.1//window.innerWidth - 250;
	canvas.height = 540 * 1.1//window.innerHeight - 250;

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
	var textureTransformLoc = gl.getUniformLocation(program, 'textureTransform');

	// These are all initiliazed to 0.
	var worldMatrix = new Float32Array(16);
	var viewMatrix = new Float32Array(16);
	var projMatrix = new Float32Array(16);

	var cameraWorldMatrix = new Float32Array(16);
	var cameraWorldNormalMatrixHelper = new Float32Array(16);
	var cameraWorldNormalMatrix = new Float32Array(9);
	var textureTransform = new Float32Array(9);

	var fovY = 60;
	var playerPos = {x: 0, y:0, z:0}; // Use this to keep track of the player's position.
	mat4.identity(worldMatrix);
	mat4.lookAt(viewMatrix, [0, 30, -50], [0,30,0], [0,1,0]); // Eye, Point, Up. The camera is initialized using lookAt. I promise I don't use it anywhere else!
 	mat4.perspective(projMatrix, glMatrix.toRadian(fovY), canvas.width / canvas.height, 0.1, 1000.0); // fovy, aspect ratio, near, far

	gl.uniformMatrix4fv(mWorldLoc, gl.FALSE, worldMatrix);
	gl.uniformMatrix4fv(mViewLoc, gl.FALSE, viewMatrix);
	gl.uniformMatrix4fv(mProjLoc, gl.FALSE, projMatrix);

	gl.uniformMatrix4fv(mWorldLoc, gl.FALSE, cameraWorldMatrix);
	gl.uniformMatrix3fv(mWorldNormalLoc, gl.FALSE, cameraWorldNormalMatrix);

	gl.uniformMatrix3fv(textureTransformLoc, gl.FALSE, mat3.identity(textureTransform));
	gl.uniform4fv(shapeColorLoc, [1,1,1,1]);

	var identityMatrix = new Float32Array(16);		mat4.identity(identityMatrix);
	var rotationMatrix = new Float32Array(16);
	var translationMatrix = new Float32Array(16);
	var scalingMatrix = new Float32Array(16);
	var tempViewMatrix = new Float32Array(16); 		
	var resetViewMatrix = new Float32Array(16);
	var navigationMatrix = new Float32Array(16); 

	var rotationMatrix1 = new Float32Array(16);
	var rotationMatrix2 = new Float32Array(16);


	//////////////// Textures /////////////////////////////

	var use_texture_loc = gl.getUniformLocation(program, 'USE_TEXTURE');
	gl.uniform1i(use_texture_loc, 0);

	//////////////// Lighting /////////////////////////////

	var lightPositions = [0.0, 50.0, 0.0, 1.0];
	var lightColors = [1,0.3,0.1,1];
	var lightAttenuations = [2.0/10000.0];
	var ambience = 0.8

	var light = new Light(lightPositions, lightColors, lightAttenuations, ambience, gl, program);
	var gouraud_loc = gl.getUniformLocation(program, 'GOURAUD');
	var color_normals_loc = gl.getUniformLocation(program, 'COLOR_NORMALS');
	var color_vertices_loc = gl.getUniformLocation(program, 'COLOR_VERTICES');

	gl.uniform1i(gouraud_loc, 0);
	gl.uniform1i(color_normals_loc, 0);
	gl.uniform1i(color_vertices_loc, 0);


	////////////////////// Control ///////////////////////

	mat4.perspective(projMatrix, glMatrix.toRadian(fovY), canvas.width / canvas.height, 0.1, 1000.0); // fovy, aspect ratio, near, far
	gl.uniformMatrix4fv(mProjLoc, gl.FALSE, projMatrix);
	var heading = 0; // Degrees
	var pitch = 0;
	var N = 1;
	mat4.mul(resetViewMatrix, viewMatrix, identityMatrix); // Used to reset camera.

	document.onkeydown = function(e){
		e = e || window.event;
		switch(e.keyCode){
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
				resetCamera();
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
	function resetCamera(){
		mat4.mul(viewMatrix, resetViewMatrix, identityMatrix);
		gl.uniformMatrix4fv(mViewLoc, gl.FALSE, viewMatrix);

		mat4.perspective(projMatrix, glMatrix.toRadian(fovY), canvas.width / canvas.height, 0.1, 1000.0); // fovy, aspect ratio, near, far
		gl.uniformMatrix4fv(mProjLoc, gl.FALSE, projMatrix);
		N = 1;
		heading = 0;
		pitch = 0;
	}

	// This section of Control is responsible for gamepad functionality.
	var footsteps_audio = new Audio('sound/footsteps.wav');
	var gamepads;
	var swimMode = false;
	var playerSpeed = 0.5;
	function handleInput(){
		gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads : []);
		if(gamepads){
			var gamepad = gamepads[0];
		}
		if(gamepad == null)
			return;

		var axes = gamepad.axes;
		// Left joystick:  (axes[0], axes[1]) => (x,y) Movement
		// Right joystick: (axes[2], axes[3]) => (x,y) Camera

		// Round down joystick values to prevent camera drifting when player is idle.
		for(var i = 0; i < axes.length; i++){
			if(axes[i] < 0.1 && axes[i] > -0.1)
				axes[i] = 0.0;
		}

		if(axes[1] || axes[0])
			footsteps_audio.play();
		else
			footsteps_audio.pause();

		// Camera
		// TODO: Fix pitch/heading issue. Currently does not work like it does in actual FPS. Want to rotate view about world's Y axis, not about view's Y axis.
		if(swimMode){
			mat4.rotate(rotationMatrix1, identityMatrix, glMatrix.toRadian(axes[2] ), [0,1,0]); // Change heading.
			mat4.rotate(rotationMatrix2, identityMatrix, glMatrix.toRadian(axes[3] ), [1,0,0]); // Change pitch.
			mat4.mul(viewMatrix, rotationMatrix1, viewMatrix);
			mat4.mul(viewMatrix, rotationMatrix2, viewMatrix);
		} else {
			pitch += (pitch + axes[3] > 91 || pitch + axes[3] < -91)? 0 : axes[3];
			heading += axes[2]; gl

			mat4.rotate(rotationMatrix1, identityMatrix, glMatrix.toRadian(axes[2] ), [0,1,0]); // Change heading.
			mat4.rotate(rotationMatrix2, identityMatrix, glMatrix.toRadian(axes[3] ), [1,0,0]); // Change pitch.
			mat4.mul(viewMatrix, rotationMatrix1, viewMatrix);
			mat4.mul(viewMatrix, rotationMatrix2, viewMatrix);
		}

		// Navigation
		// TODO: Fix movement issue. Don't want to move exactly in direction of camera.
		if(swimMode){
			mat4.translate(translationMatrix, identityMatrix, [-axes[0] * 0.5,0,-axes[1] * 0.5]);		
			mat4.mul(viewMatrix, translationMatrix, viewMatrix);
		}
		else{
			mat4.translate(translationMatrix, identityMatrix, [-axes[0] * 0.5,0,-axes[1] * 0.5]);		
			mat4.mul(viewMatrix, translationMatrix, viewMatrix);
			playerPos.x += axes[0] * playerSpeed;
			playerPos.z += axes[1] * playerSpeed;
		}


		// Buttons
		if(gamepad.buttons[0].pressed){ // A
			mat4.translate(translationMatrix, identityMatrix, [0, -1, 0]);
			mat4.mul(viewMatrix, translationMatrix, viewMatrix);
		}
		if(gamepad.buttons[1].pressed){ // B
			mat4.translate(translationMatrix, identityMatrix, [0, 1, 0]);
			mat4.mul(viewMatrix, translationMatrix, viewMatrix);
		}
		if(gamepad.buttons[3].pressed){ // Y
			resetCamera();
		}

		gl.uniformMatrix4fv(mViewLoc, gl.FALSE, viewMatrix);
	}

	////////////////////// Objects /////////////////////

	var images = ["textures/dirt.png", "textures/crate.png", "textures/hardwood.png", "textures/space.png"];
	var objects = [];
	
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
	}
	function addObjectFromJSON(jsonfile, translation, scale, rotation, axis, texture, color = null, name = null)
	{
	    var rawFile = new XMLHttpRequest();
	    var rotation = glMatrix.toRadian(rotation);
	    rawFile.open("GET", jsonfile, true);
	    rawFile.onreadystatechange = function ()
	    {
	        if(rawFile.readyState === 4)
	        {
	            var meshJSON = JSON.parse(rawFile.responseText);
	            var mesh, indices, vertices, normals, textureCoords, shape;
	          	for(var i = 0; i < meshJSON.meshes.length; i++){
	          		mesh = meshJSON.meshes[i];
		            indices = [].concat.apply([], mesh.faces);
		            vertices = mesh.vertices;
		            normals = mesh.normals;
		            textureCoords = [].concat.apply([], mesh.texturecoords);
		            shape = new Shape(vertices, indices, normals, textureCoords, gl, program, buffers);
		            if(textureCoords.length && texture != null) shape.attachTexture(texture); // First check if the mesh component has a texture.
		            else if(color != null) shape.setColor(color);
		            else shape.setColor([0,1,0,1]); // Set color to red if both of the above fail.
		      		var object = new Object(shape, translation, scale, rotation, axis);
		      		object.name = name; // kinda hacky...
		            objects.push(object);
	        	}
	        }
	    }
	    rawFile.send();
	}

	addObjectFromJSON("meshes/bed.json", 			[75,0,65], [0.75,0.75,0.75],   180, [0,1,0], "textures/bedwood.png", [0.8,1,1,1], "bed");
	addObjectFromJSON("meshes/bedside-table.json", 	[35,0,88], [1,1,1], 		   -90, [0,1,0],"textures/bedwood.png", [1,1,1,1],   "table");
	addObjectFromJSON("meshes/window1.json", 		[-100,10,0], [0.6,0.6,0.6],    -90,	[0,1,0], null,					 [90/255,67/255,80/255,1],   "window1");
	addObjectFromJSON("meshes/window1.json", 		[-100,10,-40], [0.6,0.6,0.6],  -90,	[0,1,0],  null,					 [90/255,67/255,80/255,1],   "window2");
	addObjectFromJSON("meshes/desk1.json",			[-73,12,82], [2,2.5,2.5], 	90, [0,1,0],"textures/wood2.png", [90/255,67/255,80/255,1], "desk");
	addObjectFromJSON("meshes/bulb.json",			[0,52,0], [0.05,0.05,0.05], 		180,[1,0,0],null, [1,0.85,0,1], "bulb");
	addObjectFromJSON("meshes/cheese.json",			[-58,21.5,75], [0.5,0.5,0.5], 	90, [0,1,0],"textures/cheese.png", [90/255,67/255,80/255,1], "desk");


 	var floor = new Shape(floorMesh.vertices, floorMesh.indices, floorMesh.normals, floorMesh.textureCoords, gl, program, buffers);
	floor.attachTexture(images[2]);
	objects.push(new Object(floor, [0,0,0], [100,100,100], 0, [0,1,0], [4,4]));

	var ceiling = new Shape(floorMesh.vertices, floorMesh.indices, floorMesh.normals, floorMesh.textureCoords, gl, program, buffers);
	ceiling.attachTexture("textures/crate.png");
	objects.push(new Object(ceiling, [0,50,0], [100,100,100], 0, [0,1,0], [8,8]));

	// Generate 4 walls.
	// Note that the wallMesh vertices vary slightly from the floorMesh. The z vertices are not set equal to 0, which means the walls will scale as if they were faces of a cube.
	for(var i = 0; i < 4; i++){
		var wall = new Shape(wallMesh.vertices, wallMesh.indices, wallMesh.normals, wallMesh.textureCoords, gl, program, buffers);
		wall.attachTexture("textures/wallpaper1.png");
		objects.push(new Object(wall, [0,0,0], [100,50,100], glMatrix.toRadian(i*90), [0,1,0], [6,3]))
	}

	// TODO: Make Objects use the .draw() method, not shapes?
	// TODO: Add support for model trees.
	// TODO: Add some general functionality for modifying room parameters like roomSize, roomHeight, roomType, etc. A Room class might be needed. 
	// TODO: Load different rooms?

	////////////////////// Render Loop /////////////////
	var isAttached = 0;
	var distance = 4;
	var loop = function(){

		handleInput();

		gl.clearColor(0.9, 0.9, 1, 1.0); // R G B A
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		theta = performance.now() / 1000 / 6 *  2 * Math.PI;

		objects.forEach(function(object){
			// Begin transformations.
			mat4.identity(worldMatrix);
			mat4.scale(scalingMatrix, identityMatrix, object.scale);
			mat4.rotate(rotationMatrix, identityMatrix, object.rotation, object.axis);
			mat4.translate(translationMatrix, identityMatrix, object.translation);

			mat4.mul(worldMatrix, scalingMatrix, worldMatrix);
			mat4.mul(worldMatrix, rotationMatrix, worldMatrix);
			mat4.mul(worldMatrix, translationMatrix, worldMatrix);

			if(object.texture_scale != null){
				mat3.identity(textureTransform);
				mat3.scale(textureTransform, textureTransform, object.texture_scale);
				gl.uniformMatrix3fv(textureTransformLoc, gl.FALSE, textureTransform);
			} else {
				gl.uniformMatrix3fv(textureTransformLoc, gl.FALSE, mat3.identity(textureTransform));
			}

			// This is needed for lighting.
			mat4.mul(cameraWorldMatrix, viewMatrix, worldMatrix);
			mat4.invert(cameraWorldMatrix, cameraWorldMatrix);
			mat4.transpose(cameraWorldMatrix, cameraWorldMatrix);
			mat3.fromMat4(cameraWorldNormalMatrix, cameraWorldMatrix);
			gl.uniformMatrix3fv(mWorldNormalLoc, gl.FALSE, cameraWorldNormalMatrix);

			//mat4.mul(worldMatrix, navigationMatrix, worldMatrix);
			gl.uniformMatrix4fv(mWorldLoc, gl.FALSE, worldMatrix);
			gl.uniform4fv(shapeColorLoc, [1,1,1,1]);

			object.shape.draw();
		});
		requestAnimationFrame(loop);
	}

	window.addEventListener("gamepadconnected", function(e){
		var gp = navigator.getGamepads()[e.gamepad.index];
		console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.",
		  gp.index, gp.id,
		  gp.buttons.length, gp.axes.length);
	});
	requestAnimationFrame(loop);
}
