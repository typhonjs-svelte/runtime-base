/**
 * Provides the `gl-matrix` 32-bit library.
 *
 * @packageDocumentation
 */

/**
 * Provides all common type declarations shared across `gl-matrix`.
 *
 * ```ts
 * import { Vec3 } from 'gl-matrix';
 * import type { Vec3Like } from 'gl-matrix/types';
 *
 * const vec: Vec3Like = new Vec3(0, 1, 2);
 * ```
 *
 * For JSDoc using the new Typescript 5.5 `@import` tag:
 * ```js
 * /**
 *  * @import { Vec3Like } from 'gl-matrix/types'
 *  *\/
 * ```
 *
 * For JSDoc using the older `import types` Typescript mechanism:
 * ```js
 * /**
 *  * @type {import('gl-matrix/types').Vec3Like}
 *  *\/
 * ```
 *
 * @packageDocumentation
 */
/**
 * The floating-point typed arrays that can be used in place of a vector, matrix, or quaternion.
 */
type FloatArray = Float32Array | Float64Array;
/**
 * A 2x2 Matrix given as a {@link Mat2}, a 4-element floating-point TypedArray, or an array of 4 numbers.
 */
type Mat2Like = [number, number, number, number] | FloatArray;
/**
 * A 2x3 Matrix given as a {@link Mat2d}, a 6-element floating-point TypedArray, or an array of 6 numbers.
 */
type Mat2dLike = [number, number, number, number, number, number] | FloatArray;
/**
 * A 3x3 Matrix given as a {@link Mat3}, a 9-element floating-point TypedArray, or an array of 9 numbers.
 */
type Mat3Like = [number, number, number, number, number, number, number, number, number] | FloatArray;
/**
 * A 4x4 Matrix given as a {@link Mat4}, a 16-element floating-point TypedArray, or an array of 16 numbers.
 */
type Mat4Like =
  | [
      number,
      number,
      number,
      number,
      number,
      number,
      number,
      number,
      number,
      number,
      number,
      number,
      number,
      number,
      number,
      number,
    ]
  | FloatArray;
/**
 * A Quaternion given as a {@link Quat}, a 4-element floating-point TypedArray, or an array of 4 numbers.
 */
type QuatLike = Vec4Like;
/**
 * A Dual Quaternion given as a {@link Quat2}, an 8-element floating-point TypedArray, or an array of 8 numbers.
 */
type Quat2Like = [number, number, number, number, number, number, number, number] | FloatArray;
/**
 * A 2-dimensional vector given as a {@link Vec2}, a 2-element floating-point TypedArray, or an array of 2 numbers.
 */
type Vec2Like = [number, number] | FloatArray;
/**
 * A 3-dimensional vector given as a {@link Vec3}, a 3-element floating-point TypedArray, or an array of 3 numbers.
 */
type Vec3Like = [number, number, number] | FloatArray;
/**
 * A 4-dimensional vector given as a {@link Vec4}, a 4-element floating-point TypedArray, or an array of 4 numbers.
 */
type Vec4Like = [number, number, number, number] | FloatArray;

/**
 * Provides the modern `gl-matrix` API (32-bit). All classes extend from `Float32Array`.
 *
 * ```js
 * import { Vec3 } from 'gl-matrix';
 *
 * const vec = new Vec3(0, 1, 2);
 * ```
 *
 * @packageDocumentation
 */

/**
 * A 2x2 Matrix
 */
declare class Mat2 extends Float32Array {
  #private;
  /**
   * Create a {@link Mat2}.
   *
   * @category Constructor
   */
  constructor(...values: [Readonly<Mat2Like> | ArrayBufferLike, number?] | number[]);
  /**
   * A string representation of `this`
   * Equivalent to `Mat2.str(this);`
   *
   * @category Accessors
   */
  get str(): string;
  /**
   * Copy the values from another {@link Mat2} into `this`.
   *
   * @param a the source vector
   * @returns `this`
   * @category Methods
   */
  copy(a: Readonly<Mat2Like>): this;
  /**
   * Set `this` to the identity matrix
   * Equivalent to Mat2.identity(this)
   *
   * @returns `this`
   * @category Methods
   */
  identity(): this;
  /**
   * Multiplies this {@link Mat2} against another one
   * Equivalent to `Mat2.multiply(this, this, b);`
   *
   * @param b - The second operand
   * @returns `this`
   * @category Methods
   */
  multiply(b: Readonly<Mat2Like>): this;
  /**
   * Alias for {@link Mat2.multiply}
   * @category Methods
   */
  mul(b: Readonly<Mat2Like>): this;
  /**
   * Transpose this {@link Mat2}
   * Equivalent to `Mat2.transpose(this, this);`
   *
   * @returns `this`
   * @category Methods
   */
  transpose(): this;
  /**
   * Inverts this {@link Mat2}
   * Equivalent to `Mat4.invert(this, this);`
   *
   * @returns `this`
   * @category Methods
   */
  invert(): this;
  /**
   * Scales this {@link Mat2} by the dimensions in the given vec3 not using vectorization
   * Equivalent to `Mat2.scale(this, this, v);`
   *
   * @param v - The {@link Vec2} to scale the matrix by
   * @returns `this`
   * @category Methods
   */
  scale(v: Readonly<Vec2Like>): this;
  /**
   * Rotates this {@link Mat2} by the given angle around the given axis
   * Equivalent to `Mat2.rotate(this, this, rad);`
   *
   * @param rad - the angle to rotate the matrix by
   * @returns `this`
   * @category Methods
   */
  rotate(rad: number): this;
  /**
   * @category Static
   *
   * @returns The number of bytes in a {@link Mat2}.
   */
  static get BYTE_LENGTH(): number;
  /**
   * Creates a new, identity {@link Mat2}
   * @category Static
   *
   * @returns A new {@link Mat2}
   */
  static create(): Mat2;
  /**
   * Creates a new {@link Mat2} initialized with values from an existing matrix
   * @category Static
   *
   * @param a - Matrix to clone
   * @returns A new {@link Mat2}
   */
  static clone(a: Readonly<Mat2Like>): Mat2;
  /**
   * Copy the values from one {@link Mat2} to another
   * @category Static
   *
   * @param out - The receiving Matrix
   * @param a - Matrix to copy
   * @returns `out`
   */
  static copy(out: Mat2Like, a: Readonly<Mat2Like>): Mat2Like;
  /**
   * Create a new {@link Mat2} with the given values
   * @category Static
   *
   * @param values - Matrix components
   * @returns A new {@link Mat2}
   */
  static fromValues(...values: number[]): Mat2;
  /**
   * Set the components of a {@link Mat2} to the given values
   * @category Static
   *
   * @param out - The receiving matrix
   * @param values - Matrix components
   * @returns `out`
   */
  static set(out: Mat2Like, ...values: number[]): Mat2Like;
  /**
   * Set a {@link Mat2} to the identity matrix
   * @category Static
   *
   * @param out - The receiving matrix
   * @returns `out`
   */
  static identity(out: Mat2Like): Mat2Like;
  /**
   * Transpose the values of a {@link Mat2}
   * @category Static
   *
   * @param out - the receiving matrix
   * @param a - the source matrix
   * @returns `out`
   */
  static transpose(out: Mat2Like, a: Readonly<Mat2Like>): Mat2Like;
  /**
   * Inverts a {@link Mat2}
   * @category Static
   *
   * @param out - the receiving matrix
   * @param a - the source matrix
   * @returns `out` or `null` if the matrix is not invertible
   */
  static invert(out: Mat2Like, a: Mat2Like): Mat2Like | null;
  /**
   * Calculates the adjugate of a {@link Mat2}
   * @category Static
   *
   * @param out - the receiving matrix
   * @param a - the source matrix
   * @returns `out`
   */
  static adjoint(out: Mat2Like, a: Mat2Like): Mat2Like;
  /**
   * Calculates the determinant of a {@link Mat2}
   * @category Static
   *
   * @param a - the source matrix
   * @returns determinant of a
   */
  static determinant(a: Readonly<Mat2Like>): number;
  /**
   * Adds two {@link Mat2}'s
   * @category Static
   *
   * @param out - the receiving matrix
   * @param a - the first operand
   * @param b - the second operand
   * @returns `out`
   */
  static add(out: Mat2Like, a: Readonly<Mat2Like>, b: Readonly<Mat2Like>): Mat2Like;
  /**
   * Subtracts matrix b from matrix a
   * @category Static
   *
   * @param out - the receiving matrix
   * @param a - the first operand
   * @param b - the second operand
   * @returns `out`
   */
  static subtract(out: Mat2Like, a: Readonly<Mat2Like>, b: Readonly<Mat2Like>): Mat2Like;
  /**
   * Alias for {@link Mat2.subtract}
   * @category Static
   */
  static sub(out: Mat2Like, a: Readonly<Mat2Like>, b: Readonly<Mat2Like>): Mat2Like;
  /**
   * Multiplies two {@link Mat2}s
   * @category Static
   *
   * @param out - The receiving Matrix
   * @param a - The first operand
   * @param b - The second operand
   * @returns `out`
   */
  static multiply(out: Mat2Like, a: Readonly<Mat2Like>, b: Readonly<Mat2Like>): Mat2Like;
  /**
   * Alias for {@link Mat2.multiply}
   * @category Static
   */
  static mul(out: Mat2Like, a: Readonly<Mat2Like>, b: Readonly<Mat2Like>): Mat2Like;
  /**
   * Rotates a {@link Mat2} by the given angle
   * @category Static
   *
   * @param out - the receiving matrix
   * @param a - the matrix to rotate
   * @param rad - the angle to rotate the matrix by
   * @returns `out`
   */
  static rotate(out: Mat2Like, a: Readonly<Mat2Like>, rad: number): Mat2Like;
  /**
   * Scales the {@link Mat2} by the dimensions in the given {@link Vec2}
   * @category Static
   *
   * @param out - the receiving matrix
   * @param a - the matrix to scale
   * @param v - the {@link Vec2} to scale the matrix by
   * @returns `out`
   **/
  static scale(out: Mat2Like, a: Readonly<Mat2Like>, v: Readonly<Vec2Like>): Mat2Like;
  /**
   * Creates a {@link Mat2} from a given angle around a given axis
   * This is equivalent to (but much faster than):
   * ```js
   *   mat2.identity(dest);
   *   mat2.rotate(dest, dest, rad);
   * ```
   * @category Static
   *
   * @param out - {@link Mat2} receiving operation result
   * @param rad - the angle to rotate the matrix by
   * @returns `out`
   */
  static fromRotation(out: Mat2Like, rad: number): Mat2Like;
  /**
   * Creates a {@link Mat2} from a vector scaling
   * This is equivalent to (but much faster than):
   * ```js
   *   mat2.identity(dest);
   *   mat2.scale(dest, dest, vec);
   * ```
   * @category Static
   *
   * @param out - {@link Mat2} receiving operation result
   * @param v - Scaling vector
   * @returns `out`
   */
  static fromScaling(out: Mat2Like, v: Readonly<Vec2Like>): Mat2Like;
  /**
   * Returns Frobenius norm of a {@link Mat2}
   * @category Static
   *
   * @param a - the matrix to calculate Frobenius norm of
   * @returns Frobenius norm
   */
  static frob(a: Readonly<Mat2Like>): number;
  /**
   * Multiply each element of a {@link Mat2} by a scalar.
   * @category Static
   *
   * @param out - the receiving matrix
   * @param a - the matrix to scale
   * @param b - amount to scale the matrix's elements by
   * @returns `out`
   */
  static multiplyScalar(out: Mat2Like, a: Readonly<Mat2Like>, b: number): Mat2Like;
  /**
   * Adds two {@link Mat2}'s after multiplying each element of the second operand by a scalar value.
   * @category Static
   *
   * @param out - the receiving vector
   * @param a - the first operand
   * @param b - the second operand
   * @param scale - the amount to scale b's elements by before adding
   * @returns `out`
   */
  static multiplyScalarAndAdd(out: Mat2Like, a: Readonly<Mat2Like>, b: Readonly<Mat2Like>, scale: number): Mat2Like;
  /**
   * Returns L, D and U matrices (Lower triangular, Diagonal and Upper triangular) by factorizing the input matrix
   * @category Static
   *
   * @param L - the lower triangular matrix
   * @param D - the diagonal matrix
   * @param U - the upper triangular matrix
   * @param a - the input matrix to factorize
   */
  static LDU(
    L: Mat2Like,
    D: Readonly<Mat2Like>,
    U: Mat2Like,
    a: Readonly<Mat2Like>,
  ): [Mat2Like, Readonly<Mat2Like>, Mat2Like];
  /**
   * Returns whether two {@link Mat2}s have exactly the same elements in the same position (when compared with ===)
   * @category Static
   *
   * @param a - The first matrix.
   * @param b - The second matrix.
   * @returns True if the matrices are equal, false otherwise.
   */
  static exactEquals(a: Readonly<Mat2Like>, b: Readonly<Mat2Like>): boolean;
  /**
   * Returns whether two {@link Mat2}s have approximately the same elements in the same position.
   * @category Static
   *
   * @param a - The first matrix.
   * @param b - The second matrix.
   * @returns True if the matrices are equal, false otherwise.
   */
  static equals(a: Readonly<Mat2Like>, b: Readonly<Mat2Like>): boolean;
  /**
   * Returns a string representation of a {@link Mat2}
   * @category Static
   *
   * @param a - matrix to represent as a string
   * @returns string representation of the matrix
   */
  static str(a: Readonly<Mat2Like>): string;
}

/**
 * A 2x3 Matrix
 */
declare class Mat2d extends Float32Array {
  #private;
  /**
   * Create a {@link Mat2}.
   *
   * @category Constructor
   */
  constructor(...values: [Readonly<Mat2dLike> | ArrayBufferLike, number?] | number[]);
  /**
   * A string representation of `this`
   * Equivalent to `Mat2d.str(this);`
   *
   * @category Accessors
   */
  get str(): string;
  /**
   * Copy the values from another {@link Mat2d} into `this`.
   * @category Methods
   *
   * @param a the source vector
   * @returns `this`
   */
  copy(a: Readonly<Mat2dLike>): this;
  /**
   * Set `this` to the identity matrix
   * Equivalent to Mat2d.identity(this)
   * @category Methods
   *
   * @returns `this`
   */
  identity(): this;
  /**
   * Multiplies this {@link Mat2d} against another one
   * Equivalent to `Mat2d.multiply(this, this, b);`
   * @category Methods
   *
   * @param out - The receiving Matrix
   * @param a - The first operand
   * @param b - The second operand
   * @returns `this`
   */
  multiply(b: Readonly<Mat2dLike>): this;
  /**
   * Alias for {@link Mat2d.multiply}
   * @category Methods
   */
  mul(b: Readonly<Mat2dLike>): this;
  /**
   * Translate this {@link Mat2d} by the given vector
   * Equivalent to `Mat2d.translate(this, this, v);`
   * @category Methods
   *
   * @param v - The {@link Vec2} to translate by
   * @returns `this`
   */
  translate(v: Readonly<Vec2Like>): this;
  /**
   * Rotates this {@link Mat2d} by the given angle around the given axis
   * Equivalent to `Mat2d.rotate(this, this, rad);`
   * @category Methods
   *
   * @param rad - the angle to rotate the matrix by
   * @returns `this`
   */
  rotate(rad: number): this;
  /**
   * Scales this {@link Mat2d} by the dimensions in the given vec3 not using vectorization
   * Equivalent to `Mat2d.scale(this, this, v);`
   * @category Methods
   *
   * @param v - The {@link Vec2} to scale the matrix by
   * @returns `this`
   */
  scale(v: Readonly<Vec2Like>): this;
  /**
   * @category Static
   *
   * @returns The number of bytes in a {@link Mat2d}.
   */
  static get BYTE_LENGTH(): number;
  /**
   * Creates a new, identity {@link Mat2d}
   * @category Static
   *
   * @returns A new {@link Mat2d}
   */
  static create(): Mat2d;
  /**
   * Creates a new {@link Mat2d} initialized with values from an existing matrix
   * @category Static
   *
   * @param a - Matrix to clone
   * @returns A new {@link Mat2d}
   */
  static clone(a: Readonly<Mat2dLike>): Mat2d;
  /**
   * Copy the values from one {@link Mat2d} to another
   * @category Static
   *
   * @param out - The receiving Matrix
   * @param a - Matrix to copy
   * @returns `out`
   */
  static copy(out: Mat2dLike, a: Readonly<Mat2dLike>): Mat2dLike;
  /**
   * Create a new {@link Mat2d} with the given values
   * @category Static
   *
   * @param values - Matrix components
   * @returns A new {@link Mat2d}
   */
  static fromValues(...values: number[]): Mat2d;
  /**
   * Set the components of a {@link Mat2d} to the given values
   * @category Static
   *
   * @param out - The receiving matrix
   * @param values - Matrix components
   * @returns `out`
   */
  static set(out: Mat2dLike, ...values: number[]): Mat2dLike;
  /**
   * Set a {@link Mat2d} to the identity matrix
   * @category Static
   *
   * @param out - The receiving matrix
   * @returns `out`
   */
  static identity(out: Mat2dLike): Mat2dLike;
  /**
   * Inverts a {@link Mat2d}
   * @category Static
   *
   * @param out - the receiving matrix
   * @param a - the source matrix
   * @returns `out` or `null` if the matrix is not invertible
   */
  static invert(out: Mat2dLike, a: Mat2dLike): Mat2dLike | null;
  /**
   * Calculates the determinant of a {@link Mat2d}
   * @category Static
   *
   * @param a - the source matrix
   * @returns determinant of a
   */
  static determinant(a: Readonly<Mat2dLike>): number;
  /**
   * Adds two {@link Mat2d}'s
   * @category Static
   *
   * @param out - the receiving matrix
   * @param a - the first operand
   * @param b - the second operand
   * @returns `out`
   */
  static add(out: Mat2dLike, a: Readonly<Mat2dLike>, b: Readonly<Mat2dLike>): Mat2dLike;
  /**
   * Subtracts matrix b from matrix a
   * @category Static
   *
   * @param out - the receiving matrix
   * @param a - the first operand
   * @param b - the second operand
   * @returns `out`
   */
  static subtract(out: Mat2dLike, a: Readonly<Mat2dLike>, b: Readonly<Mat2dLike>): Mat2dLike;
  /**
   * Alias for {@link Mat2d.subtract}
   * @category Static
   */
  static sub(out: Mat2dLike, a: Readonly<Mat2dLike>, b: Readonly<Mat2dLike>): Mat2dLike;
  /**
   * Multiplies two {@link Mat2d}s
   * @category Static
   *
   * @param out - The receiving Matrix
   * @param a - The first operand
   * @param b - The second operand
   * @returns `out`
   */
  static multiply(out: Mat2dLike, a: Readonly<Mat2dLike>, b: Readonly<Mat2dLike>): Mat2dLike;
  /**
   * Alias for {@link Mat2d.multiply}
   * @category Static
   */
  static mul(out: Mat2dLike, a: Readonly<Mat2dLike>, b: Readonly<Mat2dLike>): Mat2dLike;
  /**
   * Translate a {@link Mat2d} by the given vector
   * @category Static
   *
   * @param out - the receiving matrix
   * @param a - the matrix to translate
   * @param v - vector to translate by
   * @returns `out`
   */
  static translate(out: Mat2dLike, a: Readonly<Mat2dLike>, v: Readonly<Vec2Like>): Mat2dLike;
  /**
   * Rotates a {@link Mat2d} by the given angle
   * @category Static
   *
   * @param out - the receiving matrix
   * @param a - the matrix to rotate
   * @param rad - the angle to rotate the matrix by
   * @returns `out`
   */
  static rotate(out: Mat2dLike, a: Readonly<Mat2dLike>, rad: number): Mat2dLike;
  /**
   * Scales the {@link Mat2d} by the dimensions in the given {@link Vec2}
   * @category Static
   *
   * @param out - the receiving matrix
   * @param a - the matrix to scale
   * @param v - the {@link Vec2} to scale the matrix by
   * @returns `out`
   **/
  static scale(out: Mat2dLike, a: Readonly<Mat2dLike>, v: Readonly<Vec2Like>): Mat2dLike;
  /**
   * Creates a {@link Mat2d} from a vector translation
   * This is equivalent to (but much faster than):
   * ```js
   *   Mat2d.identity(dest);
   *   Mat2d.translate(dest, dest, vec);
   * ```
   * @category Static
   *
   * @param out - {@link Mat2d} receiving operation result
   * @param v - Translation vector
   * @returns `out`
   */
  static fromTranslation(out: Mat2dLike, v: Readonly<Vec2Like>): Mat2dLike;
  /**
   * Creates a {@link Mat2d} from a given angle around a given axis
   * This is equivalent to (but much faster than):
   * ```js
   *   Mat2d.identity(dest);
   *   Mat2d.rotate(dest, dest, rad);
   * ```
   * @category Static
   *
   * @param out - {@link Mat2d} receiving operation result
   * @param rad - the angle to rotate the matrix by
   * @returns `out`
   */
  static fromRotation(out: Mat2dLike, rad: number): Mat2dLike;
  /**
   * Creates a {@link Mat2d} from a vector scaling
   * This is equivalent to (but much faster than):
   * ```js
   *   Mat2d.identity(dest);
   *   Mat2d.scale(dest, dest, vec);
   * ```
   * @category Static
   *
   * @param out - {@link Mat2d} receiving operation result
   * @param v - Scaling vector
   * @returns `out`
   */
  static fromScaling(out: Mat2dLike, v: Readonly<Vec2Like>): Mat2dLike;
  /**
   * Returns Frobenius norm of a {@link Mat2d}
   * @category Static
   *
   * @param a - the matrix to calculate Frobenius norm of
   * @returns Frobenius norm
   */
  static frob(a: Readonly<Mat2dLike>): number;
  /**
   * Multiply each element of a {@link Mat2d} by a scalar.
   * @category Static
   *
   * @param out - the receiving matrix
   * @param a - the matrix to scale
   * @param b - amount to scale the matrix's elements by
   * @returns `out`
   */
  static multiplyScalar(out: Mat2dLike, a: Readonly<Mat2dLike>, b: number): Mat2dLike;
  /**
   * Adds two {@link Mat2d}'s after multiplying each element of the second operand by a scalar value.
   * @category Static
   *
   * @param out - the receiving vector
   * @param a - the first operand
   * @param b - the second operand
   * @param scale - the amount to scale b's elements by before adding
   * @returns `out`
   */
  static multiplyScalarAndAdd(out: Mat2dLike, a: Readonly<Mat2dLike>, b: Readonly<Mat2dLike>, scale: number): Mat2dLike;
  /**
   * Returns whether two {@link Mat2d}s have exactly the same elements in the same position (when compared with ===).
   * @category Static
   *
   * @param a - The first matrix.
   * @param b - The second matrix.
   * @returns True if the matrices are equal, false otherwise.
   */
  static exactEquals(a: Readonly<Mat2dLike>, b: Readonly<Mat2dLike>): boolean;
  /**
   * Returns whether two {@link Mat2d}s have approximately the same elements in the same position.
   * @category Static
   *
   * @param a - The first matrix.
   * @param b - The second matrix.
   * @returns True if the matrices are equal, false otherwise.
   */
  static equals(a: Readonly<Mat2dLike>, b: Readonly<Mat2dLike>): boolean;
  /**
   * Returns a string representation of a {@link Mat2d}
   * @category Static
   *
   * @param a - matrix to represent as a string
   * @returns string representation of the matrix
   */
  static str(a: Readonly<Mat2dLike>): string;
}

