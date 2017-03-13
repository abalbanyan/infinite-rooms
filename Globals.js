// Globals that affect the program
var textureSize = 256; // texture size for shadow mapping
var shadowMapCameras;
var playerCollisionMat = mat4.create();
var unitsphere;
var demo = true;	// The demo mode has it so scrolls spawn 100% of the time for ease of demoing
var fadeToBlack = false;
var spooky = false;
var testKeys = 0;
var gameStart = 0;
var gameInstructions = `Placeholder. Press 'i' to toggle game instructions`;
