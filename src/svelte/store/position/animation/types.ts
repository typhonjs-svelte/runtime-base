import type { EasingFunction }         from 'svelte/transition';

import type { InterpolateFunction }    from '#runtime/math/interpolate';

import type { BasicAnimation }         from '#runtime/util/animate';

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
    * @returns {BasicAnimation[]} All currently scheduled animation controls for this TJSPosition instance.
    */
   getScheduled(): BasicAnimation[];

   /**
    * Provides a tween from given position data to the current position.
    *
    * @param {Data.TJSPositionDataRelative} fromData - The starting position.
    *
    * @param {AnimationAPI.TweenOptions} [options] - Optional tween parameters.
    *
    * @returns {BasicAnimation}  A control object that can cancel animation and provides a `finished` Promise.
    */
   from(fromData: Data.TJSPositionDataRelative, options?: AnimationAPI.TweenOptions): BasicAnimation;

   /**
    * Provides a tween from given position data to the current position.
    *
    * @param {Data.TJSPositionDataRelative} fromData - The starting position.
    *
    * @param {Data.TJSPositionDataRelative} toData - The ending position.
    *
    * @param {AnimationAPI.TweenOptions} [options] - Optional tween parameters.
    *
    * @returns {BasicAnimation}  A control object that can cancel animation and provides a `finished` Promise.
    */
   fromTo(fromData: Data.TJSPositionDataRelative, toData: Data.TJSPositionDataRelative,
    options?: AnimationAPI.TweenOptions): BasicAnimation;

   /**
    * Provides a tween to given position data from the current position.
    *
    * @param {Data.TJSPositionDataRelative} toData - The destination position.
    *
    * @param {AnimationAPI.TweenOptions} [options] - Optional tween parameters.
    *
    * @returns {BasicAnimation}  A control object that can cancel animation and provides a `finished` Promise.
    */
   to(toData: Data.TJSPositionDataRelative, options?: AnimationAPI.TweenOptions): BasicAnimation;

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
    * @param {TJSPositionTypes.PositionGroup} positionGroup - The position group to cancel.
    */
   cancel(positionGroup: TJSPositionTypes.PositionGroup): void;

   /**
    * Cancels all TJSPosition animation.
    */
   cancelAll(): void;

   /**
    * Gets all animation controls for the given position group data.
    *
    * @param {TJSPositionTypes.PositionGroup} positionGroup - A position group.
    *
    * @returns {{ position: TJSPosition, entry: object | undefined, controls: BasicAnimation[]}[]} Results array.
    */
   getScheduled(positionGroup: TJSPositionTypes.PositionGroup): {
      position: TJSPosition,
      entry: object | undefined,
      controls: BasicAnimation[]
   }[];

   /**
    * Provides the `from` animation tween for one or more TJSPosition instances as a group.
    *
    * @param {TJSPositionTypes.PositionGroup}  positionGroup - A position group.
    *
    * @param {object | Function} fromData -
    *
    * @param {AnimationAPI.TweenOptions | (() => AnimationAPI.TweenOptions)}   [options] -
    *
    * @returns {BasicAnimation} Basic animation control.
    */
   from(positionGroup: TJSPositionTypes.PositionGroup, fromData: object | Function,
    options?: AnimationAPI.TweenOptions | (() => AnimationAPI.TweenOptions)): BasicAnimation;

   /**
    * Provides the `fromTo` animation tween for one or more TJSPosition instances as a group.
    *
    * @param {TJSPositionTypes.PositionGroup} positionGroup - A position group.
    *
    * @param {object | Function}   fromData -
    *
    * @param {object | Function}   toData -
    *
    * @param {object | Function}   [options] -
    *
    * @returns {BasicAnimation} Basic animation control.
    */
   fromTo(positionGroup: TJSPositionTypes.PositionGroup, fromData: object | Function, toData: object | Function,
    options?: object | Function): BasicAnimation;

   /**
    * Provides the `to` animation tween for one or more TJSPosition instances as a group.
    *
    * @param {TJSPositionTypes.PositionGroup} positionGroup - A position group.
    *
    * @param {object | Function}   toData -
    *
    * @param {object | Function}   [options] -
    *
    * @returns {BasicAnimation} Basic animation control.
    */
   to(positionGroup: TJSPositionTypes.PositionGroup, toData: object | Function, options?: object | Function):
    BasicAnimation;

   /**
    * Provides the `quickTo` animation tweening function for one or more TJSPosition instances as a group.
    *
    * @param {TJSPositionTypes.PositionGroup} positionGroup - A position group.
    *
    * @param {Iterable<AnimationAPI.AnimationKeys>}  keys -
    *
    * @param {AnimationAPI.QuickTweenOptions | (() => AnimationAPI.QuickTweenOptions)}  [options] -
    *
    * @returns {AnimationAPI.QuickToCallback | undefined} quick-to tween function.
    */
   quickTo(positionGroup: TJSPositionTypes.PositionGroup, keys: Iterable<AnimationAPI.AnimationKeys>,
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
       * @param options - Quick tween options.
       *
       * @returns This quickTo callback function.
       */
      options: (options: QuickTweenOptions) => QuickToCallback;
   }
}

export {
   AnimationAPI,
   AnimationGroupAPI
}
