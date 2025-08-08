import { CrossWindow }     from '#runtime/util/browser';
import { isObject }        from '#runtime/util/object';

import {
   compare,
   satisfies,
   validateStrict }        from '#runtime/util/semver';

import { CSSRuleManager }  from './CSSRuleManager';

/**
 * Provides a managed dynamic style sheet / element useful in configuring global CSS variables. When creating an
 * instance of TJSStyleManager, you must provide a CSS ID for the style element.
 *
 * Instances of TJSStyleManager must be versioned by supplying a semver version string via the 'version' option. This
 * version is assigned to the associated style element. When a TJSStyleManager instance is created and there is an
 * existing instance with a version that is lower than the current new instance, all CSS rules are removed, letting
 * the higher version take precedence. This isn't a perfect system and requires thoughtful construction of CSS
 * variables exposed, but allows multiple independently compiled TRL packages to load the latest CSS variables..
 */
class TJSStyleManager
{
   /**
    * Provides a token allowing internal instance construction.
    */
   static #CTOR_TOKEN: symbol = Symbol('TJSStyleManager.CTOR_TOKEN');

   /**
    * Stores configured CSSRuleManager instance by name.
    */
   #cssRuleMap: Map<string, TJSStyleManager.CSSRuleManager>;

   /**
    * CSS ID associated with style element.
    */
   readonly #id: string;

   /**
    * Any associated CSS layer name.
    */
   readonly #layerName: string | undefined;

   /**
    * The target style element.
    */
   #styleElement: HTMLStyleElement;

   /**
    * The version of this style manager.
    */
   readonly #version: string;

