/**
 * Tests the given element against several optional exclusion / inclusion criteria such as CSS classes / IDs, selector
 * matches or a general purpose provided predicate function.
 *
 * @param el - Element to test.
 *
 * @param options - Filter options.
 */
declare function elementMatchesFilter(el: Element, options?: ElementMatchesOptions): boolean;
/**
 * Options for {@link elementMatchesFilter}.
 */
interface ElementMatchesOptions {
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
declare function findParentElement(el: Element, options?: FindParentOptions): Element | null;
/**
 * Options for {@link findParentElement}. The most common options are use of {@link FindParentOptions.stackingContext}
 * and / or the exclusion CSS class / ID properties such as {@link ElementMatchesOptions.excludeClasses}.
 */
interface FindParentOptions extends ElementMatchesOptions {
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

/**
 * Recursive function that finds the closest parent stacking context.
 * See also https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Positioning/Understanding_z_index/The_stacking_context
 *
 * Original author: Kerry Liu / https://github.com/gwwar
 *
 * @see https://github.com/gwwar/z-context/blob/master/content-script.js
 * @see https://github.com/gwwar/z-context/blob/master/LICENSE
 *
 * @param {Element} node -
 *
 * @param [activeWindow] The target active window as applicable.
 *
 * @returns The closest parent stacking context or undefined if none.
 *
 */
declare function getStackingContext(node: Element, activeWindow?: Window): StackingContext;
/**
 * Describes why a stacking context is created.
 */
type StackingContext = {
  /**
   * A DOM Element.
   */
  node: Element;
  /**
   * Reason for why a stacking context was created.
   */
  reason: string;
};

export { elementMatchesFilter, findParentElement, getStackingContext };
export type { ElementMatchesOptions, FindParentOptions, StackingContext };
