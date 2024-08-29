class HexList {
    constructor(hexes) {
        this.tackGuide = {
            '-1': 0,
            '0': 0,
            '1': 0,
            '2': 1,
            '3': 2,
            '4': 3,
            '5': 4,
            '6': 5,
            '7': 0,
            '8': 5,
            '9': 4,
            '10': 3,
            '11': 2,
            '12': 1
        }
        this.resourceGuide = {
            'brick': 'red',
            'wood': 'green',
            'sheep': 'lightgreen',
            'wheat': 'yellow',
            'ore': 'lightblue',
            'desert': 'gold',
            'none': 'rgba(255,255,255,0)',
            'hover': 'rgba(0,0,0,0.2)',
            'selected': 'rgba(211, 189, 225,0.3)'
        }
        this.hexes = hexes;
        this.neighbours = {};
        this.corners = [];
        this.r = 50;
        this.h = Math.sqrt(3);
        this.update();
    }
    editHex(x, y, resource, value) {
        this.hexes[`${x},${y}`] = [resource, value];
        this.update();
        localStorage.setItem("catanBoard", JSON.stringify(this.hexes));
    }
    update() {
        for (let coords in this.hexes) {
            let [hx, hy] = coords.split(',').map(a => +a);
            this.neighbours[coords] = this.getNeighbours(hx, hy);
        }
        this.corners = this.getAllCorners().sort((a, b) => b[2] - a[2]);
    }
    getHex(x, y) {
        return this.hexes[`${x},${y}`] || null;
    }
    getNeighbours(x, y) {
        let neighbours = [];
        for (let i = -1; i < 2; i++) for (let j = -1; j < 2; j++) if (i !== j) neighbours.push(this.getHex(x + i, y + j));
        return [neighbours[0], neighbours[2], neighbours[4], neighbours[5], neighbours[3], neighbours[1]].map(a => a !== null ? a[1] : null); // top left hex clockwise
    }
    getTotalTacks(x, y, n) { // top left point clockwise
        let neighbours = this.neighbours[`${x},${y}`], hex = this.getHex(x, y);
        if (n > 5 || !hex) return 0;
        else if (n === 5) return this.sumHexes(neighbours[5], neighbours[0], hex[1]);
        else return this.sumHexes(neighbours[n], neighbours[n + 1], hex[1]);
    }
    getAllCorners() {
        let corners = [];
        for (let coords in this.hexes) {
            let neighbours = this.neighbours[coords],
                [hx, hy] = coords.split(',').map(a => +a);
            corners.push(this.calculateCorner(hx, hy, 0));
            corners.push(this.calculateCorner(hx, hy, 1));
            if (neighbours[4] === null) {
                corners.push(this.calculateCorner(hx, hy, 3));
                corners.push(this.calculateCorner(hx, hy, 4));
            }
            if (neighbours[5] === null && neighbours[0] === null) corners.push(this.calculateCorner(hx, hy, 5));
            if (neighbours[2] === null && neighbours[3] === null) corners.push(this.calculateCorner(hx, hy, 2));
        }
        return corners;
    }
    drawCorners(ctx) {
        for (let corner of this.corners) {
            let [x, y, v] = corner;
            x += innerWidth / 2;
            y += innerHeight / 2;
            ctx.beginPath();
            ctx.fillStyle = corner[2] > 9 ? 'rgba(138, 43, 226,0.7)' : 'rgba(49, 211, 152, 0.8)';
            ctx.arc(x, y, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = corner[2] > 9 ? 'rgb(235, 193, 226)' : 'rgb(49, 111, 152)';
            ctx.font = '15px Arial';
            ctx.fillText(v, x, y + 5);
        }
    }
    drawHex(ctx, hx, hy, resource, value) {
        let r = this.r,
            h = this.h * r / 2,
            x = hx * 1.5 * r + innerWidth / 2,
            y = hy * 2 * h + innerHeight / 2 + hx * h;
        ctx.beginPath();
        ctx.fillStyle = this.resourceGuide[resource];
        ctx.moveTo(x - r, y);
        ctx.lineTo(x - r / 2, y + h);
        ctx.lineTo(x + r / 2, y + h);
        ctx.lineTo(x + r, y);
        ctx.lineTo(x + r / 2, y - h);
        ctx.lineTo(x - r / 2, y - h);
        ctx.lineTo(x - r, y);
        ctx.closePath();
        if (resource === "selected") {
            ctx.lineWidth = 4;
            ctx.strokeStyle = 'rgba(255,255,255,0.6)';
            ctx.stroke();
        }
        else if (resource !== "hover") {
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'black';
            ctx.stroke();
        }
        ctx.fill();
        if (this.tackGuide[value] !== 0) {
            ctx.font = '30px monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = resource === 'brick' || resource === 'wood' ? 'rgb(255,255,255)' : 'rgb(0,0,0)';
            ctx.fillText(value, x, y + 7.5);
        }
    }
    calculateCorner(x, y, n) {
        let r = 50,
            h = Math.sqrt(3) * r / 2,
            vx = x * 1.5 * r,
            vy = y * 2 * h + x * h;
        switch (n) {
            case 0:
                vx -= r / 2;
                vy -= h;
                break;
            case 1:
                vx += r / 2;
                vy -= h;
                break;
            case 2:
                vx += r;
                break;
            case 3:
                vx += r / 2;
                vy += h;
                break;
            case 4:
                vx -= r / 2;
                vy += h;
                break;
            case 5:
                vx -= r;
                break;
        }
        return [vx, vy, this.getTotalTacks(x, y, n)];
    }
    sumHexes(...hexes) {
        return hexes.reduce((a, b) => b === null ? a : a + this.tackGuide[b], 0);
    }
    draw(ctx) {
        let hx, hy;
        for (let coords in this.hexes) {
            [hx, hy] = coords.split(',').map(a => +a);
            this.drawHex(ctx, hx, hy, ...this.hexes[coords])
        };
    }
}

let board = new HexList({
    '0,0': ['wood', 11], '-1,0': ['desert', -1], '0,-1': ['wood', 6], '1,-1': ['brick', 3],
    '1,0': ['wheat', 9], '0,1': ['wheat', 4], '-1,1': ['sheep', 5], '-1,-1': ['wheat', 12],
    '0,-2': ['ore', 11], '1,-2': ['wood', 4], '2,-2': ['wheat', 8], '2,-1': ['wood', 10],
    '2,0': ['brick', 5], '1,1': ['sheep', 2], '0,2': ['ore', 6], '-1,2': ['sheep', 3],
    '-2,2': ['sheep', 8], '-2,1': ['ore', 10], '-2,0': ['brick', 9]
}),
    selectedHex = [0, 0, 'brick', 11],
    showCorners = false,
    coordsBegin = null,
    pwidth = 0,
    pheight = 0,
    coordsMoved = [0, 0],
    coordsMoved2 = [0, 0],
    hovered = [10, 0];

const canvas = document.querySelector('canvas'),
    ctx = canvas.getContext('2d'),
    hexName = document.getElementById('hexName'),
    valueLabel = document.getElementById('valueLabel'),
    rangeValue = document.getElementById('value'),
    resources = document.getElementById('resources'),
    convertMouseToHex = e => {
        let dx = Math.round((e.clientX - coordsMoved[0] - innerWidth / 2) / (1.5 * 50)),
            dy = Math.round((e.clientY - coordsMoved[1] - innerHeight / 2 - dx * board.h * 50 / 2) / (2 * board.h * 50 / 2));
        return [dx, dy]
    },
    click = e => {
        if (coordsMoved[0] !== coordsMoved2[0] || coordsMoved[1] !== coordsMoved2[1]) return false;
        let [dx, dy] = convertMouseToHex(e),
            hex = board.getHex(dx, dy) || ['none', -1];
        selectedHex = [dx, dy, ...hex];
        hexName.innerText = `Hex (${dx},${dy})`;
        valueLabel.innerText = `Value: ${hex[1]}`;
        rangeValue.value = hex[1];
        resources.value = hex[0];
    },
    starting = e => {
        coordsBegin = [e.clientX, e.clientY];
        coordsMoved2 = [...coordsMoved];
    },
    movement = e => {
        if (coordsBegin !== null) coordsMoved = [coordsMoved2[0] + e.clientX - coordsBegin[0], coordsMoved2[1] + e.clientY - coordsBegin[1]];
        hovered = convertMouseToHex(e);
    },
    ending = e => coordsBegin = null,
    mobile = fn => e => fn(e.touches[0]),
    frame = () => {
        if (pwidth !== innerWidth || pheight !== innerHeight) {
            const dpr = devicePixelRatio;
            pwidth = innerWidth;
            pheight = innerHeight;
            canvas.style.width = innerWidth + 'px';
            canvas.style.height = innerHeight + 'px';
            canvas.width = Math.ceil(innerWidth * dpr);
            canvas.height = Math.ceil(innerHeight * dpr);
            ctx.scale(dpr, dpr);
        }
        ctx.save();
        ctx.fillStyle = '#019bdc';
        ctx.fillRect(0, 0, innerWidth, innerHeight);
        ctx.translate(...coordsMoved);
        board.draw(ctx, showCorners);
        board.drawHex(ctx, ...hovered, 'hover', -1);
        board.drawHex(ctx, selectedHex[0], selectedHex[1], 'selected', -1);
        if (showCorners) board.drawCorners(ctx);
        ctx.restore();
        requestAnimationFrame(frame);
    }

frame();

canvas.addEventListener('click', click);
canvas.addEventListener('mousedown', starting);
canvas.addEventListener('mousemove', movement);
canvas.addEventListener('mouseup', ending);
canvas.addEventListener('touchstart', mobile(starting));
canvas.addEventListener('touchmove', mobile(movement));
canvas.addEventListener('touchend', mobile(ending));
resources.addEventListener('input', () => {
    selectedHex[2] = resources.value;
    board.editHex(...selectedHex);
})
rangeValue.addEventListener('input', () => {
    selectedHex[3] = +rangeValue.value;
    valueLabel.innerText = `Value: ${rangeValue.value}`;
    board.editHex(...selectedHex);
})
document.getElementById('toggle').addEventListener('click', () => showCorners = !showCorners)
document.getElementById('loadSave').addEventListener('click', () => {
    let item = localStorage.getItem("catanBoard");
    if (item === null) return false;
    board.hexes = JSON.parse(item);
    board.update();
})