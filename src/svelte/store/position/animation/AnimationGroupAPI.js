import {
   isIterable,
   isObject }                    from '#runtime/util/object';

import { AnimationManager }      from './AnimationManager.js';
import { AnimationAPI }          from './AnimationAPI.js';
import { AnimationGroupControl } from './AnimationGroupControl.js';
import { AnimationScheduler }    from './AnimationScheduler.js';

import { TJSPositionDataUtil }   from '../data/index.js';

/**
 * Provides a public API for grouping multiple {@link TJSPosition} animations together with the
 * AnimationManager.
 *
 * Note: To remove cyclic dependencies as this class provides the TJSPosition static / group Animation API `instanceof`
 * checks are not done against TJSPosition. Instead, a check for the animate property being an instanceof
 * {@link AnimationAPI} is performed in {@link AnimationGroupAPI.#getPosition}.
 *
 * @see AnimationAPI
 *
 * @implements {import('./types').AnimationGroupAPI}
 */
class AnimationGroupAPI
{
   /**
    * Returns the TJSPosition instance for the possible given positionable by checking the instance by checking for
    * AnimationAPI.
    *
    * @param {import('../').TJSPosition | import('../types').TJSPositionTypes.Positionable} positionable - Possible
    *        position group entry.
    *
    * @returns {import('../').TJSPosition | null} Returns actual TJSPosition instance.
    */
   static #getPosition(positionable)
   {
      if (!isObject(positionable)) { return null; }

      if (positionable.animate instanceof AnimationAPI) { return positionable; }

      if (positionable.position?.animate instanceof AnimationAPI) { return positionable.position; }

      return null;
   }

   /**
    * Cancels any animation for given PositionGroup data.
    *
    * @param {import('../types').TJSPositionTypes.PositionGroup} positionGroup - The position group to cancel.
    */
   static cancel(positionGroup)
   {
      if (isIterable(positionGroup))
      {
         let index = -1;

         for (const entry of positionGroup)
         {
            index++;

            const actualPosition = this.#getPosition(entry);

            if (!actualPosition)
            {
               console.warn(`AnimationGroupAPI.cancel warning: No TJSPosition instance found at index: ${index}.`);
               continue;
            }

            AnimationManager.cancel(actualPosition);
         }
      }
      else
      {
         const actualPosition = this.#getPosition(positionGroup);

         if (!actualPosition)
         {
            console.warn(`AnimationGroupAPI.cancel warning: No TJSPosition instance found.`);
            return;
         }

         AnimationManager.cancel(actualPosition);
      }
   }

   /**
    * Cancels all TJSPosition animation.
    */
   static cancelAll() { AnimationManager.cancelAll(); }

   /**
    * Gets all animation controls for the given position group data.
    *
    * @param {import('../types').TJSPositionTypes.PositionGroup} positionGroup - A position group.
    *
    * @returns {{
    *    position: import('../').TJSPosition,
    *    entry: import('../types').TJSPositionTypes.Positionable | undefined,
    *    controls: import('#runtime/util/animate').BasicAnimation[]
    * }[]} Results array.
    */
   static getScheduled(positionGroup)
   {
      const results = [];

      if (isIterable(positionGroup))
      {
         let index = -1;

         for (const entry of positionGroup)
         {
            index++;

            const actualPosition = this.#getPosition(entry);

            if (!actualPosition)
            {
               console.warn(`AnimationGroupAPI.getScheduled warning: No TJSPosition instance found at index: ${
                index}.`);

               continue;
            }

            const controls = AnimationManager.getScheduled(actualPosition);

            results.push({ position: actualPosition, entry: actualPosition !== entry ? entry : void 0, controls });
         }
      }
      else
      {
         const actualPosition = this.#getPosition(positionGroup);

         if (!actualPosition)
         {
            console.warn(`AnimationGroupAPI.getScheduled warning: No TJSPosition instance found.`);
            return results;
         }

         const controls = AnimationManager.getScheduled(actualPosition);

         results.push({
            position: actualPosition,
            entry: actualPosition !== positionGroup ? positionGroup : void 0,
            controls
         });
      }

      return results;
   }

