import { get, writable }            from 'svelte/store';

import { isMinimalWritableStore }   from '#runtime/svelte/store/util';

import {
   isObject,
   isPropertyPath,
   isPropertyPathEqual,
   PropertyPathMap,
   safeAccess }                     from '#runtime/util/object';

import { CrossRealm }               from '#runtime/util/realm';

import type {
   Subscriber,
   Unsubscriber }                   from 'svelte/store';

import type { DynReducer }          from '#runtime/svelte/store/reducer';
import type { MinimalWritable }     from '#runtime/svelte/store/util';

import type { PropertyPath }        from '#runtime/util/object';

import type { DynReducerHelper }    from '../../DynReducerHelper';

/**
 * Defines the data object and sort / comparison function returned by {@link DynReducerHelper.sort.objectByPath}
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
export class ObjectByPath<T extends { [key: PropertyKey]: any }> implements DynReducerHelper.Sort.ObjectByPath<T>
{
   /**
    * Custom property to compare function or instance lookup.
    */
   #customCompareFnMap?: PropertyPathMap<DynReducer.Data.CompareFn<T> | DynReducer.Data.Sort<T>>;

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
   #path?: PropertyPath;

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
   readonly #store: MinimalWritable<DynReducerHelper.Sort.ObjectByPathData>;

   /**
    * @param [options] - Options.
    */
   constructor({ path, state, store = writable({ path: void 0, state: void 0 }), customCompareFnMap }:
    DynReducerHelper.Sort.ObjectByPathOptions<T> = {})
   {
      if (!isMinimalWritableStore(store))
      {
         throw new TypeError(`'store' is not a MinimalWritable store.`);
      }

      if (customCompareFnMap !== void 0 && !(customCompareFnMap instanceof PropertyPathMap))
      {
         throw new TypeError(`'customCompareFnMap' is not an PropertyPathMap or undefined.`);
      }

      if (path !== void 0 && !isPropertyPath(path))
      {
         throw new TypeError(`'path' must be a string or undefined.`);
      }

      if (state !== void 0 && state !== 'none' && state !== 'asc' && state !== 'desc')
      {
         throw new TypeError(`'state' must be 'none, 'asc', or 'desc'.`);
      }

      this.#customCompareFnMap = customCompareFnMap;
      this.#store = store;

      if (path) { this.#path = path; }
      if (typeof state === 'string') { this.#state = state; }

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
   get path(): PropertyPath | undefined
   {
      return this.#path;
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
   getCustomCompareFnMap(): PropertyPathMap<DynReducer.Data.CompareFn<T> | DynReducer.Data.Sort<T>> | undefined
   {
      return this.#customCompareFnMap;
   }

   /**
    * Resets `path` and `state`.
    */
   reset()
   {
      this.#path = void 0;
      this.#state = 'none';

      this.#updateCustomCompareFn();

      this.#store.set({ path: this.#path, state: this.#state });

      // Forces an index update / sorting is triggered.
      this.#indexUpdateFn?.({ reversed: this.#state === 'desc' });
   }

   /**
    * Sets the current sorted object property and sort state. You may provide partial data, but state must be
    * one of: `none`, `asc`, or `desc`.
    *
    * @param data - New path / state data to set.
    */
   set({ path, state }: DynReducerHelper.Sort.ObjectByPathData = {})
   {
      let update = false;

      if ((path === void 0 || isPropertyPath(path)) && !isPropertyPathEqual(this.#path, path))
      {
         this.#path = path;
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
         this.#store.set({ path: this.#path, state: this.#state });

         // Forces an index update / sorting is triggered.
         this.#indexUpdateFn?.({ reversed: this.#state === 'desc' });
      }
   };

   /**
    * Sets the current custom compare function lookup map for object properties that require unique sorting.
    *
    * @param customCompareFnMap - New custom compare function map to set.
    */
   setCustomCompareFnMap(customCompareFnMap: PropertyPathMap<DynReducer.Data.CompareFn<T> | DynReducer.Data.Sort<T>> |
    undefined)
   {
      if (customCompareFnMap !== void 0 && !(customCompareFnMap instanceof PropertyPathMap))
      {
         throw new TypeError(`'customCompareFnMap' is not a PropertyPathMap or undefined.`)
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
   subscribe(handler: Subscriber<DynReducerHelper.Sort.ObjectByPathData>): Unsubscriber
   {
      return this.#store.subscribe(handler);
   }

   /**
    * Toggles current path state and or initializes a new path sort state. A property that is selected multiple
    * times will cycle through ascending -> descending -> no sorting.
    *
    * @param path - Object property to activate.
    */
   togglePath(path: PropertyPath | undefined)
   {
      if (path !== void 0 && !isPropertyPath(path))
      {
         throw TypeError(`'path' is not a PropertyPath or undefined.`);
      }

      /**
       * Determine current state. If the `path` being toggled is the current `sortBy` path then use the stored state.
       * Otherwise, this is a new property to toggle and start from `none`.
       */

      const isPropPathEqual = isPropertyPathEqual(this.#path, path);

      const currentState: string | undefined = isPropPathEqual ? this.#state : 'none';

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

      this.#path = path;

      if (!isPropPathEqual) { this.#updateCustomCompareFn(); }

      this.#store.set({ path: this.#path, state: this.#state });

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

      if (!isObject(storeValue) || !isPropertyPath(storeValue?.path))
      {
         this.#store.set({ path: this.#path, state: this.#state });
      }
      else
      {
         const prevProp = storeValue.path;
         const prevState = storeValue.state;

         // Accept previous path value.
         if (isPropertyPath(prevProp)) { this.#path = prevProp; }

         if (isPropertyPath(prevState))
         {
            // Set previous state if valid or reset store value.
            if (prevState === 'none' || prevState === 'asc' || prevState === 'desc')
            {
               this.#state = prevState;
            }
            else
            {
               this.#store.set({ path: this.#path, state: this.#state });
            }
         }

         // Potentially detect errant / extra keys and reset store value.
         for (const key of Object.keys(storeValue))
         {
            if (key !== 'path' && key !== 'state')
            {
               this.#store.set({ path: this.#path, state: this.#state });
               break;
            }
         }
      }
   }

   /**
    * Create sort function that is returned by {@link ObjectByPath.compare}.
    */
   #initializeSortByFn(): DynReducer.Data.CompareFn<T>
   {
      const sortByFn = (a: T, b: T): number =>
      {
         if (this.#path === void 0 || this.#state === 'none') { return 0; }

         const aVal = safeAccess(a, this.#path);
         const bVal = safeAccess(b, this.#path);

         // Custom compare -------------------------------------------------------------------------------------------

         if (this.#customCompareFn)
         {
            return 'compare' in this.#customCompareFn ?
             // @ts-ignore
             (this.#customCompareFn as DynReducer.Data.Sort<T>).compare?.(aVal, bVal) :
              // @ts-ignore
              (this.#customCompareFn as DynReducer.Data.CompareFn<T>)(aVal, bVal);
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
    * Updates the cached custom compare function based on current path value and any custom compare function map.
    */
   #updateCustomCompareFn()
   {
      const customCompare: DynReducer.Data.CompareFn<T> | DynReducer.Data.Sort<T> | undefined =
       this.#path ? this.#customCompareFnMap?.get(this.#path) : void 0;

      if (customCompare === void 0)
      {
         this.#customCompareFn = void 0;
      }
      else if (typeof customCompare === 'function')
      {
         // Case 1: It's a class with a static compare method.
         if ('compare' in customCompare && typeof customCompare.compare === 'function')
         {
            this.#customCompareFn = customCompare as DynReducer.Data.Sort<T>;
         }

         // Case 2: It's a plain function comparator.
         this.#customCompareFn = customCompare as DynReducer.Data.CompareFn<T>;
      }
      else if (typeof customCompare?.compare === 'function')
      {
         // Case 3: It's an object instance with a compare method.
         this.#customCompareFn = customCompare;
      }
   }
}
