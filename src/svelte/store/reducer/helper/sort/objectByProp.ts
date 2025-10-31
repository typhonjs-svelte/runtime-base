import { get, writable }            from 'svelte/store';

import type { DynReducerHelper }    from '../DynReducerHelper';

import type {
   Subscriber,
   Unsubscriber }                   from 'svelte/store';

import { isMinimalWritableStore }   from '#runtime/svelte/store/util';
import { isObject }                 from '#runtime/util/object';

import type { DynReducer }          from '#runtime/svelte/store/reducer';
import type { MinimalWritable }     from '#runtime/svelte/store/util';

/**
 *
 * @param [options] - Options.
 *
 * @param [options.store] - An external store that serializes the tracked prop and sorting state.
 *
 * @returns Sort object by prop instance that fulfills {@link DynReducer.Data.Sort}.
 */
function objectByProp<T extends { [key: string]: any }>({ store = writable({ prop: void 0, state: void 0 }) }:
 { store?: MinimalWritable<any> } = {}): DynReducerHelper.Sort.ObjectByProp<T>
{
   let prop: string | undefined = void 0;
   let state: string | undefined = 'none';

   if (!isMinimalWritableStore(store))
   {
      throw new TypeError(`'store' is not a MinimalWritable store.`)
   }

   const storeValue = get(store);

   if (!isObject(storeValue))
   {
      store.set({ prop, state });
   }
   else
   {
      const prevProp = storeValue.prop;
      const prevState = storeValue.state;

      // Accept previous prop value.
      if (typeof prevProp === 'string') { prop = prevProp; }

      if (typeof prevState === 'string')
      {
         // Set previous state if valid or reset store value.
         if (prevState === 'none' || prevState === 'asc' || prevState === 'desc')
         {
            state = prevState;
         }
         else
         {
            store.set({ prop, state });
         }
      }

      // Potentially detect errant / extra keys and reset store value.
      for (const key of Object.keys(storeValue))
      {
         if (key !== 'prop' && key !== 'state')
         {
            store.set({ prop, state });
            break;
         }
      }
   }

   // DynReducer.Data.CompareFn Implementation -----------------------------------------------------------------------

   let customCompareFn: DynReducer.Data.CompareFn<T> | undefined;

   let indexUpdateFn: DynReducer.Data.IndexUpdateFn | undefined;

   function sortByFn(a: T, b: T): number
   {
      if (prop === void 0 || state === 'none') { return 0; }

      const aVal = a?.[prop];
      const bVal = b?.[prop];

      if (typeof customCompareFn === 'function') { return customCompareFn(a, b); }

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
   }

   /**
    * Custom dynamic reducer subscriber accepting the index update function.
    *
    * @param handler - Dynamic
    */
   sortByFn.subscribe = (handler: DynReducer.Data.IndexUpdateFn) =>
   {
      indexUpdateFn = handler;

      // Forces an index update / sorting is triggered.
      indexUpdateFn?.({ reversed: state === 'desc' });

      return () => indexUpdateFn = void 0;
   };

   // ----------------------------------------------------------------------------------------------------------------

   const reset = () =>
   {
      prop = void 0;
      state = 'none';

      store.set({ prop, state });

      // Forces an index update / sorting is triggered.
      indexUpdateFn?.({ reversed: state === 'desc' });
   };

   const set = ({ prop: newProp, state: newState }: DynReducerHelper.Sort.ObjectByPropData = {}) =>
   {
      let update = false;

      if (typeof newProp === 'string') { prop = newProp; update = true; }
      if (newState === 'none' || newState === 'asc' || newState === 'desc' ) { state = newState; update = true; }

      if (update)
      {
         store.set({ prop, state });

         // Forces an index update / sorting is triggered.
         indexUpdateFn?.({ reversed: state === 'desc' });
      }
   }

   const subscribe = (handler: Subscriber<{ prop?: string, state?: string }>): Unsubscriber =>
   {
      return (store as MinimalWritable<{ prop?: string, state?: string }>).subscribe(handler);
   };

   const toggleProp = (newProp: string | undefined) =>
   {
      if (newProp !== void 0 && typeof newProp !== 'string')
      {
         throw TypeError(`'newProp' is not a string or undefined.`);
      }

      /**
       * Determine current state. If the `prop` being toggled is the current `sortBy` prop then use the stored state.
       * Otherwise, this is a new property to toggle and start from `none`.
       */

      const currentState: string | undefined = prop === newProp ? state : 'none';

      switch (currentState)
      {
         case 'none':
            state = 'asc';
            break;

         case 'asc':
            state = 'desc';
            break;

         case 'desc':
            state = 'none';
            break;

         default:
            state = 'none';
            break;
      }

      prop = newProp;

      // Forces an index update / sorting is triggered.
      indexUpdateFn?.({ reversed: state === 'desc' });

      store.set({ prop, state });
   }

   return Object.freeze({
      compare: sortByFn,
      get prop() { return prop },
      get state() { return state },
      reset,
      set,
      subscribe,
      toggleProp
   });
}

export {
   objectByProp
}
