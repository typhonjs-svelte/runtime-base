import { isObject }  from '#runtime/util/object';

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
export function applyStyles(node, properties)
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
