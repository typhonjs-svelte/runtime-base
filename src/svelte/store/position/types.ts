import type {
   Readable,
   Writable }                       from 'svelte/store';

import type { ResizeObserverData }  from '#runtime/util/dom/observer';

import type { TJSPosition }         from './TJSPosition';
import type { Data }                from './data/types';
import type { System }              from './system/types';
import type { ValidatorAPI }        from './system/validators/types';
import type { TransformAPI }        from './transform/types';

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

   /**
    * Provides an overloaded {@link Writable} store interface for {@link TJSPosition.set}.
    */
   export interface TJSPositionWritable extends Writable<Data.TJSPositionDataRelative>
   {
      set(this: void, value: Data.TJSPositionDataRelative, options?: OptionsSet): TJSPosition;
   }

   /**
    * Defines the unique options available for setting in the constructor of {@link TJSPosition}.
    */
   export type OptionsCtor = {
      /**
       * When true always calculate transform data.
       */
      calculateTransform: boolean;

      /**
       * Provides a helper for setting initial position location.
       */
      initial: System.Initial.InitialSystem;

      /**
       * Sets TJSPosition to orthographic mode using just `transform` / `matrix3d` CSS for positioning.
       */
      ortho: boolean;

      /**
       * Provides an initial validator or list of validators.
       */
      validator: ValidatorAPI.ValidatorOption;
   }

   /**
    * Provides the complete options object including unique {@link TJSPosition} options in addition to positional
    * data that is available to set in the constructor.
    */
   export type OptionsCtorAll = Partial<OptionsCtor & Data.TJSPositionDataExtra>;

   /**
    * Options for {@link TJSPosition.get}.
    */
   export type OptionsGet = {
      /**
       * When provided only these keys are copied.
       */
      keys?: Iterable<keyof Data.TJSPositionData>;

      /**
       * When provided these keys are excluded.
       */
      exclude?: Iterable<keyof Data.TJSPositionData>;

      /**
       * When true all `nullable` values are included.
       */
      nullable?: boolean;

      /**
       * When true any `null` values are converted into default numeric values.
       */
      numeric?: boolean;
   }

   /**
    * Options for {@link TJSPosition.set}.
    */
   export type OptionsSet = {
      /**
       * Perform the update to position state immediately. Callers can specify to immediately update the associated
       * element. This is useful if set is called from requestAnimationFrame / rAF. Library integrations like GSAP
       * invoke set from rAF.
       */
      immediateElementUpdate: boolean;
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
    * Defines the TJSPosition parent element. Provide either an HTMLElement directly or an object with an
    * `elementTarget` property / accessor defining the parent HTMLElement.
    */
   export type PositionParent = HTMLElement | { elementTarget?: HTMLElement };

   /**
    * Provides the default {@link System.Initial.ValidatorSystem} implementations available.
    */
   export type PositionValidators = {
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

   /**
    * Defines all derived stores for positional properties. These property stores can be used to update the position
    * state.
    *
    * There are several readable stores for additional derived data.
    */
   export type Stores = {
      // Writable stores for main position properties ----------------------------------------------------------------

      /**
       * Derived store for `left` updates.
       */
      left: Writable<number | null>;

      /**
       * Derived store for `top` updates.
       */
      top: Writable<number | null>;

      /**
       * Derived store for `width` updates.
       */
      width: Writable<number | 'auto' | 'inherit' | null>;

      /**
       * Derived store for `height` updates.
       */
      height: Writable<number | 'auto' | 'inherit' | null>;

      /**
       * Derived store for `maxHeight` updates.
       */
      maxHeight: Writable<number | null>;

      /**
       * Derived store for `maxWidth` updates.
       */
      maxWidth: Writable<number | null>;

      /**
       * Derived store for `minHeight` updates.
       */
      minHeight: Writable<number | null>;

      /**
       * Derived store for `minWidth` updates.
       */
      minWidth: Writable<number | null>;

      /**
       * Derived store for `rotateX` updates.
       */
      rotateX: Writable<number | null>;

      /**
       * Derived store for `rotateY` updates.
       */
      rotateY: Writable<number | null>;

      /**
       * Derived store for `rotateZ` updates.
       */
      rotateZ: Writable<number | null>;

      /**
       * Derived store for `scale` updates.
       */
      scale: Writable<number | null>;

      /**
       * Derived store for `transformOrigin` updates.
       */
      transformOrigin: TransformAPI.TransformOriginWritable;

      /**
       * Derived store for `translateX` updates.
       */
      translateX: Writable<number | null>;

      /**
       * Derived store for `translateY` updates.
       */
      translateY: Writable<number | null>;

      /**
       * Derived store for `translateZ` updates.
       */
      translateZ: Writable<number | null>;

      /**
       * Derived store for `zIndex` updates.
       */
      zIndex: Writable<number | null>;

      // Readable stores for derived data ----------------------------------------------------------------------------

      /**
       * Readable store for dimension data.
       */
      dimension: Readable<{width: number | 'auto' | 'inherit', height: number | 'auto' | 'inherit'}>;

      /**
       * Readable store for current element.
       */
      element: Readable<HTMLElement>;

      /**
       * Readable store for `contentHeight`.
       */
      resizeContentHeight: Readable<number | undefined>;

      /**
       * Readable store for `contentWidth`.
       */
      resizeContentWidth: Readable<number | undefined>;

      /**
       * Readable store indicating when `width` or `height` is `auto` or `inherit` indicating that this position
       * instance is a good candidate for the {@link resizeObserver} action.
       */
      resizeObservable: Readable<boolean>;

      /**
       * Readable store for `offsetHeight`.
       */
      resizeOffsetHeight: Readable<number | undefined>;

      /**
       * Readable store for `offsetWidth`.
       */
      resizeOffsetWidth: Readable<number | undefined>;

      /**
       * Protected store for resize observer updates.
       */
      resizeObserved: Writable<ResizeObserverData.ResizeObject>;

      /**
       * Readable store for transform data.
       */
      transform: Readable<TransformAPI.TransformData>;
   }
}

export { TJSPositionTypes }
