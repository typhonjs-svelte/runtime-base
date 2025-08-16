import { CrossWindow }  from '#runtime/util/browser';

import {
   isIterable,
   isObject }           from '#runtime/util/object';

import { StyleParse }   from '../parse';
import {CSSStyleRule} from "happy-dom";

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
class StyleSheetResolve implements Iterable<[string, { [key: string]: string }]>
{
   /**
    * Detects hyphen-case separator for camel case property key conversion.
    */
   static #HYPHEN_CASE_REGEX = /-([a-z])/g;

   /**
    * Detects relative `url()` references in CSSStyleRule `cssText`.
    */
   static #URL_DETECTION_REGEX = /\burl\(\s*(['"]?)(?!data:|https?:|\/|#)/i;

   /**
    * Captures contents of `url()` references.
    */
   static #URL_REGEX = /url\((['"]?)([^'")]+)\1\)/g;

   /**
    * Internal tracking of frozen state; once frozen, no more modifications are possible.
    */
   #frozen: boolean = false;

   /**
    * Parsed selector to associated style properties.
    */
   #sheetMap: Map<string, { [key: string]: string }> = new Map();

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
   static parse(styleSheetOrMap: CSSStyleSheet | Map<string, { [key: string]: string }>,
    options: StyleSheetResolve.Options.Parse = {}): StyleSheetResolve
   {
      return new StyleSheetResolve().parse(styleSheetOrMap, options);
   }

   /**
    * Instantiate an empty `StyleSheetResolve` instance.
    */
   constructor() {}

   // Accessors ------------------------------------------------------------------------------------------------------

   /**
    * @returns Current frozen state; when true no more modifications are possible.
    */
   get frozen(): boolean
   {
      return this.#frozen;
   }

   /**
    * @returns Returns the size / count of selector properties tracked.
    */
   get size(): number
   {
      return this.#sheetMap.size;
   }

   // Iterator -------------------------------------------------------------------------------------------------------

   /**
    * Allows usage in `for of` loops directly.
    *
    * @returns Entries Map iterator.
    */
   *[Symbol.iterator](): MapIterator<[string, { [key: string]: string }]>
   {
      // Use `entries()` to make a shallow copy of data.
      yield* this.entries();
   }

   // Methods --------------------------------------------------------------------------------------------------------

