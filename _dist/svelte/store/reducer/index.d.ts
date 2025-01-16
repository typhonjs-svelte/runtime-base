import { MinimalWritable, MinimalWritableFn } from '@typhonjs-svelte/runtime-base/svelte/store/util';

/**
 * Provides a managed {@link Map} with non-destructive reducing / filtering / sorting capabilities with subscription /
 * Svelte store support allowing for a {@link Map} to be treated like an iterable list.
 *
 * _Note:_
 * - The default type `unknown` ensures stricter type checking, preventing unintended operations on the data.
 * - If the type of data is known, explicitly specify the generic type to improve clarity and maintainability:
 *
 * @example
 * ```ts
 * const mapReducer = new DynMapReducer<number, string>(
 *     new Map([
 *         [1, 'banana'],
 *         [2, 'apple'],
 *         [3, 'cherry'],
 *     ])
 * );
 *
 * console.log([...mapReducer]); // Output: ['banana', 'apple', 'cherry']
 *
 * // Sort values alphabetically.
 * mapReducer.sort.set((a, b) => a.localeCompare(b));
 *
 * console.log([...mapReducer]); // Output: ['apple', 'banana', 'cherry']
 * ```
 *
 * @typeParam K `unknown` - Key type. Defaults to `unknown` to enforce type safety when no type is specified.
 *
 * @typeParam T `unknown` - Type of data. Defaults to `unknown` to enforce type safety when no type is specified.
 */
declare class DynMapReducer<K = unknown, T = unknown> {
  #private;
  /**
   * Initializes DynMapReducer. Any iterable is supported for initial data. Take note that if `data` is an array it
   * will be used as the host array and not copied. All non-array iterables otherwise create a new array / copy.
   *
   * @param [data] - Data iterable to store if array or copy otherwise.
   *
   * @typeParam K `unknown` - Key type.
   *
   * @typeParam T `unknown` - Type of data.
   */
  constructor(data?: Map<K, T> | DynReducer.Options.MapReducer<K, T>);
  /**
   * Returns the internal data of this instance. Be careful!
   *
   * Note: When a map is set as data then that map is used as the internal data. If any changes are performed to the
   * data externally do invoke `update` via {@link DynMapReducer.index} with `true` to recalculate the  index and
   * notify all subscribers.
   *
   * @returns The internal data.
   */
  get data(): Map<K, T> | null;
  /**
   * @returns Derived public API.
   */
  get derived(): DynReducer.API.DerivedMap<K, T>;
  /**
   * @returns The filters adapter.
   */
  get filters(): DynReducer.API.Filters<T>;
  /**
   * @returns Returns the Indexer public API; is also iterable.
   */
  get index(): DynReducer.API.Index<K>;
  /**
   * @returns Returns whether this instance is destroyed.
   */
  get destroyed(): boolean;
  /**
   * @returns Returns the main data items or indexed items length.
   */
  get length(): number;
  /**
   * @returns Returns current reversed state.
   */
  get reversed(): boolean;
  /**
   * @returns The sort adapter.
   */
  get sort(): DynReducer.API.Sort<T>;
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
   * Provides a callback for custom reducers to initialize any data / custom configuration. Depending on the consumer
   * of `dynamic-reducer` this may be utilized allowing child classes to avoid implementing the constructor.
   *
   * @param [optionsRest] - Any additional custom options passed beyond {@link DynReducer.Options.Common}.
   *
   * @protected
   */
  protected initialize(optionsRest?: { [key: string]: any }): void;
  /**
   * Removes internal data and pushes new data. This does not destroy any initial array set to internal data unless
   * `replace` is set to true.
   *
   * @param data - New data to set to internal data.
   *
   * @param [replace=false] - New data to set to internal data.
   */
  setData(data: Map<K, T> | null, replace?: boolean): void;
  /**
   * Add a subscriber to this DynMapReducer instance.
   *
   * @param handler - Callback function that is invoked on update / changes. Receives `this` reference.
   *
   * @returns Unsubscribe function.
   */
  subscribe(handler: (value: this) => void): () => void;
  /**
   * Provides an iterator for data stored in DynMapReducer.
   *
   * @returns Iterator for data stored in DynMapReducer.
   */
  [Symbol.iterator](): IterableIterator<T>;
}

