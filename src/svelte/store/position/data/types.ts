import { ITransformAPI } from '../transform/types';

namespace Data {
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

      transformOrigin: ITransformAPI.TransformOrigin | null;

      translateX: number | null;

      translateY: number | null;

      translateZ: number | null;

      width: number | 'auto' | 'inherit' | null;

      zIndex: number | null;
   }

   export interface TJSPositionDataExtra extends TJSPositionData {
      [key: string]: any;
   }

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
         transformOrigin?: ITransformAPI.TransformOrigin | null,
         translateX?: number | null,
         translateY?: number | null,
         translateZ?: number | null,
         width?: number | 'auto' | 'inherit' | null,
         zIndex?: number | null,
      }): TJSPositionData;
   }
}

export { Data };
