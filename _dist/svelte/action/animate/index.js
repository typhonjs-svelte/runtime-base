import { tick } from 'svelte';
import { subscribeFirstRest } from '@typhonjs-svelte/runtime-base/util/store';
import { Timing } from '@typhonjs-svelte/runtime-base/util';
import { isObject } from '@typhonjs-svelte/runtime-base/util/object';
import { A11yHelper } from '@typhonjs-svelte/runtime-base/util/browser';

/**
 * Defines an `Element.animate` animation from provided keyframes and options.
 *
 * @param {object}         [opts] - Optional parameters.
 *
 * @param {number}         [opts.duration=600] - Duration in milliseconds.
 *
 * @param {Array|object}   opts.keyframes - An array of keyframe objects or a keyframe object whose properties are
 *                                          arrays of values to iterate over.
 *
 * @param {object}         [opts.options] - An object containing one or more timing properties. When defined it is used
 *                                          instead of duration.
 *
 * @param {string}         [opts.event='click'] - DOM event to bind element to respond with the ripple effect.
 *
 * @param {number}         [opts.debounce=undefined] - Add a debounce to incoming events in milliseconds.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/animate
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API/Keyframe_Formats
 *
 * @returns {import('svelte/action').Action} Actual action.
 */
function animate({ duration = 600, keyframes = [], options, event = 'click', debounce } = {})
{
   return (element, { disabled = false } = {}) =>
   {
      /**
       * Creates WAAPI animation.
       */
      function createAnimation()
      {
         if (disabled) { return; }

         element.animate(keyframes, isObject(options) ? options : duration);
      }

      const eventFn = Number.isInteger(debounce) && debounce > 0 ? Timing.debounce(createAnimation, debounce) :
       createAnimation;

      element.addEventListener(event, eventFn);

      return {
         update: (options) =>
         {
            if (typeof options?.disabled === 'boolean') { disabled = options.disabled; }
         },
         destroy: () => element.removeEventListener(event, eventFn)
      };
   };
}

/**
 * Combines multiple composable actions.
 *
 * Note: The update function passes the same variable to all update functions of each action.
 *
 * @param {...import('svelte/action').Action} actions - One or more composable action functions to combine.
 *
 * @returns {import('svelte/action').Action<HTMLElement, any>} Composed action.
 */
function composable(...actions)
{
   return (element, options) =>
   {
      let lifecycle = actions.map((action) => action(element, options));

      return {
         destroy: () =>
         {
            for (const action of lifecycle)
            {
               if (typeof action.destroy === 'function') { action.destroy(); }
            }

            lifecycle = void 0;
         },
         update: (parameters) =>
         {
            for (const action of lifecycle)
            {
               if (typeof action.update === 'function') { action.update(parameters); }
            }
         }
      };
   };
}

/**
 * Defines the classic Material Design ripple effect as an action. `ripple` is a wrapper around the returned action.
 * This allows it to be easily used as a prop.
 *
 * Note: A negative one translateZ transform is applied to the added spans allowing other content to be layered on top
 * with a positive translateZ.
 *
 * Note: The ripple effect requires the `efx` element to have overflow hidden. This is set inline when the effect is
 * applied.
 *
 * Note: A CustomEvent `efx-trigger` is handled in cases when explicit triggering is necessary. This event should
 * have the actual source event as a property of `detail`.
 *
 * Styling: There is a single CSS variable `--tjs-action-ripple-background` that can be set to control the background.
 *
 * @param {object}   [opts] - Optional parameters.
 *
 * @param {number}   [opts.duration=600] - Duration in milliseconds.
 *
 * @param {string}   [opts.background='rgba(255, 255, 255, 0.7)'] - A valid CSS background attribute.
 *
 * @param {Iterable<string>}  [opts.events=['click', 'keyup']] - DOM event to bind element to respond with the ripple
 *                                                                  effect.
 *
 * @param {string}   [opts.keyCode='Enter'] - Key code to trigger for any applicable key events.
 *
 * @param {boolean}  [opts.contextmenu=false] - Add triggering for context menu key and click.
 *
 * @param {number}   [opts.debounce=undefined] - Add a debounce to incoming events in milliseconds.
 *
 * @returns {import('svelte/action').Action} Actual action.
 */