   /**
    * Provides a type guard to test in the given key is an {@link AnimationAPI.AnimationKey}.
    *
    * @param {unknown}  key - A key value to test.
    *
    * @returns {key is import('./types').AnimationAPI.AnimationKey} Whether the given key is an animation key.
    */
   static isAnimationKey(key)
   {
      return TJSPositionDataUtil.isAnimationKey(key);
   }

   /**
    * Returns the status _for the entire position group_ specified if all position instances of the group are scheduled.
    *
    * @param {import('../types').TJSPositionTypes.PositionGroup} positionGroup - A position group.
    *
    * @param {import('./types').AnimationAPI.ScheduleOptions} [options] - Options.
    *
    * @returns {boolean} True if all are scheduled / false if just one position instance in the group is not scheduled.
    */
   static isScheduled(positionGroup, options)
   {
      if (isIterable(positionGroup))
      {
         let index = -1;

         for (const entry of positionGroup)
         {
            index++;

            const actualPosition = this.#getPosition(entry);

            if (!actualPosition)
            {
               console.warn(`AnimationGroupAPI.isScheduled warning: No TJSPosition instance found at index: ${index}.`);

               continue;
            }

            if (!AnimationManager.isScheduled(actualPosition, options)) { return false; }
         }
      }
      else
      {
         const actualPosition = this.#getPosition(positionGroup);

         if (!actualPosition)
         {
            console.warn(`AnimationGroupAPI.isScheduled warning: No TJSPosition instance found.`);
            return false;
         }

         if (!AnimationManager.isScheduled(actualPosition, options)) { return false; }
      }

      return true;
   }

   /**
    * Provides the `from` animation tween for one or more positionable instances as a group.
    *
    * @param {import('../types').TJSPositionTypes.PositionGroup} positionGroup - A position group.
    *
    * @param {(
    *    import('../data/types').Data.TJSPositionDataRelative |
    *    import('./types').AnimationAPI.GroupDataCallback
    * )} fromData - A position data object assigned to all positionable instances or a callback function invoked for
    *        unique data for each instance.
    *
    * @param {(
    *    import('./types').AnimationAPI.TweenOptions |
    *    import('./types').AnimationAPI.GroupTweenOptionsCallback
    * )} [options] - Tween options assigned to all positionable instances or a callback function invoked for unique
    *        options for each instance.
    *
    * @returns {import('#runtime/util/animate').BasicAnimation} Basic animation control.
    */
   static from(positionGroup, fromData, options)
   {
      if (!isObject(fromData) && typeof fromData !== 'function')
      {
         throw new TypeError(`AnimationGroupAPI.from error: 'fromData' is not an object or function.`);
      }

      if (options !== void 0 && !isObject(options) && typeof options !== 'function')
      {
         throw new TypeError(`AnimationGroupAPI.from error: 'options' is not an object or function.`);
      }

      /** @type {Set<import('./AnimationControl').AnimationControl>} */
      const animationControls = new Set();

      /** @type {import('./types-local').AnimationCleanupFunction} */
      const cleanupFn = (data) => animationControls.delete(data.control);

      let index = -1;

      /** @type {import('./types').AnimationAPI.GroupCallbackOptions} */
      let callbackOptions;

      const hasDataCallback = typeof fromData === 'function';
      const hasOptionCallback = typeof options === 'function';
      const hasCallback = hasDataCallback || hasOptionCallback;

      if (hasCallback) { callbackOptions = { index, position: void 0, entry: void 0 }; }

      let actualFromData = fromData;
      let actualOptions = options;

      if (isIterable(positionGroup))
      {
         for (const entry of positionGroup)
         {
            index++;

            const actualPosition = this.#getPosition(entry);

            if (!actualPosition)
            {
               console.warn(`AnimationGroupAPI.from warning: No TJSPosition instance found at index: ${index}.`);
               continue;
            }

            if (hasCallback)
            {
               callbackOptions.index = index;
               callbackOptions.position = actualPosition;
               callbackOptions.entry = actualPosition !== entry ? entry : void 0;
            }

            if (hasDataCallback)
            {
               actualFromData = fromData(callbackOptions);

               // Returned data from callback is null / undefined, so skip this position instance.
               if (actualFromData === null || actualFromData === void 0) { continue; }

               if (!isObject(actualFromData))
               {
                  throw new TypeError(`AnimationGroupAPI.from error: 'fromData' callback function iteration(${
                   index}) failed to return an object.`);
               }
            }

            if (hasOptionCallback)
            {
               actualOptions = options(callbackOptions);

               // Returned data from callback is null / undefined, so skip this position instance.
               if (actualOptions === null || actualOptions === void 0) { continue; }

               if (!isObject(actualOptions))
               {
                  throw new TypeError(`AnimationGroupAPI.from error: 'options' callback function iteration(${
                   index}) failed to return an object.`);
               }
            }

            const animationControl = AnimationScheduler.from(actualPosition, actualFromData, actualOptions, cleanupFn);
            if (animationControl) { animationControls.add(animationControl); }
         }
      }
      else
      {
         const actualPosition = this.#getPosition(positionGroup);

         if (!actualPosition)
         {
            console.warn(`AnimationGroupAPI.from warning: No TJSPosition instance found.`);
            return AnimationGroupControl.voidControl;
         }

         if (hasCallback)
         {
            callbackOptions.index = 0;
            callbackOptions.position = actualPosition;
            callbackOptions.entry = actualPosition !== positionGroup ? positionGroup : void 0;
         }

         if (hasDataCallback)
         {
            actualFromData = fromData(callbackOptions);

            // Returned data from callback is null / undefined, so skip this position instance.
            if (actualFromData === null || actualFromData === void 0) { return AnimationGroupControl.voidControl; }

            if (!isObject(actualFromData))
            {
               throw new TypeError(
                `AnimationGroupAPI.from error: 'fromData' callback function failed to return an object.`);
            }
         }

         if (hasOptionCallback)
         {
            actualOptions = options(callbackOptions);

            // Returned data from callback is null / undefined, so skip this position instance.
            if (actualOptions === null || actualOptions === void 0) { return AnimationGroupControl.voidControl; }

            if (!isObject(actualOptions))
            {
               throw new TypeError(
                `AnimationGroupAPI.from error: 'options' callback function failed to return an object.`);
            }
         }

         const animationControl = AnimationScheduler.from(actualPosition, actualFromData, actualOptions, cleanupFn);
         if (animationControl) { animationControls.add(animationControl); }
      }

      return new AnimationGroupControl(animationControls);
   }

