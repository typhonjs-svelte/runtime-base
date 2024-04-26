import * as svelteEasingFunc from '#svelte/easing';

/**
 * @type {Readonly<Record<import('./types').EasingFunctionName, import('#runtime/svelte/easing').EasingFunction>>}
 */
export const easingFunc = Object.freeze(svelteEasingFunc);
