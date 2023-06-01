import { pack }         from '#runtime/data/format/msgpack';

import { deflateSync }  from '#runtime/data/compress';

/**
 * Packs given data with MessagePack then deflates / compresses with Zlib. The inverse function to inflate is
 * `inflateAndUnpack`.
 *
 * @param {any}   data - Any data.
 *
 * @param {object}   [opts] - Optional parameters.
 *
 * @param {import('#runtime/data/compress').DeflateOptions} [opts.deflateOptions] - Deflate options.
 *
 * @returns {Uint8Array} Packed and compressed data.
 */
export function packAndDeflate(data, { deflateOptions } = {})
{
   return deflateSync(pack(data), deflateOptions);
}
