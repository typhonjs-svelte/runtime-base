import { type System } from './system/types';

/**
 * Provides all interfaces and type aliases used by {@link TJSPosition}.
 */
namespace TJSPositionTypes {
   /**
    * Provides the default {@link System.Initial.IInitialSystem} implementations available.
    */
   export type PositionInitial = {
      /**
       * A locked instance of the `Centered` initial helper suitable for displaying elements in the browser window.
       */
      browserCentered: System.Initial.IInitialSystem,

      /**
       * The `Centered` class constructor to instantiate a new instance.
       * @constructor
       */
      Centered: System.Initial.IInitialSystemConstructor
   }

   /**
    * Provides the default {@link System.Initial.IValidatorSystem} implementations available.
    */
   export type PositionValidators = {
      /**
       * The `BasicBounds` class constructor to instantiate a new instance.
       */
      BasicBounds: System.Validator.IValidatorSystemConstructor,

      /**
       * A locked instance of the `BasicBounds` validator suitable for non-transformed bounds checking against the
       * browser window.
       */
      basicWindow: System.Validator.IValidatorSystem,

      /**
       * The `TransformBounds` class constructor to instantiate a new instance.
       */
      TransformBounds: System.Validator.IValidatorSystemConstructor,

      /**
       * A locked instance of the `TransformBounds` validator suitable for transformed bounds checking against the
       * browser window.
       */
      transformWindow: System.Validator.IValidatorSystem
   };
}

export { TJSPositionTypes }
