import { Hashing }               from '#runtime/util';
import { isObject }              from '#runtime/util/object';

import type {
   Subscriber,
   Unsubscriber }                from 'svelte/store';

import type { MinimalWritable }  from '#runtime/svelte/store/util';

import type { ArrayObjectStore } from './ArrayObjectStore';

/**
 * Provides a base implementation for store entries in {@link ArrayObjectStore}.
 *
 * In particular providing the required getting / accessor for the 'id' property.
 */
export abstract class ObjectEntryStore<T extends ArrayObjectStore.Data.BaseArrayObject =
 ArrayObjectStore.Data.BaseArrayObject> implements ArrayObjectStore.Data.BaseObjectEntryStore<T>
{
   /**
    */
   readonly #data: T;

   /**
    * Stores the subscribers.
    */
   #subscribers: Subscriber<T>[] = [];

   /**
    * Invoked by ArrayObjectStore to provide custom duplication. Override this static method in your entry store.
    *
    * @param data - A copy of local data w/ new ID already set.
    *
    * @param arrayStore - The source ArrayObjectStore instance.
    */
   static duplicate<S extends ArrayObjectStore<any>>(data: object, arrayStore: S): void {}  // eslint-disable-line no-unused-vars

   /**
    * @param data -
    */
   constructor(data: T)
   {
      if (!isObject(data)) { throw new TypeError(`'data' is not an object.`); }

      this.#data = data;

      // If `id` is missing then add it.
      if (typeof this.#data.id !== 'string') { this.#data.id = Hashing.uuidv4(); }

      if (!Hashing.isUuidv4(this.#data.id))
      {
         throw new Error(`'data.id' (${this.#data.id}) is not a valid UUIDv4 string.`);
      }
   }

   /**
    * @returns The object data tracked by this store.
    */
   protected get _data(): T { return this.#data; }

   /**
    * @returns The ID attribute in object data tracked by this store.
    */
   get id(): string { return this.#data.id as string; }

   // ----------------------------------------------------------------------------------------------------------------

   /**
    * To be implemented by child implementations as required by the {@link MinimalWritable} contract. You must manually
    * invoke {@link ObjectEntryStore._updateSubscribers} to notify subscribers.
    *
    * @param data Data to set to store.
    */
   abstract set(data: T): void;

   /**
    * @returns A JSON data object for the backing data. The default implementation directly returns the backing private
    *          data object. You may override this method to clone the data via {@link ObjectEntryStore._data}.
    */
   toJSON(): T
   {
      return this.#data;
   }

   /**
    * @param handler - Callback function that is invoked on update / changes.
    *
    * @returns Unsubscribe function.
    */
   subscribe(handler: Subscriber<T>): Unsubscriber
   {
      this.#subscribers.push(handler);  // add handler to the array of subscribers

      handler(this.#data);                // call handler with current value

      // Return unsubscribe function.
      return (): void =>
      {
         const index: number = this.#subscribers.findIndex((sub: Subscriber<T>): boolean => sub === handler);
         if (index >= 0) { this.#subscribers.splice(index, 1); }
      };
   }

   /**
    * Update subscribers of this store. Useful for child implementations.
    */
   protected _updateSubscribers(): void
   {
      for (let cntr: number = 0; cntr < this.#subscribers.length; cntr++) { this.#subscribers[cntr](this.#data); }
   }
}