   /**
    * @private
    */
   private constructor({ cssRuleMap, id, styleElement, version, layerName, token }:
    { cssRuleMap: Map<string, TJSStyleManager.CSSRuleManager>; id: string; styleElement: HTMLStyleElement;
     version: string; layerName?: string; token: symbol })
   {
      if (token !== TJSStyleManager.#CTOR_TOKEN)
      {
         throw new Error('TJSStyleManager constructor: Please use the static `create` or `connect` methods.');
      }

      this.#cssRuleMap = cssRuleMap;
      this.#id = id;
      this.#layerName = layerName;
      this.#styleElement = styleElement;
      this.#version = version;
   }

   /**
    * Connect to an existing dynamic styles managed element by CSS ID with semver check on version range compatibility.
    *
    * @param   options - Options.
    */
   static connect({ id, range, document = window.document, warn = false }: TJSStyleManager.Options.Connect)
   {
      if (typeof id !== 'string') { throw new TypeError(`'id' is not a string.`); }
      if (typeof range !== 'string') { throw new TypeError(`'range' is not a string.`); }
      if (!CrossWindow.isDocument(document)) { throw new TypeError(`'document' is not an instance of HTMLDocument.`); }

      return this.#initializeConnect(document, id, range, warn);
   }

   /**
    * @param   options - Options.
    *
    * @returns Created style manager instance or undefined if already exists with a higher version.
    */
   static create(options: TJSStyleManager.Options.Create): TJSStyleManager | undefined
   {
      return this.#createImpl(options);
   }

   /**
    * Query and check for an existing dynamic style manager element / instance given a CSS ID.
    *
    * @param   options - Options.
    *
    * @returns Undefined if no style manager is configured for the given CSS ID otherwise an object containing the
    *          current version and HTMLStyleElement associated with the CSS ID.
    */
   static exists({ id, document = window.document }: TJSStyleManager.Options.Exists): TJSStyleManager.Data.Exists |
    undefined
   {
      if (typeof id !== 'string') { throw new TypeError(`'id' is not a string.`); }
      if (!CrossWindow.isDocument(document)) { throw new TypeError(`'document' is not an instance of HTMLDocument.`); }

      const existingStyleEl = document.querySelector<HTMLStyleElement>(`head style#${id}`);

      if (existingStyleEl)
      {
         const existingVersion = existingStyleEl.getAttribute('data-version') ?? '';

         if (validateStrict(existingVersion))
         {
            return {
               id,
               version: existingVersion,
               element: existingStyleEl
            }
         }
      }

      return void 0;
   }

   /**
    * Determines if this TJSStyleManager style element is still connected / available.
    *
    * @returns Is TJSStyleManager connected.
    */
   get isConnected(): boolean
   {
      return !!this.#styleElement?.isConnected;
   }

   /**
    * @returns Provides an accessor to get the `textContent` for the style sheet.
    */
   get textContent(): string | null
   {
      return this.#styleElement?.textContent;
   }

   /**
    * @returns Returns the version of this instance.
    */
   get version(): string
   {
      return this.#version;
   }

   /**
    * Provides a copy constructor to duplicate an existing TJSStyleManager instance into a new document.
    *
    * @param   options - Required clone options.
    *
    * @returns New style manager instance or undefined if not connected.
    */
   clone({ document, force = false, warn = false }: TJSStyleManager.Options.Clone): TJSStyleManager | undefined
   {
      if (!this.isConnected)
      {
         TJSStyleManager.#log(warn, 'clone', `This style manager instance is not connected for id: ${this.#id}`);
         return void 0;
      }

      if (!CrossWindow.isDocument(document)) { throw new TypeError(`'document' is not an instance of HTMLDocument.`); }

      const rules: TJSStyleManager.Data.RulesConfig = {};

      for (const key of this.#cssRuleMap.keys())
      {
         const selector = this.#cssRuleMap.get(key)?.selector;
         if (selector) { rules[key] = selector }
      }

      const newStyleManager = TJSStyleManager.#createImpl({
         id: this.#id,
         version: this.#version,
         layerName: this.#layerName,
         rules,
         document,
         force,
         warn
      });

      if (newStyleManager)
      {
         for (const key of this.#cssRuleMap.keys())
         {
            if (newStyleManager.#cssRuleMap.has(key))
            {
               const value = this.#cssRuleMap.get(key)?.cssText;
               const targetRuleManager = newStyleManager.#cssRuleMap.get(key);

               if (value && targetRuleManager) { targetRuleManager.cssText = value; }
            }
         }

         return newStyleManager;
      }

      return void 0;
   }

   /**
    * @returns CSSRuleManager entries iterator.
    */
   entries(): MapIterator<[string, TJSStyleManager.CSSRuleManager]>
   {
      return this.#cssRuleMap.entries();
   }

   /**
    * Retrieves an associated {@link CSSRuleManager} by name.
    *
    * @param   ruleName - Rule name.
    *
    * @returns Associated rule manager for given name or undefined if the rule name is not defined or manager is
    *          unconnected.
    */
   get(ruleName: string): TJSStyleManager.CSSRuleManager | undefined
   {
      if (!this.isConnected) { return; }

      return this.#cssRuleMap.get(ruleName);
   }

   /**
    * Returns whether a {@link TJSStyleManager.CSSRuleManger} exists for the given name.
    *
    * @param ruleName - Rule name.
    *
    * @returns Is there a CSS rule manager with the given name.
    */
   has(ruleName: string): boolean
   {
      return this.#cssRuleMap.has(ruleName);
   }

   /**
    * @returns {MapIterator<string>} CSSRuleManager keys iterator.
    */
   keys(): MapIterator<string>
   {
      return this.#cssRuleMap.keys();
   }

   /**
    * @returns Iterator of all CSSRuleManager instances.
    */
   values(): MapIterator<TJSStyleManager.CSSRuleManager>
   {
      return this.#cssRuleMap.values();
   }

   // Internal Implementation ----------------------------------------------------------------------------------------

   /**
    * Internal `create` implementation with additional `force` option to override any version check.
    *
    * @param   options - Options.
    *
    * @returns Created style manager instance or undefined if already exists with a higher version.
    */
   static #createImpl({ id, rules, version, layerName, document = window.document, force = false, warn = false }:
    TJSStyleManager.Options.Create & { force?: boolean }): TJSStyleManager | undefined
   {
      if (typeof id !== 'string') { throw new TypeError(`'id' is not a string.`); }
      if (!isObject(rules)) { throw new TypeError(`'rules' is not an object.`); }
      if (!CrossWindow.isDocument(document)) { throw new TypeError(`'document' is not an instance of HTMLDocument.`); }
      if (!validateStrict(version)) { throw new TypeError(`'version' is not a valid semver string.`); }
      if (typeof force !== 'boolean') { throw new TypeError(`'force' is not a boolean.`); }
      if (typeof warn !== 'boolean') { throw new TypeError(`'warn' is not a boolean.`); }

      if (layerName !== void 0 && typeof layerName !== 'string')
      {
         throw new TypeError(`'layerName' is not a string.`);
      }

      const current = this.exists({ id, document });

      if (isObject(current))
      {
         // Remove all existing CSS rules / text if the version is greater than the existing version or `force` is true.
         if (force || compare(version, current.version, '>'))
         {
            current.element?.remove?.();
            return this.#initializeCreate(document, id, rules, version, layerName);
         }
         else
         {
            this.#log(warn, 'create',
             `Could not create instance as one already exists with a higher version for ID: ${id}.`);

            // A style manager already exists that is a greater version than requested.
            return void 0;
         }
      }
      else
      {
         return this.#initializeCreate(document, id, rules, version, layerName);
      }
   }

