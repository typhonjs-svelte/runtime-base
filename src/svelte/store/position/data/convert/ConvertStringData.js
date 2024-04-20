import { TJSPositionDataUtil }   from '../TJSPositionDataUtil.js';

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
       'height']))
   };

   /**
    * Parses string data values. Relative values must start with leading values '+=', '-=', or '*=' followed by a
    * float / numeric value. IE `+=45` or for percentage '+=10%'. Also handles exact percent value such as `10` or
    * `10%`. Percentage values are based on the current value, parent element constraints, or constraints of the type
    * of value like rotation being bound by 360 degrees.
    *
    * TODO: In the future support more specific CSS unit types.
    *
    * @type {RegExp}
    */
   static #regexStringData = /^(?<operation>[-+*]=)?(?<value>-?\d*\.?\d+)(?<unit>%|%~|px)?$/;

   /**
    * Stores the results for match groups from `regexStringData`;
    *
    * @type {import('./types').StringMatch}
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
    */
   static process(data, position, el)
   {
      /** @type {number} */
      let parentClientHeight = void 0, parentClientWidth = void 0;

      for (const key in data)
      {
         // Key is animatable / numeric.
         if (TJSPositionDataUtil.isAnimKey(key))
         {
            const value = data[key];

            if (typeof value !== 'string') { continue; }

            // Ignore 'auto' and 'inherit' string values.
            if (value === 'auto' || value === 'inherit') { continue; }

            /** @type {import('../animation/types').AnimationAPI.AnimationKeys} */
            const animKey = key;

            const regexResults = this.#regexStringData.exec(value);

            // Additional state indicating a particular key is not handled.
            let notHandledWarning = false;

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

                     notHandledWarning = this.#handlePercent(animKey, current, data, position, el, results,
                      parentClientHeight, parentClientWidth);

                     break;
                  }

                  // Animation keys that support percentage changes from current values.
                  case '%~':
                     notHandledWarning = this.#handleRelativePercent(animKey, current, data, position, el, results);
                     break;

                  // Animation keys that support `px` / treat as raw number.
                  case 'px':
                     notHandledWarning = this.#animKeyTypes.numPx.has(key) ?
                      this.#handleRelativeNum(animKey, current, data, position, el, results) : true;
                     break;

                  // No units / treat as raw number.
                  default:
                     notHandledWarning = this.#handleRelativeNum(animKey, current, data, position, el, results);
                     break;
               }

               continue;
            }

            if (!regexResults || notHandledWarning)
            {
               console.warn(
                `TJSPosition - ConvertStringData warning: malformed key '${key}' with value '${value}'.`);
               data[key] = void 0;
            }
         }

         return data;
      }
   }

   /**
    * Handles the `%` unit type where values are adjusted against the parent element client width / height or in the
    * case of rotation the percentage of 360 degrees.
    *
    * @param {import('../animation/types').AnimationAPI.AnimationKeys} key - Animation key.
    *
    * @param {number}   current - Current value
    *
    * @param {import('../data/types').Data.TJSPositionDataRelative}  data - Source data to convert.
    *
    * @param {import('../data/types').Data.TJSPositionData} position - Current position data.
    *
    * @param {HTMLElement} el - Positioned element.
    *
    * @param {import('./types').StringMatch}  results - Match results.
    *
    * @param {number}  parentClientHeight - Parent element client height.
    *
    * @param {number}  parentClientWidth - Parent element client width.
    *
    * @returns {boolean} Adjustment successful.
    */
   static #handlePercent(key, current, data, position, el, results, parentClientHeight, parentClientWidth)
   {
      /** @type {number} */
      let value = void 0;

      switch (key)
      {
         // Calculate value; take into account keys that calculate parent client width.
         case 'left':
         case 'maxWidth':
         case 'minWidth':
         case 'width':
         case 'translateX':
            value = parentClientWidth * (results.value / 100);
            break;

         // Calculate value; take into account keys that calculate parent client height.
         case 'top':
         case 'maxHeight':
         case 'minHeight':
         case 'height':
         case 'translateY':
            value = parentClientHeight * (results.value / 100);
            break;

         // Calculate value; convert percentage into degrees
         case 'rotateX':
         case 'rotateY':
         case 'rotateZ':
         case 'rotation':
            value = 360 * (results.value / 100);
            break;

         default:
            return false;
      }

      if (!results.operation)
      {
         data[key] = value;
         return true;
      }

      switch (results.operation)
      {
         case '-=':
            data[key] = current - value;
            break;

         case '+=':
            data[key] = current + value;
            break;

         case '*=':
            data[key] = current * value;
            break;

         default:
            return false;
      }

      return true;
   }

   /**
    * @param {import('../animation/types').AnimationAPI.AnimationKeys} key - Animation key.
    *
    * @param {number}   current - Current value
    *
    * @param {import('../data/types').Data.TJSPositionDataRelative}  data - Source data to convert.
    *
    * @param {import('../data/types').Data.TJSPositionData} position - Current position data.
    *
    * @param {HTMLElement} el - Positioned element.
    *
    * @param {import('./types').StringMatch}  results - Match results.
    *
    * @returns {boolean} Adjustment successful.
    */
   static #handleRelativeNum(key, current, data, position, el, results)
   {
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
    * Handles the `%~` unit type where values are adjusted against the current value for the given key.
    *
    * @param {import('../animation/types').AnimationAPI.AnimationKeys} key - Animation key.
    *
    * @param {number}   current - Current value
    *
    * @param {import('../data/types').Data.TJSPositionDataRelative}  data - Source data to convert.
    *
    * @param {import('../data/types').Data.TJSPositionData} position - Current position data.
    *
    * @param {HTMLElement} el - Positioned element.
    *
    * @param {import('./types').StringMatch}  results - Match results.
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
}
