import * as filters        from './filter';
import * as sort           from './sort';

import type { Readable }   from 'svelte/store';

import type { DynReducer } from '#runtime/svelte/store/reducer';

import type {
   MinimalWritable,
   MinimalWritableFn }     from '#runtime/svelte/store/util';

/**
 * Provides helper functions to create dynamic store driven filters and sort functions for dynamic reducers. The
 * returned functions are also Svelte stores and can be added to a reducer as well as used as a store.
 */
abstract class DynReducerHelper
{
   private constructor()
   {
      throw new Error('DynReducerHelper constructor: This is a static class and should not be constructed.');
   }

   /**
    * Returns the following filter functions:
    * - regexObjectQuery(accessors, options); suitable for object reducers matching one or more property keys /
    *   accessors against the store value as a regex. To access deeper entries into the object format the accessor
    *   string with `.` between entries to walk. Optional parameters include logging access warnings, case sensitivity,
    *   and passing in an existing store.
    *
    * @returns All available filters.
    */
   static get filters(): DynReducerHelper.FilterAPI { return filters; }

   /**
    * Returns the following sort functions:
    * - objectByProp
    *
    * @returns All available sort functions.
    */
   static get sort(): DynReducerHelper.SortAPI { return sort; }
}

/**
 * Defines the available resources of {@link DynReducerHelper}.
 */
declare namespace DynReducerHelper {
   /**
    * All available returned filter functions.
    */
   export namespace FilterFn {
      /**
       * The returned filter function from `regexObjectQuery` helper.
       */
      export interface regexObjectQuery extends MinimalWritableFn<string, [data: { [key: string]: any }], boolean> {}
   }

   /**
    * All available filters.
    */
   export interface FilterAPI {
      /**
       * Creates a filter function to compare objects by a given accessor key against a regex test. The returned
       * function is also a minimal writable Svelte store that builds a regex from the stores value.
       *
       * Suitable for object reducers matching one or more property keys / accessors against the store value as a
       * regex. To access deeper entries into the object format the accessor string with `.` between entries to walk.
       *
       * This filter function can be used w/ a dynamic reducer and bound as a store to input elements.
       *
       * @param accessors - Property key / accessors to lookup key to compare. To access deeper entries into the object
       *        format the accessor string with `.` between entries to walk.
       *
       * @param [options] - Optional parameters.
       *
       * @param [options.accessWarn=false] - When true warnings will be posted if accessor not retrieved; default:
       *        `false`.
       *
       * @param [options.caseSensitive=false] - When true regex test is case-sensitive; default: `false`.
       *
       * @param [options.store] - Use the provided minimal writable store instead of creating a default `writable`
       *        store.
       *
       * @returns The query string filter.
       */
      regexObjectQuery: (
         accessors: string | Iterable<string>,
         options?: {
            accessWarn?: boolean,
            caseSensitive?: boolean,
            store?: MinimalWritable<string>
         }
      ) => FilterFn.regexObjectQuery
   }

   /**
    * All available returned sort function / data.
    */
   export namespace Sort {
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
      export interface ObjectByProp<T> extends Omit<DynReducer.Data.Sort<T>, 'subscribe'>, Readable<ObjectByPropData>
      {
         /**
          * Get the current object property being sorted.
          */
         get prop(): string | undefined;

         /**
          * Get the current sort state:
          * ```
          * - `none` no sorting.
          * - `asc` ascending sort.
          * - `desc` descending sort.
          * ```
          */
         get state(): string | undefined;

         /**
          * Returns any current custom compare function lookup map.
          */
         getCustomCompareFnMap(): { [key: string]: DynReducer.Data.CompareFn<T> | DynReducer.Data.Sort<T> } | undefined;

         /**
          * Resets `prop` and `state`.
          */
         reset(): void;

         /**
          * Sets the current sorted object property and sort state. You may provide partial data, but state must be
          * one of: `none`, `asc`, or `desc`.
          *
          * @param data - New prop / state data to set.
          */
         set(data: ObjectByPropData): void;

         /**
          * Sets the current custom compare function lookup map for object properties that require unique sorting.
          *
          * @param customCompareFnMap - New custom compare function map to set.
          */
         setCustomCompareFnMap(customCompareFnMap:
          { [key: string]: DynReducer.Data.CompareFn<T> | DynReducer.Data.Sort<T> } | undefined): void;

         /**
          * Toggles current prop state and or initializes a new prop sort state. A property that is selected multiple
          * times will cycle through ascending -> descending -> no sorting.
          *
          * @param prop - Object property to activate.
          */
         toggleProp(prop: string): void;
      }

      /**
       * Defines the data serialized for current property and sort state.
       */
      export type ObjectByPropData = {
         /**
          * Current sorted object property if any.
          */
         prop?: string,

         /**
          * Current sort state:
          * ```
          * - `none` no sorting.
          * - `asc` ascending sort.
          * - `desc` descending sort.
          * ```
          */
         state?: string
      }
   }

   /**
    * All available sort functions.
    */
   export interface SortAPI {
      /**
       * Creates an instance of {@link Sort.ObjectByProp} which is a managed sorting mechanism for dynamic reducers
       * providing several default sort comparisons for object properties with additional customization for complex data
       * types.
       *
       * @param [options] - ObjectByProp options.
       *
       * @param [options.store] - An external store that serializes the tracked prop and sorting state.
       *
       * @param [options.customCompareFnMap] - An object with property keys associated with custom compare functions for
       *        those keys.
       */
      objectByProp: <T extends { [key: string]: any }>(options: { store?: MinimalWritable<unknown>,
       customCompareFnMap?: { [key: string]: DynReducer.Data.CompareFn<T> | DynReducer.Data.Sort<T> }}) =>
        Sort.ObjectByProp<T>
   }
}

export { DynReducerHelper }
