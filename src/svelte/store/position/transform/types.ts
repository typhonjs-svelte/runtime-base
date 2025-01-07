import type { Writable }           from 'svelte/store';

import type { Mat4, Vec3 }    from '#runtime/math/gl-matrix';

import type { Data }          from '../data/types';

interface TransformAPI
{
   /**
    * @returns {boolean} Whether there are active transforms in local data.
    */
   get isActive(): boolean;

   /**
    * @returns {number | null} Any local `rotateX` data.
    */
   get rotateX(): number | null | undefined;

   /**
    * @returns {number | null} Any local `rotateY` data.
    */
   get rotateY(): number | null | undefined;

   /**
    * @returns {number | null} Any local `rotateZ` data.
    */
   get rotateZ(): number | null | undefined;

   /**
    * @returns {number | null} Any local `scale` data.
    */
   get scale(): number | null | undefined;

   /**
    * @returns {number | null} Any local `translateX` data.
    */
   get translateX(): number | null | undefined;

   /**
    * @returns {number | null} Any local `translateY` data.
    */
   get translateY(): number | null | undefined;

   /**
    * @returns {number | null} Any local `translateZ` data.
    */
   get translateZ(): number | null | undefined;

   /**
    * Sets the local `rotateX` data if the value is a finite number otherwise removes the local data.
    *
    * @param {number | null}   value - A value to set.
    */
   set rotateX(value: number | null | undefined);

   /**
    * Sets the local `rotateY` data if the value is a finite number otherwise removes the local data.
    *
    * @param {number | null}   value - A value to set.
    */
   set rotateY(value: number | null | undefined);

   /**
    * Sets the local `rotateZ` data if the value is a finite number otherwise removes the local data.
    *
    * @param {number | null}   value - A value to set.
    */
   set rotateZ(value: number | null | undefined);

   /**
    * Sets the local `scale` data if the value is a finite number otherwise removes the local data.
    *
    * @param {number | null}   value - A value to set.
    */
   set scale(value: number | null | undefined);

   /**
    * Sets the local `translateX` data if the value is a finite number otherwise removes the local data.
    *
    * @param {number | null}   value - A value to set.
    */
   set translateX(value: number | null | undefined);

   /**
    * Sets the local `translateY` data if the value is a finite number otherwise removes the local data.
    *
    * @param {number | null}   value - A value to set.
    */
   set translateY(value: number | null | undefined);

   /**
    * Sets the local `translateZ` data if the value is a finite number otherwise removes the local data.
    *
    * @param {number | null}   value - A value to set.
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
    * @param position - The position data converted to numeric values to process.
    *
    * @param [output] - Optional TransformAPI.TransformData output instance.
    *
    * @param [validationData] - Optional validation data for adjustment parameters.
    *
    * @returns The output TransformAPI.Data instance.
    */
   getData(position: Data.TJSPositionData, output?: TransformAPI.TransformData,
           validationData?: object): TransformAPI.TransformData;

   /**
    * Creates a transform matrix based on local data applied in order it was added.
    *
    * If no data object is provided then the source is the local transform data. If another data object is supplied
    * then the stored local transform order is applied then all remaining transform keys are applied. This allows the
    * construction of a transform matrix in advance of setting local data and is useful in collision detection.
    *
    * @param {Data.TJSPositionData}   [data] - TJSPositionData instance or local transform data.
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
    * @param {Data.TJSPositionData}   [data] - TJSPositionData instance or local transform data.
    *
    * @param {Mat4}  [output] - The output mat4 instance.
    *
    * @returns {Mat4} Transform matrix.
    */
   getMat4Ortho(data?: object, output?: Mat4): Mat4;

   /**
    * Tests an object if it contains transform keys and the values are finite numbers.
    *
    * @param {Data.TJSPositionData} data - An object to test for transform data.
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
declare namespace TransformAPI {
   /**
    * Describes the constructor function for {@link TransformData}.
    */
   export interface TransformDataConstructor {
      new (): TransformData;
   }

   /**
    * Provides the output data for {@link TransformAPI.getData}.
    */
   export interface TransformData {
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

   /**
    * Provides a custom writable for the `transformOrigin` store adding a read only property `values` that
    * contains a list of all transform origin values.
    */
   export interface TransformOriginWritable extends Writable<TransformOrigin>
   {
      get values(): Readonly<TransformOrigin[]>;
   }
}

export { TransformAPI }
