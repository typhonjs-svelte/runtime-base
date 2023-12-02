import { tick }               from '#svelte';

import { subscribeFirstRest } from '#runtime/util/store';

/**
 * Provides a toggle action for `details` HTML elements. The boolean store provided controls animation.
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
 * @param {import('svelte/store').Writable<boolean>} opts.store - A boolean store.
 *
 * @param {boolean} [opts.animate] - When true animate close / open state with WAAPI.
 *
 * @param {boolean} [opts.clickActive] - When false click events are not handled.
 *
 * @returns {import('svelte/action').ActionReturn} Lifecycle functions.
 */
export function toggleDetails(details, { store, animate = true, clickActive = true } = {})
{
   /** @type {HTMLElement} */
   const summary = details.querySelector('summary');

   /** @type {Animation} */
   let animation;

   /** @type {boolean} */
   let open = details.open;  // eslint-disable-line no-shadow

   // The store sets initial open state and handles animation on further changes.
   const unsubscribe = subscribeFirstRest(store, (value) => { open = value; details.open = open; }, async (value) =>
   {
      open = value;

      // Await `tick` to allow any conditional logic in the template to complete updating before handling animation.
      await tick();

      handleAnimation();
   });

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
         };
      }
      else
      {
         details.open = value;
         details.dataset.closing = 'false';
         details.style.overflow = null;
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
         const b = summary.offsetHeight;

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

   summary.addEventListener('click', handleClick);

   return {
      destroy()
      {
         unsubscribe();
         summary.removeEventListener('click', handleClick);
      }
   };
}
