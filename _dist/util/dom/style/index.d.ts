/**
 * Provides a managed dynamic style sheet / element useful in configuring global CSS variables. When creating an
 * instance of StyleManager, you must provide a CSS ID for the style element.
 *
 * Instances of StyleManager must be versioned by supplying a semver version string via the 'version' option. This
 * version is assigned to the associated style element. When a StyleManager instance is created and there is an
 * existing instance with a version that is lower than the current new instance, all CSS rules are removed, letting
 * the higher version take precedence. This isn't a perfect system and requires thoughtful construction of CSS
 * variables exposed, but allows multiple independently compiled TRL packages to load the latest CSS variables..
 */
declare class StyleManager implements Iterable<[string, StyleManager.RuleManager]> {
  #private;
  /**
   * @private
   */
  private constructor();
  /**
   * Connect to an existing dynamic styles managed element by CSS ID with semver check on version range compatibility.
   *
   * @param   options - Options.
   */
  static connect({ id, range, document, warn }: StyleManager.Options.Connect): StyleManager;
  /**
   * @param   options - Options.
   *
   * @returns Created style manager instance or undefined if already exists with a higher version.
   */
  static create(options: StyleManager.Options.Create): StyleManager | undefined;
  /**
   * Query and check for an existing dynamic style manager element / instance given a CSS ID.
   *
   * @param   options - Options.
   *
   * @returns Undefined if no style manager is configured for the given CSS ID otherwise an object containing the
   *          current version and HTMLStyleElement associated with the CSS ID.
   */
  static exists({ id, document }: StyleManager.Options.Exists): StyleManager.Data.Exists | undefined;
  /**
   * Determines if this StyleManager style element is still connected / available.
   *
   * @returns Is StyleManager connected.
   */
  get isConnected(): boolean;
  /**
   * @returns Provides an accessor to get the `textContent` for the style sheet.
   */
  get textContent(): string | null;
  /**
   * @returns Returns the version of this instance.
   */
  get version(): string;
  /**
   * Allows usage in `for of` loops directly.
   *
   * @returns Entries Map iterator.
   */
  [Symbol.iterator](): MapIterator<[string, StyleManager.RuleManager]>;
  /**
   * Provides a copy constructor to duplicate an existing StyleManager instance into a new document.
   *
   * @param   options - Required clone options.
   *
   * @returns New style manager instance or undefined if not connected.
   */
  clone({ document, force, warn }: StyleManager.Options.Clone): StyleManager | undefined;
  /**
   * @returns RuleManager entries iterator.
   */
  entries(): MapIterator<[string, StyleManager.RuleManager]>;
  /**
   * Retrieves an associated {@link RuleManager} by name.
   *
   * @param   ruleName - Rule name.
   *
   * @returns Associated rule manager for given name or undefined if the rule name is not defined or manager is
   *          unconnected.
   */
  get(ruleName: string): StyleManager.RuleManager | undefined;
  /**
   * Returns whether a {@link StyleManager.CSSRuleManger} exists for the given name.
   *
   * @param ruleName - Rule name.
   *
   * @returns Is there a CSS rule manager with the given name.
   */
  has(ruleName: string): boolean;
  /**
   * @returns {MapIterator<string>} RuleManager keys iterator.
   */
  keys(): MapIterator<string>;
  /**
   * @returns Iterator of all RuleManager instances.
   */
  values(): MapIterator<StyleManager.RuleManager>;
}
/**
 * Provides various type definitions and interfaces utilized by {@link StyleManager}.
 */
