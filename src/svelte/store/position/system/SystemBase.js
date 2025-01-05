import { A11yHelper } from '#runtime/util/a11y';

/**
 * Provides a base {@link System.SystemBase} implementation.
 *
 * @implements {import('svelte/store').Readable}
 *
 * @implements {import('../types').TJSPositionNS.System.SystemBase}
 */
export class SystemBase
{
   /**
    * When true constrains the min / max width or height to element.
    *
    * @type {boolean}
    */
   #constrain;

   /**
    * @type {HTMLElement}
    */
   #element;

   /**
    * When true the validator is active.
    *
    * @type {boolean}
    */
   #enabled;

   /**
    * Provides a manual setting of the element height. As things go `offsetHeight` causes a browser layout and is not
    * performance oriented. If manually set this height is used instead of `offsetHeight`.
    *
    * @type {number}
    */
   #height;

   /**
    * Set from an optional value in the constructor to lock accessors preventing modification.
    */
   #lock;

   /**
    * Stores the subscribers.
    *
    * @type {import('svelte/store').Subscriber<SystemBase>[]}
    */
   #subscribers = [];

   /**
    * Provides a manual setting of the element width. As things go `offsetWidth` causes a browser layout and is not
    * performance oriented. If manually set this width is used instead of `offsetWidth`.
    *
    * @type {number}
    */
   #width;

   /**
    * @param {object}      [options] - Initial options.
    *
    * @param {boolean}     [options.constrain=true] - Initial constrained state.
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
   constructor({ constrain = true, element, enabled = true, lock = false, width, height } = {})
   {
      this.constrain = constrain;
      this.element = element;
      this.enabled = enabled;
      this.width = width;
      this.height = height;

      this.#lock = typeof lock === 'boolean' ? lock : false;
   }

   /**
    * @returns {boolean} The current constrain state.
    */
   get constrain() { return this.#constrain; }

   /**
    * @returns {HTMLElement | undefined | null} Target element.
    */
   get element() { return this.#element; }

   /**
    * @returns {boolean} The current enabled state.
    */
   get enabled() { return this.#enabled; }

   /**
    * @returns {number} Get manual height.
    */
   get height() { return this.#height; }

   /**
    * @return {boolean} Get locked state.
    */
   get locked() { return this.#lock; }

   /**
    * @returns {number} Get manual width.
    */
   get width() { return this.#width; }

   /**
    * @param {boolean}  constrain - New constrain state.
    */
   set constrain(constrain)
   {
      if (this.#lock) { return; }

      if (typeof constrain !== 'boolean') { throw new TypeError(`'constrain' is not a boolean.`); }

      this.#constrain = constrain;

      this.#updateSubscribers();
   }

   /**
    * @param {HTMLElement | undefined | null} element - Set target element.
    */
   set element(element)
   {
      if (this.#lock) { return; }

      if (element === void 0  || element === null || A11yHelper.isFocusTarget(element))
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
    * @param {boolean}  enabled - New enabled state.
    */
   set enabled(enabled)
   {
      if (this.#lock) { return; }

      if (typeof enabled !== 'boolean') { throw new TypeError(`'enabled' is not a boolean.`); }

      this.#enabled = enabled;

      this.#updateSubscribers();
   }

   /**
    * @param {number}   height - Set manual height.
    */
   set height(height)
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
    * @param {number}   width - Set manual width.
    */
   set width(width)
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
    * @param {number}   width - New manual width.
    *
    * @param {number}   height - New manual height.
    */
   setDimension(width, height)
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
    * @param {import('svelte/store').Subscriber<SystemBase>} handler - Callback
    *        function that is invoked on update / changes. Receives a copy of the TJSPositionData.
    *
    * @returns {import('svelte/store').Unsubscriber} Unsubscribe function.
    */
   subscribe(handler)
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
