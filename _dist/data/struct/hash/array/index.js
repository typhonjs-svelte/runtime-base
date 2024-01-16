import { isObject, klona, isIterable } from '@typhonjs-svelte/runtime-base/util/object';

/**
 * Returns the value for a Key in the given item / object.
 *
 * @param {object}   item - The target item or partial item.
 *
 * @param {Key}      key - The Key to lookup in item.
 *
 * @returns {any} Value for key in item.
 */
function getValueFromKey(item, key) {
    if (!isObject(item)) {
        throw new Error(`getValueFromKey error: 'item' must be an object.`);
    }
    if (typeof key === 'string') {
        return item[key];
    }
    if (!Array.isArray(key)) {
        return void 0;
    }
    if (key.length === 0) {
        return void 0;
    }
    // else assume key is an array.
    for (const k of key) {
        if (typeof k !== 'string') {
            return void 0;
        }
        if (item) {
            item = item[k];
        }
        else {
            break;
        }
    }
    return item;
}

/**
 * Defines the operations for cloning items.
 */
var CloneOps;
(function (CloneOps) {
    /**
     * Do not clone items.
     */
    CloneOps[CloneOps["NONE"] = 0] = "NONE";
    /**
     * Copy items to new cloned HashArray.
     */
    CloneOps[CloneOps["SHALLOW"] = 1] = "SHALLOW";
    /**
     * Clone all items.
     */
    CloneOps[CloneOps["DEEP"] = 2] = "DEEP";
})(CloneOps || (CloneOps = {}));
/**
 * HashArray is a data structure that combines the best feature of a hash (O(1) retrieval) and an array
 * (length and ordering). Think of it as a super-lightweight, extensible, self-indexing set database in memory.
 *
 * @template T
 */
