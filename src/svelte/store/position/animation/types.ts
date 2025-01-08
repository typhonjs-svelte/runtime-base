import type { InterpolateFunctionName }   from '#runtime/math/interpolate';
import type { EasingReference }           from '#runtime/svelte/easing';
import type { BasicAnimation }            from '#runtime/util/animate';

import type { TJSPosition }               from '../TJSPosition';

import type { Data }                      from '../data/types';
import type { TransformAPI }              from '../transform/types';

interface AnimationAPI
{
   /**
    * Returns if there are scheduled animations whether active or pending for this TJSPosition instance.
    *
    * @returns Are there scheduled animations.
    */
   get isScheduled(): boolean;

   /**
    * Cancels all animation instances for this TJSPosition instance.
    */
   cancel(): void;

   /**
    * Returns all currently scheduled AnimationControl instances for this TJSPosition instance.
    *
    * @returns All currently scheduled animation controls for this TJSPosition instance.
    */
   getScheduled(): BasicAnimation[];

   /**
    * Provides a tween from given position data to the current position.
    *
    * @param fromData - The starting position.
    *
    * @param [options] - Optional tween parameters.
    *
    * @returns A control object that can cancel animation and provides a `finished` Promise.
    */
   from(fromData: Data.TJSPositionDataRelative, options?: AnimationAPI.TweenOptions): BasicAnimation;

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
          options?: AnimationAPI.TweenOptions): BasicAnimation;

   /**
    * Provides a tween to given position data from the current position.
    *
    * @param toData - The destination position.
    *
    * @param [options] - Optional tween parameters.
    *
    * @returns A control object that can cancel animation and provides a `finished` Promise.
    */
   to(toData: Data.TJSPositionDataRelative, options?: AnimationAPI.TweenOptions): BasicAnimation;

   /**
    * Returns a function that provides an optimized way to constantly update a to-tween.
    *
    * @param keys - The keys for quickTo.
    *
    * @param [options] - Optional quick tween parameters.
    *
    * @returns quick-to tween function.
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
    * Cancels any animation for given TJSPosition.PositionGroup data.
    *
    * @param positionGroup - The position group to cancel.
    */
   cancel(positionGroup: TJSPosition.PositionGroup): void;

   /**
    * Cancels all TJSPosition animation.
    */
   cancelAll(): void;

   /**
    * Provides a type guard to test in the given key is an {@link AnimationAPI.AnimationKey}.
    *
    * @param key - A key value to test.
    *
    * @returns Whether the given key is an animation key.
    */
   isAnimationKey(key: unknown): key is AnimationAPI.AnimationKey;

   /**
    * Gets all animation controls for the given position group data.
    *
    * @param positionGroup - A position group.
    *
    * @returns Results array.
    */
   getScheduled(positionGroup: TJSPosition.PositionGroup): {
      // position: TJSPosition,
      position: object,
      entry: TJSPosition.Positionable | undefined,
      controls: BasicAnimation[]
   }[];

   /**
    * Returns the status _for the entire position group_ specified if all position instances of the group are scheduled.
    *
    * @param positionGroup - A position group.
    *
    * @param [options] - Scheduling options.
    *
    * @returns True if all are scheduled / false if just one position instance in the group is not scheduled.
    */
   isScheduled(positionGroup: TJSPosition.PositionGroup, options?: AnimationAPI.ScheduleOptions): boolean;

   /**
    * Provides the `from` animation tween for one or more positionable instances as a group.
    *
    * @param positionGroup - A position group.
    *
    * @param fromData - A position data object assigned to all positionable instances or a callback function invoked
    *        for unique data for each instance.
    *
    * @param [options] - Tween options assigned to all positionable instances or a callback function invoked for unique
    *        options for each instance.
    *
    * @returns Basic animation control.
    */
   from(positionGroup: TJSPosition.PositionGroup, fromData: Data.TJSPositionDataRelative |
    AnimationAPI.GroupDataCallback, options?: AnimationAPI.TweenOptions | AnimationAPI.GroupTweenOptionsCallback):
     BasicAnimation;

   /**
    * Provides the `fromTo` animation tween for one or more positionable instances as a group.
    *
    * @param positionGroup - A position group.
    *
    * @param fromData - A position data object
    *        assigned to all positionable instances or a callback function invoked for unique data for each instance.
    *
    * @param toData - A position data object assigned
    *        to all positionable instances or a callback function invoked for unique data for each instance.
    *
    * @param [options] - Tween options assigned
    *        to all positionable instances or a callback function invoked for unique options for each instance.
    *
    * @returns Basic animation control.
    */
   fromTo(positionGroup: TJSPosition.PositionGroup, fromData: Data.TJSPositionDataRelative |
    AnimationAPI.GroupDataCallback, toData: Data.TJSPositionDataRelative | AnimationAPI.GroupDataCallback,
     options?: AnimationAPI.TweenOptions | AnimationAPI.GroupTweenOptionsCallback): BasicAnimation;

   /**
    * Provides the `to` animation tween for one or more positionable instances as a group.
    *
    * @param positionGroup - A position group.
    *
    * @param toData - A position data object assigned
    *        to all positionable instances or a callback function invoked for unique data for each instance.
    *
    * @param [options] - Tween options assigned
    *        to all positionable instances or a callback function invoked for unique options for each instance.
    *
    * @returns Basic animation control.
    */
   to(positionGroup: TJSPosition.PositionGroup, toData: Data.TJSPositionDataRelative |
    AnimationAPI.GroupDataCallback, options?: AnimationAPI.TweenOptions | AnimationAPI.GroupTweenOptionsCallback):
     BasicAnimation;

   /**
    * Provides the `quickTo` animation tweening function for one or more positionable instances as a group.
    *
    * @param positionGroup - A position group.
    *
    * @param keys - Animation keys to target.
    *
    * @param [options] - Quick tween
    *        options assigned to all positionable instances or a callback function invoked for unique options for each
    *        instance.
    *
    * @returns quick-to tween function.
    */
   quickTo(positionGroup: TJSPosition.PositionGroup, keys: Iterable<AnimationAPI.AnimationKey>,
    options?: AnimationAPI.QuickTweenOptions | AnimationAPI.GroupQuickTweenOptionsCallback):
     AnimationAPI.GroupQuickToCallback;
}

