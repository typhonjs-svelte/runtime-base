import type { IValidatorAPI }    from './validators/types';

import type { TJSPosition }      from '../TJSPosition';
import type { TJSPositionData }  from '../TJSPositionData';

/**
 * Defines the extension points that are available to provide custom implementations for initial positioning and
 * validation of positional movement. There are default implementations for initial `Centered` positioning available
 * via {@link TJSPosition.Initial} and browser window / element bounds validation with and without transform support
 * available via {@link TJSPosition.Validators}.
 */
namespace System {
   /**
    * Defines the initial position extension point for positioning elements. The default implementation for initial
    * `Centered` positioning is available via {@link TJSPosition.Initial}. To
    *
    * To create a unique initial position system extend {@link TJSPosition.SystemBase} and implement the
    * {@link IInitialSystem} interface.
    */
   export namespace Initial {
      /**
       * Provides helper functions to initially position an element.
       */
      export interface IInitialSystem extends ISystemBase {
         /**
          * Get the left constraint.
          *
          * @param {number}   width - Target width.
          *
          * @returns {number} Calculated left constraint.
          */
         getLeft(width: number): number;

         /**
          * Get the top constraint.
          *
          * @param {number}   height - Target height.
          *
          * @returns {number} Calculated top constraint.
          */
         getTop(height: number): number;
      }

      /**
       * Describes the constructor function for an {@link IInitialSystem} implementation.
       */
      export interface IInitialSystemConstructor {
         /**
          * @param {object}      [options] - Initial options.
          *
          * @param {boolean}     [options.constrain=true] - Constrain state.
          *
          * @param {HTMLElement} [options.element] - Target element.
          *
          * @param {boolean}     [options.enabled=true] - Enabled state.
          *
          * @param {boolean}     [options.lock=false] - Lock parameters from being set.
          *
          * @param {number}      [options.width] - Manual width.
          *
          * @param {number}      [options.height] - Manual height.
          */
         new ({ constrain, element, enabled, lock, width, height }?: {
            constrain?: boolean,
            element?: HTMLElement,
            enabled?: boolean,
            lock?: boolean,
            width?: number,
            height?: number
         }): IInitialSystem;
      }
   }

   /**
    * Defines the position validator extension point for constraining positional changes. The browser window / element
    * bounds validation with and without transform support is available via {@link TJSPosition.Validators}.
    *
    * To create a unique validator extend {@link TJSPosition.SystemBase} and implement the {@link IValidatorSystem}
    * interface.
    */
   export namespace Validator {
      /**
       * Provides helper functions to initially position an element.
       */
      export interface IValidatorSystem extends ISystemBase {
         /**
          * Provides a validator that respects transforms in positional data constraining the position to within the target
          * elements bounds.
          *
          * @param {IValidatorAPI.ValidationData}   valData - The associated validation data for position updates.
          *
          * @returns {TJSPositionData} Potentially adjusted position data.
          */
         validate(valData: IValidatorAPI.ValidationData): TJSPositionData
      }

      /**
       * Describes the constructor function for an {@link IValidatorSystem} implementation.
       */
      export interface IValidatorSystemConstructor {
         /**
          * @param {object}      [options] - Initial options.
          *
          * @param {boolean}     [options.constrain=true] - Constrain state.
          *
          * @param {HTMLElement} [options.element] - Target element.
          *
          * @param {boolean}     [options.enabled=true] - Enabled state.
          *
          * @param {boolean}     [options.lock=false] - Lock parameters from being set.
          *
          * @param {number}      [options.width] - Manual width.
          *
          * @param {number}      [options.height] - Manual height.
          */
         new ({ constrain, element, enabled, lock, width, height }?: {
            constrain?: boolean,
            element?: HTMLElement,
            enabled?: boolean,
            lock?: boolean,
            width?: number,
            height?: number
         }): IValidatorSystem;
      }
   }

   export interface ISystemBase {
      /**
       * @returns {boolean} The current constrain state.
       */
      get constrain(): boolean;

      /**
       * @returns {HTMLElement | undefined | null} Target element.
       */
      get element(): HTMLElement | undefined | null;

      /**
       * @returns {boolean} Get enabled state.
       */
      get enabled(): boolean;

      /**
       * @returns {number} Get manual height.
       */
      get height(): number;

      /**
       * @return {boolean} Get locked state.
       */
      get locked(): boolean;

      /**
       * @returns {number} Get manual width.
       */
      get width(): number

      /**
       * @param {boolean}  constrain - Set constrain state.
       */
      set constrain(constrain: boolean);

      /**
       * @param {HTMLElement | undefined | null} element - Set target element.
       */
      set element(element: HTMLElement | undefined | null);

      /**
       * @param {boolean}  enabled - Set enabled state.
       */
      set enabled(enabled: boolean);

      /**
       * @param {number}   height - Set manual height.
       */
      set height(height: number);

      /**
       * @param {number}   width - Set manual width.
       */
      set width(width: number);

      /**
       * Set manual width & height.
       *
       * @param {number}   width - New manual width.
       *
       * @param {number}   height - New manual height.
       */
      setDimension(width: number, height: number): void;
   }

   /**
    * Describes the constructor function for anu {@link ISystemBase} implementation.
    */
   export interface ISystemBaseConstructor {
      /**
       * @param {object}      [options] - Initial options.
       *
       * @param {boolean}     [options.constrain=true] - Constrain state.
       *
       * @param {HTMLElement} [options.element] - Target element.
       *
       * @param {boolean}     [options.enabled=true] - Enabled state.
       *
       * @param {boolean}     [options.lock=false] - Lock parameters from being set.
       *
       * @param {number}      [options.width] - Manual width.
       *
       * @param {number}      [options.height] - Manual height.
       */
      new ({ constrain, element, enabled, lock, width, height }?: {
         constrain?: boolean,
         element?: HTMLElement,
         enabled?: boolean,
         lock?: boolean,
         width?: number,
         height?: number
      }): ISystemBase;
   }
}

export { System }
