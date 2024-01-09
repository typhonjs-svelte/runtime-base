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
 * Provides common object manipulation utilities including depth traversal, obtaining accessors, safely setting values /
 * equality tests, and validation.
 */
const s_TAG_OBJECT = '[object Object]';
const s_TAG_MAP = '[object Map]';
const s_TAG_SET = '[object Set]';
const s_TAG_STRING = '[object String]';
/**
 * Freezes all entries traversed that are objects including entries in arrays.
 *
 * @param {object | []}   data - An object or array.
 *
 * @param {Set<string>}   [skipFreezeKeys] - A Set of strings indicating keys of objects to not freeze.
 *
 * @returns {object | []} The frozen object.
 */
function deepFreeze(data, skipFreezeKeys) {
    /* c8 ignore next 1 */
    if (typeof data !== 'object') {
        throw new TypeError(`'data' is not an 'object'.`);
    }
    /* c8 ignore next 4 */
    if (skipFreezeKeys !== void 0 && !(skipFreezeKeys instanceof Set)) {
        throw new TypeError(`'skipFreezeKeys' is not an 'Set'.`);
    }
    return _deepFreeze(data, skipFreezeKeys);
}
/**
 * Recursively deep merges all source objects into the target object in place. Like `Object.assign` if you provide `{}`
 * as the target a copy is produced. If the target and source property are object literals they are merged.
 * Deleting keys is supported by specifying a property starting with `-=`.
 *
 * @param {object}      target - Target object.
 *
 * @param {...object}   sourceObj - One or more source objects.
 *
 * @returns {object}    Target object.
 */
function deepMerge(target = {}, ...sourceObj) {
    if (Object.prototype.toString.call(target) !== s_TAG_OBJECT) {
        throw new TypeError(`deepMerge error: 'target' is not an 'object'.`);
    }
    for (let cntr = 0; cntr < sourceObj.length; cntr++) {
        if (Object.prototype.toString.call(sourceObj[cntr]) !== s_TAG_OBJECT) {
            throw new TypeError(`deepMerge error: 'sourceObj[${cntr}]' is not an 'object'.`);
        }
    }
    return _deepMerge(target, ...sourceObj);
}
/**
 * Performs a naive depth traversal of an object / array. The data structure _must not_ have circular references.
 * The result of the callback function is used to modify in place the given data.
 *
 * @param {object | []}   data - An object or array.
 *
 * @param {(any) => any}  func - A callback function to process leaf values in children arrays or object members.
 *
 * @param {boolean}       modify - If true then the result of the callback function is used to modify in place
 *                                  the given data.
 *
 * @returns {*} The data object.
 */
function depthTraverse(data, func, modify = false) {
    /* c8 ignore next 1 */
    if (typeof data !== 'object') {
        throw new TypeError(`'data' is not an 'object'.`);
    }
    /* c8 ignore next 1 */
    if (typeof func !== 'function') {
        throw new TypeError(`'func' is not a 'function'.`);
    }
    return _depthTraverse(data, func, modify);
}
/**
 * Returns a list of accessor keys by traversing the given object.
 *
 * @param {object}   data - An object to traverse for accessor keys.
 *
 * @returns {string[]} Accessor list.
 */
function getAccessorList(data) {
    if (typeof data !== 'object') {
        throw new TypeError(`getAccessorList error: 'data' is not an 'object'.`);
    }
    return _getAccessorList(data);
}
/**
 * Provides a method to determine if the passed in Svelte component has a getter & setter accessor.
 *
 * @param {object}   object - An object.
 *
 * @param {string}   accessor - Accessor to test.
 *
 * @returns {boolean} Whether the component has the getter and setter for accessor.
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
 * Provides a method to determine if the passed in Svelte component has a getter accessor.
 *
 * @param {object}   object - An object.
 *
 * @param {string}   accessor - Accessor to test.
 *
 * @returns {boolean} Whether the component has the getter for accessor.
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
 * Returns whether the target is or has the given prototype walking up the prototype chain.
 *
 * @param {unknown}  target - Any target to test.
 *
 * @param {new (...args: any[]) => any} Prototype - Prototype function / class constructor to find.
 *
 * @returns {boolean} Target matches prototype.
 */
