/**
 * Provides several helpful utility methods for accessibility and keyboard navigation.
 *
 * Note: Global debugging can be enabled by setting `A11yHelper.debug = true`.
 */
declare class A11yHelper {
  /**
   * @param {boolean}  debug - Global debug enabled
   */
  static set debug(debug: boolean);
  /**
   * @returns {boolean} Global debugging enabled.
   */
  static get debug(): boolean;
  /**
   * Runs a media query to determine if the user / OS configuration is set up for reduced motion / animation.
   *
   * @returns {boolean} User prefers reduced motion.
   */
  static get prefersReducedMotion(): boolean;
  /**
   * Apply focus to the HTMLElement / SVGElement targets in a given A11yFocusSource data object. An iterable list
   * `options.focusEl` can contain HTMLElement / SVGElements or selector strings. If multiple focus targets are
   * provided in a list then the first valid target found will be focused. If focus target is a string then a lookup
   * via `document.querySelector` is performed. In this case you should provide a unique selector for the desired
   * focus target.
   *
   * Note: The body of this method is postponed to the next clock tick to allow any changes in the DOM to occur that
   * might alter focus targets before applying.
   *
   * @param {A11yFocusSource | { focusSource: A11yFocusSource }}   options - The focus options instance to apply.
   */
  static applyFocusSource(
    options:
      | A11yFocusSource
      | {
          focusSource: A11yFocusSource;
        },
  ): void;
  /**
   * Returns first focusable element within a specified element.
   *
   * @param {Element | Document} [element=document] - Optional element to start query.
   *
   * @param {object}            [options] - Optional parameters.
   *
   * @param {Iterable<string>}  [options.ignoreClasses] - Iterable list of classes to ignore elements.
   *
   * @param {Set<Element>}      [options.ignoreElements] - Set of elements to ignore.
   *
   * @returns {FocusableElement} First focusable child element.
   */
  static getFirstFocusableElement(
    element?: Element | Document,
    options?: {
      ignoreClasses?: Iterable<string>;
      ignoreElements?: Set<Element>;
    },
  ): FocusableElement;
  /**
   * Returns all focusable elements within a specified element.
   *
   * @param {Element | Document} [element=document] Optional element to start query.
   *
   * @param {object}            [options] - Optional parameters.
   *
   * @param {boolean}           [options.anchorHref=true] - When true anchors must have an HREF.
   *
   * @param {Iterable<string>}  [options.ignoreClasses] - Iterable list of classes to ignore elements.
   *
   * @param {Set<Element>}      [options.ignoreElements] - Set of elements to ignore.
   *
   * @param {string}            [options.selectors] - Custom list of focusable selectors for `querySelectorAll`.
   *
   * @returns {Array<FocusableElement>} Child keyboard focusable elements.
   */
  static getFocusableElements(
    element?: Element | Document,
    {
      anchorHref,
      ignoreClasses,
      ignoreElements,
      selectors,
    }?: {
      anchorHref?: boolean;
      ignoreClasses?: Iterable<string>;
      ignoreElements?: Set<Element>;
      selectors?: string;
    },
  ): Array<FocusableElement>;
  /**
   * Gets a A11yFocusSource object from the given DOM event allowing for optional X / Y screen space overrides.
   * Browsers (Firefox / Chrome) forwards a mouse event for the context menu keyboard button. Provides detection of
   * when the context menu event is from the keyboard. Firefox as of (1/23) does not provide the correct screen space
   * coordinates, so for keyboard context menu presses coordinates are generated from the centroid point of the
   * element.
   *
   * A default fallback element or selector string may be provided to provide the focus target. If the event comes from
   * the keyboard however the source focused element is inserted as the target with the fallback value appended to the
   * list of focus targets. When A11yFocusSource is applied by {@link A11yHelper.applyFocusSource} the target focus
   * list is iterated through until a connected target is found and focus applied.
   *
   * @param {object} options - Options
   *
   * @param {KeyboardEvent | MouseEvent}   [options.event] - The source DOM event.
   *
   * @param {boolean} [options.debug] - When true {@link A11yHelper.applyFocusSource} logs focus target data.
   *
   * @param {FocusableElement | string} [options.focusEl] - A specific HTMLElement / SVGElement or selector
   *        string as the focus target.
   *
   * @param {number}   [options.x] - Used when an event isn't provided; integer of event source in screen space.
   *
   * @param {number}   [options.y] - Used when an event isn't provided; integer of event source in screen space.
   *
   * @returns {A11yFocusSource} A A11yFocusSource object.
   *
   * @see https://bugzilla.mozilla.org/show_bug.cgi?id=1426671
   * @see https://bugzilla.mozilla.org/show_bug.cgi?id=314314
   *
   * TODO: Evaluate / test against touch input devices.
   */
  static getFocusSource({
    event,
    x,
    y,
    focusEl,
    debug,
  }: {
    event?: KeyboardEvent | MouseEvent;
    debug?: boolean;
    focusEl?: FocusableElement | string;
    x?: number;
    y?: number;
  }): A11yFocusSource;
  /**
   * Returns first focusable element within a specified element.
   *
   * @param {Element | Document} [element=document] - Optional element to start query.
   *
   * @param {object} [options] - Optional parameters.
   *
   * @param {Iterable<string>} [options.ignoreClasses] - Iterable list of classes to ignore elements.
   *
   * @param {Set<Element>} [options.ignoreElements] - Set of elements to ignore.
   *
   * @returns {FocusableElement} Last focusable child element.
   */
  static getLastFocusableElement(
    element?: Element | Document,
    options?: {
      ignoreClasses?: Iterable<string>;
      ignoreElements?: Set<Element>;
    },
  ): FocusableElement;
  /**
   * Tests if the given element is focusable.
   *
   * @param {Element} el - Element to test.
   *
   * @param {object} [options] - Optional parameters.
   *
   * @param {boolean} [options.anchorHref=true] - When true anchors must have an HREF.
   *
   * @param {Iterable<string>} [options.ignoreClasses] - Iterable list of classes to ignore elements.
   *
   * @returns {boolean} Element is focusable.
   */
  static isFocusable(
    el: Element,
    {
      anchorHref,
      ignoreClasses,
    }?: {
      anchorHref?: boolean;
      ignoreClasses?: Iterable<string>;
    },
  ): boolean;
  /**
   * Convenience method to check if the given data is a valid focus source.
   *
   * @param {Element | string}   data - Either an HTMLElement, SVGElement, or selector string.
   *
   * @returns {boolean} Is valid focus source.
   */
  static isFocusSource(data: Element | string): boolean;
  /**
   * Tests if the given `element` is a Element node and has a `focus` method.
   *
   * @param {Element}  element - Element to test for focus method.
   *
   * @returns {boolean} Whether the element has a focus method.
   */
  static isFocusTarget(element: Element): boolean;
  /**
   * Perform a parent traversal from the current active element attempting to match the given element to test whether
   * current active element is within that element.
   *
   * @param {Element}  element - An element to match in parent traversal from the active element.
   *
   * @param {Window}   [activeWindow=globalThis] The active window to use for the current active element.
   *
   * @returns {boolean} Whether there is focus within the given element.
   */
  static isFocusWithin(element: Element, activeWindow?: Window): boolean;
}
/**
 * A focusable element; either HTMLElement or SvgElement.
 */
type FocusableElement = Element & HTMLOrSVGElement;
/**
 * Provides essential data to return focus to an HTMLElement / SVGElement after a
 * series of UI actions like working with context menus and modal dialogs.
 */
type A11yFocusSource = {
  /**
   * When true logs to console the actions taken in {@link A11yHelper.applyFocusSource}.
   */
  debug?: boolean;
  /**
   * List of targets to attempt to focus.
   */
  focusEl?: Iterable<FocusableElement | string>;
  /**
   * The source of the event: 'keyboard' for instance.
   */
  source?: string;
  /**
   * Potential X coordinate of initial event.
   */
  x?: number;
  /**
   * Potential Y coordinate of initial event.
   */
  y?: number;
};

export { type A11yFocusSource, A11yHelper, type FocusableElement };
