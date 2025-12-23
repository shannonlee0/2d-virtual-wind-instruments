// resolution 1 is 110 x 220
const resolution = 1;
const gridHeight = 100 * resolution;
const gridWidth = 2 * gridHeight;

const C = 347.23;
const RHO = 1.176;
// const dt = 0.00000644679;
const dt = 0.00000644679;
const dx = 0.00383;

const pmlThicknessBoundary = 8 * resolution;
const pmlThicknessInstrument = 0;

class Grid {
    constructor(height, width) {
        this.height = height;
        this.width = width;

        // initialize empty grid
        const gridVertices = calculateGridVertices(verticalCoords(this), horizontalCoords(this), this);
        this.coordinates = initializeCoordinates(gridVertices, this);
        this.color = initializeColor(this);

        // initialize grid values - p0 = previous, p1 = current
        let values = initializeGridValues(this);
        this.p0 = values["0"];
        this.p1 = values["1"];

        // initialize geometry booleans
        this.geometry = initializeGeometry(this);

        // set up damping coefficients
        this.damping = initializeDamping(this);
        // just used same function
        this.Psi = initializeDamping(this);
        this.beta = this.geometry;
        this.dampBoundary(this);

        this.play = false;
        this.frame = 0;

        // gaussian initial condition
        const nx = this.width;
        const ny = this.height;
        // amplitude
        const a = 80;
        // width
        const sigma = nx / 100;
        const x0 = nx / 2;
        const y0 = ny / 2;

        for (let i = 10; i < ny-10; i++) {
            for (let j = 10; j < nx-10; j++) {
                let dx = j - x0;
                let dy = i - y0;
                this.p1[i][j] = a * Math.exp(-(dx*dx + dy*dy) / (2 * sigma * sigma));
            }
        }
    }

    peek(i, j, dir, val) {
        let a, b;
        switch (dir) {
            case "r":
                a = i, b = j+1;
                break;
            case "l":
                a = i, b = j-1;
                break;
            case "u":
                a = i-1, b = j;
                break;
            case "d":
                a = i+1, b = j;
                break;
            default:
                console.log("erm invalid dir");
                break;
            }

        if (this.hasOwnProperty(val)) {
            return this[val][a][b];
        }

        return console.log("erm no val");
    }

    stepPressure() {
        // adjust bounds to account for ghost cells
        for (let i = 1; i < this.height - 1; i++) {
            for (let j = 1; j < this.width - 1; j++) {

                const p1 = this.p1[i][j];
                const p1l = this.peek(i, j, "l", "p1");
                const p1r = this.peek(i, j, "r", "p1");
                const p1u = this.peek(i, j, "u", "p1");
                const p1d = this.peek(i, j, "d", "p1");

                const beta = this.beta[i][j];
                const betal = this.peek(i, j, "l", "beta");
                const betar = this.peek(i, j, "r", "beta");
                const betau = this.peek(i, j, "u", "beta");
                const betad = this.peek(i, j, "d", "beta");

                const sigma = this.damping[i][j];

                let lapl = (1 - Math.max(betal, beta))*(p1l - p1) +
                        (1 - Math.max(betar, beta))*(p1r - p1) +
                        (1 - Math.max(betad, beta))*(p1d - p1) +
                        (1 - Math.max(betau, beta))*(p1u - p1);
                
                if (beta < 1) {
                    lapl /= (1-beta);
                }

                if (sigma > 0) {
                    // left to right, up to down?
                    const grad_px = (p1r - p1l) / 2;
                    const grad_py = (p1u - p1d) / 2;

                    let grad = 0;
                    if (sigma > this.damping[i][j-1]) {
                        grad = grad_px;
                    }
                    else if (sigma > this.damping[i][j+1]) {
                        grad = -1 * grad_px;
                    }
                    else if (sigma > this.damping[i+1][j]) {
                        grad = grad_py;
                    }
                    else if (sigma > this.damping[i-1][j]) {
                        grad = -1 * grad_py;
                    }

                    //const Psi = (0.99 - sigma) * this.Psi[i][j] + (0.0625)*grad;
                    const Psi = 0;
                    // equation to artificially damp
                    let p2 = (2 - sigma*sigma) * p1 - (1 - sigma) * this.p0[i][j] + (C*dt/dx)**2 * (lapl - Psi);
                    p2 /= (1+sigma);

                    this.Psi[i][j] = Psi;
                    this.p0[i][j] = p2;
                }
                else {
                    //const Psi = 0.99 * this.Psi[i][j];
                    const Psi = 0;
                    const s_beta = beta*beta*beta;
                    const p2 = p1 + (1 - s_beta) * (p1 - this.p0[i][j]) + 
                        ((1 - s_beta) * (C*dt/dx)**2 + (s_beta / 4)) * (lapl - Psi);
                    
                    this.Psi[i][j] = Psi;
                    this.p0[i][j] = p2;
                }
            }
        }

        // want to swap pointers, but for js i think it's easier to just create temp var for now
        let ptemp = this.p0;
        this.p0 = this.p1;
        this.p1 = ptemp;

        console.log("Psi: ", this.Psi);
    }

