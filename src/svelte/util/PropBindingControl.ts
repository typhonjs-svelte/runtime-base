import { resolveByPredicate } from '#runtime/util/predicate';

import type { TypePredicate } from '#runtime/util/predicate';

/**
 * Resolves a bindable component property while preserving the provenance of values published by the component.
 *
 * `PropBindingControl` supports component properties that serve as both:
 *
 * - an externally supplied input; and
 * - a value published back to the parent through component binding.
 *
 * This distinction is important when a component resolves a property from multiple sources. Once the component
 * publishes a resolved value back through the bound property, that value must not subsequently be interpreted as a new
 * direct value supplied by the parent.
 *
 * The controller records the last value it published. When {@link resolve} is called, a bound value that differs
 * from the last published value is treated as an external assignment and becomes the highest-precedence direct value.
 * Otherwise, the controller resolves the first valid candidate or returns its component-owned fallback.
 *
 * Resolution precedence is:
 *
 * 1. A valid external assignment to the bindable property.
 * 2. The first valid candidate passed to {@link resolve}.
 * 3. The fallback supplied to the constructor.
 *
 * An invalid external assignment clears any previously established direct value, allowing candidate values or the
 * fallback to become effective again.
 *
 * The controller does not subscribe to, observe, or dispose of resolved values. It only retains references
 * required to track resolution provenance. Consequently, a component-local instance does not require explicit cleanup.
 *
 * @typeParam T - Type accepted by the supplied predicate and returned by the controller.
 *
 * @example Svelte component store resolution
 *
 * ```svelte
 * <script>
 *    import { writable } from 'svelte/store';
 *
 *    import { PropBindingControl } from './PropBindingControl';
 *    import { isMinimalWritableStore } from '#runtime/svelte/store/util';
 *
 *    export let input = {};
 *    export let store = void 0;
 *
 *    const storeControl = new PropBindingControl(
 *       isMinimalWritableStore,
 *       writable(void 0)
 *    );
 *
 *    // A directly supplied `store` takes precedence. Otherwise, `input.store` is selected, followed by the
 *    // component-owned writable fallback.
 *    //
 *    // Assigning the result back to `store` publishes the effective store through `bind:store` without causing
 *    // that published value to become a permanent direct override.
 *    $: store = storeControl.resolve(store, input.store);
 * </script>
 * ```
 */
export class PropBindingControl<T>
{
   /**
    * Sentinel identifying the absence of a direct or previously published value.
    */
   private static readonly unset: unique symbol = Symbol('PropBindingControl.unset');

   /**
    * Component-owned value returned when no direct value or candidate satisfies the predicate.
    */
   readonly #fallback: T;

   /**
    * Type predicate used to validate all values considered by the controller.
    */
   readonly #predicate: TypePredicate<T>;

   /**
    * Last valid value assigned externally through the bindable property.
    *
    * The sentinel indicates that no direct external value is currently active.
    */
   #directValue: T | typeof PropBindingControl.unset = PropBindingControl.unset;

   /**
    * Last effective value returned by {@link resolve} and subsequently published through the bindable property.
    *
    * This value is used to distinguish a component-published assignment from a new external assignment.
    */
   #publishedValue: T | typeof PropBindingControl.unset = PropBindingControl.unset;

   /**
    * Creates a property binding controller.
    *
    * The fallback must satisfy the supplied predicate because it is guaranteed to be returned whenever no
    * higher-precedence value is valid.
    *
    * @param predicate - Type predicate used to validate the bindable property, candidate values, and fallback.
    *
    * @param fallback - Component-owned fallback returned when no direct value or candidate satisfies `predicate`.
    *
    * @throws {@link TypeError} Thrown when `fallback` does not satisfy `predicate`.
    */
   constructor(predicate: TypePredicate<T>, fallback: T)
   {
      if (!predicate(fallback)) { throw new TypeError(`'fallback' does not satisfy the supplied predicate.`); }

      this.#predicate = predicate;
      this.#fallback = fallback;
   }

   /**
    * Resolves the effective value and records it as the value published back through the bindable component property.
    *
    * A `boundValue` differing from the value returned by the previous invocation is treated as an external assignment.
    * When valid, it becomes the direct value and takes precedence over all candidates. When invalid, any previous
    * direct value is cleared.
    *
    * When `boundValue` matches the previously published value, it is recognized as the component's own assignment
    * and does not alter direct-value provenance.
    *
    * Candidates are evaluated from left to right. The first candidate accepted by the configured predicate is
    * returned. If neither a direct value nor a candidate is valid, the constructor fallback is returned.
    *
    * The returned value should normally be assigned directly back to the bindable property:
    *
    * ```ts
    * $: store = storeControl.resolve(store, inputOptions.store);
    * ```
    *
    * @param boundValue - Current value of the exported bindable property.
    *
    * @param candidates - Additional candidate values evaluated in descending precedence order.
    *
    * @returns The valid direct value, first valid candidate, or fallback.
    */
   resolve(boundValue: unknown, ...candidates: readonly unknown[]): T
   {
      // A value different from the last published value represents an external assignment to the bindable property.
      if (this.#publishedValue === typeof PropBindingControl.unset || !Object.is(boundValue, this.#publishedValue))
      {
         this.#directValue = this.#predicate(boundValue) ? boundValue : PropBindingControl.unset;
      }

      const resolvedValue = this.#directValue !== PropBindingControl.unset ? this.#directValue :
       resolveByPredicate(this.#predicate, ...candidates) ?? this.#fallback;

      this.#publishedValue = resolvedValue;

      return resolvedValue;
   }
}
