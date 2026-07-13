import { PropChangeSet } from './PropChangeSet';

/**
 * Explicitly checks selected properties against their previously supplied values.
 *
 * `PropertyChangeTracker` has no subscriptions or reactive behavior of its own. A host, such as a Svelte reactive
 * statement, determines when {@link PropChangeTracker.check} is called and retains full control over any
 * resulting side effects.
 *
 * Each check compares and then commits the latest values. A comparator may therefore consider two distinct values
 * equal, while the most recently supplied value still becomes the baseline for the next check.
 *
 * PropChangeTracker maintains a snapshot of selected object properties and reports which tracked properties changed
 * between successive check() calls. It is intended for explicit reactive control flow and does not introduce
 * subscriptions or hidden reactivity.
 *
 * @example
 * Track changes to a subset of resolved component properties.
 *
 * ```svelte
 * <script lang="ts">
 *    import { PropChangeTracker }  from '#runtime/svelte/reactivity';
 *
 *    import { isObject }           from '#runtime/util/object';
 *
 *    import {
 *       isBoolean,
 *       isString,
 *       resolveByPredicate }       from '#runtime/util/predicate';
 *
 *    interface Props
 *    {
 *       foo?: boolean;
 *       bar?: string;
 *    }
 *
 *    // Combined props options object with `foo` and / or `bar`.
 *    export let options?: Props = void 0;
 *
 *    // Individual prop `foo`
 *    export let foo ?: string = void 0;
 *
 *    // Individual prop `bar`
 *    export let bar?: string = void 0;
 *
 *    const tracker = new PropChangeTracker<Props>({
 *       keys: ['foo', 'bar']
 *    });
 *
 *    // Stores all resolved props.
 *    const props: Props = {};
 *
 *    // Normalize the combined options separately from resolution of the individual exported props. The individual
 *    // props will take precedence over the combined options object.
 *
 *    $: inputOptions: Props = isObject(options) ? options : {};
 *
 *    $: props.foo = resolveByPredicate(isBoolean, foo, inputOptions.foo) ?? true;
 *
 *    $: props.bar = resolveByPredicate(isString, bar, inputOptions?.bar);
 *
 *    // Control based logic based on prop changes.
 *    $: {
 *       const changes = tracker.check(props);
 *
 *       if (changes.changed)
 *       {
 *          if (changes.has('foo'))
 *          {
 *             // `foo` state changed.
 *          }
 *
 *          if (changes.hasAny('foo', 'bar'))
 *          {
 *             // `foo` and / or `bar` changed.
 *          }
 *       }
 *    }
 * </script>
 * ```
 *
 * @template T - Source object shape.
 * @template K - Tracked properties from the source object.
 */
class PropChangeTracker<T extends object, K extends keyof T = keyof T>
{
   readonly #keys: readonly K[];
   readonly #comparators: readonly PropChangeTracker.Data.EqualityComparator<unknown>[];
   readonly #previousValues: unknown[];
   readonly #state: PropChangeTracker.Data.ChangeState;
   readonly #changes: PropChangeTracker.Data.ChangeSet<K>;
   readonly #initialMode: 'changed' | 'baseline' | 'undefined';

   #initialized = false;

   constructor(options: PropChangeTracker.Options<T, K>)
   {
      if (!options || !Array.isArray(options.keys) || options.keys.length === 0)
      {
         throw new TypeError("'options.keys' must be a non-empty array of property keys.");
      }

      const keys = options.keys.slice();
      const indexByKey = new Map<K, number>();

      for (let index = 0; index < keys.length; index++)
      {
         const key = keys[index]!;
         const keyType = typeof key;

         if (keyType !== 'string' && keyType !== 'number' && keyType !== 'symbol')
         {
            throw new TypeError(`Invalid property key at index ${index}.`);
         }

         if (indexByKey.has(key))
         {
            throw new TypeError(`Duplicate tracked property key: ${String(key)}`);
         }

         indexByKey.set(key, index);
      }

      const defaultEquals = options.defaultEquals ?? Object.is;

      if (typeof defaultEquals !== 'function')
      {
         throw new TypeError("'options.defaultEquals' must be a function.");
      }

      const comparators: PropChangeTracker.Data.EqualityComparator<unknown>[] = new Array(keys.length);

      const equals = options.equals as Partial<Record<K, PropChangeTracker.Data.EqualityComparator<unknown>>> |
       undefined;

      for (let index = 0; index < keys.length; index++)
      {
         const key = keys[index]!;

         let comparator: PropChangeTracker.Data.EqualityComparator<unknown> | undefined;

         if (equals && Object.prototype.hasOwnProperty.call(equals, key))
         {
            const candidate: unknown = Reflect.get(equals, key);

            if (typeof candidate !== 'function')
            {
               throw new TypeError(`Equality comparator for '${String(key)}' must be a function.`);
            }

            comparator = candidate as PropChangeTracker.Data.EqualityComparator<unknown>;
         }

         comparators[index] = comparator ?? defaultEquals;
      }

      const initialMode = options.initialMode ?? 'changed';

      if (initialMode !== 'changed' && initialMode !== 'baseline' && initialMode !== 'undefined')
      {
         throw new TypeError("'options.initialMode' must be 'changed', 'baseline', or 'undefined'.");
      }

      this.#keys = Object.freeze(keys);
      this.#comparators = Object.freeze(comparators);
      this.#previousValues = new Array(keys.length).fill(void 0);
      this.#state = { count: 0, flags: new Array(keys.length).fill(false) };
      this.#changes = new PropChangeSet(this.#keys, indexByKey, this.#state);
      this.#initialMode = initialMode;
   }

