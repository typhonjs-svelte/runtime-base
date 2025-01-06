import type { EasingReference }  from '#runtime/svelte/easing';

import type { TJSPositionNS }    from '../types';

interface PositionStateAPI {
   /**
    * Clears all saved position data except any default state.
    */
   clear(): void;

   /**
    * Gets any stored saved position data by name.
    *
    * @param {object}   options - Options.
    *
    * @param {string}   options.name - Saved data name.
    *
    * @returns {Data.TJSPositionDataExtra | undefined} Any saved position data.
    */
   get({ name }: { name: string }): TJSPositionNS.Data.TJSPositionDataExtra | undefined;

   /**
    * Returns any associated default position data.
    *
    * @returns {Data.TJSPositionDataExtra | undefined} Any saved default position data.
    */
   getDefault(): TJSPositionNS.Data.TJSPositionDataExtra | undefined;

   /**
    * @returns {IterableIterator<string>} The saved position data names / keys.
    */
   keys(): IterableIterator<string>;

   /**
    * Removes and returns any position data by name.
    *
    * @param {object}   options - Options.
    *
    * @param {string}   options.name - Name to remove and retrieve.
    *
    * @returns {Data.TJSPositionDataExtra | undefined} Any saved position data.
    */
   remove({ name }: { name: string }): TJSPositionNS.Data.TJSPositionDataExtra | undefined;

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
   reset({ keepZIndex, invokeSet }: { keepZIndex?: boolean, invokeSet?: boolean }): boolean;

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
    * @param {EasingReference}   [options.ease='linear'] - Easing function name or function.
    *
    * @returns {Data.TJSPositionDataExtra | Promise<Data.TJSPositionDataExtra | undefined> | undefined} Any saved
    *          position data.
    */
   restore({ name, remove, properties, silent, async, animateTo, duration, ease }: {
      name: string,
      remove?: boolean,
      properties?: Iterable<string>,
      silent?: boolean,
      async?: boolean,
      animateTo?: boolean,
      duration?: number,
      ease?: EasingReference,
   }): TJSPositionNS.Data.TJSPositionDataExtra | Promise<TJSPositionNS.Data.TJSPositionDataExtra | undefined> |
    undefined;

   /**
    * Saves current position state with the opportunity to add extra data to the saved state. Simply include
    * extra properties in `options` to save extra data.
    *
    * @param {object}   options - Options.
    *
    * @param {string}   options.name - name to index this saved data.
    *
    * @param {import('../types').TJSPositionNS.Options.Get} [optionsGet] - Additional options for
    *        {@link TJSPosition.get} when serializing position state. By default, `nullable` values are included.
    *
    * @returns {Data.TJSPositionDataExtra} Current position data
    */
   save({ name, ...extra }: {
      name: string;
      [key: string]: any;
   }, optionsGet: TJSPositionNS.Options.Get): TJSPositionNS.Data.TJSPositionDataExtra;

   /**
    * Directly sets a saved position state. Simply include extra properties in `options` to set extra data.
    *
    * @param {object}   options - Options.
    *
    * @param {string}   options.name - name to index this saved data.
    */
   set({ name, ...data }: {
      name: string;
      [key: string]: any;
   }): void;
}

declare namespace PositionStateAPI {
   export namespace Options {
      /**
       * Options for `TJSPosition.state.reset`.
       */
      export type Reset = {
         /**
          * When true keeps current z-index.
          * @defaultValue `false`
          */
         keepZIndex?: boolean;

         /**
          * When true invokes set method.
          * @defaultValue `true`
          */
         invokeSet?: boolean;
      }

      /**
       * Options for `TJSPosition.state.restore`.
       */
      export type Restore = {
         /**
          * Saved data name.
          */
         name: string;

         /**
          * Deletes data set.
          * @defaultValue `false`
          */
         remove?: boolean;

         /**
          * Specific properties to set / animate.
          */
         properties?: Iterable<string>;

         /**
          * Set position data directly; no store or style updates.
          */
         silent?: boolean;

         /**
          * If animating return a Promise that resolves with any saved data.
          * @defaultValue `false`
          */
         async?: boolean;

         /**
          * Animate to restore data.
          * @defaultValue `false`
          */
         animateTo?: boolean;

         /**
          * Duration in seconds.
          */
         duration?: number;

         /**
          * Easing function name or function.
          * @defaultValue `linear`
          */
         ease?: EasingReference;
      }

      /**
       * Options for `TJSPosition.state.save`. You may include extra data that is serialized with position state.
       */
      export type Save = {
         /**
          * Name to index this saved data.
          */
         name: string;

         [key: string]: any;
      }

      /**
       * Options for `TJSPosition.state.set`. You may include extra data that is serialized with position state.
       */
      export type Set = {
         /**
          * Name to index this saved data.
          */
         name: string;

         [key: string]: any;
      }
   }
}

export {
   PositionStateAPI
}
