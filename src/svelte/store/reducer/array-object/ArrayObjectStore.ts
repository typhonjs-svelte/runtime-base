import { DynArrayReducer }       from '#runtime/svelte/store/reducer';

import {
   isMinimalWritableStore,
   subscribeIgnoreFirst }        from '#runtime/svelte/store/util';

import {
   Hashing,
   Timing }                      from '#runtime/util';

import {
   hasGetter,
   isObject,
   klona }                       from '#runtime/util/object';

import { ObjectEntryStore }      from './ObjectEntryStore';

import type {
   Subscriber,
   Unsubscriber }                from 'svelte/store';

import type {
   ArrayObjectStoreParams,
   BaseObjectEntryStore,
   ExtractDataType }             from './types';

/**
 * @typeParam S - Store type.
 */
export class ArrayObjectStore<S extends BaseObjectEntryStore<any>>
{
   /**
    */
   #data: S[] = [];

   /**
    */
   #dataMap: Map<string, { store: S, unsubscribe: Unsubscriber }> = new Map();

   /**
    */
   readonly #dataReducer: DynArrayReducer<S> | undefined;

   /**
    */
   readonly #manualUpdate: boolean;

   /**
    */
   readonly #StoreClass: {
      new (...args: any[]): S;
      duplicate?(data: any, arrayStore: ArrayObjectStore<any>): void
   };

   /**
    * Stores the subscribers.
    */
   #subscribers: Subscriber<S[]>[] = [];

   /**
    */
   readonly #updateSubscribersBound: (update: boolean | ExtractDataType<S> | undefined) => void;

   /**
    * @returns The default object entry store constructor that can facilitate the creation of the required
    *          {@link ArrayObjectStoreParams.StoreClass} and generic `T` type parameter.
    */
   static get EntryStore(): typeof ObjectEntryStore { return ObjectEntryStore; }

   /**
    * @param params -
    */
   constructor({ StoreClass, childDebounce = 250, dataReducer = false, manualUpdate = false }:
    ArrayObjectStoreParams<S>)
   {
      if (!Number.isInteger(childDebounce) || childDebounce < 0 || childDebounce > 1000)
      {
         throw new TypeError(`'childDebounce' must be an integer between and including 0 - 1000.`);
      }

      if (typeof manualUpdate !== 'boolean') { throw new TypeError(`'manualUpdate' is not a boolean.`); }

      if (!isMinimalWritableStore(StoreClass.prototype))
      {
         throw new TypeError(`'StoreClass' is not a minimal writable store constructor.`);
      }

      if (!hasGetter(StoreClass.prototype, 'id'))
      {
         throw new TypeError(`'StoreClass' does not have a getter accessor for 'id' property.`);
      }

      this.#manualUpdate = manualUpdate;

      this.#StoreClass = StoreClass;

      if (dataReducer) { this.#dataReducer = new DynArrayReducer({ data: this.#data }); }

      // Prepare a debounced callback that is used for all child store entry subscriptions.
      this.#updateSubscribersBound = childDebounce === 0 ? this.updateSubscribers.bind(this) :
       Timing.debounce((update: boolean | ExtractDataType<S> | undefined): void => this.updateSubscribers(update),
        childDebounce);
   }

   /**
    * Provide an iterator for public access to entry stores.
    *
    * @returns iterator
    */
   *[Symbol.iterator](): IterableIterator<S>
   {
      if (this.#data.length === 0) { return; }

      for (const entryStore of this.#data) { yield entryStore; }
   }

   /**
    * @returns The internal data array tracked allowing child classes direct access.
    */
   protected get _data(): S[] { return this.#data; }

   /**
    * @returns The data reducer.
    */
   get dataReducer(): DynArrayReducer<S>
   {
      if (!this.#dataReducer)
      {
         throw new Error(
          `'dataReducer' is not initialized; did you forget to specify 'dataReducer' as true in constructor options?`);
      }

      return this.#dataReducer;
   }

   /**
    * @returns The length of all data.
    */
   get length(): number { return this.#data.length; }

   /**
    * Removes all child store entries.
    */
   clearEntries(): void
   {
      for (const storeEntryData of this.#dataMap.values()) { storeEntryData.unsubscribe(); }

      this.#dataMap.clear();
      this.#data.length = 0;

      this.updateSubscribers();
   }

   /**
    * Creates a new store from given data.
    *
    * @param entryData - Entry data.
    *
    * @returns The store
    */
   createEntry(entryData: ExtractDataType<S>): S
   {
      if (!isObject(entryData)) { throw new TypeError(`'entryData' is not an object.`); }

      if (typeof entryData.id !== 'string') { entryData.id = Hashing.uuidv4(); }

      if (this.#data.findIndex((entry: S): boolean => entry.id === entryData.id) >= 0)
      {
         throw new Error(`'entryData.id' (${entryData.id}) already in this ArrayObjectStore instance.`);
      }

      // The required `id` is added to `entryData` if not defined.
      const store: S = this.#createStore(entryData);

      this.updateSubscribers();

      return store;
   }

   /**
    * Add a new store entry from the given data.
    *
    * @param entryData - Entry data.
    *
    * @returns New store entry instance.
    */
   #createStore(entryData: ExtractDataType<S>): S
   {
      const store = new this.#StoreClass(entryData, this);

      if (!Hashing.isUuidv4(store.id))
      {
         throw new Error(`'store.id' (${store.id}) is not a UUIDv4 compliant string.`);
      }

      const unsubscribe: Unsubscriber = subscribeIgnoreFirst(store, this.#updateSubscribersBound);

      this.#data.push(store);
      this.#dataMap.set(store.id, { store, unsubscribe });

      return store;
   }

   /**
    * Deletes a given entry store by ID from this world setting array store instance.
    *
    * @param id - ID of entry to delete.
    *
    * @returns Delete operation successful.
    */
   deleteEntry(id: string): boolean
   {
      const result: boolean = this.#deleteStore(id);

      if (result) { this.updateSubscribers(); }

      return result;
   }

   #deleteStore(id: string): boolean
   {
      if (typeof id !== 'string') { throw new TypeError(`'id' is not a string.`); }

      const storeEntryData: { store: S, unsubscribe: Unsubscriber } | undefined = this.#dataMap.get(id);
      if (storeEntryData)
      {
         storeEntryData.unsubscribe();

         this.#dataMap.delete(id);

         const index: number = this.#data.findIndex((entry: S): boolean => entry.id === id);
         if (index >= 0) { this.#data.splice(index, 1); }

         return true;
      }

      return false;
   }

   /**
    * Duplicates an entry store by the given ID.
    *
    * @param {string}   id - UUIDv4 string.
    *
    * @returns {*} Instance of StoreClass.
    */
   duplicateEntry(id: string): S | undefined
   {
      if (typeof id !== 'string') { throw new TypeError(`'id' is not a string.`); }

      const storeEntryData: { store: S, unsubscribe: Unsubscriber } | undefined = this.#dataMap.get(id);

      if (storeEntryData)
      {
         const data: ExtractDataType<S> = klona(storeEntryData.store.toJSON());
         data.id = Hashing.uuidv4();

         // Allow StoreClass to statically perform any specialized duplication.
         this.#StoreClass?.duplicate?.(data, this);

         return this.createEntry(data);
      }

      return void 0;
   }

   /**
    * Find an entry in the backing child store array.
    *
    * @param predicate - A predicate function.
    *
    * @returns Found entry in array or undefined.
    */
   findEntry(predicate: (value: S, index: number, obj: S[]) => unknown): S | undefined
   {
      return this.#data.find(predicate);
   }

   /**
    * Finds an entry store instance by 'id' / UUIDv4.
    *
    * @param id - A UUIDv4 string.
    *
    * @returns Entry store instance.
    */
   getEntry(id: string): S | undefined
   {
      const storeEntryData: { store: S, unsubscribe: Unsubscriber } | undefined = this.#dataMap.get(id);
      return storeEntryData ? storeEntryData.store : void 0;
   }

   /**
    * Sets the children store data by 'id', adds new entry store instances, or removes entries that are no longer in the
    * update list.
    *
    * @param updateList -
    */
   set(updateList: ExtractDataType<S>[]): void
   {
      if (!Array.isArray(updateList))
      {
         console.warn(`ArrayObjectStore.set warning: aborting set operation as 'updateList' is not an array.`);
         return;
      }

      // Create a set of all current entry IDs.
      const removeIDSet = new Set(this.#dataMap.keys());

      let rebuildIndex: boolean = false;

      for (let updateIndex: number = 0; updateIndex < updateList.length; updateIndex++)
      {
         const updateData: ExtractDataType<S> = updateList[updateIndex];

         const id: string = updateData.id;

         if (typeof id !== 'string') { throw new Error(`'updateData.id' is not a string.`); }

         const localIndex: number = this.#data.findIndex((entry: S): boolean => entry.id === id);

         if (localIndex >= 0)
         {
            const localEntry: S = this.#data[localIndex];

            // Update the entry data.
            localEntry.set(updateData);

            // Must move to correct position
            if (localIndex !== updateIndex)
            {
               // Remove from current location.
               this.#data.splice(localIndex, 1);

               if (updateIndex < this.#data.length)
               {
                  // Insert at new location.
                  this.#data.splice(updateIndex, 0, localEntry);
               }
               else
               {
                  // Local data length is less than update data index; rebuild index.
                  rebuildIndex = true;
               }
            }

            // Delete from removeIDSet as entry is still in local data.
            removeIDSet.delete(id);
         }
         else
         {
            this.#createStore(updateData);
         }
      }

      if (rebuildIndex)
      {
         // Must invoke unsubscribe for all child stores.
         for (const storeEntryData of this.#dataMap.values()) { storeEntryData.unsubscribe(); }

         this.#data.length = 0;
         this.#dataMap.clear();

         for (const updateData of updateList) { this.#createStore(updateData); }
      }
      else
      {
         // Remove entries that are no longer in data.
         for (const id of removeIDSet) { this.#deleteStore(id); }
      }

      this.updateSubscribers();
   }

   toJSON(): S[]
   {
      return this.#data;
   }

// -------------------------------------------------------------------------------------------------------------------

   /**
    * @param handler - Callback function that is invoked on update / changes.
    *
    * @returns Unsubscribe function.
    */
   subscribe(handler: Subscriber<S[]>): Unsubscriber
   {
      this.#subscribers.push(handler); // add handler to the array of subscribers

      handler(this.#data);                     // call handler with current value

      // Return unsubscribe function.
      return (): void =>
      {
         const index: number = this.#subscribers.findIndex((sub: Subscriber<S[]>): boolean => sub === handler);
         if (index >= 0) { this.#subscribers.splice(index, 1); }
      };
   }

   /**
    * Updates subscribers.
    *
    * @param [update] -
    */
   updateSubscribers(update: boolean | ExtractDataType<S> | undefined = void 0): void
   {
      const updateGate: boolean = typeof update === 'boolean' ? update : !this.#manualUpdate;

      if (updateGate)
      {
         for (let cntr: number = 0; cntr < this.#subscribers.length; cntr++) { this.#subscribers[cntr](this.#data); }
      }

      // This will update the filtered data and `dataReducer` store and forces an update to subscribers.
      if (this.#dataReducer) { this.#dataReducer.index.update(true); }
   }
}
