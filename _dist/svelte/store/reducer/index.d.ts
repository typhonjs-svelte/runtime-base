import * as _runtime_svelte_store_util from '@typhonjs-svelte/runtime-base/svelte/store/util';
import * as svelte_store from 'svelte/store';

/**
 * Defines the additional options for filters and sort function.
 */
type DynDataOptions<T> = {
  /**
   * Iterable list of filters.
   */
  filters?: Iterable<DynFilterFn<T> | DynDataFilter<T>>;
  /**
   * Compare function.
   */
  sort?: DynCompareFn<T> | DynDataSort<T>;
};
/**
 * The main options object for DynArrayReducer.
 */
type DynArrayData<T> = {
  /**
   * Initial data iterable list.
   */
  data?: Iterable<T>;
} & DynDataOptions<T>;
/**
 * The main options object for DynMapReducer.
 */
type DynMapData<K, T> = {
  /**
   * Optional initial backing Map.
   */
  data?: Map<K, T>;
} & DynDataOptions<T>;
/**
 * Defines the data object to configure a filter w/ additional configuration options.
 */
type DynDataFilter<T> = {
  /**
   * An optional ID associated with this filter. Can be used to remove the filter.
   */
  id?: any;
  /**
   * Filter function that takes a value argument and returns a truthy value to keep it.
   */
  filter: DynFilterFn<T>;
  /**
   * An optional number between 0 and 1 inclusive to position this filter against others.
   */
  weight?: number;
  /**
   * Optional subscribe function following the Svelte store / subscribe pattern.
   *
   * @param handler - Callback function that is invoked on update / changes.
   */
  subscribe?: (indexUpdate: DynIndexerUpdateFn) => () => void;
};
/**
 * Provides a compound type for the backing data structure stored in reducers.
 */
type DynDataHost<D> = (D | null)[];
/**
 * Updates associated dynamic reducer indexer.
 *
 * @param [force] - Force an update the index regardless of hash calculations.
 */
type DynIndexerUpdateFn = (force?: boolean) => void;
/**
 * Defines an object to configure sort functionality.
 */
type DynDataSort<T> = {
  /**
   * A callback function that compares two values.
   */
  compare: DynCompareFn<T>;
  /**
   * Optional subscribe function following the Svelte store / subscribe pattern.
   *
   * @param handler - Callback function that is invoked on update / changes.
   */
  subscribe?: (indexUpdate: DynIndexerUpdateFn) => () => void;
};
/**
 * A callback function that compares two values. Return > 0 to sort 'b' before 'a'; < 0 to sort 'a' before 'b'; or 0 to
 * keep original order of 'a' & 'b'.
 *
 * This function has an optional subscribe function that follows the Svelte store Subscriber pattern. If a subscribe
 * function is provided automatic updates to the reduced index is performed.
 */
type DynCompareFn<T> = {
  /**
   * @param a - Element 'a' of backing data to sort.
   *
   * @param b - Element 'b' of backing data to sort.
   */
  (a: T, b: T): number;
  /**
   * Optional subscribe function following the Svelte store / subscribe pattern.
   *
   * @param handler - Callback function that is invoked on update / changes. Receives `index update` function.
   */
  subscribe?: (indexUpdate: DynIndexerUpdateFn) => () => void;
};
/**
 * Filter function that takes an element argument and returns a truthy value to keep it.
 *
 * This function has an optional subscribe function that follows the Svelte store Subscriber pattern. If a subscribe
 * function is provided automatic updates to the reduced index is performed.
 */
type DynFilterFn<T> = {
  /**
   * @param element - Element of backing data structure to filter.
   *
   * @returns Does the element pass the filter test.
   */
  (element: T): boolean;
  /**
   * Optional subscribe function following the Svelte store / subscribe pattern.
   *
   * @param indexUpdate - Callback function that is invoked on update / changes. Receives `this` reference.
   */
  subscribe?: (indexUpdate: DynIndexerUpdateFn) => () => void;
};
/**
 * Defines object / options for creating a derived reducer.
 */
type DynDataDerivedCreate<T> = {
  /**
   * Name of derived reducer.
   */
  name?: string;
  /**
   * A DerivedReducer constructor function / class.
   */
  ctor?: DynDerivedReducerCtor<T>;
} & DynDataOptions<T>;
/**
 * Creates a compound type for all derived reducer 'create' option combinations.
 */
