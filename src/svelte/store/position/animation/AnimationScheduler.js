import { lerp }                  from '#runtime/math/interpolate';

import { getEasingFunc }         from '#runtime/svelte/easing';

import { A11yHelper }            from '#runtime/util/browser';

import { isObject }              from '#runtime/util/object';

import { AnimationControl }      from './AnimationControl.js';
import { AnimationManager }      from './AnimationManager.js';

import {
   ConvertStringData,
   TJSPositionDataUtil }         from '../data';

export class AnimationScheduler
{
   /**
    * Used to copy data from a TJSPosition instance.
    *
    * @type {import('../data/types').Data.TJSPositionData}
    */
   static #data = {};

   static #getEaseOptions = Object.freeze({ default: false });

   /**
    * Adds / schedules an animation w/ the AnimationManager. This contains the final steps common to all tweens.
    *
    * @param {import('../').TJSPosition} position -
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
    * @param {import('#runtime/math/interpolate').InterpolateFunction}    [interpolate=lerp] -
    *
    * @param {import('./types-local').AnimationCleanupFunction} [cleanup] -
    *
    * @returns {import('./AnimationControl').AnimationControl | null} An AnimationControl instance or null if none
    *          created.
    */
   static addAnimation(position, initial, destination, duration, el, delay, ease, interpolate = lerp, cleanup)
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
      // TODO handle in respective animation controls.

      if (keys.length === 0) { return null; }

