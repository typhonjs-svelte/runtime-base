class Hashing
{
   static #regexUuidv = /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;

   /**
    * Provides a solid string hashing algorithm.
    *
    * Sourced from: https://stackoverflow.com/a/52171480
    *
    * @param {string}   str - String to hash.
    *
    * @param {number}   seed - A seed value altering the hash.
    *
    * @returns {number} Hash code.
    */
   static hashCode(str, seed = 0)
   {
      if (typeof str !== 'string') { return 0; }

      let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;

      for (let ch, i = 0; i < str.length; i++)
      {
         ch = str.charCodeAt(i);
         h1 = Math.imul(h1 ^ ch, 2654435761);
         h2 = Math.imul(h2 ^ ch, 1597334677);
      }

      h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
      h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

      return 4294967296 * (2097151 & h2) + (h1 >>> 0);
   }

   /**
    * Validates that the given string is formatted as a UUIDv4 string.
    *
    * @param {string}   uuid - UUID string to test.
    *
    * @returns {boolean} Is UUIDv4 string.
    */
   static isUuidv4(uuid)
   {
      return this.#regexUuidv.test(uuid);
   }

   /**
    * Generates a UUID v4 compliant ID. Please use a complete UUID generation package for guaranteed compliance.
    *
    * This code is an evolution of the following Gist.
    * https://gist.github.com/jed/982883
    *
    * There is a public domain / free copy license attached to it that is not a standard OSS license...
    * https://gist.github.com/jed/982883#file-license-txt
    *
    * @returns {string} UUIDv4
    */
   static uuidv4()
   {
      return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
       (c ^ (globalThis.crypto ?? globalThis.msCrypto).getRandomValues(
        new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
   }
}

/**
 * Provides utility functions for strings.
 */
class Strings
{
   /**
    * Escape a given input string prefacing special characters with backslashes for use in a regular expression.
    *
    * @param {string}   string - An un-escaped input string.
    *
    * @returns {string} The escaped string suitable for use in a regular expression.
    */
   static escape(string)
   {
      return string.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
   }

   /**
    * Normalizes a string.
    *
    * @param {string}   string - A string to normalize for comparisons.
    *
    * @returns {string} Cleaned string.
    *
    * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize
    */
   static normalize(string)
   {
      return string.trim().normalize('NFD').replace(/[\x00-\x1F]/gm, ''); // eslint-disable-line no-control-regex
   }
}

/**
 * Provides timing related higher-order functions.
 */
class Timing
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

export { Hashing, Strings, Timing };
//# sourceMappingURL=index.js.map
