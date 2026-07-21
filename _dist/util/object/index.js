/** Default maximum number of property-key segments accepted by trie-backed collections. */
const DEFAULT_PROPERTY_PATH_DEPTH_LIMIT = 64;
/** Default maximum number of entries retained by one {@link PropertyPathMap}. */
const DEFAULT_PROPERTY_PATH_ENTRY_LIMIT = 16_384;
/** Default maximum number of non-root trie nodes retained by one {@link PropertyPathMap}. */
const DEFAULT_PROPERTY_PATH_NODE_LIMIT = 65_536;
/** Default maximum number of results produced by one bounded traversal. */
const DEFAULT_PROPERTY_PATH_RESULT_LIMIT = 16_384;
/** Default maximum number of properties or trie nodes inspected by one bounded traversal. */
const DEFAULT_PROPERTY_PATH_VISIT_LIMIT = 65_536;
/**
 * Validates a runtime options object before property access or destructuring.
 */
function assertPropertyPathOptionsObject(value, errorPrefix) {
    return assertObject(value, `${errorPrefix} error: 'options' is not an object.`);
}
/**
 * Consumes one result slot.
 *
 * Callers validate result capacity before consuming a slot.
 */
function consumePropertyPathTraversalResult(budget) {
    budget.results++;
}
/**
 * Consumes one traversal visit and throws before the configured budget can be exceeded.
 */
function consumePropertyPathTraversalVisit(budget) {
    if (budget.visits >= budget.maxVisits) {
        throw new RangeError(`${budget.errorPrefix} error: Traversal exceeded 'options.maxVisits'.`);
    }
    budget.visits++;
}
/**
 * Creates traversal accounting state from normalized bounds.
 */
function createPropertyPathTraversalBudget(bounds, errorPrefix) {
    return {
        errorPrefix,
        maxResults: bounds.maxResults,
        maxVisits: bounds.maxVisits,
        results: 0,
        visits: 0
    };
}
/**
 * Determines whether two normalized property-key paths are structurally equal with SameValueZero segment semantics.
 */
function isNormalizedPropertyPathEqual(pathA, pathB) {
    return pathA.length === pathB.length && isNormalizedPropertyPathPrefix(pathA, pathB);
}
/**
 * Determines whether one normalized property-key path is an exact structural prefix of another.
 */
function isNormalizedPropertyPathPrefix(prefix, path) {
    if (prefix.length > path.length) {
        return false;
    }
    for (let index = 0; index < prefix.length; index++) {
        const prefixKey = prefix[index];
        const pathKey = path[index];
        if (prefixKey !== pathKey && !(typeof prefixKey === 'number' && typeof pathKey === 'number' &&
            Number.isNaN(prefixKey) && Number.isNaN(pathKey))) {
            return false;
        }
    }
    return true;
}
/**
 * Normalizes an optional non-negative safe-integer resource limit.
 *
 * @param value - Candidate limit.
 * @param defaultValue - Value returned when `value` is `undefined`.
 * @param errorMessage - Message used by the thrown {@link TypeError}.
 *
 * @returns The validated limit or `defaultValue`.
 *
 * @throws {TypeError} If a supplied value is not a non-negative safe integer.
 */
function normalizePropertyPathLimit(value, defaultValue, errorMessage) {
    if (value === void 0) {
        return defaultValue;
    }
    if (!Number.isSafeInteger(value) || value < 0) {
        throw new TypeError(errorMessage);
    }
    return value;
}
/**
 * Normalizes and validates common path, depth, result, and visit traversal bounds.
 */
function normalizePropertyPathTraversalBounds(input, config) {
    assertPropertyPathOptionsObject(input, config.errorPrefix);
    const { prefixPath, stopPath, maxDepth, maxResults, maxVisits } = input;
    const prefixOption = `options.${config.prefixOption}`;
    const stopOption = `options.${config.stopOption}`;
    if (prefixPath !== void 0 && !isPropertyPath(prefixPath)) {
        throw new TypeError(`${config.errorPrefix} error: '${prefixOption}' is not a valid property path.`);
    }
    if (stopPath !== void 0 && !isPropertyPath(stopPath)) {
        throw new TypeError(`${config.errorPrefix} error: '${stopOption}' is not a valid property path.`);
    }
    const normMaxDepth = normalizePropertyPathLimit(maxDepth, Number.POSITIVE_INFINITY, `${config.errorPrefix} error: 'options.maxDepth' is not a non-negative safe integer.`);
    const normMaxResults = normalizePropertyPathLimit(maxResults, config.defaultMaxResults ?? DEFAULT_PROPERTY_PATH_RESULT_LIMIT, `${config.errorPrefix} error: 'options.maxResults' is not a non-negative safe integer.`);
    const normMaxVisits = normalizePropertyPathLimit(maxVisits, config.defaultMaxVisits ?? DEFAULT_PROPERTY_PATH_VISIT_LIMIT, `${config.errorPrefix} error: 'options.maxVisits' is not a non-negative safe integer.`);
    const normPrefixPath = prefixPath === void 0 ? void 0 :
        normalizePropertyPath(prefixPath, `${config.errorPrefix} error: '${prefixOption}' is not a valid property path.`);
    const normStopPath = stopPath === void 0 ? void 0 :
        normalizePropertyPath(stopPath, `${config.errorPrefix} error: '${stopOption}' is not a valid property path.`);
    if (normPrefixPath !== void 0 && normStopPath !== void 0 &&
        !isNormalizedPropertyPathPrefix(normPrefixPath, normStopPath)) {
        throw new RangeError(config.stopOutsideMessage ?? `${config.errorPrefix} error: '${stopOption}' must equal or ` +
            `descend from '${prefixOption}'.`);
    }
    const basePathLength = normPrefixPath?.length ?? 0;
    const maxPathLength = normMaxDepth === Number.POSITIVE_INFINITY ? Number.POSITIVE_INFINITY :
        Math.min(Number.MAX_SAFE_INTEGER, basePathLength + normMaxDepth);
    return {
        prefixPath: normPrefixPath,
        stopPath: normStopPath,
        maxPathLength,
        maxResults: Math.min(normMaxResults, config.maxResultsLimit ?? Number.MAX_SAFE_INTEGER),
        maxVisits: Math.min(normMaxVisits, config.maxVisitsLimit ?? Number.MAX_SAFE_INTEGER)
    };
}

/**
 * Asserts that a value is a non-null object, including arrays.
 *
 * Unlike {@link isNonNullObject}, this function preserves the **existing** static type of the variable while removing
 * nullish, primitive, function, and class-constructor union members.
 *
 * This assertion accepts arrays, ordinary objects, class instances, boxed primitives, and specialized built-in
 * objects such as `Date`, `Map`, and `Set`.
 *
 * Use this function when:
 * ```
 *   - You expect a non-null object at runtime, including an array, **and**
 *   - You want to keep its compile-time type intact after validation.
 * ```
 *
 * @example
 * function process(value: string[] | (() => void) | undefined): void
 * {
 *    assertNonNullObject(value);
 *
 *    value.push('entry');
 *    // `value` is narrowed to `string[]`.
 * }
 *
 * @category Object Validation
 *
 * @param value - The value to validate.
 *
 * @param errorMsg - Optional message used for the thrown TypeError.
 *
 * @throws {TypeError} if the value is null, primitive, or callable.
 */
function assertNonNullObject(value, errorMsg = 'Expected a non-null object.') {
    if (!isNonNullObject(value)) {
        throw new TypeError(errorMsg);
    }
}
/**
 * Asserts that a value is an object, not null, and not an array.
 *
 * Unlike {@link isObject}, this function does **not** narrow the value to a generic indexable structure. Instead, it
 * preserves the **existing** static type of the variable. This makes it ideal for validating option objects or
 * interface-based inputs where all properties may be optional.
 *
 * Use this function when:
 * ```
 *   - You expect a value to be an object at runtime, **and**
 *   - You want to keep its compile-time type intact after validation.
 * ```
 *
 * @example
 * interface Options { flag?: boolean; value?: number; }
 *
 * function run(opts: Options = {}) {
 *   assertObject(opts, `'opts' is not an object.`);  // `opts` remains `Options`, not widened or reduced.
 *   opts.value;                                      // Fully typed access remains available.
 * }
 *
 * @category Object Validation
 *
 * @param value - The value to validate.
 *
 * @param errorMsg - Optional message used for the thrown TypeError.
 *
 * @throws {TypeError} if the value is null, non-object, or an array.
 */
function assertObject(value, errorMsg = 'Expected an object.') {
    if (!isObject(value)) {
        throw new TypeError(errorMsg);
    }
}
/**
 * Asserts that a value is a non-null object or function.
 *
 * Unlike {@link isObjectOrFunction}, this function does **not** narrow the value to a generic object type. Instead, it
 * preserves the **existing** static type of the variable while removing primitive and nullish union members.
 *
 * This assertion accepts all JavaScript reference values, including arrays, functions, class constructors, ordinary
 * objects, and specialized built-in objects.
 *
 * Use this function when:
 * ```
 *   - You expect a value to be an object or function at runtime, **and**
 *   - You want to keep its compile-time type intact after validation.
 * ```
 *
 * @example
 * function execute(value: Date | (() => void) | undefined): void
 * {
 *    assertIsObjectOrFunction(value);
 *
 *    // `value` is now `Date | (() => void)`.
 * }
 *
 * @category Object Validation
 *
 * @param value - The value to validate.
 *
 * @param errorMsg - Optional message used for the thrown TypeError.
 *
 * @throws {TypeError} if the value is null or a primitive value.
 */
function assertObjectOrFunction(value, errorMsg = 'Expected an object or function.') {
    if (!isObjectOrFunction(value)) {
        throw new TypeError(errorMsg);
    }
}
/**
 * Asserts that a value is an ordinary object.
 *
 * Unlike {@link isOrdinaryObject}, this function preserves the **existing** static type of the variable rather than
 * narrowing it to a generic indexable structure. It accepts plain objects, custom-prototype objects, and ordinary
 * class instances, while rejecting arrays, functions, primitives, and specialized built-in objects.
 *
 * Use this function when:
 * ```
 *   - You expect a value to be an ordinary object at runtime, **and**
 *   - You want to keep its compile-time type intact after validation.
 * ```
 *
 * @example
 * class Options {
 *   flag?: boolean;
 *   value?: number;
 * }
 *
 * function run(opts: Options) {
 *   assertOrdinaryObject(opts, `'opts' is not an ordinary object.`);
 *   opts.value; // `opts` remains typed as `Options`.
 * }
 *
 * @category Object Validation
 *
 * @param value - The value to validate.
 *
 * @param errorMsg - Optional message used for the thrown TypeError.
 *
 * @throws {TypeError} if the value is not an ordinary object.
 */
function assertOrdinaryObject(value, errorMsg = 'Expected an ordinary object.') {
    if (!isOrdinaryObject(value)) {
        throw new TypeError(errorMsg);
    }
}
/**
 * Asserts that a value is a plain object, not null, and not an array.
 *
 * Unlike {@link isPlainObject}, this function does **not** narrow the value to a generic indexable structure. Instead,
 * it preserves the **existing** static type of the variable. This makes it ideal for validating option objects or
 * interface-based inputs where all properties may be optional.
 *
 * Use this function when:
 * ```
 *   - You expect a value to be a plain object at runtime, **and**
 *   - You want to keep its compile-time type intact after validation.
 * ```
 *
 * @example
 * interface Options { flag?: boolean; value?: number; }
 *
 * function run(opts: Options = {}) {
 *   assertPlainObject(opts, `'opts' is not a plain object.`); // `opts` remains `Options`, not widened or reduced.
 *   opts.value;                                               // Fully typed access remains available.
 * }
 *
 * @category Object Validation
 *
 * @param value - The value to validate.
 *
 * @param errorMsg - Optional message used for the thrown TypeError.
 *
 * @throws {TypeError} if the value is null, non-object, or an array.
 */
function assertPlainObject(value, errorMsg = 'Expected a plain object.') {
    if (!isPlainObject(value)) {
        throw new TypeError(errorMsg);
    }
}
/**
 * Asserts that a value is a non-null, non-array object that can be treated as a string-keyed record.
 *
 * Unlike {@link isRecord}, this function does **not** narrow the value to a generic indexable structure. Instead,
 * it preserves the **existing** static type of the variable. This makes it ideal for validating option objects or
 * interface-based inputs where all properties may be optional.
 *
 * Use this function when:
 * ```
 *   - You need to reject `null`, primitives, or arrays at runtime.
 *   - You want to safely treat the value as a record, **without losing its compile-time shape**.
 * ```
 *
 * @example
 * interface Options { flag?: boolean; value?: number; }
 *
 * function run(opts: Options = {}) {
 *   assertPlainObject(opts, `'opts' is not a record object.`);   // `opts` remains `Options`, not widened or reduced.
 *   opts.value;                                                  // Fully typed access remains available.
 * }
 *
 * @category Object Validation
 *
 * @param value - The value to validate.
 *
 * @param errorMsg - Optional message used for the thrown TypeError.
 *
 * @throws {TypeError} if the value is null, non-object, or an array.
 */
function assertRecord(value, errorMsg = 'Expected a record object.') {
    if (!isRecord(value)) {
        throw new TypeError(errorMsg);
    }
}
/**
 * Concatenates one or more property paths into a newly allocated exact property-key path.
 *
 * Every path is normalized before concatenation. Dotted strings therefore contribute one segment per delimiter,
 * while array property-keys preserve numbers, symbols, empty-string keys, and literal periods exactly. The returned
 * array is independent of every input array and may be retained or modified by the caller without affecting those
 * inputs.
 *
 * @example
 * ```ts
 * concatPropertyPath('actor.system', ['attributes', 'hp'], 'value');
 * // ['actor', 'system', 'attributes', 'hp', 'value']
 * ```
 * @category Property Keys and Paths
 *
 * @param path - First path to concatenate.
 *
 * @param paths - Additional property paths appended in order.
 *
 * @returns A newly allocated exact property-key path.
 *
 * @throws {TypeError} If any argument is not a valid {@link PropertyPath} or no path is supplied at runtime.
 */
function concatPropertyPath(path, ...paths) {
    if (arguments.length === 0) {
        throw new TypeError(`concatPropertyPath error: At least one property path is required.`);
    }
    const result = Array.from(normalizePropertyPath(path));
    for (const entry of paths) {
        result.push(...normalizePropertyPath(entry));
    }
    return result;
}
/**
 * Freezes all traversed object and array values.
 *
 * @category Deep Object Operations
 *
 * @param data - An object or array.
 *
 * @param [options] - Options.
 *
 * @param [options.skipKeys] - A readonly set of property keys whose values are excluded from traversal. Numeric keys are
 *        normalized to their JavaScript string-key representation. A matching key is skipped regardless of where it
 *        appears in the object graph.
 *
 * @returns The frozen object.
 *
 * @typeParam T - Type of data.
 */
