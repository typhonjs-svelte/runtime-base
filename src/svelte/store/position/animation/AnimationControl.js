import { CrossWindow }  from '#runtime/util/browser';
import { isObject }     from '#runtime/util/object';

/**
 * Provides a basic animation implementation for TJSPosition animation.
 *
 * @implements {import('#runtime/util/animate').BasicAnimation}
 */
export class AnimationControl
{
   /** @type {import('./types-local').AnimationData} */
   #animationData;

   /** @type {Promise<import('#runtime/util/animate').BasicAnimationState>} */
   #finishedPromise;

   /** @type {boolean} */
   #willFinish;

   /**
    * Defines a static empty / void animation control.
    *
    * @type {AnimationControl}
    */
   static #voidControl = new AnimationControl(null);

   /**
    * Provides a static void / undefined AnimationControl that is automatically resolved.
    *
    * @returns {AnimationControl} Void AnimationControl
    */
   static get voidControl() { return this.#voidControl; }

   /**
    * @param {import('./types-local').AnimationData | null}  [animationData] - Animation data from {@link AnimationAPI}.
    *
    * @param {boolean}        [willFinish] - Promise that tracks animation finished state.
    */
   constructor(animationData, willFinish = false)
   {
      this.#animationData = animationData;
      this.#willFinish = willFinish;

      // Set this control to animation data.
      if (isObject(animationData)) { animationData.control = this; }
   }

   /**
    * Get a promise that resolves when animation is finished.
    *
    * @returns {Promise<import('#runtime/util/animate').BasicAnimationState>} Animation finished Promise.
    */
   get finished()
   {
      if (!CrossWindow.isPromise(this.#finishedPromise))
      {
         this.#finishedPromise = this.#willFinish ? new Promise((resolve) => this.#animationData.resolve = resolve) :
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
    * @returns {boolean} Animation active state.
    */
   get isActive() { return this.#animationData.active; }

   /**
    * Returns whether this animation is completely finished.
    *
    * @returns {boolean} Animation finished state.
    */
   get isFinished() { return this.#animationData.finished; }

   /**
    * Cancels the animation.
    */
   cancel()
   {
      const animationData = this.#animationData;

      if (animationData === null || animationData === void 0) { return; }

      // Set cancelled state to true and this animation data instance will be removed from AnimationManager on next
      // update.
      animationData.cancelled = true;
   }
}