declare namespace Internal {
  namespace Ctor {
    /**
     * Defines the shape of a generic derived reducer constructor function.
     */
    interface DerivedReducer<K, T> {
      new (
        hostData: Data.Host<any>,
        parentIndex: DynReducer.API.Index<any> | null,
        options: DynReducer.Options.Common<T>,
      ): DynReducer.DerivedList<T> | DynReducer.DerivedMap<K, T>;
    }
  }
  namespace Data {
    /**
     * Provides a compound type for the backing data structure stored in reducers.
     */
    type Host<D> = (D | null)[];
    /**
     * Defines the data object storing index data in AdapterIndexer.
     */
    type Index<K> = {
      /**
       * The index array.
       */
      index: K[] | null;
      /**
       * Hashcode for current index content.
       */
      hash: number | null;
      /**
       * Is iteration reversed?
       */
      reversed: boolean;
      /**
       * Any associated parent index data.
       */
      parent?: DynReducer.API.Index<K> | null;
    };
  }
  namespace Options {
    /**
     * Provides a compound type accepting either derived reducer options types.
     */
    type DerivedCreate<K, T> = DynReducer.Options.DerivedListCreate<T> | DynReducer.Options.DerivedMapCreate<K, T>;
  }
}

/**
 * Provides the base implementation derived reducer for Maps / DynMapReducer.
 *
 * Note: That you should never directly create an instance of a derived reducer, but instead use the
 * {@link DynMapReducerDerived.initialize} function to set up any initial state in a custom derived reducer.
 *
 * @typeParam K `unknown` - Key type. Defaults to `unknown` to enforce type safety when no type is specified.
 *
 * @typeParam T `unknown` - Type of data. Defaults to `unknown` to enforce type safety when no type is specified.
 */
declare class DynMapReducerDerived<K = unknown, T = unknown> implements DynReducer.DerivedMap<K, T> {
  #private;
  /**
   * @param map - Data host Map.
   *
   * @param parentIndex - Parent indexer.
   *
   * @param options - Any filters and sort functions to apply.
   *
   * @typeParam K `unknown` - Key type.
   *
   * @typeParam T `unknown` - Type of data.
   *
   * @private
   */
  constructor(
    map: Internal.Data.Host<Map<K, T>>,
    parentIndex: DynReducer.API.Index<K>,
    options: DynReducer.Options.Common<T>,
  );
  /**
   * @returns Derived public API.
   */
  get derived(): DynReducer.API.DerivedMap<K, T>;
  /**
   * @returns The filters adapter.
   */
  get filters(): DynReducer.API.Filters<T>;
  /**
   * @returns Returns the Indexer public API; is also iterable.
   */
  get index(): DynReducer.API.Index<K>;
  /**
   * @returns Returns whether this derived reducer is destroyed.
   */
  get destroyed(): boolean;
  /**
   * @returns Returns the main data items or indexed items length.
   */
  get length(): number;
  /**
   * @returns Returns current reversed state.
   */
  get reversed(): boolean;
  /**
   * @returns Returns the sort adapter.
   */
  get sort(): DynReducer.API.Sort<T>;
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
  protected initialize(optionsRest?: { [key: string]: any }): void;
  /**
   * Provides an iterator for data stored in DynMapReducerDerived.
   *
   * @returns Iterator for data stored in DynMapReducerDerived.
   */
  [Symbol.iterator](): IterableIterator<T>;
  /**
   * Subscribe to this DerivedMapReducer.
   *
   * @param handler - Callback function that is invoked on update / changes. Receives `this` reference.
   *
   * @returns Unsubscribe function.
   */
  subscribe(handler: (value: this) => void): () => void;
}

/**
 * Defines all public types for the `dynamic-reducer` library.
 */