function deepFreeze(data, { skipKeys } = {}) {
    assertNonNullObject(data, `deepFreeze error: 'data' is not an object or array.`);
    if (skipKeys !== void 0 && Object.prototype.toString.call(skipKeys) !== '[object Set]') {
        throw new TypeError(`deepFreeze error: 'options.skipKeys' is not a Set.`);
    }
    // JavaScript coerces numeric property keys to strings. Normalize once so numeric
    // skip entries match the keys produced by Object.keys / Reflect.ownKeys.
    let normalizedSkipKeys;
    if (skipKeys !== void 0) {
        const normalized = new Set();
        for (const key of skipKeys) {
            normalized.add(typeof key === 'number' ? String(key) : key);
        }
        normalizedSkipKeys = normalized;
    }
    const stack = [data];
    while (stack.length > 0) {
        const obj = stack.pop();
        if (typeof obj !== 'object' || obj === null || Object.isFrozen(obj)) {
            continue;
        }
        // Collect own enumerable string and symbol children before freezing. A skipped key prevents the corresponding
        // property value from being read through this traversal edge.
        const children = [];
        for (const key of getEnumerablePropertyKeys(obj, true)) {
            if (normalizedSkipKeys?.has(key)) {
                continue;
            }
            children.push(obj[key]);
        }
        Object.freeze(obj);
        for (const child of children) {
            if (isNonNullObject(child)) {
                stack.push(child);
            }
        }
    }
    return data;
}
function deepMerge(target, ...sourceObj) {
    if (!isOrdinaryObject(target)) {
        throw new TypeError(`deepMerge error: 'target' is not an ordinary object.`);
    }
    if (sourceObj.length === 0) {
        throw new TypeError(`deepMerge error: 'sourceObj' is not an ordinary object.`);
    }
    for (let i = 0; i < sourceObj.length; i++) {
        if (!isOrdinaryObject(sourceObj[i])) {
            throw new TypeError(`deepMerge error: 'sourceObj[${i}]' is not an ordinary object.`);
        }
        // Preflight every source before mutating the target so a circular source cannot leave a partial merge behind.
        assertNoCircularPlainObject(sourceObj[i]);
    }
    if (sourceObj.length === 1) {
        // Fast path: an existing plain target branch can be reused directly because no later source can replace it.
        const stack = [{ target, source: sourceObj[0] }];
        while (stack.length > 0) {
            const entry = stack.pop();
            for (const key of getEnumerablePropertyKeys(entry.source, true)) {
                // Filtering occurs at every depth. Plain source objects must therefore be traversed rather than assigned
                // wholesale, otherwise a blocked nested key could bypass this guard.
                if (isBlockedPrototypeKey(key)) {
                    continue;
                }
                const sourceValue = entry.source[key];
                const targetValue = entry.target[key];
                if (isPlainObject(sourceValue)) {
                    // Preserve an existing plain branch; otherwise create only the two supported plain-object prototype
                    // categories. Custom source prototypes are never propagated into recursively merged branches.
                    const mergedTarget = isPlainObject(targetValue) ?
                        targetValue : Object.create(Object.getPrototypeOf(sourceValue) === null ? null : Object.prototype);
                    entry.target[key] = mergedTarget;
                    stack.push({ target: mergedTarget, source: sourceValue });
                }
                else {
                    entry.target[key] = sourceValue;
                }
            }
        }
    }
    else {
        // Complete each source before processing the next so queued nested work cannot target a branch replaced by a
        // later source. This preserves source precedence without recursive calls.
        for (const source of sourceObj) {
            const stack = [{ target, source }];
            while (stack.length > 0) {
                const entry = stack.pop();
                for (const key of getEnumerablePropertyKeys(entry.source, true)) {
                    // Apply the same security filter at every nested level in the multi-source path.
                    if (isBlockedPrototypeKey(key)) {
                        continue;
                    }
                    const sourceValue = entry.source[key];
                    const targetValue = entry.target[key];
                    if (isPlainObject(sourceValue)) {
                        // Copy an existing plain target branch before merging so multi-source operation does not mutate
                        // that preexisting nested object by reference. Missing / non-plain branches are recreated safely.
                        const mergedTarget = isPlainObject(targetValue) ?
                            clonePlainEnumerable(targetValue) :
                            Object.create(Object.getPrototypeOf(sourceValue) === null ? null : Object.prototype);
                        entry.target[key] = mergedTarget;
                        stack.push({ target: mergedTarget, source: sourceValue });
                    }
                    else {
                        entry.target[key] = sourceValue;
                    }
                }
            }
        }
    }
    return target;
}
/**
 * Seals all traversed object and array values.
 *
 * @category Deep Object Operations
 *
 * @param data - An object or array.
 *
 * @param [options] - Options.
 *
 * @param [options.skipKeys] - A readonly set of property keys whose values are excluded from traversal. Numeric keys
 *        are normalized to their JavaScript string-key representation. A matching key is skipped regardless of where it
 *        appears in the object graph.
 *
 * @returns The sealed object.
 *
 * @typeParam T - Type of data.
 */
function deepSeal(data, { skipKeys } = {}) {
    assertNonNullObject(data, `deepSeal error: 'data' is not an object or array.`);
    if (skipKeys !== void 0 && Object.prototype.toString.call(skipKeys) !== '[object Set]') {
        throw new TypeError(`deepSeal error: 'options.skipKeys' is not a Set.`);
    }
    // JavaScript coerces numeric property keys to strings. Normalize once so numeric
    // skip entries match the keys produced by Object.keys / Reflect.ownKeys.
    let normalizedSkipKeys;
    if (skipKeys !== void 0) {
        const normalized = new Set();
        for (const key of skipKeys) {
            normalized.add(typeof key === 'number' ? String(key) : key);
        }
        normalizedSkipKeys = normalized;
    }
    const stack = [data];
    while (stack.length > 0) {
        const obj = stack.pop();
        if (typeof obj !== 'object' || obj === null || Object.isSealed(obj)) {
            continue;
        }
        // Discover own enumerable string and symbol children before sealing. Already sealed objects serve as the
        // visited boundary, so cycles terminate without a separate allocation-heavy visited set.
        const children = [];
        for (const key of getEnumerablePropertyKeys(obj, true)) {
            // Enumerable object keys returned by the helper are strings or symbols.
            if (normalizedSkipKeys?.has(key)) {
                continue;
            }
            children.push(obj[key]);
        }
        Object.seal(obj);
        for (const child of children) {
            if (typeof child === 'object' && child !== null) {
                stack.push(child);
            }
        }
    }
    return data;
}
/**
 * Deletes the property resolved by a property path.
 *
 * By default, every path segment must be an own property. Set `hasOwnOnly` to `false` to permit inherited traversal;
 * when the final property is inherited, the property is deleted from the prototype object that owns it. This explicit
 * opt-in prevents accidental prototype mutation during ordinary use.
 *
 * Prototype-pollution keys (`__proto__`, `prototype`, and `constructor`) and ECMAScript well-known symbols are rejected
 * at every path segment, matching the mutation hardening applied by {@link safeSet}. Non-configurable properties are
 * not deleted.
 *
 * @category Property Mutation
 *
 * @param data - Object containing the property path.
 *
 * @param path - Dotted or exact property-key path.
 *
 * @param options - Deletion options.
 *
 * @param options.hasOwnOnly - Whether every path segment must be an own property; default: `true`.
 *
 * @returns Whether an existing configurable property was deleted.
 *
 * @throws {TypeError} If `options.hasOwnOnly` is not a boolean.
 */
function deleteProperty(data, path, { hasOwnOnly = true } = {}) {
    if (typeof data !== 'object' || data === null || !isPropertyPath(path)) {
        return false;
    }
    if (typeof hasOwnOnly !== 'boolean') {
        throw new TypeError(`deleteProperty error: 'options.hasOwnOnly' is not a boolean.`);
    }
    const normPath = normalizePropertyPath(path);
    for (const key of normPath) {
        if ((typeof key === 'string' && isBlockedPrototypeKey(key)) ||
            (typeof key === 'symbol' && wellKnownSymbols.has(key))) {
            return false;
        }
    }
    const resolution = resolvePropertyPath(data, normPath, {
        hasOwnOnly,
        readValue: false
    });
    if (resolution === void 0 || resolution.descriptor.configurable === false) {
        return false;
    }
    return Reflect.deleteProperty(resolution.owner, resolution.key);
}
/**
 * Ensures that a value is a *non-empty async iterable*.
 * ```
 * - If the value is not async iterable, `undefined` is returned.
 * - If the async iterable yields no items, `undefined` is returned.
 * - If it yields at least one item, a fresh async iterable is returned which yields the first peeked item followed by
 * the rest, preserving behavior for one-shot async generators.
 * ```
 *
 * Supports both AsyncIterable<T> and (optionally) synchronous Iterable<T>.
 *
 * @category Iterable Utilities
 *
 * @param value - The value to test as an async iterable.
 *
 * @returns A non-empty async iterable, or `undefined`.
 */
async function ensureNonEmptyAsyncIterable(value) {
    const candidate = value;
    const asyncIteratorFn = candidate?.[Symbol.asyncIterator];
    const syncIteratorFn = candidate?.[Symbol.iterator];
    if (typeof asyncIteratorFn === 'function') {
        const iter = asyncIteratorFn.call(value);
        const first = await iter.next();
        if (first.done) {
            return void 0;
        }
        return (async function* () {
            yield first.value;
            for (let result = await iter.next(); !result.done; result = await iter.next()) {
                yield result.value;
            }
        })();
    }
    if (typeof syncIteratorFn === 'function') {
        const iter = syncIteratorFn.call(value);
        const first = iter.next();
        if (first.done) {
            return void 0;
        }
        return (async function* () {
            yield first.value;
            for (let result = iter.next(); !result.done; result = iter.next()) {
                yield result.value;
            }
        })();
    }
    return void 0;
}
/**
 * Ensures that a given value is a *non-empty iterable*.
 * ```
 * - If the value is not iterable → returns `undefined`.
 * - If the value is an iterable but contains no entries → returns `undefined`.
 * - If the value is a non-empty iterable → returns a fresh iterable (generator) that yields the first peeked value
 * followed by the remaining values. This guarantees restartable iteration even when the original iterable is a
 * one-shot generator.
 * ```
 *
 * This function is ideal when you need a safe, non-empty iterable for iteration but cannot consume or trust the
 * original iterable’s internal iterator state.
 *
 * @example
 * const iter = ensureNonEmptyIterable(['a', 'b']);
 * // `iter` is an iterable yielding 'a', 'b'.
 *
 * const empty = ensureNonEmptyIterable([]);
 * // `undefined`
 *
 * const gen = ensureNonEmptyIterable((function*(){ yield 1; yield 2; })());
 * // Safe: returns an iterable yielding 1, 2 without consuming the generator.
 *
 * @category Iterable Utilities
 *
 * @param value - The value to inspect.
 *
 * @returns A restartable iterable containing all values, or `undefined` if the input was not iterable or contained no
 *          items.
 */
function ensureNonEmptyIterable(value) {
    if (!isIterable(value)) {
        return void 0;
    }
    // Peek at the first value without committing to iteration on restartable iterables.
    const iter = value[Symbol.iterator]();
    const first = iter.next();
    // Empty iterable.
    if (first.done) {
        return void 0;
    }
    // Non-empty: return a generator that includes the first peeked value.
    return (function* () {
        // Include first consumed value.
        yield first.value;
        // Yield remaining values from original iterator.
        for (let r = iter.next(); !r.done; r = iter.next()) {
            yield r.value;
        }
    })();
}
/**
 * Returns the value resolved by a property path while preserving present `undefined` and `null` values.
 *
 * Unlike {@link safeAccess}, this function returns a present nullish property unchanged. A missing or invalid path
 * returns `undefined`; use {@link hasProperty} when that result must be distinguished from a present `undefined`
 * property. Array indexes require numeric keys through an exact array property-key path.
 *
 * @category Property Access and Inspection
 *
 * @param data - Object to inspect.
 *
 * @param path - Dotted or exact property-key path.
 *
 * @param options - Property lookup options.
 *
 * @param options.hasOwnOnly - Whether every path segment must be an own property; default: `false`.
 *
 * @returns The resolved property value, or `undefined` when the path cannot be resolved.
 *
 * @throws {TypeError} If `options.hasOwnOnly` is not a boolean.
 *
 * @typeParam T - Root object type.
 * @typeParam P - Property path type.
 */
function getProperty(data, path, { hasOwnOnly = false } = {}) {
    if (typeof data !== 'object' || data === null || !isPropertyPath(path)) {
        return void 0;
    }
    if (typeof hasOwnOnly !== 'boolean') {
        throw new TypeError(`getProperty error: 'options.hasOwnOnly' is not a boolean.`);
    }
    return resolvePropertyPath(data, normalizePropertyPath(path), { hasOwnOnly })?.value;
}
/**
 * Returns the own property descriptor that defines the final segment of a property path.
 *
 * Intermediate values are read as necessary to continue traversal, but the final property value is not read. Getter
 * accessors at the terminal segment are therefore not invoked. When inherited lookup is enabled, the descriptor is
 * returned from the prototype object that owns the final property.
 *
 * @category Property Access and Inspection
 *
 * @param data - Object to inspect.
 *
 * @param path - Dotted or exact property-key path.
 *
 * @param options - Property lookup options.
 *
 * @param options.hasOwnOnly - Whether every path segment must be an own property; default: `false`.
 *
 * @returns The terminal property descriptor, or `undefined` when the path cannot be resolved.
 *
 * @throws {TypeError} If `options.hasOwnOnly` is not a boolean.
 */
function getPropertyDescriptor(data, path, { hasOwnOnly = false } = {}) {
    if (typeof data !== 'object' || data === null || !isPropertyPath(path)) {
        return void 0;
    }
    if (typeof hasOwnOnly !== 'boolean') {
        throw new TypeError(`getPropertyDescriptor error: 'options.hasOwnOnly' is not a boolean.`);
    }
    return resolvePropertyPath(data, normalizePropertyPath(path), { hasOwnOnly, readValue: false })?.descriptor;
}
/**
 * Returns the object that owns the final property resolved by a property path.
 *
 * The owner may be the object reached directly by the parent path or one of its prototypes. Intermediate values are
 * read to continue traversal, but the final property value is not read. Set `hasOwnOnly` to `true` to require every
 * segment, including the terminal property, to be owned directly by the value reached at that depth.
 *
 * @category Property Access and Inspection
 *
 * @param data - Object to inspect.
 *
 * @param path - Dotted or exact property-key path.
 *
 * @param options - Property lookup options.
 *
 * @param options.hasOwnOnly - Whether every path segment must be an own property; default: `false`.
 *
 * @returns The terminal property owner, or `undefined` when the path cannot be resolved.
 *
 * @throws {TypeError} If `options.hasOwnOnly` is not a boolean.
 */
function getPropertyOwner(data, path, { hasOwnOnly = false } = {}) {
    if (typeof data !== 'object' || data === null || !isPropertyPath(path)) {
        return void 0;
    }
    if (typeof hasOwnOnly !== 'boolean') {
        throw new TypeError(`getPropertyOwner error: 'options.hasOwnOnly' is not a boolean.`);
    }
    return resolvePropertyPath(data, normalizePropertyPath(path), { hasOwnOnly, readValue: false })?.owner;
}
/**
 * Determine if the given object has a getter & setter accessor.
 *
 * @category Accessors and Prototypes
 *
 * @param object - An object.
 *
 * @param accessor - Accessor to test.
 *
 * @returns Whether the given object has the getter and setter for accessor.
 *
 * @typeParam T - Type of data.
 * @typeParam K - Accessor key.
 */
function hasAccessor(object, accessor) {
    if (typeof object !== 'object' || object === null || object === void 0) {
        return false;
    }
    const descriptor = getPropertyDescriptor(object, [accessor]);
    return descriptor?.get !== void 0 && descriptor.set !== void 0;
}
/**
 * Determine if the given object has a getter accessor.
 *
 * @category Accessors and Prototypes
 *
 * @param object - An object.
 *
 * @param accessor - Accessor to test.
 *
 * @returns Whether the given object has the getter for accessor.
 *
 * @typeParam T - Type of data.
 * @typeParam K - Accessor key.
 */
function hasGetter(object, accessor) {
    if (typeof object !== 'object' || object === null || object === void 0) {
        return false;
    }
    return getPropertyDescriptor(object, [accessor])?.get !== void 0;
}
/**
 * Determines whether an property path exists on an object.
 *
 * Traversal aborts immediately when a property is missing, an intermediate value cannot be traversed, or an invalid
 * array index is encountered. Properties whose values are `undefined` or `null` are considered present. The terminal
 * property value is not read, so a getter at the final segment is not invoked merely to test existence.
 *
 * Array indexes may only be accessed by number through the array property-key form.
 *
 * @category Property Access and Inspection
 *
 * @param data - An object to inspect.
 *
 * @param path - A dotted string path or an array of exact string, number, or symbol property keys.
 *
 * @param options - Property lookup options.
 *
 * @param options.hasOwnOnly - Whether every path segment must be an own property; default: `false`.
 *
 * @returns Whether the complete property path exists.
 *
 * @throws {TypeError} If `options.hasOwnOnly` is not a boolean.
 */
