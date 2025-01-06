import { clamp }                 from '#runtime/math/util';
import { subscribeIgnoreFirst }  from '#runtime/svelte/store/util';
import { propertyStore }         from '#runtime/svelte/store/writable-derived';
import { A11yHelper }            from '#runtime/util/a11y';

import {
   isIterable,
   isObject,
   isPlainObject }               from '#runtime/util/object';

import {
   AnimationAPI,
   AnimationGroupAPI }           from './animation';

import {
   ConvertStringData,
   TJSPositionData,
   TJSPositionDataUtil }         from './data';

import { PositionStateAPI }      from './state';
import { SystemBase }            from './system';
import { Centered }              from './system/initial';

import {
   AdapterValidators,
   TransformBounds }             from './system/validators';

import {
   TJSTransformData,
   TJSTransforms }               from './transform';

import {
   PositionChangeSet,
   UpdateElementData,
   UpdateElementManager }        from './update';

import {
   MathGuard,
   TJSPositionStyleCache }       from './util';

import type {
   Subscriber,
   Updater,
   Unsubscriber }                from 'svelte/store';

import type { TJSPositionNS }    from './types';

import type { OptionsInternal }  from './types-local';

/**
 * Provides an advanced compound store for positioning elements dynamically including an optimized pipeline for updating
 * an associated element. Essential tweening / animation is supported in addition to a validation API to constrain
 * positional updates.
 */