    colorCell(i, j, choice) {
        // can take in [R, G, B] or color name
        const color = getColor(choice);
        this.color[i][j] = color;
    }

    mapPressure() {
        for (let i = 1; i < this.height - 1; i++) {
            for (let j = 1; j < this.width - 1; j++) {
                if (!this.geometry[i][j]) {
                    this.colorCell(i, j, pressureToColor(this.p1[i][j]));
                }
            }
        }
    }

    mapPML() {
        for (let i = 1; i < this.height - 1; i++) {
            for (let j = 1; j < this.width - 1; j++) {
                if (this.damping[i][j] > 0) {
                    this.colorCell(i, j, pmlToColor(this.damping[i][j]));
                }
            }
        }
    }

    drawInstrument(i, j) {
        if (i >= 0 && i < this.height && j >= 0 && j < this.width) {
            this.geometry[i][j] = true;
            this.colorCell(i, j, "white");
        }

        // push to moves queue
        if (moves.length == 0 || moves[moves.length - 1][0] != i || moves[moves.length - 1][1] != j) {
            moves.push([i, j]);
        }
    }

    drawAir(i, j) {
        this.colorCell(i, j, "black");
        this.geometry[i][j] = false;
    }

    getSigmas(instrumentI, instrumentJ, thickness) {
        // given an instrument cell ij, check every cell located in range of thickness
        // directly edit damping field
        const step = 1 / (thickness + 1);
        const n = 1;
        for (let i = 0; i <= thickness*2 + 1; i++) {
            for (let j = 0; j <= thickness*2 + 1; j++) {
                const trueIndexI = instrumentI - thickness + i;
                const trueIndexJ = instrumentJ - thickness + j;
                // get label that indicates closeness to outer boundary [0, 1, ..., 1, 0]
                // add one, then multiply by step
                if ((trueIndexI > 0 && trueIndexI < this.height - 1) && (trueIndexJ > 0 && trueIndexJ < this.width - 1)) {
                    this.damping[trueIndexI][trueIndexJ] = Math.max(0.5 * (step * Math.min(getLabel(i, thickness) + 1, getLabel(j, thickness) + 1)) ** n, this.damping[trueIndexI][trueIndexJ]);
                }
            }
        }
    }

    colorConstants(mic, source, toneholes) {
        // color mic and source
        //this.colorCell(mic.i, mic.j, "green");
        for (let n = 0; n < source.height; n++) {
            this.colorCell(source.i + n, source.j, "yellow");
        }
        for (let n = 0; n < toneholes.length; n++) {
            if (toneholes[n].open) {
                for (let k = 0; k <= toneholes[n].length; k++) {
                    this.colorCell(toneholes[n].i - 1, toneholes[n].j + k, "grey");
                }
            }    
        }
    }

    dampBoundary(grid) {
        const height = grid.height;
        const width = grid.width;
        for (let i = 0; i < height; i++) {
            for (let j = 0; j < width; j++) {
                // if on boundary
                if (i == 0 || i == height - 1 || j == 0 || j == width - 1) {
                    this.getSigmas(i, j, pmlThicknessBoundary);
                }
            }
        }
    }

