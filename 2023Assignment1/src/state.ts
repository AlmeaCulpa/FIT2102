import { hash, calcScore, getPosition, getNonZeroRows, hasBlocks, getNonFullRows, canMove, getTetromino, setPiece} from "./util.ts"
import { Tetromino, State, Board, Action, Key, Event } from "./types"
export { Viewport, Constants, Block, Translate, Rotate, Tick, Restart, Pause, initialState, reduceState }

const Viewport = {
    CANVAS_WIDTH: 200,
    CANVAS_HEIGHT: 400,
    PREVIEW_WIDTH: 160,
    PREVIEW_HEIGHT: 80,
} as const
  
const Constants = {
    TICK_RATE_MS: 50,
    GRID_WIDTH: 10,
    GRID_HEIGHT: 20,
    SEED: Math.floor(Math.random() * 0x80000000), //1234567 // (a set seed to use for testing)
    ROW_LEVEL_THRESHOLD: 10 // Speed/Level increases when clearing this many rows
} as const
  
const Block = {
    WIDTH: Viewport.CANVAS_WIDTH / Constants.GRID_WIDTH,
    HEIGHT: Viewport.CANVAS_HEIGHT / Constants.GRID_HEIGHT
} as const

/**
   * Attempts to rotate a tetronimo by transforming the 2d array and cross-referencing the desired position with the board
   *
   * @param piece The tetronimo being rotated
   * @param clockwise If true, then rotating clockwise. Else, rotating anti-clockwise
   * @param state The current state
   * @returns The rotated or unrotated tetronimo
   */
const rotate = (piece: Tetromino, clockwise: boolean, s: State): Tetromino => {
    if (piece.type == "o" || s.gameEnd || s.paused) {return piece} // Transformation not needed if the game is paused, ended, or the piece is "o"
    const {shape} = piece
    const desiredPositions = clockwise ?
        {...piece, shape:shape.map((val, index) => shape.map((row) => row[index]).reverse())} : // Clockwise rotation gets columns to use as rows instead, then reverses them
        {...piece, shape:shape.map((val, index) => shape.map((row) => row[row.length-1-index]))} // Anticlockwise does this in reverse order, but doesn't need to reverse the result
    return canMove(getPosition(desiredPositions), s.blocks) ? desiredPositions : wallKick(piece, desiredPositions, s.blocks, 1, 0) // If it can't rotate, attempt wall kick
}

/**
   * Attempts to translate (move) a tetronimo a tetronimo by cross-referencing the desired position with the board
   *
   * @param piece The tetronimo being translated
   * @param amount Amount of spaces this piece is moved. Currently can only be zero, but this allows for extensibility
   * @param vertical If true, the piece is moving vertically instead of horizontally
   * @param state The current state
   * @returns The translated tetronimo with new x/y properties
   */
const translate = (piece: Tetromino, amount: number, vertical: boolean, s: State): Tetromino => {
    if (s.gameEnd || s.paused) {return piece} // Transformation not needed if the game is paused or ended
    const positions = getPosition(piece) // Array of x/y positions each block of the tetronimo is in
    if (vertical){
        const desiredPositions = positions.map((pos) => [pos[0] + 1, pos[1]])
        return canMove(desiredPositions, s.blocks) ? {...piece, y: piece.y + 1} : {...piece, locked: true} // Piece "locks" if it can't move down, being placed
    }
    else {
        const desiredPositions = positions.map((pos) => [pos[0], pos[1] + amount])
        return canMove(desiredPositions, s.blocks) ? {...piece, x: piece.x + amount} : {...piece, x: piece.x}
    }
}

/**
   * Attempts to nudge the piece up to 2 places in the x and y directions, favoring downward positions over upward to allow fitting into "tighter" spaces
   *
   * @param piece The unrotated tetronimo to return if nudging doesn't work
   * @param rotated The rotated tetronimo being nudged
   * @param board The current representation of the 2d game board
   * @param xNudge Nudge up to xNudge positions left and right
   * @param yNudge Nudge up to yNudge positions down and up
   * @returns The transformed tetronimo, rotated and with new x/y properties, or the untransformed tetronimo if it can't be nudged
   */
const wallKick = (piece: Tetromino, rotated: Tetromino, board: Board, xNudge: number, yNudge: number): Tetromino => {
    if (xNudge === 3) { return wallKick(piece, rotated, board, 0, yNudge + 1)} // If 2 x nudges fail, attempt again with a nudged y
    if (yNudge === 3) { return piece } // If all x and y nudges fail, return the piece as it was
    const 
        position = getPosition(rotated), // Array of x/y positions each block of the tetronimo is in
        // Attempted nudged positions
        addXAddY = position.map((pos) => [pos[0] + yNudge, pos[1] + xNudge]),
        subXAddY = position.map((pos) => [pos[0] + yNudge, pos[1] - xNudge]),
        addXSubY = position.map((pos) => [pos[0] - yNudge, pos[1] + xNudge]),
        subXSubY = position.map((pos) => [pos[0] - yNudge, pos[1] - xNudge])
        // Sequentially testing each potential position
        return canMove(addXAddY, board) ?
            {...rotated, x: rotated.x + xNudge, y: rotated.y + yNudge} :
            canMove(subXAddY, board) ?
            {...rotated, x: rotated.x - xNudge, y: rotated.y + yNudge} :
            canMove(addXSubY, board) ?
            {...rotated, x: rotated.x + xNudge, y: rotated.y - yNudge} :
            canMove(subXSubY, board) ?
            {...rotated, x: rotated.x - xNudge, y: rotated.y - yNudge} :
            wallKick(piece, rotated, board, xNudge + 1, yNudge) // Recursively attempt again with a greater x nudge
}

