import {
   isIterable,
   isObject }                    from '#runtime/util/object';

import { AnimationManager }      from './AnimationManager';
import { AnimationAPI }          from './AnimationAPI';
import { AnimationGroupControl } from './AnimationGroupControl';
import { AnimationScheduler }    from './AnimationScheduler';

import { TJSPositionDataUtil }   from '../data';

import type { BasicAnimation }   from '#runtime/util/animate';

import type { AnimationControl } from './AnimationControl';
import type {
   AnimationCleanupFunction,
   AnimationData }               from './types-local';

import type { TJSPosition }      from '../TJSPosition';
import type { TJSPositionNS }    from '../types';

/**
 * Provides a public API for grouping multiple {@link TJSPosition} animations together with the
 * AnimationManager.
 *
 * Note: To remove cyclic dependencies as this class provides the TJSPosition static / group Animation API `instanceof`
 * checks are not done against TJSPosition. Instead, a check for the animate property being an instanceof
 * {@link AnimationAPI} is performed in {@link AnimationGroupAPI.#getPosition}.
 *
 * Note: This is a static class that conforms to the {@link TJSPositionNS.API.AnimationGroup} interface.
 *
 * @see AnimationAPI
 */
class AnimationGroupAPI
{
   private constructor() {}

   /**
    * Returns the TJSPosition instance for the possible given positionable by checking the instance by checking for
    * AnimationAPI.
    *
    * @param positionable - Possible position group entry.
    *
    * @returns Returns actual TJSPosition instance.
    */
   static #getPosition(positionable: TJSPosition | TJSPositionNS.Positionable): TJSPosition | null
   {
      if (!isObject(positionable)) { return null; }

      if (positionable.animate instanceof AnimationAPI) { return positionable as TJSPosition; }

      if ((positionable.position as any)?.animate instanceof AnimationAPI)
      {
         return positionable.position as TJSPosition;
      }

      return null;
   }