   /**
    * Provides the `fromTo` animation tween for one or more positionable instances as a group.
    *
    * @param {import('../types').TJSPositionTypes.PositionGroup} positionGroup - A position group.
    *
    * @param {(
    *    import('../data/types').Data.TJSPositionDataRelative |
    *    import('./types').AnimationAPI.GroupDataCallback
    * )} fromData - A position data object assigned to all positionable instances or a callback function invoked for
    *        unique data for each instance.
    *
    * @param {(
    *    import('../data/types').Data.TJSPositionDataRelative |
    *    import('./types').AnimationAPI.GroupDataCallback
    * )} toData - A position data object assigned to all positionable instances or a callback function invoked for
    *        unique data for each instance.
    *
    * @param {(
    *    import('./types').AnimationAPI.TweenOptions |
    *    import('./types').AnimationAPI.GroupTweenOptionsCallback
    * )} [options] - Tween options assigned to all positionable instances or a callback function invoked for unique
    *        options for each instance.
    *
    * @returns {import('#runtime/util/animate').BasicAnimation} Basic animation control.
    */
   static fromTo(positionGroup, fromData, toData, options)
   {
      if (!isObject(fromData) && typeof fromData !== 'function')
      {
         throw new TypeError(`AnimationGroupAPI.fromTo error: 'fromData' is not an object or function.`);
      }

      if (!isObject(toData) && typeof toData !== 'function')
      {
         throw new TypeError(`AnimationGroupAPI.fromTo error: 'toData' is not an object or function.`);
      }

      if (options !== void 0 && !isObject(options) && typeof options !== 'function')
      {
         throw new TypeError(`AnimationGroupAPI.fromTo error: 'options' is not an object or function.`);
      }

      /** @type {Set<import('./AnimationControl').AnimationControl>} */
      const animationControls = new Set();

      /** @type {import('./types-local').AnimationCleanupFunction} */
      const cleanupFn = (data) => animationControls.delete(data.control);

      let index = -1;

      /** @type {import('./types').AnimationAPI.GroupCallbackOptions} */
      let callbackOptions;

      const hasFromCallback = typeof fromData === 'function';
      const hasToCallback = typeof toData === 'function';
      const hasOptionCallback = typeof options === 'function';
      const hasCallback = hasFromCallback || hasToCallback || hasOptionCallback;

      if (hasCallback) { callbackOptions = { index, position: void 0, entry: void 0 }; }

      let actualFromData = fromData;
      let actualToData = toData;
      let actualOptions = options;

      if (isIterable(positionGroup))
      {
         for (const entry of positionGroup)
         {
            index++;

            const actualPosition = this.#getPosition(entry);

            if (!actualPosition)
            {
               console.warn(`AnimationGroupAPI.fromTo warning: No TJSPosition instance found at index: ${index}.`);
               continue;
            }

            if (hasCallback)
            {
               callbackOptions.index = index;
               callbackOptions.position = actualPosition;
               callbackOptions.entry = actualPosition !== entry ? entry : void 0;
            }

            if (hasFromCallback)
            {
               actualFromData = fromData(callbackOptions);

               // Returned data from callback is null / undefined, so skip this position instance.
               if (actualFromData === null || actualFromData === void 0) { continue; }

               if (!isObject(actualFromData))
               {
                  throw new TypeError(`AnimationGroupAPI.fromTo error: 'fromData' callback function iteration(${
                   index}) failed to return an object.`);
               }
            }

            if (hasToCallback)
            {
               actualToData = toData(callbackOptions);

               // Returned data from callback is null / undefined, so skip this position instance.
               if (actualToData === null || actualToData === void 0) { continue; }

               if (!isObject(actualToData))
               {
                  throw new TypeError(`AnimationGroupAPI.fromTo error: 'toData' callback function iteration(${
                   index}) failed to return an object.`);
               }
            }

            if (hasOptionCallback)
            {
               actualOptions = options(callbackOptions);

               // Returned data from callback is null / undefined, so skip this position instance.
               if (actualOptions === null || actualOptions === void 0) { continue; }

               if (!isObject(actualOptions))
               {
                  throw new TypeError(`AnimationGroupAPI.fromTo error: 'options' callback function iteration(${
                   index}) failed to return an object.`);
               }
            }

            const animationControl = AnimationScheduler.fromTo(actualPosition, actualFromData, actualToData,
             actualOptions, cleanupFn);

            if (animationControl) { animationControls.add(animationControl); }
         }
      }
      else
      {
         const actualPosition = this.#getPosition(positionGroup);

         if (!actualPosition)
         {
            console.warn(`AnimationGroupAPI.fromTo warning: No TJSPosition instance found.`);
            return AnimationGroupControl.voidControl;
         }

         if (hasCallback)
         {
            callbackOptions.index = 0;
            callbackOptions.position = actualPosition;
            callbackOptions.entry = actualPosition !== positionGroup ? positionGroup : void 0;
         }

         if (hasFromCallback)
         {
            actualFromData = fromData(callbackOptions);

            // Returned data from callback is null / undefined, so skip this position instance.
            if (actualFromData === null || actualFromData === void 0) { return AnimationGroupControl.voidControl; }

            if (!isObject(actualFromData))
            {
               throw new TypeError(
                `AnimationGroupAPI.fromTo error: 'fromData' callback function failed to return an object.`);
            }
         }

         if (hasToCallback)
         {
            actualToData = toData(callbackOptions);

            // Returned data from callback is null / undefined, so skip this position instance.
            if (actualToData === null || actualToData === void 0) { return AnimationGroupControl.voidControl; }

            if (!isObject(actualToData))
            {
               throw new TypeError(
                `AnimationGroupAPI.fromTo error: 'toData' callback function failed to return an object.`);
            }
         }

         if (hasOptionCallback)
         {
            actualOptions = options(callbackOptions);

            // Returned data from callback is null / undefined, so skip this position instance.
            if (actualOptions === null || actualOptions === void 0) { return AnimationGroupControl.voidControl; }

            if (!isObject(actualOptions))
            {
               throw new TypeError(
                `AnimationGroupAPI.fromTo error: 'options' callback function failed to return an object.`);
            }
         }

         const animationControl = AnimationScheduler.fromTo(actualPosition, actualFromData, actualToData,
          actualOptions, cleanupFn);

         if (animationControl) { animationControls.add(animationControl); }
      }

      return new AnimationGroupControl(animationControls);
   }

