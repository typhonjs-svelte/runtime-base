/**
 * Provides resources for parsing style strings.
 */
export class StyleParse
{
   static #regexPixels = /(\d+)\s*px/;

   /**
    * Parses a pixel string / computed styles. Ex. `100px` returns `100`.
    *
    * @param {string}   value - Value to parse.
    *
    * @returns {number|undefined} The integer component of a pixel string.
    */
   static pixels(value)
   {
      if (typeof value !== 'string') { return void 0; }

      const isPixels = this.#regexPixels.test(value);
      const number = parseInt(value);

      return isPixels && Number.isFinite(number) ? number : void 0;
   }
}
