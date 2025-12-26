// instruments classes defined here

let amp = 20;
let freq = 1100;
let pm = 1800;

class Clarinet {
    constructor(boreLength = 90) {
        this.boreLength = boreLength;
        this.source = {
            i: Math.trunc(gridHeight / 2) + 1,
            j: Math.trunc(gridWidth / 2) - (this.boreLength + 6) / 2,
            height: 3
        }

        for (let j = 0; j < this.boreLength; j++) {
            scene.drawInstrument(this.source.i - 1, this.source.j + j);
            scene.drawInstrument(this.source.i + this.source.height, this.source.j + j);
            if (j > 4) {
                scene.drawInstrument(this.source.i - 2, this.source.j + j);
                scene.drawInstrument(this.source.i + this.source.height + 1, this.source.j + j);
            }
        }

        // bell
        // displacement from bore wall vs distance from end of bore
        const bellValues = [1, 2, 2, 2, 2, 3, 3];
        for (let j = 0; j < bellValues.length; j++) {
            scene.drawInstrument(this.source.i - 1 - bellValues[j], this.source.j + boreLength + j);
            scene.drawInstrument(this.source.i + this.source.height + bellValues[j], this.source.j + boreLength + j);
            if (j == 0 || j == 4 || j == 6) {
                scene.drawInstrument(this.source.i - 2 - bellValues[j], this.source.j + boreLength + j);
                scene.drawInstrument(this.source.i + this.source.height + bellValues[j] + 1, this.source.j + boreLength + j);
            }
        }

        // array of {key=i: value=leftmost i-coord, key=j: value=leftmost j-coord, key=length, value=length of tonehole}
        this.toneholes = [];

        // lower tonehole
        this.toneholes.push({i: 1 + this.source.i + this.source.height, j: this.source.j + 12, length: 4})
        for (let length = 0; length < 5; length++) {
            drawToneholes(1 + this.source.i + this.source.height, this.source.j + 12 + length);
        }
        for (let length = 0; length < 7; length++) {
            scene.drawAir(this.source.i + this.source.height, this.source.j + 12 + length - 1);
        }

        // top toneholes
        const toneholeJ = [38, 48, 54, 65, 75];
        for (let n = 0; n < 5; n++) {
            this.toneholes.push({i: this.source.i - 2, j: this.source.j + toneholeJ[n], length: 1})
            for (let length = 0; length < 2; length++) {
                drawToneholes(this.source.i - 2, this.source.j + toneholeJ[n] + length);
            }
            for (let length = 0; length < 4; length++) {
                scene.drawAir(this.source.i - 1, this.source.j + toneholeJ[n] + length - 1);
                if (length == 0 || length == 3) {
                    scene.drawInstrument(this.source.i - 3, this.source.j + toneholeJ[n] + length - 1)
                }
            }
        }

        this.pmax = 10;
    }

    applySource() {
        // mouth pressure pm, bore pressure bp
        // jet width wj
        // reed gap E [0, hr] (where hr is resting aperture)
        // reed elasticity kr

        let pb = scene.p[this.source.i + Math.trunc(this.source.height / 2)][this.source.j + 2];

        const wj = 1.2 * 10**(-2);
        const hr = 6 * 10**(-4);
        const kr = 8 * 10**(6);

        // the smaller deltaP, the greater the reed gap
        let deltaP = pm - pb;
        if (deltaP < 0) { deltaP = 0; }

        // pressure difference at which reed gap = 0
        const deltaPMax = kr * hr;

        // reed aperture factor E [0, 1]: factor = 0 -> reed fully closed
        let gapFactor = (1 - (deltaP / deltaPMax));

        // particle velocity due to steady-state Bernoulli equation (incompressible flow assumed)
        let vp = (2 * deltaP / RHO) ** (1/2);

        // calculate volume flow into bore ub to find velocity of bore cells vb
        let ub = wj * hr * gapFactor * vp;

        // vb = ub / H / dx / (number of drawn excitation cells)
        let vb = ub / (0.025 * dx * this.source.height);
        
        for (let n = 0; n < this.source.height; n++) {
            if (scene.frame > 4) {
                scene.p[this.source.i + n][this.source.j] = 0;
                scene.geometry[this.source.i + n][this.source.j] = true;
                continue;
            }
            scene.vx[this.source.i + n][this.source.j] = vb;
            scene.geometry[this.source.i + n][this.source.j] = true;
        }
    }
}

class Recorder {
    constructor(boreLength = 120) {
        this.boreLength = boreLength;
    
        // source location (top)
        this.source = {
            i: Math.trunc(gridHeight / 2) + 2,
            j: Math.trunc(gridWidth / 2) - (this.boreLength) / 2,
            height: 4
        }

        // hard coding geometry
        // bore
        for (let j = 0; j < this.boreLength; j++) {
            scene.drawInstrument(this.source.i - 1, this.source.j + j);
            scene.drawInstrument(this.source.i + this.source.height, this.source.j + j);
        }
        scene.drawAir(this.source.i - 1, this.source.j + 5);
        scene.drawAir(this.source.i - 1, this.source.j + 6);

        // array of {key=i: value=leftmost i-coord, key=j: value=leftmost j-coord, key=length, value=length of tonehole}
        this.toneholes = [];

        const toneholeJ = [40, 50, 60, 70, 80, 90, 100];
        for (let n = 0; n < 7; n++) {
            this.toneholes.push({i: this.source.i - 1, j: this.source.j + toneholeJ[n], length: 1})
            for (let length = 0; length < 2; length++) {
                drawToneholes(this.source.i - 1, this.source.j + toneholeJ[n] + length);
            }
        }

        this.etaValues = new Float32Array(1000);
        this.write = 0;

        this.pmax = 8000;
        console.log("pm", pm);
    }

