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
export function rippleFocus({ duration = 300, background = 'rgba(255, 255, 255, 0.7)', selector } = {})
{
   return (element, { disabled = false } = {}) =>
   {
      // Ripple requires the efx element to have the overflow hidden due to rendering content outside the boundary.
      element.style.overflow = 'hidden';

      const targetEl = typeof selector === 'string' ? element.querySelector(selector) :
       element.firstChild instanceof HTMLElement ? element.firstChild : element;

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
