import { resizeObserver }           from '#runtime/svelte/action/dom/observer';
import { isMinimalWritableStore }   from '#runtime/svelte/store/util';
import { Timing }                   from '#runtime/util';
import { nextAnimationFrame }       from '#runtime/util/animate';
import { isObject }                 from '#runtime/util/object';

/**
 * Provides an action to save `scrollTop` / `scrollLeft` of an element with scrollbars. This action should be used on
 * the scrollable element and must include writable stores that holds the active store for the current `scrollTop` /
 * `scrollLeft` value.
 *
 * You may switch the stores externally and this action will update based on the newly set store. This is useful for
 * instance providing a select box that controls the scrollable container switching between multiple lists of data
 * serializing scroll position between each.
 *
 * @param {HTMLElement} node - The target scrollable HTML element.
 *
 * @param {import('./types').DOMPropActionOptions.ApplyScroll} options - Options.
 *
 * @returns {(import('svelte/action').ActionReturn<import('./types').DOMPropActionOptions.ApplyScroll>)} Lifecycle
 *          functions.
 */
export function applyScroll(node, options = {})
{
   const storeUpdateLeft = (value) => storeUpdate(value, 'scrollLeft');
   const storeUpdateTop = (value) => storeUpdate(value, 'scrollTop');

   /** @type {import('#runtime/svelte/store/util').MinimalWritable<number>} */
   let storeLeft, storeTop;

   /** @type {Function} */
   let unsubscribeLeft, unsubscribeTop;

   /**
    * Save element `scrollLeft` / `scrollTop` to the current stores.
    */
   function onScroll()
   {
      if (node.isConnected)
      {
         storeLeft?.set?.(node.scrollLeft);
         storeTop?.set?.(node.scrollTop);
      }
   }

   /**
    * Update `scrollLeft` / `scrollTop` stores from options and configures subscribers.
    *
    * @param {import('./types').DOMPropActionOptions.ApplyScroll} newOptions -
    */
   function setOptions(newOptions)
   {
      if (!isObject(newOptions)) { throw new TypeError(`applyScroll error: 'options' must be an object.`); }

      if (newOptions.scrollLeft !== void 0 && !isMinimalWritableStore(newOptions.scrollLeft))
      {
         throw new TypeError(`applyScroll error: 'storeLeft' must be a minimal writable Svelte store.`);
      }

      if (newOptions.scrollTop !== void 0 && !isMinimalWritableStore(newOptions.scrollTop))
      {
         throw new TypeError(`applyScroll error: 'scrollTop' must be a minimal writable Svelte store.`);
      }

      if (storeLeft !== newOptions.scrollLeft)
      {
         unsubscribeLeft?.();
         unsubscribeLeft = void 0;
         storeLeft = newOptions.scrollLeft;

         if (isMinimalWritableStore(storeLeft)) { unsubscribeLeft = storeLeft.subscribe(storeUpdateLeft); }
      }

      if (storeTop !== newOptions.scrollTop)
      {
         unsubscribeTop?.();
         unsubscribeTop = void 0;
         storeTop = newOptions.scrollTop;

         if (isMinimalWritableStore(storeTop)) { unsubscribeTop = storeTop.subscribe(storeUpdateTop); }
      }
   }

   /**
    * Updates element `scrollLeft` / `scrollTop`.
    *
    * @param {number}   value - Value to set.
    *
    * @param {'scrollLeft' | 'scrollTop'} prop - Property to update.
    */
   async function storeUpdate(value, prop)
   {
      if (!Number.isFinite(value)) { return; }

      await nextAnimationFrame(2);  // Ensure DOM is patched.

      if (!node.isConnected) { return; }  // Element might have been replaced.

      node[prop] = Math.max(0, value);
   }

   // Immediate initialization ---------------------------------------------------------------------------------------

   setOptions(options);

   // Ignore first resize callback.
   let ignoreResize = true;

   let resizeControl = resizeObserver(node, Timing.debounce(() =>
   {
      // Ignore first resize observed callback.
      if (ignoreResize) { ignoreResize = false; return; }

      if (node.isConnected)
      {
         storeLeft?.set?.(node.scrollLeft);
         storeTop?.set?.(node.scrollTop);
      }
   }, 750));

   // Setup debounced scroll event handler.
   const debounceFn = Timing.debounce((e) => onScroll(e), 750);

   node.addEventListener('scroll', debounceFn);

   // Action return --------------------------------------------------------------------------------------------------

   return {
      /**
       * @param {import('./types').DOMPropActionOptions.ApplyScroll} newOptions - New options.
       */
      update: (newOptions) => setOptions(newOptions),

      destroy: () =>
      {
         ignoreResize = true;

         node.removeEventListener('scroll', debounceFn);

         resizeControl.destroy();
         resizeControl = void 0;

         storeLeft = void 0;
         storeTop = void 0;

         unsubscribeLeft?.();
         unsubscribeTop?.();
         unsubscribeLeft = void 0;
         unsubscribeTop = void 0;
      }
   };
}
