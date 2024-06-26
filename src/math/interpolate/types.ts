/**
 * Defines the shape of an interpolation function.
 */
interface InterpolateFunction<T>
{
   /**
    * @param start - Start value.
    *
    * @param end - End value.
    *
    * @param amount - Current amount between 0 - 1 inclusive.
    *
    * @returns Interpolated value between start & end.
    */
   (start: T, end: T, amount: number): T;
}

/**
 * Defines the supported interpolation function names.
 */
type InterpolateFunctionName = 'lerp';

export {
   InterpolateFunction,
   InterpolateFunctionName
};
