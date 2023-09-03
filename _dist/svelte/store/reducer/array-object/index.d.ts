
import * as svelte_store from 'svelte/store';
import { DynArrayReducer } from '@typhonjs-svelte/runtime-base/svelte/store/reducer';

/**
 * Provides a base implementation for store entries in {@link ArrayObjectStore}.
 *
 * In particular providing the required getting / accessor for the 'id' property.
 */
declare class ObjectEntryStore {
    /**
     * Invoked by ArrayObjectStore to provide custom duplication. Override this static method in your entry store.
     *
     * @param {object}   data - A copy of local data w/ new ID already set.
     *
     * @param {import('./ArrayObjectStore.js').ArrayObjectStore} arrayStore - The source ArrayObjectStore instance.
     */
    static duplicate(data: object, arrayStore: ArrayObjectStore): void;
    /**
     * @param {object}   data -
     */
    constructor(data?: object);
    /**
     * @returns {object} The object data tracked by this store.
     * @protected
     */
    protected get _data(): any;
    /**
     * @returns {string} The ID attribute in object data tracked by this store.
     */
    get id(): string;
    toJSON(): any;
    /**
     * @param {import('svelte/store').Subscriber<object>} handler - Callback function that is invoked on update /
     *        changes.
     *
     * @returns {import('svelte/store').Unsubscriber} Unsubscribe function.
     */
    subscribe(handler: svelte_store.Subscriber<object>): svelte_store.Unsubscriber;
    /**
     * @protected
     */
    protected _updateSubscribers(): void;
    #private;
}

/**
 * @template [T=import('./').BaseArrayObjectEntryStore]
 */
declare class ArrayObjectStore<T = BaseArrayObjectEntryStore> {
    /**
     * @returns {ObjectEntryStore} The default object entry store constructor.
     */
    static get EntryStore(): ObjectEntryStore;
    /**
     * @param {import('./').ArrayObjectStoreParams} params -
     */
    constructor({ StoreClass, defaultData, childDebounce, dataReducer, manualUpdate }?: ArrayObjectStoreParams);
    /**
     * @returns {T[]} The internal data array tracked allowing child classes direct access.
     * @protected
     */
    protected get _data(): T[];
    /**
     * @returns {DynArrayReducer<T>} The data reducer.
     */
    get dataReducer(): DynArrayReducer<T>;
    /**
     * @returns {number} The length of all data.
     */
    get length(): number;
    /**
     * Removes all child store entries.
     */
    clearEntries(): void;
    /**
     * Creates a new store from given data.
     *
     * @param {object}   entryData -
     *
     * @returns {T} The store
     */
    createEntry(entryData?: object): T;
    /**
     * Deletes a given entry store by ID from this world setting array store instance.
     *
     * @param {string}  id - ID of entry to delete.
     *
     * @returns {boolean} Delete operation successful.
     */
    deleteEntry(id: string): boolean;
    /**
     * Duplicates an entry store by the given ID.
     *
     * @param {string}   id - UUIDv4 string.
     *
     * @returns {*} Instance of StoreClass.
     */
    duplicateEntry(id: string): any;
    /**
     * Find an entry in the backing child store array.
     *
     * @param {function(T): T|void}  predicate - A predicate function
     *
     * @returns {T|void} Found entry in array or undefined.
     */
    findEntry(predicate: (arg0: T) => T | void): T | void;
    /**
     * Finds an entry store instance by 'id' / UUIDv4.
     *
     * @param {string}   id - A UUIDv4 string.
     *
     * @returns {T|void} Entry store instance.
     */
    getEntry(id: string): T | void;
    /**
     * Sets the children store data by 'id', adds new entry store instances, or removes entries that are no longer in the
     * update list.
     *
     * @param {T[]}   updateList -
     */
    set(updateList: T[]): void;
    toJSON(): T[];
    /**
     * @param {import('svelte/store').Subscriber<T[]>} handler - Callback function that is invoked on update / changes.
     *
     * @returns {import('svelte/store').Unsubscriber} Unsubscribe function.
     */
    subscribe(handler: svelte_store.Subscriber<T[]>): svelte_store.Unsubscriber;
    /**
     * Updates subscribers.
     *
     * @param {import('./').ArrayObjectUpdateData}  [update] -
     */
    updateSubscribers(update?: ArrayObjectUpdateData): void;
    /**
     * Provide an iterator for public access to entry stores.
     *
     * @yields {T | void}
     */
    [Symbol.iterator](): Generator<T, void, unknown>;
    #private;
}

/**
 * @template [T=import('./').BaseArrayObjectEntryStore]
 * @augments {ArrayObjectStore<T>}
 */
declare class CrudArrayObjectStore<T = BaseArrayObjectEntryStore> extends ArrayObjectStore<T> {
    /**
     * @param {object}                  [opts] - Optional parameters.
     *
     * @param {CrudDispatch}            [opts.crudDispatch] -
     *
     * @param {object}                  [opts.extraData] -
     *
     * @param {import('./').ArrayObjectStoreParams}  [opts.rest] - Rest of ArrayObjectStore parameters.
     */
    constructor({ crudDispatch, extraData, ...rest }?: {
        crudDispatch?: CrudDispatch;
        extraData?: object;
        rest?: ArrayObjectStoreParams;
    });
    #private;
}
type CrudArrayObjectStoreParams = ArrayObjectStoreParams & CrudArrayObjectStoreParamProps;
type CrudArrayObjectStoreParamProps = {
    /**
     * -
     */
    crudDispatch?: CrudDispatch;
    /**
     * -
     */
    extraData?: object;
};
/**
 * A function that accepts an object w/ 'action', 'moduleId', 'key' properties and optional 'id' / UUIDv4 string and
 * 'data' property.
 */
type CrudDispatch = (data: {
    action: string;
    id?: string;
    data?: object;
}) => boolean;

type ArrayObjectStoreParams = {
    /**
     * The entry store class that is instantiated.
     */
    StoreClass: BaseArrayObjectEntryStore;
    /**
     * An array of default data objects.
     */
    defaultData?: object[];
    /**
     * An integer between and including 0 - 1000; a debounce time in
     * milliseconds for child store subscriptions to invoke `ArrayObjectStore.updateSubscribers` notifying
     * subscribers to this array store.
     */
    childDebounce?: number;
    /**
     * When true a DynArrayReducer will be instantiated wrapping store
     * data and accessible from `ArrayObjectStore.dataReducer`.
     */
    dataReducer?: boolean;
    /**
     * When true `ArrayObjectStore.updateSubscribers` must be invoked
     * with a single boolean parameter for subscribers to be updated.
     */
    manualUpdate?: boolean;
};
type ArrayObjectUpdateData = boolean | object | undefined;
type BaseArrayObjectEntryStore = svelte_store.Writable<any> & {
    get id(): string;
};

export { ArrayObjectStore, ArrayObjectStoreParams, ArrayObjectUpdateData, BaseArrayObjectEntryStore, CrudArrayObjectStore, CrudArrayObjectStoreParamProps, CrudArrayObjectStoreParams, CrudDispatch, ObjectEntryStore };
