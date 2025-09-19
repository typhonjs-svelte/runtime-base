/**
 * Provides a reactive compound store and related actions for advanced and optimized positioning of elements including
 * essential animation / tweening and validation of positional changes. {@link TJSPosition} is the main reactive store
 * along with the {@link applyPosition} and {@link draggable} actions to respectively attach a `TJSPosition` instance
 * to an element in a Svelte template and make it draggable. Additionally, {@link CQPositionValidate} provides an
 * adjunct reactive store to perform validation of a `TJSPosition` instance validating container query types
 * (`inline-size` / `size`) against the positional state that may cause indeterminate states for container queries.
 *
 * @packageDocumentation
 */

export * from './action';
export * from './CQPositionValidate';
export * from './TJSPosition';
