import type { BasicAnimation }   from '#runtime/util/animate';

import type { TJSPosition }      from '../TJSPosition';

import type {
   AnimationCancelFunction,
   AnimationData }               from './types-local';

import type { AnimationAPI }     from './types';

/**
 * Provides animation management and scheduling allowing all TJSPosition instances to utilize one micro-task.
 */
export class AnimationManager
{
   /**
    * Cancels all animations except `quickTo` animations.
    */
   static cancelFn: AnimationCancelFunction = (data?: AnimationData): boolean => data?.quickTo !== true;

   /**
    * Cancels all animations.
    */
   static cancelAllFn: AnimationCancelFunction = (): true => true;

   /**
    * Defines the options used for {@link TJSPosition.set}.
    */
   static #tjsPositionSetOptions: Readonly<{immediateElementUpdate: boolean}> = Object.freeze(
    { immediateElementUpdate: true });

   /**
    */
   static #activeList: AnimationData[] = [];

   /**
    * Provides the `this` context for {@link AnimationManager.animate} to be scheduled on rAF.
    */
   static #animateBound: FrameRequestCallback = AnimationManager.animate.bind(AnimationManager);

   /**
    */
   static #pendingList: AnimationData[] = [];

   /**
    * Tracks whether a requestAnimationFrame callback is pending via {@link AnimationManager.add};
    */
   static #rafPending: boolean = false;

   /**
    * Time of last `rAF` callback.
    */
   static #timeFrame: number;

   /**
    * Time of `performance.now()` at last `rAF` callback.
    */
   static #timeNow: number;

   /**
    * @returns Time of last `rAF` callback.
    */
   static get timeFrame(): number
   {
      return this.#timeFrame;
   }

   /**
    * @returns Time of `performance.now()` at last `rAF` callback.
    */
   static get timeNow(): number
   {
      return this.#timeNow;
   }

   /**
    * Add animation data.
    *
    * @param data -
    */
   static add(data: AnimationData): void
   {
      if (data.cancelled)
      {
         this.#cleanupData(data);
         return;
      }

      AnimationManager.#pendingList.push(data);

      // If there is no rAF pending schedule one now.
      if (!AnimationManager.#rafPending)
      {
         AnimationManager.#rafPending = true;
         globalThis.requestAnimationFrame(this.#animateBound);
      }
   }

   /**
    * Manage all animation.
    *
    * @param timeFrame - rAF callback time.
    */
   static animate(timeFrame: DOMHighResTimeStamp): void
   {
      AnimationManager.#rafPending = false;

      AnimationManager.#timeNow = globalThis.performance.now();
      AnimationManager.#timeFrame = timeFrame;

      // Early out of the continual rAF callback when there are no current animations scheduled.
      if (AnimationManager.#activeList.length === 0 && AnimationManager.#pendingList.length === 0) { return; }

      if (AnimationManager.#pendingList.length)
      {
         // Process new data
         for (let cntr: number = AnimationManager.#pendingList.length; --cntr >= 0;)
         {
            const data: AnimationData = AnimationManager.#pendingList[cntr];

            // If animation instance has been cancelled before start then remove it from new list and cleanup.
            if (data.cancelled || (data.el !== void 0 && !data.el.isConnected))
            {
               AnimationManager.#pendingList.splice(cntr, 1);
               this.#cleanupData(data);
            }

            // If data is active then process it now. Delayed animations start with `active` false.
            if (data.active)
            {
               // Set any transform origin for the animation.
               if (data.transformOrigin) { data.position.set({ transformOrigin: data.transformOrigin }); }

               data.start = AnimationManager.#timeFrame;

               // Remove from new list and add to active list.
               AnimationManager.#pendingList.splice(cntr, 1);
               AnimationManager.#activeList.push(data);
            }
         }
      }

      // Process active animations.
      for (let cntr: number = AnimationManager.#activeList.length; --cntr >= 0;)
      {
         const data: AnimationData = AnimationManager.#activeList[cntr];

         // Remove any animations that have been canceled.
         if (data.cancelled)
         {
            AnimationManager.#activeList.splice(cntr, 1);
            this.#cleanupData(data);
            continue;
         }

         data.current = timeFrame - data.start;

         // Remove this animation instance if current animating time exceeds duration.
         if (data.current >= data.duration)
         {
            // Prepare final update with end position data.
            for (let dataCntr: number = data.keys.length; --dataCntr >= 0;)
            {
               const key: string = data.keys[dataCntr];
               data.newData[key] = data.destination[key];
            }

            data.position.set(data.newData, AnimationManager.#tjsPositionSetOptions);

            AnimationManager.#activeList.splice(cntr, 1);
            this.#cleanupData(data);

            continue;
         }

         // Apply easing to create an eased time.
         const easedTime: number = data.ease(data.current / data.duration);

         for (let dataCntr: number = data.keys.length; --dataCntr >= 0;)
         {
            const key: string = data.keys[dataCntr];
            data.newData[key] = data.interpolate(data.initial[key], data.destination[key], easedTime);
         }

         data.position.set(data.newData, AnimationManager.#tjsPositionSetOptions);
      }

      globalThis.requestAnimationFrame(this.#animateBound);
   }

   /**
    * Cancels all animations for given TJSPosition instance.
    *
    * @param position - TJSPosition instance.
    *
    * @param [cancelFn] - An optional function to control cancelling animations.
    */
   static cancel(position: TJSPosition, cancelFn: AnimationCancelFunction = AnimationManager.cancelFn): void
   {
      for (let cntr: number = AnimationManager.#activeList.length; --cntr >= 0;)
      {
         const data: AnimationData = AnimationManager.#activeList[cntr];
         if (data.cancelable && data.position === position && cancelFn(data))
         {
            AnimationManager.#activeList.splice(cntr, 1);
            data.cancelled = true;
            this.#cleanupData(data);
         }
      }

      for (let cntr: number = AnimationManager.#pendingList.length; --cntr >= 0;)
      {
         const data: AnimationData = AnimationManager.#pendingList[cntr];
         if (data.cancelable && data.position === position && cancelFn(data))
         {
            AnimationManager.#pendingList.splice(cntr, 1);
            data.cancelled = true;
            this.#cleanupData(data);
         }
      }
   }

   /**
    * Cancels all active and delayed animations.
    */
   static cancelAll(): void
   {
      for (let cntr: number = AnimationManager.#activeList.length; --cntr >= 0;)
      {
         const data: AnimationData = AnimationManager.#activeList[cntr];
         data.cancelled = true;
         this.#cleanupData(data);
      }

      for (let cntr: number = AnimationManager.#pendingList.length; --cntr >= 0;)
      {
         const data: AnimationData = AnimationManager.#pendingList[cntr];
         data.cancelled = true;
         this.#cleanupData(data);
      }

      AnimationManager.#activeList.length = 0;
      AnimationManager.#pendingList.length = 0;
   }

   /**
    * @param data - Animation data to cleanup.
    */
   static #cleanupData(data: AnimationData): void
   {
      // Update state.
      data.active = false;
      data.finished = true;

      // Reset any transform origin for the animation to initial value.
      if (data.transformOriginInitial) { data.position.set({ transformOrigin: data.transformOriginInitial }); }

      if (typeof data.cleanup === 'function') { data.cleanup(data); }

      if (typeof data.resolve === 'function') { data.resolve({ cancelled: data.cancelled }); }

      // Remove retained data if not a `quickTo` animation.
      if (!data.quickTo)
      {
         data.cleanup = void 0;
         data.control = void 0;
         data.destination = void 0;
         data.el = void 0;
         data.ease = void 0;
         data.initial = void 0;
         data.interpolate = void 0;
         data.keys = void 0;
         data.newData = void 0;
         data.position = void 0;
         data.resolve = void 0;
      }
   }

   /**
    * Gets all {@link AnimationControl} instances for a given TJSPosition instance.
    *
    * @param position - TJSPosition instance.
    *
    * @returns All scheduled AnimationControl instances for the given TJSPosition instance.
    */
   static getScheduled(position: TJSPosition): BasicAnimation[]
   {
      const results: BasicAnimation[] = [];

      for (let cntr: number = AnimationManager.#activeList.length; --cntr >= 0;)
      {
         const data: AnimationData = AnimationManager.#activeList[cntr];
         if (data.position === position && data.control) { results.push(data.control); }
      }

      for (let cntr: number = AnimationManager.#pendingList.length; --cntr >= 0;)
      {
         const data: AnimationData = AnimationManager.#pendingList[cntr];
         if (data.position === position && data.control) { results.push(data.control); }
      }

      return results;
   }

   /**
    * Returns the status of any scheduled or pending animations for the given {@link TJSPosition} instance.
    *
    * @param position - TJSPosition instance.
    *
    * @param [options] - Scheduling options.
    *
    * @returns True if scheduled / false if not.
    */
   static isScheduled(position: TJSPosition, { active = true, pending = true }:
    AnimationAPI.ScheduleOptions = {}): boolean
   {
      if (active)
      {
         for (let cntr: number = AnimationManager.#activeList.length; --cntr >= 0;)
         {
            if (AnimationManager.#activeList[cntr].position === position) { return true; }
         }
      }

      if (pending)
      {
         for (let cntr: number = AnimationManager.#pendingList.length; --cntr >= 0;)
         {
            if (AnimationManager.#pendingList[cntr].position === position) { return true; }
         }
      }

      return false;
   }
}
