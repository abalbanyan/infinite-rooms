window.onload = function(){

	// Display once page is loaded.
	document.getElementById('landingPageSubtext').innerHTML = "Game loaded. Press START or ENTER to continue.";
	utils.fadein(document.getElementById('landingPageSubtext'));

	console.log("Starting.")
	var canvas = document.getElementById('webgl-canvas');
	canvas.width  = 960 * 1.1//window.innerWidth - 250;
	canvas.height = 540 * 1.1//window.innerHeight - 250;

	//var gl = canvas.getContext('webgl'); // For Chrome and Firefox, all that's needed.
	var gl = canvas.getContext("experimental-webgl", {preserveDrawingBuffer: true});

	////////////////// HUD /////////////////////////
	// how much health is left
	var healthleft = 30;
	// sets health bar to whatever percentage
	var setHealth = function(percent = healthleft){
		document.getElementById("health").style.width = percent + "%";
	}
	setHealth();

	var key_icon = document.getElementById("key_icon");
	var toggleKeyIcon = function(bool){
		key_icon.style.opacity = bool;
	}

	var status = document.getElementById('status');

    ////////////////// Compile Shaders ////////////////
		//TODO: Refactor to reduce code bloat
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
	gl.enable(gl.CULL_FACE);

	// Set up the Shadow Map Program
	var shadowMapVertexShader = gl.createShader(gl.VERTEX_SHADER);
	var shadowMapFragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(shadowMapVertexShader, shadowMapVertexShaderText);
	gl.shaderSource(shadowMapFragmentShader, shadowMapFragmentShaderText);
	gl.compileShader(shadowMapVertexShader);
	if(!gl.getShaderParameter(shadowMapVertexShader, gl.COMPILE_STATUS)){
		console.error("ERROR compiling shadow map vertex shader.", gl.getShaderInfoLog(shadowMapVertexShader));
	}
	gl.compileShader(shadowMapFragmentShader);
	if(!gl.getShaderParameter(shadowMapFragmentShader, gl.COMPILE_STATUS)){
		console.error("ERROR compiling shadow map fragment shader.", gl.getShaderInfoLog(shadowMapFragmentShader));
	}

	var shadowMapProgram = gl.createProgram();
	gl.attachShader(shadowMapProgram, shadowMapVertexShader);
	gl.attachShader(shadowMapProgram, shadowMapFragmentShader);
	gl.linkProgram(shadowMapProgram);
	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);

	// Set up the Shadow program
	var shadowVertexShader = gl.createShader(gl.VERTEX_SHADER);
	var shadowFragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(shadowVertexShader, shadowVertexShaderText);
	gl.shaderSource(shadowFragmentShader, shadowFragmentShaderText);
	gl.compileShader(shadowVertexShader);
	if(!gl.getShaderParameter(shadowVertexShader, gl.COMPILE_STATUS)){
		console.error("ERROR compiling shadow vertex shader.", gl.getShaderInfoLog(shadowVertexShader));
	}
	gl.compileShader(shadowFragmentShader);
	if(!gl.getShaderParameter(shadowFragmentShader, gl.COMPILE_STATUS)){
		console.error("ERROR compiling shadow fragment shader.", gl.getShaderInfoLog(shadowFragmentShader));
	}

	var shadowProgram = gl.createProgram();
	gl.attachShader(shadowProgram, shadowVertexShader);
	gl.attachShader(shadowProgram, shadowFragmentShader);
	gl.linkProgram(shadowProgram);
	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);

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
	var pickDistance = 56.0;
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
	mat4.translate(resetViewMatrix, resetViewMatrix, [0, 0, 200])

	//////////////// Textures /////////////////////////////

	var use_texture_loc = gl.getUniformLocation(program, 'USE_TEXTURE');
	gl.uniform1i(use_texture_loc, 0);

	//////////////// Lighting /////////////////////////////

	var lightPositions = [0.0, 45.0, 0.0, 1.0];
	var lightColors = [1,0.8,0.8,1];
	var vec3LightPositions = vec3.fromValues(0.0, 45.0, 0.0);
	var lightAttenuations = [2.0/10000.0];
	var ambience = 0.3;

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
			currentDirectionY = [swimMode * tempViewMatrix[2], -tempViewMatrix[6], swimMode* -tempViewMatrix[10]];
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

	var map = {}; // You could also use an array
	document.onkeydown = document.onkeyup = function(e){
		e = e || event; // to deal with IE
		map[e.keyCode] = e.type == 'keydown';
	}
	var testKeys = 0;

	// This section of Control is responsible for gamepad functionality.
	var gameStart = 0;
	var prevcrouch = 0;	var keyboard_prevcrouch = 0;
	var crouch = 0; var keyboard_crouch = 0;
	var footsteps_audio = new Audio('sound/footsteps.wav');
	var gamepads;
	var playerSpeed = 0.8;
	function handleInput(){

		//handle keyboard input
		if(map[13] && !gameStart) {
			utils.fade(document.getElementById("landingPageBackground"));
			utils.fade(document.getElementById("landingPageText"));
			utils.fade(document.getElementById("landingPageSubtext"));
			gameStart = 1;
		}
		if(map[87]) movePlayer(0,0, playerSpeed * 1);   // W
		if(map[83]) movePlayer(0,0, -playerSpeed * 1);  // S
 		if(map[68]) movePlayer(-playerSpeed * 1, 0, 0);  // D
		if(map[65]) movePlayer(playerSpeed * 1, 0, 0); // A
		if(map[65] || map[87] || map[83] || map[68]) footsteps_audio.play(); else footsteps_audio.pause();

		if(map[37]) rotateCamera(-N, 0);
		if(map[39]) rotateCamera(N, 0);
		if(map[38]) rotateCamera(0, -N);
		if(map[40]) rotateCamera(0, N);
		if(map[32]) interact();
		if(map[82]) resetCamera();
		if(map[187]){
			ambience += 0.1;
			light.setAmbience(ambience);
		}
		if(map[189]){
			ambience -= 0.1;
			light.setAmbience(ambience);
		}
		if(map[192]) swimMode = ~swimMode;
		if(map[49]) N = 1	;
		if(map[57]) N = 9;
		if(map[80]) interact();
		if(map[75]) testKeys = ~testKeys;
		if(map[16]) keyboard_crouch = 1; else keyboard_crouch = 0;

		if(keyboard_crouch && keyboard_crouch != keyboard_prevcrouch){ // When crouch is pressed.
			movePlayer(0, -20, 0);
		} else if (!keyboard_crouch && keyboard_prevcrouch){ // When crouch is released.
			movePlayer(0, 20, 0);
		}
		keyboard_prevcrouch = keyboard_crouch;

		// Handle controller input.
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

		if(gamepad.buttons[9].pressed && !gameStart){
			utils.fade(document.getElementById("landingPageBackground"));
			utils.fade(document.getElementById("landingPageText"));
			utils.fade(document.getElementById("landingPageSubtext"));
			gameStart = 1;
		}

		// Buttons
		if(gamepad.buttons[0].pressed) interact();
		if(gamepad.buttons[2].pressed) crouch = 1;
		else crouch = 0;
		if(gamepad.buttons[3].pressed) resetCamera();
		playerSpeed = gamepad.buttons[1].pressed? 1.5 : 0.8; // B

		if(crouch && crouch != prevcrouch){ // When crouch is pressed.
			movePlayer(0, -20, 0);
		} else if (!crouch && prevcrouch){ // When crouch is released.
			movePlayer(0, 20, 0);
		}
		prevcrouch = crouch;


	}

	//rotateCamera(180, 0); // Initialize camera facing door. TODO: remove

	////////////////////// Objects /////////////////////

	var Rooms = [];

	var templates = [loadMeme, loadBathroom, loadKitchen, loadLivingRoom, loadPool];

	var ID = -1;
	function getID(){
		ID++;
		if(ID > 255)
			ID = 0;
		return ID;
	}


	// rooms return the range of indices in objects that contain their components. These will be accessed at a later time to
	// translate the entire room
	// @doorways: size 4 array of booleans indicating which walls have doorways. [north, east, south, west]
	// @doors: size 4 array of booleans indicating which walls have doors. [north, east, south, west] Should be the same as doorways, except with the direction the player enters the room as 0.
	// For your convenience: ["meshes/.json",		[0,0,0], [1,1,1], 0,  [0,1,0], ["textures/"], [1,1,1,1], null, null, null]

	function loadTomb(coords, doors, doorways)
	{
		var jsonObjects = [
		];

		for(var i = -4; i < 0; i++){
			jsonObjects.push(["meshes/tombstone1.json",	   [i * 20 - 5,-2,95], [30,35,30], 0,  [0,1,0], ["textures/tombstone1.png"], [1,1,1,1], null, null, null]);
			jsonObjects.push(["meshes/tombstone1.json",	   [-i * 20 + 5,-2,95], [30,35,30], 0,  [0,1,0], ["textures/tombstone1.png"], [1,1,1,1], null, null, null]);
			jsonObjects.push(["meshes/tombstone1.json",	   [i * 20 - 5,-2,-95], [30,35,30], 0,  [0,1,0], ["textures/tombstone1.png"], [1,1,1,1], null, null, null]);
			jsonObjects.push(["meshes/tombstone1.json",	   [-i * 20 + 5,-2,-95], [30,35,30], 0,  [0,1,0], ["textures/tombstone1.png"], [1,1,1,1], null, null, null]);
			jsonObjects.push(["meshes/tombstone1.json",	   [95,-2,i * 20 - 5], [30,35,30], 90,  [0,1,0], ["textures/tombstone1.png"], [1,1,1,1], null, null, null]);
			jsonObjects.push(["meshes/tombstone1.json",	   [95,-2,-i * 20 + 5], [30,35,30], 90,  [0,1,0], ["textures/tombstone1.png"], [1,1,1,1], null, null, null]);
			jsonObjects.push(["meshes/tombstone1.json",	   [-95,-2,i * 20 - 5], [30,35,30], 90,  [0,1,0], ["textures/tombstone1.png"], [1,1,1,1], null, null, null]);
			jsonObjects.push(["meshes/tombstone1.json",	   [-95,-2,-i * 20 + 5], [30,35,30], 90,  [0,1,0], ["textures/tombstone1.png"], [1,1,1,1], null, null, null]);
		}

		jsonObjects.push(["meshes/grave.json",	[-8,-13,0], [10,12,10], -90,  [1,0,0], ["textures/tv.png"], [1,1,1,1], null, null, null]);

		var otherObjects = loadBox(["textures/dirtfloor.png", "textures/dirtfloor.png", "textures/tv.png"], doorways);
		otherObjects[3].shape.useWater(); otherObjects[4].shape.useWater(); otherObjects[5].shape.useWater(); otherObjects[2].shape.useWater();
		otherObjects[0].shape.useWater();
		otherObjects[1].shape.useWater();

		jsonObjects.push.apply(jsonObjects, loadDoors(doors));

		Rooms.push(new Room(gl, program, shadowMapProgram, shadowProgram, buffers, jsonObjects, otherObjects, coords));
	}

	function loadBedroom(coords, doors, doorways)
	{
		var jsonObjects = [["meshes/bed.json", 			[75,-4,65], [0.75,0.75,0.75],   180, [0,1,0], ["textures/bedwood.png"], [0.8,1,1,1], null, null, null, "normalmaps/wood.png"],
					["meshes/bedside-table.json", 	[36,0,88], [1,1,1], 		   -90, [0,1,0], ["textures/bedwood.png"], [1,1,1,1]],
					["meshes/commode.json",		[65,-3,-89], [1.6,1.4,1.0], 0,  [0,1,0], ["textures/bedwood.png", "textures/bedwood.png","textures/bedwood.png", "textures/bedwood.png", "textures/stone.png" ], [1,1,1,1], null, null, null, null, false],
					["meshes/carpet.json",		[0,-2.2,0], [1,1,1], 0,  [0,1,0], ["textures/blue_carpet.png"], [1,1,1,1], null, null, null, "normalmaps/carpet.png", false],
					["meshes/bodypillow.json", 	[80,17,78], [22,22,24], 		   0, [0,1,0], ["textures/bodypillow.png"], [1,1,1,1]],
					["meshes/window1.json", 		[-99,10,-10], [0.6,0.6,0.6],    -90,	[0,1,0], ["textures/wood2.png"],					 [90/255,67/255,80/255,1], null, null, null, null, false],
					["meshes/window1.json", 		[-99,10,-40], [0.6,0.6,0.6],  -90,	[0,1,0], ["textures/wood2.png"],					 [90/255,67/255,80/255,1], null, null, null, null, false],
					["meshes/desk1.json",			[-73,12,82], [2,2.5,2.5], 		90, [0,1,0], ["textures/wood2.png"],   [90/255,67/255,80/255,1], null, null,null, null, false],
					["meshes/bulb.json",			[0,58,0], [0.05,0.05,0.05], 	180,[1,0,0], null, 					 [1,0.85,0,1]],
					["meshes/cheese.json",			[-58,21.5,75], [0.5,0.5,0.5], 	90, [0,1,0], ["textures/cheese.png"],  [90/255,67/255,80/255,1], "food", getID()],
					["meshes/umbreon.json",		[40,20,84], [3.2,3.2,3.2], 		-125,  [0,1,0], ["textures/umbreon.png","textures/umbreon2.png"], [1,1,1,1]],
					["meshes/key.json",		[54,0,50], [15,15,15], 		90,  [1,0,0], ["textures/key.png"], [1,1,1,1], "key", getID(), {diffusivity: 3, shininess: 10, smoothness: 40}],
					["meshes/painting.json",		[-85,25,98.5], [2,2,2], -90,  [0,1,0], ["textures/wood2.png","textures/wood2.png","textures/wood2.png", "textures/waifu.png"], [1,1,1,1], null, null, null, null, false]];
		var otherObjects = loadBox(["textures/hardwood.png", "textures/crate.png", "textures/wallpaper1.png"], doorways);

		jsonObjects.push.apply(jsonObjects, loadDoors(doors));

		Rooms.push(new Room(gl, program, shadowMapProgram, shadowProgram, buffers, jsonObjects, otherObjects, coords));
	}
	function loadPool(coords, doors, doorways)
	{
		var jsonObjects = [["meshes/pool.json", 	[0,-17,0], [0.007,0.01,0.014],   0, [0,1,0], ["textures/bedwood.png"], [0.8,1,1,1]],
				["meshes/diving.json",		[28,0,0], [0.5,0.8,0.5], 90,  [0,1,0], ["textures/bedwood.png"], [0.15,0.1,0.05,1], null, null, null],
				["meshes/window2.json", 		[-99,30,-30], [5,5,5],   90,	[0,0,1], ["textures/crate.png" ],	 [90/255,67/255,80/255,1],  null, null, null, null, false],
				["meshes/window2.json", 		[-99,30, 40], [5,5,5],   90,	[0,0,1], ["textures/crate.png"],	 [90/255,67/255,80/255,1],  null, null, null, null, false],
				["meshes/window2.json", 		[99,30,-30], [5,5,5],   -90,	[0,0,1], ["textures/crate.png"],	 [90/255,67/255,80/255,1],  null, null, null, null, false],
				["meshes/window2.json", 		[99,30, 40], [5,5,5],   -90,	[0,0,1], ["textures/crate.png" ],	 [90/255,67/255,80/255,1],  null, null, null, null, false],
				["meshes/painting.json",		[-75,22,98], [3,3,3 * 1.777], -90,  [0,1,0], ["textures/wood2.png","textures/wood2.png","textures/wood2.png", "textures/free.png"], [1,1,1,1], null, null, null, null, false],
				["meshes/key.json",		[48,13.5,0], [15,15,15], 		90,  [1,0,0], ["textures/key.png"], [1,1,1,1], "key", getID(), {diffusivity: 3, shininess: 10, smoothness: 40}]

		];
		var otherObjects = loadBox(["textures/bathroomfloor.png", "textures/tile.png", "textures/tile.png"], doorways);

		var water = new Shape(floorMesh.vertices, floorMesh.indices, floorMesh.normals, floorMesh.textureCoords, gl, program, shadowMapProgram, shadowProgram, buffers);
		water.attachTexture("textures/water.png");
		water.useWater();
		//water.attachNormalMap("normalmaps/water.png");
		otherObjects.push(new Object(water, [-5,3,0], [43,1,48], 0, [0,1,0], [4,4], null));

		jsonObjects.push.apply(jsonObjects, loadDoors(doors));

		Rooms.push(new Room(gl, program, shadowMapProgram, shadowProgram, buffers, jsonObjects, otherObjects, coords));
	}

	

	function loadLivingRoom(coords, doors, doorways){
		var jsonObjects = [
					["meshes/living_table.json",	[0,-3,0], [12,8,8], 0,  [0,0,1], ["textures/table1.png"], [1,1,1,1], null, null, null],
					["meshes/carpet.json",		[0,-2.2,0], [1,1,1], 0,  [0,1,0], ["textures/carpet.png"], [1,1,1,1], null, null, null, "normalmaps/carpet.png", true],
					["meshes/cheez.json",	[-10,12,-15], [1,1,1], 180,  [0,1,0], ["textures/cheez.png"], [1,1,1,1], "food_2", getID(), null],
					["meshes/tv.json",	[69,11.5,90], [4,4,4], 90,  [0,1,0], ["textures/static.png", "textures/tv.png"], [1,1,1,1], null, null, null, null, false],
					["meshes/tv_stand.json",	[69,-1,89.5], [0.4,0.4,0.35], 90,  [0,1,0], ["textures/wood2.png"], [1,1,1,1], null, null, null],
					["meshes/sofa.json",	[-90,-1,60], [0.8,0.6,0.6], 90,  [0,1,0], ["textures/sofa.png"], [1,1,1,1], null, null, null, null, false],
					["meshes/bookshelf.json",	[-99,-1,-49], [1.0,0.65,0.8], 90,  [0,1,0], ["textures/crate.png"], [1,1,1,1], null, null, null, null, false],
					["meshes/cookie.json",			[20,4,-13], [2.2,2.2,2.2], 	90, [0,1,0], ["textures/cookie.png"],  [90/255,67/255,80/255,1], "food", getID()]
				];

		var key_book = Math.floor(Math.random() * (9 - 3 + 1)) + 3;
		for(var i = 3; i < 10; i++){
			for(var j = 0; j < 2; j++){
				if(i == key_book && j == 1){
					jsonObjects.push(["meshes/book1.json",		[-98,20 + (8.7 * j),-54 - (i * 1.54) - (j * 6)], [0.05,0.04,0.05], -90,  [0,1,0], ["textures/book.png"], [0.15,0.1,0.2,1], "key", getID(), null, null, false]);
					continue;
				}
				jsonObjects.push(["meshes/book1.json",		[-98,20 + (8.7 * j),-54 - (i * 1.54) - (j * 6)], [0.05,0.04,0.05], -90,  [0,1,0], ["textures/book.png"], [0.15,0.1,0.05,1], null, null, null, null, false]);
			}

		}
		for(var i = 19; i < 23; i++){
			for(var j = -1; j < 1; j++){
				jsonObjects.push(["meshes/book1.json",		[-98,20 + (8.7 * j),-54 - (i * 1.54) - (j * 6)], [0.05,0.04,0.05], -90,  [0,1,0], ["textures/book.png"], [0.15,0.1,0.05,1], null, null, null, null, false]);
			}

		}
		jsonObjects.push(["meshes/board.json",	[0,55,0], [0.5,0.5,0.7], 0,  [0,0,1], null, [1,1,1,1], null, null, null])

		var otherObjects = loadBox(["textures/brickwall.png","textures/hardwood.png","textures/hardwood.png"], doorways, ["normalmaps/brickwall.png"]);

		jsonObjects.push.apply(jsonObjects, loadDoors(doors));

		Rooms.push(new Room(gl, program,  shadowMapProgram, shadowProgram, buffers, jsonObjects, otherObjects, coords));
	}

	function loadKitchen(coords, doors, doorways)
	{
		var jsonObjects = [
					["meshes/table.json",			[-58,0,-35], [15,15,15], 	90, [0,1,0], ["textures/wood1.png"],  [90/255,67/255,80/255,1]],
					["meshes/kitchen.json",			[0,0,35], [15,15,15], 	90, [0,1,0], ["textures/kitchen.jpg"],  [90/255,67/255,80/255,1]],
					["meshes/bulb.json",			[0,58,0], [0.05,0.05,0.05], 	180,[1,0,0], null, 					 [1,0.85,0,1]],
					["meshes/apple.json",			[-48,18,0], [1,1,1], 	90, [0,1,0], ["textures/apple.png"],  [90/255,67/255,80/255,1], "food", getID()],
					["meshes/cookie.json",			[25,24,-10], [1.3,1.3,1.3], 	90, [0,1,0], ["textures/cookie.png"],  [90/255,67/255,80/255,1], "food", getID()],

					["meshes/banana.json",			[-33,6,16], [.5,.5,.5], 	90, [1,0,0], ["textures/banana.png"],  [90/255,67/255,80/255,1], "food", getID()],

					["meshes/cheese.json",			[-58,14,-35], [0.5,0.5,0.5], 	90, [0,1,0], ["textures/bread.jpg"],  [90/255,67/255,80/255,1], "food", getID()],
					["meshes/key.json",		[-20,7.7,16], [14,14,14], 		90,  [1,0,0], ["textures/key.png"], [1,1,1,1], "key_kitchen", getID(), {diffusivity: 3, shininess: 10, smoothness: 40}],
					["meshes/painting.json",		[-85,25,98.5], [2,2,2], -90,  [0,1,0], ["textures/wood2.png","textures/wood2.png","textures/wood2.png", "textures/egg.jpg"], [1,1,1,1], null, null, null, null, false]];
		var otherObjects = loadBox(["textures/tile.png", "textures/crate.png", "textures/kitchenwall.jpg"], doorways);

		jsonObjects.push.apply(jsonObjects, loadDoors(doors));

		Rooms.push(new Room(gl, program,  shadowMapProgram, shadowProgram, buffers, jsonObjects, otherObjects, coords));
	}

	function loadMeme(coords, doors, doorways)
	{
		var jsonObjects = [
					["meshes/cheese.json",			[0,1,0], [0.5,0.5,0.5], 	90, [0,1,0], ["textures/bread.jpg"],  [90/255,67/255,80/255,1], "food", getID()],
					["meshes/key.json",		[97,35.5,32.5], [11,11,11], 		45,  [1,0,0], ["textures/key.png"], [1,1,1,1], "key_egg", getID(), {diffusivity: 3, shininess: 10, smoothness: 40}],
					["meshes/painting.json",		[-45,25,98.5], [2,2,2], -90,  [0,1,0], ["textures/wood2.png","textures/wood2.png","textures/wood2.png", "textures/egg.jpg"], [1,1,1,1], null, null, null, null, false],
					["meshes/painting.json",		[45,25,98.5], [2,2,2], -90,  [0,1,0], ["textures/wood2.png","textures/wood2.png","textures/wood2.png", "textures/egg.jpg"], [1,1,1,1], null, null, null, null, false],
					["meshes/painting.json",		[85,25,98.5], [2,2,2], -90,  [0,1,0], ["textures/wood2.png","textures/wood2.png","textures/wood2.png", "textures/egg.jpg"], [1,1,1,1], null, null, null, null, false],
					["meshes/painting.json",		[-98,25,75.5], [2,2,2], -180,  [0,1,0], ["textures/wood2.png","textures/wood2.png","textures/wood2.png", "textures/egg.jpg"], [1,1,1,1], null, null, null, null, false],
					["meshes/painting.json",		[-98,25,35.5], [2,2,2], -180,  [0,1,0], ["textures/wood2.png","textures/wood2.png","textures/wood2.png", "textures/egg.jpg"], [1,1,1,1], null, null, null, null, false],
					["meshes/painting.json",		[-98,25,-35.5], [2,2,2], -180,  [0,1,0], ["textures/wood2.png","textures/wood2.png","textures/wood2.png", "textures/egg.jpg"], [1,1,1,1], null, null, null, null, false],
					["meshes/painting.json",		[-98,25,-75.5], [2,2,2], -180,  [0,1,0], ["textures/wood2.png","textures/wood2.png","textures/wood2.png", "textures/egg.jpg"], [1,1,1,1], null, null, null, null, false],

					["meshes/painting.json",		[98,25,75.5], [2,2,2], 0,  [0,1,0], ["textures/wood2.png","textures/wood2.png","textures/wood2.png", "textures/egg.jpg"], [1,1,1,1], null, null, null, null, false],
					["meshes/painting.json",		[98,25,35.5], [2,2,2], 0,  [0,1,0], ["textures/wood2.png","textures/wood2.png","textures/wood2.png", "textures/egg.jpg"], [1,1,1,1], null, null, null, null, false],
					["meshes/painting.json",		[98,25,-35.5], [2,2,2], 0,  [0,1,0], ["textures/wood2.png","textures/wood2.png","textures/wood2.png", "textures/egg.jpg"], [1,1,1,1], null, null, null, null, false],
					["meshes/painting.json",		[98,25,-75.5], [2,2,2], 0,  [0,1,0], ["textures/wood2.png","textures/wood2.png","textures/wood2.png", "textures/egg.jpg"], [1,1,1,1], null, null, null, null, false],

					["meshes/painting.json",		[-85,25,-98.5], [2,2,2], -270,  [0,1,0], ["textures/wood2.png","textures/wood2.png","textures/wood2.png", "textures/egg.jpg"], [1,1,1,1], null, null, null, null, false],
					["meshes/painting.json",		[-45,25,-98.5], [2,2,2], -270,  [0,1,0], ["textures/wood2.png","textures/wood2.png","textures/wood2.png", "textures/egg.jpg"], [1,1,1,1], null, null, null, null, false],
					["meshes/painting.json",		[45,25,-98.5], [2,2,2], -270,  [0,1,0], ["textures/wood2.png","textures/wood2.png","textures/wood2.png", "textures/egg.jpg"], [1,1,1,1], null, null, null, null, false],
					["meshes/painting.json",		[85,25,-98.5], [2,2,2], -270,  [0,1,0], ["textures/wood2.png","textures/wood2.png","textures/wood2.png", "textures/egg.jpg"], [1,1,1,1], null, null, null, null, false],

					["meshes/painting.json",		[-85,25,98.5], [2,2,2], -90,  [0,1,0], ["textures/wood2.png","textures/wood2.png","textures/wood2.png", "textures/egg.jpg"], [1,1,1,1], null, null, null, null, false]];
		var otherObjects = loadBox(["textures/space.png", "textures/space.png", "textures/space.png"], doorways, [], true);

		jsonObjects.push.apply(jsonObjects, loadDoors(doors));

		Rooms.push(new Room(gl, program, shadowMapProgram, shadowProgram, buffers, jsonObjects, otherObjects, coords));

		templates.shift();
	}

	function loadBathroom(coords, doors, doorways)
	{
		var jsonObjects = []
		var boxObjects = loadBox(["textures/bathroomfloor.png","textures/bathroomfloor.png","textures/bathroomfloor.png"], doorways)
		otherObjects = boxObjects;
		for (var i = -3; i < 4; i++){
			if(!i || i == 1 || i == -1)  continue;
			var offset = i*20;
			jsonObjects.push(["meshes/sink.json", [offset, 20, 92], [38, 38, 38], 0, [1, 0, 0], ["textures/steel.png"], [1, 1, 1, 1]]);
		};
		jsonObjects.push(["meshes/toilet.json", [90, 0, -30], [0.8, 0.8, 0.73], -90, [0, 1, 0], ["textures/porcelain.png"], [1, 1, 1, 1], null, null, null, null, false]);
		jsonObjects.push(["meshes/tp.json", [93, 0, -20], [0.7, 0.7, 0.73], -90, [0, 1, 0], ["textures/wood2.png"], [0.5, 0.5, 0.5, 1]]);
		jsonObjects.push(["meshes/painting.json",		[58,23,99], [1,1.5,1], -90,  [0,1,0], ["textures/wood2.png","textures/wood2.png","textures/wood2.png", "textures/obama.png"], [1,1,1,1], null, null, null, null, false]);
		jsonObjects.push(["meshes/key.json",		[60,16.6,93.1], [11,11,11], 		65,  [1,0,0], ["textures/key.png"], [1,1,1,1], "key_obama", getID(), {diffusivity: 3, shininess: 10, smoothness: 40}])

		jsonObjects.push(["meshes/board.json",	[-60,30,-38 - 38], [3.03,1.83,1.8], 90,  [0,0,1], ["textures/wood2.png"], [1,1,1,1], "shower_door_2", getID()]);

		jsonObjects.push(["meshes/cubicle.json",	[-80,-4,-38], [1.43,1.43,1.5], 90,  [0,1,0], ["textures/wood2.png"], [1,1,1,1], null, null, null, null, false]);
		jsonObjects.push(["meshes/cubicle.json",	[-80,-4,-38 + -38], [1.43,1.43,1.5], 90,  [0,1,0], ["textures/wood2.png"], [1,1,1,1], null, null, null, null, false]);

		jsonObjects.push(["meshes/grate.json",		[0,-3,0], [0.07,0.07,0.14], 0,  [0,1,0], ["textures/stone.png"], [0,1,1,1], null, null, null, null, false]);

		jsonObjects.push(["meshes/board.json",	[0,55,0], [0.5,0.5,0.7], 0,  [0,0,1], null, [1,1,1,1], null, null, null])

		jsonObjects.push.apply(jsonObjects, loadDoors(doors));

		Rooms.push(new Room(gl, program, shadowMapProgram, shadowProgram, buffers, jsonObjects, otherObjects, coords));
	}

	var currentOrigin = {x: 0, y: 0};
	var maxRooms = 2; // The maximum number of rooms that can be loaded at once.
	//loadLivingRoom([0, 0], [0,0,1,0], [0,0,1,0]);
	loadBedroom([0, 0], [0,0,1,0], [0,0,1,0]);

	// @entryPoint is the direction of entry from the perspective of the previous room.

	var prevRoom = -1;
	function loadNewRoom(entryPoint){
		while(true){
			var rand1 = Math.random() >= 0.5;		var rand2 = Math.random() >= 0.5;
			var rand3 = Math.random() >= 0.5;		var rand4 = Math.random() >= 0.5;
			if(rand1 + rand2 + rand3 + rand4 > 2) break;
		}
		var doorways = [0, 0, rand3, rand4]; // north and east won't have doors.
		var doors = [0, 0, rand3, rand4];

		var newRoom=  Math.floor(Math.random() * (templates.length));
		while(prevRoom == newRoom){
			newRoom =  Math.floor(Math.random() * (templates.length));
		}
		prevRoom = newRoom; // no room should be selected twice in a row.

		if(entryPoint == "north"){
			light.translateLight([0,0,200]);
			currentOrigin.y++;
			doorways[2] = 1;
			doors[2] = 0;
			templates[newRoom]([currentOrigin.x, currentOrigin.y], doors, doorways);
		}
		if(entryPoint == "east"){
			light.translateLight([-200,0,0]);
			currentOrigin.x--
			doorways[3] = 1;
			doors[3] = 0;
			templates[newRoom]([currentOrigin.x, currentOrigin.y], doors, doorways);
		}
		if(entryPoint == "south"){
			light.translateLight([0,0,-200]);
			currentOrigin.y--;
			doorways[0] = 1;
			doors[0] = 0;
			templates[newRoom]([currentOrigin.x, currentOrigin.y], doors, doorways);
		}else if(entryPoint == "west"){
			light.translateLight([200,0,0]);
			currentOrigin.x++;
			doorways[1] = 1;
			doors[1] = 0;
			templates[newRoom]([currentOrigin.x, currentOrigin.y], doors, doorways);
		}

		// Update lighting for shadow mapping
		vec3LightPositions = vec3.fromValues(light.lightPosition[0], light.lightPosition[1], light.lightPosition[2]);
		shadowMapCameras = [
		// Positive X
		new Camera(
			vec3LightPositions,
			vec3.add(vec3.create(), vec3LightPositions, vec3.fromValues(1, 0, 0)),
			vec3.fromValues(0, -1, 0)
		),
		// Negative X
		new Camera(
			vec3LightPositions,
			vec3.add(vec3.create(), vec3LightPositions, vec3.fromValues(-1, 0, 0)),
			vec3.fromValues(0, -1, 0)
		),
		// Positive Y
		new Camera(
			vec3LightPositions,
			vec3.add(vec3.create(), vec3LightPositions, vec3.fromValues(0, 1, 0)),
			vec3.fromValues(0, 0, 1)
		),
		// Negative Y
		new Camera(
			vec3LightPositions,
			vec3.add(vec3.create(), vec3LightPositions, vec3.fromValues(0, -1, 0)),
			vec3.fromValues(0, 0, -1)
		),
		// Positive Z
		new Camera(
			vec3LightPositions,
			vec3.add(vec3.create(), vec3LightPositions, vec3.fromValues(0, 0, 1)),
			vec3.fromValues(0, -1, 0)
		),
		// Negative Z
		new Camera(
			vec3LightPositions,
			vec3.add(vec3.create(), vec3LightPositions, vec3.fromValues(0, 0, -1)),
			vec3.fromValues(0, -1, 0)
		)
		];
		if(Rooms.length > maxRooms){
			Rooms.shift();
		}
	}

	function loadDoors(doors, ceilingHeight = 55){
		var door_textures = ["textures/bedwood.png","textures/doorhandle1.png","textures/hardwood.png","textures/bedwood.png","textures/bedwood.png",
							"textures/bedwood.png","textures/bedwood.png","textures/bedwood.png","textures/doorhandle1.png","textures/bedwood.png"]
		var door_material = {diffusivity: 1, shininess: 0.4, smoothness: 40};
		var doorArray = [];
		var translation; var dir; var adj = ceilingHeight / 55;
		for(var i = 0; i < 4; i++){
			if(!doors[i]) continue;
			if(i == 0){
				translation = [0,-1, 100];
				dir = "north";
			} else if(i == 1){
				translation = [-100,-1, 0];
				dir = "east";
			} else if(i == 2){
				translation = [0,-1, -100];
				dir = "south";
			} else if(i == 3){
				translation = [100,-1, 0];
				dir = "west";
			}
			doorArray.push(["meshes/door.json",	translation, [6 * adj , 6 * adj, 6 * adj], (i) * 90 - 90,  [0,1,0], door_textures, [1,1,1,1], "closed_door_" + dir, getID(), door_material, null, false]);
		}
		return doorArray;
	}

	// load walls, ceiling, floor. Textures should be paths to textures in the following order: ceiling, floor, north wall, east wall, south wall, west wall.
	// @doorways: size 4 array of booleans indicating which walls have doorways. [north, east, south, west]
	function loadBox(textures, doorways, normalmaps = [], distorted = false){
		var roomBox = [];

		var floor = new Shape(floorMesh.vertices, floorMesh.indices, floorMesh.normals, floorMesh.textureCoords, gl, program, shadowMapProgram, shadowProgram, buffers);
		floor.attachTexture(textures[0]);
		if(distorted) floor.distortTextures();
		if(normalmaps[0] != null) floor.attachNormalMap(normalmaps[0]);
		roomBox.push(new Object(floor, [0,-2,0], [100,1,100], 0, [0,1,0], [4,4], null));

		var ceilingHeight = 55.0;
		var ceiling = new Shape(floorMesh.vertices, floorMesh.indices, floorMesh.normals, floorMesh.textureCoords, gl, program, shadowMapProgram, shadowProgram, buffers);
		ceiling.attachTexture(textures[1]);
		if(normalmaps[1] != null) ceiling.attachNormalMap(normalmaps[1])
		if(distorted) ceiling.distortTextures();
		roomBox.push(new Object(ceiling, [0,ceilingHeight +  2,0], [100,1,100], glMatrix.toRadian(180), [0,0,1], [8,8], null));

		for(var j = 0; j < 4; j++){
			var wall;
			if(doorways[j])
				wall = new Shape(doorWayMesh.vertices, doorWayMesh.indices, doorWayMesh.normals, doorWayMesh.textureCoords, gl, program, shadowMapProgram, shadowProgram, buffers);
			else
			 	wall = new Shape(wallMesh.vertices, wallMesh.indices, wallMesh.normals, wallMesh.textureCoords, gl, program, shadowMapProgram, shadowProgram, buffers);
			if(textures[2+j]) {
				wall.attachTexture(textures[2+j]);
				if(normalmaps[2+j] != null) wall.attachNormalMap(normalmaps[2+j]);
			}
			else {
				wall.attachTexture(textures[2]);
				if(normalmaps[2] != null) wall.attachNormalMap(normalmaps[2]);
			}
			wall.setMaterialProperties(2, 2, 30);
			if(distorted) wall.distortTextures();
			roomBox.push(new Object(wall, [0,ceilingHeight / 2,0], [100,ceilingHeight/2 + 1,100], glMatrix.toRadian(j*-90), [0,1,0], [8,4]));
		}
		return roomBox;
  }

	////////////////////// Shadows ///////////////////////

	// Create Framebuffers and Textures
	var shadowMapCube = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_CUBE_MAP, shadowMapCube);
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

	var shadowMapFrameBuffer = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, shadowMapFrameBuffer);
	var shadowMapRenderBuffer = gl.createRenderbuffer();
	gl.bindRenderbuffer(gl.RENDERBUFFER, shadowMapRenderBuffer);

	gl.renderbufferStorage(
		gl.RENDERBUFFER, gl.DEPTH_COMPONENT16,
		textureSize, textureSize
	);

	gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
	gl.bindRenderbuffer(gl.RENDERBUFFER, null);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

	// Shadow Map Cameras
	//TODO: get rid of Positive Y (on the ceiling)
	shadowMapCameras = [
	// Positive X
	new Camera(
		vec3LightPositions,
		vec3.add(vec3.create(), vec3LightPositions, vec3.fromValues(1, 0, 0)),
		vec3.fromValues(0, -1, 0)
	),
	// Negative X
	new Camera(
		vec3LightPositions,
		vec3.add(vec3.create(), vec3LightPositions, vec3.fromValues(-1, 0, 0)),
		vec3.fromValues(0, -1, 0)
	),
	// Positive Y
	new Camera(
		vec3LightPositions,
		vec3.add(vec3.create(), vec3LightPositions, vec3.fromValues(0, 1, 0)),
		vec3.fromValues(0, 0, 1)
	),
	// Negative Y
	new Camera(
		vec3LightPositions,
		vec3.add(vec3.create(), vec3LightPositions, vec3.fromValues(0, -1, 0)),
		vec3.fromValues(0, 0, -1)
	),
	// Positive Z
	new Camera(
		vec3LightPositions,
		vec3.add(vec3.create(), vec3LightPositions, vec3.fromValues(0, 0, 1)),
		vec3.fromValues(0, -1, 0)
	),
	// Negative Z
	new Camera(
		vec3LightPositions,
		vec3.add(vec3.create(), vec3LightPositions, vec3.fromValues(0, 0, -1)),
		vec3.fromValues(0, -1, 0)
	)
	];
	var shadowMapViewMatrices = [
		mat4.create(),
		mat4.create(),
		mat4.create(),
		mat4.create(),
		mat4.create(),
		mat4.create()
	];
	var shadowMapProj = mat4.create();
	var shadowClipNearFar = vec2.fromValues(10, 200);
	mat4.perspective(
		shadowMapProj,
		glMatrix.toRadian(90),
		1.0,
		shadowClipNearFar[0],
		shadowClipNearFar[1]
	);

	var shadowMapUniforms = {
			pointLightPositionLoc: gl.getUniformLocation(shadowMapProgram, 'pointLightPosition'),
			shadowClipNearFarLoc: gl.getUniformLocation(shadowMapProgram, 'shadowClipNearFar'),
			shadowMapWorldLoc: gl.getUniformLocation(shadowMapProgram, 'mWorld'),
			shadowMapProjLoc: gl.getUniformLocation(shadowMapProgram, 'mProj'),
			shadowMapViewLoc: gl.getUniformLocation(shadowMapProgram, 'mView')
		};
	var shadowMapAttributes = {
			positionAttribLocation: gl.getAttribLocation(shadowMapProgram, 'vertPosition')
	};

	var shadowUniforms = {
		shapeColor: gl.getUniformLocation(shadowProgram, 'shapeColor'),
		mWorld: gl.getUniformLocation(shadowProgram, 'mWorld'),
		mView: gl.getUniformLocation(shadowProgram, 'mView'),
		mProj: gl.getUniformLocation(shadowProgram, 'mProj'),
		textureTransform: gl.getUniformLocation(shadowProgram, 'textureTransform'),
		mWorldNormal: gl.getUniformLocation(shadowProgram, 'mWorldNormal'),
		lightPosition: gl.getUniformLocation(shadowProgram, 'lightPosition'),
		lightColor: gl.getUniformLocation(shadowProgram, 'lightColor'),
		ambient: gl.getUniformLocation(shadowProgram, 'ambient'),
		diffusivity: gl.getUniformLocation(shadowProgram, 'diffusivity'),
		shininess: gl.getUniformLocation(shadowProgram, 'shininess'),
		smoothness: gl.getUniformLocation(shadowProgram, 'smoothness'),
		attenuation_factor: gl.getUniformLocation(shadowProgram, 'attenuation_factor'),
		lightShadowMap: gl.getUniformLocation(shadowProgram, 'lightShadowMap'),
		shadowClipNearFar: gl.getUniformLocation(shadowProgram, 'shadowClipNearFar'),
		USE_TEXTURE_Location: gl.getUniformLocation(shadowProgram, 'USE_TEXTURE'),
		USE_NORMAL_MAP_Location: gl.getUniformLocation(shadowProgram, 'USE_NORMAL_MAP'),
		SHADOWS_OFF_Location: gl.getUniformLocation(shadowProgram, 'SHADOWS_OFF'),
		texture: gl.getUniformLocation(shadowProgram, 'texture'),
		sampler: gl.getUniformLocation(shadowProgram, 'sampler'),
		normalMap: gl.getUniformLocation(shadowProgram, 'normalMap'),
		theta: gl.getUniformLocation(shadowProgram, "theta"),
		TEXTURE_DISTORTION_Location: gl.getUniformLocation(shadowProgram, 'TEXTURE_DISTORTION'),
		water: gl.getUniformLocation(shadowProgram, 'WATER')
	};
	var shadowAttributes = {
		vertPosition: gl.getAttribLocation(shadowProgram, 'vertPosition'),
		vertNormal: gl.getAttribLocation(shadowProgram, 'vertNormal'),
		texCoord: gl.getAttribLocation(shadowProgram, 'texCoord')
	};
 
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
		return ID;
	}

	////////////////////// Interaction /////////////////
	var eating_audio = new Audio('sound/eating.mp3');
	var door_audio = new Audio('sound/door_open.m4a');
	var key_audio = new Audio('sound/key2.m4a');
	var trip_audio = new Audio('sound/trip.m4a');
	var tripID;
	var tripIt = 0;


	var holdingKey = 0;
	var doorOpened = 0;
	function setStatus(string, time){
		status.innerHTML = string;
        setTimeout(function(){
             status.innerHTML = "";
        }, time);
	}

	function interact(){
		var itemID = handlePick(canvas.width/2, canvas.height/2);
		if(itemID == null) return;

		Rooms.forEach(function(room){
      for(var i = 0; i < room.objects.length; i++){
        if(room.objects[i].shape.pickID == itemID){
          var itemType = room.objects[i].itemType;
          if(itemType == "food"){
            room.objects[i].delete();
            eating_audio.play();
            healthleft = Math.min(100, healthleft + 8);
            setHealth(healthleft);
          }else if(itemType == "food_2"){
			room.objects[i].delete();
            eating_audio.play();
            healthleft = Math.min(100, healthleft + 15);
            setHealth(healthleft);
		  }
          else if(itemType == "closed_door_south"){
            if(testKeys && !holdingKey){ // TODO: Re-enable keys before demo.
              setStatus("The door seems to be locked.", 5000);
            } else {
              room.objects[i].translation[0] = room.objects[i].translation[0] + 1.0;
              room.objects[i].translation[2] = room.objects[i].translation[2] + 0.78;
              room.objects[i].rotation = room.objects[i].rotation + glMatrix.toRadian(100);
              room.objects[i].itemType = "open_door"
              door_audio.play();
              setTimeout(function(){ // This is necessary because the door is composed of multiple pickable meshes.
                holdingKey = 0;
				doorOpened = 0;
                toggleKeyIcon(0);
              }, 200);
			  if(!doorOpened){
				console.log("south")
				loadNewRoom("south");
			  }
			  doorOpened = 1;
            }
          }
		   else if(itemType == "closed_door_north"){
            if(testKeys && !holdingKey){ // TODO: Re-enable keys before demo.
              setStatus("The door seems to be locked.", 5000);
            } else {
              room.objects[i].translation[0] = room.objects[i].translation[0] -1.0;
              room.objects[i].translation[2] = room.objects[i].translation[2] - 0.78;
              room.objects[i].rotation = room.objects[i].rotation + glMatrix.toRadian(-100);
              room.objects[i].itemType = "open_door"
              door_audio.play();
              setTimeout(function(){ // This is necessary because the door is composed of multiple pickable meshes.
                holdingKey = 0;
				doorOpened = 0;
                toggleKeyIcon(0);
              }, 200);
			  if(!doorOpened){
				loadNewRoom("north");
			  }
			  doorOpened = 1;
            }
          }
		   else if(itemType == "closed_door_east"){
            if(testKeys && !holdingKey){ // TODO: Re-enable keys before demo.
              setStatus("The door seems to be locked.", 5000);
            } else {
              room.objects[i].translation[0] = room.objects[i].translation[2] - 1.0;
              room.objects[i].translation[2] = room.objects[i].translation[0] - 0.78;
              room.objects[i].rotation = room.objects[i].rotation + glMatrix.toRadian(100);
              room.objects[i].itemType = "open_door"
              door_audio.play();
              setTimeout(function(){ // This is necessary because the door is composed of multiple pickable meshes.
                holdingKey = 0;
				doorOpened = 0;
                toggleKeyIcon(0);
              }, 200);
			  if(!doorOpened){
				console.log("east");
				loadNewRoom("east");
			  }
			  doorOpened = 1;
            }
          }
		   else if(itemType == "closed_door_west"){
            if(testKeys && !holdingKey){ // TODO: Re-enable keys before demo.
              setStatus("The door seems to be locked.", 5000);
            } else {
              room.objects[i].translation[2] = room.objects[i].translation[2] + 1.0;
              room.objects[i].translation[0] = room.objects[i].translation[0] - 0.78;
              room.objects[i].rotation = room.objects[i].rotation + glMatrix.toRadian(-80);
              room.objects[i].itemType = "open_door"
              door_audio.play();
              setTimeout(function(){ // This is necessary because the door is composed of multiple pickable meshes.
                holdingKey = 0;
				doorOpened = 0;
                toggleKeyIcon(0);
              }, 200);
			  if(!doorOpened){
				console.log("west");
				loadNewRoom("west");
			  }
			  doorOpened = 1;
            }
          }
          else if(itemType == "open_door"){
			setStatus("A mysterious force seems to hold the door open.", 11000);
          }
          else if(itemType == "key"){
            holdingKey = 1;
            toggleKeyIcon(1);
            key_audio.play();
            room.objects[i].delete();
          }
          else if(itemType == "key_kitchen")
          {
          	holdingKey = 1;
          	toggleKeyIcon(1);
          	key_audio.play();
          	room.objects[i].delete();
          	setStatus("this isn't food...", 5000);
          }
          else if(itemType == "key_egg")
          {
           	holdingKey = 1;
          	toggleKeyIcon(1);
      //    	key_audio.play();
          	room.objects[i].delete();
          	setStatus("nothing is suspicious", 5000);

            trip_audio.play();
            movePlayer(20, 0, -60);
            rotateCamera(0, -30);
          	tripID = setInterval(function(){
				tripIt++;
				if(tripIt == 1200){
					clearInterval(tripID);
					trip_audio.pause();
				}
				else
					rotateCamera(tripIt/100, Math.sin(tripIt/100) / 4 );
			}, 10);
          }
		  else if(itemType == "key_obama"){
            holdingKey = 1;
            toggleKeyIcon(1);
            key_audio.play();
            room.objects[i].delete();
			setStatus("Thanks, Obama.", 5000);
          }
		  else if(itemType == "shower_door_1"){
			room.objects[i].translation[2] = room.objects[i].translation[2] - 19.0;
			room.objects[i].itemType = "shower_door_2";
			door_audio.play();
		  } else if (itemType == "shower_door_2"){
			room.objects[i].translation[2] = room.objects[i].translation[2] + 19.0;
			room.objects[i].itemType = "shower_door_1";
	        door_audio.play();
		  }
        }
      }
    });
	}

	////////////////////// Render Loop /////////////////
	var shadows = 1;
	console.log()
	var loop = function(){

		handleInput();
		theta = performance.now() / 1000 / 6 *  2 * Math.PI;
		var object;

		// Draw Shadow map //
		// Set GL state status
		gl.useProgram(shadowMapProgram);
		gl.bindTexture(gl.TEXTURE_CUBE_MAP, shadowMapCube);
		gl.bindFramebuffer(gl.FRAMEBUFFER, shadowMapFrameBuffer);
		gl.bindRenderbuffer(gl.RENDERBUFFER, shadowMapRenderBuffer);
		gl.viewport(0, 0, textureSize, textureSize);
		gl.enable(gl.DEPTH_TEST);
		gl.enable(gl.CULL_FACE);

		// Set per-frame uniforms
		gl.uniform2fv(
			shadowMapUniforms.shadowClipNearFarLoc,
			shadowClipNearFar
		);
		gl.uniform4fv(
			shadowMapUniforms.pointLightPositionLoc,
			light.lightPosition
		);
		gl.uniformMatrix4fv(
			shadowMapUniforms.shadowMapProjLoc,
			gl.FALSE,
			shadowMapProj
		);

		for (var i = 0; i < shadowMapCameras.length; i++) {
			// Set per light uniforms
			gl.uniformMatrix4fv(
				shadowMapUniforms.shadowMapViewLoc,
				gl.FALSE,
				shadowMapCameras[i].GetViewMatrix(shadowMapViewMatrices[i])
			);
			// Set framebuffer destination
			gl.framebufferTexture2D(
				gl.FRAMEBUFFER,
				gl.COLOR_ATTACHMENT0,
				gl.TEXTURE_CUBE_MAP_POSITIVE_X + i,
				shadowMapCube,
				0
			);
			gl.framebufferRenderbuffer(
				gl.FRAMEBUFFER,
				gl.DEPTH_ATTACHMENT,
				gl.RENDERBUFFER,
				shadowMapRenderBuffer
			);

			gl.clearColor(0, 0, 0, 1);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		 	for(var j = 0; j < Rooms[Rooms.length-1].objects.length; j++){
		 		object = Rooms[Rooms.length-1].objects[j];
				if (object.shadows){
			 		// Begin transformations.
			 		mat4.identity(worldMatrix);
			 		mat4.scale(scalingMatrix, identityMatrix, object.scale);
			 		mat4.rotate(rotationMatrix, identityMatrix, object.rotation, object.axis);
			 		mat4.translate(translationMatrix, identityMatrix, object.translation);

			 		mat4.mul(worldMatrix, scalingMatrix, worldMatrix);
			 		mat4.mul(worldMatrix, rotationMatrix, worldMatrix);
			 		mat4.mul(worldMatrix, translationMatrix, worldMatrix);

			 		gl.uniformMatrix4fv(shadowMapUniforms.shadowMapWorldLoc, gl.FALSE, worldMatrix);

			 		if(object.isDrawn)
			 			object.shadowMapDraw(shadowMapAttributes);
				}
		 	}
		}
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.bindRenderbuffer(gl.RENDERBUFFER, null);
		gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);

		if (shadows){
			gl.useProgram(shadowProgram);
			light.changeProgram(shadowProgram);
			gl.uniform1i(shadowUniforms.lightShadowMap, 1);
			gl.uniform2fv(shadowUniforms.shadowClipNearFar, shadowClipNearFar);
			// Adjust view. The order of the rotation ensures that the camera rotates heading around the world's Y axis.
			mat4.mul(viewMatrix, testViewMatrix, identityMatrix);
			mat4.rotate(rotationMatrix1, identityMatrix, glMatrix.toRadian(heading), [0,1,0]); // Adjust heading.
			mat4.rotate(rotationMatrix2, identityMatrix, glMatrix.toRadian(pitch), [1,0,0]); // Adjust pitch.
			mat4.mul(viewMatrix, rotationMatrix1, viewMatrix);
			mat4.mul(viewMatrix, rotationMatrix2, viewMatrix);
			mat4.invert(curViewMatrix, viewMatrix);
			gl.uniformMatrix4fv(shadowUniforms.mView, gl.FALSE, viewMatrix);

			// Draw normally onto the screen.
			gl.uniform1f(shadowUniforms.theta, theta);
			gl.uniformMatrix4fv(shadowUniforms.mProj, gl.FALSE, projMatrix);
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			gl.viewport(0,0, gl.canvas.width, gl.canvas.height);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_CUBE_MAP, shadowMapCube);

			for(var i = 0; i < Rooms.length; i++){
				for(var j = 0; j < Rooms[i].objects.length; j++){
					object = Rooms[i].objects[j];
					// Is the current objects shadow off or on?
					if (object.shadows)
						gl.uniform1i(shadowUniforms.SHADOWS_OFF_Location, 0);
					else
						gl.uniform1i(shadowUniforms.SHADOWS_OFF_Location, 1);
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
						gl.uniformMatrix3fv(shadowUniforms.textureTransform, gl.FALSE, textureTransform);
					} else {
						gl.uniformMatrix3fv(shadowUniforms.textureTransform, gl.FALSE, mat3.identity(textureTransform));
					}

					// This is needed for lighting.
					mat4.mul(cameraWorldMatrix, viewMatrix, worldMatrix);
					mat4.invert(cameraWorldMatrix, cameraWorldMatrix);
					mat4.transpose(cameraWorldMatrix, cameraWorldMatrix);
					mat3.fromMat4(cameraWorldNormalMatrix, cameraWorldMatrix);
					gl.uniformMatrix3fv(shadowUniforms.mWorldNormal, gl.FALSE, cameraWorldNormalMatrix);

					//mat4.mul(worldMatrix, navigationMatrix, worldMatrix);
					gl.uniformMatrix4fv(shadowUniforms.mWorld, gl.FALSE, worldMatrix);
					//gl.uniform4fv(shadowUniforms.shapeColor, [1,1,1,1]);

					if(object.shapeColor != null) gl.uniform4fv(shadowUniforms.shapeColor, object.shapeColor);

					if(object.isDrawn)
						object.shadowDraw(shadowUniforms, shadowAttributes);
				}
			}
		}
		else{
			// Normal Draw
			gl.useProgram(program);
			light.changeProgram(program);
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

			for(var i = 0; i < Rooms.length; i++){
				for(var j = 0; j < Rooms[i].objects.length; j++){
					object = Rooms[i].objects[j];
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
				}
			}
		}

		// Draw to the frame buffer for picking.
		gl.useProgram(program);
		light.changeProgram(program);

		// Adjust view. The order of the rotation ensures that the camera rotates heading around the world's Y axis.
		mat4.mul(viewMatrix, testViewMatrix, identityMatrix);
		mat4.rotate(rotationMatrix1, identityMatrix, glMatrix.toRadian(heading), [0,1,0]); // Adjust heading.
		mat4.rotate(rotationMatrix2, identityMatrix, glMatrix.toRadian(pitch), [1,0,0]); // Adjust pitch.
		mat4.mul(viewMatrix, rotationMatrix1, viewMatrix);
		mat4.mul(viewMatrix, rotationMatrix2, viewMatrix);
		mat4.invert(curViewMatrix, viewMatrix);
		gl.uniformMatrix4fv(mViewLoc, gl.FALSE, viewMatrix);

		gl.uniformMatrix4fv(mProjLoc, gl.FALSE, pickProjMatrix);
		gl.bindFramebuffer(gl.FRAMEBUFFER, pickBuffer); // Comment this to draw the pickColors to the screen.
		gl.viewport(0,0, gl.canvas.width, gl.canvas.height);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.uniform1i(use_ambience_loc, 0); // Turn off ambience before drawing to ensure fixed colors.
		for(var i = 0; i < Rooms.length; i++){
			for(var j = 0; j < Rooms[i].objects.length; j++){
				object = Rooms[i].objects[j];
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

			}
		}
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
