import type { TransformAPI } from '../transform/types';
import type { AnimationAPI } from '../animation/types';

/**
 * Defines the data objects / interfaces used by various TJSPosition APIs.
 */
declare namespace DataAPI {
   /**
    * Defines the primary TJSPosition data object used by various TJSPosition APIs. To externally create a new instance
    * use the static accessor `TJSPosition.Data`.
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
   export interface TJSPositionDataExtra extends Partial<TJSPositionData> {
      [key: string]: any;
   }

   /**
    * Defines the keys in `TJSPositionData` that are transform keys.
    */
   type TransformKeys = 'rotateX' | 'rotateY' | 'rotateZ' | 'scale' | 'translateX' | 'translateY' | 'translateZ';

   /**
    * Defines an extension to {@link DataAPI.TJSPositionData} where each animatable property defined by
    * {@link AnimationAPI.AnimationKey} can also be a string. Relative adjustments to animatable properties should be
    * a string the form of '+=', '-=', or '*=' and float / numeric value. IE '+=0.2'. {@link TJSPosition.set} will
    * apply the `addition`, `subtraction`, or `multiplication` operation specified against the current value of the
    * given property. Various unit types are also supported including: `%`, `%~`, `px`, `rad`, `turn`:
    *
    * ```
    * - `no unit type` - The natural value for each property is adjusted which may be `px` for properties like `width`
    * or degrees for rotation based properties.
    *
    * - `%`: Properties such as `width` are calculated against the parent elements client bounds. Other properties such
    * as rotation are a percentage bound by 360 degrees.
    *
    * - `%~`: Relative percentage. Properties are calculated as a percentage of the current value of the property.
    * IE `width: '150%~` results in `150%` of the current width value.
    *
    * - `px`: Only properties that support `px` will be adjusted all other properties like rotation will be rejected
    * with a warning.
    *
    * - `rad`: Only rotation properties may be specified and the rotation is performed in `radians`.
    *
    * - `turn`: Only rotation properties may be specified and rotation is performed in respect to the `turn` CSS
    * specification. `1turn` is 360 degrees. `0.25turn` is 90 degrees.
    * ```
    *
    * Additional properties may be added that are not specified by {@link TJSPositionData} and are forwarded through
    * {@link System.Validator.API.ValidationData} as the `rest` property allowing extra data to be sent to any
    * custom validator.
    */
   export type TJSPositionDataRelative = Partial<{
      // Map only the keys that are animatable to either their original type or as a string.
      [P in keyof TJSPositionData as P extends AnimationAPI.AnimationKey ? P : never]:
       TJSPositionData[P] | string;
   } & {
      // Include all other keys from TJSPositionData unchanged.
      [P in keyof TJSPositionData as P extends AnimationAPI.AnimationKey ? never : P]:
       TJSPositionData[P];
   }> & {
      // Allow any additional properties not originally part of TJSPositionData that are forwarded through
      // validation.
      [key: string]: any;
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

export { DataAPI };
