import { isObject }           from '#runtime/util/object';

import type { Unsubscriber }  from 'svelte/store';

import type { TJSPositionNS } from '../../types';

/**
 * Provides the storage and sequencing of managed position validators. Each validator added may be a bespoke function or
 * a {@link ValidatorData} object containing an `id`, `validator`, and `weight` attributes; `validator` is
 * the only required attribute.
 *
 * The `id` attribute can be anything that creates a unique ID for the validator; recommended strings or numbers. This
 * allows validators to be removed by ID easily.
 *
 * The `weight` attribute is a number between 0 and 1 inclusive that allows validators to be added in a
 * predictable order which is especially handy if they are manipulated at runtime. A lower weighted validator always
 * runs before a higher weighted validator. If no weight is specified the default of '1' is assigned and it is appended
 * to the end of the validators list.
 *
 * This class forms the public API which is accessible from the {@link TJSPosition.validators} getter in the main
 * TJSPosition instance.
 * ```
 * const position = new TJSPosition();
 * position.validators.add(...);
 * position.validators.clear();
 * position.validators.length;
 * position.validators.remove(...);
 * position.validators.removeBy(...);
 * position.validators.removeById(...);
 * ```
 */
export class AdapterValidators implements TJSPositionNS.System.Validator.API
{
   /**
    */
   #enabled: boolean = true;

   /**
    */
   #validatorData: TJSPositionNS.System.Validator.API.ValidatorData[];

   /**
    */
   #mapUnsubscribe: Map<TJSPositionNS.System.Validator.API.ValidatorFn, Unsubscriber> = new Map();

   #updateFn: Function;

