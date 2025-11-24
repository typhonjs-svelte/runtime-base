import { ActionReturn } from 'svelte/action';
import { StyleMetric } from '@typhonjs-svelte/runtime-base/util/dom/style';
import { MinimalWritable } from '@typhonjs-svelte/runtime-base/svelte/store/util';
import { FindParentOptions } from '@typhonjs-svelte/runtime-base/util/dom/layout';

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
 * Provides a Svelte action that applies inline styles for `padding` to a parent element or `absolute positioning` to
 * the action element adjusting for any painted borders defined by CSS `border-image` properties of the target
 * node / element of this action.
 *
 * When enabled, this action computes the effective visual edge insets / painted border using
 * {@link #runtime/util/dom/style!StyleMetric.getVisualEdgeInsets} and applies these constraints to either `padding`
 * or absolute inline styles so the element aligns correctly within the visible (non-border) content area of its
 * container.
 *
 * Additionally, this action subscribes to {@link #runtime/util/dom/theme!ThemeObserver} and updates constraint
 * calculations when any global theme is changed. To force an update of constraint calculations provide and change
 * a superfluous / dummy property in the action options.
 *
 * You may also provide no `action` option, but provide a `store` and the visual edge constraint calculations will
 * be updated in the store with no inline styles applied to an element.
 *
 * @param node - Target element.
 *
 * @param [options] - Action Options.
 *
 * @returns Action Lifecycle functions.
 */
declare function applyVisualEdgeInsets(
  node: HTMLElement,
  options?: VisualEdgeInsetsOptions,
): ActionReturn<VisualEdgeInsetsOptions>;
/**
 * Extension utility functions for {@link applyVisualEdgeInsets}.
 */
declare namespace applyVisualEdgeInsets {
  /**
   * Validates a {@link VisualEdgeSides} value.
   *
   * This utility is attached to {@link applyVisualEdgeInsets} and can be used to perform lightweight runtime checks
   * before passing values to the action. It performs the same structural checks that the action's internal
   * normalization logic uses.
   *
   * @param sides - The value to validate.
   *
   * @returns `true` if the value is a valid `VisualEdgeSides` type otherwise `false`.
   */
  function validateSides(sides: VisualEdgeSides): sides is VisualEdgeSides;
}

/**
 * Options for {@link applyVisualEdgeInsets}.
 */
interface VisualEdgeInsetsOptions {
  /**
   * Specifies which element applies the visual edge constraints inline styles and the type of styles to apply.
   * ```
   * - `absThis`: Applies inline styles to the direct action element for absolute positioning within visual edge
   * constraints of target / parent element.
   *
   * - `padTarget`: Applies inline styles padding the target / parent element with that elements visual edge
   * constraints.
   *
   * - `padThis`: Applies inline styles padding the direct action element with the visual edge constraints of the
   * target / parent element.
   * ```
   *
   * The most common action to use is `padTarget`, but for absolutely positioned overlays use `absThis`.
   */
  action?: 'absThis' | 'padTarget' | 'padThis';
  /**
   * Which constraint / box sides to apply.
   *
   * Note: The extended `sides` options only apply with `action: 'padTarget'`. For absolute positioning `action: 'absThis'`
   * all four edge constraints are always applied.
   *
   * @defaultValue `true`
   */
  sides?: VisualEdgeSides;
  /**
   * Enables parent element targeting for visual edge constraint detection.
   *
   * ```
   * - `true`: Direct parent element is the target.
   *
   * - `false`: The action element is the target.
   *
   * - `FindParentOptions` object: This configuration object is passed to `findParentElement`.
   * ```
   *
   * @defaultValue `false`
   *
   * @see {@link #runtime/util/dom/layout!findParentElement}
   */
  parent?: boolean | FindParentOptions;
  /**
   * A store that is updated with visual edge constraints. Updates to the calculated constraints occur even if `sides`
   * is `false`.
   */
  store?: MinimalWritable<StyleMetric.Data.BoxSides>;
  /**
   * When true, enables console logging of which element is being targeted for visual edge detection, the constraints
   * calculated, along with any element that is has inline styles applied.
   *
   * @defaultValue `false`
   */
  debug?: boolean;
  /**
   * Allows unknown keys. When an unknown key changes it is ignored, but an update to visual edge constraint
   * calculation occurs. This is useful in the context of local theme changes that may not be picked up by the global
   * {@link ThemeObserver} subscription.
   */
  [key: string]: unknown;
}
/**
 * Defines the application of padding computation for visual edge insets for the {@link applyVisualEdgeInsets} Svelte
 * action. For absolute positioning any truthy value enables application of visual edge insets.
 *
 * ```
 * - `false` - Disabled
 * - `true` or `'all'` - Enabled / all sides.
 * - `'horizontal'` - Left and right sides.
 * - `'vertical'` - Top and bottom sides.
 * - `object` - Customizable sides with boolean properties for: `top`, `right`, `bottom`, `left`.
 * ```
 */
type VisualEdgeSides =
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

export { applyStyles, applyVisualEdgeInsets };
export type { VisualEdgeInsetsOptions, VisualEdgeSides };