   /**
    * Cancels any animation for given PositionGroup data.
    *
    * @param positionGroup - The position group to cancel.
    */
   static cancel(positionGroup: TJSPositionNS.PositionGroup)
   {
      if (isIterable(positionGroup))
      {
         let index: number = -1;

         for (const entry of positionGroup)
         {
            index++;

            const actualPosition: TJSPosition | null = this.#getPosition(entry);

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
         const actualPosition: TJSPosition | null = this.#getPosition(positionGroup);

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
   static cancelAll(): void { AnimationManager.cancelAll(); }

   /**
    * Gets all animation controls for the given position group data.
    *
    * @param positionGroup - A position group.
    *
    * @returns Results array.
    */
   static getScheduled(positionGroup: TJSPositionNS.PositionGroup): {
      position: TJSPosition,
      entry: TJSPositionNS.Positionable | undefined,
      controls: BasicAnimation[]
   }[]
   {
      const results: {
         position: TJSPosition,
         entry: TJSPositionNS.Positionable | undefined,
         controls: BasicAnimation[]
      }[] = [];

      if (isIterable(positionGroup))
      {
         let index: number = -1;

         for (const entry of positionGroup)
         {
            index++;

            const actualPosition: TJSPosition = this.#getPosition(entry);

            if (!actualPosition)
            {
               console.warn(`AnimationGroupAPI.getScheduled warning: No TJSPosition instance found at index: ${
                index}.`);

               continue;
            }

            const controls: BasicAnimation[] = AnimationManager.getScheduled(actualPosition);

            results.push({
               position: actualPosition,
               entry: actualPosition !== entry ? entry as TJSPositionNS.Positionable : void 0,
               controls
            });
         }
      }
      else
      {
         const actualPosition: TJSPosition = this.#getPosition(positionGroup);

         if (!actualPosition)
         {
            console.warn(`AnimationGroupAPI.getScheduled warning: No TJSPosition instance found.`);
            return results;
         }

         const controls: BasicAnimation[] = AnimationManager.getScheduled(actualPosition);

         results.push({
            position: actualPosition,
            entry: actualPosition !== positionGroup ? positionGroup as TJSPositionNS.Positionable : void 0,
            controls
         });
      }

      return results;
   }

   /**
    * Provides a type guard to test in the given key is an {@link AnimationAPI.AnimationKey}.
    *
    * @param key - A key value to test.
    *
    * @returns Whether the given key is an animation key.
    */
   static isAnimationKey(key: string): key is TJSPositionNS.API.Animation.AnimationKey
   {
      return TJSPositionDataUtil.isAnimationKey(key);
   }

   /**
    * Returns the status _for the entire position group_ specified if all position instances of the group are scheduled.
    *
    * @param positionGroup - A position group.
    *
    * @param [options] - Options.
    *
    * @returns True if all are scheduled / false if just one position instance in the group is not scheduled.
    */
   static isScheduled(positionGroup: TJSPositionNS.PositionGroup,
    options?: TJSPositionNS.API.Animation.ScheduleOptions): boolean
   {
      if (isIterable(positionGroup))
      {
         let index: number = -1;

         for (const entry of positionGroup)
         {
            index++;

            const actualPosition: TJSPosition = this.#getPosition(entry);

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
         const actualPosition: TJSPosition = this.#getPosition(positionGroup);

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
    * @param positionGroup - A position group.
    *
    * @param fromData - A position data object assigned to all positionable instances or a callback function invoked for
    *        unique data for each instance.
    *
    * @param [options] - Tween options assigned to all positionable instances or a callback function invoked for unique
    *        options for each instance.
    *
    * @returns Basic animation control.
    */
   static from(positionGroup: TJSPositionNS.PositionGroup, fromData: TJSPositionNS.Data.TJSPositionDataRelative |
    TJSPositionNS.API.Animation.GroupDataCallback, options?: TJSPositionNS.API.Animation.TweenOptions |
     TJSPositionNS.API.Animation.GroupTweenOptionsCallback): BasicAnimation
   {
      if (!isObject(fromData) && typeof fromData !== 'function')
      {
         throw new TypeError(`AnimationGroupAPI.from error: 'fromData' is not an object or function.`);
      }

      if (options !== void 0 && !isObject(options) && typeof options !== 'function')
      {
         throw new TypeError(`AnimationGroupAPI.from error: 'options' is not an object or function.`);
      }

      /**
       */
      const animationControls: Set<AnimationControl> = new Set();

      /**
       */
      const cleanupFn: AnimationCleanupFunction = (data: AnimationData): boolean =>
       animationControls.delete(data.control);

      let index: number = -1;

      /**
       */
      let callbackOptions: TJSPositionNS.API.Animation.GroupCallbackOptions;

      const hasDataCallback: boolean = typeof fromData === 'function';
      const hasOptionCallback: boolean = typeof options === 'function';
      const hasCallback: boolean = hasDataCallback || hasOptionCallback;

      if (hasCallback) { callbackOptions = { index, position: void 0, entry: void 0 }; }

      let actualFromData: TJSPositionNS.Data.TJSPositionDataRelative |
       TJSPositionNS.API.Animation.GroupDataCallback = fromData;

      let actualOptions: TJSPositionNS.API.Animation.TweenOptions = isObject(options) ? options : void 0;

      if (isIterable(positionGroup))
      {
         for (const entry of positionGroup)
         {
            index++;

            const actualPosition: TJSPosition = this.#getPosition(entry);

            if (!actualPosition)
            {
               console.warn(`AnimationGroupAPI.from warning: No TJSPosition instance found at index: ${index}.`);
               continue;
            }

            if (hasCallback)
            {
               callbackOptions.index = index;
               callbackOptions.position = actualPosition;
               callbackOptions.entry = actualPosition !== entry ? entry as TJSPositionNS.Positionable : void 0;
            }

            if (hasDataCallback && typeof fromData === 'function')
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

            if (hasOptionCallback && typeof options === 'function')
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
            callbackOptions.entry = actualPosition !== positionGroup ? positionGroup as TJSPositionNS.Positionable :
             void 0;
         }

         if (hasDataCallback && typeof fromData === 'function')
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

         if (hasOptionCallback && typeof options === 'function')
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

         const animationControl: AnimationControl = AnimationScheduler.from(actualPosition, actualFromData,
          actualOptions, cleanupFn);

         if (animationControl) { animationControls.add(animationControl); }
      }

      return new AnimationGroupControl(animationControls);
   }

   /**
    * Provides the `fromTo` animation tween for one or more positionable instances as a group.
    *
    * @param positionGroup - A position group.
    *
    * @param fromData - A position data object assigned to all positionable instances or a callback function invoked for
    *        unique data for each instance.
    *
    * @param toData - A position data object assigned to all positionable instances or a callback function invoked for
    *        unique data for each instance.
    *
    * @param [options] - Tween options assigned to all positionable instances or a callback function invoked for unique
    *        options for each instance.
    *
    * @returns {import('#runtime/util/animate').BasicAnimation} Basic animation control.
    */
   static fromTo(positionGroup: TJSPositionNS.PositionGroup, fromData: TJSPositionNS.Data.TJSPositionDataRelative |
    TJSPositionNS.API.Animation.GroupDataCallback, toData: TJSPositionNS.Data.TJSPositionDataRelative |
      TJSPositionNS.API.Animation.GroupDataCallback, options?: TJSPositionNS.API.Animation.TweenOptions |
       TJSPositionNS.API.Animation.GroupTweenOptionsCallback): BasicAnimation
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

      const animationControls: Set<AnimationControl> = new Set();

      /**
       */
      const cleanupFn: AnimationCleanupFunction = (data: AnimationData): boolean =>
       animationControls.delete(data.control);

      let index: number = -1;

      /**
       */
      let callbackOptions: TJSPositionNS.API.Animation.GroupCallbackOptions;

      const hasFromCallback: boolean = typeof fromData === 'function';
      const hasToCallback: boolean = typeof toData === 'function';
      const hasOptionCallback: boolean = typeof options === 'function';
      const hasCallback: boolean = hasFromCallback || hasToCallback || hasOptionCallback;

      if (hasCallback) { callbackOptions = { index, position: void 0, entry: void 0 }; }

      let actualFromData: TJSPositionNS.Data.TJSPositionDataRelative = fromData;
      let actualToData: TJSPositionNS.Data.TJSPositionDataRelative = toData;

      let actualOptions: TJSPositionNS.API.Animation.TweenOptions = isObject(options) ? options : void 0;

      if (isIterable(positionGroup))
      {
         for (const entry of positionGroup)
         {
            index++;

            const actualPosition: TJSPosition = this.#getPosition(entry);

            if (!actualPosition)
            {
               console.warn(`AnimationGroupAPI.fromTo warning: No TJSPosition instance found at index: ${index}.`);
               continue;
            }

            if (hasCallback)
            {
               callbackOptions.index = index;
               callbackOptions.position = actualPosition;
               callbackOptions.entry = actualPosition !== entry ? entry as TJSPositionNS.Positionable : void 0;
            }

            if (hasFromCallback && typeof fromData === 'function')
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

            if (hasToCallback && typeof toData === 'function')
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

            if (hasOptionCallback && typeof options === 'function')
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

            const animationControl: AnimationControl = AnimationScheduler.fromTo(actualPosition, actualFromData,
             actualToData, actualOptions, cleanupFn);

            if (animationControl) { animationControls.add(animationControl); }
         }
      }
      else
      {
         const actualPosition: TJSPosition = this.#getPosition(positionGroup);

         if (!actualPosition)
         {
            console.warn(`AnimationGroupAPI.fromTo warning: No TJSPosition instance found.`);
            return AnimationGroupControl.voidControl;
         }

         if (hasCallback)
         {
            callbackOptions.index = 0;
            callbackOptions.position = actualPosition;
            callbackOptions.entry = actualPosition !== positionGroup ? positionGroup as TJSPositionNS.Positionable :
             void 0;
         }

         if (hasFromCallback && typeof fromData === 'function')
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

         if (hasToCallback && typeof toData === 'function')
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

         if (hasOptionCallback && typeof options === 'function')
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

         const animationControl: AnimationControl = AnimationScheduler.fromTo(actualPosition, actualFromData,
          actualToData, actualOptions, cleanupFn);

         if (animationControl) { animationControls.add(animationControl); }
      }

      return new AnimationGroupControl(animationControls);
   }

   /**
    * Provides the `to` animation tween for one or more positionable instances as a group.
    *
    * @param positionGroup - A position group.
    *
    * @param toData - A position data object assigned to all positionable instances or a callback function invoked for
    *        unique data for each instance.
    *
    * @param [options] - Tween options assigned to all positionable instances or a callback function invoked for unique
    *        options for each instance.
    *
    * @returns {import('#runtime/util/animate').BasicAnimation} Basic animation control.
    */
   static to(positionGroup: TJSPositionNS.PositionGroup, toData: TJSPositionNS.Data.TJSPositionDataRelative |
    TJSPositionNS.API.Animation.GroupDataCallback, options?: TJSPositionNS.API.Animation.TweenOptions |
     TJSPositionNS.API.Animation.GroupTweenOptionsCallback): BasicAnimation
   {
      if (!isObject(toData) && typeof toData !== 'function')
      {
         throw new TypeError(`AnimationGroupAPI.to error: 'toData' is not an object or function.`);
      }

      if (options !== void 0 && !isObject(options) && typeof options !== 'function')
      {
         throw new TypeError(`AnimationGroupAPI.to error: 'options' is not an object or function.`);
      }

      /**
       */
      const animationControls: Set<AnimationControl> = new Set();

      /**
       */
      const cleanupFn: AnimationCleanupFunction = (data: AnimationData): boolean =>
       animationControls.delete(data.control);

      let index: number = -1;

      /**
       */
      let callbackOptions: TJSPositionNS.API.Animation.GroupCallbackOptions;

      const hasDataCallback: boolean = typeof toData === 'function';
      const hasOptionCallback: boolean = typeof options === 'function';
      const hasCallback: boolean = hasDataCallback || hasOptionCallback;

      if (hasCallback) { callbackOptions = { index, position: void 0, entry: void 0 }; }

      let actualToData: TJSPositionNS.Data.TJSPositionDataRelative = toData;

      let actualOptions: TJSPositionNS.API.Animation.TweenOptions = isObject(options) ? options : void 0;

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
               callbackOptions.entry = actualPosition !== entry ? entry as TJSPositionNS.Positionable : void 0;
            }

            if (hasDataCallback && typeof toData === 'function')
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

            if (hasOptionCallback && typeof options === 'function')
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

            const animationControl: AnimationControl = AnimationScheduler.to(actualPosition, actualToData,
             actualOptions, cleanupFn);

            if (animationControl) { animationControls.add(animationControl); }
         }
      }
      else
      {
         const actualPosition: TJSPosition = this.#getPosition(positionGroup);

         if (!actualPosition)
         {
            console.warn(`AnimationGroupAPI.to warning: No TJSPosition instance found.`);
            return AnimationGroupControl.voidControl;
         }

         if (hasCallback)
         {
            callbackOptions.index = 0;
            callbackOptions.position = actualPosition;
            callbackOptions.entry = actualPosition !== positionGroup ? positionGroup as TJSPositionNS.Positionable :
             void 0;
         }

         if (hasDataCallback && typeof toData === 'function')
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

         if (hasOptionCallback && typeof options === 'function')
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

         const animationControl: AnimationControl = AnimationScheduler.to(actualPosition, actualToData, actualOptions,
          cleanupFn);

         if (animationControl) { animationControls.add(animationControl); }
      }

      return new AnimationGroupControl(animationControls);
   }

   /**
    * Provides the `quickTo` animation tweening function for one or more positionable instances as a group.
    *
    * @param positionGroup - A position group.
    *
    * @param keys - Animation keys to target.
    *
    * @param [options] - Quick tween options assigned to all positionable instances or a callback function invoked for
    *        unique options for each instance.
    *
    * @returns quick-to tween function.
    */
   static quickTo(positionGroup: TJSPositionNS.PositionGroup, keys: Iterable<TJSPositionNS.API.Animation.AnimationKey>,
    options?: TJSPositionNS.API.Animation.QuickTweenOptions |
     TJSPositionNS.API.Animation.GroupQuickTweenOptionsCallback): TJSPositionNS.API.Animation.GroupQuickToCallback |
      undefined
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
       */
      const quickToCallbacks: TJSPositionNS.API.Animation.QuickToCallback[] = [];

      let index: number = -1;

      const hasOptionCallback: boolean = typeof options === 'function';

      const callbackOptions = { index, position: void 0, entry: void 0 };

      let actualOptions: TJSPositionNS.API.Animation.QuickTweenOptions = isObject(options) ? options : void 0;

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

            if (hasOptionCallback && typeof options === 'function')
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
         const actualPosition: TJSPosition = this.#getPosition(positionGroup);

         if (!actualPosition)
         {
            console.warn(`AnimationGroupAPI.quickTo warning: No TJSPosition instance found.`);
            return;
         }

         callbackOptions.index = 0;
         callbackOptions.position = actualPosition;
         callbackOptions.entry = actualPosition !== positionGroup ? positionGroup : void 0;

         if (hasOptionCallback && typeof options === 'function')
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

      const keysArray: TJSPositionNS.API.Animation.AnimationKey[] = [...keys];

      Object.freeze(keysArray);

      const quickToCB: Function = (...args: any[]): void =>
      {
         const argsLength: number = args.length;

         if (argsLength === 0) { return; }

         if (typeof args[0] === 'function')
         {
            const dataCallback: Function = args[0];

            index = -1;
            let cntr: number = 0;

            if (isIterable(positionGroup))
            {
               for (const entry of positionGroup)
               {
                  index++;

                  const actualPosition: TJSPosition = this.#getPosition(entry);

                  if (!actualPosition) { continue; }

                  callbackOptions.index = index;
                  callbackOptions.position = actualPosition;
                  callbackOptions.entry = actualPosition !== entry ? entry : void 0;

                  const toData = dataCallback(callbackOptions);

                  // Returned data from callback is null / undefined, so skip this position instance.
                  if (toData === null || toData === void 0) { continue; }

                  /**
                   */
                  const toDataIterable: boolean = isIterable(toData);

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

               const toDataIterable: boolean = isIterable(toData);

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
            for (let cntr: number = quickToCallbacks.length; --cntr >= 0;)
            {
               quickToCallbacks[cntr](...args);
            }
         }
      };

      Object.defineProperty(quickToCB, 'keys', {
         value: keysArray,
         writable: false,
         configurable: false
      });

      Object.defineProperty(quickToCB, 'options', {
         /**
          * Sets options of quickTo tween.
          * @param options -
          */
         value: (options: TJSPositionNS.API.Animation.QuickTweenOptions): TJSPositionNS.API.Animation.QuickToCallback =>
         {
            if (options !== void 0 && !isObject(options))
            {
               throw new TypeError(`AnimationGroupAPI.quickTo error: 'options' is not an object.`);
            }

            // Set options object for each quickTo callback.
            if (isObject(options))
            {
               for (let cntr = quickToCallbacks.length; --cntr >= 0;)
               {
                  quickToCallbacks[cntr].options(options);
               }
            }

            return quickToCB as TJSPositionNS.API.Animation.GroupQuickToCallback;
         },
         writable: false,
         configurable: false
      });

      return quickToCB as TJSPositionNS.API.Animation.GroupQuickToCallback;
   }
}

Object.seal(AnimationGroupAPI);

export { AnimationGroupAPI };