let grid_spacing, pieces, names, chess;
const socket = io('https://moustafa-khaled.glitch.me');

const p5Container = document.querySelector('#p5-container');
const centerP5Container = document.querySelector('#center-p5-container');
let [w, h] = [centerP5Container.clientWidth, centerP5Container.clientHeight];
let size = Math.min(w, h);
size = 300;

function initialize_chess() {
    chess = new chess((width = size), (grid_spacing = width / 8), pieces);
    socket.on('update', (data) => {
        chess.update(data);
    });
}

function preload() {
    let current_path, path, fullName, piecePATH;
    pieces = {};

    // ?????????????????????????????????
    path = 'assets/images/pieces/';
    // ?????????????????????????????????

    names = ['rock', 'night', 'bishop', 'queen', 'king', 'pawn'];
    // ?????????????????????????????????
    piecePATH = [];
    // ?????????????????????????????????

    for (let clr of ['White', 'Black']) {
        for (let name of names) {
            fullName = `${name}${clr}`;
            current_path = `${path}${piecePATH}.png`;
            pieces[fullName] = loadImage(current_path);
        }
    }
}

function setup() {
    let cnv = createCanvas(size, size);
    cnv.parent(p5Container);
    initialize_chess();
    noStroke();
    frameRate(9);
}

function draw() {
    background(0);
    chess.show();
}

