import { Readable, Writable, Subscriber, Unsubscriber, Updater } from 'svelte/store';

/**
 * Provides a basic test for a given variable to test if it has the shape of a readable store by having a `subscribe`
 * function.
 *
 * Note: functions are also objects, so test that the variable might be a function w/ a `subscribe` function.
 *
 * @param store - variable to test that might be a store.
 *
 * @returns Whether the variable tested has the shape of a store.
 *
 * @typeParam T - type of data.
 */
declare function isReadableStore<T>(store: unknown): store is Readable<T>;
/**
 * Provides a basic test for a given variable to test if it has the shape of a minimal writable store by having a
 * `subscribe` and `set` functions.
 *
 * Note: functions are also objects, so test that the variable might be a function w/ `subscribe` & `set` functions.
 *
 * @param store - variable to test that might be a store.
 *
 * @returns Whether the variable tested has the shape of a {@link MinimalWritable} store.
 *
 * @typeParam T - type of data.
 */
declare function isMinimalWritableStore<T>(store: unknown): store is MinimalWritable<T>;
/**
 * Provides a basic test for a given variable to test if it has the shape of a writable store by having a `subscribe`
 * `set`, and `update` functions.
 *
 * Note: functions are also objects, so test that the variable might be a function w/ `subscribe`, `set, and `update`
 * functions.
 *
 * @param {*}  store - variable to test that might be a store.
 *
 * @returns Whether the variable tested has the shape of a writable store.
 *
 * @typeParam T - type of data.
 */
declare function isWritableStore<T>(store: unknown): store is Writable<T>;
/**
 * Subscribes to the given store with the subscriber function provided and ignores the first automatic
 * update. All future updates are dispatched to the subscriber function.
 *
 * @param store - Store to subscribe to...
 *
 * @param subscriber - Function to receive future updates.
 *
 * @returns Store unsubscribe function.
 *
 * @typeParam T - type of data.
 */
declare function subscribeIgnoreFirst<T>(
  store: Readable<T> | MinimalWritable<T>,
  subscriber: Subscriber<T>,
): Unsubscriber;
/**
 * Subscribes to the given store with two subscriber functions provided. The first function is invoked on the initial
 * subscription. All future updates are dispatched to the subscriber function.
 *
 * @param store - Store to subscribe to...
 *
 * @param first - Function to receive first update.
 *
 * @param subscriber - Function to receive future updates.
 *
 * @returns Store unsubscribe function.
 *
 * @typeParam T - type of data.
 */
declare function subscribeFirstRest<T>(
  store: Readable<T> | MinimalWritable<T>,
  first: Subscriber<T>,
  subscriber: Subscriber<T>,
): Unsubscriber;
/**
 * Extends {@link Writable} to allow type differentiation between writing and reading data. This is useful when
 * converting or transforming input data to a different or more specific output.
 *
 * @typeParam W - Writable / input type.
 *
 * @typeParam R - Readable / output type.
 */
interface IOWritable<W, R> extends Readable<R> {
  /**
   * Set value and inform subscribers.
   * @param value to set
   */
  set(this: void, value: W): void;
  /**
   * Update value using callback and inform subscribers.
   * @param updater callback
   */
  update(this: void, updater: Updater<W>): void;
}
/**
 * The minimal requirements of the [writable store contract](https://svelte.dev/docs/svelte-components#script-4-prefix-stores-with-$-to-access-their-values).
 *
 * A minimal writable is a {@link Readable} / subscribable, but only has a `set` method omitting the `update` method
 * from `Writable`.
 *
 * Extends the minimal writable interface to allow type differentiation between writing and reading data. This is
 * useful when converting or transforming input data to a different or more specific output.
 *
 * @typeParam W - Writable / input type.
 *
 * @typeParam R - Readable / output type.
 */
interface MinimalIOWritable<W, R> extends Readable<R> {
  /**
   * Set value and inform subscribers.
   * @param value to set
   */
  set(this: void, value: W): void;
}
/**
 * The minimal requirements of the [writable store contract](https://svelte.dev/docs/svelte-components#script-4-prefix-stores-with-$-to-access-their-values).
 *
 * A minimal writable is a {@link Readable} / subscribable, but only has a `set` method omitting the `update` method
 * from `Writable`.
 *
 * @typeParam T - type of data.
 */
interface MinimalWritable<T> extends Readable<T> {
  /**
   * Set value and inform subscribers.
   * @param value to set
   */
  set(this: void, value: T): void;
}
/**
 * Combines a minimal writable Svelte store with a callable function. This type allows a minimal writable store to
 * also act as a function enabling flexible reactive behavior.
 *
 * @typeParam T - The type of value stored in the minimal writable store.
 *
 * @typeParam Args - The tuple of argument types accepted by the function.
 *
 * @typeParam R - The return type of the function.
 */
interface MinimalWritableFn<T, Args extends unknown[], R = void> extends MinimalWritable<T> {
  (...args: Args): R;
}
/**
 * Combines a writable Svelte store with a callable function. This type allows a writable store to also act as a
 * function enabling flexible reactive behavior.
 *
 * @typeParam T - The type of the value stored in the writable store.
 *
 * @typeParam Args - The tuple of argument types accepted by the function.
 *
 * @typeParam R - The return type of the function.
 */
interface WritableFn<T, Args extends unknown[], R = void> extends Writable<T> {
  (...args: Args): R;
}

export { isMinimalWritableStore, isReadableStore, isWritableStore, subscribeFirstRest, subscribeIgnoreFirst };
export type { IOWritable, MinimalIOWritable, MinimalWritable, MinimalWritableFn, WritableFn };
