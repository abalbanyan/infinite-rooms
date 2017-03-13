// Globals that affect the program
var textureSize = 256; // texture size for shadow mapping
var shadowMapCameras;
var demo = false;	// The demo mode has it so scrolls spawn 100% of the time for ease of demoing
var scrollSpawnProbability = 0.75;
var fadeToBlack = false;
var spooky = false;
var testKeys = 0;
var gameStart = 0;
var gameInstructions = `
<center> TUTORIAL </center>
<br>
Use <b>WASD</b> or the left joystick to move around.
<br>
Use the <b>arrow keys</b> or the right joystick to move the camera.
<br>
Press <i><b>space</b></i> or (A) to pick up objects like food, keys, and notes.
<br>
Press <b>'+'/'-'</b> on a keyboard to change movement speed. 
<br>
Hold (B) if you're using a controller to sprint. 
<br>
Hold <i><b>'SHIFT'</b></i> or (X) to crouch down.
<br> 
Press the buttons 1 through 6 to open notes you've found. 
<br>
Press <b>'i'</b> to close (and re-open!) this tutorial.
<br>
Now that you're ready, try picking up the note on the desk.
<br>
`;
