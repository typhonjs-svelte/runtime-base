import { resizeObserver }           from '#runtime/svelte/action/dom/observer';
import { isMinimalWritableStore }   from '#runtime/svelte/store/util';
import { Timing }                   from '#runtime/util';
import { nextAnimationFrame }       from '#runtime/util/animate';

/**
 * Provides an action to save `scrollTop` of an element with a vertical scrollbar. This action should be used on the
 * scrollable element and must include a writable store that holds the active store for the current `scrollTop` value.
 * You may switch the stores externally and this action will set the `scrollTop` based on the newly set store. This is
 * useful for instance providing a select box that controls the scrollable container.
 *
 * @param {HTMLElement} element - The target scrollable HTML element.
 *
 * @param {import('#runtime/svelte/store/util').MinimalWritable<number>}   store - A minimal writable store that stores
 *        the element scrollTop.
 *
 * @returns {(import('svelte/action').ActionReturn<
 *    import('#runtime/svelte/store/util').MinimalWritable<number>
 * >)} Lifecycle functions.
 */
export function applyScrolltop(element, store)
{
   if (!isMinimalWritableStore(store))
   {
      throw new TypeError(`applyScrolltop error: 'store' must be a minimal writable Svelte store.`);
   }

   /**
    * Updates element `scrollTop`.
    *
    * @param {number}   value -
    */
   async function storeUpdate(value)
   {
      if (!Number.isFinite(value)) { return; }

      await nextAnimationFrame(2);  // Ensure DOM is patched.

      if (!element.isConnected) { return; }  // Element might have been replaced.

      element.scrollTop = Math.max(0, value);
   }

   /** @type {Function} */
   let unsubscribe = store.subscribe(storeUpdate);

   // Ignore first resize callback.
   let ignoreResize = true;

   cons`t resizeControl = resizeObserver(element, Timing.debounce(() =>
   {
      // Ignore first resize observed callback.
      if (ignoreResize) { ignoreResize = false; return; }

      if (element.isConnected) { store.set(element.scrollTop); }
   }, 750));

   /**
    * Save target `scrollTop` to the current set store.
    */
   function onScroll()
   {
      if (element.isConnected) { store.set(element.scrollTop); }
   }

   const debounceFn = Timing.debounce((e) => onScroll(e), 750);

   element.addEventListener('scroll', debounceFn);

   return {
      /**
       * @param {import('#runtime/svelte/store/util').MinimalWritable<number>} newStore - A minimal writable store that
       *        stores the element scrollTop.
       */
      update: (newStore) =>
      {
         unsubscribe?.();
         store = newStore;

         if (!isMinimalWritableStore(store))
         {
            throw new TypeError(`applyScrolltop.update error: 'store' must be a minimal writable Svelte store.`);
         }

         unsubscribe = store.subscribe(storeUpdate);
      },

      destroy: () =>
      {
         ignoreResize = true;
         element.removeEventListener('scroll', debounceFn);
         unsubscribe?.();
         resizeControl.destroy();
      }
   };
}
