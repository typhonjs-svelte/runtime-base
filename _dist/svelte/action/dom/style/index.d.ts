import { ActionReturn } from 'svelte/action';
import { FindParentOptions } from '@typhonjs-svelte/runtime-base/util/dom/layout';

/**
 * Provides a Svelte action that applies absolute positioning to an element adjusting for any painted borders defined
 * by CSS `border-image` properties of the parent element of the target node / element of this action.
 *
 * When enabled, this action computes the effective visual edge insets / painted border using
 * {@link #runtime/util/dom/style!StyleMetric.getVisualEdgeInsets} and applies inline `position: absolute` styles so
 * the element aligns correctly within the visible (non-border) content area of its container.
 *
 * Additionally, this action subscribes to {@link #runtime/util/dom/theme!ThemeObserver} and updates constraint
 * calculations when any global theme is changed. To force an update of constraint calculations provide and change
 * a superfluous / dummy property in the action options.
 *
 * @param node - Target element.
 *
 * @param [options] - Action Options.
 *
 * @param [options.enabled] - When enabled set inline styles for absolute positioning taking into account visual edge
 *        insets / any border image constraints.
 *
 * @returns Action lifecycle functions.
 */
declare function absToVisualEdgeInsets(
  node: HTMLElement,
  {
    enabled,
  }?: {
    enabled?: boolean;
  },
): ActionReturn<{
  enabled?: boolean;
}>;

/**
 * Provides an action to apply CSS style properties provided as an object.
 *
 * @param node - Target element
 *
 * @param properties - Hyphen case CSS property key / value object of properties to set.
 *
 * @returns Action lifecycle functions.
 */
declare function applyStyles(
  node: HTMLElement,
  properties: {
    [key: string]: string | null;
  },
): ActionReturn<{
  [key: string]: string | null;
}>;

/**
 * Provides a Svelte action that applies inline styles for `padding` to an element adjusting for any painted borders
 * defined by CSS `border-image` properties of the target node / element of this action.
 *
 * When enabled, this action computes the effective visual edge insets / painted border using
 * {@link #runtime/util/dom/style!StyleMetric.getVisualEdgeInsets} and applies inline `position: absolute` styles so
 * the element aligns correctly within the visible (non-border) content area of its container.
 *
 * Additionally, this action subscribes to {@link #runtime/util/dom/theme!ThemeObserver} and updates constraint
 * calculations when any global theme is changed. To force an update of constraint calculations provide and change
 * a superfluous / dummy property in the action options.
 *
 * @param node - Target element.
 *
 * @param [options] - Action Options.
 *
 * @param [options.sides] - Padding sides configuration. When undefined or true all sides receive padding.
 *
 * @param [options.parent] - Parent targeting for visual edge computations. When false, the target is this actions
 *        element.
 *
 * @returns Action Lifecycle functions.
 */
declare function padToVisualEdgeInsets(
  node: HTMLElement,
  options?: {
    sides?: PadToVisualEdgeSides;
    parent?: boolean | FindParentOptions;
  },
): ActionReturn<{
  sides?: PadToVisualEdgeSides;
  parent?: boolean | FindParentOptions;
}>;
type PadToVisualEdgeSides =
  | false
  | true
  | 'all'
  | 'vertical'
  | 'horizontal'
  | {
      top?: boolean;
      right?: boolean;
      bottom?: boolean;
      left?: boolean;
    };

export { absToVisualEdgeInsets, applyStyles, padToVisualEdgeInsets };
export type { PadToVisualEdgeSides };