declare namespace StyleManager {
  /**
   * Provides return data types for various methods of {@link StyleManager}.
   */
  namespace Data {
    /**
     * Return data from {@link StyleManager.exists}.
     */
    type Exists = {
      /**
       * CSS ID of target style element.
       */
      id: string;
      /**
       * Semver version of the dynamic styles.
       */
      version: string;
      /**
       * Associated {@link HTMLStyleElement}.
       */
      element: HTMLStyleElement;
    };
    /**
     * Defines the rule name to CSS selector configuration when using {@link StyleManager.create}. Keys are the
     * rule name that can retrieve a {@link StyleManager.RuleManager} via {@link StyleManager.get}. Values
     * are the CSS selector to associate with this manager.
     */
    type RulesConfig = {
      [key: string]: string;
    };
    /**
     * A mapping of CSS style properties. When bulk setting style properties keys must be in hyphen-case
     * (IE `background-color`). When retrieving bulk style properties you may request keys to be in camel case
     * (IE `backgroundColor`). Keys are CSS property names. Bulk retrieval is facilitated by
     * {@link StyleManager.RuleManager.get}. All values are strings as returned from the CSS Object Model.
     */
    type StyleProps = {
      [key: string]: string;
    };
  }
  /**
   * Provides options types for various methods of {@link StyleManager}.
   */
  namespace Options {
    /**
     * Options for {@link StyleManager.clone}.
     */
    type Clone = {
      /**
       * Target browser document to clone into.
       *
       * @defaultValue
       */
      document: Document;
      /**
       * When true, force the cloning of the style manager into the target document.
       *
       * @defaultValue `false`
       */
      force?: boolean;
      /**
       * When true, log warnings on why cloning failed.
       *
       * @defaultValue `false`
       */
      warn?: boolean;
    };
    /**
     * Options for {@link StyleManager.connect}.
     */
    type Connect = {
      /**
       * Required CSS ID providing a link to a specific style sheet element.
       */
      id: string;
      /**
       * A semver version or range string representing the version / level of styles supported in connecting to
       * an existing dynamic styles implementation.
       */
      range: string;
      /**
       * Target document to load styles into.
       *
       * @defaultValue `window.document`
       */
      document?: Document;
      /**
       * When true, log warnings on why connecting failed.
       *
       * @defaultValue `false`
       */
      warn?: boolean;
    };
    /**
     * Options for {@link StyleManager.create}.
     */
    type Create = {
      /**
       * Required CSS ID providing a link to a specific style sheet element.
       */
      id: string;
      /**
       * CSS Rules configuration. Rule name / selector.
       */
      rules: StyleManager.Data.RulesConfig;
      /**
       * Required semver string without wildcards / version ranges representing the version / level of styles being
       * managed.
       */
      version: string;
      /**
       * Target document to load styles into.
       *
       * @defaultValue `window.document`
       */
      document?: Document;
      /**
       * Optional CSS layer name defining the top level CSS layer containing all rules.
       */
      layerName?: string;
      /**
       * When true, log warnings on why creation failed.
       *
       * @defaultValue `false`
       */
      warn?: boolean;
    };
    /**
     * Options for {@link StyleManager.exists}.
     */
    type Exists = {
      /**
       * Required CSS ID providing a link to a specific style sheet element.
       */
      id: string;
      /**
       * Target document to load styles into.
       *
       * @defaultValue `window.document`
       */
      document?: Document;
    };
  }
  /**
   * Provides the ability to `get` and `set` bulk or single CSS properties to a specific {@link CSSStyleRule}.
   */
  interface RuleManager extends Iterable<[string, string]> {
    /**
     * @returns Provides an accessor to get the `cssText` for the style rule or undefined if not connected.
     */
    get cssText(): string | undefined;
    /**
     * @param cssText - Provides an accessor to set the `cssText` for the style rule.
     */
    set cssText(cssText: string | undefined);
    /**
     * Determines if this RuleManager is still connected / available.
     *
     * @returns {boolean} Is RuleManager connected.
     */
    get isConnected(): boolean;
    /**
     * @returns Name of this RuleManager indexed by associated StyleManager.
     */
    get name(): string;
    /**
     * @returns The associated selector for this CSS rule.
     */
    get selector(): string;
    /**
     * @returns Iterator of CSS property entries in hyphen-case.
     */
    entries(): Iterator<[string, string]>;
    /**
     * Retrieves an object with the current CSS rule data.
     *
     * @param [options] - Optional settings.
     *
     * @param [options.camelCase=false] - Whether to convert property names to camel case.
     *
     * @returns Current CSS style data or undefined if not connected.
     */
    get(options: { camelCase?: boolean }): StyleManager.Data.StyleProps | undefined;
    /**
     * Gets a particular CSS property value.
     *
     * @param key - CSS property key; must be in hyphen-case (IE `background-color`).
     *
     * @returns Returns CSS property value or undefined if non-existent.
     */
    getProperty(key: string): string | undefined;
    /**
     * Returns whether this CSS rule manager has a given property key.
     *
     * @param key - CSS property key; must be in hyphen-case (IE `background-color`).
     *
     * @returns Property key exists / is defined.
     */
    hasProperty(key: string): boolean;
    /**
     * @returns Iterator of CSS property keys in hyphen-case.
     */
    keys(): Iterator<string>;
    /**
     * Set CSS properties in bulk by property / value. Must use hyphen-case.
     *
     * @param styles - CSS styles object.
     *
     * @param [options] - Options.
     *
     * @param [override=true] - When true overrides any existing values; default: `true`.
     */
    setProperties(
      styles: StyleManager.Data.StyleProps,
      {
        override,
      }?: {
        override?: boolean;
      },
    ): void;
    /**
     * Sets a particular property.
     *
     * @param key - CSS property key; must be in hyphen-case (IE `background-color`).
     *
     * @param value - CSS property value.
     *
     * @param [options] - Options.
     *
     * @param [options.override=true] - When true overrides any existing value; default: `true`.
     */
    setProperty(
      key: string,
      value: string,
      {
        override,
      }?: {
        override?: boolean;
      },
    ): void;
    /**
     * Removes the property keys specified. If `keys` is an iterable list then all property keys in the list are
     * removed. The keys must be in hyphen-case (IE `background-color`).
     *
     * @param keys - The property keys to remove.
     */
    removeProperties(keys: Iterable<string>): void;
    /**
     * Removes a particular CSS property.
     *
     * @param key - CSS property key; must be in hyphen-case (IE `background-color`).
     *
     * @returns CSS value when removed or undefined if non-existent.
     */
    removeProperty(key: string): string | undefined;
  }
  /**
   * Defines extra data stored directly on an {@link HTMLStyleElement} associated with the dynamic style manager
   * instance.
   */
  interface TJSStyleElement extends HTMLStyleElement {
    /**
     * The rules configuration for this dynamic style instance.
     */
    _tjsRules: StyleManager.Data.RulesConfig;
    /**
     * The non-wildcard semver for this dynamic style instance.
     */
    _tjsVersion: string;
    /**
     * Any associated CSS layer name for this dynamic style instance.
     */
    _tjsLayerName: string | undefined;
  }
}