/**
 * A 3x3 Matrix
 */
declare class Mat3 extends Float32Array {
  #private;
  /**
   * Create a {@link Mat3}.
   *
   * @category Constructor
   */
  constructor(...values: [Readonly<Mat3Like> | ArrayBufferLike, number?] | number[]);
  /**
   * A string representation of `this`
   * Equivalent to `Mat3.str(this);`
   *
   * @category Accessors
   */
  get str(): string;
  /**
   * Copy the values from another {@link Mat3} into `this`.
   * @category Methods
   *
   * @param a the source vector
   * @returns `this`
   */
  copy(a: Readonly<Mat3Like>): this;
  /**
   * Set `this` to the identity matrix
   * Equivalent to Mat3.identity(this)
   * @category Methods
   *
   * @returns `this`
   */
  identity(): this;
  /**
   * Multiplies this {@link Mat3} against another one
   * Equivalent to `Mat3.multiply(this, this, b);`
   * @category Methods
   *
   * @param out - The receiving Matrix
   * @param a - The first operand
   * @param b - The second operand
   * @returns `this`
   */
  multiply(b: Readonly<Mat3Like>): this;
  /**
   * Alias for {@link Mat3.multiply}
   * @category Methods
   */
  mul(b: Readonly<Mat3Like>): this;
  /**
   * Transpose this {@link Mat3}
   * Equivalent to `Mat3.transpose(this, this);`
   * @category Methods
   *
   * @returns `this`
   */
  transpose(): this;
  /**
   * Inverts this {@link Mat3}
   * Equivalent to `Mat4.invert(this, this);`
   * @category Methods
   *
   * @returns `this`
   */
  invert(): this;
  /**
   * Translate this {@link Mat3} by the given vector
   * Equivalent to `Mat3.translate(this, this, v);`
   * @category Methods
   *
   * @param v - The {@link Vec2} to translate by
   * @returns `this`
   */
  translate(v: Readonly<Vec2Like>): this;
  /**
   * Rotates this {@link Mat3} by the given angle around the given axis
   * Equivalent to `Mat3.rotate(this, this, rad);`
   * @category Methods
   *
   * @param rad - the angle to rotate the matrix by
   * @returns `this`
   */
  rotate(rad: number): this;
  /**
   * Scales this {@link Mat3} by the dimensions in the given vec3 not using vectorization
   * Equivalent to `Mat3.scale(this, this, v);`
   * @category Methods
   *
   * @param v - The {@link Vec2} to scale the matrix by
   * @returns `this`
   */
  scale(v: Readonly<Vec2Like>): this;
  /**
   * @category Static
   *
   * @returns The number of bytes in a {@link Mat3}.
   */
  static get BYTE_LENGTH(): number;
  /**
   * Creates a new, identity {@link Mat3}
   * @category Static
   *
   * @returns A new {@link Mat3}
   */
  static create(): Mat3;
  /**
   * Creates a new {@link Mat3} initialized with values from an existing matrix
   * @category Static
   *
   * @param a - Matrix to clone
   * @returns A new {@link Mat3}
   */
  static clone(a: Readonly<Mat3Like>): Mat3;
  /**
   * Copy the values from one {@link Mat3} to another
   * @category Static
   *
   * @param out - The receiving Matrix
   * @param a - Matrix to copy
   * @returns `out`
   */
  static copy(out: Mat3Like, a: Readonly<Mat3Like>): Mat3Like;
  /**
   * Create a new {@link Mat3} with the given values
   * @category Static
   *
   * @param values - Matrix components
   * @returns A new {@link Mat3}
   */
  static fromValues(...values: number[]): Mat3;
  /**
   * Set the components of a {@link Mat3} to the given values
   * @category Static
   *
   * @param out - The receiving matrix
   * @param values - Matrix components
   * @returns `out`
   */
  static set(out: Mat3Like, ...values: number[]): Mat3Like;
  /**
   * Set a {@link Mat3} to the identity matrix
   * @category Static
   *
   * @param out - The receiving matrix
   * @returns `out`
   */
  static identity(out: Mat3Like): Mat3Like;
  /**
   * Transpose the values of a {@link Mat3}
   * @category Static
   *
   * @param out - the receiving matrix
   * @param a - the source matrix
   * @returns `out`
   */
  static transpose(out: Mat3Like, a: Readonly<Mat3Like>): Mat3Like;
  /**
   * Inverts a {@link Mat3}
   * @category Static
   *
   * @param out - the receiving matrix
   * @param a - the source matrix
   * @returns `out` or `null` if the matrix is not invertible
   */
  static invert(out: Mat3Like, a: Mat3Like): Mat3Like | null;
  /**
   * Calculates the adjugate of a {@link Mat3}
   * @category Static
   *
   * @param out - the receiving matrix
   * @param a - the source matrix
   * @returns `out`
   */
  static adjoint(out: Mat3Like, a: Mat3Like): Mat3Like;
  /**
   * Calculates the determinant of a {@link Mat3}
   * @category Static
   *
   * @param a - the source matrix
   * @returns determinant of a
   */
  static determinant(a: Readonly<Mat3Like>): number;
  /**
   * Adds two {@link Mat3}'s
   * @category Static
   *
   * @param out - the receiving matrix
   * @param a - the first operand
   * @param b - the second operand
   * @returns `out`
   */
  static add(out: Mat3Like, a: Readonly<Mat3Like>, b: Readonly<Mat3Like>): Mat3Like;
  /**
   * Subtracts matrix b from matrix a
   * @category Static
   *
   * @param out - the receiving matrix
   * @param a - the first operand
   * @param b - the second operand
   * @returns `out`
   */
  static subtract(out: Mat3Like, a: Readonly<Mat3Like>, b: Readonly<Mat3Like>): Mat3Like;
  /**
   * Alias for {@link Mat3.subtract}
   * @category Static
   */
  static sub(out: Mat3Like, a: Readonly<Mat3Like>, b: Readonly<Mat3Like>): Mat3Like;
  /**
   * Multiplies two {@link Mat3}s
   * @category Static
   *
   * @param out - The receiving Matrix
   * @param a - The first operand
   * @param b - The second operand
   * @returns `out`
   */
  static multiply(out: Mat3Like, a: Readonly<Mat3Like>, b: Readonly<Mat3Like>): Mat3Like;
  /**
   * Alias for {@link Mat3.multiply}
   * @category Static
   */
  static mul(out: Mat3Like, a: Readonly<Mat3Like>, b: Readonly<Mat3Like>): Mat3Like;
  /**
   * Translate a {@link Mat3} by the given vector
   * @category Static
   *
   * @param out - the receiving matrix
   * @param a - the matrix to translate
   * @param v - vector to translate by
   * @returns `out`
   */
  static translate(out: Mat3Like, a: Readonly<Mat3Like>, v: Readonly<Vec2Like>): Mat3Like;
  /**
   * Rotates a {@link Mat3} by the given angle
   * @category Static
   *
   * @param out - the receiving matrix
   * @param a - the matrix to rotate
   * @param rad - the angle to rotate the matrix by
   * @returns `out`
   */
  static rotate(out: Mat3Like, a: Readonly<Mat3Like>, rad: number): Mat3Like;
  /**
   * Scales the {@link Mat3} by the dimensions in the given {@link Vec2}
   * @category Static
   *
   * @param out - the receiving matrix
   * @param a - the matrix to scale
   * @param v - the {@link Vec2} to scale the matrix by
   * @returns `out`
   **/
  static scale(out: Mat3Like, a: Readonly<Mat3Like>, v: Readonly<Vec2Like>): Mat3Like;
  /**
   * Creates a {@link Mat3} from a vector translation
   * This is equivalent to (but much faster than):
   * ```js
   *   mat3.identity(dest);
   *   mat3.translate(dest, dest, vec);
   * ```
   * @category Static
   *
   * @param out - {@link Mat3} receiving operation result
   * @param v - Translation vector
   * @returns `out`
   */
  static fromTranslation(out: Mat3Like, v: Readonly<Vec2Like>): Mat3Like;
  /**
   * Creates a {@link Mat3} from a given angle around a given axis
   * This is equivalent to (but much faster than):
   *
   *     mat3.identity(dest);
   *     mat3.rotate(dest, dest, rad);
   * @category Static
   *
   * @param out - {@link Mat3} receiving operation result
   * @param rad - the angle to rotate the matrix by
   * @returns `out`
   */
  static fromRotation(out: Mat3Like, rad: number): Mat3Like;
  /**
   * Creates a {@link Mat3} from a vector scaling
   * This is equivalent to (but much faster than):
   * ```js
   *   mat3.identity(dest);
   *   mat3.scale(dest, dest, vec);
   * ```
   * @category Static
   *
   * @param out - {@link Mat3} receiving operation result
   * @param v - Scaling vector
   * @returns `out`
   */
  static fromScaling(out: Mat3Like, v: Readonly<Vec2Like>): Mat3Like;
  /**
   * Copies the upper-left 3x3 values of a {@link Mat2d} into the given
   * {@link Mat3}.
   * @category Static
   *
   * @param out - the receiving 3x3 matrix
   * @param a - the source 2x3 matrix
   * @returns `out`
   */
  static fromMat2d(out: Mat3Like, a: Readonly<Mat2dLike>): Mat3Like;
  /**
   * Calculates a {@link Mat3} from the given quaternion
   * @category Static
   *
   * @param out - {@link Mat3} receiving operation result
   * @param q - {@link Quat} to create matrix from
   * @returns `out`
   */
  static fromQuat(out: Mat3Like, q: Readonly<QuatLike>): Mat3Like;
  /**
   * Copies the upper-left 3x3 values of a {@link Mat4} into the given
   * {@link Mat3}.
   * @category Static
   *
   * @param out - the receiving 3x3 matrix
   * @param a - the source 4x4 matrix
   * @returns `out`
   */
  static fromMat4(out: Mat3Like, a: Readonly<Mat4Like>): Mat3Like;
  /**
   * Calculates a 3x3 normal matrix (transpose inverse) from the 4x4 matrix
   * @category Static
   *
   * @param {mat3} out mat3 receiving operation result
   * @param {ReadonlyMat4} a Mat4 to derive the normal matrix from
   * @returns `out` or `null` if the matrix is not invertible
   */
  static normalFromMat4(out: Mat3Like, a: Readonly<Mat4Like>): Mat3Like | null;
  /**
   * Calculates a {@link Mat3} normal matrix (transpose inverse) from a {@link Mat4}
   * This version omits the calculation of the constant factor (1/determinant), so
   * any normals transformed with it will need to be renormalized.
   * From https://stackoverflow.com/a/27616419/25968
   * @category Static
   *
   * @param out - Matrix receiving operation result
   * @param a - Mat4 to derive the normal matrix from
   * @returns `out`
   */
  static normalFromMat4Fast(out: Mat3Like, a: Readonly<Mat4Like>): Mat3Like;
  /**
   * Generates a 2D projection matrix with the given bounds
   * @category Static
   *
   * @param out mat3 frustum matrix will be written into
   * @param width Width of your gl context
   * @param height Height of gl context
   * @returns `out`
   */
  static projection(out: Mat3Like, width: number, height: number): Mat3Like;
  /**
   * Returns Frobenius norm of a {@link Mat3}
   * @category Static
   *
   * @param a - the matrix to calculate Frobenius norm of
   * @returns Frobenius norm
   */
  static frob(a: Readonly<Mat3Like>): number;
  /**
   * Multiply each element of a {@link Mat3} by a scalar.
   * @category Static
   *
   * @param out - the receiving matrix
   * @param a - the matrix to scale
   * @param b - amount to scale the matrix's elements by
   * @returns `out`
   */
  static multiplyScalar(out: Mat3Like, a: Readonly<Mat3Like>, b: number): Mat3Like;
  /**
   * Adds two {@link Mat3}'s after multiplying each element of the second operand by a scalar value.
   * @category Static
   *
   * @param out - the receiving vector
   * @param a - the first operand
   * @param b - the second operand
   * @param scale - the amount to scale b's elements by before adding
   * @returns `out`
   */
  static multiplyScalarAndAdd(out: Mat3Like, a: Readonly<Mat3Like>, b: Readonly<Mat3Like>, scale: number): Mat3Like;
  /**
   * Returns whether two {@link Mat3}s have exactly the same elements in the same position (when compared with ===).
   * @category Static
   *
   * @param a - The first matrix.
   * @param b - The second matrix.
   * @returns True if the matrices are equal, false otherwise.
   */
  static exactEquals(a: Readonly<Mat3Like>, b: Readonly<Mat3Like>): boolean;
  /**
   * Returns whether two {@link Mat3}s have approximately the same elements in the same position.
   * @category Static
   *
   * @param a - The first matrix.
   * @param b - The second matrix.
   * @returns True if the matrices are equal, false otherwise.
   */
  static equals(a: Readonly<Mat3Like>, b: Readonly<Mat3Like>): boolean;
  /**
   * Returns a string representation of a {@link Mat3}
   * @category Static
   *
   * @param a - matrix to represent as a string
   * @returns string representation of the matrix
   */
  static str(a: Readonly<Mat3Like>): string;
}

/**
 * A 4x4 Matrix
 */
