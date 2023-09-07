import { Tetromino } from "./types"
export {Tetrominos, ColourMap}

const iBlock: Tetromino = {
    type: "i",
    colourID: 1,
    locked: false,
    shape: [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    x: 0,
    y: -1
}

const jBlock: Tetromino = {
    type: "j",
    colourID: 2,
    locked: false,
    shape: [
        [2, 0, 0],
        [2, 2, 2],
        [0, 0, 0],
    ],
    x: 0,
    y: 0
}

const lBlock: Tetromino = {
    type: "l",
    colourID: 3,
    locked: false,
    shape: [
        [0, 0, 3],
        [3, 3, 3],
        [0, 0, 0],
    ],
    x: 0,
    y: 0
}

const oBlock: Tetromino = {
    type: "o",
    colourID: 4,
    locked: false,
    shape: [
        [0, 4, 4, 0],
        [0, 4, 4, 0],
        [0, 0, 0, 0],
    ],
    x: -1,
    y: 0
}

const sBlock: Tetromino = {
    type: "s",
    colourID: 5,
    locked: false,
    shape: [
        [0, 5, 5],
        [5, 5, 0],
        [0, 0, 0],
    ],
    x: 0,
    y: 0
}

const tBlock: Tetromino = {
    type: "t",
    colourID: 6,
    locked: false,
    shape: [
        [0, 6, 0],
        [6, 6, 6],
        [0, 0, 0],
    ],
    x: 0,
    y: 0
}

const zBlock: Tetromino = {
    type: "z",
    colourID: 7,
    locked: false,
    shape: [
        [7, 7, 0],
        [0, 7, 7],
        [0, 0, 0],
    ],
    x: 0,
    y: 0
}

const Tetrominos = [iBlock, jBlock, lBlock, oBlock, sBlock, tBlock, zBlock] as const
const ColourMap = ["#00ffff","#0000ff","#ffaa00","#ffff00","#00ff00","#9900ff","#ff0000"] as const