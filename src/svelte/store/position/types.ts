import type { Readable }      from 'svelte/store';

import type { TJSPosition }   from './TJSPosition';
import type { Data }          from './data/types';
import type { System }        from './system/types';

/**
 * Provides all interfaces and type aliases used by {@link TJSPosition}.
 */
namespace TJSPositionTypes {
   /**
    * Defines the shape of an instance / object that is positionable.
    */
   export interface Positionable {
      position: TJSPosition;
   }

   export interface ITJSPosition extends Readable<Data.TJSPositionData> {}

   /**
    * Options for {@link TJSPosition.get}
    */
   export type OptionsGet = {
      /**
       * When provided only these keys are copied.
       */
      keys?: Iterable<string>;

      /**
       * When provided these keys are excluded.
       */
      exclude?: Iterable<string>;

      /**
       * When true any `null` values are converted into defaults.
       */
      numeric?: boolean;
   }

   /**
    * Defines one or more positions or positionable objects.
    */
   export type PositionGroup = TJSPosition | Positionable | Iterable<TJSPosition> | Iterable<Positionable>;

   /**
    * Provides the default {@link System.Initial.InitialSystem} implementations available.
    */
   export type PositionInitial = {
      /**
       * A locked instance of the `Centered` initial helper suitable for displaying elements in the browser window.
       */
      browserCentered: System.Initial.InitialSystem,

      /**
       * The `Centered` class constructor to instantiate a new instance.
       * @constructor
       */
      Centered: System.Initial.InitialSystemConstructor
   }

   /**
    * Provides the default {@link System.Initial.ValidatorSystem} implementations available.
    */
   export type PositionValidators = {
      /**
       * The `BasicBounds` class constructor to instantiate a new instance.
       */
      BasicBounds: System.Validator.ValidatorSystemConstructor,

      /**
       * A locked instance of the `BasicBounds` validator suitable for non-transformed bounds checking against the
       * browser window.
       */
      basicWindow: System.Validator.ValidatorSystem,

      /**
       * The `TransformBounds` class constructor to instantiate a new instance.
       */
      TransformBounds: System.Validator.ValidatorSystemConstructor,

      /**
       * A locked instance of the `TransformBounds` validator suitable for transformed bounds checking against the
       * browser window.
       */
      transformWindow: System.Validator.ValidatorSystem
   };
}

export { TJSPositionTypes }
