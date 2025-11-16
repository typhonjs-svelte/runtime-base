import { StyleMetric }     from '#runtime/util/dom/style';
import { ThemeObserver }   from '#runtime/util/dom/theme';
import { CrossRealm }      from '#runtime/util/realm';

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
 * @param {HTMLElement} node - Target element.
 *
 * @param {object}  [options] - Action Options.
 *
 * @param {boolean} [options.enabled] - When enabled set inline styles for padding taking into account any visual
 *        edge insets / border image constraints.
 *
 * @param {boolean} [options.parent] - When true, the parent element to the action element is adjusted.
 *
 * @returns {import('svelte/action').ActionReturn<{ enabled?: boolean, parent?: boolean }>} Lifecycle functions.
 */
export function padToVisualEdgeInsets(node, { enabled = true, parent = false } = {})
{
   let top = 0;
   let right = 0;
   let left = 0;
   let bottom = 0;

   /** @type {HTMLElement} */
   let targetNode;

   if (typeof enabled !== 'boolean') { enabled = false; }
   if (typeof parent !== 'boolean') { parent = true; }

   /** Sets properties on node. */
   function updateConstraints()
   {
      if (!enabled)
      {
         // Clear any old inline styles on previous `targetNode`.
         if (CrossRealm.browser.isHTMLElement(targetNode) && targetNode.style.padding !== '')
         {
            targetNode.style.padding = '';
         }

         targetNode = void 0;

         return;
      }

      const newTarget = parent ? node.parentElement : node;

      // Clear any old inline styles on previous `targetNode`.
      if (newTarget !== targetNode && CrossRealm.browser.isHTMLElement(targetNode)) { targetNode.style.padding = ''; }

      targetNode = newTarget;

      if (!CrossRealm.browser.isHTMLElement(targetNode))
      {
         top = right = bottom = left = 0;
      }
      else
      {
         ({ top, right, bottom, left } = StyleMetric.getVisualEdgeInsets(targetNode));
      }

      if (enabled)
      {
         targetNode.style.padding = `${top}px ${right}px ${bottom}px ${left}px`;
      }
      else
      {
         top = right = bottom = left = 0;

         targetNode.style.padding = '';
      }
   }

   // This will invoke `updateConstraints` immediately.
   let unsubscribe = ThemeObserver.stores.themeName.subscribe(() => updateConstraints());

   return {
      destroy: () =>
      {
         if (CrossRealm.browser.isHTMLElement(targetNode)) { targetNode.style.padding = ''; }

         unsubscribe?.();
         unsubscribe = void 0;

         targetNode = void 0;
      },

      /**
       * @param {{ enabled?: boolean, parent?: boolean }}  newOptions - New options.
       */
      update: (newOptions) =>
      {
         if (typeof newOptions?.enabled === 'boolean') { enabled = newOptions?.enabled; }
         if (typeof newOptions?.parent === 'boolean') { parent = newOptions?.parent; }

         updateConstraints();
      }
   };
}
