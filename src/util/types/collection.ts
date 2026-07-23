/**
 * Extracts the element type of array or tuple.
 *
 * @category Collections
 *
 * @example
 * Extract an element type from an array.
 *
 * ```ts
 * type Entry = { id: string; value: number; };
 *
 * type Element = ArrayElement<readonly Entry[]>;
 * // { id: string; value: number }
 * ```
 *
 * @example
 * Extract the union of tuple element types.
 *
 * ```ts
 * type Element = ArrayElement<readonly [string, number, boolean]>;
 * // string | number | boolean
 * ```
 */
type ArrayElement<T extends readonly unknown[]> = T[number];

/**
 * Extracts the element type of iterable.
 *
 * @category Collections
 *
 * @example
 * Extract the value type yielded by a collection.
 *
 * ```ts
 * type SetElement = IterableElement<Set<number>>;
 * // number
 *
 * type MapElement = IterableElement<Map<string, boolean>>;
 * // [string, boolean]
 * ```
 */
type IterableElement<T> = T extends Iterable<infer E> ? E : never;

/**
 * Represents a mutable array containing at least one element.
 *
 * @category Collections
 *
 * @example
 * Require an array to contain an initial value.
 *
 * ```ts
 * const values: NonEmptyArray<number> = [1, 2, 3];
 *
 * const first: number = values[0];
 *
 * // @ts-expect-error An empty array is not permitted.
 * const empty: NonEmptyArray<number> = [];
 * ```
 */
type NonEmptyArray<T> = [T, ...T[]];

/**
 * Represents a readonly array containing at least one element.
 *
 * @category Collections
 *
 * @example
 * Require a readonly array to contain an initial value.
 *
 * ```ts
 * const values: ReadonlyNonEmptyArray<string> = ['alpha', 'beta'];
 *
 * const first: string = values[0];
 *
 * // @ts-expect-error The array is readonly.
 * values.push('gamma');
 *
 * // @ts-expect-error An empty array is not permitted.
 * const empty: ReadonlyNonEmptyArray<string> = [];
 * ```
 */
type ReadonlyNonEmptyArray<T> = readonly [T, ...T[]];

export {
   ArrayElement,
   IterableElement,
   NonEmptyArray,
   ReadonlyNonEmptyArray
};