function hasPrototype(target, Prototype) {
    /* c8 ignore next */
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
 * Provides a method to determine if the passed in Svelte component has a setter accessor.
 *
 * @param {object}   object - An object.
 *
 * @param {string}   accessor - Accessor to test.
 *
 * @returns {boolean} Whether the component has the setter for accessor.
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
 * Tests for whether an object is async iterable.
 *
 * @param {unknown} value - Any value.
 *
 * @returns {boolean} Whether value is async iterable.
 */
function isAsyncIterable(value) {
    if (typeof value !== 'object' || value === null || value === void 0) {
        return false;
    }
    return Symbol.asyncIterator in value;
}
/**
 * Tests for whether an object is iterable.
 *
 * @param {unknown} value - Any value.
 *
 * @returns {boolean} Whether object is iterable.
 */
function isIterable(value) {
    if (value === null || value === void 0 || typeof value !== 'object') {
        return false;
    }
    return Symbol.iterator in value;
}
/**
 * Tests for whether object is not null, typeof object, and not an array.
 *
 * @param {unknown} value - Any value.
 *
 * @returns {boolean} Is it an object.
 */
function isObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}
/**
 * Tests for whether the given value is a plain object.
 *
 * An object is plain if it is created by either: `{}`, `new Object()` or `Object.create(null)`.
 *
 * @param {unknown} value - Any value
 *
 * @returns {boolean} Is it a plain object.
 */
function isPlainObject(value) {
    if (Object.prototype.toString.call(value) !== s_TAG_OBJECT) {
        return false;
    }
    const prototype = Object.getPrototypeOf(value);
    return prototype === null || prototype === Object.prototype;
}
/**
 * Safely returns keys on an object or an empty array if not an object.
 *
 * @param {object} object - An object.
 *
 * @returns {string[]}  Object keys or empty array.
 */
function objectKeys(object) {
    return isObject(object) ? Object.keys(object) : [];
}
/**
 * Safely returns an objects size. Note for String objects unicode is not taken into consideration.
 *
 * @param {any} object - Any value, but size returned for object / Map / Set / arrays / strings.
 *
 * @returns {number} Size of object.
 */
function objectSize(object) {
    if (object === void 0 || object === null || typeof object !== 'object') {
        return 0;
    }
    const tag = Object.prototype.toString.call(object);
    if (tag === s_TAG_MAP || tag === s_TAG_SET) {
        return object.size;
    }
    if (tag === s_TAG_STRING) {
        return object.length;
    }
    return Object.keys(object).length;
}
/**
 * Provides a way to safely access an objects data / entries given an accessor string which describes the
 * entries to walk. To access deeper entries into the object format the accessor string with `.` between entries
 * to walk.
 *
 * @param {object}   data - An object to access entry data.
 *
 * @param {string}   accessor - A string describing the entries to access with keys separated by `.`.
 *
 * @param {any}      [defaultValue] - (Optional) A default value to return if an entry for accessor is not found.
 *
 * @returns {object} The data object.
 */
function safeAccess(data, accessor, defaultValue) {
    if (typeof data !== 'object') {
        return defaultValue;
    }
    if (typeof accessor !== 'string') {
        return defaultValue;
    }
    const access = accessor.split('.');
    // Walk through the given object by the accessor indexes.
    for (let cntr = 0; cntr < access.length; cntr++) {
        // If the next level of object access is undefined or null then return the empty string.
        if (typeof data[access[cntr]] === 'undefined' || data[access[cntr]] === null) {
            return defaultValue;
        }
        data = data[access[cntr]];
    }
    return data;
}
/**
 * Provides a way to safely batch set an objects data / entries given an array of accessor strings which describe the
 * entries to walk. To access deeper entries into the object format the accessor string with `.` between entries
 * to walk. If value is an object the accessor will be used to access a target value from `value` which is
 * subsequently set to `data` by the given operation. If `value` is not an object it will be used as the target
 * value to set across all accessors.
 *
 * @param {object}   data - An object to access entry data.
 *
 * @param {string[]} accessors - A string describing the entries to access.
 *
 * @param {any}      value - A new value to set if an entry for accessor is found.
 *
 * @param {SafeSetOperation}   [operation='set'] - Operation to perform including: 'add', 'div', 'mult', 'set',
 *        'set-undefined', 'sub'.
 *
 * @param {any}      [defaultAccessValue=0] - A new value to set if an entry for accessor is found.
 *
 * @param {boolean}  [createMissing=true] - If true missing accessor entries will be created as objects automatically.
 */
