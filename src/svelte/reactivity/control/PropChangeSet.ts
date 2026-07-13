import type { PropChangeTracker }  from './PropChangeTracker';

/**
 * Internal implementation of the transient change-set view for {@link PropChangeTracker}.
 */
export class PropChangeSet<K extends PropertyKey> implements PropChangeTracker.Data.ChangeSet<K>
{
   readonly #keys: readonly K[];
   readonly #indexByKey: ReadonlyMap<K, number>;
   readonly #state: PropChangeTracker.Data.ChangeState;

   constructor(keys: readonly K[], indexByKey: ReadonlyMap<K, number>, state: PropChangeTracker.Data.ChangeState)
   {
      this.#keys = keys;
      this.#indexByKey = indexByKey;
      this.#state = state;
   }

   get changed(): boolean
   {
      return this.#state.count > 0;
   }

   get count(): number
   {
      return this.#state.count;
   }

   has(key: K): boolean
   {
      const index = this.#indexByKey.get(key);
      return index !== void 0 && (this.#state.flags[index] ?? false);
   }

   hasAny(keys: readonly K[]): boolean
   {
      for (let index = 0; index < keys.length; index++)
      {
         if (this.has(keys[index]!)) { return true; }
      }

      return false;
   }

   hasAll(keys: readonly K[]): boolean
   {
      for (let index = 0; index < keys.length; index++)
      {
         if (!this.has(keys[index]!)) { return false; }
      }

      return true;
   }

   *[Symbol.iterator](): IterableIterator<K>
   {
      for (let index = 0; index < this.#keys.length; index++)
      {
         if (this.#state.flags[index]) { yield this.#keys[index]!; }
      }
   }

   toArray(): K[]
   {
      const result: K[] = [];

      for (let index = 0; index < this.#keys.length; index++)
      {
         if (this.#state.flags[index]) { result.push(this.#keys[index]!); }
      }

      return result;
   }
}