/**
 * Provides resources for parsing style strings.
 */
declare class StyleParse {
  #private;
  /**
   * @private
   */
  private constructor();
  /**
   * Parse a CSS declaration block / {@link CSSDeclarationBlock} (IE `color: red; font-size: 14px;`) into an object of
   * property / value pairs.
   *
   * This implementation is optimized for parsing the output of `CSSStyleRule.style.cssText`, which is always
   * well-formed according to the CSSOM spec. It is designed to be:
   * ```
   * - **Fast**: minimal allocations, no regex in the hot loop.
   * - **Accurate**: ignores `;` inside quotes or parentheses.
   * - **Flexible**: supports optional camel case conversion.
   * - **CSS variable safe**: leaves `--*` properties untouched.
   *```
   *
   * @param cssText - A valid CSS declaration block (no selectors).
   *
   * @param [options] - Optional parser settings.
   *
   * @param [options.camelCase=false] - Convert hyphen-case property names to camel case.
   *
   * @returns An object mapping property names to their CSS values.
   */
  static cssText(
    cssText: string,
    {
      camelCase,
    }?: {
      camelCase?: boolean;
    },
  ): {
    [key: string]: string;
  };
  /**
   * Parses a pixel string / computed styles. Ex. `100px` returns `100`.
   *
   * @param   value - Value to parse.
   *
   * @returns The integer component of a pixel string.
   */
  static pixels(value: string): number | undefined;
  /**
   * Returns the pixel value for `1rem` based on the root document element. You may apply an optional multiplier.
   *
   * @param [multiplier=1] - Optional multiplier to apply to `rem` pixel value; default: 1.
   *
   * @param [options] - Optional parameters.
   *
   * @param [options.targetDocument=document] The target DOM {@link Document} if different from the main
   *        browser global `document`.
   *
   * @returns The pixel value for `1rem` with or without a multiplier based on the root document element.
   */
  static remPixels(
    multiplier?: number,
    {
      targetDocument,
    }?: {
      targetDocument?: Document;
    },
  ): number | undefined;
  /**
   * Split a CSS selector list into individual selectors, honoring commas that appear only at the top level
   * (IE not inside (), [], or quotes). Additional options provide inclusion / exclusion filtering of selector parts.
   *
   * Examples:
   *   '.a, .b'                                  → ['.a', '.b']
   *   ':is(.a, .b):not([data-x=","]) .c, .d'    → [':is(.a, .b):not([data-x=","]) .c', '.d']
   *
   * @param selectorText - `CSSStyleRule.selectorText` to parse.
   *
   * @param [options] - Optional filtering options.
   *
   * @param [options.excludeSelectorParts] - An array of RegExp instances to filter by exclusion.
   *
   * @param [options.includeSelectorPartSet] - A Set of strings to filter by inclusion.
   *
   * @returns Array of trimmed selector strings w/ optional filtering of parts.
   */
  static selectorText(
    selectorText: string,
    {
      excludeSelectorParts,
      includeSelectorPartSet,
    }?: {
      excludeSelectorParts?: RegExp[];
      includeSelectorPartSet?: Set<string>;
    },
  ): string[];
}

