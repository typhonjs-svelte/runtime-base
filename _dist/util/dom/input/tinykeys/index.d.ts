/**
 * A tiny (~650 B) & modern library for keybindings.
 *
 * Super handy as `tinykeys` returns an `unsubscribe` function which makes it easy to integrate with Svelte actions
 * or otherwise.
 *
 * @see https://www.npmjs.com/package/tinykeys
 *
 * @module
 */

/**
 * A single press of a keybinding sequence
 */
declare type KeyBindingPress = [mods: string[], key: string | RegExp];
/**
 * A map of keybinding strings to event handlers.
 */
interface KeyBindingMap {
  [keybinding: string]: (event: KeyboardEvent) => void;
}
interface KeyBindingHandlerOptions {
  /**
   * Keybinding sequences will wait this long between key presses before
   * cancelling (default: 1000).
   *
   * **Note:** Setting this value too low (i.e. `300`) will be too fast for many
   * of your users.
   */
  timeout?: number;
}
/**
 * Options to configure the behavior of keybindings.
 */
interface KeyBindingOptions extends KeyBindingHandlerOptions {
  /**
   * Key presses will listen to this event (default: "keydown").
   */
  event?: 'keydown' | 'keyup';
  /**
   * Key presses will use a capture listener (default: false)
   */
  capture?: boolean;
}
/**
 * Parses a "Key Binding String" into its parts
 *
 * grammar    = `<sequence>`
 * <sequence> = `<press> <press> <press> ...`
 * <press>    = `<key>` or `<mods>+<key>`
 * <mods>     = `<mod>+<mod>+...`
 * <key>      = `<KeyboardEvent.key>` or `<KeyboardEvent.code>` (case-insensitive)
 * <key>      = `(<regex>)` -> `/^<regex>$/` (case-sensitive)
 */
declare function parseKeybinding(str: string): KeyBindingPress[];
/**
 * This tells us if a single keyboard event matches a single keybinding press.
 */
declare function matchKeyBindingPress(event: KeyboardEvent, [mods, key]: KeyBindingPress): boolean;
/**
 * Creates an event listener for handling keybindings.
 *
 * @example
 * ```js
 * import { createKeybindingsHandler } from "../src/keybindings"
 *
 * let handler = createKeybindingsHandler({
 * 	"Shift+d": () => {
 * 		alert("The 'Shift' and 'd' keys were pressed at the same time")
 * 	},
 * 	"y e e t": () => {
 * 		alert("The keys 'y', 'e', 'e', and 't' were pressed in order")
 * 	},
 * 	"$mod+d": () => {
 * 		alert("Either 'Control+d' or 'Meta+d' were pressed")
 * 	},
 * })
 *
 * window.addEvenListener("keydown", handler)
 * ```
 */
declare function createKeybindingsHandler(
  keyBindingMap: KeyBindingMap,
  options?: KeyBindingHandlerOptions,
): EventListener;
/**
 * Subscribes to keybindings.
 *
 * Returns an unsubscribe method.
 *
 * @example
 * ```js
 * import { tinykeys } from "../src/tinykeys"
 *
 * tinykeys(window, {
 * 	"Shift+d": () => {
 * 		alert("The 'Shift' and 'd' keys were pressed at the same time")
 * 	},
 * 	"y e e t": () => {
 * 		alert("The keys 'y', 'e', 'e', and 't' were pressed in order")
 * 	},
 * 	"$mod+d": () => {
 * 		alert("Either 'Control+d' or 'Meta+d' were pressed")
 * 	},
 * })
 * ```
 */
declare function tinykeys(
  target: Window | HTMLElement,
  keyBindingMap: KeyBindingMap,
  { event, capture, timeout }?: KeyBindingOptions,
): () => void;

export {
  type KeyBindingHandlerOptions,
  type KeyBindingMap,
  type KeyBindingOptions,
  type KeyBindingPress,
  createKeybindingsHandler,
  matchKeyBindingPress,
  parseKeybinding,
  tinykeys,
};