/**
 * Provides strictly readonly collections at runtime including {@link ReadonlyMap} and {@link ReadonlySet}.
 *
 * The protection level provided is for accidental modification. A determined caller could still mutate via
 * `Map.prototype.set.call(frozenMap, ...)` or `Set.prototype.add.call(frozenSet, ...)`.
 */
class Frozen
{
   /**
    * @hideconstructor
    */
   constructor()
   {
      throw new Error('Frozen constructor: This is a static class and should not be constructed.');
   }

   /**
    * @param {Iterable<[K, V]>} entries - Target Map or iterable of [key, value] pairs.
    *
    * @returns {ReadonlyMap<K, V>} A strictly ReadonlyMap.
    *
    * @template K, V
    */
   static Map(entries)
   {
      const result = new Map(entries);

      result.set = void 0;
      result.delete = void 0;
      result.clear = void 0;

      return /** @type {ReadonlyMap<K, V>} */ result;
   }

   /**
    * @param {Iterable<T>} data - Target Set or iterable list.
    *
    * @returns {ReadonlySet<T>} A strictly ReadonlySet.
    *
    * @template T
    */
   static Set(data)
   {
      const result = new Set(data);

      result.add = void 0;
      result.delete = void 0;
      result.clear = void 0;

      return /** @type {ReadonlySet<T>} */ result;
   }
}

Object.freeze(Frozen);

export { Frozen };
