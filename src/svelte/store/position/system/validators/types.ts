import type {
   Invalidator,
   Subscriber,
   Unsubscriber }             from 'svelte/store';

import type { TJSPosition }   from '../../TJSPosition';
import type { Data }          from '../../data/types';
import type { TransformAPI }  from '../../transform/types';

/**
 * Provides the validator API implementation for {@link TJSPosition.validators}. You may add one or more validator
 * functions which evaluate changes in the associated {@link TJSPosition} instance. This allows standard validation
 * for browser bounds / transform checking available via {@link TJSPosition.Validators} or custom validators added which
 * may provide unique bounding validation / constraints.
 */
interface ValidatorAPI
{
   /**
    * @returns Returns the enabled state.
    */
   get enabled(): boolean;

   /**
    * @returns Returns the length of the validators array.
    */
   get length(): number;

   /**
    * @param enabled - Sets enabled state.
    */
   set enabled(enabled: boolean);

   /**
    * Provides an iterator for validators.
    *
    * @returns iterator.
    */
   [Symbol.iterator](): IterableIterator<ValidatorAPI.ValidatorData>;

   /**
    * Adds the given validators.
    *
    * @param validators - Validators to add.
    */
   add(...validators: (ValidatorAPI.ValidatorFn | ValidatorAPI.ValidatorData)[]): void;

   /**
    * Clears / removes all validators.
    */
   clear(): void;

   /**
    * Removes one or more given validators.
    *
    * @param validators - Validators to remove.
    */
   remove(...validators: (ValidatorAPI.ValidatorFn | ValidatorAPI.ValidatorData)[]): void;

   /**
    * Remove validators by the provided callback. The callback takes 3 parameters: `id`, `validator`, and `weight`.
    * Any truthy value returned will remove that validator.
    *
    * @param callback - Callback function to evaluate each validator entry.
    */
   removeBy(callback: ValidatorAPI.RemoveByCallback): void;

   /**
    * Removes any validators with matching IDs.
    *
    * @param ids - IDs to remove.
    */
   removeById(...ids: any[]): void;
}

/**
 * Provides a namespace for all type aliases related to the validator API.
 */
declare namespace ValidatorAPI {
   /**
    * The data passed to validator functions to determine if the new `position` / TJSPosition data is valid.
    */
   export type ValidationData = {
      /**
       * New position data to evaluate.
       */
      position: Data.TJSPositionData;

      /**
       * Associated position parent instance.
       */
      parent: TJSPosition.PositionParent;

      /**
       * Associated element being positioned.
       */
      el: HTMLElement;

      /**
       * Computed styles for the element.
       */
      computed: CSSStyleDeclaration | undefined;

      /**
       * Current applies transforms / transform tracking & conversion utility.
       */
      transforms: TransformAPI;

      /**
       * Current height
       */
      height: number;

      /**
       * Current width
       */
      width: number;

      /**
       * Current left margin.
       */
      marginLeft: number | undefined;

      /**
       * Current top margin.
       */
      marginTop: number | undefined;

      /**
       * Current max height.
       */
      maxHeight: number | undefined | null;

      /**
       * Current max width.
       */
      maxWidth: number | undefined | null;

      /**
       * Current min height.
       */
      minHeight: number | undefined;

      /**
       * Current min width.
       */
      minWidth: number | undefined;

      /**
       * The rest of any data submitted to {@link TJSPosition.set}. This may be used to provide directives to
       * validators.
       */
      rest: { [key: string]: any } | undefined;
   }

   /**
    * Defines a validator function entry with optional data such as assigning an `id` / `weight` or providing more
    * interactivity through attaching a subscriber function to monitor for updates that triggers validation.
    */
   export type ValidatorData = {
      /**
       * TJSPosition validator function that takes a {@link Data.TJSPositionData} instance potentially modifying it or
       * returning null if invalid.
       */
      validate: ValidatorFn;

      /**
       * An ID associated with this validator. Can be used to remove the validator; default: `undefined`.
       */
      id?: any;

      /**
       * Optional subscribe function following the Svelte store / subscribe pattern. On updates validation will be
       * processed again.
       */
      subscribe?(this: void, run: Subscriber<any>, invalidate?: Invalidator<any>): Unsubscriber;

      /**
       * A number between 0 and 1 inclusive to position this validator against others; default: `1`.
       */
      weight?: number;
   };

   /**
    * Defines the {@link TJSPosition} validator option.
    */
   export type ValidatorOption = ValidatorFn | ValidatorData | Iterable<ValidatorFn | ValidatorData>;

   /**
    * Callback function to evaluate each validator entry. Return true to remove.
    *
    * @param data - ValidatorData instance to potentially filter / remove.
    */
   export type RemoveByCallback = (data: ValidatorData) => boolean;

   export interface ValidatorFn extends Function
   {
      /**
       * TJSPosition validator function that takes a {@link ValidationData} instance potentially modifying `position`
       * data or returning null if invalid.
       *
       * @param data - Validation data to handle.
       *
       * @returns The validated position data or null to cancel position update.
       */
      (data: ValidationData): Data.TJSPositionData | null;

      /**
       * Optional subscribe function following the Svelte store / subscribe pattern. On updates validation will be
       * processed again.
       */
      subscribe?(this: void, run: Subscriber<any>, invalidate?: Invalidator<any>): Unsubscriber;
   }
}

export { ValidatorAPI }
