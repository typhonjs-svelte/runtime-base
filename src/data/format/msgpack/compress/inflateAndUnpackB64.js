import { inflateSync }  from '#runtime/data/compress';
import { toUint8Array } from '#runtime/data/format/base64';
import { unpack }       from '#runtime/data/format/msgpack';

/**
 * Converts Base64 string to Uint8Array / inflates then unpacks with MessagePack. This function is the inverse of
 * `packAndDeflateB64`.
 *
 * @param {string}  data - Any Base64 data that has been compressed with
 *
 * @param {object}   [opts] - Optional parameters.
 *
 * @param {import('#runtime/data/compress').InflateOptions} [opts.inflateOptions] - Inflate options.
 *
 * @returns {any} Inflated and unpacked data.
 */
export function inflateAndUnpackB64(data, { inflateOptions } = {})
{
   return unpack(inflateSync(toUint8Array(data), inflateOptions));
}
