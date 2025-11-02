import { get, writable }            from 'svelte/store';

import type { DynReducerHelper }    from '../DynReducerHelper';

import type { DynReducer }          from '#runtime/svelte/store/reducer';
import type { MinimalWritable }     from '#runtime/svelte/store/util';

import { ObjectByProp }             from './impl/ObjectByProp';

/**
 * @param [options] - Options.
 *
 * @param [options.store] - An external store that serializes the tracked prop and sorting state.
 *
 * @param [options.customCompareFnMap] - An object with property keys associated with custom compare functions for those
 *        keys.
 *
 * @returns Sort object by prop instance that fulfills {@link DynReducer.Data.Sort}.
 */
function objectByProp<T extends { [key: string]: any }>({ store, customCompareFnMap }:
 { store?: MinimalWritable<unknown>, customCompareFnMap?: { [key: string]: DynReducer.Data.CompareFn<T> |
  DynReducer.Data.Sort<T> }} = {}): DynReducerHelper.Sort.ObjectByProp<T>
{
   return new ObjectByProp({ store, customCompareFnMap });
}

export {
   objectByProp
}