type DynOptionsDerivedCreate<T> = string | DynDerivedReducerCtor<T> | DynDataDerivedCreate<T>;
/**
 * Defines object / options for creating a dynamic array reducer.
 */
type DynDataArrayCreate<T> = {
  /**
   * Name of dynamic array reducer.
   */
  name?: string;
  /**
   * A DynMapReducer constructor function / class.
   */
  ctor?: DynArrayReducerCtor<T>;
} & DynDataOptions<T>;
type DynOptionsArrayCreate<T> = string | DynArrayReducerCtor<T> | DynDataArrayCreate<T>;
/**
 * Defines object / options for creating a dynamic map reducer.
 */
type DynDataMapCreate<K, T> = {
  /**
   * Name of dynamic map reducer.
   */
  name?: string;
  /**
   * A DynMapReducer constructor function / class.
   */
  ctor?: DynMapReducerCtor<K, T>;
} & DynDataOptions<T>;
type DynOptionsMapCreate<K, T> = string | DynMapReducerCtor<K, T> | DynDataMapCreate<K, T>;

/**
 * Provides a managed Map with non-destructive reducing / filtering / sorting capabilities with subscription /
 * Svelte store support.
 *
 * @template K, T
 */
declare class DynMapReducer<K, T> {
  #private;
  /**
   * Initializes DynMapReducer. Any iterable is supported for initial data. Take note that if `data` is an array it
   * will be used as the host array and not copied. All non-array iterables otherwise create a new array / copy.
   *
   * @param {Map<K, T> | DynMapData<K, T>} [data] - Data iterable to store if array or copy otherwise.
   */
  constructor(data?: Map<K, T> | DynMapData<K, T>);
  /**
   * Returns the internal data of this instance. Be careful!
   *
   * Note: When a map is set as data then that map is used as the internal data. If any changes are performed to the
   * data externally do invoke `update` via {@link DynMapReducer.index} with `true` to recalculate the  index and
   * notify all subscribers.
   *
   * @returns {Map<K, T> | null} The internal data.
   */
  get data(): Map<K, T> | null;
  /**
   * @returns {DynDerivedAPI<Map<K, T>, K, T>} Derived public API.
   */
  get derived(): DynDerivedAPI<Map<K, T>, K, T>;
  /**
   * @returns {DynAdapterFilters<T>} The filters adapter.
   */
  get filters(): DynAdapterFilters<T>;
  /**
   * @returns {DynIndexerAPI<K, T>} Returns the Indexer public API.
   */
  get index(): DynIndexerAPI<K, T>;
  /**
   * @returns {boolean} Returns whether this instance is destroyed.
   */
  get destroyed(): boolean;
  /**
   * Gets the main data / items length.
   *
   * @returns {number} Main data / items length.
   */
  get length(): number;
  /**
   * Gets current reversed state.
   *
   * @returns {boolean} Reversed state.
   */
  get reversed(): boolean;
  /**
   * @returns {DynAdapterSort<T>} The sort adapter.
   */
  get sort(): DynAdapterSort<T>;
  /**
   * Sets reversed state and notifies subscribers.
   *
   * @param {boolean} reversed - New reversed state.
   */
  set reversed(reversed: boolean);
  /**
   * Removes all derived reducers, subscriptions, and cleans up all resources.
   */
  destroy(): void;
  /**
   * Provides a callback for custom reducers to initialize any data / custom configuration. This allows
   * child classes to avoid implementing the constructor.
   *
   * @protected
   */
  initialize(): void;
  /**
   * Removes internal data and pushes new data. This does not destroy any initial array set to internal data unless
   * `replace` is set to true.
   *
   * @param {Map<K, T> | null}  data - New data to set to internal data.
   *
   * @param {boolean} [replace=false] - New data to set to internal data.
   */
  setData(data: Map<K, T> | null, replace?: boolean): void;
  /**
   * Add a subscriber to this DynMapReducer instance.
   *
   * @param {(value: DynMapReducer<K, T>) => void} handler - Callback function that is invoked on update / changes.
   *        Receives `this` reference.
   *
   * @returns {() => void} Unsubscribe function.
   */
  subscribe(handler: (value: DynMapReducer<K, T>) => void): () => void;
  /**
   * Provides an iterator for data stored in DynMapReducer.
   *
   * @returns {IterableIterator<T>}
   * @yields {T}
   */
  [Symbol.iterator](): IterableIterator<T>;
}

