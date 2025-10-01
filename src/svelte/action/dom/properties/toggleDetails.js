import { tick }            from '#svelte';
import { writable }        from '#svelte/store';

import {
   isMinimalWritableStore,
   subscribeFirstRest }    from '#runtime/svelte/store/util';

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
export function toggleDetails(details, { store, animate = true, clickActive = true, enabled = true } = {})
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
