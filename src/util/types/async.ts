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

export { MaybePromise };
