// Private internal types not in publicly exposed API.

import type { InterpolateFunction } from '#runtime/math/interpolate';
import type { EasingFunction }      from '#runtime/svelte/easing';

import type { AnimationControl }    from './AnimationControl';

import type { TJSPosition }         from '../TJSPosition';

import type { AnimationAPI }        from './types';
import type { TransformAPI }        from '../transform/types';

/**
 * Internal data structure tracking an animation.
 */
export type AnimationData = {
   /**
    * Animation active state.
    */
   active: boolean;

   /**
    * Associated cleanup function.
    */
   cleanup?: AnimationCleanupFunction;

   /**
    * Animation cancelled state.
    */
   cancelled: boolean;

   /**
    * Associated AnimationControl.
    */
   control: AnimationControl | undefined;

   /**
    * Current time.
    */
   current: number;

   /**
    * Target destination for animation.
    */
   destination: Partial<Record<AnimationAPI.AnimationKey, number>> | undefined;

   /**
    * Duration of animation in milliseconds.
    */
   duration: number;

   /**
    * Easing function; default linear.
    */
   ease: EasingFunction;

   /**
    * Associated Element.
    */
   el: Element | undefined;

   /**
    * Animation finished state.
    */
   finished: boolean;

   /**
    * Initial position data.
    */
   initial: Partial<Record<AnimationAPI.AnimationKey, number>>;

   /**
    * Interpolation function; default lerp.
    */
   interpolate: InterpolateFunction<any>;

   /**
    * Animation keys.
    */
   keys: string[];

   /**
    * Copy of initial data. Used as temporary storage.
    */
   newData: Partial<Record<AnimationAPI.AnimationKey, number>>;

   /**
    * Associated TJSPosition instance.
    */
   position: TJSPosition;

   /**
    * When true cleanup of retained data does not occur in AnimationManager.
    */
   quickTo: boolean;

   /**
    * Any Promise resolve function; added when `finished` is accessed on AnimationControl.
    */
   resolve: Function | undefined;

   /**
    * Starting time of animation.
    */
   start: number;

   /**
    * A transform origin for the animation.
    */
   transformOrigin?: TransformAPI.TransformOrigin;

   /**
    * The initial transform origin to set after the animation finishes.
    */
   transformOriginInitial?: TransformAPI.TransformOrigin;
}

/**
 * A cleanup function to run when the animation is finished / cancelled.
 */
export type AnimationCleanupFunction = (data: AnimationData) => any;

/**
 * Defines a cancel function that `AnimationManager.cancel` invokes for additional filtering / exclusion of cancelling.
 */
export type AnimationCancelFunction = (data?: AnimationData) => boolean;

