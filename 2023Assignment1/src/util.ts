import { Tetromino, State, Board, LazySequence } from "./types"
import { Tetrominos } from "./tetrominos.ts"
export { hash, calcScore, getPosition, getNonZeroRows, hasBlocks, clearBlocks, canMove, getTetromino, setPiece, getNonFullRows, type LazySequence}

/**
   * Hash function for use in generating new random numbers each tick
   *
   * @param seed The starting seed for the hash function
   */
function hash(seed: number) {
  const m = 0x80000000 // 2**31
  const a = 1103515245
  const c = 12345

  /**
   * Lazy sequence function. Invoking next will return a hash with the next number in "sequence" as it's value
   *
   * @param seed The starting seed for the hash function
   */
  return function _next(n:number): LazySequence<number> {
      return {
          value: n,
          next: ()=>_next((a * n + c) % m)
      }
  }(seed)
}

/**
   * Sets the active tetronimo onto the board
   *
   * @param s The current state
   * @returns The updated board
   */
const setPiece = (s: State): Board =>  {
  const position = getPosition(s.activeTetromino)
  const board = s.blocks
  // If position.some is true, this position is part of the new board and the new tetronimo and should have the new colour ID
  // If it is not true, this position is part of the existing board and should have the existing cell's number
  return board.map((row, rowIndex) => 
  row.map((cell, colIndex) => 
  position.some(([x, y]) => x === rowIndex && y === colIndex) ? s.activeTetromino.colourID : cell
  ))
}

/**
   * Gets the [x,y] positions on the board of each square in a tetronimo
   * New array of co-ordinates squares calculated by adding the x/y of the tetronimo's position on the board and the x/y indexes within the tetronimo
   * 
   * @param piece The tetronimo being checked
   * @returns 2d array of [x,y] positions for each square
   */
const getPosition = (piece: Tetromino): Array<Array<number>> =>
  piece.shape
    .map((row, rowIndex) =>  row
    .map((cell, columnIndex) => cell != 0 ? [rowIndex + piece.y, columnIndex + piece.x] : -10)) 
    .flat().filter(element => element != -10) as Array<Array<number>> // -10 is an arbitrary number. Any number other than 0-7 would be fine.
  
/**
   * Returns a board with only rows that have at least one block in them
   * 
   * @param board The current board
   * @returns Non-zero row board
   */
const getNonZeroRows = (board: Board): Board => board.slice(board.findIndex((row) => hasBlocks(row)))

/**
   * Returns a board with only the non-full rows
   * 
   * @param board The current board
   * @returns Non-zero row board
   */
const getNonFullRows = (board: Board): Board => board.filter((row) => !isFullRow(row))

/**
   * Returns true if all desiredPositions on the board are zeros/unoccupied
   * 
   * @param desiredPositions The [x,y] positions on the board that are checked
   * @param board The current board
   * @returns True if the position is valid. Else, false
   */
const canMove = (desiredPositions: Board, board: Board): boolean => {
  try {
    return desiredPositions.every((element) => board[element[0]][element[1]] === 0)
  }
  catch { // This catches the error in which it's desired position is out of bounds of the board, in which case, it can't move there anyway
    return false
  }
}

// Returns a score dependant on the number of rows cleared
const calcScore = (rowsCleared: number): number => {
  switch(rowsCleared) {
    case 1:
      return 100
    case 2:
      return 250
    case 3:
      return 500
    case 4:
      return 1000
    default:
      return 0
  }
}

// Returns true if the row is full
const isFullRow = (row: ReadonlyArray<number>): boolean => row.every((num) => num != 0)

// Returns true if the row has any blocks
const hasBlocks = (row: ReadonlyArray<number>): boolean => row.some((num) => num != 0)

// Clears all blocks of given className
const clearBlocks = (className: string): void => Array.from(document.getElementsByClassName(className)).forEach(element => element.remove())

// Gets a tetronimo based on the value given modulo with amount of possible tetronimos
const getTetromino = (val: number): Tetromino => Tetrominos[val % Tetrominos.length]