/**
 * Dynamically parses and indexes a `CSSStyleSheet` at runtime, exposing a selector-to-style mapping by
 * individual selector parts. CSS variable resolution is also possible which enables the ability to flatten and
 * resolve complex nested `var(--...)` chains defined across multiple selectors and layers.
 *
 * When retrieving specific selector styles via {@link StyleSheetResolve.get} and {@link StyleSheetResolve.getProperty}
 * it is possible to provide additional parent selectors that may define scoped CSS variables. These parent variable
 * definitions will be substituted in the target selector data allowing specific element scoping of CSS variables to be
 * flattened.
 *
 * Current fallback support includes recursive var(--a, var(--b, ...)) chains with graceful partial substitution if
 * some variables are undefined. This maintains correctness without introducing ambiguity or needing a complete AST
 * based parser.
 *
 * By default, when parsing CSSStyleSheet instances relative URL rewriting occurs converting `url(...)` references to
 * absolute paths based on the `CSSStyleSheet.href` or the `baseHref` parse option for inline / synthetic
 * CSSStyleSheets. You may turn off relative URL rewriting via setting the `urlRewrite` parse option to `false`.
 *
 * By default, simple media queries / `@media` rules are parsed when all conditions are `prefers-*` features and the
 * media query matches at runtime via `window.matchMedia(...)`. Mixed conditions (IE with screen, width, etc.) are
 * ignored by design. Only direct style rules under a media query are parsed. You may turn off media query parsing via
 * setting the `mediaQuery` parse option to false.
 *
 * --------
 *
 * The goal of this implementation is to realize a regex-based parser with small code size, minimal memory footprint,
 * speed, and reasonable accuracy.
 *
 * Core features:
 * - Parses all or specific relevant `@layer` blocks.
 * - Provides both direct and resolved access to styles via `.get()` and `.getProperty()`.
 * - Automatically rewrites relative URLs / `url(...)` references to absolute paths.
 *
 * Parse Options:
 * - Can set a base `href` for inline / synthetic CSSStyleSheets being processed via `baseHref` option.
 * - Can filter out and exclude undesired CSS selector parts for parsing via `excludeSelectorParts` option.
 * - Can filter out and include just desired CSS layers via `includeCSSLayers` option.
 * - Can filter out and include just desired CSS selector parts via `includeSelectorPartSet` option.
 * - Can disable relative URL rewriting by setting `urlRewrite` option to `false`.
 *
 * Access Options:
 * - Can return style property keys in camel case via `camelCase` option.
 * - Can limit the depth of resolved CSS variables across parent-selector fallback chains via `depth` option.
 * - Enables resolution of scoped CSS variables using a parent-selector fallback chain via `resolve` option.
 * - Can enable cyclic dependency detection warnings when resolving CSS variables via `warnCycles` option.
 * - Can enable warnings for non-existent parent-selector fallback lookup via `warnResolve` option.
 *
 * @example
 * ```js
 * import { StyleSheetResolve } from '#runtime/util/dom/style';
 *
 * // Parse first stylesheet in the browser `document`.
 * const parsedStyles = StyleSheetResolve.parse(document.styleSheets[0]);
 *
 * // The `props` object has styles w/ CSS variables resolved from `input[type="text"]` for the dark theme.
 * const props = parsedStyles.get('input[type="text"]', { resolve: '.themed.theme-dark input' });
 * ```
 *
 * @privateRemarks
 * This implementation avoids a full AST parser for `var(--...)` fallback expressions to keep the codebase compact. If
 * future requirements include resolving deeply nested fallbacks, debug tracing, or custom resolution behavior, I'll
 * consider replacing this logic with a dedicated AST parser and visitor pattern. An AST-based approach would offer more
 * flexibility and maintainability at the cost of slightly increased complexity and larger runtime memory footprint.
 */
