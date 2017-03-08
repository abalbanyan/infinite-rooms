

window.onload = function(){

	console.log("Starting.")
	var canvas = document.getElementById('webgl-canvas');
	canvas.width  = 960 * 1.1//window.innerWidth - 250;
	canvas.height = 540 * 1.1//window.innerHeight - 250;
	
	//var gl = canvas.getContext('webgl'); // For Chrome and Firefox, all that's needed.
	var gl = canvas.getContext("experimental-webgl", {preserveDrawingBuffer: true});
	var status = document.getElementById('status');

	////////////////// Health /////////////////////////
	// how much health is left
	var healthleft = 30;
	// sets health bar to whatever percentage
	var setHealth = function(percent = healthleft){
		document.getElementById("health").style.width = percent + "%";
		console.log(percent);
	}
	setHealth();

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
//	gl.enable(gl.CULL_FACE);

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
	var pickProjMatrix = new Float32Array(16); // We use a reduced frustum for picking in order to limit pick distance.

	var cameraWorldMatrix = new Float32Array(16);
	var cameraWorldNormalMatrixHelper = new Float32Array(16);
	var cameraWorldNormalMatrix = new Float32Array(9);
	var textureTransform = new Float32Array(9);

	var fovY = 50;
	var pickDistance = 55.0;
	mat4.lookAt(viewMatrix, [0, 30, -10], [0,30,0], [0,1,0]); // Eye, Point, Up. The camera is initialized using lookAt. I promise I don't use it anywhere else!
 	mat4.perspective(projMatrix, glMatrix.toRadian(fovY), canvas.width / canvas.height, 0.1, 500.0); // fovy, aspect ratio, near, far
	mat4.perspective(pickProjMatrix, glMatrix.toRadian(fovY), canvas.width / canvas.height, 0.1, pickDistance);

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
	var resetViewMatrix = new Float32Array(16);
	var navigationMatrix = new Float32Array(16);

	var rotationMatrix1 = new Float32Array(16);
	var rotationMatrix2 = new Float32Array(16);

	var testViewMatrix = new Float32Array(16);
	mat4.mul(testViewMatrix, viewMatrix, identityMatrix);
	var curViewMatrix = new Float32Array(16);
	mat4.mul(resetViewMatrix, viewMatrix, identityMatrix); // Used to reset camera.

	//////////////// Textures /////////////////////////////

	var use_texture_loc = gl.getUniformLocation(program, 'USE_TEXTURE');
	gl.uniform1i(use_texture_loc, 0);

	//////////////// Lighting /////////////////////////////

	var lightPositions = [0.0, 45.0, 0.0, 1.0];
	var lightColors = [1,0.3,0.1,1];
	var lightAttenuations = [2.0/10000.0];
	var ambience = 0.3

	var light = new Light(lightPositions, lightColors, lightAttenuations, ambience, gl, program);
	var gouraud_loc = gl.getUniformLocation(program, 'GOURAUD');
	var color_normals_loc = gl.getUniformLocation(program, 'COLOR_NORMALS');
	var color_vertices_loc = gl.getUniformLocation(program, 'COLOR_VERTICES');

	var use_ambience_loc = gl.getUniformLocation(program, 'USE_AMBIENCE');
	
	gl.uniform1i(use_ambience_loc, 1);
	gl.uniform1i(gouraud_loc, 0);
	gl.uniform1i(color_normals_loc, 0);
	gl.uniform1i(color_vertices_loc, 0);

	////////////////////// Control ///////////////////////

	var heading = 0; // Degrees
	var pitch = 0;
	var N = 1;
	var swimMode = 0; // Enabling this makes movement non-ground based - you instead move wherever you're looking.
	function rotateCamera(headingDelta, pitchDelta){
		heading += headingDelta;
		pitch += (pitch + pitchDelta > 91 || pitch + pitchDelta < -91)? 0 : pitchDelta; // Don't increase pitch beyond +/-90 degrees.
	}

	var currentDirectionX = [];
	var currentDirectionY = [];
	var currentDirectionZ = [];
	var tempViewMatrix = new Float32Array(16);
	function movePlayer(xDelta, yDelta, zDelta){
		currentDirectionX = [0,0,0]; currentDirectionY = [0,0,0]; currentDirectionZ = [0,0,0];

		// The third row of an inverted viewMatrix represents the current direction of the camera. (i.e. indexes 2, 6, and 10.)
		// Rotate the view to face in the x, y, and z directions.
		if(zDelta){
			currentDirectionZ = [curViewMatrix[2], swimMode * -curViewMatrix[6], -curViewMatrix[10]];
			vec3.normalize(currentDirectionZ, currentDirectionZ);
		}
		if(xDelta){
			mat4.rotate(rotationMatrix, identityMatrix, glMatrix.toRadian(90), [0,1,0]);
			mat4.mul(tempViewMatrix, rotationMatrix, curViewMatrix);
			currentDirectionX = [tempViewMatrix[2], swimMode * -tempViewMatrix[6], -tempViewMatrix[10]];
			vec3.normalize(currentDirectionX, currentDirectionX);
		}
		if(yDelta){
			mat4.rotate(rotationMatrix, identityMatrix, glMatrix.toRadian(90), [1,0,0]);
			mat4.mul(tempViewMatrix, rotationMatrix, curViewMatrix);
			currentDirectionY = [tempViewMatrix[2], -tempViewMatrix[6], -tempViewMatrix[10]];
			vec3.normalize(currentDirectionY, currentDirectionY);
		}

		// Multiply everything by the deltas here to account for the magnitude of the movement.
		mat4.translate(translationMatrix, identityMatrix, [
			currentDirectionX[0] * xDelta + currentDirectionY[0] * yDelta + currentDirectionZ[0] * zDelta,
			currentDirectionX[1] * xDelta + currentDirectionY[1] * yDelta + currentDirectionZ[1] * zDelta,
			currentDirectionX[2] * xDelta + currentDirectionY[2] * yDelta + currentDirectionZ[2] * zDelta
		]);
		mat4.mul(testViewMatrix, translationMatrix, testViewMatrix);
	}

	function resetCamera(){
		mat4.mul(testViewMatrix, resetViewMatrix, identityMatrix);
		gl.uniformMatrix4fv(mViewLoc, gl.FALSE, viewMatrix);
		heading = 0; pitch = 0;
	}

	document.onkeydown = function(e){
		e = e || window.event;
		switch(e.keyCode){
			case 37: // left
				rotateCamera(-N, 0);
				break;
			case 39: // right
				rotateCamera(N, 0);
				break;
			case 38: // up
				rotateCamera(0, -N);
				break;
			case 40: // down
				rotateCamera(0, N);
				break;
			case 32: // space - move in
				movePlayer(0,0,N);
				break;
			case 82: // r - reset
				resetCamera();
				break;
			case 187:
				ambience += 0.1;
				light.setAmbience(ambience);
				break;
			case 189:
				ambience -= 0.1;
				light.setAmbience(ambience);
				break;
			case 192:
				swimMode = ~swimMode;
				break;
			case 49:
			case 57:
				N = e.keyCode-48; break;
			case 80:
				interact();
				break;
		}
	}

	// This section of Control is responsible for gamepad functionality.
	var prevcrouch = 0;
	var crouch = 0;
	var footsteps_audio = new Audio('sound/footsteps.wav');
	var gamepads;
	var playerSpeed = 0.8;
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
		rotateCamera(axes[2], axes[3]);
		// Navigation
		movePlayer(-axes[0] * playerSpeed, 0, -axes[1] * playerSpeed);

		// Buttons
		if(gamepad.buttons[0].pressed){ // A
			interact();
		}

		if(gamepad.buttons[2].pressed){ // X
			crouch = 1;
		}
		else{
			crouch = 0;
		}
		if(crouch && crouch != prevcrouch){ // When crouch is pressed.
			movePlayer(0, -20, 0);
		} else if (!crouch && prevcrouch){ // When crouch is released.
			movePlayer(0, 20, 0);
		} 
		prevcrouch = crouch;


		if(gamepad.buttons[3].pressed){ // Y
			resetCamera();
		}

		playerSpeed = gamepad.buttons[1].pressed? 1.2 : 0.8; // B
	}

	rotateCamera(180, 0); // Initialize camera facing door. TODO: remove

	////////////////////// Objects /////////////////////

	var objects = [];

	function addObjectFromJSON(jsonfile, translation, scale, rotation, axis, texture, color = null, itemType = null, pickID = null, material = null)
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
				var texIterator = 0;
				if(itemType == "door") console.log(meshJSON.meshes.length);
	          	for(var i = 0; i < meshJSON.meshes.length; i++){
	          		mesh = meshJSON.meshes[i];
		            indices = [].concat.apply([], mesh.faces);
		            vertices = mesh.vertices;
		            normals = mesh.normals;
		            textureCoords = [].concat.apply([], mesh.texturecoords);
		            shape = new Shape(vertices, indices, normals, textureCoords, gl, program, buffers);
		            if(textureCoords.length && texture != null) { // First check if the mesh component has a texture.
						shape.attachTexture(texture[texIterator]);
						if(texIterator < texture.length - 1) texIterator++; 
					}
		            else if(color != null) shape.setColor(color);
		            else shape.setColor([0,1,0,1]); // Set color to red if both of the above fail.
		            if(material != null) shape.setMaterialProperties(material.diffusivity, material.smoothness, material.shininess);
		      		var object = new Object(shape, translation, scale, rotation, axis);

					if(pickID != null) 
						object.shape.makePickable(pickID);
		    
			  		object.itemType = itemType; 
		            objects.push(object);
	        	}
	        }
	    }
	    rawFile.send();
	}

	// first room
	// Pass in pickID as the last parameter to addObjectFromJSON if the object is pickable. The pickID can be any value between 0 and 255.
	// pickID should be unique, itemType does not need to be.
	addObjectFromJSON("meshes/bed.json", 			[75,0,65], [0.75,0.75,0.75],   180, [0,1,0], ["textures/bedwood.png"], [0.8,1,1,1], "bed", 1);
	addObjectFromJSON("meshes/bedside-table.json", 	[35,0,88], [1,1,1], 		   -90, [0,1,0], ["textures/bedwood.png"], [1,1,1,1]  );
	addObjectFromJSON("meshes/window1.json", 		[-100,10,0], [0.6,0.6,0.6],    -90,	[0,1,0], null,					 [90/255,67/255,80/255,1]);
	addObjectFromJSON("meshes/window1.json", 		[-100,10,-40], [0.6,0.6,0.6],  -90,	[0,1,0], null,					 [90/255,67/255,80/255,1]);
	addObjectFromJSON("meshes/desk1.json",			[-73,12,82], [2,2.5,2.5], 		90, [0,1,0], ["textures/wood2.png"],   [90/255,67/255,80/255,1]);
	addObjectFromJSON("meshes/bulb.json",			[0,59,0], [0.05,0.05,0.05], 	180,[1,0,0], null, 					 [1,0.85,0,1]);
	addObjectFromJSON("meshes/cheese.json",			[-58,21.5,75], [0.5,0.5,0.5], 	90, [0,1,0], ["textures/cheese.png"],  [90/255,67/255,80/255,1], "food", 255);
	var door_textures = ["textures/bedwood.png","textures/doorhandle1.png","textures/hardwood.png","textures/bedwood.png","textures/bedwood.png",
						"textures/bedwood.png","textures/bedwood.png","textures/bedwood.png","textures/doorhandle1.png","textures/bedwood.png"]
	var door_material = {diffusivity: 1, shininess: 0.4, smoothness: 40};
	addObjectFromJSON("meshes/door.json",			[0,-1,-100], [6,6,6], 			90,  [0,1,0], door_textures, [1,1,1,1], "closed_door_south", 220, door_material)
	addObjectFromJSON("meshes/umbreon.json",		[40,20,84], [3.2,3.2,3.2], 		-125,  [0,1,0], ["textures/umbreon.png","textures/umbreon2.png"], [1,1,1,1]);


 	var floor = new Shape(floorMesh.vertices, floorMesh.indices, floorMesh.normals, floorMesh.textureCoords, gl, program, buffers);
	floor.attachTexture( "textures/hardwood.png");
	objects.push(new Object(floor, [0,-2,0], [100,1,100], 0, [0,1,0], [4,4]));

	var ceilingHeight = 55;
	var ceiling = new Shape(floorMesh.vertices, floorMesh.indices, floorMesh.normals, floorMesh.textureCoords, gl, program, buffers);
	ceiling.attachTexture("textures/crate.png");
	objects.push(new Object(ceiling, [0,ceilingHeight + 2,0], [100,1,100], glMatrix.toRadian(180), [0,0,1], [8,8]));

	for(var i = 0; i < 4; i++){
		var wall = new Shape(wallMesh.vertices, wallMesh.indices, wallMesh.normals, wallMesh.textureCoords, gl, program, buffers);
		wall.attachTexture("textures/wallpaper1.png");
		if(i == 2){
			var doorway = new Shape(doorWayMesh.vertices, doorWayMesh.indices, doorWayMesh.normals, doorWayMesh.textureCoords, gl, program, buffers);
			doorway.attachTexture("textures/wallpaper1.png");
			objects.push(new Object(doorway, [0,ceilingHeight / 2,0], [100,ceilingHeight/2 + 1,100], glMatrix.toRadian(i*90), [0,1,0], [8,4]));
		} else 
		objects.push(new Object(wall, [0,ceilingHeight / 2,0], [100,ceilingHeight/2 + 1,100], glMatrix.toRadian(i*90), [0,1,0], [8,4]));
	}

	// TODO: Make Objects use the .draw() method, not shapes?
	// TODO: Add support for model trees.
	// TODO: Add some general functionality for modifying room parameters like roomSize, roomHeight, roomType, etc. A Room class might be needed. 
	// TODO: Load different rooms?

	/////////// Picking ////////////////////
	
	//Creates texture
	var pickBuffer = gl.createFramebuffer();
	gl.bindFramebuffer( gl.FRAMEBUFFER, pickBuffer );
	pickBuffer.width = canvas.width; // These should match your canvas
	pickBuffer.height = canvas.height;

	pickTexture = gl.createTexture();
	gl.bindTexture( gl.TEXTURE_2D, pickTexture );
	gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR );
	gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR );
	gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, pickBuffer.width,
	pickBuffer.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null );
	
	var depthBuffer = gl.createRenderbuffer();
	gl.bindRenderbuffer( gl.RENDERBUFFER, depthBuffer );
	gl.renderbufferStorage( gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, pickBuffer.width, pickBuffer.height );
	
	gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, pickTexture, 0 );
	gl.framebufferRenderbuffer( gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer );
	
	// Reset for normal rendering
	gl.bindTexture( gl.TEXTURE_2D, null );
	gl.bindRenderbuffer( gl.RENDERBUFFER, null );
	gl.bindFramebuffer( gl.FRAMEBUFFER, null );

	function handlePick(x,y){
		gl.bindFramebuffer(gl.FRAMEBUFFER, pickBuffer);
		var pixels = new Uint8Array(4);
		gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);  // render back to canvas
		
		if(pixels[1] == 0) return null;
		var ID = pixels[0] //+ pixels[1] * 256 + pixels[2] * 256 * 256
		console.log(ID);
		return ID;
	}

	////////////////////// Interaction /////////////////
	var eating_audio = new Audio('sound/eating.mp3');
	var door_audio = new Audio('sound/door_open.m4a');
	function interact(){
		var itemID = handlePick(canvas.width/2, canvas.height/2);
		if(itemID == null) return;

		for(var i = 0; i < objects.length; i++){
			if(objects[i].shape.pickID == itemID){
				var itemType = objects[i].itemType;
				if(itemType == "food"){
					objects[i].delete();
					eating_audio.play();
					healthleft = Math.min(100, healthleft + 10);
					setHealth(healthleft);
				} 
				else if(itemType == "bed"){
					console.log("zzz");
				}
				else if(itemType == "closed_door_south"){
					objects[i].translation[0] = objects[i].translation[0] + 1.0;
					objects[i].translation[2] = objects[i].translation[2] + 0.78;
					objects[i].rotation = objects[i].rotation + glMatrix.toRadian(100);
					objects[i].itemType = "open_door"
					door_audio.play();
				}
				else if(itemType == "open_door"){
					status.innerHTML = "A mysterious force seems to hold the door open."
					setTimeout(function(){
						status.innerHTML = "";
					}, 15000);
				}
			
			}
		}
	}

	////////////////////// Render Loop /////////////////
	var loop = function(){

		handleInput();
		theta = performance.now() / 1000 / 6 *  2 * Math.PI;

		// Adjust view. The order of the rotation ensures that the camera rotates heading around the world's Y axis.
		mat4.mul(viewMatrix, testViewMatrix, identityMatrix);
		mat4.rotate(rotationMatrix1, identityMatrix, glMatrix.toRadian(heading), [0,1,0]); // Adjust heading.
		mat4.rotate(rotationMatrix2, identityMatrix, glMatrix.toRadian(pitch), [1,0,0]); // Adjust pitch.
		mat4.mul(viewMatrix, rotationMatrix1, viewMatrix);
		mat4.mul(viewMatrix, rotationMatrix2, viewMatrix);
		mat4.invert(curViewMatrix, viewMatrix);
		gl.uniformMatrix4fv(mViewLoc, gl.FALSE, viewMatrix);

		// Draw normally onto the screen.
		gl.uniformMatrix4fv(mProjLoc, gl.FALSE, projMatrix);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.viewport(0,0, gl.canvas.width, gl.canvas.height);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
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
			//gl.uniform4fv(shapeColorLoc, [1,1,1,1]);
			
			// Set color if a color was specified.
			if(object.shapeColor != null) gl.uniform4fv(shapeColorLoc, object.shapeColor);
			
			if(object.isDrawn)
				object.draw();
		});

		// Draw to the frame buffer for picking.
		gl.uniformMatrix4fv(mProjLoc, gl.FALSE, pickProjMatrix);
		gl.bindFramebuffer(gl.FRAMEBUFFER, pickBuffer); // Comment this to draw the pickColors to the screen.
		gl.viewport(0,0, gl.canvas.width, gl.canvas.height);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.uniform1i(use_ambience_loc, 0); // Turn off ambience before drawing to ensure fixed colors.
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

			gl.uniformMatrix4fv(mWorldLoc, gl.FALSE, worldMatrix);
			
			if(object.isDrawn)
				object.shape.drawForPicking();

		});
		gl.uniform1i(use_ambience_loc, 1);
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
