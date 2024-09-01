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
            'sheep': 'rgb(190, 228, 177)',
            'wheat': 'yellow',
            'ore': 'rgb(40, 214, 206)',
            'gold': 'gold',
            'desert': 'lightgreen',
            'none': 'rgba(255,255,255,0)',
            'hover': 'rgba(0,0,0,0.2)',
            'selected': 'rgba(211, 189, 225,0.3)'
        },
        this.cornerGuide = {
            'default':'',
            'settled':'',
            'enemy':'',
            'selection':''
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
        this.corners = this.getAllCorners();
        quickSort(this.corners, n => -n[2]);
    }
    deviation(...population){
        return population.map(a=>(a-11/3)**2).reduce((a,b)=>a+b)/population.length
    }
    isOdd(corner) {
        return corner[0] % 3 === 1 || corner[0] % 3 === -2;
    }
    areAdjacentCorners(cornerA, cornerB, equality = false) {
        if(equality && approximatelyEqual(cornerA[0], cornerB[0]) && approximatelyEqual(cornerA[1],cornerB[1])) return true;
        let C1 = this.isOdd(cornerA), C2 = this.isOdd(cornerB);
        if (C1 === C2) return false;
        let oddCorner = C1 ? cornerA : cornerB, evenCorner = C1 ? cornerB : cornerA;
        return (oddCorner[0] - this.r === evenCorner[0] && oddCorner[1] === evenCorner[1]) ||
            (oddCorner[0] + this.r / 2 === evenCorner[0] && (approximatelyEqual(oddCorner[1] + this.h * this.r / 2, evenCorner[1]) || approximatelyEqual(oddCorner[1] - this.h * this.r / 2, evenCorner[1])))
    }
    getHex(x, y) {
        return this.hexes[`${x},${y}`] || null;
    }
    getNeighbours(x, y) {
        let neighbours = [];
        for (let i = -1; i < 2; i++) for (let j = -1; j < 2; j++) if (i !== j) neighbours.push(this.getHex(x + i, y + j));
        return [neighbours[0], neighbours[2], neighbours[4], neighbours[5], neighbours[3], neighbours[1]]; // top left hex clockwise
    }
    getTotalTacks(x, y, n) { // top left point clockwise
        let neighbours = this.neighbours[`${x},${y}`], hex = this.getHex(x, y);
        if (n > 5) return 0;
        else if (n === 5) return this.sumHexes(neighbours[5], neighbours[0], hex);
        else return this.sumHexes(neighbours[n], neighbours[n + 1], hex);
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
    drawAllCorners(ctx) {
        for (let i = 0; i < this.corners.length; i++) this.drawCorner(ctx, this.corners[i], settling ? 10 : i, settling ? 2 : 0);
    }
    drawCorner(ctx, corner, i = 0, display = 0) {
        let [x, y, v] = corner;
        x += innerWidth / 2;
        y += innerHeight / 2;
        ctx.beginPath();
        ctx.fillStyle = display === 2 ? 'rgba(181, 194, 182, 0.8)' : display === 1 ? 'rgba(240, 119, 119, 0.5)' : 'rgba(49, 211, 152, 0.8)';
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.fill();
        if (i < 10) {
            ctx.fillStyle = `rgba(138, 43, 226,${1 - 0.7 * (i + 1) / 10})`;
            ctx.fill();
        }
        if (display === 0) {
            ctx.fillStyle = i < 10 ? 'rgb(235, 193, 226)' : 'rgb(49, 111, 152)';
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
        return [vx, vy, ...this.getTotalTacks(x, y, n)];
    }
    sumHexes(...hexes) {
        return [hexes.reduce((a, b) => b === null ? a : a + this.tackGuide[b[1]] * (b[0] === "gold" ? 2 : 1), 0), ...hexes];
    }
    draw(ctx) {
        let hx, hy;
        for (let coords in this.hexes) {
            [hx, hy] = coords.split(',').map(a => +a);
            this.drawHex(ctx, hx, hy, ...this.hexes[coords])
        };
    }
}
const templateCK = { "0,0": ["sheep", 11], "-1,0": ["ore", 6], "0,-1": ["wood", 10], "1,-1": ["brick", 5], "1,0": ["ore", 4], "0,1": ["wood", 5], "-1,1": ["wheat", 4], "-1,-1": ["brick", 12], "0,-2": ["wheat", 6], "1,-2": ["sheep", 3], "2,-2": ["wheat", 10], "2,-1": ["desert", -1], "2,0": ["wood", 8], "1,1": ["wheat", 11], "0,2": ["brick", 9], "-1,2": ["ore", 3], "-2,2": ["sheep", 8], "-2,1": ["wood", 2], "-2,0": ["sheep", 9], "-3,0": ["desert", -1], "-3,2": ["desert", -1], "-2,3": ["brick", -1], "0,3": ["sheep", -1], "2,1": ["ore", -1], "3,-1": ["wheat", -1], "3,-3": ["desert", -1], "-1,-2": ["desert", -1], "1,-3": ["wood", -1] },
    templateSF1 = { "0,0": ["wood", 11], "-1,0": ["sheep", 5], "0,-1": ["brick", 9], "1,-1": ["ore", 5], "1,0": ["desert", -1], "0,1": ["wheat", 6], "-1,1": ["ore", 10], "-1,-1": ["wheat", 2], "0,-2": ["sheep", 8], "1,-2": ["wood", 12], "2,-2": ["sheep", 9], "2,-1": ["sheep", 3], "2,0": ["wood", 6], "1,1": ["ore", 2], "0,2": ["brick", 10], "-1,2": ["sheep", 11], "-2,2": ["wheat", 8], "-2,1": ["brick", 3], "-2,0": ["wood", 9], "-2,-2": ["sheep", 4], "-4,0": ["ore", 3], "-4,1": ["gold", 11], "-5,3": ["ore", 4], "-5,4": ["ore", 8], "-4,4": ["wheat", 10], "-2,4": ["wood", 4], "-1,4": ["gold", 5] };
const approximatelyEqual = (a, b, dp = 12) => a.toFixed(dp) === b.toFixed(dp),
    scaleCompare = (min, max, val) => val <= (min + max) / 2 ? min : max,
    combinations = (n, r = 2, p = 1, b = 0) => {
        let l = [];
        for (let i = b; i < n - r + p; i++) {
            if (r - p > 0) l = l.concat(combinations(n, r, p + 1, i + 1).map(a => [i, ...a]));
            else l.push([i]);
        }
        return l
    },
    partition = (arr, fn, low, high) => {
        const pivot = fn(arr[high]);
        let i = low - 1;
        for (let j = low; j < high; j++) {
            if (fn(arr[j]) < pivot) {
                i++;
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
        }
        [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
        return i + 1;
    },
    quickSort = (arr, fn = n => n, low = 0, high = arr.length - 1) => {
        if (low < high) {
            const pi = partition(arr, fn, low, high);
            quickSort(arr, fn, low, pi - 1);
            quickSort(arr, fn, pi + 1, high);
        }
    },
    sortByResources = (resources, scaleFactors = { 'brick': 2, 'wood': 2, 'gold': 3, 'sheep': 2, 'wheat': 2, 'ore': 2 }) => {
        quickSort(board.corners, n =>
            (n[3] ? -board.tackGuide[n[3][1]] * (resources.some(resource => n[3][0] === resource) ? scaleFactors[n[3][0]] : 1) : 0) +
            (n[4] ? -board.tackGuide[n[4][1]] * (resources.some(resource => n[4][0] === resource) ? scaleFactors[n[4][0]] : 1) : 0) +
            (n[5] ? -board.tackGuide[n[5][1]] * (resources.some(resource => n[5][0] === resource) ? scaleFactors[n[5][0]] : 1) : 0))
    },
    getOptimalSetup = (settled=[],enemy=[]) => {
        /**
         * Sort based on:
         * Balance
         * Total Production
         */
        //sortByResources([])
        let result = [], order = combinations(20, 2);
        for (let o of order) if (!settled.some(corner => board.areAdjacentCorners(board.corners[o[0]],corner,true) || board.areAdjacentCorners(board.corners[o[1]],corner,true)) && !board.areAdjacentCorners(board.corners[o[0]], board.corners[o[1]])) result.push(o.map(a => board.corners[a]));
        return result;
    };

let board = new HexList({
    '0,0': ['wood', 11], '-1,0': ['desert', -1], '0,-1': ['wood', 6], '1,-1': ['brick', 3],
    '1,0': ['wheat', 9], '0,1': ['wheat', 4], '-1,1': ['sheep', 5], '-1,-1': ['wheat', 12],
    '0,-2': ['ore', 11], '1,-2': ['wood', 4], '2,-2': ['wheat', 8], '2,-1': ['wood', 10],
    '2,0': ['brick', 5], '1,1': ['sheep', 2], '0,2': ['ore', 6], '-1,2': ['sheep', 3],
    '-2,2': ['sheep', 8], '-2,1': ['ore', 10], '-2,0': ['brick', 9]
}),
    selectedHex = [0, 0, 'brick', 11],
    settledCorners = [],
    enemyCorners = [],
    displayCorners = getOptimalSetup(settledCorners),
    displayN = 0,
    showCorners = false,
    coordsBegin = null,
    pwidth = 0,
    pheight = 0,
    coordsMoved = [0, 0],
    coordsMoved2 = [0, 0],
    settling = false,
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
    convertMouseToCorner = e => {
        let dy = Math.round((e.clientY - coordsMoved[1] - innerHeight / 2) / (board.h * board.r / 2)),
            dx = e.clientX - coordsMoved[0] - innerWidth / 2,
            H = board.r * (dy % 2 === 0 ? 1 : 1 / 2),
            dxH = dx + H,
            R = dxH / (board.r * 3),
            D = R + (dxH > 0 ? -Math.floor(R) : Math.ceil(R)),
            x = 0,
            q = Math.abs(dy % 2) === 0 ? 2 / 3 : 1 / 3,
            r = q - 1;
        if (dxH > 0) x = D < q ? scaleCompare(0, q, D) : scaleCompare(q, 1, D);
        else if (dxH < 0) x = D > r ? scaleCompare(r, 0, D) : scaleCompare(-1, r, D);
        return [(x - D + R) * board.r * 3 - H, dy * board.h * board.r / 2];
    },
    click = e => {
        if (coordsMoved[0] !== coordsMoved2[0] || coordsMoved[1] !== coordsMoved2[1]) return false;
        if (settling) {
            settling = false;
            settledCorners.push(hovered);
            displayCorners = getOptimalSetup(settledCorners);
        }
        else {
            let [dx, dy] = hovered,
                hex = board.getHex(dx, dy) || ['none', -1];
            selectedHex = [dx, dy, ...hex];
            hexName.innerText = `Hex (${dx},${dy})`;
            valueLabel.innerText = `Value: ${hex[1]}`;
            rangeValue.value = hex[1];
            resources.value = hex[0];
        }
    },
    starting = e => {
        coordsBegin = [e.clientX, e.clientY];
        coordsMoved2 = [...coordsMoved];
    },
    movement = e => {
        if (coordsBegin !== null) coordsMoved = [coordsMoved2[0] + e.clientX - coordsBegin[0], coordsMoved2[1] + e.clientY - coordsBegin[1]];
        hovered = settling ? convertMouseToCorner(e) : convertMouseToHex(e);
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
        if (settling) {
            board.drawAllCorners(ctx);
            ctx.beginPath();
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.arc(hovered[0] + innerWidth / 2,hovered[1] + innerHeight / 2, 20, 0, Math.PI * 2);
            ctx.fill();
        }
        else {
            board.drawHex(ctx, selectedHex[0], selectedHex[1], 'selected', -1);
            board.drawHex(ctx, ...hovered, 'hover', -1);
            if (showCorners) board.drawAllCorners(ctx);
            for (let corner of displayCorners[displayN]) board.drawCorner(ctx, corner, 0, 0);
        }
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
document.getElementById('toggle2').addEventListener('click', () => settling = !settling)
document.getElementById('loadSave').addEventListener('click', () => {
    let item = localStorage.getItem("catanBoard");
    if (item === null) return false;
    board.hexes = JSON.parse(item);
    board.update();
    displayCorners = getOptimalSetup(settledCorners)
})