declare class StyleSheetResolve
  implements
    Iterable<
      [
        string,
        {
          [key: string]: string;
        },
      ]
    >
{
  #private;
  /**
   * Parse a CSSStyleSheet instance with the given options or accept a pre-filled Map generating a new
   * `StyleSheetResolve` instance.
   *
   * @param styleSheetOrMap - The stylesheet instance to parse or an existing parsed stylesheet Map.
   *
   * @param [options] - Options for parsing stylesheet.
   *
   * @returns {StyleSheetResolve} New instance with the given parsed data.
   */
  static parse(
    styleSheetOrMap:
      | CSSStyleSheet
      | Map<
          string,
          {
            [key: string]: string;
          }
        >,
    options?: StyleSheetResolve.Options.Parse,
  ): StyleSheetResolve;
  /**
   * Instantiate an empty `StyleSheetResolve` instance.
   */
  constructor();
  /**
   * @returns Current frozen state; when true no more modifications are possible.
   */
  get frozen(): boolean;
  /**
   * @returns Returns the size / count of selector properties tracked.
   */
  get size(): number;
  /**
   * Allows usage in `for of` loops directly.
   *
   * @returns Entries Map iterator.
   */
  [Symbol.iterator](): MapIterator<
    [
      string,
      {
        [key: string]: string;
      },
    ]
  >;
  /**
   * Clears any existing parsed styles.
   */
  clear(): void;
  /**
   * Clones this instance returning a new `StyleSheetResolve` instance with a copy of the data.
   *
   * @returns Cloned instance.
   */
  clone(): StyleSheetResolve;
  /**
   * Deletes an entry in the parsed stylesheet Map.
   *
   * @param   selector - Selector key to delete.
   *
   * @returns Success state.
   */
  delete(selector: string): boolean;
  /**
   * Entries iterator of selector / style properties objects.
   *
   * @returns {MapIterator<[string, { [key: string]: string }]>} Tracked CSS selector key / value iterator.
   * @yields
   */
  entries(): MapIterator<
    [
      string,
      {
        [key: string]: string;
      },
    ]
  >;
  /**
   * Freezes this instance disallowing further modifications to the stylesheet data.
   */
  freeze(): void;
  /**
   * Gets all properties associated with the given selector(s). You may combine multiple selectors for a
   * combined result. You may also provide additional selectors as the `resolve` option to substitute any CSS variables
   * in the target selector(s).
   *
   * @param selector - A selector or list of selectors to retrieve.
   *
   * @param [options] - Options.
   *
   * @returns Style properties object or undefined.
   */
  get(
    selector: string | Iterable<string>,
    { camelCase, depth, resolve, warnCycles, warnResolve }?: StyleSheetResolve.Options.Get,
  ):
    | {
        [key: string]: string;
      }
    | undefined;
  /**
   * Gets a specific property value from the given `selector` and `property` key.
   *
   * @param   selector - A selector or list of selectors to retrieve.
   *
   * @param   property - Specific property to locate.
   *
   * @param   [options] - Options.
   *
   * @returns Style property value.
   */
  getProperty(
    selector: string | Iterable<string>,
    property: string,
    options?: StyleSheetResolve.Options.Get,
  ): string | undefined;
  /**
   * Test if `StyleSheetResolve` tracks the given selector.
   *
   * @param   selector - CSS selector to check.
   *
   * @returns StyleSheetResolve tracks the given selector.
   */
  has(selector: string): boolean;
  /**
   * @returns Tracked CSS selector keys iterator.
   */
  keys(): MapIterator<string>;
  /**
   * Merges selectors and style properties from another StyleSheetResolve instance into this one. By default, the
   * source of the merge overrides existing properties. You may choose to preserve existing values along with
   * specifying exact selector matches.
   *
   * @param   source - Another instance to merge from.
   *
   * @param   [options] - Options.
   *
   * @returns This instance.
   */
  merge(source: StyleSheetResolve, { exactMatch, strategy }?: StyleSheetResolve.Options.Merge): this;
  /**
   * Clears existing stylesheet mapping and parses the given stylesheet or Map.
   *
   * @param   styleSheetOrMap - The stylesheet element to parse or an existing parsed stylesheet Map.
   *
   * @param   [options] - Options for parsing stylesheet.
   *
   * @returns This instance.
   */
  parse(
    styleSheetOrMap:
      | CSSStyleSheet
      | Map<
          string,
          {
            [key: string]: string;
          }
        >,
    options?: StyleSheetResolve.Options.Parse,
  ): this;
  /**
   * Directly sets a selector key with the given style properties object.
   *
   * @param   selector - A single selector key to set.
   *
   * @param   styleObj - Style data object of property / value pairs.
   */
  set(
    selector: string,
    styleObj: {
      [key: string]: string;
    },
  ): void;
}
/**
 * Provides various options types for {@link StyleSheetResolve}.
 */
