import type { EasingFunction }      from 'svelte/transition';

import type { InterpolateFunction } from '#runtime/math/interpolate';

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