declare namespace DynReducer {
  /**
   * Defines the common interface for a derived list reducer.
   *
   * @typeParam T `unknown` - Type of data.
   */
  interface DerivedList<T = unknown> {
    /**
     * @returns Provides an iterator for data stored in the derived reducer.
     */
    [Symbol.iterator](): IterableIterator<T>;
    /**
     * @returns Derived public API.
     */
    get derived(): API.DerivedList<T>;
    /**
     * @returns The filters adapter.
     */
    get filters(): API.Filters<T>;
    /**
     * @returns Returns the Indexer public API.
     */
    get index(): API.Index<number>;
    /**
     * @returns Returns whether this derived reducer is destroyed.
     */
    get destroyed(): boolean;
    /**
     * @returns Returns the main data items or indexed items length.
     */
    get length(): number;
    /**
     * @returns Returns current reversed state.
     */
    get reversed(): boolean;
    /**
     * @returns The sort adapter.
     */
    get sort(): API.Sort<T>;
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
     * Add a subscriber to this DynMapReducer instance.
     *
     * @param handler - Callback function that is invoked on update / changes. Receives `this` reference.
     *
     * @returns Unsubscribe function.
     */
    subscribe(handler: (value: DerivedList<T>) => void): () => void;
  }
  /**
   * Defines the common interface for a derived map reducer.
   *
   * @typeParam K `unknown` - Key type. Defaults to `unknown` to enforce type safety when no type is specified.
   *
   * @typeParam T `unknown` - Type of data. Defaults to `unknown` to enforce type safety when no type is specified.
   */
  interface DerivedMap<K = unknown, T = unknown> {
    /**
     * @returns Provides an iterator for data stored in the derived reducer.
     */
    [Symbol.iterator](): IterableIterator<T>;
    /**
     * @returns Derived public API.
     */
    get derived(): API.DerivedMap<K, T>;
    /**
     * @returns The filters adapter.
     */
    get filters(): API.Filters<T>;
    /**
     * @returns Returns the Indexer public API.
     */
    get index(): API.Index<K>;
    /**
     * @returns Returns whether this derived reducer is destroyed.
     */
    get destroyed(): boolean;
    /**
     * @returns Returns the main data items or indexed items length.
     */
    get length(): number;
    /**
     * @returns Returns current reversed state.
     */
    get reversed(): boolean;
    /**
     * @returns The sort adapter.
     */
    get sort(): API.Sort<T>;
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
     * Add a subscriber to this DynMapReducer instance.
     *
     * @param handler - Callback function that is invoked on update / changes. Receives `this` reference.
     *
     * @returns Unsubscribe function.
     */
    subscribe(handler: (value: DerivedMap<K, T>) => void): () => void;
  }
  /**
   * Defines the main composed public API for top-level and derived reducers.
   */
  namespace API {
    /**
     * Provides the public API for derived list reducers. There are several ways to create a derived reducer from
     * utilizing the default implementation or passing in a constructor function / class for a custom derived reducer.
     *
     * This API is accessible from the `derived` getter in the top-level and derived list reducers.
     *
     * ```
     * const dynArray = new DynArrayReducer([...]);
     * dynArray.derived.clear();
     * dynArray.derived.create(...);
     * dynArray.derived.delete(...);
     * dynArray.derived.destroy();
     * dynArray.derived.get(...);
     * ```
     *
     * @typeParam T `any` - Type of data.
     */
    interface DerivedList<T> {
      /**
       * Removes all derived reducers and associated subscriptions.
       */
      clear(): void;
      /**
       * @param options - Options for creating a reducer.
       *
       * @returns Newly created derived reducer.
       */
      create<O extends Options.DerivedListCreate<T>>(
        options: O,
      ): O extends typeof DynArrayReducerDerived<T>
        ? InstanceType<O>
        : O extends {
              ctor: typeof DynArrayReducerDerived<T>;
            }
          ? InstanceType<O['ctor']>
          : DynReducer.DerivedList<T>;
      /**
       * Deletes and destroys a derived reducer.
       *
       * @param name - Name of the derived reducer
       *
       * @returns Whether the derived reducer was deleted.
       */
      delete(name: string): boolean;
      /**
       * Removes all derived reducers, associated subscriptions, and cleans up all resources.
       */
      destroy(): void;
      /**
       * Returns an existing derived reducer.
       *
       * @param name - Name of derived reducer.
       *
       * @returns Any associated derived reducer.
       */
      get(name: string): DynReducer.DerivedList<T> | undefined;
    }
    /**
     * Provides the public API for derived map reducers. There are several ways to create a derived reducer from
     * utilizing the default implementation or passing in a constructor function / class for a custom derived reducer.
     *
     * This API is accessible from the `derived` getter in the top-level and derived map reducers.
     *
     * ```
     * const dynMap = new DynMapReducer([...]);
     * dynMap.derived.clear();
     * dynMap.derived.create(...);
     * dynMap.derived.delete(...);
     * dynMap.derived.destroy();
     * dynMap.derived.get(...);
     * ```
     *
     * @typeParam K `any` - Key type.
     *
     * @typeParam T `any` - Type of data.
     */
    interface DerivedMap<K, T> {
      /**
       * Removes all derived reducers and associated subscriptions.
       */
      clear(): void;
      /**
       * @param options - Options for creating a reducer.
       *
       * @returns Newly created derived reducer.
       */
      create<O extends Options.DerivedMapCreate<K, T>>(
        options: O,
      ): O extends typeof DynMapReducerDerived<K, T>
        ? InstanceType<O>
        : O extends {
              ctor: typeof DynMapReducerDerived<K, T>;
            }
          ? InstanceType<O['ctor']>
          : DynReducer.DerivedMap<K, T>;
      /**
       * Deletes and destroys a derived reducer.
       *
       * @param name - Name of the derived reducer
       *
       * @returns Whether the derived reducer was deleted.
       */
      delete(name: string): boolean;
      /**
       * Removes all derived reducers, associated subscriptions, and cleans up all resources.
       */
      destroy(): void;
      /**
       * Returns an existing derived reducer.
       *
       * @param name - Name of derived reducer.
       *
       * @returns Any associated derived reducer.
       */
      get(name: string): DynReducer.DerivedMap<K, T> | undefined;
    }
    /**
     * Provides the storage and sequencing of managed filters. Each filter added may be a bespoke function or a
     * {@link DynReducer.Data.Filter} object containing an `id`, `filter`, and `weight` attributes; `filter` is the
     * only required attribute.
     *
     * The `id` attribute can be anything that creates a unique ID for the filter; recommended strings or numbers.
     * This allows filters to be removed by ID easily.
     *
     * The `weight` attribute is a number between 0 and 1 inclusive that allows filters to be added in a
     * predictable order which is especially handy if they are manipulated at runtime. A lower weighted filter always
     * runs before a higher weighted filter. For speed and efficiency always set the heavier / more inclusive filter
     * with a lower weight; an example of this is a keyword / name that will filter out many entries making any
     * further filtering faster. If no weight is specified the default of '1' is assigned and it is appended to the
     * end of the filters list.
     *
     * This class forms the public API which is accessible from the `.filters` getter in the main reducer
     * implementation.
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
     * @typeParam T `any` - Type of data.
     */
    interface Filters<T> {
      /**
       * @returns Provides an iterator for filters.
       */
      [Symbol.iterator](): IterableIterator<Data.Filter<T>>;
      /**
       * @returns Returns the length of the filter data.
       */
      get length(): number;
      /**
       * @param filters - One or more filter functions / DynDataFilter to add.
       */
      add(...filters: (Data.FilterFn<T> | Data.Filter<T>)[]): void;
      /**
       * Clears and removes all filters.
       */
      clear(): void;
      /**
       * @param filters - One or more filter functions / DynDataFilter to remove.
       */
      remove(...filters: (Data.FilterFn<T> | Data.Filter<T>)[]): void;
      /**
       * Remove filters by the provided callback. The callback takes 3 parameters: `id`, `filter`, and `weight`.
       * Any truthy value returned will remove that filter.
       *
       * @param callback - Callback function to evaluate each filter entry.
       */
      removeBy(callback: (id: any, filter: Data.FilterFn<T>, weight: number) => boolean): void;
      /**
       * @param ids - Removes filters by ID.
       */
      removeById(...ids: any[]): void;
    }
    /**
     * Provides the public API for accessing the index API.
     *
     * This class forms the public API which is accessible from the `.index` getter in the main reducer
     * implementation.
     * ```
     * const dynArray = new DynArrayReducer([...]);
     * dynArray.index.active;
     * dynArray.index.hash;
     * dynArray.index.length;
     * dynArray.index.update(...);
     * ```
     *
     * @typeParam K `any` - Key type.
     */
    interface Index<K> {
      /**
       * @returns Returns whether the index is active.
       */
      get active(): boolean;
      /**
       * @returns Returns length of reduced index.
       */
      get length(): number;
      /**
       * Manually invoke an update of the index.
       *
       * @param [force] - Force update to any subscribers.
       */
      update(force?: boolean): void;
      /**
       * @returns Current hash value of the index.
       */
      get hash(): number | null;
      /**
       * Provides an iterator over the index array.
       *
       * @returns Iterator for the index array.
       */
      [Symbol.iterator](): IterableIterator<K>;
    }
    /**
     * Provides the storage and sequencing of a managed sort function. The sort function set may be a bespoke function
     * or a {@link Data.Sort} object containing an `compare`, and `subscribe` attributes; `compare` is the only
     * required attribute.
     *
     * Note: You can set a compare function that also has a subscribe function attached as the `subscribe` attribute.
     * If a subscribe function is provided the sort function can notify any updates that may change sort order and
     * this triggers an index update.
     *
     * This class forms the public API which is accessible from the `.sort` getter in the main reducer implementation.
     * ```
     * const dynArray = new DynArrayReducer([...]);
     * dynArray.sort.clear();
     * dynArray.sort.set(...);
     * ```
     *
     * @typeParam T `any` - Type of data.
     */
    interface Sort<T> {
      /**
       * Clears & removes any assigned sort function and triggers an index update.
       */
      clear(): void;
      /**
       * @param sort - A callback function that compares two values. Return > 0 to sort `b` before `a`;
       * < 0 to sort `a` before `b`; or 0 to keep original order of `a` & `b`.
       *
       * Note: You can set a compare function that also has a subscribe function attached as the `subscribe`
       * attribute.
       *
       * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort#parameters
       */
      set(sort: Data.CompareFn<T> | Data.Sort<T> | null | undefined): void;
    }
  }
  /**
   * Defines data utilized by the `dynamic-reducer` library.
   */
  namespace Data {
    /**
     * A callback function that compares two values. Return > 0 to sort 'b' before 'a'; < 0 to sort 'a' before 'b';
     * or 0 to keep original order of 'a' & 'b'.
     *
     * This function has an optional subscribe function that follows the Svelte store Subscriber pattern. If a
     * subscribe function is provided automatic updates to the reduced index is performed.
     *
     * @typeParam T `any` - Type of data.
     */
    interface CompareFn<T> {
      /**
       * @param a - Element 'a' of backing data to sort.
       *
       * @param b - Element 'b' of backing data to sort.
       */
      (a: T, b: T): number;
      /**
       * Optional subscribe function following the Svelte store / subscribe pattern.
       *
       * @param indexUpdate - Callback function that is invoked on update / changes. Receives `index update`
       *        function.
       */
      subscribe?: (indexUpdate: IndexUpdateFn) => () => void;
    }
    /**
     * Defines object / options for creating a derived list reducer.
     *
     * @typeParam T `any` - Type of data.
     */
    interface DerivedListCreate<T> extends Options.Common<T> {
      /**
       * Name of derived reducer.
       */
      name?: string;
      /**
       * A DerivedReducer constructor function / class.
       */
      ctor?: typeof DynArrayReducerDerived<T>;
      /**
       * Extra data to pass through to `initialize`.
       */
      [key: string]: any;
    }
    /**
     * Defines object / options for creating a derived map reducer.
     *
     * @typeParam K `any` - Key type.
     *
     * @typeParam T `any` - Type of data.
     */
    interface DerivedMapCreate<K, T> extends Options.Common<T> {
      /**
       * Name of derived reducer.
       */
      name?: string;
      /**
       * A DerivedReducer constructor function / class.
       */
      ctor?: typeof DynMapReducerDerived<K, T>;
      /**
       * Extra data to pass through to `initialize`.
       */
      [key: string]: any;
    }
    /**
     * Defines the data object to configure a filter w/ additional configuration options.
     *
     * @typeParam T `any` - Type of data.
     */
    type Filter<T> = {
      /**
       * An optional ID associated with this filter. Can be used to remove the filter.
       */
      id?: any;
      /**
       * Filter function that takes a value argument and returns a truthy value to keep it.
       */
      filter: FilterFn<T>;
      /**
       * An optional number between 0 and 1 inclusive to position this filter against others.
       */
      weight?: number;
      /**
       * Optional subscribe function following the Svelte store / subscribe pattern.
       *
       * @param indexUpdate - Callback function that is invoked on update / changes.
       */
      subscribe?: (indexUpdate: IndexUpdateFn) => () => void;
    };
    /**
     * Filter function that takes an element argument and returns a truthy value to keep it.
     *
     * This function has an optional subscribe function that follows the Svelte store Subscriber pattern. If a
     * subscribe function is provided automatic updates to the reduced index is performed.
     *
     * @typeParam T `any` - Type of data.
     */
    interface FilterFn<T> {
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
      subscribe?: (indexUpdate: IndexUpdateFn) => () => void;
    }
    /**
     * Updates associated dynamic reducer indexer.
     *
     * @param [force] - Force an update the index regardless of hash calculations.
     */
    type IndexUpdateFn = (force?: boolean) => void;
    /**
     * Defines object / options for creating a top-level DynArrayReducer. Useful for consumers of the
     * `dynamic-reducer` library to implement a `create` method similar to derived reducers.
     *
     * @typeParam T `any` - Type of data.
     */
    interface ListCreate<T> extends Options.Common<T> {
      /**
       * Name of reducer.
       */
      name?: string;
      /**
       * A list constructor function / class.
       */
      ctor?: typeof DynArrayReducer<T>;
      /**
       * Extra data to pass through to any `initialize` method.
       */
      [key: string]: any;
    }
    /**
     * Defines object / options for creating a map reducer. Useful for consumers of the
     * `dynamic-reducer` library to implement a `create` method similar to derived reducers.
     *
     * @typeParam K `any` - Key type.
     *
     * @typeParam T `any` - Type of data.
     */
    interface MapCreate<K, T> extends Options.Common<T> {
      /**
       * Name of reducer.
       */
      name?: string;
      /**
       * A Map constructor function / class.
       */
      ctor?: typeof DynMapReducer<K, T>;
      /**
       * Extra data to pass through to any `initialize` method.
       */
      [key: string]: any;
    }
    /**
     * Defines an object to configure sort functionality.
     *
     * @typeParam T `any` - Type of data.
     */
    type Sort<T> = {
      /**
       * A callback function that compares two values.
       */
      compare: CompareFn<T>;
      /**
       * Optional subscribe function following the Svelte store / subscribe pattern.
       *
       * @param indexUpdate - Callback function that is invoked on update / changes.
       */
      subscribe?: (indexUpdate: IndexUpdateFn) => () => void;
    };
  }
  /**
   * Defines all options objects utilized by the `dynamic-reducer` library.
   */
  namespace Options {
    /**
     * The main options object for DynArrayReducer.
     *
     * @typeParam T `any` - Type of data.
     */
    interface ListReducer<T> extends Common<T> {
      /**
       * Initial data iterable list.
       */
      data?: Iterable<T>;
    }
    /**
     * Defines the additional options for filters and sort function.
     *
     * @typeParam T `any` - Type of data.
     */
    interface Common<T> {
      /**
       * Iterable list of filters.
       */
      filters?: Iterable<Data.FilterFn<T> | Data.Filter<T>>;
      /**
       * Compare function.
       */
      sort?: Data.CompareFn<T> | Data.Sort<T>;
    }
    /**
     * Creates a compound type for all derived list reducer 'create' option combinations.
     *
     * Includes additional type inference constraints for {@link Data.DerivedListCreate}.
     *
     * @typeParam T `any` - Type of data.
     */
    type DerivedListCreate<T> =
      | string
      | typeof DynArrayReducerDerived<T>
      | (Data.DerivedListCreate<T> & {
          ctor: typeof DynArrayReducerDerived<T>;
        })
      | (Data.DerivedListCreate<T> & {
          name: string;
        } & (
            | {
                filters: Iterable<Data.FilterFn<T> | Data.Filter<T>>;
              }
            | {
                sort: Data.CompareFn<T> | Data.Sort<T>;
              }
          ));
    /**
     * Creates a compound type for all derived map reducer 'create' option combinations.
     *
     * Includes additional type inference constraints for {@link Data.DerivedMapCreate}.
     *
     * @typeParam K `any` - Key type.
     *
     * @typeParam T `any` - Type of data.
     */
    type DerivedMapCreate<K, T> =
      | string
      | typeof DynMapReducerDerived<K, T>
      | (Data.DerivedMapCreate<K, T> & {
          ctor: typeof DynMapReducerDerived<K, T>;
        })
      | (Data.DerivedMapCreate<K, T> & {
          name: string;
        } & (
            | {
                filters: Iterable<Data.FilterFn<T> | Data.Filter<T>>;
              }
            | {
                sort: Data.CompareFn<T> | Data.Sort<T>;
              }
          ));
    /**
     * Creates a compound type for all list reducer 'create' option combinations. Useful for consumers of the
     * `dynamic-reducer` library to implement a `create` method for a list reducer similar to derived reducers.
     *
     * Includes additional type inference constraints for {@link Data.ListCreate}.
     *
     * @typeParam T `any` - Type of data.
     */
    type ListCreate<T> =
      | string
      | typeof DynArrayReducer<T>
      | (Data.ListCreate<T> & {
          ctor: typeof DynArrayReducer<T>;
        })
      | (Data.ListCreate<T> & {
          name: string;
        } & (
            | {
                filters: Iterable<Data.FilterFn<T> | Data.Filter<T>>;
              }
            | {
                sort: Data.CompareFn<T> | Data.Sort<T>;
              }
          ));
    /**
     * Creates a compound type for all map reducer 'create' option combinations. Useful for consumers of the
     * `dynamic-reducer` library to implement a `create` method for a map reducer similar to derived reducers.
     *
     * Includes additional type inference constraints for {@link Data.MapCreate}.
     *
     * @typeParam K `any` - Key type.
     *
     * @typeParam T `any` - Type of data.
     */
    type MapCreate<K, T> =
      | string
      | typeof DynMapReducer<K, T>
      | (Data.MapCreate<K, T> & {
          ctor: typeof DynMapReducer<K, T>;
        })
      | (Data.MapCreate<K, T> & {
          name: string;
        } & (
            | {
                filters: Iterable<Data.FilterFn<T> | Data.Filter<T>>;
              }
            | {
                sort: Data.CompareFn<T> | Data.Sort<T>;
              }
          ));
    /**
     * The main options object for DynMapReducer.
     *
     * @typeParam K `any` - Key type.
     *
     * @typeParam T `any` - Type of data.
     */
    interface MapReducer<K, T> extends Common<T> {
      /**
       * Optional initial backing Map.
       */
      data?: Map<K, T>;
    }
  }
}

