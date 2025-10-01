import * as svelte_action from 'svelte/action';
import { MinimalWritable } from '@typhonjs-svelte/runtime-base/svelte/store/util';

declare namespace DOMPropActionOptions {
  /**
   * Options for {@link applyScroll} action.
   */
  interface ApplyScroll {
    /**
     * Store that serializes element `scrollLeft` value.
     */
    scrollLeft?: MinimalWritable<number>;
    /**
     * Store that serializes element `scrollTop` value.
     */
    scrollTop?: MinimalWritable<number>;
  }
  /**
   * Options for the {@link toggleDetails} action.
   */
  interface ToggleDetails {
    /**
     * A minimal writable boolean store for details element open state.
     */
    store?: MinimalWritable<boolean>;
    /**
     * When true, animate close / open state with WAAPI.
     *
     * @defaultValue `true`
     */
    animate?: boolean;
    /**
     * When false, click events are not handled.
     *
     * @defaultValue `true`
     */
    clickActive?: boolean;
    /**
     * When false, store changes and click events are not handled.
     *
     * @defaultValue `true`
     */
    enabled?: boolean;
  }
}

/**
 * Provides an action to save `scrollTop` / `scrollLeft` of an element with scrollbars. This action should be used on
 * the scrollable element and must include writable stores that holds the active store for the current `scrollTop` /
 * `scrollLeft` value.
 *
 * You may switch the stores externally and this action will update based on the newly set store. This is useful for
 * instance providing a select box that controls the scrollable container switching between multiple lists of data
 * serializing scroll position between each.
 *
 * @param {HTMLElement} node - The target scrollable HTML element.
 *
 * @param {import('./types').DOMPropActionOptions.ApplyScroll} options - Options.
 *
 * @returns {(import('svelte/action').ActionReturn<import('./types').DOMPropActionOptions.ApplyScroll>)} Lifecycle
 *          functions.
 */
declare function applyScroll(
  node: HTMLElement,
  options?: DOMPropActionOptions.ApplyScroll,
): svelte_action.ActionReturn<DOMPropActionOptions.ApplyScroll>;

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
 * @param {HTMLDetailsElement} details - The `details` element.
 *
 * @param {import('./types').DOMPropActionOptions.ToggleDetails} - Options.
 *
 * @returns {import('svelte/action').ActionReturn<import('./types').DOMPropActionOptions.ToggleDetails>} Lifecycle
 *          functions.
 */
declare function toggleDetails(
  details: HTMLDetailsElement,
  { store, animate, clickActive, enabled }?: DOMPropActionOptions.ToggleDetails,
): svelte_action.ActionReturn<DOMPropActionOptions.ToggleDetails>;

export { DOMPropActionOptions, applyScroll, toggleDetails };
