import { DynArrayReducer } from '@typhonjs-svelte/runtime-base/svelte/store/reducer';
import { Subscriber, Unsubscriber } from 'svelte/store';
import { MinimalWritable } from '@typhonjs-svelte/runtime-base/svelte/store/util';

/**
 * Provides a base implementation for store entries in {@link ArrayObjectStore}.
 *
 * In particular providing the required getting / accessor for the 'id' property.
 */
declare abstract class ObjectEntryStore<
  T extends ArrayObjectStore.Data.BaseArrayObject = ArrayObjectStore.Data.BaseArrayObject,
> implements ArrayObjectStore.Data.BaseObjectEntryStore<T>
{
  #private;
  /**
   * Invoked by ArrayObjectStore to provide custom duplication. Override this static method in your entry store.
   *
   * @param data - A copy of local data w/ new ID already set.
   *
   * @param arrayStore - The source ArrayObjectStore instance.
   */
  static duplicate<S extends ArrayObjectStore<any>>(data: object, arrayStore: S): void;
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
declare class ArrayObjectStore<S extends ArrayObjectStore.Data.BaseObjectEntryStore<any>> {
  #private;
  /**
   * @returns The default object entry store constructor that can facilitate the creation of the required
   *          {@link ArrayObjectStore.Options.Config.StoreClass} and generic `T` type parameter.
   */
  static get EntryStore(): typeof ObjectEntryStore;
  /**
   * @param options - ArrayObjectStore options.
   */
  constructor({ StoreClass, childDebounce, dataReducer, manualUpdate }: ArrayObjectStore.Options.Config<S>);
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
  createEntry(entryData: ArrayObjectStore.Util.ExtractDataType<S>): S;
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
  set(updateList: ArrayObjectStore.Util.ExtractDataType<S>[]): void;
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
  updateSubscribers(update?: boolean | ArrayObjectStore.Util.ExtractDataType<S> | undefined): void;
}
declare namespace ArrayObjectStore {
  namespace Data {
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
  }
  namespace Options {
    /**
     * @typeParam S - Store type.
     */
    interface Config<S extends Data.BaseObjectEntryStore<any>> {
      /**
       * The entry store class that is instantiated.
       */
      StoreClass: new (...args: any[]) => S;
      /**
       * An array of default data objects.
       */
      defaultData?: Util.ExtractDataType<S>[];
      /**
       * An integer between and including 0 - 1000; a debounce time in milliseconds for child store subscriptions to
       * invoke {@link ArrayObjectStore.updateSubscribers} notifying subscribers to this array store. Default
       * value: `250`.
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
  }
  namespace Util {
    /**
     * Utility type that extracts and infers generic data type of store.
     *
     * @typeParam S - Store type.
     */
    type ExtractDataType<S> = S extends Data.BaseObjectEntryStore<infer D> ? D : never;
  }
}

/**
 * @typeParam S - Store type.
 */
declare class CrudArrayObjectStore<
  S extends CrudArrayObjectStore.Data.BaseObjectEntryStore<any>,
> extends ArrayObjectStore<S> {
  #private;
  /**
   * @param options - CrudArrayObjectStore options.
   */
  constructor({ crudDispatch, extraData, ...rest }: CrudArrayObjectStore.Options.Config<S>);
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
  createEntry(entryData: CrudArrayObjectStore.Util.ExtractDataType<S>): S;
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
  updateSubscribers(update?: boolean | CrudArrayObjectStore.Util.ExtractDataType<S> | undefined): void;
}
declare namespace CrudArrayObjectStore {
  export import Data = ArrayObjectStore.Data;
  export import Util = ArrayObjectStore.Util;
  namespace Options {
    /**
     * @typeParam S - Store type.
     */
    interface Config<S extends Data.BaseObjectEntryStore<any>> extends ArrayObjectStore.Options.Config<S> {
      /**
       * Optional dispatch function to receive C(R)UD updates on create, update, delete actions.
       */
      crudDispatch?: CrudDispatch<Util.ExtractDataType<S>>;
      /**
       * Optional additional data that is dispatched with `CrudDispatch` callbacks.
       */
      extraData?: {
        [key: string]: any;
      };
    }
    /**
     * A function that accepts an object w/ 'action', 'moduleId', 'key' properties and optional 'id' / UUIDv4 string
     * and 'data' property.
     *
     * @typeParam D - Store data type.
     */
    type CrudDispatch<D> = (data: { action: string; id?: string; data?: D; [key: string]: any }) => boolean;
  }
}

export { ArrayObjectStore, CrudArrayObjectStore, ObjectEntryStore };
