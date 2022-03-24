'use strict';

const NORMAL = '😀';
const LOSE = '😡';
const WIN = '🤩';
const MINE = '💥';
const FLAG = '🚩';
const LIVE = '❤️';

let sizeBoard = 4;
let numMines = 3;
let numLives = 3;

let manualGame = true; // button to make it true
let minesLeftToPut = numMines;

let gameWin = false;

const gLevel = {
    SIZE: sizeBoard,
    MINES: numMines,
};

const gGame = {
    isOn: false,
    shownCount: 0,
    markedCount: 0,
    secsPassed: 0,
};

/*
 1. [x] renderBoard => open / covered / flag / mine / number
 2. [x] left click + right click
 3. [x] generate new board
 4. [x] calculate minesAroundCount
 5. [x] gameplay => right click board changes / left click board changes / logic / board change
 6. [ ] lives / win - lose
 7. [ ] add buttons: Safe-Clicks, UNDO, & Timer 
 8. [ ] css 
*/

let board = [];

// This is called when page loads
function initGame() {
    addLog('initializing game');
    numLives = 3;
    buildBoard(gLevel.SIZE, gLevel.MINES);
    renderBoard();
}

// ===================== GENERATE BOARD =====================

function randomNumber(max) {
    return Math.floor(Math.random() * max);
}

function findAnEmptyPlace() {
    const i = randomNumber(gLevel.SIZE);
    const j = randomNumber(gLevel.SIZE);
    return board[i][j].isMine ? findAnEmptyPlace() : { i, j };
}

function startGame() {
    addLog('start game');

    gGame.isOn = true;

    // placing mines
    for (var i = 0; i < gLevel.MINES; i++) {
        const emptyPlace = findAnEmptyPlace();
        board[emptyPlace.i][emptyPlace.j].isMine = true;
    }

    addLog('placing mines completed');

    setMinesNegsCount();

    // placing lives
    numLives = 3;

    // rendering board
    renderBoard();
}

// Count mines around each cell and set the cell's minesAroundCount.
function setMinesNegsCount() {
    addLog('setMinesNegsCount');

    // count neighboors
    for (var i = 0; i < gLevel.SIZE; i++) {
        for (var j = 0; j < gLevel.SIZE; j++) {
            board[i][j].minesAroundCount = getMinesNegsCountForCell(i, j);
        }
    }
}

function getCellData(i, j) {
    if (i >= gLevel.SIZE || i < 0 || j >= gLevel.SIZE || j < 0) {
        return null;
    }

    return board[i][j];
}

function isCellAMine(i, j) {
    const cellData = getCellData(i, j);
    return cellData ? cellData.isMine : false;
}

// |   |     |   |
// |---|-----|---|
// |   | i,j |   |
// |---|-----|---|
// |   |     |   |
function getMinesNegsCountForCell(i, j) {
    let count = 0;

    for (var deltaI = -1; deltaI <= 1; deltaI++) {
        for (var deltaJ = -1; deltaJ <= 1; deltaJ++) {
            const isMine = isCellAMine(i + deltaI, j + deltaJ) ? 1 : 0;
            count += isMine ? 1 : 0;
        }
    }

    return count;
}

function setLives() {
    let live = '';
    for (let i = 0; i < numLives; i++) {
        live += LIVE;
    }
    let elLives = document.querySelector('.lives');
    elLives.innerText = live;
    addLog('placing lives completed');
}

// Builds the board
// Set mines at random locations Call setMinesNegsCount() Return the created board
function buildBoard() {
    addLog(
        `building ${gLevel.SIZE}x${gLevel.SIZE} board with ${gLevel.MINES} mines`
    );

    board = [];

    for (var i = 0; i < gLevel.SIZE; i++) {
        board[i] = [];
        for (var j = 0; j < gLevel.SIZE; j++) {
            board[i][j] = {
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false,
            };
        }
    }
}

// ===================== GAMEPLAY =====================
let runs = 0;

