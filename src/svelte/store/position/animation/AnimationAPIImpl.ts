import { lerp }                  from '#runtime/math/interpolate';

import { getEasingFunc }         from '#runtime/svelte/easing';

import { A11yHelper }            from '#runtime/util/a11y';

import {
   isIterable,
   isObject }                    from '#runtime/util/object';

import { AnimationControl }      from './AnimationControl';
import { AnimationManager }      from './AnimationManager';
import { AnimationScheduler }    from './AnimationScheduler';

import {
   ConvertStringData,
   TJSPositionDataUtil }         from '../data';

import { NumberGuard }           from '../util';

import type { BasicAnimation }   from '#runtime/util/animate';

import type { AnimationAPI }     from './types';

import type { TJSPosition }      from '../TJSPosition';
import type { Data }             from '../data/types';

import type { AnimationData }    from './types-local';

/**
 */
export class AnimationAPIImpl implements AnimationAPI
{
   static #getEaseOptions: Readonly<{ default: false }> = Object.freeze({ default: false });

   /**
    */
   readonly #data: Data.TJSPositionData;

   readonly #position: TJSPosition;

   /**
    * @param position -
    *
    * @param data -
    */
   constructor(position: TJSPosition, data: Data.TJSPositionData)
   {
      this.#position = position;
      this.#data = data;

      Object.seal(this);
   }

