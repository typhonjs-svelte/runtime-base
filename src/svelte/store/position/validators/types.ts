import type { Subscriber }          from 'svelte/store';

import type { TJSPosition }         from '../TJSPosition.js';
import type { TJSPositionData }     from '../TJSPositionData.js';
import type { TJSPositionParent }   from '../';
import type { TJSTransforms }       from '../transform';

/**
 * Provides the validator API implementation for {@link TJSPosition.validators}. You may add one or more validator
 * functions which evaluate changes in the associated {@link TJSPosition} instance. This allows standard validation
 * for browser bounds / transform checking available via {@link TJSPosition.Validators} or custom validators added which
 * may provide unique bounding validation / constraints.
 */
interface IValidatorAPI
{
   /**
    * @returns {boolean} Returns the enabled state.
    */
   get enabled(): boolean;

   /**
    * @returns {number} Returns the length of the validators array.
    */
   get length(): number;

   /**
    * @param {boolean}  enabled - Sets enabled state.
    */
   set enabled(enabled: boolean);

   /**
    * Provides an iterator for validators.
    *
    * @yields {ValidatorData}
    * @returns {IterableIterator<ValidatorData>} iterator.
    */
   [Symbol.iterator](): IterableIterator<ValidatorData>;

   /**
    * Adds the given validators.
    *
    * @param {...(ValidatorFn | ValidatorData)}   validators - Validators to add.
    */
   add(...validators: (ValidatorFn | ValidatorData)[]): void;

   /**
    * Clears / removes all validators.
    */
   clear(): void;

   /**
    * Removes one or more given validators.
    *
    * @param {...(ValidatorFn | ValidatorData)}   validators - Validators to remove.
    */
   remove(...validators: (ValidatorFn | ValidatorData)[]): void;

   /**
    * Remove validators by the provided callback. The callback takes 3 parameters: `id`, `validator`, and `weight`.
    * Any truthy value returned will remove that validator.
    *
    * @param {ValidatorRemoveByCallback} callback - Callback function to evaluate each validator entry.
    */
   removeBy(callback: ValidatorRemoveByCallback): void;

   /**
    * Removes any validators with matching IDs.
    *
    * @param {...any} ids - IDs to remove.
    */
   removeById(...ids: any[]): void;
}

/**
 * The data passed to validator functions to determine if the new `position` / TJSPosition data is valid.
 */
type ValidationData = {
   /**
    * New position data to evaluate.
    */
   position: TJSPositionData;

   /**
    * Associated parent element / container.
    */
   parent: TJSPositionParent;

   /**
    * Associated element being positioned.
    */
   el: HTMLElement;

   /**
    * Computed styles for the element.
    */
   computed: CSSStyleDeclaration;

   /**
    *
    */
   transforms: TJSTransforms;

   height: number;

   width: number;

   marginLeft: number | undefined;

   marginTop: number | undefined;

   maxHeight: number | undefined;

   maxWidth: number | undefined;

   minHeight: number | undefined;

   minWidth: number | undefined;

   /**
    * The rest of any data submitted to {@link TJSPosition.set}
    */
   rest: Record<string, any> | undefined;
}


/**
 * Defines a validator function entry with optional data such as assigning an `id` / `weight` or providing more
 * interactivity through attaching a subscriber function to monitor for updates that triggers validation.
 */
type ValidatorData = {
   /**
    * TJSPosition validator function that takes a {@link TJSPositionData} instance potentially modifying it or
    * returning null if invalid.
    */
   validator: ValidatorFn;

   /**
    * An ID associated with this validator. Can be used to remove the validator; default: `undefined`.
    */
   id?: any;

   /**
    * Optional subscribe function following the Svelte store / subscribe pattern.
    */
   subscribe?: Subscriber<any>;

   /**
    * A number between 0 and 1 inclusive to position this validator against others; default: `1`.
    */
   weight?: number;
}

/**
 * TJSPosition validator function that takes a {@link TJSPositionData} instance potentially modifying it or returning
 * null if invalid.
 *
 * @param {ValidationData} data - Validation data to handle.
 *
 * @returns {TJSPositionData | null} The validated position data or null to cancel position update.
 */
type ValidatorFn = (data: ValidationData) => TJSPositionData | null;

/**
 * Callback function to evaluate each validator entry. Return true to remove.
 *
 * @param {ValidatorData} data - ValidatorData instance to potentially filter / remove.
 */
type ValidatorRemoveByCallback = (data: ValidatorData) => boolean;

/**
 * Defines the {@link TJSPosition} validator options.
 */
type TJSPositionValidatorOptions = ValidatorFn | ValidatorData | Iterable<ValidatorFn | ValidatorData>

export {
   IValidatorAPI,
   TJSPositionValidatorOptions,
   ValidatorData,
   ValidationData,
   ValidatorFn,
   ValidatorRemoveByCallback
}
