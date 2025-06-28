/**
 * Provides resources for parsing style strings.
 */
export class StyleParse
{
   static #regexPixels = /(\d+)\s*px/;

   /**
    * @hideconstructor
    */
   constructor()
   {
      throw new Error('StyleParse constructor: This is a static class and should not be constructed.');
   }

   /**
    * Parse an inline CSS style text string into an object.
    *
    * @param {string} cssText - Inline CSS style text to parse.
    *
    * @param {object} [options] - Optional settings.
    *
    * @param {boolean} [options.camelCase=false] - Whether to convert property names to camelCase.
    *
    * @returns {{ [key: string]: string }} Parsed object of CSS properties.
    */
   static cssText(cssText, { camelCase = false } = {})
   {
      if (typeof cssText !== 'string') { return {}; }

      const result = {};

      for (const entry of cssText.split(';'))
      {
         const index = entry.indexOf(':');

         if (index !== -1)
         {
            let key = entry.slice(0, index).trim();
            const value = entry.slice(index + 1).trim();

            if (key !== '')
            {
               if (camelCase) { key = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase()); }

               result[key] = value;
            }
         }
      }

      return result;
   }

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
