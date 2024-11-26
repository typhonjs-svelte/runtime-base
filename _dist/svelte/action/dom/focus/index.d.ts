import * as svelte_action from 'svelte/action';
import * as _runtime_svelte_store_util from '@typhonjs-svelte/runtime-base/svelte/store/util';

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
 * @returns {(import('svelte/action').ActionReturn<
 *    import('#runtime/svelte/store/util').MinimalWritable<boolean>
 * >)} Lifecycle functions.
 */
declare function isFocused(
  node: HTMLElement,
  storeFocused: _runtime_svelte_store_util.MinimalWritable<boolean>,
): svelte_action.ActionReturn<_runtime_svelte_store_util.MinimalWritable<boolean>>;

export { isFocused };