/**
 * Provides a managed array with non-destructive reducing / filtering / sorting capabilities with subscription /
 * Svelte store support.
 *
 * _Note:_ In constructing a DynArrayReducer instance that arrays are treated as a special case. When an array is passed
 * in as `data` in the constructor it will be used as the host array and not copied. All non-array iterables otherwise
 * create a new array / copy.
 *
 * _Note:_
 * - The default type `unknown` ensures stricter type checking, preventing unintended operations on the data.
 * - If the type of data is known, explicitly specify the generic type to improve clarity and maintainability:
 *
 * @example
 * ```ts
 * // Using external array data as reducer host data.
 * const data = ['a', 'b', 'c'];
 * const reducer = new DynArrayReducer<string>(data);
 *
 * // Add new data externally.
 * data.push('d');
 *
 * // Update the index.
 * reducer.index.update();
 * ```
 *
 * @example
 * ```ts
 * // Explicit type specification.
 * const reducer = new DynArrayReducer<string>(['a', 'b', 'c']);
 * ```
 *
 * @example
 * ```ts
 * // Using the default type.
 * const reducer = new DynArrayReducer(); // Defaults to DynArrayReducer<unknown>
 * ```
 *
 * @typeParam T `unknown` - Type of data. Defaults to `unknown` to enforce type safety when no type is specified.
 */
