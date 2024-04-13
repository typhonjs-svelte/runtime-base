import { hasSetter } from '#runtime/util/object';

/**
 * Provides an action to apply a TJSPosition instance to a HTMLElement and invoke `position.parent`
 *
 * @param {HTMLElement}       node - The node associated with the action.
 *
 * @param {import('..').TJSPosition | import('../types').TJSPositionTypes.Positionable}   position - A position or
 *        positionable instance.
 *
 * @returns {(import('svelte/action').ActionReturn<
 *    import('..').TJSPosition |
 *    import('../types').TJSPositionTypes.Positionable
 * >)} The action lifecycle methods.
 */
export function applyPosition(node, position)
{
   /**
    * Find actual position instance checking for a Positionable instance.
    *
    * @type {import('..').TJSPosition}
    */
   let actualPosition = position?.position ?? position;

   if (hasSetter(actualPosition, 'parent')) { actualPosition.parent = node; }

   return {
      update: (newPosition) =>
      {
         const newActualPosition = newPosition?.position ?? newPosition;

         // Sanity case to short circuit update if positions are the same instance.
         if (newActualPosition === actualPosition && newActualPosition.parent === actualPosition.parent) { return; }

         if (hasSetter(actualPosition, 'parent')) { actualPosition.parent = void 0; }

         actualPosition = newActualPosition;

         if (hasSetter(actualPosition, 'parent')) { actualPosition.parent = node; }
      },

      destroy: () => { if (hasSetter(actualPosition, 'parent')) { actualPosition.parent = void 0; } }
   };
}
