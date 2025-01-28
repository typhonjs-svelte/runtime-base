import { DynArrayReducer } from '@typhonjs-svelte/runtime-base/svelte/store/reducer';
import { Subscriber, Unsubscriber } from 'svelte/store';
import { MinimalWritable } from '@typhonjs-svelte/runtime-base/svelte/store/util';

/**
 * @typeParam S - Store type.
 */
interface ArrayObjectStoreParams<S extends BaseObjectEntryStore<any>> {
  /**
   * The entry store class that is instantiated.
   */
  StoreClass: new (...args: any[]) => S;
  /**
   * An array of default data objects.
   */
  defaultData?: ExtractDataType<S>[];
  /**
   * An integer between and including 0 - 1000; a debounce time in milliseconds for child store subscriptions to
   * invoke {@link ArrayObjectStore.updateSubscribers} notifying subscribers to this array store. Default value: `250`.
   */
  childDebounce?: number;
  /**
   * When true a {@link DynArrayReducer} will be instantiated wrapping store data and accessible from
   * {@link ArrayObjectStore.dataReducer}; default value: `false`.
   */
  dataReducer?: boolean;
  /**
   * When true {@link ArrayObjectStore.updateSubscribers} must be invoked with a single boolean parameter for
   * subscribers to be updated; default value: `false`.
   */
  manualUpdate?: boolean;
}
interface BaseArrayObject {
  /**
   * Optional UUIDv4 compatible ID string.
   */
  id?: string;
}
/**
 * @typeParam D - Store data type.
 */
interface BaseObjectEntryStore<D> extends MinimalWritable<D> {
  /**
   * @returns UUIDv4 compatible string.
   */
  get id(): string;
  /**
   * Convert or return data in JSON.
   *
   * @returns JSON data.
   */
  toJSON(): D;
}
/**
 * Utility type that extracts and infers generic data type of store.
 *
 * @typeParam S - Store type.
 */
type ExtractDataType<S> = S extends BaseObjectEntryStore<infer D> ? D : never;
/**
 * @typeParam S - Store type.
 */
interface CrudArrayObjectStoreParams<S extends BaseObjectEntryStore<any>> extends ArrayObjectStoreParams<S> {
  crudDispatch?: CrudDispatch<ExtractDataType<S>>;
  extraData?: object;
}
/**
 * A function that accepts an object w/ 'action', 'moduleId', 'key' properties and optional 'id' / UUIDv4 string and
 * 'data' property.
 *
 * @typeParam D - Store data type.
 */
type CrudDispatch<D> = (data: { action: string; id?: string; data?: D; [key: string]: any }) => boolean;

/**
 * Provides a base implementation for store entries in {@link ArrayObjectStore}.
 *
 * In particular providing the required getting / accessor for the 'id' property.
 */
declare abstract class ObjectEntryStore<T extends BaseArrayObject = BaseArrayObject>
  implements BaseObjectEntryStore<T>
{
  #private;
  /**
   * Invoked by ArrayObjectStore to provide custom duplication. Override this static method in your entry store.
   *
   * @param data - A copy of local data w/ new ID already set.
   *
   * @param arrayStore - The source ArrayObjectStore instance.
   */
  static duplicate(data: object, arrayStore: ArrayObjectStore<any>): void;
  /**
   * @param data -
   */
  constructor(data: T);
  /**
   * @returns The object data tracked by this store.
   */
  protected get _data(): T;
  /**
   * @returns The ID attribute in object data tracked by this store.
   */
  get id(): string;
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
  toJSON(): T;
  /**
   * @param handler - Callback function that is invoked on update / changes.
   *
   * @returns Unsubscribe function.
   */
  subscribe(handler: Subscriber<T>): Unsubscriber;
  /**
   * Update subscribers of this store. Useful for child implementations.
   */
  protected _updateSubscribers(): void;
}

/**
 * @typeParam S - Store type.
 */
