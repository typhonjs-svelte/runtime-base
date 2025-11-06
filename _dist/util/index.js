/**
 * Provides strictly readonly collections at runtime including {@link ReadonlyMap} and {@link ReadonlySet}.
 *
 * The protection level provided is for accidental modification. A determined caller could still mutate via
 * `Map.prototype.set.call(frozenMap, ...)` or `Set.prototype.add.call(frozenSet, ...)`.
 */
class Frozen {
    constructor() {
        throw new Error('Frozen constructor: This is a static class and should not be constructed.');
    }
    /**
     * @param [entries] - Target Map or iterable of [key, value] pairs.
     *
     * @returns A strictly ReadonlyMap.
     */
    static Map(entries) {
        const result = new Map(entries);
        // @ts-expect-error
        result.set = void 0;
        // @ts-expect-error
        result.delete = void 0;
        // @ts-expect-error
        result.clear = void 0;
        return result;
    }
    /**
     * @param [data] - Target Set or iterable list.
     *
     * @returns A strictly ReadonlySet.
     */
    static Set(data) {
        const result = new Set(data);
        // @ts-expect-error
        result.add = void 0;
        // @ts-expect-error
        result.delete = void 0;
        // @ts-expect-error
        result.clear = void 0;
        return result;
    }
}
Object.freeze(Frozen);

/**
 * Provides various utilities for generating hash codes for strings and UUIDs.
 */
class Hashing {
    static #cryptoBuffer = new Uint8Array(1);
    static #regexUuidv4 = /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;
    static #regexUuidReplace = /[018]/g;
    static #uuidTemplate = '10000000-1000-4000-8000-100000000000';
    constructor() {
        throw new Error('Hashing constructor: This is a static class and should not be constructed.');
    }
    /**
     * Provides a solid string hashing algorithm.
     *
     * Sourced from: https://stackoverflow.com/a/52171480
     *
     * @param str - String to hash.
     *
     * @param [seed=0] - A seed value altering the hash; default value: `0`.
     *
     * @returns Hash code.
     */
    static hashCode(str, seed = 0) {
        if (typeof str !== 'string') {
            return 0;
        }
        let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
        for (let ch, i = 0; i < str.length; i++) {
            ch = str.charCodeAt(i);
            h1 = Math.imul(h1 ^ ch, 2654435761);
            h2 = Math.imul(h2 ^ ch, 1597334677);
        }
        h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
        h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
        return 4294967296 * (2097151 & h2) + (h1 >>> 0);
    }
    /**
     * Validates that the given string is formatted as a UUIDv4 string.
     *
     * @param uuid - UUID string to test.
     *
     * @returns Is UUIDv4 string.
     */
    static isUuidv4(uuid) {
        return typeof uuid === 'string' && this.#regexUuidv4.test(uuid);
    }
    /**
     * Generates a UUID v4 compliant ID. Please use a complete UUID generation package for guaranteed compliance.
     *
     * This code is an evolution of the `Jed UUID` from the following Gist.
     * https://gist.github.com/jed/982883
     *
     * There is a public domain / free copy license attached to it that is not a standard OSS license...
     * https://gist.github.com/jed/982883#file-license-txt
     *
     * @privateRemarks
     * The code golfing was removed in the implementation below.
     *
     * @returns UUIDv4
     */
    static uuidv4() {
        return this.#uuidTemplate.replace(this.#regexUuidReplace, (c) => (Number(c) ^ (globalThis.crypto ?? globalThis.msCrypto).getRandomValues(this.#cryptoBuffer)[0] & 15 >> Number(c) / 4).toString(16));
    }
}

/**
 * Provides utility functions for strings.
 *
 * This class should not be constructed as it only contains static methods.
 */
