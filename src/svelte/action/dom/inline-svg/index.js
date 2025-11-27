import { calculateDimensions } from './inline-svg.internal.js';

/**
 * Svelte action for dynamically inlining remote-fetched SVG into the DOM.
 *
 * @example
 * ```html
 * <script>
 *   import { inlineSvg } from '#runtime/svelte/action/inline-svg';
 * </script>
 *
 * <svg use:inlineSvg={"http://example.com/icon.svg"}></svg>
 * ```
 *
 * @param {SVGElement} node - SVGElement to inline SVG into.
 *
 * @param {string | import('./types').InlineSvgOptions} options - A string for `src` / SVG remove URI or a complete
 *        options object.
 *
 * @returns {import('svelte/action').ActionReturn<string | import('./types').InlineSvgOptions>} Action lifecycle
 *          functions.
 */
export function inlineSvg(node, options)
{
   let config = resolveConfig(options);

   async function op()
   {
      if (config.src)
      {
         const response = await fetch(config.src, {cache: config.cache});
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
            const dimensions = calculateDimensions(node, svg);
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

   op();

   return {
      update(update)
      {
         config = resolveConfig(update);
         op();
      },
   };
}

/**
 * @package
 * @type {Required<import('./types').InlineSvgOptions>}
 */
const DEFAULT_INLINE_SVG_ACTION_CONFIG = {
   autoDimensions: true,
   cache: 'no-cache',
   src: '',
   transform: (svg) => svg,
};

/**
 * resolve the input parameters of `inlineSvg` action to an internally usable config
 * @package
 * @param {string | import('./types').InlineSvgOptions | undefined} param
 * @returns {Required<import('./types').InlineSvgOptions>}
 */
function resolveConfig(param = '')
{
   if (typeof param === 'string')
   {
      return {
         ...DEFAULT_INLINE_SVG_ACTION_CONFIG,
         src: param,
      };
   }

   return {
      ...DEFAULT_INLINE_SVG_ACTION_CONFIG,
      ...param,
   };
}
