import * as svelte_action from 'svelte/action';

/**
 * Defines an `Element.animate` animation from provided keyframes and options.
 *
 * @param {object}         [opts] - Optional parameters.
 *
 * @param {number}         [opts.duration=600] - Duration in milliseconds.
 *
 * @param {Array|object}   opts.keyframes - An array of keyframe objects or a keyframe object whose properties are
 *                                          arrays of values to iterate over.
 *
 * @param {object}         [opts.options] - An object containing one or more timing properties. When defined it is used
 *                                          instead of duration.
 *
 * @param {string}         [opts.event='click'] - DOM event to bind element to respond with the ripple effect.
 *
 * @param {number}         [opts.debounce=undefined] - Add a debounce to incoming events in milliseconds.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/animate
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API/Keyframe_Formats
 *
 * @returns {import('svelte/action').Action} Actual action.
 */
declare function animate({
  duration,
  keyframes,
  options,
  event,
  debounce,
}?: {
  duration?: number;
  keyframes: any[] | object;
  options?: object;
  event?: string;
  debounce?: number;
}): svelte_action.Action;

/**
 * Combines multiple composable actions.
 *
 * Note: The update function passes the same variable to all update functions of each action.
 *
 * @param {...import('svelte/action').Action} actions - One or more composable action functions to combine.
 *
 * @returns {import('svelte/action').Action<HTMLElement, any>} Composed action.
 */
declare function composable(...actions: svelte_action.Action[]): svelte_action.Action<HTMLElement, any>;

export { animate, composable };
