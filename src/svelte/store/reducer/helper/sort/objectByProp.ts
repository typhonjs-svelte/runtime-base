import { ObjectByProp }             from './impl/ObjectByProp';

import type { DynReducerHelper }    from '../DynReducerHelper';

import type { DynReducer }          from '#runtime/svelte/store/reducer';

/**
 * @param [options] - Options.
 *
 * @returns Sort object by prop instance that fulfills {@link DynReducer.Data.Sort}.
 */
function objectByProp<T extends { [key: PropertyKey]: any }>(
 options: DynReducerHelper.Sort.ObjectByPropOptions<T> = {}): DynReducerHelper.Sort.ObjectByProp<T>
{
   return new ObjectByProp(options);
}

export {
   objectByProp
}