/**
 * Provides the base implementation derived reducer for Maps / DynMapReducer.
 *
 * Note: That you should never directly create an instance of a derived reducer, but instead use the
 * {@link DynMapReducerDerived.initialize} callback to set up any initial state in a custom derived reducer.
 *
 * @template K, T
 */
declare class DynMapReducerDerived<K, T> implements DynDerivedReducer<Map<K, T>, K, T> {
  #private;
  /**
   * @param {DynDataHost<Map<K, T>>}  map - Data host Map.
   *
   * @param {DynIndexerAPI<K, T>}    parentIndex - Parent indexer.
   *
   * @param {DynDataOptions<T>}       options - Any filters and sort functions to apply.
   */
  constructor(map: DynDataHost<Map<K, T>>, parentIndex: DynIndexerAPI<K, T>, options: DynDataOptions<T>);
  /**
   * Returns the internal data of this instance. Be careful!
   *
   * Note: The returned map is the same map set by the main reducer. If any changes are performed to the data
   * externally do invoke {@link DynIndexerAPI.update} with `true` to recalculate the index and notify all
   * subscribers.
   *
   * @returns The internal data.
   */
  get data(): Map<K, T> | null;
  /**
   * @returns Derived public API.
   */
  get derived(): DynDerivedAPI<Map<K, T>, K, T>;
  /**
   * @returns The filters adapter.
   */
  get filters(): DynAdapterFilters<T>;
  /**
   * Returns the Indexer public API.
   *
   * @returns Indexer API - is also iterable.
   */
  get index(): DynIndexerAPI<K, T>;
  /**
   * Returns whether this derived reducer is destroyed.
   */
  get destroyed(): boolean;
  /**
   * @returns Main data / items length or indexed length.
   */
  get length(): number;
  /**
   * @returns Gets current reversed state.
   */
  get reversed(): boolean;
  /**
   * @returns The sort adapter.
   */
  get sort(): DynAdapterSort<T>;
  /**
   * Sets reversed state and notifies subscribers.
   *
   * @param reversed - New reversed state.
   */
  set reversed(reversed: boolean);
  /**
   * Removes all derived reducers, subscriptions, and cleans up all resources.
   */
  destroy(): void;
  /**
   * Provides a callback for custom derived reducers to initialize any data / custom configuration. This allows
   * child classes to avoid implementing the constructor.
   *
   * @param [optionsRest] - Any additional custom options passed beyond {@link DynDataOptions}.
   *
   * @protected
   */
  initialize(optionsRest?: { [key: string]: any }): void;
  /**
   * Provides an iterator for data stored in DerivedMapReducer.
   *
   * @returns {IterableIterator<T>}
   * @yields {T}
   */
  [Symbol.iterator](): IterableIterator<T>;
  /**
   * Subscribe to this DerivedMapReducer.
   *
   * @param handler - Callback function that is invoked on update / changes. Receives `this` reference.
   *
   * @returns Unsubscribe function.
   */
  subscribe(handler: (value: DynMapReducerDerived<K, T>) => void): () => void;
}

/**
 * Defines the shape of a dynamic array constructor function.
 */
interface DynArrayReducerCtor<T> {
  new (data?: Iterable<T> | DynArrayData<T>): DynArrayReducer<T>;
}
/**
 * Defines the shape of a dynamic map constructor function.
 */
interface DynMapReducerCtor<K, T> {
  new (data?: Map<K, T> | DynMapData<K, T>): DynMapReducer<K, T>;
}
/**
 * Defines the shape of a derived reducer constructor function.
 */
interface DynDerivedReducerCtor<T> {
  new (
    hostData: DynDataHost<any>,
    parentIndex: DynIndexerAPI<any, T>,
    options: DynDataOptions<T>,
  ): DynDerivedReducer<any, any, T>;
}
/**
 * Defines the interface for a derived reducer.
 */
