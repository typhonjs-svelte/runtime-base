import { tinykeys } from '#runtime/util/dom/input/tinykeys';
import { isObject } from '#runtime/util/object';

/**
 * Provides an action to use `tinykeys`.
 *
 * @param {HTMLElement} node - Target element.
 *
 * @param {UseTinykeysData}  data - An object to forward events key down / up events to as pressed.
 *
 * @returns {import('svelte/action').ActionReturn<UseTinykeysData>} Action lifecycle methods.
 */
export function useTinykeys(node, data)
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
