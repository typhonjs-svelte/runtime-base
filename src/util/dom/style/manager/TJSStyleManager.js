import { CSSRuleManager } from './CSSRuleManager.js';

/**
 * Provides a managed dynamic style sheet / element useful in configuring global CSS variables. When creating an
 * instance of TJSStyleManager you must provide a "document key" / string for the style element added. The style element
 * can be accessed via `document[docKey]`.
 *
 * Instances of TJSStyleManager can also be versioned by supplying a positive integer greater than or equal to `1` via
 * the 'version' option. This version number is assigned to the associated style element. When a TJSStyleManager
 * instance is created and there is an existing instance with a version that is lower than the current instance all CSS
 * rules are removed letting the higher version take precedence. This isn't a perfect system and requires thoughtful
 * construction of CSS variables exposed, but allows multiple independently compiled TRL packages to load the latest
 * CSS variables. It is recommended to always set `overwrite` option of {@link TJSStyleManager.setProperty} and
 * {@link TJSStyleManager.setProperties} to `false` when loading initial values.
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
    */
   constructor({ id, rules, version, document = globalThis.document, layerName } = {})
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

         // Remove all existing CSS rules / text if the version is greater than the existing version.
         if (typeof version === 'number' && version > existingVersion)
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

   // TODO: Can we get the entire stylesheet text content?
   // /**
   //  * @returns {string} Provides an accessor to get the `cssText` for the style sheet.
   //  */
   // get cssText()
   // {
   //    return this.#cssRule.style.cssText;
   // }

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
    * @returns {TJSStyleManager | undefined} New style manager instance or undefined if not connected.
    */
   clone(document = globalThis.document)
   {
      if (!this.isConnected()) { return; }

      // TODO REFACTOR
      // const newStyleManager = new TJSStyleManager({
      //    selector: this.#selector,
      //    docKey: this.#docKey,
      //    document,
      //    version: this.#version
      // });
      //
      // newStyleManager.#cssRule.style.cssText = this.#cssRule.style.cssText;
      //
      // return newStyleManager;
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
      if (!this.isConnected()) { return; }

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
    * Determines if this TJSStyleManager is still connected / available.
    *
    * @returns {boolean} Is TJSStyleManager connected.
    */
   isConnected()
   {
      return !!this.#styleElement?.isConnected;
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

   #hasLayerBlock(styleEl)
   {

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
    */
   #initialize(document, id, rules, version, layerName)
   {
      this.#styleElement = document.createElement('style');
      this.#styleElement.id = id;
      this.#styleElement.setAttribute('data-version', String(version));

      document.head.append(this.#styleElement);

      for (const ruleName in rules)
      {
         const selector = rules[ruleName];
         const index =  this.#styleElement.sheet.insertRule(`${selector} {}`);

         const cssRule = /** @type {CSSStyleRule} */ this.#styleElement.sheet.cssRules[index];

         this.#cssRuleMap.set(ruleName, new CSSRuleManager(cssRule, ruleName, selector));
      }
   }
}
