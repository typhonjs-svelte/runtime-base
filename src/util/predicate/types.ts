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
export interface TypePredicate<T>
{
   (value: unknown): value is T;
}