function ripple({ duration = 600, background = 'rgba(255, 255, 255, 0.7)', events = ['click', 'keyup'],
 keyCode = 'Enter', contextmenu = false, debounce } = {})
{
   return (element, { disabled = false } = {}) =>
   {
      // Ripple requires the efx element to have the overflow hidden due to rendering content outside the boundary.
      element.style.overflow = 'hidden';

      /**
       * Creates the ripple effect.
       *
       * @param {MouseEvent|KeyboardEvent}   e -
       */
      function createRipple(e)
      {
         if (disabled) { return; }

         const elementRect = element.getBoundingClientRect();

         const diameter = Math.max(elementRect.width, elementRect.height);
         const radius = diameter / 2;

         // Find the adjusted click location relative to center or if no `clientX/Y` parameters choose center.
         const left = e.clientX ? `${e.clientX - (elementRect.left + radius)}px` : '0';
         const top = e.clientY ? `${e.clientY - (elementRect.top + radius)}px` : '0';

         const span = document.createElement('span');

         span.style.position = 'absolute';
         span.style.width = `${diameter}px`;
         span.style.height = `${diameter}px`;
         span.style.left = left;
         span.style.top = top;

         span.style.background = `var(--tjs-action-ripple-background, ${background})`;
         span.style.borderRadius = '50%';
         span.style.pointerEvents = 'none';
         span.style.transform = 'translateZ(-1px)';

         element.prepend(span);

         const animation = span.animate([
            {  // from
               transform: 'scale(.7)',
               opacity: 0.5,
               filter: 'blur(2px)'
            },
            {  // to
               transform: 'scale(4)',
               opacity: 0,
               filter: 'blur(5px)'
            }
         ],
         duration);

         animation.onfinish = () =>
         {
            if (span && span.isConnected) { span.remove(); }
         };
      }

      /**
       * Handles a custom event trigger `efx-trigger`. The `CustomEvent` should have an `event` object accessible from
       * `detail`.
       *
       * @param {CustomEvent} event - CustomEvent.
       */
      function customHandler(event)
      {
         const actual = event?.detail?.event;

         if (actual instanceof KeyboardEvent || actual instanceof MouseEvent) { createRipple(actual); }
      }

      /**
       * Handles any key event and only triggers the ripple effect if key code matches.
       *
       * @param {KeyboardEvent}  event -
       */
      function keyHandler(event)
      {
         if (disabled) { return; }

         if (event?.code === keyCode) { createRipple(event); }
      }

      const eventFn = Number.isInteger(debounce) && debounce > 0 ? Timing.debounce(createRipple, debounce) :
       createRipple;

      const customEventFn = Number.isInteger(debounce) && debounce > 0 ? Timing.debounce(customHandler, debounce) :
       customHandler;

      const keyEventFn = Number.isInteger(debounce) && debounce > 0 ? Timing.debounce(keyHandler, debounce) :
       keyHandler;

      for (const event of events)
      {
         if (['keydown', 'keyup'].includes(event))
         {
            element.addEventListener(event, keyEventFn);
         }
         else
         {
            element.addEventListener(event, eventFn);
         }
      }

      element.addEventListener('efx-trigger', customEventFn);

      if (contextmenu) { element.addEventListener('contextmenu', eventFn); }

      return {
         update: (options) =>
         {
            if (typeof options?.disabled === 'boolean') { disabled = options.disabled; }
         },
         destroy: () =>
         {
            for (const event of events)
            {
               if (['keydown', 'keyup'].includes(event))
               {
                  element.removeEventListener(event, keyEventFn);
               }
               else
               {
                  element.removeEventListener(event, eventFn);
               }
            }

            element.removeEventListener('efx-trigger', customEventFn);

            if (contextmenu) { element.removeEventListener('contextmenu', eventFn); }
         }
      };
   };
}

/**
 * Defines the classic Material Design ripple effect as an action that is attached to an elements focus and blur events.
 * `rippleFocus` is a wrapper around the returned action. This allows it to be easily used as a prop.
 *
 * Note: A negative one translateZ transform is applied to the added spans allowing other content to be layered on top
 * with a positive translateZ.
 *
 * Note: The ripple effect requires the `efx` element to have overflow hidden. This is set inline when the effect is
 * applied.
 *
 * If providing the `selector` option a target child element will be registered for the focus events otherwise the
 * first child is targeted with a final fallback of the element assigned to this action.
 *
 * Styling: There is a single CSS variable `--tjs-action-ripple-background-focus` that can be set to control the
 * background with a fallback to `--tjs-action-ripple-background`.
 *
 * @param {object}   [opts] - Optional parameters.
 *
 * @param {number}   [opts.duration=300] - Duration in milliseconds.
 *
 * @param {string}   [opts.background='rgba(255, 255, 255, 0.7)'] - A valid CSS background attribute.
 *
 * @param {string}   [opts.selector] - A valid CSS selector string.
 *
 * @returns {import('svelte/action').Action} Actual action.
 */
