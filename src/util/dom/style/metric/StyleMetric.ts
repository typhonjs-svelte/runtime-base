import { isObject } from '#runtime/util/object';

/**
 * Provides computed style–based metric utilities for DOM elements.
 *
 * The `StyleMetric` static class offers precise runtime calculations for visual and painted metrics
 * (IE border-image thicknesses, resolved pixel sizes). All methods operate on live DOM elements using computed style
 * data.
 */
abstract class StyleMetric
{
   /** Used in {@link StyleMetric.getVisualEdgeInsets} */
   static #arrayExpand4_1: string[] = Object.seal(['0', '0', '0', '0']);

   /** Used in {@link StyleMetric.getVisualEdgeInsets} */
   static #arrayExpand4_2: string[] = Object.seal(['0', '0', '0', '0']);

   /** The cached scrollbar width calculation from {@link StyleMetric.getScrollbarWidth}. */
   static #cachedScrollbarWidth?: number = void 0;

   static #regexNumber = /^[\d.]+$/;
   static #regexWhiteSpace = /\s+/;
   static #regexValidLength = /^[\d.]+(px|%)?$/;

   private constructor()
   {
      throw new Error('StyleMetric constructor: This is a static class and should not be constructed.');
   }

   /**
    * Expands a CSS 1–4 value shorthand sequence into its four physical sides (`top`, `right`, `bottom`, `left`)
    * following standard CSS expansion rules.
    *
    * This applies to properties whose value syntax follows the box-side shorthand model used by `margin`, `padding`,
    * `border-width`, `border-image-width`, and `border-image-slice`, where the tokens map as:
    * ```
    * 1. value: [v, v, v, v]
    * 2. values: [vTopBottom, vRightLeft]
    * 3. values: [vTop, vRightLeft, vBottom]
    * 4. values: [vTop, vRight, vBottom, vLeft]
    * ```
    *
    * @param tokens - The raw token array (1–4 items) extracted from a CSS property.
    *
    * @param [output] - Optional preallocated 4-element array to write into.
    *
    * @param [options] - Optional options.
    *
    * @param [options.defaultValue] Specify the default expansion value; default: `'0'`.
    *
    * @param [options.output] A specific output array for reuse otherwise a new array is created by default.
    *
    * @returns A 4-element array representing [top, right, bottom, left].
    *
    * @example
    *   StyleMetric.expand4Length(['10px']);
    *   // → ['10px','10px','10px','10px']
    *
    *   StyleMetric.expand4Length(['10px','20px']);
    *   // → ['10px','20px','10px','20px']
    *
    *   StyleMetric.expand4Length(['10px','20px','30px']);
    *   // → ['10px','20px','30px','20px']
    */
   static expand4Length(tokens: string[], { defaultValue = '0', output = new Array(4) }:
    { defaultValue?: string, output?: string[] } = {}): string[]
   {
      if (!Array.isArray(tokens)) { throw new TypeError(`'tokens' is not an array.`); }
      if (!Array.isArray(output)) { throw new TypeError(`'output' is not an array.`); }
      if (typeof defaultValue !== 'string') { throw new TypeError(`'defaultValue' is not a string.`); }

      switch (tokens.length)
      {
         case 1:
            output[0] = tokens[0] ?? defaultValue;
            output[1] = tokens[0] ?? defaultValue;
            output[2] = tokens[0] ?? defaultValue;
            output[3] = tokens[0] ?? defaultValue;
            break;

         case 2:
            output[0] = tokens[0] ?? defaultValue;
            output[1] = tokens[1] ?? defaultValue;
            output[2] = tokens[0] ?? defaultValue;
            output[3] = tokens[1] ?? defaultValue;
            break;

         case 3:
            output[0] = tokens[0] ?? defaultValue;
            output[1] = tokens[1] ?? defaultValue;
            output[2] = tokens[2] ?? defaultValue;
            output[3] = tokens[1] ?? defaultValue;
            break;

         default:
         case 4:
            output[0] = tokens[0] ?? defaultValue;
            output[1] = tokens[1] ?? defaultValue;
            output[2] = tokens[2] ?? defaultValue;
            output[3] = tokens[3] ?? defaultValue;
            break;
      }

      return output;
   }

