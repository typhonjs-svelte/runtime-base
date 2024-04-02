import { linear }       from '#svelte/easing';

import { lerp }         from '#runtime/math/interpolate';
import {
   isIterable,
   isObject }           from '#runtime/util/object';

/**
 * @implements {import('./types').IPositionStateAPI}
 */
export class PositionStateAPI
{
   /** @type {import('./').TJSPositionData} */
   #data;

   /**
    * @type {Map<string, import('../').TJSPositionDataExtended>}
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
   }

   /**
    * Returns any stored save state by name.
    *
    * @param {object}   options - Options
    *
    * @param {string}   options.name - Saved data set name.
    *
    * @returns {import('../').TJSPositionDataExtended} The saved data set.
    */
   get({ name })
   {
      if (typeof name !== 'string') { throw new TypeError(`Position - getSave error: 'name' is not a string.`); }

      return this.#dataSaved.get(name);
   }

   /**
    * Returns any associated default data.
    *
    * @returns {import('../').TJSPositionDataExtended} Associated default data.
    */
   getDefault()
   {
      return this.#dataSaved.get('#defaultData');
   }

   /**
    * Removes and returns any position state by name.
    *
    * @param {object}   options - Options.
    *
    * @param {string}   options.name - Name to remove and retrieve.
    *
    * @returns {import('../').TJSPositionDataExtended} Saved position data.
    */
   remove({ name })
   {
      if (typeof name !== 'string') { throw new TypeError(`Position - remove: 'name' is not a string.`); }

      const data = this.#dataSaved.get(name);
      this.#dataSaved.delete(name);

      return data;
   }

   /**
    * Resets data to default values and invokes set.
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
      if (this.#position.animate.isScheduled)
      {
         this.#position.animate.cancel();
      }

      const zIndex = this.#position.zIndex;

      const data = Object.assign({}, defaultData);

      if (keepZIndex) { data.zIndex = zIndex; }

      // Reset the transform data.
      this.#transforms.reset(data);

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
    * Restores a saved positional state returning the data. Several optional parameters are available
    * to control whether the restore action occurs silently (no store / inline styles updates), animates
-   * to the stored data, or simply sets the stored data. Restoring via {@link IAnimationAPI.to}
    * allows specification of the duration, easing, and interpolate functions along with configuring a Promise to be
    * returned if awaiting the end of the animation.
    *
    * @param {object}            options - Parameters
    *
    * @param {string}            options.name - Saved data set name.
    *
    * @param {boolean}           [options.remove=false] - Remove data set.
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
    * @param {import('svelte/transition').EasingFunction}   [options.ease=linear] - Easing function.
    *
    * @param {import('#runtime/math/interpolate').InterpolateFunction}  [options.interpolate=lerp] - Interpolation
    *        function.
    *
    * @returns {import('../').TJSPositionDataExtended | Promise<import('../').TJSPositionDataExtended>} Saved position
    *          data.
    */
   restore({ name, remove = false, properties, silent = false, async = false, animateTo = false, duration = 0.1,
    ease = linear, interpolate = lerp })
   {
      if (typeof name !== 'string') { throw new TypeError(`Position - restore error: 'name' is not a string.`); }

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
               return this.#position.animate.to(data, { duration, ease, interpolate }).finished.then(() => dataSaved);
            }
            else  // Animate synchronously.
            {
               this.#position.animate.to(data, { duration, ease, interpolate });
            }
         }
         else
         {
            // Default options is to set data for an immediate update.
            this.#position.set(data);
         }
      }

      return dataSaved;
   }

   /**
    * Saves current position state with the opportunity to add extra data to the saved state. Simply include
    * extra properties in `options` to save extra data.
    *
    * @param {object}   options - Options.
    *
    * @param {string}   options.name - name to index this saved data.
    *
    * @returns {import('./').TJSPositionData} Current position data.
    */
   save({ name, ...extra })
   {
      if (typeof name !== 'string') { throw new TypeError(`Position - save error: 'name' is not a string.`); }

      const data = this.#position.get(extra);

      this.#dataSaved.set(name, data);

      return data;
   }

   /**
    * Directly sets position state data. Simply include extra properties in `options` to set extra data.
    *
    * @param {object}   opts - Options.
    *
    * @param {string}   opts.name - name to index this saved data.
    */
   set({ name, ...data })
   {
      if (typeof name !== 'string') { throw new TypeError(`Position - set error: 'name' is not a string.`); }

      this.#dataSaved.set(name, data);
   }
}
