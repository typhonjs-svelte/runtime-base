import * as svelte_action from 'svelte/action';

/**
 * Options for `inlineSvg` action.
 */
interface InlineSvgOptions {
  /**
   * Automatically calculate dimensions from the available attributes of both the local SVG element (on which action
   * is used) and the remote SVG.
   *
   * For example, if you specify only `width` to the local SVG element, the height will automatically be calculated
   * from the remote SVG.
   *
   * For this to work, `width` & `height` must be "extractable" from the remote element, that is, the remote SVG must
   * either have the `viewBox` or both `width` and `height` attributes that is in the same unit.
   *
   * @defaultValue `true`
   */
  autoDimensions?: boolean;
  /**
   * Cache policy for use in fetch from svg `src`.
   *
   * @defaultValue `no-cache`
   */
  cache?: Request['cache'];
  /**
   * SVG remote URI.
   */
  src: string;
  /**
   * Optionally transform the SVG string fetched from remote source before inlining.
   */
  transform?: (svg: string) => string;
}

/**
 * Svelte action for dynamically inlining remote SVG into the DOM using `fetch`.
 *
 * *⚠ SECURITY WARNING - XSS RISK*
 * ------------------------------------------------------------
 * This action does NOT sanitize the fetched SVG or remote file. Inline SVG is treated like live DOM and can execute
 * scripts. Untrusted SVG can lead to full cross-site scripting (XSS).
 *
 * Common attack vectors include:
 * ```
 *   - <script> elements
 *   - Event handler attributes: onclick, onload, onmouseover, etc.
 *   - javascript: URLs inside href, xlink:href, style, gradients, filters
 *   - <foreignObject> allowing embedded HTML + JS execution
 *   - External references (remote images, fonts, scripts)
 * ```
 *
 * IMPORTANT:
 * Remote SVG should be considered the same as remote HTML. If you inline untrusted content, you may be executing
 * attacker code.
 *
 * You MUST sanitize SVG content before injecting it into the DOM.
 * Sanitization can be done:
 * ```
 * (1) Server-side, OR
 * (2) In the `transform` function using a trusted sanitizer.
 * ```
 *
 * For client-side sanitization, DOMPurify is strongly recommended: https://github.com/cure53/DOMPurify
 *
 * Additional references on SVG security and XSS vulnerabilities:
 * - MDN - Security considerations for XSS: https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/XSS
 * - OWASP XSS Filter Evasion / SVG Risk Overview: https://owasp.org/www-community/xss-filter-evasion-cheatsheet
 *
 * FAILURE TO SANITIZE SVG MAY RESULT IN REMOTE CODE EXECUTION.
 *
 * @example
 * Basic usage:
 * ```html
 * <script>
 *   import { inlineSvg } from '#runtime/svelte/action/inline-svg';
 * </script>
 *
 * <svg use:inlineSvg={'http://example.com/icon.svg'}></svg>
 * ```
 *
 * @example
 * An example using the `transform` function with `DOMPurify`:
 * ```html
 * <script>
 *   import { inlineSvg } from '#runtime/svelte/action/inline-svg';
 *   import DOMPurify from 'dompurify';
 *
 *   const config = {
 *     src: 'https://example.com/icon.svg',
 *     transform: (remoteData) => {
 *       // Sanitize untrusted SVG before injecting into the DOM.
 *       // Without sanitization, malicious SVG can execute script code.
 *       return DOMPurify.sanitize(remoteData, { USE_PROFILES: { svg: true } });
 *     }
 *   };
 * </script>
 *
 * <!-- The remote SVG (after DOMPurify sanitization) will be inlined here -->
 * <svg use:inlineSvg={config}></svg>
 * ```
 *
 * @param {SVGElement} node - SVGElement to inline SVG into.
 *
 * @param {string | import('./types').InlineSvgOptions} options - A string for `src` / SVG remote URI or a complete
 *        options object.
 *
 * @returns {import('svelte/action').ActionReturn<string | import('./types').InlineSvgOptions>} Action lifecycle
 *          functions.
 *
 * @see [DOMPurify](https://dompurify.com/)
 */
declare function inlineSvg(
  node: SVGElement,
  options: string | InlineSvgOptions,
): svelte_action.ActionReturn<string | InlineSvgOptions>;

export { inlineSvg };
export type { InlineSvgOptions };
