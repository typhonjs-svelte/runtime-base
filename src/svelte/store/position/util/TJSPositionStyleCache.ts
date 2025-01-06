import { writable }                 from 'svelte/store';

import { propertyStore }            from '#runtime/svelte/store/writable-derived';

import { A11yHelper }               from '#runtime/util/a11y';

import { StyleParse }               from '#runtime/util/dom/style';

import type { Writable }            from 'svelte/store';

import type { ResizeObserverData }  from '#runtime/util/dom/observer';

/**
 * Caches computed styles of a {@link TJSPosition} target element.
 */
export class TJSPositionStyleCache
{
   el: HTMLElement | undefined;
   computed: CSSStyleDeclaration | undefined;

   marginLeft: number | undefined;
   marginTop: number | undefined;
   maxHeight: number | undefined;
   maxWidth: number | undefined;
   minHeight: number | undefined;
   minWidth: number | undefined;

   hasWillChange: boolean;

   stores: {
      element: Writable<HTMLElement | undefined>,
      resizeContentHeight: Writable<number | undefined>,
      resizeContentWidth: Writable<number | undefined>,
      resizeObserved: Writable<ResizeObserverData.ResizeObject>,
      resizeObservable: Writable<boolean>,
      resizeOffsetHeight: Writable<number | undefined>,
      resizeOffsetWidth: Writable<number | undefined>
   }

   resizeObserved: ResizeObserverData.ResizeObject;

   constructor()
   {
      this.el = void 0;
      this.computed = void 0;
      this.marginLeft = void 0;
      this.marginTop = void 0;
      this.maxHeight = void 0;
      this.maxWidth = void 0;
      this.minHeight = void 0;
      this.minWidth = void 0;

      this.hasWillChange = false;

      this.resizeObserved = Object.seal({
         contentHeight: void 0,
         contentWidth: void 0,
         offsetHeight: void 0,
         offsetWidth: void 0
      });

      /**
       * Provides a writable store to track offset & content width / height from an associated `resizeObserver` action.
       */
      const storeResizeObserved: Writable<ResizeObserverData.ResizeObject> = writable(this.resizeObserved);

      this.stores = {
         element: writable(this.el),
         resizeContentHeight: propertyStore(storeResizeObserved, 'contentHeight'),
         resizeContentWidth: propertyStore(storeResizeObserved, 'contentWidth'),
         resizeObserved: storeResizeObserved,
         resizeObservable: writable(false),
         resizeOffsetHeight: propertyStore(storeResizeObserved, 'offsetHeight'),
         resizeOffsetWidth: propertyStore(storeResizeObserved, 'offsetWidth')
      };
   }

   /**
    * Returns the cached offsetHeight from any attached `resizeObserver` action otherwise gets the offsetHeight from
    * the element directly. The more optimized path is using `resizeObserver` as getting it from the element
    * directly is more expensive and alters the execution order of an animation frame.
    *
    * @returns {number} The element offsetHeight.
    */
   get offsetHeight(): number
   {
      if (this.el !== void 0 && A11yHelper.isFocusTarget(this.el))
      {
         return this.resizeObserved.offsetHeight !== void 0 ? this.resizeObserved.offsetHeight : this.el.offsetHeight;
      }

      throw new Error(`TJSPositionStyleCache - get offsetHeight error: no element assigned.`);
   }

   /**
    * Returns the cached offsetWidth from any attached `resizeObserver` action otherwise gets the offsetWidth from
    * the element directly. The more optimized path is using `resizeObserver` as getting it from the element
    * directly is more expensive and alters the execution order of an animation frame.
    *
    * @returns The element offsetHeight.
    */
   get offsetWidth(): number
   {
      if (this.el !== void 0 && A11yHelper.isFocusTarget(this.el))
      {
         return this.resizeObserved.offsetWidth !== void 0 ? this.resizeObserved.offsetWidth : this.el.offsetWidth;
      }

      throw new Error(`TJSPositionStyleCache - get offsetWidth error: no element assigned.`);
   }

   /**
    * @param el -
    *
    * @returns Does element match cached element.
    */
   hasData(el: HTMLElement): boolean { return this.el === el; }

   /**
    * Resets the style cache.
    */
   reset(): void
   {
      // Remove will-change inline style from previous element if it is still connected.
      if (this.el !== void 0 && A11yHelper.isFocusTarget(this.el) && this.el.isConnected && !this.hasWillChange)
      {
         this.el.style.willChange = '';
      }

      this.el = void 0;
      this.computed = void 0;
      this.marginLeft = void 0;
      this.marginTop = void 0;
      this.maxHeight = void 0;
      this.maxWidth = void 0;
      this.minHeight = void 0;
      this.minWidth = void 0;

      this.hasWillChange = false;

      // Silently reset `resizedObserved`; With proper usage the `resizeObserver` action issues an update on removal.
      this.resizeObserved.contentHeight = void 0;
      this.resizeObserved.contentWidth = void 0;
      this.resizeObserved.offsetHeight = void 0;
      this.resizeObserved.offsetWidth = void 0;

      // Reset the tracked element this TJSPosition instance is modifying.
      this.stores.element.set(void 0);
   }

   /**
    * Updates the style cache with new data from the given element.
    *
    * @param el - An HTML element.
    */
   update(el: HTMLElement): void
   {
      this.el = el;

      this.computed = globalThis.getComputedStyle(el);

      this.marginLeft = StyleParse.pixels(el.style.marginLeft) ?? StyleParse.pixels(this.computed.marginLeft);
      this.marginTop = StyleParse.pixels(el.style.marginTop) ?? StyleParse.pixels(this.computed.marginTop);
      this.maxHeight = StyleParse.pixels(el.style.maxHeight) ?? StyleParse.pixels(this.computed.maxHeight);
      this.maxWidth = StyleParse.pixels(el.style.maxWidth) ?? StyleParse.pixels(this.computed.maxWidth);

      // Note that the computed styles for below will always be 0px / 0 when no style is active.
      this.minHeight = StyleParse.pixels(el.style.minHeight) ?? StyleParse.pixels(this.computed.minHeight);
      this.minWidth = StyleParse.pixels(el.style.minWidth) ?? StyleParse.pixels(this.computed.minWidth);

      // Tracks if there already is a will-change property on the inline or computed styles.
      const willChange: string = el.style.willChange !== '' ? el.style.willChange : this.computed.willChange ?? '';

      this.hasWillChange = willChange !== '' && willChange !== 'auto';

      // Update the tracked element this TJSPosition instance is modifying.
      this.stores.element.set(el);
   }
}
