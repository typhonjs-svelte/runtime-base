import { lerp }                  from '#runtime/math/interpolate';

import { getEasingFunc }         from '#runtime/svelte/easing';

import { A11yHelper }            from '#runtime/util/browser';

import {
   isIterable,
   isObject }                    from '#runtime/util/object';

import { AnimationControl }      from './AnimationControl.js';
import { AnimationManager }      from './AnimationManager.js';
import { AnimationScheduler }    from './AnimationScheduler.js';

import {
   ConvertStringData,
   TJSPositionDataUtil }         from '../data';

/**
 * @implements {import('./types').AnimationAPI}
 */
export class AnimationAPI
{
   static #getEaseOptions = Object.freeze({ default: false });

   /** @type {import('../data/types').Data.TJSPositionData} */
   #data;

   /** @type {import('../').TJSPosition} */
   #position;

   /**
    * @param {import('../').TJSPosition}       position -
    *
    * @param {import('../data/types').Data.TJSPositionData}   data -
    */
   constructor(position, data)
   {
      this.#position = position;
      this.#data = data;

      Object.seal(this);
   }

   /**
    * Returns if there are scheduled animations whether active or pending for this TJSPosition instance.
    *
    * @returns {boolean} Are there scheduled animations.
    */
   get isScheduled()
   {
      return AnimationManager.isScheduled(this.#position);
   }

   /**
    * Cancels all animation instances for this TJSPosition instance.
    */
   cancel()
   {
      AnimationManager.cancel(this.#position);
   }

   /**
    * Returns all currently scheduled AnimationControl instances for this TJSPosition instance.
    *
    * @returns {import('#runtime/util/animate').BasicAnimation[]} All currently scheduled animation controls for
    *          this TJSPosition instance.
    */
   getScheduled()
   {
      return AnimationManager.getScheduled(this.#position);
   }

   /**
    * Provides a tween from given position data to the current position.
    *
    * @param {import('../data/types').Data.TJSPositionDataRelative} fromData - The starting position.
    *
    * @param {import('./types').AnimationAPI.TweenOptions} [options] - Optional tween parameters.
    *
    * @returns {import('#runtime/util/animate').BasicAnimation}  A control object that can cancel animation and
    *          provides a `finished` Promise.
    */
   from(fromData, options)
   {
      const animationControl = AnimationScheduler.from(this.#position, fromData, options);
      return animationControl ? animationControl : AnimationControl.voidControl;
   }

   /**
    * Provides a tween from given position data to the given position.
    *
    * @param {import('../data/types').Data.TJSPositionDataRelative} fromData - The starting position.
    *
    * @param {import('../data/types').Data.TJSPositionDataRelative} toData - The ending position.
    *
    * @param {import('./types').AnimationAPI.TweenOptions} [options] - Optional tween parameters.
    *
    * @returns {import('#runtime/util/animate').BasicAnimation}  A control object that can cancel animation and
    *          provides a `finished` Promise.
    */
   fromTo(fromData, toData, options)
   {
      const animationControl = AnimationScheduler.fromTo(this.#position, fromData, toData, options);
      return animationControl ? animationControl : AnimationControl.voidControl;
   }

   /**
    * Provides a tween to given position data from the current position.
    *
    * @param {import('../data/types').Data.TJSPositionDataRelative} toData - The destination position.
    *
    * @param {import('./types').AnimationAPI.TweenOptions} [options] - Optional tween parameters.
    *
    * @returns {import('#runtime/util/animate').BasicAnimation}  A control object that can cancel animation and
    *          provides a `finished` Promise.
    */
   to(toData, options)
   {
      const animationControl = AnimationScheduler.to(this.#position, toData, options);
      return animationControl ? animationControl : AnimationControl.voidControl;
   }

   /**
    * Returns a function that provides an optimized way to constantly update a to-tween.
    *
    * @param {Iterable<import('./types').AnimationAPI.AnimationKey>}  keys - The keys for quickTo.
    *
    * @param {import('./types').AnimationAPI.QuickTweenOptions} [options] - Optional quick tween parameters.
    *
    * @returns {import('./types').AnimationAPI.QuickToCallback} quick-to tween function.
    */
   quickTo(keys, options = {})
   {
      if (!isIterable(keys))
      {
         throw new TypeError(`AnimationAPI.quickTo error: 'keys' is not an iterable list.`);
      }

      const parent = this.#position.parent;

      // Early out if the application is not positionable.
      if (parent !== void 0 && typeof parent?.options?.positionable === 'boolean' && !parent?.options?.positionable)
      {
         throw new Error(`AnimationAPI.quickTo error: 'parent' is not positionable.`);
      }

      let { duration = 1, ease = 'cubicOut' } = options;

      if (!Number.isFinite(duration) || duration < 0)
      {
         throw new TypeError(`AnimationAPI.quickTo error: 'duration' is not a positive number.`);
      }

      ease = getEasingFunc(ease, AnimationAPI.#getEaseOptions);

      if (typeof ease !== 'function')
      {
         throw new TypeError(
          `AnimationAPI.quickTo error: 'ease' is not a function or valid Svelte easing function name.`);
      }

      // TODO: In the future potentially support more interpolation functions besides `lerp`.

      const initial = {};
      const destination = {};

      const data = this.#data;

      // Set initial data if the key / data is defined and the end position is not equal to current data.
      for (const key of keys)
      {
         if (typeof key !== 'string')
         {
            throw new TypeError(`AnimationAPI.quickTo error: key ('${key}') is not a string.`);
         }

         if (!TJSPositionDataUtil.isAnimationKey(key))
         {
            throw new Error(`AnimationAPI.quickTo error: key ('${key}') is not animatable.`);
         }

         // Must use actual key from any aliases.
         const value = TJSPositionDataUtil.getDataOrDefault(data, key, true);

         if (value !== null)
         {
            destination[key] = value;
            initial[key] = value;
         }
      }

      const keysArray = [...keys];

      Object.freeze(keysArray);

      const newData = Object.assign({}, initial);

      /** @type {import('./types-local').AnimationData} */
      const animationData = {
         active: true,
         cancelled: false,
         control: void 0,
         current: 0,
         destination,
         duration: duration * 1000, // Internally the AnimationManager works in ms.
         ease,
         el: void 0,
         finished: true, // Note: start in finished state to add to AnimationManager on first callback.
         initial,
         interpolate: lerp,
         keys,
         newData,
         position: this.#position,
         resolve: void 0,
         start: void 0,
         quickTo: true
      };

      const quickToCB = /** @type {import('./types').AnimationAPI.QuickToCallback} */ (...args) =>
      {
         const argsLength = args.length;

         if (argsLength === 0) { return; }

         for (let cntr = keysArray.length; --cntr >= 0;)
         {
            const key = keysArray[cntr];

            // Must use actual key from any aliases.
            const animKey = TJSPositionDataUtil.getAnimationKey(key);

            if (data[animKey] !== void 0) { initial[key] = data[animKey]; }
         }

         // Handle case where the first arg is an object. Update all quickTo keys from data contained in the object.
         if (isObject(args[0]))
         {
            const objData = args[0];

            for (const key in objData)
            {
               if (destination[key] !== void 0) { destination[key] = objData[key]; }
            }
         }
         else // Assign each variable argument to the key specified in the initial `keys` array above.
         {
            for (let cntr = 0; cntr < argsLength && cntr < keysArray.length; cntr++)
            {
               const key = keysArray[cntr];
               if (destination[key] !== void 0) { destination[key] = args[cntr]; }
            }
         }

         // Set initial data for transform values that are often null by default.
         TJSPositionDataUtil.setNumericDefaults(initial);
         TJSPositionDataUtil.setNumericDefaults(destination);

         // Set target element to animation data to track if it is removed from the DOM hence ending the animation.
         const targetEl = A11yHelper.isFocusTarget(parent) ? parent : parent?.elementTarget;
         animationData.el = A11yHelper.isFocusTarget(targetEl) && targetEl.isConnected ? targetEl : void 0;

         ConvertStringData.process(destination, data, animationData.el);

         // Reschedule the quickTo animation with AnimationManager as it is finished.
         if (animationData.finished)
         {
            animationData.finished = false;
            animationData.active = true;
            animationData.current = 0;

            AnimationManager.add(animationData);
         }
         else // QuickTo animation is currently scheduled w/ AnimationManager so reset start and current time.
         {
            const now = globalThis.performance.now();

            // Offset start time by delta between last rAF time. This allows a delayed tween to start from the
            // precise delayed time.
            animationData.start = now + (AnimationManager.timeNow - now);
            animationData.current = 0;
         }
      };

      quickToCB.keys = keysArray;

      quickToCB.options = (optionsCB) => // eslint-disable-line no-shadow
      {
         let { duration, ease } = optionsCB;

         if (duration !== void 0 && (!Number.isFinite(duration) || duration < 0))
         {
            throw new TypeError(`AnimationAPI.quickTo.options error: 'duration' is not a positive number.`);
         }

         ease = getEasingFunc(ease, AnimationAPI.#getEaseOptions);

         if (ease !== void 0 && typeof ease !== 'function')
         {
            throw new TypeError(
             `AnimationAPI.quickTo.options error: 'ease' is not a function or valid Svelte easing function name.`);
         }

         // TODO: In the future potentially support more interpolation functions besides `lerp`.

         if (duration >= 0) { animationData.duration = duration * 1000; }
         if (ease) { animationData.ease = ease; }

         return quickToCB;
      };

      return quickToCB;
   }
}
