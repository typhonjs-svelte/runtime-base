import type { Writable } from 'svelte/store';

/**
 * Provides various type aliases used by the {@link resizeObserver} action.
 */
namespace ResizeObserverData {
   /**
    * A function that receives offset / content height & width changes.
    */
   export type Function = (
      offsetWidth: number,
      offsetHeight: number,
      contentWidth: number,
      contentHeight: number
   ) => void;

   /**
    * A object to update / store observed resize updates.
    */
   export type Object = {
      /** Stores `contentHeight` attribute. */
      contentHeight?: number
      /** Stores `contentWidth` attribute. */
      contentWidth?: number
      /** Stores `offsetHeight` attribute. */
      offsetHeight?: number
      /** Stores `offsetWidth` attribute. */
      offsetWidth?: number
   };

   export type ObjectExtended = {
      /** Either a function or a writable store to receive resize updates. */
      resizedObserver?: Writable<Object> | Function;

      /** A function that is invoked with content width & height changes. */
      setContentBounds?: (contentWidth: number, contentHeight: number) => void;

      /** A function that is invoked with offset width & height changes. */
      setDimension?: (offsetWidth: number, offsetHeight: number) => void;

      /** An object with a `stores` attribute and subsequent `resizedObserver` writable store. */
      stores?: { resizedObserver: Writable<Object> };
   };

   /** The receiving target for observed resize data. */
   export type Target = Object | ObjectExtended | Function;
}

export { ResizeObserverData }
