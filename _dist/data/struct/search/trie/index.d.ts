import { Key, KeyFields } from '@typhonjs-svelte/runtime-base/data/struct/hash/array';
export { Key, KeyFields, getValueFromKey } from '@typhonjs-svelte/runtime-base/data/struct/hash/array';

/**
 * Provides an interface for all reducers.
 *
 * @template T
 */
interface ITrieSearchReducer<T extends object> {
    /**
     * @return {Key | KeyFields} Any associated key fields to limit match intersection / HashArray in
     * `TrieSearch.#getImpl`.
     */
    get keyFields(): Key | KeyFields | undefined;
    /**
     * @returns {T[]} The matches after reducing.
     */
    get matches(): T[];
    /**
     * Defines a reducer function used to accumulate and reduce data found in searching.
     *
     * @param {TrieSearchReducerData<T>} data - The data to be reduced.
     */
    reduce(data: TrieSearchReducerData<T>): void;
    /**
     * Resets any state of the reducer. This is invoked at the beginning of {@link TrieSearch.search}.
     *
     * @param {TrieSearchReducerResetData<T>} data - The reset data.
     */
    reset(data: TrieSearchReducerResetData<T>): void;
}

/**
 * Defines the trie data structure. The `value` key is a specific list of items; all other string keys may refer to
 * another TrieNode.
 */
type TrieNode<T extends object> = {
    [K in string]?: TrieNode<T>;
} & {
    value?: T[];
};
/**
 * Data provided when reducing a batch of matches.
 */
type TrieSearchReducerData<T> = {
    /**
     * The phrase after {@link TrieSearchOptions.ignoreCase} applied.
     */
    ignoreCasePhrase: string;
    /**
     * The current phrase index.
     */
    index: number;
    /**
     * Matches found from the current phrase.
     */
    matches: T[];
    /**
     * The original phrase.
     */
    phrase: string;
    /**
     * The split words from the phrase.
     */
    words: string[];
};
/**
 * Data provided when resetting reducers.
 */
type TrieSearchReducerResetData<T> = {
    /**
     * Clone of key fields from host TrieSearch instance.
     */
    keyFields: KeyFields;
    /**
     * The output results array from {@link TrieSearch.search}.
     */
    list: T[];
    /**
     * Clone of options from host TrieSearch instance.
     */
    options: TrieSearchOptions;
    /**
     * The phrases being searched; not lowercase if {@link TrieSearchOptions.ignoreCase} is true.
     */
    phrases: string | Iterable<string>;
};
/**
 * Options for TrieSearch.
 */
type TrieSearchOptions = {
    /**
     * Is caching enabled; default: true.
     */
    cache?: boolean;
    /**
     * By default, this is set to an array of international vowels expansions, allowing searches for vowels like 'a' to
     * return matches on 'å' or 'ä' etc. Set this to an empty array / `[]` if you want to disable it. See the top of
     * `src/trie/TrieSearch.js` file for examples.
     */
    expandRegexes?: [{
        regex: RegExp;
        alternate: string;
    }];
    /**
     * Ignores case in lookups; default: `true`.
     */
    ignoreCase?: boolean;
    /**
     * In `TrieSearch.map` when `splitOnRegEx` is defined and `insertFullUnsplitKey` is true the full key will also be
     * mapped; default: `false`.
     */
    insertFullUnsplitKey?: boolean;
    /**
     * The max cache size before removing entries in a LRU manner; default: `64`.
     */
    maxCacheSize?: number;
    /**
     * The size of the prefix for keys; minimum length of a key to store and search. By default, this is `1`, but you
     * might improve performance by using `2` or `3`.
     */
    min?: number;
    /**
     * How phrases are split on search; default: `/\s/g`. By default, this is any whitespace. Set to `false` if you have
     * whitespace in your keys! Set it to something else to split along other boundaries.
     */
    splitOnRegEx?: RegExp | false;
    /**
     * How phrases are split on retrieval / get; default: `/\s/g`.
     */
    splitOnGetRegEx?: RegExp | false;
    /**
     * Provide a custom tokenizer that is used to split keys. IE a Grapheme / Unicode tokenizer.
     */
    tokenizer?: (str: string) => IterableIterator<string>;
};
/**
 * Defines the readable store subscriber / handler function.
 */
type TrieSearchSubscribeHandler<T extends object> = ({ action, trieSearch }: {
    action?: 'add' | 'clear' | 'destroy' | 'subscribe';
    trieSearch?: TrieSearch<T>;
}) => unknown;

