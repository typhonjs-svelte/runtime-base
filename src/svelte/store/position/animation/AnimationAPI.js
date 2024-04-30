import { lerp }                  from '#runtime/math/interpolate';

import { getEasingFunc }         from '#runtime/svelte/easing';

import { A11yHelper }            from '#runtime/util/browser';

import {
   isIterable,
   isObject }                    from '#runtime/util/object';

import { AnimationControl }      from './AnimationControl.js';
import { AnimationManager }      from './AnimationManager.js';

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
   }

   /**
    * Returns whether there are scheduled animations whether active or pending for this {@link TJSPosition}.
    *
    * @returns {boolean} True if scheduled / false if not.
    */
   get isScheduled()
   {
      return AnimationManager.isScheduled(this.#position);
   }

   /**
    * Adds / schedules an animation w/ the AnimationManager. This contains the final steps common to all tweens.
    *
    * @param {object}      initial -
    *
    * @param {object}      destination -
    *
    * @param {number}      duration -
    *
    * @param {HTMLElement} el -
    *
    * @param {number}      delay -
    *
    * @param {import('#runtime/svelte/easing').EasingFunction}    ease -
    *
    * @param {import('#runtime/math/interpolate').InterpolateFunction}    interpolate -
    *
    * @returns {import('#runtime/util/animate').BasicAnimation} The associated animation control.
    */
   #addAnimation(initial, destination, duration, el, delay, ease, interpolate)
   {
      // Set initial data for transform values that are often null by default.
      TJSPositionDataUtil.setNumericDefaults(initial);
      TJSPositionDataUtil.setNumericDefaults(destination);

      // Reject all initial data that is not a number.
      for (const key in initial)
      {
         if (!Number.isFinite(initial[key])) { delete initial[key]; }
      }

      const keys = Object.keys(initial);
      const newData = Object.assign({}, initial);

      // Nothing to animate, so return now.
      if (keys.length === 0) { return AnimationControl.voidControl; }

      /** @type {import('./types-local').AnimationData} */
      const animationData = {
         active: true,
         cancelled: false,
         control: void 0,
         current: 0,
         destination,
         duration: duration * 1000, // Internally the AnimationManager works in ms.
         ease,
         el,
         finished: false,
         initial,
         interpolate,
         keys,
         newData,
         position: this.#position,
         resolve: void 0,
         start: void 0
      };

      if (delay > 0)
      {
         animationData.active = false;

         // Delay w/ setTimeout and schedule w/ AnimationManager if not already canceled
         setTimeout(() =>
         {
            if (!animationData.cancelled)
            {
               animationData.active = true;

               const now = performance.now();

               // Offset start time by delta between last rAF time. This allows a delayed tween to start from the
               // precise delayed time.
               animationData.start = now + (AnimationManager.current - now);
            }
         }, delay * 1000);
      }

      // Schedule immediately w/ AnimationManager
      AnimationManager.add(animationData);

      // Create animation control
      return new AnimationControl(animationData, true);
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
   from(fromData, { delay = 0, duration = 1, ease = 'cubicOut', interpolate = lerp } = {})
   {
      if (!isObject(fromData))
      {
         throw new TypeError(`AnimationAPI.from error: 'fromData' is not an object.`);
      }

      const position = this.#position;
      const parent = position.parent;

      // Early out if the application is not positionable.
      if (parent !== void 0 && typeof parent?.options?.positionable === 'boolean' && !parent?.options?.positionable)
      {
         return AnimationControl.voidControl;
      }

      // Cache any target element allowing AnimationManager to stop animation if it becomes disconnected from DOM.
      const targetEl = A11yHelper.isFocusTarget(parent) ? parent : parent?.elementTarget;
      const el = A11yHelper.isFocusTarget(targetEl) && targetEl.isConnected ? targetEl : void 0;

      if (!Number.isFinite(delay) || delay < 0)
      {
         throw new TypeError(`AnimationAPI.from error: 'delay' is not a positive number.`);
      }

      if (!Number.isFinite(duration) || duration < 0)
      {
         throw new TypeError(`AnimationAPI.from error: 'duration' is not a positive number.`);
      }

      ease = getEasingFunc(ease, AnimationAPI.#getEaseOptions);

      if (typeof ease !== 'function')
      {
         throw new TypeError(`AnimationAPI.from error: 'ease' is not a function or valid Svelte easing function name.`);
      }

      if (typeof interpolate !== 'function')
      {
         throw new TypeError(`AnimationAPI.from error: 'interpolate' is not a function.`);
      }

      const initial = {};
      const destination = {};

      const data = this.#data;

      // Set initial data if the key / data is defined and the end position is not equal to current data.
      for (const key in fromData)
      {
         // Must use actual key from any aliases.
         const animKey = TJSPositionDataUtil.getAnimationKey(key);

         if (data[animKey] !== void 0 && fromData[key] !== data[animKey])
         {
            initial[key] = fromData[key];
            destination[key] = data[animKey];
         }
      }

      ConvertStringData.process(initial, data, el);

      return this.#addAnimation(initial, destination, duration, el, delay, ease, interpolate);
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
   fromTo(fromData, toData, { delay = 0, duration = 1, ease = 'cubicOut', interpolate = lerp } = {})
   {
      if (!isObject(fromData))
      {
         throw new TypeError(`AnimationAPI.fromTo error: 'fromData' is not an object.`);
      }

      if (!isObject(toData))
      {
         throw new TypeError(`AnimationAPI.fromTo error: 'toData' is not an object.`);
      }

      const parent = this.#position.parent;

      // Early out if the application is not positionable.
      if (parent !== void 0 && typeof parent?.options?.positionable === 'boolean' && !parent?.options?.positionable)
      {
         return AnimationControl.voidControl;
      }

      // Cache any target element allowing AnimationManager to stop animation if it becomes disconnected from DOM.
      const targetEl = A11yHelper.isFocusTarget(parent) ? parent : parent?.elementTarget;
      const el = A11yHelper.isFocusTarget(targetEl) && targetEl.isConnected ? targetEl : void 0;

      if (!Number.isFinite(delay) || delay < 0)
      {
         throw new TypeError(`AnimationAPI.fromTo error: 'delay' is not a positive number.`);
      }

      if (!Number.isFinite(duration) || duration < 0)
      {
         throw new TypeError(`AnimationAPI.fromTo error: 'duration' is not a positive number.`);
      }

      ease = getEasingFunc(ease, AnimationAPI.#getEaseOptions);

      if (typeof ease !== 'function')
      {
         throw new TypeError(
          `AnimationAPI.fromTo error: 'ease' is not a function or valid Svelte easing function name.`);
      }

      if (typeof interpolate !== 'function')
      {
         throw new TypeError(`AnimationAPI.fromTo error: 'interpolate' is not a function.`);
      }

      const initial = {};
      const destination = {};

      const data = this.#data;

      // Set initial data if the key / data is defined and the end position is not equal to current data.
      for (const key in fromData)
      {
         if (toData[key] === void 0)
         {
            console.warn(
             `AnimationAPI.fromTo warning: key ('${key}') from 'fromData' missing in 'toData'; skipping this key.`);
            continue;
         }

         // Must use actual key from any aliases.
         const animKey = TJSPositionDataUtil.getAnimationKey(key);

         if (data[animKey] !== void 0)
         {
            initial[key] = fromData[key];
            destination[key] = toData[key];
         }
      }

      ConvertStringData.process(initial, data, el);
      ConvertStringData.process(destination, data, el);

      return this.#addAnimation(initial, destination, duration, el, delay, ease, interpolate);
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
   to(toData, { delay = 0, duration = 1, ease = 'cubicOut', interpolate = lerp } = {})
   {
      if (!isObject(toData))
      {
         throw new TypeError(`AnimationAPI.to error: 'toData' is not an object.`);
      }

      const parent = this.#position.parent;

      // Early out if the application is not positionable.
      if (parent !== void 0 && typeof parent?.options?.positionable === 'boolean' && !parent?.options?.positionable)
      {
         return AnimationControl.voidControl;
      }

      // Cache any target element allowing AnimationManager to stop animation if it becomes disconnected from DOM.
      const targetEl = A11yHelper.isFocusTarget(parent) ? parent : parent?.elementTarget;
      const el = A11yHelper.isFocusTarget(targetEl) && targetEl.isConnected ? targetEl : void 0;

      if (!Number.isFinite(delay) || delay < 0)
      {
         throw new TypeError(`AnimationAPI.to error: 'delay' is not a positive number.`);
      }

      if (!Number.isFinite(duration) || duration < 0)
      {
         throw new TypeError(`AnimationAPI.to error: 'duration' is not a positive number.`);
      }

      ease = getEasingFunc(ease, AnimationAPI.#getEaseOptions);

      if (typeof ease !== 'function')
      {
         throw new TypeError(`AnimationAPI.to error: 'ease' is not a function or valid Svelte easing function name.`);
      }

      if (typeof interpolate !== 'function')
      {
         throw new TypeError(`AnimationAPI.to error: 'interpolate' is not a function.`);
      }

      const initial = {};
      const destination = {};

      const data = this.#data;

      // Set initial data if the key / data is defined and the end position is not equal to current data.
      for (const key in toData)
      {
         // Must use actual key from any aliases.
         const animKey = TJSPositionDataUtil.getAnimationKey(key);

         if (data[animKey] !== void 0 && toData[key] !== data[animKey])
         {
            destination[key] = toData[key];
            initial[key] = data[animKey];
         }
      }

      ConvertStringData.process(destination, data, el);

      return this.#addAnimation(initial, destination, duration, el, delay, ease, interpolate);
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
   quickTo(keys, { duration = 1, ease = 'cubicOut', interpolate = lerp } = {})
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

      if (typeof interpolate !== 'function')
      {
         throw new TypeError(`AnimationAPI.quickTo error: 'interpolate' is not a function.`);
      }

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
         interpolate,
         keys,
         newData,
         position: this.#position,
         resolve: void 0,
         start: void 0
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
            const now = performance.now();

            // Offset start time by delta between last rAF time. This allows a delayed tween to start from the
            // precise delayed time.
            animationData.start = now + (AnimationManager.current - now);
            animationData.current = 0;
         }
      };

      quickToCB.keys = keysArray;

      quickToCB.options = ({ duration, ease, interpolate } = {}) => // eslint-disable-line no-shadow
      {
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

         if (interpolate !== void 0 && typeof interpolate !== 'function')
         {
            throw new TypeError(`AnimationAPI.quickTo.options error: 'interpolate' is not a function.`);
         }

         if (duration >= 0) { animationData.duration = duration * 1000; }
         if (ease) { animationData.ease = ease; }
         if (interpolate) { animationData.interpolate = interpolate; }

         return quickToCB;
      };

      return quickToCB;
   }
}
