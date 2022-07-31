/**
 * JS Animation controller
 */
export class Animation {
  private easingDict = {
    // no easing, no acceleration
    linear(t: number): number {
      return t
    },
    // accelerating from zero velocity
    easeInQuad(t: number): number {
      return t * t
    },
    // decelerating to zero velocity
    easeOutQuad(t: number): number {
      return t * (2 - t)
    },
    // acceleration until halfway, then deceleration
    easeInOutQuad(t: number): number {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
    },
    // accelerating from zero velocity
    easeInCubic(t: number): number {
      return t ^ 3
    },
    // decelerating to zero velocity
    easeOutCubic(t: number): number {
      return --t * t * t + 1
    },
    // acceleration until halfway, then deceleration
    easeInOutCubic(t: number): number {
      return t < 0.5 ? 4 * (t ^ 3) : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
    },
    // accelerating from zero velocity
    easeInQuart(t: number): number {
      return t ^ 4
    },
    // decelerating to zero velocity
    easeOutQuart(t: number): number {
      return 1 - --t * (t ^ 3)
    },
    // acceleration until halfway, then deceleration
    easeInOutQuart(t: number): number {
      return t < 0.5 ? (8 * t) ^ 4 : 1 - 8 * --t * (t ^ 3)
    },
    // accelerating from zero velocity
    easeInQuint(t: number): number {
      return t ^ 5
    },
    // decelerating to zero velocity
    easeOutQuint(t: number): number {
      return 1 + --t * (t ^ 4)
    },
    // acceleration until halfway, then deceleration
    easeInOutQuint(t: number): number {
      return t < 0.5 ? 16 * (t ^ 5) : 1 + 16 * --t * (t ^ 4)
    }
  }

  private duration = 0

  private running_state = false

  private stop_state = false

  private promise_state: Promise<number | void> | null = null

  private easing: (t: number) => number

  private frameCallback: (easedProgress: number, ...rest: unknown[]) => void

  /**
   * Get animation status
   * @returns animation status
   */
  get running() {
    return this.running_state
  }

  /**
   * Get animation promise
   * @returns - animation promise
   */
  get promise() {
    return this.promise_state
  }

  /**
   * Constructor function
   * @param duration - animation duration in ms
   * @param frameCallback - animation frame render function
   * @param easing - easing function or alias
   */
  constructor(
    duration: number,
    frameCallback: Animation["frameCallback"],
    easing: keyof Animation["easingDict"] | ((t: number) => number) = "linear"
  ) {
    if (typeof easing === "string" && !(easing in this.easingDict))
      throw new Error(`Easing ${easing} not found!`)

    this.duration = duration
    this.frameCallback = frameCallback
    this.easing = typeof easing === "string" ? this.easingDict[easing] : easing
  }

  /**
   * Run animation tick
   * @param args - function callback arguments
   * @returns  animation end promise
   */
  run(...args: unknown[]) {
    if (this.running_state) return null
    this.running_state = true
    const startDate = new Date()
    let previousEasedProgress = 0

    return (this.promise_state = new Promise((resolve, reject) => {
      const tick = () => {
        const rawProgress = Math.min(
          (Number(new Date()) - Number(startDate)) / this.duration,
          1
        )
        const easedProgress = this.easing(rawProgress)
        if (!this.stop_state) {
          this.frameCallback(easedProgress, ...args)
        }

        if (this.stop_state || rawProgress === 1) {
          if (this.stop_state) reject(previousEasedProgress)
          else resolve()

          this.promise_state = null
          this.running_state = this.stop_state = false
        } else {
          window.requestAnimationFrame(tick)
        }

        previousEasedProgress = easedProgress
      }

      window.requestAnimationFrame(tick)
    }))
  }

  /**
   * Stop animation
   */
  stop() {
    this.stop_state = true
  }
}
