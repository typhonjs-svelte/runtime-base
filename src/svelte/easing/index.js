/**
 * Defines utility functions to select Svelte easing functions. Take note that if all Svelte easing functions need to
 * be imported to reduce duplication use {@link easingFunc} instead of `import * as easingFunc from 'svelte/easing';`.
 *
 * @module
 */

export * from './easingList.js';
export * from './easingFunc.js';
export * from './getEasingFunc.js';
