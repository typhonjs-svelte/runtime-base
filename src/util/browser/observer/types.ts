import type { Writable } from 'svelte/store';

/**
 * Provides various type aliases used by the {@link ResizeObserverManager}.
 */
namespace ResizeObserverData {
   /**
    * A function that receives offset / content height & width changes.
    */
   export type ResizeFunction = (
      offsetWidth: number,
      offsetHeight: number,
      contentWidth: number,
      contentHeight: number
   ) => unknown;

   /**
    * A object to update / store observed resize updates.
    */
   export type ResizeObject = {
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
      resizeObserved?: Writable<ResizeObject> | ResizeFunction;

      /** A function that is invoked with content width & height changes. */
      setContentBounds?: (contentWidth: number, contentHeight: number) => void;

      /** A function that is invoked with offset width & height changes. */
      setDimension?: (offsetWidth: number, offsetHeight: number) => void;

      /** An object with a `stores` attribute and subsequent `resizeObserved` writable store. */
      stores?: { resizeObserved: Writable<ResizeObject> };
   };

   /** The receiving target for observed resize data. */
   export type Target = ResizeObject | ObjectExtended | ResizeFunction;
}

export { ResizeObserverData };
