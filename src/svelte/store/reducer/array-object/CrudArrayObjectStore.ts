import { Hashing }            from '#runtime/util';

import { isObject }           from '#runtime/util/object';

import { ArrayObjectStore }   from './ArrayObjectStore';

/**
 * @typeParam S - Store type.
 */
class CrudArrayObjectStore<S extends CrudArrayObjectStore.Data.BaseObjectEntryStore<any>> extends ArrayObjectStore<S>
{
   /**
    */
   readonly #crudDispatch: CrudArrayObjectStore.Options.CrudDispatch<CrudArrayObjectStore.Util.ExtractDataType<S>> |
    undefined;

   /**
    */
   readonly #extraData: { [key: string]: any };

   /**
    * @param options - CrudArrayObjectStore options.
    */
   constructor({ crudDispatch, extraData, ...rest }: CrudArrayObjectStore.Options.Config<S>)
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
   override createEntry(entryData: CrudArrayObjectStore.Util.ExtractDataType<S>): S
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
    * Deletes a given entry store by ID from this array object store instance.
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
   override updateSubscribers(update: boolean | CrudArrayObjectStore.Util.ExtractDataType<S> | undefined): void
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

declare namespace CrudArrayObjectStore {
   export import Data = ArrayObjectStore.Data;
   export import Util = ArrayObjectStore.Util;

   export namespace Options {
      /**
       * @typeParam S - Store type.
       */
      export interface Config<S extends Data.BaseObjectEntryStore<any>> extends ArrayObjectStore.Options.Config<S> {
         /**
          * Optional dispatch function to receive C(R)UD updates on create, update, delete actions.
          */
         crudDispatch?: CrudDispatch<Util.ExtractDataType<S>>;

         /**
          * Optional additional data that is dispatched with `CrudDispatch` callbacks.
          */
         extraData?: { [key: string]: any };
      }

      /**
       * A function that accepts an object w/ 'action', 'moduleId', 'key' properties and optional 'id' / UUIDv4 string
       * and 'data' property.
       *
       * @typeParam D - Store data type.
       */
      export type CrudDispatch<D> = (data: { action: string, id?: string, data?: D, [key: string]: any; }) => boolean;
   }
}

export { CrudArrayObjectStore };
