import { radToDeg }              from '#runtime/math/util';

import { TJSPositionDataUtil }   from '../TJSPositionDataUtil';

import type { TJSPositionNS }    from '../../types';

import type { StringMatch }      from './types-local';

/**
 * Converts {@link TJSPositionData} properties defined as strings to number values. The string values can be defined
 * as relative adjustments with a leading operator. Various unit formats are supported as well.
 */
export class ConvertStringData
{
   /**
    * Animation keys for different processing categories.
    */
   static #animKeyTypes: {
      numPx: ReadonlySet<string>,
      percentParent: ReadonlySet<string>,
      rotationRadTurn: ReadonlySet<string>
   } = {
      // Animation keys that can be specified in `px` converted to a number.
      numPx: Object.freeze(new Set(['left', 'top', 'maxWidth', 'maxHeight', 'minWidth', 'minHeight', 'width', 'height',
       'translateX', 'translateY', 'translateZ'])),

      // Animation keys that can be specified in percentage of parent element constraint.
      percentParent: Object.freeze(new Set(['left', 'top', 'maxWidth', 'maxHeight', 'minWidth', 'minHeight', 'width',
       'height'])),

      // Only rotation animation keys can be specified in `rad` / `turn` converted to a number.
      rotationRadTurn: Object.freeze(new Set(['rotateX', 'rotateY', 'rotateZ', 'rotation']))
   };

   /**
    * Parses string data values. Relative values must start with leading values '+=', '-=', or '*=' followed by a
    * float / numeric value. IE `+=45` or for percentage '+=10%'. Also handles exact percent value such as `10` or
    * `10%`. Percentage values are based on the current value, parent element constraints, or constraints of the type
    * of value like rotation being bound by 360 degrees.
    *
    * @privateRemarks
    * TODO: In the future support more specific CSS unit types.
    */
   static #regexStringData: RegExp = /^(?<operation>[-+*]=)?(?<value>-?\d*\.?\d+)(?<unit>%|%~|px|rad|turn)?$/;

   /**
    * Stores the results for match groups from `regexStringData`;
    */
   static #matchResults: StringMatch = Object.seal({
      operation: void 0,
      value: 0,
      unit: void 0
   });

   /**
    * Converts any relative string values for animatable keys to actual updates performed against current data.
    *
    * @param data - position data.
    *
    * @param position - The source position data.
    *
    * @param el - Target positioned element.
    *
    * @returns Converted data.
    */
   static process(data: TJSPositionNS.Data.TJSPositionDataRelative,
    position: Partial<TJSPositionNS.Data.TJSPositionData>, el: Element): TJSPositionNS.Data.TJSPositionData
   {
      // Used in `%` calculations. The first `%` conversion that requires parent element height and width will attempt
      // to cache the parent element client height & width of the given element.
      let parentClientHeight: number = Number.NaN;
      let parentClientWidth: number = Number.NaN;

      for (const key in data)
      {
         // Key is animatable / numeric.
         if (TJSPositionDataUtil.isAnimationKey(key))
         {
            const value: string | number | null | undefined = data[key];

            if (typeof value !== 'string') { continue; }

            // Ignore 'auto' and 'inherit' string values.
            if (value === 'auto' || value === 'inherit') { continue; }

            const animKey: TJSPositionNS.API.Animation.AnimationKey = key;

            const regexResults: RegExpExecArray | null = this.#regexStringData.exec(value);

            // Additional state indicating a particular key is handled.
            let handled: boolean = false;

            if (regexResults && regexResults.groups)
            {
               const results: StringMatch = this.#matchResults;

               results.operation = regexResults.groups.operation;
               results.value = parseFloat(regexResults.groups.value);
               results.unit = regexResults.groups.unit;

               // Retrieve current value, but if null use the numeric default.
               const current: number = TJSPositionDataUtil.getDataOrDefault(position, key, true);

               switch (results.unit)
               {
                  // Animation keys that support percentage changes including constraints against the parent element.
                  case '%':
                  {
                     // Cache parent client width / height on first parent percent based key.
                     if (this.#animKeyTypes.percentParent.has(key) && (Number.isNaN(parentClientHeight) ||
                      Number.isNaN(parentClientWidth)))
                     {
                        if (el?.parentElement?.isConnected)
                        {
                           parentClientHeight = el.parentElement.clientHeight;
                           parentClientWidth = el.parentElement.clientWidth;
                        }
                        else
                        {
                           parentClientHeight = 0;
                           parentClientWidth = 0;

                           console.warn(
                            `TJSPosition - ConvertStringData warning: could not determine parent constraints for key '${
                             key}' with value '${value}'.`);
                           data[key] = void 0;
                           continue;
                        }
                     }

                     handled = this.#handlePercent(animKey, current, data, position, el, results,
                      parentClientHeight, parentClientWidth);

                     break;
                  }

                  // Animation keys that support percentage changes from current values.
                  case '%~':
                     handled = this.#handleRelativePercent(animKey, current, data, position, el, results);
                     break;

                  // Animation keys that support `px` / treat as raw number.
                  case 'px':
                     handled = this.#animKeyTypes.numPx.has(key) ?
                      this.#applyResultsValue(animKey, current, data, results) : false;
                     break;

                  // Only rotation animation keys support `rad` / `turn`.
                  case 'rad':
                  case 'turn':
                     handled = this.#animKeyTypes.rotationRadTurn.has(key) ?
                      this.#handleRotationRadTurn(animKey, current, data, position, el, results) : false;
                     break;

                  // No units / treat as raw number.
                  default:
                     handled = this.#applyResultsValue(animKey, current, data, results);
                     break;
               }
            }

            if (!regexResults || !handled)
            {
               console.warn(
                `TJSPosition - ConvertStringData warning: malformed key '${key}' with value '${value}'.`);
               data[key] = void 0;
            }
         }
      }

      return data as TJSPositionNS.Data.TJSPositionData;
   }

   // Internal implementation ----------------------------------------------------------------------------------------

   /**
    * Provides the common update to source data after `results.value` has been converted to the proper value
    * respectively.
    *
    * @param key - Animation key.
    *
    * @param current - Current value
    *
    * @param data - Source data to convert.
    *
    * @param results - Match results.
    *
    * @returns Adjustment successful.
    */
   static #applyResultsValue(key: TJSPositionNS.API.Animation.AnimationKey, current: number,
    data: TJSPositionNS.Data.TJSPositionDataRelative, results: StringMatch): boolean
   {
      if (!results.operation)
      {
         data[key] = results.value;
         return true;
      }

      switch (results.operation)
      {
         case '-=':
            data[key] = current - results.value;
            break;

         case '+=':
            data[key] = current + results.value;
            break;

         case '*=':
            data[key] = current * results.value;
            break;

         default:
            return false;
      }

      return true;
   }

   /**
    * Handles the `%` unit type where values are adjusted against the parent element client width / height or in the
    * case of rotation the percentage of 360 degrees.
    *
    * @param key - Animation key.
    *
    * @param current - Current value
    *
    * @param data - Source data to convert.
    *
    * @param position - Current position data.
    *
    * @param el - Positioned element.
    *
    * @param results - Match results.
    *
    * @param parentClientHeight - Parent element client height.
    *
    * @param parentClientWidth - Parent element client width.
    *
    * @returns Adjustment successful.
    */
   static #handlePercent(key: TJSPositionNS.API.Animation.AnimationKey, current: number,
    data: TJSPositionNS.Data.TJSPositionDataRelative, position: Partial<TJSPositionNS.Data.TJSPositionData>,
     el: Element, results: StringMatch, parentClientHeight: number, parentClientWidth: number): boolean
   {
      switch (key)
      {
         // Calculate value; take into account keys that calculate parent client width.
         case 'left':
         case 'maxWidth':
         case 'minWidth':
         case 'width':
         case 'translateX':
            results.value = parentClientWidth * (results.value / 100);
            break;

         // Calculate value; take into account keys that calculate parent client height.
         case 'top':
         case 'maxHeight':
         case 'minHeight':
         case 'height':
         case 'translateY':
            results.value = parentClientHeight * (results.value / 100);
            break;

         // Calculate value; convert percentage into degrees
         case 'rotateX':
         case 'rotateY':
         case 'rotateZ':
         case 'rotation':
            results.value = 360 * (results.value / 100);
            break;

         default:
            return false;
      }

      return this.#applyResultsValue(key, current, data, results);
   }

   /**
    * Handles the `%~` unit type where values are adjusted against the current value for the given key.
    *
    * @param key - Animation key.
    *
    * @param current - Current value
    *
    * @param data - Source data to convert.
    *
    * @param position - Current position data.
    *
    * @param el - Positioned element.
    *
    * @param results - Match results.
    *
    * @returns Adjustment successful.
    */
   static #handleRelativePercent(key: TJSPositionNS.API.Animation.AnimationKey, current: number,
    data: TJSPositionNS.Data.TJSPositionDataRelative, position: Partial<TJSPositionNS.Data.TJSPositionData>,
     el: Element, results: StringMatch): boolean
   {
      // Normalize percentage.
      results.value = results.value / 100;

      if (!results.operation)
      {
         data[key] = current * results.value;
         return true;
      }

      switch (results.operation)
      {
         case '-=':
            data[key] = current - (current * results.value);
            break;

         case '+=':
            data[key] = current + (current * results.value);
            break;

         case '*=':
            data[key] = current * (current * results.value);
            break;

         default:
            return false;
      }

      return true;
   }

   /**
    * Handles the `rad` / `turn` unit types for rotation animation keys.
    *
    * @param key - Animation key.
    *
    * @param current - Current value
    *
    * @param data - Source data to convert.
    *
    * @param position - Current position data.
    *
    * @param el - Positioned element.
    *
    * @param results - Match results.
    *
    * @returns Adjustment successful.
    */
   static #handleRotationRadTurn(key: TJSPositionNS.API.Animation.AnimationKey, current: number,
    data: TJSPositionNS.Data.TJSPositionDataRelative, position: Partial<TJSPositionNS.Data.TJSPositionData>,
     el: Element, results: StringMatch): boolean
   {
      // Convert radians / turn into degrees.
      switch (results.unit)
      {
         case 'rad':
            results.value = radToDeg(results.value);
            break;

         case 'turn':
            results.value = 360 * results.value;
            break;
      }

      return this.#applyResultsValue(key, current, data, results);
   }
}