export class TJSPosition implements TJSPositionNS.WritableExt
{
   /**
    * Public API for {@link TJSPosition.Initial}.
    */
   static #positionInitial: Readonly<TJSPositionNS.API.Initial> = Object.freeze({
      browserCentered: new Centered({ lock: true }),
      Centered
   });

   /**
    * Public API for {@link TJSPosition.Validators}
    */
   static #positionValidators: Readonly<TJSPositionNS.API.Validators> = Object.freeze({
      TransformBounds,
      transformWindow: new TransformBounds({ lock: true })
   });

   /**
    * Stores all position data / properties.
    */
   #data: TJSPositionData = Object.seal(new TJSPositionData());

   /**
    * Provides the animation API.
    */
   #animate: TJSPositionNS.API.Animation = new AnimationAPI(this, this.#data);

   /**
    * Provides a way to turn on / off the position handling.
    */
   #enabled: boolean = true;

   /**
    * Stores ongoing options that are set in the constructor or by transform store subscription.
    */
   #options: OptionsInternal = {
      calculateTransform: false,
      initial: void 0,
      ortho: true,
      transformSubscribed: false,
   };

   /**
    * The associated parent for positional data tracking. Used in validators.
    */
   #parent: TJSPositionNS.PositionParent;

   /**
    * Stores the style attributes that changed on update.
    */
   #positionChangeSet: PositionChangeSet = new PositionChangeSet();

   /**
    * Tracks the current state if this position instance is a candidate for resize observation by the `resizeObserver`
    * action. This is `true` when `width` or `height` is `auto` or `inherit`.
    */
   #resizeObservable: boolean = false;

   /**
    */
   readonly #stores: TJSPositionNS.API.Stores;

   /**
    * Stores an instance of the computer styles for the target element.
    */
   readonly #styleCache: TJSPositionStyleCache;

   /**
    * Stores the subscribers.
    */
   #subscribers: Subscriber<TJSPositionNS.Data.TJSPositionData>[] = [];

   /**
    */
   #transforms: TJSTransforms = new TJSTransforms();

   /**
    */
   #updateElementData: UpdateElementData;

   /**
    * Stores the UpdateElementManager wait promise.
    */
   #updateElementPromise: Promise<number> | undefined;

   /**
    */
   #validators: AdapterValidators;

   /**
    */
   #validatorData: TJSPositionNS.System.Validator.API.ValidatorData[];

   /**
    */
   #state: PositionStateAPI = new PositionStateAPI(this, this.#data, this.#transforms);

   /**
    * @returns Public Animation Group API.
    */
   static get Animate(): TJSPositionNS.API.AnimationGroup { return AnimationGroupAPI; }

   /**
    * @returns TJSPositionData constructor.
    */
   static get Data(): TJSPositionNS.Data.TJSPositionDataConstructor { return TJSPositionData; }

   /**
    * @returns TJSPosition default initial helpers.
    */
   static get Initial(): Readonly<TJSPositionNS.API.Initial> { return this.#positionInitial; }

   /**
    * @returns `SystemBase` constructor.
    */
   static get SystemBase(): TJSPositionNS.System.SystemBaseConstructor { return SystemBase; }

   /**
    * Returns TJSTransformData class / constructor.
    *
    * @returns TransformData class / constructor.
    */
   static get TransformData(): TJSPositionNS.API.Transform.TransformDataConstructor { return TJSTransformData; }

   /**
    * Returns default validators.
    *
    * @returns Available validators.
    */
   static get Validators(): Readonly<TJSPositionNS.API.Validators> { return this.#positionValidators; }

   /**
    * Returns a list of supported transform origins.
    *
    * @returns The supported transform origin strings.
    */
   static get transformOrigins(): Readonly<TJSPositionNS.API.Transform.TransformOrigin[]>
   {
      return TJSTransforms.transformOrigins;
   }

   /**
    * Convenience to copy from source to target of two TJSPositionData like objects. If a target is not supplied a new
    * {@link TJSPositionData} instance is created.
    *
    * @param source - The source instance to copy from.
    *
    * @param [target] - Target TJSPositionData like object; if one is not provided a new instance is created.
    *
    * @returns The target instance with all TJSPositionData fields.
    */
   static copyData(source: Partial<TJSPositionNS.Data.TJSPositionData>, target: TJSPositionNS.Data.TJSPositionData):
    TJSPositionNS.Data.TJSPositionData
   {
      return TJSPositionDataUtil.copyData(source, target);
   }

   /**
    * Returns a duplicate of a given position instance copying any options and validators. The position parent is not
    * copied and a new one must be set manually via the {@link TJSPosition.parent} setter.
    *
    * @param position - A position instance.
    *
    * @param [options] - Unique new options to set.
    *
    * @returns A duplicate position instance.
    */
   static duplicate(position: TJSPosition, options: TJSPositionNS.Options.ConfigAll = {}): TJSPosition
   {
      if (!(position instanceof TJSPosition)) { throw new TypeError(`'position' is not an instance of TJSPosition.`); }

      const newPosition = new TJSPosition(options);

      newPosition.#options = Object.assign({}, position.#options, options);
      newPosition.#validators.add(...position.#validators);

      newPosition.set(position.#data);

      return newPosition;
   }

   /**
    * @param [parentOrOptions] - A  potential parent element or object w/ `elementTarget` accessor. You may also forego
    *    setting the parent and pass in the options object.
    *
    * @param [options] - The options object.
    */
   constructor(parentOrOptions?: TJSPositionNS.PositionParent | TJSPositionNS.Options.ConfigAll,
    options?: TJSPositionNS.Options.ConfigAll)
   {
      // Test if `parent` is a plain object; if so treat as options object.
      if (isPlainObject(parentOrOptions))
      {
         options = parentOrOptions;
      }
      else
      {
         this.#parent = parentOrOptions as TJSPositionNS.PositionParent;
      }

      this.#styleCache = new TJSPositionStyleCache();

      const updateData = new UpdateElementData(this.#positionChangeSet, this.#data, this.#options, this.#styleCache,
       this.#subscribers, this.#transforms);

      this.#updateElementData = updateData;

      // Set TJSPosition options -------------------------------------------------------------------------------------

      if (typeof options?.calculateTransform === 'boolean')
      {
         this.#options.calculateTransform = options.calculateTransform;
      }

      if (typeof options?.ortho === 'boolean') { this.#options.ortho = options.ortho; }

      // Initialize stores -------------------------------------------------------------------------------------------

      this.#stores = Object.freeze({
         // The main properties for manipulating TJSPosition.
         height: propertyStore(this, 'height'),
         left: propertyStore(this, 'left'),
         rotateX: propertyStore(this, 'rotateX'),
         rotateY: propertyStore(this, 'rotateY'),
         rotateZ: propertyStore(this, 'rotateZ'),
         scale: propertyStore(this, 'scale'),
         top: propertyStore(this, 'top'),
         transformOrigin: propertyStore(this, 'transformOrigin'),
         translateX: propertyStore(this, 'translateX'),
         translateY: propertyStore(this, 'translateY'),
         translateZ: propertyStore(this, 'translateZ'),
         width: propertyStore(this, 'width'),
         zIndex: propertyStore(this, 'zIndex'),

         // Stores that control validation when width / height is not `auto`.
         maxHeight: propertyStore(this, 'maxHeight'),
         maxWidth: propertyStore(this, 'maxWidth'),
         minHeight: propertyStore(this, 'minHeight'),
         minWidth: propertyStore(this, 'minWidth'),

         // Readable stores based on updates or from resize observer changes.
         dimension: { subscribe: updateData.storeDimension.subscribe },
         element: { subscribe: this.#styleCache.stores.element.subscribe },
         resizeContentHeight: { subscribe: this.#styleCache.stores.resizeContentHeight.subscribe },
         resizeContentWidth: { subscribe: this.#styleCache.stores.resizeContentWidth.subscribe },
         resizeObservable: { subscribe: this.#styleCache.stores.resizeObservable.subscribe },
         resizeOffsetHeight: { subscribe: this.#styleCache.stores.resizeOffsetHeight.subscribe },
         resizeOffsetWidth: { subscribe: this.#styleCache.stores.resizeOffsetWidth.subscribe },
         transform: { subscribe: updateData.storeTransform.subscribe },

         // Protected store that should only be set by resizeObserver action.
         resizeObserved: this.#styleCache.stores.resizeObserved,
      });

      /**
       * Define 'values' getter to retrieve static transform origins.
       */
      Object.defineProperty(this.#stores.transformOrigin, 'values', {
         get: (): Readonly<TJSPositionNS.API.Transform.TransformOrigin[]> => TJSPosition.transformOrigins
      });

      // When resize change from any applied `resizeObserver` action automatically set data for new validation run.
      // A resizeObserver prop should be set to true for ApplicationShell components or usage of resizeObserver action
      // to monitor for changes. This should only be used on elements that have 'auto' or `inherit` for width or height.
      subscribeIgnoreFirst(this.#stores.resizeObserved, (resizeData): void =>
      {
         const parent: TJSPositionNS.PositionParent = this.#parent;
         const el: HTMLElement = A11yHelper.isFocusTarget(parent) ? parent : parent?.elementTarget;

         // Only invoke set if there is a target element and the resize data has a valid offset width & height.
         if (A11yHelper.isFocusTarget(el) && Number.isFinite(resizeData?.offsetWidth) &&
          Number.isFinite(resizeData?.offsetHeight))
         {
            this.set();
         }
      });

      [this.#validators, this.#validatorData] = AdapterValidators.create(() => this.set());

      if (options?.initial)
      {
         const initial: TJSPositionNS.System.Initial.InitialSystem = options.initial;

         if (typeof initial?.getLeft !== 'function' || typeof initial?.getTop !== 'function')
         {
            throw new Error(
             `'options.initial' position helper does not contain 'getLeft' and / or 'getTop' functions.`);
         }

         this.#options.initial = initial;
      }

      if (options?.validator)
      {
         if (isIterable(options?.validator))
         {
            this.validators.add(...options.validator);
         }
         else
         {
            /**
             */
            const validatorFn: TJSPositionNS.System.Validator.API.ValidatorFn |
             TJSPositionNS.System.Validator.API.ValidatorData = options.validator;

            this.validators.add(validatorFn);
         }
      }

      Object.seal(this);

      // Set any remaining position data.
      if (isObject(options)) { this.set(options); }
   }

   /**
    * Returns the animation API.
    *
    * @returns Animation instance API.
    */
   get animate(): TJSPositionNS.API.Animation
   {
      return this.#animate;
   }

   /**
    * Returns the dimension data for the readable store.
    *
    * @returns Dimension data.
    */
   get dimension(): Readonly<{ width: number | 'auto' | 'inherit', height: number | 'auto' | 'inherit' }>
   {
      return this.#updateElementData.dimensionData;
   }

   /**
    * Returns the enabled state.
    *
    * @returns Enabled state.
    */
   get enabled(): boolean
   {
      return this.#enabled;
   }

   /**
    * Returns the current HTMLElement being positioned.
    *
    * @returns Current HTMLElement being positioned.
    */
   get element(): HTMLElement | undefined
   {
      return this.#styleCache.el;
   }

   /**
    * Returns a promise that is resolved on the next element update with the time of the update.
    *
    * @returns Promise resolved on element update.
    */
   get elementUpdated(): Promise<number> | undefined
   {
      return this.#updateElementPromise;
   }

   /**
    * Returns the associated {@link TJSPositionNS.PositionParent} instance.
    *
    * @returns The current position parent instance.
    */
   get parent(): TJSPositionNS.PositionParent { return this.#parent; }

   /**
    * Returns the state API.
    *
    * @returns TJSPosition state API.
    */
   get state(): TJSPositionNS.API.State { return this.#state; }

   /**
    * Returns the derived writable stores for individual data variables.
    *
    * @returns Derived / writable stores.
    */
   get stores(): TJSPositionNS.API.Stores { return this.#stores; }

   /**
    * Returns the transform data for the readable store.
    *
    * @returns Transform Data.
    */
   get transform(): TJSPositionNS.API.Transform.TransformData
   {
      return this.#updateElementData.transformData;
   }

   /**
    * Returns the validators.
    *
    * @returns Validators API
    */
   get validators(): TJSPositionNS.System.Validator.API { return this.#validators; }

   /**
    * Sets the enabled state.
    *
    * @param enabled - New enabled state.
    */
   set enabled(enabled: boolean)
   {
      if (typeof enabled !== 'boolean')
      {
         throw new TypeError(`'enabled' is not a boolean.`);
      }

      this.#enabled = enabled;
   }

   /**
    * Sets the associated {@link TJSPositionNS.PositionParent} instance. Resets the style cache and default data.
    *
    * @param parent - A PositionParent instance or undefined to disassociate
    */
   set parent(parent: TJSPositionNS.PositionParent | undefined)
   {
      if (parent !== void 0 && !A11yHelper.isFocusTarget(parent) && !isObject(parent))
      {
         throw new TypeError(`'parent' is not an HTMLElement, object, or undefined.`);
      }

      this.#parent = parent;

      // Reset any stored default data & the style cache.
      this.#state.remove({ name: '#defaultData' });
      this.#styleCache.reset();

      // If a parent is defined then invoke set to update any parent element.
      if (parent) { this.set(this.#data); }
   }

// Data accessors ----------------------------------------------------------------------------------------------------

   /**
    * @returns height
    */
   get height(): number | 'auto' | 'inherit' | null { return this.#data.height; }

   /**
    * @returns left
    */
   get left(): number | null { return this.#data.left; }

   /**
    * @returns maxHeight
    */
   get maxHeight(): number | null { return this.#data.maxHeight; }

   /**
    * @returns maxWidth
    */
   get maxWidth(): number | null { return this.#data.maxWidth; }

   /**
    * @returns minHeight
    */
   get minHeight(): number | null { return this.#data.minHeight; }

   /**
    * @returns minWidth
    */
   get minWidth(): number | null { return this.#data.minWidth; }

   /**
    * @returns rotateX
    */
   get rotateX(): number | null { return this.#data.rotateX; }

   /**
    * @returns rotateY
    */
   get rotateY(): number | null { return this.#data.rotateY; }

   /**
    * @returns rotateZ
    */
   get rotateZ(): number | null { return this.#data.rotateZ; }

   /**
    * @returns Alias for rotateZ
    */
   get rotation(): number | null { return this.#data.rotateZ; }

   /**
    * @returns scale
    */
   get scale(): number | null { return this.#data.scale; }

   /**
    * @returns top
    */
   get top(): number | null { return this.#data.top; }

   /**
    * @returns transformOrigin
    */
   get transformOrigin(): TJSPositionNS.API.Transform.TransformOrigin | null { return this.#data.transformOrigin; }

   /**
    * @returns translateX
    */
   get translateX(): number | null { return this.#data.translateX; }

   /**
    * @returns translateY
    */
   get translateY(): number | null { return this.#data.translateY; }

   /**
    * @returns translateZ
    */
   get translateZ(): number | null { return this.#data.translateZ; }

   /**
    * @returns width
    */
   get width(): number | 'auto' | 'inherit' | null { return this.#data.width; }

   /**
    * @returns z-index
    */
   get zIndex(): number | null { return this.#data.zIndex; }

   /**
    * @param height -
    */
   set height(height: number | 'auto' | 'inherit' | null)
   {
      this.#stores.height.set(height);
   }

   /**
    * @param left -
    */
   set left(left: number | string | null)
   {
      this.#stores.left.set(left);
   }

   /**
    * @param maxHeight -
    */
   set maxHeight(maxHeight: number | string | null)
   {
      this.#stores.maxHeight.set(maxHeight);
   }

   /**
    * @param maxWidth -
    */
   set maxWidth(maxWidth: number | string | null)
   {
      this.#stores.maxWidth.set(maxWidth);
   }

   /**
    * @param minHeight -
    */
   set minHeight(minHeight: number | string | null)
   {
      this.#stores.minHeight.set(minHeight);
   }

   /**
    * @param minWidth -
    */
   set minWidth(minWidth: number | string | null)
   {
      this.#stores.minWidth.set(minWidth);
   }

   /**
    * @param rotateX -
    */
   set rotateX(rotateX: number | string | null)
   {
      this.#stores.rotateX.set(rotateX);
   }

   /**
    * @param rotateY -
    */
   set rotateY(rotateY: number | string | null)
   {
      this.#stores.rotateY.set(rotateY);
   }

   /**
    * @param rotateZ -
    */
   set rotateZ(rotateZ: number | string | null)
   {
      this.#stores.rotateZ.set(rotateZ);
   }

   /**
    * @param  rotateZ - alias for rotateZ
    */
   set rotation(rotateZ: number | string | null)
   {
      this.#stores.rotateZ.set(rotateZ);
   }

   /**
    * @param scale -
    */
   set scale(scale: number | string | null)
   {
      this.#stores.scale.set(scale);
   }

   /**
    * @param top -
    */
   set top(top: number | string | null)
   {
      this.#stores.top.set(top);
   }

   /**
    * @param transformOrigin -
    */
   set transformOrigin(transformOrigin: TJSPositionNS.API.Transform.TransformOrigin)
   {
      if (TJSTransforms.transformOrigins.includes(transformOrigin))
      {
         this.#stores.transformOrigin.set(transformOrigin);
      }
   }

   /**
    * @param translateX -
    */
   set translateX(translateX: number | string | null)
   {
      this.#stores.translateX.set(translateX);
   }

   /**
    * @param translateY -
    */
   set translateY(translateY: number | string | null)
   {
      this.#stores.translateY.set(translateY);
   }

   /**
    * @param translateZ -
    */
   set translateZ(translateZ: number | string | null)
   {
      this.#stores.translateZ.set(translateZ);
   }

   /**
    * @param width -
    */
   set width(width: number | 'auto' | 'inherit' | null)
   {
      this.#stores.width.set(width);
   }

   /**
    * @param zIndex -
    */
   set zIndex(zIndex: number | string | null)
   {
      this.#stores.zIndex.set(zIndex);
   }

   /**
    * Assigns current position data to given object `data` object. By default, `null` position data is not assigned.
    * Other options allow configuration of the data assigned including setting default numeric values for any properties
    * that are null.
    *
    * @param [data] - Target to assign current position data.
    *
    * @param [options] - Defines options for specific keys and substituting null for numeric default values. By
    *        default, nullable keys are included.
    *
    * @returns Passed in object with current position data.
    */
   get(data: { [key: string]: any } = {}, options: TJSPositionNS.Options.Get = {}):
    Partial<TJSPositionNS.Data.TJSPositionData>
   {
      const keys: Iterable<keyof TJSPositionData> = options?.keys;
      const excludeKeys: Iterable<keyof TJSPositionData> = options?.exclude;
      const nullable: boolean = options?.nullable ?? true;
      const numeric: boolean = options?.numeric ?? false;

      if (isIterable(keys))
      {
         for (const key of keys)
         {
            // Convert any null values to numeric defaults if `numeric` is true.
            data[key] = numeric ? TJSPositionDataUtil.getDataOrDefault(this, key) : this[key];

            // Potentially remove null keys.
            if (!nullable && data[key] === null) { delete data[key]; }
         }

         // Remove any excluded keys.
         if (isIterable(excludeKeys))
         {
            for (const key of excludeKeys) { delete data[key]; }
         }

         return data;
      }
      else
      {
         data = Object.assign(data, this.#data);

         // Remove any excluded keys.
         if (isIterable(excludeKeys))
         {
            for (const key of excludeKeys) { delete data[key]; }
         }

         // Potentially set numeric defaults.
         if (numeric) { TJSPositionDataUtil.setNumericDefaults(data); }

         if (!nullable)
         {
            for (const key in data)
            {
               if (data[key] === null) { delete data[key]; }
            }
         }

         return data;
      }
   }

   /**
    * @returns Current position data.
    */
   toJSON(): TJSPositionNS.Data.TJSPositionData
   {
      return Object.assign({}, this.#data);
   }

   /**
    * All calculation and updates of position are implemented in {@link TJSPosition}. This allows position to be fully
    * reactive and in control of updating inline styles for a connected {@link HTMLElement}.
    *
    * The initial set call with a target element will always set width / height as this is necessary for correct
    * calculations.
    *
    * When a target element is present updated styles are applied after validation. To modify the behavior of set
    * implement one or more validator functions and add them via the validator API available from
    * {@link TJSPosition.validators}.
    *
    * Updates to any target element are decoupled from the underlying TJSPosition data. This method returns this
    * instance that you can then await on the target element inline style update by using
    * {@link TJSPosition.elementUpdated}.
    *
    * Relative updates to any property of {@link TJSPositionData} are possible by specifying properties as strings.
    * This string should be in the form of '+=', '-=', or '*=' and float / numeric value. IE '+=0.2'.
    * {@link TJSPosition.set} will apply the `addition`, `subtraction`, or `multiplication` operation specified against
    * the current value of the given property. Please see {@link Data.TJSPositionDataRelative} for a detailed
    * description.
    *
    * @param [position] - TJSPosition data to set.
    *
    * @param [options] - Additional options.
    *
    * @returns This TJSPosition instance.
    */
   set(position: TJSPositionNS.Data.TJSPositionDataRelative = {}, options: TJSPositionNS.Options.Set = {}): this
   {
      if (!isObject(position)) { throw new TypeError(`TJSPosition - set error: 'position' is not an object.`); }

      // TJSPositionNS.PositionParent
      const parent: any = this.#parent;

      // An early out to prevent `set` from taking effect if not enabled.
      if (!this.#enabled)
      {
         return this;
      }

      // An early out to prevent `set` from taking effect if options `positionable` is false.
      // TODO: THIS IS REFERENCING APPLICATION OPTIONS.
      if (parent !== void 0 && typeof parent?.options?.positionable === 'boolean' && !parent?.options?.positionable)
      {
         return this;
      }

      const immediateElementUpdate = options?.immediateElementUpdate ?? false;

      const data: TJSPositionNS.Data.TJSPositionData = this.#data;
      const transforms: TJSPositionNS.API.Transform = this.#transforms;

      // Find the target HTML element and verify that it is connected storing it in `el`.
      const targetEl: HTMLElement = A11yHelper.isFocusTarget(parent) ? parent : parent?.elementTarget;

      const el: HTMLElement | undefined = A11yHelper.isFocusTarget(targetEl) && targetEl.isConnected ? targetEl :
       void 0;

      const changeSet: PositionChangeSet = this.#positionChangeSet;
      const styleCache: TJSPositionStyleCache = this.#styleCache;

      if (el)
      {
         // Cache the computed styles of the element.
         if (!styleCache.hasData(el))
         {
            styleCache.update(el);

            // Add will-change property if not already set in inline or computed styles.
            if (!styleCache.hasWillChange)
            {
               // TODO: This is commented out as there is a Chrome bug that reduces quality / blurs
               // child elements when `will-change: transform` is set.
               // https://bugs.chromium.org/p/chromium/issues/detail?id=1343711#c4

               // el.style.willChange = this.#options.ortho ? 'transform' : 'top, left, transform';
            }

            // Update all properties / clear queued state.
            changeSet.set(true);
            this.#updateElementData.queued = false;
         }

         // Converts any string position data to numeric inputs.
         ConvertStringData.process(position, this.#data, el);

         position = this.#updatePosition(position as TJSPositionData, parent, el, styleCache);

         // Check if a validator cancelled the update.
         if (position === null) { return this; }
      }

      if (MathGuard.isFinite(position.left))
      {
         position.left = Math.round(position.left);

         if (data.left !== position.left) { data.left = position.left; changeSet.left = true; }
      }

      if (MathGuard.isFinite(position.top))
      {
         position.top = Math.round(position.top);

         if (data.top !== position.top) { data.top = position.top; changeSet.top = true; }
      }

      if (MathGuard.isFiniteOrNull(position.maxHeight))
      {
         position.maxHeight = typeof position.maxHeight === 'number' ? Math.round(position.maxHeight) : null;

         if (data.maxHeight !== position.maxHeight) { data.maxHeight = position.maxHeight; changeSet.maxHeight = true; }
      }

      if (MathGuard.isFiniteOrNull(position.maxWidth))
      {
         position.maxWidth = typeof position.maxWidth === 'number' ? Math.round(position.maxWidth) : null;

         if (data.maxWidth !== position.maxWidth) { data.maxWidth = position.maxWidth; changeSet.maxWidth = true; }
      }

      if (MathGuard.isFiniteOrNull(position.minHeight))
      {
         position.minHeight = typeof position.minHeight === 'number' ? Math.round(position.minHeight) : null;

         if (data.minHeight !== position.minHeight) { data.minHeight = position.minHeight; changeSet.minHeight = true; }
      }

      if (MathGuard.isFiniteOrNull(position.minWidth))
      {
         position.minWidth = typeof position.minWidth === 'number' ? Math.round(position.minWidth) : null;

         if (data.minWidth !== position.minWidth) { data.minWidth = position.minWidth; changeSet.minWidth = true; }
      }

      if (MathGuard.isFiniteOrNull(position.rotateX))
      {
         if (data.rotateX !== position.rotateX)
         {
            data.rotateX = transforms.rotateX = position.rotateX;
            changeSet.transform = true;
         }
      }

      if (MathGuard.isFiniteOrNull(position.rotateY))
      {
         if (data.rotateY !== position.rotateY)
         {
            data.rotateY = transforms.rotateY = position.rotateY;
            changeSet.transform = true;
         }
      }

      if (MathGuard.isFiniteOrNull(position.rotateZ))
      {
         if (data.rotateZ !== position.rotateZ)
         {
            data.rotateZ = transforms.rotateZ = position.rotateZ;
            changeSet.transform = true;
         }
      }

      if (MathGuard.isFiniteOrNull(position.scale))
      {
         position.scale = typeof position.scale === 'number' ? clamp(position.scale, 0, 1000) : null;

         if (data.scale !== position.scale)
         {
            data.scale = transforms.scale = position.scale;
            changeSet.transform = true;
         }
      }

      if ((typeof position.transformOrigin === 'string' && TJSTransforms.transformOrigins.includes(
       position.transformOrigin)) || position.transformOrigin === null)
      {
         if (data.transformOrigin !== position.transformOrigin)
         {
            data.transformOrigin = position.transformOrigin;
            changeSet.transformOrigin = true;
         }
      }

      if (MathGuard.isFiniteOrNull(position.translateX))
      {
         if (data.translateX !== position.translateX)
         {
            data.translateX = transforms.translateX = position.translateX;
            changeSet.transform = true;
         }
      }

      if (MathGuard.isFiniteOrNull(position.translateY))
      {
         if (data.translateY !== position.translateY)
         {
            data.translateY = transforms.translateY = position.translateY;
            changeSet.transform = true;
         }
      }

      if (MathGuard.isFiniteOrNull(position.translateZ))
      {
         if (data.translateZ !== position.translateZ)
         {
            data.translateZ = transforms.translateZ = position.translateZ;
            changeSet.transform = true;
         }
      }

      if (MathGuard.isFinite(position.zIndex))
      {
         position.zIndex = Math.round(position.zIndex);

         if (data.zIndex !== position.zIndex) { data.zIndex = position.zIndex; changeSet.zIndex = true; }
      }

      const widthIsObservable: boolean = position.width === 'auto' || position.width === 'inherit';

      if (MathGuard.isFiniteOrNull(position.width) || widthIsObservable)
      {
         position.width = typeof position.width === 'number' ? Math.round(position.width) : position.width;

         if (data.width !== position.width)
         {
            data.width = position.width as number | 'auto' | 'inherit';
            changeSet.width = true;
         }
      }

      const heightIsObservable: boolean = position.height === 'auto' || position.height === 'inherit';

      if (MathGuard.isFiniteOrNull(position.height) || heightIsObservable)
      {
         position.height = typeof position.height === 'number' ? Math.round(position.height) : position.height;

         if (data.height !== position.height)
         {
            data.height = position.height as number | 'auto' | 'inherit';
            changeSet.height = true;
         }
      }

      // Potentially update the `resizeObservable` store when the state of `width` or `height` changes between
      // `auto` / `inherit` to a number or null.
      const resizeObservable: boolean = widthIsObservable || heightIsObservable;
      if (this.#resizeObservable !== resizeObservable)
      {
         this.#resizeObservable = resizeObservable;
         // Set store on next clock tick.
         // setTimeout(() => this.#styleCache.stores.resizeObservable.set(resizeObservable), 0);
         this.#styleCache.stores.resizeObservable.set(resizeObservable);
      }

      if (el)
      {
         const defaultData: TJSPositionNS.Data.TJSPositionDataExtra = this.#state.getDefault();

         // Set default data after first set operation that has a target element.
         if (!isObject(defaultData)) { this.#state.save({ name: '#defaultData', ...Object.assign({}, data) }); }

         // If `immediateElementUpdate` is true then update the element immediately. This is for rAF based library
         // integrations like GSAP and updates coming from AnimationManager.
         if (immediateElementUpdate)
         {
            UpdateElementManager.immediate(el, this.#updateElementData);
            this.#updateElementPromise = Promise.resolve(globalThis.performance.now());
         }
         // Else if not queued then queue an update for the next rAF callback.
         else if (!this.#updateElementData.queued)
         {
            this.#updateElementPromise = UpdateElementManager.add(el, this.#updateElementData);
         }
      }
      else
      {
         // Notify main store subscribers.
         UpdateElementManager.updateSubscribers(this.#updateElementData);
      }

      return this;
   }

   /**
    * @param handler - Callback function that is invoked on update / changes. Receives a readonly copy of the
    *        TJSPositionData.
    *
    * @returns Unsubscribe function.
    */
   subscribe(handler: Subscriber<Readonly<TJSPositionNS.Data.TJSPositionData>>): Unsubscriber
   {
      this.#subscribers.push(handler); // add handler to the array of subscribers

      handler(Object.assign({}, this.#data));                     // call handler with current value

      // Return unsubscribe function.
      return () =>
      {
         const index = this.#subscribers.findIndex((sub) => sub === handler);
         if (index >= 0) { this.#subscribers.splice(index, 1); }
      };
   }

   /**
    * Provides the {@link Writable} store `update` method. Receive and return a {@link TJSPositionData} instance to
    * update the position state. You may manipulate numeric properties by providing relative adjustments described in
    * {@link TJSPositionDataRelative}.
    *
    * @param {Updater<TJSPositionNS.Data.TJSPositionDataRelative>} updater -
    */
   update(updater: Updater<TJSPositionNS.Data.TJSPositionDataRelative>): void
   {
      const result: TJSPositionNS.Data.TJSPositionDataRelative = updater(this.get());

      if (!isObject(result)) { throw new TypeError(`'result' of 'updater' is not an object.`); }

      this.set(result);
   }

   // Internal Implementation ----------------------------------------------------------------------------------------

   /**
    * Temporary data storage for `TJSPosition.#updatePosition`.
    */
   static #updateDataCopy: TJSPositionData = Object.seal(new TJSPositionData());

   /**
    * Temporary data storage for `TJSPosition.#updatePosition`.
    */
   static #validationData: TJSPositionNS.System.Validator.API.ValidationData = Object.seal({
      position: void 0,
      parent: void 0,
      el: void 0,
      computed: void 0,
      transforms: void 0,
      height: void 0,
      width: void 0,
      marginLeft: void 0,
      marginTop: void 0,
      maxHeight: void 0,
      maxWidth: void 0,
      minHeight: void 0,
      minWidth: void 0,
      rest: void 0
   });

   /**
    * @param data -
    *
    * @param parent -
    *
    * @param el -
    *
    * @param styleCache -
    *
    * @returns Updated position data or null if validation fails.
    */
   #updatePosition({
      // Directly supported parameters
      left, top, maxWidth, maxHeight, minWidth, minHeight, width, height, rotateX, rotateY, rotateZ, scale,
       transformOrigin, translateX, translateY, translateZ, zIndex,

      // Aliased parameters
      rotation,

      ...rest
   }: TJSPositionNS.Data.TJSPositionData, parent: TJSPositionNS.PositionParent, el: HTMLElement,
    styleCache: TJSPositionStyleCache): TJSPositionData | null
   {
      let currentPosition: TJSPositionData = TJSPositionDataUtil.copyData(this.#data, TJSPosition.#updateDataCopy);

      // Update width if an explicit value is passed, or if no width value is set on the element.
      if (width !== void 0 || el.style.width === '')
      {
         const widthValid: boolean = width === null || Number.isFinite(width);

         if (width === 'auto' || (currentPosition.width === 'auto' && !widthValid))
         {
            currentPosition.width = 'auto';
            width = styleCache.offsetWidth;
         }
         else if (width === 'inherit' || (currentPosition.width === 'inherit' && !widthValid))
         {
            currentPosition.width = 'inherit';
            width = styleCache.offsetWidth;
         }
         else
         {
            const newWidth: number | 'auto' | 'inherit' = MathGuard.isFinite(width) ? width : currentPosition.width;

            currentPosition.width = width = MathGuard.isFinite(newWidth) ? Math.round(newWidth) :
             styleCache.offsetWidth;
         }
      }
      else
      {
         width = Number.isFinite(currentPosition.width) ? currentPosition.width : styleCache.offsetWidth;
      }

      // Update height if an explicit value is passed, or if no height value is set on the element.
      if (height !== void 0 || el.style.height === '')
      {
         const heightValid: boolean = height === null || Number.isFinite(height);

         if (height === 'auto' || (currentPosition.height === 'auto' && !heightValid))
         {
            currentPosition.height = 'auto';
            height = styleCache.offsetHeight;
         }
         else if (height === 'inherit' || (currentPosition.height === 'inherit' && !heightValid))
         {
            currentPosition.height = 'inherit';
            height = styleCache.offsetHeight;
         }
         else
         {
            const newHeight: number | 'auto' | 'inherit' = MathGuard.isFinite(height) ? height : currentPosition.height;

            currentPosition.height = height = MathGuard.isFinite(newHeight) ? Math.round(newHeight) :
             styleCache.offsetHeight;
         }
      }
      else
      {
         height = Number.isFinite(currentPosition.height) ? currentPosition.height : styleCache.offsetHeight;
      }

      // Update left
      if (MathGuard.isFinite(left))
      {
         currentPosition.left = left;
      }
      else if (!Number.isFinite(currentPosition.left))
      {
         // Potentially use any initial position helper if available or set to 0.
         currentPosition.left = typeof this.#options?.initial?.getLeft === 'function' ?
          this.#options.initial.getLeft(width as number) : 0;
      }

      // Update top
      if (Number.isFinite(top))
      {
         currentPosition.top = top;
      }
      else if (!Number.isFinite(currentPosition.top))
      {
         // Potentially use any initial position helper if available or set to 0.
         currentPosition.top = typeof this.#options?.initial?.getTop === 'function' ?
          this.#options.initial.getTop(height as number) : 0;
      }

      if (Number.isFinite(maxHeight) || maxHeight === null)
      {
         currentPosition.maxHeight = Number.isFinite(maxHeight) ? Math.round(maxHeight) : null;
      }

      if (Number.isFinite(maxWidth) || maxWidth === null)
      {
         currentPosition.maxWidth = Number.isFinite(maxWidth) ? Math.round(maxWidth) : null;
      }

      if (Number.isFinite(minHeight) || minHeight === null)
      {
         currentPosition.minHeight = Number.isFinite(minHeight) ? Math.round(minHeight) : null;
      }

      if (Number.isFinite(minWidth) || minWidth === null)
      {
         currentPosition.minWidth = Number.isFinite(minWidth) ? Math.round(minWidth) : null;
      }

      // Update rotate X/Y/Z, scale, z-index
      if (Number.isFinite(rotateX) || rotateX === null) { currentPosition.rotateX = rotateX; }
      if (Number.isFinite(rotateY) || rotateY === null) { currentPosition.rotateY = rotateY; }

      // Handle alias for rotateZ. First check if `rotateZ` is valid and different from the current value. Next check if
      // `rotation` is valid and use it for `rotateZ`.
      if (rotateZ !== currentPosition.rotateZ && (Number.isFinite(rotateZ) || rotateZ === null))
      {
         currentPosition.rotateZ = rotateZ;
      }
      else if (rotation !== currentPosition.rotateZ && (Number.isFinite(rotation) || rotation === null))
      {
         currentPosition.rotateZ = rotation;
      }

      if (Number.isFinite(translateX) || translateX === null) { currentPosition.translateX = translateX; }
      if (Number.isFinite(translateY) || translateY === null) { currentPosition.translateY = translateY; }
      if (Number.isFinite(translateZ) || translateZ === null) { currentPosition.translateZ = translateZ; }

      if (Number.isFinite(scale) || scale === null)
      {
         currentPosition.scale = typeof scale === 'number' ? clamp(scale, 0, 1000) : null;
      }

      if (typeof transformOrigin === 'string' || transformOrigin === null)
      {
         currentPosition.transformOrigin = TJSTransforms.transformOrigins.includes(transformOrigin) ? transformOrigin :
          null;
      }

      if (Number.isFinite(zIndex) || zIndex === null)
      {
         currentPosition.zIndex = typeof zIndex === 'number' ? Math.round(zIndex) : zIndex;
      }

      const validatorData = this.#validatorData;

      // If there are any validators allow them to potentially modify position data or reject the update.
      if (this.#validators.enabled && validatorData.length)
      {
         const validationData = TJSPosition.#validationData;

         validationData.parent = parent;

         validationData.el = el;

         validationData.computed = styleCache.computed;

         validationData.transforms = this.#transforms;

         validationData.height = height as number;

         validationData.width = width as number;

         validationData.marginLeft = styleCache.marginLeft;

         validationData.marginTop = styleCache.marginTop;

         validationData.maxHeight = styleCache.maxHeight ?? currentPosition.maxHeight;

         validationData.maxWidth = styleCache.maxWidth ?? currentPosition.maxWidth;

         // Given a parent w/ reactive state and is minimized ignore styleCache min-width/height.
         // TODO: THIS IS REFERENCING APPLICATION OPTIONS.
         const isMinimized: boolean = (parent as any)?.reactive?.minimized ?? false;

         // Note the use of || for accessing the style cache as the left hand is ignored w/ falsy values such as '0'.
         validationData.minHeight = isMinimized ? currentPosition.minHeight ?? 0 :
          styleCache.minHeight || (currentPosition.minHeight ?? 0);

         validationData.minWidth = isMinimized ? currentPosition.minWidth ?? 0 :
          styleCache.minWidth || (currentPosition.minWidth ?? 0);

         for (let cntr: number = 0; cntr < validatorData.length; cntr++)
         {
            validationData.position = currentPosition;
            validationData.rest = rest;
            currentPosition = validatorData[cntr].validate(validationData);

            if (currentPosition === null) { return null; }
         }
      }

      // Return the updated position object.
      return currentPosition;
   }
}