/**
 * A Trie is a data structure designed for quick reTRIEval of objects by string search. This was designed for use with
 * a type-ahead search (e.g. like a dropdown) but could be used in a variety of situations.
 *
 * This data structure indexes sentences / words to objects for searching by full or partial matches. So you can map
 * 'hello' to an Object, and then search by 'hel', 'hell', or 'hello' and get the Object or an Array of all objects
 * that match.
 *
 * By default, sentences / words are split along whitespace boundaries. For example, if your inserted mapping is
 * 'the quick brown fox', this object will be searchable by 'the', 'quick', 'brown', or 'fox' or any of their partials
 * like 'qui' or 'qu' or 'fo'. Boundaries can be customized using the `splitOnRegEx` option.
 *
 * By default, the trie-search is internationalized for a common set of vowels in the ASCII set. So if you insert 'ö',
 * then searching on 'o' will return that result. You can customize this by providing your own `expandRegexes` object.
 *
 * @template T
 */
declare class TrieSearch<T extends object> {
    #private;
    /**
     * @param {string | KeyFields} [keyFields] - A single string or an array of strings / arrays representing what
     * fields on added objects are to be used as keys for the trie search / HashArray.
     *
     * @param {TrieSearchOptions} [options] - Options.
     */
    constructor(keyFields?: string | KeyFields, options?: TrieSearchOptions);
    /**
     * @returns {boolean} Whether this TrieSearch instance has been destroyed.
     */
    get isDestroyed(): boolean;
    /**
     * @returns {KeyFields} A clone of the current key fields.
     */
    get keyFields(): KeyFields;
    /**
     * @returns {TrieNode<T>} The root trie node.
     */
    get root(): TrieNode<T>;
    /**
     * @returns {number} Number of nodes in the trie data structure.
     */
    get size(): number;
    /**
     * Add items or list of items to the TrieSearch instance.
     *
     * @param {...(T | Iterable<T>)}  items - Items to add.
     */
    add(...items: (T | Iterable<T>)[]): this;
    /**
     * Clears all items.
     *
     * @returns {TrieSearch<T>} This instance.
     */
    clear(): this;
    /**
     * Destroys this TrieSearch instance. Removing all data and preventing new data from being added. Any subscribers
     * are notified with an undefined argument in the callback signaling that the associated instance is destroyed.
     */
    destroy(): this;
    /**
     * Directly maps an item to the given key.
     *
     * @param {string}   key - The key to store the item.
     *
     * @param {T}        value - The item to store.
     */
    map(key: string, value: T): this;
    /**
     * Performs a search of the trie data structure with the given phrases. By default, each phrase is split by
     * {@link TrieSearchOptions.splitOnGetRegEx} and matches found for each word resulting in a `OR` lookup. You may
     * provide a `reducer` function to change the behavior
     *
     * @param {string | Iterable<string>}  phrases - The phrases to parse and search in the trie data structure.
     *
     * @param {object}   [options] - Search Options.
     *
     * @param {ITrieSearchReducer<T>}  [options.reducer] - A trie reducer instance to apply to this search.
     *
     * @param {number}   [options.limit] - The limit for search results returned.
     *
     * @param {T[]}      [options.list=[]] - An external array to use for storing search results.
     *
     * @returns {T[]} Found matches.
     */
    search(phrases: string | Iterable<string>, { reducer, limit, list }?: {
        reducer?: ITrieSearchReducer<T>;
        limit?: number;
        list?: T[];
    }): T[];
    /**
     * Subscribe for change notification on add / clear / destroy.
     *
     * Note: There is no data defined regarding what changed only that one of three actions occurred. This TrieSearch
     * instance is sent as the only argument. When it is undefined this signals that the TrieSearch instance has been
     * destroyed.
     *
     * @param {(trieSearch: TrieSearch<T> | undefined) => unknown} handler - Callback function that is invoked on
     * changes (add / clear / destroy).
     *
     * @returns {() => void} Unsubscribe function.
     */
    subscribe(handler: TrieSearchSubscribeHandler<T>): () => void;
}

/**
 * Provides an ITrieSearchReducer implementation to accumulate a union / `AND` of matches across all phrases provided in
 * a search query.
 *
 * @template T
 */
declare class UnionReducer<T extends object> implements ITrieSearchReducer<T> {
    #private;
    constructor(indexField: Key);
    /**
     * @returns {Key | KeyFields | undefined} Returns the index field key.
     */
    get keyFields(): Key | KeyFields | undefined;
    /**
     * @returns {T[]} Returns the union of all matches.
     */
    get matches(): T[];
    /**
     * Accumulates and reduces each batch of matches for one or more phrases.
     *
     * @param {TrieSearchReducerData<T>}   data - Matches of current iteration / batch.
     */
    reduce(data: TrieSearchReducerData<T>): void;
    /**
     * Reset state.
     *
     * @param {T[]}   list - The main output list from {@link TrieSearch.search}.
     */
    reset({ list }: TrieSearchReducerResetData<T>): void;
}

export { type ITrieSearchReducer, type TrieNode, TrieSearch, type TrieSearchOptions, type TrieSearchReducerData, type TrieSearchReducerResetData, type TrieSearchSubscribeHandler, UnionReducer };
