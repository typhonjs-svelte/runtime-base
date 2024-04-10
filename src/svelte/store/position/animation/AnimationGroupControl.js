import { basicAnimationState } from './basicAnimationState.js';

/**
 * Provides a implementation for a TJSPosition animation for a group of TJSPosition instances.
 *
 * @implements {import('#runtime/util/animate').IBasicAnimation}
 */
export class AnimationGroupControl
{
   /** @type {import('./AnimationControl').AnimationControl[]} */
   #animationControls;

   /** @type {Promise<import('#runtime/util/animate').BasicAnimationState>} */
   #finishedPromise;

   /**
    * Defines a static empty / void animation control.
    *
    * @type {AnimationGroupControl}
    */
   static #voidControl = new AnimationGroupControl(null);

   /**
    * Provides a static void / undefined AnimationGroupControl that is automatically resolved.
    *
    * @returns {AnimationGroupControl} Void AnimationGroupControl
    */
   static get voidControl() { return this.#voidControl; }

   /**
    * @param {import('./AnimationControl').AnimationControl[]} animationControls - An array of AnimationControl
    *        instances.
    */
   constructor(animationControls)
   {
      this.#animationControls = animationControls;
   }

   /**
    * Get a promise that resolves when all animations are finished.
    *
    * @returns {Promise<import('#runtime/util/animate').BasicAnimationState>} Finished Promise for all animations.
    */
   get finished()
   {
      const animationControls = this.#animationControls;

      if (!(this.#finishedPromise instanceof Promise))
      {
         if (animationControls === null || animationControls === void 0)
         {
            this.#finishedPromise = /** @type {Promise<import('#runtime/util/animate').BasicAnimationState>} */
             Promise.resolve(basicAnimationState.notCancelled);
         }
         else
         {
            /** @type {Promise<import('#runtime/util/animate').BasicAnimationState>[]} */
            const promises = [];

            for (let cntr = animationControls.length; --cntr >= 0;) { promises.push(animationControls[cntr].finished); }

            this.#finishedPromise = Promise.allSettled(promises).then((results) => {
               // Check if any promises were rejected or resolved with `cancelled: true`.
               const anyCancelled = results.some((result) => result.status === 'rejected' ||
                (result.status === 'fulfilled' && result.value.cancelled));

               // Return a single BasicAnimationState based on the aggregation of individual results.
               return anyCancelled ? basicAnimationState.cancelled : basicAnimationState.notCancelled;
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
    * @returns {boolean} Are there active animation instances.
    */
   get isActive()
   {
      const animationControls = this.#animationControls;

      if (animationControls === null || animationControls === void 0) { return false; }

      for (let cntr = animationControls.length; --cntr >= 0;)
      {
         if (animationControls[cntr].isActive) { return true; }
      }

      return false;
   }

   /**
    * Returns whether all animations in the group are finished.
    *
    * @returns {boolean} Are all animation instances finished.
    */
   get isFinished()
   {
      const animationControls = this.#animationControls;

      if (animationControls === null || animationControls === void 0) { return true; }

      for (let cntr = animationControls.length; --cntr >= 0;)
      {
         if (!animationControls[cntr].isFinished) { return false; }
      }

      return true;
   }

   /**
    * Cancels the all animations.
    */
   cancel()
   {
      const animationControls = this.#animationControls;

      if (animationControls === null || animationControls === void 0) { return; }

      for (let cntr = this.#animationControls.length; --cntr >= 0;)
      {
         this.#animationControls[cntr].cancel();
      }
   }
}
