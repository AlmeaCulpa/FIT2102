export type {Board, Tetromino, State, Action, Key, Event, LazySequence}

type Board = ReadonlyArray<ReadonlyArray<number>> // Essentially just an alias for the 2d board. It's much more readable to see "Board" as an argument.
type Tetromino = Readonly<{type: string, shape: ReadonlyArray<ReadonlyArray<number>>, colourID: number, locked: boolean, x: number, y: number}>
type Key = "KeyS" | "KeyA" | "KeyD" | "KeyQ" | "KeyE" | "KeyX" | "KeyF" | "KeyP"
type Event = "keydown" | "keyup" | "keypress"

type State = Readonly<{
    gameEnd: boolean
    activeTetromino: Tetromino
    nextTetromino: Tetromino
    blocks: Board
    currentHash: LazySequence<number>
    boardUpdate: boolean
    score: number
    highScore: number,
    level: number
    tickBuffer: number, // Used to determine which ticks blocks should fall on. See tick() in state.ts
    rowsCleared: number,
    paused: boolean,
    stateHistory: ReadonlyArray<State>
}>

interface Action {
    apply(s: State): State
}

interface LazySequence<T> {
    value: T
    next():LazySequence<T>
  }