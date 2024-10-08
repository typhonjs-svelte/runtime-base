import { get, writable }            from '#svelte/store';

import { isMinimalWritableStore }   from '#runtime/svelte/store/util';
import { Strings }                  from '#runtime/util';

import {
   isIterable,
   safeAccess }                     from '#runtime/util/object';

/**
 * Creates a filter function to compare objects by a given accessor key against a regex test. The returned function
 * is also a writable Svelte store that builds a regex from the stores value.
 *
 * This filter function can be used w/ a dynamic reducer and bound as a store to input elements.
 *
 * @param {string | Iterable<string>}   accessors - Property key / accessors to lookup key to compare. To access deeper
 *        entries into the object format the accessor string with `.` between entries to walk.
 *
 * @param {object}   [opts] - Optional parameters.
 *
 * @param {boolean}  [opts.accessWarn=false] - When true warnings will be posted if accessor not retrieved.
 *
 * @param {boolean}  [opts.caseSensitive=false] - When true regex test is case-sensitive.
 *
 * @param {import('#runtime/svelte/store/util').MinimalWritable<string>}  [opts.store] - Use the provided minimal
 *        writable store to instead of creating a default `writable` store.
 *
 * @returns {((data: object) => boolean) & import('#runtime/svelte/store/util').MinimalWritable<string>}
 *        The query string filter.
 */
export function regexObjectQuery(accessors, { accessWarn = false, caseSensitive = false, store } = {})
{
   let keyword = '';
   let regex;

   if (store !== void 0 && !isMinimalWritableStore(store))
   {
      throw new TypeError(`regexObjectQuery error: 'store' is not a minimal writable store.`);
   }

   const storeKeyword = store ? store : writable(keyword);

   // If an existing store is provided then set initial values.
   if (store)
   {
      const current = get(store);

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

   /**
    * If there is no filter keyword / regex then do not filter otherwise filter based on the regex
    * created from the search input element.
    *
    * @param {object} data - Data object to test against regex.
    *
    * @returns {boolean} AnimationStore filter state.
    */
   function filterQuery(data)
   {
      if (keyword === '' || !regex) { return true; }

      if (isIterable(accessors))
      {
         for (const accessor of accessors)
         {
            const value = safeAccess(data, accessor);
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
         const value = safeAccess(data, accessors);

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
   }

   /**
    * Create a custom store that changes when the search keyword changes.
    *
    * @param {(string) => void} handler - A callback function that accepts strings.
    *
    * @returns {import('svelte/store').Unsubscriber} Store unsubscribe function.
    */
   filterQuery.subscribe = (handler) =>
   {
      return storeKeyword.subscribe(handler);
   };

   /**
    * Set
    *
    * @param {string}   value - A new value for the keyword / regex test.
    */
   filterQuery.set = (value) =>
   {
      if (typeof value === 'string')
      {
         keyword = Strings.normalize(value);
         regex = new RegExp(Strings.escape(keyword), caseSensitive ? '' : 'i');
         storeKeyword.set(keyword);
      }
   };

   return filterQuery;
}
