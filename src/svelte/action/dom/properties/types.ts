import type { MinimalWritable } from '#runtime/svelte/store/util';

export namespace DOMPropActionOptions {
   /**
    * Options for {@link applyScroll} action.
    */
   export interface ApplyScroll {
      /**
       * Store that serializes element `scrollLeft` value.
       */
      scrollLeft?: MinimalWritable<number>;

      /**
       * Store that serializes element `scrollTop` value.
       */
      scrollTop?: MinimalWritable<number>;
   }

   /**
    * Options for the {@link toggleDetails} action.
    */
   export interface ToggleDetails {
      /**
       * A minimal writable boolean store for details element open state.
       */
      store?: MinimalWritable<boolean>;

      /**
       * When true, animate close / open state with WAAPI.
       *
       * @defaultValue `true`
       */
      animate?: boolean;

      /**
       * When false, click events are not handled.
       *
       * @defaultValue `true`
       */
      clickActive?: boolean;

      /**
       * When false, store changes and click events are not handled.
       *
       * @defaultValue `true`
       */
      enabled?: boolean;
   }
}
