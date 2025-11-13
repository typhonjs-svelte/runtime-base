import { StyleMetric } from '@typhonjs-svelte/runtime-base/util/dom/style';
import { ThemeObserver } from '@typhonjs-svelte/runtime-base/util/dom/theme';
import { CrossRealm } from '@typhonjs-svelte/runtime-base/util/realm';
import { isObject } from '@typhonjs-svelte/runtime-base/util/object';

/**
 * Provides a Svelte action that applies absolute positioning to an element adjusting for any painted borders defined
 * by CSS `border-image` properties of the parent element of the target node / element of this action.
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
function absWithinBorder(node, { enabled = true } = {})
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

/**
 * Provides an action to apply CSS style properties provided as an object.
 *
 * @param {HTMLElement} node - Target element
 *
 * @param {{ [key: string]: string | null }}  properties - Hyphen case CSS property key / value object of properties
 *        to set.
 *
 * @returns {import('svelte/action').ActionReturn<{ [key: string]: string | null }>} Lifecycle functions.
 */
function applyStyles(node, properties)
{
   /** Sets properties on node. */
   function setProperties()
   {
      if (!isObject(properties)) { return; }

      for (const prop of Object.keys(properties))
      {
         node.style.setProperty(`${prop}`, properties[prop]);
      }
   }

   setProperties();

   return {
      /**
       * @param {{ [key: string]: string | null }}  newProperties - Key / value object of properties to set.
       */
      update: (newProperties) =>
      {
         properties = newProperties;
         setProperties();
      }
   };
}

export { absWithinBorder, applyStyles };
//# sourceMappingURL=index.js.map
