import { clamp }              from '#runtime/math/util';

import { SystemBase }         from '../SystemBase.js';
import { TJSTransformData }   from '../../transform/TJSTransformData.js';

export class TransformBounds extends SystemBase
{
   static #TRANSFORM_DATA = new TJSTransformData();

   /**
    * Provides a validator that respects transforms in positional data constraining the position to within the target
    * elements bounds.
    *
    * @param {import('./types').ValidatorAPI.ValidationData}   valData - The associated validation data for position
    *        updates.
    *
    * @returns {import('../../data/types').Data.TJSPositionData} Potentially adjusted position data.
    */
   validate(valData)
   {
      // Early out if element is undefined or local enabled state is false.
      if (!this.enabled) { return valData.position; }

      // Determine containing bounds from manual values; or any element; lastly the browser width / height.
      const boundsWidth = this.width ?? this.element?.offsetWidth ?? globalThis.innerWidth;
      const boundsHeight = this.height ?? this.element?.offsetHeight ?? globalThis.innerHeight;

      // Ensure min / max width constraints when position width is a number; not 'auto' or 'inherit'. If constrain is
      // true cap width bounds.
      if (typeof valData.position.width === 'number')
      {
         const maxW = valData.maxWidth ?? (this.constrain ? boundsWidth : Number.MAX_SAFE_INTEGER);
         valData.position.width = clamp(valData.width, valData.minWidth, maxW);
      }

      // Ensure min / max height constraints when position height is a number; not 'auto' or 'inherit'. If constrain
      // is true cap height bounds.
      if (typeof valData.position.height === 'number')
      {
         const maxH = valData.maxHeight ?? (this.constrain ? boundsHeight : Number.MAX_SAFE_INTEGER);
         valData.position.height = clamp(valData.height, valData.minHeight, maxH);
      }

      // Get transform data. First set constraints including any margin top / left as offsets and width / height. Used
      // when position width / height is 'auto'.
      const data = valData.transforms.getData(valData.position, TransformBounds.#TRANSFORM_DATA, valData);

      // Check the bounding rectangle against browser height / width. Adjust position based on how far the overlap of
      // the bounding rect is outside the bounds height / width. The order below matters as the constraints are top /
      // left oriented, so perform those checks last.

      const initialX = data.boundingRect.x;
      const initialY = data.boundingRect.y;

      if (data.boundingRect.bottom + valData.marginTop > boundsHeight)
      {
         data.boundingRect.y += boundsHeight - data.boundingRect.bottom - valData.marginTop;
      }

      if (data.boundingRect.right + valData.marginLeft > boundsWidth)
      {
         data.boundingRect.x += boundsWidth - data.boundingRect.right - valData.marginLeft;
      }

      if (data.boundingRect.top - valData.marginTop < 0)
      {
         data.boundingRect.y += Math.abs(data.boundingRect.top - valData.marginTop);
      }

      if (data.boundingRect.left - valData.marginLeft < 0)
      {
         data.boundingRect.x += Math.abs(data.boundingRect.left - valData.marginLeft);
      }

      valData.position.left -= initialX - data.boundingRect.x;
      valData.position.top -= initialY - data.boundingRect.y;

      return valData.position;
   }
}
