import { writable } from 'svelte/store';
import { TrieSearch } from '@typhonjs-svelte/runtime-base/data/struct/search/trie';
import { DynArrayReducer } from '@typhonjs-svelte/runtime-base/data/struct/store/reducer';
import { isObject, isIterable } from '@typhonjs-svelte/runtime-base/util/object';

/**
 * Provides a reactive query interface to {@link TrieSearch} in addition to dynamic filtering / sorting of search
 * results.
 *
 * @template T
 */
class TrieSearchQuery extends DynArrayReducer {
    /**
     * Provides the backing data for DynArrayReducer populated from search queries against the associated TrieSearch
     * instance.
     */
    #data = [];
    /**
     * The current limit value passed onto associated TrieSearch to limit search results.
     */
    #currentLimit = undefined;
    /**
     * Stores the last set search query.
     */
    #currentQuery = '';
    /**
     * Stores the current destroyed state.
     */
    #isDestroyed = false;
    /**
     * Provides the external reactive writable store controlling the search results limit.
     */
    #storeLimit;
    /**
     * Provides the external reactive writable store controlling search queries.
     */
    #storeQuery = writable(this.#currentQuery);
    /**
     * The TrieSearch specific reducer instance.
     */
    #trieReducer;
    /**
     * Holds a weak reference to the associated TrieSearch instance.
     */
    #trieSearch;
    /**
     * Holds all unsubscribe functions.
     */
    #unsubscribers = [];
    /**
     * @param {TrieSearch<T>}  trieSearch - The associated TrieSearch instance.
     *
     * @param {TrieSearchQueryOptions<T>} options - Optional query settings.
     */
    constructor(trieSearch, options) {
        super();
        if (!(trieSearch instanceof TrieSearch)) {
            throw new TypeError(`TrieSearchQuery error: 'trieSearch' must be an instance of TrieSearch.`);
        }
        if (options !== void 0 && !isObject(options)) {
            throw new TypeError(`TrieSearchQuery error: 'options' must be an object.`);
        }
        if (options?.trieReducer !== void 0 && typeof options.trieReducer?.reduce !== 'function') {
            throw new TypeError(`TrieSearchQuery error: 'options.trieReducer' must implement ITrieSearchReducer.`);
        }
        if (options?.limit !== void 0 && (!Number.isInteger(options.limit) || options.limit < 0)) {
            throw new TypeError(`TrieSearchQuery error: 'options.limit' must be an integer >= 0.`);
        }
        // Replace backing array of DynArrayReducer with local data array.
        super.setData(this.#data, true);
        this.#trieSearch = new WeakRef(trieSearch);
        this.#trieReducer = options?.trieReducer;
        this.#currentLimit = options?.limit;
        this.#storeLimit = writable(this.#currentLimit);
        // Have any changes to the associated TrieSearch instance trigger search updates or destroy.
        this.#unsubscribers.push(trieSearch.subscribe(this.#updateTrieSearch.bind(this)));
        // Have any changes to the limit store trigger search updates with the associated TrieSearch instance.
        this.#unsubscribers.push(this.#storeLimit.subscribe(this.#updateLimit.bind(this)));
        // Have any changes to the query store trigger search updates with the associated TrieSearch instance.
        this.#unsubscribers.push(this.#storeQuery.subscribe(this.#updateQuery.bind(this)));
    }
    /**
     * @returns {Writable<number | undefined>} The writable store controlling the search results limit.
     */
    get limit() { return this.#storeLimit; }
    /**
     * @returns {boolean} The current destroyed state of this query instance.
     */
    get isDestroyed() { return this.#isDestroyed; }
    /**
     * @returns {ITrieSearchReducer<T>} Any associated TrieSearch reducer function.
     */
    get trieReducer() { return this.#trieReducer; }
    /**
     * The associated TrieSearch instance; can be undefined.
     */
    get trieSearch() { return this.#trieSearch !== void 0 ? this.#trieSearch.deref() : void 0; }
    /**
     * @returns {Writable<string | Iterable<string> | undefined>} The writable store controlling the search query.
     */
    get query() { return this.#storeQuery; }
    /**
     * @param {ITrieSearchReducer<T> | undefined}  trieReducer - A new trie reducer function.
     */
    set trieReducer(trieReducer) {
        if (trieReducer !== void 0 && typeof trieReducer?.reduce !== 'function') {
            throw new TypeError(`TrieSearchQuery.set error: 'trieReducer' must implement ITrieSearchReducer.`);
        }
        this.#trieReducer = trieReducer;
        this.#performSearch();
    }
    /**
     * Destroys and disconnects this query from the local stores and any associated TrieSearch instance.
     */
    destroy() {
        // Unsubscribe from TrieSearch instance and local stores.
        for (const unsubscribe of this.#unsubscribers) {
            unsubscribe();
        }
        this.#unsubscribers.length = 0;
        this.#trieSearch = void 0;
        this.#isDestroyed = true;
        // Remove any stored data and update DynArrayReducer index.
        this.#data.length = 0;
        super.index.update();
    }
    /**
     * Performs a search with the associated TrieSearch instance.
     */
    #performSearch() {
        // Reset the data array without changing instance.
        this.#data.length = 0;
        // Retrieve TrieSearch reference. It may have been garbage collected.
        const trieSearch = this.trieSearch;
        /* c8 ignore next 8 */
        if (trieSearch === void 0) {
            console.warn(`TrieSearchQuery warning: 'trieSearch' has been garbage collected; destroying this query instance`);
            this.destroy();
            return;
        }
        // Perform the trie search storing results in `this.#data`.
        trieSearch.search(this.#currentQuery, {
            limit: this.#currentLimit,
            list: this.#data,
            reducer: this.#trieReducer
        });
        // Update the non-destructive DynArrayReducer index.
        super.index.update();
    }
    /**
     * Receives updates from `#storeLimit`.
     *
     * @param {number | undefined}  limit - New search limit.
     */
    #updateLimit(limit) {
        const isNumber = typeof limit === 'number';
        if (limit !== void 0 && !isNumber) {
            console.warn(`TrieSearchQuery warning: 'limit' must be a number or undefined; setting to undefined.`);
            this.#storeLimit.set(void 0);
            return;
        }
        if (isNumber && (!Number.isInteger(limit) || limit < 0)) {
            console.warn(`TrieSearchQuery warning: 'limit' must be an integer >= 0; setting to undefined.`);
            this.#storeLimit.set(void 0);
            return;
        }
        this.#currentLimit = limit;
        this.#performSearch();
    }
    /**
     * Receives updates from `#storeQuery`.
     *
     * @param {string | Iterable<string> | undefined}  query - New search query.
     */
    #updateQuery(query) {
        if (query !== void 0 && typeof query !== 'string' && !isIterable(query)) {
            console.warn(`TrieSearchQuery warning: 'query' is not a string or iterable list of strings; setting to undefined.`);
            this.#storeQuery.set(void 0);
            return;
        }
        this.#currentQuery = query;
        this.#performSearch();
    }
    /**
     * Handles change notifications from the associated TrieSearch instance.
     *
     * @param {object}   options - Optional parameters.
     *
     * @param {string}   options.action - The associated TrieSearch action.
     */
    #updateTrieSearch({ action }) {
        if (action === 'destroy') {
            this.destroy();
        }
        else {
            this.#performSearch();
        }
    }
}

export { TrieSearchQuery };
//# sourceMappingURL=index.js.map
