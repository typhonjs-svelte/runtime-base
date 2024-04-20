import type { EasingFunction }         from 'svelte/transition';

import type { InterpolateFunction }    from '#runtime/math/interpolate';

import type { IBasicAnimation }        from '#runtime/util/animate';

import type { Data }                   from '../data/types';

import type { TJSPositionTypes }       from '../types';

import type { TJSPosition }            from '../TJSPosition.js';

interface AnimationAPI
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
    * @returns {IBasicAnimation[]} All currently scheduled animation controls for this TJSPosition instance.
    */
   getScheduled(): IBasicAnimation[];

   /**
    * Provides a tween from given position data to the current position.
    *
    * @param {Partial<Data.TJSPositionData>} fromData - The starting position.
    *
    * @param {AnimationAPI.TweenOptions} [options] - Optional tween parameters.
    *
    * @returns {IBasicAnimation}  A control object that can cancel animation and provides a `finished` Promise.
    */
   from(fromData: Partial<Data.TJSPositionData>, options?: AnimationAPI.TweenOptions): IBasicAnimation;

   /**
    * Provides a tween from given position data to the current position.
    *
    * @param {Partial<Data.TJSPositionData>} fromData - The starting position.
    *
    * @param {Partial<Data.TJSPositionData>} toData - The ending position.
    *
    * @param {AnimationAPI.TweenOptions} [options] - Optional tween parameters.
    *
    * @returns {IBasicAnimation}  A control object that can cancel animation and provides a `finished` Promise.
    */
   fromTo(fromData: Partial<Data.TJSPositionData>, toData: Partial<Data.TJSPositionData>,
    options?: AnimationAPI.TweenOptions): IBasicAnimation;

   /**
    * Provides a tween to given position data from the current position.
    *
    * @param {Partial<Data.TJSPositionData>} toData - The destination position.
    *
    * @param {AnimationAPI.TweenOptions} [options] - Optional tween parameters.
    *
    * @returns {IBasicAnimation}  A control object that can cancel animation and provides a `finished` Promise.
    */
   to(toData: Partial<Data.TJSPositionData>, options?: AnimationAPI.TweenOptions): IBasicAnimation;

   /**
    * Returns a function that provides an optimized way to constantly update a to-tween.
    *
    * @param {Iterable<AnimationAPI.AnimationKeys>}  keys - The keys for quickTo.
    *
    * @param {AnimationAPI.QuickTweenOptions} [options] - Optional quick tween parameters.
    *
    * @returns {AnimationAPI.QuickToCallback} quick-to tween function.
    */
   quickTo(keys: Iterable<AnimationAPI.AnimationKeys>, options?: AnimationAPI.QuickTweenOptions):
    AnimationAPI.QuickToCallback;
}

/**
 * Provides a public API for grouping multiple {@link TJSPosition} animations together and is accessible from
 * {@link TJSPosition.Animate}.
 *
 *
 * @see AnimationAPI
 */
interface AnimationGroupAPI
{
   /**
    * Cancels any animation for given PositionGroup data.
    *
    * @param {TJSPositionTypes.PositionGroup} position - The position group to cancel.
    */
   cancel(position: TJSPositionTypes.PositionGroup): void;

   /**
    * Cancels all TJSPosition animation.
    */
   cancelAll(): void;

   /**
    * Gets all animation controls for the given position group data.
    *
    * @param {TJSPositionTypes.PositionGroup} position - A position group.
    *
    * @returns {{ position: TJSPosition, data: object | undefined, controls: IBasicAnimation[]}[]} Results array.
    */
   getScheduled(position: TJSPositionTypes.PositionGroup): {
      position: TJSPosition,
      data: object | undefined,
      controls: IBasicAnimation[]
   }[];

   /**
    * Provides the `from` animation tween for one or more TJSPosition instances as a group.
    *
    * @param {TJSPositionTypes.PositionGroup}  position - A position group.
    *
    * @param {object | Function} fromData -
    *
    * @param {AnimationAPI.TweenOptions | (() => AnimationAPI.TweenOptions)}   [options] -
    *
    * @returns {IBasicAnimation} Basic animation control.
    */
   from(position: TJSPositionTypes.PositionGroup, fromData: object | Function, options?: AnimationAPI.TweenOptions |
    (() => AnimationAPI.TweenOptions)): IBasicAnimation;

   /**
    * Provides the `fromTo` animation tween for one or more TJSPosition instances as a group.
    *
    * @param {TJSPositionTypes.PositionGroup} position - A position group.
    *
    * @param {object | Function}   fromData -
    *
    * @param {object | Function}   toData -
    *
    * @param {object | Function}   [options] -
    *
    * @returns {IBasicAnimation} Basic animation control.
    */
   fromTo(position: TJSPositionTypes.PositionGroup, fromData: object | Function, toData: object | Function,
    options?: object | Function): IBasicAnimation;

   /**
    * Provides the `to` animation tween for one or more TJSPosition instances as a group.
    *
    * @param {TJSPositionTypes.PositionGroup} position - A position group.
    *
    * @param {object | Function}   toData -
    *
    * @param {object | Function}   [options] -
    *
    * @returns {IBasicAnimation} Basic animation control.
    */
   to(position: TJSPositionTypes.PositionGroup, toData: object | Function, options?: object | Function):
    IBasicAnimation;

   /**
    * Provides the `to` animation tween for one or more TJSPosition instances as a group.
    *
    * @param {TJSPositionTypes.PositionGroup} position - A position group.
    *
    * @param {Iterable<AnimationAPI.AnimationKeys>}  keys -
    *
    * @param {AnimationAPI.QuickTweenOptions | (() => AnimationAPI.QuickTweenOptions)}  [options] -
    *
    * @returns {AnimationAPI.QuickToCallback} quick-to tween function.
    */
   quickTo(position: TJSPositionTypes.PositionGroup, keys: Iterable<AnimationAPI.AnimationKeys>,
    options?: AnimationAPI.QuickTweenOptions | (() => AnimationAPI.QuickTweenOptions)): AnimationAPI.QuickToCallback;
}

namespace AnimationAPI {
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

   /**
    * The `quickTo` callback function returned from {@link AnimationAPI.quickTo} and {@link AnimationGroupAPI.quickTo}.
    */
   export interface QuickToCallback extends Function
   {
      /**
       * @param args - Individual numbers or relative strings corresponding to the order in which animation keys are
       * specified.
       */
      (...args: (string | number)[]): void;

      /**
       * @param arg - A single object with animation keys specified and numerical or relative string values.
       */
      (arg: Partial<Record<AnimationKeys, string | number>>): void;

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
      options: (data: QuickTweenOptions) => QuickToCallback;
   }
}

export {
   AnimationAPI,
   AnimationGroupAPI
}