   /**
    * @param document - Target Document.
    *
    * @param id - Associated CSS ID
    *
    * @param range - SemVer version or version range.
    *
    * @param warn - When true, log warnings.
    *
    * @returns Style manager connected to existing element / style rules or undefined if no connection possible.
    */
   static #initializeConnect(document: Document, id: string, range: string, warn: boolean = false):
    TJSStyleManager | undefined
   {
      const styleElement = document.querySelector<TJSStyleManager.TJSStyleElement>(`head style#${id}`);

      if (!styleElement || styleElement?.sheet === null)
      {
         this.#log(warn, 'connect', `Could not find existing style element for id: ${id}`);
         return void 0;
      }

      const existingRules = styleElement._tjsRules;
      const existingVersion = styleElement._tjsVersion;
      const existingLayerName = styleElement._tjsLayerName;

      let targetSheet: CSSStyleSheet | CSSLayerBlockRule = styleElement.sheet;

      if (!isObject(existingRules))
      {
         this.#log(warn, 'connect', `Could not find rules configuration on existing style element for id: ${id}`);
         return void 0;
      }

      if (!validateStrict(existingVersion))
      {
         this.#log(warn, 'connect', `Could not find version on existing style element for id: ${id}`);
         return void 0;
      }

      if (existingLayerName !== void 0 && typeof existingLayerName !== 'string')
      {
         this.#log(warn, 'connect', `Could not find layer name on existing style element for id: ${id}`);
         return void 0;
      }

      if (!satisfies(existingVersion, range))
      {
         this.#log(warn, 'connect', `Requested range (${range}) does not satisfy existing version: ${existingVersion}`);
         return void 0;
      }

      // TS type guard.
      if (!CrossWindow.isCSSStyleSheet(targetSheet)) { return void 0; }

      const cssRuleMap = new Map();

      // Reverse the rule object to find the actual CSS rules below.
      const reverseRuleMap = new Map(Object.entries(existingRules).map(([key, value]) => [value, key]));

      try
      {
         if (typeof existingLayerName)
         {
            let foundLayer = false;

            for (const rule of Array.from(targetSheet.cssRules))
            {
               if (CrossWindow.isCSSLayerBlockRule(rule) && rule.name === existingLayerName)
               {
                  targetSheet = rule;
                  foundLayer = true;
               }
            }

            if (!foundLayer)
            {
               this.#log(warn, 'connect', `Could not find CSSLayerBlockRule for existing layer name: ${
                existingLayerName}`);

               return void 0;
            }
         }

         for (const cssRule of Array.from(targetSheet.cssRules))
         {
            if (!CrossWindow.isCSSStyleRule(cssRule)) { continue; }

            const selector = cssRule?.selectorText;

            if (reverseRuleMap.has(selector))
            {
               const ruleName = reverseRuleMap.get(selector) as string;

               cssRuleMap.set(ruleName, new CSSRuleManager(cssRule, ruleName, selector));

               reverseRuleMap.delete(selector);
            }
         }

         // Check if all registered rules have been found.
         if (reverseRuleMap.size > 0)
         {
            this.#log(warn, 'connect', `Could not find CSSStyleRules for these rule configurations: ${
             JSON.stringify([...reverseRuleMap])}`);

            return void 0;
         }

         return new TJSStyleManager({
            cssRuleMap,
            id,
            version: existingVersion,
            layerName: existingLayerName,
            styleElement,
            token: TJSStyleManager.#CTOR_TOKEN
         });
      }
      catch (error)
      {
         console.error(`TyphonJS Runtime [TJSStyleManager error]: Please update your browser to the latest version.`,
          error);
      }

      return void 0;
   }

   /**
    * @param document - Target Document.
    *
    * @param id - Associated CSS ID
    *
    * @param rules -
    *
    * @param version -
    *
    * @param layerName -
    *
    * @returns New TJSStyleManager instance.
    */
   static #initializeCreate(document: Document, id: string, rules: TJSStyleManager.Data.RulesConfig, version: string,
    layerName: string | undefined): TJSStyleManager | undefined
   {
      const styleElement = (document.createElement('style') as TJSStyleManager.TJSStyleElement);
      styleElement.id = id;
      styleElement.setAttribute('data-version', String(version));

      styleElement._tjsRules = rules;
      styleElement._tjsVersion = version;
      styleElement._tjsLayerName = layerName;

      document.head.append(styleElement);

      let targetSheet: CSSStyleSheet | CSSLayerBlockRule | null;

      // Type guard for TS.
      if (styleElement.sheet === null) { return void 0; }

      const cssRuleMap = new Map();

      try
      {
         if (layerName)
         {
            const index = styleElement.sheet.insertRule(`@layer ${layerName} {}`);
            targetSheet = styleElement.sheet.cssRules[index] as CSSLayerBlockRule;
         }
         else
         {
            targetSheet = styleElement.sheet;
         }

         if (rules)
         {
            for (const ruleName in rules)
            {
               const selector = rules[ruleName];
               const index = targetSheet.insertRule(`${selector} {}`);

               const cssRule = targetSheet.cssRules[index] as CSSStyleRule;

               cssRuleMap.set(ruleName, new CSSRuleManager(cssRule, ruleName, selector));
            }
         }

         return new TJSStyleManager({
            cssRuleMap,
            id,
            version,
            layerName,
            styleElement,
            token: TJSStyleManager.#CTOR_TOKEN
         });
      }
      catch (error)
      {
         console.error(`TyphonJS Runtime [TJSStyleManager error]: Please update your browser to the latest version.`,
          error);

         // Clean up: remove the <style> from the DOM.
         if (styleElement && styleElement.parentNode) { styleElement.remove(); }
      }

      return void 0;
   }

   /**
    * @param   warn - When true, log warnings.
    *
    * @param   path - Particular interaction path for warning.
    *
    * @param   message - Message to log.
    */
   static #log(warn: boolean, path: 'clone' | 'connect' | 'create', message: string): void
   {
      if (warn) { console.warn(`[TRL TJSStyleManager] ${path} warning: ${message}`); }
   }
}

/**
 * Provides various type definitions and interfaces utilized by {@link TJSStyleManager}.
 */
declare namespace TJSStyleManager {
   /**
    * Provides return data types for various methods of {@link TJSStyleManager}.
    */
   export namespace Data {
      /**
       * Return data from {@link TJSStyleManager.exists}.
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
      }

      /**
       * Defines the rule name to CSS selector configuration when using {@link TJSStyleManager.create}. Keys are the
       * rule name that can retrieve a {@link TJSStyleManager.CSSRuleManager} via {@link TJSStyleManager.get}. Values
       * are the CSS selector to associate with this manager.
       */
      type RulesConfig = { [key: string]: string };

      /**
       * A mapping of CSS style properties. When bulk setting style properties keys must be in hyphen-case
       * (IE `background-color`). When retrieving bulk style properties you may request keys to be in camel case
       * (IE `backgroundColor`). Keys are CSS property names. Bulk retrieval is facilitated by
       * {@link TJSStyleManager.CSSRuleManager.get}. All values are strings as returned from the CSS Object Model.
       */
      type StyleProps = { [key: string]: string };
   }

   /**
    * Provides options types for various methods of {@link TJSStyleManager}.
    */
   export namespace Options {
      /**
       * Options for {@link TJSStyleManager.clone}.
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
      }

      /**
       * Options for {@link TJSStyleManager.connect}.
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
      }

      /**
       * Options for {@link TJSStyleManager.create}.
       */
      type Create = {
         /**
          * Required CSS ID providing a link to a specific style sheet element.
          */
         id: string;

         /**
          * CSS Rules configuration. Rule name / selector.
          */
         rules: TJSStyleManager.Data.RulesConfig;

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
      }

      /**
       * Options for {@link TJSStyleManager.exists}.
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
      }
   }

   /**
    * Provides the ability to `get` and `set` bulk or single CSS properties to a specific {@link CSSStyleRule}.
    */
   export interface CSSRuleManager
   {
      /**
       * @returns Provides an accessor to get the `cssText` for the style rule or undefined if not connected.
       */
      get cssText(): string | undefined;

      /**
       * @param cssText - Provides an accessor to set the `cssText` for the style rule.
       */
      set cssText(cssText: string | undefined);

      /**
       * Determines if this CSSRuleManager is still connected / available.
       *
       * @returns {boolean} Is CSSRuleManager connected.
       */
      get isConnected(): boolean;

      /**
       * @returns Name of this CSSRuleManager indexed by associated TJSStyleManager.
       */
      get name(): string;

      /**
       * @returns The associated selector for this CSS rule.
       */
      get selector(): string;

      /**
       * Retrieves an object with the current CSS rule data.
       *
       * @param [options] - Optional settings.
       *
       * @param [options.camelCase=false] - Whether to convert property names to camel case.
       *
       * @returns Current CSS style data or undefined if not connected.
       */
      get(options: { camelCase?: boolean }): TJSStyleManager.Data.StyleProps | undefined;

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
       * Set rules by property / value; useful for CSS variables.
       *
       * @param styles - An object with property / value string pairs to load.
       *
       * @param [overwrite=true] - When true overwrites any existing values; default: `true`.
       */
      setProperties(styles: TJSStyleManager.Data.StyleProps, overwrite?: boolean): void;

      /**
       * Sets a particular property.
       *
       * @param key - CSS property key; must be in hyphen-case (IE `background-color`).
       *
       * @param value - CSS property value.
       *
       * @param [overwrite=true] - When true overwrites any existing value; default: `true`.
       */
      setProperty(key: string, value: string, overwrite?: boolean): void;

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
   export interface TJSStyleElement extends HTMLStyleElement {
      /**
       * The rules configuration for this dynamic style instance.
       */
      _tjsRules: TJSStyleManager.Data.RulesConfig;

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

// @ts-ignore // strict checking doesn't like the intentional dual namespace / class export.
export { TJSStyleManager }