function hasProperty(data, path, { hasOwnOnly = false } = {}) {
    if (typeof data !== 'object' || data === null || !isPropertyPath(path)) {
        return false;
    }
    if (typeof hasOwnOnly !== 'boolean') {
        throw new TypeError(`hasProperty error: 'options.hasOwnOnly' is not a boolean.`);
    }
    return resolvePropertyPath(data, normalizePropertyPath(path), { hasOwnOnly, readValue: false }) !== void 0;
}
/**
 * Returns whether the target is or has the given prototype walking up the prototype chain.
 *
 * @category Accessors and Prototypes
 *
 * @param target - Any target class / constructor function to test.
 *
 * @param Prototype - Class / constructor function to find.
 *
 * @returns Target matches prototype.
 *
 * @typeParam T - Prototype class / constructor.
 */
function hasPrototype(target, Prototype) {
    if (typeof target !== 'function') {
        return false;
    }
    if (target === Prototype) {
        return true;
    }
    // Walk parent prototype chain. Check for descriptor at each prototype level.
    for (let proto = Object.getPrototypeOf(target); proto; proto = Object.getPrototypeOf(proto)) {
        if (proto === Prototype) {
            return true;
        }
    }
    return false;
}
/**
 * Determine if the given object has a setter accessor.
 *
 * @category Accessors and Prototypes
 *
 * @param object - An object.
 *
 * @param accessor - Accessor to test.
 *
 * @returns Whether the given object has the setter for accessor.
 *
 * @typeParam T - Type of data.
 * @typeParam K - Accessor key.
 */
function hasSetter(object, accessor) {
    if (typeof object !== 'object' || object === null || object === void 0) {
        return false;
    }
    return getPropertyDescriptor(object, [accessor])?.set !== void 0;
}
/**
 * Returns whether a value is a valid ECMAScript array index.
 *
 * The maximum array index is `2^32 - 2`; `2^32 - 1` is reserved and does not update an array's `length`.
 *
 * @category Property Keys and Paths
 *
 * @param value - Candidate numeric property key.
 *
 * @returns Whether `value` is an integer in the ECMAScript array-index range.
 */
function isArrayIndex(value) {
    return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 0xFFFFFFFE;
}
/**
 * Tests for whether an _object_ is async iterable.
 *
 * @category Iterable Utilities
 *
 * @param value - Any value.
 *
 * @returns Whether value is async iterable.
 */
function isAsyncIterable(value) {
    return value !== null && typeof value === 'object' && typeof value[Symbol.asyncIterator] === 'function';
}
/**
 * Tests for whether an _object_ is iterable.
 *
 * Note: Excludes `strings` in iterable test even though they are technically iterable.
 *
 * @category Iterable Utilities
 *
 * @param value - Any value.
 *
 * @returns Whether object is iterable.
 */
function isIterable(value) {
    return value !== null && typeof value === 'object' && typeof value[Symbol.iterator] === 'function';
}
/**
 * Determines whether a value is a {@link JSONPropertyPath}.
 *
 * A JSON property path is either:
 *
 * - A non-empty dotted string.
 * - A non-empty, dense array containing only strings and finite numbers.
 *
 * Symbol segments are rejected because symbols cannot be represented by JSON. Non-finite numbers are also rejected
 * because `JSON.stringify` converts `NaN`, `Infinity`, and `-Infinity` to `null`. Sparse arrays are rejected because
 * missing elements are likewise serialized as `null`.
 *
 * Numeric values do not need to be integers or valid array indexes. This function validates lossless JSON
 * representation only; array-index constraints remain dependent on the value traversed by a path-aware operation.
 *
 * `-0` is accepted because JSON normalizes it to `0`, which is equivalent under the package's property-key comparison
 * semantics.
 *
 * @example
 * ```ts
 * isJSONPropertyPath('actor.system.hp');       // true
 * isJSONPropertyPath(['actors', 0, 'name']);   // true
 * isJSONPropertyPath(['literal.period']);      // true
 *
 * isJSONPropertyPath([Symbol('metadata')]);    // false
 * isJSONPropertyPath(['actors', NaN]);         // false
 * isJSONPropertyPath(new Array(1));            // false
 * ```
 *
 * @category Property Keys and Paths
 *
 * @param value - Value to evaluate.
 *
 * @returns Whether the value is a non-empty property path that can be represented losslessly through ordinary JSON
 *          serialization.
 */
function isJSONPropertyPath(value) {
    if (typeof value === 'string') {
        return value.length > 0;
    }
    if (!Array.isArray(value) || value.length === 0) {
        return false;
    }
    for (let index = 0; index < value.length; index++) {
        const key = value[index];
        if (typeof key !== 'string' && (typeof key !== 'number' || !Number.isFinite(key))) {
            return false;
        }
    }
    return true;
}
/**
 * Determines whether a value is a non-null object, including arrays.
 *
 * This predicate accepts arrays, ordinary objects, class instances, boxed primitives, and specialized built-in
 * objects such as `Date`, `Map`, and `Set`. It rejects `null`, primitive values, functions, and class constructors.
 *
 * Unlike {@link isObject}, this function accepts arrays. Unlike {@link isObjectOrFunction}, it rejects functions and
 * class constructors.
 *
 * Known object types retain their existing static type. Mixed unions are narrowed to their non-null, non-callable
 * object members.
 *
 * @example
 * const value: string[] | (() => void) | undefined = [];
 *
 * if (isNonNullObject(value))
 * {
 *    value.push('entry');
 *    // `value` is narrowed to `string[]`.
 * }
 *
 * @category Object Validation
 *
 * @param value - The value to evaluate.
 *
 * @returns Whether the value has a runtime type of `object` and is not `null`.
 */
function isNonNullObject(value) {
    return typeof value === 'object' && value !== null;
}
function isObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function isObjectOrFunction(value) {
    return value !== null && (typeof value === 'object' || typeof value === 'function');
}
function isOrdinaryObject(value) {
    return value !== null &&
        typeof value === 'object' &&
        Object.prototype.toString.call(value) === '[object Object]';
}
function isPlainObject(value) {
    if (value === null || typeof value !== 'object') {
        return false;
    }
    const prototype = Object.getPrototypeOf(value);
    return prototype === null || prototype === Object.prototype;
}
/**
 * Determines whether a value is a JavaScript property key.
 *
 * Property keys are strings, numbers, or symbols. Numbers are accepted because exact property-key arrays preserve
 * numeric array indexes and ordinary JavaScript property access coerces numeric object keys as usual.
 *
 * @category Property Keys and Paths
 *
 * @param value - Candidate property key.
 *
 * @returns Whether `value` is a string, number, or symbol.
 */
function isPropertyKey(value) {
    const valueType = typeof value;
    return valueType === 'string' || valueType === 'number' || valueType === 'symbol';
}
/**
 * Checks whether a value is a generic key / value object / `Record<string, unknown>`.
 *
 * A record in this context means:
 *   - `typeof value === 'object'`
 *   - value is not `null`
 *   - value is not an array
 *
 * Unlike {@link isObject}, this function does **not** attempt to preserve the original object type. All successful
 * results narrow to `Record<string, unknown>` making the returned value safe for key-indexed access but without any
 * knowledge of property names or expected value types.
 *
 * This is useful when processing untyped JSON-like data structures, dynamic configuration blocks, response bodies,
 * or any case where a dictionary-style object is expected rather than a typed interface value.
 *
 * Contrast With:
 * - {@link isObject} → preserves known object types where possible; use when typing should remain intact.
 * - {@link isPlainObject} → narrows to plain JSON objects only (no prototypes, no class instances).
 * - `isRecord()` → always narrows to a dictionary-style record for keyed lookup.
 *
 * @category Object Validation
 *
 * @param value - Any value to test.
 *
 * @returns True if the value is an object that is neither null nor an array.
 */
function isRecord(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}
/**
 * Determines whether a value is a valid property path.
 *
 * A valid path is either:
 *
 * - A non-empty dotted string.
 * - A non-empty readonly array containing only string, number, or symbol property keys.
 *
 * This function validates the property path representation only. Numeric array-index constraints are evaluated during
 * traversal because whether a numeric key is required depends on the value reached at runtime.
 *
 * @category Property Keys and Paths
 *
 * @param value - Value to validate.
 *
 * @returns Whether the value is a valid {@link PropertyPath}.
 */
function isPropertyPath(value) {
    if (typeof value === 'string') {
        return value.length > 0;
    }
    if (!Array.isArray(value) || value.length === 0) {
        return false;
    }
    for (let index = 0; index < value.length; index++) {
        if (!isPropertyKey(value[index])) {
            return false;
        }
    }
    return true;
}
/**
 * Determines whether two property paths are structurally equivalent.
 *
 * Both paths are normalized before comparison, so an ordinary dotted path and its equivalent string-key array compare
 * as equal:
 *
 * @example
 * ```ts
 * isPropertyPathEqual('actor.system.name', ['actor', 'system', 'name']);
 * // true
 * ```
 *
 * Segment comparison follows native `Map` / SameValueZero semantics:
 *
 * - Strings compare by value.
 * - Numbers compare with SameValueZero semantics, so `0` equals `-0` and `NaN` equals `NaN`.
 * - Symbols compare by identity.
 * - Numeric and string segments remain distinct.
 *
 * Invalid property paths return `false` rather than throwing, matching predicate conventions.
 *
 * @see [SameValueZero - TC39](https://tc39.es/ecma262/multipage/abstract-operations.html#sec-samevaluezero)
 *
 * @category Property Keys and Paths
 *
 * @param pathA - First property path.
 * @param pathB - Second property path.
 *
 * @returns Whether both paths contain the same property-key segments in the same order.
 */
function isPropertyPathEqual(pathA, pathB) {
    if (!isPropertyPath(pathA) || !isPropertyPath(pathB)) {
        return false;
    }
    const keysA = normalizePropertyPath(pathA);
    const keysB = normalizePropertyPath(pathB);
    if (keysA.length !== keysB.length) {
        return false;
    }
    for (let index = 0; index < keysA.length; index++) {
        const keyA = keysA[index];
        const keyB = keysB[index];
        if (keyA !== keyB && !(typeof keyA === 'number' && typeof keyB === 'number' &&
            Number.isNaN(keyA) && Number.isNaN(keyB))) {
            return false;
        }
    }
    return true;
}
/**
 * Determines whether one property path is an exact structural prefix of another.
 *
 * Both property paths are compared after normalization. Segment comparison follows native `Map` / SameValueZero
 * semantics: strings compare by value, symbols by identity, `0` equals `-0`, and numeric `NaN` segments compare as
 * equal. Numeric and string segments remain distinct.
 *
 * Invalid path values return `false` rather than throwing, matching predicate conventions.
 *
 * @category Property Keys and Paths
 *
 * @param prefix - Candidate prefix path.
 *
 * @param path - Complete path that must equal or descend from `prefix`.
 *
 * @returns Whether `prefix` is an exact structural prefix of `path`.
 */
function isPropertyPathPrefix(prefix, path) {
    if (!isPropertyPath(prefix) || !isPropertyPath(path)) {
        return false;
    }
    return isNormalizedPropertyPathPrefix(normalizePropertyPath(prefix), normalizePropertyPath(path));
}
/**
 * Converts a property path to an equivalent dotted string path when that conversion is lossless.
 *
 * Exact property-key arrays containing numbers, symbols, or string segments with literal periods cannot be represented
 * by dotted-string syntax without changing their property-path semantics and are rejected. Empty segments are retained,
 * so `['level1', '', 'value']` becomes `'level1..value'`. The exact single empty-string key `['']` is rejected because
 * an empty dotted string is not a valid {@link PropertyPath}.
 *
 * @category Property Keys and Paths
 *
 * @param path - Property path to convert.
 *
 * @returns An equivalent dotted string property path.
 *
 * @throws {TypeError} If `path` is invalid or cannot be represented losslessly as a dotted string property path.
 */
function joinPropertyPath(path) {
    const normPath = normalizePropertyPath(path);
    for (const key of normPath) {
        if (typeof key !== 'string' || key.includes('.')) {
            throw new TypeError(`joinPropertyPath error: 'path' cannot be represented as a dotted string property path.`);
        }
    }
    const result = normPath.join('.');
    if (result.length === 0) {
        throw new TypeError(`joinPropertyPath error: 'path' cannot be represented as a dotted string property path.`);
    }
    return result;
}
/**
 * Converts a property path to its canonical readonly property-key array representation.
 *
 * Dotted strings are split on `.` while property-key arrays are returned unchanged. Exact array property-keys should be
 * used for symbols, numeric array indexes, empty-string keys, and property names containing literal periods.
 *
 * @category Property Keys and Paths
 *
 * @param path - Property path to normalize.
 *
 * @param [errorMessage] - Optional custom error message.
 *
 * @returns The path as a readonly property-key array.
 *
 * @throws {TypeError} If `path` is not a valid {@link PropertyPath}.
 */
function normalizePropertyPath(path, errorMessage = `normalizePropertyPath error: 'path' is not a valid property path.`) {
    if (!isPropertyPath(path)) {
        throw new TypeError(errorMessage);
    }
    return typeof path === 'string' ? path.split('.') : path;
}
/**
 * Safely returns keys on an object or an empty array if not an object.
 *
 * @category General Object Utilities
 *
 * @param object - An object.
 *
 * @returns Object keys or empty array.
 */
function objectKeys(object) {
    return typeof object === 'object' && object !== null ? Object.keys(object) : [];
}
/**
 * Safely returns an objects size. Note for String objects Unicode is not taken into consideration.
 *
 * @category General Object Utilities
 *
 * @param object - Any value, but size returned for object / Map / Set / arrays / strings.
 *
 * @returns Size of object.
 */
function objectSize(object) {
    if (object === void 0 || object === null || typeof object !== 'object') {
        return 0;
    }
    const tag = Object.prototype.toString.call(object);
    if (tag === '[object Map]' || tag === '[object Set]') {
        return object.size;
    }
    if (tag === '[object String]') {
        return object.length;
    }
    return Object.keys(object).length;
}
/**
 * Returns an iterator of property-key path arrays useful with {@link safeAccess} and {@link safeSet} by traversing
 * the given object. Enumerable string and symbol keys are included, and numeric array indexes may be enabled.
 *
 * Traversal may be bounded by absolute property paths relative to `data`. `prefixPath` selects one branch and keeps
 * all yielded paths absolute. `stopPath` yields the selected path itself and prunes every descendant beneath it.
 * `maxDepth` limits traversal relative to `prefixPath`, or relative to the root when no prefix is supplied. Properties
 * reached at the maximum depth are yielded as terminal paths and are not traversed further.
 *
 * `maxResults` limits the number of yielded paths. `maxVisits` limits the number of enumerable properties and array
 * indexes inspected; exceeding this budget throws before another property value is read. These limits reduce exposure
 * to unexpectedly broad objects, sparse arrays with extreme lengths, getters, and proxy traps. Exceptions raised by
 * getters or proxy operations are intentionally propagated.
 *
 * When both path bounds are supplied, `stopPath` must equal or descend from `prefixPath`. If `maxDepth` is also
 * supplied, traversal stops at whichever boundary is reached first.
 *
 * Note: Keys are only generated for ordinary objects and arrays; {@link Map} and {@link Set} are not indexed. Array
 * elements are treated as terminal paths even when their values are objects.
 *
 * @category Object Traversal and Comparison
 *
 * @param data - An object to traverse for property path keys.
 *
 * @param [options] - Traversal options.
 *
 * @param [options.arrayIndex] - Set to `true` to include numeric array indexes. Enumerable symbol properties on arrays
 *        remain included; default: `false`.
 *
 * @param [options.hasOwnOnly] - Set to `false` to include enumerable prototype properties; default: `true`.
 *
 * @param [options.maxDepth] - Maximum number of property-key segments traversed beneath `prefixPath`, or beneath the
 *        root when no prefix is supplied. A value of `0` yields only the prefix itself when selected; default:
 *        unlimited.
 *
 * @param [options.maxResults] - Maximum number of paths yielded; default: `16384`.
 *
 * @param [options.maxVisits] - Maximum number of enumerable properties or array indexes inspected; default: `65536`.
 *
 * @param [options.prefixPath] - Absolute property path selecting the branch where traversal begins. Returned paths
 *        remain absolute. A missing or non-enumerable prefix produces an empty iterator.
 *
 * @param [options.stopPath] - Absolute property path to yield as a terminal path while pruning all descendants beneath
 *        it. When `prefixPath` is supplied, this path must equal or descend from it.
 *
 * @returns An iterator of absolute readonly property-key paths.
 *
 * @throws {TypeError} If `data`, a boolean option, a numeric limit, or a property-path option is invalid.
 * @throws {RangeError} If `options.stopPath` is outside `options.prefixPath` or `options.maxVisits` is exceeded.
 */
