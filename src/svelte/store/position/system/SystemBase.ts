import { A11yHelper }   from '#runtime/util/a11y';

import type {
   Readable,
   Subscriber,
   Unsubscriber }       from 'svelte/store';

import type { System }  from './types';

/**
 * Provides a base {@link System.SystemBase} implementation.
 */
export class SystemBase implements Readable<SystemBase>, System.SystemBase
{
   /**
    * When true constrains the min / max width or height to element.
    */
   #constrain: boolean;

   /**
    */
   #element: HTMLElement | undefined | null;

   /**
    * When true the validator is active.
    */
   #enabled: boolean;

   /**
    * Provides a manual setting of the element height. As things go `offsetHeight` causes a browser layout and is not
    * performance oriented. If manually set this height is used instead of `offsetHeight`.
    */
   #height: number | undefined;

   /**
    * Set from an optional value in the constructor to lock accessors preventing modification.
    */
   #lock: boolean;

   /**
    * Stores the subscribers.
    */
   #subscribers: Subscriber<SystemBase>[] = [];

   /**
    * Provides a manual setting of the element width. As things go `offsetWidth` causes a browser layout and is not
    * performance oriented. If manually set this width is used instead of `offsetWidth`.
    */
   #width: number | undefined;

   /**
    * @param [options] - Initial options.
    *
    * @param [options.constrain=true] - Initial constrained state.
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
   constructor({ constrain = true, element, enabled = true, lock = false, width, height }: {
      constrain?: boolean; element?: HTMLElement; enabled?: boolean; lock?: boolean; width?: number; height?: number;
   } = {})
   {
      this.#constrain = true;
      this.#enabled = true;

      this.constrain = constrain;
      this.element = element;
      this.enabled = enabled;
      this.width = width;
      this.height = height;

      this.#lock = typeof lock === 'boolean' ? lock : false;
   }

   /**
    * @returns The current constrain state.
    */
   get constrain(): boolean { return this.#constrain; }

   /**
    * @returns Target element.
    */
   get element(): HTMLElement | undefined | null { return this.#element; }

   /**
    * @returns The current enabled state.
    */
   get enabled(): boolean { return this.#enabled; }

   /**
    * @returns Get manual height.
    */
   get height(): number | undefined { return this.#height; }

   /**
    * @return Get locked state.
    */
   get locked(): boolean { return this.#lock; }

   /**
    * @returns Get manual width.
    */
   get width(): number | undefined { return this.#width; }

   /**
    * @param constrain - New constrain state.
    */
   set constrain(constrain: boolean)
   {
      if (this.#lock) { return; }

      if (typeof constrain !== 'boolean') { throw new TypeError(`'constrain' is not a boolean.`); }

      this.#constrain = constrain;

      this.#updateSubscribers();
   }

   /**
    * @param element - Set target element.
    */
   set element(element: HTMLElement | undefined | null)
   {
      if (this.#lock) { return; }

      if (element === void 0 || element === null || A11yHelper.isFocusTarget(element))
      {
         this.#element = element;
      }
      else
      {
         throw new TypeError(`'element' is not a HTMLElement, undefined, or null.`);
      }

      this.#updateSubscribers();
   }

   /**
    * @param enabled - New enabled state.
    */
   set enabled(enabled: boolean)
   {
      if (this.#lock) { return; }

      if (typeof enabled !== 'boolean') { throw new TypeError(`'enabled' is not a boolean.`); }

      this.#enabled = enabled;

      this.#updateSubscribers();
   }

   /**
    * @param height - Set manual height.
    */
   set height(height: number | undefined)
   {
      if (this.#lock) { return; }

      if (height === void 0 || Number.isFinite(height))
      {
         this.#height = height;
      }
      else
      {
         throw new TypeError(`'height' is not a finite number or undefined.`);
      }

      this.#updateSubscribers();
   }

   /**
    * @param width - Set manual width.
    */
   set width(width: number | undefined)
   {
      if (this.#lock) { return; }

      if (width === void 0 || Number.isFinite(width))
      {
         this.#width = width;
      }
      else
      {
         throw new TypeError(`'width' is not a finite number or undefined.`);
      }

      this.#updateSubscribers();
   }

   /**
    * Set manual width & height.
    *
    * @param width - New manual width.
    *
    * @param height - New manual height.
    */
   setDimension(width: number | undefined, height: number | undefined): void
   {
      if (this.#lock) { return; }

      if (width === void 0 || Number.isFinite(width))
      {
         this.#width = width;
      }
      else
      {
         throw new TypeError(`'width' is not a finite number or undefined.`);
      }

      if (height === void 0 || Number.isFinite(height))
      {
         this.#height = height;
      }
      else
      {
         throw new TypeError(`'height' is not a finite number or undefined.`);
      }

      this.#updateSubscribers();
   }

   /**
    * @param handler - Callback function that is invoked on update / changes. Receives a copy of the TJSPositionData.
    *
    * @returns Unsubscribe function.
    */
   subscribe(handler: Subscriber<SystemBase>): Unsubscriber
   {
      this.#subscribers.push(handler); // add handler to the array of subscribers

      handler(this);                   // call handler with current value

      // Return unsubscribe function.
      return () =>
      {
         const index = this.#subscribers.findIndex((sub) => sub === handler);
         if (index >= 0) { this.#subscribers.splice(index, 1); }
      };
   }

   /**
    * Updates subscribers on changes.
    */
   #updateSubscribers()
   {
      for (let cntr = 0; cntr < this.#subscribers.length; cntr++) { this.#subscribers[cntr](this); }
   }
}
