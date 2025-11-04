import { CrossRealm }            from '#runtime/util';

import type {
   BasicAnimation,
   BasicAnimationState }         from '#runtime/util/animate';

import type { AnimationControl } from './AnimationControl';

/**
 * Provides a implementation for a TJSPosition animation for a group of TJSPosition instances.
 */
export class AnimationGroupControl implements BasicAnimation
{
   /**
    */
   readonly #animationControls: Set<AnimationControl> | null;

   /**
    */
   #finishedPromise: Promise<BasicAnimationState> | undefined;

   /**
    * Defines a static empty / void animation control.
    */
   static #voidControl: AnimationGroupControl = new AnimationGroupControl(null);

   /**
    * Provides a static void / undefined AnimationGroupControl that is automatically resolved.
    */
   static get voidControl(): AnimationGroupControl { return this.#voidControl; }

   /**
    * @param animationControls - A Set of AnimationControl instances.
    */
   constructor(animationControls: Set<AnimationControl> | null)
   {
      this.#animationControls = animationControls;
   }

   /**
    * Get a promise that resolves when all animations are finished.
    *
    * @returns Finished Promise for all animations.
    */
   get finished(): Promise<BasicAnimationState>
   {
      const animationControls: Set<AnimationControl> | null = this.#animationControls;

      if (!CrossRealm.isPromise(this.#finishedPromise))
      {
         if (animationControls === null || animationControls === void 0 || animationControls.size === 0)
         {
            this.#finishedPromise = Promise.resolve({ cancelled: false });
         }
         else
         {
            const promises: Promise<BasicAnimationState>[] = [];

            for (const animationControl of animationControls) { promises.push(animationControl.finished); }

            this.#finishedPromise = Promise.allSettled(promises).then((results) => {
               // Check if any promises were rejected or resolved with `cancelled: true`.
               const anyCancelled: boolean = results.some((result) => result.status === 'rejected' ||
                (result.status === 'fulfilled' && result.value.cancelled));

               // Return a single BasicAnimationState based on the aggregation of individual results.
               return { cancelled: anyCancelled };
            });
         }
      }

      return this.#finishedPromise;
   }

   /**
    * Returns whether there are active animation instances for this group.
    *
    * Note: a delayed animation may not be started / active yet. Use {@link AnimationGroupControl.isFinished} to
    * determine if all animations in the group are finished.
    *
    * @returns Are there active animation instances.
    */
   get isActive(): boolean
   {
      const animationControls: Set<AnimationControl> | null = this.#animationControls;

      if (animationControls === null || animationControls === void 0 || animationControls.size === 0) { return false; }

      for (const animationControl of animationControls)
      {
         if (animationControl.isActive) { return true; }
      }

      return false;
   }

   /**
    * Returns whether all animations in the group are finished.
    *
    * @returns Are all animation instances finished.
    */
   get isFinished(): boolean
   {
      const animationControls: Set<AnimationControl> | null = this.#animationControls;

      if (animationControls === null || animationControls === void 0 || animationControls.size === 0) { return true; }

      for (const animationControl of animationControls)
      {
         if (!animationControl.isFinished) { return false; }
      }

      return true;
   }

   /**
    * Cancels the all animations.
    */
   cancel(): void
   {
      const animationControls: Set<AnimationControl> | null = this.#animationControls;

      if (animationControls === null || animationControls === void 0 || animationControls.size === 0) { return; }

      for (const animationControl of animationControls) { animationControl.cancel(); }
   }
}