declare class ArrayObjectStore<S extends BaseObjectEntryStore<any>> {
  #private;
  /**
   * @returns The default object entry store constructor that can facilitate the creation of the required
   *          {@link ArrayObjectStoreParams.StoreClass} and generic `T` type parameter.
   */
  static get EntryStore(): typeof ObjectEntryStore;
  /**
   * @param params -
   */
  constructor({ StoreClass, childDebounce, dataReducer, manualUpdate }: ArrayObjectStoreParams<S>);
  /**
   * Provide an iterator for public access to entry stores.
   *
   * @returns iterator
   */
  [Symbol.iterator](): IterableIterator<S>;
  /**
   * @returns The internal data array tracked allowing child classes direct access.
   */
  protected get _data(): S[];
  /**
   * @returns The data reducer.
   */
  get dataReducer(): DynArrayReducer<S>;
  /**
   * @returns The length of all data.
   */
  get length(): number;
  /**
   * Removes all child store entries.
   */
  clearEntries(): void;
  /**
   * Creates a new store from given data.
   *
   * @param entryData - Entry data.
   *
   * @returns The store
   */
  createEntry(entryData: ExtractDataType<S>): S;
  /**
   * Deletes a given entry store by ID from this world setting array store instance.
   *
   * @param id - ID of entry to delete.
   *
   * @returns Delete operation successful.
   */
  deleteEntry(id: string): boolean;
  /**
   * Duplicates an entry store by the given ID.
   *
   * @param {string}   id - UUIDv4 string.
   *
   * @returns {*} Instance of StoreClass.
   */
  duplicateEntry(id: string): S | undefined;
  /**
   * Find an entry in the backing child store array.
   *
   * @param predicate - A predicate function.
   *
   * @returns Found entry in array or undefined.
   */
  findEntry(predicate: (value: S, index: number, obj: S[]) => unknown): S | undefined;
  /**
   * Finds an entry store instance by 'id' / UUIDv4.
   *
   * @param id - A UUIDv4 string.
   *
   * @returns Entry store instance.
   */
  getEntry(id: string): S | undefined;
  /**
   * Sets the children store data by 'id', adds new entry store instances, or removes entries that are no longer in the
   * update list.
   *
   * @param updateList -
   */
  set(updateList: ExtractDataType<S>[]): void;
  toJSON(): S[];
  /**
   * @param handler - Callback function that is invoked on update / changes.
   *
   * @returns Unsubscribe function.
   */
  subscribe(handler: Subscriber<S[]>): Unsubscriber;
  /**
   * Updates subscribers.
   *
   * @param [update] -
   */
  updateSubscribers(update?: boolean | ExtractDataType<S> | undefined): void;
}

/**
 * @typeParam S - Store type.
 */
declare class CrudArrayObjectStore<S extends BaseObjectEntryStore<any>> extends ArrayObjectStore<S> {
  #private;
  /**
   * @param options - CrudArrayObjectStore options.
   *
   * @param [options.crudDispatch] -
   *
   * @param [options.extraData] -
   *
   * @param options.rest - Rest of ArrayObjectStore parameters.
   */
  constructor({ crudDispatch, extraData, ...rest }: CrudArrayObjectStoreParams<S> & ArrayObjectStoreParams<S>);
  /**
   * Removes all child store entries.
   */
  clearEntries(): void;
  /**
   * Creates a new store from given data.
   *
   * @param entryData -
   *
   * @returns Associated store with entry data.
   */
  createEntry(entryData: ExtractDataType<S>): S;
  /**
   * Deletes a given entry store by ID from this world setting array store instance.
   *
   * @param id - ID of entry to delete.
   *
   * @returns Delete operation successful.
   */
  deleteEntry(id: string): boolean;
  /**
   * Updates subscribers, but provides special handling when a `crudDispatch` function is attached. When `update` is
   * an object with a valid UUIDv4 string as the id property the `crudDispatch` function is invoked along with the
   * data payload.
   *
   * @param [update] - A boolean indicating that subscribers should be notified otherwise
   */
  updateSubscribers(update?: boolean | ExtractDataType<S> | undefined): void;
}

export {
  ArrayObjectStore,
  type ArrayObjectStoreParams,
  type BaseArrayObject,
  type BaseObjectEntryStore,
  CrudArrayObjectStore,
  type CrudArrayObjectStoreParams,
  type CrudDispatch,
  type ExtractDataType,
  ObjectEntryStore,
};
