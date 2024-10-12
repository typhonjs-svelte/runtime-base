/**
 * Provides an action to forward on key down & up events. This can be any object that has associated `keydown` and
 * `keyup` methods. See {@link KeyStore} for a store implementation.
 *
 * @param {HTMLElement} node - Target element.
 *
 * @param {{ keydown: (event: KeyboardEvent) => void, keyup: (event: KeyboardEvent) => void }}  keyTarget - An object
 *        to forward events key down / up events to as pressed.
 *
 * @returns {(import('svelte/action').ActionReturn<
 *    { keydown: (event: KeyboardEvent) => void, keyup: (event: KeyboardEvent) => void }
 * >)} Action lifecycle methods.
 */
export function keyforward(node, keyTarget)
{
   if (typeof keyTarget?.keydown !== 'function' || typeof keyTarget.keyup !== 'function')
   {
      throw new TypeError(`'keyTarget' doesn't have required 'keydown' or 'keyup' methods.`);
   }

   /**
    * @param {KeyboardEvent} event -
    */
   function onKeydown(event)
   {
      keyTarget.keydown(event);
   }

   /**
    * @param {KeyboardEvent} event -
    */
   function onKeyup(event)
   {
      keyTarget.keyup(event);
   }

   /**
    * Activates key listeners.
    */
   function activateListeners()
   {
      node.addEventListener('keydown', onKeydown);
      node.addEventListener('keyup', onKeyup);
   }

   /**
    * Removes key listeners.
    */
   function removeListeners()
   {
      node.removeEventListener('keydown', onKeydown);
      node.removeEventListener('keyup', onKeyup);
   }

   activateListeners();

   return {
      update: (newKeyStore) =>  // eslint-disable-line no-shadow
      {
         keyTarget = newKeyStore;

         if (typeof keyTarget?.keydown !== 'function' || typeof keyTarget.keyup !== 'function')
         {
            throw new TypeError(`'keyTarget' doesn't have required 'keydown' or 'keyup' methods.`);
         }
      },

      destroy: () => removeListeners()
   };
}