   /**
    * Clears any existing parsed styles.
    */
   clear()
   {
      if (this.#frozen) { throw new Error('Cannot modify a frozen StyleSheetResolve instance.'); }

      this.#sheetMap.clear();
   }

   /**
    * Clones this instance returning a new `StyleSheetResolve` instance with a copy of the data.
    *
    * @returns Cloned instance.
    */
   clone(): StyleSheetResolve
   {
      return StyleSheetResolve.parse(this.#clone(this.#sheetMap));
   }

   /**
    * Deletes an entry in the parsed stylesheet Map.
    *
    * @param   selector - Selector key to delete.
    *
    * @returns Success state.
    */
   delete(selector: string): boolean
   {
      if (this.#frozen) { throw new Error('Cannot modify a frozen StyleSheetResolve instance.'); }

      return this.#sheetMap.delete(selector);
   }

   /**
    * Entries iterator of selector / style properties objects.
    *
    * @returns {MapIterator<[string, { [key: string]: string }]>} Tracked CSS selector key / value iterator.
    * @yields
    */
   *entries(): MapIterator<[string, { [key: string]: string }]>
   {
      // Ensure a shallow copy of style properties.
      for (const key of this.#sheetMap.keys()) { yield [key, { ...this.#sheetMap.get(key) }]; }
   }

   /**
    * Freezes this instance disallowing further modifications to the stylesheet data.
    */
   freeze()
   {
      /* c8 ignore next 1 */
      if (this.#frozen) { return; }

      this.#frozen = true;

      for (const props of this.#sheetMap.values()) { Object.freeze(props); }

      Object.freeze(this.#sheetMap);
   }

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
   get(selector: string | Iterable<string>, { camelCase = false, depth, resolve, warnCycles = false,
    warnResolve = false }: StyleSheetResolve.Options.Get = {}): { [key: string]: string } | undefined
   {
      if (typeof selector !== 'string' && !isIterable(selector))
      {
         throw new TypeError(`'selector' must be a string or an iterable list of strings.`);
      }

      if (typeof camelCase !== 'boolean') { throw new TypeError(`'camelCase' must be a boolean.`); }

      if (depth !== void 0 && (!Number.isInteger(depth) || depth < 1))
      {
         throw new TypeError(`'depth' must be a positive integer >= 1.`);
      }

      if (resolve !== void 0 && typeof resolve !== 'string' && !isIterable(resolve))
      {
         throw new TypeError(`'resolve' must be a string or an iterable list of strings.`);
      }

      if (typeof warnCycles !== 'boolean') { throw new TypeError(`'warnCycles' must be a boolean.`); }
      if (typeof warnResolve !== 'boolean') { throw new TypeError(`'warnResolve' must be a boolean.`); }

      let result: { [key: string]: string } | undefined = void 0;

      if (isIterable(selector))
      {
         for (const entry of selector)
         {
            // If there is a direct selector match, then return a value immediately.
            if (this.#sheetMap.has(entry)) { result = Object.assign(result ?? {}, this.#sheetMap.get(entry)); }
         }
      }
      else
      {
         // If there is a direct selector match, then return a value immediately.
         if (this.#sheetMap.has(selector)) { result = Object.assign(result ?? {}, this.#sheetMap.get(selector)); }
      }

      if (result && (typeof resolve === 'string' || isIterable(resolve)))
      {
         const resolveList = typeof resolve === 'string' ? [resolve] : Array.from(resolve);

         depth = typeof depth === 'number' ? depth : Math.max(1, resolveList.length);

         const resolveData: ResolveData = {
            parentNotFound: new Set(),
            seenCycles: new Set(),
            warnCycles
         }

         // Progressively resolve CSS variables up to the requested depth.
         for (let cntr = 0; cntr < depth && cntr < resolveList.length; cntr++)
         {
            this.#resolve(result, resolveList, resolveData);
         }

         if (resolveData.parentNotFound.size > 0)
         {
            console.warn(
             `[TyphonJS Runtime] StyleSheetResolve - resolve - Could not locate parent selector(s) for resolution: '${
              [...resolveData.parentNotFound].join(', ')}'`);
         }
      }

      // Potentially convert property keys to camel case.
      if (result && camelCase)
      {
         const remapped: { [key: string]: string } = {};

         const toUpper = (_: any, str: string) => str.toUpperCase();

         for (const key in result)
         {
            const mappedKey = key.startsWith('--') ? key : key.replace(StyleSheetResolve.#HYPHEN_CASE_REGEX, toUpper);
            remapped[mappedKey] = result[key];
         }

         result = remapped;
      }

      return result;
   }

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
   getProperty(selector: string | Iterable<string>, property: string, options?: StyleSheetResolve.Options.Get):
    string | undefined
   {
      const data = this.get(selector, options);

      return isObject(data) && property in data ? data[property] : void 0;
   }

   /**
    * Test if `StyleSheetResolve` tracks the given selector.
    *
    * @param   selector - CSS selector to check.
    *
    * @returns StyleSheetResolve tracks the given selector.
    */
   has(selector: string): boolean
   {
      return this.#sheetMap.has(selector);
   }

   /**
    * @returns Tracked CSS selector keys iterator.
    */
   keys(): MapIterator<string>
   {
      return this.#sheetMap.keys();
   }

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
   merge(source: StyleSheetResolve, { exactMatch = false, strategy = 'override' }:
    StyleSheetResolve.Options.Merge = {}): this
   {
      if (this.#frozen) { throw new Error('Cannot modify a frozen StyleSheetResolve instance.'); }

      if (!(source instanceof StyleSheetResolve))
      {
         throw new TypeError(`'source' is not a StyleSheetResolve instance.`);
      }

      for (const selectorPart of source.keys())
      {
         if (exactMatch && !this.#sheetMap.has(selectorPart)) { continue; }

         // Directly retrieve the stored object.
         const incoming = source.#sheetMap.get(selectorPart);

         /* c8 ignore next 1 */ // Sanity check.
         if (!incoming) { continue; }

         /* c8 ignore next 1 */  // `?? {}` is for sanity.
         const current = this.#sheetMap.get(selectorPart) ?? {};

         // For preserve strategy, make a copy of the incoming data in the case that the source is frozen.
         const merged = strategy === 'preserve' ? Object.assign({}, { ...incoming }, current) :
          Object.assign({}, current, incoming);

         this.#sheetMap.set(selectorPart, merged);
      }

      return this;
   }

   /**
    * Clears existing stylesheet mapping and parses the given stylesheet or Map.
    *
    * @param   styleSheetOrMap - The stylesheet element to parse or an existing parsed stylesheet Map.
    *
    * @param   [options] - Options for parsing stylesheet.
    *
    * @returns This instance.
    */
   parse(styleSheetOrMap: CSSStyleSheet | Map<string, { [key: string]: string }>,
    options: StyleSheetResolve.Options.Parse = {}): this
   {
      if (this.#frozen) { throw new Error('Cannot modify a frozen StyleSheetResolve instance.'); }

      this.#sheetMap.clear();

      if (!CrossWindow.isCSSStyleSheet(styleSheetOrMap) && !CrossWindow.isMap(styleSheetOrMap))
      {
         throw new TypeError(
          `'styleSheetOrMap' must be a 'CSSStyleSheet' instance or a parsed Map of stylesheet entries.`);
      }

      if (!isObject(options)) { throw new TypeError(`'options' is not an object.`); }

      if (options.baseHref !== void 0 && typeof options.baseHref !== 'string')
      {
         throw new TypeError(`'baseHref' must be a string.`);
      }

      if (options.excludeSelectorParts !== void 0 && !isIterable(options.excludeSelectorParts))
      {
         throw new TypeError(`'excludeSelectorParts' must be a list of RegExp instances.`);
      }

      if (options.includeCSSLayers !== void 0 && !isIterable(options.includeCSSLayers))
      {
         throw new TypeError(`'includeCSSLayers' must be a list of RegExp instances.`);
      }

      if (options.includeSelectorPartSet !== void 0 && !CrossWindow.isSet(options.includeSelectorPartSet))
      {
         throw new TypeError(`'includeSelectorPartSet' must be a Set of strings.`);
      }

      if (options.urlRewrite !== void 0 && typeof options.urlRewrite !== 'boolean')
      {
         throw new TypeError(`'urlRewrite' must be a boolean.`);
      }

      if (CrossWindow.isCSSStyleSheet(styleSheetOrMap))
      {
         this.#parse(styleSheetOrMap, options);
      }
      else if (CrossWindow.isMap(styleSheetOrMap))
      {
         this.#sheetMap = this.#clone(styleSheetOrMap as Map<string, { [key: string]: string }>);
      }

      return this;
   }

   /**
    * Directly sets a selector key with the given style properties object.
    *
    * @param   selector - A single selector key to set.
    *
    * @param   styleObj - Style data object of property / value pairs.
    */
   set(selector: string, styleObj: { [key: string]: string })
   {
      if (this.#frozen) { throw new Error('Cannot modify a frozen StyleSheetResolve instance.'); }

      if (typeof selector !== 'string') { throw new TypeError(`'selector' must be a string.`); }
      if (!isObject(styleObj)) { throw new TypeError(`'styleObj' must be an object.`); }

      this.#sheetMap.set(selector, styleObj);
   }

   // Internal Implementation ----------------------------------------------------------------------------------------

   /**
    * Shallow clone of source Map into target Map.
    *
    * @param   sourceMap - Source Map.
    *
    * @param   [targetMap] - Target Map.
    *
    * @returns Shallow copy cloned Map.
    */
   #clone(sourceMap: Map<string, { [key: string]: string }>,
    targetMap: Map<string, { [key: string]: string }> = new Map()): Map<string, { [key: string]: string }>
   {
      // Shallow copy.
      for (const [selector, props] of sourceMap.entries()) { targetMap.set(selector, { ...props }); }

      return targetMap;
   }

   #isMediaQueryPrefersOnly(mediaList: MediaList): boolean
   {
      const prefersRegex = /^\s*\(?\s*prefers-[^)]+:[^)]+\)?\s*$/i;

      for (let i = 0; i < mediaList.length; i++)
      {
         const query = mediaList[i];

         // Split top-level 'and' parts; don't attempt to handle nested parens—just enough for 99% cases.
         const parts = query.split(/\s+and\s+/i);

         for (const part of parts)
         {
            if (!prefersRegex.test(part)) { return false; }
         }
      }

      return mediaList.length > 0;
   }

   /**
    * Parses the given CSSStyleSheet instance.
    *
    * @param styleSheet - The stylesheet to parse.
    *
    * @param [opts] - Options for parsing stylesheet.
    */
   #parse(styleSheet: CSSStyleSheet, opts: StyleSheetResolve.Options.Parse)
   {
      // Convert to consistent sanitized options data data.
      const options: ProcessOptions = {
         baseHref: styleSheet.href ?? opts.baseHref,
         excludeSelectorParts: isIterable(opts.excludeSelectorParts) ? Array.from(opts.excludeSelectorParts) : [],
         includeCSSLayers: isIterable(opts.includeCSSLayers) ? Array.from(opts.includeCSSLayers) : [],
         includeSelectorPartSet: CrossWindow.isSet(opts.includeSelectorPartSet) ? opts.includeSelectorPartSet :
          new Set(),
         urlRewrite: opts.urlRewrite ?? true
      }

      const rules = styleSheet.cssRules;

      const allStyleRules: CSSStyleRule[] = [];

      // Collect all CSSStyleRules.
      for (let i = 0; i < rules.length; i++)
      {
         const rule = rules[i];

         switch(rule.constructor.name)
         {
            case 'CSSLayerBlockRule':
               this.#processLayerBlockRule(rule as CSSLayerBlockRule, void 0, allStyleRules, options);
               break;

            case 'CSSMediaRule':
               this.#processMediaRule(rule as CSSMediaRule, allStyleRules, options);
               break;

            case 'CSSStyleRule':
               allStyleRules.push(rule as unknown as CSSStyleRule);
               break;
         }
      }

      // Bulk process all CSSStyleRules and build the map of selectors to properties.
      this.#processStyleRules(allStyleRules, options);
   }

   /**
    * Recursively parses / processes a CSSLayerBlockRule and encountered CSSStyleRule entries.
    *
    * @param   blockRule - The `CSSLayerBlockRule` to parse.
    *
    * @param   parentLayerName - Name of parent CSS layer.
    *
    * @param   allStyleRules - All style rules to process.
    *
    * @param   opts - Sanitized process options.
    */
   #processLayerBlockRule(blockRule: CSSLayerBlockRule, parentLayerName: string | undefined,
    allStyleRules: CSSStyleRule[], opts: ProcessOptions)
   {
      const fullname = typeof parentLayerName === 'string' ? `${parentLayerName}.${blockRule.name}` : blockRule.name;

      const includeLayer = opts.includeCSSLayers.length === 0 ||
       opts.includeCSSLayers.some((regex) => regex.test(fullname));

      const layerBlockRules: CSSLayerBlockRule[] = [];

      const rules = blockRule.cssRules;
      for (let i = 0; i < rules.length; i++)
      {
         const rule = rules[i];

         switch(rule.constructor.name)
         {
            case 'CSSLayerBlockRule':
               layerBlockRules.push(rule as CSSLayerBlockRule);
               break;

            case 'CSSStyleRule':
               if (includeLayer) { allStyleRules.push(rule as unknown as CSSStyleRule); }
               break;
         }
      }

      for (let i = 0; i < layerBlockRules.length; i++)
      {
         this.#processLayerBlockRule(layerBlockRules[i], fullname, allStyleRules, opts);
      }
   }

   /**
    * Recursively parses / processes a CSSMediaRule and encountered CSSStyleRule entries.
    *
    * @param   mediaRule - The `CSSMediaRule` to parse.
    *
    * @param   allStyleRules - All style rules to process.
    *
    * @param   opts - Sanitized process options.
    */
   #processMediaRule(mediaRule: CSSMediaRule, allStyleRules: CSSStyleRule[], opts: ProcessOptions)
   {
      // Skip if it doesn’t match the current environment (IE prefers-color-scheme)
      if (!window.matchMedia(mediaRule.media.mediaText).matches)
      {
         return;
      }

      const prefersRegex = /^\s*\(?\s*prefers-[^)]+(?:\s*:\s*[^)]+)?\)?\s*$/i;

      let prefersOnly = true;

      for (let i = 0; i < mediaRule.media.length; i++)
      {
         const query = mediaRule.media[i];

         // Split top-level 'and' parts; don't attempt to handle nested parens—just enough for 99% cases.
         const parts = query.split(/\s+and\s+/i);

         for (const part of parts)
         {
            if (!prefersRegex.test(part)) { prefersOnly = false; }
         }
      }

      if (!prefersOnly) { return; }

      const rules = mediaRule.cssRules;
      for (let i = 0; i < rules.length; i++)
      {
         const rule = rules[i];

         switch(rule.constructor.name)
         {
            case 'CSSLayerBlockRule':
               this.#processLayerBlockRule(rule as CSSLayerBlockRule, void 0, allStyleRules, opts);
               break;

            case 'CSSMediaRule':
               this.#processMediaRule(rule as CSSMediaRule, allStyleRules, opts);
               break;

            case 'CSSStyleRule':
               allStyleRules.push(rule as unknown as CSSStyleRule);
               break;
         }
      }
   }

   /**
    * Processes all collected `CSSStyleRules`.
    *
    * @param   allStyleRules - Style rules to parse.
    *
    * @param   opts - ProcessOptions.
    */
   #processStyleRules(allStyleRules: CSSStyleRule[], opts: ProcessOptions)
   {
      for (let i = 0; i < allStyleRules.length; i++)
      {
         const styleRule = allStyleRules[i];

         // Split selector parts and remove disallowed selector parts and empty strings.
         const selectorParts = StyleParse.selectorText(styleRule.selectorText, opts);

         if (selectorParts.length)
         {
            // Parse CSSStyleDeclaration.
            const result = StyleParse.cssText(styleRule.style.cssText);

            // Only convert `url()` references if `urlRewrite` is true, baseHref` is defined, and relative `url()`
            // detected in `cssText`.
            if (opts.urlRewrite && opts.baseHref &&
             StyleSheetResolve.#URL_DETECTION_REGEX.test(styleRule.style.cssText))
            {
               this.#processStyleRuleUrls(result, opts);
            }

            for (let j = selectorParts.length; --j >= 0;)
            {
               const part = selectorParts[j];

               if (this.#sheetMap.has(part))
               {
                  Object.assign(this.#sheetMap.get(part)!, result);
               }
               else
               {
                  this.#sheetMap.set(part, result);
               }
            }
         }
      }
   }

   /**
    * Resolve relative `url(...)` references in CSS property values based on the stylesheet origin.
    *
    * This method rewrites relative paths in `url(...)` to absolute paths (IE `/assets/img.png`) using the
    * CSSStyleSheet `href` when available or falling back to the provided `baseHref` for inline stylesheets.
    *
    * @param result - Parsed CSS property key-value map.
    *
    * @param opts - Processing options.
    */
   #processStyleRuleUrls(result: { [key: string]: string }, opts: ProcessOptions)
   {
      const baseHref = opts.baseHref;

      for (const key in result)
      {
         let value = result[key];

         // Fast skip if there's no 'url(' substring.
         if (value.indexOf('url(') === -1) { continue; }

         // Avoid regex test if no reason to rewrite (IE relative URLs)
         if (!StyleSheetResolve.#URL_DETECTION_REGEX.test(value)) { continue; }

         // Only assign back to result if value changes.
         let modified = false;

         value = value.replace(StyleSheetResolve.#URL_REGEX, (match, quote, relPath) =>
         {
            try
            {
               // Convert the relative path to an absolute pathname using the resolved baseHref.
               const absPath = new URL(relPath, baseHref).pathname;
               modified = true;
               return `url(${quote}${absPath}${quote})`;
               /* c8 ignore next 6 */
            }
            catch
            {
               // If resolution fails return the original value unchanged.
               return match;
            }
         });

         if (modified) { result[key] = value; }
      }
   }

   /**
    * Resolves intermediate CSS variables defined in the `result` style properties object with data from the given
    * `resolve` selector(s).
    *
    * @param   result - Copy of source selector style properties to resolve.
    *
    * @param   resolve - Parent CSS variable resolution selectors.
    *
    * @param   resolveData - Resolution data.
    */
   #resolve(result: { [key: string]: string }, resolve: string[], resolveData: ResolveData)
   {
      // Collect all parent-defined CSS variables.
      const parentVars: { [key: string]: string } = {};

      for (let i = 0; i < resolve.length; i++)
      {
         const entry = resolve[i];

         const parent = this.get(entry);

         // Verify that the parent lookup is available otherwise add selector to `not found` Set.
         if (!isObject(parent))
         {
            resolveData.parentNotFound.add(entry);
            continue;
         }

         for (const key in parent)
         {
            if (key.startsWith('--')) { parentVars[key] = parent[key]; }
         }
      }

      // Track and resolve variables used in the result.
      const cssVars = new ResolveVars(result, parentVars, resolveData);

      /* c8 ignore next 1 */
      if (!cssVars.unresolvedCount) { return; }

      for (const key in parentVars) { cssVars.set(key, parentVars[key]); }

      Object.assign(result, cssVars.resolved);
   }
}

/**
 * Process options sanitized and converted for internal usage.
 */
type ProcessOptions = {
   /**
    * This value is used as the base `HREF` and is used as a fallback origin for any stylesheet that lacks a defined
    * `CSSStyleSheet.href` (IE inline or synthetic stylesheets). You may provide it when processing inline stylesheets
    * when URL rewriting is necessary.
    */
   baseHref?: string;

   /**
    * Array of RegExp to filter via exclusion CSS selector parts.
    */
   excludeSelectorParts: RegExp[];

   /**
    * Array of RegExp to filter via inclusion for CSS layer names.
    */
   includeCSSLayers: RegExp[];

   /**
    * A Set of strings to exactly match selector parts to include in parsed stylesheet data.
    */
   includeSelectorPartSet: Set<string>;

   /**
    * When false, relative URL rewriting is disabled. Relative URL rewriting based on the `CSSStyleSheet.href` or
    * provided `baseHref` option is enabled by default.
    *
    * @defaultValue `true`
    */
   urlRewrite?: boolean;
}

/**
 * Additional tracking data passed to CSS variable resolution path.
 */
type ResolveData = {
   /**
    * Stores resolution parents that are not found.
    */
   parentNotFound: Set<string>;

   /**
    * Dedupes warnings for cyclic dependency warnings.
    */
   seenCycles: Set<string>;

   /**
    * Cyclic dependency warnings enabled.
    */
   warnCycles: boolean;
}

/**
 * Encapsulates CSS variable resolution logic and data.
 */
class ResolveVars
{
   /**
    * Detect CSS variable.
    */
   static readonly #DETECT_CSS_VAR_REGEX = /--[\w-]+/g;

   /**
    * Capture CSS variable fallbacks.
    */
   static readonly #CSS_VAR_FALLBACK_REGEX = /^var\((?<varName>--[\w-]+)\s*,\s*(?<fallback>.+?)\)$/;

   /**
    * Replace CSS variable fallbacks.
    */
   static readonly #CSS_VAR_FALLBACK_REPLACE_REGEX = /var\((--[\w-]+)(?:\s*,\s*[^()]*?)?\)/g;

   /**
    * Closed CSS variable.
    */
   static readonly #CSS_VAR_REGEX = /^var\((--[\w-]+)\)$/;

   /**
    * Open CSS variable.
    */
   static readonly #CSS_VAR_PARTIAL_REGEX = /^var\((--[\w-]+)/;

   /**
    * Prevent deep fallback recursion.
    */
   static readonly #MAX_FALLBACK_DEPTH = 10;

   /**
    * Initial style properties w/ CSS variables to track.
    */
   #propMap = new Map<string, string>();

   /**
    * Reverse lookup for CSS variable name to associated property.
    */
   #varToProp = new Map<string, Set<string>>();

   /**
    * Resolved CSS variable from parent selector properties.
    */
   #varResolved = new Map<string, string>();

   readonly #parentVars: { [key: string]: string };

   #resolveData: ResolveData;

   /**
    * @param initial - Initial style entry to resolve.
    *
    * @param parentVars - All parent resolution vars.
    *
    * @param resolveData - Resolution data.
    */
   constructor(initial: { [key: string]: string }, parentVars: { [key: string]: string }, resolveData: ResolveData)
   {
      this.#parentVars = parentVars;
      this.#resolveData = resolveData;

      // Build the reverse dependency map of which CSS variables (--x) are referenced by each style property.
      // This enables efficient tracking of what properties depend on what variables.
      for (const prop in initial)
      {
         const value = initial[prop];
         let match: RegExpExecArray | null;

         ResolveVars.#DETECT_CSS_VAR_REGEX.lastIndex = 0; // Reset if reused

         let found = false;

         while ((match = ResolveVars.#DETECT_CSS_VAR_REGEX.exec(value)))
         {
            const entry = match[0];
            if (!this.#varToProp.has(entry)) this.#varToProp.set(entry, new Set());
            this.#varToProp.get(entry)!.add(prop);
            found = true;
         }

         if (found) this.#propMap.set(prop, value);
      }
   }

   /**
    * Resolves properties in `#propMap` by substituting var(...) expressions using resolved values in #varResolved. If
    * no resolution is available, attempts to preserve fallback expressions in their original var(...) form.
    *
    * Supports chained fallbacks like: var(--a, var(--b, var(--c, red))) and resolving variables in statements like
    * `calc(1rem + var(--x))`.
    *
    * @returns All fields that have been resolved.
    */
   get resolved(): { [key: string]: string }
   {
      const result: { [key: string]: string } = {};

      // Attempt to resolve each CSS variable found in style properties. If resolution is known, then substitute it
      // otherwise check for fallback chains.
      for (const entry of this.#varToProp.keys())
      {
         const props = this.#varToProp.get(entry);
         const varResolved = this.#varResolved.get(entry);

         /* c8 ignore next 1 */
         if (!props) { continue; }

         // Direct resolution: replace all `var(--x)` forms in all dependent properties with the resolved value.
         if (varResolved)
         {
            for (const prop of props)
            {
               let value = this.#propMap.get(prop) as string;

               if (value.indexOf(`var(${entry}`) !== -1)
               {
                  // Replace each `var(--x[, fallback])` with its resolved value (if available).
                  // Fallbacks are preserved unless fully resolvable, enabling partial resolution of chained vars.
                  value = value.replace(ResolveVars.#CSS_VAR_FALLBACK_REPLACE_REGEX, (match) =>
                  {
                     // Extract the CSS variable name (`--x`) from the matched `var(--x[, fallback])` expression.
                     const varName = match.match(ResolveVars.#CSS_VAR_PARTIAL_REGEX)?.[1];
                     const resolved = this.#varResolved.get(varName as string);

                     /* c8 ignore next 1 */ // `?? match` is a sanity fallback.
                     return resolved ?? match;
                  });
               }

               this.#propMap.set(prop, value);
               result[prop] = value;
            }
         }
         // Unresolved var: check if fallback exists (`var(--x, red)`), and resolve nested fallback chains if present.
         else
         {
            for (const prop of props)
            {
               const value = this.#propMap.get(prop) as string;

               // Early out if no fallback to resolve.
               if (value.indexOf(`var(${entry}`) === -1) { continue; }

               const fallback = this.#resolveNestedFallback(value);

               this.#propMap.set(prop, fallback);
               result[prop] = fallback;
            }
         }
      }

      return result;
   }

   /**
    * @returns Unresolved field count.
    */
   get unresolvedCount(): number
   {
      let count = 0;

      for (const entry of this.#varToProp.keys())
      {
         if (!this.#varResolved.has(entry)) { count++; }
      }

      return count;
   }

   /**
    * Sets the parent selector defined CSS variable for resolution.
    *
    * @param name - CSS variable name
    *
    * @param value - Value of target CSS variable.
    */
   set(name: string, value: string)
   {
      /* c8 ignore next 1 */
      if (typeof value !== 'string' || value.length === 0) { return; }

      if (this.#resolveData.warnCycles)
      {
         this.#setCycleWarn(name, value);
      }
      else
      {
         if (this.#varToProp.has(name) && !this.#varResolved.has(name)) { this.#varResolved.set(name, value); }
      }
   }

   // Internal Implementation ----------------------------------------------------------------------------------------

   /**
    * Performs DFS traversal to detect cycles in CSS variable resolution. Tracks the resolution path and emits a
    * warning if a cycle is found. Each affected property is reported once with its originating chain.
    *
    * @param   value - Value of target CSS variable.
    *
    * @param   visited - Visited CSS variables.
    *
    * @param   seenCycles - Dedupe cyclic dependency warnings.
    *
    * @returns Resolution result or undefined.
    */
   #resolveCycleWarn(value: string, visited: Set<string>, seenCycles: Set<string>): string | undefined
   {
      const match = value.match(ResolveVars.#CSS_VAR_REGEX);
      if (!match) { return value; }

      const next = match[1];

      // Cycle detection: if var is already seen in traversal, then record and warn.
      if (visited.has(next))
      {
         // Format cycle signature for deduping.
         const cycleChain = [...visited, next];
         const cycleKey = cycleChain.join('→');

         if (!seenCycles.has(cycleKey))
         {
            // Record and deduplicate cycle chains to avoid redundant logs.
            seenCycles.add(cycleKey);

            const affected = cycleChain.flatMap((varName) => Array.from(this.#varToProp.get(varName) ?? []).map(
             (prop) => `- ${prop} (via ${varName})`));

            if (affected.length > 0)
            {
               console.warn(`[TyphonJS Runtime] StyleSheetResolve - CSS variable cyclic dependency detected: ${
                cycleChain.join(' → ')}\nAffected properties:\n${affected.join('\n')}`);
            }
         }

         return void 0;
      }

      visited.add(next);

      // Look up the next variable in the chain to continue DFS. Prefer already-resolved entries.
      const nextValue = this.#varResolved.get(next) ?? this.#parentVars[next];

      /* c8 ignore next 1 */
      if (typeof nextValue !== 'string') { return void 0; }

      return this.#resolveCycleWarn(nextValue, visited, seenCycles);
   }

   /**
    * Resolve fallback chains of the form: var(--a, var(--b, ...))
    * - Only replaces the top-level var if it is resolved.
    * - Leaves fallback intact if unresolved.
    * - Recursively evaluates nested fallbacks if they are var(...).
    * - Limits recursion depth to prevent cycles or stack overflow.
    *
    * @param   expr - CSS var expression to resolve.
    *
    * @param   depth - Recursion guard
    *
    * @returns Nested fallback resolution result.
    */
   #resolveNestedFallback(expr: string, depth: number = 0): string
   {
      /* c8 ignore next 1 */ // Prevent runaway recursion or malformed fallback chains.
      if (depth > ResolveVars.#MAX_FALLBACK_DEPTH) { return expr; }

      // Match top-level var(--x, fallback) expression. Non-greedy match on fallback to avoid trailing garbage.
      const match = expr.match(ResolveVars.#CSS_VAR_FALLBACK_REGEX);
      if (!match?.groups) { return expr; }

      const { varName, fallback } = match.groups;
      const resolved = this.#varResolved.get(varName);

      // If the primary variable is resolved, return the substitution directly ignoring fallback.
      if (resolved !== void 0) { return resolved; }

      const fallbackTrimmed = fallback.trim();

      // If fallback itself is a var(...) expression, recurse to evaluate it.
      // The result is substituted in-place unless final resolution is still a var(...) chain.
      if (fallbackTrimmed.startsWith('var('))
      {
         let nested = this.#resolveNestedFallback(fallbackTrimmed, depth + 1);

         // If the nested result itself is a var(...) with a resolved variable, then resolve again.
         const innerMatch = nested.match(ResolveVars.#CSS_VAR_REGEX);
         if (innerMatch)
         {
            const innerResolved = this.#varResolved.get(innerMatch[1]);

            // If the result of recursion itself is a var(--x) with a known resolution, resolve it again.
            if (innerResolved !== void 0) { nested = innerResolved; }
         }

         return `var(${varName}, ${nested})`;
      }

      // Literal fallback: preserve the full var(...) expression with untouched fallback if not further resolvable.
      return `var(${varName}, ${fallbackTrimmed})`;
   }

   /**
    * Sets the parent selector defined CSS variable for resolution with additional cyclic dependency metrics.
    *
    * @param   name - CSS variable name
    *
    * @param   value - Value of target CSS variable.
    */
   #setCycleWarn(name: string, value: string)
   {
      const resolved = this.#resolveCycleWarn(value, new Set([name]), this.#resolveData.seenCycles);

      if (resolved !== void 0 && this.#varToProp.has(name) && !this.#varResolved.has(name))
      {
         this.#varResolved.set(name, resolved);
      }
   }
}

/**
 * Provides various options types for {@link StyleSheetResolve}.
 */
declare namespace StyleSheetResolve {
   /**
    * Provides various options types for {@link StyleSheetResolve}.
    */
   export namespace Options {
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
      }

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
      }

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
          * When false, relative URL rewriting is disabled. Relative URL rewriting based on the `CSSStyleSheet.href` or
          * provided `baseHref` option is enabled by default.
          *
          * @defaultValue `true`
          */
         urlRewrite?: boolean;
      }
   }
}

// @ts-ignore // strict checking doesn't like the intentional dual namespace / class export.
export { StyleSheetResolve }
