import { StyleMetric }              from '#runtime/util/dom/style';
import { ThemeObserver }            from '#runtime/util/dom/theme';
import { CrossRealm }               from '#runtime/util/realm';
import { findParentElement }        from '#runtime/util/dom/layout';
import { isObject }                 from '#runtime/util/object';

import type { ActionReturn }        from 'svelte/action';
import type { Unsubscriber }        from 'svelte/store';

import type { FindParentOptions }   from '#runtime/util/dom/layout';

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
 * @param node - Target element.
 *
 * @param [options] - Action Options.
 *
 * @param [options.enabled] - When enabled set inline styles for padding taking into account any visual edge insets /
 *        border image constraints.
 *
 * @param [options.parent] - When true or {@link FindParentOptions}the parent element to the action element is adjusted.
 *
 * @returns Action Lifecycle functions.
 */
export function padToVisualEdgeInsets(node: HTMLElement, { enabled = true, parent = false }:
 { enabled?: boolean, parent?: boolean | FindParentOptions } = {}):
  ActionReturn<{ enabled?: boolean, parent?: boolean | FindParentOptions }>
{
   let top = 0;
   let right = 0;
   let left = 0;
   let bottom = 0;

   /** Target node for compute styles */
   let targetNode: HTMLElement | null;

   if (typeof enabled !== 'boolean') { throw new TypeError(`'enabled' is not a boolean.`); }
   if (parent !== void 0 && typeof parent !== 'boolean' && !isObject(parent))
   {
      throw new TypeError(`'parent' is not a boolean or 'FindParentOptions' object.`);
   }

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

         top = right = bottom = left = 0;

         targetNode = null;

         return;
      }

      let newTarget: HTMLElement | null;

      if (isObject(parent))
      {
         newTarget = findParentElement(node, parent)
      }
      else
      {
         newTarget = parent ? node?.parentElement : node;
      }

      // Clear any old inline styles on previous `targetNode`.
      if (newTarget !== targetNode && CrossRealm.browser.isHTMLElement(targetNode)) { targetNode.style.padding = ''; }

      targetNode = newTarget;

      if (!CrossRealm.browser.isHTMLElement(targetNode))
      {
         top = right = bottom = left = 0;
      }
      else
      {
         if (enabled)
         {
            ({ top, right, bottom, left } = StyleMetric.getVisualEdgeInsets(targetNode));
            targetNode.style.padding = `${top}px ${right}px ${bottom}px ${left}px`;
         }
         else
         {
            top = right = bottom = left = 0;
            targetNode.style.padding = '';
         }
      }
   }

   // This will invoke `updateConstraints` immediately.
   let unsubscribe: Unsubscriber | undefined = ThemeObserver.stores.themeName.subscribe(() => updateConstraints());

   return {
      destroy: () =>
      {
         if (CrossRealm.browser.isHTMLElement(targetNode)) { targetNode.style.padding = ''; }

         unsubscribe?.();
         unsubscribe = void 0;

         targetNode = null;
      },

      /**
       * @param newOptions - New options.
       */
      update: (newOptions: { enabled?: boolean, parent?: boolean | FindParentOptions }) =>
      {
         if (typeof newOptions?.enabled === 'boolean') { enabled = newOptions?.enabled; }
         if (typeof newOptions?.parent === 'boolean' || isObject(newOptions?.parent)) { parent = newOptions?.parent; }

         updateConstraints();
      }
   };
}