   /**
    * Whether a baseline has been captured by {@link check} or {@link sync}.
    */
   get initialized(): boolean
   {
      return this.#initialized;
   }

   /**
    * Compares tracked properties with their previous values and commits the supplied values as the next baseline.
    *
    * The returned {@link PropChangeTracker.Data.ChangeSet} is reused by subsequent checks.
    *
    * @param value - Source object containing the tracked properties.
    */
   check(value: T): PropChangeTracker.Data.ChangeSet<K>
   {
      this.#validateValue(value);

      const isInitial = !this.#initialized;
      let changeCount = 0;

      for (let index = 0; index < this.#keys.length; index++)
      {
         const key = this.#keys[index]!;
         const currentValue = value[key];

         let changed: boolean;

         if (isInitial && this.#initialMode !== 'undefined')
         {
            changed = this.#initialMode === 'changed';
         }
         else
         {
            changed = !this.#comparators[index]!(this.#previousValues[index], currentValue);
         }

         this.#previousValues[index] = currentValue;
         this.#state.flags[index] = changed;

         if (changed) { changeCount++; }
      }

      this.#state.count = changeCount;
      this.#initialized = true;

      return this.#changes;
   }

   /**
    * Captures tracked property values as the new baseline without reporting changes.
    *
    * @param value - Source object containing the tracked properties.
    */
   sync(value: T): void
   {
      this.#validateValue(value);

      for (let index = 0; index < this.#keys.length; index++)
      {
         this.#previousValues[index] = value[this.#keys[index]!];
         this.#state.flags[index] = false;
      }

      this.#state.count = 0;
      this.#initialized = true;
   }

   /**
    * Clears retained values and returns the tracker to its initial state.
    */
   reset(): void
   {
      this.#previousValues.fill(void 0);
      this.#state.flags.fill(false);
      this.#state.count = 0;
      this.#initialized = false;
   }

   #validateValue(value: T): void
   {
      if ((typeof value !== 'object' && typeof value !== 'function') || value === null)
      {
         throw new TypeError("'value' must be a non-null object.");
      }
   }
}

declare namespace PropChangeTracker {
   export namespace Data {
      interface ChangeState
      {
         count: number;
         readonly flags: boolean[];
      }

      /**
       * Transient read-only view of the properties changed by the latest tracker check.
       *
       * The tracker reuses the same change-set instance for every check to avoid per-check allocation. Consumers
       * should inspect the result immediately. Use {@link PropChangeTracker.Data.ChangeSet.toArray} when a durable
       * list of changed keys is needed.
       */
      export interface ChangeSet<K extends PropertyKey> extends Iterable<K>
      {
         /**
          * Whether one or more tracked properties changed.
          */
         readonly changed: boolean;

         /**
          * Number of tracked properties that changed.
          */
         readonly count: number;

         /**
          * Determines whether a specific property changed.
          *
          * @param key - Property to test.
          */
         has(key: K): boolean;

         /**
          * Determines whether any property in `keys` changed.
          *
          * @param keys - Properties to test.
          */
         hasAny(keys: readonly K[]): boolean;

         /**
          * Determines whether every property in `keys` changed.
          *
          * @param keys - Properties to test.
          */
         hasAll(keys: readonly K[]): boolean;

         /**
          * Allocates and returns the changed properties in configured key order.
          */
         toArray(): K[];
      }

      /**
       * Determines whether two property values are equal.
       *
       * Returning `true` indicates that the values are equal and the property has not changed.
       */
      export type EqualityComparator<T> = (previous: T, current: T) => boolean;

      /**
       * Optional equality comparators assigned to individual tracked properties.
       */
      export type EqualityComparators<T extends object, K extends keyof T> = Partial<{
         readonly [P in K]: EqualityComparator<T[P]>;
      }>;
   }

   /**
    * Configuration options for {@link PropChangeTracker}.
    */
   export interface Options<T extends object, K extends keyof T>
   {
      /**
       * Properties to track. The order is retained when iterating changed properties or calling
       * {@link PropChangeTracker.Data.ChangeSet.toArray}.
       */
      keys: readonly K[];

      /**
       * Optional equality comparators for individual properties.
       */
      equals?: PropChangeTracker.Data.EqualityComparators<T, K>;

      /**
       * Equality comparator used when a property-specific comparator is not supplied.
       *
       * @defaultValue `Object.is`
       */
      defaultEquals?: PropChangeTracker.Data.EqualityComparator<unknown>;

      /**
       * Controls the result of the first check after construction or {@link PropChangeTracker.reset}.
       *
       * - `'changed'`: every tracked property is reported as changed.
       * - `'baseline'`: the first values establish the baseline and no changes are reported.
       * - `'undefined'`: each first value is compared against `undefined`.
       *
       * @defaultValue `'changed'`
       */
      initialMode?: 'changed' | 'baseline' | 'undefined';
   }
}

export { PropChangeTracker };
