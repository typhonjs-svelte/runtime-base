/**
 * Defines stored positional data.
 *
 * @implements {import('./types').Data.TJSPositionData}
 */
export class TJSPositionData
{
   /**
    * @param {object} [opts] - Options.
    *
    * @param {number | 'auto' | 'inherit' | null} [opts.height] -
    *
    * @param {number | null} [opts.left] -
    *
    * @param {number | null} [opts.maxHeight] -
    *
    * @param {number | null} [opts.maxWidth] -
    *
    * @param {number | null} [opts.minHeight] -
    *
    * @param {number | null} [opts.minWidth] -
    *
    * @param {number | null} [opts.rotateX] -
    *
    * @param {number | null} [opts.rotateY] -
    *
    * @param {number | null} [opts.rotateZ] -
    *
    * @param {number | null} [opts.scale] -
    *
    * @param {number | null} [opts.translateX] -
    *
    * @param {number | null} [opts.translateY] -
    *
    * @param {number | null} [opts.translateZ] -
    *
    * @param {number | null} [opts.top] -
    *
    * @param {import('../transform/types').TransformAPI.TransformOrigin | null} [opts.transformOrigin] -
    *
    * @param {number | 'auto' | 'inherit' | null} [opts.width] -
    *
    * @param {number | null} [opts.zIndex] -
    */
   constructor({ height = null, left = null, maxHeight = null, maxWidth = null, minHeight = null, minWidth = null,
    rotateX = null, rotateY = null, rotateZ = null, scale = null, translateX = null, translateY = null,
     translateZ = null, top = null, transformOrigin = null, width = null, zIndex = null } = {})
   {
      /** @type {number | 'auto' | 'inherit' | null} */
      this.height = height;

      /** @type {number | null} */
      this.left = left;

      /** @type {number | null} */
      this.maxHeight = maxHeight;

      /** @type {number | null} */
      this.maxWidth = maxWidth;

      /** @type {number | null} */
      this.minHeight = minHeight;

      /** @type {number | null} */
      this.minWidth = minWidth;

      /** @type {number | null} */
      this.rotateX = rotateX;

      /** @type {number | null} */
      this.rotateY = rotateY;

      /** @type {number | null} */
      this.rotateZ = rotateZ;

      /** @type {number | null} */
      this.scale = scale;

      /** @type {number | null} */
      this.top = top;

      /** @type {import('../transform/types').TransformAPI.TransformOrigin | null} */
      this.transformOrigin = transformOrigin;

      /** @type {number | null} */
      this.translateX = translateX;

      /** @type {number | null} */
      this.translateY = translateY;

      /** @type {number | null} */
      this.translateZ = translateZ;

      /** @type {number | 'auto' | 'inherit' | null} */
      this.width = width;

      /** @type {number | null} */
      this.zIndex = zIndex;
   }
}
