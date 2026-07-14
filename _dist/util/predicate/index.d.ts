/**
 * Provides generic predicate and type guard utilities for validating unknown values enabling type-safe narrowing,
 * and resolving values through predicate-based evaluation.
 *
 * This package contains utilities applicable across the runtime including predicates for JavaScript primitive types
 * and generic predicate helpers. Predicates for domain-specific types remain defined alongside their associated APIs
 * (IE. object, DOM, Svelte, or framework-specific sub-paths) such as {@link #runtime/util/object}.
 *
 * @packageDocumentation
 */

/**
 * Determines if the given value is a boolean.
 *
 * @param value - Value to test.
 *
 * @returns True if the value is a boolean.
 */
declare function isBoolean(value: unknown): value is boolean;
/**
 * Determines if the given value is a bigint.
 *
 * @param value - Value to test.
 *
 * @returns True if the value is a bigint.
 */
declare function isBigInt(value: unknown): value is bigint;
/**
 * Determines if the given value is defined.
 *
 * @param value - Value to test.
 *
 * @returns True if the value is not undefined.
 */
declare function isDefined<T>(value: T | undefined): value is T;
/**
 * Determines if the given value is a function.
 *
 * @param value - Value to test.
 *
 * @returns True if the value is a function.
 */
declare function isFunction<T extends (...args: any[]) => any>(value: unknown): value is T;
/**
 * Determines if the given value is a finite number.
 *
 * @param value - Value to test.
 *
 * @returns True if the value is a finite number.
 */
declare function isFinite(value: unknown): value is number;
/**
 * Determines if the given value is a finite number or null.
 *
 * @param value - Value to test.
 *
 * @returns True if the value is a finite number or null.
 */
declare function isFiniteOrNull(value: unknown): value is number | null;
/**
 * Determines if the given value is an integer number.
 *
 * @param value - Value to test.
 *
 * @returns True if the value is an integer number.
 */
declare function isInteger(value: unknown): value is number;
/**
 * Determines if the given value is a number.
 *
 * Note: This includes `NaN`, `Infinity`, and `-Infinity`, matching the
 * ECMAScript `number` primitive.
 *
 * @param value - Value to test.
 *
 * @returns True if the value is a number.
 */
declare function isNumber(value: unknown): value is number;
/**
 * Determines if the given value is an integer number.
 *
 * @param value - Value to test.
 *
 * @returns True if the value is an integer number.
 */
declare function isSafeInteger(value: unknown): value is number;
/**
 * Determines if the given value is a string.
 *
 * @param value - Value to test.
 *
 * @returns True if the value is a string.
 */
declare function isString(value: unknown): value is string;
/**
 * Determines if the given value is a symbol.
 *
 * @param value - Value to test.
 *
 * @returns True if the value is a symbol.
 */
declare function isSymbol(value: unknown): value is symbol;
/**
 * Determines if the given value is undefined.
 *
 * @param value - Value to test.
 *
 * @returns True if the value is undefined.
 */
declare function isUndefined(value: unknown): value is undefined;

/**
 * Defines a type predicate used to validate an unknown value and narrow its type to `T` when the predicate returns
 * `true`.
 *
 * @template T - Type identified by the predicate.
 *
 * @param value - Value to evaluate.
 *
 * @returns `true` when the value satisfies the predicate and may be treated as type `T`; otherwise `false`.
 */
interface TypePredicate<T> {
  (value: unknown): value is T;
}

/**
 * Resolves the first value accepted by the supplied predicate.
 *
 * Values are evaluated in the order provided. The first value accepted by the predicate is returned. If no values
 * are accepted, `undefined` is returned.
 *
 * @param predicate - Predicate used to evaluate each value.
 *
 * @param values - Values to evaluate in order.
 *
 * @returns The first value accepted by the predicate; otherwise `undefined`.
 */
declare function resolveByPredicate<T>(predicate: TypePredicate<T>, ...values: unknown[]): T | undefined;

export {
  isBigInt,
  isBoolean,
  isDefined,
  isFinite,
  isFiniteOrNull,
  isFunction,
  isInteger,
  isNumber,
  isSafeInteger,
  isString,
  isSymbol,
  isUndefined,
  resolveByPredicate,
};
export type { TypePredicate };
