/**
 * Defines utility functions to select Svelte easing functions. Take note that if all Svelte easing functions need to
 * be imported to reduce duplication use {@link easingFunc} instead of `import * as easingFunc from 'svelte/easing';`.
 *
 * @module
 */

import * as svelte_transition from 'svelte/transition';

/**
 * Defines all the standard 1-dimensional Svelte easing function names.
 */
type EasingFunctionName =
  | 'backIn'
  | 'backInOut'
  | 'backOut'
  | 'bounceIn'
  | 'bounceInOut'
  | 'bounceOut'
  | 'circIn'
  | 'circInOut'
  | 'circOut'
  | 'cubicIn'
  | 'cubicInOut'
  | 'cubicOut'
  | 'elasticIn'
  | 'elasticInOut'
  | 'elasticOut'
  | 'expoIn'
  | 'expoInOut'
  | 'expoOut'
  | 'linear'
  | 'quadIn'
  | 'quadInOut'
  | 'quadOut'
  | 'quartIn'
  | 'quartInOut'
  | 'quartOut'
  | 'quintIn'
  | 'quintInOut'
  | 'quintOut'
  | 'sineIn'
  | 'sineInOut'
  | 'sineOut';

/**
 * Defines a read-only list of Svelte easing function names.
 *
 * @type {Readonly<import('./types').EasingFunctionName[]>}
 */
declare const easingList: Readonly<EasingFunctionName[]>;

/**
 * @type {Readonly<Record<import('./types').EasingFunctionName, import('svelte/transition').EasingFunction>>}
 */
declare const easingFunc: Readonly<Record<EasingFunctionName, svelte_transition.EasingFunction>>;

/**
 * Performs a lookup for standard Svelte easing functions by name. For convenience if passing in a function it is
 * returned verbatim.
 *
 * @param {import('./types').EasingFunctionName | import('svelte/transition').EasingFunction} nameOrFunc - The name of
 *        a standard Svelte easing function or an existing supplied easing function.
 *
 * @param {object}   [options] - Optional parameters.
 *
 * @param {import('./types').EasingFunctionName | false} [options.default='linear'] - The default easing function name
 *        to apply. When specified as `false` no default fallback easing function is selected.
 *
 * @returns {import('svelte/transition').EasingFunction} The requested easing function.
 */
declare function getEasingFunc(
  nameOrFunc: EasingFunctionName | svelte_transition.EasingFunction,
  options?: {
    default?: EasingFunctionName | false;
  },
): svelte_transition.EasingFunction;

export { type EasingFunctionName, easingFunc, easingList, getEasingFunc };
