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
type OptionalKeys<T extends object> = { [P in keyof T]-?: {} extends Pick<T, P> ? P : never; }[keyof T];

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

export {
   KeysOfUnion,
   OptionalKeys,
   RequiredKeys,
   StringKeyOf,
   ValueOf
};
