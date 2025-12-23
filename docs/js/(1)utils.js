let moves = [];

function toClipCoords(val, axis) {
    // takes in pixel coordinates, converts to clip coordinates
    let clip;
    switch (axis) {
        case "x":
            clip = (val / rect.right) * 2 - 1;
            clip *= 1;
            break;
        case "y":
            clip = -((val / rect.bottom) * 2 - 1);
            break;
    }
    return clip;
}

function findCell(grid) {
    // returns the ij-coordinates of cell clicked
    const clipX = ((event.clientX - rect.left) / canvas.width) * 2 - 1;
    const clipY = -(((event.clientY - rect.top) / canvas.height) * 2 - 1);

    const i = upperGridIndex(clipY, grid);
    const j = lowerGridIndex(clipX, grid);

    return [i, j];
}

function lowerGridIndex(value, grid) {
    // returns array item "left" of value on number line
    // use to get i-coordinate of cell
    const arr = horizontalCoords(grid);
    let diff = 2;
    let lower = 0;
    for (let i = 0; i < arr.length; i++) {
        if (Math.abs(value - arr[i]) < diff && value - arr[i] > 0) {
            diff = Math.abs(value - arr[i]);
            lower = i;
        }
    }
    return lower;
}

function upperGridIndex(value, grid) {
    // returns array item "above" value on number line
    // use to get j-coordinate of cell
    const arr = verticalCoords(grid);
    let diff = 2;
    let lower = 0;
    for (let i = 0; i < arr.length; i++) {
        if (Math.abs(value - arr[i]) < diff && value - arr[i] < 0) {
            diff = Math.abs(value - arr[i]);
            lower = i;
        }
    }
    return lower;
}

function verticalCoords(grid) {
    // get vertical grid coordinate values
    const height = grid.height;
    let vCoords = [];
    const vIndent = (rect.bottom - rect.top) / height;
    for (let i = 0; i < height + 1; i++) {
        vCoords.push(toClipCoords(rect.top + vIndent * i, "y"));
    }
    return vCoords;
}

function horizontalCoords(grid) {
    // get horizontal grid coordinate values
    const width = grid.width;
    let hCoords = [];
    const hIndent = (rect.right - rect.left) / width;
    for (let i = 0; i < width + 1; i++) {
        hCoords.push(toClipCoords(rect.left + hIndent * i, "x"));
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