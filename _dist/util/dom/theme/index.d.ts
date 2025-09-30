import * as svelte_store from 'svelte/store';

/**
 * Provides reactive observation of any platform theme.
 *
 * @privateRemarks
 * This is an API stub class that is a no-op implementation. TODO: More documentation on the stubbing process.
 */
declare class ThemeObserver {
  /**
   * @returns {Readonly<({
   *    themeName: Readonly<import('svelte/store').Readable<string>>
   *    themeToken: Readonly<import('svelte/store').Readable<string>>
   * })>} Current platform theme stores.
   */
  static get stores(): Readonly<{
    themeName: Readonly<svelte_store.Readable<string>>;
    themeToken: Readonly<svelte_store.Readable<string>>;
  }>;
  /**
   * @returns {string} Current theme name; may be different from the theme token.
   */
  static get themeName(): string;
  /**
   * @returns {string} Current theme token - CSS class or data attribute value.
   */
  static get themeToken(): string;
  /**
   * Verify that the given `theme` name or token is the current platform theme.
   *
   * @param {string} theme - A theme name or token to verify.
   *
   * @returns {boolean} If the requested theme matches the current platform theme.
   */
  static isTheme(theme: string): boolean;
  /**
   * Detect if theming tokens (CSS class, etc.) are present in the given iterable list.
   *
   * @param {Iterable<string>}  tokens - a token list to verify if any theming tokens are included.
   *
   * @param {object} [options] - Optional parameters.
   *
   * @param {boolean} [options.strict=false] - When true, all theming tokens required if multiple are verified.
   *
   * @returns {boolean} True if theming tokens present.
   */
  static hasThemedTokens(
    tokens: Iterable<string>,
    {
      strict,
    }?: {
      strict?: boolean;
    },
  ): boolean;
  /**
   * Determine the nearest theme tokens (CSS classes, etc.) from the given element.
   *
   * @param {object} options - Required options.
   *
   * @param {Element | EventTarget} options.element - A DOM element.
   *
   * @param {Set<string>} [options.output] - An optional source Set of existing tokens.
   *
   * @param {boolean} [options.override=true] - When true, override any existing theme tokens.
   *
   * @param {boolean} [options.strict=false] - When true, ensure all required theming tokens in output.
   *
   * @returns {Iterable<string>} Any theming tokens found from the given element.
   */
  static nearestThemedTokens({
    element,
    output,
    override,
    strict,
  }: {
    element: Element | EventTarget;
    output?: Set<string>;
    override?: boolean;
    strict?: boolean;
  }): Iterable<string>;
}

export { ThemeObserver };