      /** @type {import('./types-local').AnimationData} */
      const animationData = {
         active: true,
         cleanup,
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
         position,
         resolve: void 0,
         start: void 0,
         quickTo: false
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
               animationData.start = now + (AnimationManager.timeNow - now);
            }
         }, delay * 1000);
      }

      // Schedule immediately w/ AnimationManager
      AnimationManager.add(animationData);

      // Create animation control
      return new AnimationControl(animationData, true);
   }

   /**
    * Provides a tween from given position data to the current position.
    *
    * @param {import('../').TJSPosition} position - The target position instance.
    *
    * @param {import('../data/types').Data.TJSPositionDataRelative} fromData - The starting position.
    *
    * @param {import('./types').AnimationAPI.TweenOptions} options - Tween options.
    *
    * @param {import('./types-local').AnimationCleanupFunction} [cleanup] - Custom animation cleanup function.
    *
    * @returns {import('./AnimationControl').AnimationControl | null} An AnimationControl instance or null if none
    *          created.
    */
   static from(position, fromData, options = {}, cleanup)
   {
      if (!isObject(fromData))
      {
         throw new TypeError(`AnimationAPI.from error: 'fromData' is not an object.`);
      }

      const parent = position.parent;

      // Early out if the application is not positionable.
      if (parent !== void 0 && typeof parent?.options?.positionable === 'boolean' && !parent?.options?.positionable)
      {
         return null;
      }

      let { delay = 0, duration = 1, ease = 'cubicOut' } = options;

      // Cache any target element allowing AnimationManager to stop animation if it becomes disconnected from DOM.
      const targetEl = A11yHelper.isFocusTarget(parent) ? parent : parent?.elementTarget;
      const el = A11yHelper.isFocusTarget(targetEl) && targetEl.isConnected ? targetEl : void 0;

      if (!Number.isFinite(delay) || delay < 0)
      {
         throw new TypeError(`AnimationScheduler.from error: 'delay' is not a positive number.`);
      }

      if (!Number.isFinite(duration) || duration < 0)
      {
         throw new TypeError(`AnimationScheduler.from error: 'duration' is not a positive number.`);
      }

      ease = getEasingFunc(ease, this.#getEaseOptions);

      if (typeof ease !== 'function')
      {
         throw new TypeError(
          `AnimationScheduler.from error: 'ease' is not a function or valid Svelte easing function name.`);
      }

      // TODO: In the future potentially support more interpolation functions besides `lerp`.

      const initial = {};
      const destination = {};

      position.get(this.#data);

      // Set initial data if the key / data is defined and the end position is not equal to current data.
      for (const key in fromData)
      {
         // Must use actual key from any aliases.
         const animKey = TJSPositionDataUtil.getAnimationKey(key);

         if (this.#data[animKey] !== void 0 && fromData[key] !== this.#data[animKey])
         {
            initial[key] = fromData[key];
            destination[key] = this.#data[animKey];
         }
      }

      ConvertStringData.process(initial, this.#data, el);

      return this.addAnimation(position, initial, destination, duration, el, delay, ease, lerp, cleanup);
   }

   /**
    * Provides a tween from given position data to the given position.
    *
    * @param {import('../').TJSPosition} position - The target position instance.
    *
    * @param {import('../data/types').Data.TJSPositionDataRelative} fromData - The starting position.
    *
    * @param {import('../data/types').Data.TJSPositionDataRelative} toData - The ending position.
    *
    * @param {import('./types').AnimationAPI.TweenOptions} options - Tween options.
    *
    * @param {import('./types-local').AnimationCleanupFunction} [cleanup] - Custom animation cleanup function.
    *
    * @returns {import('./AnimationControl').AnimationControl | null} An AnimationControl instance or null if none
    *          created.
    */
   static fromTo(position, fromData, toData, options = {}, cleanup)
   {
      if (!isObject(fromData))
      {
         throw new TypeError(`AnimationScheduler.fromTo error: 'fromData' is not an object.`);
      }

      if (!isObject(toData))
      {
         throw new TypeError(`AnimationScheduler.fromTo error: 'toData' is not an object.`);
      }

      const parent = position.parent;

      // Early out if the application is not positionable.
      if (parent !== void 0 && typeof parent?.options?.positionable === 'boolean' && !parent?.options?.positionable)
      {
         return null;
      }

      let { delay = 0, duration = 1, ease = 'cubicOut' } = options;

      // Cache any target element allowing AnimationManager to stop animation if it becomes disconnected from DOM.
      const targetEl = A11yHelper.isFocusTarget(parent) ? parent : parent?.elementTarget;
      const el = A11yHelper.isFocusTarget(targetEl) && targetEl.isConnected ? targetEl : void 0;

      if (!Number.isFinite(delay) || delay < 0)
      {
         throw new TypeError(`AnimationScheduler.fromTo error: 'delay' is not a positive number.`);
      }

      if (!Number.isFinite(duration) || duration < 0)
      {
         throw new TypeError(`AnimationScheduler.fromTo error: 'duration' is not a positive number.`);
      }

      ease = getEasingFunc(ease, this.#getEaseOptions);

      if (typeof ease !== 'function')
      {
         throw new TypeError(
          `AnimationScheduler.fromTo error: 'ease' is not a function or valid Svelte easing function name.`);
      }

      // TODO: In the future potentially support more interpolation functions besides `lerp`.

      const initial = {};
      const destination = {};

      position.get(this.#data);

      // Set initial data if the key / data is defined and the end position is not equal to current data.
      for (const key in fromData)
      {
         if (toData[key] === void 0)
         {
            console.warn(`AnimationScheduler.fromTo warning: skipping key ('${
             key}') from 'fromData' as it is missing in 'toData'.`);

            continue;
         }

         // Must use actual key from any aliases.
         const animKey = TJSPositionDataUtil.getAnimationKey(key);

         if (this.#data[animKey] !== void 0)
         {
            initial[key] = fromData[key];
            destination[key] = toData[key];
         }
      }

      ConvertStringData.process(initial, this.#data, el);
      ConvertStringData.process(destination, this.#data, el);

      return this.addAnimation(position, initial, destination, duration, el, delay, ease, lerp, cleanup);
   }

   /**
    * Provides a tween to given position data from the current position.
    *
    * @param {import('../').TJSPosition} position - The target position instance.
    *
    * @param {import('../data/types').Data.TJSPositionDataRelative} toData - The destination position.
    *
    * @param {import('./types').AnimationAPI.TweenOptions} options - Tween options.
    *
    * @param {import('./types-local').AnimationCleanupFunction} [cleanup] - Custom animation cleanup function.
    *
    * @returns {import('./AnimationControl').AnimationControl | null} An AnimationControl instance or null if none
    *          created.
    */
   static to(position, toData, options = {}, cleanup)
   {
      if (!isObject(toData))
      {
         throw new TypeError(`AnimationScheduler.to error: 'toData' is not an object.`);
      }

      const parent = position.parent;

      // Early out if the application is not positionable.
      if (parent !== void 0 && typeof parent?.options?.positionable === 'boolean' && !parent?.options?.positionable)
      {
         return null;
      }

      let { delay = 0, duration = 1, ease = 'cubicOut' } = options;

      // Cache any target element allowing AnimationManager to stop animation if it becomes disconnected from DOM.
      const targetEl = A11yHelper.isFocusTarget(parent) ? parent : parent?.elementTarget;
      const el = A11yHelper.isFocusTarget(targetEl) && targetEl.isConnected ? targetEl : void 0;

      if (!Number.isFinite(delay) || delay < 0)
      {
         throw new TypeError(`AnimationScheduler.to error: 'delay' is not a positive number.`);
      }

      if (!Number.isFinite(duration) || duration < 0)
      {
         throw new TypeError(`AnimationScheduler.to error: 'duration' is not a positive number.`);
      }

      ease = getEasingFunc(ease, this.#getEaseOptions);

      if (typeof ease !== 'function')
      {
         throw new TypeError(
          `AnimationScheduler.to error: 'ease' is not a function or valid Svelte easing function name.`);
      }

      // TODO: In the future potentially support more interpolation functions besides `lerp`.

      const initial = {};
      const destination = {};

      position.get(this.#data);

      // Set initial data if the key / data is defined and the end position is not equal to current data.
      for (const key in toData)
      {
         // Must use actual key from any aliases.
         const animKey = TJSPositionDataUtil.getAnimationKey(key);

         if (this.#data[animKey] !== void 0 && toData[key] !== this.#data[animKey])
         {
            destination[key] = toData[key];
            initial[key] = this.#data[animKey];
         }
      }

      ConvertStringData.process(destination, this.#data, el);

      return this.addAnimation(position, initial, destination, duration, el, delay, ease, lerp, cleanup);
   }
}