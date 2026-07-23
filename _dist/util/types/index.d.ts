/**
 * Provides general-purpose TypeScript utility types for composing, constraining, and inspecting application types.
 *
 * The utilities in this package supplement TypeScript's built-in utility types with reusable helpers for:
 *
 * - Modifying selected object properties.
 * - Composing and simplifying object types.
 * - Extracting object keys and values.
 * - Expressing valid combinations of optional properties.
 * - Working with arrays, tuples, iterables, and asynchronous values.
 * - Adding compile-time nominal identity to structurally typed values.
 *
 * All exports are type-only and have no runtime behavior or generated JavaScript representation.
 *
 * @categoryDescription Async
 * Types for representing values that may be produced synchronously or asynchronously.
 *
 * @categoryDescription Collections
 * Types for extracting element types and expressing structural constraints for arrays, tuples, and iterables.
 *
 *
 * @categoryDescription Nominal Types
 * Types for adding compile-time identity to otherwise structurally compatible values.
 *
 * @categoryDescription Object Composition
 * Types for combining, reshaping, simplifying, and selectively omitting object properties.
 *
 * @categoryDescription Object Constraints
 * Types for defining valid combinations and presence requirements for selected object properties.
 *
 * @categoryDescription Object Keys
 * Types for extracting and classifying object keys and property value types.
 *
 * @categoryDescription Object Modifiers
 * Types for selectively changing the optional, required, readonly, mutable, or defined state of object properties.
 *
 * @packageDocumentation
 */

/**
 * Represents either a synchronous value or a promise-like value.
 *
 * @category Async
 *
 * @example
 * Accept a value regardless of whether it is produced synchronously or asynchronously.
 *
 * ```ts
 * async function resolveValue<T>(value: MaybePromise<T>): Promise<T>
 * {
 *    return await value;
 * }
 *
 * const immediate = resolveValue(42);
 * const deferred = resolveValue(Promise.resolve(42));
 * ```
 */
type MaybePromise<T> = T | PromiseLike<T>;

/**
 * Extracts the element type of array or tuple.
 *
 * @category Collections
 *
 * @example
 * Extract an element type from an array.
 *
 * ```ts
 * type Entry = { id: string; value: number; };
 *
 * type Element = ArrayElement<readonly Entry[]>;
 * // { id: string; value: number }
 * ```
 *
 * @example
 * Extract the union of tuple element types.
 *
 * ```ts
 * type Element = ArrayElement<readonly [string, number, boolean]>;
 * // string | number | boolean
 * ```
 */
type ArrayElement<T extends readonly unknown[]> = T[number];
/**
 * Extracts the element type of iterable.
 *
 * @category Collections
 *
 * @example
 * Extract the value type yielded by a collection.
 *
 * ```ts
 * type SetElement = IterableElement<Set<number>>;
 * // number
 *
 * type MapElement = IterableElement<Map<string, boolean>>;
 * // [string, boolean]
 * ```
 */
type IterableElement<T> = T extends Iterable<infer E> ? E : never;
/**
 * Represents a mutable array containing at least one element.
 *
 * @category Collections
 *
 * @example
 * Require an array to contain an initial value.
 *
 * ```ts
 * const values: NonEmptyArray<number> = [1, 2, 3];
 *
 * const first: number = values[0];
 *
 * // @ts-expect-error An empty array is not permitted.
 * const empty: NonEmptyArray<number> = [];
 * ```
 */
type NonEmptyArray<T> = [T, ...T[]];
/**
 * Represents a readonly array containing at least one element.
 *
 * @category Collections
 *
 * @example
 * Require a readonly array to contain an initial value.
 *
 * ```ts
 * const values: ReadonlyNonEmptyArray<string> = ['alpha', 'beta'];
 *
 * const first: string = values[0];
 *
 * // @ts-expect-error The array is readonly.
 * values.push('gamma');
 *
 * // @ts-expect-error An empty array is not permitted.
 * const empty: ReadonlyNonEmptyArray<string> = [];
 * ```
 */
type ReadonlyNonEmptyArray<T> = readonly [T, ...T[]];

