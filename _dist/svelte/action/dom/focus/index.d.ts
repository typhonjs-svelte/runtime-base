import * as svelte_action from 'svelte/action';
import * as svelte_store from 'svelte/store';
import * as _runtime_svelte_store_util from '@typhonjs-svelte/runtime-base/svelte/store/util';

/**
 * Provides an action to always blur the element when any pointer up event occurs on the element.
 *
 * @param {HTMLElement}   node - The node to handle always blur on pointer up.
 *
 * @returns {import('svelte/action').ActionReturn} Lifecycle functions.
 */
declare function alwaysBlur(node: HTMLElement): svelte_action.ActionReturn;

/**
 * Provides an action to blur the element when any pointer down event occurs outside the element. This can be useful
 * for input elements including select to blur / unfocus the element when any pointer down occurs outside the element.
 *
 * @param {HTMLElement}   node - The node to handle automatic blur on focus loss.
 *
 * @returns {import('svelte/action').ActionReturn} Lifecycle functions.
 */
declare function autoBlur(node: HTMLElement): svelte_action.ActionReturn;

/**
 * Provides an action to monitor focus state of a given element and set an associated store with current focus state.
 *
 * This action is usable with any writable store.
 *
 * @param {HTMLElement} node - Target element.
 *
 * @param {import('#runtime/svelte/store/util').MinimalWritable<boolean>}  storeFocused - Update store for focus
 *        changes.
 *
 * @returns {import('svelte/action').ActionReturn<import('svelte/store').Writable<boolean>>} Lifecycle functions.
 */
declare function isFocused(
  node: HTMLElement,
  storeFocused: _runtime_svelte_store_util.MinimalWritable<boolean>,
): svelte_action.ActionReturn<svelte_store.Writable<boolean>>;

export { alwaysBlur, autoBlur, isFocused };
