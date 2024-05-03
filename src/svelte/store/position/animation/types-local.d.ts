// Private internal types not in publicly exposed API.

import type { InterpolateFunction } from '#runtime/math/interpolate';
import type { EasingFunction }      from '#runtime/svelte/easing';

import type { AnimationAPI }        from './types';

import type { AnimationControl }    from './AnimationControl';
import type { TJSPosition }         from '../TJSPosition.js';

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
   cleanup: AnimationCleanupFunction;

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
   destination: Record<AnimationAPI.AnimationKey, number> | undefined;

   /**
    * Duration of animation in milliseconds.
    */
   duration: number;

   /**
    * Easing function; default linear.
    */
   ease: EasingFunction;

   /**
    * Associated HTMLElement.
    */
   el: HTMLElement | undefined;

   /**
    * Animation finished state.
    */
   finished: boolean;

   /**
    * Initial position data.
    */
   initial: Record<AnimationAPI.AnimationKey, number>;

   /**
    * Interpolation function; default lerp.
    */
   interpolate: InterpolateFunction;

   /**
    * Animation keys.
    */
   keys: Iterable<string>;

   /**
    * Copy of initial data. Used as temporary storage.
    */
   newData: Record<AnimationAPI.AnimationKey, number>;

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
   resolve: Function;

   /**
    * Starting time of animation.
    */
   start: number;
}

/**
 * A cleanup function to run when the animation is finished / cancelled.
 */
export type AnimationCleanupFunction = (data: AnimationData) => any;
