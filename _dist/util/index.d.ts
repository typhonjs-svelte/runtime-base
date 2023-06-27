declare class Hashing {
    /**
     * Provides a solid string hashing algorithm.
     *
     * Sourced from: https://stackoverflow.com/a/52171480
     *
     * @param {string}   str - String to hash.
     *
     * @param {number}   seed - A seed value altering the hash.
     *
     * @returns {number} Hash code.
     */
    static hashCode(str: string, seed?: number): number;
    /**
     * Validates that the given string is formatted as a UUIDv4 string.
     *
     * @param {string}   uuid - UUID string to test.
     *
     * @returns {boolean} Is UUIDv4 string.
     */
    static isUuidv4(uuid: string): boolean;
    /**
     * Generates a UUID v4 compliant ID. Please use a complete UUID generation package for guaranteed compliance.
     *
     * This code is an evolution of the following Gist.
     * https://gist.github.com/jed/982883
     *
     * There is a public domain / free copy license attached to it that is not a standard OSS license...
     * https://gist.github.com/jed/982883#file-license-txt
     *
     * @returns {string} UUIDv4
     */
    static uuidv4(): string;
}

/**
 * Provides utility functions for strings.
 */
declare class Strings {
    /**
     * Escape a given input string prefacing special characters with backslashes for use in a regular expression.
     *
     * @param {string}   string - An un-escaped input string.
     *
     * @returns {string} The escaped string suitable for use in a regular expression.
     */
    static escape(string: string): string;
    /**
     * Normalizes a string.
     *
     * @param {string}   string - A string to normalize for comparisons.
     *
     * @returns {string} Cleaned string.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize
     */
    static normalize(string: string): string;
}

/**
 * Provides timing related higher-order functions.
 */
declare class Timing {
    /**
     * Wraps a callback in a debounced timeout.
     *
     * Delay execution of the callback function until the function has not been called for the given delay in milliseconds.
     *
     * @param {Function} callback - A function to execute once the debounced threshold has been passed.
     *
     * @param {number}   delay - An amount of time in milliseconds to delay.
     *
     * @returns {Function} A wrapped function that can be called to debounce execution.
     */
    static debounce(callback: Function, delay: number): Function;
    /**
     * @param {object}   opts - Optional parameters.
     *
     * @param {Function} opts.single - Single click callback.
     *
     * @param {Function} opts.double - Double click callback.
     *
     * @param {number}   [opts.delay=400] - Double click delay.
     *
     * @returns {(event: Event) => void} The gated double-click handler.
     */
    static doubleClick({ single, double, delay }: {
        single: Function;
        double: Function;
        delay?: number;
    }): (event: Event) => void;
}

export { Hashing, Strings, Timing };
