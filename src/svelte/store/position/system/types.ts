import type {
   Invalidator,
   Subscriber,
   Unsubscriber}              from 'svelte/store';

import type { TJSPosition }   from '../TJSPosition';
import type { ValidatorAPI }  from './validators/types';

/**
 * Defines the extension points that are available to provide custom implementations for initial positioning and
 * validation of positional movement. There are default implementations for initial `Centered` positioning available
 * via {@link TJSPosition.Initial} and browser window / element bounds validation with and without transform support
 * available via {@link TJSPosition.Validators}.
 */
declare namespace System {
   /**
    * Defines the initial position extension point for positioning elements. The default implementation for initial
    * `Centered` positioning is available via {@link TJSPosition.Initial}. To
    *
    * To create a unique initial position system extend {@link TJSPosition.SystemBase} and implement the
    * {@link InitialSystem} interface.
    */
   export namespace Initial {
      /**
       * Provides helper functions to initially position an element.
       */
      export interface InitialSystem extends SystemBase {
         /**
          * Get the left constraint.
          *
          * @param width - Target width.
          *
          * @returns Calculated left constraint.
          */
         getLeft(width: number): number;

         /**
          * Get the top constraint.
          *
          * @param height - Target height.
          *
          * @returns Calculated top constraint.
          */
         getTop(height: number): number;
      }

      /**
       * Describes the constructor function for an {@link InitialSystem} implementation.
       */
      export interface InitialSystemConstructor {
         /**
          * @param [options] - Initial options.
          *
          * @param [options.constrain=true] - Constrain state.
          *
          * @param [options.element] - Target element.
          *
          * @param [options.enabled=true] - Enabled state.
          *
          * @param [options.lock=false] - Lock parameters from being set.
          *
          * @param [options.width] - Manual width.
          *
          * @param [options.height] - Manual height.
          */
         new ({ constrain, element, enabled, lock, width, height }?: {
            constrain?: boolean,
            element?: HTMLElement,
            enabled?: boolean,
            lock?: boolean,
            width?: number,
            height?: number
         }): InitialSystem;
      }
   }

   /**
    * Defines the position validator extension point for constraining positional changes. The browser window / element
    * bounds validation with and without transform support is available via {@link TJSPosition.Validators}.
    *
    * To create a unique validator extend {@link TJSPosition.SystemBase} and implement the {@link ValidatorSystem}
    * interface.
    */
   export namespace Validator {
      /**
       * Provides a system to validate positional changes.
       */
      export interface ValidatorSystem extends SystemBase {
         /**
          * Provides a validator that respects transforms in positional data constraining the position to within the
          * target elements bounds.
          */
         validate: ValidatorAPI.ValidatorFn;

         /**
          * An ID associated with this validator. Can be used to remove the validator; default: `undefined`.
          */
         id?: any;

         /**
          * Optional subscribe function following the Svelte store / subscribe pattern. On updates validation will be
          * processed again.
          */
         subscribe?(this: void, run: Subscriber<any>, invalidate?: Invalidator<any>): Unsubscriber;

         /**
          * A number between 0 and 1 inclusive to position this validator against others; default: `1`.
          */
         weight?: number;
      }

      /**
       * Describes the constructor function for an {@link ValidatorSystem} implementation.
       */
      export interface ValidatorSystemConstructor {
         /**
          * @param [options] - Initial options.
          *
          * @param [options.constrain=true] - Constrain state.
          *
          * @param [options.element] - Target element.
          *
          * @param [options.enabled=true] - Enabled state.
          *
          * @param [options.lock=false] - Lock parameters from being set.
          *
          * @param [options.width] - Manual width.
          *
          * @param [options.height] - Manual height.
          */
         new ({ constrain, element, enabled, lock, width, height }?: {
            constrain?: boolean,
            element?: HTMLElement,
            enabled?: boolean,
            lock?: boolean,
            width?: number,
            height?: number
         }): ValidatorSystem;
      }
   }

   export interface SystemBase {
      /**
       * @returns The current constrain state.
       */
      get constrain(): boolean;

      /**
       * @returns Target element.
       */
      get element(): HTMLElement | undefined | null;

      /**
       * @returns Get enabled state.
       */
      get enabled(): boolean;

      /**
       * @returns Get manual height.
       */
      get height(): number | undefined;

      /**
       * @return Get locked state.
       */
      get locked(): boolean;

      /**
       * @returns Get manual width.
       */
      get width(): number | undefined

      /**
       * @param constrain - Set constrain state.
       */
      set constrain(constrain: boolean);

      /**
       * @param element - Set target element.
       */
      set element(element: HTMLElement | undefined | null);

      /**
       * @param enabled - Set enabled state.
       */
      set enabled(enabled: boolean);

      /**
       * @param height - Set manual height.
       */
      set height(height: number | undefined);

      /**
       * @param width - Set manual width.
       */
      set width(width: number | undefined);

      /**
       * Set manual width & height.
       *
       * @param width - New manual width.
       *
       * @param height - New manual height.
       */
      setDimension(width: number | undefined, height: number | undefined): void;
   }

   /**
    * Describes the constructor function for anu {@link SystemBase} implementation.
    */
   export interface SystemBaseConstructor {
      /**
       * @param [options] - Initial options.
       *
       * @param [options.constrain=true] - Constrain state.
       *
       * @param [options.element] - Target element.
       *
       * @param [options.enabled=true] - Enabled state.
       *
       * @param [options.lock=false] - Lock parameters from being set.
       *
       * @param [options.width] - Manual width.
       *
       * @param [options.height] - Manual height.
       */
      new ({ constrain, element, enabled, lock, width, height }?: {
         constrain?: boolean,
         element?: HTMLElement,
         enabled?: boolean,
         lock?: boolean,
         width?: number,
         height?: number
      }): SystemBase;
   }
}

export { System }
