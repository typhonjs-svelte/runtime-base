import type {
   Readable,
   Writable,
   Updater }   from 'svelte/store';

/**
 * Extends {@link Writable} to allow type differentiation between writing and reading data. This is useful when
 * converting or transforming input data to a different or more specific output.
 *
 * @typeParam W - Writable / input type.
 *
 * @typeParam R - Readable / output type.
 */
interface IOWritable<W, R> extends Readable<R>
{
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
interface MinimalIOWritable<W, R> extends Readable<R>
{
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
interface MinimalWritableFn<T, Args extends unknown[], R = void> extends MinimalWritable<T>
{
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
interface WritableFn<T, Args extends unknown[], R = void> extends Writable<T>
{
   (...args: Args): R;
}

export {
  IOWritable,
  MinimalIOWritable,
  MinimalWritable,
  MinimalWritableFn,
  WritableFn
}
