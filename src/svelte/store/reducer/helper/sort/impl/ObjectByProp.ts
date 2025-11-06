import { get, writable }            from 'svelte/store';

import { isMinimalWritableStore }   from '#runtime/svelte/store/util';
import { isObject }                 from '#runtime/util/object';
import { CrossRealm }               from '#runtime/util/realm';

import type {
   Subscriber,
   Unsubscriber }                   from 'svelte/store';

import type { DynReducer }          from '#runtime/svelte/store/reducer';
import type { MinimalWritable }     from '#runtime/svelte/store/util';

import type { DynReducerHelper }    from '../../DynReducerHelper';

/**
 * Defines the data object and sort / comparison function returned by {@link DynReducerHelper.sort.objectByProp}
 * providing managed sorting and comparison utility for dynamic reducers.
 *
 * Several built-in sorting strategies are applied automatically based on the `typeof` the values being compared. This
 * allows flexible, type-aware sorting without requiring a custom compare function for common data types.
 *
 * ### Built-in `typeof` handling
 *
 * | Type (`typeof` value) | Behavior |
 * |-----------------------|-----------|
 * | `string`  | Lexicographic order using `String.prototype.localeCompare()`. |
 * | `number`  | Numeric ascending order using subtraction (`a - b`). |
 * | `boolean` | `false` sorts before `true` via numeric coercion (`Number(a) - Number(b)`). |
 * | `bigint`  | Numeric ascending order using relational comparison (`a < b ? -1 : a > b ? 1 : 0`). |
 * | `object`  | Special handling for `Date` objects sorted by `getTime()`; other objects compare as equal. |
 * | `undefined` | Treated as the lowest possible value (always sorts first). |
 * | Other types (`symbol`, `function`) | Not ordered — treated as equal and left in original sequence. |
 *
 * ### Custom comparison
 *
 * Users may provide their own comparator configuration via the `customCompareFnMap` option, which can be:
 * - A plain function `(a, b) => number`.
 * - An object with a `.compare(a, b)` method.
 * - A static class exposing a `.compare(a, b)` method.
 *
 * These custom comparators override the default `typeof` handling for the property keys specified in the
 * `customCompareFnMap`.
 */
export class ObjectByProp<T extends { [key: string]: any }> implements DynReducerHelper.Sort.ObjectByProp<T>
{
   /**
    * Custom property to compare function or instance lookup.
    */
   #customCompareFnMap?: { [key: string]: DynReducer.Data.CompareFn<T> | DynReducer.Data.Sort<T> };

   /**
    * Current custom compare function that is found in `#customCompareFnMap` when properties change.
    */
   #customCompareFn?: DynReducer.Data.CompareFn<T> | DynReducer.Data.Sort<T>;

   /**
    * Associated dynamic reducer index update function that is injected by `sortByFn` subscription / addition to a
    * dynamic reducer.
    */
   #indexUpdateFn?: DynReducer.Data.IndexUpdateFn;

   /**
    * Current object property being sorted.
    */
   #prop?: string;

   /**
    * Managed sort / comparison function added to a dynamic reducer.
    */
   readonly #sortByFn: DynReducer.Data.CompareFn<T>;

   /**
    * Current sort state controlling the associated dynamic reducer reversed state.
    */
   #state?: string = 'none';

   /**
    * Target external store to serialize the sort property and state.
    */
   readonly #store: MinimalWritable<any>;

   /**
    * @param [options] - Options.
    *
    * @param [options.store] - An external store that serializes the tracked prop and sorting state.
    *
    * @param [options.customCompareFnMap] - An object with property keys associated with custom compare functions for
    *        those keys.
    */
   constructor({ store = writable({ prop: void 0, state: void 0 }), customCompareFnMap }:
    { store?: MinimalWritable<unknown>, customCompareFnMap?: { [key: string]: DynReducer.Data.CompareFn<T> |
     DynReducer.Data.Sort<T> }} = {})
   {
      if (!isMinimalWritableStore(store))
      {
         throw new TypeError(`'store' is not a MinimalWritable store.`)
      }

      if (customCompareFnMap !== void 0 && !isObject(customCompareFnMap))
      {
         throw new TypeError(`'customCompareFnMap' is not an object or undefined.`)
      }

      this.#customCompareFnMap = customCompareFnMap;
      this.#store = store;

      this.#initializeStore();
      this.#sortByFn = this.#initializeSortByFn();
      this.#updateCustomCompareFn();
   }

