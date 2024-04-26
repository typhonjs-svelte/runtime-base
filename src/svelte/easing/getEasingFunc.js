import { easingFunc } from './easingFunc.js';

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
export function getEasingFunc(nameOrFunc, options)
{
   if (typeof nameOrFunc === 'function') { return nameOrFunc; }

   const easingFn = easingFunc[nameOrFunc];

   return easingFn ? easingFn : easingFunc[options?.default ?? 'linear'];
}