function rippleFocus({ duration = 300, background = 'rgba(255, 255, 255, 0.7)', selector } = {})
{
   return (element, { disabled = false } = {}) =>
   {
      // Ripple requires the efx element to have the overflow hidden due to rendering content outside the boundary.
      element.style.overflow = 'hidden';

      const targetEl = typeof selector === 'string' ? element.querySelector(selector) :
       A11yHelper.isFocusTarget(element.firstChild) ? element.firstChild : element;

      let clientX = -1;
      let clientY = -1;

      /** @type {HTMLSpanElement[]} */
      const activeSpans = [];

      /**
       * WAAPI ripple animation on blur.
       */
      function blurRipple()
      {
         if (disabled) { return; }

         // When clicking outside the browser window or to another tab `document.activeElement` remains
         // the same despite blur being invoked; IE the target element.
         if (activeSpans.length === 0 || document.activeElement === targetEl) { return; }

         for (const span of activeSpans)
         {
            const animation = span.animate(
             [
                {  // from
                   transform: 'scale(3)',
                   opacity: 0.3,
                },
                {  // to
                   transform: 'scale(.7)',
                   opacity: 0.0,
                }
             ],
             {
                duration,
                fill: 'forwards'
             });

            animation.onfinish = () =>
            {
               if (span.isConnected) { span.remove(); }
            };
         }

         // Remove all active spans as they are now animating out.
         activeSpans.length = 0;
      }

      /**
       * WAAPI ripple animation on focus.
       */
      function focusRipple()
      {
         if (disabled) { return; }

         // If already focused and the span exists do not create another ripple effect.
         if (activeSpans.length > 0) { return; }

         const elementRect = element.getBoundingClientRect();

         // The order of events don't always occur with a pointer event first. In this case use the center of the
         // element as the click point. Mostly this is seen when the focused target element has a followup event off
         // the app / screen. If the next pointer down occurs on the target element the focus callback occurs before
         // pointer down in Chrome and Firefox.
         const actualX = clientX >= 0 ? clientX : elementRect.left + (elementRect.width / 2);
         const actualY = clientY >= 0 ? clientY : elementRect.top + (elementRect.height / 2);

         const diameter = Math.max(elementRect.width, elementRect.height);
         const radius = diameter / 2;
         const left = `${actualX - (elementRect.left + radius)}px`;
         const top = `${actualY - (elementRect.top + radius)}px`;

         const span = document.createElement('span');

         span.style.position = 'absolute';
         span.style.width = `${diameter}px`;
         span.style.height = `${diameter}px`;
         span.style.left = left;
         span.style.top = top;

         span.style.background =
          `var(--tjs-action-ripple-background-focus, var(--tjs-action-ripple-background, ${background}))`;

         span.style.borderRadius = '50%';
         span.style.pointerEvents = 'none';
         span.style.transform = 'translateZ(-1px)';

         element.prepend(span);

         activeSpans.push(span);

         span.animate([
            {  // from
               transform: 'scale(.7)',
               opacity: 0.5,
            },
            {  // to
               transform: 'scale(3)',
               opacity: 0.3,
            }
         ],
         {
            duration,
            fill: 'forwards'
         });

         // Reset stored pointer position.
         clientX = clientY = -1;
      }

      /**
       * Store the pointer down location for the origination of the ripple.
       *
       * @param {PointerEvent} e - A PointerEvent.
       */
      function onPointerDown(e)
      {
         if (disabled) { return; }

         clientX = e.clientX;
         clientY = e.clientY;
      }

      targetEl.addEventListener('pointerdown', onPointerDown);
      targetEl.addEventListener('blur', blurRipple);
      targetEl.addEventListener('focus', focusRipple);

      return {
         update: (options) =>
         {
            if (typeof options?.disabled === 'boolean')
            {
               disabled = options.disabled;
               if (disabled) { blurRipple(); }
            }
         },
         destroy: () =>
         {
            targetEl.removeEventListener('pointerdown', onPointerDown);
            targetEl.removeEventListener('blur', blurRipple);
            targetEl.removeEventListener('focus', focusRipple);
         }
      };
   };
}

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

   // The store sets initial open state and handles animation on further changes.
   let unsubscribe = subscribeFirstRest(store, (value) => { open = value; details.open = open; }, async (value) =>
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
         if (options.store !== store)
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
         unsubscribe();
         summaryEl.removeEventListener('click', handleClick);
      }
   };
}

export { animate, composable, ripple, rippleFocus, toggleDetails };
//# sourceMappingURL=index.js.map
