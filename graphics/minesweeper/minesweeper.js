// Game constants
export const TILE_STATUS = {
    HIDDEN: 'hidden',
    MINE: 'mine',
    NUMBER: 'number',
    MARKED: 'marked'
};

// Create and return game board and mines
export function createBoard(BOARD_WIDTH, BOARD_HEIGHT, MINE_COUNT)
{
    const board = [];
    const minePositions = getMinePositions(BOARD_WIDTH, BOARD_HEIGHT, MINE_COUNT);
    console.log(minePositions);

    for (let y = 0; y < BOARD_HEIGHT; y++) {
        const row = [];
        for (let x = 0; x < BOARD_WIDTH; x++) {
            const element = document.createElement('img');
            element.src = './assets/tiles/unrevealed.png';
            element.dataset.status = TILE_STATUS.HIDDEN;

            const tile = {
                x,
                y,
                element,
                mine: minePositions.some(positionMatch.bind(null, { x, y })),
                get status() { return this.element.dataset.status; },
                set status(value) { this.element.dataset.status = value; }
            };

            row.push(tile);
        };

        board.unshift(row);
    }

    return board;
}

var numMines;
const numMinesRep = nodecg.Replicant('numMines');
// Randonly generate mines
function getMinePositions(BOARD_WIDTH, BOARD_HEIGHT, MINE_COUNT)
{
    const positions = [];
    numMines = MINE_COUNT;

    while (positions.length < MINE_COUNT) {
        const position = {
            x: rand(BOARD_WIDTH),
            y: rand(BOARD_HEIGHT)
        };

        if (!positions.some(positionMatch.bind(null, position))) {
            positions.push(position);
        }
    }

    let minesArr = numMines.toString().split('');
    while (minesArr.length < 4) {
        minesArr.unshift('0');
    }

    document.getElementById('mines-thos').src = `./assets/display/${minesArr[0]}.png`;
    document.getElementById('mines-huns').src = `./assets/display/${minesArr[1]}.png`;
    document.getElementById('mines-tens').src = `./assets/display/${minesArr[2]}.png`;
    document.getElementById('mines-ones').src = `./assets/display/${minesArr[3]}.png`;

    return positions;
}

numMinesRep.value = numMines;
// Flag tile, also supports unflagging
export function flagTile(tile, x, y)
{
    // If tile isn't the one in command, or if it isnt hidden or marked, return
    if ((tile.status !== TILE_STATUS.HIDDEN &&
        tile.status !== TILE_STATUS.MARKED) ||
        (tile.x != x || tile.y != y)) {
        return;
    }

    // If tile is already flagged, unflag it
    if (tile.status === TILE_STATUS.MARKED) {
        console.log(`Unflagged tile at ${tile.x}, ${tile.y}`)
        tile.status = TILE_STATUS.HIDDEN;
        tile.element.src = './assets/tiles/unrevealed.png';
        numMines++;
        numMinesRep.value = numMines;
    // If tile is hidden, flag it
    } else {
        console.log(`Flagged tile at ${tile.x}, ${tile.y}`)
        tile.status = TILE_STATUS.MARKED;
        tile.element.src = './assets/tiles/flag.png';
        numMines--;
        numMinesRep.value = numMines;
    }

    // Mine counter on-screen display
    let minesArr = numMines.toString().split('');
    while (minesArr.length < 4) {
        minesArr.unshift('0');
    }
    // Deal with - sign
    for (let i = 0; i < minesArr.length; i++) {
        if (minesArr[i] === '-') {
            minesArr[i] = 'negative';
        }
    }
    document.getElementById('mines-thos').src = `./assets/display/${minesArr[0]}.png`;
    document.getElementById('mines-huns').src = `./assets/display/${minesArr[1]}.png`;
    document.getElementById('mines-tens').src = `./assets/display/${minesArr[2]}.png`;
    document.getElementById('mines-ones').src = `./assets/display/${minesArr[3]}.png`;
}

// Reveal tile
export function revealTile(board, tile, x, y, isFirstClick)
{
    // If tile isn't the one in command or is flagged already, return
    if ((tile.x != x || tile.y != y)) {
        return;
    }

    // If tile is hidden, reveal it
    if (tile.status === TILE_STATUS.HIDDEN) {
        // First click bomb protection
        if (isFirstClick) {
            if (tile.mine) {
                console.log('First click was a mine, moving mine...');
                tile.mine = false;
                let newMinePos = { x: rand(board[0].length), y: rand(board.length) };
                while (newMinePos.x === x && newMinePos.y === y) {
                    newMinePos = { x: rand(board[0].length), y: rand(board.length) };
                }
                board[newMinePos.y][newMinePos.x].mine = true;
                console.log(`New mine position: ${newMinePos.x}, ${newMinePos.y}`);
            }
        }

        // If mine (checkGameEnd() in script.js handles winning/losing)
        if (tile.mine) {
            tile.status = TILE_STATUS.MINE;
            tile.element.src = './assets/tiles/bomb.png';
            return;
        }

        // Otherwise, reveal number or empty tile
        tile.status = TILE_STATUS.NUMBER;
        const adjacentTiles = nearbyTiles(board, tile);
        const mines = adjacentTiles.filter(t => t.mine);
        if (mines.length !== 0) {
            tile.element.src = `./assets/tiles/${mines.length}.png`;
            return;
        } else {
            tile.element.src = './assets/tiles/0.png';
            adjacentTiles.forEach(t => revealTile(board, t, t.x, t.y));
        }
    // Chording (reveal all adjacent tiles if number of flags matches number of mines)
    } else if (tile.status === TILE_STATUS.NUMBER) {
        console.log(`Chording at ${tile.x}, ${tile.y}`);
        const adjacentTiles = nearbyTiles(board, tile);
        const adjacentFlags = adjacentTiles.filter(t => t.status === TILE_STATUS.MARKED);
        const adjacentMines = adjacentTiles.filter(t => t.mine);

        if (adjacentFlags.length === adjacentMines.length) {
            adjacentTiles.forEach(t => {
                if (t.status === TILE_STATUS.HIDDEN) {
                    if (adjacentMines.length !== 0) {
                        revealTile(board, t, t.x, t.y);
                    }
                }
            });
        }
    }
}

// Check for win and lose individually
export function checkWin(board)
{
    return board.every(row => {
        return row.every(tile => {
            return tile.status === TILE_STATUS.NUMBER ||
                   (tile.status === TILE_STATUS.MARKED && tile.mine) ||
                   (tile.status === TILE_STATUS.HIDDEN && tile.mine);
        });
    });
}
export function checkLose(board)
{
    return board.some(row =>
        row.some(tile =>
            tile.status === TILE_STATUS.MINE
        )
    );
}

// Utility functions
function positionMatch(a, b) { return a.x === b.x && a.y === b.y; }
function rand(max) { return Math.floor(Math.random() * max); }
function reverseNumber(num, min, max) { return (max + min) - num; }
function nearbyTiles(board, { x, y })
{
    let revBoard = board.slice().reverse();
    const tiles = [];
    for (let yOffset = -1; yOffset <= 1; yOffset++) {
        for (let xOffset = -1; xOffset <= 1; xOffset++) {
            const tile = revBoard[y + yOffset]?.[x + xOffset];
            if (tile) tiles.push(tile);
        }
    }
    return tiles;
}