function safeBatchSet(data, accessors, value, operation = 'set', defaultAccessValue = 0, createMissing = true) {
    if (typeof data !== 'object') {
        throw new TypeError(`safeBatchSet error: 'data' is not an 'object'.`);
    }
    if (!Array.isArray(accessors)) {
        throw new TypeError(`safeBatchSet error: 'accessors' is not an 'array'.`);
    }
    if (typeof value === 'object') {
        accessors.forEach((accessor) => {
            const targetValue = safeAccess(value, accessor, defaultAccessValue);
            safeSet(data, accessor, targetValue, operation, createMissing);
        });
    }
    else {
        accessors.forEach((accessor) => {
            safeSet(data, accessor, value, operation, createMissing);
        });
    }
}
/**
 * Compares a source object and values of entries against a target object. If the entries in the source object match
 * the target object then `true` is returned otherwise `false`. If either object is undefined or null then false
 * is returned.
 *
 * @param {object}   source - Source object.
 *
 * @param {object}   target - Target object.
 *
 * @returns {boolean} True if equal.
 */
function safeEqual(source, target) {
    if (typeof source === 'undefined' || source === null || typeof target === 'undefined' || target === null) {
        return false;
    }
    const sourceAccessors = getAccessorList(source);
    for (let cntr = 0; cntr < sourceAccessors.length; cntr++) {
        const accessor = sourceAccessors[cntr];
        const sourceObjectValue = safeAccess(source, accessor);
        const targetObjectValue = safeAccess(target, accessor);
        if (sourceObjectValue !== targetObjectValue) {
            return false;
        }
    }
    return true;
}
/**
 * Provides a way to safely set an objects data / entries given an accessor string which describes the
 * entries to walk. To access deeper entries into the object format the accessor string with `.` between entries
 * to walk.
 *
 * @param {object}   data - An object to access entry data.
 *
 * @param {string}   accessor - A string describing the entries to access.
 *
 * @param {any}      value - A new value to set if an entry for accessor is found.
 *
 * @param {SafeSetOperation}   [operation='set'] - Operation to perform including: 'add', 'div', 'mult', 'set',
 *        'set-undefined', 'sub'.
 *
 * @param {boolean}  [createMissing=true] - If true missing accessor entries will be created as objects
 *        automatically.
 *
 * @returns {boolean} True if successful.
 */
function safeSet(data, accessor, value, operation = 'set', createMissing = true) {
    if (typeof data !== 'object') {
        throw new TypeError(`safeSet error: 'data' is not an 'object'.`);
    }
    if (typeof accessor !== 'string') {
        throw new TypeError(`safeSet error: 'accessor' is not a 'string'.`);
    }
    const access = accessor.split('.');
    // Walk through the given object by the accessor indexes.
    for (let cntr = 0; cntr < access.length; cntr++) {
        // If data is an array perform validation that the accessor is a positive integer otherwise quit.
        if (Array.isArray(data)) {
            const number = (+access[cntr]);
            if (!Number.isInteger(number) || number < 0) {
                return false;
            }
        }
        if (cntr === access.length - 1) {
            switch (operation) {
                case 'add':
                    data[access[cntr]] += value;
                    break;
                case 'div':
                    data[access[cntr]] /= value;
                    break;
                case 'mult':
                    data[access[cntr]] *= value;
                    break;
                case 'set':
                    data[access[cntr]] = value;
                    break;
                case 'set-undefined':
                    if (typeof data[access[cntr]] === 'undefined') {
                        data[access[cntr]] = value;
                    }
                    break;
                case 'sub':
                    data[access[cntr]] -= value;
                    break;
            }
        }
        else {
            // If createMissing is true and the next level of object access is undefined then create a new object entry.
            if (createMissing && typeof data[access[cntr]] === 'undefined') {
                data[access[cntr]] = {};
            }
            // Abort if the next level is null or not an object and containing a value.
            if (data[access[cntr]] === null || typeof data[access[cntr]] !== 'object') {
                return false;
            }
            data = data[access[cntr]];
        }
    }
    return true;
}
/**
 * Performs bulk setting of values to the given data object.
 *
 * @param {object}            data - The data object to set data.
 *
 * @param {Record<string, any>}  accessorValues - Object of accessor keys to values to set.
 *
 * @param {SafeSetOperation}  [operation='set'] - Operation to perform including: 'add', 'div', 'mult', 'set', 'sub';
 *        default (`set`).
 *
 * @param {boolean}           [createMissing=true] - If true missing accessor entries will be created as objects
 *        automatically.
 */
