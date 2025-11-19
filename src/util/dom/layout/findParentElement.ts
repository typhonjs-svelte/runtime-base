import {
   ensureNonEmptyIterable,
   isObject }              from '#runtime/util/object';

import { CrossRealm }      from '#runtime/util/realm';

/**
 * Walks up the DOM parentElement chain and returns the first ancestor that
 * satisfies multiple filtering rules (class, ID, selector, predicate), while
 * optionally limiting traversal depth.
 *
 * @param el       Starting element.
 * @param options  Filtering and traversal options.
 * @returns        The first acceptable parent element, or null.
 */
export function findParentElement(el: Element, options: FindParentOptions = {}): HTMLElement | null
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
      excludeClasses,
      includeClasses,
      excludeIds,
      includeIds,
      selector,
      excludeSelector,
      predicate,
      stopAt,
      maxDepth
   } = options;

   if (maxDepth !== void 0 && !Number.isInteger(maxDepth) && maxDepth <= 0)
   {
      throw new TypeError(`'maxDepth' is not a positive integer.`);
   }

   // Normalize iterables via ensureNonEmptyIterable
   const exClasses = ensureNonEmptyIterable(excludeClasses);
   const inClasses = ensureNonEmptyIterable(includeClasses);
   const exIds     = ensureNonEmptyIterable(excludeIds);
   const inIds     = ensureNonEmptyIterable(includeIds);

   let current = el.parentElement;

   // Depth limit (Infinity if not provided)
   let depth = 0;
   const limit = maxDepth ?? Infinity;

   while (current && depth <= limit)
   {
      // Stop traversal at boundary element
      if (stopAt && current === stopAt) { return null; }

      // Exclusion checks --------------------------------------------------------------------------------------------

      let reject = false;

      // Excluded classes
      if (exClasses)
      {
         for (const cls of exClasses)
         {
            if (current.classList.contains(cls))
            {
               reject = true;
               break;
            }
         }
      }

      // Excluded IDs
      if (!reject && exIds)
      {
         for (const id of exIds)
         {
            if (current.id === id)
            {
               reject = true;
               break;
            }
         }
      }

      // Excluded selector
      if (!reject && excludeSelector && current.matches(excludeSelector)) { reject = true; }

      if (reject)
      {
         current = current.parentElement;
         depth++;
         continue;
      }

      // Inclusion checks --------------------------------------------------------------------------------------------

      let accept = true;

      // Must contain all included classes
      if (inClasses)
      {
         for (const cls of inClasses)
         {
            if (!current.classList.contains(cls))
            {
               accept = false;
               break;
            }
         }
      }

      // Must match all included IDs
      if (accept && inIds)
      {
         for (const id of inIds)
         {
            if (current.id !== id)
            {
               accept = false;
               break;
            }
         }
      }

      // Must match inclusion selector
      if (accept && selector && !current.matches(selector))
      {
         accept = false;
      }

      // Custom predicate must return true
      if (accept && predicate && predicate(current) !== true)
      {
         accept = false;
      }

      if (accept)
      {
         return current;
      }

      current = current.parentElement;
      depth++;
   }

   return null;
}

/**
 * Options for {@link findParentElement}.
 */
export interface FindParentOptions
{
   /** Iterable list of CSS classes which disqualify a parent element. */
   excludeClasses?: Iterable<string>;

   /** Iterable list of CSS classes an element must contain to be accepted. */
   includeClasses?: Iterable<string>;

   /** Iterable list of IDs which disqualify a parent element. */
   excludeIds?: Iterable<string>;

   /** Iterable list of IDs a parent element must have to be accepted. */
   includeIds?: Iterable<string>;

   /** CSS selector an ancestor must match to be accepted. */
   selector?: string;

   /** CSS selector which disqualifies a parent element if matched. */
   excludeSelector?: string;

   /** Custom predicate; must return true for an element to be accepted. */
   predicate?: (el: HTMLElement) => boolean;

   /** Stop traversal if this element is reached. */
   stopAt?: HTMLElement | null;

   /** Positive integer defining maximum number of parentElement hops allowed. */
   maxDepth?: number;
}



// /**
//  * @param el - Starting element.
//  *
//  * @param [excludeClasses] - Optional iterable list of CSS class names to skip parent element
//  * traversal.
//  *
//  * @returns First parent element not potentially excluded.
//  */
// export function findParentElement(el: Element, excludeClasses?: Iterable<string>): HTMLElement | null
// {
//    if (!CrossRealm.browser.isElement(el)) { throw new TypeError(`'el' is not a valid Element`); }
//
//    const exclusions = ensureNonEmptyIterable(excludeClasses);
//
//    // No exclusions → return the immediate parent.
//    if (!exclusions) { return el.parentElement; }
//
//    let current = el.parentElement;
//
//    while (current)
//    {
//       let hasExcluded = false;
//
//       for (const cls of exclusions)
//       {
//          if (current.classList.contains(cls))
//          {
//             hasExcluded = true;
//             break;
//          }
//       }
//
//       if (!hasExcluded) { return current; }
//
//       current = current.parentElement;
//    }
//
//    return null;
// }
