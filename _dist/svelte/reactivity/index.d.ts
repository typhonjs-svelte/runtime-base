/**
 * Provides Svelte 4 store based reactive collections and control helper utilities.
 *
 * Note: For collections this sub-path export will be replaced with the Svelte 5 / `svelte/reactivity` package on
 * upgrade.
 *
 * @packageDocumentation
 */

import { Readable, Subscriber, Unsubscriber } from 'svelte/store';
import { TypePredicate } from '@typhonjs-svelte/runtime-base/util/predicate';

/**
 * Provides a Svelte 4 Readable store based Set implementation.
 *
 * Note: This implementation will be removed in transition to Svelte 5.
 */
declare class SvelteSet<T> extends Set<T> implements Readable<SvelteSet<T>> {
  #private;
  constructor(entries?: Iterable<T>);
  /**
   * Appends a new element with a specified value to the end of the Set.
   *
   * @param value - Value to add.
   *
   * @returns This instance.
   */
  add(value: T): this;
  /**
   * Clears this set.
   */
  clear(): void;
  /**
   * Removes a specified value from the Set.
   *
   * @param value - Value to delete.
   *
   * @returns Returns true if an element in the Set existed and has been removed, or false if the element
   *          does not exist.
   */
  delete(value: T): boolean;
  /**
   * @param handler - Callback function that is invoked on update / changes.
   *
   * @returns Unsubscribe function.
   */
  subscribe(handler: Subscriber<SvelteSet<T>>): Unsubscriber;
}

/**
 * Provides a readonly variant of SvelteSet wrapping an instance of SvelteSet as the source.
 */
