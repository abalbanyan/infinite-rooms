/*
Store all meshes here.
A mesh object should consist of:
	vertices
	indices 
	textureCoords
	normals
*/

class Mesh{
	constructor(vertices = [], indices = [], normals = [], textureCoords = []){
		this.vertices = vertices;
		this.indices = indices;
		this.normals = normals;
		this.textureCoords = textureCoords;
	}
}

var cubeSize = 1;
var cubeMesh = new Mesh(
	// Vertices:
	[          
		// Top
		-cubeSize, cubeSize, -cubeSize,  
		-cubeSize, cubeSize, cubeSize,    
		cubeSize, cubeSize, cubeSize,    
		cubeSize, cubeSize, -cubeSize,    
 
		// Left
		-cubeSize, cubeSize, cubeSize,    
		-cubeSize, -cubeSize, cubeSize,  
		-cubeSize, -cubeSize, -cubeSize,  
		-cubeSize, cubeSize, -cubeSize,  
 
		// Right
		cubeSize, cubeSize, cubeSize,    
		cubeSize, -cubeSize, cubeSize,  
		cubeSize, -cubeSize, -cubeSize,  
		cubeSize, cubeSize, -cubeSize,  
 
		// Front
		cubeSize, cubeSize, cubeSize,    
		cubeSize, -cubeSize, cubeSize,  
		-cubeSize, -cubeSize, cubeSize,  
		-cubeSize, cubeSize, cubeSize,  
 
		// Back
		cubeSize, cubeSize, -cubeSize,    
		cubeSize, -cubeSize, -cubeSize,  
		-cubeSize, -cubeSize, -cubeSize,  
		-cubeSize, cubeSize, -cubeSize,    
 
		// Bottom
		-cubeSize, -cubeSize, -cubeSize,  
		-cubeSize, -cubeSize, cubeSize,  
		cubeSize, -cubeSize, cubeSize,    
		cubeSize, -cubeSize, -cubeSize
	],
	// Indices:
	[
		// Top
		0, 1, 2,
		0, 2, 3,
 
		// Left
		5, 4, 6,
		6, 4, 7,
 
		// Right
		8, 9, 10,
		8, 10, 11,
 
		// Front
		13, 12, 14,
		15, 14, 12,
 
		// Back
		16, 17, 18,
		16, 18, 19,
 
		// Bottom
		21, 20, 22,
		22, 20, 23
	],
	// Normals:
	[          
		// Top
		-cubeSize, cubeSize, -cubeSize,  
		-cubeSize, cubeSize, cubeSize,    
		cubeSize, cubeSize, cubeSize,    
		cubeSize, cubeSize, -cubeSize,    
 
		// Left
		-cubeSize, cubeSize, cubeSize,    
		-cubeSize, -cubeSize, cubeSize,  
		-cubeSize, -cubeSize, -cubeSize,  
		-cubeSize, cubeSize, -cubeSize,  
 
		// Right
		cubeSize, cubeSize, cubeSize,    
		cubeSize, -cubeSize, cubeSize,  
		cubeSize, -cubeSize, -cubeSize,  
		cubeSize, cubeSize, -cubeSize,  
 
		// Front
		cubeSize, cubeSize, cubeSize,    
		cubeSize, -cubeSize, cubeSize,  
		-cubeSize, -cubeSize, cubeSize,  
		-cubeSize, cubeSize, cubeSize,  
 
		// Back
		cubeSize, cubeSize, -cubeSize,    
		cubeSize, -cubeSize, -cubeSize,  
		-cubeSize, -cubeSize, -cubeSize,  
		-cubeSize, cubeSize, -cubeSize,    
 
		// Bottom
		-cubeSize, -cubeSize, -cubeSize,  
		-cubeSize, -cubeSize, cubeSize,  
		cubeSize, -cubeSize, cubeSize,    
		cubeSize, -cubeSize, -cubeSize   
	],
	// Texture Coordinates:
	[
		0, 	0,
		0, 1.0,
		1.0, 1.0,
		1.0, 0,
		0, 0,
		1.0, 0,
		1.0, 1.0,
		0, 1.0,
		1.0, 1.0,
		0, 1.0,
		0, 0,
		1.0, 0,
		1.0, 1.0,
		1.0, 0,
		0, 0,
		0, 1.0,
		0, 0,
		0, 1.0,
		1.0, 1.0,
		1.0, 0,
		1.0, 1.0,
		1.0, 0,
		0, 0,
		0, 1.0
	]
)

var floorMesh = new Mesh(
	// vertices:
	[
		-1, -1, -1,  
		-1, -1, 1,  
		1, -1, 1,    
		1, -1, -1 
	],
	// indices:
	[
		1,0,2,
		3,2,0
	],
	// normals:
	[
		-cubeSize, cubeSize, -cubeSize,  
		-cubeSize, cubeSize, cubeSize,    
		cubeSize, cubeSize, cubeSize,    
		cubeSize, cubeSize, -cubeSize
	],
	// texuture coords:
	[
		0,0,
		0,1,
		1,1,
		1,0
	]
)

var ceilingMesh = new Mesh(
	// vertices:
	[
		-cubeSize, cubeSize, -cubeSize,  
		-cubeSize, cubeSize, cubeSize,    
		cubeSize, cubeSize, cubeSize,    
		cubeSize, cubeSize, -cubeSize
	],
	// indices:
	[
		1,0,2,
		3,2,0
	],
	// normals:
	[
		-cubeSize, -cubeSize, -cubeSize,  
		-cubeSize, -cubeSize, cubeSize,  
		cubeSize, -cubeSize, cubeSize,    
		cubeSize, -cubeSize, -cubeSize
	],
	// texuture coords:
	[
		0,0,
		0,1,
		1,1,
		1,0
	]
)



