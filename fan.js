"use strict";

var canvas, gl, program;

var NumVertices = 36; //(6 faces)(2 triangles/face)(3 vertices/triangle)

var positionsArray = [];
var normalsArray = [];

var vertices = [
    vec4( -0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5,  0.5,  0.5, 1.0 ),
    vec4(  0.5,  0.5,  0.5, 1.0 ),
    vec4(  0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5, -0.5, -0.5, 1.0 ),
    vec4( -0.5,  0.5, -0.5, 1.0 ),
    vec4(  0.5,  0.5, -0.5, 1.0 ),
    vec4(  0.5, -0.5, -0.5, 1.0 )
];

var coloring = 0;
var colorsArray = []; // Array untuk warna
// RGBA colors
var vertexColors = [
    vec4(1.0, 0.0, 0.0, 1.0),  // Merah
    vec4(0.0, 1.0, 0.0, 1.0),  // Hijau
    vec4(0.0, 0.0, 1.0, 1.0),  // Biru
    vec4(1.0, 1.0, 0.0, 1.0),  // Kuning
    vec4(1.0, 0.0, 1.0, 1.0),  // Magenta
    vec4(0.0, 1.0, 1.0, 1.0),   // Cyan
    vec4(1.0, 1.0, 1.0, 1.0),  //Putih
    vec4(0.0, 0.0, 0.0, 1.0)  //Hitam
 ];

// Light Properties
var lightPosition = vec4(1.0, 1.0, 1.0, 0.0);
var lightAmbient = vec4(0.5, 0.5, 0.5, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var materialAmbient = vec4(1.0, 0.0, 1.0, 1.0);
var materialDiffuse = vec4(1.0, 0.8, 0.0, 1.0);
var materialSpecular = vec4(1.0, 0.8, 0.0, 1.0);
var materialShininess = 20.0;

// Parameters controlling the size of the Fan's arm


var BASE_HEIGHT      = 0.8;
var BASE_WIDTH       = 3.3;

var LOWER_ARM_HEIGHT = 2.5;
var LOWER_ARM_WIDTH  = 0.8;
var UPPER_ARM_HEIGHT = 4.0;
var UPPER_ARM_WIDTH  = 0.5;

var NUM_BLADES       = 4.0;
var BLADE_LENGTH     = 4.5;
var BLADE_WIDTH      = 0.5;
var BLADE_TICKNESS   = 0.2;

var CYLINDER_HEIGHT  = 1.5;
var CYLINDER_WIDTH   = 2.3;
var CYLINDER_LENGTH  = 1.5;

var PANEL_HEIGHT     = 0.9;
var PANEL_WIDTH      = 0.2;
var PANEL_LENGTH     = 0.5;

// Shader transformation matrices

var modelViewMatrix, projectionMatrix;

// Array of rotation angles (in degrees) for each rotation axis

var Base = 0;
var LowerArm = 1;
var UpperArm = 2;
var Cylinder = 3;
var Blades = 4;

var theta= [ 0, 0, 0, 0, 0];

var swingAngle = 0.0;
var speedSwing = 0.0;
var swingDirection = true;

var rotationAngle = 0.0;
var speedBlade = 0.0;

var modelViewMatrixLoc;

var vBuffer, cBuffer;

init();

//----------------------------------------------------------------------------

function quad(a, b, c, d, colorIndex) {
    var t1 = subtract(vertices[b], vertices[a]);
    var t2 = subtract(vertices[c], vertices[b]);
    var normal = cross(t1, t2);
    normal = vec3(normal);
 
    // Tambahkan posisi dan normal untuk setiap vertex
    positionsArray.push(vertices[a]);
    normalsArray.push(normal);
    colorsArray.push(vertexColors[colorIndex]);  // Tambahkan warna
 
    positionsArray.push(vertices[b]);
    normalsArray.push(normal);
    colorsArray.push(vertexColors[colorIndex]);
 
    positionsArray.push(vertices[c]);
    normalsArray.push(normal);
    colorsArray.push(vertexColors[colorIndex]);
 
    positionsArray.push(vertices[a]);
    normalsArray.push(normal);
    colorsArray.push(vertexColors[colorIndex]);
 
    positionsArray.push(vertices[c]);
    normalsArray.push(normal);
    colorsArray.push(vertexColors[colorIndex]);
 
    positionsArray.push(vertices[d]);
    normalsArray.push(normal);
    colorsArray.push(vertexColors[colorIndex]);
 }


 function colorCube()
 {
     quad(1, 0, 3, 2, coloring);
     quad(2, 3, 7, 6, coloring);
     quad(3, 0, 4, 7, coloring);
     quad(6, 5, 1, 2, coloring);
     quad(4, 5, 6, 7, coloring);
     quad(5, 4, 0, 1, coloring);
 }


//--------------------------------------------------

function updateColorBuffer() {
    colorsArray = []; // Kosongkan warna lama
    colorCube(); // Buat ulang kubus dengan warna baru

    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer); // Bind buffer warna
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW); // Isi ulang data buffer
    
    var colorLoc = gl.getAttribLocation(program, "aColor");
    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLoc);
}


