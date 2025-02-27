import { writable, get } from 'svelte/store';
import { isMinimalWritableStore } from '@typhonjs-svelte/runtime-base/svelte/store/util';
import { Strings } from '@typhonjs-svelte/runtime-base/util';
import { isIterable, safeAccess } from '@typhonjs-svelte/runtime-base/util/object';

class DynReducerUtils {
    /**
     * Checks for array equality between two arrays of numbers.
     *
     * @param a - Array A
     *
     * @param b - Array B
     *
     * @returns Arrays are equal.
     */
    static arrayEquals(a, b) {
        if (a === b) {
            return true;
        }
        /* c8 ignore next */
        if (a === null || b === null) {
            return false;
        }
        /* c8 ignore next */
        if (a.length !== b.length) {
            return false;
        }
        for (let cntr = a.length; --cntr >= 0;) {
            /* c8 ignore next */
            if (a[cntr] !== b[cntr]) {
                return false;
            }
        }
        return true;
    }
    /**
     * Provides a solid string hashing algorithm.
     *
     * Sourced from: https://stackoverflow.com/a/52171480
     *
     * @param str - String to hash.
     *
     * @param seed - A seed value altering the hash.
     *
     * @returns Hash code.
     */
    static hashString(str, seed = 0) {
        /* c8 ignore next */
        if (str === void 0 || str === null) {
            return 0;
        }
        let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
        for (let ch, i = 0; i < str.length; i++) {
            ch = str.charCodeAt(i);
            h1 = Math.imul(h1 ^ ch, 2654435761);
            h2 = Math.imul(h2 ^ ch, 1597334677);
        }
        h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
        h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
        return 4294967296 * (2097151 & h2) + (h1 >>> 0);
    }
    /**
     * Converts an unknown value for hashing purposes in {@link AdapterIndexer.calcHashUpdate}.
     *
     * Currently, objects / Map w/ object keys is not supported. Potentially can include `object-hash` to handle this
     * case, but it is not common to use objects as keys in Maps.
     *
     * @param value - An unknown value to convert to a number.
     */
    static hashUnknown(value) {
        if (value === null || value === void 0) {
            return 0;
        }
        let result = 0;
        switch (typeof value) {
            case 'boolean':
                result = value ? 1 : 0;
                break;
            case 'bigint':
                result = Number(BigInt.asIntN(64, value));
                break;
            case 'function':
                result = this.hashString(value.name);
                break;
            case 'number':
                result = Number.isFinite(value) ? value : 0;
                break;
            case 'object':
                // TODO: consider hashing an object IE `object-hash` and convert to number.
                break;
            case 'string':
                result = this.hashString(value);
                break;
            case 'symbol':
                result = this.hashString(Symbol.keyFor(value));
                break;
        }
        return result;
    }
    /**
     * @param target -
     *
     * @param Prototype -
     *
     * @returns target constructor function has Prototype.
     */
    static hasPrototype(target, Prototype) {
        /* c8 ignore next */
        if (typeof target !== 'function') {
            return false;
        }
        if (target === Prototype) {
            return true;
        }
        // Walk parent prototype chain. Check for descriptor at each prototype level.
        for (let proto = Object.getPrototypeOf(target); proto; proto = Object.getPrototypeOf(proto)) {
            if (proto === Prototype) {
                return true;
            }
        }
        return false;
    }
    /**
     * Provides a utility method to determine if the given data is iterable / implements iterator protocol.
     *
     * @param data - Data to verify as iterable.
     *
     * @returns Is data iterable.
     */
    static isIterable(data) {
        return data !== null && data !== void 0 && typeof data === 'object' &&
            typeof data[Symbol.iterator] === 'function';
    }
}

/**
 * Provides the `derived` API for all dynamic reducers.
 */
class AdapterDerived {
    #hostData;
    #DerivedReducerCtor;
    #parentIndex;
    #derived = new Map();
    #destroyed = false;
    /**
     * @param hostData - Hosted data structure.
     *
     * @param parentIndex - Any associated parent index API.
     *
     * @param DerivedReducerCtor - The default derived reducer constructor function.
     */
    constructor(hostData, parentIndex, DerivedReducerCtor) {
        this.#hostData = hostData;
        this.#parentIndex = parentIndex;
        this.#DerivedReducerCtor = DerivedReducerCtor;
        Object.freeze(this);
    }
    /**
     * Creates a new derived reducer.
     *
     * @param options - Options defining the new derived reducer.
     *
     * @returns Newly created derived reducer.
     */
    create(options) {
        if (this.#destroyed || this.#hostData === null) {
            throw Error(`AdapterDerived.create error: this instance has been destroyed.`);
        }
        let name;
        let rest = {};
        let ctor;
        const DerivedReducerCtor = this.#DerivedReducerCtor;
        if (typeof options === 'string') {
            name = options;
            ctor = DerivedReducerCtor;
        }
        else if (typeof options === 'function' && DynReducerUtils.hasPrototype(options, DerivedReducerCtor)) {
            ctor = options;
        }
        else if (typeof options === 'object' && options !== null) {
            ({ name, ctor = DerivedReducerCtor, ...rest } = options);
        }
        else {
            throw new TypeError(`AdapterDerived.create error: 'options' does not conform to allowed parameters.`);
        }
        if (!DynReducerUtils.hasPrototype(ctor, DerivedReducerCtor)) {
            throw new TypeError(`AdapterDerived.create error: 'ctor' is not a '${DerivedReducerCtor?.name}'.`);
        }
        name = name ?? ctor?.name;
        if (typeof name !== 'string') {
            throw new TypeError(`AdapterDerived.create error: 'name' is not a string.`);
        }
        const derivedReducer = new ctor(this.#hostData, this.#parentIndex, rest);
        this.#derived.set(name, derivedReducer);
        // If the instantiated derived reducer has an `initialize` method then invoke it.
        if (this.#hasInitialize(derivedReducer)) {
            const { filters, sort, ...optionsRest } = rest;
            derivedReducer.initialize(optionsRest);
        }
        return derivedReducer;
    }
    /**
     * Removes all derived reducers and associated subscriptions.
     */
    clear() {
        if (this.#destroyed) {
            return;
        }
        for (const reducer of this.#derived.values()) {
            reducer.destroy();
        }
        this.#derived.clear();
    }
    /**
     * Deletes and destroys a derived reducer by name.
     *
     * @param name - Name of the derived reducer.
     *
     * @returns true if an element in the Map existed and has been removed, or false if the element does not exist.
     */
    delete(name) {
        if (this.#destroyed) {
            throw Error(`AdapterDerived.delete error: this instance has been destroyed.`);
        }
        const reducer = this.#derived.get(name);
        if (reducer) {
            reducer.destroy();
        }
        return this.#derived.delete(name);
    }
    /**
     * Removes all derived reducers, subscriptions, and cleans up all resources.
     */
    destroy() {
        if (this.#destroyed) {
            return;
        }
        this.clear();
        this.#hostData = null;
        this.#parentIndex = null;
        this.#destroyed = true;
    }
    /**
     * Returns an existing derived reducer.
     *
     * @param name - Name of derived reducer.
     *
     * @returns Any associated derived reducer.
     */
    get(name) {
        if (this.#destroyed) {
            throw Error(`AdapterDerived.get error: this instance has been destroyed.`);
        }
        return this.#derived.get(name);
    }
    /**
     * Type guard to check for presence of `initialize` method.
     *
     * @param instance - Instance to check.
     */
    #hasInitialize(instance) {
        return typeof instance?.initialize === 'function';
    }
    /**
     * Updates all managed derived reducer indexes.
     *
     * @param [force=false] - Force an update to subscribers.
     */
    update(force = false) {
        if (this.#destroyed) {
            return;
        }
        for (const reducer of this.#derived.values()) {
            reducer.index.update(force);
        }
    }
}