   /**
    * Provides the `to` animation tween for one or more positionable instances as a group.
    *
    * @param {import('../types').TJSPositionTypes.PositionGroup} positionGroup - A position group.
    *
    * @param {(
    *    import('../data/types').Data.TJSPositionDataRelative |
    *    import('./types').AnimationAPI.GroupDataCallback
    * )} toData - A position data object assigned to all positionable instances or a callback function invoked for
    *        unique data for each instance.
    *
    * @param {(
    *    import('./types').AnimationAPI.TweenOptions |
    *    import('./types').AnimationAPI.GroupTweenOptionsCallback
    * )} [options] - Tween options assigned to all positionable instances or a callback function invoked for unique
    *        options for each instance.
    *
    * @returns {import('#runtime/util/animate').BasicAnimation} Basic animation control.
    */
   static to(positionGroup, toData, options)
   {
      if (!isObject(toData) && typeof toData !== 'function')
      {
         throw new TypeError(`AnimationGroupAPI.to error: 'toData' is not an object or function.`);
      }

      if (options !== void 0 && !isObject(options) && typeof options !== 'function')
      {
         throw new TypeError(`AnimationGroupAPI.to error: 'options' is not an object or function.`);
      }

      /** @type {Set<import('./AnimationControl').AnimationControl>} */
      const animationControls = new Set();

      /** @type {import('./types-local').AnimationCleanupFunction} */
      const cleanupFn = (data) => animationControls.delete(data.control);

      let index = -1;

      /** @type {import('./types').AnimationAPI.GroupCallbackOptions} */
      let callbackOptions;

      const hasDataCallback = typeof toData === 'function';
      const hasOptionCallback = typeof options === 'function';
      const hasCallback = hasDataCallback || hasOptionCallback;

      if (hasCallback) { callbackOptions = { index, position: void 0, entry: void 0 }; }

      let actualToData = toData;
      let actualOptions = options;

      if (isIterable(positionGroup))
      {
         for (const entry of positionGroup)
         {
            index++;

            const actualPosition = this.#getPosition(entry);

            if (!actualPosition)
            {
               console.warn(`AnimationGroupAPI.to warning: No TJSPosition instance found at index: ${index}.`);
               continue;
            }

            if (hasCallback)
            {
               callbackOptions.index = index;
               callbackOptions.position = actualPosition;
               callbackOptions.entry = actualPosition !== entry ? entry : void 0;
            }

            if (hasDataCallback)
            {
               actualToData = toData(callbackOptions);

               // Returned data from callback is null / undefined, so skip this position instance.
               if (actualToData === null || actualToData === void 0) { continue; }

               if (!isObject(actualToData))
               {
                  throw new TypeError(`AnimationGroupAPI.to error: 'toData' callback function iteration(${
                   index}) failed to return an object.`);
               }
            }

            if (hasOptionCallback)
            {
               actualOptions = options(callbackOptions);

               // Returned data from callback is null / undefined, so skip this position instance.
               if (actualOptions === null || actualOptions === void 0) { continue; }

               if (!isObject(actualOptions))
               {
                  throw new TypeError(`AnimationGroupAPI.to error: 'options' callback function iteration(${
                   index}) failed to return an object.`);
               }
            }

            const animationControl = AnimationScheduler.to(actualPosition, actualToData, actualOptions, cleanupFn);
            if (animationControl) { animationControls.add(animationControl); }
         }
      }
      else
      {
         const actualPosition = this.#getPosition(positionGroup);

         if (!actualPosition)
         {
            console.warn(`AnimationGroupAPI.to warning: No TJSPosition instance found.`);
            return AnimationGroupControl.voidControl;
         }

         if (hasCallback)
         {
            callbackOptions.index = 0;
            callbackOptions.position = actualPosition;
            callbackOptions.entry = actualPosition !== positionGroup ? positionGroup : void 0;
         }

         if (hasDataCallback)
         {
            actualToData = toData(callbackOptions);

            // Returned data from callback is null / undefined, so skip this position instance.
            if (actualToData === null || actualToData === void 0) { return AnimationGroupControl.voidControl; }

            if (!isObject(actualToData))
            {
               throw new TypeError(
                `AnimationGroupAPI.to error: 'toData' callback function failed to return an object.`);
            }
         }

         if (hasOptionCallback)
         {
            actualOptions = options(callbackOptions);

            // Returned data from callback is null / undefined, so skip this position instance.
            if (actualOptions === null || actualOptions === void 0) { return AnimationGroupControl.voidControl; }

            if (!isObject(actualOptions))
            {
               throw new TypeError(
                `AnimationGroupAPI.to error: 'options' callback function failed to return an object.`);
            }
         }

         const animationControl = AnimationScheduler.to(actualPosition, actualToData, actualOptions, cleanupFn);
         if (animationControl) { animationControls.add(animationControl); }
      }

      return new AnimationGroupControl(animationControls);
   }

