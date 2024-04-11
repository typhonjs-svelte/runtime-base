import type { TransformAPI } from '../transform/types';
import type { TJSPosition }   from '../TJSPosition';

/**
 * Defines the data objects / interfaces used by various TJSPosition APIs.
 */
namespace Data {
   /**
    * Defines the primary TJSPosition data object used by various TJSPosition APIs. To externally create a new instance
    * use the static accessor {@link TJSPosition.Data}.
    */
   export interface TJSPositionData {
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

      width: number | 'auto' | 'inherit' | null;

      zIndex: number | null;
   }

   /**
    * Defines a TJSPositionData instance that has extra properties / attributes.
    */
   export interface TJSPositionDataExtra extends TJSPositionData {
      [key: string]: any;
   }

   /**
    * Defines the constructor function for {@link TJSPositionData}.
    */
   export interface TJSPositionDataConstructor {
      new ({ height, left, maxHeight, maxWidth, minHeight, minWidth, rotateX, rotateY, rotateZ, scale, translateX,
        translateY, translateZ, top, transformOrigin, width, zIndex }?: {
         height?: number | 'auto' | 'inherit' | null,
         left?: number | null,
         maxHeight?: number | null,
         maxWidth?: number | null,
         minHeight?: number | null,
         minWidth?: number | null,
         rotateX?: number | null,
         rotateY?: number | null,
         rotateZ?: number | null,
         scale?: number | null,
         top?: number | null,
         transformOrigin?: TransformAPI.TransformOrigin | null,
         translateX?: number | null,
         translateY?: number | null,
         translateZ?: number | null,
         width?: number | 'auto' | 'inherit' | null,
         zIndex?: number | null,
      }): TJSPositionData;
   }
}

export { Data };
