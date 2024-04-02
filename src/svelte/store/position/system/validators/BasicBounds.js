import { clamp }        from '#runtime/math/util';

import { SystemBase }   from '../SystemBase.js';

export class BasicBounds extends SystemBase
{
   /**
    * Provides a validator that respects transforms in positional data constraining the position to within the target
    * elements bounds.
    *
    * @param {import('./types').IValidatorAPI.ValidationData}   valData - The associated validation data for position
    *        updates.
    *
    * @returns {import('../../').TJSPositionData} Potentially adjusted position data.
    */
   validator(valData)
   {
      // Early out if element is undefined or local enabled state is false.
      if (!this.enabled) { return valData.position; }

      // Determine containing bounds from manual values; or any element; lastly the browser width / height.
      const boundsWidth = this.width ?? this.element?.offsetWidth ?? globalThis.innerWidth;
      const boundsHeight = this.height ?? this.element?.offsetHeight ?? globalThis.innerHeight;

      if (typeof valData.position.width === 'number')
      {
         const maxW = valData.maxWidth ?? (this.constrain ? boundsWidth : Number.MAX_SAFE_INTEGER);
         valData.position.width = valData.width = clamp(valData.position.width, valData.minWidth, maxW);

         if ((valData.width + valData.position.left + valData.marginLeft) > boundsWidth)
         {
            valData.position.left = boundsWidth - valData.width - valData.marginLeft;
         }
      }

      if (typeof valData.position.height === 'number')
      {
         const maxH = valData.maxHeight ?? (this.constrain ? boundsHeight : Number.MAX_SAFE_INTEGER);
         valData.position.height = valData.height = clamp(valData.position.height, valData.minHeight, maxH);

         if ((valData.height + valData.position.top + valData.marginTop) > boundsHeight)
         {
            valData.position.top = boundsHeight - valData.height - valData.marginTop;
         }
      }

      const maxL = Math.max(boundsWidth - valData.width - valData.marginLeft, 0);
      valData.position.left = Math.round(clamp(valData.position.left, 0, maxL));

      const maxT = Math.max(boundsHeight - valData.height - valData.marginTop, 0);
      valData.position.top = Math.round(clamp(valData.position.top, 0, maxT));

      return valData.position;
   }
}
