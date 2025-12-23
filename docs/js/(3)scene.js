const canvas = document.getElementById("simulation-surface");
canvas.tabIndex = 0;
canvas.focus();

const rect = canvas.getBoundingClientRect();
const gl = getWebGL(canvas);
    
let scene = new Grid(gridHeight, gridWidth);

// re-render every n = numSteps steps
const numSteps = 1;
let numVals = 4000;

// microphone location
let mic = {
    i: Math.trunc(10),
    j: Math.trunc(10),
    values: []
}

function getWebGL(canvas) {
    var gl = canvas.getContext('webgl');

    if (!gl) {
        console.log("webGL not supported, so experimental");
        gl = canvas.getContext('experimental-webgl')
    }

    if (!gl) {
        alert('browser doesnt support webgl');
    }
    return gl;
}

function simulate() {
    console.log("frame:", scene.frame);
    for (let i = 0; i < numSteps; i++) {
        // step values
        // note: put source application after stepping the value to be overwritten?
        //instrument.applySource();
        scene.stepPressure();
        // scene.stepVelocity();
        
        // source
        //instrument.applySource();
        
        // listener
        mic.values.push(scene.p1[mic.i][mic.j]);
        // scene.p0 = scene.p1;
        // scene.p1 = scene.p2;

        scene.frame++
    }
    writeMicValues(numVals);
    console.log(numVals);
}

function update() {
    if (scene.play) {
        console.log(scene);
        simulate();
    }

    // update colors before draw
    scene.mapPressure();
    scene.colorConstants(mic, instrument.source, instrument.toneholes);
    if (visualizePML) {
        scene.mapPML();
    }
    draw();

    canvas.focus();
    requestAnimationFrame(update);
}