declare class Mat4 extends Float32Array {
  #private;
  /**
   * Create a {@link Mat4}.
   *
   * @category Constructor
   */
  constructor(...values: [Readonly<Mat4Like> | ArrayBufferLike, number?] | number[]);
  /**
   * A string representation of `this`
   * Equivalent to `Mat4.str(this);`
   *
   * @category Accessors
   */
  get str(): string;
  /**
   * Copy the values from another {@link Mat4} into `this`.
   * @category Methods
   *
   * @param a the source vector
   * @returns `this`
   */
  copy(a: Readonly<Mat4Like>): this;
  /**
   * Set `this` to the identity matrix
   * Equivalent to Mat4.identity(this)
   * @category Methods
   *
   * @returns `this`
   */
  identity(): this;
  /**
   * Multiplies this {@link Mat4} against another one
   * Equivalent to `Mat4.multiply(this, this, b);`
   * @category Methods
   *
   * @param b - The second operand
   * @returns `this`
   */
  multiply(b: Readonly<Mat4Like>): this;
  /**
   * Alias for {@link Mat4.multiply}
   * @category Methods
   */
  mul(b: Readonly<Mat4Like>): this;
  /**
   * Transpose this {@link Mat4}
   * Equivalent to `Mat4.transpose(this, this);`
   * @category Methods
   *
   * @returns `this`
   */
  transpose(): this;
  /**
   * Inverts this {@link Mat4}
   * Equivalent to `Mat4.invert(this, this);`
   * @category Methods
   *
   * @returns `this`
   */
  invert(): this;
  /**
   * Translate this {@link Mat4} by the given vector
   * Equivalent to `Mat4.translate(this, this, v);`
   * @category Methods
   *
   * @param v - The {@link Vec3} to translate by
   * @returns `this`
   */
  translate(v: Readonly<Vec3Like>): this;
  /**
   * Rotates this {@link Mat4} by the given angle around the given axis
   * Equivalent to `Mat4.rotate(this, this, rad, axis);`
   * @category Methods
   *
   * @param rad - the angle to rotate the matrix by
   * @param axis - the axis to rotate around
   * @returns `this`
   */
  rotate(rad: number, axis: Readonly<Vec3Like>): this;
  /**
   * Scales this {@link Mat4} by the dimensions in the given vec3 not using vectorization
   * Equivalent to `Mat4.scale(this, this, v);`
   * @category Methods
   *
   * @param v - The {@link Vec3} to scale the matrix by
   * @returns `this`
   */
  scale(v: Readonly<Vec3Like>): this;
  /**
   * Rotates this {@link Mat4} by the given angle around the X axis
   * Equivalent to `Mat4.rotateX(this, this, rad);`
   * @category Methods
   *
   * @param rad - the angle to rotate the matrix by
   * @returns `this`
   */
  rotateX(rad: number): this;
  /**
   * Rotates this {@link Mat4} by the given angle around the Y axis
   * Equivalent to `Mat4.rotateY(this, this, rad);`
   * @category Methods
   *
   * @param rad - the angle to rotate the matrix by
   * @returns `this`
   */
  rotateY(rad: number): this;
  /**
   * Rotates this {@link Mat4} by the given angle around the Z axis
   * Equivalent to `Mat4.rotateZ(this, this, rad);`
   * @category Methods
   *
   * @param rad - the angle to rotate the matrix by
   * @returns `this`
   */
  rotateZ(rad: number): this;
  /**
   * Generates a perspective projection matrix with the given bounds.
   * The near/far clip planes correspond to a normalized device coordinate Z range of [-1, 1],
   * which matches WebGL/OpenGL's clip volume.
   * Passing null/undefined/no value for far will generate infinite projection matrix.
   * Equivalent to `Mat4.perspectiveNO(this, fovy, aspect, near, far);`
   * @category Methods
   *
   * @param fovy - Vertical field of view in radians
   * @param aspect - Aspect ratio. typically viewport width/height
   * @param near - Near bound of the frustum
   * @param far - Far bound of the frustum, can be null or Infinity
   * @returns `this`
   */
  perspectiveNO(fovy: number, aspect: number, near: number, far: number): this;
  /**
   * Generates a perspective projection matrix suitable for WebGPU with the given bounds.
   * The near/far clip planes correspond to a normalized device coordinate Z range of [0, 1],
   * which matches WebGPU/Vulkan/DirectX/Metal's clip volume.
   * Passing null/undefined/no value for far will generate infinite projection matrix.
   * Equivalent to `Mat4.perspectiveZO(this, fovy, aspect, near, far);`
   * @category Methods
   *
   * @param fovy - Vertical field of view in radians
   * @param aspect - Aspect ratio. typically viewport width/height
   * @param near - Near bound of the frustum
   * @param far - Far bound of the frustum, can be null or Infinity
   * @returns `this`
   */
  perspectiveZO(fovy: number, aspect: number, near: number, far: number): this;
  /**
   * Generates a orthogonal projection matrix with the given bounds.
   * The near/far clip planes correspond to a normalized device coordinate Z range of [-1, 1],
   * which matches WebGL/OpenGL's clip volume.
   * Equivalent to `Mat4.orthoNO(this, left, right, bottom, top, near, far);`
   * @category Methods
   *
   * @param left - Left bound of the frustum
   * @param right - Right bound of the frustum
   * @param bottom - Bottom bound of the frustum
   * @param top - Top bound of the frustum
   * @param near - Near bound of the frustum
   * @param far - Far bound of the frustum
   * @returns `this`
   */
  orthoNO(left: number, right: number, bottom: number, top: number, near: number, far: number): this;
  /**
   * Generates a orthogonal projection matrix with the given bounds.
   * The near/far clip planes correspond to a normalized device coordinate Z range of [0, 1],
   * which matches WebGPU/Vulkan/DirectX/Metal's clip volume.
   * Equivalent to `Mat4.orthoZO(this, left, right, bottom, top, near, far);`
   * @category Methods
   *
   * @param left - Left bound of the frustum
   * @param right - Right bound of the frustum
   * @param bottom - Bottom bound of the frustum
   * @param top - Top bound of the frustum
   * @param near - Near bound of the frustum
   * @param far - Far bound of the frustum
   * @returns `this`
   */
  orthoZO(left: number, right: number, bottom: number, top: number, near: number, far: number): this;
  /**
   * @category Static
   *
   * @returns The number of bytes in a {@link Mat4}.
   */
  static get BYTE_LENGTH(): number;
  /**
   * Creates a new, identity {@link Mat4}
   * @category Static
   *
   * @returns A new {@link Mat4}
   */
  static create(): Mat4;
  /**
   * Creates a new {@link Mat4} initialized with values from an existing matrix
   * @category Static
   *
   * @param a - Matrix to clone
   * @returns A new {@link Mat4}
   */
  static clone(a: Readonly<Mat4Like>): Mat4;
  /**
   * Copy the values from one {@link Mat4} to another
   * @category Static
   *
   * @param out - The receiving Matrix
   * @param a - Matrix to copy
   * @returns `out`
   */
  static copy(out: Mat4Like, a: Readonly<Mat4Like>): Mat4Like;
  /**
   * Create a new mat4 with the given values
   * @category Static
   *
   * @param values - Matrix components
   * @returns A new {@link Mat4}
   */
  static fromValues(...values: number[]): Mat4;
  /**
   * Set the components of a mat4 to the given values
   * @category Static
   *
   * @param out - The receiving matrix
   * @param values - Matrix components
   * @returns `out`
   */
  static set(out: Mat4Like, ...values: number[]): Mat4Like;
  /**
   * Set a {@link Mat4} to the identity matrix
   * @category Static
   *
   * @param out - The receiving Matrix
   * @returns `out`
   */
  static identity(out: Mat4Like): Mat4Like;
  /**
   * Transpose the values of a {@link Mat4}
   * @category Static
   *
   * @param out - the receiving matrix
   * @param a - the source matrix
   * @returns `out`
   */
  static transpose(out: Mat4Like, a: Readonly<Mat4Like>): Mat4Like;
  /**
   * Inverts a {@link Mat4}
   * @category Static
   *
   * @param out - the receiving matrix
   * @param a - the source matrix
   * @returns `out` or `null` if the matrix is not invertible
   */
  static invert(out: Mat4Like, a: Mat4Like): Mat4Like | null;
  /**
   * Calculates the adjugate of a {@link Mat4}
   * @category Static
   *
   * @param out - the receiving matrix
   * @param a - the source matrix
   * @returns `out`
   */
  static adjoint(out: Mat4Like, a: Mat4Like): Mat4Like;
  /**
   * Calculates the determinant of a {@link Mat4}
   * @category Static
   *
   * @param a - the source matrix
   * @returns determinant of a
   */
  static determinant(a: Readonly<Mat4Like>): number;
  /**
   * Multiplies two {@link Mat4}s
   * @category Static
   *
   * @param out - The receiving Matrix
   * @param a - The first operand
   * @param b - The second operand
   * @returns `out`
   */
  static multiply(out: Mat4Like, a: Readonly<Mat4Like>, b: Readonly<Mat4Like>): Mat4Like;
  /**
   * Alias for {@link Mat4.multiply}
   * @category Static
   */
  static mul(out: Mat4Like, a: Readonly<Mat4Like>, b: Readonly<Mat4Like>): Mat4Like;
  /**
   * Translate a {@link Mat4} by the given vector
   * @category Static
   *
   * @param out - the receiving matrix
   * @param a - the matrix to translate
   * @param v - vector to translate by
   * @returns `out`
   */
  static translate(out: Mat4Like, a: Readonly<Mat4Like>, v: Readonly<Vec3Like>): Mat4Like;
  /**
   * Scales the {@link Mat4} by the dimensions in the given {@link Vec3} not using vectorization
   * @category Static
   *
   * @param out - the receiving matrix
   * @param a - the matrix to scale
   * @param v - the {@link Vec3} to scale the matrix by
   * @returns `out`
   **/
  static scale(out: Mat4Like, a: Readonly<Mat4Like>, v: Readonly<Vec3Like>): Mat4Like;
  /**
   * Rotates a {@link Mat4} by the given angle around the given axis
   * @category Static
   *
   * @param out - the receiving matrix
   * @param a - the matrix to rotate
   * @param rad - the angle to rotate the matrix by
   * @param axis - the axis to rotate around
   * @returns `out` or `null` if axis has a length of 0
   */
  static rotate(out: Mat4Like, a: Readonly<Mat4Like>, rad: number, axis: Readonly<Vec3Like>): Mat4Like | null;
  /**
   * Rotates a matrix by the given angle around the X axis
   * @category Static
   *
   * @param out - the receiving matrix
   * @param a - the matrix to rotate
   * @param rad - the angle to rotate the matrix by
   * @returns `out`
   */
  static rotateX(out: Mat4Like, a: Readonly<Mat4Like>, rad: number): Mat4Like;
  /**
   * Rotates a matrix by the given angle around the Y axis
   * @category Static
   *
   * @param out - the receiving matrix
   * @param a - the matrix to rotate
   * @param rad - the angle to rotate the matrix by
   * @returns `out`
   */
  static rotateY(out: Mat4Like, a: Readonly<Mat4Like>, rad: number): Mat4Like;
  /**
   * Rotates a matrix by the given angle around the Z axis
   * @category Static
   *
   * @param out - the receiving matrix
   * @param a - the matrix to rotate
   * @param rad - the angle to rotate the matrix by
   * @returns `out`
   */
  static rotateZ(out: Mat4Like, a: Readonly<Mat4Like>, rad: number): Mat4Like;
  /**
   * Creates a {@link Mat4} from a vector translation
   * This is equivalent to (but much faster than):
   * ```js
   *   mat4.identity(dest);
   *   mat4.translate(dest, dest, vec);
   * ```
   * @category Static
   *
   * @param out - {@link Mat4} receiving operation result
   * @param v - Translation vector
   * @returns `out`
   */
  static fromTranslation(out: Mat4Like, v: Readonly<Vec3Like>): Mat4Like;
  /**
   * Creates a {@link Mat4} from a vector scaling
   * This is equivalent to (but much faster than):
   * ```js
   *   mat4.identity(dest);
   *   mat4.scale(dest, dest, vec);
   * ```
   * @category Static
   *
   * @param out - {@link Mat4} receiving operation result
   * @param v - Scaling vector
   * @returns `out`
   */
  static fromScaling(out: Mat4Like, v: Readonly<Vec3Like>): Mat4Like;
  /**
   * Creates a {@link Mat4} from a given angle around a given axis
   * This is equivalent to (but much faster than):
   * ```js
   *   mat4.identity(dest);
   *   mat4.rotate(dest, dest, rad, axis);
   * ```
   * @category Static
   *
   * @param out - {@link Mat4} receiving operation result
   * @param rad - the angle to rotate the matrix by
   * @param axis - the axis to rotate around
   * @returns `out` or `null` if `axis` has a length of 0
   */
  static fromRotation(out: Mat4Like, rad: number, axis: Readonly<Vec3Like>): Mat4Like | null;
  /**
   * Creates a matrix from the given angle around the X axis
   * This is equivalent to (but much faster than):
   * ```js
   *   mat4.identity(dest);
   *   mat4.rotateX(dest, dest, rad);
   * ```
   * @category Static
   *
   * @param out - mat4 receiving operation result
   * @param rad - the angle to rotate the matrix by
   * @returns `out`
   */
  static fromXRotation(out: Mat4Like, rad: number): Mat4Like;
  /**
   * Creates a matrix from the given angle around the Y axis
   * This is equivalent to (but much faster than):
   * ```js
   *   mat4.identity(dest);
   *   mat4.rotateY(dest, dest, rad);
   * ```
   * @category Static
   *
   * @param out - mat4 receiving operation result
   * @param rad - the angle to rotate the matrix by
   * @returns `out`
   */
  static fromYRotation(out: Mat4Like, rad: number): Mat4Like;
  /**
   * Creates a matrix from the given angle around the Z axis
   * This is equivalent to (but much faster than):
   * ```js
   *   mat4.identity(dest);
   *   mat4.rotateZ(dest, dest, rad);
   * ```
   * @category Static
   *
   * @param out - mat4 receiving operation result
   * @param rad - the angle to rotate the matrix by
   * @returns `out`
   */
  static fromZRotation(out: Mat4Like, rad: number): Mat4Like;
  /**
   * Creates a matrix from a quaternion rotation and vector translation
   * This is equivalent to (but much faster than):
   * ```js
   *   mat4.identity(dest);
   *   mat4.translate(dest, vec);
   *   let quatMat = mat4.create();
   *   quat4.toMat4(quat, quatMat);
   *   mat4.multiply(dest, quatMat);
   * ```
   * @category Static
   *
   * @param out - mat4 receiving operation result
   * @param q - Rotation quaternion
   * @param v - Translation vector
   * @returns `out`
   */
  static fromRotationTranslation(out: Mat4Like, q: Readonly<QuatLike>, v: Readonly<Vec3Like>): Mat4Like;
  /**
   * Sets a {@link Mat4} from a {@link Quat2}.
   * @category Static
   *
   * @param out - Matrix
   * @param a - Dual Quaternion
   * @returns `out`
   */
  static fromQuat2(out: Mat4Like, a: Quat2Like): Mat4Like;
  /**
   * Calculates a {@link Mat4} normal matrix (transpose inverse) from a {@link Mat4}
   * @category Static
   *
   * @param out - Matrix receiving operation result
   * @param a - Mat4 to derive the normal matrix from
   * @returns `out` or `null` if the matrix is not invertible
   */
  static normalFromMat4(out: Mat4Like, a: Readonly<Mat4Like>): Mat4Like | null;
  /**
   * Calculates a {@link Mat4} normal matrix (transpose inverse) from a {@link Mat4}
   * This version omits the calculation of the constant factor (1/determinant), so
   * any normals transformed with it will need to be renormalized.
   * From https://stackoverflow.com/a/27616419/25968
   * @category Static
   *
   * @param out - Matrix receiving operation result
   * @param a - Mat4 to derive the normal matrix from
   * @returns `out`
   */
  static normalFromMat4Fast(out: Mat4Like, a: Readonly<Mat4Like>): Mat4Like;
  /**
   * Returns the translation vector component of a transformation
   * matrix. If a matrix is built with fromRotationTranslation,
   * the returned vector will be the same as the translation vector
   * originally supplied.
   * @category Static
   *
   * @param  {vec3} out Vector to receive translation component
   * @param  {ReadonlyMat4} mat Matrix to be decomposed (input)
   * @return {vec3} out
   */
  static getTranslation(out: Vec3Like, mat: Readonly<Mat4Like>): Vec3Like;
  /**
   * Returns the scaling factor component of a transformation
   * matrix. If a matrix is built with fromRotationTranslationScale
   * with a normalized Quaternion parameter, the returned vector will be
   * the same as the scaling vector
   * originally supplied.
   * @category Static
   *
   * @param  {vec3} out Vector to receive scaling factor component
   * @param  {ReadonlyMat4} mat Matrix to be decomposed (input)
   * @return {vec3} out
   */
  static getScaling(out: Vec3Like, mat: Readonly<Mat4Like>): Vec3Like;
  /**
   * Returns a quaternion representing the rotational component
   * of a transformation matrix. If a matrix is built with
   * fromRotationTranslation, the returned quaternion will be the
   * same as the quaternion originally supplied.
   * @category Static
   *
   * @param out - Quaternion to receive the rotation component
   * @param mat - Matrix to be decomposed (input)
   * @return `out`
   */
  static getRotation(out: QuatLike, mat: Readonly<Mat4Like>): QuatLike;
  /**
   * Decomposes a transformation matrix into its rotation, translation
   * and scale components. Returns only the rotation component
   * @category Static
   *
   * @param out_r - Quaternion to receive the rotation component
   * @param out_t - Vector to receive the translation vector
   * @param out_s - Vector to receive the scaling factor
   * @param mat - Matrix to be decomposed (input)
   * @returns `out_r`
   */
  static decompose(out_r: QuatLike, out_t: Vec3Like, out_s: Vec3Like, mat: Readonly<Mat4Like>): QuatLike;
  /**
   * Creates a matrix from a quaternion rotation, vector translation and vector scale
   * This is equivalent to (but much faster than):
   * ```js
   *   mat4.identity(dest);
   *   mat4.translate(dest, vec);
   *   let quatMat = mat4.create();
   *   quat4.toMat4(quat, quatMat);
   *   mat4.multiply(dest, quatMat);
   *   mat4.scale(dest, scale);
   * ```
   * @category Static
   *
   * @param out - mat4 receiving operation result
   * @param q - Rotation quaternion
   * @param v - Translation vector
   * @param s - Scaling vector
   * @returns `out`
   */
  static fromRotationTranslationScale(
    out: Mat4Like,
    q: Readonly<QuatLike>,
    v: Readonly<Vec3Like>,
    s: Readonly<Vec3Like>,
  ): Mat4Like;
  /**
   * Creates a matrix from a quaternion rotation, vector translation and vector scale, rotating and scaling around the
   * given origin. This is equivalent to (but much faster than):
   * ```js
   *   mat4.identity(dest);
   *   mat4.translate(dest, vec);
   *   mat4.translate(dest, origin);
   *   let quatMat = mat4.create();
   *   quat4.toMat4(quat, quatMat);
   *   mat4.multiply(dest, quatMat);
   *   mat4.scale(dest, scale)
   *   mat4.translate(dest, negativeOrigin);
   * ```
   * @category Static
   *
   * @param out - mat4 receiving operation result
   * @param q - Rotation quaternion
   * @param v - Translation vector
   * @param s - Scaling vector
   * @param o - The origin vector around which to scale and rotate
   * @returns `out`
   */
  static fromRotationTranslationScaleOrigin(
    out: Mat4Like,
    q: Readonly<QuatLike>,
    v: Readonly<Vec3Like>,
    s: Readonly<Vec3Like>,
    o: Readonly<Vec3Like>,
  ): Mat4Like;
  /**
   * Calculates a 4x4 matrix from the given quaternion
   * @category Static
   *
   * @param out - mat4 receiving operation result
   * @param q - Quaternion to create matrix from
   * @returns `out`
   */
  static fromQuat(out: Mat4Like, q: Readonly<QuatLike>): Mat4Like;
  /**
   * Generates a frustum matrix with the given bounds
   * The near/far clip planes correspond to a normalized device coordinate Z range of [-1, 1],
   * which matches WebGL/OpenGL's clip volume.
   * Passing null/undefined/no value for far will generate infinite projection matrix.
   * @category Static
   *
   * @param out - mat4 frustum matrix will be written into
   * @param left - Left bound of the frustum
   * @param right - Right bound of the frustum
   * @param bottom - Bottom bound of the frustum
   * @param top - Top bound of the frustum
   * @param near - Near bound of the frustum
   * @param far -  Far bound of the frustum, can be null or Infinity
   * @returns `out`
   */
  static frustumNO(
    out: Mat4Like,
    left: number,
    right: number,
    bottom: number,
    top: number,
    near: number,
    far?: number,
  ): Mat4Like;
  /**
   * Alias for {@link Mat4.frustumNO}
   * @category Static
   * @deprecated Use {@link Mat4.frustumNO} or {@link Mat4.frustumZO} explicitly
   */
  static frustum(
    out: Mat4Like,
    left: number,
    right: number,
    bottom: number,
    top: number,
    near: number,
    far?: number,
  ): Mat4Like;
  /**
   * Generates a frustum matrix with the given bounds
   * The near/far clip planes correspond to a normalized device coordinate Z range of [0, 1],
   * which matches WebGPU/Vulkan/DirectX/Metal's clip volume.
   * Passing null/undefined/no value for far will generate infinite projection matrix.
   * @category Static
   *
   * @param out - mat4 frustum matrix will be written into
   * @param left - Left bound of the frustum
   * @param right - Right bound of the frustum
   * @param bottom - Bottom bound of the frustum
   * @param top - Top bound of the frustum
   * @param near - Near bound of the frustum
   * @param far - Far bound of the frustum, can be null or Infinity
   * @returns `out`
   */
  static frustumZO(
    out: Mat4Like,
    left: number,
    right: number,
    bottom: number,
    top: number,
    near: number,
    far?: number,
  ): Mat4Like;
  /**
   * Generates a perspective projection matrix with the given bounds.
   * The near/far clip planes correspond to a normalized device coordinate Z range of [-1, 1],
   * which matches WebGL/OpenGL's clip volume.
   * Passing null/undefined/no value for far will generate infinite projection matrix.
   * @category Static
   *
   * @param out - mat4 frustum matrix will be written into
   * @param fovy - Vertical field of view in radians
   * @param aspect - Aspect ratio. typically viewport width/height
   * @param near - Near bound of the frustum
   * @param far - Far bound of the frustum, can be null or Infinity
   * @returns `out`
   */
  static perspectiveNO(out: Mat4Like, fovy: number, aspect: number, near: number, far?: number): Mat4Like;
  /**
   * Alias for {@link Mat4.perspectiveNO}
   * @category Static
   * @deprecated Use {@link Mat4.perspectiveNO} or {@link Mat4.perspectiveZO} explicitly
   */
  static perspective(out: Mat4Like, fovy: number, aspect: number, near: number, far?: number): Mat4Like;
  /**
   * Generates a perspective projection matrix suitable for WebGPU with the given bounds.
   * The near/far clip planes correspond to a normalized device coordinate Z range of [0, 1],
   * which matches WebGPU/Vulkan/DirectX/Metal's clip volume.
   * Passing null/undefined/no value for far will generate infinite projection matrix.
   * @category Static
   *
   * @param out - mat4 frustum matrix will be written into
   * @param fovy - Vertical field of view in radians
   * @param aspect - Aspect ratio. typically viewport width/height
   * @param near - Near bound of the frustum
   * @param far - Far bound of the frustum, can be null or Infinity
   * @returns `out`
   */
  static perspectiveZO(out: Mat4Like, fovy: number, aspect: number, near: number, far?: number): Mat4Like;
  /**
   * Generates a perspective projection matrix with the given field of view. This is primarily useful for generating
   * projection matrices to be used with the still experimental WebVR API.
   * @category Static
   *
   * @param out - mat4 frustum matrix will be written into
   * @param fov - Object containing the following values: upDegrees, downDegrees, leftDegrees, rightDegrees
   * @param near - Near bound of the frustum
   * @param far - Far bound of the frustum
   * @returns `out`
   * @deprecated
   */
  static perspectiveFromFieldOfView(
    out: Mat4Like,
    fov: {
      upDegrees: number;
      downDegrees: number;
      leftDegrees: number;
      rightDegrees: number;
    },
    near: number,
    far: number,
  ): Mat4Like;
  /**
   * Generates an orthogonal projection matrix with the given bounds. The near / far clip planes correspond to a
   * normalized device coordinate Z range of [-1, 1], which matches WebGL / OpenGLs clip volume.
   * @category Static
   *
   * @param out - mat4 frustum matrix will be written into
   * @param left - Left bound of the frustum
   * @param right - Right bound of the frustum
   * @param bottom - Bottom bound of the frustum
   * @param top - Top bound of the frustum
   * @param near - Near bound of the frustum
   * @param far - Far bound of the frustum
   * @returns `out`
   */
  static orthoNO(
    out: Mat4Like,
    left: number,
    right: number,
    bottom: number,
    top: number,
    near: number,
    far: number,
  ): Mat4Like;
  /**
   * Alias for {@link Mat4.orthoNO}
   * @category Static
   * @deprecated Use {@link Mat4.orthoNO} or {@link Mat4.orthoZO} explicitly
   */
  static ortho(
    out: Mat4Like,
    left: number,
    right: number,
    bottom: number,
    top: number,
    near: number,
    far: number,
  ): Mat4Like;
  /**
   * Generates a orthogonal projection matrix with the given bounds. The near / far clip planes correspond to a
   * normalized device coordinate Z range of [0, 1], which matches WebGPU / Vulkan / DirectX / Metal's clip volume.
   * @category Static
   *
   * @param out - mat4 frustum matrix will be written into
   * @param left - Left bound of the frustum
   * @param right - Right bound of the frustum
   * @param bottom - Bottom bound of the frustum
   * @param top - Top bound of the frustum
   * @param near - Near bound of the frustum
   * @param far - Far bound of the frustum
   * @returns `out`
   */
  static orthoZO(
    out: Mat4Like,
    left: number,
    right: number,
    bottom: number,
    top: number,
    near: number,
    far: number,
  ): Mat4Like;
  /**
   * Generates a look-at matrix with the given eye position, focal point, and up axis. If you want a matrix that
   * actually makes an object look at another object, you should use targetTo instead.
   * @category Static
   *
   * @param out - mat4 frustum matrix will be written into
   * @param eye - Position of the viewer
   * @param center - Point the viewer is looking at
   * @param up - vec3 pointing up
   * @returns `out`
   */
  static lookAt(out: Mat4Like, eye: Readonly<Vec3Like>, center: Readonly<Vec3Like>, up: Readonly<Vec3Like>): Mat4Like;
  /**
   * Generates a matrix that makes something look at something else.
   * @category Static
   *
   * @param out - mat4 frustum matrix will be written into
   * @param eye - Position of the viewer
   * @param target - Point the viewer is looking at
   * @param up - vec3 pointing up
   * @returns `out`
   */
  static targetTo(out: Mat4Like, eye: Readonly<Vec3Like>, target: Readonly<Vec3Like>, up: Readonly<Vec3Like>): Mat4Like;
  /**
   * Returns Frobenius norm of a {@link Mat4}
   * @category Static
   *
   * @param a - the matrix to calculate Frobenius norm of
   * @returns Frobenius norm
   */
  static frob(a: Readonly<Mat4Like>): number;
  /**
   * Adds two {@link Mat4}'s
   * @category Static
   *
   * @param out - the receiving matrix
   * @param a - the first operand
   * @param b - the second operand
   * @returns `out`
   */
  static add(out: Mat4Like, a: Readonly<Mat4Like>, b: Readonly<Mat4Like>): Mat4Like;
  /**
   * Subtracts matrix b from matrix a
   * @category Static
   *
   * @param out - the receiving matrix
   * @param a - the first operand
   * @param b - the second operand
   * @returns `out`
   */
  static subtract(out: Mat4Like, a: Readonly<Mat4Like>, b: Readonly<Mat4Like>): Mat4Like;
  /**
   * Alias for {@link Mat4.subtract}
   * @category Static
   */
  static sub(out: Mat4Like, a: Readonly<Mat4Like>, b: Readonly<Mat4Like>): Mat4Like;
  /**
   * Multiply each element of the matrix by a scalar.
   * @category Static
   *
   * @param out - the receiving matrix
   * @param a - the matrix to scale
   * @param b - amount to scale the matrix's elements by
   * @returns `out`
   */
  static multiplyScalar(out: Mat4Like, a: Readonly<Mat4Like>, b: number): Mat4Like;
  /**
   * Adds two mat4's after multiplying each element of the second operand by a scalar value.
   * @category Static
   *
   * @param out - the receiving vector
   * @param a - the first operand
   * @param b - the second operand
   * @param scale - the amount to scale b's elements by before adding
   * @returns `out`
   */
  static multiplyScalarAndAdd(out: Mat4Like, a: Readonly<Mat4Like>, b: Readonly<Mat4Like>, scale: number): Mat4Like;
  /**
   * Returns whether two {@link Mat4}s have exactly the same elements in the same position (when compared with ===).
   * @category Static
   *
   * @param a - The first matrix.
   * @param b - The second matrix.
   * @returns True if the matrices are equal, false otherwise.
   */
  static exactEquals(a: Readonly<Mat4Like>, b: Readonly<Mat4Like>): boolean;
  /**
   * Returns whether two {@link Mat4}s have approximately the same elements in the same position.
   * @category Static
   *
   * @param a - The first matrix.
   * @param b - The second matrix.
   * @returns True if the matrices are equal, false otherwise.
   */
  static equals(a: Readonly<Mat4Like>, b: Readonly<Mat4Like>): boolean;
  /**
   * Returns a string representation of a {@link Mat4}
   * @category Static
   *
   * @param a - matrix to represent as a string
   * @returns string representation of the matrix
   */
  static str(a: Readonly<Mat4Like>): string;
}