class Chess {
    constructor(Width, grid_spacing, name, pieces) {
        this.history = [];
        this.historyIndex = 0;
        this.Width = Width;
        this.piece_image = pieces;
        this.grid_spacing = grid_spacing;
        this.square_size = this.Width / 16;
        this.name = ['rock', 'night', 'bishop', 'queen', 'king', 'pawn'];
        this.defaultPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
        this.pieces_names = [
            name[0],
            name[1],
            name[2],
            name[3],
            name[4],
            name[2],
            name[1],
            name[0],
        ];
        this.turn = 1;
        // part of the noRepeation function to save previous calculations
        this.answers = [];
        // Translates square notation to position on the screen
        this.sqr = {};
        // Holds the pieces
        this.block = {};
        // Setup Board
        this.Selection = { state: 0, serial: '', moves: {} };
        this.KingUnderCheck = { color: 0, status: 0 };
        this.castled = { White: 0, Black: 0 };
        this.KingMoved = { White: 0, Black: 0 };
        this.enemies = {};
        this.MatchLog = '';
        this.Default_Setup();
    }
    Default_Setup() {
        this.turn = 1;
        // part of the noRepeation function to save previous calculations
        this.answers = [];
        // Translates square notation to position on the screen
        this.sqr = {};
        // Holds the pieces
        this.block = {};
        // Selected square status
        this.Selection = { state: 0, serial: '', moves: {} };
        this.KingUnderCheck = { color: 0, status: 0 };
        this.castled = { White: 0, Black: 0 };
        this.KingMoved = { White: 0, Black: 0 };
        this.enemies = {};
        this.history = [];
        this.historyIndex = 0;
        this.MatchLog = [];
        // Setup "sqr and block"
        for (
            let [i, x] = [1, 0];
            i <= 8 && x < this.Width;
            i++, x += this.grid_spacing
        ) {
            for (
                let [j, y] = [1, this.Width - this.grid_spacing];
                j <= 8 && y > -1;
                j++, y -= this.grid_spacing
            ) {
                this.sqr[`${j}${i}`] = [x, y];
            }
        }
        this.loadPosition(this.defaultPosition);
        this.history.push(this.defaultPosition);
        // testing
        // this.block[`${4}${6}`] = { name: "night", color: 0 };
        // this.block[`${5}${4}`] = { name: "king", color: 1 };
        // this.block[`${6}${6}`] = { name: "pawn", color: 0 };
        // this.Selection.serial = "75";
        // this.Selection.state = 1;
        // this.Selection.moves = this.calculate_available_moves(
        //   this.Selection.serial,
        //   this.block[this.Selection.serial].name
        // );
    }
    move(square1, square2) {
        if (this.Selection.moves[square2] || this.enemies[square2]) {
            this.block[square2] = this.block[square1];
            this.block[square1] = 0;
            this.turn = this.turn ? 0 : 1;
            this.updateHistory(this.savePosition(this.block));
            let data = {
                game: 'chess',
                turn: this.turn,
                block: this.block,
                KingUnderCheck: this.KingUnderCheck,
                castled: this.castled,
                KingMoved: this.KingMoved,
            };
            socket.emit('Played', data);
        }
        this.deselect();
    }
    updateHistory(data) {
        this.history = this.history.slice(0, this.historyIndex + 1);
        this.history.push(data);
        this.historyIndex++;
    }
    update(data) {
        [
            this.GameOver,
            this.turn,
            this.block,
            this.KingUnderCheck,
            this.castled,
            this.KingMoved,
        ] = [
            data.GameOver,
            data.turn,
            data.block,
            data.KingUnderCheck,
            data.castled,
            data.KingMoved,
        ];
        this.deselect();
        this.updateHistory(data.block);
    }
    piece_moves(name, serial) {
        switch (name) {
            case 'pawn':
                return this.pawn(serial);
            case 'night':
                return this.knight(serial);
            case 'rock':
                return this.rock(serial);
            case 'king':
                return this.king(serial);
            case 'bishop':
                return this.bishop(serial);
            case 'queen':
                return this.queen(serial);
        }
    }
    calculate_available_moves(serial, name) {
        this.moves = {};
        this.enemies = {};
        return this.piece_moves(name, serial);
    }
    bishop(serial) {
        return this.checkLines(serial, 'diagonal');
    }
    knight(serial) {
        let moves = {};
        let directions = [];
        let current_serial;
        let [L, R] = [parseInt(serial[0]), parseInt(serial[1])];

        directions.push([2, 1], [-2, 1], [1, 2], [1, -2]);
        directions.push([2, -1], [-2, -1], [-1, 2], [-1, -2]);

        for (let pos of directions) {
            if (
                pos[0] + L <= 0 ||
                pos[1] + R <= 0 ||
                pos[0] + L >= 9 ||
                pos[1] + R >= 9
            ) {
                continue;
            }
            current_serial = `${pos[0] + L}${pos[1] + R}`;
            if (this.valid_move(current_serial, serial)) {
                moves[current_serial] = true;
            }
        }

        return moves;
    }
    queen(serial) {
        let [straight, diagonal] = [[], []];
        straight = this.checkLines(serial, 'straight');
        diagonal = this.checkLines(serial, 'diagonal');
        return Object.assign({}, straight, diagonal);
    }
    pawn(serial) {
        let current_serial, clr, step, range;
        let [straight, diagonal, diagonal_enemies] = [[], [], {}];
        let team = this.block[serial].color;
        if (team) {
            if (serial[0] == 8) {
                return this.promotion(serial);
            }
            step = 1;
            clr = 'White';
            range = serial[0] == 2 ? 3 : 2;
        } else {
            if (serial[0] == 1) {
                return this.promotion(serial);
            }
            step = -1;
            clr = 'Black';
            range = serial[0] == 7 ? 3 : 2;
        }
        diagonal = this.checkLines(serial, clr + 'PawnDiagonal', 2);
        diagonal_enemies = { ...this.enemies };
        straight = this.checkLines(serial, clr + 'PawnStraight', range);

        // remove enemies from straight ahead by checking the difference
        Object.keys(this.enemies).forEach((serial) => {
            if (diagonal_enemies[serial] == undefined) {
                delete this.enemies[serial];
            }
        });

        return straight;
    }
    king(serial) {
        let [kingStraight, kingDiagonal, moves] = [[], [], {}];
        let straight, diagonal, keys;
        kingStraight = this.checkLines(serial, 'straight', 2);
        kingDiagonal = this.checkLines(serial, 'diagonal', 2);
        moves = Object.assign({}, kingStraight, kingDiagonal);
        keys = Object.keys(moves);
        // moves = Object.assign({}, moves, this.queen(keys[0]))
        //     Object.keys(moves).forEach((sqrSerial)=>{

        //       // all all directions
        //       // moves = Object.assign({}, moves, this.queen(sqrSerial))

        //       // knight
        //     })

        return moves;
    }
    rock(serial) {
        return this.checkLines(serial, 'straight');
    }
    noRepeation(variables) {
        return;
    }
    checkLines(serial, direction, range = 12) {
        let directions = {
            straight: [
                [1, 0],
                [0, 1],
                [0, -1],
                [-1, 0],
            ],
            diagonal: [
                [1, 1],
                [-1, 1],
                [1, -1],
                [-1, -1],
            ],
            WhitePawnStraight: [[1, 0]],
            BlackPawnStraight: [[-1, 0]],
            WhitePawnDiagonal: [
                [1, 1],
                [1, -1],
            ],
            BlackPawnDiagonal: [
                [-1, 1],
                [-1, -1],
            ],
        };
        let [L, R] = [parseInt(serial[0]), parseInt(serial[1])];
        let moves = {};

        let current_serial;
        for (let YX of directions[direction]) {
            let counter = 0;
            for (
                let [y, x] = [L, R];
                counter < range;
                y += YX[0], x += YX[1], counter++
            ) {
                current_serial = `${y}${x}`;
                if (current_serial == serial) continue;
                if (!this.valid_move(current_serial, serial)) break;
                moves[current_serial] = true;
            }
        }

        return moves;
    }
    valid_move(other, current) {
        let enemy, empty;
        let [L, R] = [parseInt(other[0]), parseInt(other[1])];
        if (L <= 0 || R <= 0 || L >= 9 || R >= 9) return false;
        enemy = this.isEnemy(other, current);
        empty = this.isEmpty(other);
        if (!enemy && !empty) return false;
        if (enemy && !empty) {
            this.enemies[other] = true;
            return false;
        }
        return true;
    }
    promotion(serial, name = 'queen') {
        this.block[serial].name = name;
        return this.calculate_available_moves(serial, name);
    }
    showPieces(piece, pos) {
        let name;
        if (piece) {
            name = `${piece.name}${piece.color ? 'White' : 'Black'}`;
            image(
                this.piece_image[name],
                ...pos,
                this.grid_spacing,
                this.grid_spacing
            );
        }
    }
    show() {
        const black = [185, 135, 99];
        const white = [236, 214, 177];
        let clr = black;
        let counter = 0;
        let pos;
        const Keys = Object.keys(this.sqr);

        for (const serial of Keys) {
            pos = this.sqr[serial];
            fill(...clr);
            square(...pos, this.square_size * 2);
            this.showPieces(this.block[serial], pos);
            counter++;
            if (counter < 8) {
                clr = clr === black ? white : black;
            } else {
                counter = 0;
            }
        }
        this.show_moves();
    }
    show_moves() {
        if (this.Selection.state && !this.isEmpty(this.Selection.serial)) {
            this.selectReaction(this.Selection.serial);
            this.showPieces(
                this.block[this.Selection.serial],
                this.sqr[this.Selection.serial]
            );
            Object.keys(this.Selection.moves).forEach((i) => {
                this.selectReaction(i);
            });
            Object.keys(this.enemies).forEach((i) => {
                this.selectReaction(i, [200, 30, 70]);
            });
        }
    }
    selectReaction(serial, rgb = [247, 244, 50]) {
        fill(...rgb, 40);
        square(...this.sqr[serial], this.square_size * 2);
    }
    deselect() {
        this.Selection.state = 0;
        this.Selection.serial = '';
        this.Selection.moves = {};
    }
    Select(posX, posY) {
        let serial, moves, name;
        if (typeof posX === 'string') {
            serial = posY + posX;
        } else {
            serial = this.calculate_square(posX, posY);
        }
        if (
            this.Selection.state &&
            this.Selection.moves != undefined &&
            this.turn != this.block[serial].color
        ) {
            this.move(this.Selection.serial, serial);
            return;
        } else if (this.turn != this.block[serial].color) {
            return;
        }
        name = '';
        if (serial) {
            this.Selection.state = 1;
            this.Selection.serial = serial;
            name = this.block[serial].name;
            moves = this.calculate_available_moves(serial, name);
            this.Selection.moves = moves;
        } else {
            this.deselect();
        }
    }
    calculate_square(posX, posY) {
        let pos;
        let length = this.square_size * 2;
        const Keys = Object.keys(this.sqr);
        for (const serial of Keys) {
            pos = this.sqr[serial];
            if (
                posX <= pos[0] + length &&
                posX >= pos[0] &&
                posY <= pos[1] + length &&
                posY >= pos[1]
            ) {
                return serial;
            }
        }
        return 0;
    }
    isEmpty(serial) {
        return this.block[serial] === 0;
    }
    isEnemy(this_serial, other_serial) {
        return this.block[this_serial].color != this.block[other_serial].color;
    }
    loadPosition(series) {
        let num, result, count;

        this.deselect();
        series = series.split('/');
        result = {};

        for (let y = 8; y >= 1; y--) {
            count = 1;
            for (let x of series[y - 1]) {
                num = parseInt(x);
                if (!isNaN(num)) {
                    for (let i = count; i < num + count; i++) {
                        result[`${y}${i}`] = 0;
                    }
                    count += num - 1;
                } else {
                    result[`${y}${count}`] = this.letterToPiece(x);
                }
                count++;
            }
        }
        this.block = result;
    }
    savePosition(BLOCK) {
        let result, keys, count, current;
        count = 0;
        result = '';
        keys = Object.keys(this.sqr);
        for (let serial of keys) {
            current = BLOCK[serial];
            if (current != 0) {
                if (count > 0) {
                    result += count;
                }
                count = 0;
                result += this.pieceToLetter(current);
            } else {
                count += 1;
            }
            if (serial[1] == '8') {
                if (count > 0) {
                    result += count;
                }
                result += '/';
                count = 0;
            }
        }
        result = result.slice(0, result.length - 1);
        return result;
    }
    pieceToLetter(piece) {
        if (piece.color) return piece.name[0];
        return String.fromCharCode(piece.name[0].charCodeAt(0) - 32);
    }
    letterToPiece(chr) {
        let clr = 1;
        let result;
        if (chr <= 'Z') {
            clr = 0;
            chr = String.fromCharCode(chr.charCodeAt(0) + 32);
        }
        Object.values(this.name).forEach((name) => {
            if (chr === name[0]) {
                result = { name: name, color: clr };
            }
        });
        return result;
    }
    historyChange(change = 0) {
        this.historyIndex += change;
        if (change === -1) {
            if (this.historyIndex < 0) {
                this.historyIndex = 0;
            }
        } else {
            if (this.historyIndex >= this.history.length) {
                this.historyIndex = this.history.length - 1;
            }
        }
        this.loadPosition(this.history[this.historyIndex]);
        this.turn = this.turn ? 0 : 1;
    }
}

function mousePressed() {
    chess.Select(mouseX, mouseY);
}
function keyPressed() {
    if (key === 'ArrowLeft') {
        chess.historyChange(-1);
    } else if (key === 'ArrowRight') {
        chess.historyChange(1);
    }
}