interface DynDerivedReducer<D, K, T> {
  /**
   * Returns the internal data of this instance. Be careful!
   *
   * Note: if an array is set as initial data then that array is used as the internal data. If any changes are
   * performed to the data externally do invoke `update` via {@link DynDerivedReducer.index} with `true` to
   * recalculate the index and notify all subscribers.
   *
   * @returns The internal data.
   */
  get data(): D | null;
  /**
   * @returns Derived public API.
   */
  get derived(): DynDerivedAPI<D, K, T>;
  /**
   * @returns The filters adapter.
   */
  get filters(): DynAdapterFilters<T>;
  /**
   * @returns Returns the Indexer public API.
   */
  get index(): DynIndexerAPI<K, T>;
  /**
   * Returns whether this derived reducer is destroyed.
   */
  get destroyed(): boolean;
  /**
   * @returns Main data / items length or indexed length.
   */
  get length(): number;
  /**
   * @returns Gets current reversed state.
   */
  get reversed(): boolean;
  /**
   * @returns The sort adapter.
   */
  get sort(): DynAdapterSort<T>;
  /**
   * Sets reversed state and notifies subscribers.
   *
   * @param reversed - New reversed state.
   */
  set reversed(reversed: boolean);
  /**
   * Removes all derived reducers, subscriptions, and cleans up all resources.
   */
  destroy(): void;
  /**
   * Subscribe to this IDerivedReducer.
   *
   * @param handler - Callback function that is invoked on update / changes. Receives derived reducer reference.
   *
   * @returns Unsubscribe function.
   */
  subscribe(handler: (value: DynDerivedReducer<D, K, T>) => void): () => void;
}

/**
 * Provides the storage and sequencing of managed filters. Each filter added may be a bespoke function or a
 * {@link DynDataFilter} object containing an `id`, `filter`, and `weight` attributes; `filter` is the only required
 * attribute.
 *
 * The `id` attribute can be anything that creates a unique ID for the filter; recommended strings or numbers. This
 * allows filters to be removed by ID easily.
 *
 * The `weight` attribute is a number between 0 and 1 inclusive that allows filters to be added in a
 * predictable order which is especially handy if they are manipulated at runtime. A lower weighted filter always runs
 * before a higher weighted filter. For speed and efficiency always set the heavier / more inclusive filter with a
 * lower weight; an example of this is a keyword / name that will filter out many entries making any further filtering
 * faster. If no weight is specified the default of '1' is assigned and it is appended to the end of the filters list.
 *
 * This class forms the public API which is accessible from the `.filters` getter in the main reducer implementation.
 * ```
 * const dynArray = new DynArrayReducer([...]);
 * dynArray.filters.add(...);
 * dynArray.filters.clear();
 * dynArray.filters.length;
 * dynArray.filters.remove(...);
 * dynArray.filters.removeBy(...);
 * dynArray.filters.removeById(...);
 * ```
 *
 * @template T
 */
interface DynAdapterFilters<T> {
  /**
   * @returns {number} Returns the length of the filter data.
   */
  get length(): number;
  /**
   * Provides an iterator for filters.
   *
   * @returns {IterableIterator<DynDataFilter<T>>}
   * @yields {DynDataFilter<T>}
   */
  [Symbol.iterator](): IterableIterator<DynDataFilter<T>> | void;
  /**
   * @param {(DynFilterFn<T>|DynDataFilter<T>)[]} filters - One or more filter functions / DynDataFilter to add.
   */
  add(...filters: (DynFilterFn<T> | DynDataFilter<T>)[]): void;
  /**
   * Clears and removes all filters.
   */
  clear(): void;
  /**
   * @param {(DynFilterFn<T>|DynDataFilter<T>)[]} filters - One or more filter functions / DynDataFilter to remove.
   */
  remove(...filters: (DynFilterFn<T> | DynDataFilter<T>)[]): void;
  /**
   * Remove filters by the provided callback. The callback takes 3 parameters: `id`, `filter`, and `weight`.
   * Any truthy value returned will remove that filter.
   *
   * @param {(id: any, filter: DynFilterFn<T>, weight: number) => boolean} callback - Callback function to evaluate
   *        each filter entry.
   */
  removeBy(callback: (id: any, filter: DynFilterFn<T>, weight: number) => boolean): void;
  /**
   * @param {any[]} ids - Removes filters by ID.
   */
  removeById(...ids: any[]): void;
}
/**
 * Provides the storage and sequencing of a managed sort function. The sort function set may be a bespoke function or a
 * {@link DynDataSort} object containing an `compare`, and `subscribe` attributes; `compare` is the only required
 * attribute.
 *
 * Note: You can set a compare function that also has a subscribe function attached as the `subscribe` attribute.
 * If a subscribe function is provided the sort function can notify any updates that may change sort order and this
 * triggers an index update.
 *
 * This class forms the public API which is accessible from the `.sort` getter in the main reducer implementation.
 * ```
 * const dynArray = new DynArrayReducer([...]);
 * dynArray.sort.clear();
 * dynArray.sort.set(...);
 * ```
 *
 * @template T
 */
