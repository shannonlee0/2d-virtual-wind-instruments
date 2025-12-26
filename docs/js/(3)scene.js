// everything to do with the singular initialized Grid called "scene" (that is the simulation)

const canvas = document.getElementById("simulation-surface");
canvas.height = 110;
canvas.width = 220;

canvas.tabIndex = 0;

const gl = getWebGL(canvas);
gl.viewport(0, 0, canvas.width, canvas.height);

// re-render every n = numSteps steps
const numSteps = 1;
let numVals = 4000;

// microphone location
let mic = {
    i: Math.trunc(2),
    j: Math.trunc(2),
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
        scene.stepPressure();
        scene.stepVelocity();
        
        // source
        instrument.applySource();
        
        // listener
        mic.values.push(scene.p[mic.i][mic.j]);
        // mic.values.push(scene.p1[mic.i][mic.j]);
        // scene.p0 = scene.p1;
        // scene.p1 = scene.p2;

        scene.frame++
    }
    writeMicValues(numVals);
    console.log(numVals);
}

function update() {
    if (scene.play) {
        simulate();
    }

    // update colors before draw
    scene.mapPressure();
    scene.colorConstants(mic, instrument.source, instrument.toneholes);
    if (visualizePML) {
        scene.mapPML();
    }
    draw();
    requestAnimationFrame(update);
}

function changeInstrument(choice) {
    scene.reset();
    
    switch (choice) {
        case "clarinet":
            instrument = new Clarinet();
            break;
        case "recorder":
            instrument = new Recorder();
            break;
        case "blank":
            instrument = new Blank();
            break;
        default:
            instrument = new Clarinet();
    }

}