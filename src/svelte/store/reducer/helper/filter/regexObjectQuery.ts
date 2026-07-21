import { get, writable }            from 'svelte/store';

import { isMinimalWritableStore }   from '#runtime/svelte/store/util';
import { Strings }                  from '#runtime/util';

import {
   propertyPathIterator,
   safeAccess }                     from '#runtime/util/object';

import type {
   Subscriber,
   Unsubscriber }                   from 'svelte/store';

import type { MinimalWritable }     from '#runtime/svelte/store/util';

import type { PropertyPath }        from '#runtime/util/object';

import type { DynReducerHelper }    from '../DynReducerHelper';

/**
 * Creates a filter function to compare objects by a given property path or list of paths against a regex test.
 * The property path must return a string for this filter to process. The returned function is also a minimal
 * writable Svelte store that builds a regex from the stores value.
 *
 * Suitable for object reducers matching one or more property paths against the store value as a
 * regex. To access deeper entries into the object format the path as a dotted string with `.` between entries to
 * walk or as a {@link PropertyKey} array.
 *
 * This filter function can be used w/ a dynamic reducer and bound as a store to input elements.
 *
 * Note: To specify multiple dotted string paths in an iterable manner you must wrap in a {@link Set} or use
 * an array of property-key arrays.
 *
 * @param paths - Property paths to lookup key to compare. To access deeper entries into the object format the
 * paths as a dotted between entries to walk or use a {@link PropertyKey} array.
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
export function regexObjectQuery(paths: PropertyPath | Iterable<PropertyPath>,
 { accessWarn = false, caseSensitive = false, store }:
  { accessWarn?: boolean, caseSensitive?: boolean, store?: MinimalWritable<string> } = {}):
   ReturnType<DynReducerHelper.FilterAPI['regexObjectQuery']>
{
   let keyword: string = '';
   let regex: RegExp;

   if (store !== void 0 && !isMinimalWritableStore(store))
   {
      throw new TypeError(`regexObjectQuery error: 'store' is not a minimal writable store.`);
   }

   const storeKeyword: MinimalWritable<string> = store ? store : writable(keyword);

   // If an existing store is provided then set initial values.
   if (store)
   {
      const current: string = get(store);

      if (typeof current === 'string')
      {
         keyword = Strings.normalize(current);
         regex = new RegExp(Strings.escape(keyword), caseSensitive ? '' : 'i');
      }
      else
      {
         store.set(keyword);
      }
   }

   const filterQuery: ReturnType<DynReducerHelper.FilterAPI['regexObjectQuery']> = Object.assign(
      /**
       * If there is no filter keyword / regex then do not filter otherwise filter based on the regex
       * created from the search input element.
       *
       * @param data - Data object to test against regex.
       *
       * @returns Store filter state.
       */
      (data: { [key: string]: any }): boolean =>
      {
         if (keyword === '' || !regex) { return true; }

         for (const path of propertyPathIterator(paths))
         {
console.log(`!!! TJS - regexObjectQuery - path: `, path);
            const value: any = safeAccess(data, path);
            if (typeof value !== 'string')
            {
               if (accessWarn)
               {
                  console.warn(`regexObjectQuery warning: could not access string data from '${String(path)}'.`);
               }

               continue;
            }

            if (regex.test(Strings.normalize(value))) { return true; }
         }

         return false;

         // if (isIterable(paths))
         // {
         //    for (const path of paths)
         //    {
         //       const value: any = safeAccess(data, path);
         //       if (typeof value !== 'string')
         //       {
         //          if (accessWarn)
         //          {
         //             console.warn(`regexObjectQuery warning: could not access string data from '${String(path)}'.`);
         //          }
         //
         //          continue;
         //       }
         //
         //       if (regex.test(Strings.normalize(value))) { return true; }
         //    }
         //
         //    return false;
         // }
         // else
         // {
         //    const value: any = safeAccess(data, accessors);
         //    if (typeof value !== 'string')
         //    {
         //       if (accessWarn)
         //       {
         //          console.warn(`regexObjectQuery warning: could not access string data from '${accessors}'.`);
         //       }
         //
         //       return false;
         //    }
         //
         //    return regex.test(Strings.normalize(value));
         // }
      },
      {
         /**
          * Create a custom store that changes when the search keyword changes.
          *
          * @param handler - A callback function that accepts strings.
          *
          * @returns Store unsubscribe function.
          */
         subscribe(handler: Subscriber<string>): Unsubscriber
         {
            return storeKeyword.subscribe(handler);
         },

         /**
          * @param value - A new value for the keyword / regex test.
          */
         set(value: string): void
         {
            if (typeof value === 'string')
            {
               keyword = Strings.normalize(value);
               regex = new RegExp(Strings.escape(keyword), caseSensitive ? '' : 'i');
               storeKeyword.set(keyword);
            }
         }
      }
   );

   return filterQuery;
}