/**
 * Quaternion
 */
declare class Quat extends Float32Array {
  #private;
  /**
   * Create a {@link Quat}.
   *
   * @category Constructor
   */
  constructor(...values: [Readonly<QuatLike> | ArrayBufferLike, number?] | number[]);
  /**
   * The x component of the quaternion. Equivalent to `this[0];`
   * @category Quaternion Components
   */
  get x(): number;
  set x(value: number);
  /**
   * The y component of the quaternion. Equivalent to `this[1];`
   * @category Quaternion Components
   */
  get y(): number;
  set y(value: number);
  /**
   * The z component of the quaternion. Equivalent to `this[2];`
   * @category Quaternion Components
   */
  get z(): number;
  set z(value: number);
  /**
   * The w component of the quaternion. Equivalent to `this[3];`
   * @category Quaternion Components
   */
  get w(): number;
  set w(value: number);
  /**
   * The magnitude (length) of this.
   * Equivalent to `Quat.magnitude(this);`
   *
   * Magnitude is used because the `length` attribute is already defined by
   * TypedArrays to mean the number of elements in the array.
   *
   * @category Accessors
   */
  get magnitude(): number;
  /**
   * Alias for {@link Quat.magnitude}
   *
   * @category Accessors
   */
  get mag(): number;
  /**
   * A string representation of `this`
   * Equivalent to `Quat.str(this);`
   *
   * @category Accessors
   */
  get str(): string;
  /**
   * Copy the values from another {@link Quat} into `this`.
   * @category Methods
   *
   * @param a the source quaternion
   * @returns `this`
   */
  copy(a: Readonly<QuatLike>): this;
  /**
   * Set `this` to the identity quaternion
   * Equivalent to Quat.identity(this)
   * @category Methods
   *
   * @returns `this`
   */
  identity(): this;
  /**
   * Multiplies `this` by a {@link Quat}.
   * Equivalent to `Quat.multiply(this, this, b);`
   * @category Methods
   *
   * @param b - The vector to multiply `this` by
   * @returns `this`
   */
  multiply(b: Readonly<QuatLike>): this;
  /**
   * Alias for {@link Quat.multiply}
   * @category Methods
   */
  mul(b: Readonly<QuatLike>): this;
  /**
   * Rotates `this` by the given angle about the X axis
   * Equivalent to `Quat.rotateX(this, this, rad);`
   * @category Methods
   *
   * @param rad - angle (in radians) to rotate
   * @returns `this`
   */
  rotateX(rad: number): this;
  /**
   * Rotates `this` by the given angle about the Y axis
   * Equivalent to `Quat.rotateY(this, this, rad);`
   * @category Methods
   *
   * @param rad - angle (in radians) to rotate
   * @returns `this`
   */
  rotateY(rad: number): this;
  /**
   * Rotates `this` by the given angle about the Z axis
   * Equivalent to `Quat.rotateZ(this, this, rad);`
   * @category Methods
   *
   * @param rad - angle (in radians) to rotate
   * @returns `this`
   */
  rotateZ(rad: number): this;
  /**
   * Inverts `this`
   * Equivalent to `Quat.invert(this, this);`
   * @category Methods
   *
   * @returns `this`
   */
  invert(): this;
  /**
   * Scales `this` by a scalar number
   * Equivalent to `Quat.scale(this, this, scale);`
   * @category Methods
   *
   * @param scale - amount to scale the vector by
   * @returns `this`
   */
  scale(scale: number): QuatLike;
  /**
   * Calculates the dot product of `this` and another {@link Quat}
   * Equivalent to `Quat.dot(this, b);`
   * @category Methods
   *
   * @param b - the second operand
   * @returns dot product of `this` and b
   */
  dot(b: Readonly<QuatLike>): number;
  /**
   * @category Static
   *
   * @returns The number of bytes in a {@link Quat}.
   */
  static get BYTE_LENGTH(): number;
  /**
   * Creates a new identity quat
   * @category Static
   *
   * @returns a new quaternion
   */
  static create(): Quat;
  /**
   * Set a quat to the identity quaternion
   * @category Static
   *
   * @param out - the receiving quaternion
   * @returns `out`
   */
  static identity(out: QuatLike): QuatLike;
  /**
   * Sets a quat from the given angle and rotation axis,
   * then returns it.
   * @category Static
   *
   * @param out - the receiving quaternion
   * @param axis - the axis around which to rotate
   * @param rad - the angle in radians
   * @returns `out`
   **/
  static setAxisAngle(out: QuatLike, axis: Readonly<Vec3Like>, rad: number): QuatLike;
  /**
   * Gets the rotation axis and angle for a given
   *  quaternion. If a quaternion is created with
   *  setAxisAngle, this method will return the same
   *  values as provided in the original parameter list
   *  OR functionally equivalent values.
   * Example: The quaternion formed by axis [0, 0, 1] and
   *  angle -90 is the same as the quaternion formed by
   *  [0, 0, 1] and 270. This method favors the latter.
   * @category Static
   *
   * @param out_axis - Vector receiving the axis of rotation
   * @param q - Quaternion to be decomposed
   * @return Angle, in radians, of the rotation
   */
  static getAxisAngle(out_axis: Vec3Like, q: Readonly<QuatLike>): number;
  /**
   * Gets the angular distance between two unit quaternions
   * @category Static
   *
   * @param  {ReadonlyQuat} a     Origin unit quaternion
   * @param  {ReadonlyQuat} b     Destination unit quaternion
   * @return {Number}     Angle, in radians, between the two quaternions
   */
  static getAngle(a: Readonly<QuatLike>, b: Readonly<QuatLike>): number;
  /**
   * Multiplies two quaternions.
   * @category Static
   *
   * @param out - the receiving quaternion
   * @param a - the first operand
   * @param b - the second operand
   * @returns `out`
   */
  static multiply(out: QuatLike, a: Readonly<QuatLike>, b: Readonly<QuatLike>): QuatLike;
  /**
   * Rotates a quaternion by the given angle about the X axis
   * @category Static
   *
   * @param out - quat receiving operation result
   * @param a - quat to rotate
   * @param rad - angle (in radians) to rotate
   * @returns `out`
   */
  static rotateX(out: QuatLike, a: Readonly<QuatLike>, rad: number): QuatLike;
  /**
   * Rotates a quaternion by the given angle about the Y axis
   * @category Static
   *
   * @param out - quat receiving operation result
   * @param a - quat to rotate
   * @param rad - angle (in radians) to rotate
   * @returns `out`
   */
  static rotateY(out: QuatLike, a: Readonly<QuatLike>, rad: number): QuatLike;
  /**
   * Rotates a quaternion by the given angle about the Z axis
   * @category Static
   *
   * @param out - quat receiving operation result
   * @param a - quat to rotate
   * @param rad - angle (in radians) to rotate
   * @returns `out`
   */
  static rotateZ(out: QuatLike, a: Readonly<QuatLike>, rad: number): QuatLike;
  /**
   * Calculates the W component of a quat from the X, Y, and Z components.
   * Assumes that quaternion is 1 unit in length.
   * Any existing W component will be ignored.
   * @category Static
   *
   * @param out - the receiving quaternion
   * @param a - quat to calculate W component of
   * @returns `out`
   */
  static calculateW(out: QuatLike, a: Readonly<QuatLike>): QuatLike;
  /**
   * Calculate the exponential of a unit quaternion.
   * @category Static
   *
   * @param out - the receiving quaternion
   * @param a - quat to calculate the exponential of
   * @returns `out`
   */
  static exp(out: QuatLike, a: Readonly<QuatLike>): QuatLike;
  /**
   * Calculate the natural logarithm of a unit quaternion.
   * @category Static
   *
   * @param out - the receiving quaternion
   * @param a - quat to calculate the exponential of
   * @returns `out`
   */
  static ln(out: QuatLike, a: Readonly<QuatLike>): QuatLike;
  /**
   * Calculate the scalar power of a unit quaternion.
   * @category Static
   *
   * @param out - the receiving quaternion
   * @param a - quat to calculate the exponential of
   * @param b - amount to scale the quaternion by
   * @returns `out`
   */
  static pow(out: QuatLike, a: Readonly<QuatLike>, b: number): QuatLike;
  /**
   * Performs a spherical linear interpolation between two quat
   * @category Static
   *
   * @param out - the receiving quaternion
   * @param a - the first operand
   * @param b - the second operand
   * @param t - interpolation amount, in the range [0-1], between the two inputs
   * @returns `out`
   */
  static slerp(out: QuatLike, a: Readonly<QuatLike>, b: Readonly<QuatLike>, t: number): QuatLike;
  /**
   * Generates a random unit quaternion
   * @category Static
   *
   * @param out - the receiving quaternion
   * @returns `out`
   */
  /**
   * Calculates the inverse of a quat
   * @category Static
   *
   * @param out - the receiving quaternion
   * @param a - quat to calculate inverse of
   * @returns `out`
   */
  static invert(out: QuatLike, a: Readonly<QuatLike>): QuatLike;
  /**
   * Calculates the conjugate of a quat
   * If the quaternion is normalized, this function is faster than `quat.inverse` and produces the same result.
   * @category Static
   *
   * @param out - the receiving quaternion
   * @param a - quat to calculate conjugate of
   * @returns `out`
   */
  static conjugate(out: QuatLike, a: Readonly<QuatLike>): QuatLike;
  /**
   * Creates a quaternion from the given 3x3 rotation matrix.
   *
   * NOTE: The resultant quaternion is not normalized, so you should be sure
   * to re-normalize the quaternion yourself where necessary.
   * @category Static
   *
   * @param out - the receiving quaternion
   * @param m - rotation matrix
   * @returns `out`
   */
  static fromMat3(out: QuatLike, m: Readonly<Mat3Like>): QuatLike;
  /**
   * Creates a quaternion from the given euler angle x, y, z.
   * @category Static
   *
   * @param out - the receiving quaternion
   * @param x - Angle to rotate around X axis in degrees.
   * @param y - Angle to rotate around Y axis in degrees.
   * @param z - Angle to rotate around Z axis in degrees.
   * @param {'xyz'|'xzy'|'yxz'|'yzx'|'zxy'|'zyx'} order - Intrinsic order for conversion, default is zyx.
   * @returns `out`
   */
  static fromEuler(out: QuatLike, x: number, y: number, z: number, order?: string): QuatLike;
  /**
   * Returns a string representation of a quatenion
   * @category Static
   *
   * @param a - vector to represent as a string
   * @returns string representation of the vector
   */
  static str(a: Readonly<QuatLike>): string;
  /**
   * Creates a new quat initialized with values from an existing quaternion
   * @category Static
   *
   * @param a - quaternion to clone
   * @returns a new quaternion
   */
  static clone(a: Readonly<QuatLike>): Quat;
  /**
   * Creates a new quat initialized with the given values
   * @category Static
   *
   * @param x - X component
   * @param y - Y component
   * @param z - Z component
   * @param w - W component
   * @returns a new quaternion
   */
  static fromValues(x: number, y: number, z: number, w: number): Quat;
  /**
   * Copy the values from one quat to another
   * @category Static
   *
   * @param out - the receiving quaternion
   * @param a - the source quaternion
   * @returns `out`
   */
  static copy(out: QuatLike, a: Readonly<QuatLike>): QuatLike;
  /**
   * Set the components of a {@link Quat} to the given values
   * @category Static
   *
   * @param out - the receiving quaternion
   * @param x - X component
   * @param y - Y component
   * @param z - Z component
   * @param w - W component
   * @returns `out`
   */
  static set(out: QuatLike, x: number, y: number, z: number, w: number): QuatLike;
  /**
   * Adds two {@link Quat}'s
   * @category Static
   *
   * @param out - the receiving quaternion
   * @param a - the first operand
   * @param b - the second operand
   * @returns `out`
   */
  static add(out: QuatLike, a: Readonly<QuatLike>, b: Readonly<QuatLike>): QuatLike;
  /**
   * Alias for {@link Quat.multiply}
   * @category Static
   */
  static mul(out: QuatLike, a: Readonly<QuatLike>, b: Readonly<QuatLike>): QuatLike;
  /**
   * Scales a quat by a scalar number
   * @category Static
   *
   * @param out - the receiving vector
   * @param a - the vector to scale
   * @param b - amount to scale the vector by
   * @returns `out`
   */
  static scale(out: QuatLike, a: Readonly<QuatLike>, scale: number): QuatLike;
  /**
   * Calculates the dot product of two quat's
   * @category Static
   *
   * @param a - the first operand
   * @param b - the second operand
   * @returns dot product of a and b
   */
  static dot(a: Readonly<QuatLike>, b: Readonly<QuatLike>): number;
  /**
   * Performs a linear interpolation between two quat's
   * @category Static
   *
   * @param out - the receiving quaternion
   * @param a - the first operand
   * @param b - the second operand
   * @param t - interpolation amount, in the range [0-1], between the two inputs
   * @returns `out`
   */
  static lerp(out: QuatLike, a: Readonly<QuatLike>, b: Readonly<QuatLike>, t: number): QuatLike;
  /**
   * Calculates the magnitude (length) of a {@link Quat}
   * @category Static
   *
   * @param a - quaternion to calculate length of
   * @returns length of `a`
   */
  static magnitude(a: Readonly<QuatLike>): number;
  /**
   * Alias for {@link Quat.magnitude}
   * @category Static
   */
  static mag(a: Readonly<QuatLike>): number;
  /**
   * Alias for {@link Quat.magnitude}
   * @category Static
   * @deprecated Use {@link Quat.magnitude} to avoid conflicts with builtin `length` methods/attribs
   */
  static length(a: Readonly<QuatLike>): number;
  /**
   * Alias for {@link Quat.magnitude}
   * @category Static
   * @deprecated Use {@link Quat.mag}
   */
  static len(a: Readonly<QuatLike>): number;
  /**
   * Calculates the squared length of a {@link Quat}
   * @category Static
   *
   * @param a - quaternion to calculate squared length of
   * @returns squared length of a
   */
  static squaredLength(a: Readonly<QuatLike>): number;
  /**
   * Alias for {@link Quat.squaredLength}
   * @category Static
   */
  static sqrLen(a: Readonly<QuatLike>): number;
  /**
   * Normalize a {@link Quat}
   * @category Static
   *
   * @param out - the receiving quaternion
   * @param a - quaternion to normalize
   * @returns `out`
   */
  static normalize(out: QuatLike, a: Readonly<QuatLike>): QuatLike;
  /**
   * Returns whether the quaternions have exactly the same elements in the same position (when compared with ===)
   * @category Static
   *
   * @param a - The first quaternion.
   * @param b - The second quaternion.
   * @returns True if the vectors are equal, false otherwise.
   */
  static exactEquals(a: Readonly<QuatLike>, b: Readonly<QuatLike>): boolean;
  /**
   * Returns whether the quaternions have approximately the same elements in the same position.
   * @category Static
   *
   * @param a - The first vector.
   * @param b - The second vector.
   * @returns True if the vectors are equal, false otherwise.
   */
  static equals(a: Readonly<QuatLike>, b: Readonly<QuatLike>): boolean;
  /**
   * Sets a quaternion to represent the shortest rotation from one
   * vector to another.
   *
   * Both vectors are assumed to be unit length.
   * @category Static
   *
   * @param out - the receiving quaternion.
   * @param a - the initial vector
   * @param b - the destination vector
   * @returns `out`
   */
  static rotationTo(out: QuatLike, a: Readonly<Vec3Like>, b: Readonly<Vec3Like>): QuatLike;
  /**
   * Performs a spherical linear interpolation with two control points
   * @category Static
   *
   * @param out - the receiving quaternion
   * @param a - the first operand
   * @param b - the second operand
   * @param c - the third operand
   * @param d - the fourth operand
   * @param t - interpolation amount, in the range [0-1], between the two inputs
   * @returns `out`
   */
  static sqlerp(
    out: QuatLike,
    a: Readonly<QuatLike>,
    b: Readonly<QuatLike>,
    c: Readonly<QuatLike>,
    d: Readonly<QuatLike>,
    t: number,
  ): QuatLike;
  /**
   * Sets the specified quaternion with values corresponding to the given
   * axes. Each axis is a vec3 and is expected to be unit length and
   * perpendicular to all other specified axes.
   * @category Static
   *
   * @param out - The receiving quaternion
   * @param view - the vector representing the viewing direction
   * @param right - the vector representing the local `right` direction
   * @param up - the vector representing the local `up` direction
   * @returns `out`
   */
  static setAxes(out: QuatLike, view: Readonly<Vec3Like>, right: Readonly<Vec3Like>, up: Readonly<Vec3Like>): QuatLike;
}

