import * as svelte_action from 'svelte/action';
import * as svelte_store from 'svelte/store';

/**
 * Provides an action to save `scrollTop` of an element with a vertical scrollbar. This action should be used on the
 * scrollable element and must include a writable store that holds the active store for the current `scrollTop` value.
 * You may switch the stores externally and this action will set the `scrollTop` based on the newly set store. This is
 * useful for instance providing a select box that controls the scrollable container.
 *
 * @param {HTMLElement} element - The target scrollable HTML element.
 *
 * @param {import('svelte/store').Writable<number>}   store - A writable store that stores the element scrollTop.
 *
 * @returns {import('svelte/action').ActionReturn<import('svelte/store').Writable<number>>} Lifecycle functions.
 */
declare function applyScrolltop(
  element: HTMLElement,
  store: svelte_store.Writable<number>,
): svelte_action.ActionReturn<svelte_store.Writable<number>>;

/**
 * Provides a toggle action for `details` HTML elements. The boolean store when provided controls open / closed state.
 * Animation is accomplished using WAAPI controlling the height of the details element. It should be noted that this
 * animation may cause layout thrashing (reflows) depending on the amount of DOM elements on the page though this
 * doesn't occur under most situations. Animation can be toggled on / off with the `animate` option.
 *
 * It is not necessary to bind the store to the `open` attribute of the associated details element.
 *
 * When the action is triggered to close the details element a data attribute `closing` is set to `true`. This allows
 * any associated closing transitions to start immediately.
 *
 * @param {HTMLDetailsElement} details - The details element.
 *
 * @param {object} opts - Options parameters.
 *
 * @param {import('svelte/store').Writable<boolean>} opts.store - A boolean store.
 *
 * @param {boolean} [opts.animate=true] - When true animate close / open state with WAAPI.
 *
 * @param {boolean} [opts.clickActive=true] - When false click events are not handled.
 *
 * @returns {import('svelte/action').ActionReturn} Lifecycle functions.
 */
declare function toggleDetails(
  details: HTMLDetailsElement,
  {
    store,
    animate,
    clickActive,
  }?: {
    store: svelte_store.Writable<boolean>;
    animate?: boolean;
    clickActive?: boolean;
  },
): svelte_action.ActionReturn;

export { applyScrolltop, toggleDetails };
