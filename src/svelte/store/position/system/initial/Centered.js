import { SystemBase } from '../SystemBase.js';

/**
 * Provides a {@link System.Initial.InitialSystem} implementation to center an element being positioned.
 *
 * @implements {import('../types').System.Initial.InitialSystem}
 */
export class Centered extends SystemBase
{
   /**
    * Get the left constraint based on any manual target values or the browser inner width.
    *
    * @param {number}   width - Target width.
    *
    * @returns {number} Calculated left constraint.
    */
   getLeft(width)
   {
      // Determine containing bounds from manual values; or any element; lastly the browser width / height.
      const boundsWidth = this.width ?? this.element?.offsetWidth ?? globalThis.innerWidth;

      return (boundsWidth - width) / 2;
   }

   /**
    * Get the top constraint based on any manual target values or the browser inner height.
    *
    * @param {number}   height - Target height.
    *
    * @returns {number} Calculated top constraint.
    */
   getTop(height)
   {
      const boundsHeight = this.height ?? this.element?.offsetHeight ?? globalThis.innerHeight;

      return (boundsHeight - height) / 2;
   }
}