function* pathKeyIterator(data, options = {}) {
    if (!isNonNullObject(data)) {
        throw new TypeError(`pathKeyIterator error: 'data' is not an object.`);
    }
    assertPropertyPathOptionsObject(options, 'pathKeyIterator');
    const { arrayIndex = false, hasOwnOnly = true, maxDepth, maxResults, maxVisits, prefixPath, stopPath } = options;
    if (typeof arrayIndex !== 'boolean') {
        throw new TypeError(`pathKeyIterator error: 'options.arrayIndex' is not a boolean.`);
    }
    if (typeof hasOwnOnly !== 'boolean') {
        throw new TypeError(`pathKeyIterator error: 'options.hasOwnOnly' is not a boolean.`);
    }
    const bounds = normalizePropertyPathTraversalBounds({
        prefixPath,
        stopPath,
        maxDepth,
        maxResults,
        maxVisits
    }, {
        errorPrefix: 'pathKeyIterator',
        prefixOption: 'prefixPath',
        stopOption: 'stopPath'
    });
    const budget = createPropertyPathTraversalBudget(bounds, 'pathKeyIterator');
    if (budget.maxResults === 0 || (bounds.prefixPath === void 0 && bounds.maxPathLength === 0)) {
        return;
    }
    // Ancestors are tracked per active path, not globally. Shared objects may therefore appear at multiple valid
    // paths while a true reference back to an ancestor still throws.
    const rootAncestors = new Set([data]);
    const stack = [{ obj: data, path: [], ancestors: rootAncestors }];
    while (stack.length > 0) {
        if (budget.results >= budget.maxResults) {
            return;
        }
        const { obj, path, ancestors } = stack.pop();
        if (Array.isArray(obj)) {
            yield* iterateArrayPaths(obj, path, arrayIndex, hasOwnOnly, stack, ancestors, bounds, budget);
            continue;
        }
        for (const key of getEnumerablePropertyKeys(obj, hasOwnOnly)) {
            if (budget.results >= budget.maxResults) {
                return;
            }
            consumePropertyPathTraversalVisit(budget);
            const fullPath = path.concat(key);
            const isWithinPrefix = bounds.prefixPath === void 0 ||
                isNormalizedPropertyPathPrefix(bounds.prefixPath, fullPath);
            const leadsToPrefix = !isWithinPrefix && bounds.prefixPath !== void 0 &&
                isNormalizedPropertyPathPrefix(fullPath, bounds.prefixPath);
            if (!isWithinPrefix && !leadsToPrefix) {
                continue;
            }
            const value = obj[key];
            // stopPath and maxDepth both convert the current property to a terminal path. This check occurs before cycle
            // tracking or child scheduling so bounded traversal never inspects descendants beyond the active boundary.
            if ((bounds.stopPath !== void 0 && isNormalizedPropertyPathEqual(fullPath, bounds.stopPath)) ||
                fullPath.length === bounds.maxPathLength) {
                if (typeof value !== 'function') {
                    consumePropertyPathTraversalResult(budget);
                    yield fullPath;
                }
                continue;
            }
            if (Array.isArray(value)) {
                // Array index paths are emitted inline to preserve established ordering instead of deferring the array to
                // the primary LIFO object stack.
                yield* iterateArrayPaths(value, fullPath, arrayIndex, hasOwnOnly, stack, extendPropertyAncestors(ancestors, value), bounds, budget);
            }
            else if (typeof value === 'object' && value !== null) {
                stack.push({ obj: value, path: fullPath, ancestors: extendPropertyAncestors(ancestors, value) });
            }
            else if (isWithinPrefix && typeof value !== 'function') {
                consumePropertyPathTraversalResult(budget);
                yield fullPath;
            }
        }
    }
}
/**
 * Returns a validating iterator for either one {@link PropertyPath} or an iterable of property paths.
 *
 * A value satisfying {@link isPropertyPath} is always interpreted as one path before iterable detection occurs. This
 * precedence is necessary because dotted strings and exact property-key arrays are themselves iterable.
 *
 * Consequently, an array containing only property keys represents one exact path:
 *
 * @example
 * ```ts
 * [...propertyPathIterator(['actor', 'name'])];
 * // [
 * //    ['actor', 'name']
 * // ]
 * ```
 *
 * To supply multiple dotted-string paths, use an iterable that is not itself a valid property path, such as a `Set`:
 *
 * @example
 * ```ts
 * [...propertyPathIterator(new Set([
 *    'actor.name',
 *    'actor.id'
 * ]))];
 * // ['actor.name', 'actor.id']
 * ```
 *
 * An outer array of exact array paths is also unambiguous because its entries are arrays rather than property keys:
 *
 * @example
 * ```ts
 * [...propertyPathIterator([
 *    ['actor', 'name'],
 *    ['actor', 'id']
 * ])];
 * // [
 * //    ['actor', 'name'],
 * //    ['actor', 'id']
 * // ]
 * ```
 *
 * Iterable entries are validated lazily as iteration advances. An invalid entry throws when that entry is reached;
 * valid preceding entries may already have been yielded. An empty iterable produces an empty iterator.
 *
 * Paths are yielded unchanged. Exact array paths are not normalized, copied, or frozen.
 *
 * @category Property Keys and Paths
 *
 * @param paths - A single property path or an iterable containing property paths.
 *
 * @returns A validating iterator that yields each property path in source order.
 *
 * @throws {TypeError} During iteration if `paths` is neither a property path nor an iterable.
 * @throws {TypeError} During iteration if an iterable entry is not a valid property path.
 */
function* propertyPathIterator(paths) {
    if (isPropertyPath(paths)) {
        yield paths;
        return;
    }
    if (!isIterable(paths)) {
        throw new TypeError(`propertyPathIterator error: 'paths' is not a property path or iterable of property paths.`);
    }
    let index = 0;
    for (const path of paths) {
        if (!isPropertyPath(path)) {
            throw new TypeError(`propertyPathIterator error: iterable entry at index ${index} is not a property path.`);
        }
        yield path;
        index++;
    }
}
/**
 * Provides a way to safely access an object's data / entries using either a dotted property path string or an array of
 * exact property keys.
 *
 * Array indexes may only be accessed by number through the array property-key form.
 *
 * @category Property Access and Inspection
 *
 * @param data - An object to access entry data.
 *
 * @param path - A dotted string property path or an array of exact string, number, or symbol property keys.
 *
 * @param [defaultValue] - (Optional) A default value to return if an entry for property path is not found.
 *
 * @returns The value referenced by the path.
 *
 * @typeParam T - Type of data.
 * @typeParam P - Property path type.
 * @typeParam R - Return value / Inferred deep access type or any provided default value type.
 */
function safeAccess(data, path, defaultValue) {
    const result = getProperty(data, path);
    // Preserve legacy safeAccess behavior: present nullish values collapse to the supplied default.
    return result === void 0 || result === null ? defaultValue : result;
}
/**
 * Compares a source object and values of entries against a target object. If the entries in the source object match
 * the target object then `true` is returned otherwise `false`. If either object is undefined or null then false
 * is returned.
 *
 * Note: The source and target should be ordinary objects or arrays; {@link Map} and {@link Set} entries are not
 * compared. Present properties whose values are `undefined` or `null` remain distinct from missing properties.
 * Comparison disables the normal {@link pathKeyIterator} result cap so a successful result is never based on a
 * silently truncated path set. The visit budget remains enforced to bound unexpectedly broad source objects.
 *
 * @category Object Traversal and Comparison
 *
 * @param source - Source object.
 *
 * @param target - Target object.
 *
 * @param [options] - Options.
 *
 * @param [options.arrayIndex] - Set to `true` to include equality testing for numeric array indexes; default: `false`.
 *
 * @param [options.hasOwnOnly] - Set to `false` to include enumerable prototype properties; default: `true`.
 *
 * @param [options.maxVisits] - Maximum number of enumerable source properties or array indexes inspected;
 *        default: `65536`.
 *
 * @returns True if equal.
 *
 * @throws {TypeError} If an option is invalid.
 * @throws {RangeError} If `options.maxVisits` is exceeded.
 */
function safeEqual(source, target, options) {
    if (typeof source !== 'object' || source === null || typeof target !== 'object' || target === null) {
        return false;
    }
    for (const path of pathKeyIterator(source, { ...options, maxResults: Number.MAX_SAFE_INTEGER })) {
        const sourceResolution = resolvePropertyPath(source, path);
        const targetResolution = resolvePropertyPath(target, path);
        if (sourceResolution === void 0 || targetResolution === void 0 ||
            sourceResolution.value !== targetResolution.value) {
            return false;
        }
    }
    return true;
}
/**
 * Provides a way to safely set an object's data / entries using either a dotted path string or an array of exact
 * property keys. Array indexes may only be accessed by number through the array property-key form.
 *
 * @category Property Mutation
 *
 * @param data - An object to access entry data.
 *
 * @param path - A dotted string path or an array of exact string, number, or symbol property keys.
 *
 * The string keys `__proto__`, `prototype`, and `constructor` are rejected to prevent prototype-pollution access
 * paths. ECMAScript well-known symbols, such as `Symbol.toStringTag`, `Symbol.iterator`, and `Symbol.toPrimitive`,
 * are also rejected because they modify built-in language protocols and object behavior. User-created symbols and
 * symbols from {@link Symbol.for} remain valid.
 *
 * @param value - A new value to set if an entry for path is found.
 *
 * @param [options] - Options.
 *
 * @param [options.operation] - Operation to perform including: `add`, `div`, `mult`, `set`, `set-undefined`, `sub`;
 *        default: `set`.
 *
 * @param [options.createMissing] - If `true` missing path entries will be created as objects automatically;
 *        default: `false`.
 *
 * @returns True if successful.
 */
function safeSet(data, path, value, { operation = 'set', createMissing = false } = {}) {
    if (typeof data !== 'object' || data === null) {
        throw new TypeError(`safeSet error: 'data' is not an object.`);
    }
    if (typeof path !== 'string' && !Array.isArray(path)) {
        throw new TypeError(`safeSet error: 'path' is not a string or an array of property keys.`);
    }
    if (typeof operation !== 'string') {
        throw new TypeError(`safeSet error: 'options.operation' is not a string.`);
    }
    if (operation !== 'add' && operation !== 'div' && operation !== 'mult' && operation !== 'set' &&
        operation !== 'set-undefined' && operation !== 'sub') {
        throw new Error(`safeSet error: Unknown 'options.operation'.`);
    }
    if (typeof createMissing !== 'boolean') {
        throw new TypeError(`safeSet error: 'options.createMissing' is not a boolean.`);
    }
    if ((typeof path === 'string' && path.length === 0) || (Array.isArray(path) && path.length === 0)) {
        return false;
    }
    const access = typeof path === 'string' ? path.split('.') : path;
    let result = false;
    let target = data;
    for (let i = 0; i < access.length; i++) {
        const key = access[i];
        const keyType = typeof key;
        if (!isPropertyKey(key)) {
            throw new TypeError(`safeSet error: 'path' contains an entry that is not a property key.`);
        }
        // Block prototype-pollution strings and built-in protocol symbols before reading or creating any path segment.
        if ((keyType === 'string' && isBlockedPrototypeKey(key)) ||
            (keyType === 'symbol' && wellKnownSymbols.has(key))) {
            return false;
        }
        if (Array.isArray(target) && keyType !== 'symbol' && !isArrayIndex(key)) {
            return false;
        }
        if (i === 0 && access.length === 1 && !createMissing && !(key in target)) {
            return false;
        }
        if (i === access.length - 1) {
            switch (operation) {
                case 'add':
                    target[key] += value;
                    result = true;
                    break;
                case 'div':
                    target[key] /= value;
                    result = true;
                    break;
                case 'mult':
                    target[key] *= value;
                    result = true;
                    break;
                case 'set':
                    target[key] = value;
                    result = true;
                    break;
                case 'set-undefined':
                    if (target[key] === void 0) {
                        target[key] = value;
                    }
                    result = true;
                    break;
                case 'sub':
                    target[key] -= value;
                    result = true;
                    break;
            }
        }
        else {
            let next = target[key];
            if (createMissing && next === void 0) {
                // Missing segments are intentionally created as ordinary objects; array intent cannot be inferred safely
                // from an arbitrary following property key.
                next = {};
                target[key] = next;
            }
            if (!isObjectOrFunction(next)) {
                return false;
            }
            target = next;
        }
    }
    return result;
}
// Utility Data ------------------------------------------------------------------------------------------------------
/**
 * ECMAScript well-known symbols that activate or modify built-in language protocols.
 *
 * Discovered once at module initialization so {@link safeSet} membership checks remain constant-time.
 *
 * Used by:
 * - {@link safeSet}.
 */
const wellKnownSymbols = new Set(Object.getOwnPropertyNames(Symbol)
    .map((key) => Symbol[key])
    .filter((value) => typeof value === 'symbol'));
// Utility Function --------------------------------------------------------------------------------------------------
/**
 * Verifies that all recursively mergeable plain-object paths in a source object are acyclic.
 *
 * A path-local ancestor set is used instead of a global visited set. This permits the same object to be referenced
 * from multiple independent branches while still rejecting a reference back to an ancestor on the active path.
 * Blocked prototype keys are skipped because {@link deepMerge} will not traverse or assign them.
 *
 * Called by:
 * - {@link deepMerge} before any source mutation begins.
 *
 * @param source - A validated top-level merge source.
 *
 * @throws {TypeError} When a circular plain-object path is detected.
 */
function assertNoCircularPlainObject(source) {
    const stack = [{
            value: source,
            ancestors: new Set([source])
        }];
    while (stack.length > 0) {
        const { value, ancestors } = stack.pop();
        for (const key of getEnumerablePropertyKeys(value, true)) {
            if (isBlockedPrototypeKey(key)) {
                continue;
            }
            const child = value[key];
            if (!isPlainObject(child)) {
                continue;
            }
            if (ancestors.has(child)) {
                throw new TypeError(`deepMerge error: Circular source object detected.`);
            }
            const childAncestors = new Set(ancestors);
            childAncestors.add(child);
            stack.push({ value: child, ancestors: childAncestors });
        }
    }
}
/**
 * Creates a shallow copy of a plain object using only safe enumerable own string and symbol properties.
 *
 * The source prototype category is retained (`null` or `Object.prototype`), but custom prototypes are never copied.
 * Blocked prototype keys are filtered during copying so an existing target branch cannot reintroduce unsafe keys.
 *
 * Called by:
 * - {@link deepMerge} in the multi-source branch before applying a later source to an existing plain-object branch.
 *
 * @param source - A validated plain object to copy.
 *
 * @returns A safe shallow copy preserving the source plain-object prototype category.
 */
function clonePlainEnumerable(source) {
    const clone = Object.create(Object.getPrototypeOf(source) === null ? null :
        Object.prototype);
    for (const key of getEnumerablePropertyKeys(source, true)) {
        if (!isBlockedPrototypeKey(key)) {
            clone[key] = source[key];
        }
    }
    return clone;
}
/**
 * Extends the active traversal ancestry for one child object and rejects a cycle back to an existing ancestor.
 *
 * A new set is allocated for each descending object path. This is intentionally more expensive than a global
 * `WeakSet`, but it correctly permits shared references that occur on separate non-circular paths.
 *
 * Called by:
 * - {@link pathKeyIterator} when descending through ordinary object and array properties.
 * - {@link iterateArrayPaths} when descending through symbol properties attached to arrays.
 *
 * @param ancestors - Objects already present on the active traversal path.
 * @param child - The object about to be traversed.
 *
 * @returns A new ancestor set containing `child`.
 *
 * @throws {TypeError} When `child` already occurs on the active path.
 */
