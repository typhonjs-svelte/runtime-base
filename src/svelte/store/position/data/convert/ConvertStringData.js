import { TJSPositionDataUtil }   from '../TJSPositionDataUtil.js';

import { radToDeg }              from '#runtime/math/util';

/**
 * Converts {@link TJSPositionData} properties defined as strings to number values. The string values can be defined
 * as relative adjustments with a leading operator. Various unit formats are supported as well.
 */
export class ConvertStringData
{
   /**
    * Animation keys for different processing categories.
    *
    * @type {{numPx: Readonly<Set<string>>, percentParent: Readonly<Set<string>>}}
    */
   static #animKeyTypes = {
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
    * @type {RegExp}
    *
    * @privateRemarks
    * TODO: In the future support more specific CSS unit types.
    */
   static #regexStringData = /^(?<operation>[-+*]=)?(?<value>-?\d*\.?\d+)(?<unit>%|%~|px|rad|turn)?$/;

   /**
    * Stores the results for match groups from `regexStringData`;
    *
    * @type {import('./types-local').StringMatch}
    */
   static #matchResults = Object.seal({
      operation: void 0,
      value: void 0,
      unit: void 0
   });

   /**
    * Converts any relative string values for animatable keys to actual updates performed against current data.
    *
    * @param {import('../data/types').Data.TJSPositionDataRelative}  data - position data.
    *
    * @param {import('../data/types').Data.TJSPositionData}   position - The source position data.
    *
    * @param {HTMLElement} el - Target positioned element.
    *
    * @returns {import('../data/types').Data.TJSPositionDataRelative} Converted data.
    */
   static process(data, position, el)
   {
      /** @type {number} */
      let parentClientHeight = void 0, parentClientWidth = void 0;

      for (const key in data)
      {
         // Key is animatable / numeric.
         if (TJSPositionDataUtil.isAnimationKey(key))
         {
            const value = data[key];

            if (typeof value !== 'string') { continue; }

            // Ignore 'auto' and 'inherit' string values.
            if (value === 'auto' || value === 'inherit') { continue; }

            /** @type {import('../animation/types').AnimationAPI.AnimationKey} */
            const animKey = key;

            const regexResults = this.#regexStringData.exec(value);

            // Additional state indicating a particular key is handled.
            let handled = false;

            if (regexResults)
            {
               const results = this.#matchResults;

               results.operation = regexResults.groups.operation;
               results.value = parseFloat(regexResults.groups.value);
               results.unit = regexResults.groups.unit;

               // Retrieve current value, but if null use the numeric default.
               const current = TJSPositionDataUtil.getDataOrDefault(position, key, true);

               switch (results.unit)
               {
                  // Animation keys that support percentage changes including constraints against the parent element.
                  case '%':
                  {
                     // Cache parent client width / height on first parent percent based key.
                     if (this.#animKeyTypes.percentParent.has(key))
                     {
                        if (!Number.isFinite(parentClientHeight) && el?.parentElement?.isConnected)
                        {
                           parentClientHeight = el.parentElement.clientHeight;
                           parentClientWidth = el.parentElement.clientWidth;
                        }

                        if (parentClientHeight === void 0 || parentClientWidth === void 0)
                        {
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

      return data;
   }

   // Internal implementation ----------------------------------------------------------------------------------------

   /**
    * Provides the common update to source data after `results.value` has been converted to the proper value
    * respectively.
    *
    * @param {import('../animation/types').AnimationAPI.AnimationKey} key - Animation key.
    *
    * @param {number}   current - Current value
    *
    * @param {import('../data/types').Data.TJSPositionDataRelative}  data - Source data to convert.
    *
    * @param {import('./types-local').StringMatch}  results - Match results.
    *
    * @returns {boolean} Adjustment successful.
    */
   static #applyResultsValue(key, current, data, results)
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
    * @param {import('../animation/types').AnimationAPI.AnimationKey} key - Animation key.
    *
    * @param {number}   current - Current value
    *
    * @param {import('../data/types').Data.TJSPositionDataRelative}  data - Source data to convert.
    *
    * @param {import('../data/types').Data.TJSPositionData} position - Current position data.
    *
    * @param {HTMLElement} el - Positioned element.
    *
    * @param {import('./types-local').StringMatch}  results - Match results.
    *
    * @param {number}  parentClientHeight - Parent element client height.
    *
    * @param {number}  parentClientWidth - Parent element client width.
    *
    * @returns {boolean} Adjustment successful.
    */
   static #handlePercent(key, current, data, position, el, results, parentClientHeight, parentClientWidth)
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
    * @param {import('../animation/types').AnimationAPI.AnimationKey} key - Animation key.
    *
    * @param {number}   current - Current value
    *
    * @param {import('../data/types').Data.TJSPositionDataRelative}  data - Source data to convert.
    *
    * @param {import('../data/types').Data.TJSPositionData} position - Current position data.
    *
    * @param {HTMLElement} el - Positioned element.
    *
    * @param {import('./types-local').StringMatch}  results - Match results.
    *
    * @returns {boolean} Adjustment successful.
    */
   static #handleRelativePercent(key, current, data, position, el, results)
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
    * @param {import('../animation/types').AnimationAPI.AnimationKey} key - Animation key.
    *
    * @param {number}   current - Current value
    *
    * @param {import('../data/types').Data.TJSPositionDataRelative}  data - Source data to convert.
    *
    * @param {import('../data/types').Data.TJSPositionData} position - Current position data.
    *
    * @param {HTMLElement} el - Positioned element.
    *
    * @param {import('./types-local').StringMatch}  results - Match results.
    *
    * @returns {boolean} Adjustment successful.
    */
   static #handleRotationRadTurn(key, current, data, position, el, results)
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
