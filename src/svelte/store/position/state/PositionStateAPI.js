import {
   isIterable,
   isObject }     from '#runtime/util/object';

/**
 * @implements {import('./types').PositionStateAPI}
 */
export class PositionStateAPI
{
   /** @type {import('../data/types').Data.TJSPositionData} */
   #data;

   /**
    * @type {Map<string, import('../data/types').Data.TJSPositionDataExtra>}
    */
   #dataSaved = new Map();

   /** @type {import('../').TJSPosition} */
   #position;

   /** @type {import('../transform').TJSTransforms} */
   #transforms;

   constructor(position, data, transforms)
   {
      this.#position = position;
      this.#data = data;
      this.#transforms = transforms;

      Object.seal(this);
   }

   /**
    * Clears all saved position data except any default state.
    */
   clear()
   {
      for (const key of this.#dataSaved.keys())
      {
         if (key !== '#defaultData') { this.#dataSaved.delete(key); }
      }
   }

   /**
    * Returns any stored save state by name.
    *
    * @param {object}   options - Options.
    *
    * @param {string}   options.name - Saved data name.
    *
    * @returns {import('../data/types').Data.TJSPositionDataExtra | undefined} Any saved position data.
    */
   get({ name })
   {
      if (typeof name !== 'string') { throw new TypeError(`TJSPosition - get error: 'name' is not a string.`); }

      return this.#dataSaved.get(name);
   }

   /**
    * Returns any associated default position data.
    *
    * @returns {import('../data/types').Data.TJSPositionDataExtra | undefined} Any saved default position data.
    */
   getDefault()
   {
      return this.#dataSaved.get('#defaultData');
   }

   /**
    * @returns {IterableIterator<string>} The saved position data names / keys.
    */
   keys()
   {
      return this.#dataSaved.keys();
   }

   /**
    * Removes and returns any position data by name.
    *
    * @param {object}   options - Options.
    *
    * @param {string}   options.name - Name to remove and retrieve.
    *
    * @returns {import('../data/types').Data.TJSPositionDataExtra | undefined} Any saved position data.
    */
   remove({ name })
   {
      if (typeof name !== 'string') { throw new TypeError(`TJSPosition - remove: 'name' is not a string.`); }

      const data = this.#dataSaved.get(name);
      this.#dataSaved.delete(name);

      return data;
   }

   /**
    * Resets position instance to default data and invokes set.
    *
    * @param {object}   [options] - Optional parameters.
    *
    * @param {boolean}  [options.keepZIndex=false] - When true keeps current z-index.
    *
    * @param {boolean}  [options.invokeSet=true] - When true invokes set method.
    *
    * @returns {boolean} Operation successful.
    */
   reset({ keepZIndex = false, invokeSet = true } = {})
   {
      const defaultData = this.#dataSaved.get('#defaultData');

      // Quit early if there is no saved default data.
      if (!isObject(defaultData)) { return false; }

      // Cancel all animations for TJSPosition if there are currently any scheduled.
      if (this.#position.animate.isScheduled) { this.#position.animate.cancel(); }

      const zIndex = this.#position.zIndex;

      const data = Object.assign({}, defaultData);

      if (keepZIndex) { data.zIndex = zIndex; }

      // Reset the transform data.
      this.#transforms.reset(data);

      // TODO: REFACTOR FOR APPLICATION DIRECT ACCESS.

      // If current minimized invoke `maximize`.
      if (this.#position.parent?.reactive?.minimized)
      {
         this.#position.parent?.maximize?.({ animate: false, duration: 0 });
      }

      // Note next clock tick scheduling.
      if (invokeSet) { setTimeout(() => this.#position.set(data), 0); }

      return true;
   }

   /**
    * Restores a saved positional state returning the data. Several optional parameters are available to control
    * whether the restore action occurs silently (no store / inline styles updates), animates to the stored data, or
    * simply sets the stored data. Restoring via {@link AnimationAPI.to} allows specification of the duration and
    * easing along with configuring a Promise to be returned if awaiting the end of the animation.
    *
    * @param {object}            options - Parameters
    *
    * @param {string}            options.name - Saved data set name.
    *
    * @param {boolean}           [options.remove=false] - Deletes data set.
    *
    * @param {Iterable<string>}  [options.properties] - Specific properties to set / animate.
    *
    * @param {boolean}           [options.silent] - Set position data directly; no store or style updates.
    *
    * @param {boolean}           [options.async=false] - If animating return a Promise that resolves with any saved
    *        data.
    *
    * @param {boolean}           [options.animateTo=false] - Animate to restore data.
    *
    * @param {number}            [options.duration=0.1] - Duration in seconds.
    *
    * @param {import('#runtime/svelte/easing').EasingReference} [options.ease='linear'] - Easing function name or
    *        function.
    *
    * @returns {(
    *    import('../data/types').Data.TJSPositionDataExtra |
    *    Promise<import('../data/types').Data.TJSPositionDataExtra | undefined> |
    *    undefined
    * )} Any saved position data.
    */
   restore({ name, remove = false, properties, silent = false, async = false, animateTo = false, duration = 0.1,
    ease = 'linear' })
   {
      if (typeof name !== 'string') { throw new TypeError(`TJSPosition - restore error: 'name' is not a string.`); }

      const dataSaved = this.#dataSaved.get(name);

      if (dataSaved)
      {
         if (remove) { this.#dataSaved.delete(name); }

         let data = dataSaved;

         if (isIterable(properties))
         {
            data = {};
            for (const property of properties) { data[property] = dataSaved[property]; }
         }

         // Update data directly with no store or inline style updates.
         if (silent)
         {
            for (const property in data) { this.#data[property] = data[property]; }
            return dataSaved;
         }
         else if (animateTo)  // Animate to saved data.
         {
            // Provide special handling to potentially change transform origin as this parameter is not animated.
            if (data.transformOrigin !== this.#position.transformOrigin)
            {
               this.#position.transformOrigin = data.transformOrigin;
            }

            // Return a Promise with saved data that resolves after animation ends.
            if (async)
            {
               return this.#position.animate.to(data, { duration, ease }).finished.then(() => dataSaved);
            }
            else  // Animate synchronously.
            {
               this.#position.animate.to(data, { duration, ease });
            }
         }
         else
         {
            // Default options is to set data for an immediate update.
            this.#position.set(data);
         }
      }

      // Saved data potentially not found, but must still return a Promise when async is true.
      return async ? Promise.resolve(dataSaved) : dataSaved;
   }

   /**
    * Saves current position state with the opportunity to add extra data to the saved state. Simply include
    * extra properties in `options` to save extra data.
    *
    * @param {object}   options - Options.
    *
    * @param {string}   options.name - name to index this saved data.
    *
    * @param {import('../types').TJSPositionTypes.OptionsGet} [optionsGet] - Additional options for
    *        {@link TJSPosition.get} when serializing position state. By default, `nullable` values are included.
    *
    * @returns {import('../data/types').Data.TJSPositionDataExtra} Current position data plus any extra data stored.
    */
   save({ name, ...extra }, optionsGet)
   {
      if (typeof name !== 'string') { throw new TypeError(`TJSPosition - save error: 'name' is not a string.`); }

      const data = this.#position.get(extra, optionsGet);

      this.#dataSaved.set(name, data);

      return data;
   }

   /**
    * Directly sets a saved position state. Simply include extra properties in `options` to set extra data.
    *
    * @param {object}   opts - Options.
    *
    * @param {string}   opts.name - name to index this saved data.
    */
   set({ name, ...data })
   {
      if (typeof name !== 'string') { throw new TypeError(`TJSPosition - set error: 'name' is not a string.`); }

      this.#dataSaved.set(name, data);
   }
}
