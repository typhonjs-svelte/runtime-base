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
type Simplify<T extends object> = { [P in keyof T]: T[P]; };

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

export {
   Merge,
   Simplify,
   StrictOmit
};
