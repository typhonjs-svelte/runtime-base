import { isObject }                    from '#runtime/util/object';
import { CrossRealm }                  from '#runtime/util/realm';

import { getStackingContext }          from './getStackingContext';

import {
   type ElementMatchesFilterOptions,
   elementMatchesFilter }              from './elementMatchesFilter';

/**
 * Provides a data defined mechanism to walk up the DOM parent element chain and return the first ancestor that
 * satisfies multiple filtering rules (stacking context, class, ID, selector, predicate) while optionally limiting
 * traversal depth.
 *
 * @param el - Starting element.
 *
 * @param [options] - Filtering and traversal options.
 *
 * @returns The first acceptable parent element or null.
 */
export function findParentElement(el: Element, options: FindParentOptions = {}): Element | null
{
   if (!CrossRealm.browser.isElement(el)) { throw new TypeError(`'el' is not a valid Element.`); }

   if (options === void 0)
   {
      return el.parentElement;
   }
   else if (!isObject(options))
   {
      throw new TypeError(`'options' is not an object.`);
   }

   const {
      stackingContext,
      stopAt,
      maxDepth
   } = options;

   if (typeof stackingContext === 'boolean' && stackingContext)
   {
      const activeWindow: Window | undefined = CrossRealm.browser.getWindow(el);

      let current: Element | null = el.parentElement;

      while (current)
      {
         const ctx = getStackingContext(current, activeWindow);

         const next = ctx?.node ?? null;

         if (!next) { return null; }

         // Apply filtering rules.
         if (elementMatchesFilter(next, options)) { return next; }

         // Continue walking upward through stacking contexts.
         current = next.parentElement;
      }

      return null;
   }

   // Handle direct / normal traversal -------------------------------------------------------------------------------

   if (maxDepth !== void 0 && !Number.isInteger(maxDepth) && maxDepth <= 0)
   {
      throw new TypeError(`'maxDepth' is not a positive integer.`);
   }

   let current = el.parentElement;

   // Depth limit; `Infinity` if not provided.
   let depth = 0;
   const limit = maxDepth ?? Infinity;

   while (current && depth <= limit)
   {
      // Stop traversal at boundary element.
      if (stopAt && current === stopAt)
      {
         return elementMatchesFilter(current, options) ? current : null;
      }

      if (elementMatchesFilter(current, options)) { return current; }

      current = current.parentElement;
      depth++;
   }

   return null;
}

/**
 * Options for {@link findParentElement}.
 */
export interface FindParentOptions extends ElementMatchesFilterOptions
{
   /**
    * When true, traverse parent elements until the stacking context element is found. The stacking context element
    * will be evaluated against any filter criteria such as inclusion / exclusion rules. If it passes the filter then
    * it is returned otherwise the next stacking context element is evaluated.
    *
    * This option overrides `stopAt` and `maxDepth` options.
    */
   stackingContext?: boolean;

   /**
    * Stops traversal when this element is reached.
    *
    * The element itself will still be evaluated against any filter criteria such as inclusion / exclusion rules. If it
    * passes the filter then it is returned. If it does not pass then `null` is returned.
    */
   stopAt?: Element;

   /**
    * Positive integer defining maximum number of parentElement hops allowed.
    */
   maxDepth?: number;
}