interface DynAdapterSort<T> {
  /**
   * Clears & removes any assigned sort function and triggers an index update.
   */
  clear(): void;
  /**
   * @param {DynCompareFn<T>|DynDataSort<T>} sort - A callback function that compares two values. Return > 0 to sort b
   * before a; < 0 to sort a before b; or 0 to keep original order of a & b.
   *
   * Note: You can set a compare function that also has a subscribe function attached as the `subscribe` attribute.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort#parameters
   */
  set(sort: DynCompareFn<T> | DynDataSort<T>): void;
}
/**
 * Provides the public API for derived reducers. There are several ways to create a derived reducer from utilizing the
 * default implementation or passing in a constructor function / class for a custom derived reducer.
 *
 * This class forms the public API which is accessible from the `.derived` getter in the main reducer implementation.
 * ```
 * const dynArray = new DynArrayReducer([...]);
 * dynArray.derived.clear();
 * dynArray.derived.create(...);
 * dynArray.derived.delete(...);
 * dynArray.derived.destroy();
 * dynArray.derived.get(...);
 * ```
 *
 * @template D, K, T
 */
interface DynDerivedAPI<D, K, T> {
  /**
   * Removes all derived reducers and associated subscriptions.
   */
  clear(): void;
  /**
   * @param {DynOptionsDerivedCreate<T>} options - Options for creating a reducer.
   *
   * @returns {DynDerivedReducer<D, K, T>} Newly created derived reducer.
   */
  create(options: DynOptionsDerivedCreate<T>): DynDerivedReducer<D, K, T>;
  /**
   * Deletes and destroys a derived reducer.
   *
   * @param {string} name - Name of the derived reducer
   *
   * @returns {boolean} Whether the derived reducer was deleted.
   */
  delete(name: string): boolean;
  /**
   * Removes all derived reducers, associated subscriptions, and cleans up all resources.
   */
  destroy(): void;
  /**
   * Returns an existing derived reducer.
   *
   * @param {string}   name - Name of derived reducer.
   *
   * @returns {DynDerivedReducer<D, K, T>} Any associated derived reducer.
   */
  get(name: string): DynDerivedReducer<D, K, T>;
}
/**
 * Provides the public API for accessing the index API.
 *
 * This class forms the public API which is accessible from the `.index` getter in the main reducer implementation.
 * ```
 * const dynArray = new DynArrayReducer([...]);
 * dynArray.index.active;
 * dynArray.index.hash;
 * dynArray.index.length;
 * dynArray.index.update(...);
 * ```
 *
 * @template K, T
 */
interface DynIndexerAPI<K, T> {
  /**
   * @returns {boolean} Returns whether the index is active.
   */
  get active(): boolean;
  /**
   * @returns {number} Returns length of reduced index.
   */
  get length(): number;
  /**
   * Manually invoke an update of the index.
   *
   * @param {boolean}  [force] - Force update to any subscribers.
   */
  update(force?: boolean): void;
  /**
   * @returns {number | null} Current hash value of the index.
   */
  get hash(): number | null;
  /**
   * Provides an iterator over the index array.
   *
   * @returns {IterableIterator<K>} An iterator for the index array.
   * @yields {K}
   */
  [Symbol.iterator](): IterableIterator<K>;
}

