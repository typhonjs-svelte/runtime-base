import { clamp }        from '#runtime/math/util';
import { A11yHelper }   from '#runtime/util/browser';

export class BasicBounds
{
   /**
    * When true constrains the min / max width or height to element.
    *
    * @type {boolean}
    */
   #constrain;

   /**
    * @type {import('#runtime/util/browser').FocusableElement | null | undefined}
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
    * Provides a manual setting of the element width. As things go `offsetWidth` causes a browser layout and is not
    * performance oriented. If manually set this width is used instead of `offsetWidth`.
    *
    * @type {number}
    */
   #width;

   /**
    * @param {object}   [opts] - Options.
    *
    * @param {boolean}  [opts.constrain=true] - Initial constrained state.
    *
    * @param {import('#runtime/util/browser').FocusableElement} [opts.element] -
    *
    * @param {boolean}  [opts.enabled=true] - Initial enabled state.
    *
    * @param {boolean}  [opts.lock=false] - Locks further modification.
    *
    * @param {number}   [opts.width] - A specific finite width.
    *
    * @param {number}   [opts.height] - A specific finite height.
    */
   constructor({ constrain = true, element = void 0, enabled = true, lock = false, width = void 0,
    height = void 0 } = {})
   {
      this.element = element;
      this.constrain = constrain;
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
    * @returns {import('#runtime/util/browser').FocusableElement | null | undefined}
    */
   get element() { return this.#element; }

   /**
    * @returns {boolean} The current enabled state.
    */
   get enabled() { return this.#enabled; }

   /**
    * @returns {number | undefined} The current height.
    */
   get height() { return this.#height; }

   /**
    * @returns {number | undefined} The current width.
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
   }

   /**
    * @param {import('#runtime/util/browser').FocusableElement | null | undefined} element - Target element or
    *        undefined.
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
   }

   /**
    * @param {boolean}  enabled - New enabled state.
    */
   set enabled(enabled)
   {
      if (this.#lock) { return; }

      if (typeof enabled !== 'boolean') { throw new TypeError(`'enabled' is not a boolean.`); }

      this.#enabled = enabled;
   }

   /**
    * @param {number | undefined}   height - A finite number or undefined.
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
   }

   /**
    * @param {number | undefined}   width - A finite number or undefined.
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
   }

   /**
    * @param {number | undefined}   width - A finite number or undefined.
    *
    * @param {number | undefined}   height - A finite number or undefined.
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
   }

   /**
    * Provides a validator that respects transforms in positional data constraining the position to within the target
    * elements bounds.
    *
    * @param {import('./types').IValidatorAPI.ValidationData}   valData - The associated validation data for position
    *        updates.
    *
    * @returns {import('../').TJSPositionData} Potentially adjusted position data.
    */
   validator(valData)
   {
      // Early out if element is undefined or local enabled state is false.
      if (!this.#enabled) { return valData.position; }

      // Determine containing bounds from manual values; or any element; lastly the browser width / height.
      const boundsWidth = this.#width ?? this.#element?.offsetWidth ?? globalThis.innerWidth;
      const boundsHeight = this.#height ?? this.#element?.offsetHeight ?? globalThis.innerHeight;

      if (typeof valData.position.width === 'number')
      {
         const maxW = valData.maxWidth ?? (this.#constrain ? boundsWidth : Number.MAX_SAFE_INTEGER);
         valData.position.width = valData.width = clamp(valData.position.width, valData.minWidth, maxW);

         if ((valData.width + valData.position.left + valData.marginLeft) > boundsWidth)
         {
            valData.position.left = boundsWidth - valData.width - valData.marginLeft;
         }
      }

      if (typeof valData.position.height === 'number')
      {
         const maxH = valData.maxHeight ?? (this.#constrain ? boundsHeight : Number.MAX_SAFE_INTEGER);
         valData.position.height = valData.height = clamp(valData.position.height, valData.minHeight, maxH);

         if ((valData.height + valData.position.top + valData.marginTop) > boundsHeight)
         {
            valData.position.top = boundsHeight - valData.height - valData.marginTop;
         }
      }

      const maxL = Math.max(boundsWidth - valData.width - valData.marginLeft, 0);
      valData.position.left = Math.round(clamp(valData.position.left, 0, maxL));

      const maxT = Math.max(boundsHeight - valData.height - valData.marginTop, 0);
      valData.position.top = Math.round(clamp(valData.position.top, 0, maxT));

      return valData.position;
   }
}
