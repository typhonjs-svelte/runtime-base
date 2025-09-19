import { subscribeIgnoreFirst } from '@typhonjs-svelte/runtime-base/svelte/store/util';
import { isIterable } from '@typhonjs-svelte/runtime-base/util/object';

/**
 * Provides a Svelte 4 Readable store based Set implementation.
 *
 * Note: This implementation will be removed in transition to Svelte 5.
 */
class SvelteSet extends Set {
    /**
     * Stores the subscribers.
     */
    #subscribers = [];
    constructor(entries) {
        super();
        if (entries !== void 0 && !isIterable(entries)) {
            throw new TypeError(`'entries' must be an iterable list.`);
        }
        if (entries) {
            for (const entry of entries) {
                super.add(entry);
            }
        }
    }
    /**
     * Appends a new element with a specified value to the end of the Set.
     *
     * @param value - Value to add.
     *
     * @returns This instance.
     */
    add(value) {
        const hasValue = super.has(value);
        super.add(value);
        if (!hasValue) {
            this.#updateSubscribers();
        }
        return this;
    }
    /**
     * Clears this set.
     */
    clear() {
        if (this.size === 0) {
            return;
        }
        super.clear();
        this.#updateSubscribers();
    }
    /**
     * Removes a specified value from the Set.
     *
     * @param value - Value to delete.
     *
     * @returns Returns true if an element in the Set existed and has been removed, or false if the element
     *          does not exist.
     */
    delete(value) {
        const result = super.delete(value);
        if (result) {
            this.#updateSubscribers();
        }
        return result;
    }
    // Store subscriber implementation --------------------------------------------------------------------------------
    /**
     * @param handler - Callback function that is invoked on update / changes.
     *
     * @returns Unsubscribe function.
     */
    subscribe(handler) {
        const currentIdx = this.#subscribers.findIndex((sub) => sub === handler);
        if (currentIdx === -1) {
            this.#subscribers.push(handler);
            handler(this);
        }
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
     */
    #updateSubscribers() {
        for (let cntr = 0; cntr < this.#subscribers.length; cntr++) {
            this.#subscribers[cntr](this);
        }
    }
}

/**
 * Provides a readonly variant of SvelteSet wrapping an instance of SvelteSet as the source.
 */
class ReadonlySvelteSet {
    /**
     * Stores the subscribers.
     */
    #subscribers = [];
    /**
     * The backing wrapped SvelteSet implementation.
     */
    #svelteSet;
    /**
     * Unsubscriber when subscribed to backing SvelteSet.
     */
    #unsubscribe;
    /**
     * Creates a readonly variant of SvelteSet.
     *
     * @param svelteSet - Backing wrapped SvelteSet implementation.
     */
    constructor(svelteSet) {
        if (!(svelteSet instanceof SvelteSet)) {
            throw new TypeError(`'svelteSet' is not an instance of SvelteSet.`);
        }
        this.#svelteSet = svelteSet;
    }
    /**
     * Iterates over values in the set.
     */
    [Symbol.iterator]() {
        return this.#svelteSet.values();
    }
    /**
     * Returns the number of unique elements in this set.
     */
    get size() {
        return this.#svelteSet.size;
    }
    /**
     * Returns an iterable of [v,v] pairs for every value `v` in the set.
     */
    entries() {
        return this.#svelteSet.entries();
    }
    /**
     * Executes a provided function once for each value in this set, in insertion order.
     *
     * @param callbackfn - Callback function.
     *
     * @param thisArg - Optional this reference for callback function.
     */
    forEach(callbackfn, thisArg) {
        for (const v of this.#svelteSet.values()) {
            callbackfn.call(thisArg, v, v, this);
        }
    }
    /**
     * Returns a boolean indicating whether an element with the specified value exists in this set or not.
     *
     * @param value - Value to test.
     */
    has(value) {
        return this.#svelteSet.has(value);
    }
    /**
     * Despite its name, returns an iterable of the values in the set.
     */
    keys() {
        return this.#svelteSet.keys();
    }
    /**
     * Returns an iterable of values in the set.
     */
    values() {
        return this.#svelteSet.values();
    }
    // Store subscriber implementation --------------------------------------------------------------------------------
    /**
     * @param handler - Callback function that is invoked on update / changes.
     *
     * @returns Unsubscribe function.
     */
    subscribe(handler) {
        const currentIdx = this.#subscribers.findIndex((sub) => sub === handler);
        if (currentIdx === -1) {
            this.#subscribers.push(handler);
            if (this.#subscribers.length === 1) {
                this.#unsubscribe = subscribeIgnoreFirst(this.#svelteSet, this.#updateSubscribers.bind(this));
            }
            handler(this);
        }
        // Return unsubscribe function.
        return () => {
            const index = this.#subscribers.findIndex((sub) => sub === handler);
            if (index >= 0) {
                this.#subscribers.splice(index, 1);
                if (this.#subscribers.length === 0) {
                    this.#unsubscribe?.();
                    this.#unsubscribe = void 0;
                }
            }
        };
    }
    /**
     * Updates subscribers.
     */
    #updateSubscribers() {
        for (let cntr = 0; cntr < this.#subscribers.length; cntr++) {
            this.#subscribers[cntr](this);
        }
    }
}

export { ReadonlySvelteSet, SvelteSet };
//# sourceMappingURL=index.js.map
