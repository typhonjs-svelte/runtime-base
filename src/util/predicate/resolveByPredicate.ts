import type { TypePredicate } from './types';

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
function resolveByPredicate<T>(predicate: TypePredicate<T>, ...values: unknown[]): T | undefined
{
   for (let i = 0, length = values.length; i < length; i++)
   {
      const value = values[i];

      if (predicate(value)) { return value as T; }
   }

   return void 0;
}

export { resolveByPredicate };
