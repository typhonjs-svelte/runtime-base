import * as svelte_action from 'svelte/action';

/**
 * Provides an action to apply style properties provided as an object.
 *
 * @param {HTMLElement} node - Target element
 *
 * @param {Record<string, string>}  properties - Key / value object of properties to set.
 *
 * @returns {import('svelte/action').ActionReturn<Record<string, string>>} Lifecycle functions.
 */
declare function applyStyles(
  node: HTMLElement,
  properties: Record<string, string>,
): svelte_action.ActionReturn<Record<string, string>>;

export { applyStyles };
