/**
 * Provides
 *
 * @type {{ parse: import('json5').parse, stringify: import('json5').stringify }}
 */
declare const JSON5 = {
    parse: typeof import('json5').parse;
    stringify: typeof import('json5').stringify;
};

export { JSON5 };
