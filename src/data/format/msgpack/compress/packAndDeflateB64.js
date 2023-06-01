import { deflateSync }     from '#runtime/data/compress';
import { fromUint8Array }  from '#runtime/data/format/base64';
import { pack }            from '#runtime/data/format/msgpack';

/**
 * Packs given data with MessagePack then deflates / compresses with Zlib then converts the Uint8Array to a Base64
 * string. The inverse function to inflate is `inflateAndUnpackB64`.
 *
 * @param {any}   data - Any data.
 *
 * @param {object}   [opts] - Optional parameters.
 *
 * @param {import('#runtime/data/compress').DeflateOptions} [opts.deflateOptions] - Deflate options.
 *
 * @param {boolean}  [opts.urlsafe] - Base64 string is URL-and-filename-safe a la `RFC4648 §5`.
 *
 * @returns {string} Packed / compressed / Base64 string.
 */
export function packAndDeflateB64(data, { deflateOptions, urlsafe } = {})
{
   return fromUint8Array(deflateSync(pack(data), deflateOptions), urlsafe);
}