function safeSetAll(data, accessorValues, operation = 'set', createMissing = true) {
    if (typeof data !== 'object') {
        throw new TypeError(`safeSetAll error: 'data' is not an 'object'.`);
    }
    if (typeof accessorValues !== 'object') {
        throw new TypeError(`safeSetAll error: 'accessorValues' is not an 'object'.`);
    }
    for (const accessor of Object.keys(accessorValues)) {
        if (!Object.prototype.hasOwnProperty.call(accessorValues, accessor)) {
            continue;
        }
        safeSet(data, accessor, accessorValues[accessor], operation, createMissing);
    }
}
/**
 * Performs bulk validation of data given an object, `validationData`, which describes all entries to test.
 *
 * @param {object}                           data - The data object to test.
 *
 * @param {Record<string, ValidationEntry>}  validationData - Key is the accessor / value is a validation entry.
 *
 * @param {string}                           [dataName='data'] - Optional name of data.
 *
 * @returns {boolean} True if validation passes otherwise an exception is thrown.
 */
function validate(data, validationData = {}, dataName = 'data') {
    if (typeof data !== 'object') {
        throw new TypeError(`validate error: '${dataName}' is not an 'object'.`);
    }
    if (typeof validationData !== 'object') {
        throw new TypeError(`validate error: 'validationData' is not an 'object'.`);
    }
    let result;
    for (const key of Object.keys(validationData)) {
        if (!Object.prototype.hasOwnProperty.call(validationData, key)) {
            continue;
        }
        const entry = validationData[key];
        switch (entry.test) {
            case 'array':
                result = validateArray(data, key, entry, dataName);
                break;
            case 'entry':
                result = validateEntry(data, key, entry, dataName);
                break;
            case 'entry|array':
                result = validateEntryOrArray(data, key, entry, dataName);
                break;
        }
    }
    return result;
}
/**
 * Validates all array entries against potential type and expected tests.
 *
 * @param {object}            data - The data object to test.
 *
 * @param {string}            accessor - A string describing the entries to access.
 *
 * @param {ValidationEntry}   entry - Validation entry object
 *
 * @param {string}            [dataName='data'] - Optional name of data.
 *
 * @returns {boolean} True if validation passes otherwise an exception is thrown.
 */
function validateArray(data, accessor, entry, dataName = 'data') {
    const valEntry = Object.assign({ required: true, error: true }, entry);
    const dataArray = safeAccess(data, accessor);
    // A non-required entry is missing so return without validation.
    if (!valEntry?.required && typeof dataArray === 'undefined') {
        return true;
    }
    if (!Array.isArray(dataArray)) {
        if (valEntry.error) {
            throw _validateError(TypeError, `'${dataName}.${accessor}' is not an 'array'.`);
        }
        else {
            return false;
        }
    }
    if (typeof valEntry.type === 'string') {
        for (let cntr = 0; cntr < dataArray.length; cntr++) {
            if (!(typeof dataArray[cntr] === valEntry.type)) {
                if (valEntry.error) {
                    const dataEntryString = typeof dataArray[cntr] === 'object' ? JSON.stringify(dataArray[cntr]) :
                        dataArray[cntr];
                    throw _validateError(TypeError, `'${dataName}.${accessor}[${cntr}]': '${dataEntryString}' is not a '${valEntry.type}'.`);
                }
                else {
                    return false;
                }
            }
        }
    }
    // If expected is a function then test all array entries against the test function. If expected is a Set then
    // test all array entries for inclusion in the set. Otherwise, if expected is a string then test that all array
    // entries as a `typeof` test against expected.
    if (Array.isArray(valEntry.expected)) {
        for (let cntr = 0; cntr < dataArray.length; cntr++) {
            if (!valEntry.expected.includes(dataArray[cntr])) {
                if (valEntry.error) {
                    const dataEntryString = typeof dataArray[cntr] === 'object' ? JSON.stringify(dataArray[cntr]) :
                        dataArray[cntr];
                    throw _validateError(Error, `'${dataName}.${accessor}[${cntr}]': '${dataEntryString}' is not an expected value: ${JSON.stringify(valEntry.expected)}.`);
                }
                else {
                    return false;
                }
            }
        }
    }
    else if (valEntry.expected instanceof Set) {
        for (let cntr = 0; cntr < dataArray.length; cntr++) {
            if (!valEntry.expected.has(dataArray[cntr])) {
                if (valEntry.error) {
                    const dataEntryString = typeof dataArray[cntr] === 'object' ? JSON.stringify(dataArray[cntr]) :
                        dataArray[cntr];
                    throw _validateError(Error, `'${dataName}.${accessor}[${cntr}]': '${dataEntryString}' is not an expected value: ${JSON.stringify(valEntry.expected)}.`);
                }
                else {
                    return false;
                }
            }
        }
    }
    else if (typeof valEntry.expected === 'function') {
        for (let cntr = 0; cntr < dataArray.length; cntr++) {
            try {
                const result = valEntry.expected(dataArray[cntr]);
                if (typeof result === 'undefined' || !result) {
                    throw new Error(valEntry.message);
                }
            }
            catch (err) {
                if (valEntry.error) {
                    const dataEntryString = typeof dataArray[cntr] === 'object' ? JSON.stringify(dataArray[cntr]) :
                        dataArray[cntr];
                    throw _validateError(Error, `'${dataName}.${accessor}[${cntr}]': '${dataEntryString}' failed validation: ${err.message}.`);
                }
                else {
                    return false;
                }
            }
        }
    }
    return true;
}
/**
 * Validates data entry with a typeof check and potentially tests against the values in any given expected set.
 *
 * @param {object}            data - The object data to validate.
 *
 * @param {string}            accessor - A string describing the entries to access.
 *
 * @param {ValidationEntry}   entry - Validation entry.
 *
 * @param {string}            [dataName='data'] - Optional name of data.
 *
 * @returns {boolean} True if validation passes otherwise an exception is thrown.
 */
