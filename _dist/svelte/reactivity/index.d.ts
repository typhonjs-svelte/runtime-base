/**
 * Provides Svelte 4 store based reactive collections.
 *
 * Note: This sub-path export will be replaced with the Svelte 5 / `svelte/reactivity` package on upgrade.
 *
 * @packageDocumentation
 */

import { Readable, Subscriber, Unsubscriber } from 'svelte/store';

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
  [Symbol.iterator](): IterableIterator<T>;
  /**
   * Returns the number of unique elements in this set.
   */
  get size(): number;
  /**
   * Returns an iterable of [v,v] pairs for every value `v` in the set.
   */
  entries(): IterableIterator<[T, T]>;
  /**
   * Executes a provided function once for each value in this set, in insertion order.
   *
   * @param callbackfn - Callback function.
   *
   * @param thisArg - Optional this reference for callback function.
   */
  forEach(callbackfn: (value: T, value2: T, set: ReadonlySvelteSet<T>) => void, thisArg?: unknown): void;
  /**
   * Returns a boolean indicating whether an element with the specified value exists in this set or not.
   *
   * @param value - Value to test.
   */
  has(value: T): boolean;
  /**
   * Despite its name, returns an iterable of the values in the set.
   */
  keys(): IterableIterator<T>;
  /**
   * Returns an iterable of values in the set.
   */
  values(): IterableIterator<T>;
  /**
   * @param handler - Callback function that is invoked on update / changes.
   *
   * @returns Unsubscribe function.
   */
  subscribe(handler: Subscriber<ReadonlySvelteSet<T>>): Unsubscriber;
}

export { ReadonlySvelteSet, SvelteSet };
