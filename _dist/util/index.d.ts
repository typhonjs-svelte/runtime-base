/**
 * Provides general utilities.
 *
 * @packageDocumentation
 */

/**
 * Provides strictly readonly collections at runtime including {@link ReadonlyMap} and {@link ReadonlySet}.
 *
 * The protection level provided is for accidental modification. A determined caller could still mutate via
 * `Map.prototype.set.call(frozenMap, ...)` or `Set.prototype.add.call(frozenSet, ...)`.
 */
declare abstract class Frozen {
  private constructor();
  /**
   * @param [entries] - Target Map or iterable of [key, value] pairs.
   *
   * @returns A strictly ReadonlyMap.
   */
  static Map<K, V>(entries?: Iterable<[K, V]>): ReadonlyMap<K, V>;
  /**
   * @param [data] - Target Set or iterable list.
   *
   * @returns A strictly ReadonlySet.
   */
  static Set<T>(data?: Iterable<T>): ReadonlySet<T>;
}

/**
 * Provides various utilities for generating hash codes for strings and UUIDs.
 */
declare abstract class Hashing {
  #private;
  private constructor();
  /**
   * Provides a solid string hashing algorithm.
   *
   * Sourced from: https://stackoverflow.com/a/52171480
   *
   * @param str - String to hash.
   *
   * @param [seed=0] - A seed value altering the hash; default value: `0`.
   *
   * @returns Hash code.
   */
  static hashCode(str: string, seed?: number): number;
  /**
   * Validates that the given string is formatted as a UUIDv4 string.
   *
   * @param uuid - UUID string to test.
   *
   * @returns Is UUIDv4 string.
   */
  static isUuidv4(uuid: unknown): uuid is string;
  /**
   * Generates a UUID v4 compliant ID. Please use a complete UUID generation package for guaranteed compliance.
   *
   * This code is an evolution of the `Jed UUID` from the following Gist.
   * https://gist.github.com/jed/982883
   *
   * There is a public domain / free copy license attached to it that is not a standard OSS license...
   * https://gist.github.com/jed/982883#file-license-txt
   *
   * @privateRemarks
   * The code golfing was removed in the implementation below.
   *
   * @returns UUIDv4
   */
  static uuidv4(): string;
}

/**
 * Provides utility functions for strings.
 *
 * This class should not be constructed as it only contains static methods.
 */
declare abstract class Strings {
  #private;
  private constructor();
  /**
   * Escape a given input string prefacing special characters with backslashes for use in a regular expression.
   *
   * @param str - An un-escaped input string.
   *
   * @returns The escaped string suitable for use in a regular expression.
   */
  static escape(str: string): string;
  /**
   * Normalizes a string.
   *
   * @param str - A string to normalize for comparisons.
   *
   * @returns Cleaned string.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize
   */
  static normalize(str: string): string;
}

/**
 * Provides timing related higher-order functions.
 */
declare abstract class Timing {
  private constructor();
  /**
   * Wraps a callback in a debounced timeout. Delay execution of the callback function until the function has not been
   * called for the given delay in milliseconds.
   *
   * @param callback - A function to execute once the debounced threshold has been passed.
   *
   * @param delay - An amount of time in milliseconds to delay.
   *
   * @returns A wrapped function that can be called to debounce execution.
   *
   * @example
   * /**
   *  * Debounce the update invocation by 500ms.
   *  *\/
   * const updateDebounced = Timing.debounce(() => doc.update(), 500);
   *
   * // Use the function like:
   * updateDebounced();
   *
   * @example
   * /**
   *  * Debounce the update invocation by 500ms.
   *  *
   *  * \@param {string} value - A value to update.
   *  *\/
   * const updateDebounced = Timing.debounce((value) => doc.update(value), 500);
   *
   * // Use the function like:
   * updateDebounced('new value');
   */
  static debounce<Args extends unknown[] = unknown[]>(
    callback: (...args: Args) => void,
    delay: number,
  ): (...args: Args) => void;
  /**
   * Creates a double click event handler that distinguishes between single and double clicks. Calls the `single`
   * callback on a single click and the `double` callback on a double click. The default double click delay to invoke
   * the `double` callback is 400 milliseconds.
   *
   * @param opts - Optional parameters.
   *
   * @param [opts.single] - Single click callback.
   *
   * @param [opts.double] - Double click callback.
   *
   * @param [opts.delay=400] - Double click delay.
   *
   * @returns The gated double-click handler.
   *
   * @example
   * // Given a button element.
   * button.addEventListener('click', Timing.doubleClick({
   *    single: (event) => console.log('Single click: ', event),
   *    double: (event) => console.log('Double click: ', event)
   * });
   */
  static doubleClick<E extends Event = Event>({
    single,
    double,
    delay,
  }: {
    single: (event: E) => void;
    double: (event: E) => void;
    delay: number;
  }): (event: E) => void;
}

export { Frozen, Hashing, Strings, Timing };
