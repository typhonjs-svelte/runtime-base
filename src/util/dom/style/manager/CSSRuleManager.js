import {
   isIterable,
   isObject }  from '#runtime/util/object';

/**
 * @implements {import('./types').CSSRuleManager>}
 */
export class CSSRuleManager
{
   /** @type {CSSStyleRule} */
   #cssRule;

   /** @type {string} */
   #selector;

   /** @type {string} */
   #name;

   /**
    * @param {CSSStyleRule} cssRule -
    *
    * @param {string} name -
    *
    * @param {string} selector -
    */
   constructor(cssRule, name, selector)
   {
      if (typeof selector !== 'string') { throw new TypeError(`CSSRuleManager error: 'selector' is not a string.`); }

      this.#selector = selector;
      this.#cssRule = cssRule;
      this.#name = name;
   }

   /**
    * @returns {string | undefined} Provides an accessor to get the `cssText` for the style sheet or undefined if not
    *          connected.
    */
   get cssText()
   {
      if (!this.isConnected()) { return; }

      return this.#cssRule.style.cssText;
   }

   /**
    * @returns {string} Name of this CSSRuleManager indexed by associated TJSStyleManager.
    */
   get name()
   {
      return this.#name;
   }

   /**
    * @returns {string} The associated selector for this CSS rule.
    */
   get selector()
   {
      return this.#selector;
   }

   /**
    * Retrieves an object with the current CSS rule data.
    *
    * @returns {{ [key: string]: string } | undefined} Current CSS rule data or undefined if not connected.
    */
   get()
   {
      if (!this.isConnected()) { return; }

      const cssText = this.#cssRule.style.cssText;

      const result = {};

      if (cssText !== '')
      {
         for (const entry of cssText.split(';'))
         {
            if (entry !== '')
            {
               const values = entry.split(':');
               result[values[0].trim()] = values[1].trim();
            }
         }
      }

      return result;
   }

   /**
    * Determines if this CSSRuleManager is still connected / available.
    *
    * @returns {boolean} Is CSSRuleManager connected.
    */
   isConnected()
   {
      const sheet = this.#cssRule?.parentStyleSheet;
      const owner = sheet?.ownerNode;

      return !!(sheet && owner && owner.isConnected);
   }

   /**
    * Gets a particular CSS variable.
    *
    * @param {string}   key - CSS variable property key.
    *
    * @returns {string | undefined} Returns CSS variable value or undefined if not connected.
    */
   getProperty(key)
   {
      if (!this.isConnected()) { return; }

      if (typeof key !== 'string') { throw new TypeError(`StyleManager error: 'key' is not a string.`); }

      return this.#cssRule.style.getPropertyValue(key);
   }

   /**
    * Set rules by property / value; useful for CSS variables.
    *
    * @param {{ [key: string]: string }}  rules - An object with property / value string pairs to load.
    *
    * @param {boolean}                 [overwrite=true] - When true overwrites any existing values.
    */
   setProperties(rules, overwrite = true)
   {
      if (!this.isConnected()) { return; }

      if (!isObject(rules)) { throw new TypeError(`StyleManager error: 'rules' is not an object.`); }

      if (typeof overwrite !== 'boolean') { throw new TypeError(`StyleManager error: 'overwrite' is not a boolean.`); }

      if (overwrite)
      {
         for (const [key, value] of Object.entries(rules))
         {
            this.#cssRule.style.setProperty(key, value);
         }
      }
      else
      {
         // Only set property keys for entries that don't have an existing rule set.
         for (const [key, value] of Object.entries(rules))
         {
            if (this.#cssRule.style.getPropertyValue(key) === '')
            {
               this.#cssRule.style.setProperty(key, value);
            }
         }
      }
   }

   /**
    * Sets a particular property.
    *
    * @param {string}   key - CSS variable property key.
    *
    * @param {string}   value - CSS variable value.
    *
    * @param {boolean}  [overwrite=true] - Overwrite any existing value.
    */
   setProperty(key, value, overwrite = true)
   {
      if (!this.isConnected()) { return; }

      if (typeof key !== 'string') { throw new TypeError(`StyleManager error: 'key' is not a string.`); }

      if (typeof value !== 'string') { throw new TypeError(`StyleManager error: 'value' is not a string.`); }

      if (typeof overwrite !== 'boolean') { throw new TypeError(`StyleManager error: 'overwrite' is not a boolean.`); }

      if (overwrite)
      {
         this.#cssRule.style.setProperty(key, value);
      }
      else
      {
         if (this.#cssRule.style.getPropertyValue(key) === '')
         {
            this.#cssRule.style.setProperty(key, value);
         }
      }
   }

   /**
    * Removes the property keys specified. If `keys` is an iterable list then all property keys in the list are removed.
    *
    * @param {Iterable<string>} keys - The property keys to remove.
    */
   removeProperties(keys)
   {
      if (!this.isConnected()) { return; }

      if (!isIterable(keys)) { throw new TypeError(`StyleManager error: 'keys' is not an iterable list.`); }

      for (const key of keys)
      {
         if (typeof key === 'string') { this.#cssRule.style.removeProperty(key); }
      }
   }

   /**
    * Removes a particular CSS variable.
    *
    * @param {string}   key - CSS variable property key.
    *
    * @returns {string | undefined} CSS variable value when removed.
    */
   removeProperty(key)
   {
      if (!this.isConnected()) { return; }

      if (typeof key !== 'string') { throw new TypeError(`StyleManager error: 'key' is not a string.`); }

      return this.#cssRule.style.removeProperty(key);
   }
}
