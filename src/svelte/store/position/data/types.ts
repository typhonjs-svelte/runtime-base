import type { AnimationAPI } from '../animation/types';
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

      // Aliases -----------------------------------------------------------------------------------------------------

      rotation: number | null; // Alias for `rotateZ`.
   }

   /**
    * Defines a TJSPositionData instance that has extra properties / attributes.
    */
   export interface TJSPositionDataExtra extends TJSPositionData {
      [key: string]: any;
   }

   /**
    * Defines an extension to {@link Data.TJSPositionData} where each animatable property defined by
    * {@link AnimationAPI.AnimationKeys} can also be a relative string. This string should be in the form of '+=', '-=',
    * or '*=' and float / numeric value. IE '+=0.2'. {@link TJSPosition.set} will apply the `addition`, `subtraction`,
    * or `multiplication` operation specified against the current value of the given property.
    */
   export type TJSPositionDataRelative = {
      [P in keyof TJSPositionData as P extends AnimationAPI.AnimationKeys ? P : never]: TJSPositionData[P] | string;
   } & {
      [P in keyof TJSPositionData as P extends AnimationAPI.AnimationKeys ? never : P]: TJSPositionData[P];
   };

   /**
    * Defines the constructor function for {@link TJSPositionData}.
    */
   export interface TJSPositionDataConstructor {
      new ({ height, left, maxHeight, maxWidth, minHeight, minWidth, rotateX, rotateY, rotateZ, scale, translateX,
        translateY, translateZ, top, transformOrigin, width, zIndex, rotation }?: {
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
         rotation?: number | null
      }): TJSPositionData;
   }
}

export { Data };
