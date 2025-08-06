import { CrossWindow }     from '#runtime/util/browser';
import { isObject }        from '#runtime/util/object';

import { CSSRuleManager}   from './CSSRuleManager.js';

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
export class TJSStyleManager
{
   /**
    * Minimum version of tracked styles.
    *
    * @type {number}
    */
   static #MIN_VERSION = 0;

   /**
    * Provides a token allowing internal instance construction.
    *
    * @type {symbol}
    */
   static #CTOR_TOKEN = Symbol('TJSStyleManager.CTOR_TOKEN');

   /** @type {Map<string, import('./types').CSSRuleManager>} */
   #cssRuleMap;

   /** @type {string} */
   #id;

   /** @type {string} */
   #layerName;

   /** @type {HTMLStyleElement} */
   #styleElement;

   /** @type {number} */
   #version;

   /**
    * @private
    */
   constructor({ cssRuleMap, id, styleElement, version, layerName, token } = {})
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
    * @param {object}   opts - Options.
    *
    * @param {string}   opts.id - Required CSS ID providing a link to a specific style sheet element.
    *
    * @param {Document} [opts.document] - Target document to load styles into.
    *
    * @returns {{ id: string, version: number, element: HTMLStyleElement } | undefined} Undefined if now style manager
    *          is configured for the given CSS ID otherwise an object containing the current version & HTMLStyleElement
    *          associated with the given CSS ID.
    */
   static exists({ id, document = window.document })
   {
      if (typeof id !== 'string') { throw new TypeError(`'id' is not a string.`); }

      if (!CrossWindow.isDocument(document))
      {
         throw new TypeError(`'document' is not an instance of HTMLDocument.`);
      }

      /** @type {HTMLStyleElement} */
      const existingStyleEl = document.querySelector(`head style#${id}`);

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
    * @param {object}   opts - Options.
    *
    * @param {string}   opts.id - Required CSS ID providing a link to a specific style sheet element.
    *
    * @param {Document} [opts.document] - Target document to load styles into.
    *
    * @param {number}   [opts.version] - An integer representing the version / level of styles being managed.
    */
   static connect({ id, version, document = window.document } = {})
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
    * @param {object}   opts - Options.
    *
    * @param {string}   opts.id - Required CSS ID providing a link to a specific style sheet element.
    *
    * @param {Document} [opts.document] - Target document to load styles into.
    *
    * @param {string}   [opts.layerName] - Optional CSS layer name defining the top level CSS rule.
    *
    * @param {{ [key: string]: string }}  [opts.rules] - Optional CSS Rules configuration.
    *
    * @param {number}   [opts.version] - An integer representing the version / level of styles being managed.
    *
    * @returns {TJSStyleManager | undefined} Created style manager instance or undefined if already exists.
    */
   static create({ id, rules, version, layerName, document = window.document, force = false } = {})
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
    * Determines if this TJSStyleManager is still connected / available.
    *
    * @returns {boolean} Is TJSStyleManager connected.
    */
   get isConnected()
   {
      return !!this.#styleElement?.isConnected;
   }

   /**
    * @returns {string} Provides an accessor to get the `textContent` for the style sheet.
    */
   get textContent()
   {
      return this.#styleElement?.textContent;
   }

   /**
    * @returns {number} Returns the version of this instance.
    */
   get version()
   {
      return this.#version;
   }

   /**
    * Provides a copy constructor to duplicate an existing TJSStyleManager instance into a new document.
    *
    * Note: This is used to support the `PopOut` module.
    *
    * @param {Document} [document] Target browser document to clone into.
    *
    * @param {boolean} [force] When true, force the cloning of the style manager into the target document.
    *
    * @returns {TJSStyleManager | undefined} New style manager instance or undefined if not connected.
    */
   clone({ document = window.document, force = false } = {})
   {
      if (!this.isConnected) { return; }

      const rules = {};

      for (const key of this.#cssRuleMap.keys())
      {
         rules[key] = this.#cssRuleMap.get(key).selector;
      }

      const newStyleManager = TJSStyleManager.create({
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
               newStyleManager.#cssRuleMap.get(key).cssText = this.#cssRuleMap.get(key).cssText;
            }
         }

         return newStyleManager;
      }

      return void 0;
   }

   /**
    * @returns {MapIterator<[string, import('./types').CSSRuleManager]>} CSSRuleManager entries.
    */
   entries()
   {
      return this.#cssRuleMap.entries();
   }

   /**
    * Retrieves an associated {@link CSSRuleManager} by name.
    *
    * @param {string}   ruleName - Rule name.
    *
    * @returns {import('./types').CSSRuleManager | undefined} Associated rule manager for given name or undefined if the
    *          rule name is not defined or manager is unconnected.
    */
   get(ruleName)
   {
      if (!this.isConnected) { return; }

      return this.#cssRuleMap.get(ruleName);
   }

   /**
    * Returns whether a {@link CSSRuleManger} exists for the given name.
    *
    * @param {string}   ruleName - Rule name.
    *
    * @returns {boolean} Is there a CSS rule manager with the given name.
    */
   has(ruleName)
   {
      return this.#cssRuleMap.has(ruleName);
   }

   /**
    * @returns {MapIterator<string>} CSSRuleManager keys.
    */
   keys()
   {
      return this.#cssRuleMap.keys();
   }

   /**
    * @returns {MapIterator<import('./types').CSSRuleManager>}
    */
   values()
   {
      return this.#cssRuleMap.values();
   }

   // Internal Implementation ----------------------------------------------------------------------------------------

   /**
    * TODO: semver verification, possible throwing of errors
    *
    * @param {Document} document - Target Document.
    *
    * @param {string} id - Associated CSS ID
    *
    * @param {number} version -
    *
    * @returns {TJSStyleManager | undefined} Style manager connected to existing element / style rules.
    */
   static #initializeConnect(document, id, version)
   {
      /** @type {HTMLStyleElement} */
      const styleElement = document.querySelector(`head style#${id}`);

      if (!styleElement) { return void 0; }

      const existingRules = styleElement?._tjsRules;
      const existingVersion = styleElement?._tjsVersion;
      const existingLayerName = styleElement?._tjsLayerName;

      let targetSheet = styleElement?.sheet;

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

            for (const rule of targetSheet.cssRules)
            {
               if (CrossWindow.isCSSLayerBlockRule(rule) && rule.name === existingLayerName)
               {
                  targetSheet = rule;
                  foundLayer = true;
               }
            }

            if (!foundLayer) { return void 0; }
         }

         for (const cssRule of targetSheet.cssRules)
         {
            if (!CrossWindow.isCSSStyleRule(cssRule)) { continue; }

            const selector = cssRule?.selectorText;

            if (reverseRuleMap.has(selector))
            {
               const ruleName = reverseRuleMap.get(selector);

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
    * @param {Document} document - Target Document.
    *
    * @param {string} id - Associated CSS ID
    *
    * @param {{ [key: string]: string }} rules -
    *
    * @param {number} version -
    *
    * @param {string} layerName -
    *
    * @returns {TJSStyleManager | undefined} New TJSStyleManager instance.
    */
   static #initializeCreate(document, id, rules, version, layerName)
   {
      const styleElement = document.createElement('style');
      styleElement.id = id;
      styleElement.setAttribute('data-version', String(version));

      styleElement._tjsRules = rules;
      styleElement._tjsVersion = version;
      styleElement._tjsLayerName = layerName;

      document.head.append(styleElement);

      let targetSheet;

      const cssRuleMap = new Map();

      try
      {
         if (layerName)
         {
            const index = styleElement.sheet.insertRule(`@layer ${layerName} {}`);
            targetSheet = styleElement.sheet.cssRules[index];
         }
         else
         {
            targetSheet = styleElement.sheet;
         }

         for (const ruleName in rules)
         {
            const selector = rules[ruleName];
            const index = targetSheet.insertRule(`${selector} {}`);

            const cssRule = /** @type {CSSStyleRule} */ targetSheet.cssRules[index];

            cssRuleMap.set(ruleName, new CSSRuleManager(cssRule, ruleName, selector));
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
