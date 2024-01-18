/**
 * Defines the shape of an interpolation function.
 */
export interface InterpolateFunction
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
   (start: number, end: number, amount: number): number;
}
