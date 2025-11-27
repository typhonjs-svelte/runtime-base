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
export function inlineSvg(node, options)
{
   let config = InlineSvgSupport.resolveConfig(options);

   InlineSvgSupport.apply(node, config);

   return {
      update(update)
      {
         config = InlineSvgSupport.resolveConfig(update);
         InlineSvgSupport.apply(node, config)
      }
   };
}

class InlineSvgSupport
{
   /**
    * @type {Required<import('./types').InlineSvgOptions>}
    */
   static #DEFAULT_INLINE_SVG_ACTION_CONFIG = {
      autoDimensions: true,
      cache: 'no-cache',
      src: '',
      transform: (svg) => svg,
   };

   /**
    * Matches a CSS / SVG dimension: signed decimal or scientific number + optional unit (letters or %).
    *
    * @type {RegExp}
    */
   static #DIMENSION_REGEX = /^([+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?)\s*([a-zA-Z%]+)?$/;

   /**
    *
    * @param {SVGElement}  node -
    *
    * @param {import('./types').InlineSvgOptions} config -
    */
   static async apply(node, config)
   {
      if (config.src)
      {
         const response = await fetch(config.src, { cache: config.cache });
         const str = config.transform(await response.text());
         const svg = new DOMParser().parseFromString(str, 'image/svg+xml').documentElement;

         for (let i = 0; i < svg.attributes.length; i++)
         {
            const attr = svg.attributes[i];
            if (!node.hasAttribute(attr.name) && !['width', 'height'].includes(attr.name))
            {
               node.setAttribute(attr.name, attr.value);
            }
         }

         if (config.autoDimensions)
         {
            const dimensions = this.#calculateDimensions(node, svg);
            node.setAttribute('width', dimensions.width);
            node.setAttribute('height', dimensions.height);
         }
         else
         {
            node.setAttribute('width', node.getAttribute('width') || '');
            node.setAttribute('height', node.getAttribute('height') || '');
         }

         node.innerHTML = svg.innerHTML;
      }
   }

   /**
    * Resolve the input parameters of `inlineSvg` action to an internally usable config.
    *
    * @param {string | import('./types').InlineSvgOptions | undefined} options
    *
    * @returns {Required<import('./types').InlineSvgOptions>} Normalized options.
    */
   static resolveConfig(options = '')
   {
      if (typeof options === 'string')
      {
         return {
            ...this.#DEFAULT_INLINE_SVG_ACTION_CONFIG,
            src: options,
         };
      }

      return {
         ...this.#DEFAULT_INLINE_SVG_ACTION_CONFIG,
         ...options,
      };
   }

   // Internal Implementation ----------------------------------------------------------------------------------------

   static #calculateDimensions(local, remote)
   {
      const lWidthStr = local.getAttribute('width');
      const lHeightStr = local.getAttribute('height');

      if (lWidthStr && lHeightStr)
      {
         return {width: lWidthStr, height: lHeightStr};
      }

      const lDimension = { width: lWidthStr || '', height: lHeightStr || '' };

      const rWidthStr = remote.getAttribute('width');
      const rHeightStr = remote.getAttribute('height');
      const rViewBox = remote.getAttribute('viewBox');

      if (!((rWidthStr && rHeightStr) || rViewBox))
      {
         return lDimension;
      }

      let rWidth = 0;
      let rHeight = 0;
      let rWidthUnit = '';
      let rHeightUnit = '';

      if (rWidthStr && rHeightStr)
      {
         ({ number: rWidth, unit: rWidthUnit } = this.#extractDimensionNumberAndUnit(rWidthStr));
         ({ number: rHeight, unit: rHeightUnit } = this.#extractDimensionNumberAndUnit(rHeightStr));
      }
      else if (rViewBox)
      {
         [, , rWidth, rHeight] = rViewBox.split(' ').map((s) => parseInt(s, 10));
      }

      if (rWidthUnit !== rHeightUnit)
      {
         return {
            width: lWidthStr || rWidthStr || '',
            height: lHeightStr || rHeightStr || '',
         };
      }

      if (lWidthStr)
      {
         const {number, unit} = this.#extractDimensionNumberAndUnit(lWidthStr);

         const cDimension = this.#calculateNewDimensions(
            { width: rWidth, height: rHeight },
            { width: number },
         );

         const cUnit = unit || rWidthUnit;

         return {
            width: cDimension.width.toFixed(2) + cUnit,
            height: cDimension.height.toFixed(2) + cUnit,
         };
      }
      if (lHeightStr)
      {
         const {number, unit} = this.#extractDimensionNumberAndUnit(lHeightStr);

         const cDimension = this.#calculateNewDimensions(
            { width: rWidth, height: rHeight },
            { height: number },
         );

         const cUnit = unit || rHeightUnit;

         return {
            width: cDimension.width.toFixed(2) + cUnit,
            height: cDimension.height.toFixed(2) + cUnit,
         };
      }
      return {
         width: rWidth + rWidthUnit,
         height: rHeight + rHeightUnit,
      };
   }

   /**
    * @param {{ width: number; height: number }} base - Base dimension
    *
    * @param {{ width: number } | { height: number }} constraint - Dimension constraint.
    *
    * @returns {{ width: number; height: number }} - Adjusted dimension.
    */
   static #calculateNewDimensions(base, constraint)
   {
      const { width, height } = base;

      if ('width' in constraint)
      {
         const { width: constraintWidth } = constraint;
         return {
            width: constraintWidth,
            height: (constraintWidth / width) * height,
         };
      }

      const { height: constraintHeight } = constraint;

      return {
         width: (constraintHeight / height) * width,
         height: constraintHeight,
      };
   }

   /**
    * @param {string} dimension -
    *
    * @returns {{ number: number; unit: string }} Dimension number / unit.
    */
   static #extractDimensionNumberAndUnit(dimension)
   {
      const [, num, unit = ''] = dimension.trim().match(this.#DIMENSION_REGEX) ?? [];
      return { number: parseInt(num, 10), unit };
   }
}
