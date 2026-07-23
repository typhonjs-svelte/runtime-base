/**
 * Provides general-purpose TypeScript utility types for composing, constraining, and inspecting application types.
 *
 * The utilities in this package supplement TypeScript's built-in utility types with reusable helpers for:
 *
 * - Modifying selected object properties.
 * - Composing and simplifying object types.
 * - Extracting object keys and values.
 * - Expressing valid combinations of optional properties.
 * - Working with arrays, tuples, iterables, and asynchronous values.
 * - Adding compile-time nominal identity to structurally typed values.
 *
 * All exports are type-only and have no runtime behavior or generated JavaScript representation.
 *
 * @categoryDescription Async
 * Types for representing values that may be produced synchronously or asynchronously.
 *
 * @categoryDescription Collections
 * Types for extracting element types and expressing structural constraints for arrays, tuples, and iterables.
 *
 *
 * @categoryDescription Nominal Types
 * Types for adding compile-time identity to otherwise structurally compatible values.
 *
 * @categoryDescription Object Composition
 * Types for combining, reshaping, simplifying, and selectively omitting object properties.
 *
 * @categoryDescription Object Constraints
 * Types for defining valid combinations and presence requirements for selected object properties.
 *
 * @categoryDescription Object Keys
 * Types for extracting and classifying object keys and property value types.
 *
 * @categoryDescription Object Modifiers
 * Types for selectively changing the optional, required, readonly, mutable, or defined state of object properties.
 *
 * @packageDocumentation
 */

export * from './async';
export * from './collection';
export * from './nominal';
export * from './object-composition';
export * from './object-constraint';
export * from './object-key';
export * from './object-modifier';

export {};
