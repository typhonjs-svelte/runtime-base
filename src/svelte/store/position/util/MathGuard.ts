/**
 * Provides type guards for `Number`.
 */
export class MathGuard {
   private constructor() {}

   static isFinite(value: unknown): value is number {
      return typeof value === 'number' && Number.isFinite(value);
   }

   static isFiniteOrNull(value: unknown): value is number | null {
      return value === null || (typeof value === 'number' && Number.isFinite(value));
   }
}
