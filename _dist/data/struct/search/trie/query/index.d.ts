import { TrieSearchReducer, TrieSearch } from '@typhonjs-svelte/runtime-base/data/struct/search/trie';
import { DynArrayReducer } from '@typhonjs-svelte/runtime-base/svelte/store/reducer';
import { Writable } from 'svelte/store';

/**
 * Options for TrieSearchQuery.
 */
type TrieSearchQueryOptions<T extends object> = {
  /**
   * The initial limit on search results.
   */
  limit?: number;
  /**
   * An initial trie reducer instance to set.
   */
  trieReducer?: TrieSearchReducer<T>;
};

/**
 * Provides a reactive query interface to {@link TrieSearch} in addition to dynamic filtering / sorting of search
 * results.
 *
 * @template T
 */
declare class TrieSearchQuery<T extends object> extends DynArrayReducer<T> {
  #private;
  /**
   * @param {TrieSearch<T>}  trieSearch - The associated TrieSearch instance.
   *
   * @param {TrieSearchQueryOptions<T>} options - Optional query settings.
   */
  constructor(trieSearch: TrieSearch<T>, options?: TrieSearchQueryOptions<T>);
  /**
   * @returns {Writable<number | undefined>} The writable store controlling the search results limit.
   */
  get limit(): Writable<number | undefined>;
  /**
   * @returns {boolean} The current destroyed state of this query instance.
   */
  get isDestroyed(): boolean;
  /**
   * @returns {TrieSearchReducer<T>} Any associated TrieSearch reducer function.
   */
  get trieReducer(): TrieSearchReducer<T>;
  /**
   * @returns {TrieSearch<T>} The associated TrieSearch instance; can be undefined.
   */
  get trieSearch(): TrieSearch<T>;
  /**
   * @returns {Writable<string | Iterable<string> | undefined>} The writable store controlling the search query.
   */
  get query(): Writable<string | Iterable<string> | undefined>;
  /**
   * @param {TrieSearchReducer<T> | undefined}  trieReducer - A new trie reducer function.
   */
  set trieReducer(trieReducer: TrieSearchReducer<T> | undefined);
  /**
   * Destroys and disconnects this query from the local stores and any associated TrieSearch instance.
   */
  destroy(): void;
}

export { TrieSearchQuery, type TrieSearchQueryOptions };
