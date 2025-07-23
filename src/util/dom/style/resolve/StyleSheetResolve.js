import { CrossWindow }  from '#runtime/util/browser';

import {
   isIterable,
   isObject }           from '#runtime/util/object';

/**
 * Dynamically parses and indexes a {@link CSSStyleSheet} at runtime, exposing a selector-to-style mapping by
 * individual selector parts. CSS variable resolution is also possible and this enables the ability to flatten and
 * resolve complex nested `var(--...)` chains defined across multiple selectors and layers.
 *
 * When retrieving specific selector styles via {@link StyleSheetResolve.get} and {@link StyleSheetResolve.getProperty}
 * it is possible to provide additional parent selectors that may define scoped CSS variables. These parent variable
 * definitions will be substituted in the target selector data allowing specific element scoping of CSS variables to be
 * flattened.
 *
 * Core features:
 * - Parses all or specific relevant `@layer` blocks.
 * - Can filter out and exclude undesired CSS selector parts for parsing via `excludeSelectorParts` option.
 * - Can filter out and include just desired CSS layers via `includeCSSLayers` option.
 * - Enables resolution of scoped CSS variables using a parent-selector fallback chain.
 * - Provides both direct and resolved access to styles via `.get()` and `.getProperty()`.
 *
 * TODO: There are a few improvements to make including supporting CSS variable fallback resolution.
 *
 * @example
 * ```js
 * import { StyleSheetResolve } from '#runtime/util/dom/style';
 *
 * // Parse first stylesheet in the browser `document`.
 * const parsedStyles = new StyleSheetResolve(document.styleSheets[0]);
 *
 * // The `props` object has styles w/ CSS variables resolved from `input[type="text"]` for the dark theme.
 * const props = parsedStyles.get('input[type="text"]', { resolve: '.themed.theme-dark input' });
 * ```
 */
export class StyleSheetResolve
{
   /**
    * Internal tracking of frozen state; once frozen, no more modifications are possible.
    *
    * @type {boolean}
    */
   #frozen = false;

   /**
    * Parsed selector to associated style properties.
    *
    * @type {Map<string, { [key: string]: string }>}
    */
   #sheetMap = new Map();

   /**
    * @param {CSSStyleSheet | Map<string, { [key: string]: string }>}   styleSheetOrMap - The stylesheet element to
    *        parse or an existing parsed stylesheet Map.
    *
    * @param {object} [options] - Options for parsing stylesheet.
    *
    * @param {Iterable<RegExp>}  [options.excludeSelectorParts] - A list of RegExp instance used to exclude CSS
    *        selector parts from parsed stylesheet data.
    *
    * @param {Iterable<RegExp>}  [options.includeCSSLayers] - A list of RegExp instance used to specifically include
    *        in parsing for specific allowed CSS layers if present in the stylesheet.
    *
    * @param {Set<string>}  [options.includeSelectorPartSet] - A Set of strings to exactly match selector parts
    *        to include in parsed stylesheet data.
    */
   constructor(styleSheetOrMap, options = {})
   {
      if (!CrossWindow.isCSSStyleSheet(styleSheetOrMap) && !CrossWindow.isMap(styleSheetOrMap))
      {
         throw new TypeError(
          `'styleSheetOrMap' must be a 'CSSStyleSheet' instance or a parsed Map of stylesheet entries.`);
      }

      if (!isObject(options)) { throw new TypeError(`'options' is not an object.`); }

      if (options.excludeSelectorParts !== void 0 && !isIterable(options.excludeSelectorParts))
      {
         throw new TypeError(`'excludeSelectorParts' must be a list of RegExp instances.`);
      }

      if (options.includeCSSLayers !== void 0 && !isIterable(options.includeCSSLayers))
      {
         throw new TypeError(`'includeCSSLayers' must be a list of RegExp instances.`);
      }

      if (CrossWindow.isCSSStyleSheet(styleSheetOrMap))
      {
         this.#initialize(styleSheetOrMap, options);
      }
      else if (CrossWindow.isMap(styleSheetOrMap))
      {
         this.#sheetMap = new Map(styleSheetOrMap.entries());
      }
   }

