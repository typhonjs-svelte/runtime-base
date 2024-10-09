import type { Readable } from 'svelte/store';

/**
 * The minimal requirements of the [writable store contract](https://svelte.dev/docs/svelte-components#script-4-prefix-stores-with-$-to-access-their-values).
 *
 * A minimal writable is a `Readable` / subscribable, but only has a `set` method omitting the `update` method from
 * `Writable`.
 */
interface MinimalWritable<T> extends Readable<T> {
  /**
   * Set value and inform subscribers.
   * @param value to set
   */
  set(this: void, value: T): void;
}

export {
  MinimalWritable
}
