import * as filters from './filter/index.js';

/**
 * Provides helper functions to create dynamic store driven filters and sort functions for dynamic reducers. The
 * returned functions are also Svelte stores and can be added to a reducer as well as used as a store.
 */
export class DynReducerHelper
{
   /**
    * Returns the following filter functions:
    * - regexObjectQuery(accessors, options); suitable for object reducers matching one or more property keys /
    *   accessors against the store value as a regex. To access deeper entries into the object format the accessor
    *   string with `.` between entries to walk. Optional parameters include logging access warnings, case sensitivity,
    *   and passing in an existing store.
    *
    * @returns {{
    *    regexObjectQuery: (accessors: string|Iterable<string>, options?: {accessWarn?: boolean,
    *     caseSensitive?: boolean, store?: import('svelte/store').Writable<string>}) =>
    *      (((data: {}) => boolean) & import('#runtime/svelte/store/util').MinimalWritable<string>)
    * }} All available filters.
    */
   static get filters() { return filters; }
}
