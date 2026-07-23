import type { Simplify } from './object-composition';

/**
 * Makes the selected properties required and removes null / undefined from their value types.
 *
 * @category Object Modifiers
 *
 * @example
 * Represent an object after selected properties have been validated.
 *
 * ```ts
 * interface InputOptions
 * {
 *    source?: string | null;
 *    enabled?: boolean;
 * }
 *
 * type ResolvedOptions = MakeDefined<InputOptions, 'source'>;
 * // {
 * //    source: string;
 * //    enabled?: boolean;
 * // }
 *
 * const options: ResolvedOptions = { source: 'data.json' };
 * ```
 */
type MakeDefined<T extends object, K extends keyof T> = Simplify<Omit<T, K> & { [P in K]-?: NonNullable<T[P]>; }>;

/**
 * Makes the selected properties mutable while preserving their optionality.
 *
 * @category Object Modifiers
 *
 * @example
 * Allow selected readonly properties to be reassigned.
 *
 * ```ts
 * interface Entry
 * {
 *    readonly id: string;
 *    readonly label?: string;
 * }
 *
 * type EditableEntry = MakeMutable<Entry, 'label'>;
 *
 * declare let entry: EditableEntry;
 *
 * entry.label = 'Updated';
 *
 * // @ts-expect-error The unselected id property remains readonly.
 * entry.id = 'new-id';
 * ```
 */
type MakeMutable<T extends object, K extends keyof T = keyof T> =
 Simplify<Omit<T, K> & { -readonly [P in keyof Pick<T, K>]: Pick<T, K>[P]; }>;

/**
 * Makes the selected properties optional.
 *
 * @category Object Modifiers
 *
 * @example
 * Define a draft form of an otherwise complete object.
 *
 * ```ts
 * interface Entry
 * {
 *    id: string;
 *    name: string;
 *    createdAt: Date;
 * }
 *
 * type DraftEntry = MakeOptional<Entry, 'id' | 'createdAt'>;
 *
 * const draft: DraftEntry = { name: 'Example' };
 * ```
 */
type MakeOptional<T extends object, K extends keyof T> = Simplify<Omit<T, K> & Partial<Pick<T, K>>>;

/**
 * Makes the selected properties readonly.
 *
 * @category Object Modifiers
 *
 * @example
 * Prevent reassignment of selected properties while leaving others mutable.
 *
 * ```ts
 * interface Entry
 * {
 *    id: string;
 *    label: string;
 * }
 *
 * type StableEntry = MakeReadonly<Entry, 'id'>;
 *
 * declare let entry: StableEntry;
 *
 * entry.label = 'Updated';
 *
 * // @ts-expect-error The id property is readonly.
 * entry.id = 'new-id';
 * ```
 */
type MakeReadonly<T extends object, K extends keyof T = keyof T> = Simplify<Omit<T, K> & Readonly<Pick<T, K>>>;

/**
 * Makes the selected properties required.
 *
 * @category Object Modifiers
 *
 * @example
 * Require selected configuration properties while retaining the optionality of other properties.
 *
 * ```ts
 * interface Options
 * {
 *    source?: string;
 *    enabled?: boolean;
 *    retries?: number;
 * }
 *
 * type SourceOptions = MakeRequired<Options, 'source'>;
 *
 * const options: SourceOptions = { source: 'data.json' };
 *
 * // @ts-expect-error The source property is required.
 * const invalidOptions: SourceOptions = {};
 * ```
 */
type MakeRequired<T extends object, K extends keyof T> = Simplify<Omit<T, K> & Required<Pick<T, K>>>;

export {
   MakeDefined,
   MakeMutable,
   MakeOptional,
   MakeReadonly,
   MakeRequired
};
