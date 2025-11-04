import { CrossRealm }            from '#runtime/util/browser';
import { isObject }              from '#runtime/util/object';

import type {
   BasicAnimation,
   BasicAnimationState }         from '#runtime/util/animate';

import type { AnimationData }    from './types-local';

/**
 * Provides a basic animation implementation for TJSPosition animation.
 */
export class AnimationControl implements BasicAnimation
{
   /**
    */
   readonly #animationData: AnimationData | null;

   /**
    */
   #finishedPromise: Promise<BasicAnimationState> | undefined;

   /**
    */
   readonly #willFinish: boolean;

   /**
    * Defines a static empty / void animation control.
    */
   static #voidControl: AnimationControl = new AnimationControl(null);

   /**
    * Provides a static void / undefined AnimationControl that is automatically resolved.
    */
   static get voidControl(): AnimationControl { return this.#voidControl; }

   /**
    * @param [animationData] - Animation data.
    *
    * @param [willFinish] - Promise that tracks animation finished state.
    */
   constructor(animationData: AnimationData | null, willFinish: boolean = false)
   {
      this.#animationData = animationData;
      this.#willFinish = willFinish;

      // Set this control to animation data.
      if (isObject(animationData)) { animationData.control = this; }
   }

   /**
    * Get a promise that resolves when animation is finished.
    *
    * @returns Animation finished Promise.
    */
   get finished(): Promise<BasicAnimationState>
   {
      if (!CrossRealm.isPromise(this.#finishedPromise))
      {
         this.#finishedPromise = this.#willFinish ? new Promise<BasicAnimationState>((resolve) => this.#animationData!.resolve = resolve) :
          Promise.resolve({ cancelled: false });
      }

      return this.#finishedPromise;
   }

   /**
    * Returns whether this animation is currently active / animating.
    *
    * Note: a delayed animation may not be started / active yet. Use {@link AnimationControl.isFinished} to determine
    * if an animation is actually finished.
    *
    * @returns Animation active state.
    */
   get isActive(): boolean { return this.#animationData?.active ?? false; }

   /**
    * Returns whether this animation is completely finished.
    *
    * @returns Animation finished state.
    */
   get isFinished(): boolean { return this.#animationData?.finished ?? true; }

   /**
    * Cancels the animation.
    */
   cancel(): void
   {
      const animationData: AnimationData | null = this.#animationData;

      if (animationData === null || animationData === void 0) { return; }

      // Set cancelled state to true and this animation data instance will be removed from AnimationManager on next
      // update.
      animationData.cancelled = true;
   }
}
