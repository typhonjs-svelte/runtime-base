import { resizeObserver } from '@typhonjs-svelte/runtime-base/svelte/action/dom/observer';
import { isMinimalWritableStore, subscribeFirstRest } from '@typhonjs-svelte/runtime-base/svelte/store/util';
import { Timing } from '@typhonjs-svelte/runtime-base/util';
import { nextAnimationFrame } from '@typhonjs-svelte/runtime-base/util/animate';
import { isObject } from '@typhonjs-svelte/runtime-base/util/object';
import { tick } from 'svelte';
import { writable } from 'svelte/store';

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
function applyScroll(node, options = {})
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
   const debounceFn = Timing.debounce((e) => onScroll(), 750);

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
 * @param {HTMLDetailsElement} details - The `details` element.
 *
 * @param {import('./types').DOMPropActionOptions.ToggleDetails} - Options.
 *
 * @returns {import('svelte/action').ActionReturn<import('./types').DOMPropActionOptions.ToggleDetails>} Lifecycle
 *          functions.
 */
function toggleDetails(details, { store, animate = true, clickActive = true, enabled = true } = {})
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

   // Create store instance if not provided.
   if (!isMinimalWritableStore(store)) { store = writable(false); }

   if (store)
   {
      // The store sets initial open state and handles animation on further changes.
      unsubscribe = subscribeFirstRest(store, (value) =>
      {
         if (enabled && typeof value === 'boolean')
         {
            open = value;
            details.open = open;
         }
      }, async (value) =>
      {
         if (enabled && typeof value === 'boolean')
         {
            open = value;

            // Await `tick` to allow any conditional logic in the template to complete updating before handling animation.
            await tick();

            handleAnimation();
         }
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

   const noop = () => void 0;

   /**
    * Handles animation coordination based on current state.
    */
   function handleAnimation()
   {
      if (animate)
      {
         if (open)
         {
            const a = details.offsetHeight;
            if (animation)
            {
               animation.cancel();
               animation.effect = null;
               animation.onfinish = noop;
            }
            details.open = true;
            const b = details.offsetHeight;

            animateWAAPI(a, b, true);
         }
         else
         {
            const a = details.offsetHeight;
            if (animation)
            {
               animation.cancel();
               animation.effect = null;
               animation.onfinish = noop;
            }
            const b = summaryEl.offsetHeight;

            details.dataset.closing = 'true';

            animateWAAPI(a, b, false);
         }
      }
      else
      {
         details.open = open;
      }
   }

   /**
    * @param {MouseEvent} e - A mouse event.
    */
   function handleClick(e)
   {
      if (clickActive && enabled)
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
         if (typeof options.animate === 'boolean') { animate = options.animate; }

         if (typeof options.clickActive === 'boolean') { clickActive = options.clickActive; }

         if (typeof options.enabled === 'boolean') { enabled = options.enabled; }

         if (isMinimalWritableStore(options.store) && options.store !== store)
         {
            if (typeof unsubscribe === 'function') { unsubscribe(); }
            store = options.store;

            // The store sets initial open state and handles animation on further changes.
            unsubscribe = subscribeFirstRest(store, (value) =>
            {
               if (enabled && typeof value === 'boolean')
               {
                  open = value;
                  details.open = open;
               }
            }, async (value) =>
            {
               if (enabled && typeof value === 'boolean')
               {
                  open = value;

                  // Await `tick` to allow any conditional logic in the template to complete updating before handling animation.
                  await tick();

                  handleAnimation();
               }
            });
         }
      },
      destroy()
      {
         if (typeof unsubscribe === 'function') { unsubscribe(); }
         summaryEl.removeEventListener('click', handleClick);
      }
   };
}

export { applyScroll, toggleDetails };
//# sourceMappingURL=index.js.map
