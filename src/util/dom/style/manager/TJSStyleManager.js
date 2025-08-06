import { CrossWindow }     from '#runtime/util/browser';
import { isObject }        from '#runtime/util/object';

import { StyleManager }    from './StyleManager.js';
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
    * @hideconstructor
    */
   constructor()
   {
      throw new Error('TJSStyleManager constructor: This is a static class and should not be constructed.');
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
    * @returns {StyleManager | undefined} Created style manager instance or undefined if already exists.
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

      console.log(`!!! TJSStyleManager.create - 0 - id: ${id}; current: `, JSON.stringify(current));

      if (isObject(current))
      {
         console.log(`!!! TJSStyleManager.create - A`);

         // Remove all existing CSS rules / text if the version is greater than the existing version or `force` is true.
         if (force || (version > current.version))
         {
            console.log(`!!! TJSStyleManager.create - A1`);

            current.element?.remove?.();
            return this.#initializeNew(document, id, rules, version, layerName);
         }
         else
         {
            console.log(`!!! TJSStyleManager.create - A2`);
            // A style manager already exists that is a greater version than requested.
            return void 0;
         }
      }
      else
      {
         console.log(`!!! TJSStyleManager.create - B`);

         return this.#initializeNew(document, id, rules, version, layerName);
      }
   }

   // Internal Implementation ----------------------------------------------------------------------------------------

   #initializeConnect(document, id, rules, version, layerName)
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
    *
    * @returns {StyleManager | undefined} New StyleManager instance.
    */
   static #initializeNew(document, id, rules, version, layerName)
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

         return new StyleManager({ cssRuleMap, id, version, layerName, styleElement})
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