declare namespace AnimationAPI {
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
       * The index of the {@link TJSPosition.PositionGroup} being processed.
       */
      index?: number;

      /**
       * The actual TJSPosition instance being processed.
       */
      // position?: TJSPosition;
      position?: object;

      /**
       * Any associated positionable entry / object.
       */
      entry?: TJSPosition.Positionable | undefined;
   }

   /**
    * Defines a callback to process each {@link TJSPosition} / {@link TJSPosition.Positionable} instance allowing
    * different position data to be assigned to each instance in the grouped animation.
    */
   export interface GroupDataCallback
   {
      /**
       * @param options - The group callback options defining the order of the current position / positionable being
       *        processed.
       *
       * @returns The unique position data target to animate for this position / positionable instance.  When null or
       *          undefined is returned the current position / positionable is removed from the animation.
       */
      (options?: GroupCallbackOptions): Data.TJSPositionDataRelative | null | undefined;
   }

   /**
    * Defines a callback to process each {@link TJSPosition} / {@link TJSPosition.Positionable} instance allowing
    * different tween options to be assigned to each instance in the grouped animation.
    */
   export interface GroupTweenOptionsCallback
   {
      /**
       * @param options - The group callback options defining the order of the current position / positionable being
       *        processed.
       *
       * @returns The unique tween options to set for this position / positionable instance. When null or undefined is
       *          returned the current position / positionable is removed from the animation.
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
    * Defines a callback to process each {@link TJSPosition} / {@link TJSPosition.Positionable} instance allowing
    * different quick tween options to be assigned to each instance in the grouped animation.
    */
   export interface GroupQuickTweenOptionsCallback
   {
      /**
       * @param options - The group callback options defining the order of the current position / positionable being
       *        processed.
       *
       * @returns The unique quick tween options to set for this position / positionable instance. When null or
       *          undefined is returned the current position / positionable is removed from the animation.
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
       * Easing function or easing function name; controls the time variable for interpolation. Default: `cubicOut`
       */
      ease?: EasingReference;

      /**
       * Interpolation function name. Currently, only `lerp` is supported and doesn't need to be specified.
       */
      interpolate?: InterpolateFunctionName;
   };

   /**
    * Defines options for the {@link AnimationGroupAPI.isScheduled}.
    */
   export type ScheduleOptions = {
      /**
       * When false exclude searching active animations.
       */
      active?: boolean;

      /**
       * When false exclude searching pending animations that have not started.
       */
      pending?: boolean;
   }

   /**
    * Defines the tweening options.
    */
   export type TweenOptions = QuickTweenOptions & {
      /**
       * Delay in seconds before animation starts; default: 0
       */
      delay?: number;

      /**
       * Defines the scheduling strategy for handling new animations when an existing animation is already scheduled for
       * the same target.
       *
       * ```
       * - `cancel`: Cancels any non `quickTo` pending and ongoing animations on the same target and schedules the new
       *   animation immediately. This option ensures that the new animation takes precedence by clearing any existing
       *   animations.
       *
       * - `cancelAll`: Cancels _all_ pending and ongoing animations on the same target and schedules the new animation
       *   immediately. This option ensures that the new animation takes precedence by clearing any existing animations.
       *
       * - `exclusive`: Only schedules the new animation if there are no other animations currently scheduled for the
       *   same target. This option avoids animation conflicts by ensuring that only one animation can run at a time.
       * ```
       */
      strategy?: 'cancel' | 'cancelAll' | 'exclusive';

      /**
       * A transform origin to apply for the animation. The initial transform origin is reset when the animation
       * finishes.
       */
      transformOrigin?: TransformAPI.TransformOrigin;
   };

   /**
    * The `quickTo` callback function returned from {@link AnimationAPI.quickTo}.
    */
   export interface QuickToCallback
   {
      /**
       * @param args - Individual numbers or relative strings corresponding to the order in which animation keys are
       *        specified.
       */
      (...args: (string | number)[]): void;

      /**
       * @param arg - A single object with animation keys specified and numerical or relative string values.
       */
      (arg: Partial<{ [key in AnimationKey]: string | number }>): void;

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
      readonly options: (options: QuickTweenOptions) => QuickToCallback;
   }
}

export {
   AnimationAPI,
   AnimationGroupAPI
}
