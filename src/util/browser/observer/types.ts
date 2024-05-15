import type { Writable } from 'svelte/store';

/**
 * Provides various type aliases used by {@link ResizeObserverManager}.
 */
namespace ResizeObserverData {
   /**
    * A function that receives offset / content height & width changes.
    */
   export type ResizeFunction = (
      offsetWidth: number,
      offsetHeight: number,
      contentWidth?: number,
      contentHeight?: number
   ) => unknown;

   /**
    * An object to update as a target for {@link ResizeObserverManager} resize updates.
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

   /**
    * An extended object type defining various ways to create a valid target for {@link ResizeObserverManager}.
    */
   export type ResizeObjectExtended = {
      /** Either a function or a writable store to receive resize updates. */
      resizeObserved?: Writable<ResizeObject> | ResizeFunction;

      /** A function that is invoked with content width & height changes. */
      setContentBounds?: (contentWidth: number, contentHeight: number) => unknown;

      /** A function that is invoked with offset width & height changes. */
      setDimension?: (offsetWidth: number, offsetHeight: number) => unknown;

      /** An object with a `stores` attribute and subsequent `resizeObserved` writable store. */
      stores?: { resizeObserved: Writable<ResizeObject> };
   };

   /**
    * The receiving target for observed resize data associated with {@link ResizeObserverManager}. Just one of the
    * mechanisms defined is required to conform to a valid target.
    */
   export type ResizeTarget = ResizeObject | ResizeObjectExtended | ResizeFunction;
}

export { ResizeObserverData };
