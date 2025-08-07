import { CrossWindow }     from '#runtime/util/browser';
import { isObject }        from '#runtime/util/object';

import { CSSRuleManager }  from './CSSRuleManager';

/**
 * Provides a managed dynamic style sheet / element useful in configuring global CSS variables. When creating an
 * instance of TJSStyleManager, you must provide a CSS ID for the style element added.
 *
 * Instances of TJSStyleManager can also be versioned by supplying a positive number greater than or equal to `1` via
 * the 'version' option. This version number is assigned to the associated style element. When a TJSStyleManager
 * instance is created and there is an existing instance with a version that is lower than the current new instance,
 * all CSS rules are removed, letting the higher version take precedence. This isn't a perfect system and requires
 * thoughtful construction of CSS variables exposed, but allows multiple independently compiled TRL packages to load
 * the latest CSS variables. It is recommended to always set `overwrite` option of {@link TJSStyleManager.setProperty}
 * and {@link TJSStyleManager.setProperties} to `false` when loading initial values.
 */
class TJSStyleManager
{
   /**
    * Minimum version of tracked styles.
    */
   static #MIN_VERSION: number = 0;

   /**
    * Provides a token allowing internal instance construction.
    */
   static #CTOR_TOKEN: symbol = Symbol('TJSStyleManager.CTOR_TOKEN');

   /**
    *
    */
   #cssRuleMap: Map<string, TJSStyleManager.CSSRuleManager>;

   /**
    *
    */
   readonly #id: string;

   /**
    *
    */
   readonly #layerName: string | undefined;

   /**
    *
    */
   #styleElement: HTMLStyleElement;

   /**
    *
    */
   readonly #version: number;

   /**
    * @private
    */
   private constructor({ cssRuleMap, id, styleElement, version, layerName, token }:
    { cssRuleMap: Map<string, TJSStyleManager.CSSRuleManager>; id: string; styleElement: HTMLStyleElement;
     version: number; layerName?: string; token: symbol })
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

      if (!CrossWindow.isDocument(document))
      {
         throw new TypeError(`'document' is not an instance of HTMLDocument.`);
      }

      const existingStyleEl = document.querySelector<HTMLStyleElement>(`head style#${id}`);

