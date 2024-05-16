import { easingFunc } from './easingFunc.js';

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
export function getEasingFunc(easingRef, options)
{
   if (typeof easingRef === 'function') { return easingRef; }

   const easingFn = easingFunc[easingRef];

   return easingFn ? easingFn : easingFunc[options?.default ?? 'linear'];
}
