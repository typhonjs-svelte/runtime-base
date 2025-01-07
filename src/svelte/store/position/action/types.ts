import type {
   Readable,
   Writable }                    from 'svelte/store';

import type { EasingReference }  from '#runtime/svelte/easing';

import type { TJSPosition }      from '../TJSPosition';

import type { AnimationAPI }     from '../animation/types';

declare namespace Action {
   /**
    * Defines the options for the {@link draggable} action.
    */
   export type DraggableOptions = {
      /**
       * A position or positionable instance.
       */
      position: TJSPosition | TJSPosition.Positionable;

      /**
       * MouseEvent button that activates dragging; default: 0
       *
       * @see https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
       */
      button?: number;

      /**
       * A boolean value; controlling the `enabled` state.
       */
      enabled: boolean;

      /**
       *  When defined any event targets that have a class in this list are allowed.
       */
      hasTargetClassList?: Iterable<string>;

      /**
       * When defined any event targets that have a class in this list are ignored.
       */
      ignoreTargetClassList?: Iterable<string>;

      /**
       *  A writable store that tracks "dragging" state.
       */
      storeDragging?: Writable<boolean>;

      /**
       * When true tweening is enabled; default: false
       */
      tween?: boolean;

      /**
       * Quick tween options.
       */
      tweenOptions?: AnimationAPI.QuickTweenOptions;
   }

   /**
    * Provides an interface of the {@link draggable} action options support / Readable store to make updating / setting
    * draggable options much easier. When subscribing to the options instance returned by {@link draggable.options} the
    * Subscriber handler receives the entire instance.
    */
   export interface DraggableOptionsStore extends Readable<DraggableOptionsStore>
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
       * @returns Get tween duration.
       */
      get tweenDuration(): number;

      /**
       * @returns Get easing function or easing function name.
       */
      get tweenEase(): EasingReference;

      /**
       * @param duration - Set tween duration.
       */
      set tweenDuration(duration: number);

      /**
       * @param ease - Set easing function by name or direct function.
       */
      set tweenEase(ease: EasingReference);

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
}


export { Action };
