import { StyleMetric }     from '#runtime/util/dom/style';
import { ThemeObserver }   from '#runtime/util/dom/theme';
import { CrossRealm }      from '#runtime/util/realm';

/**
 * Provides a Svelte action that applies absolute positioning to an element adjusting for any painted borders defined
 * by CSS `border-image` properties.
 *
 * When enabled, this action computes the effective painted border using
 * {@link #runtime/util/dom/style!StyleMetric.getPaintedBorderWidth} and applies inline `position: absolute` styles so
 * the element aligns correctly within the visible (non-border) content area of its container.
 *
 * Additionally, this action subscribes to {@link #runtime/util/dom/theme!ThemeObserver} and updates constraint
 * calculations when any global theme is changed.
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
export function absoluteWithinBorder(node, { enabled = true } = {})
{
   let top = 0;
   let right = 0;
   let left = 0;
   let bottom = 0;

   /** Sets properties on node. */
   function updateConstraints()
   {
      if (!CrossRealm.browser.isHTMLElement(node?.parentElement))
      {
         top = right = bottom = left = 0;
      }
      else
      {
         ({ top, right, bottom, left } = StyleMetric.getPaintedBorderWidth(node.parentElement));
      }

      if (enabled)
      {
         node.style.top = `${top}px`;
         node.style.left = `${left}px`;
         node.style.height = `calc(100% - ${top}px - ${bottom}px)`;
         node.style.width = `calc(100% - ${left}px - ${right}px)`;
         node.style.position = 'absolute';
      }
      else
      {
         top = right = bottom = left = 0;

         node.style.top = '';
         node.style.right = '';
         node.style.bottom = '';
         node.style.left = '';
         node.style.position = '';
      }
   }

   let unsubscribe = ThemeObserver.stores.themeName.subscribe(() => updateConstraints());

   return {
      destroy: () =>
      {
         unsubscribe?.();
         unsubscribe = void 0;
      },

      /**
       * @param {{ enabled?: boolean }}  newOptions - New options.
       */
      update: (newOptions) =>
      {
         if (typeof newOptions?.enabled === 'boolean') { enabled = newOptions?.enabled; }

         updateConstraints();
      }
   };
}