declare const typeBrand: unique symbol;
/**
 * Adds compile-time nominal identity to a structurally typed value.
 *
 * @category Nominal Types
 *
 * @example
 * Distinguish values that share the same runtime representation.
 *
 * ```ts
 * type UserID = Brand<string, 'UserID'>;
 * type ProjectID = Brand<string, 'ProjectID'>;
 *
 * declare const userID: UserID;
 * declare const projectID: ProjectID;
 *
 * function loadUser(id: UserID): void
 * {
 *    // Load the user.
 * }
 *
 * loadUser(userID);
 *
 * // @ts-expect-error ProjectID is not assignable to UserID.
 * loadUser(projectID);
 * ```
 */
type Brand<T, Name extends PropertyKey> = T & {
  readonly [typeBrand]: Name;
};

/**
 * Merges two object types, with properties from Override taking precedence.
 *
 * @category Object Composition
 *
 * @example
 * Replace selected properties while retaining the remaining base properties.
 *
 * ```ts
 * interface BaseOptions
 * {
 *    enabled: boolean;
 *    source: string;
 *    retries: number;
 * }
 *
 * interface OptionOverride
 * {
 *    source: URL;
 *    retries: 3;
 * }
 *
 * type ResolvedOptions = Merge<BaseOptions, OptionOverride>;
 * // {
 * //    enabled: boolean;
 * //    source: URL;
 * //    retries: 3;
 * // }
 * ```
 */
type Merge<Base extends object, Override extends object> = Simplify<Omit<Base, keyof Override> & Override>;
/**
 * Materializes an object type, primarily to simplify intersections in editor tooltips and generated documentation.
 *
 * @category Object Composition
 *
 * @example
 * Present an intersection as a single materialized object type.
 *
 * ```ts
 * type Identified = { id: string; };
 *
 * type Named = { name: string; };
 *
 * type Entry = Simplify<Identified & Named>;
 * // {
 * //    id: string;
 * //    name: string;
 * // }
 * ```
 */
type Simplify<T extends object> = {
  [P in keyof T]: T[P];
};
/**
 * A version of Omit that rejects keys not present in T. The built-in Omit permits any PropertyKey as its second
 * parameter.
 *
 * @category Object Composition
 *
 * @example
 * Detect misspelled or otherwise invalid omitted keys.
 *
 * ```ts
 * interface Account
 * {
 *    id: string;
 *    password: string;
 * }
 *
 * type PublicAccount = StrictOmit<Account, 'password'>;
 * // { id: string }
 *
 * // @ts-expect-error "pasword" is not a key of Account.
 * type InvalidAccount = StrictOmit<Account, 'pasword'>;
 * ```
 */
type StrictOmit<T extends object, K extends keyof T> = Omit<T, K>;

/**
 * Requires either all or none of the selected properties.
 *
 * @category Object Constraints
 *
 * @example
 * Require credentials to be provided as a complete pair.
 *
 * ```ts
 * interface ConnectionOptions
 * {
 *    endpoint: string;
 *    username?: string;
 *    password?: string;
 * }
 *
 * type AuthenticatedConnection = RequireAllOrNone<
 *    ConnectionOptions,
 *    'username' | 'password'
 * >;
 *
 * const anonymous: AuthenticatedConnection = {
 *    endpoint: '/api'
 * };
 *
 * const authenticated: AuthenticatedConnection = {
 *    endpoint: '/api',
 *    username: 'admin',
 *    password: 'secret'
 * };
 *
 * // @ts-expect-error Both username and password must be provided together.
 * const incomplete: AuthenticatedConnection = {
 *    endpoint: '/api',
 *    username: 'admin'
 * };
 * ```
 */
type RequireAllOrNone<T extends object, K extends keyof T = keyof T> = Simplify<
  Omit<T, K> &
    (
      | Required<Pick<T, K>>
      | {
          [P in K]?: never;
        }
    )
>;
/**
 * Requires at least one of the selected properties.
 *
 * @category Object Constraints
 *
 * @remarks
 * Enable {@link https://www.typescriptlang.org/tsconfig/exactOptionalPropertyTypes.html | exactOptionalPropertyTypes}
 * for strict enforcement. Without this setting, properties declared as optional never may still accept an explicit
 * undefined value, weakening the constraint.
 *
 * @example
 * Require at least one search criterion while allowing multiple criteria.
 *
 * ```ts
 * interface SearchOptions
 * {
 *    limit?: number;
 *    id?: string;
 *    name?: string;
 *    category?: string;
 * }
 *
 * type SearchRequest = RequireAtLeastOne<
 *    SearchOptions,
 *    'id' | 'name' | 'category'
 * >;
 *
 * const byID: SearchRequest = { id: 'entry-1' };
 *
 * const byNameAndCategory: SearchRequest = {
 *    name: 'Sword',
 *    category: 'weapon',
 *    limit: 10
 * };
 *
 * // @ts-expect-error At least one search criterion is required.
 * const invalidRequest: SearchRequest = { limit: 10 };
 * ```
 */
