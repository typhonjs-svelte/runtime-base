import type { ResizeObserverData } from './types';

/**
 * Defines internal data stored for a {@link ResizeObserverData.Target}.
 */
export type ResizeObserverSubscriber = {
   /**
    * Type of target.
    */
   updateType: number;

   /**
    * Target to update.
    */
   target: ResizeObserverData.Target;

   /**
    * Stores most recent `contentRect.width` value from ResizeObserver.
    */
   contentWidth: number;

   /**
    * Stores most recent `contentRect.height` value from ResizeObserver.
    */
   contentHeight: number;

   /**
    * Convenience data for total border & padding for offset width & height calculations.
    */
   styles: {
      additionalWidth: number;
      additionalHeight: number;
   }
};