declare namespace StyleSheetResolve {
  /**
   * Provides various options types for {@link StyleSheetResolve}.
   */
  namespace Options {
    /**
     * Optional options for {@link StyleSheetResolve.get} and {@link StyleSheetResolve.getProperty}.
     */
    type Get = {
      /**
       * When true, returned property keys will be in camel case. CSS variable key names are not converted.
       *
       * @defaultValue `false`
       */
      camelCase?: boolean;
      /**
       * Resolution depth for CSS variable substitution. By default, the depth is the length of the provided
       * `resolve` selectors, but you may opt to provide a specific depth even with multiple resolution selectors.
       */
      depth?: number;
      /**
       * Additional parent selectors as CSS variable resolution sources.
       */
      resolve?: string | Iterable<string>;
      /**
       * When true and resolving CSS variables cyclic / self-referential CSS variable associations are detected.
       *
       * @defaultValue `false`
       */
      warnCycles?: boolean;
      /**
       * When true, missing parent-selector in fallback-chain are logged.
       *
       * @defaultValue `false`
       */
      warnResolve?: boolean;
    };
    /**
     * Optional options for {@link StyleSheetResolve.merge}.
     */
    type Merge = {
      /**
       * Only merge if selector part keys match exactly.
       *
       * @defaultValue `false`.
       */
      exactMatch?: boolean;
      /**
       * By default, the source overrides existing values. You may also provide a `preserve` strategy which only
       * merges property keys that do not exist already.
       *
       * @defaultValue `override`
       */
      strategy?: 'override' | 'preserve';
    };
    /**
     * Optional options for {@link StyleSheetResolve.parse}.
     */
    type Parse = {
      /**
       * This value is used as the base `HREF` and is used as a fallback origin for any stylesheet that lacks a
       * defined `CSSStyleSheet.href` (IE inline or synthetic stylesheets). You may provide it when processing inline
       * stylesheets when URL rewriting is necessary.
       */
      baseHref?: string;
      /**
       * A list of RegExp instance used to exclude CSS selector parts from parsed stylesheet data.
       */
      excludeSelectorParts?: Iterable<RegExp>;
      /**
       * A list of RegExp instance used to specifically include in parsing for specific allowed CSS layers if
       * present in the stylesheet.
       */
      includeCSSLayers?: Iterable<RegExp>;
      /**
       * A Set of strings to exactly match selector parts to include in parsed stylesheet data.
       */
      includeSelectorPartSet?: Set<string>;
      /**
       * When false, media query / `@media` parsing is disabled.
       *
       * @defaultValue `true`
       */
      mediaQuery?: boolean;
      /**
       * When false, relative URL rewriting is disabled. Relative URL rewriting based on the `CSSStyleSheet.href` or
       * provided `baseHref` option is enabled by default.
       *
       * @defaultValue `true`
       */
      urlRewrite?: boolean;
    };
  }
}

export { StyleManager, StyleParse, StyleSheetResolve };
