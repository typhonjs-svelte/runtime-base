import { ActionReturn, Action } from 'svelte/action';

/**
 * verbose config for `inlineSvg` action
 *
 */
interface InlineSvgConfig {
  /** svg remote URI */
  src: string;
  /** cache policy for use in fetch from svg `src` */
  cache?: Request['cache'];
  /**
   * automatically calculate dimensions from the available attributes
   * of both the local SVG element (on which action is used) and the remote SVG
   *
   * For example, if you specify only `width` to the local SVG element, the
   * height will automatically be calculated from the remote SVG
   *
   *
   *
   * For this to work, width & height must be "extractable" from the remote element,
   * that is, the remote SVG must either have the `viewBox` or both `width` and `height` attributes that
   * is in the same unit.
   */
  autoDimensions?: boolean;
  /**
   * optionally transform the SVG string fetched from remote source before inlining
   */
  transform?: (svg: string) => string;
}
/**
 *
 * input parameters for `inlineSvg` action
 */
type InlineSvgParameter = string | InlineSvgConfig;
/**  */
type InlineSvgAction = Action<SVGElement, InlineSvgParameter>;
/**  */
type InlineSvgActionReturn = ActionReturn<InlineSvgParameter>;

/**
 * Svelte action for dynamically inlining remote-fetched SVG into DOM.
 * @example
 *
 * ```html
 * <script>
 *   import { inlineSvg } from '@svelte-put/inline-svg;
 * </script>
 *
 * <svg use:inlineSvg={"http://example.com/icon.svg"}></svg>
 * ```
 *
 * @param {SVGElement} node - SVGElement to inline SVG into
 *
 * @param {import('./types').InlineSvgParameter} param - config for the action.
 *
 * @returns {import('./types').InlineSvgActionReturn}
 */
declare function inlineSvg(node: SVGElement, param: InlineSvgParameter): InlineSvgActionReturn;

export { type InlineSvgAction, type InlineSvgActionReturn, type InlineSvgConfig, type InlineSvgParameter, inlineSvg };
