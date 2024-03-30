import type { EasingFunction }            from 'svelte/transition';

import type { InterpolateFunction }       from '#runtime/math/interpolate';

import type { TJSPositionData }           from '../';

import type { TJSPositionDataExtended }   from '../index.js';

interface IPositionStateAPI {
   /**
    * Returns any stored save state by name.
    *
    * @param {object}   options - Options
    *
    * @param {string}   options.name - Saved data set name.
    *
    * @returns {TJSPositionDataExtended} The saved data set.
    */
   get({ name }: { name: string }): TJSPositionDataExtended;

   /**
    * Returns any associated default data.
    *
    * @returns {TJSPositionDataExtended} Associated default data.
    */
   getDefault(): TJSPositionDataExtended;

   /**
    * Removes and returns any position state by name.
    *
    * @param {object}   options - Options.
    *
    * @param {string}   options.name - Name to remove and retrieve.
    *
    * @returns {TJSPositionDataExtended} Saved position data.
    */
   remove({ name }: { name: string }): TJSPositionDataExtended;

   /**
    * Resets data to default values and invokes set.
    *
    * @param {object}   [opts] - Optional parameters.
    *
    * @param {boolean}  [opts.keepZIndex=false] - When true keeps current z-index.
    *
    * @param {boolean}  [opts.invokeSet=true] - When true invokes set method.
    *
    * @returns {boolean} Operation successful.
    */
   reset({ keepZIndex, invokeSet }: { keepZIndex: boolean, invokeSet: boolean }): boolean;

   /**
    * Restores a saved positional state returning the data. Several optional parameters are available
    * to control whether the restore action occurs silently (no store / inline styles updates), animates
    -   * to the stored data, or simply sets the stored data. Restoring via {@link IAnimationAPI.to}
    * allows specification of the duration, easing, and interpolate functions along with configuring a Promise to be
    * returned if awaiting the end of the animation.
    *
    * @param {object}            params - Parameters
    *
    * @param {string}            params.name - Saved data set name.
    *
    * @param {boolean}           [params.remove=false] - Remove data set.
    *
    * @param {Iterable<string>}  [params.properties] - Specific properties to set / animate.
    *
    * @param {boolean}           [params.silent] - Set position data directly; no store or style updates.
    *
    * @param {boolean}           [params.async=false] - If animating return a Promise that resolves with any saved data.
    *
    * @param {boolean}           [params.animateTo=false] - Animate to restore data.
    *
    * @param {number}            [params.duration=0.1] - Duration in seconds.
    *
    * @param {EasingFunction}    [params.ease=linear] - Easing function.
    *
    * @param {InterpolateFunction}  [params.interpolate=lerp] - Interpolation function.
    *
    * @returns {TJSPositionDataExtended | Promise<TJSPositionDataExtended>} Saved position data.
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
   }): TJSPositionDataExtended | Promise<TJSPositionDataExtended>;

   /**
    * Saves current position state with the opportunity to add extra data to the saved state.
    *
    * @param {object}   opts - Options.
    *
    * @param {string}   opts.name - name to index this saved data.
    *
    * @param {...*}     [opts.extra] - Extra data to add to saved data.
    *
    * @returns {TJSPositionData} Current position data
    */
   save({ name, ...extra }: { name: string; } & Record<string, any>): TJSPositionData;

   /**
    * Directly sets a position state.
    *
    * @param {object}   opts - Options.
    *
    * @param {string}   opts.name - name to index this saved data.
    *
    * @param {...*}     [opts.data] - TJSPosition data to set.
    */
   set({ name, ...data }: { name: string; } & Record<string, any>): void;
}

export {
   IPositionStateAPI
}