function updateLightPosition() {
    var lightX = document.getElementById("lightX").value;
    var lightY = document.getElementById("lightY").value;
    var lightZ = document.getElementById("lightZ").value;
    var lightPosition = vec4(lightX, lightY, lightZ, 0.0);
 
    gl.uniform4fv(gl.getUniformLocation(program, "uLightPosition"), lightPosition);
 }

function updateLightColors() {
    var ambientR = document.getElementById("ambientR").value;
    var ambientG = document.getElementById("ambientG").value;
    var ambientB = document.getElementById("ambientB").value;
    var ambientProduct = vec4(ambientR, ambientG, ambientB, 1.0);
 
    var diffuseR = document.getElementById("diffuseR").value;
    var diffuseG = document.getElementById("diffuseG").value;
    var diffuseB = document.getElementById("diffuseB").value;
    var diffuseProduct = vec4(diffuseR, diffuseG, diffuseB, 1.0);
 
    var specularR = document.getElementById("specularR").value;
    var specularG = document.getElementById("specularG").value;
    var specularB = document.getElementById("specularB").value;
    var specularProduct = vec4(specularR, specularG, specularB, 1.0);
 
    gl.uniform4fv(gl.getUniformLocation(program, "uAmbientProduct"), ambientProduct);
    gl.uniform4fv(gl.getUniformLocation(program, "uDiffuseProduct"), diffuseProduct);
    gl.uniform4fv(gl.getUniformLocation(program, "uSpecularProduct"), specularProduct);
 }


function init() {

    canvas = document.getElementById( "gl-canvas" );

    gl = canvas.getContext('webgl2');
    if (!gl) { alert( "WebGL 2.0 isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );

    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    gl.enable( gl.DEPTH_TEST );

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );

    gl.useProgram( program );

    colorCube();

    // Load shaders and use the resulting shader program

    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Create and initialize  buffer objects
    var ambientProduct = mult(lightAmbient, materialAmbient);
    var diffuseProduct = mult(lightDiffuse, materialDiffuse);
    var specularProduct = mult(lightSpecular, materialSpecular);


    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positionsArray), gl.STATIC_DRAW);

    var positionLoc = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

    var nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);

    var normalLoc = gl.getAttribLocation(program, "aNormal");
    gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(normalLoc);

    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW);

    var colorLoc = gl.getAttribLocation(program, "aColor");
    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLoc);

    document.getElementById("black").onclick = function(event) {
        coloring = 7; // Set indeks warna ke hitam
        updateColorBuffer();
    };
    document.getElementById("blue").onclick = function(event) {
        coloring = 2; // Set indeks warna ke biru
        updateColorBuffer();
    };
    document.getElementById("red").onclick = function(event) {
        coloring = 0; // Set indeks warna ke merah
        updateColorBuffer();
    };
    document.getElementById("green").onclick = function(event) {
        coloring = 1; // Set indeks warna ke hijau
        updateColorBuffer();
    };
    document.getElementById("white").onclick = function(event) {
        coloring = 6; // Set indeks warna ke putih
        updateColorBuffer();
    };
    
    document.getElementById("ambientR").oninput = updateLightColors;
    document.getElementById("ambientG").oninput = updateLightColors;
    document.getElementById("ambientB").oninput = updateLightColors;
    
    document.getElementById("diffuseR").oninput = updateLightColors;
    document.getElementById("diffuseG").oninput = updateLightColors;
    document.getElementById("diffuseB").oninput = updateLightColors;

    document.getElementById("specularR").oninput = updateLightColors;
    document.getElementById("specularG").oninput = updateLightColors;
    document.getElementById("specularB").oninput = updateLightColors;

    document.getElementById("lightX").oninput = updateLightPosition;
    document.getElementById("lightY").oninput = updateLightPosition;
    document.getElementById("lightZ").oninput = updateLightPosition;

    document.getElementById("slider1").oninput = function(event) {
        theta[0] = event.target.value;
    };
    document.getElementById("slider2").oninput = function(event) {
         theta[1] = event.target.value;
    };
    document.getElementById("slider3").oninput = function(event) {
         theta[2] =  event.target.value;
    };
    document.getElementById("slider4").oninput = function(event) {
        UPPER_ARM_HEIGHT =  event.target.value;
    };
    document.getElementById("slider5").oninput = function(event) {
        theta[3] =  event.target.value;
    };


    document.getElementById("speed1").onclick = function(event) {
        speedBlade = 1;
    };
    document.getElementById("speed2").onclick = function(event) {
        speedBlade = 2;
    };
    document.getElementById("speed3").onclick = function(event) {
        speedBlade = 3;
    };
    document.getElementById("speed0").onclick = function(event) {
        speedBlade = 0;
    };

    document.getElementById("onSwing").onclick = function(event) {
        speedSwing = 0.1;
    };
    document.getElementById("offSwing").onclick = function(event) {
        speedSwing = 0;
    };

    gl.uniform4fv(gl.getUniformLocation(program, "uAmbientProduct"),
    ambientProduct);
    gl.uniform4fv(gl.getUniformLocation(program, "uDiffuseProduct"),
        diffuseProduct );
    gl.uniform4fv(gl.getUniformLocation(program, "uSpecularProduct"),
        specularProduct );
    gl.uniform4fv(gl.getUniformLocation(program, "uLightPosition"),
        lightPosition );

    gl.uniform1f(gl.getUniformLocation(program,
        "uShininess"), materialShininess);

    modelViewMatrixLoc = gl.getUniformLocation(program, "uModelViewMatrix");

    projectionMatrix = ortho(-10, 10, -10, 10, -10, 10);
    gl.uniformMatrix4fv( gl.getUniformLocation(program, "uProjectionMatrix"),  false, flatten(projectionMatrix) );

    render();
}