      if (existingStyleEl)
      {
         const existingVersion = Number(existingStyleEl.getAttribute('data-version') ?? 0);

         if (existingVersion >= this.#MIN_VERSION)
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
    * Connect to an existing dynamic styles managed element by CSS ID with SemVer check on version compatibility.
    *
    * @param   options - Options.
    */
   static connect({ id, version, document = window.document }: TJSStyleManager.Options.Connect)
   {
      if (typeof id !== 'string') { throw new TypeError(`'id' is not a string.`); }

      if (!CrossWindow.isDocument(document))
      {
         throw new TypeError(`'document' is not an instance of HTMLDocument.`);
      }

      if (!Number.isFinite(version) || version < this.#MIN_VERSION)
      {
         throw new TypeError(`'version' is not a positive number >= ${this.#MIN_VERSION}.`);
      }

      return this.#initializeConnect(document, id, version);
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
    * Internal `create` implementation with additional `force` option to override any version check.
    *
    * @param   options - Options.
    *
    * @returns Created style manager instance or undefined if already exists with a higher version.
    */
   static #createImpl({ id, rules, version, layerName, document = window.document, force = false }:
    TJSStyleManager.Options.Create & { force?: boolean }): TJSStyleManager | undefined
   {
      if (typeof id !== 'string') { throw new TypeError(`'id' is not a string.`); }

      if (!CrossWindow.isDocument(document))
      {
         throw new TypeError(`'document' is not an instance of HTMLDocument.`);
      }

      if (!Number.isFinite(version) || version < this.#MIN_VERSION)
      {
         throw new TypeError(`'version' is not a positive number >= ${this.#MIN_VERSION}.`);
      }

      if (layerName !== void 0 && typeof layerName !== 'string')
      {
         throw new TypeError(`'layerName' is not a string.`);
      }

      if (typeof force !== 'boolean')
      {
         throw new TypeError(`'force' is not a boolean.`);
      }

      const current = this.exists({ id, document });

      if (isObject(current))
      {
         // Remove all existing CSS rules / text if the version is greater than the existing version or `force` is true.
         if (force || (version > current.version))
         {
            current.element?.remove?.();
            return this.#initializeCreate(document, id, rules, version, layerName);
         }
         else
         {
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
   get version(): number
   {
      return this.#version;
   }

   /**
    * Provides a copy constructor to duplicate an existing TJSStyleManager instance into a new document.
    *
    * Note: This is used to support the `PopOut` module.
    *
    * @param   options - Required clone options.
    *
    * @returns New style manager instance or undefined if not connected.
    */
   clone({ document, force = false }: TJSStyleManager.Options.Clone): TJSStyleManager | undefined
   {
      if (!this.isConnected) { return; }

      const rules: { [key: string]: string } = {};

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
    * @returns CSSRuleManager entries.
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
    * @returns {MapIterator<string>} CSSRuleManager keys.
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
    * TODO: semver verification, logging warnings
    *
    * @param document - Target Document.
    *
    * @param id - Associated CSS ID
    *
    * @param version -
    *
    * @returns Style manager connected to existing element / style rules or undefined if no connection possible.
    */
   static #initializeConnect(document: Document, id: string, version: number): TJSStyleManager | undefined
   {
      const styleElement = document.querySelector<TJSStyleManager.TJSStyleElement>(`head style#${id}`);

      if (!styleElement) { return void 0; }
      if (styleElement.sheet === null) { return void 0; }

      const existingRules = styleElement?._tjsRules;
      const existingVersion = styleElement?._tjsVersion;
      const existingLayerName = styleElement?._tjsLayerName;

      let targetSheet: CSSStyleSheet | CSSLayerBlockRule = styleElement.sheet;

      if (!isObject(existingRules)) { return void 0; }

      if (!Number.isInteger(existingVersion)) { return void 0; }

      if (existingLayerName !== void 0 && typeof existingLayerName !== 'string') { return void 0; }

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

            if (!foundLayer) { return void 0; }
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
         if (reverseRuleMap.size > 0) { return void 0; }

         return new TJSStyleManager({
            cssRuleMap,
            id,
            version,
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
    * TODO: semver verification, logging warnings
    *
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
   static #initializeCreate(document: Document, id: string, rules: { [key: string]: string }, version: number,
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
}

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
         version: number;

         /**
          * Associated {@link HTMLStyleElement}.
          */
         element: HTMLStyleElement;
      }
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
          * An integer representing the version / level of styles being managed.
          */
         version: number;

         /**
          * Target document to load styles into.
          *
          * @defaultValue `window.document`
          */
         document?: Document;
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
         rules: { [key: string]: string };

         /**
          * Required integer representing the version / level of styles being managed.
          */
         version: number;

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

   export interface CSSRuleManager
   {
      /**
       * @returns Provides an accessor to get the `cssText` for the style sheet.
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
       * @returns Current CSS rule data or undefined if not connected.
       */
      get(): { [key: string]: string } | undefined;

      /**
       * Gets a particular CSS variable.
       *
       * @param key - CSS variable property key.
       *
       * @returns Returns CSS variable value or undefined if non-existent.
       */
      getProperty(key: string): string | undefined;

      /**
       * Returns whether this CSS rule manager has a given property key.
       *
       * @param key - CSS variable property key.
       *
       * @returns Property key exists / is defined.
       */
      hasProperty(key: string): boolean;

      /**
       * Set rules by property / value; useful for CSS variables.
       *
       * @param rules - An object with property / value string pairs to load.
       *
       * @param [overwrite=true] - When true overwrites any existing values; default: `true`.
       */
      setProperties(rules: { [key: string]: string }, overwrite?: boolean): void;

      /**
       * Sets a particular property.
       *
       * @param key - CSS variable property key.
       *
       * @param value - CSS variable value.
       *
       * @param [overwrite=true] - When true overwrites any existing value; default: `true`.
       */
      setProperty(key: string, value: string, overwrite?: boolean): void;

      /**
       * Removes the property keys specified. If `keys` is an iterable list then all property keys in the list are removed.
       *
       * @param keys - The property keys to remove.
       */
      removeProperties(keys: Iterable<string>): void;

      /**
       * Removes a particular CSS property.
       *
       * @param key - CSS property key.
       *
       * @returns CSS value when removed or undefined if non-existent.
       */
      removeProperty(key: string): string | undefined;
   }

   /**
    * Defines extra data stored directly on an {@link HTMLStyleElement}.
    */
   export interface TJSStyleElement extends HTMLStyleElement {
      _tjsRules: object;
      _tjsVersion: number;
      _tjsLayerName: string | undefined;
   }
}

// @ts-ignore
export { TJSStyleManager }
