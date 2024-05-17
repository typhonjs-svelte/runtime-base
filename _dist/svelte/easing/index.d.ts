/**
 * Defines utility functions to select Svelte 1-dimensional easing functions. Take note that if all Svelte easing
 * functions need to be imported to reduce duplication use {@link easingFunc} instead of
 * `import * as easingFunc from 'svelte/easing';`.
 *
 * @module
 */

import { EasingFunction } from 'svelte/transition';
export { EasingFunction } from 'svelte/transition';
import * as _runtime_svelte_easing from '@typhonjs-svelte/runtime-base/svelte/easing';

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
 * Defines an easing input as either a predefined easing function name or a custom easing function.
 */
type EasingReference = EasingFunctionName | EasingFunction;

/**
 * Defines a read-only list of Svelte easing function names.
 *
 * @type {Readonly<import('./types').EasingFunctionName[]>}
 */
declare const easingList: Readonly<EasingFunctionName[]>;

/**
 * @type {Readonly<Record<import('./types').EasingFunctionName, import('#runtime/svelte/easing').EasingFunction>>}
 */
declare const easingFunc: Readonly<Record<EasingFunctionName, _runtime_svelte_easing.EasingFunction>>;

/**
 * Performs a lookup for standard Svelte easing functions by name. For convenience if passing in a function it is
 * returned verbatim.
 *
 * @param {import('./types').EasingReference} easingRef - The name of a standard Svelte easing function or a supplied
 *        easing function.
 *
 * @param {object}   [options] - Optional parameters.
 *
 * @param {import('./types').EasingFunctionName | false} [options.default='linear'] - A default easing function by
 *        name to return. When specified as `false` no default fallback easing function is selected. The default value
 *        is `linear`.
 *
 * @returns {import('#runtime/svelte/easing').EasingFunction} The requested easing function.
 */
declare function getEasingFunc(
  easingRef: EasingReference,
  options?: {
    default?: EasingFunctionName | false;
  },
): _runtime_svelte_easing.EasingFunction;

export { type EasingFunctionName, type EasingReference, easingFunc, easingList, getEasingFunc };
