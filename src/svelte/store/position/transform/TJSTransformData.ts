import { Mat4, Vec3 }   from '#runtime/math/gl-matrix';

import { TransformAPI } from './types';

/**
 * Provides the output data for {@link TransformAPI.getData}.
 */
export class TJSTransformData implements TransformAPI.TransformData
{
   constructor()
   {
      Object.seal(this);
   }

   /**
    * Stores the calculated bounding rectangle.
    */
   #boundingRect: DOMRect = new DOMRect();

   /**
    * Stores the individual transformed corner points of the window in screen space clockwise from:
    * top left -> top right -> bottom right -> bottom left.
    */
   #corners: Vec3[] = [Vec3.create(), Vec3.create(), Vec3.create(), Vec3.create()];

   /**
    * Stores the current gl-matrix Mat4 data.
    */
   #mat4: Mat4 = Mat4.create();

   /**
    * Stores the pre & post origin translations to apply to matrix transforms.
    */
   #originTranslations: Mat4[] = [Mat4.create(), Mat4.create()];

   /**
    * @returns The bounding rectangle.
    */
   get boundingRect(): DOMRect { return this.#boundingRect; }

   /**
    * @returns The transformed corner points as Vec3 in screen space.
    */
   get corners(): Vec3[] { return this.#corners; }

   /**
    * @returns Returns the CSS style string for the transform matrix.
    */
   get css(): string { return `matrix3d(${this.mat4.join(',')})`; }

   /**
    * @returns The transform matrix.
    */
   get mat4(): Mat4 { return this.#mat4; }

   /**
    * @returns The pre / post translation matrices for origin translation.
    */
   get originTranslations(): Mat4[] { return this.#originTranslations; }
}
