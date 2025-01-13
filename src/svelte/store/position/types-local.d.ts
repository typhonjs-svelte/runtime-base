// Private internal types not in publicly exposed API.

import type { Data }    from './data/types';
import type { System }  from './system/types';

/**
 * Defines the internal options managed.
 */
type OptionsInternal = {
   /**
    * When true always calculate transform data. Set by constructor option.
    */
   calculateTransform: boolean;

   /**
    * Provides a helper for setting initial position location. Set by constructor option.
    */
   initial: System.Initial.InitialSystem | undefined;

   /**
    * Sets TJSPosition to orthographic mode using just `transform` / `matrix3d` CSS for positioning. Set by
    * constructor option.
    */
   ortho: boolean;

   /**
    * Dynamically set to true when there are subscribers to the readable transform store.
    */
   transformSubscribed: boolean;
};

/**
 * Used internally to TJSPosition to define additional aliases that `set` position data may include.
 */
interface TJSPositionDataWithAlias extends Data.TJSPositionData
{
   // Additional alias for `rotateZ`
   rotation: number | null;
}

export {
   OptionsInternal,
   TJSPositionDataWithAlias
}
