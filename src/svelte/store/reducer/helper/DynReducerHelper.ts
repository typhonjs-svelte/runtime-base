import * as filters     from './filter';
import * as sort        from './sort';

import type {
   MinimalWritable,
   MinimalWritableFn }  from '#runtime/svelte/store/util';

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
   static get filters(): DynReducerHelper.Filters { return filters; }

   /**
    * Returns the following sort functions:
    * - objectByProp
    *
    * @returns All available sort functions.
    */
   static get sort(): DynReducerHelper.Sort { return sort; }
}

/**
 * Defines the available resources of {@link DynReducerHelper}.
 */
declare namespace DynReducerHelper {
   import objectByProp = DynReducerHelper.SortFn.objectByProp;
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
   export interface Filters {
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
    * All available returned sort functions.
    */
   export namespace SortFn {
      export import ObjectByProp = sort.ObjectByProp;

      /**
       * The returned filter function from `sortByProp` helper.
       */
      export type objectByProp<T extends { [key: string]: any }> = ObjectByProp<T>;
   }

   /**
    * All available sort functions.
    */
   export interface Sort {
      objectByProp: <T extends { [key: string]: any }>(options: { store?: MinimalWritable<any> }) =>
       SortFn.ObjectByProp<T>
   }
}

export { DynReducerHelper }
