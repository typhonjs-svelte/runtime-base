import type { Data }          from './types';
import type { TransformAPI }  from '../transform/types';

/**
 * Defines stored positional data.
 */
export class TJSPositionData implements Data.TJSPositionData
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

   transformOrigin: TransformAPI.TransformOrigin | null;

   translateX: number | null;
   translateY: number | null;
   translateZ: number | null;

   width: number | 'auto' | 'inherit' | null

   zIndex: number | null;

   // Aliases --------------------------------------------------------------------------------------------------------

   rotation: number | null

   /**
    * @param [opts] - Options.
    *
    * @param [opts.height] -
    *
    * @param [opts.left] -
    *
    * @param [opts.maxHeight] -
    *
    * @param [opts.maxWidth] -
    *
    * @param [opts.minHeight] -
    *
    * @param [opts.minWidth] -
    *
    * @param [opts.rotateX] -
    *
    * @param [opts.rotateY] -
    *
    * @param [opts.rotateZ] -
    *
    * @param [opts.scale] -
    *
    * @param [opts.translateX] -
    *
    * @param [opts.translateY] -
    *
    * @param [opts.translateZ] -
    *
    * @param [opts.top] -
    *
    * @param [opts.transformOrigin] -
    *
    * @param [opts.width] -
    *
    * @param [opts.zIndex] -
    *
    * @param [opts.rotation] - Alias for `rotateZ`.
    */
   constructor({ height = null, left = null, maxHeight = null, maxWidth = null, minHeight = null,
    minWidth = null, rotateX = null, rotateY = null, rotateZ = null, scale = null, translateX = null,
     translateY = null, translateZ = null, top = null, transformOrigin = null, width = null, zIndex = null,
      rotation = null }:
   { height?: number | 'auto' | 'inherit' | null; left?: number | null; maxHeight?: number | null;
      maxWidth?: number | null; minHeight?: number | null; minWidth?: number | null; rotateX?: number | null;
       rotateY?: number | null; rotateZ?: number | null; scale?: number | null; translateX?: number | null;
        translateY?: number | null; translateZ?: number | null; top?: number | null;
         transformOrigin?: TransformAPI.TransformOrigin | null;
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