function extendPropertyAncestors(ancestors, child) {
    if (ancestors.has(child)) {
        throw new TypeError(`pathKeyIterator error: Circular object path detected.`);
    }
    const result = new Set(ancestors);
    result.add(child);
    return result;
}
/**
 * Locates the nearest own property descriptor and its owner in a prototype chain.
 *
 * Called by {@link resolvePropertyPath} when inherited-property lookup is enabled. Returning both values from one
 * prototype walk avoids a second descriptor lookup and keeps proxy descriptor traps to one call per inspected owner.
 *
 * @param value - Candidate object or function.
 * @param key - Property key to locate.
 *
 * @returns The nearest property descriptor / owner pair, or `undefined` when the property does not exist.
 */
function findPropertyDescriptorOwner(value, key) {
    for (let current = value; current !== null; current = Object.getPrototypeOf(current)) {
        const descriptor = Object.getOwnPropertyDescriptor(current, key);
        if (descriptor !== void 0) {
            return { descriptor, owner: current };
        }
    }
    return void 0;
}
/**
 * Returns enumerable string and symbol property keys with JavaScript-compatible prototype shadowing.
 *
 * When inherited keys are requested, the nearest occurrence of each key wins even when that nearest property is
 * non-enumerable. Recording a key before testing enumerability prevents an enumerable ancestor property from leaking
 * through a non-enumerable shadowing property.
 *
 * Called by:
 * - {@link deepFreeze} and {@link deepSeal} for symbol-aware object-graph traversal.
 * - {@link deepMerge} for safe own-property merging.
 * - {@link pathKeyIterator} and {@link iterateArrayPaths} for path enumeration.
 * - {@link assertNoCircularPlainObject} for merge-cycle validation.
 * - {@link clonePlainEnumerable} for safe target-branch copying.
 *
 * @param object - Object whose enumerable property keys are requested.
 * @param hasOwnOnly - Whether to exclude properties inherited through the prototype chain.
 *
 * @returns Enumerable string and symbol keys in traversal order.
 */
function getEnumerablePropertyKeys(object, hasOwnOnly) {
    if (hasOwnOnly) {
        // Hot path: avoid a prototype walk and Reflect.ownKeys when callers only need own enumerable properties.
        const keys = Object.keys(object);
        for (const symbol of Object.getOwnPropertySymbols(object)) {
            if (Object.prototype.propertyIsEnumerable.call(object, symbol)) {
                keys.push(symbol);
            }
        }
        return keys;
    }
    // The inherited path is intentionally more expensive to reproduce JavaScript shadowing across string and symbol
    // keys, including non-enumerable properties that suppress an enumerable ancestor property.
    const keys = [];
    const seen = new Set();
    for (let current = object; current !== null; current = Object.getPrototypeOf(current)) {
        for (const key of Reflect.ownKeys(current)) {
            if (seen.has(key)) {
                continue;
            }
            seen.add(key);
            if (Object.prototype.propertyIsEnumerable.call(current, key)) {
                keys.push(key);
            }
        }
    }
    return keys;
}
/**
 * Returns whether a property key is blocked from generic merge or mutation operations.
 *
 * Only string keys are blocked. Symbols are handled separately by {@link safeSet}, which rejects ECMAScript
 * well-known symbols but permits user-created symbols.
 *
 * Called by:
 * - {@link deepMerge} while enumerating every merge level.
 * - {@link safeSet} while validating mutation paths.
 * - {@link assertNoCircularPlainObject} while validating merge sources.
 * - {@link clonePlainEnumerable} while copying existing target branches.
 *
 * @param key - Property key to inspect.
 *
 * @returns Whether the key is `__proto__`, `prototype`, or `constructor`.
 */
function isBlockedPrototypeKey(key) {
    return typeof key === 'string' && (key === '__proto__' || key === 'prototype' || key === 'constructor');
}
/**
 * Yields property-key paths for array indexes and enumerable symbol properties attached to arrays.
 *
 * Numeric indexes are yielded immediately to preserve the established iterator ordering and are intentionally treated
 * as leaves, even when an indexed value is an object. Symbol properties receive normal recursive traversal. A private
 * array stack avoids recursive generator calls for nested arrays reached through symbols. Shared traversal bounds and
 * budgets preserve the same defensive semantics as {@link pathKeyIterator}.
 *
 * Called by:
 * - {@link pathKeyIterator} for root arrays and arrays encountered as object-property values.
 *
 * @param array - Array to enumerate.
 * @param path - Accessor path leading to `array`.
 * @param arrayIndex - Whether numeric array indexes should be yielded.
 * @param hasOwnOnly - Whether inherited enumerable symbol properties should be excluded.
 * @param objectStack - Primary object traversal stack owned by {@link pathKeyIterator}.
 * @param ancestors - Active path ancestors used for circular-reference detection.
 * @param bounds - Shared normalized traversal bounds.
 * @param budget - Shared traversal result and visit accounting.
 *
 * @returns An iterator of readonly property-key paths.
 */
function* iterateArrayPaths(array, path, arrayIndex, hasOwnOnly, objectStack, ancestors, bounds, budget) {
    // A dedicated iterative stack avoids recursive generator delegation for symbol-linked nested arrays.
    const stack = [{ array, path, ancestors, symbolIndex: 0, indexesYielded: false }];
    while (stack.length > 0) {
        if (budget.results >= budget.maxResults) {
            return;
        }
        const frame = stack[stack.length - 1];
        if (!frame.indexesYielded) {
            frame.indexesYielded = true;
            if (arrayIndex) {
                // Array elements are leaf comparisons by design; object-valued entries are not recursively expanded.
                for (let index = 0; index < frame.array.length; index++) {
                    if (budget.results >= budget.maxResults) {
                        return;
                    }
                    consumePropertyPathTraversalVisit(budget);
                    const fullPath = frame.path.concat(index);
                    // Numeric array indexes are terminal by design, so a prefix below an indexed value cannot be traversed.
                    if (fullPath.length <= bounds.maxPathLength && (bounds.prefixPath === void 0 ||
                        isNormalizedPropertyPathPrefix(bounds.prefixPath, fullPath))) {
                        consumePropertyPathTraversalResult(budget);
                        yield fullPath;
                    }
                }
            }
        }
        if (frame.symbols === void 0) {
            frame.symbols = getEnumerablePropertyKeys(frame.array, hasOwnOnly)
                .filter((key) => typeof key === 'symbol');
        }
        if (frame.symbolIndex >= frame.symbols.length) {
            stack.pop();
            continue;
        }
        consumePropertyPathTraversalVisit(budget);
        const key = frame.symbols[frame.symbolIndex++];
        const fullPath = frame.path.concat(key);
        const isWithinPrefix = bounds.prefixPath === void 0 ||
            isNormalizedPropertyPathPrefix(bounds.prefixPath, fullPath);
        const leadsToPrefix = !isWithinPrefix && bounds.prefixPath !== void 0 &&
            isNormalizedPropertyPathPrefix(fullPath, bounds.prefixPath);
        if (!isWithinPrefix && !leadsToPrefix) {
            continue;
        }
        // Array frames are scheduled only below the active depth boundary, so every direct symbol child is guaranteed
        // to be at or within the absolute maximum path length.
        const value = frame.array[key];
        if ((bounds.stopPath !== void 0 && isNormalizedPropertyPathEqual(fullPath, bounds.stopPath)) ||
            fullPath.length === bounds.maxPathLength) {
            if (typeof value !== 'function') {
                consumePropertyPathTraversalResult(budget);
                yield fullPath;
            }
            continue;
        }
        if (Array.isArray(value)) {
            stack.push({
                array: value,
                path: fullPath,
                ancestors: extendPropertyAncestors(frame.ancestors, value),
                symbolIndex: 0,
                indexesYielded: false
            });
        }
        else if (typeof value === 'object' && value !== null) {
            objectStack.push({
                obj: value,
                path: fullPath,
                ancestors: extendPropertyAncestors(frame.ancestors, value)
            });
        }
        else if (isWithinPrefix && typeof value !== 'function') {
            consumePropertyPathTraversalResult(budget);
            yield fullPath;
        }
    }
}
/**
 * Resolves an exact property-key path and returns terminal ownership metadata.
 *
 * The resolver centralizes array-index rules, own-only behavior, inherited property ownership, descriptor lookup, and
 * single-read traversal for all path-based property utilities. Intermediate properties are read exactly once.
 * The terminal property is read only when `readValue` is enabled, allowing existence, descriptor, owner, and deletion
 * operations to avoid invoking a final getter.
 *
 * @param data - Root object to traverse.
 * @param path - Valid normalized property-key path.
 * @param options - Resolution options.
 * @param options.hasOwnOnly - Whether each segment must be an own property.
 * @param options.readValue - Whether to read and return the terminal property value.
 *
 * @returns Complete terminal resolution metadata, or `undefined` when the path cannot be resolved.
 */
function resolvePropertyPath(data, path, { hasOwnOnly = false, readValue = true } = {}) {
    let candidate = data;
    for (let index = 0; index < path.length; index++) {
        const key = path[index];
        /* v8 ignore start -- callers normalize / validate PropertyPath before resolution. */
        if (!isPropertyKey(key)) {
            return void 0;
        }
        /* v8 ignore stop */
        if (Array.isArray(candidate) && typeof key !== 'symbol' && !isArrayIndex(key)) {
            return void 0;
        }
        let descriptorOwner;
        if (hasOwnOnly) {
            const descriptor = Object.getOwnPropertyDescriptor(candidate, key);
            if (descriptor !== void 0) {
                descriptorOwner = { descriptor, owner: candidate };
            }
        }
        else {
            descriptorOwner = findPropertyDescriptorOwner(candidate, key);
        }
        if (descriptorOwner === void 0) {
            return void 0;
        }
        const { descriptor, owner } = descriptorOwner;
        const isFinal = index === path.length - 1;
        if (isFinal) {
            return {
                descriptor,
                key,
                owner,
                value: readValue ? candidate[key] : void 0
            };
        }
        const next = candidate[key];
        if (!isObjectOrFunction(next)) {
            return void 0;
        }
        candidate = next;
        /* v8 ignore start - PropertyPath paths are always non-empty */
    }
    return void 0;
}

/**
 * Stores values by structural {@link PropertyPath} paths using a property-key trie.
 *
 * `PropertyPathMap` combines exact structural path storage with trie-aware object matching and bounded subtree
 * traversal. In addition to normal map-style lookup, stored paths can be evaluated collectively against a candidate
 * object, allowing the map to operate as a reusable index of properties, bindings, field definitions, validators, or
 * other metadata associated with an object structure.
 *
 * Unlike `Map<readonly PropertyKey[], V>`, lookup does not depend on property-key array identity. Equivalent paths
 * resolve to the same entry even when a new property-key array is supplied:
 *
 * @example
 * ```ts
 * const map = new PropertyPathMap<number>();
 *
 * map.set(['actors', 0, 'id'], 42);
 * map.get(['actors', 0, 'id']); // 42
 * ```
 *
 * Dotted strings and equivalent string-key arrays share the same trie path:
 *
 * @example
 * ```ts
 * map.set('settings.theme', 'dark');
 * map.get(['settings', 'theme']); // 'dark'
 * ```
 *
 * Exact array property-key paths remain necessary for symbols, numeric keys, empty-string keys, and string keys
 * containing literal periods.
 *
 * ## Iterator families
 *
 * The collection provides three complementary iterator families:
 *
 * - `entries`, `keys`, and `values` iterate all stored entries in normal map insertion order.
 * - `matchingEntries`, `matchingKeys`, and `matchingValues` evaluate stored paths against a candidate object.
 * - `subtreeEntries`, `subtreeKeys`, and `subtreeValues` traverse a selected trie branch without inspecting an object.
 *
 * Every iterator supports bounded operation through depth, result, and visit limits. Matching and subtree iterators
 * additionally support absolute `pathPrefix` and `stopAt` bounds.
 *
 * ## Candidate-object matching
 *
 * The matching iterators treat the stored trie as a reusable structural query over a candidate object:
 *
 * @example
 * ```ts
 * const fields = new PropertyPathMap<string>();
 *
 * fields.set('system.attributes.hp.value', 'hit-points');
 * fields.set('system.attributes.hp.max', 'maximum-hit-points');
 * fields.set('system.attributes.ac.value', 'armor-class');
 *
 * const actor = {
 *    system: {
 *       attributes: {
 *          hp: {
 *             value: 12
 *          }
 *       }
 *    }
 * };
 *
 * [...fields.matchingEntries(actor)];
 * // [
 * //    [['system', 'attributes', 'hp', 'value'], 'hit-points']
 * // ]
 * ```
 *
 * Matching traverses the property-key trie and candidate object together. Shared path prefixes are inspected only
 * once for each matching operation. When a candidate prefix is missing or cannot be traversed, the complete stored
 * subtree beneath that prefix is rejected without resolving each descendant path independently. This makes matching
 * particularly useful when the map contains many paths with common prefixes.
 *
 * `matchingKeys` yields only the available stored paths, while `matchingValues` yields only their mapped values.
 * `matchingEntries` yields both:
 *
 * ```ts
 * for (const path of fields.matchingKeys(actor))
 * {
 *    // path: readonly PropertyKey[]
 * }
 *
 * for (const field of fields.matchingValues(actor))
 * {
 *    // field: string
 * }
 *
 * for (const [path, field] of fields.matchingEntries(actor))
 * {
 *    // path: readonly PropertyKey[]
 *    // field: string
 * }
 * ```
 *
 * By default, matching determines terminal property availability without reading the terminal value. This avoids
 * invoking a terminal getter or proxy `get` trap merely to establish that a path exists.
 *
 * Set `includePropertyValue` to include the resolved candidate value in the iterator result:
 *
 * @example
 * ```ts
 * for (const [path, field, propertyValue] of fields.matchingEntries(actor, {
 *    includePropertyValue: true
 * }))
 * {
 *    // path: readonly PropertyKey[]
 *    // field: string
 *    // propertyValue: unknown
 * }
 *
 * for (const [field, propertyValue] of fields.matchingValues(actor, {
 *    includePropertyValue: true
 * }))
 * {
 *    // field: string
 *    // propertyValue: unknown
 * }
 * ```
 *
 * The overloads for `matchingEntries` and `matchingValues` reflect a literal `includePropertyValue: true` option in
 * the returned iterator type.
 *
 * Matching follows normal JavaScript property lookup by default. Set `hasOwnOnly` to require every matched segment to
 * be an own property of the candidate value reached at that depth.
 *
 * ## Prefix and stop bounds
 *
 * `pathPrefix` begins matching or subtree traversal directly at one absolute stored trie path. Unrelated branches are
 * never visited:
 *
 * @example
 * ```ts
 * fields.matchingEntries(actor, {
 *    pathPrefix: 'system.attributes.hp'
 * });
 * ```
 *
 * Returned paths remain absolute. The prefix itself is included when it stores a mapped value and satisfies the
 * iterator operation.
 *
 * `stopAt` includes a selected path when it stores a value, but prunes every stored descendant beneath it:
 *
 * @example
 * ```ts
 * fields.matchingEntries(actor, {
 *    pathPrefix: 'system.attributes',
 *    stopAt: 'system.attributes.hp'
 * });
 * ```
 *
 * When both options are supplied, `stopAt` must equal or descend from `pathPrefix`.
 *
 * `maxDepth` is measured relative to `pathPrefix`, or relative to the trie root when no prefix is supplied.
 *
 * ## Candidate-independent subtree traversal
 *
 * Subtree iterators traverse stored entries without accessing a candidate object:
 *
 * @example
 * ```ts
 * for (const [path, field] of fields.subtreeEntries({
 *    pathPrefix: 'system.attributes.hp'
 * }))
 * {
 *    // Every yielded entry belongs to the stored HP subtree.
 * }
 * ```
 *
 * These iterators are useful for inspecting, processing, or removing logical groups of stored paths without scanning
 * unrelated branches. They share the same `pathPrefix`, `stopAt`, `maxDepth`, `maxResults`, and `maxVisits` controls
 * as matching traversal.
 *
 * Matching and subtree iterators use deterministic depth-first trie order rather than global insertion order.
 *
 * ## Key semantics
 *
 * Each path segment is stored in a native `Map<PropertyKey, ...>`:
 *
 * - Strings compare by value.
 * - Numbers compare with `Map` / SameValueZero semantics.
 * - Symbols compare by identity.
 * - Numeric and string segments remain distinct (`0` is not `'0'`).
 *
 * Stored canonical paths are copied and frozen once when first inserted. Overwriting an existing entry retains its
 * original insertion position and canonical path. Deleting and reinserting a path moves it to the end, matching normal
 * `Map` insertion-order behavior.
 *
 * ## Defensive limits
 *
 * Every instance applies configurable limits to stored path depth, terminal entries, allocated trie nodes, yielded
 * traversal results, and traversal visits. Storage limits are preflighted before mutation, so failed insertion cannot
 * leave a partial trie branch. Per-call `maxDepth`, `maxResults`, and `maxVisits` options may reduce, but never exceed,
 * the constructor traversal caps.
 *
 * Reaching `maxResults` ends an iterator normally after the configured number of results. Exceeding `maxVisits` throws
 * before another candidate property or trie node is processed during the iterative walk. Path normalization and fixed-
 * depth trie scope lookup are bounded separately by `maxPathDepth`. These limits do not measure the retained size of
 * mapped values or individual property keys.
 *
 * Candidate-object matching may invoke getters and proxy traps when descendant traversal or an explicitly requested
 * terminal property value requires a read. Exceptions from those operations are intentionally propagated.
 *
 * ## Complexity
 *
 * `get`, `has`, and `set` are `O(path length)`. `delete` is also `O(path length)` and prunes unused trie nodes.
 * Normal map iteration is `O(entry count)` and follows insertion order through a linked list of terminal entries.
 *
 * Trie-aware matching visits only reachable stored prefixes. An unavailable candidate prefix rejects every stored
 * descendant beneath it with one candidate-property check. Matching entry and value iterators may optionally include
 * the resolved candidate property value without performing a second path lookup.
 *
 * `pathPrefix` begins traversal directly at a selected stored trie node, while `stopAt` prunes one descendant branch
 * by node identity. Candidate-independent subtree iterators visit only terminal entries beneath the selected node.
 *
 * Mutation of the map while an iterator is active is intentionally unspecified.
 *
 * @category Property Path Collections
 *
 * @typeParam V - Stored value type.
 */
