import { parse, stringify } from 'json5/lib/index.js';

/**
 * Provides
 *
 * @type {{ parse: import('json5').parse, stringify: import('json5').stringify }}
 */
declare const JSON5: {
    parse: typeof parse;
    stringify: typeof stringify;
};

export { JSON5 };
