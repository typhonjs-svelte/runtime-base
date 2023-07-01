import { StartStopNotifier, Readable, Writable, Stores, StoresValues, Subscriber, Updater, Unsubscriber } from 'svelte/store';

/**
 * Generates derived, readable, writable helper functions wrapping the given Storage API provided with any additional
 * customization for data serialization. By default, JSON serialization is used.
 *
 * @param {object}   opts - Generator options.
 *
 * @param {Storage}  storage - The web storage source.
 *
 * @param {(value: any) => string}  [opts.serialize] - Replace with custom serialization; default: `JSON.stringify`.
 *
 * @param {(value: string) => any}  [opts.deserialize] - Replace with custom deserialization; default: `JSON.parse`.
 */
declare function storeGenerator({ storage, serialize, deserialize }: {
    storage: Storage;
    serialize?: (value: any) => string;
    deserialize?: (value: string) => any;
}): {
    derived: StorageDerived;
    readable: StorageReadable;
    writable: StorageWritable;
};
type AdvancedDeriver<S extends Stores, T> = (values: StoresValues<S>, set: Subscriber<T>, update: (fn: Updater<T>) => void) => Unsubscriber | void;
type Deriver<S extends Stores, T> = SimpleDeriver<S, T> | AdvancedDeriver<S, T>;
type SimpleDeriver<S extends Stores, T> = (values: StoresValues<S>) => T;
/**
 * @template T
 * Creates a `Readable` store that allows reading by subscription.
 *
 * @param {string}   key - storage key
 *
 * @param {T}        value -  initial value
 *
 * @param {StartStopNotifier<T>} start - Start and stop notifications for subscriptions.
 *
 * @returns {Readable<T>} A readable storage store.
 */
type StorageReadable = <T>(key: string, value: T, start: StartStopNotifier<T>) => Readable<T>;
/**
 * @template T
 * Create a `Writable` store that allows both updating and reading by subscription.
 *
 * @param {string}   key - Storage key.
 *
 * @param {T}        value - Default value.
 *
 * @param {StartStopNotifier<T>} [start] - Start and stop notifications for subscriptions.
 *
 * @returns {Writable<T>} A writable storage store.
 */
type StorageWritable = <T>(key: string, value: T, start?: StartStopNotifier<T>) => Writable<T>;
/**
 * @template S, T
 *
 * Derived value store by synchronizing one or more readable stores and applying an aggregation function over its
 * input values.
 *
 * @param {string}   key - Storage key.
 *
 * @param {S}        stores - Input stores.
 *
 * @param {Deriver<S, T>}  fn - Function callback that aggregates the values.
 *
 * @param {T}        [initial_value] When used asynchronously.
 *
 * @returns {Readable<T>} A derived storage store.
 */
type StorageDerived = <S extends Stores, T>(key: string, stores: S, fn: Deriver<S, T>, initial_value?: T) => Readable<T>;

/**
 * Provides all Storage API enabled `localStorage` helper functions. Data is serialized as JSON.
 */
declare const localStores: {
    derived: StorageDerived;
    readable: StorageReadable;
    writable: StorageWritable;
};

/**
 * Provides all Storage API enabled `sessionStorage` helper functions. Data is serialized as JSON.
 */
declare const sessionStores: {
    derived: StorageDerived;
    readable: StorageReadable;
    writable: StorageWritable;
};

export { StorageDerived, StorageReadable, StorageWritable, localStores, sessionStores, storeGenerator };