/**
 * Dual Quaternion
 */
declare class Quat2 extends Float32Array {
  #private;
  /**
   * Create a {@link Quat2}.
   *
   * @category Constructor
   */
  constructor(...values: [Readonly<Quat2Like> | ArrayBufferLike, number?] | number[]);
  /**
   * A string representation of `this`
   * Equivalent to `Quat2.str(this);`
   *
   * @category Accessors
   */
  get str(): string;
  /**
   * Copy the values from another {@link Quat2} into `this`.
   * @category Methods
   *
   * @param a the source dual quaternion
   * @returns `this`
   */
  copy(a: Readonly<Quat2Like>): this;
  /**
   * @category Static
   *
   * @returns The number of bytes in a {@link Quat2}.
   */
  static get BYTE_LENGTH(): number;
  /**
   * Creates a new identity {@link Quat2}
   * @category Static
   *
   * @returns a new dual quaternion [real -> rotation, dual -> translation]
   */
  static create(): Quat2;
  /**
   * Creates a {@link Quat2} quat initialized with values from an existing quaternion
   * @category Static
   *
   * @param a - dual quaternion to clone
   * @returns a new dual quaternion
   */
  static clone(a: Quat2Like): Quat2;
  /**
   * Creates a new {@link Quat2}  initialized with the given values
   * @category Static
   *
   * @param x1 - 1st X component
   * @param y1 - 1st Y component
   * @param z1 - 1st Z component
   * @param w1 - 1st W component
   * @param x2 - 2nd X component
   * @param y2 - 2nd Y component
   * @param z2 - 2nd Z component
   * @param w2 - 2nd W component
   * @returns a new dual quaternion
   */
  static fromValues(
    x1: number,
    y1: number,
    z1: number,
    w1: number,
    x2: number,
    y2: number,
    z2: number,
    w2: number,
  ): Quat2;
  /**
   * Creates a new {@link Quat2} from the given values (quat and translation)
   * @category Static
   *
   * @param x1 - X component (rotation)
   * @param y1 - Y component (rotation)
   * @param z1 - Z component (rotation)
   * @param w1 - W component (rotation)
   * @param x2 - X component (translation)
   * @param y2 - Y component (translation)
   * @param z2 - Z component (translation)
   * @returns a new dual quaternion
   */
  static fromRotationTranslationValues(
    x1: number,
    y1: number,
    z1: number,
    w1: number,
    x2: number,
    y2: number,
    z2: number,
  ): Quat2;
  /**
   * Sets a {@link Quat2} from a quaternion and a translation
   * @category Static
   *
   * @param out - dual quaternion receiving operation result
   * @param q - a normalized quaternion
   * @param t - translation vector
   * @returns `out`
   */
  static fromRotationTranslation(out: Quat2Like, q: Readonly<QuatLike>, t: Readonly<Vec3Like>): Quat2Like;
  /**
   * Sets a {@link Quat2} from a translation
   * @category Static
   *
   * @param out - dual quaternion receiving operation result
   * @param t - translation vector
   * @returns `out`
   */
  static fromTranslation(out: Quat2Like, t: Readonly<Vec3Like>): Quat2Like;
  /**
   * Sets a {@link Quat2} from a quaternion
   * @category Static
   *
   * @param out - dual quaternion receiving operation result
   * @param q - a normalized quaternion
   * @returns `out`
   */
  static fromRotation(out: Quat2Like, q: Readonly<QuatLike>): Quat2Like;
  /**
   * Sets a {@link Quat2} from a quaternion
   * @category Static
   *
   * @param out - dual quaternion receiving operation result
   * @param a - the matrix
   * @returns `out`
   */
  static fromMat4(out: Quat2Like, a: Readonly<Mat4Like>): Quat2Like;
  /**
   * Copy the values from one {@link Quat2} to another
   * @category Static
   *
   * @param out - the receiving dual quaternion
   * @param a - the source dual quaternion
   * @returns `out`
   */
  static copy(out: Quat2Like, a: Readonly<Quat2Like>): Quat2Like;
  /**
   * Set a {@link Quat2} to the identity dual quaternion
   * @category Static
   *
   * @param out - the receiving dual quaternion
   * @returns `out`
   */
  static identity(out: QuatLike): QuatLike;
  /**
   * Set the components of a {@link Quat2} to the given values
   * @category Static
   *
   * @param out - the receiving vector
   * @param x1 - 1st X component
   * @param y1 - 1st Y component
   * @param z1 - 1st Z component
   * @param w1 - 1st W component
   * @param x2 - 2nd X component
   * @param y2 - 2nd Y component
   * @param z2 - 2nd Z component
   * @param w2 - 2nd W component
   * @returns `out`
   */
  static set(
    out: Quat2Like,
    x1: number,
    y1: number,
    z1: number,
    w1: number,
    x2: number,
    y2: number,
    z2: number,
    w2: number,
  ): Quat2Like;
  /**
   * Gets the real part of a dual quat
   * @category Static
   *
   * @param out - real part
   * @param a - Dual Quaternion
   * @return `out`
   */
  static getReal(out: QuatLike, a: Readonly<Quat2Like>): QuatLike;
  /**
   * Gets the dual part of a dual quat
   * @category Static
   *
   * @param out - dual part
   * @param a - Dual Quaternion
   * @return `out`
   */
  static getDual(out: QuatLike, a: Readonly<Quat2Like>): QuatLike;
  /**
   * Set the real component of a {@link Quat2} to the given quaternion
   * @category Static
   *
   * @param out - the receiving dual quaternion
   * @param a - a quaternion representing the real part
   * @return `out`
   */
  static setReal(out: Quat2Like, a: Readonly<QuatLike>): Quat2Like;
  /**
   * Set the dual component of a {@link Quat2} to the given quaternion
   * @category Static
   *
   * @param out - the receiving dual quaternion
   * @param a - a quaternion representing the dual part
   * @return `out`
   */
  static setDual(out: Quat2Like, a: Readonly<QuatLike>): Quat2Like;
  /**
   * Gets the translation of a normalized {@link Quat2}
   * @category Static
   *
   * @param out - the receiving translation vector
   * @param a - Dual Quaternion to be decomposed
   * @return `out`
   */
  static getTranslation(out: Vec3Like, a: Readonly<Quat2Like>): Vec3Like;
  /**
   * Translates a {@link Quat2} by the given vector
   * @category Static
   *
   * @param out - the receiving dual quaternion
   * @param a - the dual quaternion to translate
   * @param v - vector to translate by
   * @returns `out`
   */
  static translate(out: Quat2Like, a: Readonly<Quat2Like>, v: Readonly<Vec3Like>): Quat2Like;
  /**
   * Rotates a {@link Quat2} around the X axis
   * @category Static
   *
   * @param out - the receiving dual quaternion
   * @param a - the dual quaternion to rotate
   * @param rad - angle (in radians) to rotate
   * @returns `out`
   */
  static rotateX(out: Quat2Like, a: Readonly<Quat2Like>, rad: number): Quat2Like;
  /**
   * Rotates a {@link Quat2} around the Y axis
   * @category Static
   *
   * @param out - the receiving dual quaternion
   * @param a - the dual quaternion to rotate
   * @param rad - angle (in radians) to rotate
   * @returns `out`
   */
  static rotateY(out: Quat2Like, a: Readonly<Quat2Like>, rad: number): Quat2Like;
  /**
   * Rotates a {@link Quat2} around the Z axis
   * @category Static
   *
   * @param out - the receiving dual quaternion
   * @param a - the dual quaternion to rotate
   * @param rad - angle (in radians) to rotate
   * @returns `out`
   */
  static rotateZ(out: Quat2Like, a: Readonly<Quat2Like>, rad: number): Quat2Like;
  /**
   * Rotates a {@link Quat2} by a given quaternion (a * q)
   * @category Static
   *
   * @param out - the receiving dual quaternion
   * @param a - the dual quaternion to rotate
   * @param q - quaternion to rotate by
   * @returns `out`
   */
  static rotateByQuatAppend(out: Quat2Like, a: Readonly<Quat2Like>, q: Readonly<QuatLike>): Quat2Like;
  /**
   * Rotates a {@link Quat2} by a given quaternion (q * a)
   * @category Static
   *
   * @param out - the receiving dual quaternion
   * @param q - quaternion to rotate by
   * @param a - the dual quaternion to rotate
   * @returns `out`
   */
  static rotateByQuatPrepend(out: Quat2Like, q: Readonly<QuatLike>, a: Readonly<Quat2Like>): Quat2Like;
  /**
   * Rotates a {@link Quat2} around a given axis. Does the normalization automatically
   * @category Static
   *
   * @param out - the receiving dual quaternion
   * @param a - the dual quaternion to rotate
   * @param axis - the axis to rotate around
   * @param rad - how far the rotation should be
   * @returns `out`
   */
  static rotateAroundAxis(out: Quat2Like, a: Readonly<Quat2Like>, axis: Readonly<Vec3Like>, rad: number): Quat2Like;
  /**
   * Adds two {@link Quat2}s
   * @category Static
   *
   * @param out - the receiving dual quaternion
   * @param a - the first operand
   * @param b - the second operand
   * @returns `out`
   */
  static add(out: Quat2Like, a: Readonly<Quat2Like>, b: Readonly<Quat2Like>): Quat2Like;
  /**
   * Multiplies two {@link Quat2}s
   * @category Static
   *
   * @param out - the receiving dual quaternion
   * @param a - the first operand
   * @param b - the second operand
   * @returns {quat2} out
   */
  static multiply(out: Quat2Like, a: Readonly<Quat2Like>, b: Readonly<Quat2Like>): Quat2Like;
  /**
   * Alias for {@link Quat2.multiply}
   * @category Static
   */
  static mul(out: Quat2Like, a: Readonly<Quat2Like>, b: Readonly<Quat2Like>): Quat2Like;
  /**
   * Scales a {@link Quat2} by a scalar value
   * @category Static
   *
   * @param out - the receiving dual quaterion
   * @param a - the dual quaternion to scale
   * @param b - scalar value to scale the dual quaterion by
   * @returns `out`
   */
  static scale(out: Quat2Like, a: Readonly<Quat2Like>, b: number): Quat2Like;
  /**
   * Calculates the dot product of two {@link Quat2}s (The dot product of the real parts)
   * @category Static
   *
   * @param a - the first operand
   * @param b - the second operand
   * @returns dot product of a and b
   */
  static dot(a: Readonly<Quat2Like>, b: Readonly<Quat2Like>): number;
  /**
   * Performs a linear interpolation between two {@link Quat2}s
   * NOTE: The resulting dual quaternions won't always be normalized (The error is most noticeable when `t = 0.5`)
   * @category Static
   *
   * @param out - the receiving dual quat
   * @param a - the first operand
   * @param b - the second operand
   * @param t - interpolation amount, in the range [0-1], between the two inputs
   * @returns `out`
   */
  static lerp(out: Quat2Like, a: Readonly<Quat2Like>, b: Readonly<Quat2Like>, t: number): Quat2Like;
  /**
   * Calculates the inverse of a {@link Quat2}. If they are normalized, conjugate is cheaper
   * @category Static
   *
   * @param out - the receiving dual quaternion
   * @param a - dual quat to calculate inverse of
   * @returns `out`
   */
  static invert(out: Quat2Like, a: Readonly<Quat2Like>): Quat2Like;
  /**
   * Calculates the conjugate of a {@link Quat2}. If the dual quaternion is normalized, this function is faster than
   * {@link Quat2.invert} and produces the same result.
   * @category Static
   *
   * @param out - the receiving dual quaternion
   * @param a - dual quaternion to calculate conjugate of
   * @returns `out`
   */
  static conjugate(out: Quat2Like, a: Readonly<Quat2Like>): Quat2Like;
  /**
   * Calculates the magnitude (length) of a {@link Quat2}
   * @category Static
   *
   * @param a - dual quaternion to calculate length of
   * @returns length of `a`
   */
  static magnitude(a: Readonly<Quat2Like>): number;
  /**
   * Alias for {@link Quat2.magnitude}
   * @category Static
   */
  static mag(a: Readonly<Quat2Like>): number;
  /**
   * Alias for {@link Quat2.magnitude}
   * @category Static
   * @deprecated Use {@link Quat2.magnitude} to avoid conflicts with builtin `length` methods/attribs
   */
  static length(a: Readonly<Quat2Like>): number;
  /**
   * Alias for {@link Quat2.magnitude}
   * @category Static
   * @deprecated Use {@link Quat2.mag}
   */
  static len(a: Readonly<Quat2Like>): number;
  /**
   * Calculates the squared length of a {@link Quat2}
   * @category Static
   *
   * @param a - dual quaternion to calculate squared length of
   * @returns squared length of a
   */
  static squaredLength(a: Readonly<Quat2Like>): number;
  /**
   * Alias for {@link Quat2.squaredLength}
   * @category Static
   */
  static sqrLen(a: Readonly<Quat2Like>): number;
  /**
   * Normalize a {@link Quat2}
   * @category Static
   *
   * @param out - the receiving dual quaternion
   * @param a - dual quaternion to normalize
   * @returns `out`
   */
  static normalize(out: Quat2Like, a: Readonly<Quat2Like>): Quat2Like;
  /**
   * Returns a string representation of a {@link Quat2}
   * @category Static
   *
   * @param a - dual quaternion to represent as a string
   * @returns string representation of the vector
   */
  static str(a: Readonly<Quat2Like>): string;
  /**
   * Returns whether the {@link Quat2}s have exactly the same elements in the same position (when compared with ===)
   * @category Static
   *
   * @param a - The first dual quaternion.
   * @param b - The second dual quaternion.
   * @returns True if the dual quaternions are equal, false otherwise.
   */
  static exactEquals(a: Readonly<Quat2Like>, b: Readonly<Quat2Like>): boolean;
  /**
   * Returns whether the {@link Quat2}s have approximately the same elements in the same position.
   * @category Static
   *
   * @param a - The first dual quaternion.
   * @param b - The second dual quaternion.
   * @returns True if the dual quaternions are equal, false otherwise.
   */
  static equals(a: Readonly<Quat2Like>, b: Readonly<Quat2Like>): boolean;
}

