import type { Readable }         from 'svelte/store';
import type { EasingFunction }   from 'svelte/transition';

import type { AnimationAPI }    from '../animation/types';

/**
 * Provides an interface of the {@link draggable} action options support / Readable store to make updating / setting
 * draggable options much easier. When subscribing to the options instance returned by {@link draggable.options} the
 * Subscriber handler receives the entire instance.
 */
interface DraggableOptions extends Readable<DraggableOptions>
{
   /**
    * Tweening enabled state.
    */
   tween: boolean;

   /**
    * Quick tween options for easing function and duration.
    */
   tweenOptions: AnimationAPI.QuickTweenOptions;

   /**
    * @returns {number} Get tween duration.
    */
   get tweenDuration(): number;

   /**
    * @returns {EasingFunction} Get easing function.
    */
   get tweenEase(): EasingFunction;

   /**
    * @param {number}   duration - Set tween duration.
    */
   set tweenDuration(duration: number);

   /**
    * @param {EasingFunction} ease - Set easing function.
    */
   set tweenEase(ease: EasingFunction);

   /**
    * Resets all options data to initial values.
    */
   reset(): void;

   /**
    * Resets tween enabled state to initial value.
    */
   resetTween(): void;

   /**
    * Resets tween options to initial values.
    */
   resetTweenOptions(): void;
}

export { DraggableOptions };
