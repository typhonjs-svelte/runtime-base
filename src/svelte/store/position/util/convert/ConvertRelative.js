import * as constants from '../../constants.js';

export class ConvertRelative
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
    * Stores the results for match groups from `constants.regexRelative`;
    *
    * @type {import('./types').RelativeMatch}
    */
   static #relativeMatch = Object.seal({
      operation: void 0,
      value: void 0,
      unit: void 0
   });

   /**
    * Converts any relative string values for animatable keys to actual updates performed against current data.
    *
    * @param {Partial<import('../data/types').Data.TJSPositionDataRelative>}  data - position data.
    *
    * @param {import('../data/types').Data.TJSPositionData}   position - The source position data.
    *
    * @param {HTMLElement} el - Target positioned element.
    */
   static process(data, position, el)
   {
      for (const key in data)
      {
         // Key is animatable / numeric.
         if (constants.animateKeys.has(key))
         {
            const value = data[key];

            if (typeof value !== 'string') { continue; }

            // Ignore 'auto' and 'inherit' string values.
            if (value === 'auto' || value === 'inherit') { continue; }

            /** @type {import('../animation/types').AnimationAPI.AnimationKeys} */
            const animKey = key;

            const regexResults = constants.regexRelative.exec(value);

            // Additional state indicating a particular key is not handled.
            let notHandledWarning = false;

            if (regexResults)
            {
               const results = this.#relativeMatch;

               results.operation = regexResults.groups.operation;
               results.value = parseFloat(regexResults.groups.value);
               results.unit = regexResults.groups.unit;

               const current = position[key];
               switch (results.unit)
               {
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
                `TJSPosition - ConvertRelative warning: malformed key '${key}' with value '${value}'.`);
               data[key] = void 0;
            }
         }

         return data;
      }
   }

   /**
    * @param {import('../animation/types').AnimationAPI.AnimationKeys} key - Animation key.
    *
    * @param {number}   current - Current value
    *
    * @param {Partial<import('../data/types').Data.TJSPositionDataRelative>}  data - Source data to convert.
    *
    * @param {import('../data/types').Data.TJSPositionData} position - Current position data.
    *
    * @param {HTMLElement} el - Positioned element.
    *
    * @param {import('./types').RelativeMatch}  results - Relative match results.
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
    * @param {Partial<import('../data/types').Data.TJSPositionDataRelative>}  data - Source data to convert.
    *
    * @param {import('../data/types').Data.TJSPositionData} position - Current position data.
    *
    * @param {HTMLElement} el - Positioned element.
    *
    * @param {import('./types').RelativeMatch}  results - Relative match results.
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
