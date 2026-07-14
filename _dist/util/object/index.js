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

/**
 * Provides JavaScript and TypeScript utilities for validating, inspecting, traversing, comparing, and modifying
 * objects.
 *
 * The package includes runtime assertions and type guards, strongly typed property-path access using dotted strings
 * or exact {@link PropertyKey} arrays, hardened mutation and deep-merge operations, symbol-aware traversal, iterative
 * freeze / seal helpers, prototype and descriptor inspection, and iterable utilities.
 *
 * The cloning API from `klona/full` is re-exported.
 *
 * @packageDocumentation
 */
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
 * @throws {TypeError} if the value is null, non-object, or an array.
 *
 * @param value - The value to validate.
 *
 * @param errorMsg - Optional message used for the thrown TypeError.
 */
function assertObject(value, errorMsg = 'Expected an object.') {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
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
 * @throws {TypeError} if the value is null, non-object, or an array.
 *
 * @param value - The value to validate.
 *
 * @param errorMsg - Optional message used for the thrown TypeError.
 */
function assertPlainObject(value, errorMsg = 'Expected a plain object.') {
    if (!isPlainObjectValue(value)) {
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
 * @throws {TypeError} if the value is null, non-object, or an array.
 *
 * @param value - The value to validate.
 *
 * @param errorMsg - Optional message used for the thrown TypeError.
 */
function assertRecord(value, errorMsg = 'Expected a record object.') {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new TypeError(errorMsg);
    }
}
/**
 * Freezes all entries traversed that are objects including entries in arrays.
 *
 * @param data - An object or array.
 *
 * @param [options] - Options
 *
 * @param [options.skipKeys] - A Set of strings indicating keys of objects to not freeze.
 *
 * @returns The frozen object.
 *
 * @typeParam T - Type of data.
 */
function deepFreeze(data, { skipKeys } = {}) {
    if (typeof data !== 'object' || data === null) {
        throw new TypeError(`deepFreeze error: 'data' is not an object or array.`);
    }
    if (skipKeys !== void 0 && Object.prototype.toString.call(skipKeys) !== '[object Set]') {
        throw new TypeError(`deepFreeze error: 'options.skipKeys' is not a Set.`);
    }
    const stack = [data];
    while (stack.length > 0) {
        const obj = stack.pop();
        if (typeof obj !== 'object' || obj === null || Object.isFrozen(obj)) {
            continue;
        }
        // Collect own enumerable string and symbol children before freezing; reading after Object.freeze would still
        // be legal, but batching first keeps graph discovery separate from mutation and handles self references safely.
        const children = [];
        for (const key of getEnumerablePropertyKeys(obj, true)) {
            if (typeof key === 'string' && skipKeys?.has(key)) {
                continue;
            }
            children.push(obj[key]);
        }
        Object.freeze(obj);
        for (const child of children) {
            if (typeof child === 'object' && child !== null) {
                stack.push(child);
            }
        }
    }
    return data;
}
function deepMerge(target, ...sourceObj) {
    if (!isMergeObjectValue(target)) {
        throw new TypeError(`deepMerge error: 'target' is not an object.`);
    }
    if (sourceObj.length === 0) {
        throw new TypeError(`deepMerge error: 'sourceObj' is not an object.`);
    }
    for (let cntr = 0; cntr < sourceObj.length; cntr++) {
        if (!isMergeObjectValue(sourceObj[cntr])) {
            throw new TypeError(`deepMerge error: 'sourceObj[${cntr}]' is not an object.`);
        }
        // Preflight every source before mutating the target so a circular source cannot leave a partial merge behind.
        assertNoCircularPlainObject(sourceObj[cntr]);
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
                if (isPlainObjectValue(sourceValue)) {
                    // Preserve an existing plain branch; otherwise create only the two supported plain-object prototype
                    // categories. Custom source prototypes are never propagated into recursively merged branches.
                    const mergedTarget = isPlainObjectValue(targetValue) ?
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
                    if (isPlainObjectValue(sourceValue)) {
                        // Copy an existing plain target branch before merging so multi-source operation does not mutate
                        // that preexisting nested object by reference. Missing / non-plain branches are recreated safely.
                        const mergedTarget = isPlainObjectValue(targetValue) ?
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
 * Seals all entries traversed that are objects including entries in arrays.
 *
 * @param data - An object or array.
 *
 * @param [options] - Options
 *
 * @param [options.skipKeys] - A Set of strings indicating keys of objects to not seal.
 *
 * @returns The sealed object.
 *
 * @typeParam T - Type of data.
 */
function deepSeal(data, { skipKeys } = {}) {
    if (typeof data !== 'object' || data === null) {
        throw new TypeError(`deepSeal error: 'data' is not an object or array.`);
    }
    if (skipKeys !== void 0 && Object.prototype.toString.call(skipKeys) !== '[object Set]') {
        throw new TypeError(`deepSeal error: 'options.skipKeys' is not a Set.`);
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
            if (typeof key === 'string' && skipKeys?.has(key)) {
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
 * @param value - The value to inspect.
 *
 * @returns A restartable iterable containing all values, or `undefined` if the input was not iterable or contained no
 *          items.
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
 * Determine if the given object has a getter & setter accessor.
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
    // Check for instance accessor.
    const iDescriptor = Object.getOwnPropertyDescriptor(object, accessor);
    if (iDescriptor !== void 0 && iDescriptor.get !== void 0 && iDescriptor.set !== void 0) {
        return true;
    }
    // Walk parent prototype chain. Check for descriptor at each prototype level.
    for (let o = Object.getPrototypeOf(object); o; o = Object.getPrototypeOf(o)) {
        const descriptor = Object.getOwnPropertyDescriptor(o, accessor);
        if (descriptor !== void 0 && descriptor.get !== void 0 && descriptor.set !== void 0) {
            return true;
        }
    }
    return false;
}
/**
 * Determine if the given object has a getter accessor.
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
    // Check for instance accessor.
    const iDescriptor = Object.getOwnPropertyDescriptor(object, accessor);
    if (iDescriptor !== void 0 && iDescriptor.get !== void 0) {
        return true;
    }
    // Walk parent prototype chain. Check for descriptor at each prototype level.
    for (let o = Object.getPrototypeOf(object); o; o = Object.getPrototypeOf(o)) {
        const descriptor = Object.getOwnPropertyDescriptor(o, accessor);
        if (descriptor !== void 0 && descriptor.get !== void 0) {
            return true;
        }
    }
    return false;
}
/**
 * Determines whether an accessor path exists on an object.
 *
 * Traversal aborts immediately when a property is missing, an intermediate value cannot be traversed, or an invalid
 * array index is encountered. Properties whose values are `undefined` or `null` are considered present.
 *
 * Array indexes may only be accessed by number through the array accessor form.
 *
 * @param data - An object to inspect.
 *
 * @param accessor - A dotted string accessor or an array of exact string, number, or symbol property keys.
 *
 * @returns Whether the complete accessor path exists.
 */
function hasProperty(data, accessor) {
    if (typeof data !== 'object' || data === null) {
        return false;
    }
    if (typeof accessor !== 'string' && !Array.isArray(accessor)) {
        return false;
    }
    if ((typeof accessor === 'string' && accessor.length === 0) ||
        (Array.isArray(accessor) && accessor.length === 0)) {
        return false;
    }
    const keys = typeof accessor === 'string' ? accessor.split('.') : accessor;
    return resolvePropertyPath(data, keys) !== unresolvedProperty;
}
/**
 * Returns whether the target is or has the given prototype walking up the prototype chain.
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
    // Check for instance accessor.
    const iDescriptor = Object.getOwnPropertyDescriptor(object, accessor);
    if (iDescriptor !== void 0 && iDescriptor.set !== void 0) {
        return true;
    }
    // Walk parent prototype chain. Check for descriptor at each prototype level.
    for (let o = Object.getPrototypeOf(object); o; o = Object.getPrototypeOf(o)) {
        const descriptor = Object.getOwnPropertyDescriptor(o, accessor);
        if (descriptor !== void 0 && descriptor.set !== void 0) {
            return true;
        }
    }
    return false;
}
/**
 * Tests for whether an _object_ is async iterable.
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
 * @param value - Any value.
 *
 * @returns Whether object is iterable.
 */
function isIterable(value) {
    return value !== null && typeof value === 'object' && typeof value[Symbol.iterator] === 'function';
}
function isObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function isPlainObject(value) {
    return isPlainObjectValue(value);
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
 * @param value - Any value to test.
 *
 * @returns True if the value is an object that is neither null nor an array.
 */
function isRecord(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}
/**
 * Safely returns keys on an object or an empty array if not an object.
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
 * Provides a way to safely access an object's data / entries using either a dotted accessor string or an array of
 * exact property keys.
 *
 * Array indexes may only be accessed by number through the array accessor form.
 *
 * @param data - An object to access entry data.
 *
 * @param accessor - A dotted string accessor or an array of exact string, number, or symbol property keys.
 *
 * @param [defaultValue] - (Optional) A default value to return if an entry for accessor is not found.
 *
 * @returns The value referenced by the accessor.
 *
 * @typeParam T - Type of data.
 * @typeParam P - Accessor type.
 * @typeParam R - Return value / Inferred deep access type or any provided default value type.
 */
function safeAccess(data, accessor, defaultValue) {
    if (typeof data !== 'object' || data === null) {
        return defaultValue;
    }
    if (typeof accessor !== 'string' && !Array.isArray(accessor)) {
        return defaultValue;
    }
    if ((typeof accessor === 'string' && accessor.length === 0) ||
        (Array.isArray(accessor) && accessor.length === 0)) {
        return defaultValue;
    }
    const keys = typeof accessor === 'string' ? accessor.split('.') : accessor;
    let result = data;
    for (let cntr = 0; cntr < keys.length; cntr++) {
        if (!isTraversableValue(result)) {
            return defaultValue;
        }
        const key = keys[cntr];
        const keyType = typeof key;
        if (keyType !== 'string' && keyType !== 'number' && keyType !== 'symbol') {
            return defaultValue;
        }
        if (Array.isArray(result) && keyType !== 'symbol' && !isArrayIndex(key)) {
            return defaultValue;
        }
        // Cache each read so getters and proxy traps are invoked only once per path segment.
        const next = result[key];
        if (next === void 0 || next === null) {
            return defaultValue;
        }
        result = next;
    }
    return result;
}
/**
 * Compares a source object and values of entries against a target object. If the entries in the source object match
 * the target object then `true` is returned otherwise `false`. If either object is undefined or null then false
 * is returned.
 *
 * Note: The source and target should be ordinary objects or arrays; {@link Map} and {@link Set} entries are not
 * compared. Present properties whose values are `undefined` or `null` remain distinct from missing properties.
 *
 * @param source - Source object.
 *
 * @param target - Target object.
 *
 * @param [options] - Options.
 *
 * @param [options.arrayIndex] - Set to `false` to exclude equality testing for numeric array indexes; default: `true`.
 *
 * @param [options.hasOwnOnly] - Set to `false` to include enumerable prototype properties; default: `true`.
 *
 * @returns True if equal.
 */
function safeEqual(source, target, options) {
    if (typeof source !== 'object' || source === null || typeof target !== 'object' || target === null) {
        return false;
    }
    for (const accessor of safeKeyIterator(source, options)) {
        const sourceObjectValue = resolvePropertyPath(source, accessor);
        const targetObjectValue = resolvePropertyPath(target, accessor);
        if (sourceObjectValue !== targetObjectValue) {
            return false;
        }
    }
    return true;
}
/**
 * Returns an iterator of property-key accessor arrays useful with {@link safeAccess} and {@link safeSet} by traversing
 * the given object. Enumerable string and symbol keys are included, and array indexes are emitted as numbers.
 *
 * Note: Keys are only generated for ordinary objects and arrays; {@link Map} and {@link Set} are not indexed.
 *
 * @param data - An object to traverse for accessor keys.
 *
 * @param [options] - Options.
 *
 * @param [options.arrayIndex] - Set to `false` to exclude numeric array indexes. Enumerable symbol properties
 *        on arrays remain included; default: `true`.
 *
 * @param [options.hasOwnOnly] - Set to `false` to include enumerable prototype properties; default: `true`.
 *
 * @returns Safe key iterator.
 */
function* safeKeyIterator(data, { arrayIndex = true, hasOwnOnly = true } = {}) {
    if (typeof data !== 'object' || data === null) {
        throw new TypeError(`safeKeyIterator error: 'data' is not an object.`);
    }
    if (typeof arrayIndex !== 'boolean') {
        throw new TypeError(`safeKeyIterator error: 'options.arrayIndex' is not a boolean.`);
    }
    if (typeof hasOwnOnly !== 'boolean') {
        throw new TypeError(`safeKeyIterator error: 'options.hasOwnOnly' is not a boolean.`);
    }
    // Ancestors are tracked per active path, not globally. Shared objects may therefore appear at multiple valid
    // accessors while a true reference back to an ancestor still throws.
    const rootAncestors = new Set([data]);
    const stack = [{ obj: data, path: [], ancestors: rootAncestors }];
    while (stack.length > 0) {
        const { obj, path, ancestors } = stack.pop();
        if (Array.isArray(obj)) {
            yield* iterateArrayAccessors(obj, path, arrayIndex, hasOwnOnly, stack, ancestors);
            continue;
        }
        for (const key of getEnumerablePropertyKeys(obj, hasOwnOnly)) {
            const fullPath = path.concat(key);
            const value = obj[key];
            if (Array.isArray(value)) {
                // Array index paths are emitted inline to preserve established ordering instead of deferring the array to
                // the primary LIFO object stack.
                yield* iterateArrayAccessors(value, fullPath, arrayIndex, hasOwnOnly, stack, extendPropertyAncestors(ancestors, value));
            }
            else if (typeof value === 'object' && value !== null) {
                stack.push({ obj: value, path: fullPath, ancestors: extendPropertyAncestors(ancestors, value) });
            }
            else if (typeof value !== 'function') {
                yield fullPath;
            }
        }
    }
}
/**
 * Provides a way to safely set an object's data / entries using either a dotted accessor string or an array of exact
 * property keys. Array indexes may only be accessed by number through the array accessor form.
 *
 * @param data - An object to access entry data.
 *
 * @param accessor - A dotted string accessor or an array of exact string, number, or symbol property keys.
 *
 * The string keys `__proto__`, `prototype`, and `constructor` are rejected to prevent prototype-pollution access
 * paths. ECMAScript well-known symbols, such as `Symbol.toStringTag`, `Symbol.iterator`, and `Symbol.toPrimitive`,
 * are also rejected because they modify built-in language protocols and object behavior. User-created symbols and
 * symbols from {@link Symbol.for} remain valid.
 *
 * @param value - A new value to set if an entry for accessor is found.
 *
 * @param [options] - Options.
 *
 * @param [options.operation] - Operation to perform including: `add`, `div`, `mult`, `set`, `set-undefined`, `sub`;
 *        default: `set`.
 *
 * @param [options.createMissing] - If `true` missing accessor entries will be created as objects automatically;
 *        default: `false`.
 *
 * @returns True if successful.
 */
function safeSet(data, accessor, value, { operation = 'set', createMissing = false } = {}) {
    if (typeof data !== 'object' || data === null) {
        throw new TypeError(`safeSet error: 'data' is not an object.`);
    }
    if (typeof accessor !== 'string' && !Array.isArray(accessor)) {
        throw new TypeError(`safeSet error: 'accessor' is not a string or an array of property keys.`);
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
    if ((typeof accessor === 'string' && accessor.length === 0) || (Array.isArray(accessor) && accessor.length === 0)) {
        return false;
    }
    const access = typeof accessor === 'string' ? accessor.split('.') : accessor;
    let result = false;
    let target = data;
    for (let cntr = 0; cntr < access.length; cntr++) {
        const key = access[cntr];
        const keyType = typeof key;
        if (keyType !== 'string' && keyType !== 'number' && keyType !== 'symbol') {
            throw new TypeError(`safeSet error: 'accessor' contains an entry that is not a property key.`);
        }
        // Block prototype-pollution strings and built-in protocol symbols before reading or creating any path segment.
        if ((keyType === 'string' && isBlockedPrototypeKey(key)) ||
            (keyType === 'symbol' && wellKnownSymbols.has(key))) {
            return false;
        }
        if (Array.isArray(target) && keyType !== 'symbol' && !isArrayIndex(key)) {
            return false;
        }
        if (cntr === 0 && access.length === 1 && !createMissing && !(key in target)) {
            return false;
        }
        if (cntr === access.length - 1) {
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
            if (!isTraversableValue(next)) {
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
/**
 * Sentinel returned when an accessor path cannot be resolved.
 *
 * Used by:
 * - {@link resolvePropertyPath}, {@link hasProperty}, and {@link safeEqual}.
 */
const unresolvedProperty = Symbol();
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
            if (!isPlainObjectValue(child)) {
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
 * - {@link safeKeyIterator} when descending through ordinary object and array properties.
 * - {@link iterateArrayAccessors} when descending through symbol properties attached to arrays.
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
        throw new TypeError(`safeKeyIterator error: Circular object path detected.`);
    }
    const result = new Set(ancestors);
    result.add(child);
    return result;
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
 * - {@link safeKeyIterator} and {@link iterateArrayAccessors} for path enumeration.
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
 * Returns whether a value is a valid ECMAScript array index.
 *
 * The maximum array index is `2^32 - 2`; `2^32 - 1` is reserved and does not update an array's `length`.
 *
 * Called by:
 * - {@link safeAccess} and {@link safeSet} for runtime array-path validation.
 * - {@link resolvePropertyPath}, and therefore {@link hasProperty} / {@link safeEqual}.
 *
 * @param value - Candidate numeric property key.
 *
 * @returns Whether `value` is an integer in the ECMAScript array-index range.
 */
function isArrayIndex(value) {
    return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 0xFFFFFFFE;
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
 * Returns whether a value can participate as an intermediate JavaScript property-path target.
 *
 * Functions are included because they are objects for property-access purposes even though `typeof` reports
 * `"function"`. Primitive boxing is intentionally not performed, keeping all path utilities consistent.
 *
 * Called by:
 * - {@link safeAccess} and {@link safeSet} during path traversal.
 * - {@link resolvePropertyPath}, and therefore {@link hasProperty} / {@link safeEqual}.
 *
 * @param value - Candidate intermediate path value.
 *
 * @returns Whether properties may be traversed directly on `value`.
 */
function isTraversableValue(value) {
    return value !== null && (typeof value === 'object' || typeof value === 'function');
}
/**
 * Returns whether a value is accepted as a top-level {@link deepMerge} target or source.
 *
 * This deliberately accepts class instances whose intrinsic tag is `[object Object]`, preserving legacy behavior for
 * top-level inputs. Recursive merging remains restricted by {@link isPlainObjectValue}; nested class instances are
 * assigned as values rather than traversed.
 *
 * Called by:
 * - {@link deepMerge} for top-level target and source validation.
 *
 * @param value - Candidate merge input.
 *
 * @returns Whether the value is an accepted non-array object record.
 */
function isMergeObjectValue(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value) &&
        Object.prototype.toString.call(value) === '[object Object]';
}
/**
 * Returns whether a value is a plain object with either `Object.prototype` or `null` as its prototype.
 *
 * Direct prototype inspection avoids `Symbol.toStringTag` spoofing and excludes arrays, functions, and class
 * instances from recursive plain-object operations.
 *
 * Called by:
 * - {@link assertPlainObject} and {@link isPlainObject}.
 * - {@link deepMerge} to decide which nested values are recursively merged.
 * - {@link assertNoCircularPlainObject} to limit cycle detection to recursively mergeable values.
 *
 * @param value - Candidate plain object.
 *
 * @returns Whether `value` is a plain object.
 */
function isPlainObjectValue(value) {
    if (value === null || typeof value !== 'object') {
        return false;
    }
    const prototype = Object.getPrototypeOf(value);
    return prototype === null || prototype === Object.prototype;
}
/**
 * Yields accessor paths for array indexes and enumerable symbol properties attached to arrays.
 *
 * Numeric indexes are yielded immediately to preserve the established iterator ordering and are intentionally treated
 * as leaves, even when an indexed value is an object. Symbol properties receive normal recursive traversal. A private
 * array stack avoids recursive generator calls for nested arrays reached through symbols.
 *
 * Called by:
 * - {@link safeKeyIterator} for root arrays and arrays encountered as object-property values.
 *
 * @param array - Array to enumerate.
 * @param path - Accessor path leading to `array`.
 * @param arrayIndex - Whether numeric array indexes should be yielded.
 * @param hasOwnOnly - Whether inherited enumerable symbol properties should be excluded.
 * @param objectStack - Primary object traversal stack owned by {@link safeKeyIterator}.
 * @param ancestors - Active path ancestors used for circular-reference detection.
 *
 * @returns An iterator of readonly property-key accessor paths.
 */
function* iterateArrayAccessors(array, path, arrayIndex, hasOwnOnly, objectStack, ancestors) {
    // A dedicated iterative stack avoids recursive generator delegation for symbol-linked nested arrays.
    const stack = [{ array, path, ancestors, symbolIndex: 0, indexesYielded: false }];
    while (stack.length > 0) {
        const frame = stack[stack.length - 1];
        if (!frame.indexesYielded) {
            frame.indexesYielded = true;
            if (arrayIndex) {
                // Array elements are leaf comparisons by design; object-valued entries are not recursively expanded.
                for (let cntr = 0; cntr < frame.array.length; cntr++) {
                    yield frame.path.concat(cntr);
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
        const key = frame.symbols[frame.symbolIndex++];
        const fullPath = frame.path.concat(key);
        const value = frame.array[key];
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
        else if (typeof value !== 'function') {
            yield fullPath;
        }
    }
}
/**
 * Resolves an exact property-key path while preserving missing-property information.
 *
 * Unlike {@link safeAccess}, this helper returns present `undefined` and `null` values unchanged. The private
 * {@link unresolvedProperty} sentinel is returned only when the path itself cannot be resolved.
 *
 * Called by:
 * - {@link hasProperty} to distinguish missing paths from present nullish values.
 * - {@link safeEqual} to compare source and target paths without collapsing missing and nullish values.
 *
 * @param data - Root object to traverse.
 * @param accessor - Exact property-key path.
 *
 * @returns The resolved value or {@link unresolvedProperty}.
 */
function resolvePropertyPath(data, accessor) {
    let result = data;
    for (let cntr = 0; cntr < accessor.length; cntr++) {
        if (!isTraversableValue(result)) {
            return unresolvedProperty;
        }
        const key = accessor[cntr];
        const keyType = typeof key;
        /* v8 ignore start */
        if (keyType !== 'string' && keyType !== 'number' && keyType !== 'symbol') {
            return unresolvedProperty;
        }
        if (Array.isArray(result) && keyType !== 'symbol' && !isArrayIndex(key)) {
            return unresolvedProperty;
        }
        /* v8 ignore stop */
        if (!(key in result)) {
            return unresolvedProperty;
        }
        result = result[key];
    }
    return result;
}

export { assertObject, assertPlainObject, assertRecord, deepFreeze, deepMerge, deepSeal, ensureNonEmptyAsyncIterable, ensureNonEmptyIterable, hasAccessor, hasGetter, hasProperty, hasPrototype, hasSetter, isAsyncIterable, isIterable, isObject, isPlainObject, isRecord, klona, objectKeys, objectSize, safeAccess, safeEqual, safeKeyIterator, safeSet };
//# sourceMappingURL=index.js.map
