import { degToRad }              from '#runtime/math/util';
import { Mat4, Vec3 }            from '#runtime/math/gl-matrix';

import { TJSTransformData }      from './TJSTransformData';
import { MathGuard }             from '../util';

import type {
   Mat4Like,
   Vec3Like }                    from '#runtime/math/gl-matrix';

import type { TransformAPI }     from "./types";
import type { ValidationData }   from './types-local';

import type { DataAPI }             from '../data/types';

/**
 *
 */
export class TJSTransforms implements TransformAPI
{
   /**
    * Stores transform data.
    */
   #data: Partial<DataAPI.TJSPositionData> = {};

   /**
    * Stores the transform keys in the order added.
    */
   #orderList: string[] = [];

   /**
    * Defines the keys of TJSPositionData that are transform keys.
    */
   static #transformKeys: Readonly<Array<DataAPI.TransformKeys>> = Object.freeze([
      'rotateX', 'rotateY', 'rotateZ', 'scale', 'translateX', 'translateY', 'translateZ'
   ]);

   /**
    * Validates that a given key is a transform key.
    *
    * @param key - A potential transform key.
    */
   static #isTransformKey(key: string): key is DataAPI.TransformKeys
   {
      return this.#transformKeys.includes(key as DataAPI.TransformKeys);
   }

   /**
    * Defines bitwise keys for transforms used in {@link TJSTransforms.getMat4}.
    */
   static #transformKeysBitwise: Readonly<Record<string, number>> = Object.freeze({
      rotateX: 1,
      rotateY: 2,
      rotateZ: 4,
      scale: 8,
      translateX: 16,
      translateY: 32,
      translateZ: 64
   });

   /**
    * Defines the default transform origin.
    */
   static #transformOriginDefault: Readonly<TransformAPI.TransformOrigin> = 'top left';

   /**
    * Defines the valid transform origins.
    */
   static #transformOrigins: readonly TransformAPI.TransformOrigin[] = Object.freeze([
      'top left', 'top center', 'top right', 'center left', 'center', 'center right', 'bottom left', 'bottom center',
       'bottom right'
   ]);

   /**
    * Defines a valid Set of transform origins.
    */
   static #transformOriginsSet: ReadonlySet<string> = Object.freeze(new Set(this.#transformOrigins));

   // Temporary variables --------------------------------------------------------------------------------------------

   /**
    */
   static #mat4Result: Mat4 = Mat4.create();

   /**
    */
   static #mat4Temp: Mat4 = Mat4.create();

   /**
    */
   static #vec3Temp: Vec3 = Vec3.create();

   /**
    */
   static #vectorScale: Vec3Like = [1, 1, 1];

   /**
    */
   static #vectorTranslate: Vec3Like = [0, 0, 0];

   /**
    * Returns a list of supported transform origins.
    *
    * @returns The supported transform origin strings.
    */
   static get transformOrigins(): readonly TransformAPI.TransformOrigin[]
   {
      return this.#transformOrigins;
   }

   /**
    * Returns whether the given string is a {@link TransformAPI.TransformOrigin}.
    *
    * @param {string}  origin - A potential transform origin string.
    *
    * @returns True if origin is a TransformOrigin string.
    */
   static isTransformOrigin(origin: string): origin is TransformAPI.TransformOrigin
   {
      return this.#transformOriginsSet.has(origin);
   }

   /**
    * @returns Whether there are active transforms in local data.
    */
   get isActive(): boolean { return this.#orderList.length > 0; }

   /**
    * @returns Any local rotateX data.
    */
   get rotateX(): number | null | undefined { return this.#data.rotateX; }

   /**
    * @returns Any local rotateY data.
    */
   get rotateY(): number | null | undefined { return this.#data.rotateY; }

   /**
    * @returns Any local rotateZ data.
    */
   get rotateZ(): number | null | undefined { return this.#data.rotateZ; }

   /**
    * @returns Any local rotateZ scale.
    */
   get scale(): number | null | undefined { return this.#data.scale; }

   /**
    * @returns Any local translateZ data.
    */
   get translateX(): number | null | undefined { return this.#data.translateX; }

   /**
    * @returns Any local translateZ data.
    */
   get translateY(): number | null | undefined { return this.#data.translateY; }

   /**
    * @returns Any local translateZ data.
    */
   get translateZ(): number | null | undefined { return this.#data.translateZ; }

   /**
    * Sets the local rotateX data if the value is a finite number otherwise removes the local data.
    *
    * @param value - A value to set.
    */
   set rotateX(value: number | null | undefined)
   {
      if (Number.isFinite(value))
      {
         if (this.#data.rotateX === void 0) { this.#orderList.push('rotateX'); }

         this.#data.rotateX = value;
      }
      else
      {
         if (this.#data.rotateX !== void 0)
         {
            const index = this.#orderList.findIndex((entry) => entry === 'rotateX');
            if (index >= 0) { this.#orderList.splice(index, 1); }
         }

         delete this.#data.rotateX;
      }
   }

   /**
    * Sets the local rotateY data if the value is a finite number otherwise removes the local data.
    *
    * @param value - A value to set.
    */
   set rotateY(value: number | null | undefined)
   {
      if (Number.isFinite(value))
      {
         if (this.#data.rotateY === void 0) { this.#orderList.push('rotateY'); }

         this.#data.rotateY = value;
      }
      else
      {
         if (this.#data.rotateY !== void 0)
         {
            const index = this.#orderList.findIndex((entry) => entry === 'rotateY');
            if (index >= 0) { this.#orderList.splice(index, 1); }
         }

         delete this.#data.rotateY;
      }
   }

   /**
    * Sets the local rotateZ data if the value is a finite number otherwise removes the local data.
    *
    * @param value - A value to set.
    */
   set rotateZ(value: number | null | undefined)
   {
      if (Number.isFinite(value))
      {
         if (this.#data.rotateZ === void 0) { this.#orderList.push('rotateZ'); }

         this.#data.rotateZ = value;
      }

      else
      {
         if (this.#data.rotateZ !== void 0)
         {
            const index: number = this.#orderList.findIndex((entry: string): boolean => entry === 'rotateZ');
            if (index >= 0) { this.#orderList.splice(index, 1); }
         }

         delete this.#data.rotateZ;
      }
   }

   /**
    * Sets the local scale data if the value is a finite number otherwise removes the local data.
    *
    * @param value - A value to set.
    */
   set scale(value: number | null | undefined)
   {
      if (Number.isFinite(value))
      {
         if (this.#data.scale === void 0) { this.#orderList.push('scale'); }

         this.#data.scale = value;
      }
      else
      {
         if (this.#data.scale !== void 0)
         {
            const index: number = this.#orderList.findIndex((entry: string): boolean => entry === 'scale');
            if (index >= 0) { this.#orderList.splice(index, 1); }
         }

         delete this.#data.scale;
      }
   }

   /**
    * Sets the local translateX data if the value is a finite number otherwise removes the local data.
    *
    * @param value - A value to set.
    */
   set translateX(value: number | null | undefined)
   {
      if (Number.isFinite(value))
      {
         if (this.#data.translateX === void 0) { this.#orderList.push('translateX'); }

         this.#data.translateX = value;
      }

      else
      {
         if (this.#data.translateX !== void 0)
         {
            const index: number = this.#orderList.findIndex((entry: string): boolean => entry === 'translateX');
            if (index >= 0) { this.#orderList.splice(index, 1); }
         }

         delete this.#data.translateX;
      }
   }

   /**
    * Sets the local translateY data if the value is a finite number otherwise removes the local data.
    *
    * @param value - A value to set.
    */
   set translateY(value: number | null | undefined)
   {
      if (Number.isFinite(value))
      {
         if (this.#data.translateY === void 0) { this.#orderList.push('translateY'); }

         this.#data.translateY = value;
      }

      else
      {
         if (this.#data.translateY !== void 0)
         {
            const index: number = this.#orderList.findIndex((entry: string): boolean => entry === 'translateY');
            if (index >= 0) { this.#orderList.splice(index, 1); }
         }

         delete this.#data.translateY;
      }
   }

   /**
    * Sets the local translateZ data if the value is a finite number otherwise removes the local data.
    *
    * @param value - A value to set.
    */
   set translateZ(value: number | null | undefined)
   {
      if (Number.isFinite(value))
      {
         if (this.#data.translateZ === void 0) { this.#orderList.push('translateZ'); }

         this.#data.translateZ = value;
      }

      else
      {
         if (this.#data.translateZ !== void 0)
         {
            const index: number = this.#orderList.findIndex((entry: string): boolean => entry === 'translateZ');
            if (index >= 0) { this.#orderList.splice(index, 1); }
         }

         delete this.#data.translateZ;
      }
   }

   /**
    * Returns the `matrix3d` CSS transform for the given position / transform data.
    *
    * @param [data] - Optional position data otherwise use local stored transform data.
    *
    * @returns The CSS `matrix3d` string.
    */
   getCSS(data: Partial<DataAPI.TJSPositionData> = this.#data): string
   {
      return `matrix3d(${this.getMat4(data, TJSTransforms.#mat4Result).join(',')})`;
   }

   /**
    * Returns the `matrix3d` CSS transform for the given position / transform data.
    *
    * @param [data] - Optional position data otherwise use local stored transform data.
    *
    * @returns The CSS `matrix3d` string.
    */
   getCSSOrtho(data: Partial<DataAPI.TJSPositionData> = this.#data): string
   {
      return `matrix3d(${this.getMat4Ortho(data, TJSTransforms.#mat4Result).join(',')})`;
   }

   /**
    * Collects all data including a bounding rect, transform matrix, and points array of the given
    * {@link TJSPositionData} instance with the applied local transform data.
    *
    * @param position - The position data to process.
    *
    * @param [output] - Optional TJSTransformData output instance.
    *
    * @param [validationData] - Optional validation data for adjustment parameters.
    *
    * @returns The output TJSTransformData instance.
    */
   getData(position: DataAPI.TJSPositionData,
    output: TransformAPI.TransformData = new TJSTransformData(), validationData?: ValidationData):
     TransformAPI.TransformData
   {
      const valWidth: number = validationData?.width ?? 0;
      const valHeight: number = validationData?.height ?? 0;
      const valOffsetTop: number = validationData?.offsetTop ?? validationData?.marginTop ?? 0;
      const valOffsetLeft: number = validationData?.offsetLeft ?? validationData?.marginLeft ?? 0;

      position.top! += valOffsetTop;
      position.left! += valOffsetLeft;

      const width: number = MathGuard.isFinite(position.width) ? position.width : valWidth;
      const height: number = MathGuard.isFinite(position.height) ? position.height : valHeight;

      const rect: Vec3[] = output.corners;

      if (this.hasTransform(position))
      {
         rect[0][0] = rect[0][1] = rect[0][2] = 0;
         rect[1][0] = width;
         rect[1][1] = rect[1][2] = 0;
         rect[2][0] = width;
         rect[2][1] = height;
         rect[2][2] = 0;
         rect[3][0] = 0;
         rect[3][1] = height;
         rect[3][2] = 0;

         const matrix: Mat4Like = this.getMat4(position, output.mat4);

         const translate: Mat4[] = TJSTransforms.#getOriginTranslation(position.transformOrigin, width, height,
          output.originTranslations);

         if (TJSTransforms.#transformOriginDefault === position.transformOrigin)
         {
            Vec3.transformMat4(rect[0], rect[0], matrix);
            Vec3.transformMat4(rect[1], rect[1], matrix);
            Vec3.transformMat4(rect[2], rect[2], matrix);
            Vec3.transformMat4(rect[3], rect[3], matrix);
         }
         else
         {
            Vec3.transformMat4(rect[0], rect[0], translate[0]);
            Vec3.transformMat4(rect[0], rect[0], matrix);
            Vec3.transformMat4(rect[0], rect[0], translate[1]);

            Vec3.transformMat4(rect[1], rect[1], translate[0]);
            Vec3.transformMat4(rect[1], rect[1], matrix);
            Vec3.transformMat4(rect[1], rect[1], translate[1]);

            Vec3.transformMat4(rect[2], rect[2], translate[0]);
            Vec3.transformMat4(rect[2], rect[2], matrix);
            Vec3.transformMat4(rect[2], rect[2], translate[1]);

            Vec3.transformMat4(rect[3], rect[3], translate[0]);
            Vec3.transformMat4(rect[3], rect[3], matrix);
            Vec3.transformMat4(rect[3], rect[3], translate[1]);
         }

         rect[0][0] = position.left! + rect[0][0];
         rect[0][1] = position.top! + rect[0][1];
         rect[1][0] = position.left! + rect[1][0];
         rect[1][1] = position.top! + rect[1][1];
         rect[2][0] = position.left! + rect[2][0];
         rect[2][1] = position.top! + rect[2][1];
         rect[3][0] = position.left! + rect[3][0];
         rect[3][1] = position.top! + rect[3][1];
      }
      else
      {
         rect[0][0] = position.left!;
         rect[0][1] = position.top!;
         rect[1][0] = position.left! + width;
         rect[1][1] = position.top!;
         rect[2][0] = position.left! + width;
         rect[2][1] = position.top! + height;
         rect[3][0] = position.left!;
         rect[3][1] = position.top! + height;

         Mat4.identity(output.mat4);
      }

      let maxX: number = Number.MIN_SAFE_INTEGER;
      let maxY: number = Number.MIN_SAFE_INTEGER;
      let minX: number = Number.MAX_SAFE_INTEGER;
      let minY: number = Number.MAX_SAFE_INTEGER;

      for (let cntr: number = 4; --cntr >= 0;)
      {
         if (rect[cntr][0] > maxX) { maxX = rect[cntr][0]; }
         if (rect[cntr][0] < minX) { minX = rect[cntr][0]; }
         if (rect[cntr][1] > maxY) { maxY = rect[cntr][1]; }
         if (rect[cntr][1] < minY) { minY = rect[cntr][1]; }
      }

      const boundingRect = output.boundingRect;
      boundingRect.x = minX;
      boundingRect.y = minY;
      boundingRect.width = maxX - minX;
      boundingRect.height = maxY - minY;

      position.top! -= valOffsetTop;
      position.left! -= valOffsetLeft;

      return output;
   }

   /**
    * Creates a transform matrix based on local data applied in order it was added.
    *
    * If no data object is provided then the source is the local transform data. If another data object is supplied
    * then the stored local transform order is applied then all remaining transform keys are applied. This allows the
    * construction of a transform matrix in advance of setting local data and is useful in collision detection.
    *
    * @param [data] - TJSPositionData instance or local transform data.
    *
    * @param [output] - The output mat4 instance.
    *
    * @returns Transform matrix.
    */
   getMat4(data: Partial<DataAPI.TJSPositionData> = this.#data, output: Mat4 = Mat4.create()): Mat4
   {
      const matrix: Mat4 = Mat4.identity(output) as Mat4;

      // Bitwise tracks applied transform keys from local transform data.
      let seenKeys: number = 0;

      const orderList: string[] = this.#orderList;

      // First apply ordered transforms from local transform data.
      for (let cntr: number = 0; cntr < orderList.length; cntr++)
      {
         const key: string = orderList[cntr];

         switch (key)
         {
            case 'rotateX':
               seenKeys |= TJSTransforms.#transformKeysBitwise.rotateX;
               Mat4.multiply(matrix, matrix, Mat4.fromXRotation(TJSTransforms.#mat4Temp, degToRad(data[key] ?? 0)));
               break;

            case 'rotateY':
               seenKeys |= TJSTransforms.#transformKeysBitwise.rotateY;
               Mat4.multiply(matrix, matrix, Mat4.fromYRotation(TJSTransforms.#mat4Temp, degToRad(data[key] ?? 0)));
               break;

            case 'rotateZ':
               seenKeys |= TJSTransforms.#transformKeysBitwise.rotateZ;
               Mat4.multiply(matrix, matrix, Mat4.fromZRotation(TJSTransforms.#mat4Temp, degToRad(data[key] ?? 0)));
               break;

            case 'scale':
               seenKeys |= TJSTransforms.#transformKeysBitwise.scale;
               TJSTransforms.#vectorScale[0] = TJSTransforms.#vectorScale[1] = data[key] ?? 0;
               Mat4.multiply(matrix, matrix, Mat4.fromScaling(TJSTransforms.#mat4Temp, TJSTransforms.#vectorScale));
               break;

            case 'translateX':
               seenKeys |= TJSTransforms.#transformKeysBitwise.translateX;
               TJSTransforms.#vectorTranslate[0] = data.translateX ?? 0;
               TJSTransforms.#vectorTranslate[1] = 0;
               TJSTransforms.#vectorTranslate[2] = 0;
               Mat4.multiply(matrix, matrix, Mat4.fromTranslation(TJSTransforms.#mat4Temp,
                TJSTransforms.#vectorTranslate));
               break;

            case 'translateY':
               seenKeys |= TJSTransforms.#transformKeysBitwise.translateY;
               TJSTransforms.#vectorTranslate[0] = 0;
               TJSTransforms.#vectorTranslate[1] = data.translateY ?? 0;
               TJSTransforms.#vectorTranslate[2] = 0;
               Mat4.multiply(matrix, matrix, Mat4.fromTranslation(TJSTransforms.#mat4Temp,
                TJSTransforms.#vectorTranslate));
               break;

            case 'translateZ':
               seenKeys |= TJSTransforms.#transformKeysBitwise.translateZ;
               TJSTransforms.#vectorTranslate[0] = 0;
               TJSTransforms.#vectorTranslate[1] = 0;
               TJSTransforms.#vectorTranslate[2] = data.translateZ ?? 0;
               Mat4.multiply(matrix, matrix, Mat4.fromTranslation(TJSTransforms.#mat4Temp,
                TJSTransforms.#vectorTranslate));
               break;
         }
      }

      // Now apply any new keys not set in local transform data that have not been applied yet.
      if (data !== this.#data)
      {
         for (let cntr: number = 0; cntr < TJSTransforms.#transformKeys.length; cntr++)
         {
            const key: keyof DataAPI.TJSPositionData = TJSTransforms.#transformKeys[cntr];

            // Reject bad / no data or if the key has already been applied.
            // if (data[key] === null || (seenKeys & TJSTransforms.#transformKeysBitwise[key]) > 0) { continue; }
            if (data[key] === null || (seenKeys & TJSTransforms.#transformKeysBitwise[key]) > 0) { continue; }

            const value: number = data[key] as number;

            switch (key)
            {
               case 'rotateX':
                  Mat4.multiply(matrix, matrix, Mat4.fromXRotation(TJSTransforms.#mat4Temp, degToRad(value)));
                  break;

               case 'rotateY':
                  Mat4.multiply(matrix, matrix, Mat4.fromYRotation(TJSTransforms.#mat4Temp, degToRad(value)));
                  break;

               case 'rotateZ':
                  Mat4.multiply(matrix, matrix, Mat4.fromZRotation(TJSTransforms.#mat4Temp, degToRad(value)));
                  break;

               case 'scale':
                  TJSTransforms.#vectorScale[0] = TJSTransforms.#vectorScale[1] = value;
                  Mat4.multiply(matrix, matrix, Mat4.fromScaling(TJSTransforms.#mat4Temp, TJSTransforms.#vectorScale));
                  break;

               case 'translateX':
                  TJSTransforms.#vectorTranslate[0] = value;
                  TJSTransforms.#vectorTranslate[1] = 0;
                  TJSTransforms.#vectorTranslate[2] = 0;
                  Mat4.multiply(matrix, matrix, Mat4.fromTranslation(TJSTransforms.#mat4Temp,
                   TJSTransforms.#vectorTranslate));
                  break;

               case 'translateY':
                  TJSTransforms.#vectorTranslate[0] = 0;
                  TJSTransforms.#vectorTranslate[1] = value;
                  TJSTransforms.#vectorTranslate[2] = 0;
                  Mat4.multiply(matrix, matrix, Mat4.fromTranslation(TJSTransforms.#mat4Temp,
                   TJSTransforms.#vectorTranslate));
                  break;

               case 'translateZ':
                  TJSTransforms.#vectorTranslate[0] = 0;
                  TJSTransforms.#vectorTranslate[1] = 0;
                  TJSTransforms.#vectorTranslate[2] = value;
                  Mat4.multiply(matrix, matrix, Mat4.fromTranslation(TJSTransforms.#mat4Temp,
                   TJSTransforms.#vectorTranslate));
                  break;
            }
         }
      }

      return matrix;
   }

   /**
    * Provides an orthographic enhancement to convert left / top positional data to a translate operation.
    *
    * This transform matrix takes into account that the remaining operations are , but adds any left / top attributes from passed in data to
    * translate X / Y.
    *
    * If no data object is provided then the source is the local transform data. If another data object is supplied
    * then the stored local transform order is applied then all remaining transform keys are applied. This allows the
    * construction of a transform matrix in advance of setting local data and is useful in collision detection.
    *
    * @param [data] - TJSPositionData instance or local transform data.
    *
    * @param [output] - The output mat4 instance.
    *
    * @returns Transform matrix.
    */
   getMat4Ortho(data: Partial<DataAPI.TJSPositionData> = this.#data, output: Mat4 = Mat4.create()): Mat4
   {
      const matrix: Mat4 = Mat4.identity(output) as Mat4;

      // Attempt to retrieve values from passed in data otherwise default to 0.
      // Always perform the translation last regardless of order added to local transform data.
      // Add data.left to translateX and data.top to translateY.
      TJSTransforms.#vectorTranslate[0] = (data.left ?? 0) + (data.translateX ?? 0);
      TJSTransforms.#vectorTranslate[1] = (data.top ?? 0) + (data.translateY ?? 0);
      TJSTransforms.#vectorTranslate[2] = data.translateZ ?? 0;
      Mat4.multiply(matrix, matrix, Mat4.fromTranslation(TJSTransforms.#mat4Temp, TJSTransforms.#vectorTranslate));

      // Scale can also be applied out of order.
      if (data.scale !== null && data.scale !== void 0)
      {
         TJSTransforms.#vectorScale[0] = TJSTransforms.#vectorScale[1] = data.scale;
         Mat4.multiply(matrix, matrix, Mat4.fromScaling(TJSTransforms.#mat4Temp, TJSTransforms.#vectorScale));
      }

      // Early out if there is no rotation data.
      if (data.rotateX === null && data.rotateY === null && data.rotateZ === null) { return matrix; }

      // Rotation transforms must be applied in the order they are added.

      // Bitwise tracks applied transform keys from local transform data.
      let seenKeys: number = 0;

      const orderList: string[] = this.#orderList;

      // First apply ordered transforms from local transform data.
      for (let cntr: number = 0; cntr < orderList.length; cntr++)
      {
         const key: string = orderList[cntr];

         switch (key)
         {
            case 'rotateX':
               seenKeys |= TJSTransforms.#transformKeysBitwise.rotateX;
               Mat4.multiply(matrix, matrix, Mat4.fromXRotation(TJSTransforms.#mat4Temp, degToRad(data[key] ?? 0)));
               break;

            case 'rotateY':
               seenKeys |= TJSTransforms.#transformKeysBitwise.rotateY;
               Mat4.multiply(matrix, matrix, Mat4.fromYRotation(TJSTransforms.#mat4Temp, degToRad(data[key] ?? 0)));
               break;

            case 'rotateZ':
               seenKeys |= TJSTransforms.#transformKeysBitwise.rotateZ;
               Mat4.multiply(matrix, matrix, Mat4.fromZRotation(TJSTransforms.#mat4Temp, degToRad(data[key] ?? 0)));
               break;
         }
      }

      // Now apply any new keys not set in local transform data that have not been applied yet.
      if (data !== this.#data)
      {
         for (let cntr: number = 0; cntr < TJSTransforms.#transformKeys.length; cntr++)
         {
            const key: keyof DataAPI.TJSPositionData = TJSTransforms.#transformKeys[cntr];

            // Reject bad / no data or if the key has already been applied.
            if (data[key] === null || (seenKeys & TJSTransforms.#transformKeysBitwise[key]) > 0) { continue; }

            switch (key)
            {
               case 'rotateX':
                  Mat4.multiply(matrix, matrix, Mat4.fromXRotation(TJSTransforms.#mat4Temp, degToRad(data[key] ?? 0)));
                  break;

               case 'rotateY':
                  Mat4.multiply(matrix, matrix, Mat4.fromYRotation(TJSTransforms.#mat4Temp, degToRad(data[key] ?? 0)));
                  break;

               case 'rotateZ':
                  Mat4.multiply(matrix, matrix, Mat4.fromZRotation(TJSTransforms.#mat4Temp, degToRad(data[key] ?? 0)));
                  break;
            }
         }
      }

      return matrix;
   }

   /**
    * Tests an object if it contains transform keys and the values are finite numbers.
    *
    * @param data - An object to test for transform data.
    *
    * @returns Whether the given TJSPositionData has transforms.
    */
   hasTransform(data: Partial<DataAPI.TJSPositionData>): boolean
   {
      for (const key of TJSTransforms.#transformKeys)
      {
         if (Number.isFinite(data[key])) { return true; }
      }

      return false;
   }

   /**
    * Resets internal data from the given object containing valid transform keys.
    *
    * @param data - An object with transform data.
    */
   reset(data: { [key: string]: any } & Partial<DataAPI.TJSPositionData>): void
   {
      for (const key in data)
      {
         if (TJSTransforms.#isTransformKey(key))
         {
            const value: any = data[key];

            if (MathGuard.isFinite(value))
            {
               this.#data[key] = value;
            }
            else
            {
               const index: number = this.#orderList.findIndex((entry: string): boolean => entry === key);
               if (index >= 0) { this.#orderList.splice(index, 1); }

               delete this.#data[key];
            }
         }
      }
   }

   // Internal implementation ----------------------------------------------------------------------------------------

   /**
    * Returns the translations necessary to translate a matrix operation based on the `transformOrigin` parameter of the
    * given position instance. The first entry / index 0 is the pre-translation and last entry / index 1 is the post-
    * translation.
    *
    * This method is used internally, but may be useful if you need the origin translation matrices to transform
    * bespoke points based on any `transformOrigin` set in {@link TJSPositionData}.
    *
    * @param transformOrigin - The transform origin attribute from TJSPositionData.
    *
    * @param width - The TJSPositionData width or validation data width when 'auto'.
    *
    * @param height - The TJSPositionData height or validation data height when 'auto'.
    *
    * @param output - Output Mat4 array.
    *
    * @returns Output Mat4 array.
    */
   static #getOriginTranslation(transformOrigin: string | null, width: number, height: number, output: Mat4[]): Mat4[]
   {
      const vector: Vec3 = TJSTransforms.#vec3Temp;

      switch (transformOrigin)
      {
         case 'top left':
            vector[0] = vector[1] = 0;
            Mat4.fromTranslation(output[0], vector);
            Mat4.fromTranslation(output[1], vector);
            break;

         case 'top center':
            vector[0] = -width * 0.5;
            vector[1] = 0;
            Mat4.fromTranslation(output[0], vector);
            vector[0] = width * 0.5;
            Mat4.fromTranslation(output[1], vector);
            break;

         case 'top right':
            vector[0] = -width;
            vector[1] = 0;
            Mat4.fromTranslation(output[0], vector);
            vector[0] = width;
            Mat4.fromTranslation(output[1], vector);
            break;

         case 'center left':
            vector[0] = 0;
            vector[1] = -height * 0.5;
            Mat4.fromTranslation(output[0], vector);
            vector[1] = height * 0.5;
            Mat4.fromTranslation(output[1], vector);
            break;

         // By default, null / no transform is 'center'.
         case null:
         case 'center':
            vector[0] = -width * 0.5;
            vector[1] = -height * 0.5;
            Mat4.fromTranslation(output[0], vector);
            vector[0] = width * 0.5;
            vector[1] = height * 0.5;
            Mat4.fromTranslation(output[1], vector);
            break;

         case 'center right':
            vector[0] = -width;
            vector[1] = -height * 0.5;
            Mat4.fromTranslation(output[0], vector);
            vector[0] = width;
            vector[1] = height * 0.5;
            Mat4.fromTranslation(output[1], vector);
            break;

         case 'bottom left':
            vector[0] = 0;
            vector[1] = -height;
            Mat4.fromTranslation(output[0], vector);
            vector[1] = height;
            Mat4.fromTranslation(output[1], vector);
            break;

         case 'bottom center':
            vector[0] = -width * 0.5;
            vector[1] = -height;
            Mat4.fromTranslation(output[0], vector);
            vector[0] = width * 0.5;
            vector[1] = height;
            Mat4.fromTranslation(output[1], vector);
            break;

         case 'bottom right':
            vector[0] = -width;
            vector[1] = -height;
            Mat4.fromTranslation(output[0], vector);
            vector[0] = width;
            vector[1] = height;
            Mat4.fromTranslation(output[1], vector);
            break;

         // No valid transform origin parameter; set identity.
         default:
            Mat4.identity(output[0]);
            Mat4.identity(output[1]);
            break;
      }

      return output;
   }
}
