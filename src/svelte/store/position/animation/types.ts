import type { EasingFunction }      from 'svelte/transition';

import type { InterpolateFunction } from '#runtime/math/interpolate';
import type { TJSBasicAnimation }   from '#runtime/util/animate';

import type {
   TJSPosition,
   TJSPositionDataExtended,
   TJSPositionGroup }               from '../index.js';

interface IAnimationAPI
{
   /**
    * Returns whether there are scheduled animations whether active or delayed for this TJSPosition.
    *
    * @returns {boolean} Are there active animation instances.
    */
   get isScheduled(): boolean;

   /**
    * Cancels all animation instances for this TJSPosition instance.
    */
   cancel(): void;

   /**
    * Returns all currently scheduled AnimationControl instances for this TJSPosition instance.
    *
    * @returns {TJSBasicAnimation[]} All currently scheduled animation controls for this TJSPosition instance.
    */
   getScheduled(): TJSBasicAnimation[];

   /**
    * Provides a tween from given position data to the current position.
    *
    * @param {TJSPositionDataExtended} fromData - The starting position.
    *
    * @param {IAnimationAPI.TweenOptions} [options] - Optional tween parameters.
    *
    * @returns {TJSBasicAnimation}  A control object that can cancel animation and provides a `finished` Promise.
    */
   from(fromData: TJSPositionDataExtended, options?: IAnimationAPI.TweenOptions): TJSBasicAnimation;

   /**
    * Provides a tween from given position data to the current position.
    *
    * @param {TJSPositionDataExtended} fromData - The starting position.
    *
    * @param {TJSPositionDataExtended} toData - The ending position.
    *
    * @param {IAnimationAPI.TweenOptions} [options] - Optional tween parameters.
    *
    * @returns {TJSBasicAnimation}  A control object that can cancel animation and provides a `finished` Promise.
    */
   fromTo(fromData: TJSPositionDataExtended, toData: TJSPositionDataExtended, options?: IAnimationAPI.TweenOptions):
    TJSBasicAnimation;

   /**
    * Provides a tween to given position data from the current position.
    *
    * @param {TJSPositionDataExtended} toData - The destination position.
    *
    * @param {IAnimationAPI.TweenOptions} [options] - Optional tween parameters.
    *
    * @returns {TJSBasicAnimation}  A control object that can cancel animation and provides a `finished` Promise.
    */
   to(toData: TJSPositionDataExtended, options?: IAnimationAPI.TweenOptions): TJSBasicAnimation;

   /**
    * Returns a function that provides an optimized way to constantly update a to-tween.
    *
    * @param {Iterable<IAnimationAPI.AnimationKeys>}  keys - The keys for quickTo.
    *
    * @param {IAnimationAPI.QuickTweenOptions} [options] - Optional quick tween parameters.
    *
    * @returns {IAnimationAPI.quickToCallback} quick-to tween function.
    */
   quickTo(keys: Iterable<IAnimationAPI.AnimationKeys>, options?: IAnimationAPI.QuickTweenOptions):
    IAnimationAPI.quickToCallback;
}

/**
 * Provides a public API for grouping multiple {@link TJSPosition} animations together and is accessible from
 * {@link TJSPosition.Animate}.
 *
 *
 * @see IAnimationAPI
 */
interface IAnimationGroupAPI
{
   /**
    * Cancels any animation for given TJSPositionGroup data.
    *
    * @param {TJSPositionGroup} position - The position group to cancel.
    */
   cancel(position: TJSPositionGroup): void;

   /**
    * Cancels all TJSPosition animation.
    */
   cancelAll(): void;

   /**
    * Gets all animation controls for the given position group data.
    *
    * @param {TJSPositionGroup} position - A position group.
    *
    * @returns {{ position: TJSPosition, data: object | undefined, controls: TJSBasicAnimation[]}[]} Results array.
    */
   getScheduled(position: TJSPositionGroup): {
      position: TJSPosition,
      data: object | undefined,
      controls: TJSBasicAnimation[]
   }[];

