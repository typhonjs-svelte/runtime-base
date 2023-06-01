import * as _runtime_data_compress from '@typhonjs-svelte/runtime-base/data/compress';

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
declare function inflateAndUnpack(data: Uint8Array, { inflateOptions }?: {
    inflateOptions?: _runtime_data_compress.InflateOptions;
}): any;

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
declare function inflateAndUnpackB64(data: string, { inflateOptions }?: {
    inflateOptions?: _runtime_data_compress.InflateOptions;
}): any;

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
declare function packAndDeflate(data: any, { deflateOptions }?: {
    deflateOptions?: _runtime_data_compress.DeflateOptions;
}): Uint8Array;

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
declare function packAndDeflateB64(data: any, { deflateOptions, urlsafe }?: {
    deflateOptions?: _runtime_data_compress.DeflateOptions;
    urlsafe?: boolean;
}): string;

export { inflateAndUnpack, inflateAndUnpackB64, packAndDeflate, packAndDeflateB64 };
