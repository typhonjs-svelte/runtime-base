import * as svelte_store from 'svelte/store';

/**
 * Provides reactive observation of any platform theme.
 *
 * @privateRemarks
 * This is an API stub class that is a no-op implementation. TODO: More documentation on the stubbing process.
 */
declare class ThemeObserver {
  /**
   * @returns {Readonly<{ theme: Readonly<import('svelte/store').Readable<string>> }>} Current core theme stores.
   */
  static get stores(): Readonly<{
    theme: Readonly<svelte_store.Readable<string>>;
  }>;
  /**
   * @returns {string} Current theme CSS class.
   */
  static get theme(): string;
  /**
   * Verify that the given `theme` name or complete CSS class is the current theme.
   *
   * @param {string} theme - A theme name or complete CSS class name to verify.
   *
   * @returns {boolean} If the requested theme match the current theme.
   */
  static isTheme(theme: string): boolean;
  /**
   * Detect if theming classes are present in the given iterable list.
   *
   * @param {Iterable<string>}  classes - CSS class list to verify if theming classes are included.
   *
   * @param {object} [options] - Optional parameters.
   *
   * @param {boolean} [options.strict=false] - When true, all theming classes required if multiple are verified.
   *
   * @returns {boolean} True if theming classes present.
   */
  static hasThemedClasses(
    classes: Iterable<string>,
    {
      strict,
    }?: {
      strict?: boolean;
    },
  ): boolean;
  /**
   * Determine the nearest theme CSS classes from the given element.
   *
   * @param {object} options - Required options.
   *
   * @param {Element} options.element - A DOM element.
   *
   * @param {Set<string>} [options.output] - An optional source Set of existing CSS classes.
   *
   * @param {boolean} [options.override=true] - When true, override any existing theme classes
   *
   * @param {boolean} [options.strict=false] - When true, ensure all required theming classes in output.
   *
   * @returns {Iterable<string>} Any theming CSS classes found from the given element.
   */
  static nearestThemedClasses({
    element,
    output,
    override,
    strict,
  }: {
    element: Element;
    output?: Set<string>;
    override?: boolean;
    strict?: boolean;
  }): Iterable<string>;
}

export { ThemeObserver };