function cellClicked(i, j, elCell) {
    addLog(`gGame ${JSON.stringify(gGame)}`);

    if (!gGame.isOn && numLives === 0) {
        console.log('gameOver');
        return;
    }
    if (!gGame.isOn) {
        startGame();
    }

    const cellData = board[i][j];

    if (cellData.isShown || cellData.isMarked) {
        return;
    }

    cellData.isShown = true;

    if (cellData.minesAroundCount === 0) {
        runs = 0;
        expandShown(i, j, {});
    }

    if (cellData.isMine) {
        numLives--;
    }

    renderBoard();
}

function cellMarked(elCell) {
    const dataId = elCell.getAttribute('data-id');
    const part = dataId.split('-');
    const i = part[0];
    const j = part[1];
    const cellData = board[i][j];

    if (cellData.isShown) {
        return;
    }

    addLog(`i=${i} and j=${j} right-clicked`);
    // !true => false
    // !false => true
    board[i][j].isMarked = !board[i][j].isMarked;
    renderBoard();
}

function checkGameOver() {
    if (numLives === 0) {
        gGame.isOn = false;
        let elWinLose = document.querySelector('.win-lose');
        elWinLose.innerText = LOSE;
    }
}

// When user clicks a cell with no mines around, we need to open not only that cell, but also its neighbors.
// NOTE: start with a basic implementation that only opens the non-mine 1st degree neighbors
// BONUS: if you have the time later, try to work more like the real algorithm (see description at the Bonuses section below)

function expandShown(i, j, memo = {}) {
    // mark we already checked this cell;
    memo[`${i}-${j}`] = true;

    if (!board[i][j].isMine) {
        board[i][j].isShown = true;
    }

    if (board[i][j].minesAroundCount > 0) {
        return;
    }

    for (var deltaI = -1; deltaI <= 1; deltaI++) {
        for (var deltaJ = -1; deltaJ <= 1; deltaJ++) {
            const checkI = i + deltaI;
            const checkJ = j + deltaJ;
            const neightboorData = getCellData(checkI, checkJ);

            if (!neightboorData) {
                continue;
            }

            if (!neightboorData.isShown && !memo[`${checkI}-${checkJ}`]) {
                expandShown(checkI, checkJ, memo);
            }
        }
    }
}

function cellRightClicked(event) {
    event.preventDefault();
    cellMarked(event.target);
}

// ===================== PAINT THE BOARD =====================

// Render the board as a <table> to the page
function renderBoard() {
    addLog('rendering board');
    var tableHtml = '<tbody>';

    for (var i = 0; i < gLevel.SIZE; i++) {
        tableHtml += '<tr>';

        for (var j = 0; j < gLevel.SIZE; j++) {
            // var className = board[i][j] ? "occupied" : "";
            var cellClassName = 'cell';
            var cellContent = '';

            const cellData = board[i][j];

            if (!cellData.isShown) {
                cellClassName += ' covered';
            }

            if (cellData.isMine && cellData.isShown) {
                cellContent = MINE;
            } else if (cellData.isMarked && !cellData.isShown) {
                cellContent = FLAG;
            } else if (cellData.minesAroundCount > 0 && cellData.isShown) {
                cellContent = cellData.minesAroundCount;

                if (cellData.minesAroundCount === 1) {
                    cellClassName += ' blue';
                } else if (cellData.minesAroundCount === 2) {
                    cellClassName += ' green';
                } else if (cellData.minesAroundCount >= 3) {
                    cellClassName += ' red';
                }
            }

            tableHtml += `<td 
                        data-id="${i}-${j}"
                        onclick="cellClicked(${i},${j},this)" 
                        oncontextmenu="cellRightClicked(event)" 
                        class="${cellClassName}">${cellContent}</td>`;
        }

        tableHtml += '</tr>';
    }

    tableHtml += '</tbody>';
    var elMainBoard = document.querySelector('#board-table');
    elMainBoard.innerHTML = tableHtml;
    setLives(); // TODO check again if its good
    checkGameOver();
}

// ===================== HELPERS =====================
function addLog(message) {
    let log = `<div>${message}</div>`;
    var elLogs = document.querySelector('#logs');
    elLogs.innerHTML += log;
}

function revealBoard() {
    for (var i = 0; i < gLevel.SIZE; i++) {
        for (var j = 0; j < gLevel.SIZE; j++) {
            board[i][j].isShown = true;
        }
    }
    renderBoard();
}
