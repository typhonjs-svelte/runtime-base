import {
   ensureNonEmptyIterable,
   isObject }                 from '#runtime/util/object';

import { CrossRealm }         from '#runtime/util/realm';

/**
 * Tests the given element against several optional exclusion / inclusion criteria such as CSS classes / IDs, selector
 * matches or a general purpose provided predicate function.
 *
 * @param el - Element to test.
 *
 * @param options - Filter options.
 */
export function elementMatchesFilter(el: Element, options: ElementMatchesFilterOptions = {}): boolean
{
   if (!CrossRealm.browser.isElement(el)) { return false; }

   if (!isObject(options)) { throw new TypeError(`'options' is not an object.`); }

   // Unpack options.
   const {
      excludeClasses,
      includeClasses,
      excludeIds,
      includeIds,
      selector,
      excludeSelector,
      predicate
   } = options;

   const classList = el.classList;
   const id = el.id;

   // Exclusions -----------------------------------------------------------------------------------------------------

   if (excludeClasses)
   {
      const iter = ensureNonEmptyIterable(excludeClasses);
      if (iter)
      {
         for (const cls of iter)
         {
            if (classList.contains(cls)) { return false; }
         }
      }
   }

   if (excludeIds)
   {
      const iter = ensureNonEmptyIterable(excludeIds);
      if (iter)
      {
         for (const exId of iter)
         {
            if (id === exId) { return false; }
         }
      }
   }

   if (typeof excludeSelector === 'string' && el.matches(excludeSelector)) { return false; }

   // Inclusions -----------------------------------------------------------------------------------------------------

   if (includeClasses)
   {
      const iter = ensureNonEmptyIterable(includeClasses);
      if (iter)
      {
         for (const cls of iter)
         {
            if (!classList.contains(cls)) { return false; }
         }
      }
   }

   if (includeIds)
   {
      const iter = ensureNonEmptyIterable(includeIds);
      if (iter)
      {
         for (const incId of iter)
         {
            if (id !== incId) { return false; }
         }
      }
   }

   // Explicit selector check.
   if (typeof selector === 'string' && !el.matches(selector)) { return false; }

   // Predicate must explicitly return `true` to accept.
   if (typeof predicate === 'function' && !predicate(el)) { return false; }

   return true;
}

/**
 * Options for {@link elementMatchesFilter}.
 */
export interface ElementMatchesFilterOptions
{
   /** Iterable list of CSS classes which disqualify an element. */
   excludeClasses?: Iterable<string>;

   /** Iterable list of CSS classes an element must contain to be accepted. */
   includeClasses?: Iterable<string>;

   /** Iterable list of IDs which disqualify an element. */
   excludeIds?: Iterable<string>;

   /** Iterable list of IDs an element must have to be accepted. */
   includeIds?: Iterable<string>;

   /** CSS selector an ancestor must match to be accepted. */
   selector?: string;

   /** CSS selector which disqualifies an element if matched. */
   excludeSelector?: string;

   /** Custom predicate; must return true for an element to be accepted. */
   predicate?: (el: Element) => boolean;
}
