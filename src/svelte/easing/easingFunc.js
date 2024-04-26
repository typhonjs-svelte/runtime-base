import * as svelteEasingFunc from '#svelte/easing';

/**
 * @type {Readonly<Record<import('./types').EasingFunctionName, import('svelte/transition').EasingFunction>>}
 */
export const easingFunc = Object.freeze(svelteEasingFunc);
