import type { InterpolateFunction }    from '#runtime/math/interpolate';

import type {
   EasingFunction,
   EasingFunctionName }                from '#runtime/svelte/easing';

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
    * Provides a tween from given position data to the given position.
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
    * @param {Iterable<AnimationAPI.AnimationKey>}  keys - The keys for quickTo.
    *
    * @param {AnimationAPI.QuickTweenOptions} [options] - Optional quick tween parameters.
    *
    * @returns {AnimationAPI.QuickToCallback} quick-to tween function.
    */
   quickTo(keys: Iterable<AnimationAPI.AnimationKey>, options?: AnimationAPI.QuickTweenOptions):
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
    * Provides a type guard to test in the given key is an {@link AnimationAPI.AnimationKey}.
    *
    * @param {unknown}  key - A key value to test.
    *
    * @returns {boolean} Whether the given key is an animation key.
    */
   isAnimationKey(key: unknown): key is AnimationAPI.AnimationKey;

   /**
    * Gets all animation controls for the given position group data.
    *
    * @param {TJSPositionTypes.PositionGroup} positionGroup - A position group.
    *
    * @returns {({
    *    position: TJSPosition,
    *    entry: TJSPositionTypes.Positionable | undefined,
    *    controls: BasicAnimation[]
    * }[])} Results array.
    */
   getScheduled(positionGroup: TJSPositionTypes.PositionGroup): {
      position: TJSPosition,
      entry: TJSPositionTypes.Positionable | undefined,
      controls: BasicAnimation[]
   }[];

   /**
    * Provides the `from` animation tween for one or more positionable instances as a group.
    *
    * @param {TJSPositionTypes.PositionGroup}  positionGroup - A position group.
    *
    * @param {Data.TJSPositionDataRelative | AnimationAPI.GroupDataCallback} fromData - A position data object assigned
    *        to all positionable instances or a callback function invoked for unique data for each instance.
    *
    * @param {AnimationAPI.TweenOptions | AnimationAPI.GroupTweenOptionsCallback}   [options] - Tween options assigned
    *        to all positionable instances or a callback function invoked for unique options for each instance.
    *
    * @returns {BasicAnimation} Basic animation control.
    */
   from(positionGroup: TJSPositionTypes.PositionGroup, fromData: Data.TJSPositionDataRelative |
    AnimationAPI.GroupDataCallback, options?: AnimationAPI.TweenOptions | AnimationAPI.GroupTweenOptionsCallback):
     BasicAnimation;

   /**
    * Provides the `fromTo` animation tween for one or more positionable instances as a group.
    *
    * @param {TJSPositionTypes.PositionGroup} positionGroup - A position group.
    *
    * @param {Data.TJSPositionDataRelative | AnimationAPI.GroupDataCallback}   fromData - A position data object
    *        assigned to all positionable instances or a callback function invoked for unique data for each instance.
    *
    * @param {Data.TJSPositionDataRelative | AnimationAPI.GroupDataCallback}   toData - A position data object assigned
    *        to all positionable instances or a callback function invoked for unique data for each instance.
    *
    * @param {AnimationAPI.TweenOptions | AnimationAPI.GroupTweenOptionsCallback}   [options] - Tween options assigned
    *        to all positionable instances or a callback function invoked for unique options for each instance.
    *
    * @returns {BasicAnimation} Basic animation control.
    */
   fromTo(positionGroup: TJSPositionTypes.PositionGroup, fromData: Data.TJSPositionDataRelative |
    AnimationAPI.GroupDataCallback, toData: Data.TJSPositionDataRelative | AnimationAPI.GroupDataCallback,
     options?: AnimationAPI.TweenOptions | AnimationAPI.GroupTweenOptionsCallback): BasicAnimation;

   /**
    * Provides the `to` animation tween for one or more positionable instances as a group.
    *
    * @param {TJSPositionTypes.PositionGroup} positionGroup - A position group.
    *
    * @param {Data.TJSPositionDataRelative | AnimationAPI.GroupDataCallback}   toData - A position data object assigned
    *        to all positionable instances or a callback function invoked for unique data for each instance.
    *
    * @param {AnimationAPI.TweenOptions | AnimationAPI.GroupTweenOptionsCallback}   [options] - Tween options assigned
    *        to all positionable instances or a callback function invoked for unique options for each instance.
    *
    * @returns {BasicAnimation} Basic animation control.
    */
   to(positionGroup: TJSPositionTypes.PositionGroup, toData: Data.TJSPositionDataRelative |
    AnimationAPI.GroupDataCallback, options?: AnimationAPI.TweenOptions | AnimationAPI.GroupTweenOptionsCallback):
     BasicAnimation;

   /**
    * Provides the `quickTo` animation tweening function for one or more positionable instances as a group.
    *
    * @param {TJSPositionTypes.PositionGroup} positionGroup - A position group.
    *
    * @param {Iterable<AnimationAPI.AnimationKey>}  keys - Animation keys to target.
    *
    * @param {AnimationAPI.QuickTweenOptions | AnimationAPI.GroupQuickTweenOptionsCallback}  [options] - Quick tween
    *        options assigned to all positionable instances or a callback function invoked for unique options for each
    *        instance.
    *
    * @returns {AnimationAPI.GroupQuickToCallback | undefined} quick-to tween function.
    */
   quickTo(positionGroup: TJSPositionTypes.PositionGroup, keys: Iterable<AnimationAPI.AnimationKey>,
    options?: AnimationAPI.QuickTweenOptions | AnimationAPI.GroupQuickTweenOptionsCallback):
     AnimationAPI.GroupQuickToCallback;
}