/**
 * 2 Dimensional Vector
 */
declare class Vec2 extends Float32Array {
  /**
   * Create a {@link Vec2}.
   *
   * @category Constructor
   */
  constructor(...values: [Readonly<Vec2Like> | ArrayBufferLike, number?] | number[]);
  /**
   * The x component of the vector. Equivalent to `this[0];`
   * @category Vector Components
   */
  get x(): number;
  set x(value: number);
  /**
   * The y component of the vector. Equivalent to `this[1];`
   * @category Vector Components
   */
  get y(): number;
  set y(value: number);
  /**
   * The r component of the vector. Equivalent to `this[0];`
   * @category Color Components
   */
  get r(): number;
  set r(value: number);
  /**
   * The g component of the vector. Equivalent to `this[1];`
   * @category Color Components
   */
  get g(): number;
  set g(value: number);
  /**
   * The magnitude (length) of this.
   * Equivalent to `Vec2.magnitude(this);`
   *
   * Magnitude is used because the `length` attribute is already defined by
   * TypedArrays to mean the number of elements in the array.
   *
   * @category Accessors
   */
  get magnitude(): number;
  /**
   * Alias for {@link Vec2.magnitude}
   *
   * @category Accessors
   */
  get mag(): number;
  /**
   * The squared magnitude (length) of `this`.
   * Equivalent to `Vec2.squaredMagnitude(this);`
   *
   * @category Accessors
   */
  get squaredMagnitude(): number;
  /**
   * Alias for {@link Vec2.squaredMagnitude}
   *
   * @category Accessors
   */
  get sqrMag(): number;
  /**
   * A string representation of `this`
   * Equivalent to `Vec2.str(this);`
   *
   * @category Accessors
   */
  get str(): string;
  /**
   * Copy the values from another {@link Vec2} into `this`.
   * @category Methods
   *
   * @param a the source vector
   * @returns `this`
   */
  copy(a: Readonly<Vec2Like>): this;
  /**
   * Adds a {@link Vec2} to `this`.
   * Equivalent to `Vec2.add(this, this, b);`
   * @category Methods
   *
   * @param b - The vector to add to `this`
   * @returns `this`
   */
  add(b: Readonly<Vec2Like>): this;
  /**
   * Subtracts a {@link Vec2} from `this`.
   * Equivalent to `Vec2.subtract(this, this, b);`
   * @category Methods
   *
   * @param b - The vector to subtract from `this`
   * @returns `this`
   */
  subtract(b: Readonly<Vec2Like>): this;
  /**
   * Alias for {@link Vec2.subtract}
   * @category Methods
   */
  sub(b: Readonly<Vec2Like>): this;
  /**
   * Multiplies `this` by a {@link Vec2}.
   * Equivalent to `Vec2.multiply(this, this, b);`
   * @category Methods
   *
   * @param b - The vector to multiply `this` by
   * @returns `this`
   */
  multiply(b: Readonly<Vec2Like>): this;
  /**
   * Alias for {@link Vec2.multiply}
   * @category Methods
   */
  mul(b: Readonly<Vec2Like>): this;
  /**
   * Divides `this` by a {@link Vec2}.
   * Equivalent to `Vec2.divide(this, this, b);`
   * @category Methods
   *
   * @param b - The vector to divide `this` by
   * @returns `this`
   */
  divide(b: Readonly<Vec2Like>): this;
  /**
   * Alias for {@link Vec2.divide}
   * @category Methods
   */
  div(b: Readonly<Vec2Like>): this;
  /**
   * Scales `this` by a scalar number.
   * Equivalent to `Vec2.scale(this, this, b);`
   * @category Methods
   *
   * @param b - Amount to scale `this` by
   * @returns `this`
   */
  scale(b: number): this;
  /**
   * Calculates `this` scaled by a scalar value then adds the result to `this`.
   * Equivalent to `Vec2.scaleAndAdd(this, this, b, scale);`
   * @category Methods
   *
   * @param b - The vector to add to `this`
   * @param scale - The amount to scale `b` by before adding
   * @returns `this`
   */
  scaleAndAdd(b: Readonly<Vec2Like>, scale: number): this;
  /**
   * Calculates the Euclidean distance between another {@link Vec2} and `this`.
   * Equivalent to `Vec2.distance(this, b);`
   * @category Methods
   *
   * @param b - The vector to calculate the distance to
   * @returns Distance between `this` and `b`
   */
  distance(b: Readonly<Vec2Like>): number;
  /**
   * Alias for {@link Vec2.distance}
   * @category Methods
   */
  dist(b: Readonly<Vec2Like>): number;
  /**
   * Calculates the squared Euclidean distance between another {@link Vec2} and `this`.
   * Equivalent to `Vec2.squaredDistance(this, b);`
   * @category Methods
   *
   * @param b The vector to calculate the squared distance to
   * @returns Squared distance between `this` and `b`
   */
  squaredDistance(b: Readonly<Vec2Like>): number;
  /**
   * Alias for {@link Vec2.squaredDistance}
   * @category Methods
   */
  sqrDist(b: Readonly<Vec2Like>): number;
  /**
   * Negates the components of `this`.
   * Equivalent to `Vec2.negate(this, this);`
   * @category Methods
   *
   * @returns `this`
   */
  negate(): this;
  /**
   * Inverts the components of `this`.
   * Equivalent to `Vec2.inverse(this, this);`
   * @category Methods
   *
   * @returns `this`
   */
  invert(): this;
  /**
   * Sets each component of `this` to it's absolute value.
   * Equivalent to `Vec2.abs(this, this);`
   * @category Methods
   *
   * @returns `this`
   */
  abs(): this;
  /**
   * Calculates the dot product of this and another {@link Vec2}.
   * Equivalent to `Vec2.dot(this, b);`
   * @category Methods
   *
   * @param b - The second operand
   * @returns Dot product of `this` and `b`
   */
  dot(b: Readonly<Vec2Like>): number;
  /**
   * Normalize `this`.
   * Equivalent to `Vec2.normalize(this, this);`
   * @category Methods
   *
   * @returns `this`
   */
  normalize(): this;
  /**
   * @category Static
   *
   * @returns The number of bytes in a {@link Vec2}.
   */
  static get BYTE_LENGTH(): number;
  /**
   * Creates a new, empty {@link Vec2}
   * @category Static
   *
   * @returns A new 2D vector
   */
  static create(): Vec2;
  /**
   * Creates a new {@link Vec2} initialized with values from an existing vector
   * @category Static
   *
   * @param a - Vector to clone
   * @returns A new 2D vector
   */
  static clone(a: Readonly<Vec2Like>): Vec2;
  /**
   * Creates a new {@link Vec2} initialized with the given values
   * @category Static
   *
   * @param x - X component
   * @param y - Y component
   * @returns A new 2D vector
   */
  static fromValues(x: number, y: number): Vec2;
  /**
   * Copy the values from one {@link Vec2} to another
   * @category Static
   *
   * @param out - the receiving vector
   * @param a - The source vector
   * @returns `out`
   */
  static copy(out: Vec2Like, a: Readonly<Vec2Like>): Vec2Like;
  /**
   * Set the components of a {@link Vec2} to the given values
   * @category Static
   *
   * @param out - The receiving vector
   * @param x - X component
   * @param y - Y component
   * @returns `out`
   */
  static set(out: Vec2Like, x: number, y: number): Vec2Like;
  /**
   * Adds two {@link Vec2}s
   * @category Static
   *
   * @param out - The receiving vector
   * @param a - The first operand
   * @param b - The second operand
   * @returns `out`
   */
  static add(out: Vec2Like, a: Readonly<Vec2Like>, b: Readonly<Vec2Like>): Vec2Like;
  /**
   * Subtracts vector b from vector a
   * @category Static
   *
   * @param out - The receiving vector
   * @param a - The first operand
   * @param b - The second operand
   * @returns `out`
   */
  static subtract(out: Vec2Like, a: Readonly<Vec2Like>, b: Readonly<Vec2Like>): Vec2Like;
  /**
   * Alias for {@link Vec2.subtract}
   * @category Static
   */
  static sub(out: Vec2Like, a: Readonly<Vec2Like>, b: Readonly<Vec2Like>): Vec2Like;
  /**
   * Multiplies two {@link Vec2}s
   * @category Static
   *
   * @param out - The receiving vector
   * @param a - The first operand
   * @param b - The second operand
   * @returns `out`
   */
  static multiply(out: Vec2Like, a: Readonly<Vec2Like>, b: Readonly<Vec2Like>): Vec2Like;
  /**
   * Alias for {@link Vec2.multiply}
   * @category Static
   */
  static mul(out: Vec2Like, a: Readonly<Vec2Like>, b: Readonly<Vec2Like>): Vec2Like;
  /**
   * Divides two {@link Vec2}s
   * @category Static
   *
   * @param out - The receiving vector
   * @param a - The first operand
   * @param b - The second operand
   * @returns `out`
   */
  static divide(out: Vec2Like, a: Readonly<Vec2Like>, b: Readonly<Vec2Like>): Vec2Like;
  /**
   * Alias for {@link Vec2.divide}
   * @category Static
   */
  static div(out: Vec2Like, a: Readonly<Vec2Like>, b: Readonly<Vec2Like>): Vec2Like;
  /**
   * Math.ceil the components of a {@link Vec2}
   * @category Static
   *
   * @param out - The receiving vector
   * @param a - Vector to ceil
   * @returns `out`
   */
  static ceil(out: Vec2Like, a: Readonly<Vec2Like>): Vec2Like;
  /**
   * Math.floor the components of a {@link Vec2}
   * @category Static
   *
   * @param out - The receiving vector
   * @param a - Vector to floor
   * @returns `out`
   */
  static floor(out: Vec2Like, a: Readonly<Vec2Like>): Vec2Like;
  /**
   * Returns the minimum of two {@link Vec2}s
   * @category Static
   *
   * @param out - The receiving vector
   * @param a - The first operand
   * @param b - The second operand
   * @returns `out`
   */
  static min(out: Vec2Like, a: Readonly<Vec2Like>, b: Readonly<Vec2Like>): Vec2Like;
  /**
   * Returns the maximum of two {@link Vec2}s
   * @category Static
   *
   * @param out - The receiving vector
   * @param a - The first operand
   * @param b - The second operand
   * @returns `out`
   */
  static max(out: Vec2Like, a: Readonly<Vec2Like>, b: Readonly<Vec2Like>): Vec2Like;
  /**
   * Math.round the components of a {@link Vec2}
   * @category Static
   *
   * @param out - The receiving vector
   * @param a - Vector to round
   * @returns `out`
   */
  static round(out: Vec2Like, a: Readonly<Vec2Like>): Vec2Like;
  /**
   * Scales a {@link Vec2} by a scalar number
   * @category Static
   *
   * @param out - The receiving vector
   * @param a - The vector to scale
   * @param b - Amount to scale the vector by
   * @returns `out`
   */
  static scale(out: Vec2Like, a: Readonly<Vec2Like>, b: number): Vec2Like;
  /**
   * Adds two Vec2's after scaling the second operand by a scalar value
   * @category Static
   *
   * @param out - The receiving vector
   * @param a - The first operand
   * @param b - The second operand
   * @param scale - The amount to scale b by before adding
   * @returns `out`
   */
  static scaleAndAdd(out: Vec2Like, a: Readonly<Vec2Like>, b: Readonly<Vec2Like>, scale: number): Vec2Like;
  /**
   * Calculates the Euclidean distance between two {@link Vec2}s
   * @category Static
   *
   * @param a - The first operand
   * @param b - The second operand
   * @returns distance between `a` and `b`
   */
  static distance(a: Readonly<Vec2Like>, b: Readonly<Vec2Like>): number;
  /**
   * Alias for {@link Vec2.distance}
   * @category Static
   */
  static dist(a: Readonly<Vec2Like>, b: Readonly<Vec2Like>): number;
  /**
   * Calculates the squared Euclidean distance between two {@link Vec2}s
   * @category Static
   *
   * @param a - The first operand
   * @param b - The second operand
   * @returns Squared distance between `a` and `b`
   */
  static squaredDistance(a: Readonly<Vec2Like>, b: Readonly<Vec2Like>): number;
  /**
   * Alias for {@link Vec2.distance}
   * @category Static
   */
  static sqrDist(a: Readonly<Vec2Like>, b: Readonly<Vec2Like>): number;
  /**
   * Calculates the magnitude (length) of a {@link Vec2}
   * @category Static
   *
   * @param a - Vector to calculate magnitude of
   * @returns Magnitude of a
   */
  static magnitude(a: Readonly<Vec2Like>): number;
  /**
   * Alias for {@link Vec2.magnitude}
   * @category Static
   */
  static mag(a: Readonly<Vec2Like>): number;
  /**
   * Alias for {@link Vec2.magnitude}
   * @category Static
   * @deprecated Use {@link Vec2.magnitude} to avoid conflicts with builtin `length` methods/attribs
   *
   * @param a - vector to calculate length of
   * @returns length of a
   */
  static length(a: Readonly<Vec2Like>): number;
  /**
   * Alias for {@link Vec2.magnitude}
   * @category Static
   * @deprecated Use {@link Vec2.mag}
   */
  static len(a: Readonly<Vec2Like>): number;
  /**
   * Calculates the squared length of a {@link Vec2}
   * @category Static
   *
   * @param a - Vector to calculate squared length of
   * @returns Squared length of a
   */
  static squaredLength(a: Readonly<Vec2Like>): number;
  /**
   * Alias for {@link Vec2.squaredLength}
   * @category Static
   */
  static sqrLen(a: Readonly<Vec2Like>, b: Readonly<Vec2Like>): number;
  /**
   * Negates the components of a {@link Vec2}
   * @category Static
   *
   * @param out - The receiving vector
   * @param a - Vector to negate
   * @returns `out`
   */
  static negate(out: Vec2Like, a: Readonly<Vec2Like>): Vec2Like;
  /**
   * Returns the inverse of the components of a {@link Vec2}
   * @category Static
   *
   * @param out - The receiving vector
   * @param a - Vector to invert
   * @returns `out`
   */
  static inverse(out: Vec2Like, a: Readonly<Vec2Like>): Vec2Like;
  /**
   * Returns the absolute value of the components of a {@link Vec2}
   * @category Static
   *
   * @param out - The receiving vector
   * @param a - Vector to compute the absolute values of
   * @returns `out`
   */
  static abs(out: Vec2Like, a: Readonly<Vec2Like>): Vec2Like;
  /**
   * Normalize a {@link Vec2}
   * @category Static
   *
   * @param out - The receiving vector
   * @param a - Vector to normalize
   * @returns `out`
   */
  static normalize(out: Vec2Like, a: Readonly<Vec2Like>): Vec2Like;
  /**
   * Calculates the dot product of two {@link Vec2}s
   * @category Static
   *
   * @param a - The first operand
   * @param b - The second operand
   * @returns Dot product of `a` and `b`
   */
  static dot(a: Readonly<Vec2Like>, b: Readonly<Vec2Like>): number;
  /**
   * Computes the cross product of two {@link Vec2}s
   * Note that the cross product must by definition produce a 3D vector.
   * For this reason there is also not instance equivalent for this function.
   * @category Static
   *
   * @param out - The receiving vector
   * @param a - The first operand
   * @param b - The second operand
   * @returns `out`
   */
  static cross(out: Vec2Like, a: Readonly<Vec2Like>, b: Readonly<Vec2Like>): Vec2Like;
  /**
   * Performs a linear interpolation between two {@link Vec2}s
   * @category Static
   *
   * @param out - The receiving vector
   * @param a - The first operand
   * @param b - The second operand
   * @param t - Interpolation amount, in the range [0-1], between the two inputs
   * @returns `out`
   */
  static lerp(out: Vec2Like, a: Readonly<Vec2Like>, b: Readonly<Vec2Like>, t: number): Vec2Like;
  /**
   * Transforms the {@link Vec2} with a {@link Mat2}
   *
   * @param out - The receiving vector
   * @param a - The vector to transform
   * @param m - Matrix to transform with
   * @returns `out`
   * @category Static
   */
  static transformMat2(out: Vec2Like, a: Readonly<Vec2Like>, m: Readonly<Mat2Like>): Vec2Like;
  /**
   * Transforms the {@link Vec2} with a {@link Mat2d}
   *
   * @param out - The receiving vector
   * @param a - The vector to transform
   * @param m - Matrix to transform with
   * @returns `out`
   * @category Static
   */
  static transformMat2d(out: Vec2Like, a: Readonly<Vec2Like>, m: Readonly<Mat2dLike>): Vec2Like;
  /**
   * Transforms the {@link Vec2} with a {@link Mat3}
   * 3rd vector component is implicitly '1'
   *
   * @param out - The receiving vector
   * @param a - The vector to transform
   * @param m - Matrix to transform with
   * @returns `out`
   * @category Static
   */
  static transformMat3(out: Vec2Like, a: Readonly<Vec2Like>, m: Readonly<Mat3Like>): Vec2Like;
  /**
   * Transforms the {@link Vec2} with a {@link Mat4}
   * 3rd vector component is implicitly '0'
   * 4th vector component is implicitly '1'
   *
   * @param out - The receiving vector
   * @param a - The vector to transform
   * @param m - Matrix to transform with
   * @returns `out`
   * @category Static
   */
  static transformMat4(out: Vec2Like, a: Readonly<Vec2Like>, m: Readonly<Mat4Like>): Vec2Like;
  /**
   * Rotate a 2D vector
   * @category Static
   *
   * @param out - The receiving {@link Vec2}
   * @param a - The {@link Vec2} point to rotate
   * @param b - The origin of the rotation
   * @param rad - The angle of rotation in radians
   * @returns `out`
   */
  static rotate(out: Vec2Like, a: Readonly<Vec2Like>, b: Readonly<Vec2Like>, rad: number): Vec2Like;
  /**
   * Get the angle between two 2D vectors
   * @category Static
   *
   * @param a - The first operand
   * @param b - The second operand
   * @returns The angle in radians
   */
  static angle(a: Readonly<Vec2Like>, b: Readonly<Vec2Like>): number;
  /**
   * Set the components of a {@link Vec2} to zero
   * @category Static
   *
   * @param out - The receiving vector
   * @returns `out`
   */
  static zero(out: Vec2Like): Vec2Like;
  /**
   * Returns whether the vectors have exactly the same elements in the same position (when compared with ===)
   * @category Static
   *
   * @param a - The first vector.
   * @param b - The second vector.
   * @returns `true` if the vectors components are ===, `false` otherwise.
   */
  static exactEquals(a: Readonly<Vec2Like>, b: Readonly<Vec2Like>): boolean;
  /**
   * Returns whether the vectors have approximately the same elements in the same position.
   * @category Static
   *
   * @param a - The first vector.
   * @param b - The second vector.
   * @returns `true` if the vectors are approximately equal, `false` otherwise.
   */
  static equals(a: Readonly<Vec2Like>, b: Readonly<Vec2Like>): boolean;
  /**
   * Returns a string representation of a vector
   * @category Static
   *
   * @param a - Vector to represent as a string
   * @returns String representation of the vector
   */
  static str(a: Readonly<Vec2Like>): string;
}

/**
 * 3 Dimensional Vector
 */