class PropertyPathMap {
    /** Root trie node. Empty paths are invalid, so the root never stores an entry. */
    #root = {};
    /** First terminal entry in insertion order. */
    #firstEntry;
    /** Last terminal entry in insertion order. */
    #lastEntry;
    /** Number of exact paths currently storing values. */
    #size = 0;
    /** Number of allocated non-root trie nodes. */
    #nodeCount = 0;
    /** Maximum accepted path depth. */
    #maxPathDepth;
    /** Maximum number of stored terminal entries. */
    #maxEntries;
    /** Maximum number of allocated non-root trie nodes. */
    #maxNodes;
    /** Maximum results permitted by one traversal. */
    #maxTraversalResults;
    /** Maximum visits permitted by one traversal. */
    #maxTraversalVisits;
    /**
     * Creates a new property path map and optionally initializes it from {@link PropertyPath} / value pairs.
     *
     * Later duplicate paths overwrite earlier values without changing the original insertion position. Resource limits
     * are validated before initial entries are inserted and apply to every subsequent operation.
     *
     * @param entries - Optional initial {@link PropertyPath} / value entries.
     *
     * @param options - Defensive storage and traversal limits.
     *
     * @param options.maxEntries - Maximum number of exact stored paths; default: `16384`.
     *
     * @param options.maxNodes - Maximum number of allocated non-root trie nodes; default: `65536`.
     *
     * @param options.maxPathDepth - Maximum number of property-key segments in any stored path; default: `64`.
     *
     * @param options.maxTraversalResults - Maximum results produced by one iterator unless reduced per call; default:
     *        `16384`.
     *
     * @param options.maxTraversalVisits - Maximum properties or trie nodes inspected by one iterator unless reduced per
     *        call; default: `65536`.
     *
     * @throws {TypeError} If a constructor option is not a non-negative safe integer.
     * @throws {RangeError} If an initial entry exceeds a configured storage limit.
     */
    constructor(entries, options = {}) {
        const limits = normalizePropertyPathMapLimits(options);
        this.#maxPathDepth = limits.maxPathDepth;
        this.#maxEntries = limits.maxEntries;
        this.#maxNodes = limits.maxNodes;
        this.#maxTraversalResults = limits.maxTraversalResults;
        this.#maxTraversalVisits = limits.maxTraversalVisits;
        if (entries === void 0 || entries === null) {
            return;
        }
        for (const [path, value] of entries) {
            this.set(path, value);
        }
    }
    /**
     * Number of exact property paths currently stored.
     */
    get size() {
        return this.#size;
    }
    /**
     * Number of allocated non-root trie nodes.
     *
     * This value is maintained incrementally and may be used to monitor current trie resource consumption.
     */
    get nodeCount() {
        return this.#nodeCount;
    }
    /**
     * Provides the standard object tag used by `Object.prototype.toString`.
     */
    get [Symbol.toStringTag]() {
        return 'PropertyPathMap';
    }
    /**
     * Removes every stored entry and releases the complete trie.
     *
     * This operation is `O(1)` with respect to explicit traversal; the prior structure becomes available for garbage
     * collection once no active iterator or external references remain.
     */
    clear() {
        this.#root = {};
        this.#firstEntry = void 0;
        this.#lastEntry = void 0;
        this.#size = 0;
        this.#nodeCount = 0;
    }
    /**
     * Deletes the value stored at an exact property path.
     *
     * Descendant entries do not count as a match. Deleting `['settings']` does not remove
     * `['settings', 'theme']`, and deleting a parentless path does not affect siblings.
     *
     * After removal, unused nodes are pruned from the terminal node toward the root. Pruning stops at the first node
     * that still stores a value or has another child.
     *
     * @param path - Dotted or exact property-key path.
     *
     * @returns `true` when an entry existed and was removed; otherwise `false`.
     *
     * @throws {TypeError} If `path` is not a valid {@link PropertyPath}.
     * @throws {RangeError} If the path exceeds the configured `maxPathDepth`.
     */
    delete(path) {
        const normPath = this.#normalizeStoredPath(path);
        const frames = [];
        let node = this.#root;
        // Record every parent / child edge so empty nodes can be removed after deleting the terminal entry.
        for (const key of normPath) {
            const child = node.children?.get(key);
            if (child === void 0) {
                return false;
            }
            frames.push({ parent: node, key, child });
            node = child;
        }
        const entry = node.entry;
        // The path may exist only as a prefix for longer stored paths.
        if (entry === void 0) {
            return false;
        }
        this.#unlinkEntry(entry);
        delete node.entry;
        this.#size--;
        // Remove unused nodes from the leaf upward while preserving value-bearing prefixes and sibling branches.
        for (let index = frames.length - 1; index >= 0; index--) {
            const { parent, key, child } = frames[index];
            if (child.entry !== void 0 || (child.children?.size ?? 0) > 0) {
                break;
            }
            parent.children?.delete(key);
            this.#nodeCount--;
            // Avoid retaining empty child maps on otherwise reusable prefix nodes.
            if (parent.children?.size === 0) {
                delete parent.children;
            }
        }
        return true;
    }
    /**
     * Returns an insertion-order iterator of `[path, value]` pairs.
     *
     * Paths are canonical frozen arrays owned by this map. `maxDepth` is measured from the trie root, `maxResults`
     * truncates the iterator normally, and `maxVisits` throws when exceeded. Yielded entries retain insertion order.
     *
     * @param options - Optional insertion-order traversal limits.
     *
     * @returns Entry iterator.
     *
     * @throws {TypeError} If a numeric traversal option is invalid.
     * @throws {RangeError} If `options.maxVisits` is exceeded.
     */
    *entries(options = {}) {
        for (const entry of this.#insertionEntryIterator(options)) {
            yield [entry.path, entry.value];
        }
    }
    /**
     * Invokes a callback once for every entry in insertion order.
     *
     * The callback arguments follow `Map.prototype.forEach`: value, key, then map. The key is the canonical readonly
     * property-key array associated with the stored entry. Unlike the explicit iterator methods, `forEach` always
     * visits the complete map, which is already bounded by the configured `maxEntries` storage limit.
     *
     * @param callback - Function invoked for each entry.
     *
     * @param thisArg - Optional callback `this` value.
     */
    forEach(callback, thisArg) {
        for (let entry = this.#firstEntry; entry !== void 0; entry = entry.next) {
            callback.call(thisArg, entry.value, entry.path, this);
        }
    }
    /**
     * Retrieves the value stored at an exact structural path.
     *
     * `undefined` may mean either that the path is absent or that `undefined` is the stored value. Use {@link has} when
     * that distinction matters.
     *
     * @param path - Dotted or exact property-key path.
     *
     * @returns Stored value or `undefined` when the exact path is absent.
     *
     * @throws {TypeError} If `path` is not a valid {@link PropertyPath}.
     * @throws {RangeError} If the path exceeds the configured `maxPathDepth`.
     */
    get(path) {
        return this.#findNode(this.#normalizeStoredPath(path))?.entry?.value;
    }
    /**
     * Determines whether a value is stored at an exact structural path.
     *
     * Descendant paths do not cause a prefix to be reported as present.
     *
     * @param path - Dotted or exact property-key path.
     *
     * @returns Whether the exact path stores a value.
     *
     * @throws {TypeError} If `path` is not a valid {@link PropertyPath}.
     * @throws {RangeError} If the path exceeds the configured `maxPathDepth`.
     */
    has(path) {
        return this.#findNode(this.#normalizeStoredPath(path))?.entry !== void 0;
    }
    /**
     * Returns the default insertion-order iterator of `[path, value]` pairs.
     *
     * Constructor-level traversal result and visit caps apply. Use {@link entries} when per-call limits are required.
     */
    [Symbol.iterator]() {
        return this.entries();
    }
    /**
     * Returns an insertion-order iterator of canonical property-key paths.
     *
     * `maxDepth` is measured from the trie root, `maxResults` truncates normally, and `maxVisits` throws when exceeded.
     *
     * @param options - Optional insertion-order traversal limits.
     *
     * @returns Key iterator.
     *
     * @throws {TypeError} If a numeric traversal option is invalid.
     * @throws {RangeError} If `options.maxVisits` is exceeded.
     */
    *keys(options = {}) {
        for (const entry of this.#insertionEntryIterator(options)) {
            yield entry.path;
        }
    }
    *matchingEntries(data, options = {}) {
        assertPropertyPathOptionsObject(options, 'PropertyPathMap matching');
        const includePropertyValue = options.includePropertyValue ?? false;
        for (const match of this.#matchingEntryIterator(data, options)) {
            yield includePropertyValue ?
                [match.entry.path, match.entry.value, match.propertyValue] :
                [match.entry.path, match.entry.value];
        }
    }
    /**
     * Yields canonical stored paths whose complete paths are available in a candidate value.
     *
     * This is a path-only projection of {@link matchingEntries} and uses the same trie-aware pruning, prefix / stop
     * bounds, property semantics, and depth-first trie order. Candidate terminal values are never requested solely for
     * this iterator; properties are read only when descendant traversal requires them.
     *
     * @param data - Candidate object or function to inspect.
     *
     * @param options - Path-only matching options.
     *
     * @returns Iterator of matching canonical property-key paths.
     *
     * @throws {TypeError} If a boolean, numeric limit, or path option is invalid.
     * @throws {RangeError} If path bounds exceed configured limits or `options.maxVisits` is exceeded.
     */
    *matchingKeys(data, options) {
        for (const match of this.#matchingEntryIterator(data, options)) {
            yield match.entry.path;
        }
    }
    *matchingValues(data, options = {}) {
        assertPropertyPathOptionsObject(options, 'PropertyPathMap matching');
        const includePropertyValue = options.includePropertyValue ?? false;
        for (const match of this.#matchingEntryIterator(data, options)) {
            yield includePropertyValue ? [match.entry.value, match.propertyValue] : match.entry.value;
        }
    }
    /**
     * Stores a value at an exact structural path.
     *
     * Existing trie nodes are inspected first so path depth, entry count, and node count limits can be validated before
     * any mutation occurs. Overwriting an existing path updates only its value, preserving size and insertion order.
     * A new entry copies and freezes its normalized path once for stable iteration.
     *
     * @param path - Dotted or exact property-key path.
     *
     * @param value - Value to store. `undefined` is valid.
     *
     * @returns This map.
     *
     * @throws {TypeError} If `path` is not a valid {@link PropertyPath}.
     * @throws {RangeError} If the path depth, entry count, or trie node count limit would be exceeded.
     */
    set(path, value) {
        const normPath = this.#normalizeStoredPath(path);
        let node = this.#root;
        let missingIndex = -1;
        // Preflight the existing prefix without allocating nodes so every configured resource limit can fail atomically.
        for (let index = 0; index < normPath.length; index++) {
            const child = node.children?.get(normPath[index]);
            if (child === void 0) {
                missingIndex = index;
                break;
            }
            node = child;
        }
        if (missingIndex === -1 && node.entry !== void 0) {
            // Match native Map overwrite behavior: update the value without changing insertion order or size.
            node.entry.value = value;
            return this;
        }
        const missingNodes = missingIndex === -1 ? 0 : normPath.length - missingIndex;
        if (this.#size >= this.#maxEntries) {
            throw new RangeError(`PropertyPathMap error: Insertion exceeds configured 'maxEntries' of ` +
                `${this.#maxEntries}.`);
        }
        if (missingNodes > this.#maxNodes - this.#nodeCount) {
            throw new RangeError(`PropertyPathMap error: Insertion exceeds configured 'maxNodes' of ` +
                `${this.#maxNodes}.`);
        }
        // Allocate only the preflighted missing suffix; existing prefixes remain shared by related paths.
        if (missingIndex !== -1) {
            for (let index = missingIndex; index < normPath.length; index++) {
                const children = node.children ??= new Map();
                const child = {};
                children.set(normPath[index], child);
                node = child;
            }
            this.#nodeCount += missingNodes;
        }
        const canonicalPath = Object.freeze(Array.from(normPath));
        const entry = { path: canonicalPath, value };
        node.entry = entry;
        this.#appendEntry(entry);
        this.#size++;
        return this;
    }
    /**
     * Yields stored entries from one trie subtree without inspecting a candidate data object.
     *
     * `pathPrefix` selects the absolute trie node where traversal begins. The prefix entry is included when the exact
     * path stores a value, even when it has no descendants. A missing stored prefix produces an empty iterator.
     * `stopAt` includes its own entry when present and prunes all descendants beneath that node.
     *
     * Subtree traversal uses deterministic depth-first trie order rather than global insertion order. Returned
     * canonical paths remain absolute and are reused from their stored entries. `maxDepth` is relative to `pathPrefix`,
     * or to the trie root when no prefix is supplied. `maxResults` truncates normally, while `maxVisits` throws.
     *
     * @param options - Subtree bounds.
     *
     * @returns Iterator of canonical stored paths and mapped values.
     *
     * @throws {TypeError} If a numeric limit or path option is invalid.
     * @throws {RangeError} If path bounds exceed configured limits or `options.maxVisits` is exceeded.
     */
    *subtreeEntries(options = {}) {
        for (const entry of this.#subtreeEntryIterator(options)) {
            yield [entry.path, entry.value];
        }
    }
    /**
     * Yields canonical stored paths from one trie subtree.
     *
     * This is a path-only projection of {@link subtreeEntries}. It performs no candidate object access and allocates no
     * temporary entry tuples.
     *
     * @param options - Subtree bounds.
     *
     * @returns Iterator of canonical stored property-key paths.
     *
     * @throws {TypeError} If a numeric limit or path option is invalid.
     * @throws {RangeError} If path bounds exceed configured limits or `options.maxVisits` is exceeded.
     */
    *subtreeKeys(options = {}) {
        for (const entry of this.#subtreeEntryIterator(options)) {
            yield entry.path;
        }
    }
    /**
     * Yields mapped values from one trie subtree.
     *
     * This is a value-only projection of {@link subtreeEntries}. It performs no candidate object access and allocates no
     * temporary entry tuples.
     *
     * @param options - Subtree bounds.
     *
     * @returns Iterator of mapped values.
     *
     * @throws {TypeError} If a numeric limit or path option is invalid.
     * @throws {RangeError} If path bounds exceed configured limits or `options.maxVisits` is exceeded.
     */
    *subtreeValues(options = {}) {
        for (const entry of this.#subtreeEntryIterator(options)) {
            yield entry.value;
        }
    }
    /**
     * Returns an insertion-order iterator of stored values.
     *
     * `maxDepth` is measured from the trie root, `maxResults` truncates normally, and `maxVisits` throws when exceeded.
     *
     * @param options - Optional insertion-order traversal limits.
     *
     * @returns Value iterator.
     *
     * @throws {TypeError} If a numeric traversal option is invalid.
     * @throws {RangeError} If `options.maxVisits` is exceeded.
     */
    *values(options = {}) {
        for (const entry of this.#insertionEntryIterator(options)) {
            yield entry.value;
        }
    }
    // Internal Utility Functions -------------------------------------------------------------------------------------
    /**
     * Returns insertion-order entries constrained by optional defensive traversal limits.
     */
    *#insertionEntryIterator(options = {}) {
        assertPropertyPathOptionsObject(options, 'PropertyPathMap iteration');
        const bounds = normalizePropertyPathTraversalBounds({
            maxDepth: options.maxDepth,
            maxResults: options.maxResults,
            maxVisits: options.maxVisits
        }, {
            errorPrefix: 'PropertyPathMap iteration',
            prefixOption: 'pathPrefix',
            stopOption: 'stopAt',
            defaultMaxResults: this.#maxTraversalResults,
            defaultMaxVisits: this.#maxTraversalVisits,
            maxResultsLimit: this.#maxTraversalResults,
            maxVisitsLimit: this.#maxTraversalVisits
        });
        const budget = createPropertyPathTraversalBudget(bounds, 'PropertyPathMap iteration');
        const maxPathLength = Math.min(bounds.maxPathLength, this.#maxPathDepth);
        if (budget.maxResults === 0) {
            return;
        }
        for (let entry = this.#firstEntry; entry !== void 0; entry = entry.next) {
            if (budget.results >= budget.maxResults) {
                return;
            }
            consumePropertyPathTraversalVisit(budget);
            if (entry.path.length > maxPathLength) {
                continue;
            }
            consumePropertyPathTraversalResult(budget);
            yield entry;
        }
    }
    /**
     * Normalizes a stored path and enforces the configured path-depth limit before trie access.
     */
    #normalizeStoredPath(path) {
        const normPath = normalizePropertyPath(path);
        if (normPath.length > this.#maxPathDepth) {
            throw new RangeError(`PropertyPathMap error: Path depth ${normPath.length} exceeds configured ` +
                `'maxPathDepth' of ${this.#maxPathDepth}.`);
        }
        return normPath;
    }
    /**
     * Adds a newly created terminal entry to the insertion-order list.
     *
     * Called by {@link set} only when a path did not previously store a value.
     */
    #appendEntry(entry) {
        if (this.#lastEntry === void 0) {
            this.#firstEntry = entry;
            this.#lastEntry = entry;
            return;
        }
        entry.previous = this.#lastEntry;
        this.#lastEntry.next = entry;
        this.#lastEntry = entry;
    }
    /**
     * Locates the trie node reached by a normalized path without creating nodes.
     *
     * Called by {@link get} and {@link has}. Keeping lookup separate from insertion avoids allocating child maps or
     * nodes during read-only operations.
     *
     * @param path - Valid normalized property-key path.
     *
     * @returns Reached node or `undefined` when any segment is absent.
     */
    #findNode(path) {
        let node = this.#root;
        for (const key of path) {
            const child = node.children?.get(key);
            if (child === void 0) {
                return void 0;
            }
            node = child;
        }
        return node;
    }
    /**
     * Yields terminal entries whose stored paths exist in a candidate value.
     *
     * Matching traversal shares normalized prefix, stop, depth, result, and visit bounds with subtree and object-path
     * traversal. Candidate properties are read only when a descendant must be traversed or a terminal property value
     * is explicitly requested. Getter and proxy exceptions are intentionally propagated.
     *
     * @param data - Candidate object or function to inspect.
     * @param options - Matching options.
     *
     * @returns Iterator of matching terminal entries and optionally resolved candidate property values.
     *
     * @throws {TypeError} If a boolean, numeric limit, or path option is invalid.
     * @throws {RangeError} If path bounds exceed configured limits or `options.maxVisits` is exceeded.
     */
    *#matchingEntryIterator(data, options = {}) {
        assertPropertyPathOptionsObject(options, 'PropertyPathMap matching');
        const hasOwnOnly = options.hasOwnOnly ?? false;
        const includePropertyValue = 'includePropertyValue' in options ?
            options.includePropertyValue ?? false : false;
        if (typeof hasOwnOnly !== 'boolean') {
            throw new TypeError(`PropertyPathMap matching error: 'options.hasOwnOnly' is not a boolean.`);
        }
        if (typeof includePropertyValue !== 'boolean') {
            throw new TypeError(`PropertyPathMap matching error: 'options.includePropertyValue' is not a boolean.`);
        }
        const { bounds, startNode, stopNode } = this.#resolveTraversalScope(options);
        const budget = createPropertyPathTraversalBudget(bounds, 'PropertyPathMap traversal');
        // Resolve trie bounds before touching candidate data so a missing stored prefix rejects the operation cheaply.
        if (budget.maxResults === 0 || startNode === void 0 || !isObjectOrFunction(data)) {
            return;
        }
        const startPathLength = bounds.prefixPath?.length ?? 0;
        let stack;
        if (bounds.prefixPath !== void 0) {
            let candidate = data;
            let propertyValue;
            // Resolve the selected absolute prefix against the candidate once before entering general subtree traversal.
            for (let index = 0; index < bounds.prefixPath.length; index++) {
                consumePropertyPathTraversalVisit(budget);
                const key = bounds.prefixPath[index];
                // Arrays reject string indexes and non-index string properties consistently at every prefix depth.
                if (Array.isArray(candidate) && typeof key !== 'symbol' && !isArrayIndex(key)) {
                    return;
                }
                const exists = hasOwnOnly ? Object.hasOwn(candidate, key) : key in candidate;
                if (!exists) {
                    return;
                }
                const isFinal = index === bounds.prefixPath.length - 1;
                const canDescend = isFinal && startPathLength < bounds.maxPathLength &&
                    startNode !== stopNode && startNode.children !== void 0;
                const requiresRead = !isFinal ||
                    (isFinal && ((startNode.entry !== void 0 && includePropertyValue) || canDescend));
                propertyValue = void 0;
                if (requiresRead) {
                    propertyValue = candidate[key];
                }
                if (!isFinal) {
                    if (!isObjectOrFunction(propertyValue)) {
                        return;
                    }
                    candidate = propertyValue;
                }
            }
            if (startNode.entry !== void 0) {
                consumePropertyPathTraversalResult(budget);
                yield { entry: startNode.entry, propertyValue };
            }
            if (budget.results >= budget.maxResults || startPathLength >= bounds.maxPathLength ||
                startNode === stopNode || startNode.children === void 0 || !isObjectOrFunction(propertyValue)) {
                return;
            }
            stack = [{ value: propertyValue, iterator: startNode.children.entries(), pathLength: startPathLength }];
        }
        else {
            const rootChildren = startNode.children;
            if (rootChildren === void 0 || bounds.maxPathLength === 0) {
                return;
            }
            stack = [{ value: data, iterator: rootChildren.entries(), pathLength: 0 }];
        }
        while (stack.length > 0) {
            if (budget.results >= budget.maxResults) {
                return;
            }
            const frame = stack[stack.length - 1];
            const result = frame.iterator.next();
            if (result.done) {
                stack.pop();
                continue;
            }
            consumePropertyPathTraversalVisit(budget);
            const [key, child] = result.value;
            const childPathLength = frame.pathLength + 1;
            // Arrays deliberately reject string indexes and non-index string properties to match PropertyPath traversal.
            if (Array.isArray(frame.value) && typeof key !== 'symbol' && !isArrayIndex(key)) {
                continue;
            }
            const exists = hasOwnOnly ? Object.hasOwn(frame.value, key) : key in frame.value;
            // A missing prefix rejects this node and every stored path below it.
            if (!exists) {
                continue;
            }
            const isStopNode = child === stopNode;
            const canDescend = child.children !== void 0 && !isStopNode &&
                childPathLength < bounds.maxPathLength;
            let propertyValue;
            // Terminal-only properties are not read unless explicitly requested.
            if ((child.entry !== void 0 && includePropertyValue) || canDescend) {
                propertyValue = frame.value[key];
            }
            if (child.entry !== void 0) {
                consumePropertyPathTraversalResult(budget);
                yield { entry: child.entry, propertyValue };
            }
            if (budget.results >= budget.maxResults || !canDescend || !isObjectOrFunction(propertyValue)) {
                continue;
            }
            stack.push({ value: propertyValue, iterator: child.children.entries(), pathLength: childPathLength });
        }
    }
    /**
     * Normalizes and resolves common absolute path and resource bounds used by every trie traversal.
     *
     * Property path and numeric validation occur before trie or candidate access. Per-call result and visit limits may
     * reduce, but never exceed, the constructor-level traversal caps.
     */
    #resolveTraversalScope(options = {}) {
        assertPropertyPathOptionsObject(options, 'PropertyPathMap traversal');
        const { pathPrefix, stopAt, maxDepth, maxResults, maxVisits } = options;
        const normalized = normalizePropertyPathTraversalBounds({
            prefixPath: pathPrefix,
            stopPath: stopAt,
            maxDepth,
            maxResults,
            maxVisits
        }, {
            errorPrefix: 'PropertyPathMap traversal',
            prefixOption: 'pathPrefix',
            stopOption: 'stopAt',
            defaultMaxResults: this.#maxTraversalResults,
            defaultMaxVisits: this.#maxTraversalVisits,
            maxResultsLimit: this.#maxTraversalResults,
            maxVisitsLimit: this.#maxTraversalVisits,
            stopOutsideMessage: `PropertyPathMap traversal error: 'options.stopAt' is outside ` +
                `'options.pathPrefix'.`
        });
        if (normalized.prefixPath !== void 0 && normalized.prefixPath.length > this.#maxPathDepth) {
            throw new RangeError(`PropertyPathMap traversal error: 'options.pathPrefix' exceeds configured ` +
                `'maxPathDepth' of ${this.#maxPathDepth}.`);
        }
        if (normalized.stopPath !== void 0 && normalized.stopPath.length > this.#maxPathDepth) {
            throw new RangeError(`PropertyPathMap traversal error: 'options.stopAt' exceeds configured ` +
                `'maxPathDepth' of ${this.#maxPathDepth}.`);
        }
        const bounds = {
            ...normalized,
            maxPathLength: Math.min(normalized.maxPathLength, this.#maxPathDepth)
        };
        return {
            bounds,
            startNode: bounds.prefixPath === void 0 ? this.#root : this.#findNode(bounds.prefixPath),
            stopNode: bounds.stopPath === void 0 ? void 0 : this.#findNode(bounds.stopPath)
        };
    }
    /**
     * Yields terminal entries from one bounded trie subtree without inspecting candidate data.
     */
    *#subtreeEntryIterator(options = {}) {
        const { bounds, startNode, stopNode } = this.#resolveTraversalScope(options);
        const budget = createPropertyPathTraversalBudget(bounds, 'PropertyPathMap traversal');
        if (budget.maxResults === 0 || startNode === void 0) {
            return;
        }
        const startPathLength = bounds.prefixPath?.length ?? 0;
        if (startNode.entry !== void 0) {
            consumePropertyPathTraversalResult(budget);
            yield startNode.entry;
        }
        if (budget.results >= budget.maxResults || startPathLength >= bounds.maxPathLength ||
            startNode === stopNode || startNode.children === void 0) {
            return;
        }
        const stack = [{
                iterator: startNode.children.entries(),
                pathLength: startPathLength
            }];
        while (stack.length > 0) {
            if (budget.results >= budget.maxResults) {
                return;
            }
            const frame = stack[stack.length - 1];
            const result = frame.iterator.next();
            if (result.done) {
                stack.pop();
                continue;
            }
            consumePropertyPathTraversalVisit(budget);
            const child = result.value[1];
            const childPathLength = frame.pathLength + 1;
            if (child.entry !== void 0) {
                consumePropertyPathTraversalResult(budget);
                yield child.entry;
            }
            if (budget.results >= budget.maxResults || childPathLength >= bounds.maxPathLength ||
                child === stopNode || child.children === void 0) {
                continue;
            }
            stack.push({ iterator: child.children.entries(), pathLength: childPathLength });
        }
    }
    /**
     * Removes a terminal entry from the insertion-order list.
     *
     * Called by {@link delete}. Neighbor links and list endpoints are updated in constant time.
     */
    #unlinkEntry(entry) {
        if (entry.previous !== void 0) {
            entry.previous.next = entry.next;
        }
        else {
            this.#firstEntry = entry.next;
        }
        if (entry.next !== void 0) {
            entry.next.previous = entry.previous;
        }
        else {
            this.#lastEntry = entry.previous;
        }
    }
}
/**
 * Validates and applies defaults to constructor-level resource limits.
 */
