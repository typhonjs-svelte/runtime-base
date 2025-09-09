import { localize }  from '#runtime/util/i18n';

/**
 * Provides a popover tooltip action that by default uses the elements `title` attribute.
 *
 * Depending on the runtime and platform the use of `title` may be replaced with an alternate tooltip implementation.
 *
 * @param {HTMLElement} node - Target element.
 *
 * @param {TooltipOptions} options - Options.
 *
 * @returns {import('svelte/action').ActionReturn<TooltipOptions>} Lifecycle functions.
 */
export function popoverTooltip(node, { tooltip, ariaLabel = false })
{
   function setAttributes()
   {
      if (typeof tooltip === 'string')
      {
         const value = localize(tooltip);

         node.setAttribute('title', value);

         if (ariaLabel)
         {
            node.setAttribute('aria-label', value);
         }
         else
         {
            node.removeAttribute('aria-label');
         }
      }
      else
      {
         node.removeAttribute('title');
         node.removeAttribute('aria-label');
      }
   }

   setAttributes();

   return {
      /**
       * @param {TooltipOptions}  options - Update tooltip.
       */
      update: (options) =>
      {
         tooltip = typeof options?.tooltip === 'string' ? options.tooltip : void 0;
         ariaLabel = typeof options?.ariaLabel === 'boolean' ? options.ariaLabel : false;

         setAttributes();
      }
   };
}

/**
 * @typedef {object} TooltipOptions
 *
 * @property {string} [tooltip] Tooltip value or language key.
 *
 * @property {boolean} [ariaLabel=false] When true, the tooltip value is also set to the `aria-label` attribute.
 */
