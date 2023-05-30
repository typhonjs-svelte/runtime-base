import { parse, stringify } from 'json5/lib/index.js';

/**
 * Provides
 *
 * @type {{ parse: import('json5').parse, stringify: import('json5').stringify }}
 */
const JSON5 = {
   parse,
   stringify
};

Object.freeze(JSON5);

export { JSON5 };
