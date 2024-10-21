import * as svelte_action from 'svelte/action';
import * as _runtime_svelte_store_util from '@typhonjs-svelte/runtime-base/svelte/store/util';

/**
 * Provides an action to save `scrollTop` of an element with a vertical scrollbar. This action should be used on the
 * scrollable element and must include a writable store that holds the active store for the current `scrollTop` value.
 * You may switch the stores externally and this action will set the `scrollTop` based on the newly set store. This is
 * useful for instance providing a select box that controls the scrollable container.
 *
 * @param {HTMLElement} element - The target scrollable HTML element.
 *
 * @param {import('#runtime/svelte/store/util').MinimalWritable<number>}   store - A minimal writable store that stores
 *        the element scrollTop.
 *
 * @returns {(import('svelte/action').ActionReturn<
 *    import('#runtime/svelte/store/util').MinimalWritable<number>
 * >)} Lifecycle functions.
 */
declare function applyScrolltop(
  element: HTMLElement,
  store: _runtime_svelte_store_util.MinimalWritable<number>,
): svelte_action.ActionReturn<_runtime_svelte_store_util.MinimalWritable<number>>;

export { applyScrolltop };