declare class DynArrayReducer<T = unknown> {
  #private;
  /**
   * Initializes DynArrayReducer. Any iterable is supported for initial data. Take note that if `data` is an array it
   * will be used as the host array and not copied. All non-array iterables otherwise create a new array / copy.
   *
   * @param [data] - Data iterable to store if array or copy otherwise.
   *
   * @typeParam T `unknown` - Type of data.
   */
  constructor(data?: Iterable<T> | DynReducer.Options.ListReducer<T>);
  /**
   * Returns the internal data of this instance. Be careful!
   *
   * Note: if an array is set as initial data then that array is used as the internal data. If any changes are
   * performed to the data externally do invoke `update` via {@link DynArrayReducer.index} with `true` to recalculate
   * the index and notify all subscribers.
   *
   * @returns The internal data.
   */
  get data(): T[] | null;
  /**
   * @returns Derived public API.
   */
  get derived(): DynReducer.API.DerivedList<T>;
  /**
   * @returns The filters adapter.
   */
  get filters(): DynReducer.API.Filters<T>;
  /**
   * @returns Returns the Indexer public API; is also iterable.
   */
  get index(): DynReducer.API.Index<number>;
  /**
   * @returns Returns whether this instance is destroyed.
   */
  get destroyed(): boolean;
  /**
   * @returns Returns the main data items or indexed items length.
   */
  get length(): number;
  /**
   * @returns Returns current reversed state.
   */
  get reversed(): boolean;
  /**
   * @returns The sort adapter.
   */
  get sort(): DynReducer.API.Sort<T>;
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
   * Provides a callback for custom reducers to initialize any data / custom configuration. Depending on the consumer
   * of `dynamic-reducer` this may be utilized allowing child classes to avoid implementing the constructor.
   *
   * @param [optionsRest] - Any additional custom options passed beyond {@link DynReducer.Options.Common}.
   *
   * @protected
   */
  protected initialize(optionsRest?: { [key: string]: any }): void;
  /**
   * Removes internal data and pushes new data. This does not destroy any initial array set to internal data unless
   * `replace` is set to true.
   *
   * @param data - New data to set to internal data.
   *
   * @param [replace=false] - New data to set to internal data.
   */
  setData(data: T[] | Iterable<T> | null, replace?: boolean): void;
  /**
   * Add a subscriber to this DynArrayReducer instance.
   *
   * @param handler - Callback function that is invoked on update / changes. Receives `this` reference.
   *
   * @returns Unsubscribe function.
   */
  subscribe(handler: (value: this) => void): () => void;
  /**
   * Provides an iterator for data stored in DynArrayReducer.
   *
   * @returns Iterator for data stored in DynArrayReducer.
   */
  [Symbol.iterator](): IterableIterator<T>;
}

