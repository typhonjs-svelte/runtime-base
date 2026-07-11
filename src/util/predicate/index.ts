/**
 * Provides generic predicate and type guard utilities for validating unknown values enabling type-safe narrowing,
 * and resolving values through predicate-based evaluation.
 *
 * This package contains utilities applicable across the runtime including predicates for JavaScript primitive types
 * and generic predicate helpers. Predicates for domain-specific types remain defined alongside their associated APIs
 * (IE. object, DOM, Svelte, or framework-specific sub-paths) such as {@link #runtime/util/object}.
 *
 * @packageDocumentation
 */
export * from './predicates';
export * from './resolveByPredicate';

export * from './types';
