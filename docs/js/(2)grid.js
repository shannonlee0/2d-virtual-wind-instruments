// Grid class contains all values

const gridHeight = 110;
const gridWidth = 2 * gridHeight;

const C = 347.23;
const RHO = 1.176;
const dt = 0.00000644679;
const dx = 0.00383;

const pmlThicknessBoundary = 8;
const pmlThicknessInstrument = 0;

class Grid {
    constructor(height, width) {
        this.height = height;
        this.width = width;

        // initialize empty grid
        const gridVertices = calculateGridVertices(verticalCoords(this), horizontalCoords(this), this);
        this.coordinates = initializeCoordinates(gridVertices, this);
        this.color = initializeColor(this);

        // initialize grid values
        let values = initializeGridValues(this);
        this.p = values["pressure"];
        this.vx = values["velocityX"];
        this.vy = values["velocityY"];

        // initialize geometry booleans
        this.geometry = initializeGeometry(this);

        // set up damping coefficients
        this.damping = initializeDamping(this);
        this.dampBoundary(this);

        this.play = false;
        this.frame = 0;

        const nx = this.width;
        const ny = this.height;

        // gaussian initial condition
        const a = 0.8;              // amplitude
        const sigma = nx / 10;      // width (adjust as needed)
        const x0 = nx / 2;
        const y0 = ny / 2;

        for (let i = 0; i < ny; i++) {
            for (let j = 0; j < nx; j++) {
                let dx = j - x0;
                let dy = i - y0;
                //this.p[i][j] = a * Math.exp(-(dx*dx + dy*dy) / (2 * sigma * sigma));
            }
        }
        this.p[2][2] = 1;
    }

    stepPressure() {
        // adjust bounds to account for ghost cells
        for (let i = 1; i < this.height - 1; i++) {
            for (let j = 1; j < this.width - 1; j++) {
                let div_v = (this.vx[i][j] - this.vx[i][j - 1] + this.vy[i][j] - this.vy[i - 1][j]) / dx
                if (!this.geometry[i][j]) {
                    this.p[i][j] = ((-RHO * C * C * div_v * dt) + this.p[i][j]) / (1 + this.damping[i][j]);
                }
            }
        }
    }
    
    stepVelocity() {
        // adjust bounds to account for ghost cells and extra cell due to staggered grid
        // vx
        for (let i = 1; i < this.height - 1; i++) {
            for (let j = 0; j < this.width - 1; j++) {
                if (!this.geometry[i][j] && !this.geometry[i][j + 1]) {
                    let grad_p_x = (this.p[i][j + 1] - this.p[i][j]) / dx
                    this.vx[i][j] = (-1 / RHO * dt * grad_p_x + this.vx[i][j]) / (1 + this.damping[i][j]);
                }
            }
        }

        // vy
        for (let i = 0; i < this.height - 1; i++) {
            for (let j = 1; j < this.width - 1; j++) {
                if (!this.geometry[i][j] && !this.geometry[i + 1][j]) {
                    let grad_p_y = (this.p[i + 1][j] - this.p[i][j]) / dx
                    this.vy[i][j] = (-1 / RHO * dt * grad_p_y + this.vy[i][j]) / (1 + this.damping[i][j]);
                }
            }    
        }
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
                    this.colorCell(i, j, pressureToColor(this.p[i][j]));
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
        for (let i = 0; i <= thickness*2 + 1; i++) {
            for (let j = 0; j <= thickness*2 + 1; j++) {
                const trueIndexI = instrumentI - thickness + i;
                const trueIndexJ = instrumentJ - thickness + j;
                // get label that indicates closeness to outer boundary [0, 1, ..., 1, 0]
                // add one, then multiply by step
                if ((trueIndexI > 0 && trueIndexI < this.height - 1) && (trueIndexJ > 0 && trueIndexJ < this.width - 1)) {
                    this.damping[trueIndexI][trueIndexJ] = Math.max(0.5 * step * Math.min(getLabel(i, thickness) + 1, getLabel(j, thickness) + 1), this.damping[trueIndexI][trueIndexJ]);
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
        this.p[i1][j1] = -amp * Math.sin(scene.frame * dt * (2*Math.PI) * freq);
        this.p[i2][j2] = amp * Math.sin(scene.frame * dt * (2*Math.PI) * freq);
    }

    reset() {
        const newScene = new Grid(gridHeight, gridWidth);
        scene = newScene;
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

function initializeGridValues(grid) {
    const height = grid.height;
    const width = grid.width;

    // n x m pressure grid
    let p = [];
    for (let i = 0; i < height; i++) {
        p[i] = [];
        for (let j = 0; j < width; j++) {
            p[i][j] = 0;
        }
    }

    // staggered grid: n x (m + 1) vx grid, and an
    let vx = [];
    for (let i = 0; i < height; i++) {
        vx[i] = [];
        for (let j = 0; j < width + 1; j++) {
            vx[i][j] = 0;
        }
    }
    // (n + 1) x m vy grid
    let vy = [];
    for (let i = 0; i < height + 1; i++) {
        vy[i] = [];
        for (let j = 0; j < width; j++) {
            vy[i][j] = 0;
        }
    }

    const values = {
        pressure: p,
        velocityX: vx,
        velocityY: vy
    };

    return values;
}

function initializeGeometry(grid) {
    const height = grid.height;
    const width = grid.width;

    // 2d array of booleans: true indicates solid cell, false indicates air cell
    let geometry = [];
    for (let i = 0; i < height; i++) {
        geometry[i] = [];
        for (let j = 0; j < width; j++) {
            geometry[i][j] = false;
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