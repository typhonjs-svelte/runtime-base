import { unpack }       from '#runtime/data/format/msgpack';

import { inflateSync }  from '#runtime/data/compress';

/**
 * Inflates given data then unpacks with MessagePack. This function is the inverse of `packAndDeflate`.
 *
 * @param {Uint8Array}  data - Any data.
 *
 * @param {object}   [opts] - Optional parameters.
 *
 * @param {import('#runtime/data/compress').InflateOptions} [opts.inflateOptions] - Inflate options.
 *
 * @returns {any} Inflated and unpacked data.
 */
export function inflateAndUnpack(data, { inflateOptions } = {})
{
   return unpack(inflateSync(data, inflateOptions));
}