   /**
    * @returns Returns this and internal storage for validator adapter.
    */
   static create(updateFn: Function): [AdapterValidators, TJSPositionNS.System.Validator.API.ValidatorData[]]
   {
      const validatorAPI = new AdapterValidators(updateFn);
      return [validatorAPI, validatorAPI.#validatorData];
   }

   /**
    */
   private constructor(updateFn: Function)
   {
      this.#validatorData = [];

      this.#updateFn = updateFn;

      Object.seal(this);
   }

   /**
    * @returns Returns the enabled state.
    */
   get enabled(): boolean { return this.#enabled; }

   /**
    * @returns Returns the length of the validators array.
    */
   get length(): number { return this.#validatorData.length; }

   /**
    * @param enabled - Sets enabled state.
    */
   set enabled(enabled: boolean)
   {
      if (typeof enabled !== 'boolean') { throw new TypeError(`'enabled' is not a boolean.`); }

      this.#enabled = enabled;
   }

   /**
    * Provides an iterator for validators.
    *
    * @returns iterator.
    */
   *[Symbol.iterator](): IterableIterator<TJSPositionNS.System.Validator.API.ValidatorData>
   {
      if (this.#validatorData.length === 0) { return; }

      for (const entry of this.#validatorData)
      {
         yield { ...entry };
      }
   }

   /**
    * Adds the given validators.
    *
    * @param validators - Validators to add.
    */
   add(...validators: (TJSPositionNS.System.Validator.API.ValidatorFn |
    TJSPositionNS.System.Validator.API.ValidatorData)[]): void
   {
      /**
       * Tracks the number of validators added that have subscriber functionality.
       */
      let subscribeCount: number = 0;

      for (const validator of validators)
      {
         const validatorType = typeof validator;

         if ((validatorType !== 'function' && validatorType !== 'object') || validator === null)
         {
            throw new TypeError(`AdapterValidator error: 'validator' is not a function or object.`);
         }

         /**
          */
         let data: TJSPositionNS.System.Validator.API.ValidatorData | undefined = void 0;

         /**
          */
         let subscribeFn: ((...args: any[]) => Unsubscriber) | undefined = void 0;

         switch (validatorType)
         {
            case 'function':
               data = {
                  id: void 0,
                  validate: validator as TJSPositionNS.System.Validator.API.ValidatorFn,
                  weight: 1
               };

               subscribeFn = validator.subscribe;
               break;

            case 'object':
               if ('validate' in validator)
               {
                  if (typeof validator.validate !== 'function')
                  {
                     throw new TypeError(`AdapterValidator error: 'validate' attribute is not a function.`);
                  }

                  if (validator.weight !== void 0 && typeof validator.weight !== 'number' ||
                     (validator.weight < 0 || validator.weight > 1))
                  {
                     throw new TypeError(
                        `AdapterValidator error: 'weight' attribute is not a number between '0 - 1' inclusive.`);
                  }

                  data = {
                     id: validator.id !== void 0 ? validator.id : void 0,
                     validate: validator.validate.bind(validator),
                     weight: validator.weight || 1
                  };

                  subscribeFn = validator.validate.subscribe ?? validator.subscribe;
               }
               else
               {
                  throw new TypeError(`AdapterValidator error: 'validate' attribute is not a function.`);
               }

               break;
         }

         // Find the index to insert where data.weight is less than existing values weight.
         const index = this.#validatorData.findIndex((value) =>
         {
            return data.weight < value.weight;
         });

         // If an index was found insert at that location.
         if (index >= 0)
         {
            this.#validatorData.splice(index, 0, data);
         }
         else // push to end of validators.
         {
            this.#validatorData.push(data);
         }

         if (typeof subscribeFn === 'function')
         {
            const unsubscribe = subscribeFn.call(validator, this.#updateFn);

            // Ensure that unsubscribe is a function.
            if (typeof unsubscribe !== 'function')
            {
               throw new TypeError(
                'AdapterValidator error: Validator has subscribe function, but no unsubscribe function is returned.');
            }

            // Ensure that the same validator is not subscribed to multiple times.
            if (this.#mapUnsubscribe.has(data.validate))
            {
               throw new Error(
                'AdapterValidator error: Validator added already has an unsubscribe function registered.');
            }

            this.#mapUnsubscribe.set(data.validate, unsubscribe);
            subscribeCount++;
         }
      }

      // Validators with subscriber functionality are assumed to immediately invoke the `subscribe` callback. If the
      // subscriber count is less than the amount of validators added then automatically trigger an update manually.
      if (subscribeCount < validators.length) { this.#updateFn(); }
   }

   /**
    * Clears / removes all validators.
    */
   clear(): void
   {
      this.#validatorData.length = 0;

      // Unsubscribe from all validators with subscription support.
      for (const unsubscribe of this.#mapUnsubscribe.values())
      {
         unsubscribe();
      }

      this.#mapUnsubscribe.clear();

      this.#updateFn();
   }

   /**
    * Removes one or more given validators.
    *
    * @param validators - Validators to remove.
    */
   remove(...validators: (TJSPositionNS.System.Validator.API.ValidatorFn |
      TJSPositionNS.System.Validator.API.ValidatorData)[]): void
   {
      const length: number = this.#validatorData.length;

      if (length === 0) { return; }

      for (const data of validators)
      {
         // Handle the case that the validator may either be a function or a validator entry / object.
         const actualValidator: TJSPositionNS.System.Validator.API.ValidatorFn | undefined =
          typeof data === 'function' ? data : isObject(data) ? data.validate : void 0;

         if (!actualValidator) { continue; }

         for (let cntr: number = this.#validatorData.length; --cntr >= 0;)
         {
            if (this.#validatorData[cntr].validate === actualValidator)
            {
               this.#validatorData.splice(cntr, 1);

               // Invoke any unsubscribe function for given validator then remove from tracking.
               let unsubscribe: Unsubscriber | undefined = void 0;
               if (typeof (unsubscribe = this.#mapUnsubscribe.get(actualValidator)) === 'function')
               {
                  unsubscribe();
                  this.#mapUnsubscribe.delete(actualValidator);
               }
            }
         }
      }

      // Invoke update as a validator was removed.
      if (length !== this.#validatorData.length) { this.#updateFn(); }
   }

   /**
    * Remove validators by the provided callback. The callback takes 3 parameters: `id`, `validator`, and `weight`.
    * Any truthy value returned will remove that validator.
    *
    * @param callback - Callback function to evaluate each validator entry.
    */
   removeBy(callback: TJSPositionNS.System.Validator.API.RemoveByCallback): void
   {
      const length: number = this.#validatorData.length;

      if (length === 0) { return; }

      if (typeof callback !== 'function')
      {
         throw new TypeError(`AdapterValidator error: 'callback' is not a function.`);
      }

      this.#validatorData = this.#validatorData.filter((data) =>
      {
         const remove = callback.call(callback, { ...data });

         if (remove)
         {
            let unsubscribe;
            if (typeof (unsubscribe = this.#mapUnsubscribe.get(data.validate)) === 'function')
            {
               unsubscribe();
               this.#mapUnsubscribe.delete(data.validate);
            }
         }

         // Reverse remove boolean to properly validator / remove this validator.
         return !remove;
      });

      if (length !== this.#validatorData.length) { this.#updateFn(); }
   }

   /**
    * Removes any validators with matching IDs.
    *
    * @param {...any}   ids - IDs to remove.
    */
   removeById(...ids: any[])
   {
      const length: number = this.#validatorData.length;

      if (length === 0) { return; }

      this.#validatorData = this.#validatorData.filter((data) =>
      {
         let remove = false;

         for (const id of ids) { remove ||= data.id === id; }

         // If not keeping invoke any unsubscribe function for given validator then remove from tracking.
         if (remove)
         {
            let unsubscribe;
            if (typeof (unsubscribe = this.#mapUnsubscribe.get(data.validate)) === 'function')
            {
               unsubscribe();
               this.#mapUnsubscribe.delete(data.validate);
            }
         }

         return !remove; // Swap here to actually remove the item via array validator method.
      });

      if (length !== this.#validatorData.length) { this.#updateFn(); }
   }
}
