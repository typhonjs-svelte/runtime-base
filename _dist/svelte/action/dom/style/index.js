import { StyleMetric } from '@typhonjs-svelte/runtime-base/util/dom/style';
import { ThemeObserver } from '@typhonjs-svelte/runtime-base/util/dom/theme';
import { CrossRealm } from '@typhonjs-svelte/runtime-base/util/realm';
import { isObject } from '@typhonjs-svelte/runtime-base/util/object';

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
 * @param {HTMLElement} node - Target element.
 *
 * @param {object}  [options] - Action Options.
 *
 * @param {boolean} [options.enabled] - When enabled set inline styles for absolute positioning taking into account
 *        visual edge insets / any border image constraints.
 *
 * @returns {import('svelte/action').ActionReturn<{ enabled?: boolean }>} Lifecycle functions.
 */
function absToVisualEdgeInsets(node, { enabled = true } = {})
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
         ({ top, right, bottom, left } = StyleMetric.getVisualEdgeInsets(node.parentElement));
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
function padToVisualEdgeInsets(node, { enabled = true, parent = false } = {})
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

export { absToVisualEdgeInsets, applyStyles, padToVisualEdgeInsets };
//# sourceMappingURL=index.js.map
