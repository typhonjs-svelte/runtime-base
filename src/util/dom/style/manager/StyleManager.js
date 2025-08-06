import { TJSStyleManager } from './TJSStyleManager.js';

/**
 * Provides a managed dynamic style sheet / element useful in configuring global CSS variables. When creating an
 * instance of StyleManager, you must provide a CSS ID for the style element added.
 *
 * Instances of StyleManager can also be versioned by supplying a positive number greater than or equal to `1` via
 * the 'version' option. This version number is assigned to the associated style element. When a StyleManager
 * instance is created and there is an existing instance with a version that is lower than the current new instance,
 * all CSS rules are removed, letting the higher version take precedence. This isn't a perfect system and requires
 * thoughtful construction of CSS variables exposed, but allows multiple independently compiled TRL packages to load
 * the latest CSS variables. It is recommended to always set `overwrite` option of {@link StyleManager.setProperty}
 * and {@link StyleManager.setProperties} to `false` when loading initial values.
 */
export class StyleManager
{
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
    *
    * @param {object}   opts - Options.
    *
    * @param {string}   opts.id - Required CSS ID providing a link to a specific style sheet element.
    *
    * @param {string}   [opts.layerName] - Optional CSS layer name defining the top level CSS rule.
    *
    * @param {number}   [opts.version] - An integer representing the version / level of styles being managed.
    */
   constructor({ cssRuleMap, id, styleElement, version, layerName } = {})
   {
      if (typeof id !== 'string') { throw new TypeError(`StyleManager error: 'id' is not a string.`); }

      if (version !== void 0 && (!Number.isFinite(version) || version < 1))
      {
         throw new TypeError(`StyleManager error: 'version' is not a positive number >= 1.`);
      }

      if (layerName !== void 0 && typeof layerName !== 'string')
      {
         throw new TypeError(`StyleManager error: 'layerName' is not a string.`);
      }

      this.#cssRuleMap = cssRuleMap;
      this.#id = id;
      this.#layerName = layerName;
      this.#styleElement = styleElement;
      this.#version = version;
   }

   /**
    * Determines if this StyleManager is still connected / available.
    *
    * @returns {boolean} Is StyleManager connected.
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
    * Provides a copy constructor to duplicate an existing StyleManager instance into a new document.
    *
    * Note: This is used to support the `PopOut` module.
    *
    * @param {Document} [document] Target browser document to clone into.
    *
    * @param {boolean} [force] When true, force the cloning of the style manager into the target document.
    *
    * @returns {StyleManager | undefined} New style manager instance or undefined if not connected.
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
         force
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
}
