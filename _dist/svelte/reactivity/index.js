import { subscribeIgnoreFirst } from '@typhonjs-svelte/runtime-base/svelte/store/util';
import { isIterable } from '@typhonjs-svelte/runtime-base/util/object';
import { resolveByPredicate } from '@typhonjs-svelte/runtime-base/util/predicate';

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
    // ES2024 Implementation ------------------------------------------------------------------------------------------
    /**
     * @returns a new Set containing all the elements in this Set and also all the elements in the argument.
     */
    union(other) {
        return this.#svelteSet.union(other);
    }
    /**
     * @returns a new Set containing all the elements which are both in this Set and in the argument.
     */
    intersection(other) {
        return this.#svelteSet.intersection(other);
    }
    /**
     * @returns a new Set containing all the elements in this Set which are not also in the argument.
     */
    difference(other) {
        return this.#svelteSet.difference(other);
    }
    /**
     * @returns a new Set containing all the elements which are in either this Set or in the argument, but not in both.
     */
    symmetricDifference(other) {
        return this.#svelteSet.symmetricDifference(other);
    }
    /**
     * @returns a boolean indicating whether all the elements in this Set are also in the argument.
     */
    isSubsetOf(other) {
        return this.#svelteSet.isSubsetOf(other);
    }
    /**
     * @returns a boolean indicating whether all the elements in the argument are also in this Set.
     */
    isSupersetOf(other) {
        return this.#svelteSet.isSupersetOf(other);
    }
    /**
     * @returns a boolean indicating whether this Set has no elements in common with the argument.
     */
    isDisjointFrom(other) {
        return this.#svelteSet.isDisjointFrom(other);
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

/**
 * Resolves a bindable component property while preserving the provenance of values published by the component.
 *
 * `PropBindingControl` supports component properties that serve as both:
 *
 * - an externally supplied input; and
 * - a value published back to the parent through component binding.
 *
 * This distinction is important when a component resolves a property from multiple sources. Once the component
 * publishes a resolved value back through the bound property, that value must not subsequently be interpreted as a new
 * direct value supplied by the parent.
 *
 * The controller records the last value it published. When {@link resolve} is called, a bound value that differs
 * from the last published value is treated as an external assignment and becomes the highest-precedence direct value.
 * Otherwise, the controller resolves the first valid candidate or returns its component-owned fallback.
 *
 * Resolution precedence is:
 *
 * 1. A valid external assignment to the bindable property.
 * 2. The first valid candidate passed to {@link resolve}.
 * 3. The fallback supplied to the constructor.
 *
 * An invalid external assignment clears any previously established direct value, allowing candidate values or the
 * fallback to become effective again.
 *
 * The controller does not subscribe to, observe, or dispose of resolved values. It only retains references
 * required to track resolution provenance. Consequently, a component-local instance does not require explicit cleanup.
 *
 * @typeParam T - Type accepted by the supplied predicate and returned by the controller.
 *
 * @example Svelte component store resolution
 *
 * ```svelte
 * <script lang="ts">
 *    import { writable } from 'svelte/store';
 *
 *    import { PropBindingControl }       from '#runtime/svelte/reactivity';
 *    import { isMinimalWritableStore }   from '#runtime/svelte/store/util';
 *
 *    // Combined all options object.
 *    export let options = {};
 *
 *    // Individual prop
 *    export let store = void 0;
 *
 *    const storeControl = new PropBindingControl(
 *       isMinimalWritableStore,
 *       writable(void 0)  // Default internal store when no prop or options stores provided.
 *    );
 *
 *    // A directly supplied `store` takes precedence. Otherwise, `options.store` is selected, followed by the
 *    // component-owned writable fallback.
 *    //
 *    // Assigning the result back to `store` publishes the effective store through `bind:store` without causing
 *    // that published value to become a permanent direct override.
 *    $: store = storeControl.resolve(store, options.store);
 * </script>
 * ```
 */
class PropBindingControl {
    /**
     * Sentinel identifying the absence of a direct or previously published value.
     */
    static unset = Symbol('PropBindingControl.unset');
    /**
     * Component-owned value returned when no direct value or candidate satisfies the predicate.
     */
    #fallback;
    /**
     * Type predicate used to validate all values considered by the controller.
     */
    #predicate;
    /**
     * Last valid value assigned externally through the bindable property.
     *
     * The sentinel indicates that no direct external value is currently active.
     */
    #directValue = PropBindingControl.unset;
    /**
     * Last effective value returned by {@link resolve} and subsequently published through the bindable property.
     *
     * This value is used to distinguish a component-published assignment from a new external assignment.
     */
    #publishedValue = PropBindingControl.unset;
    /**
     * Creates a property binding controller.
     *
     * The fallback must satisfy the supplied predicate because it is guaranteed to be returned whenever no
     * higher-precedence value is valid.
     *
     * @param predicate - Type predicate used to validate the bindable property, candidate values, and fallback.
     *
     * @param fallback - Component-owned fallback returned when no direct value or candidate satisfies `predicate`.
     *
     * @throws {@link TypeError} Thrown when `fallback` does not satisfy `predicate`.
     */
    constructor(predicate, fallback) {
        if (!predicate(fallback)) {
            throw new TypeError(`'fallback' does not satisfy the supplied predicate.`);
        }
        this.#predicate = predicate;
        this.#fallback = fallback;
    }
    /**
     * Resolves the effective value and records it as the value published back through the bindable component property.
     *
     * A `boundValue` differing from the value returned by the previous invocation is treated as an external assignment.
     * When valid, it becomes the direct value and takes precedence over all candidates. When invalid, any previous
     * direct value is cleared.
     *
     * When `boundValue` matches the previously published value, it is recognized as the component's own assignment
     * and does not alter direct-value provenance.
     *
     * Candidates are evaluated from left to right. The first candidate accepted by the configured predicate is
     * returned. If neither a direct value nor a candidate is valid, the constructor fallback is returned.
     *
     * The returned value should normally be assigned directly back to the bindable property:
     *
     * ```ts
     * $: store = storeControl.resolve(store, inputOptions.store);
     * ```
     *
     * @param boundValue - Current value of the exported bindable property.
     *
     * @param candidates - Additional candidate values evaluated in descending precedence order.
     *
     * @returns The valid direct value, first valid candidate, or fallback.
     */
    resolve(boundValue, ...candidates) {
        // A value different from the last published value represents an external assignment to the bindable property.
        if (this.#publishedValue === typeof PropBindingControl.unset || !Object.is(boundValue, this.#publishedValue)) {
            this.#directValue = this.#predicate(boundValue) ? boundValue : PropBindingControl.unset;
        }
        const resolvedValue = this.#directValue !== PropBindingControl.unset ? this.#directValue :
            resolveByPredicate(this.#predicate, ...candidates) ?? this.#fallback;
        this.#publishedValue = resolvedValue;
        return resolvedValue;
    }
}

/**
 * Internal implementation of the transient change-set view for {@link PropChangeTracker}.
 */
class PropChangeSet {
    #keys;
    #indexByKey;
    #state;
    constructor(keys, indexByKey, state) {
        this.#keys = keys;
        this.#indexByKey = indexByKey;
        this.#state = state;
    }
    get changed() {
        return this.#state.count > 0;
    }
    get count() {
        return this.#state.count;
    }
    has(key) {
        const index = this.#indexByKey.get(key);
        return index !== void 0 && (this.#state.flags[index] ?? false);
    }
    hasAny(keys) {
        for (let index = 0; index < keys.length; index++) {
            if (this.has(keys[index])) {
                return true;
            }
        }
        return false;
    }
    hasAll(keys) {
        for (let index = 0; index < keys.length; index++) {
            if (!this.has(keys[index])) {
                return false;
            }
        }
        return true;
    }
    *[Symbol.iterator]() {
        for (let index = 0; index < this.#keys.length; index++) {
            if (this.#state.flags[index]) {
                yield this.#keys[index];
            }
        }
    }
    toArray() {
        const result = [];
        for (let index = 0; index < this.#keys.length; index++) {
            if (this.#state.flags[index]) {
                result.push(this.#keys[index]);
            }
        }
        return result;
    }
}

/**
 * Explicitly checks selected properties against their previously supplied values.
 *
 * `PropertyChangeTracker` has no subscriptions or reactive behavior of its own. A host, such as a Svelte reactive
 * statement, determines when {@link PropChangeTracker.check} is called and retains full control over any
 * resulting side effects.
 *
 * Each check compares and then commits the latest values. A comparator may therefore consider two distinct values
 * equal, while the most recently supplied value still becomes the baseline for the next check.
 *
 * PropChangeTracker maintains a snapshot of selected object properties and reports which tracked properties changed
 * between successive check() calls. It is intended for explicit reactive control flow and does not introduce
 * subscriptions or hidden reactivity.
 *
 * @example
 * Track changes to a subset of resolved component properties.
 *
 * ```svelte
 * <script lang="ts">
 *    import { PropChangeTracker }  from '#runtime/svelte/reactivity';
 *
 *    import { isObject }           from '#runtime/util/object';
 *
 *    import {
 *       isBoolean,
 *       isString,
 *       resolveByPredicate }       from '#runtime/util/predicate';
 *
 *    interface Props
 *    {
 *       foo?: boolean;
 *       bar?: string;
 *    }
 *
 *    // Combined props options object with `foo` and / or `bar`.
 *    export let options?: Props = void 0;
 *
 *    // Individual prop `foo`
 *    export let foo ?: string = void 0;
 *
 *    // Individual prop `bar`
 *    export let bar?: string = void 0;
 *
 *    const tracker = new PropChangeTracker<Props>({
 *       keys: ['foo', 'bar']
 *    });
 *
 *    // Stores all resolved props.
 *    const props: Props = {};
 *
 *    // Normalize the combined options separately from resolution of the individual exported props. The individual
 *    // props will take precedence over the combined options object.
 *
 *    $: inputOptions: Props = isObject(options) ? options : {};
 *
 *    $: props.foo = resolveByPredicate(isBoolean, foo, inputOptions.foo) ?? true;
 *
 *    $: props.bar = resolveByPredicate(isString, bar, inputOptions?.bar);
 *
 *    // Control based logic based on prop changes.
 *    $: {
 *       const changes = tracker.check(props);
 *
 *       if (changes.changed)
 *       {
 *          if (changes.has('foo'))
 *          {
 *             // `foo` state changed.
 *          }
 *
 *          if (changes.hasAny('foo', 'bar'))
 *          {
 *             // `foo` and / or `bar` changed.
 *          }
 *       }
 *    }
 * </script>
 * ```
 *
 * @template T - Source object shape.
 * @template K - Tracked properties from the source object.
 */
class PropChangeTracker {
    #keys;
    #comparators;
    #previousValues;
    #state;
    #changes;
    #initialMode;
    #initialized = false;
    constructor(options) {
        if (!options || !Array.isArray(options.keys) || options.keys.length === 0) {
            throw new TypeError("'options.keys' must be a non-empty array of property keys.");
        }
        const keys = options.keys.slice();
        const indexByKey = new Map();
        for (let index = 0; index < keys.length; index++) {
            const key = keys[index];
            const keyType = typeof key;
            if (keyType !== 'string' && keyType !== 'number' && keyType !== 'symbol') {
                throw new TypeError(`Invalid property key at index ${index}.`);
            }
            if (indexByKey.has(key)) {
                throw new TypeError(`Duplicate tracked property key: ${String(key)}`);
            }
            indexByKey.set(key, index);
        }
        const defaultEquals = options.defaultEquals ?? Object.is;
        if (typeof defaultEquals !== 'function') {
            throw new TypeError("'options.defaultEquals' must be a function.");
        }
        const comparators = new Array(keys.length);
        const equals = options.equals;
        for (let index = 0; index < keys.length; index++) {
            const key = keys[index];
            let comparator;
            if (equals && Object.prototype.hasOwnProperty.call(equals, key)) {
                const candidate = Reflect.get(equals, key);
                if (typeof candidate !== 'function') {
                    throw new TypeError(`Equality comparator for '${String(key)}' must be a function.`);
                }
                comparator = candidate;
            }
            comparators[index] = comparator ?? defaultEquals;
        }
        const initialMode = options.initialMode ?? 'changed';
        if (initialMode !== 'changed' && initialMode !== 'baseline' && initialMode !== 'undefined') {
            throw new TypeError("'options.initialMode' must be 'changed', 'baseline', or 'undefined'.");
        }
        this.#keys = Object.freeze(keys);
        this.#comparators = Object.freeze(comparators);
        this.#previousValues = new Array(keys.length).fill(void 0);
        this.#state = { count: 0, flags: new Array(keys.length).fill(false) };
        this.#changes = new PropChangeSet(this.#keys, indexByKey, this.#state);
        this.#initialMode = initialMode;
    }
    /**
     * Whether a baseline has been captured by {@link check} or {@link sync}.
     */
    get initialized() {
        return this.#initialized;
    }
    /**
     * Compares tracked properties with their previous values and commits the supplied values as the next baseline.
     *
     * The returned {@link PropChangeTracker.Data.ChangeSet} is reused by subsequent checks.
     *
     * @param value - Source object containing the tracked properties.
     */
    check(value) {
        this.#validateValue(value);
        const isInitial = !this.#initialized;
        let changeCount = 0;
        for (let index = 0; index < this.#keys.length; index++) {
            const key = this.#keys[index];
            const currentValue = value[key];
            let changed;
            if (isInitial && this.#initialMode !== 'undefined') {
                changed = this.#initialMode === 'changed';
            }
            else {
                changed = !this.#comparators[index](this.#previousValues[index], currentValue);
            }
            this.#previousValues[index] = currentValue;
            this.#state.flags[index] = changed;
            if (changed) {
                changeCount++;
            }
        }
        this.#state.count = changeCount;
        this.#initialized = true;
        return this.#changes;
    }
    /**
     * Captures tracked property values as the new baseline without reporting changes.
     *
     * @param value - Source object containing the tracked properties.
     */
    sync(value) {
        this.#validateValue(value);
        for (let index = 0; index < this.#keys.length; index++) {
            this.#previousValues[index] = value[this.#keys[index]];
            this.#state.flags[index] = false;
        }
        this.#state.count = 0;
        this.#initialized = true;
    }
    /**
     * Clears retained values and returns the tracker to its initial state.
     */
    reset() {
        this.#previousValues.fill(void 0);
        this.#state.flags.fill(false);
        this.#state.count = 0;
        this.#initialized = false;
    }
    #validateValue(value) {
        if ((typeof value !== 'object' && typeof value !== 'function') || value === null) {
            throw new TypeError("'value' must be a non-null object.");
        }
    }
}

export { PropBindingControl, PropChangeTracker, ReadonlySvelteSet, SvelteSet };
//# sourceMappingURL=index.js.map
