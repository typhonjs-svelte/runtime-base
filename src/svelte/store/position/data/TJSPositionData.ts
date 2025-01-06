import type { TJSPositionNS } from '../types';

/**
 * Defines stored positional data.
 */
export class TJSPositionData implements TJSPositionNS.Data.TJSPositionData
{
   height: number | 'auto' | 'inherit' | null;
   left: number | null;
   maxHeight: number | null;
   maxWidth: number | null;
   minHeight: number | null;
   minWidth: number | null;
   rotateX: number | null;
   rotateY: number | null;
   rotateZ: number | null;
   scale: number | null;

   top: number | null;

   transformOrigin: TJSPositionNS.API.Transform.TransformOrigin | null;

   translateX: number | null;
   translateY: number | null;
   translateZ: number | null;

   width: number | 'auto' | 'inherit' | null

   zIndex: number | null;

   // Aliases -----------------------------------------------------------------------------------------------------
   rotation: number | null

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
    * @param {import('../types').TJSPositionNS.API.Transform.TransformOrigin | null} [opts.transformOrigin] -
    *
    * @param {number | 'auto' | 'inherit' | null} [opts.width] -
    *
    * @param {number | null} [opts.zIndex] -
    *
    * @param {number | null} [opts.rotation] - Alias for `rotateZ`.
    */
   constructor({ height = null, left = null, maxHeight = null, maxWidth = null, minHeight = null,
    minWidth = null, rotateX = null, rotateY = null, rotateZ = null, scale = null, translateX = null,
     translateY = null, translateZ = null, top = null, transformOrigin = null, width = null, zIndex = null,
      rotation = null }:
   { height?: number | 'auto' | 'inherit' | null; left?: number | null; maxHeight?: number | null;
      maxWidth?: number | null; minHeight?: number | null; minWidth?: number | null; rotateX?: number | null;
       rotateY?: number | null; rotateZ?: number | null; scale?: number | null; translateX?: number | null;
        translateY?: number | null; translateZ?: number | null; top?: number | null;
         transformOrigin?: TJSPositionNS.API.Transform.TransformOrigin | null;
          width?: number | 'auto' | 'inherit' | null; zIndex?: number | null; rotation?: number | null
   } = {})
   {
      this.height = height;
      this.left = left;
      this.maxHeight = maxHeight;
      this.maxWidth = maxWidth;
      this.minHeight = minHeight;
      this.minWidth = minWidth;
      this.rotateX = rotateX;
      this.rotateY = rotateY;
      this.rotateZ = rotateZ;
      this.scale = scale;
      this.top = top;

      this.transformOrigin = transformOrigin;

      this.translateX = translateX;
      this.translateY = translateY;
      this.translateZ = translateZ;

      this.width = width;

      this.zIndex = zIndex;

      // Aliases -----------------------------------------------------------------------------------------------------

      this.rotation = rotation; // Alias for `rotateZ`.
   }
}
