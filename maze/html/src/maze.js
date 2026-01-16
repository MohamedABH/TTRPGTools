class Coord {
    constructor(x, y) {
        if (!Number.isInteger(x) || !Number.isInteger(y)) {
            throw new Error("Coordinates must be integers");
        }
        if (x < 0 || y < 0) {
            throw new Error("Coordinates must be non-negative");
        }
        this.x = x;
        this.y = y;
    }

    getCoord() {
        return [this.x, this.y];
    }

    getX() {
        return this.x;
    }

    getY() {
        return this.y;
    }

    getTop() {
        if (this.y === 0) {
            return false;
        }
        return new Coord(this.x, this.y - 1);
    }

    getRight() {
        return new Coord(this.x + 1, this.y);
    }

    getBottom() {
        return new Coord(this.x, this.y + 1);
    }

    getLeft() {
        if (this.x === 0) {
            return false;
        }
        return new Coord(this.x - 1, this.y);
    }

    getDirection(coord) {
        const top = this.getTop();
        if (top && coord.equals(top)) {
            return "t";
        }
        if (coord.equals(this.getRight())) {
            return "r";
        }
        if (coord.equals(this.getBottom())) {
            return "b";
        }
        const left = this.getLeft();
        if (left && coord.equals(left)) {
            return "l";
        }
        return "n";
    }

    toString() {
        return `${this.x},${this.y}`;
    }

    equals(other) {
        return this.x === other.getX() && this.y === other.getY();
    }

    hashCode() {
        return `${this.x},${this.y}`;
    }
}

class Cell {
    constructor() {
        this.rightWall = true;
        this.bottomWall = true;
        this.explored = false;
        this.pathed = false;
    }

    getRightWall() {
        return this.rightWall;
    }

    getBottomWall() {
        return this.bottomWall;
    }

    breakRightWall() {
        this.rightWall = false;
    }

    breakBottomWall() {
        this.bottomWall = false;
    }

    getExplored() {
        return this.explored;
    }

    setExplored() {
        this.explored = true;
    }

    unsetExplored() {
        this.explored = false;
    }

    getPathed() {
        return this.pathed;
    }

    setPathed() {
        this.pathed = true;
    }

    toString() {
        let res = "";
        res += this.bottomWall ? "_" : " ";
        res += this.rightWall ? "|" : " ";
        return res;
    }
}

class Maze {
    constructor(length, height) {
        if (!Number.isInteger(length) || !Number.isInteger(height)) {
            throw new Error("Length and height must be integers");
        }
        if (length <= 0 || height <= 0) {
            throw new Error("Length and height must be positive");
        }
        this.length = length;
        this.height = height;
        this.cells = new Map();
        this.outs = [];

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < length; x++) {
                const coord = new Coord(x, y);
                this.cells.set(coord.hashCode(), new Cell());
            }
        }
    }

    getCell(coord) {
        return this.cells.get(coord.hashCode());
    }

    checkSurround(coord) {
        const res = [];
        const top = coord.getTop();
        if (top && !this.getCell(top).getPathed()) {
            res.push(top);
        }
        if (coord.getX() < this.length - 1 && !this.getCell(coord.getRight()).getPathed()) {
            res.push(coord.getRight());
        }
        if (coord.getY() < this.height - 1 && !this.getCell(coord.getBottom()).getPathed()) {
            res.push(coord.getBottom());
        }
        const left = coord.getLeft();
        if (left && !this.getCell(left).getPathed()) {
            res.push(left);
        }
        return res;
    }

    backtrack(coord) {
        const top = coord.getTop();
        if (top && this.getCell(top).getExplored() && !this.getCell(top).getBottomWall()) {
            return top;
        }
        if (coord.getX() < this.length - 1 && this.getCell(coord.getRight()).getExplored() && !this.getCell(coord).getRightWall()) {
            return coord.getRight();
        }
        if (coord.getY() < this.height - 1 && this.getCell(coord.getBottom()).getExplored() && !this.getCell(coord).getBottomWall()) {
            return coord.getBottom();
        }
        const left = coord.getLeft();
        if (left && this.getCell(left).getExplored() && !this.getCell(left).getRightWall()) {
            return left;
        }
        return null;
    }

    generate() {
        const edges = this.getEdgeCoordinates();
        this.outs = this.getRandomSample(edges, 2);
        
        let coord = this.outs[0];
        let explored = 1;
        this.getCell(coord).setExplored();
        this.getCell(coord).setPathed();

        while (explored < this.length * this.height) {
            let possibilities;
            if (coord.equals(this.outs[1])) {
                possibilities = [];
            } else {
                possibilities = this.checkSurround(coord);
            }

            if (possibilities.length === 0) {
                this.getCell(coord).unsetExplored();
                coord = this.backtrack(coord);
                if (coord === null) {
                    break;
                }
            } else {
                const newCoord = possibilities[Math.floor(Math.random() * possibilities.length)];
                const direction = coord.getDirection(newCoord);

                if (direction === "t") {
                    this.getCell(newCoord).breakBottomWall();
                } else if (direction === "r") {
                    this.getCell(coord).breakRightWall();
                } else if (direction === "b") {
                    this.getCell(coord).breakBottomWall();
                } else if (direction === "l") {
                    this.getCell(newCoord).breakRightWall();
                }

                coord = newCoord;
                this.getCell(coord).setExplored();
                this.getCell(coord).setPathed();
                explored++;
            }
        }
    }

    getEdgeCoordinates() {
        const edges = [];
        for (let x = 0; x < this.length; x++) {
            edges.push(new Coord(x, 0));
            edges.push(new Coord(x, this.height - 1));
        }
        for (let y = 1; y < this.height - 1; y++) {
            edges.push(new Coord(0, y));
            edges.push(new Coord(this.length - 1, y));
        }
        return edges;
    }

    getRandomSample(arr, k) {
        const shuffled = [...arr].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, k);
    }

    getCells() {
        return this.cells;
    }

    solve() {
        const start = this.outs[0];
        const end = this.outs[1];
        
        const queue = [[start, [start]]];
        const visited = new Set();
        visited.add(start.hashCode());

        while (queue.length > 0) {
            const [current, path] = queue.shift();

            if (current.equals(end)) {
                return path;
            }

            const neighbors = [
                { coord: current.getTop(), check: () => current.getTop() && !this.getCell(current.getTop()).getBottomWall() },
                { coord: current.getRight(), check: () => !this.getCell(current).getRightWall() },
                { coord: current.getBottom(), check: () => !this.getCell(current).getBottomWall() },
                { coord: current.getLeft(), check: () => current.getLeft() && !this.getCell(current.getLeft()).getRightWall() }
            ];

            for (const neighbor of neighbors) {
                if (neighbor.coord && neighbor.check() && !visited.has(neighbor.coord.hashCode())) {
                    visited.add(neighbor.coord.hashCode());
                    queue.push([neighbor.coord, [...path, neighbor.coord]]);
                }
            }
        }

        return [];
    }

    toString() {
        let res = " " + "_ ".repeat(this.length) + "\n";
        for (let y = 0; y < this.height; y++) {
            res += "|";
            for (let x = 0; x < this.length; x++) {
                const coord = new Coord(x, y);
                res += this.getCell(coord).toString();
            }
            res += "\n";
        }
        res += "in: " + this.outs[0].toString() + "\n";
        res += "out: " + this.outs[1].toString() + "\n";
        return res;
    }
}
