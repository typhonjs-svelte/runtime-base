import { degToRad }           from '#runtime/math/util';
import { Mat4, Vec3 }         from '#runtime/math/gl-matrix';

import { TJSTransformData }   from './TJSTransformData.js';

/**
 * @implements {import('./types').TransformAPI}
 */
export class TJSTransforms
{
   /**
    * Stores transform data.
    *
    * @type {Partial<import('../data/types').Data.TJSPositionData>}
    */
   #data = {};

   /**
    * Stores the transform keys in the order added.
    *
    * @type {string[]}
    */
   #orderList = [];

   /**
    * Defines the keys of TJSPositionData that are transform keys.
    *
    * @type {string[]}
    */
   static #transformKeys = Object.freeze([
    'rotateX', 'rotateY', 'rotateZ', 'scale', 'translateX', 'translateY', 'translateZ'
   ]);

   /**
    * Defines bitwise keys for transforms used in {@link TJSTransforms.getMat4}.
    *
    * @type {object}
    */
   static #transformKeysBitwise = Object.freeze({
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
    *
    * @type {Readonly<import('./types').TransformAPI.TransformOrigin>}
    */
   static #transformOriginDefault = 'top left';

   /**
    * Defines the valid transform origins.
    *
    * @type {Readonly<import('./types').TransformAPI.TransformOrigin[]>}
    */
   static #transformOrigins = Object.freeze(['top left', 'top center', 'top right', 'center left', 'center',
    'center right', 'bottom left', 'bottom center', 'bottom right']);

   // Temporary variables --------------------------------------------------------------------------------------------

   /** @type {import('#runtime/math/gl-matrix').Mat4} */
   static #mat4Result = Mat4.create();

   /** @type {import('#runtime/math/gl-matrix').Mat4} */
   static #mat4Temp = Mat4.create();

   /** @type {import('#runtime/math/gl-matrix').Vec3} */
   static #vec3Temp = Vec3.create();

   /** @type {number[]} */
   static #vectorScale = [1, 1, 1];

   /** @type {number[]} */
   static #vectorTranslate = [0, 0, 0];

   /**
    * Returns a list of supported transform origins.
    *
    * @returns {Readonly<import('./types').TransformAPI.TransformOrigin[]>}
    */
   static get transformOrigins()
   {
      return this.#transformOrigins;
   }

   /**
    * @returns {boolean} Whether there are active transforms in local data.
    */
   get isActive() { return this.#orderList.length > 0; }

   /**
    * @returns {number|undefined} Any local rotateX data.
    */
   get rotateX() { return this.#data.rotateX; }

   /**
    * @returns {number|undefined} Any local rotateY data.
    */
   get rotateY() { return this.#data.rotateY; }

   /**
    * @returns {number|undefined} Any local rotateZ data.
    */
   get rotateZ() { return this.#data.rotateZ; }

   /**
    * @returns {number|undefined} Any local rotateZ scale.
    */
   get scale() { return this.#data.scale; }

   /**
    * @returns {number|undefined} Any local translateZ data.
    */
   get translateX() { return this.#data.translateX; }

   /**
    * @returns {number|undefined} Any local translateZ data.
    */
   get translateY() { return this.#data.translateY; }

   /**
    * @returns {number|undefined} Any local translateZ data.
    */
   get translateZ() { return this.#data.translateZ; }

   /**
    * Sets the local rotateX data if the value is a finite number otherwise removes the local data.
    *
    * @param {number|null|undefined}   value - A value to set.
    */
   set rotateX(value)
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
    * @param {number|null|undefined}   value - A value to set.
    */
   set rotateY(value)
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
    * @param {number|null|undefined}   value - A value to set.
    */
   set rotateZ(value)
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
            const index = this.#orderList.findIndex((entry) => entry === 'rotateZ');
            if (index >= 0) { this.#orderList.splice(index, 1); }
         }

         delete this.#data.rotateZ;
      }
   }

   /**
    * Sets the local scale data if the value is a finite number otherwise removes the local data.
    *
    * @param {number|null|undefined}   value - A value to set.
    */
   set scale(value)
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
            const index = this.#orderList.findIndex((entry) => entry === 'scale');
            if (index >= 0) { this.#orderList.splice(index, 1); }
         }

         delete this.#data.scale;
      }
   }

   /**
    * Sets the local translateX data if the value is a finite number otherwise removes the local data.
    *
    * @param {number|null|undefined}   value - A value to set.
    */
   set translateX(value)
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
            const index = this.#orderList.findIndex((entry) => entry === 'translateX');
            if (index >= 0) { this.#orderList.splice(index, 1); }
         }

         delete this.#data.translateX;
      }
   }

   /**
    * Sets the local translateY data if the value is a finite number otherwise removes the local data.
    *
    * @param {number|null|undefined}   value - A value to set.
    */
   set translateY(value)
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
            const index = this.#orderList.findIndex((entry) => entry === 'translateY');
            if (index >= 0) { this.#orderList.splice(index, 1); }
         }

         delete this.#data.translateY;
      }
   }

   /**
    * Sets the local translateZ data if the value is a finite number otherwise removes the local data.
    *
    * @param {number|null|undefined}   value - A value to set.
    */
   set translateZ(value)
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
            const index = this.#orderList.findIndex((entry) => entry === 'translateZ');
            if (index >= 0) { this.#orderList.splice(index, 1); }
         }

         delete this.#data.translateZ;
      }
   }

   /**
    * Returns the matrix3d CSS transform for the given position / transform data.
    *
    * @param {object} [data] - Optional position data otherwise use local stored transform data.
    *
    * @returns {string} The CSS matrix3d string.
    */
   getCSS(data = this.#data)
   {
      return `matrix3d(${this.getMat4(data, TJSTransforms.#mat4Result).join(',')})`;
   }

   /**
    * Returns the matrix3d CSS transform for the given position / transform data.
    *
    * @param {object} [data] - Optional position data otherwise use local stored transform data.
    *
    * @returns {string} The CSS matrix3d string.
    */
   getCSSOrtho(data = this.#data)
   {
      return `matrix3d(${this.getMat4Ortho(data, TJSTransforms.#mat4Result).join(',')})`;
   }

   /**
    * Collects all data including a bounding rect, transform matrix, and points array of the given
    * {@link TJSPositionData} instance with the applied local transform data.
    *
    * @param {import('../data/types').Data.TJSPositionData} position - The position data to process.
    *
    * @param {import('./types').TransformAPI.TransformData} [output] - Optional TJSTransformData output instance.
    *
    * @param {object} [validationData] - Optional validation data for adjustment parameters.
    *
    * @returns {import('./types').TransformAPI.TransformData} The output TJSTransformData instance.
    */
   getData(position, output = new TJSTransformData(), validationData = {})
   {
      const valWidth = validationData.width ?? 0;
      const valHeight = validationData.height ?? 0;
      const valOffsetTop = validationData.offsetTop ?? validationData.marginTop ?? 0;
      const valOffsetLeft = validationData.offsetLeft ?? validationData.marginLeft ?? 0;

      position.top += valOffsetTop;
      position.left += valOffsetLeft;

      const width = Number.isFinite(position.width) ? position.width : valWidth;
      const height = Number.isFinite(position.height) ? position.height : valHeight;

      const rect = output.corners;

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

         const matrix = this.getMat4(position, output.mat4);

         const translate = TJSTransforms.#getOriginTranslation(position.transformOrigin, width, height, output.originTranslations);

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

         rect[0][0] = position.left + rect[0][0];
         rect[0][1] = position.top + rect[0][1];
         rect[1][0] = position.left + rect[1][0];
         rect[1][1] = position.top + rect[1][1];
         rect[2][0] = position.left + rect[2][0];
         rect[2][1] = position.top + rect[2][1];
         rect[3][0] = position.left + rect[3][0];
         rect[3][1] = position.top + rect[3][1];
      }
      else
      {
         rect[0][0] = position.left;
         rect[0][1] = position.top;
         rect[1][0] = position.left + width;
         rect[1][1] = position.top;
         rect[2][0] = position.left + width;
         rect[2][1] = position.top + height;
         rect[3][0] = position.left;
         rect[3][1] = position.top + height;

         Mat4.identity(output.mat4);
      }

      let maxX = Number.MIN_SAFE_INTEGER;
      let maxY = Number.MIN_SAFE_INTEGER;
      let minX = Number.MAX_SAFE_INTEGER;
      let minY = Number.MAX_SAFE_INTEGER;

      for (let cntr = 4; --cntr >= 0;)
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

      position.top -= valOffsetTop;
      position.left -= valOffsetLeft;

      return output;
   }

   /**
    * Creates a transform matrix based on local data applied in order it was added.
    *
    * If no data object is provided then the source is the local transform data. If another data object is supplied
    * then the stored local transform order is applied then all remaining transform keys are applied. This allows the
    * construction of a transform matrix in advance of setting local data and is useful in collision detection.
    *
    * @param {import('../data/types').Data.TJSPositionData}   [data] - TJSPositionData instance or local transform data.
    *
    * @param {import('#runtime/math/gl-matrix').Mat4}  [output] - The output mat4 instance.
    *
    * @returns {import('#runtime/math/gl-matrix').Mat4} Transform matrix.
    */
   getMat4(data = this.#data, output = Mat4.create())
   {
      const matrix = Mat4.identity(output);

      // Bitwise tracks applied transform keys from local transform data.
      let seenKeys = 0;

      const orderList = this.#orderList;

      // First apply ordered transforms from local transform data.
      for (let cntr = 0; cntr < orderList.length; cntr++)
      {
         const key = orderList[cntr];

         switch (key)
         {
            case 'rotateX':
               seenKeys |= TJSTransforms.#transformKeysBitwise.rotateX;
               Mat4.multiply(matrix, matrix, Mat4.fromXRotation(TJSTransforms.#mat4Temp, degToRad(data[key])));
               break;

            case 'rotateY':
               seenKeys |= TJSTransforms.#transformKeysBitwise.rotateY;
               Mat4.multiply(matrix, matrix, Mat4.fromYRotation(TJSTransforms.#mat4Temp, degToRad(data[key])));
               break;

            case 'rotateZ':
               seenKeys |= TJSTransforms.#transformKeysBitwise.rotateZ;
               Mat4.multiply(matrix, matrix, Mat4.fromZRotation(TJSTransforms.#mat4Temp, degToRad(data[key])));
               break;

            case 'scale':
               seenKeys |= TJSTransforms.#transformKeysBitwise.scale;
               TJSTransforms.#vectorScale[0] = TJSTransforms.#vectorScale[1] = data[key];
               Mat4.multiply(matrix, matrix, Mat4.fromScaling(TJSTransforms.#mat4Temp, TJSTransforms.#vectorScale));
               break;

            case 'translateX':
               seenKeys |= TJSTransforms.#transformKeysBitwise.translateX;
               TJSTransforms.#vectorTranslate[0] = data.translateX;
               TJSTransforms.#vectorTranslate[1] = 0;
               TJSTransforms.#vectorTranslate[2] = 0;
               Mat4.multiply(matrix, matrix, Mat4.fromTranslation(TJSTransforms.#mat4Temp, TJSTransforms.#vectorTranslate));
               break;

            case 'translateY':
               seenKeys |= TJSTransforms.#transformKeysBitwise.translateY;
               TJSTransforms.#vectorTranslate[0] = 0;
               TJSTransforms.#vectorTranslate[1] = data.translateY;
               TJSTransforms.#vectorTranslate[2] = 0;
               Mat4.multiply(matrix, matrix, Mat4.fromTranslation(TJSTransforms.#mat4Temp, TJSTransforms.#vectorTranslate));
               break;

            case 'translateZ':
               seenKeys |= TJSTransforms.#transformKeysBitwise.translateZ;
               TJSTransforms.#vectorTranslate[0] = 0;
               TJSTransforms.#vectorTranslate[1] = 0;
               TJSTransforms.#vectorTranslate[2] = data.translateZ;
               Mat4.multiply(matrix, matrix, Mat4.fromTranslation(TJSTransforms.#mat4Temp, TJSTransforms.#vectorTranslate));
               break;
         }
      }

      // Now apply any new keys not set in local transform data that have not been applied yet.
      if (data !== this.#data)
      {
         for (let cntr = 0; cntr < TJSTransforms.#transformKeys.length; cntr++)
         {
            const key = TJSTransforms.#transformKeys[cntr];

            // Reject bad / no data or if the key has already been applied.
            if (data[key] === null || (seenKeys & TJSTransforms.#transformKeysBitwise[key]) > 0) { continue; }

            switch (key)
            {
               case 'rotateX':
                  Mat4.multiply(matrix, matrix, Mat4.fromXRotation(TJSTransforms.#mat4Temp, degToRad(data[key])));
                  break;

               case 'rotateY':
                  Mat4.multiply(matrix, matrix, Mat4.fromYRotation(TJSTransforms.#mat4Temp, degToRad(data[key])));
                  break;

               case 'rotateZ':
                  Mat4.multiply(matrix, matrix, Mat4.fromZRotation(TJSTransforms.#mat4Temp, degToRad(data[key])));
                  break;

               case 'scale':
                  TJSTransforms.#vectorScale[0] = TJSTransforms.#vectorScale[1] = data[key];
                  Mat4.multiply(matrix, matrix, Mat4.fromScaling(TJSTransforms.#mat4Temp, TJSTransforms.#vectorScale));
                  break;

               case 'translateX':
                  TJSTransforms.#vectorTranslate[0] = data[key];
                  TJSTransforms.#vectorTranslate[1] = 0;
                  TJSTransforms.#vectorTranslate[2] = 0;
                  Mat4.multiply(matrix, matrix, Mat4.fromTranslation(TJSTransforms.#mat4Temp, TJSTransforms.#vectorTranslate));
                  break;

               case 'translateY':
                  TJSTransforms.#vectorTranslate[0] = 0;
                  TJSTransforms.#vectorTranslate[1] = data[key];
                  TJSTransforms.#vectorTranslate[2] = 0;
                  Mat4.multiply(matrix, matrix, Mat4.fromTranslation(TJSTransforms.#mat4Temp, TJSTransforms.#vectorTranslate));
                  break;

               case 'translateZ':
                  TJSTransforms.#vectorTranslate[0] = 0;
                  TJSTransforms.#vectorTranslate[1] = 0;
                  TJSTransforms.#vectorTranslate[2] = data[key];
                  Mat4.multiply(matrix, matrix, Mat4.fromTranslation(TJSTransforms.#mat4Temp, TJSTransforms.#vectorTranslate));
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
    * @param {Partial<import('../data/types').Data.TJSPositionData>}   [data] - TJSPositionData instance or local
    *        transform data.
    *
    * @param {import('#runtime/math/gl-matrix').Mat4}  [output] - The output mat4 instance.
    *
    * @returns {import('#runtime/math/gl-matrix').Mat4} Transform matrix.
    */
   getMat4Ortho(data = this.#data, output = Mat4.create())
   {
      const matrix = Mat4.identity(output);

      // Attempt to retrieve values from passed in data otherwise default to 0.
      // Always perform the translation last regardless of order added to local transform data.
      // Add data.left to translateX and data.top to translateY.
      TJSTransforms.#vectorTranslate[0] = (data.left ?? 0) + (data.translateX ?? 0);
      TJSTransforms.#vectorTranslate[1] = (data.top ?? 0) + (data.translateY ?? 0);
      TJSTransforms.#vectorTranslate[2] = data.translateZ ?? 0;
      Mat4.multiply(matrix, matrix, Mat4.fromTranslation(TJSTransforms.#mat4Temp, TJSTransforms.#vectorTranslate));

      // Scale can also be applied out of order.
      if (data.scale !== null)
      {
         TJSTransforms.#vectorScale[0] = TJSTransforms.#vectorScale[1] = data.scale;
         Mat4.multiply(matrix, matrix, Mat4.fromScaling(TJSTransforms.#mat4Temp, TJSTransforms.#vectorScale));
      }

      // Early out if there is not rotation data.
      if (data.rotateX === null && data.rotateY === null && data.rotateZ === null) { return matrix; }

      // Rotation transforms must be applied in the order they are added.

      // Bitwise tracks applied transform keys from local transform data.
      let seenKeys = 0;

      const orderList = this.#orderList;

      // First apply ordered transforms from local transform data.
      for (let cntr = 0; cntr < orderList.length; cntr++)
      {
         const key = orderList[cntr];

         switch (key)
         {
            case 'rotateX':
               seenKeys |= TJSTransforms.#transformKeysBitwise.rotateX;
               Mat4.multiply(matrix, matrix, Mat4.fromXRotation(TJSTransforms.#mat4Temp, degToRad(data[key])));
               break;

            case 'rotateY':
               seenKeys |= TJSTransforms.#transformKeysBitwise.rotateY;
               Mat4.multiply(matrix, matrix, Mat4.fromYRotation(TJSTransforms.#mat4Temp, degToRad(data[key])));
               break;

            case 'rotateZ':
               seenKeys |= TJSTransforms.#transformKeysBitwise.rotateZ;
               Mat4.multiply(matrix, matrix, Mat4.fromZRotation(TJSTransforms.#mat4Temp, degToRad(data[key])));
               break;
         }
      }

      // Now apply any new keys not set in local transform data that have not been applied yet.
      if (data !== this.#data)
      {
         for (let cntr = 0; cntr < TJSTransforms.#transformKeys.length; cntr++)
         {
            const key = TJSTransforms.#transformKeys[cntr];

            // Reject bad / no data or if the key has already been applied.
            if (data[key] === null || (seenKeys & TJSTransforms.#transformKeysBitwise[key]) > 0) { continue; }

            switch (key)
            {
               case 'rotateX':
                  Mat4.multiply(matrix, matrix, Mat4.fromXRotation(TJSTransforms.#mat4Temp, degToRad(data[key])));
                  break;

               case 'rotateY':
                  Mat4.multiply(matrix, matrix, Mat4.fromYRotation(TJSTransforms.#mat4Temp, degToRad(data[key])));
                  break;

               case 'rotateZ':
                  Mat4.multiply(matrix, matrix, Mat4.fromZRotation(TJSTransforms.#mat4Temp, degToRad(data[key])));
                  break;
            }
         }
      }

      return matrix;
   }

   /**
    * Tests an object if it contains transform keys and the values are finite numbers.
    *
    * @param {import('../data/types').Data.TJSPositionData} data - An object to test for transform data.
    *
    * @returns {boolean} Whether the given TJSPositionData has transforms.
    */
   hasTransform(data)
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
    * @param {object}   data - An object with transform data.
    */
   reset(data)
   {
      for (const key in data)
      {
         if (TJSTransforms.#transformKeys.includes(key))
         {
            if (Number.isFinite(data[key]))
            {
               this.#data[key] = data[key];
            }
            else
            {
               const index = this.#orderList.findIndex((entry) => entry === key);
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
    * @param {string}   transformOrigin - The transform origin attribute from TJSPositionData.
    *
    * @param {number}   width - The TJSPositionData width or validation data width when 'auto'.
    *
    * @param {number}   height - The TJSPositionData height or validation data height when 'auto'.
    *
    * @param {import('#runtime/math/gl-matrix').Mat4[]}   output - Output Mat4 array.
    *
    * @returns {import('#runtime/math/gl-matrix').Mat4[]} Output Mat4 array.
    */
   static #getOriginTranslation(transformOrigin, width, height, output)
   {
      const vector = TJSTransforms.#vec3Temp;

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
