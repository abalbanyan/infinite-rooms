# infinite-rooms
Infinite Rooms is a survival game that takes place in a procedurally generated grid of household rooms. Players must proceed from room to room, collecting food in order to survive. Each door in a given room is locked with a key - players must find the key hidden in each room in order to advance to the next room. To be idle is to perish - so push on to survive!


In addition, notes are hidden in each room - these notes will provide hints to the player on the nature of the Infinite Rooms.


Please enjoy the game! 

### Controls:
![Tutorial Message](http://i.imgur.com/40NNb51.png)

## Functionality:

### Advanced Topics:
#### Picking
Players can pick up objects like food, keys, and scrolls which display notes to the player.
Picking was implemented by rendering pickable objects to a seperate frame buffer, where they are given specific colors which act as IDs once we read from the frame buffer using readPixels(). In order to improve performance, we only render objects which are pickable. This has the limitation that if one pickable object is obscured by another, non-pickable object, the pickable object will still be able to be picked up, which is nonintuitive. 
Objects can only be picked from 55 units away.  
#### Shadows
Shadows are displayed per object and use dynamic shadow mapping. An unsigned_byte implementation is used and the resolution of the shadow mapping can be increased by
modifying the textureSize variable in Globals.js. Our shadow mapping implementation is implemented via WebGL's render and frame buffer features
and draws to a textured cube. This is done by using six different view matrices and camera positions from which the "light" views the room. It calculates the depth from
the light position for the different objects and codifies this as a color to be processed by the normal drawing program. The normal drawing program takes these values
and compares them and applies specular and diffuse lighting depending on whether or not the object is behind something depth wise (from the light's perspective).
In some areas (especially with high-poly models), certain objects have shadows turned off. This means that these objects don't participate in the shadow mapping
render to avoid the 6 additional renders.
#### Normal Mapping
Simple normal mapping was implemented on some objects in the scene, such as the carpets and brick floor in the living room. This was accomplished by passing in a seperate texture, a normal map, into the shader for the particular objects that were normal mapped. We use the rgb values of the normal maps to create per-fragment normals for the objects. We intended to also pass in bitangents and tangents to improve the normal mapping for these objects; however, buffering in two additional attributes into the shader proved to be too costly in terms of performance.
#### Collisions
We use two types of collision detection in this game. The first type simply uses 2D coordinates to prevent the player from passing through walls and closed doors in whatever room they're in. The second type involves creating point spheres for objects in each room, as well as a point sphere for the player. We perform sphere intersection tests in the movePlayer() function, preventing the player from moving in a direciton where they would otherwise intersect with another object's point sphere. Note that since the player is the only significant object moving in this game, we do not perform intersection tests in any other function than movePlayer().
#### Additional Functionality
The game can be controlled using both a USB gamepad and the keyboard. The game is a lot more fun to control using a gamepad, so we suggest doing that!

We added implementation to load external meshes in .json format. We downloaded meshes from online sources such as cgtrader.com and converted them to json before adding them to our program. One problem we ran into while doing this was performance - while we used very low-poly meshes, eventually having too many meshes in one room would cause performance to grind to a halt. We therefore had to limit the amount and type of objects we were able to use in some of the rooms.
One way we dealt with this performance problem was to also limit the amount of rooms that can be loaded at once. We simply unload rooms in a queue-like fashion once more than maxRooms (defaults to 2) have been loaded. This provided a great increase in performance.

### Installation

Use python -m http.server to run this on localhost:8000. A live version can also be accessed at https://abalbanyan.github.io/infinite-rooms/.
