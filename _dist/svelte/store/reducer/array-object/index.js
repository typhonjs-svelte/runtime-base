import { DynArrayReducer } from '@typhonjs-svelte/runtime-base/svelte/store/reducer';
import { isMinimalWritableStore, subscribeIgnoreFirst } from '@typhonjs-svelte/runtime-base/svelte/store/util';
import { Hashing, Timing } from '@typhonjs-svelte/runtime-base/util';
import { isObject, hasGetter, klona } from '@typhonjs-svelte/runtime-base/util/object';

/**
 * Provides a base implementation for store entries in {@link ArrayObjectStore}.
 *
 * In particular providing the required getting / accessor for the 'id' property.
 */
class ObjectEntryStore {
    /**
     */
    #data;
    /**
     * Stores the subscribers.
     */
    #subscribers = [];
    /**
     * Invoked by ArrayObjectStore to provide custom duplication. Override this static method in your entry store.
     *
     * @param data - A copy of local data w/ new ID already set.
     *
     * @param arrayStore - The source ArrayObjectStore instance.
     */
    static duplicate(data, arrayStore) { } // eslint-disable-line no-unused-vars
    /**
     * @param data -
     */
    constructor(data) {
        if (!isObject(data)) {
            throw new TypeError(`'data' is not an object.`);
        }
        this.#data = data;
        // If `id` is missing then add it.
        if (typeof this.#data.id !== 'string') {
            this.#data.id = Hashing.uuidv4();
        }
        if (!Hashing.isUuidv4(this.#data.id)) {
            throw new Error(`'data.id' (${this.#data.id}) is not a valid UUIDv4 string.`);
        }
    }
    /**
     * @returns The object data tracked by this store.
     */
    get _data() { return this.#data; }
    /**
     * @returns The ID attribute in object data tracked by this store.
     */
    get id() { return this.#data.id; }
    /**
     * @returns A JSON data object for the backing data. The default implementation directly returns the backing private
     *          data object. You may override this method to clone the data via {@link ObjectEntryStore._data}.
     */
    toJSON() {
        return this.#data;
    }
    /**
     * @param handler - Callback function that is invoked on update / changes.
     *
     * @returns Unsubscribe function.
     */
    subscribe(handler) {
        this.#subscribers.push(handler); // add handler to the array of subscribers
        handler(this.#data); // call handler with current value
        // Return unsubscribe function.
        return () => {
            const index = this.#subscribers.findIndex((sub) => sub === handler);
            if (index >= 0) {
                this.#subscribers.splice(index, 1);
            }
        };
    }
    /**
     * Update subscribers of this store. Useful for child implementations.
     */
    _updateSubscribers() {
        for (let cntr = 0; cntr < this.#subscribers.length; cntr++) {
            this.#subscribers[cntr](this.#data);
        }
    }
}

/**
 * @typeParam S - Store type.
 */
class ArrayObjectStore {
    /**
     */
    #data = [];
    /**
     */
    #dataMap = new Map();
    /**
     */
    #dataReducer;
    /**
     */
    #manualUpdate;
    /**
     */
    #StoreClass;
    /**
     * Stores the subscribers.
     */
    #subscribers = [];
    /**
     */
    #updateSubscribersBound;
    /**
     * @returns The default object entry store constructor that can facilitate the creation of the required
     *          {@link ArrayObjectStore.Options.Config.StoreClass} and generic `T` type parameter.
     */
    static get EntryStore() { return ObjectEntryStore; }
    /**
     * @param options - ArrayObjectStore options.
     */
    constructor({ StoreClass, childDebounce = 250, dataReducer = false, manualUpdate = false }) {
        if (!Number.isInteger(childDebounce) || childDebounce < 0 || childDebounce > 1000) {
            throw new TypeError(`'childDebounce' must be an integer between and including 0 - 1000.`);
        }
        if (typeof manualUpdate !== 'boolean') {
            throw new TypeError(`'manualUpdate' is not a boolean.`);
        }
        if (!isMinimalWritableStore(StoreClass.prototype)) {
            throw new TypeError(`'StoreClass' is not a minimal writable store constructor.`);
        }
        if (!hasGetter(StoreClass.prototype, 'id')) {
            throw new TypeError(`'StoreClass' does not have a getter accessor for 'id' property.`);
        }
        this.#manualUpdate = manualUpdate;
        this.#StoreClass = StoreClass;
        if (dataReducer) {
            this.#dataReducer = new DynArrayReducer({ data: this.#data });
        }
        // Prepare a debounced callback that is used for all child store entry subscriptions.
        this.#updateSubscribersBound = childDebounce === 0 ? this.updateSubscribers.bind(this) :
            Timing.debounce((update) => this.updateSubscribers(update), childDebounce);
    }
    /**
     * Provide an iterator for public access to entry stores.
     *
     * @returns iterator
     */
    *[Symbol.iterator]() {
        if (this.#data.length === 0) {
            return;
        }
        for (const entryStore of this.#data) {
            yield entryStore;
        }
    }
    /**
     * @returns The internal data array tracked allowing child classes direct access.
     */
    get _data() { return this.#data; }
    /**
     * @returns The data reducer.
     */
    get dataReducer() {
        if (!this.#dataReducer) {
            throw new Error(`'dataReducer' is not initialized; did you forget to specify 'dataReducer' as true in constructor options?`);
        }
        return this.#dataReducer;
    }
    /**
     * @returns The length of all data.
     */
    get length() { return this.#data.length; }
    /**
     * Removes all child store entries.
     */
    clearEntries() {
        for (const storeEntryData of this.#dataMap.values()) {
            storeEntryData.unsubscribe();
        }
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
    createEntry(entryData) {
        if (!isObject(entryData)) {
            throw new TypeError(`'entryData' is not an object.`);
        }
        if (!Hashing.isUuidv4(entryData.id)) {
            entryData.id = Hashing.uuidv4();
        }
        if (this.#data.findIndex((entry) => entry.id === entryData.id) >= 0) {
            throw new Error(`'entryData.id' (${entryData.id}) already in this ArrayObjectStore instance.`);
        }
        // The required `id` is added to `entryData` if not defined.
        const store = this.#createStore(entryData);
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
    #createStore(entryData) {
        const store = new this.#StoreClass(entryData, this);
        if (!Hashing.isUuidv4(store.id)) {
            throw new Error(`'store.id' (${store.id}) is not a UUIDv4 compliant string.`);
        }
        const unsubscribe = subscribeIgnoreFirst(store, this.#updateSubscribersBound);
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
    deleteEntry(id) {
        const result = this.#deleteStore(id);
        if (result) {
            this.updateSubscribers();
        }
        return result;
    }
    #deleteStore(id) {
        if (typeof id !== 'string') {
            throw new TypeError(`'id' is not a string.`);
        }
        const storeEntryData = this.#dataMap.get(id);
        if (storeEntryData) {
            storeEntryData.unsubscribe();
            this.#dataMap.delete(id);
            const index = this.#data.findIndex((entry) => entry.id === id);
            if (index >= 0) {
                this.#data.splice(index, 1);
            }
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
    duplicateEntry(id) {
        if (typeof id !== 'string') {
            throw new TypeError(`'id' is not a string.`);
        }
        const storeEntryData = this.#dataMap.get(id);
        if (storeEntryData) {
            const data = klona(storeEntryData.store.toJSON());
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
    findEntry(predicate) {
        return this.#data.find(predicate);
    }
    /**
     * Finds an entry store instance by 'id' / UUIDv4.
     *
     * @param id - A UUIDv4 string.
     *
     * @returns Entry store instance.
     */
    getEntry(id) {
        const storeEntryData = this.#dataMap.get(id);
        return storeEntryData ? storeEntryData.store : void 0;
    }
    /**
     * Sets the children store data by 'id', adds new entry store instances, or removes entries that are no longer in the
     * update list.
     *
     * @param updateList -
     */
    set(updateList) {
        if (!Array.isArray(updateList)) {
            console.warn(`ArrayObjectStore.set warning: aborting set operation as 'updateList' is not an array.`);
            return;
        }
        // Create a set of all current entry IDs.
        const removeIDSet = new Set(this.#dataMap.keys());
        let rebuildIndex = false;
        for (let updateIndex = 0; updateIndex < updateList.length; updateIndex++) {
            const updateData = updateList[updateIndex];
            const id = updateData.id;
            if (typeof id !== 'string') {
                throw new Error(`'updateData.id' is not a string.`);
            }
            const localIndex = this.#data.findIndex((entry) => entry.id === id);
            if (localIndex >= 0) {
                const localEntry = this.#data[localIndex];
                // Update the entry data.
                localEntry.set(updateData);
                // Must move to correct position
                if (localIndex !== updateIndex) {
                    // Remove from current location.
                    this.#data.splice(localIndex, 1);
                    if (updateIndex < this.#data.length) {
                        // Insert at new location.
                        this.#data.splice(updateIndex, 0, localEntry);
                    }
                    else {
                        // Local data length is less than update data index; rebuild index.
                        rebuildIndex = true;
                    }
                }
                // Delete from removeIDSet as entry is still in local data.
                removeIDSet.delete(id);
            }
            else {
                this.#createStore(updateData);
            }
        }
        if (rebuildIndex) {
            // Must invoke unsubscribe for all child stores.
            for (const storeEntryData of this.#dataMap.values()) {
                storeEntryData.unsubscribe();
            }
            this.#data.length = 0;
            this.#dataMap.clear();
            for (const updateData of updateList) {
                this.#createStore(updateData);
            }
        }
        else {
            // Remove entries that are no longer in data.
            for (const id of removeIDSet) {
                this.#deleteStore(id);
            }
        }
        this.updateSubscribers();
    }
    toJSON() {
        return this.#data;
    }
    // -------------------------------------------------------------------------------------------------------------------
    /**
     * @param handler - Callback function that is invoked on update / changes.
     *
     * @returns Unsubscribe function.
     */
    subscribe(handler) {
        this.#subscribers.push(handler); // add handler to the array of subscribers
        handler(this.#data); // call handler with current value
        // Return unsubscribe function.
        return () => {
            const index = this.#subscribers.findIndex((sub) => sub === handler);
            if (index >= 0) {
                this.#subscribers.splice(index, 1);
            }
        };
    }
    /**
     * Updates subscribers.
     *
     * @param [update] -
     */
    updateSubscribers(update = void 0) {
        const updateGate = typeof update === 'boolean' ? update : !this.#manualUpdate;
        if (updateGate) {
            for (let cntr = 0; cntr < this.#subscribers.length; cntr++) {
                this.#subscribers[cntr](this.#data);
            }
        }
        // This will update the filtered data and `dataReducer` store and forces an update to subscribers.
        if (this.#dataReducer) {
            this.#dataReducer.index.update(true);
        }
    }
}

/**
 * @typeParam S - Store type.
 */
class CrudArrayObjectStore extends ArrayObjectStore {
    /**
     */
    #crudDispatch;
    /**
     */
    #extraData;
    /**
     * @param options - CrudArrayObjectStore options.
     */
    constructor({ crudDispatch, extraData, ...rest }) {
        // 'manualUpdate' is set to true if 'crudUpdate' is defined, but can be overridden by `...rest`.
        super({
            manualUpdate: typeof crudDispatch === 'function',
            ...rest,
        });
        if (crudDispatch !== void 0 && typeof crudDispatch !== 'function') {
            throw new TypeError(`'crudDispatch' is not a function.`);
        }
        if (extraData !== void 0 && !isObject(extraData)) {
            throw new TypeError(`'extraData' is not an object.`);
        }
        this.#crudDispatch = crudDispatch;
        this.#extraData = extraData ?? {};
    }
    /**
     * Removes all child store entries.
     */
    clearEntries() {
        super.clearEntries();
        if (this.#crudDispatch) {
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
    createEntry(entryData) {
        const store = super.createEntry(entryData);
        if (store && this.#crudDispatch) {
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
    deleteEntry(id) {
        const result = super.deleteEntry(id);
        if (result && this.#crudDispatch) {
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
    updateSubscribers(update) {
        if (this.#crudDispatch && isObject(update) && Hashing.isUuidv4(update.id)) {
            const result = this.#crudDispatch({
                action: 'update',
                ...this.#extraData,
                id: update.id,
                data: update // TODO: Consider using klona to clone data.
            });
            // If the crudDispatch function returns a boolean then invoke 'ArrayObjectStore.updateSubscribers' with it.
            super.updateSubscribers(typeof result === 'boolean' ? result : update);
        }
        else {
            super.updateSubscribers(update);
        }
    }
}

export { ArrayObjectStore, CrudArrayObjectStore, ObjectEntryStore };
//# sourceMappingURL=index.js.map
