/**
 * Determines if the given value is a boolean.
 *
 * @param value - Value to test.
 *
 * @returns True if the value is a boolean.
 */
function isBoolean(value) {
    return typeof value === 'boolean';
}
/**
 * Determines if the given value is a bigint.
 *
 * @param value - Value to test.
 *
 * @returns True if the value is a bigint.
 */
function isBigInt(value) {
    return typeof value === 'bigint';
}
/**
 * Determines if the given value is defined.
 *
 * @param value - Value to test.
 *
 * @returns True if the value is not undefined.
 */
function isDefined(value) {
    return value !== void 0;
}
/**
 * Determines if the given value is a function.
 *
 * @param value - Value to test.
 *
 * @returns True if the value is a function.
 */
function isFunction(value) {
    return typeof value === 'function';
}
/**
 * Determines if the given value is a finite number.
 *
 * @param value - Value to test.
 *
 * @returns True if the value is a finite number.
 */
function isFiniteNumber(value) {
    return typeof value === 'number' && Number.isFinite(value);
}
/**
 * Determines if the given value is an integer number.
 *
 * @param value - Value to test.
 *
 * @returns True if the value is an integer number.
 */
function isInteger(value) {
    return typeof value === 'number' && Number.isInteger(value);
}
/**
 * Determines if the given value is a number.
 *
 * Note: This includes `NaN`, `Infinity`, and `-Infinity`, matching the
 * ECMAScript `number` primitive.
 *
 * @param value - Value to test.
 *
 * @returns True if the value is a number.
 */
function isNumber(value) {
    return typeof value === 'number';
}
/**
 * Determines if the given value is an integer number.
 *
 * @param value - Value to test.
 *
 * @returns True if the value is an integer number.
 */
function isSafeInteger(value) {
    return typeof value === 'number' && Number.isSafeInteger(value);
}
/**
 * Determines if the given value is a string.
 *
 * @param value - Value to test.
 *
 * @returns True if the value is a string.
 */
function isString(value) {
    return typeof value === 'string';
}
/**
 * Determines if the given value is a symbol.
 *
 * @param value - Value to test.
 *
 * @returns True if the value is a symbol.
 */
function isSymbol(value) {
    return typeof value === 'symbol';
}
/**
 * Determines if the given value is undefined.
 *
 * @param value - Value to test.
 *
 * @returns True if the value is undefined.
 */
function isUndefined(value) {
    return value === void 0;
}

/**
 * Resolves the first value accepted by the supplied predicate.
 *
 * Values are evaluated in the order provided. The first value accepted by the predicate is returned. If no values
 * are accepted, `undefined` is returned.
 *
 * @param predicate - Predicate used to evaluate each value.
 *
 * @param values - Values to evaluate in order.
 *
 * @returns The first value accepted by the predicate; otherwise `undefined`.
 */
function resolveByPredicate(predicate, ...values) {
    for (let i = 0, length = values.length; i < length; i++) {
        const value = values[i];
        if (predicate(value)) {
            return value;
        }
    }
    return void 0;
}

export { isBigInt, isBoolean, isDefined, isFiniteNumber, isFunction, isInteger, isNumber, isSafeInteger, isString, isSymbol, isUndefined, resolveByPredicate };
//# sourceMappingURL=index.js.map