function normalizePropertyPathMapLimits(options) {
    assertPropertyPathOptionsObject(options, 'PropertyPathMap');
    return {
        maxEntries: normalizePropertyPathLimit(options.maxEntries, DEFAULT_PROPERTY_PATH_ENTRY_LIMIT, `PropertyPathMap error: 'options.maxEntries' is not a non-negative safe integer.`),
        maxNodes: normalizePropertyPathLimit(options.maxNodes, DEFAULT_PROPERTY_PATH_NODE_LIMIT, `PropertyPathMap error: 'options.maxNodes' is not a non-negative safe integer.`),
        maxPathDepth: normalizePropertyPathLimit(options.maxPathDepth, DEFAULT_PROPERTY_PATH_DEPTH_LIMIT, `PropertyPathMap error: 'options.maxPathDepth' is not a non-negative safe integer.`),
        maxTraversalResults: normalizePropertyPathLimit(options.maxTraversalResults, DEFAULT_PROPERTY_PATH_RESULT_LIMIT, `PropertyPathMap error: 'options.maxTraversalResults' is not a non-negative safe integer.`),
        maxTraversalVisits: normalizePropertyPathLimit(options.maxTraversalVisits, DEFAULT_PROPERTY_PATH_VISIT_LIMIT, `PropertyPathMap error: 'options.maxTraversalVisits' is not a non-negative safe integer.`)
    };
}

