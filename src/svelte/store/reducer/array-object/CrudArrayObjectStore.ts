import { Hashing }               from '#runtime/util';

import { isObject }              from '#runtime/util/object';

import { ArrayObjectStore }      from './ArrayObjectStore';

import type {
   ArrayObjectStoreParams,
   BaseObjectEntryStore,
   CrudArrayObjectStoreParams,
   CrudDispatch,
   ExtractDataType }             from './types';

/**
 * @typeParam S - Store type.
 */
export class CrudArrayObjectStore<S extends BaseObjectEntryStore<any>> extends ArrayObjectStore<S>
{
   /**
    */
   readonly #crudDispatch: CrudDispatch<ExtractDataType<S>> | undefined;

   /**
    */
   readonly #extraData: object;

   /**
    * @param options - CrudArrayObjectStore options.
    *
    * @param [options.crudDispatch] -
    *
    * @param [options.extraData] -
    *
    * @param options.rest - Rest of ArrayObjectStore parameters.
    */
   constructor({ crudDispatch, extraData, ...rest }: CrudArrayObjectStoreParams<S> & ArrayObjectStoreParams<S>)
   {
      // 'manualUpdate' is set to true if 'crudUpdate' is defined, but can be overridden by `...rest`.
      super({
         manualUpdate: typeof crudDispatch === 'function',
         ...rest,
      });

      if (crudDispatch !== void 0 && typeof crudDispatch !== 'function')
      {
         throw new TypeError(`'crudDispatch' is not a function.`);
      }

      if (extraData !== void 0 && !isObject(extraData))
      {
         throw new TypeError(`'extraData' is not an object.`);
      }

      this.#crudDispatch = crudDispatch;
      this.#extraData = extraData ?? {};
   }

   /**
    * Removes all child store entries.
    */
   override clearEntries(): void
   {
      super.clearEntries();

      if (this.#crudDispatch)
      {
         this.#crudDispatch({ action: 'clear', ...this.#extraData });
      }
   }

   /**
    * Creates a new store from given data.
    *
    * @param entryData -
    *
    * @returns Associated store with entry data.
    */
   override createEntry(entryData: ExtractDataType<S>): S
   {
      const store: S = super.createEntry(entryData);

      if (store && this.#crudDispatch)
      {
         this.#crudDispatch({
            action: 'create',
            ...this.#extraData,
            id: store.id,
            data: store.toJSON()
         });
      }

      return store;
   }

   /**
    * Deletes a given entry store by ID from this world setting array store instance.
    *
    * @param id - ID of entry to delete.
    *
    * @returns Delete operation successful.
    */
   override deleteEntry(id: string): boolean
   {
      const result: boolean = super.deleteEntry(id);

      if (result && this.#crudDispatch)
      {
         this.#crudDispatch({ action: 'delete', ...this.#extraData, id });
      }

      return result;
   }

   /**
    * Updates subscribers, but provides special handling when a `crudDispatch` function is attached. When `update` is
    * an object with a valid UUIDv4 string as the id property the `crudDispatch` function is invoked along with the
    * data payload.
    *
    * @param [update] - A boolean indicating that subscribers should be notified otherwise
    */
   override updateSubscribers(update: boolean | ExtractDataType<S> | undefined = void 0): void
   {
      if (this.#crudDispatch && isObject(update) && Hashing.isUuidv4(update.id))
      {
         const result: boolean = this.#crudDispatch({
            action: 'update',
            ...this.#extraData,
            id: update.id,
            data: update  // TODO: Consider using klona to clone data.
         });

         // If the crudDispatch function returns a boolean then invoke 'ArrayObjectStore.updateSubscribers' with it.
         super.updateSubscribers(typeof result === 'boolean' ? result : update);
      }
      else
      {
         super.updateSubscribers(update);
      }
   }
}
