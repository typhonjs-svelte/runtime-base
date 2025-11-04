/**
 * Provides type guards for `Number`.
 */
export abstract class NumberGuard
{
   private constructor()
   {
      throw new Error('NumberGuard constructor: This is a static class and should not be constructed.');
   }

   static isFinite(value: unknown): value is number {
      return typeof value === 'number' && Number.isFinite(value);
   }

   static isFiniteOrNull(value: unknown): value is number | null {
      return value === null || (typeof value === 'number' && Number.isFinite(value));
   }
}
