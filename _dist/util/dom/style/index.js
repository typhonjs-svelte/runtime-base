import { CrossWindow } from '@typhonjs-svelte/runtime-base/util/browser';
import { isObject, isIterable } from '@typhonjs-svelte/runtime-base/util/object';
import { validateStrict, compare, satisfies } from '@typhonjs-svelte/runtime-base/util/semver';

/**
 * Provides resources for parsing style strings.
 */
class StyleParse {
    static #regexPixels = /(\d+)\s*px/;
    /**
     * @private
     */
    constructor() {
        throw new Error('StyleParse constructor: This is a static class and should not be constructed.');
    }
    /**
     * Parse a CSS declaration block / {@link CSSDeclarationBlock} (IE `color: red; font-size: 14px;`) into an object of
     * property / value pairs.
     *
     * This implementation is optimized for parsing the output of `CSSStyleRule.style.cssText`, which is always
     * well-formed according to the CSSOM spec. It is designed to be:
     * ```
     * - **Fast**: minimal allocations, no regex in the hot loop.
     * - **Accurate**: ignores `;` inside quotes or parentheses.
     * - **Flexible**: supports optional camel case conversion.
     * - **CSS variable safe**: leaves `--*` properties untouched.
     *```
     *
     * @param cssText - A valid CSS declaration block (no selectors).
     *
     * @param [options] - Optional parser settings.
     *
     * @param [options.camelCase=false] - Convert hyphen-case property names to camel case.
     *
     * @returns An object mapping property names to their CSS values.
     */
    static cssText(cssText, { camelCase = false } = {}) {
        // Reject non-strings or empty input quickly.
        if (typeof cssText !== 'string' || cssText.length === 0) {
            return {};
        }
        // Quick reject: if there's no `:` there are no declarations.
        if (cssText.indexOf(':') === -1) {
            return {};
        }
        const out = {};
        // Index where the current declaration starts.
        let segStart = 0;
        // Tracks whether we are inside parentheses (url(), calc(), var(), etc.).
        let parens = 0;
        // Tracks whether we are inside single or double quotes.
        let inSQ = false;
        let inDQ = false;
        // Walk through every character in the string.
        for (let i = 0; i < cssText.length; i++) {
            const ch = cssText[i];
            if (ch === '"' && !inSQ) {
                // Toggle double-quote mode if not in single quotes.
                inDQ = !inDQ;
            }
            else if (ch === '\'' && !inDQ) {
                // Toggle single-quote mode if not in double quotes.
                inSQ = !inSQ;
            }
            else if (!inSQ && !inDQ) {
                // Only count parentheses when outside of quotes.
                if (ch === '(') {
                    parens++;
                }
                else if (ch === ')') {
                    if (parens > 0) {
                        parens--;
                    }
                }
                // Only treat `;` as a declaration terminator if not inside parentheses.
                else if (ch === ';' && parens === 0) {
                    // Extract the substring for this declaration.
                    if (i > segStart) {
                        const chunk = cssText.slice(segStart, i).trim();
                        if (chunk) {
                            this.#cssTextFlushDecl(chunk, out, camelCase);
                        }
                    }
                    // Move start index to the character after the semicolon.
                    segStart = i + 1;
                }
            }
        }
        // Process the last declaration after the loop ends.
        if (segStart < cssText.length) {
            const chunk = cssText.slice(segStart).trim();
            if (chunk) {
                this.#cssTextFlushDecl(chunk, out, camelCase);
            }
        }
        return out;
    }
    /**
     * Parses a pixel string / computed styles. Ex. `100px` returns `100`.
     *
     * @param   value - Value to parse.
     *
     * @returns The integer component of a pixel string.
     */
    static pixels(value) {
        if (typeof value !== 'string') {
            return void 0;
        }
        const isPixels = this.#regexPixels.test(value);
        const number = parseInt(value);
        return isPixels && Number.isFinite(number) ? number : void 0;
    }
    /**
     * Returns the pixel value for `1rem` based on the root document element. You may apply an optional multiplier.
     *
     * @param [multiplier=1] - Optional multiplier to apply to `rem` pixel value; default: 1.
     *
     * @param [options] - Optional parameters.
     *
     * @param [options.targetDocument=document] The target DOM {@link Document} if different from the main
     *        browser global `document`.
     *
     * @returns The pixel value for `1rem` with or without a multiplier based on the root document element.
     */
    static remPixels(multiplier = 1, { targetDocument = window.document } = {}) {
        return targetDocument?.documentElement ?
            multiplier * parseFloat(window.getComputedStyle(targetDocument.documentElement).fontSize) : void 0;
    }
    /**
     * Split a CSS selector list into individual selectors, honoring commas that appear only at the top level
     * (IE not inside (), [], or quotes). Additional options provide inclusion / exclusion filtering of selector parts.
     *
     * Examples:
     *   '.a, .b'                                  → ['.a', '.b']
     *   ':is(.a, .b):not([data-x=","]) .c, .d'    → [':is(.a, .b):not([data-x=","]) .c', '.d']
     *
     * @param selectorText - `CSSStyleRule.selectorText` to parse.
     *
     * @param [options] - Optional filtering options.
     *
     * @param [options.excludeSelectorParts] - An array of RegExp instances to filter by exclusion.
     *
     * @param [options.includeSelectorPartSet] - A Set of strings to filter by inclusion.
     *
     * @returns Array of trimmed selector strings w/ optional filtering of parts.
     */
    static selectorText(selectorText, { excludeSelectorParts, includeSelectorPartSet } = {}) {
        const parts = [];
        if (typeof selectorText !== 'string' || selectorText.length === 0) {
            return parts;
        }
        const hasExclude = Array.isArray(excludeSelectorParts) && excludeSelectorParts.length > 0;
        const hasInclude = CrossWindow.isSet(includeSelectorPartSet) && includeSelectorPartSet.size > 0;
        let start = 0;
        let inSQ = false; // '
        let inDQ = false; // "
        let paren = 0; // ()
        let bracket = 0; // []
        for (let i = 0; i < selectorText.length; i++) {
            const ch = selectorText[i];
            // Toggle quote states; don’t nest the other quote type.
            if (ch === '"' && !inSQ) {
                inDQ = !inDQ;
                continue;
            }
            if (ch === '\'' && !inDQ) {
                inSQ = !inSQ;
                continue;
            }
            if (inSQ || inDQ) {
                continue;
            }
            // Only track bracket / paren nesting outside quotes.
            if (ch === '(') {
                paren++;
                continue;
            }
            if (ch === ')') {
                if (paren > 0) {
                    paren--;
                }
                continue;
            }
            if (ch === '[') {
                bracket++;
                continue;
            }
            if (ch === ']') {
                if (bracket > 0) {
                    bracket--;
                }
                continue;
            }
            // Top-level comma separates selectors.
            if (ch === ',' && paren === 0 && bracket === 0) {
                const piece = selectorText.slice(start, i).trim();
                if (piece && (!hasInclude || includeSelectorPartSet.has(piece)) &&
                    (!hasExclude || !excludeSelectorParts.some((rx) => rx.test(piece)))) {
                    parts.push(piece);
                }
                start = i + 1;
            }
        }
        // Final segment.
        const last = selectorText.slice(start).trim();
        if (last && (!hasInclude || includeSelectorPartSet.has(last)) &&
            (!hasExclude || !excludeSelectorParts.some((rx) => rx.test(last)))) {
            parts.push(last);
        }
        return parts;
    }
    // Internal Implementation ----------------------------------------------------------------------------------------
    /**
     * Parse a single CSS declaration string into a property / value pair and store it in the output object.
     *
     * Note: Used by {@link StyleParse.cssText}.
     *
     * This method:
     * ```
     * - Splits on the first `:` into property and value parts
     * - Trims whitespace from both
     * - Optionally converts hyphen-case to camelCase
     * - Ignores empty or malformed declarations
     * ```
     *
     * @param chunk - The raw CSS declaration string (IE `"color: red"`).
     *
     * @param out - The object to store the parsed property / value pair.
     *
     * @param camelCase - Whether to convert hyphen-case keys to camel case.
     */
    static #cssTextFlushDecl(chunk, out, camelCase) {
        // Find the first colon — separates property from value.
        const idx = chunk.indexOf(':');
        if (idx < 0) {
            return;
        }
        // Extract and trim the property name.
        let key = chunk.slice(0, idx).trim();
        if (!key) {
            return;
        }
        // Extract and trim the value (keep empty string if explicitly set).
        const value = chunk.slice(idx + 1).trim();
        // Convert to camelCase if requested and not a CSS variable.
        if (camelCase && !key.startsWith('--')) {
            let s = '';
            for (let i = 0; i < key.length; i++) {
                const code = key.charCodeAt(i);
                if (code === 45 /* '-' */ && i + 1 < key.length) {
                    i++;
                    s += key[i].toUpperCase();
                }
                else {
                    s += key[i];
                }
            }
            key = s;
        }
        // Store in the output object.
        out[key] = value;
    }
}

