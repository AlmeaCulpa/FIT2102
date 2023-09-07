import { clearBlocks } from "./util.ts"
import { Tetromino, State, Board} from "./types"
import { ColourMap } from "./tetrominos.ts"
import { Viewport, Block} from "./state.ts"
export { render, show, hide, gameover, pause }

/**
 * Displays a SVG element on the canvas. Brings to foreground.
 * @param elem SVG element to display
 */
const show = (elem: SVGGraphicsElement) => {
    elem.setAttribute("visibility", "visible")
    elem.parentNode!.appendChild(elem)
}
  
  /**
   * Hides a SVG element on the canvas.
   * @param elem SVG element to hide
   */
const hide = (elem: SVGGraphicsElement) =>
    elem.setAttribute("visibility", "hidden")
  
  /**
   * Creates an SVG element with the given properties.
   *
   * See https://developer.mozilla.org/en-US/docs/Web/SVG/Element for valid
   * element names and properties.
   *
   * @param namespace Namespace of the SVG element
   * @param name SVGElement name
   * @param props Properties to set on the SVG element
   * @returns SVG element
   */

const createSvgElement = (
    namespace: string | null,
    name: string,
    props: Record<string, string> = {}
    ) => {
    const elem = document.createElementNS(namespace, name) as SVGElement
    Object.entries(props).forEach(([k, v]) => elem.setAttribute(k, v))
    return elem
}

/**
   * Creates an single square as part of a tetronimo or the board with the given properties
   * Two cases as squares could be generated in one of two namespaces
   * 
   * @param namespace Namespace of the SVG element
   * @param colourID Integer colour ID of the square being generat
   * @param column Column of the board to place the square in
   * @param row Row of the board to place the square in
   */
const createSvgSquare = (namespace: string, colourID: number, column: number, row: number, classType: string): void => {
    switch (namespace) {
        case "svg": {
        const elem = createSvgElement(svg.namespaceURI, "rect", {
            class: classType,
            height: `${Block.HEIGHT}`,
            width: `${Block.WIDTH}`,
            x: `${column * Block.WIDTH}`,
            y: `${row * Block.HEIGHT}`,
            style: "fill: " + ColourMap[colourID],
        })
        svg.appendChild(elem)
        break
        }
        case "preview": {
        const elem = createSvgElement(preview.namespaceURI, "rect", {
            class: classType,
            height: `${Block.HEIGHT}`,
            width: `${Block.WIDTH}`,
            x: `${column * Block.WIDTH + (Block.WIDTH * 2)}`,
            y: `${row * Block.HEIGHT  + (Block.HEIGHT)}`,
            style: "fill: " + ColourMap[colourID],
        })
        preview.appendChild(elem)
        break
        }
    }
}

const 
    // SVG Elements
    svg = document.querySelector("#svgCanvas") as SVGGraphicsElement & HTMLElement,
    preview = document.querySelector("#svgPreview") as SVGGraphicsElement & HTMLElement,
    gameover = document.querySelector("#gameOver") as SVGGraphicsElement & HTMLElement,
    pause = document.querySelector("#pauseBox") as SVGGraphicsElement & HTMLElement,
    container = document.querySelector("#main") as HTMLElement,
    // Variable text elements
    scoretext = document.querySelector("#scoreText") as HTMLElement,
    highscoretext = document.querySelector("#highScoreText") as HTMLElement,
    levelText = document.querySelector("#levelText") as HTMLElement

// Setting attributes based on Viewport constants (see: state.ts)
svg.setAttribute("height", `${Viewport.CANVAS_HEIGHT}`)
svg.setAttribute("width", `${Viewport.CANVAS_WIDTH}`)
preview.setAttribute("height", `${Viewport.PREVIEW_HEIGHT}`)
preview.setAttribute("width", `${Viewport.PREVIEW_WIDTH}`)

/**
   * Draws a tetronimo either in the game board or the preview window
   * 
   * @param piece The tetronimo being drawn
   * @param namespace Namespace of the SVG element
   */
const drawTetromino = (piece: Tetromino, namespace: string): void => piece.shape.forEach((row, rowIndex) => 
    row.forEach((cell, columnIndex) => cell != 0 ? 
    createSvgSquare(namespace, cell - 1, columnIndex + piece.x, rowIndex + piece.y, "activeBlock") : null))

/**
   * Draws the entire board when changes to it are made
   * 
   * @param board The current game board 2d array
   */
const drawBoard = (board: Board): void => board.forEach((row, rowIndex) => 
    row.forEach((cell, columnIndex) => cell != 0 ? 
    createSvgSquare("svg", cell - 1, columnIndex, rowIndex, `passiveBlock`) : null))

/**
   * Handles all drawing and redrawing of any blocks and tetronimos
   * 
   * @param s The current state
   */
const blockRender = (s: State): void => {
    clearBlocks("activeBlock") 
    drawTetromino(s.activeTetromino, "svg")
    drawTetromino(s.nextTetromino, "preview")
    if (s.boardUpdate) {
        clearBlocks("passiveBlock")
        drawBoard(s.blocks)
    }
}

/**
   * Renders the current state to the canvas.
   * In MVC terms, this updates the View using the Model.
   *
   * @param s Current state
   */

const render = (s: State) => {
    levelText.innerHTML = String(s.level)
    scoretext.innerHTML = String(s.score)
    highscoretext.innerHTML = String(s.highScore)
    if (s.gameEnd) {return}
    blockRender(s)
}