   // Accessors ------------------------------------------------------------------------------------------------------

   /**
    * @returns {boolean} Current frozen state; when true no more modifications are possible.
    */
   get frozen()
   {
      return this.#frozen;
   }

   /**
    * @returns {number} Returns the size / count of selector properties tracked.
    */
   get size()
   {
      return this.#sheetMap.size;
   }

   // Methods --------------------------------------------------------------------------------------------------------

   /**
    * Clones this instance returning a new `StyleSheetResolve` instance with a copy of the data.
    *
    * @returns {StyleSheetResolve} Cloned instance.
    */
   clone()
   {
      const clonedMap = new Map();

      // Shallow copy.
      for (const [selector, props] of this.#sheetMap.entries()) { clonedMap.set(selector, { ...props }); }

      return new StyleSheetResolve(clonedMap);
   }

   /**
    * Entries iterator of selector / style properties objects.
    *
    * @returns {MapIterator<[string, { [key: string]: string }]>} Tracked CSS selector key / value iterator.
    */
   entries()
   {
      return this.#sheetMap.entries();
   }

   /**
    * Freezes this instance disallowing further modifications to the stylesheet data.
    */
   freeze()
   {
      this.#frozen = true;

      for (const props of this.#sheetMap.values()) { Object.freeze(props); }

      Object.freeze(this.#sheetMap);
   }

   /**
    * Gets all properties associated with the given selector(s). You may combine multiple selectors for a
    * combined result. You may also provide additional selectors as the `resolve` option to substitute any CSS variables
    * in the target selector(s).
    *
    * @param {string | Iterable<string>}   selector - A selector or array of selectors to retrieve.
    *
    * @param {object}   [opts] - Options.
    *
    * @param {boolean}  [opts.camelCase=false] - When true, property keys will be in camel case.
    *
    * @param {number}   [opts.depth] - Resolution depth for CSS variable substitution. By default, the depth is the
    * length of the provided `resolve` selectors, but you may opt to provide a specific depth even with multiple
    * resolution selectors.
    *
    * @param {string | Iterable<string>} [opts.resolve] - Additional selectors as CSS variable resolution sources.
    *
    * @returns {{ [key: string]: string } | undefined} Style properties object.
    */
   get(selector, { camelCase = false, depth, resolve } = {})
   {
      if (typeof selector !== 'string' && !isIterable(selector))
      {
         throw new TypeError(`'selector' must be a string or an iterable list of strings.`);
      }

      if (typeof camelCase !== 'boolean')
      {
         throw new TypeError(`'camelCase' must be a boolean.`);
      }

      if (depth !== void 0 && (!Number.isInteger(depth) || depth < 1))
      {
         throw new TypeError(`'depth' must be a positive integer >= 1.`);
      }

      if (resolve !== void 0 && typeof resolve !== 'string' && !isIterable(resolve))
      {
         throw new TypeError(`'resolve' must be a string or an iterable list of strings.`);
      }

      let result = void 0;

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
         depth = typeof depth === 'number' ? depth : Math.max(1, Array.from(resolve).length);

         const resolveNotFound = new Set();

         // Progressively resolve CSS variables up to the requested depth.
         for (let cntr = 0; cntr < depth; cntr++)
         {
            const beforeResult = JSON.stringify(result);

            this.#resolve(result, resolve, resolveNotFound);

            const afterResult = JSON.stringify(result);

            // Early out if no more variables need resolution.
            if (beforeResult === afterResult) { break; }
         }

         if (resolveNotFound.size > 0)
         {
            console.warn(
             `[TyphonJS Runtime] StyleSheetResolve - #resolve - Could not locate parent selector for resolution: '${
              [...resolveNotFound].join(', ')}'`);
         }
      }

      if (result && camelCase)
      {
         const toCamelCase = (str) => str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

         result = Object.fromEntries(
            Object.entries(result).map(([key, val]) => [toCamelCase(key), val])
         );
      }

      return result;
   }

   /**
    * Gets a specific property value from the given `selector` and `property` key. Try and use a direct selector
    * match otherwise all keys are iterated to find a selector string that includes `selector`.
    *
    * @param {string | string[]}   selector - Selector to find.
    *
    * @param {string}   property - Specific property to locate.
    *
    * @param {object}   [options] - Options.
    *
    * @param {number}   [options.depth] - Resolution depth for CSS variable substitution. By default, the depth is the
    * length of the provided `resolve` selectors, but you may opt to provide a specific depth even with multiple
    * resolution selectors.
    *
    * @param {string | string[]} [options.resolve] - Additional selectors as CSS variable resolution sources.
    *
    * @returns {string | undefined} Style property value.
    */
   getProperty(selector, property, options)
   {
      // If there is a direct selector match, then return a value immediately.
      const data = this.get(selector, options);

      return isObject(data) && property in data ? data[property] : void 0;
   }

   /**
    * Test if `StyleSheetResolve` tracks the given selector.
    *
    * @param {string}   selector - CSS selector to check.
    *
    * @returns {boolean} StyleSheetResolve tracks the given selector.
    */
   has(selector)
   {
      return this.#sheetMap.has(selector);
   }

   /**
    * @returns {MapIterator<string>} Tracked CSS selector keys iterator.
    */
   keys()
   {
      return this.#sheetMap.keys();
   }

   /**
    * Merges styles from another StyleSheetResolve instance into this one.
    *
    * @param {StyleSheetResolve} source - Another instance to merge from.
    *
    * @param {object} [options] - Options.
    *
    * @param {boolean} [options.exactMatch=false] - Only merge if selector part keys match exactly.
    *
    * @param {'override' | 'preserve'} [options.strategy='override'] - By default, the source overrides existing values.
    *        You may also provide a `preserve` strategy which only merges property keys that do not exist already.
    */
   merge(source, { exactMatch = false, strategy = 'override' } = {})
   {
      if (this.#frozen) { throw new Error('Cannot modify a frozen StyleSheetResolve instance.'); }

      if (!(source instanceof StyleSheetResolve))
      {
         throw new TypeError(`'source' is not a StyleSheetResolve instance.`);
      }

      for (const [selectorPart, incoming] of source.entries())
      {
         if (exactMatch && !this.#sheetMap.has(selectorPart)) { continue; }

         const current = this.#sheetMap.get(selectorPart) ?? {};

         const merged = strategy === 'preserve' ? Object.assign({}, incoming, current) :
          Object.assign({}, current, incoming);

         this.#sheetMap.set(selectorPart, merged);
      }
   }

   // Internal Implementation ----------------------------------------------------------------------------------------

   /**
    * Parses the given CSSStyleSheet instance.
    *
    * @param {CSSStyleSheet}  styleSheet - The stylesheet to parse.
    *
    * @param {object} [opts] - Options for parsing stylesheet.
    *
    * @param {Iterable<RegExp>}  [opts.excludeSelectorParts] - A list of RegExp instance used to exclude CSS
    *        selector parts from parsed stylesheet data.
    *
    * @param {Iterable<RegExp>}  [opts.includeCSSLayers] - A list of RegExp instance used to specifically include
    *        in parsing for specific allowed CSS layers if present in the stylesheet.
    *
    * @param {Set<string>}  [opts.includeSelectorPartSet] - A Set of strings to exactly match selector parts
    *        to include in parsed stylesheet data.
    */
   #initialize(styleSheet, opts)
   {
      opts.excludeSelectorParts = isIterable(opts.excludeSelectorParts) ? Array.from(opts.excludeSelectorParts) : [];

      opts.includeCSSLayers = isIterable(opts.includeCSSLayers) ? Array.from(opts.includeCSSLayers) : [];

      opts.includeSelectorPartSet = CrossWindow.isSet(opts.includeSelectorPartSet) ? opts.includeSelectorPartSet :
       new Set();

      // Parse each CSSStyleRule and build the map of selectors to properties.
      for (const rule of styleSheet.cssRules)
      {
         if (CrossWindow.isCSSLayerBlockRule(rule) && isObject(rule.cssRules))
         {
            this.#processLayerBlockRule(rule, void 0, opts);
         }
         else if (CrossWindow.isCSSStyleRule(rule))
         {
            this.#processStyleRule(rule, opts);
         }
      }
   }

   /**
    * @param {string}   cssText - CSS text to parse from `CSSStyleRule`.
    *
    * @returns {{ [key: string]: string }} Parsed `cssText`.
    */
   #parseCssText(cssText)
   {
      const match = cssText.match(/{([^}]*)}/);
      if (!match) { return {}; }

      return Object.fromEntries(match[1]
         .split(';')
         .map((str) => str.trim())
         .filter(Boolean)
         .map((decl) =>
         {
            const [prop, ...rest] = decl.split(':');
            return [prop.trim(), rest.join(':').trim()];
         })
      );
   }

   /**
    * Recursively parses / processes a CSSLayerBlockRule and encountered CSSStyleRule entries.
    *
    * @param {CSSLayerBlockRule} blockRule - The `CSSLayerBlockRule` to parse.
    *
    * @param {string}   parentLayerName - Name of parent CSS layer.
    *
    * @param {object}   opts - Sanitized options.
    *
    * @param {RegExp[]} opts.excludeSelectorParts - Array of RegExp to filter via exclusion CSS selector parts.
    *
    * @param {RegExp[]} opts.includeCSSLayers - Array of RegExp to filter via inclusion for CSS layer names.
    *
    * @param {Set<string>}  opts.includeSelectorPartSet - A Set of strings to exactly match selector parts
    *        to include in parsed stylesheet data.
    */
   #processLayerBlockRule(blockRule, parentLayerName, opts)
   {
      if (!CrossWindow.isCSSLayerBlockRule(blockRule)) { return; }
      if (!isObject(blockRule.cssRules)) { return; }

      const fullname = typeof parentLayerName === 'string' ? `${parentLayerName}.${blockRule.name}` : blockRule.name;

      const layerBlockRules = [];

      for (const rule of blockRule.cssRules)
      {
         if (CrossWindow.isCSSLayerBlockRule(rule)) { layerBlockRules.push(rule); }
         if (!CrossWindow.isCSSStyleRule(rule)) { continue; }

         if (opts.includeCSSLayers.length === 0 || opts.includeCSSLayers.some((regex) => regex.test(fullname)))
         {
            this.#processStyleRule(rule, opts);
         }
      }

      for (const rule of layerBlockRules)
      {
         if (CrossWindow.isCSSLayerBlockRule(rule)) { this.#processLayerBlockRule(rule, fullname, opts); }
      }
   }

   /**
    * Processes a `CSSStyleRule`.
    *
    * @param {CSSStyleRule} styleRule - Style rule to parse.
    *
    * @param {object}   opts - Sanitized options.
    *
    * @param {RegExp[]} opts.excludeSelectorParts - Array of RegExp to filter via exclusion CSS selector parts.
    *
    * @param {RegExp[]} opts.includeCSSLayers - Array of RegExp to filter via inclusion for CSS layer names.
    *
    * @param {Set<string>}  opts.includeSelectorPartSet - A Set of strings to exactly match selector parts
    *        to include in parsed stylesheet data.
    */
   #processStyleRule(styleRule, opts)
   {
      if (typeof styleRule.selectorText !== 'string') { return; }

      const result = this.#parseCssText(styleRule.cssText);

      // Split selector parts and remove disallowed selector parts and empty strings.
      const selectorParts = styleRule.selectorText.split(',')
         .map((str) => str.trim())
         .filter((str) => !opts.excludeSelectorParts.some((regex) => regex.test(str)))
         .filter(Boolean); // Remove empty parts.

      if (selectorParts.length)
      {
         if (opts.includeSelectorPartSet.size)
         {
            for (const part of selectorParts)
            {
               if (!opts.includeSelectorPartSet.has(part)) { continue; }

               const existing = this.#sheetMap.get(part);
               const update = Object.assign(existing ?? {}, result);
               this.#sheetMap.set(part, update);
            }
         }
         else
         {
            for (const part of selectorParts)
            {
               const existing = this.#sheetMap.get(part);
               const update = Object.assign(existing ?? {}, result);
               this.#sheetMap.set(part, update);
            }
         }
      }
   }

   /**
    * Resolves intermediate CSS variables defined in the `result` style properties object with data from the given
    * `resolve` selector(s).
    *
    * @param {{ [key: string]: string }} result - Copy of source selector style properties to resolve.
    *
    * @param {string | Iterable<string>} resolve - Parent CSS variable resolution selectors.
    *
    * @param {Set<string>} resolveNotFound - Stores parent resolution selectors that are not found.
    */
   #resolve(result, resolve, resolveNotFound)
   {
      // Holds result entries that reference a CSS variable.
      const cssVars = new ResolveVars(result);

      if (cssVars.unresolvedCount)
      {
         const order = typeof resolve === 'string' ? [resolve] : resolve;

         for (const entry of order)
         {
            const parent = this.get(entry);

            if (!isObject(parent))
            {
               resolveNotFound.add(entry);
               continue;
            }

            for (const cssVar of cssVars.keysUnresolved())
            {
               if (cssVar in parent) { cssVars.set(cssVar, parent[cssVar]); }
            }
         }
      }

      Object.assign(result, cssVars.resolved);
   }
}

/**
 * Encapsulates CSS variable resolution logic and data.
 */
class ResolveVars
{
   /**
    * Initial style properties w/ CSS variables to track.
    *
    * @type {Map<string, string>}
    */
   #propMap = new Map();

   /**
    * Reverse lookup for CSS variable name to associated property.
    *
    * @type {Map<string, Set<string>>}
    */
   #varToProp = new Map();

   /**
    * Resolved CSS variable from parent selector properties.
    *
    * @type {Map<string, string>}
    */
   #varResolved = new Map();

   /**
    * @param {{ [key: string]: string }} initial - Initial style entry to resolve.
    */
   constructor(initial)
   {
      for (const [prop, value] of Object.entries(initial))
      {
         const vars = [...value.matchAll(/var\((--[\w-]+)\)/g)].map((match) => match[1]);

         if (vars.length > 0)
         {
            this.#propMap.set(prop, value);

            for (const entry of vars)
            {
               if (!this.#varToProp.has(entry)) { this.#varToProp.set(entry, new Set()); }
               this.#varToProp.get(entry).add(prop);
            }
         }
      }
   }

   /**
    * @returns {{ [key: string]: string }} All fields that have been resolved.
    */
   get resolved()
   {
      const result = {};

      for (const entry of this.#varToProp.keys())
      {
         if (this.#varResolved.has(entry))
         {
            const props = this.#varToProp.get(entry);

            for (const prop of props)
            {
               const value = this.#propMap.get(prop);
               const varResolved = this.#varResolved.get(entry);

               if (value && varResolved)
               {
                  const replacement = value.replaceAll(`var(${entry})`, varResolved);

                  this.#propMap.set(prop, replacement);
                  result[prop] = replacement;
               }
            }
         }
      }

      return result;
   }

   /**
    * @returns {number} Unresolved field count.
    */
   get unresolvedCount()
   {
      let count = 0;

      for (const entry of this.#varToProp.keys())
      {
         if (!this.#varResolved.has(entry)) { count++; }
      }

      return count;
   }

   /**
    * @param {string}   key - Potential CSS var to check if tracked.
    *
    * @returns {boolean} Key is tracked.
    */
   has(key)
   {
      return this.#varToProp.has(key);
   }

   /**
    * @returns {IterableIterator<string>} Unresolved entry iterator.
    *
    * @yields
    */
   *keysUnresolved()
   {
      for (const entry of this.#varToProp.keys())
      {
         if (!this.#varResolved.has(entry)) { yield entry; }
      }
   }

   /**
    * Sets the parent selector defined CSS variable for resolution.
    *
    * @param {string}   name - CSS variable name
    *
    * @param {string}   value - Value of target CSS variable.
    */
   set(name, value)
   {
      if (typeof value !== 'string' || value.length === 0) { return; }

      if (this.#varToProp.has(name) && !this.#varResolved.has(name)) { this.#varResolved.set(name, value); }
   }
}
