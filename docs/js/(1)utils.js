// convention: i, j = 0, 0 at top left. i is v axis, j h
let moves = [];
let description;

function findCell(grid) {
    const visualWidth = canvas.offsetWidth;
    const visualHeight = canvas.offsetHeight;

    const rect = canvas.getBoundingClientRect();
    const mouseRelX = event.clientX - rect.left;
    const mouseRelY = event.clientY - rect.top;

    const j = Math.floor((mouseRelX / visualWidth) * canvas.width);
    const i = Math.floor((mouseRelY / visualHeight) * canvas.height);
    return [i, j];
}

function verticalCoords(grid) {
    // get vertical grid coordinate values
    const height = grid.height;
    let vCoords = [];
    const vIndent = canvas.height / height;
    for (let i = 0; i < height + 1; i++) {
        // account for clip coordinates
        // ((coord) / height)*2 - 1
        vCoords.push(-1*(((vIndent*i) / height)*2 - 1));
    }
    return vCoords;
}

function horizontalCoords(grid) {
    // get horizontal grid coordinate values
    const width = grid.width;
    let hCoords = [];
    const hIndent = canvas.width / width;
    for (let i = 0; i < width + 1; i++) {
        hCoords.push(((hIndent*i) / width)*2 - 1);
    }
    return hCoords;
}

function pressureToColor(pressure) {
    // given pressure, normalize st beta E [-1, 1]
    // i dont know what pmax should be
    const beta = pressure / instrument.pmax;
    // const beta = pressure;
    if (beta <= 0) {
        return [0, 0, -beta];
    }
    return [beta, 0, 0];
}

function pmlToColor(sigma) {
    // given pressure, normalize st beta E [-1, 1]
    // i dont know what pmax should be
    const sigmaMax = 10;
    const beta = sigma / sigmaMax;
    return [0, sigma, 0];
}

function getLabel(index, thickness) {
    // created as a helper to get damping values

    return (-1 * Math.abs(index - thickness)) + thickness;
}

function writeMicValues(length) {
    // writes mic values as a .txt file to feed into write_wav.py
    if (scene.frame == length) {
        const text = (1 / dt) + "\n" + mic.values.join("\n");
        const blob = new Blob([text], { type: "text/plain" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = "newmicvalues.txt";
        link.click();
    }
}

function getColor(choice) {
    let color;
    switch (choice) {
        case "white":
            color = [1, 1, 1];
            break;
        case "black":
            color = [0, 0, 0];
            break;
        case "yellow":
            color = [1, 1, 0];
            break;
        case "orange":
            color = [1, 0.6, 0];
            break;
        case "green":
            color = [0, 1, 0];
            break;
        case "grey":
            color = [0.6, 0.6, 0.6];
            break;
        default:
            color = choice;
            break;
    }
    return color;
}

function crossHatch(mouseI, mouseJ, grid) {
    console.log("doing now");
    // why doesnt this stop when hatch is false ?????????
    for (let i = pmlThicknessBoundary; i < grid.height - pmlThicknessBoundary; i++) {
        if (!grid.geometry[i][mouseJ]) {
            grid.colorCell(i, mouseJ, "grey");
        }
    }

    for (let j = pmlThicknessBoundary; j < grid.width - pmlThicknessBoundary; j++) {
        if (!grid.geometry[mouseI][j]) {
            grid.colorCell(mouseI, j, "grey");
        }
    }
}