/**
 * Provides a managed array with non-destructive reducing / filtering / sorting capabilities with subscription /
 * Svelte store support.
 *
 * @template T
 */
declare class DynArrayReducer<T> {
  #private;
  /**
   * Initializes DynArrayReducer. Any iterable is supported for initial data. Take note that if `data` is an array it
   * will be used as the host array and not copied. All non-array iterables otherwise create a new array / copy.
   *
   * @param [data] - Data iterable to store if array or copy otherwise.
   */
  constructor(data?: Iterable<T> | DynArrayData<T>);
  /**
   * Returns the internal data of this instance. Be careful!
   *
   * Note: if an array is set as initial data then that array is used as the internal data. If any changes are
   * performed to the data externally do invoke `update` via {@link DynArrayReducer.index} with `true` to recalculate
   * the index and notify all subscribers.
   *
   * @returns {T[]|null} The internal data.
   */
  get data(): T[] | null;
  /**
   * @returns {DynDerivedAPI<T[], number, T>} Derived public API.
   */
  get derived(): DynDerivedAPI<T[], number, T>;
  /**
   * @returns The filters adapter.
   */
  get filters(): DynAdapterFilters<T>;
  /**
   * @returns {DynIndexerAPI<number, T>} Returns the Indexer public API.
   */
  get index(): DynIndexerAPI<number, T>;
  /**
   * @returns {boolean} Returns whether this instance is destroyed.
   */
  get destroyed(): boolean;
  /**
   * Gets the main data / items length.
   *
   * @returns {number} Main data / items length.
   */
  get length(): number;
  /**
   * Gets current reversed state.
   *
   * @returns {boolean} Reversed state.
   */
  get reversed(): boolean;
  /**
   * @returns {DynAdapterSort<T>} The sort adapter.
   */
  get sort(): DynAdapterSort<T>;
  /**
   * Sets reversed state and notifies subscribers.
   *
   * @param {boolean}  reversed - New reversed state.
   */
  set reversed(reversed: boolean);
  /**
   * Removes all derived reducers, subscriptions, and cleans up all resources.
   */
  destroy(): void;
  /**
   * Provides a callback for custom reducers to initialize any data / custom configuration. This allows
   * child classes to avoid implementing the constructor.
   *
   * @protected
   */
  initialize(): void;
  /**
   * Removes internal data and pushes new data. This does not destroy any initial array set to internal data unless
   * `replace` is set to true.
   *
   * @param {T[] | Iterable<T> | null}   data - New data to set to internal data.
   *
   * @param {boolean} [replace=false] - New data to set to internal data.
   */
  setData(data: T[] | Iterable<T> | null, replace?: boolean): void;
  /**
   * Add a subscriber to this DynArrayReducer instance.
   *
   * @param {(value: DynArrayReducer<T>) => void} handler - Callback function that is invoked on update / changes.
   *        Receives `this` reference.
   *
   * @returns {() => void} Unsubscribe function.
   */
  subscribe(handler: (value: DynArrayReducer<T>) => void): () => void;
  /**
   * Provides an iterator for data stored in DynArrayReducer.
   *
   * @yields {T}
   * @returns {IterableIterator<T>} Iterator for data stored in DynArrayReducer.
   */
  [Symbol.iterator](): IterableIterator<T>;
}

/**
 * Provides the base implementation derived reducer for arrays / DynArrayReducer.
 *
 * Note: That you should never directly create an instance of a derived reducer, but instead use the
 * {@link DynArrayReducerDerived.initialize} callback to set up any initial state in a custom derived reducer.
 *
 * @template T
 */