namespace AnimationAPI {
   /**
    * The position keys that can be animated.
    */
   export type AnimationKey =
    // Main keys
    'left' | 'top' | 'maxWidth' | 'maxHeight' | 'minWidth' | 'minHeight' | 'width' | 'height' |
    'rotateX' | 'rotateY' | 'rotateZ' | 'scale' | 'translateX' | 'translateY' | 'translateZ' | 'zIndex' |

    // Aliases
    'rotation';

   /**
    * Options passed to any group animation callbacks for {@link Data.TJSPositionDataRelative} data or
    * {@link TweenOptions}.
    */
   export type GroupCallbackOptions = {
      /**
       * The index of the {@link TJSPositionTypes.PositionGroup} being processed.
       */
      index?: number;

      /**
       * The actual TJSPosition instance being processed.
       */
      position?: TJSPosition;

      /**
       * Any associated positionable entry / object.
       */
      entry?: TJSPositionTypes.Positionable | undefined;
   }

   /**
    * Defines a callback to process each {@link TJSPosition} / {@link TJSPositionTypes.Positionable} instance allowing
    * different position data to be assigned to each instance in the grouped animation.
    */
   export interface GroupDataCallback
   {
      /**
       * @param {GroupCallbackOptions} options - The group callback options defining the order of the current
       *        position / positionable being processed.
       *
       * @returns {Data.TJSPositionDataRelative} - The unique position data target to animate for this position /
       *          positionable instance.  When null or undefined is returned the current position / positionable is
       *          removed from the animation.
       */
      (options?: GroupCallbackOptions): Data.TJSPositionDataRelative | null | undefined;
   }

   /**
    * Defines a callback to process each {@link TJSPosition} / {@link TJSPositionTypes.Positionable} instance allowing
    * different tween options to be assigned to each instance in the grouped animation.
    */
   export interface GroupTweenOptionsCallback
   {
      /**
       * @param {GroupCallbackOptions} options - The group callback options defining the order of the current
       *        position / positionable being processed.
       *
       * @returns {TweenOptions} - The unique tween options to set for this position / positionable instance. When null
       *          or undefined is returned the current position / positionable is removed from the animation.
       */
      (options?: GroupCallbackOptions): TweenOptions | null | undefined;
   }

   /**
    * The `quickTo` callback function returned from {@link AnimationGroupAPI.quickTo}. Extends `QuickToCallback`
    * accepting functions for setting each instance of group with new position data and / or options.
    */
   export interface GroupQuickToCallback extends QuickToCallback
   {
      /**
       * @param arg - A callback function invoked for unique positional data for each instance of the group.
       */
      (arg: GroupDataCallback): void;

      /**
       * Sets options of quickTo tween.
       *
       * @param options - Quick tween options or callback function returning options per instance of the group.
       *
       * @returns This quickTo callback function.
       */
      options: (options: QuickTweenOptions | GroupQuickTweenOptionsCallback) => GroupQuickToCallback;
   }

   /**
    * Defines a callback to process each {@link TJSPosition} / {@link TJSPositionTypes.Positionable} instance allowing
    * different quick tween options to be assigned to each instance in the grouped animation.
    */
   export interface GroupQuickTweenOptionsCallback
   {
      /**
       * @param {GroupCallbackOptions} options - The group callback options defining the order of the current
       *        position / positionable being processed.
       *
       * @returns {QuickTweenOptions} - The unique quick tween options to set for this position / positionable instance.
       *          When null or undefined is returned the current position / positionable is removed from the animation.
       */
      (options?: GroupCallbackOptions): QuickTweenOptions | null | undefined;
   }

   /**
    * Defines the quick tweening options.
    */
   export type QuickTweenOptions = {
      /**
       * Duration in seconds; default: 1
       */
      duration?: number;

      /**
       * Easing function or easing function name; default: cubicOut
       */
      ease?: EasingFunctionName | EasingFunction;

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
    * The `quickTo` callback function returned from {@link AnimationAPI.quickTo}.
    */
   export interface QuickToCallback
   {
      /**
       * @param args - Individual numbers or relative strings corresponding to the order in which animation keys are
       * specified.
       */
      (...args: (string | number)[]): void;

      /**
       * @param arg - A single object with animation keys specified and numerical or relative string values.
       */
      (arg: Partial<Record<AnimationKey, string | number>>): void;

      /**
       * The keys assigned for this quickTo callback.
       */
      readonly keys: AnimationKey[];

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
