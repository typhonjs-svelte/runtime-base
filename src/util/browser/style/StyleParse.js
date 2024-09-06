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

   /**
    * Returns the pixel value for `1rem` based on the root document element. You may apply an optional multiplier.
    *
    * @param {number} [multiplier=1] - Optional multiplier to apply to `rem` pixel value; default: 1.
    *
    * @param {object} [options] - Optional parameters.
    *
    * @param {Document} [options.targetDocument=document] The target DOM {@link Document} if different from the main
    *        browser global `document`.
    *
    * @returns {number} The pixel value for `1rem` with or without a multiplier based on the root document element.
    */
   static remPixels(multiplier = 1, { targetDocument = document } = {})
   {
      return targetDocument?.documentElement ?
       multiplier * parseFloat(globalThis.getComputedStyle(targetDocument.documentElement).fontSize) : void 0;
   }
}
