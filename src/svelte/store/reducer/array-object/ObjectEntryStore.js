import { Hashing }   from '#runtime/util';

import { isObject }  from '#runtime/util/object';

/**
 * Provides a base implementation for store entries in {@link ArrayObjectStore}.
 *
 * In particular providing the required getting / accessor for the 'id' property.
 */
export class ObjectEntryStore
{
   /**
    * @type {object}
    */
   #data;

   /**
    * Stores the subscribers.
    *
    * @type {import('svelte/store').Subscriber<object>[]}
    */
   #subscriptions = [];

   /**
    * @param {object}   data -
    */
   constructor(data = {})
   {
      if (!isObject(data)) { throw new TypeError(`'data' is not an object.`); }

      this.#data = data;

      // If an id is missing then add it.
      if (typeof data.id !== 'string') { this.#data.id = Hashing.uuidv4(); }

      if (!Hashing.isUuidv4(data.id)) { throw new Error(`'data.id' (${data.id}) is not a valid UUIDv4 string.`); }
   }

   /**
    * Invoked by ArrayObjectStore to provide custom duplication. Override this static method in your entry store.
    *
    * @param {object}   data - A copy of local data w/ new ID already set.
    *
    * @param {import('./ArrayObjectStore').ArrayObjectStore} arrayStore - The source ArrayObjectStore instance.
    */
   static duplicate(data, arrayStore) {}  // eslint-disable-line no-unused-vars

   /**
    * @returns {object} The object data tracked by this store.
    * @protected
    */
   get _data() { return this.#data; }

   // ----------------------------------------------------------------------------------------------------------------

   /**
    * @returns {string} The ID attribute in object data tracked by this store.
    */
   get id() { return this.#data.id; }

   toJSON()
   {
      return this.#data;
   }

   /**
    * @param {import('svelte/store').Subscriber<object>} handler - Callback function that is invoked on update /
    *        changes.
    *
    * @returns {import('svelte/store').Unsubscriber} Unsubscribe function.
    */
   subscribe(handler)
   {
      this.#subscriptions.push(handler);  // add handler to the array of subscribers

      handler(this.#data);                // call handler with current value

      // Return unsubscribe function.
      return () =>
      {
         const index = this.#subscriptions.findIndex((sub) => sub === handler);
         if (index >= 0) { this.#subscriptions.splice(index, 1); }
      };
   }

   /**
    * @protected
    */
   _updateSubscribers()
   {
      const subscriptions = this.#subscriptions;

      const data = this.#data;

      for (let cntr = 0; cntr < subscriptions.length; cntr++) { subscriptions[cntr](data); }
   }
}