var wallMesh = new Mesh(
	// vertices:
	[
		1.0, 1.0, 1.0,
		1.0, -1.0, 1.0,
		-1.0, -1.0, 1.0,
		-1.0, 1.0, 1.0
	],
	// indices:
	[
		1,0,2,3,2,0
	],
	// normals:
	[
		1, 1, -1,    
		1, -1, -1,  
		-1, -1, -1,  
		-1, 1, -1,    
	],
	// texuture coords:
	[
		0,0,
		0,1,
		1,1,
		1,0
	]
)

var sphereMesh = generateSphere(30, 30, 2);

// The complexity of the spheres can be set by increasing @latitudeBands or @longitudeBands.
// @normalType can be either "phong-gouraud" or "flat".
function generateSphere(latitudeBands, longitudeBands, radius, normalType = "phong-gouraud"){
	var sphere = new Mesh();

	for (var latNumber = 0; latNumber <= latitudeBands; latNumber++) {
		var theta = latNumber * Math.PI / latitudeBands;
		var sinTheta = Math.sin(theta);
		var cosTheta = Math.cos(theta);

		for (var longNumber = 0; longNumber <= longitudeBands; longNumber++) {
			var phi = longNumber * 2 * Math.PI / longitudeBands;
			var sinPhi = Math.sin(phi);
			var cosPhi = Math.cos(phi);

			var x = cosPhi * sinTheta;
			var y = cosTheta;
			var z = sinPhi * sinTheta;
			var u = 1 - (longNumber / longitudeBands);
			var v = 1 - (latNumber / latitudeBands);

			sphere.normals.push(x);
			sphere.normals.push(y);
			sphere.normals.push(z);

			sphere.textureCoords.push(u);
			sphere.textureCoords.push(v);
			sphere.vertices.push(radius * x);
			sphere.vertices.push(radius * y);
			sphere.vertices.push(radius * z);
		}
	}
	for (var latNumber = 0; latNumber < latitudeBands; latNumber++) {
	  for (var longNumber = 0; longNumber < longitudeBands; longNumber++) {
		var first = (latNumber * (longitudeBands + 1)) + longNumber;
		var second = first + longitudeBands + 1;
		sphere.indices.push(first);
		sphere.indices.push(second);
		sphere.indices.push(first + 1);

		sphere.indices.push(second);
		sphere.indices.push(second + 1);
		sphere.indices.push(first + 1);
	  }
	}


	if(normalType == "flat"){
		var flatMesh = [];
		var flatNormals = [];
		var flatIndices = [];
		for(var i = 0; i < sphere.indices.length; i+= 3){
			// Vertex 1
			flatMesh.push(sphere.vertices[ sphere.indices[i] * 3 ]);		// x
			flatMesh.push(sphere.vertices[ sphere.indices[i] * 3 + 1 ]);    // y
			flatMesh.push(sphere.vertices[ sphere.indices[i] * 3 + 2 ]);    // z
			flatIndices.push(i);

			// Vertex 2
			flatMesh.push(sphere.vertices[ sphere.indices[i+1] * 3 ]);		// x
			flatMesh.push(sphere.vertices[ sphere.indices[i+1] * 3 + 1 ]);  // y
			flatMesh.push(sphere.vertices[ sphere.indices[i+1] * 3 + 2 ]);  // z
			flatIndices.push(i+1);

			// Vertex 3
			flatMesh.push(sphere.vertices[ sphere.indices[i+2] * 3 ]);		// x
			flatMesh.push(sphere.vertices[ sphere.indices[i+2] * 3 + 1 ]);  // y
			flatMesh.push(sphere.vertices[ sphere.indices[i+2] * 3 + 2 ]);  // z
			flatIndices.push(i+2);			

			// We use the same normal for each of the three vertices.
			// To calculate this normal, we find the cross product of the two vectors formed by the three vertices.
			// This vector must be oriented properly, otherwise the normal will be facing inside of the spheres.
			vector_a = [sphere.normals[sphere.indices[i] * 3]     - sphere.normals[sphere.indices[i+1] * 3], 
						sphere.normals[sphere.indices[i] * 3 + 1] - sphere.normals[sphere.indices[i+1] * 3 + 1],
						sphere.normals[sphere.indices[i] * 3 + 2] - sphere.normals[sphere.indices[i+1] * 3 + 2] ]
			vector_b = [sphere.normals[sphere.indices[i+2] * 3]     - sphere.normals[sphere.indices[i+1] * 3], 
						sphere.normals[sphere.indices[i+2] * 3 + 1] - sphere.normals[sphere.indices[i+1] * 3 + 1],
						sphere.normals[sphere.indices[i+2] * 3 + 2] - sphere.normals[sphere.indices[i+1] * 3 + 2] ]			
			cross_prod = [];
			vec3.cross(cross_prod, vector_a, vector_b);

			flatNormals.push(cross_prod[0]);
			flatNormals.push(cross_prod[1]);
			flatNormals.push(cross_prod[2]);

			flatNormals.push(cross_prod[0]);
			flatNormals.push(cross_prod[1]);
			flatNormals.push(cross_prod[2]);

			flatNormals.push(cross_prod[0]);
			flatNormals.push(cross_prod[1]);
			flatNormals.push(cross_prod[2]);
		} 
		sphere.vertices = flatMesh;
		sphere.normals = flatNormals;
		sphere.indices = flatIndices;
	}

	return sphere;
}