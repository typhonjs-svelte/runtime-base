// TJSPosition types added to the namespace defined at the end of `TJSPosition.ts`.

import {
   Readable,
   Writable }                       from 'svelte/store';

import type { IOWritable }          from '#runtime/svelte/store/util';

import type { ResizeObserverData }  from '#runtime/util/dom/observer';

import type { TJSPosition }         from './TJSPosition';

import type { Data }                from './data/types';
import type { System }              from './system/types';
import type { TransformAPI }        from './transform/types';
import type { ValidatorAPI }        from './system/validators/types';

/**
 * Provides the default {@link System.Initial.InitialSystem} implementations available from {@link TJSPosition.Initial}.
 */
type DefaultInitial = {
   /**
    * A locked instance of the `Centered` initial helper suitable for displaying elements in the browser window.
    */
   browserCentered: System.Initial.InitialSystem,

   /**
    * The `Centered` class constructor to instantiate a new instance.
    */
   Centered: System.Initial.InitialSystemConstructor
}

/**
 * Provides the default {@link System.Validator.ValidatorSystem} implementations available from
 * {@link TJSPosition.Validators}.
 */
type DefaultValidators = {
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
interface Stores {
   // Writable stores for main position properties ----------------------------------------------------------------

   /**
    * Derived store for `left` updates.
    */
   left: IOWritable<number | string | null, number | null>;

   /**
    * Derived store for `top` updates.
    */
   top: IOWritable<number | string | null, number | null>;

   /**
    * Derived store for `width` updates.
    */
   width: IOWritable<number | string | null, number | 'auto' | 'inherit' | null>;

   /**
    * Derived store for `height` updates.
    */
   height: IOWritable<number | string | null, number | 'auto' | 'inherit' | null>;

   /**
    * Derived store for `maxHeight` updates.
    */
   maxHeight: IOWritable<number | string | null, number | null>;

   /**
    * Derived store for `maxWidth` updates.
    */
   maxWidth: IOWritable<number | string | null, number | null>;

   /**
    * Derived store for `minHeight` updates.
    */
   minHeight: IOWritable<number | string | null, number | null>;

   /**
    * Derived store for `minWidth` updates.
    */
   minWidth: IOWritable<number | string | null, number | null>;

   /**
    * Derived store for `rotateX` updates.
    */
   rotateX: IOWritable<number | string | null, number | null>;

   /**
    * Derived store for `rotateY` updates.
    */
   rotateY: IOWritable<number | string | null, number | null>;

   /**
    * Derived store for `rotateZ` updates.
    */
   rotateZ: IOWritable<number | string | null, number | null>;

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
   translateX: IOWritable<number | string | null, number | null>;

   /**
    * Derived store for `translateY` updates.
    */
   translateY: IOWritable<number | string | null, number | null>;

   /**
    * Derived store for `translateZ` updates.
    */
   translateZ: IOWritable<number | string | null, number | null>;

   /**
    * Derived store for `zIndex` updates.
    */
   zIndex: Writable<number | null>;

   // Readable stores for derived data ----------------------------------------------------------------------------

   /**
    * Readable store for dimension data.
    */
   dimension: Readable<{ width: number | 'auto' | 'inherit' | null, height: number | 'auto' | 'inherit' | null }>;

   /**
    * Readable store for current element.
    */
   element: Readable<HTMLElement | undefined>;

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
    * instance is a good candidate for the {@link #runtime/svelte/action/dom/observer!resizeObserver} action.
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

declare namespace Options {
   /**
    * Defines the unique options available for setting in the constructor of {@link TJSPosition}.
    */
   export type Config = {
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
   export type ConfigAll = Partial<Config & Data.TJSPositionDataExtra>;

   /**
    * Options for {@link TJSPosition.get}.
    */
   export type Get = {
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
   export type Set = {
      /**
       * Perform the update to position state immediately. Callers can specify to immediately update the associated
       * element. This is useful if set is called from requestAnimationFrame / rAF. Library integrations like GSAP
       * invoke set from rAF.
       */
      immediateElementUpdate?: boolean;
   }
}

// Local declarations ---------------------------------------------------------------------------------------------

/**
 * Defines the shape of an instance / object that is positionable.
 */
interface Positionable {
   position: TJSPosition;
}

/**
 * Defines one or more positions or positionable objects.
 */
type PositionGroup = TJSPosition | Positionable | Iterable<TJSPosition> | Iterable<Positionable>;

/**
 * Defines the TJSPosition parent element. Provide either an HTMLElement directly or an object with an `elementTarget`
 * property / accessor defining the parent HTMLElement.
 */
type PositionParent = HTMLElement | { elementTarget?: HTMLElement };

/**
 * Provides an overloaded {@link Writable} store interface for {@link TJSPosition.set}.
 */
interface WritableExt extends Writable<Data.TJSPositionDataRelative>
{
   set(this: void, value: Data.TJSPositionDataRelative, options?: Options.Set): TJSPosition;
}

export {
   DefaultInitial,
   DefaultValidators,
   Options,
   Positionable,
   PositionGroup,
   PositionParent,
   Stores,
   WritableExt
}
