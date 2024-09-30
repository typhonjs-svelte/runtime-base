/**
 * Provides methods for retrieving pseudorandom values and other utilities using {@link Math.random}.
 */
export class MathRandom
{
   /**
    * Private constructor to prevent instantiation.
    *
    * @private
    */
   constructor()
   {
      throw new Error('This class should not be instantiated.');
   }

   /**
    * Returns a random inclusive integer.
    *
    * @param {number}   min - Minimum value.
    *
    * @param {number}   max - Maximum value.
    *
    * @returns {number} Random inclusive integer.
    */
   static getInt(min, max)
   {
      min = Math.ceil(min);
      max = Math.floor(max);

      return Math.floor(Math.random() * (max - min + 1)) + min;
   }

   /**
    * Returns a random floating point number between min (inclusive) and max (exclusive).
    *
    * @param {number}   min - Minimum value
    *
    * @param {number}   max - Maximum value.
    *
    * @returns {number} Random float.
    */
   static getFloat(min, max)
   {
      return Math.random() * (max - min) + min;
   }

   /**
    * Returns a random boolean.
    *
    * @returns {boolean} Random boolean.
    */
   static getBoolean()
   {
      return Math.random() > 0.5;
   }

   /**
    * Shuffles an array using the Fisher-Yates shuffle algorithm. Modifies the input array in place and returns it.
    *
    * @template T
    *
    * @param {T[]} arr - The array to shuffle.
    *
    * @returns {T[]} The shuffled array.
    */
   static shuffleArray(arr)
   {
      for (let i = arr.length - 1; i > 0; i--)
      {
         const j = MathRandom.getInt(0, i);
         [arr[i], arr[j]] = [arr[j], arr[i]];
      }

      return arr;
   }
}
