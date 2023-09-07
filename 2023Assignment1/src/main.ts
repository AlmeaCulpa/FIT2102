/**
 * Inside this file you will use the classes and functions from rx.js
 * to add visuals to the svg element in index.html, animate them, and make them interactive.
 *
 * Study and complete the tasks in observable exercises first to get ideas.
 *
 * Course Notes showing Asteroids in FRP: https://tgdwyer.github.io/asteroids/
 *
 * You will be marked on your functional programming style
 * as well as the functionality that you implement.
 *
 * Document your code!
 */

import "./style.css"

import { fromEvent, interval, merge, Observable } from "rxjs"
import { map, filter, scan, takeUntil, mergeMap } from "rxjs/operators"
import { State, Action, Key, Event } from "./types"
import { Constants, Translate, Rotate, Tick, Restart, Pause, initialState, reduceState } from "./state.ts"
import { render, show, hide, gameover, pause } from "./view.ts"

/**
 * This is the function called on page load. Your main game loop
 * should be called here.
 */
function main() {
  const
    keyObservable = <T>(e: Event, k: Key, result: () => T) =>
        fromEvent<KeyboardEvent>(document, e).pipe(
        filter(({ code }) => code === k),
        filter(({ repeat }) => !repeat),
        map(result)
    ),
    gameTick$ = interval(Constants.TICK_RATE_MS).pipe(map(() => new Tick())),
    leftTranslate$ = keyObservable('keypress','KeyA',() => new Translate(-1, false)),
    rightTranslate$ = keyObservable('keypress','KeyD',() => new Translate(1, false)),
    // Made different than the others so that the button can be held for quicker dropping, rather than needing to rapid tap.
    downTranslate$ = fromEvent<KeyboardEvent>(document, 'keydown').pipe(
        filter(({ code }) => code === 'KeyS'),
        filter(({ repeat }) => !repeat),
        mergeMap(() => interval(50).pipe( // Mapping the event onto an interval(50) to repeat every 50ms.
            map(() => new Translate(1, true)),
            takeUntil(fromEvent<KeyboardEvent>(document, 'keyup').pipe(
                filter(({ code }) => code === 'KeyS')
            ))
        ))
    ),
    clockwiseRotate$ = keyObservable('keypress', 'KeyE', () => new Rotate(true)),
    antiClockwiseRotate$ = keyObservable('keypress', 'KeyQ', () => new Rotate(false)),
    restart$ = keyObservable('keypress', 'KeyX', () => new Restart()),
    pause$ = keyObservable('keypress', 'KeyP', () => new Pause())
  
  // It's neater to combine these as a single stream of Observable 'Action's
  const actions$: Observable<Action> = merge(gameTick$, leftTranslate$, rightTranslate$, downTranslate$, clockwiseRotate$, antiClockwiseRotate$, restart$, pause$)
  
  // The main observable, combining and reducing others. This observes every player input and tick
  const source$ = actions$.pipe(scan(reduceState, initialState))
  .subscribe((s: State) => {
      render(s)
      if (s.gameEnd) {
        show(gameover)
      } else {
        hide(gameover)
      }
      if (s.paused) {
        show(pause)
      } else {
        hide(pause)
      }
    })
}

// The following simply runs your main function on window load.  Make sure to leave it in place.x
if (typeof window !== "undefined") {
  window.onload = () => {
    main()
  }
}