declare class DynArrayReducerDerived<T> implements DynDerivedReducer<T[], number, T> {
  #private;
  /**
   * @param {DynDataHost<T[]>}           array - Data host array.
   *
   * @param {DynIndexerAPI<number, T>}  parentIndex - Parent indexer.
   *
   * @param {DynDataOptions<T>}          options - Any filters and sort functions to apply.
   */
  constructor(array: DynDataHost<T[]>, parentIndex: DynIndexerAPI<number, T>, options: DynDataOptions<T>);
  /**
   * Returns the internal data of this instance. Be careful!
   *
   * Note: if an array is set as initial data then that array is used as the internal data. If any changes are
   * performed to the data externally do invoke {@link DynIndexerAPI.update} with `true` to recalculate the index and
   * notify all subscribers.
   *
   * @returns The internal data.
   */
  get data(): T[] | null;
  /**
   * @returns Derived public API.
   */
  get derived(): DynDerivedAPI<T[], number, T>;
  /**
   * @returns The filters adapter.
   */
  get filters(): DynAdapterFilters<T>;
  /**
   * Returns the Indexer public API.
   *
   * @returns Indexer API - is also iterable.
   */
  get index(): DynIndexerAPI<number, T>;
  /**
   * Returns whether this derived reducer is destroyed.
   */
  get destroyed(): boolean;
  /**
   * @returns Main data / items length or indexed length.
   */
  get length(): number;
  /**
   * @returns Gets current reversed state.
   */
  get reversed(): boolean;
  /**
   * @returns The sort adapter.
   */
  get sort(): DynAdapterSort<T>;
  /**
   * Sets reversed state and notifies subscribers.
   *
   * @param reversed - New reversed state.
   */
  set reversed(reversed: boolean);
  /**
   * Removes all derived reducers, subscriptions, and cleans up all resources.
   */
  destroy(): void;
  /**
   * Provides a callback for custom derived reducers to initialize any data / custom configuration. This allows
   * child classes to avoid implementing the constructor.
   *
   * @param [optionsRest] - Any additional custom options passed beyond {@link DynDataOptions}.
   *
   * @protected
   */
  initialize(optionsRest?: { [key: string]: any }): void;
  /**
   * Provides an iterator for data stored in DerivedArrayReducer.
   *
   * @returns {IterableIterator<T>}
   * @yields {T}
   */
  [Symbol.iterator](): IterableIterator<T>;
  /**
   * Subscribe to this DerivedArrayReducer.
   *
   * @param handler - Callback function that is invoked on update / changes. Receives `this` reference.
   *
   * @returns Unsubscribe function.
   */
  subscribe(handler: (value: DynArrayReducerDerived<T>) => void): () => void;
}

/**
 * Provides helper functions to create dynamic store driven filters and sort functions for dynamic reducers. The
 * returned functions are also Svelte stores and can be added to a reducer as well as used as a store.
 */
declare class DynReducerHelper {
  /**
   * Returns the following filter functions:
   * - regexObjectQuery(accessors, options); suitable for object reducers matching one or more property keys /
   *   accessors against the store value as a regex. To access deeper entries into the object format the accessor
   *   string with `.` between entries to walk. Optional parameters include logging access warnings, case sensitivity,
   *   and passing in an existing store.
   *
   * @returns {{
   *    regexObjectQuery: (accessors: string|Iterable<string>, options?: {accessWarn?: boolean,
   *     caseSensitive?: boolean, store?: import('svelte/store').Writable<string>}) =>
   *      (((data: {}) => boolean) & import('#runtime/svelte/store/util').MinimalWritable<string>)
   * }} All available filters.
   */
  static get filters(): {
    regexObjectQuery: (
      accessors: string | Iterable<string>,
      options?: {
        accessWarn?: boolean;
        caseSensitive?: boolean;
        store?: svelte_store.Writable<string>;
      },
    ) => ((data: {}) => boolean) & _runtime_svelte_store_util.MinimalWritable<string>;
  };
}

export {
  type DynAdapterFilters,
  type DynAdapterSort,
  type DynArrayData,
  DynArrayReducer,
  type DynArrayReducerCtor,
  DynArrayReducerDerived,
  type DynCompareFn,
  type DynDataArrayCreate,
  type DynDataDerivedCreate,
  type DynDataFilter,
  type DynDataHost,
  type DynDataMapCreate,
  type DynDataOptions,
  type DynDataSort,
  type DynDerivedAPI,
  type DynDerivedReducer,
  type DynDerivedReducerCtor,
  type DynFilterFn,
  type DynIndexerAPI,
  type DynIndexerUpdateFn,
  type DynMapData,
  DynMapReducer,
  type DynMapReducerCtor,
  DynMapReducerDerived,
  type DynOptionsArrayCreate,
  type DynOptionsDerivedCreate,
  type DynOptionsMapCreate,
  DynReducerHelper,
};
