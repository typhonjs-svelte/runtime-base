import type { Simplify } from './object-composition';

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
type RequireAllOrNone<T extends object, K extends keyof T = keyof T> =
 Simplify<Omit<T, K> & (| Required<Pick<T, K>> | { [P in K]?: never; })>;

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
type RequireAtLeastOne<T extends object, K extends keyof T = keyof T> =
 { [P in K]: Simplify<Omit<T, K> & Required<Pick<T, P>> & Partial<Pick<T, Exclude<K, P>>>>; }[K];

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
type RequireExactlyOne<T extends object, K extends keyof T = keyof T> =
 { [P in K]: Simplify<Omit<T, K> & Required<Pick<T, P>> & { [Q in Exclude<K, P>]?: never; }>; }[K];

export {
   RequireAllOrNone,
   RequireAtLeastOne,
   RequireExactlyOne
};
