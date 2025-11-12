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
   static #arrayExpand4_1 = new Array(4);
   static #arrayExpand4_2 = new Array(4);

   static #regexNumber = /^[\d.]+$/;
   static #regexWhiteSpace = /\s+/;
   static #regexValidLength = /^[\d.]+(px|%)?$/;

   private constructor()
   {
      throw new Error('StyleMetric constructor: This is a static class and should not be constructed.');
   }

   /**
    * Computes the effective *painted border widths* for an element when `border-image` is in use.
    *
    * This resolves all four sides (top, right, bottom, left) into pixel values accounting for:
    * ```
    * - `border-image-width` values (absolute, percentage, or unitless),
    * - `auto` fallbacks to `border-image-slice`,
    * - and `border-image-source: none` (returns all zeros).
    * ```
    *
    * @param el - HTMLElement to compute painted border widths for.
    *
    * @param [output] - Existing `BoxSides` output data object.
    *
    * @param [options] Optional pre-fetched element data for performance reuse.
    *
    * @param [options.computedStyle] Pre-fetched computed style of element.
    *
    * @param [options.offsetHeight] Pre-fetched `offsetHeight` of element.
    *
    * @param [options.offsetWidth] Pre-fetched `offsetWidth` of element.
    *
    * @returns Painted border width constraints in pixel units.
    */
   static getPaintedBorderWidth<Output extends StyleMetric.Data.BoxSides = StyleMetric.Data.BoxSides>(el: HTMLElement,
    output?: Output, { computedStyle, offsetHeight, offsetWidth }: StyleMetric.Options.PrefetchMetrics = {}): Output
   {
      if (!computedStyle) { computedStyle = getComputedStyle(el); }

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

      const tokensWidth = this.#expand4(computedStyle.borderImageWidth.trim().split(this.#regexWhiteSpace),
       this.#arrayExpand4_1);

      const tokensSlice = this.#expand4(computedStyle.borderImageSlice.trim().split(this.#regexWhiteSpace),
       this.#arrayExpand4_2);

      // Merge image slice into width tokens if any width side is 'auto' or not a valid length.
      for (let i = 0; i < 4; i++)
      {
         if (tokensWidth[i] === 'auto' || !this.#regexValidLength.test(tokensWidth[i]))
         {
            tokensWidth[i] = tokensSlice[i];
         }
      }

      const refW: number = (Number.isFinite(offsetWidth) ? offsetWidth : el.offsetWidth) as number;
      const refH: number = (Number.isFinite(offsetHeight) ? offsetHeight : el.offsetHeight) as number;

      if (isObject(output))
      {
         output.top = this.#resolveBorderWidth(tokensWidth[0], parseFloat(computedStyle.borderTopWidth), refH);
         output.right = this.#resolveBorderWidth(tokensWidth[1], parseFloat(computedStyle.borderRightWidth), refW);
         output.bottom = this.#resolveBorderWidth(tokensWidth[2], parseFloat(computedStyle.borderBottomWidth), refH);
         output.left = this.#resolveBorderWidth(tokensWidth[3], parseFloat(computedStyle.borderLeftWidth), refW);
      }
      else
      {
         output = {
            top: this.#resolveBorderWidth(tokensWidth[0], parseFloat(computedStyle.borderTopWidth), refH),
            right: this.#resolveBorderWidth(tokensWidth[1], parseFloat(computedStyle.borderRightWidth), refW),
            bottom: this.#resolveBorderWidth(tokensWidth[2], parseFloat(computedStyle.borderBottomWidth), refH),
            left: this.#resolveBorderWidth(tokensWidth[3], parseFloat(computedStyle.borderLeftWidth), refW)
         } as Output;
      }

      return output;
   }

   // Internal Implementation ----------------------------------------------------------------------------------------


   /**
    * Expands a CSS 1–4 token list into four sides following the standard CSS shorthand expansion rules.
    *
    * @param tokens - Array of raw token strings from a CSS property.
    *
    * @param [output] - Optional preallocated 4-element output array.
    *
    * @returns Expanded array of 4 strings: [top, right, bottom, left].
    */
   static #expand4(tokens: string[], output: string[] = new Array(4)): string[]
   {
      switch (tokens.length)
      {
         case 1:
            output[0] = tokens[0];
            output[1] = tokens[0];
            output[2] = tokens[0];
            output[3] = tokens[0];
            break;

         case 2:
            output[0] = tokens[0];
            output[1] = tokens[1];
            output[2] = tokens[0];
            output[3] = tokens[1];
            break;

         case 3:
            output[0] = tokens[0];
            output[1] = tokens[1];
            output[2] = tokens[2];
            output[3] = tokens[1];
            break;

         case 4:
            output[0] = tokens[0];
            output[1] = tokens[1];
            output[2] = tokens[2];
            output[3] = tokens[4];
            break;
      }

      return output;
   }

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
