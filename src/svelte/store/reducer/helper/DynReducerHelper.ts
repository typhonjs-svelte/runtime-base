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
class DynReducerHelper
{
   private constructor() {}

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
      export type regexObjectQuery = MinimalWritableFn<string, [data: { [key: string]: any }], boolean>;
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
       * Defines the data object and filter function returned by {@link DynReducerHelper.sort.objectByProp}.
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
          * @param data
          */
         set(data: ObjectByPropData): void;

         /**
          * Sets the current custom compare function lookup map for object properties that require unique sorting.
          *
          * @param customCompareFn
          */
         setCustomCompareFnMap(customCompareFn:
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
      objectByProp: <T extends { [key: string]: any }>(options: { store?: MinimalWritable<unknown>,
       customCompareFnMap?: { [key: string]: DynReducer.Data.CompareFn<T> | DynReducer.Data.Sort<T> }}) =>
        Sort.ObjectByProp<T>
   }
}

export { DynReducerHelper }
