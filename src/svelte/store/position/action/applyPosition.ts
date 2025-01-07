import { hasSetter }             from '#runtime/util/object';

import type { ActionReturn }     from 'svelte/action';

import type { TJSPosition }      from '../TJSPosition';

/**
 * Provides an action to apply a TJSPosition instance to a HTMLElement and invoke `position.parent`
 *
 * @param node - The node associated with the action.
 *
 * @param position - A position or positionable instance.
 *
 * @returns The action lifecycle methods.
 */
export function applyPosition(node: HTMLElement, position: TJSPosition | TJSPosition.Positionable):
 ActionReturn<TJSPosition | TJSPosition.Positionable>
{
   /**
    * Find actual position instance checking for a Positionable instance.
    */
   let actualPosition: TJSPosition = ((position as TJSPosition.Positionable)?.position ?? position) as TJSPosition;

   if (hasSetter(actualPosition, 'parent')) { actualPosition.parent = node; }

   return {
      update: (newPosition: TJSPosition | TJSPosition.Positionable): void =>
      {
         const newActualPosition: TJSPosition =
          ((newPosition as TJSPosition.Positionable)?.position ?? position) as TJSPosition;

         // Sanity case to short circuit update if positions are the same instance.
         if (newActualPosition === actualPosition && newActualPosition.parent === actualPosition.parent) { return; }

         if (hasSetter(actualPosition, 'parent')) { actualPosition.parent = void 0; }

         actualPosition = newActualPosition;

         if (hasSetter(actualPosition, 'parent')) { actualPosition.parent = node; }
      },

      destroy: (): void => { if (hasSetter(actualPosition, 'parent')) { actualPosition.parent = void 0; } }
   };
}
