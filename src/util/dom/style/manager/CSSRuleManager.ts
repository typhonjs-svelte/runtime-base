import {
   isIterable,
   isObject }                    from '#runtime/util/object';

import { StyleParse }            from '../parse';

import type { TJSStyleManager }  from './TJSStyleManager';

/**
 *
 */
export class CSSRuleManager implements TJSStyleManager.CSSRuleManager
{
   /**
    *
    */
   #cssRule: CSSStyleRule;

   /**
    *
    */
   readonly #selector: string;

   /**
    *
    */
   readonly #name: string;

   /**
    * @param   cssRule -
    *
    * @param   name -
    *
    * @param   selector -
    */
   constructor(cssRule: CSSStyleRule, name: string, selector: string)
   {
      if (typeof name !== 'string') { throw new TypeError(`CSSRuleManager error: 'name' is not a string.`); }
      if (typeof selector !== 'string') { throw new TypeError(`CSSRuleManager error: 'selector' is not a string.`); }

      this.#cssRule = cssRule;
      this.#name = name;
      this.#selector = selector;
   }

   /**
    * @returns Provides an accessor to get the `cssText` for the style sheet or undefined if not connected.
    */
   get cssText(): string | undefined
   {
      return this.isConnected ? this.#cssRule.style.cssText : void 0;
   }

   /**
    * Determines if this CSSRuleManager is still connected / available.
    *
    * @returns Is CSSRuleManager connected.
    */
   get isConnected(): boolean
   {
      const sheet = this.#cssRule?.parentStyleSheet;
      const owner = sheet?.ownerNode;

      return !!(sheet && owner && owner.isConnected);
   }

   /**
    * @returns Name of this CSSRuleManager indexed by associated TJSStyleManager.
    */
   get name(): string
   {
      return this.#name;
   }

   /**
    * @returns The associated selector for this CSS rule.
    */
   get selector(): string
   {
      return this.#selector;
   }

   /**
    * @param   cssText - Provides an accessor to set the `cssText` for the style rule.
    */
   set cssText(cssText: string)
   {
      if (!this.isConnected) { return; }

      this.#cssRule.style.cssText = cssText;
   }

   /**
    * Retrieves an object with the current CSS rule data.
    *
    * @returns Current CSS rule data or undefined if not connected.
    */
   get(): { [key: string]: string } | undefined
   {
      return this.isConnected ? StyleParse.cssText(this.#cssRule.style.cssText) : void 0;
   }

   /**
    * Gets a particular CSS variable.
    *
    * @param   key - CSS variable property key.
    *
    * @returns Returns CSS variable value or undefined if not connected.
    */
   getProperty(key: string): string | undefined
   {
      if (!this.isConnected) { return; }

      if (typeof key !== 'string') { throw new TypeError(`CSSRuleManager error: 'key' is not a string.`); }

      return this.#cssRule.style.getPropertyValue(key);
   }

   /**
    * Returns whether this CSS rule manager has a given property key.
    *
    * @param   key - CSS variable property key.
    *
    * @returns Property key exists / is defined.
    */
   hasProperty(key: string): boolean
   {
      if (!this.isConnected) { return false; }

      if (typeof key !== 'string') { throw new TypeError(`CSSRuleManager error: 'key' is not a string.`); }

      return this.#cssRule.style.getPropertyValue(key) !== '';
   }

   /**
    * Set rules by property / value; useful for CSS variables.
    *
    * @param   rules - An object with property / value string pairs to load.
    *
    * @param   [overwrite=true] - When true overwrites any existing values; default: `true`.
    */
   setProperties(rules: { [key: string]: string }, overwrite: boolean = true)
   {
      if (!this.isConnected) { return; }

      if (!isObject(rules)) { throw new TypeError(`CSSRuleManager error: 'rules' is not an object.`); }

      if (typeof overwrite !== 'boolean')
      {
         throw new TypeError(`CSSRuleManager error: 'overwrite' is not a boolean.`);
      }

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
    * @param key - CSS variable property key.
    *
    * @param value - CSS variable value.
    *
    * @param [overwrite=true] - When true overwrites any existing value; default: `true`.
    */
   setProperty(key: string, value: string, overwrite: boolean = true)
   {
      if (!this.isConnected) { return; }

      if (typeof key !== 'string') { throw new TypeError(`CSSRuleManager error: 'key' is not a string.`); }

      if (typeof value !== 'string') { throw new TypeError(`CSSRuleManager error: 'value' is not a string.`); }

      if (typeof overwrite !== 'boolean')
      {
         throw new TypeError(`CSSRuleManager error: 'overwrite' is not a boolean.`);
      }

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
    * @param keys - The property keys to remove.
    */
   removeProperties(keys: Iterable<string>)
   {
      if (!this.isConnected) { return; }

      if (!isIterable(keys)) { throw new TypeError(`CSSRuleManager error: 'keys' is not an iterable list.`); }

      for (const key of keys)
      {
         if (typeof key === 'string') { this.#cssRule.style.removeProperty(key); }
      }
   }

   /**
    * Removes a particular CSS property.
    *
    * @param key - CSS property key.
    *
    * @returns CSS value when removed.
    */
   removeProperty(key: string): string | undefined
   {
      if (!this.isConnected) { return; }

      if (typeof key !== 'string') { throw new TypeError(`CSSRuleManager error: 'key' is not a string.`); }

      return this.#cssRule.style.removeProperty(key);
   }
}
