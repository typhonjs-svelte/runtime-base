import { get, writable }            from 'svelte/store';

import { isMinimalWritableStore }   from '#runtime/svelte/store/util';
import { Strings }                  from '#runtime/util';

import {
   isIterable,
   safeAccess }                     from '#runtime/util/object';

import type {
   Subscriber,
   Unsubscriber }                   from 'svelte/store';

import type { MinimalWritable }     from '#runtime/svelte/store/util';

import type { DynReducerHelper }    from '../DynReducerHelper';

/**
 * Creates a filter function to compare objects by a given accessor key against a regex test. The returned function
 * is also a writable Svelte store that builds a regex from the stores value.
 *
 * This filter function can be used w/ a dynamic reducer and bound as a store to input elements.
 *
 * @param accessors - Property key / accessors to lookup key to compare. To access deeper
 *        entries into the object format the accessor string with `.` between entries to walk.
 *
 * @param [opts] - Optional parameters.
 *
 * @param [opts.accessWarn=false] - When true warnings will be posted if accessor not retrieved.
 *
 * @param [opts.caseSensitive=false] - When true regex test is case-sensitive.
 *
 * @param [opts.store] - Use the provided minimal writable store to instead of creating a default `writable` store.
 *
 * @returns The query string filter.
 */
export function regexObjectQuery(accessors: string | Iterable<string>, { accessWarn = false, caseSensitive = false,
 store }: { accessWarn?: boolean, caseSensitive?: boolean, store?: MinimalWritable<string> } = {}):
  ReturnType<DynReducerHelper.Filters['regexObjectQuery']>
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


   const filterQuery: ReturnType<DynReducerHelper.Filters['regexObjectQuery']> = Object.assign(
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

         if (isIterable(accessors))
         {
            for (const accessor of accessors)
            {
               const value: any = safeAccess(data, accessor);
               if (typeof value !== 'string')
               {
                  if (accessWarn)
                  {
                     console.warn(`regexObjectQuery warning: could not access string data from '${accessor}'.`);
                  }

                  continue;
               }

               if (regex.test(Strings.normalize(value))) { return true; }
            }

            return false;
         }
         else
         {
            const value: any = safeAccess(data, accessors);
            if (typeof value !== 'string')
            {
               if (accessWarn)
               {
                  console.warn(`regexObjectQuery warning: could not access string data from '${accessors}'.`);
               }

               return false;
            }

            return regex.test(Strings.normalize(value));
         }
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

   /**
    * Create a custom store that changes when the search keyword changes.
    *
    * @param handler - A callback function that accepts strings.
    *
    * @returns Store unsubscribe function.
    */
   filterQuery.subscribe = (handler: Subscriber<string>): Unsubscriber =>
   {
      return storeKeyword.subscribe(handler);
   };

   /**
    * @param value - A new value for the keyword / regex test.
    */
   filterQuery.set = (value: string): void =>
   {
      if (typeof value === 'string')
      {
         keyword = Strings.normalize(value);
         regex = new RegExp(Strings.escape(keyword), caseSensitive ? '' : 'i');
         storeKeyword.set(keyword);
      }
   };



   //
   // /**
   //  * If there is no filter keyword / regex then do not filter otherwise filter based on the regex
   //  * created from the search input element.
   //  *
   //  * @param data - Data object to test against regex.
   //  *
   //  * @returns Store filter state.
   //  */
   // const filterQuery: ReturnType<DynReducerHelper.filters['regexObjectQuery']> = function(data: { [key: string]: any }): boolean
   // {
   //    if (keyword === '' || !regex) { return true; }
   //
   //    if (isIterable(accessors))
   //    {
   //       for (const accessor of accessors)
   //       {
   //          const value: any = safeAccess(data, accessor);
   //          if (typeof value !== 'string')
   //          {
   //             if (accessWarn)
   //             {
   //                console.warn(`regexObjectQuery warning: could not access string data from '${accessor}'.`);
   //             }
   //
   //             continue;
   //          }
   //
   //          if (regex.test(Strings.normalize(value))) { return true; }
   //       }
   //
   //       return false;
   //    }
   //    else
   //    {
   //       const value: any = safeAccess(data, accessors);
   //       if (typeof value !== 'string')
   //       {
   //          if (accessWarn)
   //          {
   //             console.warn(`regexObjectQuery warning: could not access string data from '${accessors}'.`);
   //          }
   //
   //          return false;
   //       }
   //
   //       return regex.test(Strings.normalize(value));
   //    }
   // }
   //
   // /**
   //  * Create a custom store that changes when the search keyword changes.
   //  *
   //  * @param handler - A callback function that accepts strings.
   //  *
   //  * @returns Store unsubscribe function.
   //  */
   // filterQuery.subscribe = (handler: Subscriber<string>): Unsubscriber =>
   // {
   //    return storeKeyword.subscribe(handler);
   // };
   //
   // /**
   //  * @param value - A new value for the keyword / regex test.
   //  */
   // filterQuery.set = (value: string): void =>
   // {
   //    if (typeof value === 'string')
   //    {
   //       keyword = Strings.normalize(value);
   //       regex = new RegExp(Strings.escape(keyword), caseSensitive ? '' : 'i');
   //       storeKeyword.set(keyword);
   //    }
   // };

   return filterQuery;
}