/**
 * Provides the base implementation derived reducer for arrays / DynArrayReducer.
 *
 * Note: That you should never directly create an instance of a derived reducer, but instead use the
 * {@link DynArrayReducerDerived.initialize} function to set up any initial state in a custom derived reducer.
 *
 * @typeParam T `unknown` - Type of data. Defaults to `unknown` to enforce type safety when no type is specified.
 */
declare class DynArrayReducerDerived<T = unknown> implements DynReducer.DerivedList<T> {
  #private;
  /**
   * @param array - Data host array.
   *
   * @param parentIndex - Parent indexer.
   *
   * @param options - Any filters and sort functions to apply.
   *
   * @typeParam T `unknown` - Type of data.
   *
   * @private
   */
  constructor(
    array: Internal.Data.Host<T[]>,
    parentIndex: DynReducer.API.Index<number>,
    options: DynReducer.Options.Common<T>,
  );
  /**
   * @returns Derived public API.
   */
  get derived(): DynReducer.API.DerivedList<T>;
  /**
   * @returns The filters adapter.
   */
  get filters(): DynReducer.API.Filters<T>;
  /**
   * @returns Returns the Indexer public API; is also iterable.
   */
  get index(): DynReducer.API.Index<number>;
  /**
   * @returns Returns whether this derived reducer is destroyed.
   */
  get destroyed(): boolean;
  /**
   * @returns Returns the main data items or indexed items length.
   */
  get length(): number;
  /**
   * @returns Returns current reversed state.
   */
  get reversed(): boolean;
  /**
   * @returns The sort adapter.
   */
  get sort(): DynReducer.API.Sort<T>;
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
   * @param [optionsRest] - Any additional custom options passed beyond {@link DynReducer.Options.Common}.
   *
   * @protected
   */
  protected initialize(optionsRest?: { [key: string]: any }): void;
  /**
   * Provides an iterator for data stored in DynArrayReducerDerived.
   *
   * @returns Iterator for data stored in DynArrayReducerDerived.
   */
  [Symbol.iterator](): IterableIterator<T>;
  /**
   * Subscribe to this DerivedArrayReducer.
   *
   * @param handler - Callback function that is invoked on update / changes. Receives `this` reference.
   *
   * @returns Unsubscribe function.
   */
  subscribe(handler: (value: this) => void): () => void;
}

