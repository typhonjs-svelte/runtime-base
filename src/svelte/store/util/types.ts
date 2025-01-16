import type {
   Readable,
   Writable } from 'svelte/store';

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
type MinimalWritableFn<T, Args extends unknown[], R = void> = MinimalWritable<T> & ((...args: Args) => R);

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
type WritableFn<T, Args extends unknown[], R> = Writable<T> & ((...args: Args) => R);

export {
  MinimalWritable,
  MinimalWritableFn,
  WritableFn
}