type RequireAtLeastOne<T extends object, K extends keyof T = keyof T> = {
  [P in K]: Simplify<Omit<T, K> & Required<Pick<T, P>> & Partial<Pick<T, Exclude<K, P>>>>;
}[K];
/**
 * Requires exactly one of the selected properties.
 *
 * @category Object Constraints
 *
 * @remarks
 * Enable {@link https://www.typescriptlang.org/tsconfig/exactOptionalPropertyTypes.html | exactOptionalPropertyTypes}
 * for strict enforcement. Without this setting, properties declared as optional never may still accept an explicit
 * undefined value, weakening the constraint.
 *
 * @example
 * Require one and only one data source.
 *
 * ```ts
 * interface LoadOptions
 * {
 *    cache?: boolean;
 *    url?: URL;
 *    file?: File;
 * }
 *
 * type LoadRequest = RequireExactlyOne<
 *    LoadOptions,
 *    'url' | 'file'
 * >;
 *
 * const remoteRequest: LoadRequest = {
 *    url: new URL('https://example.com/data.json'),
 *    cache: true
 * };
 *
 * const localRequest: LoadRequest = { file: new File([], 'data.json') };
 *
 * // @ts-expect-error Both source properties cannot be provided.
 * const ambiguousRequest: LoadRequest = {
 *    url: new URL('https://example.com/data.json'),
 *    file: new File([], 'data.json')
 * };
 *
 * // @ts-expect-error One source property is required.
 * const missingSource: LoadRequest = { cache: true };
 * ```
 */
type RequireExactlyOne<T extends object, K extends keyof T = keyof T> = {
  [P in K]: Simplify<
    Omit<T, K> &
      Required<Pick<T, P>> & {
        [Q in Exclude<K, P>]?: never;
      }
  >;
}[K];

/**
 * Produces every key appearing in any member of a union.
 *
 * @category Object Keys
 *
 * @example
 * Extract all keys from a discriminated union rather than only its common keys.
 *
 * ```ts
 * type Entry = { type: 'text'; text: string; } | { type: 'number'; value: number; };
 *
 * type EntryKey = KeysOfUnion<Entry>;
 * // "type" | "text" | "value"
 * ```
 */
type KeysOfUnion<T> = T extends unknown ? keyof T : never;
/**
 * Produces the optional property keys of an object.
 *
 * @category Object Keys
 *
 * @example
 * Extract only properties that may be omitted.
 *
 * ```ts
 * interface Options
 * {
 *    source: string;
 *    enabled?: boolean;
 *    retries?: number;
 *    result: string | undefined;
 * }
 *
 * type OptionalOptionKey = OptionalKeys<Options>;
 * // "enabled" | "retries"
 * ```
 */
type OptionalKeys<T extends object> = {
  [P in keyof T]-?: {} extends Pick<T, P> ? P : never;
}[keyof T];
/**
 * Produces the required property keys of an object.
 *
 * @category Object Keys
 *
 * @example
 * Extract properties that must be present, including required properties whose values may be undefined.
 *
 * ```ts
 * interface Options
 * {
 *    source: string;
 *    enabled?: boolean;
 *    result: string | undefined;
 * }
 *
 * type RequiredOptionKey = RequiredKeys<Options>;
 * // "source" | "result"
 * ```
 */
type RequiredKeys<T extends object> = Exclude<keyof T, OptionalKeys<T>>;
/**
 * Produces only the string keys of an object.
 *
 * @category Object Keys
 *
 * @example
 * Exclude numeric and symbol keys from an object's key type.
 *
 * ```ts
 * declare const metadata: unique symbol;
 *
 * interface Entry
 * {
 *    name: string;
 *    0: number;
 *    [metadata]: boolean;
 * }
 *
 * type EntryStringKey = StringKeyOf<Entry>;
 * // "name"
 * ```
 */
type StringKeyOf<T extends object> = Extract<keyof T, string>;
/**
 * Produces a union of an object's property value types.
 *
 * @category Object Keys
 *
 * @example
 * Derive a union from an object's values rather than its keys.
 *
 * ```ts
 * const httpStatus = {
 *    success: 200,
 *    notFound: 404,
 *    serverError: 500
 * } as const;
 *
 * type HttpStatusName = keyof typeof httpStatus;
 * // "success" | "notFound" | "serverError"
 *
 * type HttpStatusCode = ValueOf<typeof httpStatus>;
 * // 200 | 404 | 500
 * ```
 */