   /**
    * Computes the effective *visual edge insets* for an element — the per-side * pixel offsets where the element’s
    * visual border intrudes inward into the content area.
    *
    * These insets represent the internal constraints imposed by visually rendered border effects. They are intended
    * for layout adjustments such as applying padding, positioning slotted elements, or aligning content to remain
    * fully inside the element’s painted border region.
    *
    * The current implementation evaluates intrusions resulting from `border-image`, including:
    * ```
    * - `border-image-width` values (absolute, percentage, or unitless),
    * - `auto` fallback resolution using `border-image-slice`,
    * - the absence of a border image (`border-image-source: none` → zero insets),
    * - optional pre-fetched metrics to avoid repeated DOM/style reads.
    * ```
    *
    * @param el - HTMLElement to compute painted border widths for.
    *
    * @param [output] - Existing `BoxSides` output data object.
    *
    * @param [options] Optional pre-fetched element data for performance reuse.
    *
    * @returns Painted border width constraints in pixel units.
    */
   static getVisualEdgeInsets<Output extends StyleMetric.Data.BoxSides = StyleMetric.Data.BoxSides>(el: Element,
    output?: Output, { computedStyle, offsetHeight, offsetWidth }: StyleMetric.Options.PrefetchMetrics = {}): Output
   {
      computedStyle ??= getComputedStyle(el);

      // Early out if no border image source set.
      const src = computedStyle.borderImageSource;
      if (!src || src === 'none')
      {
         if (isObject(output))
         {
            output.top = output.right = output.bottom = output.left = 0;
            return output;
         }
         else
         {
            return { top: 0, right: 0, bottom: 0, left: 0 } as Output;
         }
      }

      const tokensWidth = this.expand4Length(computedStyle.borderImageWidth.trim().split(this.#regexWhiteSpace),
       { output: this.#arrayExpand4_1 });

      const tokensSlice = this.expand4Length(computedStyle.borderImageSlice.trim().split(this.#regexWhiteSpace),
       { output: this.#arrayExpand4_2 });

      // Merge image slice into width tokens if any width side is 'auto' or not a valid length.
      for (let i = 0; i < 4; i++)
      {
         if (tokensWidth[i] === 'auto' || !this.#regexValidLength.test(tokensWidth[i]))
         {
            tokensWidth[i] = tokensSlice[i];
         }
      }

      const refW: number = (Number.isFinite(offsetWidth) ? offsetWidth :
       (el as HTMLElement).offsetWidth ?? 0) as number;

      const refH: number = (Number.isFinite(offsetHeight) ? offsetHeight :
       (el as HTMLElement).offsetHeight ?? 0) as number;

      if (isObject(output))
      {
         try
         {
            output.top = this.#resolveBorderWidth(tokensWidth[0], parseFloat(computedStyle.borderTopWidth), refH);
            output.right = this.#resolveBorderWidth(tokensWidth[1], parseFloat(computedStyle.borderRightWidth), refW);
            output.bottom = this.#resolveBorderWidth(tokensWidth[2], parseFloat(computedStyle.borderBottomWidth), refH);
            output.left = this.#resolveBorderWidth(tokensWidth[3], parseFloat(computedStyle.borderLeftWidth), refW);
         }
         catch (err)
         {
            console.error(`[TRL] StyleMetric.getVisualEdgeInsets error: \n`, err);
            output.top = 0;
            output.right = 0;
            output.bottom = 0;
            output.left = 0;
         }
      }
      else
      {
         try
         {
            output = {
               top: this.#resolveBorderWidth(tokensWidth[0], parseFloat(computedStyle.borderTopWidth), refH),
               right: this.#resolveBorderWidth(tokensWidth[1], parseFloat(computedStyle.borderRightWidth), refW),
               bottom: this.#resolveBorderWidth(tokensWidth[2], parseFloat(computedStyle.borderBottomWidth), refH),
               left: this.#resolveBorderWidth(tokensWidth[3], parseFloat(computedStyle.borderLeftWidth), refW)
            } as Output;
         }
         catch (err)
         {
            console.error(`[TRL] StyleMetric.getVisualEdgeInsets error: \n`, err);

            output = {
               top: 0,
               right: 0,
               bottom: 0,
               left: 0
            } as Output;
         }
      }

      return output;
   }

   /**
    * Gets the global scrollbar width. The value is cached on subsequent invocations unless `cached` is set to `false`
    * in options.
    *
    * @param [options] - Options.
    *
    * @param [options.cached] - When false, the calculation is run again.
    *
    * @returns Default element scrollbar width.
    */
   static getScrollbarWidth({ cached = true }: { cached?: boolean } = {}): number
   {
      if (typeof cached !== 'boolean') { throw new TypeError(`'cached' is not a boolean.`); }

      // Return any cached value.
      if (cached && typeof this.#cachedScrollbarWidth === 'number') { return this.#cachedScrollbarWidth; }

      let scrollbarWidth: number | undefined;

      try
      {
         scrollbarWidth = window.innerWidth - document.documentElement.clientWidth || (() =>
            {
               const el = document.createElement('div');
               el.style.visibility = 'hidden';    // ensure no paint
               el.style.overflow = 'scroll';      // force scrollbars
               el.style.position = 'absolute';    // remove from flow
               el.style.top = '-9999px';          // off-screen
               el.style.width = '100px';
               el.style.height = '100px';

               document.body.appendChild(el);
               const width = el.offsetWidth - el.clientWidth;
               el.remove();

               return width;
            }
         )();
      }
      catch
      {
         // A general default for thin scrollbar widths.
         scrollbarWidth = 10;
      }

      if (typeof this.#cachedScrollbarWidth !== 'number') { this.#cachedScrollbarWidth = scrollbarWidth; }

      return scrollbarWidth;
   }

   // Internal Implementation ----------------------------------------------------------------------------------------

   /**
    * Resolves a single border image width or slice token into pixel units.
    *
    * Percentages are relative to the element's border box dimension.
    *
    * Unitless numbers multiply the border width, unless `borderWidth === 0`, in which case they are treated as
    * absolute pixels (merged slice fallback).
    *
    * Non-numeric or invalid tokens return the original border width.
    *
    * @param value - The token string (e.g., '10px', '50%', '2', 'auto').
    *
    * @param borderWidth - The physical border width in pixels.
    *
    * @param ref - The reference dimension (border box width or height).
    *
    * @returns The resolved border image width in pixels.
    */
   static #resolveBorderWidth(value: string, borderWidth: number, ref: number): number
   {
      // Percentage of border box dimension.
      if (value.endsWith('%')) { return (parseFloat(value) / 100) * ref; }

      // If this value originated from border-image-slice (IE merged fallback), treat as absolute pixels when
      // borderWidth is `0`.
      if (this.#regexNumber.test(value))
      {
         return borderWidth > 0 ? parseFloat(value) * borderWidth : parseFloat(value);
      }

      // Expected to be in px after `getComputedStyle`.
      const px = parseFloat(value);
      return Number.isFinite(px) ? px : borderWidth;
   }
}

declare namespace StyleMetric {
   /**
    * Namespace grouping data shape definitions for StyleMetric utilities.
    */
   export namespace Data {
      /**
       * Defines output data shape.
       */
      export interface BoxSides {
         /**
          * Element `top` constraint.
          */
         top: number;

         /**
          * Element `right` constraint.
          */
         right: number;

         /**
          * Element `bottom` constraint.
          */
         bottom: number;


         /**
          * Element `left` constraint.
          */
         left: number;
      }
   }

   /**
    * Namespace grouping method options for StyleMetric calculations.
    */
   export namespace Options {
      /**
       * Defines optional pre-fetched HTMLElement metric data used in calculations.
       */
      export interface PrefetchMetrics {
         /**
          * Computed styles for target element.
          */
         computedStyle?: CSSStyleDeclaration;

         /**
          * Offset height of target element.
          */
         offsetHeight?: number;

         /**
          * Offset width of target element.
          */
         offsetWidth?: number;
      }
   }
}

export { StyleMetric };