class AdapterFilters {
    #filtersData;
    #indexUpdate;
    #mapUnsubscribe = new Map();
    constructor(indexUpdate, filtersAdapter) {
        this.#indexUpdate = indexUpdate;
        this.#filtersData = filtersAdapter;
        Object.freeze(this);
    }
    get length() { return this.#filtersData.filters.length; }
    *[Symbol.iterator]() {
        if (this.#filtersData.filters.length === 0) {
            return;
        }
        for (const entry of this.#filtersData.filters) {
            yield { ...entry };
        }
    }
    add(...filters) {
        /**
         * Tracks the number of filters added that have subscriber functionality.
         */
        let subscribeCount = 0;
        for (const filter of filters) {
            const filterType = typeof filter;
            if (filterType !== 'function' && (filterType !== 'object' || filter === null)) {
                throw new TypeError(`AdapterFilters error: 'filter' is not a function or object.`);
            }
            let data;
            let subscribeFn;
            if (filterType === 'function') {
                data = {
                    id: void 0,
                    filter: filter,
                    weight: 1
                };
                subscribeFn = filter.subscribe;
            }
            else if (filterType === 'object') {
                if ('filter' in filter) {
                    if (typeof filter.filter !== 'function') {
                        throw new TypeError(`AdapterFilters error: 'filter' attribute is not a function.`);
                    }
                    if (filter.weight !== void 0 && (typeof filter.weight !== 'number' ||
                        filter.weight < 0 || filter.weight > 1)) {
                        throw new TypeError(`AdapterFilters error: 'weight' attribute is not a number between '0 - 1' inclusive.`);
                    }
                    data = {
                        id: filter.id !== void 0 ? filter.id : void 0,
                        filter: filter.filter,
                        weight: filter.weight || 1
                    };
                    subscribeFn = filter.filter.subscribe ?? filter.subscribe;
                }
                else {
                    throw new TypeError(`AdapterFilters error: 'filter' attribute is not a function.`);
                }
                /* c8 ignore next 5 */ // TS type guard for `else` conditional.
            }
            else {
                throw new TypeError(`AdapterFilters error: 'filter' is not defined.`);
            }
            // Find the index to insert where data.weight is less than existing values weight.
            const index = this.#filtersData.filters.findIndex((value) => {
                return data.weight < value.weight;
            });
            // If an index was found insert at that location.
            if (index >= 0) {
                this.#filtersData.filters.splice(index, 0, data);
            }
            else // push to end of filters.
             {
                this.#filtersData.filters.push(data);
            }
            if (typeof subscribeFn === 'function') {
                const unsubscribe = subscribeFn(this.#indexUpdate);
                // Ensure that unsubscribe is a function.
                if (typeof unsubscribe !== 'function') {
                    throw new TypeError('AdapterFilters error: Filter has subscribe function, but no unsubscribe function is returned.');
                }
                // Ensure that the same filter is not subscribed to multiple times.
                if (this.#mapUnsubscribe.has(data.filter)) {
                    throw new Error('AdapterFilters error: Filter added already has an unsubscribe function registered.');
                }
                this.#mapUnsubscribe.set(data.filter, unsubscribe);
                subscribeCount++;
            }
        }
        // Filters with subscriber functionality are assumed to immediately invoke the `subscribe` callback. If the
        // subscriber count is less than the amount of filters added then automatically trigger an index update manually.
        if (subscribeCount < filters.length) {
            this.#indexUpdate(true);
        }
    }
    clear() {
        this.#filtersData.filters.length = 0;
        // Unsubscribe from all filters with subscription support.
        for (const unsubscribe of this.#mapUnsubscribe.values()) {
            unsubscribe();
        }
        this.#mapUnsubscribe.clear();
        this.#indexUpdate();
    }
    remove(...filters) {
        const length = this.#filtersData.filters.length;
        if (length === 0) {
            return;
        }
        for (const data of filters) {
            // Handle the case that the filter may either be a function or a filter entry / object.
            const actualFilter = typeof data === 'function' ? data : data !== null && typeof data === 'object' ?
                data.filter : void 0;
            if (!actualFilter) {
                continue;
            }
            for (let cntr = this.#filtersData.filters.length; --cntr >= 0;) {
                if (this.#filtersData.filters[cntr].filter === actualFilter) {
                    this.#filtersData.filters.splice(cntr, 1);
                    // Invoke any unsubscribe function for given filter then remove from tracking.
                    let unsubscribe;
                    if (typeof (unsubscribe = this.#mapUnsubscribe.get(actualFilter)) === 'function') {
                        unsubscribe();
                        this.#mapUnsubscribe.delete(actualFilter);
                    }
                }
            }
        }
        // Update the index a filter was removed.
        if (length !== this.#filtersData.filters.length) {
            this.#indexUpdate(true);
        }
    }
    removeBy(callback) {
        const length = this.#filtersData.filters.length;
        if (length === 0) {
            return;
        }
        if (typeof callback !== 'function') {
            throw new TypeError(`AdapterFilters error: 'callback' is not a function.`);
        }
        this.#filtersData.filters = this.#filtersData.filters.filter((data) => {
            const remove = callback.call(callback, { ...data });
            if (remove) {
                let unsubscribe;
                if (typeof (unsubscribe = this.#mapUnsubscribe.get(data.filter)) === 'function') {
                    unsubscribe();
                    this.#mapUnsubscribe.delete(data.filter);
                }
            }
            // Reverse remove boolean to properly filter / remove this filter.
            return !remove;
        });
        if (length !== this.#filtersData.filters.length) {
            this.#indexUpdate(true);
        }
    }
    removeById(...ids) {
        const length = this.#filtersData.filters.length;
        if (length === 0) {
            return;
        }
        this.#filtersData.filters = this.#filtersData.filters.filter((data) => {
            let remove = 0;
            for (const id of ids) {
                remove |= (data.id === id ? 1 : 0);
            }
            // If not keeping invoke any unsubscribe function for given filter then remove from tracking.
            if (!!remove) {
                let unsubscribe;
                if (typeof (unsubscribe = this.#mapUnsubscribe.get(data.filter)) === 'function') {
                    unsubscribe();
                    this.#mapUnsubscribe.delete(data.filter);
                }
            }
            return !remove; // Swap here to actually remove the item via array filter method.
        });
        if (length !== this.#filtersData.filters.length) {
            this.#indexUpdate(true);
        }
    }
}

/**
 * Provides construction and management of indexed data when there are parent indexes or filter / sort functions
 * applied.
 */
