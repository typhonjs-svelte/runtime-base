/**
 * Provides timing related higher-order functions.
 */
export class Timing
{
   /**
    * Wraps a callback in a debounced timeout.
    *
    * Delay execution of the callback function until the function has not been called for the given delay in milliseconds.
    *
    * @param {Function} callback - A function to execute once the debounced threshold has been passed.
    *
    * @param {number}   delay - An amount of time in milliseconds to delay.
    *
    * @returns {Function} A wrapped function that can be called to debounce execution.
    */
   static debounce(callback, delay)
   {
      let timeoutId;

      return function(...args)
      {
         globalThis.clearTimeout(timeoutId);
         timeoutId = globalThis.setTimeout(() => { callback.apply(this, args); }, delay);
      };
   }

   /**
    * @param {object}   opts - Optional parameters.
    *
    * @param {Function} opts.single - Single click callback.
    *
    * @param {Function} opts.double - Double click callback.
    *
    * @param {number}   [opts.delay=400] - Double click delay.
    *
    * @returns {(event: Event) => void} The gated double-click handler.
    */
   static doubleClick({ single, double, delay = 400 })
   {
      let clicks = 0;
      let timeoutId;

      return (event) =>
      {
         clicks++;

         if (clicks === 1)
         {
            timeoutId = globalThis.setTimeout(() =>
            {
               if (typeof single === 'function') { single(event); }
               clicks = 0;
            }, delay);
         }
         else
         {
            globalThis.clearTimeout(timeoutId);
            if (typeof double === 'function') { double(event); }
            clicks = 0;
         }
      };
   }
}
