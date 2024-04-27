import type { InterpolateFunction } from '#runtime/math/interpolate';
import type { EasingFunction }      from '#runtime/svelte/easing';

import type { TJSPositionTypes }    from '../types';
import type { Data }                from '../data/types';

interface PositionStateAPI {
   /**
    * Returns any stored save state by name.
    *
    * @param {object}   options - Options
    *
    * @param {string}   options.name - Saved data set name.
    *
    * @returns {Data.TJSPositionDataExtra} The saved data set.
    */
   get({ name }: { name: string }): Data.TJSPositionDataExtra;

   /**
    * Returns any associated default data.
    *
    * @returns {Data.TJSPositionDataExtra} Associated default data.
    */
   getDefault(): Data.TJSPositionDataExtra;

   /**
    * Removes and returns any position state by name.
    *
    * @param {object}   options - Options.
    *
    * @param {string}   options.name - Name to remove and retrieve.
    *
    * @returns {Data.TJSPositionDataExtra} Saved position data.
    */
   remove({ name }: { name: string }): Data.TJSPositionDataExtra;

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
   reset({ keepZIndex, invokeSet }: { keepZIndex: boolean, invokeSet: boolean }): boolean;

   /**
    * Restores a saved positional state returning the data. Several optional parameters are available
    * to control whether the restore action occurs silently (no store / inline styles updates), animates
    -   * to the stored data, or simply sets the stored data. Restoring via {@link AnimationAPI.to}
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
    * @param {EasingFunction}    [options.ease=linear] - Easing function.
    *
    * @param {InterpolateFunction}  [options.interpolate=lerp] - Interpolation function.
    *
    * @returns {Data.TJSPositionDataExtra | Promise<Data.TJSPositionDataExtra>} Saved position data.
    */
   restore({ name, remove, properties, silent, async, animateTo, duration, ease, interpolate }: {
      name: string,
      remove?: boolean,
      properties?: Iterable<string>,
      silent?: boolean,
      async?: boolean,
      animateTo?: boolean,
      duration?: number,
      ease?: EasingFunction,
      interpolate?: InterpolateFunction
   }): Data.TJSPositionDataExtra | Promise<Data.TJSPositionDataExtra>;

   /**
    * Saves current position state with the opportunity to add extra data to the saved state. Simply include
    * extra properties in `options` to save extra data.
    *
    * @param {object}   options - Options.
    *
    * @param {string}   options.name - name to index this saved data.
    *
    * @param {import('../types').TJSPositionTypes.OptionsGet} [optionsGet] - Additional options for
    *        {@link TJSPosition.get} when serializing position state.
    *
    * @returns {Data.TJSPositionDataExtra} Current position data
    */
   save({ name, ...extra }: {
      name: string;
      [key: string]: any;
   }, optionsGet: TJSPositionTypes.OptionsGet): Data.TJSPositionDataExtra;

   /**
    * Directly sets a position state. Simply include extra properties in `options` to set extra data.
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

export {
   PositionStateAPI
}