//----------------------------------------------------------------------------


function base() {
    var s = scale(BASE_WIDTH, BASE_HEIGHT, BASE_WIDTH);
    var instanceMatrix = mult( translate( 0.0, 0.5 * BASE_HEIGHT, 0.0 ), s);

    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc,  false, flatten(t)  );
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );

}

//----------------------------------------------------------------------------


function upperArm() {
    var s = scale(UPPER_ARM_WIDTH, UPPER_ARM_HEIGHT, UPPER_ARM_WIDTH);
    var instanceMatrix = mult(translate( 0.0, 0.5 * UPPER_ARM_HEIGHT, 0.0 ),s);

    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv( modelViewMatrixLoc,  false, flatten(t)  );
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );

}

//----------------------------------------------------------------------------


function lowerArm()
{
    var s = scale(LOWER_ARM_WIDTH, LOWER_ARM_HEIGHT, LOWER_ARM_WIDTH);
    var instanceMatrix = mult( translate( 0.0, 0.5 * LOWER_ARM_HEIGHT, 0.0 ), s);

    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv( modelViewMatrixLoc,  false, flatten(t)   );
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );

}


function blade(angle_blade) {
    var s = scale(BLADE_WIDTH, BLADE_LENGTH, BLADE_TICKNESS);
    var instanceMatrix = mult(rotate(angle_blade, vec3(0, 0, 1)), s);
    instanceMatrix = mult(translate(0.0, -0.6, 0.0), instanceMatrix);
    
    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(t));
    gl.drawArrays(gl.TRIANGLES, 0, NumVertices);
}



//----------------------------------------------------------------------------


function cylinder() {
    var s = scale(CYLINDER_LENGTH, CYLINDER_HEIGHT, CYLINDER_WIDTH);
    var instanceMatrix = mult( translate( 0.0, 0.5 * CYLINDER_HEIGHT, 0.0 ), s);

    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc,  false, flatten(t)  );
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );
}


//----------------------------------------------------------------------------

function render() {

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
    
    //Membuat Base dan sedikit diturunkan
    modelViewMatrix = rotate(theta[Base], vec3(0, 1, 0 ));
    modelViewMatrix = mult(modelViewMatrix, translate(0.0, -7.0, 0.0));
    base();
    
    //Membuat Lower Stand untuk Kipas
    modelViewMatrix = mult(modelViewMatrix, translate(0.0, BASE_HEIGHT, 0.0));
    modelViewMatrix = mult(modelViewMatrix, rotate(theta[LowerArm], vec3(0, 0, 1 )));
    lowerArm();

    //Membuat Upper Stand Untuk Kipas
    modelViewMatrix  = mult(modelViewMatrix, translate(0.0, LOWER_ARM_HEIGHT, 0.0));
    modelViewMatrix  = mult(modelViewMatrix, rotate(theta[UpperArm], vec3(0, 0, 1)) );
    upperArm();

    //Membuah Silinder atau dinamo
    modelViewMatrix  = mult(modelViewMatrix, translate(0.0, UPPER_ARM_HEIGHT, 0.0));
    modelViewMatrix  = mult(modelViewMatrix, rotate(theta[Cylinder], vec3(1, 0, 0)) );
    modelViewMatrix  = mult(modelViewMatrix, rotate(swingAngle, vec3(0, 1, 0)) );
    cylinder();

    //Membuat 4 Bilah kipas
    modelViewMatrix  = mult(modelViewMatrix, translate(0.0, CYLINDER_HEIGHT, 1.3));
    for (var i = 0; i < NUM_BLADES; i++) {
        var angle_blade = (360 / NUM_BLADES) * i + rotationAngle;
        blade(angle_blade);
    }


    // Menentukan arah swing dari silinder kanan atau kiri
    if (swingAngle > 71) {
        swingDirection = false;
    }

    if (swingAngle < -71) {
        swingDirection = true
    }
    if (swingDirection) {
        swingAngle += speedSwing;
    } else {
        swingAngle -= speedSwing;
    }
    
    rotationAngle += speedBlade;
    requestAnimationFrame(render);
}
