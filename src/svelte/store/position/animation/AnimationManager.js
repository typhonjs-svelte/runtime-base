/**
 * Provides animation management and scheduling allowing all TJSPosition instances to utilize one micro-task.
 */
export class AnimationManager
{
   /**
    * Defines the options used for {@link TJSPosition.set}.
    *
    * @type {Readonly<{immediateElementUpdate: boolean}>}
    */
   static #tjsPositionSetOptions = Object.freeze({ immediateElementUpdate: true });

   /**
    * @type {import('./types-local').AnimationData[]}
    */
   static #activeList = [];

   /**
    * Provides the `this` context for {@link AnimationManager.animate} to be scheduled on rAF.
    *
    * @type {Function}
    */
   static #animateBound = (timeFrame) => this.animate(timeFrame);

   /**
    * @type {import('./types-local').AnimationData[]}
    */
   static #pendingList = [];

   /**
    * Time of last `rAF` callback.
    *
    * @type {number}
    */
   static #timeFrame;

   /**
    * Time of `performance.now()` at last `rAF` callback.
    *
    * @type {number}
    */
   static #timeNow;

   /**
    * @returns {number} Time of last `rAF` callback.
    */
   static get timeFrame()
   {
      return this.#timeFrame;
   }

   /**
    * @returns {number} Time of `performance.now()` at last `rAF` callback.
    */
   static get timeNow()
   {
      return this.#timeNow;
   }

   /**
    * Add animation data.
    *
    * @param {import('./types-local').AnimationData}   data -
    */
   static add(data)
   {
      const now = performance.now();

      // Offset start time by delta between last rAF time. This allows continuous tween cycles to appear naturally as
      // starting from the instant they are added to the AnimationManager. This is what makes `draggable` smooth when
      // easing is enabled.
      data.start = now + (AnimationManager.#timeNow - now);

      if (data.cancelled)
      {
         this.#cleanupData(data);
         return;
      }

      if (data.active)
      {
         AnimationManager.#activeList.push(data);
      }
      else
      {
         AnimationManager.#pendingList.push(data);
      }
   }

   /**
    * Manage all animation
    */
   static animate(timeFrame)
   {
      AnimationManager.#timeNow = performance.now();
      AnimationManager.#timeFrame = timeFrame;

      // Early out of the rAF callback when there are no current animations.
      if (AnimationManager.#activeList.length === 0 && AnimationManager.#pendingList.length === 0)
      {
         globalThis.requestAnimationFrame(this.#animateBound);
         return;
      }

      if (AnimationManager.#pendingList.length)
      {
         // Process new data
         for (let cntr = AnimationManager.#pendingList.length; --cntr >= 0;)
         {
            const data = AnimationManager.#pendingList[cntr];

            // If animation instance has been cancelled before start then remove it from new list and cleanup.
            if (data.cancelled || (data.el !== void 0 && !data.el.isConnected))
            {
               AnimationManager.#pendingList.splice(cntr, 1);
               this.#cleanupData(data);
            }

            // If data is active then process it now. Delayed animations start with `active` false.
            if (data.active)
            {
               // Remove from new list and add to active list.
               AnimationManager.#pendingList.splice(cntr, 1);
               AnimationManager.#activeList.push(data);
            }
         }
      }

      // Process active animations.
      for (let cntr = AnimationManager.#activeList.length; --cntr >= 0;)
      {
         const data = AnimationManager.#activeList[cntr];

         // Remove any animations that have been canceled.
         if (data.cancelled || (data.el !== void 0 && !data.el.isConnected))
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
            for (let dataCntr = data.keys.length; --dataCntr >= 0;)
            {
               const key = data.keys[dataCntr];
               data.newData[key] = data.destination[key];
            }

            data.position.set(data.newData, AnimationManager.#tjsPositionSetOptions);

            AnimationManager.#activeList.splice(cntr, 1);
            this.#cleanupData(data);

            continue;
         }

         // Apply easing to create an eased time.
         const easedTime = data.ease(data.current / data.duration);

         for (let dataCntr = data.keys.length; --dataCntr >= 0;)
         {
            const key = data.keys[dataCntr];
            data.newData[key] = data.interpolate(data.initial[key], data.destination[key], easedTime);
         }

         data.position.set(data.newData, AnimationManager.#tjsPositionSetOptions);
      }

      globalThis.requestAnimationFrame(this.#animateBound);
   }

   /**
    * Cancels all animations for given TJSPosition instance.
    *
    * @param {import('../').TJSPosition} position - TJSPosition instance.
    */
   static cancel(position)
   {
      for (let cntr = AnimationManager.#activeList.length; --cntr >= 0;)
      {
         const data = AnimationManager.#activeList[cntr];
         if (data.position === position)
         {
            AnimationManager.#activeList.splice(cntr, 1);
            data.cancelled = true;
            this.#cleanupData(data);
         }
      }

      for (let cntr = AnimationManager.#pendingList.length; --cntr >= 0;)
      {
         const data = AnimationManager.#pendingList[cntr];
         if (data.position === position)
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
   static cancelAll()
   {
      for (let cntr = AnimationManager.#activeList.length; --cntr >= 0;)
      {
         const data = AnimationManager.#activeList[cntr];
         data.cancelled = true;
         this.#cleanupData(data);
      }

      for (let cntr = AnimationManager.#pendingList.length; --cntr >= 0;)
      {
         const data = AnimationManager.#pendingList[cntr];
         data.cancelled = true;
         this.#cleanupData(data);
      }

      AnimationManager.#activeList.length = 0;
      AnimationManager.#pendingList.length = 0;
   }

   /**
    * @param {import('./types-local').AnimationData}  data - Animation data to cleanup.
    */
   static #cleanupData(data)
   {
      // Update state.
      data.active = false;
      data.finished = true;

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
    * @param {import('../index.js').TJSPosition} position - TJSPosition instance.
    *
    * @returns {import('#runtime/util/animate').BasicAnimation[]} All scheduled AnimationControl instances for the
    *          given TJSPosition instance.
    */
   static getScheduled(position)
   {
      const results = [];

      for (let cntr = AnimationManager.#activeList.length; --cntr >= 0;)
      {
         const data = AnimationManager.#activeList[cntr];
         if (data.position === position) { results.push(data.control); }
      }

      for (let cntr = AnimationManager.#pendingList.length; --cntr >= 0;)
      {
         const data = AnimationManager.#pendingList[cntr];
         if (data.position === position) { results.push(data.control); }
      }

      return results;
   }

   /**
    * Returns the status of any scheduled or pending animations for the given {@link TJSPosition} instance.
    *
    * @param {import('../index.js').TJSPosition} position - TJSPosition instance.
    *
    * @returns {boolean} True if scheduled / false if not.
    */
   static isScheduled(position)
   {
      for (let cntr = AnimationManager.#activeList.length; --cntr >= 0;)
      {
         if (AnimationManager.#activeList[cntr].position === position) { return true; }
      }

      for (let cntr = AnimationManager.#pendingList.length; --cntr >= 0;)
      {
         if (AnimationManager.#pendingList[cntr].position === position) { return true; }
      }

      return false;
   }
}

// Start animation manager immediately. It constantly is running in background.
AnimationManager.animate();