/**
 * Associates structural {@link PropertyPath} paths with values beneath weakly held root objects.
 *
 * Each root is stored as a key in an internal `WeakMap`, and each root value is a trie-based
 * {@link PropertyPathMap}. This provides structural path lookup while allowing the root and its complete path map to
 * become eligible for garbage collection when the root is no longer referenced elsewhere.
 *
 * @example
 * ```ts
 * const maps = new WeakPropertyPathMap<object, DataModel>();
 * const document = {};
 *
 * maps.set(document, ['system', 'attributes', 'hp'], hpModel);
 * maps.set(document, ['system', 'attributes', 'ac'], acModel);
 *
 * maps.get(document, ['system', 'attributes', 'hp']);
 * // hpModel
 * ```
 *
 * ## Weak collection constraints
 *
 * Like `WeakMap`, this collection cannot expose global `size`, `entries`, `keys`, `values`, or iteration because weak
 * roots are intentionally not enumerable. Every query requires a known root object. {@link clear} is supported by
 * replacing the internal `WeakMap` in constant time.
 *
 * ## Root and path semantics
 *
 * - Root keys must be non-null objects or functions.
 * - Property paths use all structural and symbol semantics provided by {@link PropertyPathMap}.
 * - Different roots may store identical paths without conflict.
 * - `undefined` is a valid stored value; use {@link has} to distinguish it from an absent path.
 * - Deleting the final path for a root also removes that root from the internal `WeakMap` immediately.
 *
 * ## Defensive limits
 *
 * The constructor accepts the same storage and traversal limits as {@link PropertyPathMap}. Limits apply independently
 * to each root trie, and a failed first insertion is validated before the root is retained. Aggregate limits across all
 * roots are intentionally unavailable because tracking weak roots globally would require strong retention and violate
 * weak-collection semantics.
 *
 * Matching and subtree iterators support `maxDepth`, `maxResults`, and `maxVisits` through the delegated
 * {@link PropertyPathMap} options. Candidate getters and proxy traps may execute when matching requires property reads;
 * their exceptions are intentionally propagated.
 *
 * ## Complexity
 *
 * Root lookup is expected `O(1)`. Path operations retain the `O(path length)` behavior of {@link PropertyPathMap}.
 * Trie-aware matching retains shared-prefix pruning and visits only candidate branches reachable from stored paths.
 * Matching entry and value iterators may optionally include the property value resolved from the candidate object.
 * Prefix-bounded matching and candidate-independent subtree iteration retain the corresponding behavior of
 * {@link PropertyPathMap}.
 *
 * @category Property Path Collections
 *
 * @typeParam R - Weak root object type.
 * @typeParam V - Stored value type.
 */
class WeakPropertyPathMap {
    /** Weak root-to-trie associations. Reassigned by {@link clear}. */
    #roots = new WeakMap();
    /** Defensive limits applied independently to every per-root trie. */
    #options;
    /** Empty configured trie used to preserve validation semantics for missing roots. */
    #emptyPropertyPathMap;
    /**
     * Creates a weak property-path map with limits applied independently to every live root trie.
     *
     * Because weak roots are not enumerable, aggregate limits across all live roots cannot be tracked without retaining
     * those roots strongly. Constructor limits therefore apply per root while preserving normal weak-key collection
     * semantics.
     *
     * @param options - Per-root storage and traversal limits accepted by {@link PropertyPathMap}.
     *
     * @throws {TypeError} If `options` is invalid or a limit is not a non-negative safe integer.
     */
    constructor(options = {}) {
        assertPropertyPathOptionsObject(options, 'WeakPropertyPathMap');
        this.#options = Object.freeze({ ...options });
        this.#emptyPropertyPathMap = new PropertyPathMap(null, this.#options);
    }
    /**
     * Provides the standard object tag used by `Object.prototype.toString`.
     */
    get [Symbol.toStringTag]() {
        return 'WeakPropertyPathMap';
    }
    /**
     * Removes every root association in constant time.
     *
     * The prior `WeakMap` and all path tries reachable only through it become eligible for garbage collection. Any
     * iterator already returned by a matching or subtree method retains its direct reference to the corresponding path
     * trie and may continue independently.
     */
    clear() {
        this.#roots = new WeakMap();
    }
    /**
     * Deletes one exact property path beneath a root.
     *
     * If the removed path was the final entry beneath the root, the now-empty per-root trie is removed from the
     * internal `WeakMap`. Missing roots and missing exact paths return `false`.
     *
     * @param root - Weak root object or function.
     *
     * @param path - Dotted or exact property-key path.
     *
     * @returns `true` when an exact path existed and was removed; otherwise `false`.
     *
     * @throws {TypeError} If `root` is not a non-null object or function.
     * @throws {TypeError} If `path` is not a valid {@link PropertyPath}.
     * @throws {RangeError} If the path exceeds the configured per-root `maxPathDepth`.
     */
    delete(root, path) {
        WeakPropertyPathMap.#assertWeakPropertyPathMapRoot(root);
        const map = this.#roots.get(root);
        if (map === void 0) {
            return this.#emptyPropertyPathMap.delete(path);
        }
        if (!map.delete(path)) {
            return false;
        }
        // Avoid retaining an empty trie while the root remains alive elsewhere.
        if (map.size === 0) {
            this.#roots.delete(root);
        }
        return true;
    }
    /**
     * Removes every path association beneath one known root.
     *
     * @param root - Weak root object or function.
     *
     * @returns `true` when the root had an associated path trie; otherwise `false`.
     *
     * @throws {TypeError} If `root` is not a non-null object or function.
     */
    deleteRoot(root) {
        WeakPropertyPathMap.#assertWeakPropertyPathMapRoot(root);
        return this.#roots.delete(root);
    }
    /**
     * Retrieves the value stored at an exact structural path beneath a root.
     *
     * `undefined` may mean either that the root / path is absent or that `undefined` is the stored value. Use
     * {@link has} when that distinction matters.
     *
     * @param root - Weak root object or function.
     *
     * @param path - Dotted or exact property-key path.
     *
     * @returns Stored value or `undefined` when the root or exact path is absent.
     *
     * @throws {TypeError} If `root` is not a non-null object or function.
     * @throws {TypeError} If `path` is not a valid {@link PropertyPath}.
     * @throws {RangeError} If the path exceeds the configured per-root `maxPathDepth`.
     */
    get(root, path) {
        WeakPropertyPathMap.#assertWeakPropertyPathMapRoot(root);
        const map = this.#roots.get(root);
        if (map === void 0) {
            return this.#emptyPropertyPathMap.get(path);
        }
        return map.get(path);
    }
    /**
     * Determines whether an exact path stores a value beneath a root.
     *
     * @param root - Weak root object or function.
     *
     * @param path - Dotted or exact property-key path.
     *
     * @returns Whether the root exists and the exact path stores a value.
     *
     * @throws {TypeError} If `root` is not a non-null object or function.
     * @throws {TypeError} If `path` is not a valid {@link PropertyPath}.
     * @throws {RangeError} If the path exceeds the configured per-root `maxPathDepth`.
     */
    has(root, path) {
        WeakPropertyPathMap.#assertWeakPropertyPathMapRoot(root);
        const map = this.#roots.get(root);
        if (map === void 0) {
            return this.#emptyPropertyPathMap.has(path);
        }
        return map.has(path);
    }
    /**
     * Determines whether a root currently has at least one associated path.
     *
     * Roots whose final path is deleted are removed eagerly, so a `true` result always indicates a non-empty
     * per-root trie.
     *
     * @param root - Weak root object or function.
     *
     * @returns Whether the root currently owns a path trie.
     *
     * @throws {TypeError} If `root` is not a non-null object or function.
     */
    hasRoot(root) {
        WeakPropertyPathMap.#assertWeakPropertyPathMapRoot(root);
        return this.#roots.has(root);
    }
    matchingEntries(root, data, options = {}) {
        WeakPropertyPathMap.#assertWeakPropertyPathMapRoot(root);
        const map = this.#roots.get(root);
        return map === void 0 ?
            this.#emptyPropertyPathMap.matchingEntries(data, options) :
            map.matchingEntries(data, options);
    }
    /**
     * Returns a trie-aware iterator of canonical matching paths for one root.
     *
     * This delegates to {@link PropertyPathMap.matchingKeys}; see {@link matchingEntries} for complete matching,
     * path-bound, and stop-bound semantics. A missing root produces an empty iterator while retaining option validation.
     *
     * @param root - Weak root object or function identifying the stored path trie.
     *
     * @param data - Candidate object or function to match against stored paths.
     *
     * @param options - Path-only matching options.
     *
     * @returns Iterator of canonical matching property paths.
     *
     * @throws {TypeError} If `root`, a boolean, numeric limit, or path option is invalid.
     * @throws {RangeError} If path bounds exceed configured limits or `options.maxVisits` is exceeded.
     */
    matchingKeys(root, data, options) {
        WeakPropertyPathMap.#assertWeakPropertyPathMapRoot(root);
        const map = this.#roots.get(root);
        return map === void 0 ? this.#emptyPropertyPathMap.matchingKeys(data, options) :
            map.matchingKeys(data, options);
    }
    matchingValues(root, data, options = {}) {
        WeakPropertyPathMap.#assertWeakPropertyPathMapRoot(root);
        const map = this.#roots.get(root);
        return map === void 0 ? this.#emptyPropertyPathMap.matchingValues(data, options) :
            map.matchingValues(data, options);
    }
    /**
     * Stores a value at an exact structural path beneath a weak root.
     *
     * The per-root trie is created lazily on the first successful insertion. Invalid paths therefore cannot leave
     * an empty root association behind. Existing roots reuse their current trie and retain all normal
     * {@link PropertyPathMap.set} overwrite and insertion-order semantics.
     *
     * @param root - Weak root object or function.
     *
     * @param path - Dotted or exact property-key path.
     *
     * @param value - Value to store. `undefined` is valid.
     *
     * @returns This weak map.
     *
     * @throws {TypeError} If `root` is not a non-null object or function.
     * @throws {TypeError} If `path` is not a valid {@link PropertyPath}.
     * @throws {RangeError} If the per-root path depth, entry count, or trie node count limit would be exceeded.
     */
    set(root, path, value) {
        WeakPropertyPathMap.#assertWeakPropertyPathMapRoot(root);
        let map = this.#roots.get(root);
        if (map === void 0) {
            // Configure and populate the trie before retaining the root so failed validation or resource limits cannot
            // leave an empty weak-root association behind.
            map = new PropertyPathMap(null, this.#options);
            map.set(path, value);
            this.#roots.set(root, map);
        }
        else {
            map.set(path, value);
        }
        return this;
    }
    /**
     * Returns a bounded subtree entry iterator for one weak root.
     *
     * Candidate-independent subtree behavior, absolute `pathPrefix` selection, descendant pruning through `stopAt`,
     * relative `maxDepth`, result / visit budgets, and deterministic trie order are delegated to
     * {@link PropertyPathMap.subtreeEntries}. A missing root behaves as an empty configured trie while still validating
     * all options during iterator consumption.
     *
     * @param root - Weak root object or function identifying the stored path trie.
     *
     * @param options - Subtree bounds.
     *
     * @returns Iterator of canonical stored paths and mapped values.
     *
     * @throws {TypeError} If `root`, a numeric limit, or path option is invalid.
     * @throws {RangeError} If path bounds exceed configured limits or `options.maxVisits` is exceeded.
     */
    subtreeEntries(root, options = {}) {
        WeakPropertyPathMap.#assertWeakPropertyPathMapRoot(root);
        const map = this.#roots.get(root);
        return map === void 0 ? this.#emptyPropertyPathMap.subtreeEntries(options) :
            map.subtreeEntries(options);
    }
    /**
     * Returns a bounded subtree key iterator for one weak root.
     *
     * This delegates to {@link PropertyPathMap.subtreeKeys}. A missing root produces an empty iterator while retaining
     * normal option validation.
     *
     * @param root - Weak root object or function identifying the stored path trie.
     *
     * @param options - Subtree bounds.
     *
     * @returns Iterator of canonical stored property paths.
     *
     * @throws {TypeError} If `root`, a numeric limit, or path option is invalid.
     * @throws {RangeError} If path bounds exceed configured limits or `options.maxVisits` is exceeded.
     */
    subtreeKeys(root, options = {}) {
        WeakPropertyPathMap.#assertWeakPropertyPathMapRoot(root);
        const map = this.#roots.get(root);
        return map === void 0 ? this.#emptyPropertyPathMap.subtreeKeys(options) :
            map.subtreeKeys(options);
    }
    /**
     * Returns a bounded subtree value iterator for one weak root.
     *
     * This delegates to {@link PropertyPathMap.subtreeValues}. A missing root produces an empty iterator while retaining
     * normal option validation.
     *
     * @param root - Weak root object or function identifying the stored path trie.
     *
     * @param options - Subtree bounds.
     *
     * @returns Iterator of mapped values.
     *
     * @throws {TypeError} If `root`, a numeric limit, or path option is invalid.
     * @throws {RangeError} If path bounds exceed configured limits or `options.maxVisits` is exceeded.
     */
    subtreeValues(root, options = {}) {
        WeakPropertyPathMap.#assertWeakPropertyPathMapRoot(root);
        const map = this.#roots.get(root);
        return map === void 0 ? this.#emptyPropertyPathMap.subtreeValues(options) :
            map.subtreeValues(options);
    }
    // Internal Utility Functions -------------------------------------------------------------------------------------
    /**
     * Validates a weak root key.
     *
     * Called by every public operation that accepts a root. Functions are accepted because they are valid `WeakMap` keys
     * and may represent constructors, callable models, or other property-bearing runtime objects.
     *
     * @param value - Candidate root key.
     *
     * @throws {TypeError} If `value` is null or is neither an object nor a function.
     */
    static #assertWeakPropertyPathMapRoot(value) {
        if (!isObjectOrFunction(value)) {
            throw new TypeError(`WeakPropertyPathMap error: 'root' is not an object or function.`);
        }
    }
}

function set(obj, key, val) {
	if (typeof val.value === 'object') val.value = klona(val.value);
	if (!val.enumerable || val.get || val.set || !val.configurable || !val.writable || key === '__proto__') {
		Object.defineProperty(obj, key, val);
	} else obj[key] = val.value;
}

function klona(x) {
	if (typeof x !== 'object') return x;

	var i=0, k, list, tmp, str=Object.prototype.toString.call(x);

	if (str === '[object Object]') {
		tmp = Object.create(x.__proto__ || null);
	} else if (str === '[object Array]') {
		tmp = Array(x.length);
	} else if (str === '[object Set]') {
		tmp = new Set;
		x.forEach(function (val) {
			tmp.add(klona(val));
		});
	} else if (str === '[object Map]') {
		tmp = new Map;
		x.forEach(function (val, key) {
			tmp.set(klona(key), klona(val));
		});
	} else if (str === '[object Date]') {
		tmp = new Date(+x);
	} else if (str === '[object RegExp]') {
		tmp = new RegExp(x.source, x.flags);
	} else if (str === '[object DataView]') {
		tmp = new x.constructor( klona(x.buffer) );
	} else if (str === '[object ArrayBuffer]') {
		tmp = x.slice(0);
	} else if (str.slice(-6) === 'Array]') {
		// ArrayBuffer.isView(x)
		// ~> `new` bcuz `Buffer.slice` => ref
		tmp = new x.constructor(x);
	}

	if (tmp) {
		for (list=Object.getOwnPropertySymbols(x); i < list.length; i++) {
			set(tmp, list[i], Object.getOwnPropertyDescriptor(x, list[i]));
		}

		for (i=0, list=Object.getOwnPropertyNames(x); i < list.length; i++) {
			if (Object.hasOwnProperty.call(tmp, k=list[i]) && tmp[k] === x[k]) continue;
			set(tmp, k, Object.getOwnPropertyDescriptor(x, k));
		}
	}

	return tmp || x;
}

export { PropertyPathMap, WeakPropertyPathMap, assertNonNullObject, assertObject, assertObjectOrFunction, assertOrdinaryObject, assertPlainObject, assertRecord, concatPropertyPath, deepFreeze, deepMerge, deepSeal, deleteProperty, ensureNonEmptyAsyncIterable, ensureNonEmptyIterable, getProperty, getPropertyDescriptor, getPropertyOwner, hasAccessor, hasGetter, hasProperty, hasPrototype, hasSetter, isArrayIndex, isAsyncIterable, isIterable, isJSONPropertyPath, isNonNullObject, isObject, isObjectOrFunction, isOrdinaryObject, isPlainObject, isPropertyKey, isPropertyPath, isPropertyPathEqual, isPropertyPathPrefix, isRecord, joinPropertyPath, klona, normalizePropertyPath, objectKeys, objectSize, pathKeyIterator, propertyPathIterator, safeAccess, safeEqual, safeSet };
//# sourceMappingURL=index.js.map
