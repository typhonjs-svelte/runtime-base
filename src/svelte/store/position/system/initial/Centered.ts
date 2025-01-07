import { SystemBase }         from '../SystemBase';

import type { System }        from '../types';

/**
 * Provides a {@link System.Initial.InitialSystem} implementation to center an element being positioned.
 */
export class Centered extends SystemBase implements System.Initial.InitialSystem
{
   /**
    * Get the left constraint based on any manual target values or the browser inner width.
    *
    * @param width - Target width.
    *
    * @returns Calculated left constraint.
    */
   getLeft(width: number): number
   {
      // Determine containing bounds from manual values; or any element; lastly the browser width / height.
      const boundsWidth: number = this.width ?? this.element?.offsetWidth ?? globalThis.innerWidth;

      return (boundsWidth - width) / 2;
   }

   /**
    * Get the top constraint based on any manual target values or the browser inner height.
    *
    * @param height - Target height.
    *
    * @returns Calculated top constraint.
    */
   getTop(height: number): number
   {
      const boundsHeight: number = this.height ?? this.element?.offsetHeight ?? globalThis.innerHeight;

      return (boundsHeight - height) / 2;
   }
}
