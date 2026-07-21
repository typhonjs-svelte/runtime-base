import { ObjectByPath }             from './impl/ObjectByPath';

import type { DynReducerHelper }    from '../DynReducerHelper';

import type { DynReducer }          from '#runtime/svelte/store/reducer';

/**
 * @param [options] - Options.
 *
 * @returns Sort object by prop instance that fulfills {@link DynReducer.Data.Sort}.
 */
function objectByPath<T extends { [key: PropertyKey]: any }>(
 options: DynReducerHelper.Sort.ObjectByPathOptions<T> = {}): DynReducerHelper.Sort.ObjectByPath<T>
{
   return new ObjectByPath(options);
}

export {
   objectByPath
}
