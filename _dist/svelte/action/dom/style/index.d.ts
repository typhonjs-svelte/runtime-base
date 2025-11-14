import * as svelte_action from 'svelte/action';

/**
 * Provides a Svelte action that applies absolute positioning to an element adjusting for any painted borders defined
 * by CSS `border-image` properties of the parent element of the target node / element of this action.
 *
 * When enabled, this action computes the effective painted border using
 * {@link #runtime/util/dom/style!StyleMetric.getPaintedBorderWidth} and applies inline `position: absolute` styles so
 * the element aligns correctly within the visible (non-border) content area of its container.
 *
 * Additionally, this action subscribes to {@link #runtime/util/dom/theme!ThemeObserver} and updates constraint
 * calculations when any global theme is changed. To force an update of constraint calculations provide and change
 * a superfluous / dummy property in the action options.
 *
 * @param {HTMLElement} node - Target element.
 *
 * @param {object}  [options] - Action Options.
 *
 * @param {boolean} [options.enabled] - When enabled set inline styles for absolute positioning taking into account
 *        any border image constraints.
 *
 * @returns {import('svelte/action').ActionReturn<{ enabled?: boolean }>} Lifecycle functions.
 */
declare function absWithinBorder(
  node: HTMLElement,
  {
    enabled,
  }?: {
    enabled?: boolean;
  },
): svelte_action.ActionReturn<{
  enabled?: boolean;
}>;

/**
 * Provides an action to apply CSS style properties provided as an object.
 *
 * @param {HTMLElement} node - Target element
 *
 * @param {{ [key: string]: string | null }}  properties - Hyphen case CSS property key / value object of properties
 *        to set.
 *
 * @returns {import('svelte/action').ActionReturn<{ [key: string]: string | null }>} Lifecycle functions.
 */
declare function applyStyles(
  node: HTMLElement,
  properties: {
    [key: string]: string | null;
  },
): svelte_action.ActionReturn<{
  [key: string]: string | null;
}>;

/**
 * Provides a Svelte action that applies inline styles for `padding` to an element adjusting for any painted borders
 * defined by CSS `border-image` properties of the target node / element of this action.
 *
 * When enabled, this action computes the effective painted border using
 * {@link #runtime/util/dom/style!StyleMetric.getPaintedBorderWidth} and applies inline `position: absolute` styles so
 * the element aligns correctly within the visible (non-border) content area of its container.
 *
 * Additionally, this action subscribes to {@link #runtime/util/dom/theme!ThemeObserver} and updates constraint
 * calculations when any global theme is changed. To force an update of constraint calculations provide and change
 * a superfluous / dummy property in the action options.
 *
 * @param {HTMLElement} node - Target element.
 *
 * @param {object}  [options] - Action Options.
 *
 * @param {boolean} [options.enabled] - When enabled set inline styles for padding taking into account any visual
 *        border image constraints.
 *
 * @param {boolean} [options.parent] - When true, the parent element to the action element is adjusted.
 *
 * @returns {import('svelte/action').ActionReturn<{ enabled?: boolean, parent?: boolean }>} Lifecycle functions.
 */
declare function padToBorder(
  node: HTMLElement,
  {
    enabled,
    parent,
  }?: {
    enabled?: boolean;
    parent?: boolean;
  },
): svelte_action.ActionReturn<{
  enabled?: boolean;
  parent?: boolean;
}>;

export { absWithinBorder, applyStyles, padToBorder };