   /**
    * Provides the `quickTo` animation tweening function for one or more positionable instances as a group.
    *
    * @param {import('../types').TJSPositionTypes.PositionGroup} positionGroup - A position group.
    *
    * @param {Iterable<import('./types').AnimationAPI.AnimationKey>}  keys - Animation keys to target.
    *
    * @param {(
    *    import('./types').AnimationAPI.QuickTweenOptions |
    *    import('./types').AnimationAPI.GroupQuickTweenOptionsCallback
    * )} [options] - Quick tween options assigned to all positionable instances or a callback function invoked for
    *        unique options for each instance.
    *
    * @returns {import('./types').AnimationAPI.GroupQuickToCallback | undefined} quick-to tween function.
    */
   static quickTo(positionGroup, keys, options)
   {
      if (!isIterable(keys))
      {
         throw new TypeError(`AnimationGroupAPI.quickTo error: 'keys' is not an iterable list.`);
      }

      if (options !== void 0 && !isObject(options) && typeof options !== 'function')
      {
         throw new TypeError(`AnimationGroupAPI.quickTo error: 'options' is not an object or function.`);
      }

      /**
       * @type {import('./types').AnimationAPI.QuickToCallback[]}
       */
      const quickToCallbacks = [];

      let index = -1;

      const hasOptionCallback = typeof options === 'function';

      const callbackOptions = { index, position: void 0, entry: void 0 };

      let actualOptions = isObject(options) ? options : void 0;

      if (isIterable(positionGroup))
      {
         for (const entry of positionGroup)
         {
            index++;

            const actualPosition = this.#getPosition(entry);

            if (!actualPosition)
            {
               console.warn(`AnimationGroupAPI.quickTo warning: No TJSPosition instance found at index: ${index}.`);
               continue;
            }

            callbackOptions.index = index;
            callbackOptions.position = actualPosition;
            callbackOptions.entry = actualPosition !== entry ? entry : void 0;

            if (hasOptionCallback)
            {
               actualOptions = options(callbackOptions);

               // Returned data from callback is null / undefined, so skip this position instance.
               if (actualOptions === null || actualOptions === void 0) { continue; }

               if (!isObject(actualOptions))
               {
                  throw new TypeError(`AnimationGroupAPI.quickTo error: 'options' callback function iteration(${
                   index}) failed to return an object.`);
               }
            }

            quickToCallbacks.push(actualPosition.animate.quickTo(keys, actualOptions));
         }
      }
      else
      {
         const actualPosition = this.#getPosition(positionGroup);

         if (!actualPosition)
         {
            console.warn(`AnimationGroupAPI.quickTo warning: No TJSPosition instance found.`);
            return;
         }

         callbackOptions.index = 0;
         callbackOptions.position = actualPosition;
         callbackOptions.entry = actualPosition !== positionGroup ? positionGroup : void 0;

         if (hasOptionCallback)
         {
            actualOptions = options(callbackOptions);

            // Returned data from callback is null / undefined, so skip this position instance.
            if (actualOptions === null || actualOptions === void 0) { return; }

            if (!isObject(actualOptions))
            {
               throw new TypeError(
                `AnimationGroupAPI.quickTo error: 'options' callback function failed to return an object.`);
            }
         }

         quickToCallbacks.push(actualPosition.animate.quickTo(keys, actualOptions));
      }

      const keysArray = [...keys];

      Object.freeze(keysArray);

      const quickToCB = (...args) =>
      {
         const argsLength = args.length;

         if (argsLength === 0) { return; }

         if (typeof args[0] === 'function')
         {
            const dataCallback = args[0];

            index = -1;
            let cntr = 0;

            if (isIterable(positionGroup))
            {
               for (const entry of positionGroup)
               {
                  index++;

                  const actualPosition = this.#getPosition(entry);

                  if (!actualPosition) { continue; }

                  callbackOptions.index = index;
                  callbackOptions.position = actualPosition;
                  callbackOptions.entry = actualPosition !== entry ? entry : void 0;

                  const toData = dataCallback(callbackOptions);

                  // Returned data from callback is null / undefined, so skip this position instance.
                  if (toData === null || toData === void 0) { continue; }

                  /** @type {boolean} */
                  const toDataIterable = isIterable(toData);

                  if (!Number.isFinite(toData) && !toDataIterable && !isObject(toData))
                  {
                     throw new TypeError(`AnimationGroupAPI.quickTo error: 'toData' callback function iteration(${
                      index}) failed to return a finite number, iterable list, or object.`);
                  }

                  if (toDataIterable)
                  {
                     quickToCallbacks[cntr++](...toData);
                  }
                  else
                  {
                     quickToCallbacks[cntr++](toData);
                  }
               }
            }
            else
            {
               const actualPosition = this.#getPosition(positionGroup);

               if (!actualPosition) { return; }

               callbackOptions.index = 0;
               callbackOptions.position = actualPosition;
               callbackOptions.entry = actualPosition !== positionGroup ? positionGroup : void 0;

               const toData = dataCallback(callbackOptions);

               // Returned data from callback is null / undefined, so skip this position instance.
               if (toData === null || toData === void 0) { return; }

               const toDataIterable = isIterable(toData);

               if (!Number.isFinite(toData) && !toDataIterable && !isObject(toData))
               {
                  throw new TypeError(`AnimationGroupAPI.quickTo error: 'toData' callback function iteration(${
                   index}) failed to return a finite number, iterable list, or object.`);
               }

               if (toDataIterable)
               {
                  quickToCallbacks[cntr++](...toData);
               }
               else
               {
                  quickToCallbacks[cntr++](toData);
               }
            }
         }
         else
         {
            for (let cntr = quickToCallbacks.length; --cntr >= 0;)
            {
               quickToCallbacks[cntr](...args);
            }
         }
      };

      quickToCB.keys = keysArray;

      /**
       * Sets options of quickTo tween.
       *
       * @param {import('./types').AnimationAPI.QuickTweenOptions}   [options] - Optional parameters.
       *
       * @returns {import('./types').AnimationAPI.QuickToCallback} The quickTo callback.
       */
      quickToCB.options = (options) => // eslint-disable-line no-shadow
      {
         if (options !== void 0 && !isObject(options))
         {
            throw new TypeError(`AnimationGroupAPI.quickTo error: 'options' is not an object.`);
         }

         // Set options object for each quickTo callback.
         if (isObject(options))
         {
            for (let cntr = quickToCallbacks.length; --cntr >= 0;) { quickToCallbacks[cntr].options(options); }
         }

         return quickToCB;
      };

      return quickToCB;
   }
}

Object.seal(AnimationGroupAPI);

export { AnimationGroupAPI };
