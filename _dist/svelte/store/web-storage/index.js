import { writable, get } from 'svelte/store';

/**
 * Generates derived, readable, writable helper functions wrapping the given Storage API provided with any additional
 * customization for data serialization. By default, JSON serialization is used.
 *
 * @param {object}   opts - Generator options.
 *
 * @param {Storage}  storage - The web storage source.
 *
 * @param {(value: any, ...rest: any[]) => string}  [opts.serialize] - Replace with custom serialization;
 *        default: `JSON.stringify`.
 *
 * @param {(value: string, ...rest: any[]) => any}  [opts.deserialize] - Replace with custom deserialization;
 *        default: `JSON.parse`.
 *
 * @returns {StorageStores} A complete set of store helper functions and associated storage API instance and
 *          serialization strategy.
 */
function storeGenerator({ storage, serialize = JSON.stringify, deserialize = JSON.parse }) {
    function isSimpleDeriver(deriver) {
        return deriver.length < 2;
    }
    function storageReadable(key, value, start) {
        return {
            subscribe: storageWritable(key, value, start).subscribe
        };
    }
    function storageWritable(key, value, start) {
        function wrap_start(ogSet) {
            return start(function wrap_set(new_value) {
                if (storage) {
                    storage.setItem(key, serialize(new_value));
                }
                return ogSet(new_value);
            }, function wrap_update(fn) {
                set(fn(get(ogStore)));
            });
        }
        if (storage) {
            const storageValue = storage.getItem(key);
            try {
                if (storageValue) {
                    value = deserialize(storageValue);
                }
            }
            catch (err) { /**/ }
            storage.setItem(key, serialize(value));
        }
        const ogStore = writable(value, start ? wrap_start : void 0);
        function set(new_value) {
            if (storage) {
                storage.setItem(key, serialize(new_value));
            }
            ogStore.set(new_value);
        }
        function update(fn) {
            set(fn(get(ogStore)));
        }
        function subscribe(run, invalidate) {
            return ogStore.subscribe(run, invalidate);
        }
        return { set, update, subscribe };
    }
    function storageDerived(key, stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single ? [stores] : stores;
        if (storage && storage.getItem(key)) {
            try {
                initial_value = deserialize(storage.getItem(key));
            }
            catch (err) { /**/ }
        }
        return storageReadable(key, initial_value, (set, update) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup?.();
                const input = single ? values[0] : values;
                if (isSimpleDeriver(fn)) {
                    set(fn(input));
                }
                else {
                    const result = fn(input, set, update);
                    if (typeof result === 'function') {
                        cleanup = result;
                    }
                }
            };
            const unsubscribers = stores_array.map((store, i) => store.subscribe((value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => { pending |= (1 << i); }));
            inited = true;
            sync();
            return function stop() {
                // Equivalent to run_all from Svelte internals.
                unsubscribers.forEach((unsubscriber) => unsubscriber());
                cleanup?.();
            };
        });
    }
    return {
        readable: storageReadable,
        writable: storageWritable,
        derived: storageDerived,
        storage,
        serialize,
        deserialize
    };
}

/**
 * Provides all Storage API enabled `localStorage` store helper functions. Data is serialized as JSON.
 */
const localStores = storeGenerator({ storage: globalThis?.localStorage });
/**
 * Provides the Storage API enabled derived `localStorage` store helper function. Data is serialized as JSON.
 */
localStores.derived;
/**
 * Provides the Storage API enabled readable `localStorage` store helper function. Data is serialized as JSON.
 */
localStores.readable;
/**
 * Provides the Storage API enabled writable `localStorage` store helper function. Data is serialized as JSON.
 */
localStores.writable;

/**
 * Provides all Storage API enabled `sessionStorage` store helper functions. Data is serialized as JSON.
 */
const sessionStores = storeGenerator({ storage: globalThis?.sessionStorage });
/**
 * Provides the Storage API enabled derived `sessionStorage` store helper function. Data is serialized as JSON.
 */
sessionStores.derived;
/**
 * Provides the Storage API enabled readable `sessionStorage` store helper function. Data is serialized as JSON.
 */
sessionStores.readable;
/**
 * Provides the Storage API enabled writable `sessionStorage` store helper function. Data is serialized as JSON.
 */
sessionStores.writable;

/**
 * Provides the base Storage API store manager. It is recommended to use {@link TJSLocalStorage} &
 * {@link TJSSessionStorage} for standard browser local and session storage use cases. TJSWebStorage exists
 * to provide additional customization options for custom Storage API compatible storage instances and custom
 * serialization configuration.
 */
class TJSWebStorage
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
      const storeEntry = this.#stores.get(key);
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

/**
 * Provides a {@link TJSWebStorage} instance for standard browser local storage use cases.
 */
class TJSLocalStorage extends TJSWebStorage
{
   constructor()
   {
      super(localStores);
   }
}

/**
 * Provides a {@link TJSWebStorage} instance for standard browser session storage use cases.
 */
class TJSSessionStorage extends TJSWebStorage
{
   constructor()
   {
      super(sessionStores);
   }
}

export { TJSLocalStorage, TJSSessionStorage, TJSWebStorage, localStores, sessionStores, storeGenerator };
//# sourceMappingURL=index.js.map
