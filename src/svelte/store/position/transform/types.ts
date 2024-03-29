import type { Mat4, Vec3 }       from '#runtime/math/gl-matrix';

import type { TJSPositionData }  from '../TJSPositionData.js';

interface ITransformAPI
{
   /**
    * @returns {boolean} Whether there are active transforms in local data.
    */
   get isActive(): boolean;

   /**
    * @returns {number | undefined} Any local `rotateX` data.
    */
   get rotateX(): number | undefined;

   /**
    * @returns {number | undefined} Any local `rotateY` data.
    */
   get rotateY(): number | undefined;

   /**
    * @returns {number | undefined} Any local `rotateZ` data.
    */
   get rotateZ(): number | undefined;

   /**
    * @returns {number | undefined} Any local `scale` data.
    */
   get scale(): number | undefined;

   /**
    * @returns {number | undefined} Any local `translateX` data.
    */
   get translateX(): number | undefined;

   /**
    * @returns {number | undefined} Any local `translateY` data.
    */
   get translateY(): number | undefined;

   /**
    * @returns {number | undefined} Any local `translateZ` data.
    */
   get translateZ(): number | undefined;

   /**
    * Sets the local `rotateX` data if the value is a finite number otherwise removes the local data.
    *
    * @param {number | null | undefined}   value - A value to set.
    */
   set rotateX(value: number | null | undefined);

   /**
    * Sets the local `rotateY` data if the value is a finite number otherwise removes the local data.
    *
    * @param {number | null | undefined}   value - A value to set.
    */
   set rotateY(value: number | null | undefined);

   /**
    * Sets the local `rotateZ` data if the value is a finite number otherwise removes the local data.
    *
    * @param {number | null | undefined}   value - A value to set.
    */
   set rotateZ(value: number | null | undefined);

   /**
    * Sets the local `scale` data if the value is a finite number otherwise removes the local data.
    *
    * @param {number | null | undefined}   value - A value to set.
    */
   set scale(value: number | null | undefined);

   /**
    * Sets the local `translateX` data if the value is a finite number otherwise removes the local data.
    *
    * @param {number | null | undefined}   value - A value to set.
    */
   set translateX(value: number | null | undefined);

   /**
    * Sets the local `translateY` data if the value is a finite number otherwise removes the local data.
    *
    * @param {number | null | undefined}   value - A value to set.
    */
   set translateY(value: number | null | undefined);

   /**
    * Sets the local `translateZ` data if the value is a finite number otherwise removes the local data.
    *
    * @param {number | null | undefined}   value - A value to set.
    */
   set translateZ(value: number | null | undefined);

   /**
    * Returns the `matrix3d` CSS transform for the given position / transform data.
    *
    * @param {object} [data] - Optional position data otherwise use local stored transform data.
    *
    * @returns {string} The CSS `matrix3d` string.
    */
   getCSS(data?: object): string;

   /**
    * Returns the `matrix3d` CSS transform for the given position / transform data.
    *
    * @param {object} [data] - Optional position data otherwise use local stored transform data.
    *
    * @returns {string} The CSS `matrix3d` string.
    */
   getCSSOrtho(data?: object): string;

   /**
    * Collects all data including a bounding rect, transform matrix, and points array of the given
    * {@link TJSPositionData} instance with the applied local transform data.
    *
    * @param {TJSPositionData} position - The position data to process.
    *
    * @param {ITransformAPI.ITransformData} [output] - Optional ITransformAPI.Data output instance.
    *
    * @param {object} [validationData] - Optional validation data for adjustment parameters.
    *
    * @returns {ITransformAPI.ITransformData} The output ITransformAPI.Data instance.
    */
   getData(position: TJSPositionData, output?: ITransformAPI.ITransformData, validationData?: object):
    ITransformAPI.ITransformData;

   /**
    * Creates a transform matrix based on local data applied in order it was added.
    *
    * If no data object is provided then the source is the local transform data. If another data object is supplied
    * then the stored local transform order is applied then all remaining transform keys are applied. This allows the
    * construction of a transform matrix in advance of setting local data and is useful in collision detection.
    *
    * @param {object}   [data] - TJSPositionData instance or local transform data.
    *
    * @param {Mat4}  [output] - The output mat4 instance.
    *
    * @returns {Mat4} Transform matrix.
    */
   getMat4(data?: object, output?: Mat4): Mat4;

   /**
    * Provides an orthographic enhancement to convert left / top positional data to a translate operation.
    *
    * This transform matrix takes into account that the remaining operations are , but adds any left / top attributes
    * from passed in data to translate X / Y.
    *
    * If no data object is provided then the source is the local transform data. If another data object is supplied
    * then the stored local transform order is applied then all remaining transform keys are applied. This allows the
    * construction of a transform matrix in advance of setting local data and is useful in collision detection.
    *
    * @param {object}   [data] - TJSPositionData instance or local transform data.
    *
    * @param {Mat4}  [output] - The output mat4 instance.
    *
    * @returns {Mat4} Transform matrix.
    */
   getMat4Ortho(data?: object, output?: Mat4): Mat4;

   /**
    * Tests an object if it contains transform keys and the values are finite numbers.
    *
    * @param {object} data - An object to test for transform data.
    *
    * @returns {boolean} Whether the given TJSPositionData has transforms.
    */
   hasTransform(data: object): boolean;

   /**
    * Resets internal data from the given object containing valid transform keys.
    *
    * @param {object}   data - An object with transform data.
    */
   reset(data: object): void;
}

/**
 * Provides additional interfaces and type aliases for the transform API.
 */
namespace ITransformAPI {
   /**
    * Describes the constructor function for {@link ITransformData}.
    */
   export interface ITransformDataConstructor {
      new (): ITransformData;
   }

   /**
    * Provides the output data for {@link ITransformAPI.getData}.
    */
   export interface ITransformData {
      /**
       * @returns {DOMRect} The bounding rectangle.
       */
      get boundingRect(): DOMRect;

      /**
       * @returns {Vec3[]} The transformed corner points as Vec3 in screen space.
       */
      get corners(): Vec3[]

      /**
       * @returns {string} Returns the CSS style string for the transform matrix.
       */
      get css(): string;

      /**
       * @returns {Mat4} The transform matrix.
       */
      get mat4(): Mat4;

      /**
       * @returns {Mat4[]} The pre / post translation matrices for origin translation.
       */
      get originTranslations(): Mat4[]
   }

   /**
    * The supported transform origin strings.
    */
   export type TransformOrigin = 'top left' |
    'top center' |
    'top right' |
    'center left' |
    'center' |
    'center right' |
    'bottom left' |
    'bottom center' |
    'bottom right';
}

export { ITransformAPI }