declare class ReadonlySvelteSet<T> implements ReadonlySet<T>, Readable<ReadonlySvelteSet<T>> {
  #private;
  /**
   * Creates a readonly variant of SvelteSet.
   *
   * @param svelteSet - Backing wrapped SvelteSet implementation.
   */
  constructor(svelteSet: SvelteSet<T>);
  /**
   * Iterates over values in the set.
   */
  [Symbol.iterator](): SetIterator<T>;
  /**
   * Returns the number of unique elements in this set.
   */
  get size(): number;
  /**
   * Returns an iterable of [v,v] pairs for every value `v` in the set.
   */
  entries(): SetIterator<[T, T]>;
  /**
   * Executes a provided function once for each value in this set, in insertion order.
   *
   * @param callbackfn - Callback function.
   *
   * @param thisArg - Optional this reference for callback function.
   */
  forEach(callbackfn: (value: T, value2: T, set: ReadonlySet<T>) => void, thisArg?: any): void;
  /**
   * Returns a boolean indicating whether an element with the specified value exists in this set or not.
   *
   * @param value - Value to test.
   */
  has(value: T): boolean;
  /**
   * Despite its name, returns an iterable of the values in the set.
   */
  keys(): SetIterator<T>;
  /**
   * Returns an iterable of values in the set.
   */
  values(): SetIterator<T>;
  /**
   * @returns a new Set containing all the elements in this Set and also all the elements in the argument.
   */
  union<U>(other: ReadonlySetLike<U>): Set<T | U>;
  /**
   * @returns a new Set containing all the elements which are both in this Set and in the argument.
   */
  intersection<U>(other: ReadonlySetLike<U>): Set<T & U>;
  /**
   * @returns a new Set containing all the elements in this Set which are not also in the argument.
   */
  difference<U>(other: ReadonlySetLike<U>): Set<T>;
  /**
   * @returns a new Set containing all the elements which are in either this Set or in the argument, but not in both.
   */
  symmetricDifference<U>(other: ReadonlySetLike<U>): Set<T | U>;
  /**
   * @returns a boolean indicating whether all the elements in this Set are also in the argument.
   */
  isSubsetOf(other: ReadonlySetLike<unknown>): boolean;
  /**
   * @returns a boolean indicating whether all the elements in the argument are also in this Set.
   */
  isSupersetOf(other: ReadonlySetLike<unknown>): boolean;
  /**
   * @returns a boolean indicating whether this Set has no elements in common with the argument.
   */
  isDisjointFrom(other: ReadonlySetLike<unknown>): boolean;
  /**
   * @param handler - Callback function that is invoked on update / changes.
   *
   * @returns Unsubscribe function.
   */
  subscribe(handler: Subscriber<ReadonlySvelteSet<T>>): Unsubscriber;
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
declare class PropBindingControl<T> {
  #private;
  /**
   * Sentinel identifying the absence of a direct or previously published value.
   */
  private static readonly unset;
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
  constructor(predicate: TypePredicate<T>, fallback: T);
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
  resolve(boundValue: unknown, ...candidates: readonly unknown[]): T;
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
declare class PropChangeTracker<T extends object, K extends keyof T = keyof T> {
  #private;
  constructor(options: PropChangeTracker.Options<T, K>);
  /**
   * Whether a baseline has been captured by {@link check} or {@link sync}.
   */
  get initialized(): boolean;
  /**
   * Compares tracked properties with their previous values and commits the supplied values as the next baseline.
   *
   * The returned {@link PropChangeTracker.Data.ChangeSet} is reused by subsequent checks.
   *
   * @param value - Source object containing the tracked properties.
   */
  check(value: T): PropChangeTracker.Data.ChangeSet<K>;
  /**
   * Captures tracked property values as the new baseline without reporting changes.
   *
   * @param value - Source object containing the tracked properties.
   */
  sync(value: T): void;
  /**
   * Clears retained values and returns the tracker to its initial state.
   */
  reset(): void;
}
declare namespace PropChangeTracker {
  namespace Data {
    interface ChangeState {
      count: number;
      readonly flags: boolean[];
    }
    /**
     * Transient read-only view of the properties changed by the latest tracker check.
     *
     * The tracker reuses the same change-set instance for every check to avoid per-check allocation. Consumers
     * should inspect the result immediately. Use {@link PropChangeTracker.Data.ChangeSet.toArray} when a durable
     * list of changed keys is needed.
     */
    interface ChangeSet<K extends PropertyKey> extends Iterable<K> {
      /**
       * Whether one or more tracked properties changed.
       */
      readonly changed: boolean;
      /**
       * Number of tracked properties that changed.
       */
      readonly count: number;
      /**
       * Determines whether a specific property changed.
       *
       * @param key - Property to test.
       */
      has(key: K): boolean;
      /**
       * Determines whether any property in `keys` changed.
       *
       * @param keys - Properties to test.
       */
      hasAny(keys: readonly K[]): boolean;
      /**
       * Determines whether every property in `keys` changed.
       *
       * @param keys - Properties to test.
       */
      hasAll(keys: readonly K[]): boolean;
      /**
       * Allocates and returns the changed properties in configured key order.
       */
      toArray(): K[];
    }
    /**
     * Determines whether two property values are equal.
     *
     * Returning `true` indicates that the values are equal and the property has not changed.
     */
    type EqualityComparator<T> = (previous: T, current: T) => boolean;
    /**
     * Optional equality comparators assigned to individual tracked properties.
     */
    type EqualityComparators<T extends object, K extends keyof T> = Partial<{
      readonly [P in K]: EqualityComparator<T[P]>;
    }>;
  }
  /**
   * Configuration options for {@link PropChangeTracker}.
   */
  interface Options<T extends object, K extends keyof T> {
    /**
     * Properties to track. The order is retained when iterating changed properties or calling
     * {@link PropChangeTracker.Data.ChangeSet.toArray}.
     */
    keys: readonly K[];
    /**
     * Optional equality comparators for individual properties.
     */
    equals?: PropChangeTracker.Data.EqualityComparators<T, K>;
    /**
     * Equality comparator used when a property-specific comparator is not supplied.
     *
     * @defaultValue `Object.is`
     */
    defaultEquals?: PropChangeTracker.Data.EqualityComparator<unknown>;
    /**
     * Controls the result of the first check after construction or {@link PropChangeTracker.reset}.
     *
     * - `'changed'`: every tracked property is reported as changed.
     * - `'baseline'`: the first values establish the baseline and no changes are reported.
     * - `'undefined'`: each first value is compared against `undefined`.
     *
     * @defaultValue `'changed'`
     */
    initialMode?: 'changed' | 'baseline' | 'undefined';
  }
}

export { PropBindingControl, PropChangeTracker, ReadonlySvelteSet, SvelteSet };
