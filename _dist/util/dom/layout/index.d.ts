/**
 * Walks up the DOM parentElement chain and returns the first ancestor that
 * satisfies multiple filtering rules (class, ID, selector, predicate), while
 * optionally limiting traversal depth.
 *
 * @param el       Starting element.
 * @param options  Filtering and traversal options.
 * @returns        The first acceptable parent element, or null.
 */
declare function findParentElement(el: Element, options?: FindParentOptions): HTMLElement | null;
/**
 * Options for {@link findParentElement}.
 */
interface FindParentOptions {
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
declare function getStackingContext(node: Element, activeWindow?: Window): StackingContext | undefined;
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

export { findParentElement, getStackingContext };
export type { FindParentOptions, StackingContext };
