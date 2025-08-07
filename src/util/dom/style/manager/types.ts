// interface CSSRuleManager
// {
//    /**
//     * @returns Provides an accessor to get the `cssText` for the style sheet.
//     */
//    get cssText(): string;
//
//    /**
//     * @param cssText - Provides an accessor to set the `cssText` for the style rule.
//     */
//    set cssText(cssText: string);
//
//    /**
//     * Determines if this CSSRuleManager is still connected / available.
//     *
//     * @returns {boolean} Is CSSRuleManager connected.
//     */
//    get isConnected(): boolean;
//
//    /**
//     * @returns Name of this CSSRuleManager indexed by associated TJSStyleManager.
//     */
//    get name(): string;
//
//    /**
//     * @returns The associated selector for this CSS rule.
//     */
//    get selector(): string;
//
//    /**
//     * Retrieves an object with the current CSS rule data.
//     *
//     * @returns Current CSS rule data.
//     */
//    get(): { [key: string]: string };
//
//    /**
//     * Gets a particular CSS variable.
//     *
//     * @param key - CSS variable property key.
//     *
//     * @returns Returns CSS variable value.
//     */
//    getProperty(key: string): string;
//
//    /**
//     * Returns whether this CSS rule manager has a given property key.
//     *
//     * @param key - CSS variable property key.
//     *
//     * @returns Property key exists / is defined.
//     */
//    hasProperty(key: string): boolean;
//
//    /**
//     * Set rules by property / value; useful for CSS variables.
//     *
//     * @param rules - An object with property / value string pairs to load.
//     *
//     * @param [overwrite=true] - When true overwrites any existing values.
//     */
//    setProperties(rules: { [key: string]: string }, overwrite?: boolean): void;
//
//    /**
//     * Sets a particular property.
//     *
//     * @param key - CSS variable property key.
//     *
//     * @param value - CSS variable value.
//     *
//     * @param [overwrite=true] - Overwrite any existing value.
//     */
//    setProperty(key: string, value: string, overwrite?: boolean): void;
//
//    /**
//     * Removes the property keys specified. If `keys` is an iterable list then all property keys in the list are removed.
//     *
//     * @param keys - The property keys to remove.
//     */
//    removeProperties(keys: Iterable<string>): void;
//
//    /**
//     * Removes a particular CSS variable.
//     *
//     * @param key - CSS variable property key.
//     *
//     * @returns CSS variable value when removed.
//     */
//    removeProperty(key: string): string;
// }
//
// export {
//    CSSRuleManager
// }