   /**
    * Returns if there are scheduled animations whether active or pending for this TJSPosition instance.
    *
    * @returns Are there scheduled animations.
    */
   get isScheduled(): boolean
   {
      return AnimationManager.isScheduled(this.#position);
   }

   /**
    * Cancels all animation instances for this TJSPosition instance.
    */
   cancel(): void
   {
      AnimationManager.cancel(this.#position, AnimationManager.cancelAllFn);
   }

   /**
    * Returns all currently scheduled AnimationControl instances for this TJSPosition instance.
    *
    * @returns All currently scheduled animation controls for this TJSPosition instance.
    */
   getScheduled(): BasicAnimation[]
   {
      return AnimationManager.getScheduled(this.#position);
   }

   /**
    * Provides a tween from given position data to the current position.
    *
    * @param fromData - The starting position.
    *
    * @param [options] - Optional tween parameters.
    *
    * @returns A control object that can cancel animation and provides a `finished` Promise.
    */
   from(fromData: Data.TJSPositionDataRelative, options: AnimationAPI.TweenOptions):
    BasicAnimation
   {
      const animationControl: AnimationControl | null = AnimationScheduler.from(this.#position, fromData, options);
      return animationControl ? animationControl : AnimationControl.voidControl;
   }

   /**
    * Provides a tween from given position data to the given position.
    *
    * @param fromData - The starting position.
    *
    * @param toData - The ending position.
    *
    * @param [options] - Optional tween parameters.
    *
    * @returns A control object that can cancel animation and provides a `finished` Promise.
    */
   fromTo(fromData: Data.TJSPositionDataRelative, toData: Data.TJSPositionDataRelative,
          options: AnimationAPI.TweenOptions): BasicAnimation
   {
      const animationControl: AnimationControl | null = AnimationScheduler.fromTo(this.#position, fromData, toData,
       options);

      return animationControl ? animationControl : AnimationControl.voidControl;
   }

   /**
    * Provides a tween to given position data from the current position.
    *
    * @param toData - The destination position.
    *
    * @param [options] - Optional tween parameters.
    *
    * @returns A control object that can cancel animation and provides a `finished` Promise.
    */
   to(toData: Data.TJSPositionDataRelative, options: AnimationAPI.TweenOptions):
    BasicAnimation
   {
      const animationControl: AnimationControl | null = AnimationScheduler.to(this.#position, toData, options);
      return animationControl ? animationControl : AnimationControl.voidControl;
   }

   /**
    * Returns a function that provides an optimized way to constantly update a to-tween.
    *
    * @param keys - The keys for quickTo.
    *
    * @param [options] - Optional quick tween parameters.
    *
    * @returns quick-to tween function.
    */
   quickTo(keys: Iterable<AnimationAPI.AnimationKey>, options:
    AnimationAPI.QuickTweenOptions = {}): AnimationAPI.QuickToCallback
   {
      if (!isIterable(keys))
      {
         throw new TypeError(`AnimationAPI.quickTo error: 'keys' is not an iterable list.`);
      }

      // TJSPosition.PositionParent
      const parent: any = this.#position.parent;

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

      ease = getEasingFunc(ease, AnimationAPIImpl.#getEaseOptions);

      if (typeof ease !== 'function')
      {
         throw new TypeError(
          `AnimationAPI.quickTo error: 'ease' is not a function or valid Svelte easing function name.`);
      }

      // TODO: In the future potentially support more interpolation functions besides `lerp`.

      const initial = {};
      const destination = {};

      const data: Data.TJSPositionData = this.#data;

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
         const value: number = TJSPositionDataUtil.getDataOrDefault(data, key, true);

         if (value !== null)
         {
            destination[key] = value;
            initial[key] = value;
         }
      }

      const keysArray: AnimationAPI.AnimationKey[] = [...keys];

      Object.freeze(keysArray);

      const newData = Object.assign({}, initial);

      const animationData: AnimationData = {
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
         keys: keysArray,
         newData,
         position: this.#position,
         resolve: void 0,
         start: 0,
         quickTo: true
      };

      const quickToCB: Function = (...args: any[]): void =>
      {
         const argsLength: number = args.length;

         if (argsLength === 0) { return; }

         for (let cntr: number = keysArray.length; --cntr >= 0;)
         {
            const key: AnimationAPI.AnimationKey = keysArray[cntr];

            // Must use actual key from any aliases.
            const animKey: AnimationAPI.AnimationKey = TJSPositionDataUtil.getAnimationKey(key);

            if (data[animKey] !== void 0) { initial[key] = data[animKey]; }
         }

         // Handle case where the first arg is an object. Update all quickTo keys from data contained in the object.
         if (isObject(args[0]))
         {
            const objData: Record<string, unknown> = args[0];

            for (const key in objData)
            {
               if (destination[key] !== void 0) { destination[key] = objData[key]; }
            }
         }
         else // Assign each variable argument to the key specified in the initial `keys` array above.
         {
            for (let cntr: number = 0; cntr < argsLength && cntr < keysArray.length; cntr++)
            {
               const key: AnimationAPI.AnimationKey = keysArray[cntr];
               if (destination[key] !== void 0) { destination[key] = args[cntr]; }
            }
         }

         // Set initial data for transform values that are often null by default.
         TJSPositionDataUtil.setNumericDefaults(initial);
         TJSPositionDataUtil.setNumericDefaults(destination);

         // Set target element to animation data to track if it is removed from the DOM hence ending the animation.
         const targetEl: Element = A11yHelper.isFocusTarget(parent) ? parent : parent?.elementTarget;
         animationData.el = A11yHelper.isFocusTarget(targetEl) && targetEl.isConnected ? targetEl : void 0;

         ConvertStringData.process(destination, data, animationData.el!);

         // Reschedule the quickTo animation with AnimationManager as it is finished.
         if (animationData.finished)
         {
            animationData.cancelled = false;
            animationData.finished = false;
            animationData.active = true;
            animationData.current = 0;

            AnimationManager.add(animationData);
         }
         else // QuickTo animation is currently scheduled w/ AnimationManager so reset start and current time.
         {
            const now: number = globalThis.performance.now();

            animationData.cancelled = false;
            animationData.current = 0;

            // Offset start time by delta between last rAF time. This allows a delayed tween to start from the
            // precise delayed time.
            animationData.start = now + (AnimationManager.timeNow - now);
         }
      };

      Object.defineProperty(quickToCB, 'keys', {
         value: keysArray,
         writable: false,
         configurable: false
      });

      Object.defineProperty(quickToCB, 'options', {
         value: (optionsCB: AnimationAPI.QuickTweenOptions):
          AnimationAPI.QuickToCallback =>
         {
            let { duration, ease } = optionsCB;

            if (duration !== void 0 && (!Number.isFinite(duration) || duration < 0))
            {
               throw new TypeError(`AnimationAPI.quickTo.options error: 'duration' is not a positive number.`);
            }

            ease = getEasingFunc(ease!, AnimationAPIImpl.#getEaseOptions);

            if (ease !== void 0 && typeof ease !== 'function')
            {
               throw new TypeError(
                `AnimationAPI.quickTo.options error: 'ease' is not a function or valid Svelte easing function name.`);
            }

            // TODO: In the future potentially support more interpolation functions besides `lerp`.

            if (NumberGuard.isFinite(duration) && duration >= 0) { animationData.duration = duration * 1000; }
            if (ease) { animationData.ease = ease; }

            return quickToCB as AnimationAPI.QuickToCallback;
         },
         writable: false,
         configurable: false
      });

      return quickToCB as AnimationAPI.QuickToCallback;
   }
}