class AdapterIndexer {
    derivedAdapter;
    filtersData;
    hostData;
    hostUpdate;
    indexData;
    sortData;
    sortFn;
    destroyed = false;
    /**
     * @param hostData - Hosted data structure.
     *
     * @param hostUpdate - Host update function invoked on index updates.
     *
     * @param [parentIndexer] - Any associated parent index API.
     *
     * @returns Indexer adapter instance.
     */
    constructor(hostData, hostUpdate, parentIndexer) {
        this.hostData = hostData;
        this.hostUpdate = hostUpdate;
        this.indexData = { index: null, hash: null, reversed: false, parent: parentIndexer };
    }
    /**
     * @returns Returns whether the index is active.
     */
    get active() {
        return this.filtersData.filters.length > 0 || this.sortData.compareFn !== null ||
            this.indexData.parent?.active === true;
    }
    /**
     * @returns Returns length of reduced index.
     */
    get length() {
        return this.indexData.index ? this.indexData.index.length : 0;
    }
    // -------------------------------------------------------------------------------------------------------------------
    /**
     * Calculates a new hash value for the new index array if any. If the new index array is null then the hash value
     * is set to null. Set calculated new hash value to the index adapter hash value.
     *
     * After hash generation compare old and new hash values and perform an update if they are different. If they are
     * equal check for array equality between the old and new index array and perform an update if they are not equal.
     *
     * @param oldIndex - Old index array.
     *
     * @param oldHash - Old index hash value.
     *
     * @param [force=false] - When true forces an update to subscribers.
     */
    calcHashUpdate(oldIndex, oldHash, force = false) {
        // Use force if a boolean otherwise default to false.
        const actualForce = typeof force === 'boolean' ? force : /* c8 ignore next */ false;
        let newHash = null;
        const newIndex = this.indexData.index;
        if (newIndex) {
            for (let cntr = newIndex.length; --cntr >= 0;) {
                newHash ^= DynReducerUtils.hashUnknown(newIndex[cntr]) + 0x9e3779b9 + (newHash << 6) + (newHash >> 2);
            }
        }
        this.indexData.hash = newHash;
        if (actualForce || (oldHash === newHash ? !DynReducerUtils.arrayEquals(oldIndex, newIndex) : true)) {
            this.hostUpdate();
        }
    }
    /**
     * Destroys all resources.
     */
    destroy() {
        if (this.destroyed) {
            return;
        }
        this.hostData = null;
        this.indexData.index = null;
        this.indexData.hash = null;
        this.indexData.reversed = false;
        this.indexData.parent = null;
        this.destroyed = true;
    }
    /**
     * Store associated filter and sort data that are constructed after the indexer.
     *
     * @param filtersData - Associated AdapterFilters instance.
     *
     * @param sortData - Associated AdapterSort instance.
     *
     * @param derivedAdapter - Associated AdapterDerived instance.
     */
    initAdapters(filtersData, sortData, derivedAdapter) {
        this.filtersData = filtersData;
        this.sortData = sortData;
        this.derivedAdapter = derivedAdapter;
        this.sortFn = this.createSortFn();
    }
}

class AdapterSort {
    #sortData;
    #indexUpdate;
    #unsubscribe;
    constructor(indexUpdate, sortData) {
        this.#indexUpdate = indexUpdate;
        this.#sortData = sortData;
        Object.freeze(this);
    }
    clear() {
        const oldCompareFn = this.#sortData.compareFn;
        this.#sortData.compareFn = null;
        if (typeof this.#unsubscribe === 'function') {
            this.#unsubscribe();
            this.#unsubscribe = void 0;
        }
        // Only update index if an old compare function is set.
        if (typeof oldCompareFn === 'function') {
            this.#indexUpdate(true);
        }
    }
    set(sort) {
        if (typeof this.#unsubscribe === 'function') {
            this.#unsubscribe();
            this.#unsubscribe = void 0;
        }
        let compareFn;
        let subscribeFn;
        switch (typeof sort) {
            case 'function':
                compareFn = sort;
                subscribeFn = sort.subscribe;
                break;
            case 'object':
                // Early out if sort is null / noop.
                if (sort === null) {
                    break;
                }
                if (typeof sort.compare !== 'function') {
                    throw new TypeError(`AdapterSort error: 'compare' attribute is not a function.`);
                }
                compareFn = sort.compare;
                subscribeFn = sort.compare.subscribe ?? sort.subscribe;
                break;
        }
        if (typeof compareFn === 'function') {
            this.#sortData.compareFn = compareFn;
        }
        else {
            const oldCompareFn = this.#sortData.compareFn;
            this.#sortData.compareFn = null;
            // Update index if the old compare function exists.
            if (typeof oldCompareFn === 'function') {
                this.#indexUpdate();
            }
            return;
        }
        if (typeof subscribeFn === 'function') {
            this.#unsubscribe = subscribeFn(this.#indexUpdate);
            // Ensure that unsubscribe is a function.
            if (typeof this.#unsubscribe !== 'function') {
                throw new Error(`AdapterSort error: sort has 'subscribe' function, but no 'unsubscribe' function is returned.`);
            }
        }
        else {
            // A sort function with subscriber functionality are assumed to immediately invoke the `subscribe` callback.
            // Only manually update the index if there is no subscriber functionality.
            this.#indexUpdate(true);
        }
    }
}

class IndexerAPI {
    #indexData;
    /**
     * Provides a getter to determine if the index is active.
     */
    active;
    /**
     * Provides length of reduced / indexed elements.
     */
    length;
    /**
     * Manually invoke an update of the index.
     *
     * @param force - Force update to any subscribers.
     */
    update;
    constructor(adapterIndexer) {
        this.#indexData = adapterIndexer.indexData;
        this.update = adapterIndexer.update.bind(adapterIndexer);
        // Defines getters on the public API to get the index hash, active state, and index length.
        Object.defineProperties(this, {
            active: { get: () => adapterIndexer.active },
            length: { get: () => adapterIndexer.length }
        });
        Object.freeze(this);
    }
    get hash() {
        return this.#indexData.hash;
    }
    *[Symbol.iterator]() {
        const indexData = this.#indexData;
        if (!indexData.index) {
            return;
        }
        const reversed = indexData.reversed;
        const length = indexData.index.length;
        if (reversed) {
            for (let cntr = length; --cntr >= 0;) {
                yield indexData.index[cntr];
            }
        }
        else {
            for (let cntr = 0; cntr < length; cntr++) {
                yield indexData.index[cntr];
            }
        }
    }
}

/**
 */
class ArrayIndexer extends AdapterIndexer {
    /**
     * @inheritDoc
     */
    createSortFn() {
        return (a, b) => {
            const data = this.hostData?.[0];
            const dataA = data?.[a];
            const dataB = data?.[b];
            /* c8 ignore next */
            return dataA && dataB ? this.sortData.compareFn(dataA, dataB) : 0;
        };
    }
    /**
     * Provides the custom filter / reduce step that is ~25-40% faster than implementing with `Array.reduce`.
     *
     * Note: Other loop unrolling techniques like Duff's Device gave a slight faster lower bound on large data sets,
     * but the maintenance factor is not worth the extra complication.
     *
     * @returns New filtered index array.
     */
    reduceImpl() {
        const data = [];
        const array = this.hostData?.[0];
        if (!array) {
            return data;
        }
        const filters = this.filtersData.filters;
        let include = true;
        const parentIndex = this.indexData.parent;
        // Source index data is coming from an active parent index.
        if (DynReducerUtils.isIterable(parentIndex) && parentIndex.active) {
            for (const adjustedIndex of parentIndex) {
                const value = array[adjustedIndex];
                include = true;
                for (let filCntr = 0, filLength = filters.length; filCntr < filLength; filCntr++) {
                    if (!filters[filCntr].filter(value)) {
                        include = false;
                        break;
                    }
                }
                if (include) {
                    data.push(adjustedIndex);
                }
            }
        }
        else {
            for (let cntr = 0, length = array.length; cntr < length; cntr++) {
                include = true;
                for (let filCntr = 0, filLength = filters.length; filCntr < filLength; filCntr++) {
                    if (!filters[filCntr].filter(array[cntr])) {
                        include = false;
                        break;
                    }
                }
                if (include) {
                    data.push(cntr);
                }
            }
        }
        return data;
    }
    /**
     * Update the reducer indexes. If there are changes subscribers are notified. If data order is changed externally
     * pass in true to force an update to subscribers.
     *
     * @param [force=false] - When true forces an update to subscribers.
     */
    update(force = false) {
        if (this.destroyed) {
            return;
        }
        const oldIndex = this.indexData.index;
        const oldHash = this.indexData.hash;
        const array = this.hostData?.[0];
        const parentIndex = this.indexData.parent;
        // Clear index if there are no filters and no sort function or the index length doesn't match the item length.
        if ((this.filtersData.filters.length === 0 && !this.sortData.compareFn) ||
            (this.indexData.index && array?.length !== this.indexData.index.length)) {
            this.indexData.index = null;
        }
        // If there are filters build new index.
        if (this.filtersData.filters.length > 0) {
            this.indexData.index = this.reduceImpl();
        }
        // If the index isn't built yet and there is an active parent index then create it from the parent.
        if (!this.indexData.index && parentIndex?.active) {
            this.indexData.index = [...parentIndex];
        }
        if (this.sortData.compareFn && Array.isArray(array)) {
            // If there is no index then create one with keys matching host item length.
            if (!this.indexData.index) {
                this.indexData.index = [...Array(array.length).keys()];
            }
            this.indexData.index.sort(this.sortFn);
        }
        this.calcHashUpdate(oldIndex, oldHash, force);
        // Update all derived reducers.
        this.derivedAdapter?.update(force);
    }
}

