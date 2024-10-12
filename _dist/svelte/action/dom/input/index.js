import { tinykeys } from '@typhonjs-svelte/runtime-base/util/dom/input/tinykeys';
import { isObject } from '@typhonjs-svelte/runtime-base/util/object';

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
function keyforward(node, keyTarget)
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

/**
 * Provides an action to use `tinykeys`.
 *
 * @param {HTMLElement} node - Target element.
 *
 * @param {UseTinykeysData}  data - An object to forward events key down / up events to as pressed.
 *
 * @returns {import('svelte/action').ActionReturn<UseTinykeysData>} Action lifecycle methods.
 */
function useTinykeys(node, data)
{
   if (!isObject(data)) { throw new TypeError(`'data' is not an object.`); }
   if (!isObject(data.keyBindingMap)) { throw new TypeError(`'data.keyBindingMap' is not an object.`); }
   if (data.options !== void 0 && !isObject(data.options)) { throw new TypeError(`'data.options' is not an object.`); }

   let unsubscribe;

   /**
    * Activates key listeners.
    */
   function activateListeners()
   {
      unsubscribe = tinykeys(node, data.keyBindingMap, data.options);
   }

   /**
    * Removes key listeners.
    */
   function removeListeners()
   {
      if (typeof unsubscribe === 'function')
      {
         unsubscribe();
         unsubscribe = void 0;
      }
   }

   activateListeners();

   return {
      update: (newData) =>
      {
         if (!isObject(newData)) { throw new TypeError(`'data' is not an object.`); }
         if (!isObject(newData.keyBindingMap)) { throw new TypeError(`'data.keyBindingMap' is not an object.`); }
         if (newData.options !== void 0 && !isObject(newData.options))
         {
            throw new TypeError(`'data.options' is not an object.`);
         }

         data = newData;

         removeListeners();
         activateListeners();
      },

      destroy: () => removeListeners()
   };
}

/**
 * @typedef {object} UseTinykeysData
 *
 * @property {import('#runtime/util/dom/input/tinykeys').KeyBindingMap} keyBindingMap Key binding map to instantiate
 * `tinykeys` implementation.
 *
 * @property {import('#runtime/util/dom/input/tinykeys').KeyBindingOptions} [options] Options to pass to `tinykeys`.
 */

export { keyforward, useTinykeys };
//# sourceMappingURL=index.js.map
