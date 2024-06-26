/**
 * Provides utility functions for strings.
 *
 * This class should not be constructed as it only contains static methods.
 */
export class Strings
{
   /**
    * @hideconstructor
    */
   constructor()
   {
      throw new Error('Strings constructor: This is a static class and should not be constructed.');
   }

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
