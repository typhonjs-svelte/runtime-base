/**
 * Provides the base Storage API store manager. It is recommended to use {@link TJSLocalStorage} &
 * {@link TJSSessionStorage} for standard browser local and session storage use cases. TJSWebStorage exists to provide
 * additional customization options for custom Storage API compatible storage instances and custom serialization
 * configuration.
 */
export class TJSWebStorage
{
   /** @type {import('./').StorageStores} */
   #storageStores;

   /**
    * @type {(Map<string, {
    *    store: import('svelte/store').Writable,
    *    deserialize?: (value: string, ...rest: any[]) => any,
    *    serialize?: (value: any, ...rest: any[]) => string
    * }>)}
    */
   #stores = new Map();

   /**
    * @param {import('./').StorageStores} storageStores - Provides a complete set of
    *        storage API store helper functions and the associated storage API instance and serializations strategy.
    */
   constructor(storageStores)
   {
      this.#storageStores = storageStores;
   }


   /**
    * @param {string}   key - Storage key.
    *
    * @returns {(value: string, ...rest: any[]) => any} Deserialize function.
    */
   #getDeserialize(key)
   {
      return this.#stores.get(key)?.deserialize ?? this.#storageStores.deserialize;
   }


   /**
    * @param {string}   key - Storage key.
    *
    * @returns {(value: any, ...rest: any[]) => string} Serialize function.
    */
   #getSerialize(key)
   {
      return this.#stores.get(key)?.serialize ?? this.#storageStores.serialize;
   }

   /**
    * Creates a new store for the given key.
    *
    * @template T
    *
    * @param {string}   key - Key to lookup in stores map.
    *
    * @param {T}        [defaultValue] - A default value to set for the store.
    *
    * @param {import('./').StorageStores} [storageStores] - Additional store creation options.
    *
    * @returns {import('svelte/store').Writable<T>} The new store.
    */
   #createStore(key, defaultValue = void 0, storageStores)
   {
      try
      {
         const value = this.#storageStores.storage.getItem(key);
         if (value !== null)
         {
            const deserialize = storageStores?.deserialize ?? this.#storageStores.deserialize;
            defaultValue = deserialize(value);
         }
      }
      catch (err) { /**/ }

      const writable = storageStores?.writable ?? this.#storageStores.writable;

      return writable(key, defaultValue);
   }

   /**
    * Gets a store from the `stores` Map or creates a new store for the key and a given default value.
    *
    * @template T
    *
    * @param {string}   key - Key to lookup in stores map.
    *
    * @param {T}        [defaultValue] - A default value to set for the store.
    *
    * @param {import('./').StorageStores} [storageStores] - Additional store creation options.
    *
    * @returns {import('svelte/store').Writable<T>} The store for the given key.
    */
   #getStore(key, defaultValue = void 0, storageStores)
   {
      let storeEntry = this.#stores.get(key);
      if (storeEntry) { return storeEntry.store; }

      const store = this.#createStore(key, defaultValue, storageStores);

      // Set any key specific storage helper details.
      this.#stores.set(key, {
         store,
         deserialize: storageStores?.deserialize,
         serialize: storageStores?.serialize
      });

      return store;
   }

   /**
    * Get value from the storage API.
    *
    * @param {string}   key - Key to lookup in storage API.
    *
    * @param {*}        [defaultValue] - A default value to return if key not present in session storage.
    *
    * @returns {*} Value from session storage or if not defined any default value provided.
    */
   getItem(key, defaultValue)
   {
      let value = defaultValue;

      const storageValue = this.#storageStores.storage.getItem(key);

      if (storageValue !== null)
      {
         try
         {
            value = this.#getDeserialize(key)(storageValue);
         }
         catch (err)
         {
            value = defaultValue;
         }
      }
      else if (defaultValue !== void 0)
      {
         try
         {
            const newValue = this.#getSerialize(key)(defaultValue);

            // If there is no existing storage value and defaultValue is defined the storage value needs to be set.
            this.#storageStores.storage.setItem(key, newValue);
         }
         catch (err) { /* */ }
      }

      return value;
   }

   /**
    * Returns the backing Svelte store for the given key; potentially sets a default value if the key
    * is not already set.
    *
    * @template T
    *
    * @param {string}   key - Key to lookup in storage API.
    *
    * @param {T}        [defaultValue] - A default value to return if key not present in session storage.
    *
    * @param {import('./').StorageStores} [storageStores] - Additional store creation options.
    *
    * @returns {import('svelte/store').Writable<T>} The Svelte store for this key.
    */
   getStore(key, defaultValue, storageStores)
   {
      return this.#getStore(key, defaultValue, storageStores);
   }

   /**
    * Sets the value for the given key in storage API.
    *
    * @param {string}   key - Key to lookup in storage API.
    *
    * @param {*}        value - A value to set for this key.
    */
   setItem(key, value)
   {
      const store = this.#getStore(key);
      store.set(value);
   }

   /**
    * Convenience method to swap a boolean value stored in storage API.
    *
    * @param {string}   key - Key to lookup in storage API.
    *
    * @param {boolean}  [defaultValue] - A default value to return if key not present in session storage.
    *
    * @returns {boolean} The boolean swap for the given key.
    */
   swapItemBoolean(key, defaultValue)
   {
      const store = this.#getStore(key, defaultValue);

      let currentValue = false;

      try
      {
         currentValue = !!this.#getDeserialize(key)(this.#storageStores.storage.getItem(key));
      }
      catch (err) { /**/ }

      const newValue = typeof currentValue === 'boolean' ? !currentValue : false;

      store.set(newValue);
      return newValue;
   }
}