class Strings {
    static #regexEscape = /[-/\\^$*+?.()|[\]{}]/g;
    static #regexNormalize = /[\x00-\x1F]/gm;
    static #regexReplacement = '\\$&';
    constructor() {
        throw new Error('Strings constructor: This is a static class and should not be constructed.');
    }
    /**
     * Escape a given input string prefacing special characters with backslashes for use in a regular expression.
     *
     * @param str - An un-escaped input string.
     *
     * @returns The escaped string suitable for use in a regular expression.
     */
    static escape(str) {
        return str.replace(this.#regexEscape, this.#regexReplacement);
    }
    /**
     * Normalizes a string.
     *
     * @param str - A string to normalize for comparisons.
     *
     * @returns Cleaned string.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize
     */
    static normalize(str) {
        return str.trim().normalize('NFD').replace(this.#regexNormalize, '');
    }
}

/**
 * Provides timing related higher-order functions.
 */
class Timing {
    constructor() {
        throw new Error('Timing constructor: This is a static class and should not be constructed.');
    }
    /**
     * Wraps a callback in a debounced timeout. Delay execution of the callback function until the function has not been
     * called for the given delay in milliseconds.
     *
     * @param callback - A function to execute once the debounced threshold has been passed.
     *
     * @param delay - An amount of time in milliseconds to delay.
     *
     * @returns A wrapped function that can be called to debounce execution.
     *
     * @example
     * /**
     *  * Debounce the update invocation by 500ms.
     *  *\/
     * const updateDebounced = Timing.debounce(() => doc.update(), 500);
     *
     * // Use the function like:
     * updateDebounced();
     *
     * @example
     * /**
     *  * Debounce the update invocation by 500ms.
     *  *
     *  * \@param {string} value - A value to update.
     *  *\/
     * const updateDebounced = Timing.debounce((value) => doc.update(value), 500);
     *
     * // Use the function like:
     * updateDebounced('new value');
     */
    static debounce(callback, delay) {
        if (typeof callback !== 'function') {
            throw new TypeError(`'callback' must be a function.`);
        }
        if (!Number.isInteger(delay) || delay < 0) {
            throw new TypeError(`'delay' must be a positive integer representing milliseconds.`);
        }
        let timeoutId;
        return function (...args) {
            globalThis.clearTimeout(timeoutId);
            timeoutId = globalThis.setTimeout(() => { callback.apply(this, args); }, delay);
        };
    }
    /**
     * Creates a double click event handler that distinguishes between single and double clicks. Calls the `single`
     * callback on a single click and the `double` callback on a double click. The default double click delay to invoke
     * the `double` callback is 400 milliseconds.
     *
     * @param opts - Optional parameters.
     *
     * @param [opts.single] - Single click callback.
     *
     * @param [opts.double] - Double click callback.
     *
     * @param [opts.delay=400] - Double click delay.
     *
     * @returns The gated double-click handler.
     *
     * @example
     * // Given a button element.
     * button.addEventListener('click', Timing.doubleClick({
     *    single: (event) => console.log('Single click: ', event),
     *    double: (event) => console.log('Double click: ', event)
     * });
     */
    static doubleClick({ single, double, delay = 400 }) {
        if (single !== void 0 && typeof single !== 'function') {
            throw new TypeError(`'single' must be a function.`);
        }
        if (double !== void 0 && typeof double !== 'function') {
            throw new TypeError(`'double' must be a function.`);
        }
        if (!Number.isInteger(delay) || delay < 0) {
            throw new TypeError(`'delay' must be a positive integer representing milliseconds.`);
        }
        let clicks = 0;
        let timeoutId;
        return (event) => {
            globalThis.clearTimeout(timeoutId);
            clicks++;
            if (clicks === 1) {
                timeoutId = globalThis.setTimeout(() => {
                    if (typeof single === 'function') {
                        single(event);
                    }
                    clicks = 0;
                }, delay);
            }
            else {
                if (typeof double === 'function') {
                    double(event);
                }
                clicks = 0;
            }
        };
    }
}

export { Frozen, Hashing, Strings, Timing };
//# sourceMappingURL=index.js.map
