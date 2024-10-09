import { isMinimalWritableStore } from '#runtime/svelte/store/util';

/**
 * Provides an action to monitor focus state of a given element and set an associated store with current focus state.
 *
 * This action is usable with any writable store.
 *
 * @param {HTMLElement} node - Target element.
 *
 * @param {import('#runtime/svelte/store/util').MinimalWritable<boolean>}  storeFocused - Update store for focus
 *        changes.
 *
 * @returns {(import('svelte/action').ActionReturn<
 *    import('#runtime/svelte/store/util').MinimalWritable<boolean>
 * >)} Lifecycle functions.
 */
export function isFocused(node, storeFocused)
{
   let localFocused = false;

   /**
    * Updates `storeFocused` w/ current focused state.
    *
    * @param {boolean}  current - current focused state.
    */
   function setFocused(current)
   {
      localFocused = current;

      if (isMinimalWritableStore(storeFocused)) { storeFocused.set(localFocused); }
   }

   /**
    * Focus event listener.
    */
   function onFocus()
   {
      setFocused(true);
   }

   /**
    * Blur event listener.
    */
   function onBlur()
   {
      setFocused(false);
   }

   /**
    * Activate listeners.
    */
   function activateListeners()
   {
      node.addEventListener('focus', onFocus);
      node.addEventListener('blur', onBlur);
   }

   /**
    * Remove listeners.
    */
   function removeListeners()
   {
      node.removeEventListener('focus', onFocus);
      node.removeEventListener('blur', onBlur);
   }

   activateListeners();

   return {
      /**
       * @param {import('#runtime/svelte/store/util').MinimalWritable<boolean>}  newStoreFocused - Update store for
       *        focus changes.
       */
      update: (newStoreFocused) =>
      {
         storeFocused = newStoreFocused;
         setFocused(localFocused);
      },

      destroy: () => removeListeners()
   };
}