    applySource() {
        // flute geometry constants:
        // distance from flue exit to labium edge dl
        const dl = 1 * 10 ** (-2);
        // jet speed coefficient aj
        const aj = 0.4;
        // labium vertical offset yl
        const yl = 3 * 10 ** (-4);
        // width of flue hf
        const hf = 1 * 10 ** (-3);

        // idk what bj should be 
        const bj = 0.0003;


        // particle velocity of the jet at flue exit vj
        let vj = (2 * pm / RHO) ** (1/2);
        //console.log("vj", vj);

        // sample vx in bore, vb
        let samplevb = scene.vx[this.source.i + 1][this.source.j + 1];
        //console.log("samplevb", samplevb);

        // time delay from flue exit to labium edge tau
        let tau = dl / aj / vj;
        //console.log("tau", tau);


        // making delay line for eta(t - tau)
        // delay is the index offset
        const delay = Math.round(tau / dt);
        // it's 54.2 ish
        //console.log("delay", delay);

        // jet deflection (displacement from center line) eta
        let eta = (samplevb / vj) * hf;
        //console.log("ETA", eta);
        instrument.etaValues[instrument.write] = eta;
        let read = (instrument.write - delay + instrument.etaValues.length) % instrument.etaValues.length;
        let etaLabium = instrument.etaValues[read];
        //console.log("eta labium", etaLabium);
        //onsole.log("etaValues", instrument.etaValues);
        instrument.write = (instrument.write + 1) % instrument.etaValues.length;

        // dx * bore length which is manually 100 rn
        const height = dx * 100;

        // volume flow into bore ub
        let ub = -(bj * vj * height) / dx * Math.tanh((etaLabium - yl) / bj);
        //console.log("ub", ub);
        // i think the problem is that eta labium is not oscillating correctly
        // blows up when the second term (tanh term) is stuck at 1

        let vb = ub / (1 * dx * this.source.height);
        //console.log("vb", vb);
        const val = 1;
        const noise = Math.random() * val - (val / 2);
        for (let n = 0; n < this.source.height; n++) {
            scene.vx[this.source.i + n][this.source.j] = vb + noise;
            scene.geometry[this.source.i + n][this.source.j] = true;
        }
    }
}

class Monopole {
    constructor() {
        this.source = {
            i: Math.trunc(gridHeight / 2),
            j: Math.trunc(gridWidth / 2),
        }
        this.toneholes = [];
        this.pmax = 0.5;
    }

    applySource() {
        scene.p[this.source.i][this.source.j] = amp * Math.sin(scene.frame * dt * (2*Math.PI) * freq);
    }
}

class Dipole {
    constructor() {
        this.source = {
            i: Math.trunc(gridHeight / 2),
            j: Math.trunc(gridWidth / 2) - 15,
        }
        this.toneholes = [];
        this.pmax = 0.5;
    }

    applySource() {
        scene.p[this.source.i][this.source.j] = -amp * Math.sin(scene.frame * dt * (2*Math.PI) * freq);
        scene.p[this.source.i][this.source.j + 30] = amp * Math.sin(scene.frame * dt * (2*Math.PI) * freq);
    }
}

class Blank {
    constructor() {
        this.source = {
            i: Math.trunc(gridHeight / 2),
            j: Math.trunc(gridWidth / 3),
            height: 2
        }
        this.toneholes = [];
        this.pmax = 20;
    }

    applySource() {
        // mouth pressure pm, bore pressure bp
        // jet width wj
        // reed gap E [0, hr] (where hr is resting aperture)
        // reed elasticity kr

        let pb = scene.p[this.source.i + Math.trunc(this.source.height / 2)][this.source.j + 2];

        const wj = 1.2 * 10**(-2);
        const hr = 6 * 10**(-4);
        const kr = 8 * 10**(6);

        // the smaller deltaP, the greater the reed gap
        let deltaP = pm - pb;
        if (deltaP < 0) { deltaP = 0; }

        // pressure difference at which reed gap = 0
        const deltaPMax = kr * hr;

        // reed aperture factor E [0, 1]: factor = 0 -> reed fully closed
        let gapFactor = (1 - (deltaP / deltaPMax));

        // particle velocity due to steady-state Bernoulli equation (incompressible flow assumed)
        let vp = (2 * deltaP / RHO) ** (1/2);

        // calculate volume flow into bore ub to find velocity of bore cells vb
        let ub = wj * hr * gapFactor * vp;

        // vb = ub / H / dx / (number of drawn excitation cells)
        let vb = ub / (0.025 * dx * this.source.height);
        
        for (let n = 0; n < this.source.height; n++) {
            scene.vx[this.source.i + n][this.source.j] = vb;
            scene.geometry[this.source.i + n][this.source.j] = true;
        }
    }
}

function drawToneholes(i, j) {
        if (scene.geometry[i][j]) {
            scene.colorCell(i, j, "orange");
        }

        if (moves.length == 0 || moves[moves.length - 1][0] != i || moves[moves.length - 1][1] != j) {
            moves.push([i, j]);
        }
    }

function toggleTonehole(num) {
    const hole = instrument.toneholes[num - 1];
    hole.open = !hole.open;

    // if tonehole is opened
    if (hole.open) {
        for (let j = 0; j <= hole.length; j++) {
            scene.drawAir(hole.i, hole.j + j);
            scene.colorCell(hole.i-1, hole.j + j, "grey");
        }
    }

    // if tonehole is closed
    else if (!hole.open) {
        for (let j = 0; j <= hole.length; j++) {
            scene.drawInstrument(hole.i, hole.j + j);
            scene.colorCell(hole.i, hole.j + j, "orange");
        }
    }
}