type ValueOf<T extends object> = T[keyof T];

/**
 * Makes the selected properties required and removes null / undefined from their value types.
 *
 * @category Object Modifiers
 *
 * @example
 * Represent an object after selected properties have been validated.
 *
 * ```ts
 * interface InputOptions
 * {
 *    source?: string | null;
 *    enabled?: boolean;
 * }
 *
 * type ResolvedOptions = MakeDefined<InputOptions, 'source'>;
 * // {
 * //    source: string;
 * //    enabled?: boolean;
 * // }
 *
 * const options: ResolvedOptions = { source: 'data.json' };
 * ```
 */
type MakeDefined<T extends object, K extends keyof T> = Simplify<
  Omit<T, K> & {
    [P in K]-?: NonNullable<T[P]>;
  }
>;
/**
 * Makes the selected properties mutable while preserving their optionality.
 *
 * @category Object Modifiers
 *
 * @example
 * Allow selected readonly properties to be reassigned.
 *
 * ```ts
 * interface Entry
 * {
 *    readonly id: string;
 *    readonly label?: string;
 * }
 *
 * type EditableEntry = MakeMutable<Entry, 'label'>;
 *
 * declare let entry: EditableEntry;
 *
 * entry.label = 'Updated';
 *
 * // @ts-expect-error The unselected id property remains readonly.
 * entry.id = 'new-id';
 * ```
 */
type MakeMutable<T extends object, K extends keyof T = keyof T> = Simplify<
  Omit<T, K> & {
    -readonly [P in keyof Pick<T, K>]: Pick<T, K>[P];
  }
>;
/**
 * Makes the selected properties optional.
 *
 * @category Object Modifiers
 *
 * @example
 * Define a draft form of an otherwise complete object.
 *
 * ```ts
 * interface Entry
 * {
 *    id: string;
 *    name: string;
 *    createdAt: Date;
 * }
 *
 * type DraftEntry = MakeOptional<Entry, 'id' | 'createdAt'>;
 *
 * const draft: DraftEntry = { name: 'Example' };
 * ```
 */
type MakeOptional<T extends object, K extends keyof T> = Simplify<Omit<T, K> & Partial<Pick<T, K>>>;
/**
 * Makes the selected properties readonly.
 *
 * @category Object Modifiers
 *
 * @example
 * Prevent reassignment of selected properties while leaving others mutable.
 *
 * ```ts
 * interface Entry
 * {
 *    id: string;
 *    label: string;
 * }
 *
 * type StableEntry = MakeReadonly<Entry, 'id'>;
 *
 * declare let entry: StableEntry;
 *
 * entry.label = 'Updated';
 *
 * // @ts-expect-error The id property is readonly.
 * entry.id = 'new-id';
 * ```
 */
type MakeReadonly<T extends object, K extends keyof T = keyof T> = Simplify<Omit<T, K> & Readonly<Pick<T, K>>>;
/**
 * Makes the selected properties required.
 *
 * @category Object Modifiers
 *
 * @example
 * Require selected configuration properties while retaining the optionality of other properties.
 *
 * ```ts
 * interface Options
 * {
 *    source?: string;
 *    enabled?: boolean;
 *    retries?: number;
 * }
 *
 * type SourceOptions = MakeRequired<Options, 'source'>;
 *
 * const options: SourceOptions = { source: 'data.json' };
 *
 * // @ts-expect-error The source property is required.
 * const invalidOptions: SourceOptions = {};
 * ```
 */
type MakeRequired<T extends object, K extends keyof T> = Simplify<Omit<T, K> & Required<Pick<T, K>>>;

export type {
  ArrayElement,
  Brand,
  IterableElement,
  KeysOfUnion,
  MakeDefined,
  MakeMutable,
  MakeOptional,
  MakeReadonly,
  MakeRequired,
  MaybePromise,
  Merge,
  NonEmptyArray,
  OptionalKeys,
  ReadonlyNonEmptyArray,
  RequireAllOrNone,
  RequireAtLeastOne,
  RequireExactlyOne,
  RequiredKeys,
  Simplify,
  StrictOmit,
  StringKeyOf,
  ValueOf,
};
