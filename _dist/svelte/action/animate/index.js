import { Timing } from '@typhonjs-svelte/runtime-base/util';
import { isObject } from '@typhonjs-svelte/runtime-base/util/object';

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

export { animate, composable };
//# sourceMappingURL=index.js.map
