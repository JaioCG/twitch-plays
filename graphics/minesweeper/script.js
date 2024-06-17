import { TILE_STATUS, createBoard, flagTile, revealTile, checkWin, checkLose } from './minesweeper.js';

// Game constants
var board, boardElement;
const BOARD_WIDTH = 30;
const BOARD_HEIGHT = 16;
const MINE_COUNT = 99;

// Script variables
var firstClick = true;
var canReset = false;
var timerActive = true;
var time = 0;
var smileyElement = document.getElementById('smiley');

// Create board (from minesweeper.js)
board = createBoard(BOARD_WIDTH, BOARD_HEIGHT, MINE_COUNT);
console.log(board);
boardElement = document.querySelector('.board');
boardElement.style.setProperty('--column-size', BOARD_WIDTH);
boardElement.style.setProperty('--row-size', BOARD_HEIGHT);
timer();

// Cheeky hack to restart game
function restartGame(r)
{
    if (r) {
        location.reload();
    }
}

// Visually create board on html, and listenFor's from chat commands
board.forEach(row => {
    row.forEach(tile => {
        boardElement.append(tile.element);
        nodecg.listenFor('flagTile', (args) => {
            timerActive = true;
            flagTile(tile, args[0], args[1]);
        });
        nodecg.listenFor('revealTile', (args) => {
            timerActive = true;
            smileyElement.src = './assets/smiley/place-bomb.png';
            revealTile(board, tile, args[0], args[1], firstClick);
            checkGameEnd(args[0], args[1]);
            setTimeout(() => { smileyElement.src = './assets/smiley/normal.png' }, 100);
            setTimeout(() => { firstClick = false; }, 1000);
        });
    });
});

// Listen for chat messages from extension via tmi.js
nodecg.listenFor('chatCommand', message => {
    console.log(message);
    const args = message.slice(1).split(' ');
	const command = args.shift().toLowerCase();

    args.forEach((arg, i) => {
        args[i] = parseInt(arg) - 1;
    });

    if (args[0] > BOARD_WIDTH || args[1] > BOARD_HEIGHT) return;

    if (!canReset) {
        if (command === 'flag' || command === 'f') {
            nodecg.sendMessage('flagTile', args);
        } else if (command === 'click' || command === 'c') {
            nodecg.sendMessage('revealTile', args);
        }
    } else {
        if (command === 'reset' || command === 'r') {
            restartGame(canReset);
        }
    }
});

const numMinesRep = nodecg.Replicant('numMines');
// Checks if the game has ended, runs on every move
function checkGameEnd(thisX, thisY)
{
    const win = checkWin(board);
    const lose = checkLose(board);

    if (win || lose) {
        canReset = true;
        timerActive = false;
    }

    if (win) {
        console.log('You win!');
        setTimeout(() => { smileyElement.src = './assets/smiley/win.png' }, 101);
    }
    if (lose) {
        console.log('You lose!');
        setTimeout(() => { smileyElement.src = './assets/smiley/lose.png' }, 150);
        board.forEach(row => {
            row.forEach(tile => {
                if (tile.status === TILE_STATUS.MARKED) flagTile(tile, tile.x, tile.y);
                if (tile.mine) revealTile(board, tile, tile.x, tile.y);
                if (tile.x === thisX && tile.y === thisY)
                    if (tile.mine) tile.element.src = './assets/tiles/bomb_hit.png';
                    setTimeout(() => { if (!tile.mine && tile.status === TILE_STATUS.MARKED) tile.element.src = './assets/tiles/bomb_incorrect.png'; }, 100);
            });
        });
    }
}

// Timer function
function timer()
{
    if (timerActive) {
        setTimeout(() => {
            time++;
            if (time > 9999) time = 9999;
            
            let timeArr = time.toString().split('');
            while (timeArr.length < 4) {
                timeArr.unshift('0');
            }
            document.getElementById('timer-thos').src = `./assets/display/${timeArr[0]}.png`;
            document.getElementById('timer-huns').src = `./assets/display/${timeArr[1]}.png`;
            document.getElementById('timer-tens').src = `./assets/display/${timeArr[2]}.png`;
            document.getElementById('timer-ones').src = `./assets/display/${timeArr[3]}.png`;

            timer();
        }, 1000);
    }
}

// Live clock
setInterval(showTime, 1000);
function showTime()
{
    let date = new Date();
    let hours = date.getHours();
    let minutes = date.getMinutes();
    // Turn say 9:1 into 9:01
    if (minutes < 10) minutes = '0' + minutes.toString();

    // AM/PM display
    let ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;

    let time = `${hours}:${minutes} ${ampm}`;
    document.getElementById('clock').innerHTML = time;
}
showTime();

// Rotating wallpapers
let wallpapers = document.querySelectorAll('.wallpaper');
let wallpaperIndex = 0;
function changeWallpaper() {
    wallpapers[wallpaperIndex].classList.remove('showing');

    wallpaperIndex++;
    if (wallpaperIndex >= wallpapers.length) wallpaperIndex = 0;

    wallpapers[wallpaperIndex].classList.add('showing');
}

setInterval(changeWallpaper, 60000);