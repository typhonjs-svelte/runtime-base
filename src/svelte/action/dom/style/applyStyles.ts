import { isObject }           from '#runtime/util/object';

import type { ActionReturn }  from 'svelte/action';

/**
 * Provides an action to apply CSS style properties provided as an object.
 *
 * @param node - Target element
 *
 * @param properties - Hyphen case CSS property key / value object of properties to set.
 *
 * @returns Action lifecycle functions.
 */
export function applyStyles(node: HTMLElement, properties: { [key: string]: string | null }):
 ActionReturn<{ [key: string]: string | null }>
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
       * @param newProperties - Key / value object of properties to set.
       */
      update: (newProperties: { [key: string]: string | null }) =>
      {
         properties = newProperties;
         setProperties();
      }
   };
}
