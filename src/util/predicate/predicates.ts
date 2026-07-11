/**
 * Determines if the given value is a boolean.
 *
 * @param value - Value to test.
 *
 * @returns True if the value is a boolean.
 */
export function isBoolean(value: unknown): value is boolean
{
   return typeof value === 'boolean';
}

/**
 * Determines if the given value is a bigint.
 *
 * @param value - Value to test.
 *
 * @returns True if the value is a bigint.
 */
export function isBigInt(value: unknown): value is bigint
{
   return typeof value === 'bigint';
}

/**
 * Determines if the given value is defined.
 *
 * @param value - Value to test.
 *
 * @returns True if the value is not undefined.
 */
export function isDefined<T>(value: T | undefined): value is T
{
   return value !== void 0;
}

/**
 * Determines if the given value is a function.
 *
 * @param value - Value to test.
 *
 * @returns True if the value is a function.
 */
export function isFunction<T extends (...args: any[]) => any>(
   value: unknown): value is T
{
   return typeof value === 'function';
}

/**
 * Determines if the given value is a finite number.
 *
 * @param value - Value to test.
 *
 * @returns True if the value is a finite number.
 */
export function isFiniteNumber(value: unknown): value is number
{
   return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Determines if the given value is an integer number.
 *
 * @param value - Value to test.
 *
 * @returns True if the value is an integer number.
 */
export function isInteger(value: unknown): value is number
{
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
export function isNumber(value: unknown): value is number
{
   return typeof value === 'number';
}

/**
 * Determines if the given value is an integer number.
 *
 * @param value - Value to test.
 *
 * @returns True if the value is an integer number.
 */
export function isSafeInteger(value: unknown): value is number
{
   return typeof value === 'number' && Number.isSafeInteger(value);
}

/**
 * Determines if the given value is a string.
 *
 * @param value - Value to test.
 *
 * @returns True if the value is a string.
 */
export function isString(value: unknown): value is string
{
   return typeof value === 'string';
}

/**
 * Determines if the given value is a symbol.
 *
 * @param value - Value to test.
 *
 * @returns True if the value is a symbol.
 */
export function isSymbol(value: unknown): value is symbol
{
   return typeof value === 'symbol';
}

/**
 * Determines if the given value is undefined.
 *
 * @param value - Value to test.
 *
 * @returns True if the value is undefined.
 */
export function isUndefined(value: unknown): value is undefined
{
   return value === void 0;
}