    applyDipole(i1, j1, i2, j2) {
        this.p1[i1][j1] = -amp * Math.sin(scene.frame * dt * (2*Math.PI) * freq);
        this.p1[i2][j2] = amp * Math.sin(scene.frame * dt * (2*Math.PI) * freq);
    }

    reset() {
        const newScene = new Grid(gridHeight, gridWidth);
        scene = newScene;
        //const newInstrument = new Blank();
        //instrument = newInstrument;
    }
}

// for grid setup
// i think these should be class methods

function calculateGridVertices(vCoords, hCoords, grid) {
    const height = grid.height;
    const width = grid.width;
    let triangle = [];
    let topTriangleVertices = [];
    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            triangle = [hCoords[j], vCoords[i], hCoords[j + 1], vCoords[i], hCoords[j], vCoords[i + 1]];
            topTriangleVertices.push(...triangle);
        }
    }

    let bottomTriangleVertices = [];
    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            triangle = [hCoords[j + 1], vCoords[i], hCoords[j], vCoords[i + 1], hCoords[j + 1], vCoords[i + 1]];
            bottomTriangleVertices.push(...triangle);
        }
    }

    // combine top and bottom: first 6 is top triangle coords, next 6 is bottom triangle coords, etc.
    let vertices = [];
    for (let i = 0; i < topTriangleVertices.length; i++) {
        vertices.push(...topTriangleVertices.slice(6 * i, 6 * i + 6));
        vertices.push(...bottomTriangleVertices.slice(6 * i, 6 * i + 6));
    }
    return vertices;
}

function initializeCoordinates(allVertices, grid) {
    const height = grid.height;
    const width = grid.width;
    // returns coordinates 2d arr: cell-ij = [x1, y1, ..., x6, y6]
    let coordinates = [];
    for (let i = 0; i < height; i++) {
        coordinates[i] = [];
        for (let j = 0; j < width; j++) {
            // each cell's vertices described in chunks of 12
            coordinates[i][j] = allVertices.slice(12 * (width * i + j), 12 * (width * i + j) + 12);
        }
    }
    return coordinates;
}

function initializeColor(grid) {
    const height = grid.height;
    const width = grid.width;
    let color = [];
    for (let i = 0; i < height; i++) {
        color[i] = [];
        for (let j = 0; j < width; j++) {
            // default color is black
            const black = [0, 0, 0];
            color[i][j] = black;
        }
    }
    return color;
}

function getVertices(coordinates, color, grid) {
    const height = grid.height;
    const width = grid.width;
    // combine coordinate and color arrays: [x1, y2, R, G, B, ..., x6, y6, R, G, B]
    let vertices = [];
    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            for (let k = 0; k < 6; k++) {
                vertices.push(...coordinates[i][j].slice(k*2, k*2 + 2));
                vertices.push(...color[i][j]);
            }
        }
    }
    return vertices;
}

// returns object with zeroed grids p0, p1
function initializeGridValues(grid) {
    const height = grid.height;
    const width = grid.width;

    // n x m pressure grid
    let p0 = [];
    for (let i = 0; i < height; i++) {
        p0[i] = [];
        for (let j = 0; j < width; j++) {
            p0[i][j] = 0;
        }
    }

    // n x m pressure grid
    let p1 = [];
    for (let i = 0; i < height; i++) {
        p1[i] = [];
        for (let j = 0; j < width; j++) {
            p1[i][j] = 0;
        }
    }

    const values = {
        0: p0,
        1: p1
    };

    return values;
}

function initializeGeometry(grid) {
    const height = grid.height;
    const width = grid.width;

    // 2d array of booleans: true indicates solid cell, false indicates air cell
    // edit: making to floats
    let geometry = [];
    for (let i = 0; i < height; i++) {
        geometry[i] = [];
        for (let j = 0; j < width; j++) {
            geometry[i][j] = 0.0;
        }
    }
    return geometry;
}

function initializeDamping(grid) {
    const height = grid.height;
    const width = grid.width;

    let damping = [];
    for (let i = 0; i < height; i++) {
        damping[i] = [];
        for (let j = 0; j < width; j++) {
            damping[i][j] = 0;
        }
    }
    return damping;
}