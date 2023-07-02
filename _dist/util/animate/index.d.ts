/**
 * Awaits `requestAnimationFrame` calls by the counter specified. This allows asynchronous applications for direct /
 * inline style modification amongst other direct animation techniques.
 *
 * @param {number}   [cntr=1] - A positive integer greater than 0 for amount of requestAnimationFrames to wait.
 *
 * @returns {Promise<number>} Returns current time equivalent to `performance.now()`.
 */
declare function nextAnimationFrame(cntr?: number): Promise<number>;

/**
 * Defines a type for basic animation control.
 */
type TJSBasicAnimation = {
    /**
     * True if animation is active; note: delayed animations are not active until start.
     */
    isActive: boolean;
    /**
     * True if animation is completely finished.
     */
    isFinished: boolean;
    /**
     * A Promise that is resolved when animation is finished.
     */
    finished: Promise<void>;
    /**
     * A function that cancels animation.
     */
    cancel: Function;
};

export { TJSBasicAnimation, nextAnimationFrame };