declare class Vec3 extends Float32Array {
  /**
   * Create a {@link Vec3}.
   *
   * @category Constructor
   */
  constructor(...values: [Readonly<Vec3Like> | ArrayBufferLike, number?] | number[]);
  /**
   * The x component of the vector. Equivalent to `this[0];`
   * @category Vector Components
   */
  get x(): number;
  set x(value: number);
  /**
   * The y component of the vector. Equivalent to `this[1];`
   * @category Vector Components
   */
  get y(): number;
  set y(value: number);
  /**
   * The z component of the vector. Equivalent to `this[2];`
   * @category Vector Components
   */
  get z(): number;
  set z(value: number);
  /**
   * The r component of the vector. Equivalent to `this[0];`
   * @category Color Components
   */
  get r(): number;
  set r(value: number);
  /**
   * The g component of the vector. Equivalent to `this[1];`
   * @category Color Components
   */
  get g(): number;
  set g(value: number);
  /**
   * The b component of the vector. Equivalent to `this[2];`
   * @category Color Components
   */
  get b(): number;
  set b(value: number);
  /**
   * The magnitude (length) of this.
   * Equivalent to `Vec3.magnitude(this);`
   *
   * Magnitude is used because the `length` attribute is already defined by
   * TypedArrays to mean the number of elements in the array.
   *
   * @category Accessors
   */
  get magnitude(): number;
  /**
   * Alias for {@link Vec3.magnitude}
   *
   * @category Accessors
   */
  get mag(): number;
  /**
   * The squared magnitude (length) of `this`.
   * Equivalent to `Vec3.squaredMagnitude(this);`
   *
   * @category Accessors
   */
  get squaredMagnitude(): number;
  /**
   * Alias for {@link Vec3.squaredMagnitude}
   *
   * @category Accessors
   */
  get sqrMag(): number;
  /**
   * A string representation of `this`
   * Equivalent to `Vec3.str(this);`
   *
   * @category Accessors
   */
  get str(): string;
  /**
   * Copy the values from another {@link Vec3} into `this`.
   * @category Methods
   *
   * @param a the source vector
   * @returns `this`
   */
  copy(a: Readonly<Vec3Like>): this;
  /**
   * Adds a {@link Vec3} to `this`.
   * Equivalent to `Vec3.add(this, this, b);`
   * @category Methods
   *
   * @param b - The vector to add to `this`
   * @returns `this`
   */
  add(b: Readonly<Vec3Like>): this;
  /**
   * Subtracts a {@link Vec3} from `this`.
   * Equivalent to `Vec3.subtract(this, this, b);`
   * @category Methods
   *
   * @param b - The vector to subtract from `this`
   * @returns `this`
   */
  subtract(b: Readonly<Vec3Like>): this;
  /**
   * Alias for {@link Vec3.subtract}
   * @category Methods
   */
  sub(b: Readonly<Vec3Like>): this;
  /**
   * Multiplies `this` by a {@link Vec3}.
   * Equivalent to `Vec3.multiply(this, this, b);`
   * @category Methods
   *
   * @param b - The vector to multiply `this` by
   * @returns `this`
   */
  multiply(b: Readonly<Vec3Like>): this;
  /**
   * Alias for {@link Vec3.multiply}
   * @category Methods
   */
  mul(b: Readonly<Vec3Like>): this;
  /**
   * Divides `this` by a {@link Vec3}.
   * Equivalent to `Vec3.divide(this, this, b);`
   * @category Methods
   *
   * @param b - The vector to divide `this` by
   * @returns `this`
   */
  divide(b: Readonly<Vec3Like>): this;
  /**
   * Alias for {@link Vec3.divide}
   * @category Methods
   */
  div(b: Readonly<Vec3Like>): this;
  /**
   * Scales `this` by a scalar number.
   * Equivalent to `Vec3.scale(this, this, b);`
   * @category Methods
   *
   * @param b - Amount to scale `this` by
   * @returns `this`
   */
  scale(b: number): this;
  /**
   * Calculates `this` scaled by a scalar value then adds the result to `this`.
   * Equivalent to `Vec3.scaleAndAdd(this, this, b, scale);`
   * @category Methods
   *
   * @param b - The vector to add to `this`
   * @param scale - The amount to scale `b` by before adding
   * @returns `this`
   */
  scaleAndAdd(b: Readonly<Vec3Like>, scale: number): this;
  /**
   * Calculates the Euclidean distance between another {@link Vec3} and `this`.
   * Equivalent to `Vec3.distance(this, b);`
   * @category Methods
   *
   * @param b - The vector to calculate the distance to
   * @returns Distance between `this` and `b`
   */
  distance(b: Readonly<Vec3Like>): number;
  /**
   * Alias for {@link Vec3.distance}
   * @category Methods
   */
  dist(b: Readonly<Vec3Like>): number;
  /**
   * Calculates the squared Euclidean distance between another {@link Vec3} and `this`.
   * Equivalent to `Vec3.squaredDistance(this, b);`
   * @category Methods
   *
   * @param b The vector to calculate the squared distance to
   * @returns Squared distance between `this` and `b`
   */
  squaredDistance(b: Readonly<Vec3Like>): number;
  /**
   * Alias for {@link Vec3.squaredDistance}
   * @category Methods
   */
  sqrDist(b: Readonly<Vec3Like>): number;
  /**
   * Negates the components of `this`.
   * Equivalent to `Vec3.negate(this, this);`
   * @category Methods
   *
   * @returns `this`
   */
  negate(): this;
  /**
   * Inverts the components of `this`.
   * Equivalent to `Vec3.inverse(this, this);`
   * @category Methods
   *
   * @returns `this`
   */
  invert(): this;
  /**
   * Sets each component of `this` to its absolute value.
   * Equivalent to `Vec3.abs(this, this);`
   * @category Methods
   *
   * @returns `this`
   */
  abs(): this;
  /**
   * Calculates the dot product of this and another {@link Vec3}.
   * Equivalent to `Vec3.dot(this, b);`
   * @category Methods
   *
   * @param b - The second operand
   * @returns Dot product of `this` and `b`
   */
  dot(b: Readonly<Vec3Like>): number;
  /**
   * Normalize `this`.
   * Equivalent to `Vec3.normalize(this, this);`
   * @category Methods
   *
   * @returns `this`
   */
  normalize(): this;
  /**
   * @category Static
   *
   * @returns The number of bytes in a {@link Vec3}.
   */
  static get BYTE_LENGTH(): number;
  /**
   * Creates a new, empty vec3
   * @category Static
   *
   * @returns a new 3D vector
   */
  static create(): Vec3;
  /**
   * Creates a new vec3 initialized with values from an existing vector
   * @category Static
   *
   * @param a - vector to clone
   * @returns a new 3D vector
   */
  static clone(a: Readonly<Vec3Like>): Vec3;
  /**
   * Calculates the magnitude (length) of a {@link Vec3}
   * @category Static
   *
   * @param a - Vector to calculate magnitude of
   * @returns Magnitude of a
   */
  static magnitude(a: Readonly<Vec3Like>): number;
  /**
   * Alias for {@link Vec3.magnitude}
   * @category Static
   */
  static mag(a: Readonly<Vec3Like>): number;
  /**
   * Alias for {@link Vec3.magnitude}
   * @category Static
   * @deprecated Use {@link Vec3.magnitude} to avoid conflicts with builtin `length` methods/attribs
   *
   * @param a - vector to calculate length of
   * @returns length of a
   */
  static length(a: Readonly<Vec3Like>): number;
  /**
   * Alias for {@link Vec3.magnitude}
   * @category Static
   * @deprecated Use {@link Vec3.mag}
   */
  static len(a: Readonly<Vec3Like>): number;
  /**
   * Creates a new vec3 initialized with the given values
   * @category Static
   *
   * @param x - X component
   * @param y - Y component
   * @param z - Z component
   * @returns a new 3D vector
   */
  static fromValues(x: number, y: number, z: number): Vec3;
  /**
   * Copy the values from one vec3 to another
   * @category Static
   *
   * @param out - the receiving vector
   * @param a - the source vector
   * @returns `out`
   */
  static copy(out: Vec3Like, a: Readonly<Vec3Like>): Vec3Like;
  /**
   * Set the components of a vec3 to the given values
   * @category Static
   *
   * @param out - the receiving vector
   * @param x - X component
   * @param y - Y component
   * @param z - Z component
   * @returns `out`
   */
  static set(out: Vec3Like, x: number, y: number, z: number): Vec3Like;
  /**
   * Adds two {@link Vec3}s
   * @category Static
   *
   * @param out - The receiving vector
   * @param a - The first operand
   * @param b - The second operand
   * @returns `out`
   */
  static add(out: Vec3Like, a: Readonly<Vec3Like>, b: Readonly<Vec3Like>): Vec3Like;
  /**
   * Subtracts vector b from vector a
   * @category Static
   *
   * @param out - the receiving vector
   * @param a - the first operand
   * @param b - the second operand
   * @returns `out`
   */
  static subtract(out: Vec3Like, a: Readonly<Vec3Like>, b: Readonly<Vec3Like>): Vec3Like;
  /**
   * Alias for {@link Vec3.subtract}
   * @category Static
   */
  static sub(out: Vec3Like, a: Readonly<Vec3Like>, b: Readonly<Vec3Like>): Vec3Like;
  /**
   * Multiplies two vec3's
   * @category Static
   *
   * @param out - the receiving vector
   * @param a - the first operand
   * @param b - the second operand
   * @returns `out`
   */
  static multiply(out: Vec3Like, a: Readonly<Vec3Like>, b: Readonly<Vec3Like>): Vec3Like;
  /**
   * Alias for {@link Vec3.multiply}
   * @category Static
   */
  static mul(out: Vec3Like, a: Readonly<Vec3Like>, b: Readonly<Vec3Like>): Vec3Like;
  /**
   * Divides two vec3's
   * @category Static
   *
   * @param out - the receiving vector
   * @param a - the first operand
   * @param b - the second operand
   * @returns `out`
   */
  static divide(out: Vec3Like, a: Readonly<Vec3Like>, b: Readonly<Vec3Like>): Vec3Like;
  /**
   * Alias for {@link Vec3.divide}
   * @category Static
   */
  static div(out: Vec3Like, a: Readonly<Vec3Like>, b: Readonly<Vec3Like>): Vec3Like;
  /**
   * Math.ceil the components of a vec3
   * @category Static
   *
   * @param out - the receiving vector
   * @param a - vector to ceil
   * @returns `out`
   */
  static ceil(out: Vec3Like, a: Readonly<Vec3Like>): Vec3Like;
  /**
   * Math.floor the components of a vec3
   * @category Static
   *
   * @param out - the receiving vector
   * @param a - vector to floor
   * @returns `out`
   */
  static floor(out: Vec3Like, a: Readonly<Vec3Like>): Vec3Like;
  /**
   * Returns the minimum of two vec3's
   * @category Static
   *
   * @param out - the receiving vector
   * @param a - the first operand
   * @param b - the second operand
   * @returns `out`
   */
  static min(out: Vec3Like, a: Readonly<Vec3Like>, b: Readonly<Vec3Like>): Vec3Like;
  /**
   * Returns the maximum of two vec3's
   * @category Static
   *
   * @param out - the receiving vector
   * @param a - the first operand
   * @param b - the second operand
   * @returns `out`
   */
  static max(out: Vec3Like, a: Readonly<Vec3Like>, b: Readonly<Vec3Like>): Vec3Like;
  /**
   * symmetric round the components of a vec3
   * @category Static
   *
   * @param out - the receiving vector
   * @param a - vector to round
   * @returns `out`
   */
  /**
   * Scales a vec3 by a scalar number
   * @category Static
   *
   * @param out - the receiving vector
   * @param a - the vector to scale
   * @param scale - amount to scale the vector by
   * @returns `out`
   */
  static scale(out: Vec3Like, a: Readonly<Vec3Like>, scale: number): Vec3Like;
  /**
   * Adds two vec3's after scaling the second operand by a scalar value
   * @category Static
   *
   * @param out - the receiving vector
   * @param a - the first operand
   * @param b - the second operand
   * @param scale - the amount to scale b by before adding
   * @returns `out`
   */
  static scaleAndAdd(out: Vec3Like, a: Readonly<Vec3Like>, b: Readonly<Vec3Like>, scale: number): Vec3Like;
  /**
   * Calculates the Euclidean distance between two vec3's
   * @category Static
   *
   * @param a - the first operand
   * @param b - the second operand
   * @returns distance between a and b
   */
  static distance(a: Readonly<Vec3Like>, b: Readonly<Vec3Like>): number;
  /**
   * Alias for {@link Vec3.distance}
   * @category Static
   */
  static dist(a: Readonly<Vec3Like>, b: Readonly<Vec3Like>): number;
  /**
   * Calculates the squared Euclidean distance between two vec3's
   * @category Static
   *
   * @param a - the first operand
   * @param b - the second operand
   * @returns squared distance between a and b
   */
  static squaredDistance(a: Readonly<Vec3Like>, b: Readonly<Vec3Like>): number;
  /**
   * Alias for {@link Vec3.squaredDistance}
   * @category Static
   */
  static sqrDist(a: Readonly<Vec3Like>, b: Readonly<Vec3Like>): number;
  /**
   * Calculates the squared length of a vec3
   * @category Static
   *
   * @param a - vector to calculate squared length of
   * @returns squared length of a
   */
  static squaredLength(a: Readonly<Vec3Like>): number;
  /**
   * Alias for {@link Vec3.squaredLength}
   * @category Static
   */
  static sqrLen(a: Readonly<Vec3Like>, b: Readonly<Vec3Like>): number;
  /**
   * Negates the components of a vec3
   * @category Static
   *
   * @param out - the receiving vector
   * @param a - vector to negate
   * @returns `out`
   */
  static negate(out: Vec3Like, a: Readonly<Vec3Like>): Vec3Like;
  /**
   * Returns the inverse of the components of a vec3
   * @category Static
   *
   * @param out - the receiving vector
   * @param a - vector to invert
   * @returns `out`
   */
  static inverse(out: Vec3Like, a: Readonly<Vec3Like>): Vec3Like;
  /**
   * Returns the absolute value of the components of a {@link Vec3}
   * @category Static
   *
   * @param out - The receiving vector
   * @param a - Vector to compute the absolute values of
   * @returns `out`
   */
  static abs(out: Vec3Like, a: Readonly<Vec3Like>): Vec3Like;
  /**
   * Normalize a vec3
   * @category Static
   *
   * @param out - the receiving vector
   * @param a - vector to normalize
   * @returns `out`
   */
  static normalize(out: Vec3Like, a: Readonly<Vec3Like>): Vec3Like;
  /**
   * Calculates the dot product of two vec3's
   * @category Static
   *
   * @param a - the first operand
   * @param b - the second operand
   * @returns dot product of a and b
   */
  static dot(a: Readonly<Vec3Like>, b: Readonly<Vec3Like>): number;
  /**
   * Computes the cross product of two vec3's
   * @category Static
   *
   * @param out - the receiving vector
   * @param a - the first operand
   * @param b - the second operand
   * @returns `out`
   */
  static cross(out: Vec3Like, a: Readonly<Vec3Like>, b: Readonly<Vec3Like>): Vec3Like;
  /**
   * Performs a linear interpolation between two vec3's
   * @category Static
   *
   * @param out - the receiving vector
   * @param a - the first operand
   * @param b - the second operand
   * @param t - interpolation amount, in the range [0-1], between the two inputs
   * @returns `out`
   */
  static lerp(out: Vec3Like, a: Readonly<Vec3Like>, b: Readonly<Vec3Like>, t: number): Vec3Like;
  /**
   * Performs a spherical linear interpolation between two vec3's
   * @category Static
   *
   * @param out - the receiving vector
   * @param a - the first operand
   * @param b - the second operand
   * @param t - interpolation amount, in the range [0-1], between the two inputs
   * @returns `out`
   */
  static slerp(out: Vec3Like, a: Readonly<Vec3Like>, b: Readonly<Vec3Like>, t: number): Vec3Like;
  /**
   * Performs a hermite interpolation with two control points
   * @category Static
   *
   * @param out - the receiving vector
   * @param a - the first operand
   * @param b - the second operand
   * @param c - the third operand
   * @param d - the fourth operand
   * @param t - interpolation amount, in the range [0-1], between the two inputs
   * @returns `out`
   */
  static hermite(
    out: Vec3Like,
    a: Readonly<Vec3Like>,
    b: Readonly<Vec3Like>,
    c: Readonly<Vec3Like>,
    d: Readonly<Vec3Like>,
    t: number,
  ): Vec3Like;
  /**
   * Performs a bezier interpolation with two control points
   * @category Static
   *
   * @param out - the receiving vector
   * @param a - the first operand
   * @param b - the second operand
   * @param c - the third operand
   * @param d - the fourth operand
   * @param t - interpolation amount, in the range [0-1], between the two inputs
   * @returns `out`
   */
  static bezier(
    out: Vec3Like,
    a: Readonly<Vec3Like>,
    b: Readonly<Vec3Like>,
    c: Readonly<Vec3Like>,
    d: Readonly<Vec3Like>,
    t: number,
  ): Vec3Like;
  /**
   * Generates a random vector with the given scale
   * @category Static
   *
   * @param out - the receiving vector
   * @param {Number} [scale] Length of the resulting vector. If omitted, a unit vector will be returned
   * @returns `out`
   */
  /**
   * Transforms the vec3 with a mat4.
   * 4th vector component is implicitly '1'
   * @category Static
   *
   * @param out - the receiving vector
   * @param a - the vector to transform
   * @param m - matrix to transform with
   * @returns `out`
   */
  static transformMat4(out: Vec3Like, a: Readonly<Vec3Like>, m: Readonly<Mat4Like>): Vec3Like;
  /**
   * Transforms the vec3 with a mat3.
   * @category Static
   *
   * @param out - the receiving vector
   * @param a - the vector to transform
   * @param m - the 3x3 matrix to transform with
   * @returns `out`
   */
  static transformMat3(out: Vec3Like, a: Vec3Like, m: Mat3Like): Vec3Like;
  /**
   * Transforms the vec3 with a quat
   * Can also be used for dual quaternions. (Multiply it with the real part)
   * @category Static
   *
   * @param out - the receiving vector
   * @param a - the vector to transform
   * @param q - quaternion to transform with
   * @returns `out`
   */
  static transformQuat(out: Vec3Like, a: Readonly<Vec3Like>, q: Readonly<QuatLike>): Vec3Like;
  /**
   * Rotate a 3D vector around the x-axis
   * @category Static
   *
   * @param out - The receiving vec3
   * @param a - The vec3 point to rotate
   * @param b - The origin of the rotation
   * @param rad - The angle of rotation in radians
   * @returns `out`
   */
  static rotateX(out: Vec3Like, a: Readonly<Vec3Like>, b: Readonly<Vec3Like>, rad: number): Vec3Like;
  /**
   * Rotate a 3D vector around the y-axis
   * @category Static
   *
   * @param out - The receiving vec3
   * @param a - The vec3 point to rotate
   * @param b - The origin of the rotation
   * @param rad - The angle of rotation in radians
   * @returns `out`
   */
  static rotateY(out: Vec3Like, a: Readonly<Vec3Like>, b: Readonly<Vec3Like>, rad: number): Vec3Like;
  /**
   * Rotate a 3D vector around the z-axis
   * @category Static
   *
   * @param out - The receiving vec3
   * @param a - The vec3 point to rotate
   * @param b - The origin of the rotation
   * @param rad - The angle of rotation in radians
   * @returns `out`
   */
  static rotateZ(out: Vec3Like, a: Readonly<Vec3Like>, b: Readonly<Vec3Like>, rad: number): Vec3Like;
  /**
   * Get the angle between two 3D vectors
   * @category Static
   *
   * @param a - The first operand
   * @param b - The second operand
   * @returns The angle in radians
   */
  static angle(a: Readonly<Vec3Like>, b: Readonly<Vec3Like>): number;
  /**
   * Set the components of a vec3 to zero
   * @category Static
   *
   * @param out - the receiving vector
   * @returns `out`
   */
  static zero(out: Vec3Like): Vec3Like;
  /**
   * Returns a string representation of a vector
   * @category Static
   *
   * @param a - vector to represent as a string
   * @returns string representation of the vector
   */
  static str(a: Readonly<Vec3Like>): string;
  /**
   * Returns whether the vectors have exactly the same elements in the same position (when compared with ===)
   * @category Static
   *
   * @param a - The first vector.
   * @param b - The second vector.
   * @returns True if the vectors are equal, false otherwise.
   */
  static exactEquals(a: Readonly<Vec3Like>, b: Readonly<Vec3Like>): boolean;
  /**
   * Returns whether the vectors have approximately the same elements in the same position.
   * @category Static
   *
   * @param a - The first vector.
   * @param b - The second vector.
   * @returns True if the vectors are equal, false otherwise.
   */
  static equals(a: Readonly<Vec3Like>, b: Readonly<Vec3Like>): boolean;
}

