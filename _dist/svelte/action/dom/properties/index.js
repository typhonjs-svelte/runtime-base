import { resizeObserver } from '@typhonjs-svelte/runtime-base/svelte/action/dom/observer';
import { isMinimalWritableStore, subscribeFirstRest } from '@typhonjs-svelte/runtime-base/svelte/store/util';
import { Timing } from '@typhonjs-svelte/runtime-base/util';
import { tick } from 'svelte';

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
 * @returns {import('svelte/action').ActionReturn<import('svelte/store').Writable<number>>} Lifecycle functions.
 */
function applyScrolltop(element, store)
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
   function storeUpdate(value)
   {
      if (!Number.isFinite(value)) { return; }

      // For some reason for scrollTop to take on first update from a new element setTimeout is necessary.
      setTimeout(() => element.scrollTop = value, 0);
   }

   let unsubscribe = store.subscribe(storeUpdate);

   const resizeControl = resizeObserver(element, Timing.debounce(() =>
   {
      if (element.isConnected) { store.set(element.scrollTop); }
   }, 500));

   /**
    * Save target `scrollTop` to the current set store.
    *
    * @param {Event} event -
    */
   function onScroll(event)
   {
      store.set(event.target.scrollTop);
   }

   const debounceFn = Timing.debounce((e) => onScroll(e), 500);

   element.addEventListener('scroll', debounceFn);

   return {
      /**
       * @param {import('svelte/store').Writable<number>} newStore - A writable store that stores the element scrollTop.
       */
      update: (newStore) =>
      {
         unsubscribe();
         store = newStore;

         if (!isMinimalWritableStore(store))
         {
            throw new TypeError(`applyScrolltop.update error: 'store' must be a minimal writable Svelte store.`);
         }

         unsubscribe = store.subscribe(storeUpdate);
      },

      destroy: () =>
      {
         element.removeEventListener('scroll', debounceFn);
         unsubscribe();
         resizeControl.destroy();
      }
   };
}

/**
 * Provides a toggle action for `details` HTML elements. The boolean store when provided controls open / closed state.
 * Animation is accomplished using WAAPI controlling the height of the details element. It should be noted that this
 * animation may cause layout thrashing (reflows) depending on the amount of DOM elements on the page though this
 * doesn't occur under most situations. Animation can be toggled on / off with the `animate` option.
 *
 * It is not necessary to bind the store to the `open` attribute of the associated details element.
 *
 * When the action is triggered to close the details element a data attribute `closing` is set to `true`. This allows
 * any associated closing transitions to start immediately.
 *
 * @param {HTMLDetailsElement} details - The details element.
 *
 * @param {object} opts - Options parameters.
 *
 * @param {import('#runtime/svelte/store/util').MinimalWritable<boolean>} opts.store - A minimal writable boolean store.
 *
 * @param {boolean} [opts.animate=true] - When true animate close / open state with WAAPI.
 *
 * @param {boolean} [opts.clickActive=true] - When false click events are not handled.
 *
 * @returns {import('svelte/action').ActionReturn} Lifecycle functions.
 */
function toggleDetails(details, { store, animate = true, clickActive = true } = {})
{
   // Add closing data. Useful for animating chevron immediately while closing.
   details.dataset.closing = 'false';

   /** @type {HTMLElement} */
   const summaryEl = details.querySelector('summary');

   /** @type {HTMLElement} */
   let contentEl = null;

   // Find the first child that is not a summary element; this is the content element. When animating overflow is
   // set to `hidden` to prevent scrollbars from activating.
   for (const child of details.children)
   {
      if (child.tagName !== 'SUMMARY')
      {
         contentEl = child;
         break;
      }
   }

   /** @type {Animation} */
   let animation;

   /** @type {boolean} */
   let open = details.open;  // eslint-disable-line no-shadow

   /** @type {import('svelte/store').Unsubscriber} */
   let unsubscribe;

   if (store)
   {
      // The store sets initial open state and handles animation on further changes.
      unsubscribe = subscribeFirstRest(store, (value) => { open = value; details.open = open; }, async (value) =>
      {
         open = value;

         // Await `tick` to allow any conditional logic in the template to complete updating before handling animation.
         await tick();

         handleAnimation();
      });
   }

   /**
    * @param {number} a -
    *
    * @param {number} b -
    *
    * @param {boolean} value -
    */
   function animateWAAPI(a, b, value)
   {
      // Must guard when `b - a === 0`; add a small epsilon and wrap with Math.max.
      const duration = Math.max(0, 30 * Math.log(Math.abs(b - a) + Number.EPSILON));

      if (animate)
      {
         details.style.overflow = 'hidden';
         if (contentEl) { contentEl.style.overflow = 'hidden'; }

         animation = details.animate(
          {
             height: [`${a}px`, `${b}px`]
          },
          {
             duration,
             easing: 'ease-out'
          }
         );

         animation.onfinish = () =>
         {
            details.open = value;
            details.dataset.closing = 'false';
            details.style.overflow = null;
            if (contentEl) { contentEl.style.overflow = null; }
         };
      }
      else
      {
         details.open = value;
         details.dataset.closing = 'false';
         details.style.overflow = null;
         if (contentEl) { contentEl.style.overflow = null; }
      }
   }

   /**
    * Handles animation coordination based on current state.
    */
   function handleAnimation()
   {
      if (open)
      {
         const a = details.offsetHeight;
         if (animation) { animation.cancel(); }
         details.open = true;
         const b = details.offsetHeight;

         animateWAAPI(a, b, true);
      }
      else
      {
         const a = details.offsetHeight;
         if (animation) { animation.cancel(); }
         const b = summaryEl.offsetHeight;

         details.dataset.closing = 'true';

         animateWAAPI(a, b, false);
      }
   }

   /**
    * @param {MouseEvent} e - A mouse event.
    */
   function handleClick(e)
   {
      if (clickActive)
      {
         e.preventDefault();

         // Simply set the store to the opposite of current open state and the callback above handles animation.
         store.set(!open);
      }
   }

   summaryEl.addEventListener('click', handleClick);

   return {
      update(options)
      {
         if (isMinimalWritableStore(options.store) && options.store !== store)
         {
            if (typeof unsubscribe === 'function') { unsubscribe(); }
            store = options.store;

            unsubscribe = subscribeFirstRest(store, (value) => { open = value; details.open = open; }, async (value) =>
            {
               open = value;

               // Await `tick` to allow any conditional logic in the template to complete updating before handling
               // animation.
               await tick();

               handleAnimation();
            });
         }

         if (typeof options.animate === 'boolean') { animate = options.animate; }

         if (typeof options.clickActive === 'boolean') { clickActive = options.clickActive; }
      },
      destroy()
      {
         if (typeof unsubscribe === 'function') { unsubscribe(); }
         summaryEl.removeEventListener('click', handleClick);
      }
   };
}

export { applyScrolltop, toggleDetails };
//# sourceMappingURL=index.js.map
