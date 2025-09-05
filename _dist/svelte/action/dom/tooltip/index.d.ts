import * as svelte_action from 'svelte/action';

/**
 * Provides a popover tooltip action that by default uses the elements `title` attribute.
 *
 * Depending on the runtime and platform the use of `title` may be replaced with an alternate tooltip implementation.
 *
 * @param {HTMLElement} node - Target element.
 *
 * @param {string}  tooltip - The tooltip to set.
 *
 * @returns {import('svelte/action').ActionReturn<string>} Lifecycle functions.
 */
declare function popoverTooltip(node: HTMLElement, tooltip: string): svelte_action.ActionReturn<string>;

export { popoverTooltip };