class HashArray {
    /**
     * An enum used in {@link HashArray.clone} determining how items are handled.
     */
    static CloneOps = CloneOps;
    /**
     * A single string or an array of strings / arrays representing what fields on added objects are to be used as keys
     * for the trie search / HashArray.
     */
    #keyFields;
    /**
     * Stores all items added to the HashArray by order of addition.
     */
    #list;
    /**
     * Stores all items by associated key.
     */
    #map = new Map();
    /**
     * Stores HashArray options.
     */
    #options = {};
    /**
     * @param {string | KeyFields} [keyFields] - A single string or an array of strings / arrays representing what
     * fields on added objects are to be used as keys for the trie search / HashArray.
     *
     * @param {HashArrayOptions<T>}   [options] - Options.
     */
    constructor(keyFields, options) {
        if (keyFields !== void 0 && typeof keyFields !== 'string' && !Array.isArray(keyFields)) {
            throw new TypeError(`HashArray.construct error: 'keyFields' is not a string or array.`);
        }
        if (options !== void 0 && !isObject(options)) {
            throw new TypeError(`HashArray.construct error: 'options' is not an object.`);
        }
        this.#keyFields = Array.isArray(keyFields) ? keyFields : [keyFields];
        if (typeof options?.ignoreDuplicates === 'boolean') {
            this.#options.ignoreDuplicates = options.ignoreDuplicates;
        }
        this.#list = Array.isArray(options?.list) ? options.list : [];
    }
    /**
     * @returns {KeyFields} A clone of the current key fields.
     */
    get keyFields() {
        return klona(this.#keyFields);
    }
    /**
     * @returns {number} The mapped size; number of keys in HashArray.
     */
    get size() {
        return this.#map.size;
    }
    /**
     * @returns {number} The flattened size; number of items in HashArray.
     */
    get sizeFlat() {
        return this.#list.length;
    }
    // ----------------------------------------------------------------------------------------------------------------
    // Adding Items
    // ----------------------------------------------------------------------------------------------------------------
    /**
     * Add items or list of items to the HashArray instance.
     *
     * @param {...(T | Iterable<T>)}  items - Items to add.
     *
     * @returns {HashArray<T>} This instance.
     */
    add(...items) {
        if (items.length === 0) {
            return;
        }
        for (const itemOrList of items) {
            if (isIterable(itemOrList)) {
                for (const item of itemOrList) {
                    this.#addOne(item);
                }
            }
            else {
                this.#addOne(itemOrList);
            }
        }
        return this;
    }
    // ----------------------------------------------------------------------------------------------------------------
    // Cloning
    // ----------------------------------------------------------------------------------------------------------------
    /**
     * Clones this HashArray. By default, returning an empty HashArray with cloned KeyFields. Set `items` in options
     * to `CloneOps.SHALLOW` to copy the items. To fully clone all items set `CloneOps.DEEP`.
     *
     * @param {object}               [opts] - Optional parameters.
     *
     * @param {HashArray.CloneOps}   [opts.items=HashArray.CloneOps.NONE] - Clone operation for items. By default,
     *        no items are included in the clone. Supply `SHALLOW` and items are copied. Supply `DEEP` and items are
     *        cloned as well.
     *
     * @param {HashArrayOptions<T>}  [opts.options] - Optional change to options for the clone that is merged with
     *        current HashArray options.
     */
    clone({ items = CloneOps.NONE, options } = {}) {
        const result = new HashArray(klona(this.#keyFields), Object.assign({}, options, this.#options));
        switch (items) {
            case CloneOps.SHALLOW:
                result.add(this.#list);
                break;
            case CloneOps.DEEP:
                for (let i = 0; i < this.#list.length; i++) {
                    result.add(klona(this.#list[i]));
                }
                break;
        }
        return result;
    }
    // ----------------------------------------------------------------------------------------------------------------
    // Filtering
    // ----------------------------------------------------------------------------------------------------------------
    /**
     * Filters this HashArray returning a new HashArray with the items that pass the given filter test.
     *
     * @param {Key}   key - The Key to retrieve item(s) to iterate.
     *
     * @param {Key | ((item: T) => boolean)}  callbackOrIndex - A Key to lookup for filter inclusion or a callback
     *        function returning the filter result for the item.
     */
    filter(key, callbackOrIndex) {
        const callback = typeof callbackOrIndex === 'function' ? callbackOrIndex : (item) => {
            const val = getValueFromKey(item, callbackOrIndex);
            return val !== void 0 && val !== false;
        };
        return this.clone().add(this.getAll(key).filter(callback));
    }
    // ----------------------------------------------------------------------------------------------------------------
    // Iterating Items
    // ----------------------------------------------------------------------------------------------------------------
    /**
     * Iterates over all items retrieved by the given key invoking the callback function for each item.
     *
     * @param {Key}   key - The Key to retrieve items to iterate.
     *
     * @param {(item: T) => void}   callback - A callback invoked for each item.
     *
     * @returns {HashArray<T>} This instance.
     */
    forEach(key, callback) {
        const items = this.getAll(key);
        items.forEach(callback);
        return this;
    }
    /**
     * Iterates over all items retrieved by the given key invoking the callback function for each item with the value
     * found by the `index` Key and the item itself.
     *
     * @param {Key}   key - The Key to retrieve item(s) to iterate.
     *
     * @param {Key}   index - A specific Key in each item to lookup.
     *
     * @param {(value: any, item: T) => void}   callback - A callback invoked for each item with value of `index`
     *        and item.
     *
     * @returns {HashArray<T>} This instance.
     */
    forEachDeep(key, index, callback) {
        const items = this.getAll(key);
        items.forEach((item) => callback(getValueFromKey(item, index), item));
        return this;
    }
    /**
     * @returns {IterableIterator<[string, T[]]>} An entries iterator w/ key and all associated values.
     */
    entries() {
        return this.#map.entries();
    }
    /**
     * @returns {IterableIterator<[string, T]>} Generator of flattened entries.
     * @yields {[string, T]}
     */
    *entriesFlat() {
        for (const key of this.#map.keys()) {
            const items = this.#map.get(key);
            for (const item of items) {
                yield [key, item];
            }
        }
    }
    /**
     * @returns {IterableIterator<string>} A keys iterator.
     */
    keys() {
        return this.#map.keys();
    }
    /**
     * @returns {IterableIterator<T[]>} A values iterator / all items values grouped by key.
     */
    values() {
        return this.#map.values();
    }
    /**
     * @returns {IterableIterator<T>} A flat values iterator by default in order added.
     */
    valuesFlat() {
        return this.#list.values();
    }
    // ----------------------------------------------------------------------------------------------------------------
    // Membership Testing
    // ----------------------------------------------------------------------------------------------------------------
    /**
     * Detects if the given item collides with an existing key / item pair.
     *
     * @param {Partial<T>}  item - A partial item to check for collision.
     *
     * @returns {boolean} Is there a collision?
     */
    collides(item) {
        for (const keyField of this.#keyFields) {
            if (this.has(getValueFromKey(item, keyField))) {
                return true;
            }
        }
        return false;
    }
    /**
     * Verifies if this HashArray has this key.
     *
     * @param {string}   key - The key to check.
     *
     * @returns {boolean} Whether this HashArray already has the given key.
     */
    has(key) {
        return this.#map.has(key);
    }
    // ----------------------------------------------------------------------------------------------------------------
    // Removing Items
    // ----------------------------------------------------------------------------------------------------------------
    /**
     * Clears all items.
     *
     * @returns {HashArray<T>} This instance.
     */
    clear() {
        this.#map.clear();
        this.#list.length = 0;
        return this;
    }
    /**
     * Removes all item(s) given.
     *
     * @param {...T}  items - Items to remove.
     *
     * @returns {HashArray<T>} This instance.
     */
    remove(...items) {
        for (const item of items) {
            // Remove the item from the map.
            this.#removeItemFromMap(item);
            // Remove the item from the list.
            const index = this.#list.indexOf(item);
            if (index !== -1) {
                this.#list.splice(index, 1);
            }
        }
        return this;
    }
    /**
     * Remove item(s) associated with the given keys from the HashArray.
     *
     * @param {string[]} keys - Keys associated with the item(s) to be removed.
     *
     * @returns {HashArray<T>} This instance.
     */
    removeByKey(...keys) {
        for (const key of keys) {
            // Retrieve a shallow copy of the items associated with the key.
            const items = this.#map.get(key)?.slice();
            if (items) {
                for (const item of items) {
                    // Remove the item from the associated keys in the map.
                    this.#removeItemFromMap(item);
                    // Remove the item from the list.
                    this.#list.splice(this.#list.indexOf(item), 1);
                }
            }
            this.#map.delete(key);
        }
        return this;
    }
    /**
     * When treating HashArray as a cache removing the first item removes the oldest item.
     *
     * @returns {HashArray<T>} This instance.
     */
    removeFirst() {
        if (this.#list.length) {
            this.remove(this.#list[0]);
        }
        return this;
    }
    /**
     * When treating HashArray as a cache removing the last item removes the newest item.
     *
     * @returns {HashArray<T>} This instance.
     */
    removeLast() {
        if (this.#list.length) {
            this.remove(this.#list[this.#list.length - 1]);
        }
        return this;
    }
    // ----------------------------------------------------------------------------------------------------------------
    // Retrieving Items
    // ----------------------------------------------------------------------------------------------------------------
    /**
     * Gets item(s) by the given key.
     *
     * @param {string}   key - The key for an item to retrieve.
     *
     * @returns {T | T[]} All items stored by the given key.
     */
    get(key) {
        const items = this.#map.get(key);
        if (!items) {
            return;
        }
        return items.length === 1 ? items[0] : items;
    }
    /**
     * Gets all items stored by the given Key. You may pass `*` as a wildcard for all items.
     *
     * @param {Key}   keys - The Key for item(s) to retrieve.
     *
     * @returns {T[]} All item(s) for the given Key.
     */
    getAll(keys) {
        const keysIsArray = Array.isArray(keys);
        // Note: shallow copy of whole list.
        if (keys === '*' || (keysIsArray && keys[0] === '*')) {
            return [...this.#list];
        }
        const results = new Set();
        if (keysIsArray) {
            for (const key of keys) {
                const items = this.get(key);
                if (!items) {
                    continue;
                }
                if (Array.isArray(items)) {
                    for (const item of items) {
                        results.add(item);
                    }
                }
                else {
                    results.add(items);
                }
            }
        }
        else {
            const items = this.get(keys);
            if (items) {
                if (Array.isArray(items)) {
                    for (const item of items) {
                        results.add(item);
                    }
                }
                else {
                    results.add(items);
                }
            }
        }
        return [...results];
    }
    /**
     * Gets item(s) by the given key always returning an array including an empty array when key is not in the HashArray.
     *
     * @param {string}   key - The key for item(s) to retrieve.
     *
     * @returns {T[]} All items for key or empty array.
     */
    getAsArray(key) {
        return this.#map.get(key) ?? [];
    }
    /**
     * Gets the item stored in the flat list of all items at the given index.
     *
     * @param {number}   index - The index to retrieve.
     */
    getAt(index) {
        return this.#list[index];
    }
    // ----------------------------------------------------------------------------------------------------------------
    // Set Operations
    // ----------------------------------------------------------------------------------------------------------------
    /**
     * Returns the intersection of this HashArray and a target HashArray.
     *
     * @param {HashArray<T>}   target - Another HashArray.
     *
     * @param {HashArray<T>}   [output] - Optional output HashArray.
     *
     * @returns {HashArray<T>} Returns a new HashArray that contains the intersection between this (A) and the HashArray
     *          passed in (B). Returns A ^ B.
     */
    intersection(target, output = this.clone()) {
        if (!(target instanceof HashArray)) {
            throw new TypeError(`HashArray.intersection error: 'target' must be a HashArray.`);
        }
        for (const item of this.#list) {
            for (const keyField of this.#keyFields) {
                const key = getValueFromKey(item, keyField);
                if (key && this.#map.get(key)?.includes?.(item) && target.#map.get(key)?.includes?.(item)) {
                    output.add(item);
                    break;
                }
            }
        }
        return output;
    }
    // Internal -------------------------------------------------------------------------------------------------------
    /**
     * Adds an item to this HashArray.
     *
     * @param {T}  item - Item to add.
     */
    #addOne(item) {
        let added = true;
        for (const keyField of this.#keyFields) {
            const key = getValueFromKey(item, keyField);
            if (key) {
                const items = this.#map.get(key);
                if (items) {
                    if (this.#options.ignoreDuplicates) {
                        return;
                    }
                    if (items.indexOf(item) !== -1) {
                        // Already added for this KeyField, so continue;
                        added = false;
                        continue;
                    }
                    items.push(item);
                }
                else {
                    this.#map.set(key, [item]);
                }
            }
        }
        // TODO: The indexOf check is one performance area that is difficult to improve.
        if (added || this.#list.indexOf(item) === -1) {
            this.#list.push(item);
        }
    }
    /**
     * Remove an item from the associated keys in the map.
     *
     * @param {T}  item - The item to be removed.
     */
    #removeItemFromMap(item) {
        for (const keyField of this.#keyFields) {
            const key = getValueFromKey(item, keyField);
            if (key) {
                const items = this.#map.get(key);
                if (!items) {
                    continue;
                }
                // Find the index of the item.
                const index = items.indexOf(item);
                // If the item is found, remove it from the array.
                if (index !== -1) {
                    items.splice(index, 1);
                }
                // If there are no more items for the key, delete the key from the map.
                if (items.length === 0) {
                    this.#map.delete(key);
                }
            }
        }
    }
}

/**
 * Provides extra examples of how various additional operations can be added on top of HashArray. These operations
 * are not included with HashArray to keep it lean and mean for {@link TrieSearch}. By all means though extend
 * HashArray and add the operations that you need.
 *
 * There are tests for all operations below in `./test/hash/HAExtra.test.ts`.
 */
class HashArrayUtil {
    // ----------------------------------------------------------------------------------------------------------------
    // Mathematical Operations
    // ----------------------------------------------------------------------------------------------------------------
    /**
     * Iterates deeply over items specified by `key` and `index` with an optional `weightKey` and calculates the
     * average value.
     *
     * @template T
     *
     * @param {HashArray<T>} source - Source HashArray.
     *
     * @param {Key}   key - The Key to retrieve item(s) to iterate.
     *
     * @param {Key}   index - A specific Key in each item to lookup.
     *
     * @param {Key}   [weightKey] - A specific Key in each item to provide a weighting value.
     *
     * @returns {number} The average value for the given iteration.
     */
    static average(source, key, index, weightKey) {
        let ret = 0;
        let tot = 0;
        let weightsTotal = 0;
        if (weightKey !== void 0) {
            source.forEachDeep(key, weightKey, (value) => weightsTotal += value);
        }
        source.forEachDeep(key, index, (value, item) => {
            if (weightKey !== void 0) {
                value *= (getValueFromKey(item, weightKey) / weightsTotal);
            }
            ret += value;
            tot++;
        });
        return weightKey !== undefined ? ret : ret / tot;
    }
    /**
     * Iterates deeply over items specified by `key` and `index` with an optional `weightKey` and calculates the sum.
     *
     * @template T
     *
     * @param {HashArray<T>}   source - Source HashArray.
     *
     * @param {Key}   key - The Key to retrieve item(s) to iterate.
     *
     * @param {Key}   index - A specific Key in each item to lookup.
     *
     * @param {Key}   [weightKey] - A specific Key in each item to provide a weighting value.
     *
     * @returns {number} The sum for the given iteration.
     */
    static sum(source, key, index, weightKey) {
        let ret = 0;
        source.forEachDeep(key, index, (value, item) => {
            if (weightKey !== void 0) {
                value *= getValueFromKey(item, weightKey);
            }
            ret += value;
        });
        return ret;
    }
    // ----------------------------------------------------------------------------------------------------------------
    // Set Operations
    // ----------------------------------------------------------------------------------------------------------------
    /**
     * Returns the difference of this HashArray and a target HashArray. If no output HashArray is provided the source
     * is cloned.
     *
     * @template T
     *
     * @param {HashArray<T>}   source - Source HashArray.
     *
     * @param {HashArray<T>}   target - Target HashArray.
     *
     * @param {HashArray<T>}   output - Optional output HashArray.
     *
     * @returns {HashArray<T>} Returns a new HashArray that contains the difference between source (A) and target (B)
     *          HashArrays. Returns A - B.
     */
    static difference(source, target, output) {
        const result = output ? output : source.clone();
        for (const item of source.valuesFlat()) {
            if (!target.collides(item)) {
                result.add(item);
            }
        }
        return result;
    }
    /**
     * @template T
     *
     * @param {HashArray<T>} source - Source HashArray.
     *
     * @param {number}   count - How many items to sample.
     *
     * @param {Key} [key] - The Key for item(s) to sample.
     *
     * @returns {T[]} Random subset of items.
     * @see http://en.wikipedia.org/wiki/Image_(mathematics)
     */
    static sample(source, count, key) {
        const image = key ? source.getAll(key) : [...source.valuesFlat()];
        const result = [];
        for (const randNum of this.#getUniqueRandomIntegers(count, 0, image.length - 1)) {
            result.push(image[randNum]);
        }
        return result;
    }
    // Internal -------------------------------------------------------------------------------------------------------
    /**
     * @param {number}   count - Target count for length of returned results.
     *
     * @param {number}   min - Minimum index.
     *
     * @param {number}   max - Maximum index.
     *
     * @returns {Set<number>} An unique Set of random numbers between min & max; length is the minimum between count and
     *          range of min / max.
     */
    static #getUniqueRandomIntegers(count, min, max) {
        const set = new Set();
        count = Math.min(Math.max(max - min, 1), count);
        while (set.size < count) {
            const r = Math.floor(min + (Math.random() * (max + 1)));
            set.add(r);
        }
        return set;
    }
}

export { HashArray, HashArrayUtil, getValueFromKey };
//# sourceMappingURL=index.js.map