   /**
    * Provides the `from` animation tween for one or more TJSPosition instances as a group.
    *
    * @param {TJSPositionGroup}  position - A position group.
    *
    * @param {object | Function} fromData -
    *
    * @param {IAnimationAPI.TweenOptions | (() => IAnimationAPI.TweenOptions)}   [options] -
    *
    * @returns {TJSBasicAnimation} Basic animation control.
    */
   from(position: TJSPositionGroup, fromData: object | Function, options?: IAnimationAPI.TweenOptions |
    (() => IAnimationAPI.TweenOptions)): TJSBasicAnimation;

   /**
    * Provides the `fromTo` animation tween for one or more TJSPosition instances as a group.
    *
    * @param {TJSPositionGroup} position -
    *
    * @param {object | Function}   fromData -
    *
    * @param {object | Function}   toData -
    *
    * @param {object | Function}   [options] -
    *
    * @returns {TJSBasicAnimation} Basic animation control.
    */
   fromTo(position: TJSPositionGroup, fromData: object | Function, toData: object | Function,
    options?: object | Function): TJSBasicAnimation;

   /**
    * Provides the `to` animation tween for one or more TJSPosition instances as a group.
    *
    * @param {TJSPositionGroup} position -
    *
    * @param {object | Function}   toData -
    *
    * @param {object | Function}   [options] -
    *
    * @returns {TJSBasicAnimation} Basic animation control.
    */
   to(position: TJSPositionGroup, toData: object | Function, options?: object | Function): TJSBasicAnimation;

   /**
    * Provides the `to` animation tween for one or more TJSPosition instances as a group.
    *
    * @param {TJSPositionGroup} position -
    *
    * @param {Iterable<IAnimationAPI.AnimationKeys>}  keys -
    *
    * @param {IAnimationAPI.QuickTweenOptions | (() => IAnimationAPI.QuickTweenOptions)}  [options] -
    *
    * @returns {IAnimationAPI.quickToCallback} quick-to tween function.
    */
   quickTo(position: TJSPositionGroup, keys: Iterable<IAnimationAPI.AnimationKeys>,
    options?: IAnimationAPI.QuickTweenOptions | (() => IAnimationAPI.QuickTweenOptions)): IAnimationAPI.quickToCallback;
}

namespace IAnimationAPI {
   /**
    * The position keys that can be animated.
    */
   export type AnimationKeys =
   // Main keys
    'left' | 'top' | 'maxWidth' | 'maxHeight' | 'minWidth' | 'minHeight' | 'width' | 'height' |
    'rotateX' | 'rotateY' | 'rotateZ' | 'scale' | 'translateX' | 'translateY' | 'translateZ' | 'zIndex' |

    // Aliases
    'rotation';

   /**
    * Defines the quick tweening options.
    */
   export type QuickTweenOptions = {
      /**
       * Duration in seconds; default: 1
       */
      duration?: number;

      /**
       * Easing function; default: cubicOut
       */
      ease?: EasingFunction;

      /**
       * Interpolation function; default: lerp
       */
      interpolate?: InterpolateFunction;
   };

   /**
    * Defines the tweening options.
    */
   export type TweenOptions = QuickTweenOptions & {
      /**
       * Delay in seconds before animation starts; default: 0
       */
      delay?: number;
   };

   export interface quickToCallback extends Function
   {
      /**
       * @param args - Individual numbers corresponding to the order in which animation keys are specified.
       */
      (...args: number[]): void;

      /**
       * @param arg - A single object with animation keys specified and numerical values.
       */
      (arg: Record<AnimationKeys, number>): void;

      /**
       * The keys assigned for this quickTo callback.
       */
      readonly keys: AnimationKeys[];

      /**
       * Sets options of quickTo tween.
       *
       * @param data - Quick tween options.
       *
       * @returns This quickTo callback function.
       */
      options: (data: QuickTweenOptions) => quickToCallback;
   }
}

export {
   IAnimationAPI,
   IAnimationGroupAPI
}
