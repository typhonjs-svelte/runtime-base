/**
 * Provides timing related higher-order functions.
 */
export abstract class Timing
{
   private constructor()
   {
      throw new Error('Timing constructor: This is a static class and should not be constructed.');
   }

   /**
    * Wraps a callback in a debounced timeout. Delay execution of the callback function until the function has not been
    * called for the given delay in milliseconds.
    *
    * @param callback - A function to execute once the debounced threshold has been passed.
    *
    * @param delay - An amount of time in milliseconds to delay.
    *
    * @returns A wrapped function that can be called to debounce execution.
    *
    * @example
    * /**
    *  * Debounce the update invocation by 500ms.
    *  *\/
    * const updateDebounced = Timing.debounce(() => doc.update(), 500);
    *
    * // Use the function like:
    * updateDebounced();
    *
    * @example
    * /**
    *  * Debounce the update invocation by 500ms.
    *  *
    *  * \@param {string} value - A value to update.
    *  *\/
    * const updateDebounced = Timing.debounce((value) => doc.update(value), 500);
    *
    * // Use the function like:
    * updateDebounced('new value');
    */
   static debounce<Args extends unknown[] = unknown[]>(callback: (...args: Args) => void, delay: number):
    (...args: Args) => void
   {
      if (typeof callback !== 'function')
      {
         throw new TypeError(`'callback' must be a function.`);
      }

      if (!Number.isInteger(delay) || delay < 0)
      {
         throw new TypeError(`'delay' must be a positive integer representing milliseconds.`);
      }

      let timeoutId: ReturnType<typeof setTimeout> | undefined;

      return function(this: unknown, ...args)
      {
         globalThis.clearTimeout(timeoutId);
         timeoutId = globalThis.setTimeout(() => { callback.apply(this, args); }, delay);
      };
   }

   /**
    * Creates a double click event handler that distinguishes between single and double clicks. Calls the `single`
    * callback on a single click and the `double` callback on a double click. The default double click delay to invoke
    * the `double` callback is 400 milliseconds.
    *
    * @param opts - Optional parameters.
    *
    * @param [opts.single] - Single click callback.
    *
    * @param [opts.double] - Double click callback.
    *
    * @param [opts.delay=400] - Double click delay.
    *
    * @returns The gated double-click handler.
    *
    * @example
    * // Given a button element.
    * button.addEventListener('click', Timing.doubleClick({
    *    single: (event) => console.log('Single click: ', event),
    *    double: (event) => console.log('Double click: ', event)
    * });
    */
   static doubleClick<E extends Event = Event>({ single, double, delay = 400 }:
    { single: (event: E) => void, double: (event: E) => void, delay: number }): (event: E) => void
   {
      if (single !== void 0 && typeof single !== 'function') { throw new TypeError(`'single' must be a function.`); }
      if (double !== void 0 && typeof double !== 'function') { throw new TypeError(`'double' must be a function.`); }

      if (!Number.isInteger(delay) || delay < 0)
      {
         throw new TypeError(`'delay' must be a positive integer representing milliseconds.`);
      }

      let clicks: number = 0;
      let timeoutId: ReturnType<typeof setTimeout> | undefined;

      return (event) =>
      {
         globalThis.clearTimeout(timeoutId);
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
            if (typeof double === 'function') { double(event); }
            clicks = 0;
         }
      };
   }
}
