import * as svelte_store from 'svelte/store';
import { Readable } from 'svelte/store';

/**
 * The minimal requirements of the [writable store contract](https://svelte.dev/docs/svelte-components#script-4-prefix-stores-with-$-to-access-their-values).
 *
 * A minimal writable is a {@link Readable} / subscribable, but only has a `set` method omitting the `update` method
 * from `Writable`.
 */
interface MinimalWritable<T> extends Readable<T> {
  /**
   * Set value and inform subscribers.
   * @param value to set
   */
  set(this: void, value: T): void;
}

/**
 * Provides a basic test for a given variable to test if it has the shape of a readable store by having a `subscribe`
 * function.
 *
 * Note: functions are also objects, so test that the variable might be a function w/ a `subscribe` function.
 *
 * @param {*}  store - variable to test that might be a store.
 *
 * @returns {boolean} Whether the variable tested has the shape of a store.
 */
declare function isReadableStore(store: any): boolean;
/**
 * Provides a basic test for a given variable to test if it has the shape of a minimal writable store by having a
 * `subscribe` and `set` functions.
 *
 * Note: functions are also objects, so test that the variable might be a function w/ `subscribe` & `set` functions.
 *
 * @param {*}  store - variable to test that might be a store.
 *
 * @returns {boolean} Whether the variable tested has the shape of a {@link MinimalWritable} store.
 */
declare function isMinimalWritableStore(store: any): boolean;
/**
 * Provides a basic test for a given variable to test if it has the shape of a writable store by having a `subscribe`
 * `set`, and `update` functions.
 *
 * Note: functions are also objects, so test that the variable might be a function w/ `subscribe`, `set, and `update`
 * functions.
 *
 * @param {*}  store - variable to test that might be a store.
 *
 * @returns {boolean} Whether the variable tested has the shape of a store.
 */
declare function isWritableStore(store: any): boolean;
/**
 * Subscribes to the given store with the update function provided and ignores the first automatic
 * update. All future updates are dispatched to the update function.
 *
 * @param {import('svelte/store').Readable | import('svelte/store').Writable} store -
 *  Store to subscribe to...
 *
 * @param {import('svelte/store').Updater} update - function to receive future updates.
 *
 * @returns {import('svelte/store').Unsubscriber} Store unsubscribe function.
 */
declare function subscribeIgnoreFirst(
  store: svelte_store.Readable<any> | svelte_store.Writable<any>,
  update: any,
): svelte_store.Unsubscriber;
/**
 * Subscribes to the given store with two update functions provided. The first function is invoked on the initial
 * subscription. All future updates are dispatched to the update function.
 *
 * @param {import('svelte/store').Readable | import('svelte/store').Writable} store -
 *  Store to subscribe to...
 *
 * @param {import('svelte/store').Updater} first - Function to receive first update.
 *
 * @param {import('svelte/store').Updater} update - Function to receive future updates.
 *
 * @returns {import('svelte/store').Unsubscriber} Store unsubscribe function.
 */
declare function subscribeFirstRest(
  store: svelte_store.Readable<any> | svelte_store.Writable<any>,
  first: any,
  update: any,
): svelte_store.Unsubscriber;

export {
  type MinimalWritable,
  isMinimalWritableStore,
  isReadableStore,
  isWritableStore,
  subscribeFirstRest,
  subscribeIgnoreFirst,
};