/**
   * Runs each game tick, updating the state differently depending on if a piece is placed or still falling
   *
   * @param state The current state
   * @returns The updated state
   */
const tick = (s: State): State => {
    // Determines if a piece is ready to be lowered by comparing the tickBuffer with the current level
    if ((10 - s.level) != s.tickBuffer) {return {...s, tickBuffer: s.tickBuffer + 1, currentHash: s.currentHash.next()}}
    const activeTetromino = translate(s.activeTetromino, Constants.GRID_HEIGHT, true, s)
    const boardUpdate = (activeTetromino.locked)
    if (boardUpdate) { // Save on computational resources by only running the following if the board actually needs to be updated
        const 
            // Gets the new state of the board with the current piece by placing the piece and splitting the board up before combining with new empty rows
            boardWithTetronimo = setPiece(s),
            nonZeroRows = getNonZeroRows(boardWithTetronimo),
            nonFullRows = getNonFullRows(nonZeroRows),
            // Creates an array of empty rows to place above the sub-board which contains non-empty rows
            upperBoard = Array(boardWithTetronimo.length - nonFullRows.length).fill(null).map(() => Array(Constants.GRID_WIDTH).fill(0)),
            finalBoard = [...upperBoard, ...nonFullRows],

            // Handles setting the new tetronimo and generating the next
            newTetromino = s.nextTetromino,
            nextTetromino = getTetromino(s.currentHash.value),

            // Updates meta values such as score and rows cleared
            rowsCleared = nonZeroRows.length - nonFullRows.length,
            gameEnd = hasBlocks(finalBoard[0]),
            score = s.score + calcScore(rowsCleared),
            highScore = gameEnd ? Math.max(score, s.highScore) : s.highScore,
            level = Math.floor((rowsCleared + s.rowsCleared) / Constants.ROW_LEVEL_THRESHOLD + 1)
            console.log(finalBoard)
        
        return {...s, activeTetromino: newTetromino, blocks: finalBoard, boardUpdate: boardUpdate, score: score, nextTetromino: nextTetromino, 
            gameEnd: gameEnd, highScore: highScore, tickBuffer: 0, currentHash: s.currentHash.next(), rowsCleared: s.rowsCleared + rowsCleared, level: level}
    }
    return {...s, activeTetromino: activeTetromino, boardUpdate: boardUpdate, tickBuffer: 0, currentHash: s.currentHash.next()}
}

/**
   * Represents a tick action in the game
   * @implements Action
   */
class Tick implements Action {
    /**
       * Applies the tick action to the current state
       * @param s The current game state
       * @returns The updated game state after the tick
       */
    apply(s: State): State {
        return tick(s);
    }
}

/**
   * Represents a restart action in the game
   * @implements Action
   */
class Restart implements Action {
    /**
       * Restarts the game while preserving the high score
       * @param s The current game state
       * @returns The initial game state with the updated high score
       */
    apply(s: State): State {
        return { ...initialState, highScore: Math.max(s.highScore, s.score), activeTetromino: getTetromino(s.currentHash.value), nextTetromino: getTetromino(s.currentHash.next().value), boardUpdate: true };
    }
}

/**
   * Represents a translation action for the active tetromino
   * @param amount The amount of spaces  moved
   * @param vertical If true, the translation is vertical. Else, horizontal
   * @implements Action
   */
class Translate implements Action {
    constructor(public readonly amount: number, readonly vertical: boolean = false) {}
    /**
       * Translates the active tetromino by the specified spaces
       * @param s The current game state
       * @returns The updated game state after the translation
       */
    apply(s: State): State {
        return { ...s, activeTetromino: translate(s.activeTetromino, this.amount, this.vertical, s), currentHash: s.currentHash.next(), boardUpdate: false };
    }
}

/**
   * Represents a rotation action for the active tetromino.
   * @param clockwise - True if clockwise. Else, anticlockwise
   * @implements Action
   */
class Rotate implements Action {
    constructor(public readonly clockwise: boolean) {}
    /**
       * Rotates the active tetromino in the specified direction.
       * @param s The current game state.
       * @returns The updated game state after the rotation.
       */
    apply(s: State): State {
        return { ...s, activeTetromino: rotate(s.activeTetromino, this.clockwise, s), currentHash: s.currentHash.next(), boardUpdate: false };
    }
}

/**
   * Represents a pause action in the game.
   * @implements Action
   */
class Pause implements Action {
    /**
       * Toggles the paused state of the game.
       * @param s The current game state.
       * @returns The updated game state with the toggled pause state.
       */
    apply(s: State): State {
        return { ...s, paused: !s.paused };
    }
}

class Replay implements Action {
    apply(s: State): State {
        return { ...s, paused: !s.paused };
    }
}

// Initial State
const initialState: State = {
  gameEnd: false,
  activeTetromino: getTetromino(Constants.SEED),
  nextTetromino: getTetromino(Constants.SEED * Constants.SEED),
  blocks: Array(Constants.GRID_HEIGHT).fill(null).map(() => Array(Constants.GRID_WIDTH).fill(0)),
  currentHash: hash(Constants.SEED),
  boardUpdate: false,
  score: 0,
  highScore: 0,
  level: 1,
  tickBuffer: 0,
  rowsCleared: 0,
  paused: false,
  stateHistory: []
} as const

/**
   * State transducer, runs the apply() method of whatever Action it recieves on the current state
   *
   * @param state The current state
   * @returns The updated state
   */
const reduceState = (s: State, action: Action) => action.apply(s)