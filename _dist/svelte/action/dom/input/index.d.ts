import * as svelte_action from 'svelte/action';
import * as _runtime_util_dom_input_tinykeys from '@typhonjs-svelte/runtime-base/util/dom/input/tinykeys';

/**
 * Provides an action to forward on key down & up events. This can be any object that has associated `keydown` and
 * `keyup` methods. See {@link KeyStore} for a store implementation.
 *
 * @param {HTMLElement} node - Target element.
 *
 * @param {{ keydown: (event: KeyboardEvent) => void, keyup: (event: KeyboardEvent) => void }}  keyTarget - An object
 *        to forward events key down / up events to as pressed.
 *
 * @returns {(import('svelte/action').ActionReturn<
 *    { keydown: (event: KeyboardEvent) => void, keyup: (event: KeyboardEvent) => void }
 * >)} Action lifecycle methods.
 */
declare function keyforward(
  node: HTMLElement,
  keyTarget: {
    keydown: (event: KeyboardEvent) => void;
    keyup: (event: KeyboardEvent) => void;
  },
): svelte_action.ActionReturn<{
  keydown: (event: KeyboardEvent) => void;
  keyup: (event: KeyboardEvent) => void;
}>;

/**
 * Provides an action to use `tinykeys`.
 *
 * @param {HTMLElement} node - Target element.
 *
 * @param {UseTinykeysData}  data - An object to forward events key down / up events to as pressed.
 *
 * @returns {import('svelte/action').ActionReturn<UseTinykeysData>} Action lifecycle methods.
 */
declare function useTinykeys(node: HTMLElement, data: UseTinykeysData): svelte_action.ActionReturn<UseTinykeysData>;
type UseTinykeysData = {
  /**
   * Key binding map to instantiate
   * `tinykeys` implementation.
   */
  keyBindingMap: _runtime_util_dom_input_tinykeys.KeyBindingMap;
  /**
   * Options to pass to `tinykeys`.
   */
  options?: _runtime_util_dom_input_tinykeys.KeyBindingOptions;
};

export { keyforward, useTinykeys };
export type { UseTinykeysData };