/**
 * 4 Dimensional Vector
 */
declare class Vec4 extends Float32Array {
  /**
   * Create a {@link Vec4}.
   *
   * @category Constructor
   */
  constructor(...values: [Readonly<Vec4Like> | ArrayBufferLike, number?] | number[]);
  /**
   * The x component of the vector. Equivalent to `this[0];`
   * @category Vector Components
   */
  get x(): number;
  set x(value: number);
  /**
   * The y component of the vector. Equivalent to `this[1];`
   * @category Vector Components
   */
  get y(): number;
  set y(value: number);
  /**
   * The z component of the vector. Equivalent to `this[2];`
   * @category Vector Components
   */
  get z(): number;
  set z(value: number);
  /**
   * The w component of the vector. Equivalent to `this[3];`
   * @category Vector Components
   */
  get w(): number;
  set w(value: number);
  /**
   * The r component of the vector. Equivalent to `this[0];`
   * @category Color Components
   */
  get r(): number;
  set r(value: number);
  /**
   * The g component of the vector. Equivalent to `this[1];`
   * @category Color Components
   */
  get g(): number;
  set g(value: number);
  /**
   * The b component of the vector. Equivalent to `this[2];`
   * @category Color Components
   */
  get b(): number;
  set b(value: number);
  /**
   * The a component of the vector. Equivalent to `this[3];`
   * @category Color Components
   */
  get a(): number;
  set a(value: number);
  /**
   * The magnitude (length) of this.
   * Equivalent to `Vec4.magnitude(this);`
   *
   * Magnitude is used because the `length` attribute is already defined by
   * TypedArrays to mean the number of elements in the array.
   *
   * @category Accessors
   */
  get magnitude(): number;
  /**
   * Alias for {@link Vec4.magnitude}
   *
   * @category Accessors
   */
  get mag(): number;
  /**
   * A string representation of `this`
   * Equivalent to `Vec4.str(this);`
   *
   * @category Accessors
   */
  get str(): string;
  /**
   * Copy the values from another {@link Vec4} into `this`.
   * @category Methods
   *
   * @param a the source vector
   * @returns `this`
   */
  copy(a: Readonly<Vec4Like>): this;
  /**
   * Adds a {@link Vec4} to `this`.
   * Equivalent to `Vec4.add(this, this, b);`
   * @category Methods
   *
   * @param b - The vector to add to `this`
   * @returns `this`
   */
  add(b: Readonly<Vec4Like>): this;
  /**
   * Subtracts a {@link Vec4} from `this`.
   * Equivalent to `Vec4.subtract(this, this, b);`
   * @category Methods
   *
   * @param b - The vector to subtract from `this`
   * @returns `this`
   */
  subtract(b: Readonly<Vec4Like>): this;
  /**
   * Alias for {@link Vec4.subtract}
   * @category Methods
   */
  sub(b: Readonly<Vec4Like>): this;
  /**
   * Multiplies `this` by a {@link Vec4}.
   * Equivalent to `Vec4.multiply(this, this, b);`
   * @category Methods
   *
   * @param b - The vector to multiply `this` by
   * @returns `this`
   */
  multiply(b: Readonly<Vec4Like>): this;
  /**
   * Alias for {@link Vec4.multiply}
   * @category Methods
   */
  mul(b: Readonly<Vec4Like>): this;
  /**
   * Divides `this` by a {@link Vec4}.
   * Equivalent to `Vec4.divide(this, this, b);`
   * @category Methods
   *
   * @param b - The vector to divide `this` by
   * @returns `this`
   */
  divide(b: Readonly<Vec4Like>): this;
  /**
   * Alias for {@link Vec4.divide}
   * @category Methods
   */
  div(b: Readonly<Vec4Like>): this;
  /**
   * Scales `this` by a scalar number.
   * Equivalent to `Vec4.scale(this, this, b);`
   * @category Methods
   *
   * @param b - Amount to scale `this` by
   * @returns `this`
   */
  scale(b: number): this;
  /**
   * Calculates `this` scaled by a scalar value then adds the result to `this`.
   * Equivalent to `Vec4.scaleAndAdd(this, this, b, scale);`
   * @category Methods
   *
   * @param b - The vector to add to `this`
   * @param scale - The amount to scale `b` by before adding
   * @returns `this`
   */
  scaleAndAdd(b: Readonly<Vec4Like>, scale: number): this;
  /**
   * Calculates the Euclidean distance between another {@link Vec4} and `this`.
   * Equivalent to `Vec4.distance(this, b);`
   * @category Methods
   *
   * @param b - The vector to calculate the distance to
   * @returns Distance between `this` and `b`
   */
  distance(b: Readonly<Vec4Like>): number;
  /**
   * Alias for {@link Vec4.distance}
   * @category Methods
   */
  dist(b: Readonly<Vec4Like>): number;
  /**
   * Calculates the squared Euclidean distance between another {@link Vec4} and `this`.
   * Equivalent to `Vec4.squaredDistance(this, b);`
   * @category Methods
   *
   * @param b The vector to calculate the squared distance to
   * @returns Squared distance between `this` and `b`
   */
  squaredDistance(b: Readonly<Vec4Like>): number;
  /**
   * Alias for {@link Vec4.squaredDistance}
   * @category Methods
   */
  sqrDist(b: Readonly<Vec4Like>): number;
  /**
   * Negates the components of `this`.
   * Equivalent to `Vec4.negate(this, this);`
   * @category Methods
   *
   * @returns `this`
   */
  negate(): this;
  /**
   * Inverts the components of `this`.
   * Equivalent to `Vec4.inverse(this, this);`
   * @category Methods
   *
   * @returns `this`
   */
  invert(): this;
  /**
   * Sets each component of `this` to it's absolute value.
   * Equivalent to `Vec4.abs(this, this);`
   * @category Methods
   *
   * @returns `this`
   */
  abs(): this;
  /**
   * Calculates the dot product of this and another {@link Vec4}.
   * Equivalent to `Vec4.dot(this, b);`
   * @category Methods
   *
   * @param b - The second operand
   * @returns Dot product of `this` and `b`
   */
  dot(b: Readonly<Vec4Like>): number;
  /**
   * Normalize `this`.
   * Equivalent to `Vec4.normalize(this, this);`
   * @category Methods
   *
   * @returns `this`
   */
  normalize(): this;
  /**
   * @category Static
   *
   * @returns The number of bytes in a {@link Vec4}.
   */
  static get BYTE_LENGTH(): number;
  /**
   * Creates a new, empty {@link Vec4}
   * @category Static
   *
   * @returns a new 4D vector
   */
  static create(): Vec4;
  /**
   * Creates a new {@link Vec4} initialized with values from an existing vector
   * @category Static
   *
   * @param a - vector to clone
   * @returns a new 4D vector
   */
  static clone(a: Vec4Like): Vec4;
  /**
   * Creates a new {@link Vec4} initialized with the given values
   * @category Static
   *
   * @param x - X component
   * @param y - Y component
   * @param z - Z component
   * @param w - W component
   * @returns a new 4D vector
   */
  static fromValues(x: number, y: number, z: number, w: number): Vec4;
  /**
   * Copy the values from one {@link Vec4} to another
   * @category Static
   *
   * @param out - the receiving vector
   * @param a - the source vector
   * @returns `out`
   */
  static copy(out: Vec4Like, a: Readonly<Vec4Like>): Vec4Like;
  /**
   * Set the components of a {@link Vec4} to the given values
   * @category Static
   *
   * @param out - the receiving vector
   * @param x - X component
   * @param y - Y component
   * @param z - Z component
   * @param w - W component
   * @returns `out`
   */
  static set(out: Vec4Like, x: number, y: number, z: number, w: number): Vec4Like;
  /**
   * Adds two {@link Vec4}s
   * @category Static
   *
   * @param out - The receiving vector
   * @param a - The first operand
   * @param b - The second operand
   * @returns `out`
   */
  static add(out: Vec4Like, a: Readonly<Vec4Like>, b: Readonly<Vec4Like>): Vec4Like;
  /**
   * Subtracts vector b from vector a
   * @category Static
   *
   * @param out - the receiving vector
   * @param a - the first operand
   * @param b - the second operand
   * @returns `out`
   */
  static subtract(out: Vec4Like, a: Readonly<Vec4Like>, b: Readonly<Vec4Like>): Vec4Like;
  /**
   * Alias for {@link Vec4.subtract}
   * @category Static
   */
  static sub(out: Vec4Like, a: Readonly<Vec4Like>, b: Readonly<Vec4Like>): Vec4Like;
  /**
   * Multiplies two {@link Vec4}'s
   * @category Static
   *
   * @param out - the receiving vector
   * @param a - the first operand
   * @param b - the second operand
   * @returns `out`
   */
  static multiply(out: Vec4Like, a: Readonly<Vec4Like>, b: Readonly<Vec4Like>): Vec4Like;
  /**
   * Alias for {@link Vec4.multiply}
   * @category Static
   */
  static mul(out: Vec4Like, a: Readonly<Vec4Like>, b: Readonly<Vec4Like>): Vec4Like;
  /**
   * Divides two {@link Vec4}'s
   * @category Static
   *
   * @param out - the receiving vector
   * @param a - the first operand
   * @param b - the second operand
   * @returns `out`
   */
  static divide(out: Vec4Like, a: Readonly<Vec4Like>, b: Readonly<Vec4Like>): Vec4Like;
  /**
   * Alias for {@link Vec4.divide}
   * @category Static
   */
  static div(out: Vec4Like, a: Readonly<Vec4Like>, b: Readonly<Vec4Like>): Vec4Like;
  /**
   * Math.ceil the components of a {@link Vec4}
   * @category Static
   *
   * @param out - the receiving vector
   * @param a - vector to ceil
   * @returns `out`
   */
  static ceil(out: Vec4Like, a: Readonly<Vec4Like>): Vec4Like;
  /**
   * Math.floor the components of a {@link Vec4}
   * @category Static
   *
   * @param out - the receiving vector
   * @param a - vector to floor
   * @returns `out`
   */
  static floor(out: Vec4Like, a: Readonly<Vec4Like>): Vec4Like;
  /**
   * Returns the minimum of two {@link Vec4}'s
   * @category Static
   *
   * @param out - the receiving vector
   * @param a - the first operand
   * @param b - the second operand
   * @returns `out`
   */
  static min(out: Vec4Like, a: Readonly<Vec4Like>, b: Readonly<Vec4Like>): Vec4Like;
  /**
   * Returns the maximum of two {@link Vec4}'s
   * @category Static
   *
   * @param out - the receiving vector
   * @param a - the first operand
   * @param b - the second operand
   * @returns `out`
   */
  static max(out: Vec4Like, a: Readonly<Vec4Like>, b: Readonly<Vec4Like>): Vec4Like;
  /**
   * Math.round the components of a {@link Vec4}
   * @category Static
   *
   * @param out - the receiving vector
   * @param a - vector to round
   * @returns `out`
   */
  static round(out: Vec4Like, a: Readonly<Vec4Like>): Vec4Like;
  /**
   * Scales a {@link Vec4} by a scalar number
   * @category Static
   *
   * @param out - the receiving vector
   * @param a - the vector to scale
   * @param scale - amount to scale the vector by
   * @returns `out`
   */
  static scale(out: Vec4Like, a: Readonly<Vec4Like>, scale: number): Vec4Like;
  /**
   * Adds two {@link Vec4}'s after scaling the second operand by a scalar value
   * @category Static
   *
   * @param out - the receiving vector
   * @param a - the first operand
   * @param b - the second operand
   * @param scale - the amount to scale b by before adding
   * @returns `out`
   */
  static scaleAndAdd(out: Vec4Like, a: Readonly<Vec4Like>, b: Readonly<Vec4Like>, scale: number): Vec4Like;
  /**
   * Calculates the Euclidean distance between two {@link Vec4}'s
   * @category Static
   *
   * @param a - the first operand
   * @param b - the second operand
   * @returns distance between a and b
   */
  static distance(a: Readonly<Vec4Like>, b: Readonly<Vec4Like>): number;
  /**
   * Alias for {@link Vec4.distance}
   * @category Static
   */
  static dist(a: Readonly<Vec4Like>, b: Readonly<Vec4Like>): number;
  /**
   * Calculates the squared Euclidean distance between two {@link Vec4}'s
   * @category Static
   *
   * @param a - the first operand
   * @param b - the second operand
   * @returns squared distance between a and b
   */
  static squaredDistance(a: Readonly<Vec4Like>, b: Readonly<Vec4Like>): number;
  /**
   * Alias for {@link Vec4.squaredDistance}
   * @category Static
   */
  static sqrDist(a: Readonly<Vec4Like>, b: Readonly<Vec4Like>): number;
  /**
   * Calculates the magnitude (length) of a {@link Vec4}
   * @category Static
   *
   * @param a - vector to calculate length of
   * @returns length of `a`
   */
  static magnitude(a: Readonly<Vec4Like>): number;
  /**
   * Alias for {@link Vec4.magnitude}
   * @category Static
   */
  static mag(a: Readonly<Vec4Like>): number;
  /**
   * Alias for {@link Vec4.magnitude}
   * @category Static
   * @deprecated Use {@link Vec4.magnitude} to avoid conflicts with builtin `length` methods/attribs
   */
  static length(a: Readonly<Vec4Like>): number;
  /**
   * Alias for {@link Vec4.magnitude}
   * @category Static
   * @deprecated Use {@link Vec4.mag}
   */
  static len(a: Readonly<Vec4Like>): number;
  /**
   * Calculates the squared length of a {@link Vec4}
   * @category Static
   *
   * @param a - vector to calculate squared length of
   * @returns squared length of a
   */
  static squaredLength(a: Readonly<Vec4Like>): number;
  /**
   * Alias for {@link Vec4.squaredLength}
   * @category Static
   */
  static sqrLen(a: Readonly<Vec4Like>): number;
  /**
   * Negates the components of a {@link Vec4}
   * @category Static
   *
   * @param out - the receiving vector
   * @param a - vector to negate
   * @returns `out`
   */
  static negate(out: Vec4Like, a: Readonly<Vec4Like>): Vec4Like;
  /**
   * Returns the inverse of the components of a {@link Vec4}
   * @category Static
   *
   * @param out - the receiving vector
   * @param a - vector to invert
   * @returns `out`
   */
  static inverse(out: Vec4Like, a: Readonly<Vec4Like>): Vec4Like;
  /**
   * Returns the absolute value of the components of a {@link Vec4}
   * @category Static
   *
   * @param out - The receiving vector
   * @param a - Vector to compute the absolute values of
   * @returns `out`
   */
  static abs(out: Vec4Like, a: Readonly<Vec4Like>): Vec4Like;
  /**
   * Normalize a {@link Vec4}
   * @category Static
   *
   * @param out - the receiving vector
   * @param a - vector to normalize
   * @returns `out`
   */
  static normalize(out: Vec4Like, a: Readonly<Vec4Like>): Vec4Like;
  /**
   * Calculates the dot product of two {@link Vec4}'s
   * @category Static
   *
   * @param a - the first operand
   * @param b - the second operand
   * @returns dot product of a and b
   */
  static dot(a: Readonly<Vec4Like>, b: Readonly<Vec4Like>): number;
  /**
   * Returns the cross-product of three vectors in a 4-dimensional space
   * @category Static
   *
   * @param out the receiving vector
   * @param u - the first vector
   * @param v - the second vector
   * @param w - the third vector
   * @returns result
   */
  static cross(out: Vec4Like, u: Readonly<Vec4Like>, v: Readonly<Vec4Like>, w: Readonly<Vec4Like>): Vec4Like;
  /**
   * Performs a linear interpolation between two {@link Vec4}'s
   * @category Static
   *
   * @param out - the receiving vector
   * @param a - the first operand
   * @param b - the second operand
   * @param t - interpolation amount, in the range [0-1], between the two inputs
   * @returns `out`
   */
  static lerp(out: Vec4Like, a: Readonly<Vec4Like>, b: Readonly<Vec4Like>, t: number): Vec4Like;
  /**
   * Generates a random vector with the given scale
   * @category Static
   *
   * @param out - the receiving vector
   * @param [scale] - Length of the resulting vector. If ommitted, a unit vector will be returned
   * @returns `out`
   */
  /**
   * Transforms the {@link Vec4} with a {@link Mat4}.
   * @category Static
   *
   * @param out - the receiving vector
   * @param a - the vector to transform
   * @param m - matrix to transform with
   * @returns `out`
   */
  static transformMat4(out: Vec4Like, a: Readonly<Vec4Like>, m: Readonly<Mat4Like>): Vec4Like;
  /**
   * Transforms the {@link Vec4} with a {@link Quat}
   * @category Static
   *
   * @param out - the receiving vector
   * @param a - the vector to transform
   * @param q - quaternion to transform with
   * @returns `out`
   */
  static transformQuat(out: Vec4Like, a: Readonly<Vec4Like>, q: Readonly<QuatLike>): Vec4Like;
  /**
   * Set the components of a {@link Vec4} to zero
   * @category Static
   *
   * @param out - the receiving vector
   * @returns `out`
   */
  static zero(out: Vec4Like): Vec4Like;
  /**
   * Returns a string representation of a {@link Vec4}
   * @category Static
   *
   * @param a - vector to represent as a string
   * @returns string representation of the vector
   */
  static str(a: Readonly<Vec4Like>): string;
  /**
   * Returns whether the vectors have exactly the same elements in the same position (when compared with ===)
   * @category Static
   *
   * @param a - The first vector.
   * @param b - The second vector.
   * @returns True if the vectors are equal, false otherwise.
   */
  static exactEquals(a: Readonly<Vec4Like>, b: Readonly<Vec4Like>): boolean;
  /**
   * Returns whether the vectors have approximately the same elements in the same position.
   * @category Static
   *
   * @param a - The first vector.
   * @param b - The second vector.
   * @returns True if the vectors are equal, false otherwise.
   */
  static equals(a: Readonly<Vec4Like>, b: Readonly<Vec4Like>): boolean;
}

export {
  type FloatArray,
  Mat2,
  type Mat2Like,
  Mat2d,
  type Mat2dLike,
  Mat3,
  type Mat3Like,
  Mat4,
  type Mat4Like,
  Quat,
  Quat2,
  type Quat2Like,
  type QuatLike,
  Vec2,
  type Vec2Like,
  Vec3,
  type Vec3Like,
  Vec4,
  type Vec4Like,
};
