/**
 * Provides resources for parsing style strings.
 */
export class StyleParse
{
   static #regexPixels = /(\d+)\s*px/;

   /**
    * @private
    */
   private constructor()
   {
      throw new Error('StyleParse constructor: This is a static class and should not be constructed.');
   }

   /**
    * Parse a CSS declaration block / {@link CSSDeclarationBlock} (IE `color: red; font-size: 14px;`) into an object of
    * property / value pairs.
    *
    * This implementation is optimized for parsing the output of `CSSStyleRule.style.cssText`, which is always
    * well-formed according to the CSSOM spec. It is designed to be:
    * ```
    * - **Fast**: minimal allocations, no regex in the hot loop.
    * - **Accurate**: ignores `;` inside quotes or parentheses.
    * - **Flexible**: supports optional camel case conversion.
    * - **CSS variable safe**: leaves `--*` properties untouched.
    *```
    *
    * @param cssText - A valid CSS declaration block (no selectors).
    *
    * @param [options] - Optional parser settings.
    *
    * @param [options.camelCase=false] - Convert hyphen-case property names to camel case.
    *
    * @returns An object mapping property names to their CSS values.
    */
   static cssText(cssText: string, { camelCase = false }: { camelCase?: boolean } = {}): { [key: string]: string }
   {
      // Reject non-strings or empty input quickly.
      if (typeof cssText !== 'string' || cssText.length === 0) { return {}; }

      // Quick reject: if there's no `:` there are no declarations.
      if (cssText.indexOf(':') === -1) { return {}; }

      const out: { [key: string]: string } = {};

      // Index where the current declaration starts.
      let segStart = 0;

      // Tracks whether we are inside parentheses (url(), calc(), var(), etc.).
      let parens = 0;

      // Tracks whether we are inside single or double quotes.
      let inSQ = false;
      let inDQ = false;

      // Walk through every character in the string.
      for (let i = 0; i < cssText.length; i++)
      {
         const ch = cssText[i];

         if (ch === '"' && !inSQ)
         {
            // Toggle double-quote mode if not in single quotes.
            inDQ = !inDQ;
         }
         else if (ch === '\'' && !inDQ)
         {
            // Toggle single-quote mode if not in double quotes.
            inSQ = !inSQ;
         }
         else if (!inSQ && !inDQ)
         {
            // Only count parentheses when outside of quotes.
            if (ch === '(')
            {
               parens++;
            }
            else if (ch === ')')
            {
               if (parens > 0) { parens--; }
            }
            // Only treat `;` as a declaration terminator if not inside parentheses.
            else if (ch === ';' && parens === 0)
            {
               // Extract the substring for this declaration.
               if (i > segStart)
               {
                  const chunk = cssText.slice(segStart, i).trim();
                  if (chunk) { this.#cssTextFlushDecl(chunk, out, camelCase); }
               }
               // Move start index to the character after the semicolon.
               segStart = i + 1;
            }
         }
      }

      // Process the last declaration after the loop ends.
      if (segStart < cssText.length)
      {
         const chunk = cssText.slice(segStart).trim();
         if (chunk) { this.#cssTextFlushDecl(chunk, out, camelCase); }
      }

      return out;
   }

   /**
    * Parses a pixel string / computed styles. Ex. `100px` returns `100`.
    *
    * @param   value - Value to parse.
    *
    * @returns The integer component of a pixel string.
    */
   static pixels(value: string): number | undefined
   {
      if (typeof value !== 'string') { return void 0; }

      const isPixels = this.#regexPixels.test(value);
      const number = parseInt(value);

      return isPixels && Number.isFinite(number) ? number : void 0;
   }

   /**
    * Returns the pixel value for `1rem` based on the root document element. You may apply an optional multiplier.
    *
    * @param [multiplier=1] - Optional multiplier to apply to `rem` pixel value; default: 1.
    *
    * @param [options] - Optional parameters.
    *
    * @param [options.targetDocument=document] The target DOM {@link Document} if different from the main
    *        browser global `document`.
    *
    * @returns The pixel value for `1rem` with or without a multiplier based on the root document element.
    */
   static remPixels(multiplier: number = 1, { targetDocument = window.document }: { targetDocument?: Document } = {}):
    number | undefined
   {
      return targetDocument?.documentElement ?
       multiplier * parseFloat(window.getComputedStyle(targetDocument.documentElement).fontSize) : void 0;
   }

   // Internal Implementation ----------------------------------------------------------------------------------------

   /**
    * Parse a single CSS declaration string into a property / value pair and store it in the output object.
    *
    * Note: Used by {@link StyleParse.cssText}.
    *
    * This method:
    * ```
    * - Splits on the first `:` into property and value parts
    * - Trims whitespace from both
    * - Optionally converts hyphen-case to camelCase
    * - Ignores empty or malformed declarations
    * ```
    *
    * @param chunk - The raw CSS declaration string (IE `"color: red"`).
    *
    * @param out - The object to store the parsed property / value pair.
    *
    * @param camelCase - Whether to convert hyphen-case keys to camel case.
    */
   static #cssTextFlushDecl(chunk: string, out: { [key: string]: string }, camelCase: boolean): void
   {
      // Find the first colon — separates property from value.
      const idx = chunk.indexOf(':');
      if (idx < 0) { return; }

      // Extract and trim the property name.
      let key = chunk.slice(0, idx).trim();
      if (!key) { return; }

      // Extract and trim the value (keep empty string if explicitly set).
      const value = chunk.slice(idx + 1).trim();

      // Convert to camelCase if requested and not a CSS variable.
      if (camelCase && !key.startsWith('--'))
      {
         let s = '';
         for (let i = 0; i < key.length; i++)
         {
            const code = key.charCodeAt(i);
            if (code === 45 /* '-' */ && i + 1 < key.length)
            {
               i++;
               s += key[i].toUpperCase();
            }
            else
            {
               s += key[i];
            }
         }
         key = s;
      }

      // Store in the output object.
      out[key] = value;
   }
}
