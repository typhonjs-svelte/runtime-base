interface CSSRuleManager
{
   /**
    * @returns Provides an accessor to get the `cssText` for the style sheet.
    */
   get cssText(): string;

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
    * @returns Current CSS rule data.
    */
   get(): { [key: string]: string };

   /**
    * Gets a particular CSS variable.
    *
    * @param key - CSS variable property key.
    *
    * @returns Returns CSS variable value.
    */
   getProperty(key: string): string;

   /**
    * Set rules by property / value; useful for CSS variables.
    *
    * @param rules - An object with property / value string pairs to load.
    *
    * @param [overwrite=true] - When true overwrites any existing values.
    */
   setProperties(rules: { [key: string]: string }, overwrite?: boolean): void;

   /**
    * Sets a particular property.
    *
    * @param key - CSS variable property key.
    *
    * @param value - CSS variable value.
    *
    * @param [overwrite=true] - Overwrite any existing value.
    */
   setProperty(key: string, value: string, overwrite?: boolean): void;

   /**
    * Removes the property keys specified. If `keys` is an iterable list then all property keys in the list are removed.
    *
    * @param keys - The property keys to remove.
    */
   removeProperties(keys: Iterable<string>): void;

   /**
    * Removes a particular CSS variable.
    *
    * @param key - CSS variable property key.
    *
    * @returns CSS variable value when removed.
    */
   removeProperty(key: string): string;
}

export {
   CSSRuleManager
}
