function Room(gl, program, shadowMapProgram, shadowProgram, buffers, jsonobjects, otherObjects, coordinates) {
    this.meshes = jsonobjects;
    this.objects = otherObjects;
    this.coords = coordinates;
    this.wallCoords = [];
    this.doorCoords = [];
    this.openDoors = undefined;
    this.collidables = [];

    delx = this.coords[0] * 200; // We can set this to 200, since we're using gl.CULL_FACE.
    delz = this.coords[1] * 200;

    for(var i = 0; i < this.meshes.length; i++){
        this.meshes[i][1][0] += delx;
        this.meshes[i][1][2] += delz;
    }
    for(var i = 0; i < this.objects.length; i++){
        this.objects[i].translation[0] += delx;
        this.objects[i].translation[2] += delz;

        //if (this.objects[i].collidable) this.collidables.push(this.objects[i].collisionMatrix);

        if (!this.objects[i].truetranslation) continue;
        this.objects[i].truetranslation[0] += this.coords[0] * 200;
        this.objects[i].truetranslation[2] += this.coords[1] * 200;

    }


    for(var i = 0; i < this.meshes.length; i++){
        addObjectFromJSON.apply(this, this.meshes[i]);
    }

     // Pass in pickID as the last parameter to addObjectFromJSON if the object is pickable. The pickID can be any value between 0 and 255.
    // pickID should be unique, itemType does not need to be.
    function addObjectFromJSON(jsonfile, translation, scale, rotation, axis, texture, color = null, collisionSpheres = null, itemType = null, pickID = null, material = null, normalMap = null, shadows = true, unitscale = undefined)
	{
        var self = this;
        if(collisionSpheres instanceof Array) {
            for(var i = 0; i < collisionSpheres.length; i++){
                collisionSpheres[i][0][0] += self.coords[0] * 200;
                collisionSpheres[i][0][2] += self.coords[1] * 200;
            }
            self.collidables = self.collidables.concat(collisionSpheres);
        }
	    var rawFile = new XMLHttpRequest();
	    var rotation = glMatrix.toRadian(rotation);
	    rawFile.open("GET", jsonfile, false);

		rawFile.onreadystatechange = function(){
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
                    shape = new Shape(vertices, indices, normals, textureCoords, gl, program, shadowMapProgram, shadowProgram, buffers);
                    if(textureCoords.length && texture != null) { // First check if the mesh component has a texture.
                        shape.attachTexture(texture[texIterator]);
                        if(texIterator < texture.length - 1) texIterator++;
                    }
                    else if(color != null) shape.setColor(color);
                    else shape.setColor([0,1,0,1]); // Set color to green if both of the above fail.
                    if(material != null) shape.setMaterialProperties(material.diffusivity, material.smoothness, material.shininess);
                    if(normalMap != null) {
                        shape.attachNormalMap(normalMap);
                    }
                    //var object = new Object(shape, translation, scale, rotation, axis, null, null, true, null, unitscale);
                    var object = new Object(shape, translation, scale, rotation, axis);
                    if(pickID != null)
                        object.shape.makePickable(pickID);
                    object.itemType = itemType;
                    object.shadows = shadows;
                    self.objects.push(object);
                }
		    }
        }
        rawFile.send();
	}
}
Room.prototype.loadWallCoords = function(){
    this.doorCoords = [];
    this.wallCoords = [];

    for(var i = 0; i < this.objects.length; i++){
        if (this.objects[i].itemType == "wall") {
            this.wallCoords.push([this.objects[i].truetranslation, this.objects[i].rotation]);
        }
        if (this.objects[i].itemType == "doorWall") {
            this.doorCoords.push([this.objects[i].truetranslation, this.objects[i].rotation]);
        }
    }
}
