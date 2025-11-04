/**
 * Provides utility functions for strings.
 *
 * This class should not be constructed as it only contains static methods.
 */
export abstract class Strings
{
   static #regexEscape = /[-/\\^$*+?.()|[\]{}]/g;
   static #regexNormalize = /[\x00-\x1F]/gm;
   static #regexReplacement = '\\$&';

   private constructor()
   {
      throw new Error('Strings constructor: This is a static class and should not be constructed.');
   }

   /**
    * Escape a given input string prefacing special characters with backslashes for use in a regular expression.
    *
    * @param str - An un-escaped input string.
    *
    * @returns The escaped string suitable for use in a regular expression.
    */
   static escape(str: string): string
   {
      return str.replace(this.#regexEscape, this.#regexReplacement);
   }

   /**
    * Normalizes a string.
    *
    * @param str - A string to normalize for comparisons.
    *
    * @returns Cleaned string.
    *
    * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize
    */
   static normalize(str: string)
   {
      return str.trim().normalize('NFD').replace(this.#regexNormalize, '');
   }
}
