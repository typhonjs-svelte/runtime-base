import { localize } from '@typhonjs-svelte/runtime-base/util/i18n';

/**
 * Provides a popover tooltip action that by default uses the elements `title` attribute.
 *
 * Depending on the runtime and platform the use of `title` may be replaced with an alternate tooltip implementation.
 *
 * @param {HTMLElement} node - Target element.
 *
 * @param {string}  tooltip - The tooltip to set.
 *
 * @returns {import('svelte/action').ActionReturn<string>} Lifecycle functions.
 */
function popoverTooltip(node, tooltip)
{
   node.title = typeof tooltip === 'string' ? localize(tooltip) : null;

   return {
      /**
       * @param {string}  newTooltip - Update tooltip.
       */
      update: (newTooltip) =>
      {
         tooltip = newTooltip;
         node.title = typeof tooltip === 'string' ? localize(tooltip) : null;
      }
   };
}

export { popoverTooltip };
//# sourceMappingURL=index.js.map
