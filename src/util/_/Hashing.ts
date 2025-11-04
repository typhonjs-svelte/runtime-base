/**
 * Provides various utilities for generating hash codes for strings and UUIDs.
 */
export abstract class Hashing
{
   static #cryptoBuffer = new Uint8Array(1);

   static #regexUuidv4 = /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;

   static #regexUuidReplace = /[018]/g;

   static #uuidTemplate = '10000000-1000-4000-8000-100000000000';

   private constructor()
   {
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
   static hashCode(str: string, seed: number = 0): number
   {
      if (typeof str !== 'string') { return 0; }

      let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;

      for (let ch, i = 0; i < str.length; i++)
      {
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
   static isUuidv4(uuid: unknown): uuid is string
   {
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
   static uuidv4(): string
   {
      return this.#uuidTemplate.replace(this.#regexUuidReplace, (c: string) =>
       (Number(c) ^ (globalThis.crypto ?? (globalThis as any).msCrypto).getRandomValues(
        this.#cryptoBuffer)[0] & 15 >> Number(c) / 4).toString(16));
   }
}
