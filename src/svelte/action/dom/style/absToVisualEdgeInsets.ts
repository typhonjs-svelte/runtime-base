import { StyleMetric }              from '#runtime/util/dom/style';
import { ThemeObserver }            from '#runtime/util/dom/theme';
import { findParentElement }        from '#runtime/util/dom/layout';
import { isObject }                 from '#runtime/util/object';

import type { ActionReturn }        from 'svelte/action';
import type { Unsubscriber }        from 'svelte/store';

import type { FindParentOptions }   from '#runtime/util/dom/layout';

/**
 * Provides a Svelte action that applies absolute positioning to an element adjusting for any painted borders defined
 * by CSS `border-image` properties of the parent element of the target node / element of this action.
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
 * @param [options.enabled] - When enabled set inline styles for absolute positioning taking into account visual edge
 *        insets / any border image constraints.
 *
 * @returns Action lifecycle functions.
 */
export function absToVisualEdgeInsets(node: HTMLElement, { enabled = true, parent = true }:
 { enabled?: boolean, parent?: boolean | FindParentOptions } = {}):
  ActionReturn<{ enabled?: boolean, parent?: boolean | FindParentOptions }>
{
   let top = 0;
   let right = 0;
   let left = 0;
   let bottom = 0;

   function resolveParentTarget(node: Element, parent?: boolean | FindParentOptions): Element
   {
      if (parent === void 0 || parent === false) { return node; }

      if (parent === true) { return node.parentElement ?? node; }

      // Parent is a `FindParentOptions` object.
      return isObject(parent) ? findParentElement(node, parent) ?? node : node;
   }

   /** Sets properties on node. */
   function updateConstraints()
   {
      const targetNode = resolveParentTarget(node, parent);

      ({ top, right, bottom, left } = StyleMetric.getVisualEdgeInsets(targetNode));

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

   let unsubscribe: Unsubscriber | undefined = ThemeObserver.stores.themeName.subscribe(() => updateConstraints());

   return {
      destroy: () =>
      {
         unsubscribe?.();
         unsubscribe = void 0;
      },

      /**
       * @param newOptions - New options.
       */
      update: (newOptions: { enabled?: boolean, parent?: boolean | FindParentOptions }) =>
      {
         if (typeof newOptions?.enabled === 'boolean') { enabled = newOptions.enabled; }
         if (typeof newOptions?.parent === 'boolean' || isObject(newOptions?.parent)) { parent = newOptions.parent; }

         updateConstraints();
      }
   };
}