/**
 * Provides helper functions to create dynamic store driven filters and sort functions for dynamic reducers. The
 * returned functions are also Svelte stores and can be added to a reducer as well as used as a store.
 */
declare class DynReducerHelper {
  private constructor();
  /**
   * Returns the following filter functions:
   * - regexObjectQuery(accessors, options); suitable for object reducers matching one or more property keys /
   *   accessors against the store value as a regex. To access deeper entries into the object format the accessor
   *   string with `.` between entries to walk. Optional parameters include logging access warnings, case sensitivity,
   *   and passing in an existing store.
   *
   * @returns All available filters.
   */
  static get filters(): DynReducerHelper.Filters;
}
/**
 * Defines the available resources of {@link DynReducerHelper}.
 */
declare namespace DynReducerHelper {
  /**
   * All available filters.
   */
  interface Filters {
    /**
     * Creates a filter function to compare objects by a given accessor key against a regex test. The returned
     * function is also a minimal writable Svelte store that builds a regex from the stores value.
     *
     * Suitable for object reducers matching one or more property keys / accessors against the store value as a
     * regex. To access deeper entries into the object format the accessor string with `.` between entries to walk.
     *
     * This filter function can be used w/ a dynamic reducer and bound as a store to input elements.
     *
     * @param accessors - Property key / accessors to lookup key to compare. To access deeper entries into the object
     *        format the accessor string with `.` between entries to walk.
     *
     * @param [options] - Optional parameters.
     *
     * @param [options.accessWarn=false] - When true warnings will be posted if accessor not retrieved; default:
     *        `false`.
     *
     * @param [options.caseSensitive=false] - When true regex test is case-sensitive; default: `false`.
     *
     * @param [options.store] - Use the provided minimal writable store instead of creating a default `writable`
     *        store.
     *
     * @returns The query string filter.
     */
    regexObjectQuery: (
      accessors: string | Iterable<string>,
      options?: {
        accessWarn?: boolean;
        caseSensitive?: boolean;
        store?: MinimalWritable<string>;
      },
    ) => MinimalWritableFn<
      string,
      [
        data: {
          [key: string]: any;
        },
      ],
      boolean
    >;
  }
}

export { DynArrayReducer, DynArrayReducerDerived, DynMapReducer, DynMapReducerDerived, DynReducer, DynReducerHelper };
