import { CrossWindow }           from '#runtime/util/browser';

import {
   isIterable,
   isObject }                    from '#runtime/util/object';

import { StyleParse }            from '../parse';

import type { TJSStyleManager }  from './TJSStyleManager';

/**
 * Provides the ability to `get` and `set` bulk or single CSS properties to a specific {@link CSSStyleRule}.
 */
export class CSSRuleManager implements TJSStyleManager.CSSRuleManager
{
   /**
    * The specific rule instance in the association HTMLStyleElement.
    */
   #cssRule: CSSStyleRule;

   /**
    * The CSS selector for this rule manager.
    */
   readonly #selector: string;

   /**
    * The name that this rule manager is indexed by in the associated `TJSStyleManager` instance.
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
      if (!CrossWindow.isCSSStyleRule(cssRule))
      {
         throw new TypeError(`CSSRuleManager error: 'cssRule' is not a CSSStyleRule instance..`);
      }

      if (typeof name !== 'string') { throw new TypeError(`CSSRuleManager error: 'name' is not a string.`); }
      if (typeof selector !== 'string') { throw new TypeError(`CSSRuleManager error: 'selector' is not a string.`); }

      this.#cssRule = cssRule;
      this.#name = name;
      this.#selector = selector;
   }

   /**
    * @returns Provides an accessor to get the `cssText` for the style rule or undefined if not connected.
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
   set cssText(cssText: string | undefined)
   {
      if (!this.isConnected) { return; }

      this.#cssRule.style.cssText = typeof cssText === 'string' ? cssText : '';
   }

   /**
    * Retrieves an object with the current CSS rule data.
    *
    * @param [options] - Optional settings.
    *
    * @param [options.camelCase=false] - Whether to convert property names to camel case.
    *
    * @returns Current CSS style data or undefined if not connected.
    */
   get(options: { camelCase?: boolean } = {}): TJSStyleManager.Data.StyleProps | undefined
   {
      return this.isConnected ? StyleParse.cssText(this.#cssRule.style.cssText, options) : void 0;
   }

   /**
    * Gets a particular CSS property value.
    *
    * @param key - CSS property key; must be in hyphen-case (IE `background-color`).
    *
    * @returns Returns CSS property value or undefined if non-existent.
    */
   getProperty(key: string): string | undefined
   {
      if (!this.isConnected) { return void 0; }

      if (typeof key !== 'string') { throw new TypeError(`CSSRuleManager error: 'key' is not a string.`); }

      const result = this.#cssRule.style.getPropertyValue(key);

      return result !== '' ? result : void 0;
   }

   /**
    * Returns whether this CSS rule manager has a given property key.
    *
    * @param key - CSS property key; must be in hyphen-case (IE `background-color`).
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
    * @param styles - An object with property / value string pairs to load.
    *
    * @param [overwrite=true] - When true overwrites any existing values; default: `true`.
    */
   setProperties(styles: TJSStyleManager.Data.StyleProps, overwrite: boolean = true)
   {
      if (!this.isConnected) { return; }

      if (!isObject(styles)) { throw new TypeError(`CSSRuleManager error: 'styles' is not an object.`); }

      if (typeof overwrite !== 'boolean')
      {
         throw new TypeError(`CSSRuleManager error: 'overwrite' is not a boolean.`);
      }

      if (overwrite)
      {
         for (const [key, value] of Object.entries(styles))
         {
            this.#cssRule.style.setProperty(key, value);
         }
      }
      else
      {
         // Only set property keys for entries that don't have an existing rule set.
         for (const [key, value] of Object.entries(styles))
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
    * @param key - CSS property key; must be in hyphen-case (IE `background-color`).
    *
    * @param value - CSS property value.
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
    * Removes the property keys specified. If `keys` is an iterable list then all property keys in the list are
    * removed. The keys must be in hyphen-case (IE `background-color`).
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
    * @param key - CSS property key; must be in hyphen-case (IE `background-color`).
    *
    * @returns CSS value when removed or undefined if non-existent.
    */
   removeProperty(key: string): string | undefined
   {
      if (!this.isConnected) { return void 0; }

      if (typeof key !== 'string') { throw new TypeError(`CSSRuleManager error: 'key' is not a string.`); }

      const result = this.#cssRule.style.removeProperty(key);

      return result !== '' ? result : void 0;
   }
}
