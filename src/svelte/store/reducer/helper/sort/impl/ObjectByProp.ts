import { get, writable }            from 'svelte/store';

import { isMinimalWritableStore }   from '#runtime/svelte/store/util';
import { isObject }                 from '#runtime/util/object';

import type {
   Subscriber,
   Unsubscriber }                   from 'svelte/store';

import type { DynReducer }          from '#runtime/svelte/store/reducer';
import type { MinimalWritable }     from '#runtime/svelte/store/util';

import type { DynReducerHelper }    from '../../DynReducerHelper';

export class ObjectByProp<T extends { [key: string]: any }> implements DynReducerHelper.Sort.ObjectByProp<T>
{
   #customCompareFnMap?: { [key: string]: DynReducer.Data.CompareFn<T> | DynReducer.Data.Sort<T> };

   #customCompareFn?: DynReducer.Data.CompareFn<T> | DynReducer.Data.Sort<T>;

   #indexUpdateFn?: DynReducer.Data.IndexUpdateFn;

   #prop?: string;

   #sortByFn: DynReducer.Data.CompareFn<T>;

   #state?: string = 'none';

   #store: MinimalWritable<any>;

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
   }

   get compare(): DynReducer.Data.CompareFn<T>
   {
      return this.#sortByFn;
   }

   get prop(): string | undefined
   {
      return this.#prop;
   }

   get state(): string | undefined
   {
      return this.#state;
   }

   getCustomCompareFnMap()
   {
      return this.#customCompareFnMap;
   }

   reset()
   {
      this.#prop = void 0;
      this.#state = 'none';

      this.#store.set({ prop: this.#prop, state: this.#state });

      // Forces an index update / sorting is triggered.
      this.#indexUpdateFn?.({ reversed: this.#state === 'desc' });
   }

   set({ prop, state }: DynReducerHelper.Sort.ObjectByPropData = {})
   {
      let update = false;

      if (typeof prop === 'string')
      {
         this.#prop = prop;
         update = true;
      }

      if (state === 'none' || state === 'asc' || state === 'desc' )
      {
         this.#state = state;
         update = true;
      }

      if (update)
      {
         this.#store.set({ prop: this.#prop, state: this.#state });

         // Forces an index update / sorting is triggered.
         this.#indexUpdateFn?.({ reversed: this.#state === 'desc' });
      }
   };

   setCustomCompareFnMap(customCompareFnMap: { [key: string]: DynReducer.Data.CompareFn<T> | DynReducer.Data.Sort<T> }
    | undefined)
   {
      if (customCompareFnMap !== void 0 && !isObject(customCompareFnMap))
      {
         throw new TypeError(`'customCompareFnMap' is not an object or undefined.`)
      }

      // TODO: Update custom compare Fn.
      this.#customCompareFnMap = customCompareFnMap;
   }

   subscribe(handler: Subscriber<{ prop?: string, state?: string }>): Unsubscriber
   {
      return (this.#store as MinimalWritable<{ prop?: string, state?: string }>).subscribe(handler);
   }

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

      this.#prop = prop;

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

   #initializeSortByFn(): DynReducer.Data.CompareFn<T>
   {
      const sortByFn = (a: T, b: T): number =>
      {
         if (this.#prop === void 0 || this.#state === 'none') { return 0; }

         const aVal = a?.[this.#prop];
         const bVal = b?.[this.#prop];

         // TODO: implement caching of custom compare function.
         // ----------------------------------------------------------------------------------------------------------
         const customCompare = this.#customCompareFnMap?.[this.#prop];
         if (typeof customCompare === 'function')
         {
            // Case 1: It's a class with a static .compare().
            if ('compare' in customCompare && typeof (customCompare as any).compare === 'function')
            {
               return (customCompare as any).compare(aVal, bVal);
            }

            // Case 2: It's a plain function comparator.
            return customCompare(aVal, bVal);
         }
         else if (typeof customCompare?.compare === 'function')
         {
            // Case 3: It's an object instance with a .compare() method.
            return customCompare.compare(aVal, bVal);
         }

         // ----------------------------------------------------------------------------------------------------------

         if (aVal === bVal) { return 0; }

         const aType = typeof aVal;
         const bType = typeof bVal;

         switch (aType)
         {
            case 'string':
               if (bType === 'string') { return (aVal as string).localeCompare((bVal as string)); }
               break;

            case 'number':
               if (bType === 'number') { return (aVal as number) - (bVal as number); }
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
}
