/**
 * Provides strictly readonly collections at runtime including {@link ReadonlyMap} and {@link ReadonlySet}.
 *
 * The protection level provided is for accidental modification. A determined caller could still mutate via
 * `Map.prototype.set.call(frozenMap, ...)` or `Set.prototype.add.call(frozenSet, ...)`.
 */
abstract class Frozen
{
   private constructor()
   {
      throw new Error('Frozen constructor: This is a static class and should not be constructed.');
   }

   /**
    * @param [entries] - Target Map or iterable of [key, value] pairs.
    *
    * @returns A strictly ReadonlyMap.
    */
   static Map<K, V>(entries?: Iterable<[K, V]>): ReadonlyMap<K, V>
   {
      const result = new Map(entries) as ReadonlyMap<K, V>;

      // @ts-expect-error
      result.set = void 0;
      // @ts-expect-error
      result.delete = void 0;
      // @ts-expect-error
      result.clear = void 0;

      return result;
   }

   /**
    * @param [data] - Target Set or iterable list.
    *
    * @returns A strictly ReadonlySet.
    */
   static Set<T>(data?: Iterable<T>): ReadonlySet<T>
   {
      const result = new Set(data) as ReadonlySet<T>;

      // @ts-expect-error
      result.add = void 0;
      // @ts-expect-error
      result.delete = void 0;
      // @ts-expect-error
      result.clear = void 0;

      return result;
   }
}

Object.freeze(Frozen);

export { Frozen };
