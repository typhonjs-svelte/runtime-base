/**
 * @package
 * @typedef {{ width: number; height: number }} Dimension
 * @typedef {{ width: number } | { height: number }} DimensionConstraint
 */

/**
 * @package
 * @param {string} dimension
 * @returns {{ number: number; unit: string }}
 */
function extractDimensionNumberAndUnit(dimension) {
   const regex = /(\d+)(\D*)/;
   const [, number = '0', unit = ''] = dimension.match(regex) || [];
   return { number: parseInt(number, 10), unit };
}

/**
 * @package
 * @param {Dimension} base
 * @param {DimensionConstraint} constraint
 * @returns {Dimension}
 */
function calculateNewDimensions(base, constraint) {
   const { width, height } = base;
   if ('width' in constraint) {
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
 * @package
 * @param {SVGElement} local
 * @param {HTMLElement} remote
 * @returns {{ width: string, height: string }}
 */
function calculateDimensions(local, remote) {
   const lWidthStr = local.getAttribute('width');
   const lHeightStr = local.getAttribute('height');
   if (lWidthStr && lHeightStr) {
      return { width: lWidthStr, height: lHeightStr };
   }
   const lDimension = { width: lWidthStr || '', height: lHeightStr || '' };

   const rWidthStr = remote.getAttribute('width');
   const rHeightStr = remote.getAttribute('height');
   const rViewBox = remote.getAttribute('viewBox');

   if (!((rWidthStr && rHeightStr) || rViewBox)) {
      return lDimension;
   }

   let rWidth = 0;
   let rHeight = 0;
   let rWidthUnit = '';
   let rHeightUnit = '';
   if (rWidthStr && rHeightStr) {
      ({ number: rWidth, unit: rWidthUnit } = extractDimensionNumberAndUnit(rWidthStr));
      ({ number: rHeight, unit: rHeightUnit } = extractDimensionNumberAndUnit(rHeightStr));
   } else if (rViewBox) {
      [, , rWidth, rHeight] = rViewBox.split(' ').map((s) => parseInt(s, 10));
   }

   if (rWidthUnit !== rHeightUnit) {
      return {
         width: lWidthStr || rWidthStr || '',
         height: lHeightStr || rHeightStr || '',
      };
   }

   if (lWidthStr) {
      const { number, unit } = extractDimensionNumberAndUnit(lWidthStr);
      const cDimension = calculateNewDimensions(
         { width: rWidth, height: rHeight },
         { width: number },
      );
      const cUnit = unit || rWidthUnit;
      return {
         width: cDimension.width.toFixed(2) + cUnit,
         height: cDimension.height.toFixed(2) + cUnit,
      };
   }
   if (lHeightStr) {
      const { number, unit } = extractDimensionNumberAndUnit(lHeightStr);
      const cDimension = calculateNewDimensions(
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
function inlineSvg(node, param) {
   let config = resolveConfig(param);
   async function op() {
      if (config.src) {
         const response = await fetch(config.src, { cache: config.cache });
         const str = config.transform(await response.text());
         const svg = new DOMParser().parseFromString(str, 'image/svg+xml').documentElement;
         for (let i = 0; i < svg.attributes.length; i++) {
            const attr = svg.attributes[i];
            if (!node.hasAttribute(attr.name) && !['width', 'height'].includes(attr.name)) {
               node.setAttribute(attr.name, attr.value);
            }
         }
         if (config.autoDimensions) {
            const dimensions = calculateDimensions(node, svg);
            node.setAttribute('width', dimensions.width);
            node.setAttribute('height', dimensions.height);
         } else {
            node.setAttribute('width', node.getAttribute('width') || '');
            node.setAttribute('height', node.getAttribute('height') || '');
         }
         node.innerHTML = svg.innerHTML;
      }
   }
   op();
   return {
      update(update) {
         config = resolveConfig(update);
         op();
      },
   };
}

/**
 * @package
 * @type {Required<import('./types').InlineSvgConfig>}
 */
const DEFAULT_INLINE_SVG_ACTION_CONFIG = {
   src: '',
   cache: 'no-cache',
   autoDimensions: true,
   transform: (svg) => svg,
};

/**
 * resolve the input parameters of `inlineSvg` action to an internally usable config
 * @package
 * @param {import('./types').InlineSvgParameter | undefined} param
 * @returns {Required<import('./types').InlineSvgConfig>}
 */
function resolveConfig(param = '') {
   if (typeof param === 'string') {
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

export { inlineSvg };
//# sourceMappingURL=index.js.map