function validateEntry(data, accessor, entry, dataName = 'data') {
    const valEntry = Object.assign({ required: true, error: true }, entry);
    const dataEntry = safeAccess(data, accessor);
    // A non-required entry is missing so return without validation.
    if (!valEntry.required && typeof dataEntry === 'undefined') {
        return true;
    }
    if (valEntry.type && typeof dataEntry !== valEntry.type) {
        if (valEntry.error) {
            throw _validateError(TypeError, `'${dataName}.${accessor}' is not a '${valEntry.type}'.`);
        }
        else {
            return false;
        }
    }
    if ((valEntry.expected instanceof Set && !valEntry.expected.has(dataEntry)) ||
        (Array.isArray(valEntry.expected) && !valEntry.expected.includes(dataEntry))) {
        if (valEntry.error) {
            const dataEntryString = typeof dataEntry === 'object' ? JSON.stringify(dataEntry) : dataEntry;
            throw _validateError(Error, `'${dataName}.${accessor}': '${dataEntryString}' is not an expected value: ${JSON.stringify(valEntry.expected)}.`);
        }
        else {
            return false;
        }
    }
    else if (typeof valEntry.expected === 'function') {
        try {
            const result = valEntry.expected(dataEntry);
            if (typeof result === 'undefined' || !result) {
                throw new Error(valEntry.message);
            }
        }
        catch (err) {
            if (valEntry.error) {
                const dataEntryString = typeof dataEntry === 'object' ? JSON.stringify(dataEntry) : dataEntry;
                throw _validateError(Error, `'${dataName}.${accessor}': '${dataEntryString}' failed to validate: ${err.message}.`);
            }
            else {
                return false;
            }
        }
    }
    return true;
}
/**
 * Dispatches validation of data entry to string or array validation depending on data entry type.
 *
 * @param {object}            data - The data object to test.
 *
 * @param {string}            accessor - A string describing the entries to access.
 *
 * @param {ValidationEntry}   [entry] - A validation entry.
 *
 * @param {string}            [dataName='data'] - Optional name of data.
 *
 * @returns {boolean} True if validation passes otherwise an exception is thrown.
 */
function validateEntryOrArray(data, accessor, entry, dataName = 'data') {
    const dataEntry = safeAccess(data, accessor);
    let result;
    if (Array.isArray(dataEntry)) {
        result = validateArray(data, accessor, entry, dataName);
    }
    else {
        result = validateEntry(data, accessor, entry, dataName);
    }
    return result;
}
// Module private ---------------------------------------------------------------------------------------------------
/**
 * Private implementation of depth traversal.
 *
 * @param {any}         data - An object or array or any leaf.
 *
 * @param {Set<string>} [skipFreezeKeys] - An array of strings indicating keys of objects to not freeze.
 *
 * @returns {*} The frozen object.
 * @ignore
 * @private
 */
