let draggingInstrument = false;
let draggingMic = false;
let draggingSource = false;
let hatch = false;
let draggingToneholes = false;

let visualizePML = false;

let mouseI = 0;
let mouseJ = 0;
let length = 0;

canvas.addEventListener("keydown", function (event) {
    event.preventDefault();
    // restart
    if (event.code === "KeyR") {
        scene.reset();
    }

    // undo
    if (event.code === "KeyZ" && moves.length > 0) {
        const pair = moves.pop();
        scene.drawAir(pair[0], pair[1]);
    }

    // play/pause
    if (event.code === "Space") {
        scene.play = !scene.play;
    }


    // toggle toneholes
    if (event.code.startsWith("Digit")) {
        const num = parseInt(event.code.replace("Digit", ""), 10);
        if (num <= instrument.toneholes.length) {
            toggleTonehole(num);
        } 
    }
});

// create instrument geometry
canvas.addEventListener("mousedown", function (event) {
    mouseI = findCell(scene)[0];
    mouseJ = findCell(scene)[1];
    if (event.shiftKey && scene.geometry[mouseI][mouseJ]) {
        draggingToneholes = true;
        drawToneholes(mouseI, mouseJ);
        hole = {
            i: mouseI, 
            j: mouseJ,
            length: 0,
            open: false
        }
    }
    else if (mouseI == mic.i && mouseJ == mic.j) {
        console.log("mic contact");
        draggingMic = true;
    }
    else if (mouseI >= instrument.source.i && mouseI <= instrument.source.i + instrument.source.height && mouseJ == instrument.source.j) {
        console.log("source contact");
        draggingSource = true;
        
    }
    else {
        draggingInstrument = true;
        scene.drawInstrument(mouseI, mouseJ);
    }
});

canvas.addEventListener("mousemove", function (event) {
    mouseI = findCell(scene)[0];
    mouseJ = findCell(scene)[1];
    if (draggingMic) {
        mic = {
            i: mouseI,
            j: mouseJ,
            values: mic.values
        }
    }
    else if (draggingSource) {
        instrument.source = {
            i: mouseI, 
            j: mouseJ,
            height: instrument.source.height
        }
    }
    else if (draggingInstrument) {
        scene.drawInstrument(mouseI, mouseJ);
    }
    else if (draggingToneholes) {
        drawToneholes(mouseI, mouseJ);
        if (scene.geometry[mouseI][mouseJ]) {
            length = mouseJ - hole.j;
        }
    }
    else if (hatch) {
        crossHatch(mouseI, mouseJ, scene);
    }
});

canvas.addEventListener("mouseup", function (event) {
    draggingInstrument = false;
    draggingMic = false;
    draggingSource = false;

    if (draggingToneholes) {
        hole.length = length;
        instrument.toneholes.push(hole);
        draggingToneholes = false;
        console.log(instrument.toneholes);
    }
});