/**
 * Provides a public API for managing derived reducers.
 */
class DerivedListAPI {
    clear;
    create;
    delete;
    destroy;
    get;
    constructor(adapterDerived) {
        this.clear = adapterDerived.clear.bind(adapterDerived);
        this.create = adapterDerived.create.bind(adapterDerived);
        this.delete = adapterDerived.delete.bind(adapterDerived);
        this.destroy = adapterDerived.destroy.bind(adapterDerived);
        this.get = adapterDerived.get.bind(adapterDerived);
        Object.freeze(this);
    }
}

/**
 * Provides the base implementation derived reducer for arrays / DynArrayReducer.
 *
 * Note: That you should never directly create an instance of a derived reducer, but instead use the
 * {@link DynArrayReducerDerived.initialize} function to set up any initial state in a custom derived reducer.
 *
 * @typeParam T `unknown` - Type of data. Defaults to `unknown` to enforce type safety when no type is specified.
 */
class DynArrayReducerDerived {
    #array;
    #derived;
    #derivedPublicAPI;
    #filters;
    #filtersData = { filters: [] };
    #index;
    #indexPublicAPI;
    #sort;
    #sortData = { compareFn: null };
    #subscribers = [];
    #destroyed = false;
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
    constructor(array, parentIndex, options) {
        this.#array = array;
        this.#index = new ArrayIndexer(this.#array, this.#updateSubscribers.bind(this), parentIndex);
        this.#indexPublicAPI = new IndexerAPI(this.#index);
        this.#filters = new AdapterFilters(this.#indexPublicAPI.update, this.#filtersData);
        this.#sort = new AdapterSort(this.#indexPublicAPI.update, this.#sortData);
        this.#derived = new AdapterDerived(this.#array, this.#indexPublicAPI, DynArrayReducerDerived);
        this.#derivedPublicAPI = new DerivedListAPI(this.#derived);
        this.#index.initAdapters(this.#filtersData, this.#sortData, this.#derived);
        const { filters, sort } = options;
        if (filters !== void 0) {
            if (!DynReducerUtils.isIterable(filters)) {
                throw new TypeError(`DerivedArrayReducer error (DataDerivedOptions): 'filters' attribute is not iterable.`);
            }
            this.filters.add(...filters);
        }
        if (sort !== void 0) {
            if (typeof sort !== 'function' && (typeof sort !== 'object' || sort === null)) {
                throw new TypeError(`DerivedArrayReducer error (DataDerivedOptions): 'sort' attribute is not a function or object.`);
            }
            this.sort.set(sort);
        }
    }
    /**
     * @returns Derived public API.
     */
    get derived() { return this.#derivedPublicAPI; }
    /**
     * @returns The filters adapter.
     */
    get filters() { return this.#filters; }
    /**
     * @returns Returns the Indexer public API; is also iterable.
     */
    get index() { return this.#indexPublicAPI; }
    /**
     * @returns Returns whether this derived reducer is destroyed.
     */
    get destroyed() { return this.#destroyed; }
    /**
     * @returns Returns the main data items or indexed items length.
     */
    get length() {
        const array = this.#array?.[0];
        return this.#index.active ? this.index.length :
            array ? array.length : 0;
    }
    /**
     * @returns Returns current reversed state.
     */
    get reversed() { return this.#index.indexData.reversed; }
    /**
     * @returns The sort adapter.
     */
    get sort() { return this.#sort; }
    /**
     * Sets reversed state and notifies subscribers.
     *
     * @param reversed - New reversed state.
     */
    set reversed(reversed) {
        if (typeof reversed !== 'boolean') {
            throw new TypeError(`DerivedArrayReducer.reversed error: 'reversed' is not a boolean.`);
        }
        this.#index.indexData.reversed = reversed;
        // Recalculate index and force an update to any subscribers.
        this.index.update(true);
    }
    /**
     * Removes all derived reducers, subscriptions, and cleans up all resources.
     */
    destroy() {
        this.#destroyed = true;
        // Remove any external data reference and perform a final update.
        this.#array = null;
        this.index.update(true);
        // Remove all subscriptions.
        this.#subscribers.length = 0;
        this.#derived.destroy();
        this.#index.destroy();
        this.#filters.clear();
        this.#sort.clear();
    }
    /**
     * Provides a callback for custom derived reducers to initialize any data / custom configuration. This allows
     * child classes to avoid implementing the constructor.
     *
     * @param [optionsRest] - Any additional custom options passed beyond {@link DynReducer.Options.Common}.
     *
     * @protected
     */
    initialize(optionsRest) { }
    /**
     * Provides an iterator for data stored in DynArrayReducerDerived.
     *
     * @returns Iterator for data stored in DynArrayReducerDerived.
     */
    *[Symbol.iterator]() {
        const array = this.#array?.[0] ?? null;
        if (this.#destroyed || array === null || array?.length === 0) {
            return;
        }
        if (this.#index.active) {
            for (const entry of this.index) {
                yield array[entry];
            }
        }
        else {
            if (this.reversed) {
                for (let cntr = array.length; --cntr >= 0;) {
                    yield array[cntr];
                }
            }
            else {
                for (let cntr = 0; cntr < array.length; cntr++) {
                    yield array[cntr];
                }
            }
        }
    }
    // -------------------------------------------------------------------------------------------------------------------
    /**
     * Subscribe to this DerivedArrayReducer.
     *
     * @param handler - Callback function that is invoked on update / changes. Receives `this` reference.
     *
     * @returns Unsubscribe function.
     */
    subscribe(handler) {
        const currentIdx = this.#subscribers.findIndex((entry) => entry === handler);
        if (currentIdx === -1) {
            this.#subscribers.push(handler);
            handler(this); // call handler with current value
        }
        // Return unsubscribe function.
        return () => {
            const existingIdx = this.#subscribers.findIndex((entry) => entry === handler);
            if (existingIdx !== -1) {
                this.#subscribers.splice(existingIdx, 1);
            }
        };
    }
    /**
     * Updates subscribers on changes.
     */
    #updateSubscribers() {
        for (let cntr = 0; cntr < this.#subscribers.length; cntr++) {
            this.#subscribers[cntr](this);
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
class DynArrayReducer {
    #array = [null];
    #derived;
    #derivedPublicAPI;
    #filters;
    #filtersData = { filters: [] };
    #index;
    #indexPublicAPI;
    #sort;
    #sortData = { compareFn: null };
    #subscribers = [];
    #destroyed = false;
    /**
     * Initializes DynArrayReducer. Any iterable is supported for initial data. Take note that if `data` is an array it
     * will be used as the host array and not copied. All non-array iterables otherwise create a new array / copy.
     *
     * @param [data] - Data iterable to store if array or copy otherwise.
     *
     * @typeParam T `unknown` - Type of data.
     */
    constructor(data) {
        let dataIterable;
        let filters;
        let sort;
        if (data === null) {
            throw new TypeError(`DynArrayReducer error: 'data' is not iterable.`);
        }
        if (data !== void 0 && typeof data !== 'object' && !DynReducerUtils.isIterable(data)) {
            throw new TypeError(`DynArrayReducer error: 'data' is not iterable.`);
        }
        if (data !== void 0 && Symbol.iterator in data) {
            dataIterable = data;
        }
        else if (data !== void 0 && ('data' in data || 'filters' in data || 'sort' in data)) {
            if (data.data !== void 0 && !DynReducerUtils.isIterable(data.data)) {
                throw new TypeError(`DynArrayReducer error (DataDynArray): 'data' attribute is not iterable.`);
            }
            dataIterable = data.data;
            if (data.filters !== void 0) {
                if (DynReducerUtils.isIterable(data.filters)) {
                    filters = data.filters;
                }
                else {
                    throw new TypeError(`DynArrayReducer error (DataDynArray): 'filters' attribute is not iterable.`);
                }
            }
            if (data.sort !== void 0) {
                if (typeof data.sort === 'function') {
                    sort = data.sort;
                }
                else if (typeof data.sort === 'object' && data.sort !== null) {
                    sort = data.sort;
                }
                else {
                    throw new TypeError(`DynArrayReducer error (DataDynArray): 'sort' attribute is not a function or object.`);
                }
            }
        }
        // In the case of the main data being an array directly use the array otherwise create a copy.
        if (dataIterable) {
            this.#array[0] = Array.isArray(dataIterable) ? dataIterable : [...dataIterable];
        }
        this.#index = new ArrayIndexer(this.#array, this.#updateSubscribers.bind(this));
        this.#indexPublicAPI = new IndexerAPI(this.#index);
        this.#filters = new AdapterFilters(this.#indexPublicAPI.update, this.#filtersData);
        this.#sort = new AdapterSort(this.#indexPublicAPI.update, this.#sortData);
        this.#derived = new AdapterDerived(this.#array, this.#indexPublicAPI, DynArrayReducerDerived);
        this.#derivedPublicAPI = new DerivedListAPI(this.#derived);
        this.#index.initAdapters(this.#filtersData, this.#sortData, this.#derived);
        // Add any filters and sort function defined by DataDynArray.
        if (filters) {
            this.filters.add(...filters);
        }
        if (sort) {
            this.sort.set(sort);
        }
    }
    /**
     * Returns the internal data of this instance. Be careful!
     *
     * Note: if an array is set as initial data then that array is used as the internal data. If any changes are
     * performed to the data externally do invoke `update` via {@link DynArrayReducer.index} with `true` to recalculate
     * the index and notify all subscribers.
     *
     * @returns The internal data.
     */
    get data() { return this.#array[0]; }
    /**
     * @returns Derived public API.
     */
    get derived() { return this.#derivedPublicAPI; }
    /**
     * @returns The filters adapter.
     */
    get filters() { return this.#filters; }
    /**
     * @returns Returns the Indexer public API; is also iterable.
     */
    get index() { return this.#indexPublicAPI; }
    /**
     * @returns Returns whether this instance is destroyed.
     */
    get destroyed() { return this.#destroyed; }
    /**
     * @returns Returns the main data items or indexed items length.
     */
    get length() {
        const array = this.#array[0];
        return this.#index.active ? this.#indexPublicAPI.length :
            array ? array.length : 0;
    }
    /**
     * @returns Returns current reversed state.
     */
    get reversed() { return this.#index.indexData.reversed; }
    /**
     * @returns The sort adapter.
     */
    get sort() { return this.#sort; }
    /**
     * Sets reversed state and notifies subscribers.
     *
     * @param reversed - New reversed state.
     */
    set reversed(reversed) {
        if (typeof reversed !== 'boolean') {
            throw new TypeError(`DynArrayReducer.reversed error: 'reversed' is not a boolean.`);
        }
        this.#index.indexData.reversed = reversed;
        // Recalculate index and force an update to any subscribers.
        this.index.update(true);
    }
    /**
     * Removes all derived reducers, subscriptions, and cleans up all resources.
     */
    destroy() {
        if (this.#destroyed) {
            return;
        }
        this.#destroyed = true;
        this.#derived.destroy();
        // Set the backing data to null and provide a final update.
        this.#array = [null];
        this.index.update(true);
        // Remove all subscriptions.
        this.#subscribers.length = 0;
        this.#filters.clear();
        this.#sort.clear();
        this.#index.destroy();
    }
    /**
     * Provides a callback for custom reducers to initialize any data / custom configuration. Depending on the consumer
     * of `dynamic-reducer` this may be utilized allowing child classes to avoid implementing the constructor.
     *
     * @param [optionsRest] - Any additional custom options passed beyond {@link DynReducer.Options.Common}.
     *
     * @protected
     */
    /* c8 ignore next */
    initialize(optionsRest) { }
    /**
     * Removes internal data and pushes new data. This does not destroy any initial array set to internal data unless
     * `replace` is set to true.
     *
     * @param data - New data to set to internal data.
     *
     * @param [replace=false] - New data to set to internal data.
     */
    setData(data, replace = false) {
        if (data !== null && !DynReducerUtils.isIterable(data)) {
            throw new TypeError(`DynArrayReducer.setData error: 'data' is not iterable.`);
        }
        if (typeof replace !== 'boolean') {
            throw new TypeError(`DynArrayReducer.setData error: 'replace' is not a boolean.`);
        }
        const array = this.#array[0];
        // If the array isn't defined or 'replace' is true then replace internal data with new array or create an array
        // from an iterable.
        if (!Array.isArray(array) || replace) {
            if (data) {
                this.#array[0] = Array.isArray(data) ? data : [...data];
            }
        }
        else {
            if (data) {
                // Remove all entries in internal data. This will not replace any initially set array.
                array.length = 0;
                // Add all new data.
                array.push(...data);
            }
            else {
                this.#array[0] = null;
            }
        }
        // Force clear the index and always rebuild.
        this.#index.indexData.index = null;
        // Recalculate index and force an update to any subscribers.
        this.index.update(true);
    }
    /**
     * Add a subscriber to this DynArrayReducer instance.
     *
     * @param handler - Callback function that is invoked on update / changes. Receives `this` reference.
     *
     * @returns Unsubscribe function.
     */
    subscribe(handler) {
        const currentIdx = this.#subscribers.findIndex((entry) => entry === handler);
        if (currentIdx === -1) {
            this.#subscribers.push(handler);
            handler(this); // call handler with current value
        }
        // Return unsubscribe function.
        return () => {
            const existingIdx = this.#subscribers.findIndex((entry) => entry === handler);
            if (existingIdx !== -1) {
                this.#subscribers.splice(existingIdx, 1);
            }
        };
    }
    /**
     * Updates subscribers on changes.
     */
    #updateSubscribers() {
        for (let cntr = 0; cntr < this.#subscribers.length; cntr++) {
            this.#subscribers[cntr](this);
        }
    }
    /**
     * Provides an iterator for data stored in DynArrayReducer.
     *
     * @returns Iterator for data stored in DynArrayReducer.
     */
    *[Symbol.iterator]() {
        const array = this.#array[0];
        if (this.#destroyed || array === null || array?.length === 0) {
            return;
        }
        if (this.#index.active) {
            for (const entry of this.index) {
                yield array[entry];
            }
        }
        else {
            if (this.reversed) {
                for (let cntr = array.length; --cntr >= 0;) {
                    yield array[cntr];
                }
            }
            else {
                for (let cntr = 0; cntr < array.length; cntr++) {
                    yield array[cntr];
                }
            }
        }
    }
}

/**
 */
class MapIndexer extends AdapterIndexer {
    /**
     * @inheritDoc
     */
    createSortFn() {
        return (a, b) => {
            const data = this.hostData?.[0];
            const dataA = data?.get(a);
            const dataB = data?.get(b);
            /* c8 ignore next */
            return dataA && dataB ? this.sortData.compareFn(dataA, dataB) : 0;
        };
    }
    /**
     * Provides the custom filter / reduce step that is ~25-40% faster than implementing with `Array.reduce`.
     *
     * Note: Other loop unrolling techniques like Duff's Device gave a slight faster lower bound on large data sets,
     * but the maintenance factor is not worth the extra complication.
     *
     * @returns New filtered index array.
     */
    reduceImpl() {
        const data = [];
        const map = this.hostData?.[0];
        if (!map) {
            return data;
        }
        const filters = this.filtersData.filters;
        let include = true;
        const parentIndex = this.indexData.parent;
        // Source index data is coming from an active parent index.
        if (DynReducerUtils.isIterable(parentIndex) && parentIndex.active) {
            for (const key of parentIndex) {
                const value = map.get(key);
                include = true;
                /* c8 ignore next */
                if (value === undefined) {
                    continue;
                }
                for (let filCntr = 0, filLength = filters.length; filCntr < filLength; filCntr++) {
                    if (!filters[filCntr].filter(value)) {
                        include = false;
                        break;
                    }
                }
                if (include) {
                    data.push(key);
                }
            }
        }
        else {
            for (const key of map.keys()) {
                include = true;
                const value = map.get(key);
                /* c8 ignore next */
                if (value === void 0) {
                    continue;
                }
                for (let filCntr = 0, filLength = filters.length; filCntr < filLength; filCntr++) {
                    if (!filters[filCntr].filter(value)) {
                        include = false;
                        break;
                    }
                }
                if (include) {
                    data.push(key);
                }
            }
        }
        return data;
    }
    /**
     * Update the reducer indexes. If there are changes subscribers are notified. If data order is changed externally
     * pass in true to force an update to subscribers.
     *
     * @param [force=false] - When true forces an update to subscribers.
     */
    update(force = false) {
        if (this.destroyed) {
            return;
        }
        const oldIndex = this.indexData.index;
        const oldHash = this.indexData.hash;
        const map = this.hostData?.[0];
        const parentIndex = this.indexData.parent;
        // Clear index if there are no filters and no sort function or the index length doesn't match the item length.
        if ((this.filtersData.filters.length === 0 && !this.sortData.compareFn) ||
            (this.indexData.index && map?.size !== this.indexData.index.length)) {
            this.indexData.index = null;
        }
        // If there are filters build new index.
        if (this.filtersData.filters.length > 0) {
            this.indexData.index = this.reduceImpl();
        }
        // If the index isn't built yet and there is an active parent index then create it from the parent.
        if (!this.indexData.index && parentIndex?.active) {
            this.indexData.index = [...parentIndex];
        }
        if (this.sortData.compareFn && map instanceof Map) {
            // If there is no index then create one with keys matching host item length.
            if (!this.indexData.index) {
                this.indexData.index = [...map.keys()];
            }
            this.indexData.index.sort(this.sortFn);
        }
        this.calcHashUpdate(oldIndex, oldHash, force);
        // Update all derived reducers.
        this.derivedAdapter?.update(force);
    }
}

/**
 * Provides a public API for managing derived reducers.
 */
class DerivedMapAPI {
    clear;
    create;
    delete;
    destroy;
    get;
    constructor(adapterDerived) {
        this.clear = adapterDerived.clear.bind(adapterDerived);
        this.create = adapterDerived.create.bind(adapterDerived);
        this.delete = adapterDerived.delete.bind(adapterDerived);
        this.destroy = adapterDerived.destroy.bind(adapterDerived);
        this.get = adapterDerived.get.bind(adapterDerived);
        Object.freeze(this);
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
class DynMapReducerDerived {
    #map;
    #derived;
    #derivedPublicAPI;
    #filters;
    #filtersData = { filters: [] };
    #index;
    #indexPublicAPI;
    #sort;
    #sortData = { compareFn: null };
    #subscribers = [];
    #destroyed = false;
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
    constructor(map, parentIndex, options) {
        this.#map = map;
        this.#index = new MapIndexer(this.#map, this.#updateSubscribers.bind(this), parentIndex);
        this.#indexPublicAPI = new IndexerAPI(this.#index);
        this.#filters = new AdapterFilters(this.#indexPublicAPI.update, this.#filtersData);
        this.#sort = new AdapterSort(this.#indexPublicAPI.update, this.#sortData);
        this.#derived = new AdapterDerived(this.#map, this.#indexPublicAPI, DynMapReducerDerived);
        this.#derivedPublicAPI = new DerivedMapAPI(this.#derived);
        this.#index.initAdapters(this.#filtersData, this.#sortData, this.#derived);
        const { filters, sort } = options;
        if (filters !== void 0) {
            if (!DynReducerUtils.isIterable(filters)) {
                throw new TypeError(`DerivedMapReducer error (DataDerivedOptions): 'filters' attribute is not iterable.`);
            }
            this.filters.add(...filters);
        }
        if (sort !== void 0) {
            if (typeof sort !== 'function' && (typeof sort !== 'object' || sort === null)) {
                throw new TypeError(`DerivedMapReducer error (DataDerivedOptions): 'sort' attribute is not a function or object.`);
            }
            this.sort.set(sort);
        }
    }
    /**
     * @returns Derived public API.
     */
    get derived() { return this.#derivedPublicAPI; }
    /**
     * @returns The filters adapter.
     */
    get filters() { return this.#filters; }
    /**
     * @returns Returns the Indexer public API; is also iterable.
     */
    get index() { return this.#indexPublicAPI; }
    /**
     * @returns Returns whether this derived reducer is destroyed.
     */
    get destroyed() { return this.#destroyed; }
    /**
     * @returns Returns the main data items or indexed items length.
     */
    get length() {
        const map = this.#map?.[0];
        return this.#index.active ? this.index.length :
            map ? map.size : 0;
    }
    /**
     * @returns Returns current reversed state.
     */
    get reversed() { return this.#index.indexData.reversed; }
    /**
     * @returns Returns the sort adapter.
     */
    get sort() { return this.#sort; }
    /**
     * Sets reversed state and notifies subscribers.
     *
     * @param reversed - New reversed state.
     */
    set reversed(reversed) {
        if (typeof reversed !== 'boolean') {
            throw new TypeError(`DerivedMapReducer.reversed error: 'reversed' is not a boolean.`);
        }
        this.#index.indexData.reversed = reversed;
        // Recalculate index and force an update to any subscribers.
        this.index.update(true);
    }
    /**
     * Removes all derived reducers, subscriptions, and cleans up all resources.
     */
    destroy() {
        this.#destroyed = true;
        // Remove any external data reference and perform a final update.
        this.#map = [null];
        this.#index.update(true);
        // Remove all subscriptions.
        this.#subscribers.length = 0;
        this.#derived.destroy();
        this.#index.destroy();
        this.#filters.clear();
        this.#sort.clear();
    }
    /**
     * Provides a callback for custom derived reducers to initialize any data / custom configuration. This allows
     * child classes to avoid implementing the constructor.
     *
     * @param [optionsRest] - Any additional custom options passed beyond {@link DynDataOptions}.
     *
     * @protected
     */
    initialize(optionsRest) { }
    /**
     * Provides an iterator for data stored in DynMapReducerDerived.
     *
     * @returns Iterator for data stored in DynMapReducerDerived.
     */
    *[Symbol.iterator]() {
        const map = this.#map?.[0] ?? null;
        if (this.#destroyed || map === null || map?.size === 0) {
            return;
        }
        if (this.#index.active) {
            for (const key of this.index) {
                yield map.get(key);
            }
        }
        else {
            if (this.reversed) {
                // TODO: Not efficient due to creating temporary values array.
                const values = [...map.values()];
                for (let cntr = values.length; --cntr >= 0;) {
                    yield values[cntr];
                }
            }
            else {
                for (const value of map.values()) {
                    yield value;
                }
            }
        }
    }
    // -------------------------------------------------------------------------------------------------------------------
    /**
     * Subscribe to this DerivedMapReducer.
     *
     * @param handler - Callback function that is invoked on update / changes. Receives `this` reference.
     *
     * @returns Unsubscribe function.
     */
    subscribe(handler) {
        const currentIdx = this.#subscribers.findIndex((entry) => entry === handler);
        if (currentIdx === -1) {
            this.#subscribers.push(handler);
            handler(this); // call handler with current value
        }
        // Return unsubscribe function.
        return () => {
            const existingIdx = this.#subscribers.findIndex((entry) => entry === handler);
            if (existingIdx !== -1) {
                this.#subscribers.splice(existingIdx, 1);
            }
        };
    }
    /**
     * Updates subscribers on changes.
     */
    #updateSubscribers() {
        for (let cntr = 0; cntr < this.#subscribers.length; cntr++) {
            this.#subscribers[cntr](this);
        }
    }
}

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
class DynMapReducer {
    #map = [null];
    #derived;
    #derivedPublicAPI;
    #filters;
    #filtersData = { filters: [] };
    #index;
    #indexPublicAPI;
    #sort;
    #sortData = { compareFn: null };
    #subscribers = [];
    #destroyed = false;
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
    constructor(data) {
        let dataMap;
        let filters;
        let sort;
        if (data === null) {
            throw new TypeError(`DynMapReducer error: 'data' is not an object or Map.`);
        }
        if (data !== void 0 && typeof data !== 'object' && !(data instanceof Map)) {
            throw new TypeError(`DynMapReducer error: 'data' is not an object or Map.`);
        }
        if (data !== void 0 && data instanceof Map) {
            dataMap = data;
        }
        else if (data !== void 0 && ('data' in data || 'filters' in data || 'sort' in data)) {
            if (data.data !== void 0 && !(data.data instanceof Map)) {
                throw new TypeError(`DynMapReducer error (DataDynMap): 'data' attribute is not a Map.`);
            }
            if (data.data instanceof Map) {
                dataMap = data.data;
            }
            if (data.filters !== void 0) {
                if (DynReducerUtils.isIterable(data.filters)) {
                    filters = data.filters;
                }
                else {
                    throw new TypeError(`DynMapReducer error (DataDynMap): 'filters' attribute is not iterable.`);
                }
            }
            if (data.sort !== void 0) {
                if (typeof data.sort === 'function') {
                    sort = data.sort;
                }
                else if (typeof data.sort === 'object' && data.sort !== null) {
                    sort = data.sort;
                }
                else {
                    throw new TypeError(`DynMapReducer error (DataDynMap): 'sort' attribute is not a function or object.`);
                }
            }
        }
        // In the case of the main data being an array directly use the array otherwise create a copy.
        if (dataMap) {
            this.#map[0] = dataMap;
        }
        this.#index = new MapIndexer(this.#map, this.#updateSubscribers.bind(this));
        this.#indexPublicAPI = new IndexerAPI(this.#index);
        this.#filters = new AdapterFilters(this.#indexPublicAPI.update, this.#filtersData);
        this.#sort = new AdapterSort(this.#indexPublicAPI.update, this.#sortData);
        this.#derived = new AdapterDerived(this.#map, this.#indexPublicAPI, DynMapReducerDerived);
        this.#derivedPublicAPI = new DerivedMapAPI(this.#derived);
        this.#index.initAdapters(this.#filtersData, this.#sortData, this.#derived);
        // Add any filters and sort function defined by DataDynMap.
        if (filters) {
            this.filters.add(...filters);
        }
        if (sort) {
            this.sort.set(sort);
        }
    }
    /**
     * Returns the internal data of this instance. Be careful!
     *
     * Note: When a map is set as data then that map is used as the internal data. If any changes are performed to the
     * data externally do invoke `update` via {@link DynMapReducer.index} with `true` to recalculate the  index and
     * notify all subscribers.
     *
     * @returns The internal data.
     */
    get data() { return this.#map[0]; }
    /**
     * @returns Derived public API.
     */
    get derived() { return this.#derivedPublicAPI; }
    /**
     * @returns The filters adapter.
     */
    get filters() { return this.#filters; }
    /**
     * @returns Returns the Indexer public API; is also iterable.
     */
    get index() { return this.#indexPublicAPI; }
    /**
     * @returns Returns whether this instance is destroyed.
     */
    get destroyed() { return this.#destroyed; }
    /**
     * @returns Returns the main data items or indexed items length.
     */
    get length() {
        const map = this.#map[0];
        return this.#index.active ? this.#indexPublicAPI.length :
            map ? map.size : 0;
    }
    /**
     * @returns Returns current reversed state.
     */
    get reversed() { return this.#index.indexData.reversed; }
    /**
     * @returns The sort adapter.
     */
    get sort() { return this.#sort; }
    /**
     * Sets reversed state and notifies subscribers.
     *
     * @param reversed - New reversed state.
     */
    set reversed(reversed) {
        if (typeof reversed !== 'boolean') {
            throw new TypeError(`DynMapReducer.reversed error: 'reversed' is not a boolean.`);
        }
        this.#index.indexData.reversed = reversed;
        // Recalculate index and force an update to any subscribers.
        this.index.update(true);
    }
    /**
     * Removes all derived reducers, subscriptions, and cleans up all resources.
     */
    destroy() {
        if (this.#destroyed) {
            return;
        }
        this.#destroyed = true;
        this.#derived.destroy();
        // Set the backing data to null and provide a final update.
        this.#map = [null];
        this.index.update(true);
        // Remove all subscriptions.
        this.#subscribers.length = 0;
        this.#filters.clear();
        this.#sort.clear();
        this.#index.destroy();
    }
    /**
     * Provides a callback for custom reducers to initialize any data / custom configuration. Depending on the consumer
     * of `dynamic-reducer` this may be utilized allowing child classes to avoid implementing the constructor.
     *
     * @param [optionsRest] - Any additional custom options passed beyond {@link DynReducer.Options.Common}.
     *
     * @protected
     */
    /* c8 ignore next */
    initialize(optionsRest) { }
    /**
     * Removes internal data and pushes new data. This does not destroy any initial array set to internal data unless
     * `replace` is set to true.
     *
     * @param data - New data to set to internal data.
     *
     * @param [replace=false] - New data to set to internal data.
     */
    setData(data, replace = false) {
        if (data !== null && !(data instanceof Map)) {
            throw new TypeError(`DynMapReducer.setData error: 'data' is not iterable.`);
        }
        if (typeof replace !== 'boolean') {
            throw new TypeError(`DynMapReducer.setData error: 'replace' is not a boolean.`);
        }
        const map = this.#map[0];
        // If the array isn't defined or 'replace' is true then replace internal data with new array or create an array
        // from an iterable.
        if (!(map instanceof Map) || replace) {
            this.#map[0] = data instanceof Map ? data : null;
        }
        else if (data instanceof Map && map instanceof Map) {
            // Create a set of all current entry IDs.
            const removeKeySet = new Set(map.keys());
            for (const key of data.keys()) {
                map.set(key, data.get(key));
                if (removeKeySet.has(key)) {
                    removeKeySet.delete(key);
                }
            }
            // Remove entries that are no longer in data.
            for (const key of removeKeySet) {
                map.delete(key);
            }
        }
        else if (data === null) {
            this.#map[0] = null;
        }
        // Force clear the index and always rebuild.
        this.#index.indexData.index = null;
        // Recalculate index and force an update to any subscribers.
        this.index.update(true);
    }
    /**
     * Add a subscriber to this DynMapReducer instance.
     *
     * @param handler - Callback function that is invoked on update / changes. Receives `this` reference.
     *
     * @returns Unsubscribe function.
     */
    subscribe(handler) {
        const currentIdx = this.#subscribers.findIndex((entry) => entry === handler);
        if (currentIdx === -1) {
            this.#subscribers.push(handler);
            handler(this); // call handler with current value
        }
        // Return unsubscribe function.
        return () => {
            const existingIdx = this.#subscribers.findIndex((entry) => entry === handler);
            if (existingIdx !== -1) {
                this.#subscribers.splice(existingIdx, 1);
            }
        };
    }
    /**
     * Updates subscribers on changes.
     */
    #updateSubscribers() {
        for (let cntr = 0; cntr < this.#subscribers.length; cntr++) {
            this.#subscribers[cntr](this);
        }
    }
    /**
     * Provides an iterator for data stored in DynMapReducer.
     *
     * @returns Iterator for data stored in DynMapReducer.
     */
    *[Symbol.iterator]() {
        const map = this.#map[0];
        if (this.#destroyed || map === null || map?.size === 0) {
            return;
        }
        if (this.#index.active) {
            for (const key of this.index) {
                yield map.get(key);
            }
        }
        else {
            if (this.reversed) {
                // TODO: Not efficient due to creating temporary values array.
                const values = [...map.values()];
                for (let cntr = values.length; --cntr >= 0;) {
                    yield values[cntr];
                }
            }
            else {
                for (const value of map.values()) {
                    yield value;
                }
            }
        }
    }
}

/**
 * Creates a filter function to compare objects by a given accessor key against a regex test. The returned function
 * is also a writable Svelte store that builds a regex from the stores value.
 *
 * This filter function can be used w/ a dynamic reducer and bound as a store to input elements.
 *
 * @param accessors - Property key / accessors to lookup key to compare. To access deeper
 *        entries into the object format the accessor string with `.` between entries to walk.
 *
 * @param [opts] - Optional parameters.
 *
 * @param [opts.accessWarn=false] - When true warnings will be posted if accessor not retrieved.
 *
 * @param [opts.caseSensitive=false] - When true regex test is case-sensitive.
 *
 * @param [opts.store] - Use the provided minimal writable store to instead of creating a default `writable` store.
 *
 * @returns The query string filter.
 */
function regexObjectQuery(accessors, { accessWarn = false, caseSensitive = false, store } = {}) {
    let keyword = '';
    let regex;
    if (store !== void 0 && !isMinimalWritableStore(store)) {
        throw new TypeError(`regexObjectQuery error: 'store' is not a minimal writable store.`);
    }
    const storeKeyword = store ? store : writable(keyword);
    // If an existing store is provided then set initial values.
    if (store) {
        const current = get(store);
        if (typeof current === 'string') {
            keyword = Strings.normalize(current);
            regex = new RegExp(Strings.escape(keyword), caseSensitive ? '' : 'i');
        }
        else {
            store.set(keyword);
        }
    }
    const filterQuery = Object.assign(
    /**
     * If there is no filter keyword / regex then do not filter otherwise filter based on the regex
     * created from the search input element.
     *
     * @param data - Data object to test against regex.
     *
     * @returns Store filter state.
     */
    (data) => {
        if (keyword === '' || !regex) {
            return true;
        }
        if (isIterable(accessors)) {
            for (const accessor of accessors) {
                const value = safeAccess(data, accessor);
                if (typeof value !== 'string') {
                    if (accessWarn) {
                        console.warn(`regexObjectQuery warning: could not access string data from '${accessor}'.`);
                    }
                    continue;
                }
                if (regex.test(Strings.normalize(value))) {
                    return true;
                }
            }
            return false;
        }
        else {
            const value = safeAccess(data, accessors);
            if (typeof value !== 'string') {
                if (accessWarn) {
                    console.warn(`regexObjectQuery warning: could not access string data from '${accessors}'.`);
                }
                return false;
            }
            return regex.test(Strings.normalize(value));
        }
    }, {
        /**
         * Create a custom store that changes when the search keyword changes.
         *
         * @param handler - A callback function that accepts strings.
         *
         * @returns Store unsubscribe function.
         */
        subscribe(handler) {
            return storeKeyword.subscribe(handler);
        },
        /**
         * @param value - A new value for the keyword / regex test.
         */
        set(value) {
            if (typeof value === 'string') {
                keyword = Strings.normalize(value);
                regex = new RegExp(Strings.escape(keyword), caseSensitive ? '' : 'i');
                storeKeyword.set(keyword);
            }
        }
    });
    /**
     * Create a custom store that changes when the search keyword changes.
     *
     * @param handler - A callback function that accepts strings.
     *
     * @returns Store unsubscribe function.
     */
    filterQuery.subscribe = (handler) => {
        return storeKeyword.subscribe(handler);
    };
    /**
     * @param value - A new value for the keyword / regex test.
     */
    filterQuery.set = (value) => {
        if (typeof value === 'string') {
            keyword = Strings.normalize(value);
            regex = new RegExp(Strings.escape(keyword), caseSensitive ? '' : 'i');
            storeKeyword.set(keyword);
        }
    };
    //
    // /**
    //  * If there is no filter keyword / regex then do not filter otherwise filter based on the regex
    //  * created from the search input element.
    //  *
    //  * @param data - Data object to test against regex.
    //  *
    //  * @returns Store filter state.
    //  */
    // const filterQuery: ReturnType<DynReducerHelper.filters['regexObjectQuery']> = function(data: { [key: string]: any }): boolean
    // {
    //    if (keyword === '' || !regex) { return true; }
    //
    //    if (isIterable(accessors))
    //    {
    //       for (const accessor of accessors)
    //       {
    //          const value: any = safeAccess(data, accessor);
    //          if (typeof value !== 'string')
    //          {
    //             if (accessWarn)
    //             {
    //                console.warn(`regexObjectQuery warning: could not access string data from '${accessor}'.`);
    //             }
    //
    //             continue;
    //          }
    //
    //          if (regex.test(Strings.normalize(value))) { return true; }
    //       }
    //
    //       return false;
    //    }
    //    else
    //    {
    //       const value: any = safeAccess(data, accessors);
    //       if (typeof value !== 'string')
    //       {
    //          if (accessWarn)
    //          {
    //             console.warn(`regexObjectQuery warning: could not access string data from '${accessors}'.`);
    //          }
    //
    //          return false;
    //       }
    //
    //       return regex.test(Strings.normalize(value));
    //    }
    // }
    //
    // /**
    //  * Create a custom store that changes when the search keyword changes.
    //  *
    //  * @param handler - A callback function that accepts strings.
    //  *
    //  * @returns Store unsubscribe function.
    //  */
    // filterQuery.subscribe = (handler: Subscriber<string>): Unsubscriber =>
    // {
    //    return storeKeyword.subscribe(handler);
    // };
    //
    // /**
    //  * @param value - A new value for the keyword / regex test.
    //  */
    // filterQuery.set = (value: string): void =>
    // {
    //    if (typeof value === 'string')
    //    {
    //       keyword = Strings.normalize(value);
    //       regex = new RegExp(Strings.escape(keyword), caseSensitive ? '' : 'i');
    //       storeKeyword.set(keyword);
    //    }
    // };
    return filterQuery;
}

const filters = /*#__PURE__*/Object.freeze({
    __proto__: null,
    regexObjectQuery: regexObjectQuery
});

/**
 * Provides helper functions to create dynamic store driven filters and sort functions for dynamic reducers. The
 * returned functions are also Svelte stores and can be added to a reducer as well as used as a store.
 */
class DynReducerHelper {
    constructor() { }
    /**
     * Returns the following filter functions:
     * - regexObjectQuery(accessors, options); suitable for object reducers matching one or more property keys /
     *   accessors against the store value as a regex. To access deeper entries into the object format the accessor
     *   string with `.` between entries to walk. Optional parameters include logging access warnings, case sensitivity,
     *   and passing in an existing store.
     *
     * @returns All available filters.
     */
    static get filters() { return filters; }
}

export { DynArrayReducer, DynArrayReducerDerived, DynMapReducer, DynMapReducerDerived, DynReducerHelper };
//# sourceMappingURL=index.js.map