   /**
    * Returns the comparison function for associated dynamic reducer.
    */
   get compare(): DynReducer.Data.CompareFn<T>
   {
      return this.#sortByFn;
   }

   /**
    * Get the current object property being sorted.
    */
   get prop(): string | undefined
   {
      return this.#prop;
   }

   /**
    * Get the current sort state:
    * ```
    * - `none` no sorting.
    * - `asc` ascending sort.
    * - `desc` descending sort.
    * ```
    */
   get state(): string | undefined
   {
      return this.#state;
   }

   /**
    * Returns any current custom compare function lookup map.
    */
   getCustomCompareFnMap()
   {
      return this.#customCompareFnMap;
   }

   /**
    * Resets `prop` and `state`.
    */
   reset()
   {
      this.#prop = void 0;
      this.#state = 'none';

      this.#updateCustomCompareFn();

      this.#store.set({ prop: this.#prop, state: this.#state });

      // Forces an index update / sorting is triggered.
      this.#indexUpdateFn?.({ reversed: this.#state === 'desc' });
   }

   /**
    * Sets the current sorted object property and sort state. You may provide partial data, but state must be
    * one of: `none`, `asc`, or `desc`.
    *
    * @param data - New prop / state data to set.
    */
   set({ prop, state }: DynReducerHelper.Sort.ObjectByPropData = {})
   {
      let update = false;

      if ((prop === void 0 || typeof prop === 'string') && this.#prop !== prop)
      {
         this.#prop = prop;
         this.#updateCustomCompareFn();
         update = true;
      }

      if ((state === void 0 || state === 'none' || state === 'asc' || state === 'desc') && this.#state !== state)
      {
         this.#state = state === void 0 ? 'none' : state;
         update = true;
      }

      if (update)
      {
         this.#store.set({ prop: this.#prop, state: this.#state });

         // Forces an index update / sorting is triggered.
         this.#indexUpdateFn?.({ reversed: this.#state === 'desc' });
      }
   };

   /**
    * Sets the current custom compare function lookup map for object properties that require unique sorting.
    *
    * @param customCompareFnMap - New custom compare function map to set.
    */
   setCustomCompareFnMap(customCompareFnMap: { [key: string]: DynReducer.Data.CompareFn<T> | DynReducer.Data.Sort<T> }
    | undefined)
   {
      if (customCompareFnMap !== void 0 && !isObject(customCompareFnMap))
      {
         throw new TypeError(`'customCompareFnMap' is not an object or undefined.`)
      }

      this.#customCompareFnMap = customCompareFnMap;

      this.#updateCustomCompareFn();

      this.#indexUpdateFn?.({ force: true });
   }

   /**
    * Implements the Readable store interface forwarding a subscription to the external serializing store.
    *
    * @param handler - Subscriber callback.
    *
    * @returns Unsubscribe function.
    */
   subscribe(handler: Subscriber<{ prop?: string, state?: string }>): Unsubscriber
   {
      return (this.#store as MinimalWritable<{ prop?: string, state?: string }>).subscribe(handler);
   }

   /**
    * Toggles current prop state and or initializes a new prop sort state. A property that is selected multiple
    * times will cycle through ascending -> descending -> no sorting.
    *
    * @param prop - Object property to activate.
    */
   toggleProp(prop: string | undefined)
   {
      if (prop !== void 0 && typeof prop !== 'string')
      {
         throw TypeError(`'prop' is not a string or undefined.`);
      }

      /**
       * Determine current state. If the `prop` being toggled is the current `sortBy` prop then use the stored state.
       * Otherwise, this is a new property to toggle and start from `none`.
       */

      const currentState: string | undefined = this.#prop === prop ? this.#state : 'none';

      switch (currentState)
      {
         case 'none':
            this.#state = 'asc';
            break;

         case 'asc':
            this.#state = 'desc';
            break;

         case 'desc':
            this.#state = 'none';
            break;

         default:
            this.#state = 'none';
            break;
      }

      const updateCompareFn = this.#prop !== prop;

      this.#prop = prop;

      if (updateCompareFn) { this.#updateCustomCompareFn(); }

      this.#store.set({ prop: this.#prop, state: this.#state });

      // Forces an index update / sorting is triggered.
      this.#indexUpdateFn?.({ reversed: this.#state === 'desc' });
   }

   // Internal Implementation ----------------------------------------------------------------------------------------

   /**
    * Validate / configure initial external store data
    */
   #initializeStore()
   {
      const storeValue = get(this.#store);

      if (!isObject(storeValue))
      {
         this.#store.set({ prop: this.#prop, state: this.#state });
      }
      else
      {
         const prevProp = storeValue.prop;
         const prevState = storeValue.state;

         // Accept previous prop value.
         if (typeof prevProp === 'string') { this.#prop = prevProp; }

         if (typeof prevState === 'string')
         {
            // Set previous state if valid or reset store value.
            if (prevState === 'none' || prevState === 'asc' || prevState === 'desc')
            {
               this.#state = prevState;
            }
            else
            {
               this.#store.set({ prop: this.#prop, state: this.#state });
            }
         }

         // Potentially detect errant / extra keys and reset store value.
         for (const key of Object.keys(storeValue))
         {
            if (key !== 'prop' && key !== 'state')
            {
               this.#store.set({ prop: this.#prop, state: this.#state });
               break;
            }
         }
      }
   }

   /**
    * Create sort function that is returned by {@link ObjectByProp.compare}.
    */
   #initializeSortByFn(): DynReducer.Data.CompareFn<T>
   {
      const sortByFn = (a: T, b: T): number =>
      {
         if (this.#prop === void 0 || this.#state === 'none') { return 0; }

         const aVal = a?.[this.#prop];
         const bVal = b?.[this.#prop];

         // Custom compare -------------------------------------------------------------------------------------------

         if (this.#customCompareFn)
         {
            return 'compare' in this.#customCompareFn ? this.#customCompareFn.compare?.(aVal, bVal) :
             this.#customCompareFn(aVal, bVal);
         }

         // Default compare ------------------------------------------------------------------------------------------

         if (aVal === bVal) { return 0; }

         const aType = typeof aVal;
         const bType = typeof bVal;

         switch (aType)
         {
            case 'bigint':
               if (bType === 'bigint') { return aVal === bVal ? 0 : (aVal as bigint) < (bVal as bigint) ? -1 : 1; }
               break;

            case 'boolean':
               if (bType === 'boolean') { return Number(aVal as boolean) - Number(bVal as boolean); }
               break;

            case 'number':
               if (bType === 'number') { return (aVal as number) - (bVal as number); }
               break;

            case 'object':
               // Do comparison if both values are Date instances.
               if (CrossRealm.lang.isDate(aVal) && CrossRealm.lang.isDate(bVal))
               {
                  return aVal.getTime() - bVal.getTime();
               }
               break;

            case 'string':
               if (bType === 'string') { return (aVal as string).localeCompare((bVal as string)); }
               break;
         }

         return 0;
      };

      /**
       * Custom dynamic reducer subscriber accepting the index update function.
       *
       * @param handler - Dynamic
       */
      sortByFn.subscribe = (handler: DynReducer.Data.IndexUpdateFn) =>
      {
         this.#indexUpdateFn = handler;

         // Forces an index update / sorting is triggered.
         this.#indexUpdateFn?.({ reversed: this.#state === 'desc' });

         return () => this.#indexUpdateFn = void 0;
      }

      return sortByFn;
   }

   /**
    * Updates the cached custom compare function based on current prop value and any custom compare function map.
    */
   #updateCustomCompareFn()
   {
      const customCompare = this.#prop ? this.#customCompareFnMap?.[this.#prop] : void 0;
      if (customCompare === void 0)
      {
         this.#customCompareFn = void 0;
      }
      else if (typeof customCompare === 'function')
      {
         // Case 1: It's a class with a static compare method.
         if ('compare' in customCompare && typeof (customCompare as any).compare === 'function')
         {
            this.#customCompareFn = customCompare;
         }

         // Case 2: It's a plain function comparator.
         this.#customCompareFn = customCompare;
      }
      else if (typeof customCompare?.compare === 'function')
      {
         // Case 3: It's an object instance with a compare method.
         this.#customCompareFn = customCompare;
      }
   }
}