function _deepFreeze(data, skipFreezeKeys) {
    if (Array.isArray(data)) {
        for (let cntr = 0; cntr < data.length; cntr++) {
            _deepFreeze(data[cntr], skipFreezeKeys);
        }
    }
    else if (isObject(data)) {
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key) && !skipFreezeKeys?.has?.(key)) {
                _deepFreeze(data[key], skipFreezeKeys);
            }
        }
    }
    return Object.freeze(data);
}
/**
 * Internal implementation for `deepMerge`.
 *
 * @param {object}      target - Target object.
 *
 * @param {...object}   sourceObj - One or more source objects.
 *
 * @returns {object}    Target object.
 */
function _deepMerge(target = {}, ...sourceObj) {
    // Iterate and merge all source objects into target.
    for (let cntr = 0; cntr < sourceObj.length; cntr++) {
        const obj = sourceObj[cntr];
        for (const prop in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, prop)) {
                // Handle the special property starting with '-=' to delete keys.
                if (prop.startsWith('-=')) {
                    delete target[prop.slice(2)];
                    continue;
                }
                // If target already has prop and both target[prop] and obj[prop] are object literals then merge them
                // otherwise assign obj[prop] to target[prop].
                target[prop] = Object.prototype.hasOwnProperty.call(target, prop) && target[prop]?.constructor === Object &&
                    obj[prop]?.constructor === Object ? _deepMerge({}, target[prop], obj[prop]) : obj[prop];
            }
        }
    }
    return target;
}
/**
 * Private implementation of depth traversal.
 *
 * @param {any}      data - An object, array, or any leaf value
 *
 * @param {Function} func - A callback function to process leaf values in children arrays or object members.
 *
 * @param {boolean}  modify - If true then the result of the callback function is used to modify in place the
 *        given data.
 *
 * @returns {*} The data object.
 * @ignore
 * @private
 */
function _depthTraverse(data, func, modify = false) {
    if (modify) {
        if (Array.isArray(data)) {
            for (let cntr = 0; cntr < data.length; cntr++) {
                data[cntr] = _depthTraverse(data[cntr], func, modify);
            }
        }
        else if (isObject(data)) {
            for (const key in data) {
                if (Object.prototype.hasOwnProperty.call(data, key)) {
                    data[key] = _depthTraverse(data[key], func, modify);
                }
            }
        }
        else {
            data = func(data);
        }
    }
    else {
        if (Array.isArray(data)) {
            for (let cntr = 0; cntr < data.length; cntr++) {
                _depthTraverse(data[cntr], func, modify);
            }
        }
        else if (typeof data === 'object') {
            for (const key in data) {
                if (Object.prototype.hasOwnProperty.call(data, key)) {
                    _depthTraverse(data[key], func, modify);
                }
            }
        }
        else {
            func(data);
        }
    }
    return data;
}
/**
 * Private implementation of `getAccessorList`.
 *
 * @param {object}   data - An object to traverse.
 *
 * @returns {string[]} Accessor list.
 * @ignore
 * @private
 */
function _getAccessorList(data) {
    const accessors = [];
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            if (typeof data[key] === 'object') {
                const childKeys = _getAccessorList(data[key]);
                childKeys.forEach((childKey) => {
                    accessors.push(Array.isArray(childKey) ? `${key}.${childKey.join('.')}` : `${key}.${childKey}`);
                });
            }
            else {
                accessors.push(key);
            }
        }
    }
    return accessors;
}
/**
 * Creates a new error of type `clazz` adding the field `_objectValidateError` set to true.
 *
 * @param {Error}    clazz - Error class to instantiate.
 *
 * @param {string}   message - An error message.
 *
 * @returns {*} Error of the clazz.
 * @ignore
 * @private
 */
function _validateError(clazz, message = void 0) {
    const error = new clazz(message);
    error._objectValidateError = true;
    return error;
}

export { deepFreeze, deepMerge, depthTraverse, getAccessorList, hasAccessor, hasGetter, hasPrototype, hasSetter, isAsyncIterable, isIterable, isObject, isPlainObject, klona, objectKeys, objectSize, safeAccess, safeBatchSet, safeEqual, safeSet, safeSetAll, validate, validateArray, validateEntry, validateEntryOrArray };
//# sourceMappingURL=index.js.map