/**
 * Provides the ability to `get` and `set` bulk or single CSS properties to a specific {@link CSSStyleRule}.
 */
class RuleManager {
    /**
     * The specific rule instance in the association HTMLStyleElement.
     */
    #cssRule;
    /**
     * The CSS selector for this rule manager.
     */
    #selector;
    /**
     * The name that this rule manager is indexed by in the associated `StyleManager` instance.
     */
    #name;
    /**
     * @param   cssRule -
     *
     * @param   name -
     *
     * @param   selector -
     */
    constructor(cssRule, name, selector) {
        if (!CrossWindow.isCSSStyleRule(cssRule)) {
            throw new TypeError(`RuleManager error: 'cssRule' is not a CSSStyleRule instance..`);
        }
        if (typeof name !== 'string') {
            throw new TypeError(`RuleManager error: 'name' is not a string.`);
        }
        if (typeof selector !== 'string') {
            throw new TypeError(`RuleManager error: 'selector' is not a string.`);
        }
        this.#cssRule = cssRule;
        this.#name = name;
        this.#selector = selector;
    }
    // Accessors ------------------------------------------------------------------------------------------------------
    /**
     * @returns Provides an accessor to get the `cssText` for the style rule or undefined if not connected.
     */
    get cssText() {
        return this.isConnected ? this.#cssRule.style.cssText : void 0;
    }
    /**
     * Determines if this RuleManager is still connected / available.
     *
     * @returns Is RuleManager connected.
     */
    get isConnected() {
        const sheet = this.#cssRule?.parentStyleSheet;
        const owner = sheet?.ownerNode;
        return !!(sheet && owner && owner.isConnected);
    }
    /**
     * @returns Name of this RuleManager indexed by associated StyleManager.
     */
    get name() {
        return this.#name;
    }
    /**
     * @returns The associated selector for this CSS rule.
     */
    get selector() {
        return this.#selector;
    }
    /**
     * @param   cssText - Provides an accessor to set the `cssText` for the style rule.
     */
    set cssText(cssText) {
        if (!this.isConnected) {
            return;
        }
        this.#cssRule.style.cssText = typeof cssText === 'string' ? cssText : '';
    }
    // Iterator -------------------------------------------------------------------------------------------------------
    /**
     * Allows usage in `for of` loops directly.
     *
     * @returns Entries Map iterator.
     */
    [Symbol.iterator]() {
        return this.entries();
    }
    // Methods --------------------------------------------------------------------------------------------------------
    /**
     * @returns Iterator of CSS property entries in hyphen-case.
     */
    entries() {
        return Object.entries(this.get() ?? {})[Symbol.iterator]();
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
    get(options = {}) {
        return this.isConnected ? StyleParse.cssText(this.#cssRule.style.cssText, options) : void 0;
    }
    /**
     * Gets a particular CSS property value.
     *
     * @param key - CSS property key; must be in hyphen-case (IE `background-color`).
     *
     * @returns Returns CSS property value or undefined if non-existent.
     */
    getProperty(key) {
        if (!this.isConnected) {
            return void 0;
        }
        if (typeof key !== 'string') {
            throw new TypeError(`RuleManager error: 'key' is not a string.`);
        }
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
    hasProperty(key) {
        if (!this.isConnected) {
            return false;
        }
        if (typeof key !== 'string') {
            throw new TypeError(`RuleManager error: 'key' is not a string.`);
        }
        return this.#cssRule.style.getPropertyValue(key) !== '';
    }
    /**
     * @returns Iterator of CSS property keys in hyphen-case.
     */
    keys() {
        return Object.keys(this.get() ?? {})[Symbol.iterator]();
    }
    /**
     * Set CSS properties in bulk by property / value. Must use hyphen-case.
     *
     * @param styles - CSS styles object.
     *
     * @param [options] - Options.
     *
     * @param [override=true] - When true overrides any existing values; default: `true`.
     */
    setProperties(styles, { override = true } = {}) {
        if (!this.isConnected) {
            return;
        }
        if (!isObject(styles)) {
            throw new TypeError(`RuleManager error: 'styles' is not an object.`);
        }
        if (typeof override !== 'boolean') {
            throw new TypeError(`RuleManager error: 'override' is not a boolean.`);
        }
        if (override) {
            for (const [key, value] of Object.entries(styles)) {
                this.#cssRule.style.setProperty(key, value);
            }
        }
        else {
            // Only set property keys for entries that don't have an existing rule set.
            for (const [key, value] of Object.entries(styles)) {
                if (this.#cssRule.style.getPropertyValue(key) === '') {
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
     * @param [options] - Options.
     *
     * @param [options.override=true] - When true overrides any existing value; default: `true`.
     */
    setProperty(key, value, { override = true } = {}) {
        if (!this.isConnected) {
            return;
        }
        if (typeof key !== 'string') {
            throw new TypeError(`RuleManager error: 'key' is not a string.`);
        }
        if (typeof value !== 'string') {
            throw new TypeError(`RuleManager error: 'value' is not a string.`);
        }
        if (typeof override !== 'boolean') {
            throw new TypeError(`RuleManager error: 'override' is not a boolean.`);
        }
        if (override) {
            this.#cssRule.style.setProperty(key, value);
        }
        else {
            if (this.#cssRule.style.getPropertyValue(key) === '') {
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
    removeProperties(keys) {
        if (!this.isConnected) {
            return;
        }
        if (!isIterable(keys)) {
            throw new TypeError(`RuleManager error: 'keys' is not an iterable list.`);
        }
        for (const key of keys) {
            if (typeof key === 'string') {
                this.#cssRule.style.removeProperty(key);
            }
        }
    }
    /**
     * Removes a particular CSS property.
     *
     * @param key - CSS property key; must be in hyphen-case (IE `background-color`).
     *
     * @returns CSS value when removed or undefined if non-existent.
     */
    removeProperty(key) {
        if (!this.isConnected) {
            return void 0;
        }
        if (typeof key !== 'string') {
            throw new TypeError(`RuleManager error: 'key' is not a string.`);
        }
        const result = this.#cssRule.style.removeProperty(key);
        return result !== '' ? result : void 0;
    }
}

/**
 * Provides a managed dynamic style sheet / element useful in configuring global CSS variables. When creating an
 * instance of StyleManager, you must provide a CSS ID for the style element.
 *
 * Instances of StyleManager must be versioned by supplying a semver version string via the 'version' option. This
 * version is assigned to the associated style element. When a StyleManager instance is created and there is an
 * existing instance with a version that is lower than the current new instance, all CSS rules are removed, letting
 * the higher version take precedence. This isn't a perfect system and requires thoughtful construction of CSS
 * variables exposed, but allows multiple independently compiled TRL packages to load the latest CSS variables..
 */
class StyleManager {
    /**
     * Provides a token allowing internal instance construction.
     */
    static #CTOR_TOKEN = Symbol('StyleManager.CTOR_TOKEN');
    /**
     * Stores configured RuleManager instance by name.
     */
    #cssRuleMap;
    /**
     * CSS ID associated with style element.
     */
    #id;
    /**
     * Any associated CSS layer name.
     */
    #layerName;
    /**
     * The target style element.
     */
    #styleElement;
    /**
     * The version of this style manager.
     */
    #version;
    /**
     * @private
     */
    constructor({ cssRuleMap, id, styleElement, version, layerName, token }) {
        if (token !== StyleManager.#CTOR_TOKEN) {
            throw new Error('StyleManager constructor: Please use the static `create` or `connect` methods.');
        }
        this.#cssRuleMap = cssRuleMap;
        this.#id = id;
        this.#layerName = layerName;
        this.#styleElement = styleElement;
        this.#version = version;
    }
    // Static Methods -------------------------------------------------------------------------------------------------
    /**
     * Connect to an existing dynamic styles managed element by CSS ID with semver check on version range compatibility.
     *
     * @param   options - Options.
     */
    static connect({ id, range, document = window.document, warn = false }) {
        if (typeof id !== 'string') {
            throw new TypeError(`'id' is not a string.`);
        }
        if (typeof range !== 'string') {
            throw new TypeError(`'range' is not a string.`);
        }
        if (!CrossWindow.isDocument(document)) {
            throw new TypeError(`'document' is not an instance of HTMLDocument.`);
        }
        return this.#initializeConnect(document, id, range, warn);
    }
    /**
     * @param   options - Options.
     *
     * @returns Created style manager instance or undefined if already exists with a higher version.
     */
    static create(options) {
        return this.#createImpl(options);
    }
    /**
     * Query and check for an existing dynamic style manager element / instance given a CSS ID.
     *
     * @param   options - Options.
     *
     * @returns Undefined if no style manager is configured for the given CSS ID otherwise an object containing the
     *          current version and HTMLStyleElement associated with the CSS ID.
     */
    static exists({ id, document = window.document }) {
        if (typeof id !== 'string') {
            throw new TypeError(`'id' is not a string.`);
        }
        if (!CrossWindow.isDocument(document)) {
            throw new TypeError(`'document' is not an instance of HTMLDocument.`);
        }
        const existingStyleEl = document.querySelector(`head style#${id}`);
        if (existingStyleEl) {
            const existingVersion = existingStyleEl.getAttribute('data-version') ?? '';
            if (validateStrict(existingVersion)) {
                return {
                    id,
                    version: existingVersion,
                    element: existingStyleEl
                };
            }
        }
        return void 0;
    }
    // Accessors ------------------------------------------------------------------------------------------------------
    /**
     * Determines if this StyleManager style element is still connected / available.
     *
     * @returns Is StyleManager connected.
     */
    get isConnected() {
        return !!this.#styleElement?.isConnected;
    }
    /**
     * @returns Provides an accessor to get the `textContent` for the style sheet.
     */
    get textContent() {
        return this.#styleElement?.textContent;
    }
    /**
     * @returns Returns the version of this instance.
     */
    get version() {
        return this.#version;
    }
    // Iterator -------------------------------------------------------------------------------------------------------
    /**
     * Allows usage in `for of` loops directly.
     *
     * @returns Entries Map iterator.
     */
    [Symbol.iterator]() {
        return this.entries();
    }
    // Methods --------------------------------------------------------------------------------------------------------
    /**
     * Provides a copy constructor to duplicate an existing StyleManager instance into a new document.
     *
     * @param   options - Required clone options.
     *
     * @returns New style manager instance or undefined if not connected.
     */
    clone({ document, force = false, warn = false }) {
        if (!this.isConnected) {
            StyleManager.#log(warn, 'clone', `This style manager instance is not connected for id: ${this.#id}`);
            return void 0;
        }
        if (!CrossWindow.isDocument(document)) {
            throw new TypeError(`'document' is not an instance of HTMLDocument.`);
        }
        const rules = {};
        for (const key of this.#cssRuleMap.keys()) {
            const selector = this.#cssRuleMap.get(key)?.selector;
            if (selector) {
                rules[key] = selector;
            }
        }
        const newStyleManager = StyleManager.#createImpl({
            id: this.#id,
            version: this.#version,
            layerName: this.#layerName,
            rules,
            document,
            force,
            warn
        });
        if (newStyleManager) {
            for (const key of this.#cssRuleMap.keys()) {
                if (newStyleManager.#cssRuleMap.has(key)) {
                    const value = this.#cssRuleMap.get(key)?.cssText;
                    const targetRuleManager = newStyleManager.#cssRuleMap.get(key);
                    if (value && targetRuleManager) {
                        targetRuleManager.cssText = value;
                    }
                }
            }
            return newStyleManager;
        }
        return void 0;
    }
    /**
     * @returns RuleManager entries iterator.
     */
    entries() {
        return this.#cssRuleMap.entries();
    }
    /**
     * Retrieves an associated {@link RuleManager} by name.
     *
     * @param   ruleName - Rule name.
     *
     * @returns Associated rule manager for given name or undefined if the rule name is not defined or manager is
     *          unconnected.
     */
    get(ruleName) {
        if (!this.isConnected) {
            return;
        }
        return this.#cssRuleMap.get(ruleName);
    }
    /**
     * Returns whether a {@link StyleManager.CSSRuleManger} exists for the given name.
     *
     * @param ruleName - Rule name.
     *
     * @returns Is there a CSS rule manager with the given name.
     */
    has(ruleName) {
        return this.#cssRuleMap.has(ruleName);
    }
    /**
     * @returns {MapIterator<string>} RuleManager keys iterator.
     */
    keys() {
        return this.#cssRuleMap.keys();
    }
    /**
     * @returns Iterator of all RuleManager instances.
     */
    values() {
        return this.#cssRuleMap.values();
    }
    // Internal Implementation ----------------------------------------------------------------------------------------
    /**
     * Internal `create` implementation with additional `force` option to override any version check.
     *
     * @param   options - Options.
     *
     * @returns Created style manager instance or undefined if already exists with a higher version.
     */
    static #createImpl({ id, rules, version, layerName, document = window.document, force = false, warn = false }) {
        if (typeof id !== 'string') {
            throw new TypeError(`'id' is not a string.`);
        }
        if (!isObject(rules)) {
            throw new TypeError(`'rules' is not an object.`);
        }
        if (!CrossWindow.isDocument(document)) {
            throw new TypeError(`'document' is not an instance of HTMLDocument.`);
        }
        if (!validateStrict(version)) {
            throw new TypeError(`'version' is not a valid semver string.`);
        }
        if (typeof force !== 'boolean') {
            throw new TypeError(`'force' is not a boolean.`);
        }
        if (typeof warn !== 'boolean') {
            throw new TypeError(`'warn' is not a boolean.`);
        }
        if (layerName !== void 0 && typeof layerName !== 'string') {
            throw new TypeError(`'layerName' is not a string.`);
        }
        const current = this.exists({ id, document });
        if (isObject(current)) {
            // Remove all existing CSS rules / text if the version is greater than the existing version or `force` is true.
            if (force || compare(version, current.version, '>')) {
                current.element?.remove?.();
                return this.#initializeCreate(document, id, rules, version, layerName);
            }
            else {
                this.#log(warn, 'create', `Could not create instance as one already exists with a higher version for ID: ${id}.`);
                // A style manager already exists that is a greater version than requested.
                return void 0;
            }
        }
        else {
            return this.#initializeCreate(document, id, rules, version, layerName);
        }
    }
    /**
     * @param document - Target Document.
     *
     * @param id - Associated CSS ID
     *
     * @param range - SemVer version or version range.
     *
     * @param warn - When true, log warnings.
     *
     * @returns Style manager connected to existing element / style rules or undefined if no connection possible.
     */
    static #initializeConnect(document, id, range, warn = false) {
        const styleElement = document.querySelector(`head style#${id}`);
        if (!styleElement || styleElement?.sheet === null) {
            this.#log(warn, 'connect', `Could not find existing style element for id: ${id}`);
            return void 0;
        }
        const existingRules = styleElement._tjsRules;
        const existingVersion = styleElement._tjsVersion;
        const existingLayerName = styleElement._tjsLayerName;
        let targetSheet = styleElement.sheet;
        if (!isObject(existingRules)) {
            this.#log(warn, 'connect', `Could not find rules configuration on existing style element for id: ${id}`);
            return void 0;
        }
        if (!validateStrict(existingVersion)) {
            this.#log(warn, 'connect', `Could not find version on existing style element for id: ${id}`);
            return void 0;
        }
        if (existingLayerName !== void 0 && typeof existingLayerName !== 'string') {
            this.#log(warn, 'connect', `Could not find layer name on existing style element for id: ${id}`);
            return void 0;
        }
        if (!satisfies(existingVersion, range)) {
            this.#log(warn, 'connect', `Requested range (${range}) does not satisfy existing version: ${existingVersion}`);
            return void 0;
        }
        // TS type guard.
        if (!CrossWindow.isCSSStyleSheet(targetSheet)) {
            return void 0;
        }
        const cssRuleMap = new Map();
        // Reverse the rule object to find the actual CSS rules below.
        const reverseRuleMap = new Map(Object.entries(existingRules).map(([key, value]) => [value, key]));
        try {
            if (typeof existingLayerName) {
                let foundLayer = false;
                for (const rule of Array.from(targetSheet.cssRules)) {
                    if (CrossWindow.isCSSLayerBlockRule(rule) && rule.name === existingLayerName) {
                        targetSheet = rule;
                        foundLayer = true;
                    }
                }
                if (!foundLayer) {
                    this.#log(warn, 'connect', `Could not find CSSLayerBlockRule for existing layer name: ${existingLayerName}`);
                    return void 0;
                }
            }
            for (const cssRule of Array.from(targetSheet.cssRules)) {
                if (!CrossWindow.isCSSStyleRule(cssRule)) {
                    continue;
                }
                const selector = cssRule?.selectorText;
                if (reverseRuleMap.has(selector)) {
                    const ruleName = reverseRuleMap.get(selector);
                    cssRuleMap.set(ruleName, new RuleManager(cssRule, ruleName, selector));
                    reverseRuleMap.delete(selector);
                }
            }
            // Check if all registered rules have been found.
            if (reverseRuleMap.size > 0) {
                this.#log(warn, 'connect', `Could not find CSSStyleRules for these rule configurations: ${JSON.stringify([...reverseRuleMap])}`);
                return void 0;
            }
            return new StyleManager({
                cssRuleMap,
                id,
                version: existingVersion,
                layerName: existingLayerName,
                styleElement,
                token: StyleManager.#CTOR_TOKEN
            });
        }
        catch (error) {
            console.error(`TyphonJS Runtime [StyleManager error]: Please update your browser to the latest version.`, error);
        }
        return void 0;
    }
    /**
     * @param document - Target Document.
     *
     * @param id - Associated CSS ID
     *
     * @param rules -
     *
     * @param version -
     *
     * @param layerName -
     *
     * @returns New StyleManager instance.
     */
    static #initializeCreate(document, id, rules, version, layerName) {
        const styleElement = document.createElement('style');
        styleElement.id = id;
        styleElement.setAttribute('data-version', String(version));
        styleElement._tjsRules = rules;
        styleElement._tjsVersion = version;
        styleElement._tjsLayerName = layerName;
        document.head.append(styleElement);
        let targetSheet;
        // Type guard for TS.
        if (styleElement.sheet === null) {
            return void 0;
        }
        const cssRuleMap = new Map();
        try {
            if (layerName) {
                const index = styleElement.sheet.insertRule(`@layer ${layerName} {}`);
                targetSheet = styleElement.sheet.cssRules[index];
            }
            else {
                targetSheet = styleElement.sheet;
            }
            if (rules) {
                for (const ruleName in rules) {
                    const selector = rules[ruleName];
                    const index = targetSheet.insertRule(`${selector} {}`);
                    const cssRule = targetSheet.cssRules[index];
                    cssRuleMap.set(ruleName, new RuleManager(cssRule, ruleName, selector));
                }
            }
            return new StyleManager({
                cssRuleMap,
                id,
                version,
                layerName,
                styleElement,
                token: StyleManager.#CTOR_TOKEN
            });
        }
        catch (error) {
            console.error(`TyphonJS Runtime [StyleManager error]: Please update your browser to the latest version.`, error);
            // Clean up: remove the <style> from the DOM.
            if (styleElement && styleElement.parentNode) {
                styleElement.remove();
            }
        }
        return void 0;
    }
    /**
     * @param   warn - When true, log warnings.
     *
     * @param   path - Particular interaction path for warning.
     *
     * @param   message - Message to log.
     */
    static #log(warn, path, message) {
        if (warn) {
            console.warn(`[TRL StyleManager] ${path} warning: ${message}`);
        }
    }
}

var _a, _b;
/**
 * Dynamically parses and indexes a `CSSStyleSheet` at runtime, exposing a selector-to-style mapping by
 * individual selector parts. CSS variable resolution is also possible which enables the ability to flatten and
 * resolve complex nested `var(--...)` chains defined across multiple selectors and layers.
 *
 * When retrieving specific selector styles via {@link StyleSheetResolve.get} and {@link StyleSheetResolve.getProperty}
 * it is possible to provide additional parent selectors that may define scoped CSS variables. These parent variable
 * definitions will be substituted in the target selector data allowing specific element scoping of CSS variables to be
 * flattened.
 *
 * Current fallback support includes recursive var(--a, var(--b, ...)) chains with graceful partial substitution if
 * some variables are undefined. This maintains correctness without introducing ambiguity or needing a complete AST
 * based parser.
 *
 * By default, when parsing CSSStyleSheet instances relative URL rewriting occurs converting `url(...)` references to
 * absolute paths based on the `CSSStyleSheet.href` or the `baseHref` parse option for inline / synthetic
 * CSSStyleSheets. You may turn off relative URL rewriting via setting the `urlRewrite` parse option to `false`.
 *
 * By default, simple media queries / `@media` rules are parsed when all conditions are `prefers-*` features and the
 * media query matches at runtime via `window.matchMedia(...)`. Mixed conditions (IE with screen, width, etc.) are
 * ignored by design. Only direct style rules under a media query are parsed. You may turn off media query parsing via
 * setting the `mediaQuery` parse option to false.
 *
 * --------
 *
 * The goal of this implementation is to realize a regex-based parser with small code size, minimal memory footprint,
 * speed, and reasonable accuracy.
 *
 * Core features:
 * - Parses all or specific relevant `@layer` blocks.
 * - Provides both direct and resolved access to styles via `.get()` and `.getProperty()`.
 * - Automatically rewrites relative URLs / `url(...)` references to absolute paths.
 *
 * Parse Options:
 * - Can set a base `href` for inline / synthetic CSSStyleSheets being processed via `baseHref` option.
 * - Can filter out and exclude undesired CSS selector parts for parsing via `excludeSelectorParts` option.
 * - Can filter out and include just desired CSS layers via `includeCSSLayers` option.
 * - Can filter out and include just desired CSS selector parts via `includeSelectorPartSet` option.
 * - Can disable relative URL rewriting by setting `urlRewrite` option to `false`.
 *
 * Access Options:
 * - Can return style property keys in camel case via `camelCase` option.
 * - Can limit the depth of resolved CSS variables across parent-selector fallback chains via `depth` option.
 * - Enables resolution of scoped CSS variables using a parent-selector fallback chain via `resolve` option.
 * - Can enable cyclic dependency detection warnings when resolving CSS variables via `warnCycles` option.
 * - Can enable warnings for non-existent parent-selector fallback lookup via `warnResolve` option.
 *
 * @example
 * ```js
 * import { StyleSheetResolve } from '#runtime/util/dom/style';
 *
 * // Parse first stylesheet in the browser `document`.
 * const parsedStyles = StyleSheetResolve.parse(document.styleSheets[0]);
 *
 * // The `props` object has styles w/ CSS variables resolved from `input[type="text"]` for the dark theme.
 * const props = parsedStyles.get('input[type="text"]', { resolve: '.themed.theme-dark input' });
 * ```
 *
 * @privateRemarks
 * This implementation avoids a full AST parser for `var(--...)` fallback expressions to keep the codebase compact. If
 * future requirements include resolving deeply nested fallbacks, debug tracing, or custom resolution behavior, I'll
 * consider replacing this logic with a dedicated AST parser and visitor pattern. An AST-based approach would offer more
 * flexibility and maintainability at the cost of slightly increased complexity and larger runtime memory footprint.
 */
class StyleSheetResolve {
    /**
     * Detects hyphen-case separator for camel case property key conversion.
     */
    static #HYPHEN_CASE_REGEX = /-([a-z])/g;
    /**
     * Detects just a single `(prefers-*)` CSSMediaRule condition.
     */
    static #MEDIA_RULE_PREFERS = /^\s*\(?\s*prefers-[^)]+(?:\s*:\s*[^)]+)?\)?\s*$/i;
    /**
     * Detects relative `url()` references in CSSStyleRule `cssText`.
     */
    static #URL_DETECTION_REGEX = /\burl\(\s*(['"]?)(?!data:|https?:|\/|#)/i;
    /**
     * Captures contents of `url()` references.
     */
    static #URL_REGEX = /url\((['"]?)([^'")]+)\1\)/g;
    /**
     * Internal tracking of frozen state; once frozen, no more modifications are possible.
     */
    #frozen = false;
    /**
     * Parsed selector to associated style properties.
     */
    #sheetMap = new Map();
    /**
     * Parse a CSSStyleSheet instance with the given options or accept a pre-filled Map generating a new
     * `StyleSheetResolve` instance.
     *
     * @param styleSheetOrMap - The stylesheet instance to parse or an existing parsed stylesheet Map.
     *
     * @param [options] - Options for parsing stylesheet.
     *
     * @returns {StyleSheetResolve} New instance with the given parsed data.
     */
    static parse(styleSheetOrMap, options = {}) {
        return new _a().parse(styleSheetOrMap, options);
    }
    /**
     * Instantiate an empty `StyleSheetResolve` instance.
     */
    constructor() { }
    // Accessors ------------------------------------------------------------------------------------------------------
    /**
     * @returns Current frozen state; when true no more modifications are possible.
     */
    get frozen() {
        return this.#frozen;
    }
    /**
     * @returns Returns the size / count of selector properties tracked.
     */
    get size() {
        return this.#sheetMap.size;
    }
    // Iterator -------------------------------------------------------------------------------------------------------
    /**
     * Allows usage in `for of` loops directly.
     *
     * @returns Entries Map iterator.
     */
    *[Symbol.iterator]() {
        // Use `entries()` to make a shallow copy of data.
        yield* this.entries();
    }
    // Methods --------------------------------------------------------------------------------------------------------
    /**
     * Clears any existing parsed styles.
     */
    clear() {
        if (this.#frozen) {
            throw new Error('Cannot modify a frozen StyleSheetResolve instance.');
        }
        this.#sheetMap.clear();
    }
    /**
     * Clones this instance returning a new `StyleSheetResolve` instance with a copy of the data.
     *
     * @returns Cloned instance.
     */
    clone() {
        return _a.parse(this.#clone(this.#sheetMap));
    }
    /**
     * Deletes an entry in the parsed stylesheet Map.
     *
     * @param   selector - Selector key to delete.
     *
     * @returns Success state.
     */
    delete(selector) {
        if (this.#frozen) {
            throw new Error('Cannot modify a frozen StyleSheetResolve instance.');
        }
        return this.#sheetMap.delete(selector);
    }
    /**
     * Entries iterator of selector / style properties objects.
     *
     * @returns {MapIterator<[string, { [key: string]: string }]>} Tracked CSS selector key / value iterator.
     * @yields
     */
    *entries() {
        // Ensure a shallow copy of style properties.
        for (const key of this.#sheetMap.keys()) {
            yield [key, { ...this.#sheetMap.get(key) }];
        }
    }
    /**
     * Freezes this instance disallowing further modifications to the stylesheet data.
     */
    freeze() {
        /* c8 ignore next 1 */
        if (this.#frozen) {
            return;
        }
        this.#frozen = true;
        for (const props of this.#sheetMap.values()) {
            Object.freeze(props);
        }
        Object.freeze(this.#sheetMap);
    }
    /**
     * Gets all properties associated with the given selector(s). You may combine multiple selectors for a
     * combined result. You may also provide additional selectors as the `resolve` option to substitute any CSS variables
     * in the target selector(s).
     *
     * @param selector - A selector or list of selectors to retrieve.
     *
     * @param [options] - Options.
     *
     * @returns Style properties object or undefined.
     */
    get(selector, { camelCase = false, depth, resolve, warnCycles = false, warnResolve = false } = {}) {
        if (typeof selector !== 'string' && !isIterable(selector)) {
            throw new TypeError(`'selector' must be a string or an iterable list of strings.`);
        }
        if (typeof camelCase !== 'boolean') {
            throw new TypeError(`'camelCase' must be a boolean.`);
        }
        if (depth !== void 0 && (!Number.isInteger(depth) || depth < 1)) {
            throw new TypeError(`'depth' must be a positive integer >= 1.`);
        }
        if (resolve !== void 0 && typeof resolve !== 'string' && !isIterable(resolve)) {
            throw new TypeError(`'resolve' must be a string or an iterable list of strings.`);
        }
        if (typeof warnCycles !== 'boolean') {
            throw new TypeError(`'warnCycles' must be a boolean.`);
        }
        if (typeof warnResolve !== 'boolean') {
            throw new TypeError(`'warnResolve' must be a boolean.`);
        }
        let result = void 0;
        if (isIterable(selector)) {
            for (const entry of selector) {
                // If there is a direct selector match, then return a value immediately.
                if (this.#sheetMap.has(entry)) {
                    result = Object.assign(result ?? {}, this.#sheetMap.get(entry));
                }
            }
        }
        else {
            // If there is a direct selector match, then return a value immediately.
            if (this.#sheetMap.has(selector)) {
                result = Object.assign(result ?? {}, this.#sheetMap.get(selector));
            }
        }
        if (result && (typeof resolve === 'string' || isIterable(resolve))) {
            const resolveList = typeof resolve === 'string' ? [resolve] : Array.from(resolve);
            depth = typeof depth === 'number' ? depth : Math.max(1, resolveList.length);
            const resolveData = {
                parentNotFound: new Set(),
                seenCycles: new Set(),
                warnCycles
            };
            // Progressively resolve CSS variables up to the requested depth.
            for (let cntr = 0; cntr < depth && cntr < resolveList.length; cntr++) {
                this.#resolve(result, resolveList, resolveData);
            }
            if (resolveData.parentNotFound.size > 0) {
                console.warn(`[TyphonJS Runtime] StyleSheetResolve - resolve - Could not locate parent selector(s) for resolution: '${[...resolveData.parentNotFound].join(', ')}'`);
            }
        }
        // Potentially convert property keys to camel case.
        if (result && camelCase) {
            const remapped = {};
            const toUpper = (_, str) => str.toUpperCase();
            for (const key in result) {
                const mappedKey = key.startsWith('--') ? key : key.replace(_a.#HYPHEN_CASE_REGEX, toUpper);
                remapped[mappedKey] = result[key];
            }
            result = remapped;
        }
        return result;
    }
    /**
     * Gets a specific property value from the given `selector` and `property` key.
     *
     * @param   selector - A selector or list of selectors to retrieve.
     *
     * @param   property - Specific property to locate.
     *
     * @param   [options] - Options.
     *
     * @returns Style property value.
     */
    getProperty(selector, property, options) {
        const data = this.get(selector, options);
        return isObject(data) && property in data ? data[property] : void 0;
    }
    /**
     * Test if `StyleSheetResolve` tracks the given selector.
     *
     * @param   selector - CSS selector to check.
     *
     * @returns StyleSheetResolve tracks the given selector.
     */
    has(selector) {
        return this.#sheetMap.has(selector);
    }
    /**
     * @returns Tracked CSS selector keys iterator.
     */
    keys() {
        return this.#sheetMap.keys();
    }
    /**
     * Merges selectors and style properties from another StyleSheetResolve instance into this one. By default, the
     * source of the merge overrides existing properties. You may choose to preserve existing values along with
     * specifying exact selector matches.
     *
     * @param   source - Another instance to merge from.
     *
     * @param   [options] - Options.
     *
     * @returns This instance.
     */
    merge(source, { exactMatch = false, strategy = 'override' } = {}) {
        if (this.#frozen) {
            throw new Error('Cannot modify a frozen StyleSheetResolve instance.');
        }
        if (!(source instanceof _a)) {
            throw new TypeError(`'source' is not a StyleSheetResolve instance.`);
        }
        for (const selectorPart of source.keys()) {
            if (exactMatch && !this.#sheetMap.has(selectorPart)) {
                continue;
            }
            // Directly retrieve the stored object.
            const incoming = source.#sheetMap.get(selectorPart);
            /* c8 ignore next 1 */ // Sanity check.
            if (!incoming) {
                continue;
            }
            /* c8 ignore next 1 */ // `?? {}` is for sanity.
            const current = this.#sheetMap.get(selectorPart) ?? {};
            // For preserve strategy, make a copy of the incoming data in the case that the source is frozen.
            const merged = strategy === 'preserve' ? Object.assign({}, { ...incoming }, current) :
                Object.assign({}, current, incoming);
            this.#sheetMap.set(selectorPart, merged);
        }
        return this;
    }
    /**
     * Clears existing stylesheet mapping and parses the given stylesheet or Map.
     *
     * @param   styleSheetOrMap - The stylesheet element to parse or an existing parsed stylesheet Map.
     *
     * @param   [options] - Options for parsing stylesheet.
     *
     * @returns This instance.
     */
    parse(styleSheetOrMap, options = {}) {
        if (this.#frozen) {
            throw new Error('Cannot modify a frozen StyleSheetResolve instance.');
        }
        this.#sheetMap.clear();
        if (!CrossWindow.isCSSStyleSheet(styleSheetOrMap) && !CrossWindow.isMap(styleSheetOrMap)) {
            throw new TypeError(`'styleSheetOrMap' must be a 'CSSStyleSheet' instance or a parsed Map of stylesheet entries.`);
        }
        if (!isObject(options)) {
            throw new TypeError(`'options' is not an object.`);
        }
        if (options.baseHref !== void 0 && typeof options.baseHref !== 'string') {
            throw new TypeError(`'baseHref' must be a string.`);
        }
        if (options.excludeSelectorParts !== void 0 && !isIterable(options.excludeSelectorParts)) {
            throw new TypeError(`'excludeSelectorParts' must be a list of RegExp instances.`);
        }
        if (options.includeCSSLayers !== void 0 && !isIterable(options.includeCSSLayers)) {
            throw new TypeError(`'includeCSSLayers' must be a list of RegExp instances.`);
        }
        if (options.includeSelectorPartSet !== void 0 && !CrossWindow.isSet(options.includeSelectorPartSet)) {
            throw new TypeError(`'includeSelectorPartSet' must be a Set of strings.`);
        }
        if (options.mediaQuery !== void 0 && typeof options.mediaQuery !== 'boolean') {
            throw new TypeError(`'mediaQuery' must be a boolean.`);
        }
        if (options.urlRewrite !== void 0 && typeof options.urlRewrite !== 'boolean') {
            throw new TypeError(`'urlRewrite' must be a boolean.`);
        }
        if (CrossWindow.isCSSStyleSheet(styleSheetOrMap)) {
            this.#parse(styleSheetOrMap, options);
        }
        else if (CrossWindow.isMap(styleSheetOrMap)) {
            this.#sheetMap = this.#clone(styleSheetOrMap);
        }
        return this;
    }
    /**
     * Directly sets a selector key with the given style properties object.
     *
     * @param   selector - A single selector key to set.
     *
     * @param   styleObj - Style data object of property / value pairs.
     */
    set(selector, styleObj) {
        if (this.#frozen) {
            throw new Error('Cannot modify a frozen StyleSheetResolve instance.');
        }
        if (typeof selector !== 'string') {
            throw new TypeError(`'selector' must be a string.`);
        }
        if (!isObject(styleObj)) {
            throw new TypeError(`'styleObj' must be an object.`);
        }
        this.#sheetMap.set(selector, styleObj);
    }
    // Internal Implementation ----------------------------------------------------------------------------------------
    /**
     * Shallow clone of source Map into target Map.
     *
     * @param   sourceMap - Source Map.
     *
     * @param   [targetMap] - Target Map.
     *
     * @returns Shallow copy cloned Map.
     */
    #clone(sourceMap, targetMap = new Map()) {
        // Shallow copy.
        for (const [selector, props] of sourceMap.entries()) {
            targetMap.set(selector, { ...props });
        }
        return targetMap;
    }
    /**
     * Parses the given CSSStyleSheet instance.
     *
     * @param styleSheet - The stylesheet to parse.
     *
     * @param [opts] - Options for parsing stylesheet.
     */
    #parse(styleSheet, opts) {
        // Convert to consistent sanitized options data data.
        const options = {
            baseHref: styleSheet.href ?? opts.baseHref,
            excludeSelectorParts: isIterable(opts.excludeSelectorParts) ? Array.from(opts.excludeSelectorParts) : [],
            includeCSSLayers: isIterable(opts.includeCSSLayers) ? Array.from(opts.includeCSSLayers) : [],
            includeSelectorPartSet: CrossWindow.isSet(opts.includeSelectorPartSet) ? opts.includeSelectorPartSet :
                new Set(),
            mediaQuery: opts.mediaQuery ?? true,
            urlRewrite: opts.urlRewrite ?? true
        };
        const rules = styleSheet.cssRules;
        const allStyleRules = [];
        // Collect all CSSStyleRules.
        for (let i = 0; i < rules.length; i++) {
            const rule = rules[i];
            switch (rule.constructor.name) {
                case 'CSSLayerBlockRule':
                    this.#processLayerBlockRule(rule, void 0, allStyleRules, options);
                    break;
                case 'CSSMediaRule':
                    this.#processMediaRule(rule, allStyleRules, options);
                    break;
                case 'CSSStyleRule':
                    allStyleRules.push(rule);
                    break;
            }
        }
        // Bulk process all CSSStyleRules and build the map of selectors to properties.
        this.#processStyleRules(allStyleRules, options);
    }
    /**
     * Recursively parses / processes a CSSLayerBlockRule and encountered CSSStyleRule entries.
     *
     * @param   blockRule - The `CSSLayerBlockRule` to parse.
     *
     * @param   parentLayerName - Name of parent CSS layer.
     *
     * @param   allStyleRules - All style rules to process.
     *
     * @param   opts - Sanitized process options.
     */
    #processLayerBlockRule(blockRule, parentLayerName, allStyleRules, opts) {
        const fullname = typeof parentLayerName === 'string' ? `${parentLayerName}.${blockRule.name}` : blockRule.name;
        const includeLayer = opts.includeCSSLayers.length === 0 ||
            opts.includeCSSLayers.some((regex) => regex.test(fullname));
        const layerBlockRules = [];
        const rules = blockRule.cssRules;
        for (let i = 0; i < rules.length; i++) {
            const rule = rules[i];
            switch (rule.constructor.name) {
                case 'CSSLayerBlockRule':
                    layerBlockRules.push(rule);
                    break;
                case 'CSSMediaRule':
                    this.#processMediaRule(rule, allStyleRules, opts);
                    break;
                case 'CSSStyleRule':
                    if (includeLayer) {
                        allStyleRules.push(rule);
                    }
                    break;
            }
        }
        for (let i = 0; i < layerBlockRules.length; i++) {
            this.#processLayerBlockRule(layerBlockRules[i], fullname, allStyleRules, opts);
        }
    }
    /**
     * Simple processing of a CSSMediaRule and directly nested CSSStyleRule entries.
     *
     * @param   mediaRule - The `CSSMediaRule` to parse.
     *
     * @param   allStyleRules - All style rules to process.
     *
     * @param   opts - Sanitized process options.
     */
    #processMediaRule(mediaRule, allStyleRules, opts) {
        if (!opts.mediaQuery) {
            return;
        }
        // Skip if the media rule does not match the current environment.
        if (!window.matchMedia(mediaRule.media.mediaText).matches) {
            return;
        }
        // Currently just singular `(prefers-*)` conditions are allowed.
        if (!_a.#MEDIA_RULE_PREFERS.test(mediaRule.media.mediaText)) {
            return;
        }
        const rules = mediaRule.cssRules;
        for (let i = 0; i < rules.length; i++) {
            const rule = rules[i];
            switch (rule.constructor.name) {
                case 'CSSStyleRule':
                    allStyleRules.push(rule);
                    break;
            }
        }
    }
    /**
     * Processes all collected `CSSStyleRules`.
     *
     * @param   allStyleRules - Style rules to parse.
     *
     * @param   opts - ProcessOptions.
     */
    #processStyleRules(allStyleRules, opts) {
        for (let i = 0; i < allStyleRules.length; i++) {
            const styleRule = allStyleRules[i];
            // Split selector parts and remove disallowed selector parts and empty strings.
            const selectorParts = StyleParse.selectorText(styleRule.selectorText, opts);
            if (selectorParts.length) {
                // Parse CSSStyleDeclaration.
                const result = StyleParse.cssText(styleRule.style.cssText);
                // Only convert `url()` references if `urlRewrite` is true, baseHref` is defined, and relative `url()`
                // detected in `cssText`.
                if (opts.urlRewrite && opts.baseHref &&
                    _a.#URL_DETECTION_REGEX.test(styleRule.style.cssText)) {
                    this.#processStyleRuleUrls(result, opts);
                }
                for (let j = selectorParts.length; --j >= 0;) {
                    const part = selectorParts[j];
                    if (this.#sheetMap.has(part)) {
                        Object.assign(this.#sheetMap.get(part), result);
                    }
                    else {
                        this.#sheetMap.set(part, result);
                    }
                }
            }
        }
    }
    /**
     * Resolve relative `url(...)` references in CSS property values based on the stylesheet origin.
     *
     * This method rewrites relative paths in `url(...)` to absolute paths (IE `/assets/img.png`) using the
     * CSSStyleSheet `href` when available or falling back to the provided `baseHref` for inline stylesheets.
     *
     * @param result - Parsed CSS property key-value map.
     *
     * @param opts - Processing options.
     */
    #processStyleRuleUrls(result, opts) {
        const baseHref = opts.baseHref;
        for (const key in result) {
            let value = result[key];
            // Fast skip if there's no 'url(' substring.
            if (value.indexOf('url(') === -1) {
                continue;
            }
            // Avoid regex test if no reason to rewrite (IE relative URLs)
            if (!_a.#URL_DETECTION_REGEX.test(value)) {
                continue;
            }
            // Only assign back to result if value changes.
            let modified = false;
            value = value.replace(_a.#URL_REGEX, (match, quote, relPath) => {
                try {
                    // Convert the relative path to an absolute pathname using the resolved baseHref.
                    const absPath = new URL(relPath, baseHref).pathname;
                    modified = true;
                    return `url(${quote}${absPath}${quote})`;
                    /* c8 ignore next 6 */
                }
                catch {
                    // If resolution fails return the original value unchanged.
                    return match;
                }
            });
            if (modified) {
                result[key] = value;
            }
        }
    }
    /**
     * Resolves intermediate CSS variables defined in the `result` style properties object with data from the given
     * `resolve` selector(s).
     *
     * @param   result - Copy of source selector style properties to resolve.
     *
     * @param   resolve - Parent CSS variable resolution selectors.
     *
     * @param   resolveData - Resolution data.
     */
    #resolve(result, resolve, resolveData) {
        // Collect all parent-defined CSS variables.
        const parentVars = {};
        for (let i = 0; i < resolve.length; i++) {
            const entry = resolve[i];
            const parent = this.get(entry);
            // Verify that the parent lookup is available otherwise add selector to `not found` Set.
            if (!isObject(parent)) {
                resolveData.parentNotFound.add(entry);
                continue;
            }
            for (const key in parent) {
                if (key.startsWith('--')) {
                    parentVars[key] = parent[key];
                }
            }
        }
        // Track and resolve variables used in the result.
        const cssVars = new ResolveVars(result, parentVars, resolveData);
        /* c8 ignore next 1 */
        if (!cssVars.unresolvedCount) {
            return;
        }
        for (const key in parentVars) {
            cssVars.set(key, parentVars[key]);
        }
        Object.assign(result, cssVars.resolved);
    }
}
_a = StyleSheetResolve;
/**
 * Encapsulates CSS variable resolution logic and data.
 */
class ResolveVars {
    /**
     * Detect CSS variable.
     */
    static #DETECT_CSS_VAR_REGEX = /--[\w-]+/g;
    /**
     * Capture CSS variable fallbacks.
     */
    static #CSS_VAR_FALLBACK_REGEX = /^var\((?<varName>--[\w-]+)\s*,\s*(?<fallback>.+?)\)$/;
    /**
     * Replace CSS variable fallbacks.
     */
    static #CSS_VAR_FALLBACK_REPLACE_REGEX = /var\((--[\w-]+)(?:\s*,\s*[^()]*?)?\)/g;
    /**
     * Closed CSS variable.
     */
    static #CSS_VAR_REGEX = /^var\((--[\w-]+)\)$/;
    /**
     * Open CSS variable.
     */
    static #CSS_VAR_PARTIAL_REGEX = /^var\((--[\w-]+)/;
    /**
     * Prevent deep fallback recursion.
     */
    static #MAX_FALLBACK_DEPTH = 10;
    /**
     * Initial style properties w/ CSS variables to track.
     */
    #propMap = new Map();
    /**
     * Reverse lookup for CSS variable name to associated property.
     */
    #varToProp = new Map();
    /**
     * Resolved CSS variable from parent selector properties.
     */
    #varResolved = new Map();
    #parentVars;
    #resolveData;
    /**
     * @param initial - Initial style entry to resolve.
     *
     * @param parentVars - All parent resolution vars.
     *
     * @param resolveData - Resolution data.
     */
    constructor(initial, parentVars, resolveData) {
        this.#parentVars = parentVars;
        this.#resolveData = resolveData;
        // Build the reverse dependency map of which CSS variables (--x) are referenced by each style property.
        // This enables efficient tracking of what properties depend on what variables.
        for (const prop in initial) {
            const value = initial[prop];
            let match;
            _b.#DETECT_CSS_VAR_REGEX.lastIndex = 0; // Reset if reused
            let found = false;
            while ((match = _b.#DETECT_CSS_VAR_REGEX.exec(value))) {
                const entry = match[0];
                if (!this.#varToProp.has(entry))
                    this.#varToProp.set(entry, new Set());
                this.#varToProp.get(entry).add(prop);
                found = true;
            }
            if (found)
                this.#propMap.set(prop, value);
        }
    }
    /**
     * Resolves properties in `#propMap` by substituting var(...) expressions using resolved values in #varResolved. If
     * no resolution is available, attempts to preserve fallback expressions in their original var(...) form.
     *
     * Supports chained fallbacks like: var(--a, var(--b, var(--c, red))) and resolving variables in statements like
     * `calc(1rem + var(--x))`.
     *
     * @returns All fields that have been resolved.
     */
    get resolved() {
        const result = {};
        // Attempt to resolve each CSS variable found in style properties. If resolution is known, then substitute it
        // otherwise check for fallback chains.
        for (const entry of this.#varToProp.keys()) {
            const props = this.#varToProp.get(entry);
            const varResolved = this.#varResolved.get(entry);
            /* c8 ignore next 1 */
            if (!props) {
                continue;
            }
            // Direct resolution: replace all `var(--x)` forms in all dependent properties with the resolved value.
            if (varResolved) {
                for (const prop of props) {
                    let value = this.#propMap.get(prop);
                    if (value.indexOf(`var(${entry}`) !== -1) {
                        // Replace each `var(--x[, fallback])` with its resolved value (if available).
                        // Fallbacks are preserved unless fully resolvable, enabling partial resolution of chained vars.
                        value = value.replace(_b.#CSS_VAR_FALLBACK_REPLACE_REGEX, (match) => {
                            // Extract the CSS variable name (`--x`) from the matched `var(--x[, fallback])` expression.
                            const varName = match.match(_b.#CSS_VAR_PARTIAL_REGEX)?.[1];
                            const resolved = this.#varResolved.get(varName);
                            /* c8 ignore next 1 */ // `?? match` is a sanity fallback.
                            return resolved ?? match;
                        });
                    }
                    this.#propMap.set(prop, value);
                    result[prop] = value;
                }
            }
            // Unresolved var: check if fallback exists (`var(--x, red)`), and resolve nested fallback chains if present.
            else {
                for (const prop of props) {
                    const value = this.#propMap.get(prop);
                    // Early out if no fallback to resolve.
                    if (value.indexOf(`var(${entry}`) === -1) {
                        continue;
                    }
                    const fallback = this.#resolveNestedFallback(value);
                    this.#propMap.set(prop, fallback);
                    result[prop] = fallback;
                }
            }
        }
        return result;
    }
    /**
     * @returns Unresolved field count.
     */
    get unresolvedCount() {
        let count = 0;
        for (const entry of this.#varToProp.keys()) {
            if (!this.#varResolved.has(entry)) {
                count++;
            }
        }
        return count;
    }
    /**
     * Sets the parent selector defined CSS variable for resolution.
     *
     * @param name - CSS variable name
     *
     * @param value - Value of target CSS variable.
     */
    set(name, value) {
        /* c8 ignore next 1 */
        if (typeof value !== 'string' || value.length === 0) {
            return;
        }
        if (this.#resolveData.warnCycles) {
            this.#setCycleWarn(name, value);
        }
        else {
            if (this.#varToProp.has(name) && !this.#varResolved.has(name)) {
                this.#varResolved.set(name, value);
            }
        }
    }
    // Internal Implementation ----------------------------------------------------------------------------------------
    /**
     * Performs DFS traversal to detect cycles in CSS variable resolution. Tracks the resolution path and emits a
     * warning if a cycle is found. Each affected property is reported once with its originating chain.
     *
     * @param   value - Value of target CSS variable.
     *
     * @param   visited - Visited CSS variables.
     *
     * @param   seenCycles - Dedupe cyclic dependency warnings.
     *
     * @returns Resolution result or undefined.
     */
    #resolveCycleWarn(value, visited, seenCycles) {
        const match = value.match(_b.#CSS_VAR_REGEX);
        if (!match) {
            return value;
        }
        const next = match[1];
        // Cycle detection: if var is already seen in traversal, then record and warn.
        if (visited.has(next)) {
            // Format cycle signature for deduping.
            const cycleChain = [...visited, next];
            const cycleKey = cycleChain.join('→');
            if (!seenCycles.has(cycleKey)) {
                // Record and deduplicate cycle chains to avoid redundant logs.
                seenCycles.add(cycleKey);
                const affected = cycleChain.flatMap((varName) => Array.from(this.#varToProp.get(varName) ?? []).map((prop) => `- ${prop} (via ${varName})`));
                if (affected.length > 0) {
                    console.warn(`[TyphonJS Runtime] StyleSheetResolve - CSS variable cyclic dependency detected: ${cycleChain.join(' → ')}\nAffected properties:\n${affected.join('\n')}`);
                }
            }
            return void 0;
        }
        visited.add(next);
        // Look up the next variable in the chain to continue DFS. Prefer already-resolved entries.
        const nextValue = this.#varResolved.get(next) ?? this.#parentVars[next];
        /* c8 ignore next 1 */
        if (typeof nextValue !== 'string') {
            return void 0;
        }
        return this.#resolveCycleWarn(nextValue, visited, seenCycles);
    }
    /**
     * Resolve fallback chains of the form: var(--a, var(--b, ...))
     * - Only replaces the top-level var if it is resolved.
     * - Leaves fallback intact if unresolved.
     * - Recursively evaluates nested fallbacks if they are var(...).
     * - Limits recursion depth to prevent cycles or stack overflow.
     *
     * @param   expr - CSS var expression to resolve.
     *
     * @param   depth - Recursion guard
     *
     * @returns Nested fallback resolution result.
     */
    #resolveNestedFallback(expr, depth = 0) {
        /* c8 ignore next 1 */ // Prevent runaway recursion or malformed fallback chains.
        if (depth > _b.#MAX_FALLBACK_DEPTH) {
            return expr;
        }
        // Match top-level var(--x, fallback) expression. Non-greedy match on fallback to avoid trailing garbage.
        const match = expr.match(_b.#CSS_VAR_FALLBACK_REGEX);
        if (!match?.groups) {
            return expr;
        }
        const { varName, fallback } = match.groups;
        const resolved = this.#varResolved.get(varName);
        // If the primary variable is resolved, return the substitution directly ignoring fallback.
        if (resolved !== void 0) {
            return resolved;
        }
        const fallbackTrimmed = fallback.trim();
        // If fallback itself is a var(...) expression, recurse to evaluate it.
        // The result is substituted in-place unless final resolution is still a var(...) chain.
        if (fallbackTrimmed.startsWith('var(')) {
            let nested = this.#resolveNestedFallback(fallbackTrimmed, depth + 1);
            // If the nested result itself is a var(...) with a resolved variable, then resolve again.
            const innerMatch = nested.match(_b.#CSS_VAR_REGEX);
            if (innerMatch) {
                const innerResolved = this.#varResolved.get(innerMatch[1]);
                // If the result of recursion itself is a var(--x) with a known resolution, resolve it again.
                if (innerResolved !== void 0) {
                    nested = innerResolved;
                }
            }
            return `var(${varName}, ${nested})`;
        }
        // Literal fallback: preserve the full var(...) expression with untouched fallback if not further resolvable.
        return `var(${varName}, ${fallbackTrimmed})`;
    }
    /**
     * Sets the parent selector defined CSS variable for resolution with additional cyclic dependency metrics.
     *
     * @param   name - CSS variable name
     *
     * @param   value - Value of target CSS variable.
     */
    #setCycleWarn(name, value) {
        const resolved = this.#resolveCycleWarn(value, new Set([name]), this.#resolveData.seenCycles);
        if (resolved !== void 0 && this.#varToProp.has(name) && !this.#varResolved.has(name)) {
            this.#varResolved.set(name, resolved);
        }
    }
}
_b = ResolveVars;

export { StyleManager, StyleParse, StyleSheetResolve };
//# sourceMappingURL=index.js.map
