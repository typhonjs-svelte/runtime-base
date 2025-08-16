import {
   isIterable,
   isObject }                 from '#runtime/util/object';

import type { TJSPosition }   from '../TJSPosition';

import type { StateAPI }      from './types';

import type { Data }          from '../data/types';
import type { TransformAPI }  from '../transform/types';

/**
 *
 */
export class PositionStateAPI implements StateAPI
{
   /**
    */
   readonly #data: Data.TJSPositionData;

   /**
    */
   #dataSaved: Map<string, Data.TJSPositionDataExtra> = new Map();

   /**
    */
   #position: TJSPosition;

   /**
    */
   #transforms: TransformAPI;

   constructor(position: TJSPosition, data: Data.TJSPositionData, transforms: TransformAPI)
   {
      this.#position = position;
      this.#data = data;
      this.#transforms = transforms;

      Object.seal(this);
   }

   /**
    * Clears all saved position data except any default state.
    */
   clear(): void
   {
      for (const key of this.#dataSaved.keys())
      {
         if (key !== '#defaultData') { this.#dataSaved.delete(key); }
      }
   }

   /**
    * Returns any stored save state by name.
    *
    * @param options - Options.
    *
    * @param options.name - Saved data name.
    *
    * @returns Any saved position data.
    */
   get({ name }: { name: string }): Data.TJSPositionDataExtra | undefined
   {
      if (typeof name !== 'string') { throw new TypeError(`TJSPosition - get error: 'name' is not a string.`); }

      return this.#dataSaved.get(name);
   }

   /**
    * Returns any associated default position data.
    *
    * @returns Any saved default position data.
    */
   getDefault(): Data.TJSPositionDataExtra | undefined
   {
      return this.#dataSaved.get('#defaultData');
   }

   /**
    * @returns The saved position data names / keys.
    */
   keys(): MapIterator<string>
   {
      return this.#dataSaved.keys();
   }

   /**
    * Removes and returns any position data by name.
    *
    * @param options - Options.
    *
    * @param options.name - Name to remove and retrieve.
    *
    * @returns Any saved position data.
    */
   remove({ name }: { name: string }): Data.TJSPositionDataExtra | undefined
   {
      if (typeof name !== 'string') { throw new TypeError(`TJSPosition - remove: 'name' is not a string.`); }

      const data = this.#dataSaved.get(name);
      this.#dataSaved.delete(name);

      return data;
   }

   /**
    * Resets position instance to default data and invokes set.
    *
    * @param [options] - Optional parameters.
    *
    * @param [options.keepZIndex=false] - When true keeps current z-index.
    *
    * @param [options.invokeSet=true] - When true invokes set method.
    *
    * @returns Operation successful.
    */
   reset({ keepZIndex = false, invokeSet = true }: StateAPI.Options.Reset = {}): boolean
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

      const parent: any = this.#position.parent;

      // If current minimized invoke `maximize`. TODO: REFACTOR FOR APPLICATION DIRECT ACCESS.
      if (parent?.reactive?.minimized)
      {
         parent?.maximize?.({ animate: false, duration: 0 });
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
    * @param options - Parameters
    *
    * @param options.name - Saved data set name.
    *
    * @param [options.remove=false] - Deletes data set.
    *
    * @param [options.properties] - Specific properties to set / animate.
    *
    * @param [options.silent] - Set position data directly; no store or style updates.
    *
    * @param [options.async=false] - If animating return a Promise that resolves with any saved data.
    *
    * @param [options.animateTo=false] - Animate to restore data.
    *
    * @param [options.cancelable=true] - When false, any animation can not be cancelled.
    *
    * @param [options.duration=0.1] - Duration in seconds.
    *
    * @param [options.ease='linear'] - Easing function name or function.
    *
    * @returns Any saved position data.
    */
   restore({ name, remove = false, properties, silent = false, async = false, animateTo = false, cancelable = true,
    duration = 0.1, ease = 'linear' }: StateAPI.Options.Restore): Data.TJSPositionDataExtra |
     Promise<Data.TJSPositionDataExtra | undefined>  | undefined
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
            for (const property in data)
            {
               if (property in this.#data) { this.#data[property] = data[property]; }
            }
            return dataSaved;
         }
         else if (animateTo)  // Animate to saved data.
         {
            // Provide special handling to potentially change transform origin as this parameter is not animated.
            if (data.transformOrigin !== this.#position.transformOrigin)
            {
               this.#position.transformOrigin = data.transformOrigin as TransformAPI.TransformOrigin;
            }

            // Return a Promise with saved data that resolves after animation ends.
            if (async)
            {
               return this.#position.animate.to(data, { cancelable, duration, ease }).finished.then(() => dataSaved);
            }
            else  // Animate synchronously.
            {
               this.#position.animate.to(data, { cancelable, duration, ease });
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
    * Saves current position state with the opportunity to add extra data to the saved state. Simply include extra
    * properties in `options` to save extra data.
    *
    * @param options - Options.
    *
    * @param options.name - name to index this saved data.
    *
    * @param [optionsGet] - Additional options for {@link TJSPosition.get} when serializing position state. By default,
    *        `nullable` values are included.
    *
    * @returns Current position data plus any extra data stored.
    */
   save({ name, ...extra }: StateAPI.Options.Save, optionsGet?: TJSPosition.Options.Get):
    Data.TJSPositionDataExtra
   {
      if (typeof name !== 'string') { throw new TypeError(`TJSPosition - save error: 'name' is not a string.`); }

      const data = this.#position.get(extra, optionsGet);

      this.#dataSaved.set(name, data);

      return data;
   }

   /**
    * Directly sets a saved position state. Simply include extra properties in `options` to set extra data.
    *
    * @param opts - Options.
    *
    * @param opts.name - name to index this saved data.
    */
   set({ name, ...data }: StateAPI.Options.Set): void
   {
      if (typeof name !== 'string') { throw new TypeError(`TJSPosition - set error: 'name' is not a string.`); }

      this.#dataSaved.set(name, data);
   }
}
