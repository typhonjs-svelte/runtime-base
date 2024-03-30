namespace TJSPositionTypes {
   export interface IInitialHelper {
      /**
       * Get the left constraint based on any manual target values or the browser inner width.
       *
       * @param {number}   width - Target width.
       *
       * @returns {number} Calculated left constraint.
       */
      getLeft(width: number): number;

      /**
       * Get the top constraint based on any manual target values or the browser inner height.
       *
       * @param {number}   height - Target height.
       *
       * @returns {number} Calculated top constraint.
       */
      getTop(height: number): number;
   }

   export interface IInitialHelperExt extends IInitialHelper {
      /**
       * @returns {HTMLElement | undefined | null} Target element.
       */
      get element(): HTMLElement | undefined | null;

      /**
       * @returns {number} Get manual height.
       */
      get height(): number;

      /**
       * @returns {number} Get manual width.
       */
      get width(): number

      /**
       * @param {HTMLElement | undefined | null} element - Set target element.
       */
      set element(element: HTMLElement | undefined | null);

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
    * Describes the constructor function for an {@link IInitialHelperExt} implementation.
    */
   export interface IInitialHelperExtConstructor {
      /**
       * @param {object}      [options] - Initial options.
       *
       * @param {HTMLElement} [options.element] - Target element.
       *
       * @param {boolean}     [options.lock=false] - Lock parameters from being set.
       *
       * @param {number}      [options.width] - Manual width.
       *
       * @param {number}      [options.height] - Manual height.
       */
      new ({ element, lock, width, height }?: {
         element?: HTMLElement,
         lock?: boolean,
         width?: number,
         height?: number
      }): IInitialHelperExt;
   }

   /**
    * Provides the default {@link IInitialHelperExt} implementations available.
    */
   export type PositionInitial = {
      /**
       * A locked instance of the `Centered` initial helper suitable for displaying elements in the browser window.
       */
      browserCentered: IInitialHelperExt,

      /**
       * The `Centered` class constructor to instantiate a new instance.
       */
      Centered: IInitialHelperExtConstructor
   }
}

export { TJSPositionTypes }
