import { CSSRuleManager } from './CSSRuleManager.js';

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
   /** @type {Map<string, import('./types').CSSRuleManager>} */
   #cssRuleMap = new Map();

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
    * @param {Document} [opts.document] - Target document to load styles into.
    *
    * @param {string}   [opts.layerName] - Optional CSS layer name defining the top level CSS rule.
    *
    * @param {{ [key: string]: string }}  [opts.rules] - Optional CSS Rules configuration.
    *
    * @param {number}   [opts.version] - An integer representing the version / level of styles being managed.
    *
    * @param {boolean}  [opts.force] - When true, removes any existing matching style sheet and initializes a new one.
    */
   constructor({ id, rules, version, document = globalThis.document, layerName, force = false } = {})
   {
      if (typeof id !== 'string') { throw new TypeError(`TJSStyleManager error: 'id' is not a string.`); }

      if (Object.prototype.toString.call(document) !== '[object HTMLDocument]')
      {
         throw new TypeError(`TJSStyleManager error: 'document' is not an instance of HTMLDocument.`);
      }

      if (version !== void 0 && (!Number.isFinite(version) || version < 1))
      {
         throw new TypeError(`TJSStyleManager error: 'version' is not a positive number >= 1.`);
      }

      if (layerName !== void 0 && typeof layerName !== 'string')
      {
         throw new TypeError(`TJSStyleManager error: 'layerName' is not a string.`);
      }

      if (typeof force !== 'boolean')
      {
         throw new TypeError(`TJSStyleManager error: 'force' is not a boolean.`);
      }

      this.#id = id;
      this.#layerName = layerName;
      this.#version = version;

      const existingStyleEl = document.querySelector(`head style#${id}`);

      if (!existingStyleEl)
      {
         if (typeof version === 'number') { this.#initialize(document, id, rules, version, layerName); }
      }
      else
      {
         const existingVersion = Number(existingStyleEl.getAttribute('data-version') ?? 0);

         // Remove all existing CSS rules / text if the version is greater than the existing version or `force` is true.
         if (force || (typeof version === 'number' && version > existingVersion))
         {
            existingStyleEl.remove();
            this.#initialize(document, id, rules, version, layerName);
         }
         else
         {
            // TODO: CONSIDER A WAY TO CONNECT TO AN EXISTING STYLESHEET WHEN NO VERSION / RULES ARE PRESENT
         }
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
   clone({ document = globalThis.document, force = false } = {})
   {
      if (!this.isConnected) { return; }

      const rules = {};

      for (const key of this.#cssRuleMap.keys())
      {
         rules[key] = this.#cssRuleMap.get(key).selector;
      }

      const newStyleManager = new TJSStyleManager({
         id: this.#id,
         version: this.#version,
         layerName: this.#layerName,
         rules,
         document,
         force
      });

      for (const key of this.#cssRuleMap.keys())
      {
         if (newStyleManager.#cssRuleMap.has(key))
         {
            newStyleManager.#cssRuleMap.get(key).cssText = this.#cssRuleMap.get(key).cssText;
         }
      }

      return newStyleManager;
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
    * @param {Document} document - Target Document.
    *
    * @param {string} id - Associated CSS ID
    *
    * @param {{ [key: string]: string }} rules -
    *
    * @param {number} version -
    *
    * @param {string} layerName -
    */
   #initialize(document, id, rules, version, layerName)
   {
      this.#styleElement = document.createElement('style');
      this.#styleElement.id = id;
      this.#styleElement.setAttribute('data-version', String(version));

      document.head.append(this.#styleElement);

      let targetSheet;

      try
      {
         if (layerName)
         {
            const index = this.#styleElement.sheet.insertRule(`@layer ${layerName} {}`);
            targetSheet = this.#styleElement.sheet.cssRules[index];
         }
         else
         {
            targetSheet = this.#styleElement.sheet;
         }

         for (const ruleName in rules)
         {
            const selector = rules[ruleName];
            const index = targetSheet.insertRule(`${selector} {}`);

            const cssRule = /** @type {CSSStyleRule} */ targetSheet.cssRules[index];

            this.#cssRuleMap.set(ruleName, new CSSRuleManager(cssRule, ruleName, selector));
         }
      }
      catch (error)
      {
         console.error(`TyphonJS Runtime [TJSStyleManager error]: Please update your browser to the latest version.`,
          error);

         // Clean up: remove the <style> from the DOM.
         if (this.#styleElement && this.#styleElement.parentNode) { this.#styleElement.remove(); }

         this.#cssRuleMap.clear();
         this.#styleElement = null;
      }
   }
}
