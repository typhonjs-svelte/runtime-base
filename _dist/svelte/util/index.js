import { resolveByPredicate } from '@typhonjs-svelte/runtime-base/util/predicate';
import { isRecord, assertObject } from '@typhonjs-svelte/runtime-base/util/object';
import { CrossRealm } from '@typhonjs-svelte/runtime-base/util/realm';
import { group_outros, transition_out, check_outros } from 'svelte/internal';

var _a;
/**
 * Resolves a bindable component property while preserving the provenance of values published by the component.
 *
 * `PropBindingControl` supports component properties that serve as both:
 *
 * - an externally supplied input; and
 * - a value published back to the parent through component binding.
 *
 * This distinction is important when a component resolves a property from multiple sources. Once the component
 * publishes a resolved value back through the bound property, that value must not subsequently be interpreted as a new
 * direct value supplied by the parent.
 *
 * The controller records the last value it published. When {@link resolve} is called, a bound value that differs
 * from the last published value is treated as an external assignment and becomes the highest-precedence direct value.
 * Otherwise, the controller resolves the first valid candidate or returns its component-owned fallback.
 *
 * Resolution precedence is:
 *
 * 1. A valid external assignment to the bindable property.
 * 2. The first valid candidate passed to {@link resolve}.
 * 3. The fallback supplied to the constructor.
 *
 * An invalid external assignment clears any previously established direct value, allowing candidate values or the
 * fallback to become effective again.
 *
 * The controller does not subscribe to, observe, or dispose of resolved values. It only retains references
 * required to track resolution provenance. Consequently, a component-local instance does not require explicit cleanup.
 *
 * @typeParam T - Type accepted by the supplied predicate and returned by the controller.
 *
 * @example Svelte component store resolution
 *
 * ```svelte
 * <script>
 *    import { writable } from 'svelte/store';
 *
 *    import { PropBindingControl } from './PropBindingControl';
 *    import { isMinimalWritableStore } from '#runtime/svelte/store/util';
 *
 *    export let input = {};
 *    export let store = void 0;
 *
 *    const storeControl = new PropBindingControl(
 *       isMinimalWritableStore,
 *       writable(void 0)
 *    );
 *
 *    // A directly supplied `store` takes precedence. Otherwise, `input.store` is selected, followed by the
 *    // component-owned writable fallback.
 *    //
 *    // Assigning the result back to `store` publishes the effective store through `bind:store` without causing
 *    // that published value to become a permanent direct override.
 *    $: store = storeControl.resolve(store, input.store);
 * </script>
 * ```
 */
class PropBindingControl {
    /**
     * Sentinel identifying the absence of a direct or previously published value.
     */
    static unset = Symbol('PropBindingControl.unset');
    /**
     * Component-owned value returned when no direct value or candidate satisfies the predicate.
     */
    #fallback;
    /**
     * Type predicate used to validate all values considered by the controller.
     */
    #predicate;
    /**
     * Last valid value assigned externally through the bindable property.
     *
     * The sentinel indicates that no direct external value is currently active.
     */
    #directValue = _a.unset;
    /**
     * Last effective value returned by {@link resolve} and subsequently published through the bindable property.
     *
     * This value is used to distinguish a component-published assignment from a new external assignment.
     */
    #publishedValue = _a.unset;
    /**
     * Creates a property binding controller.
     *
     * The fallback must satisfy the supplied predicate because it is guaranteed to be returned whenever no
     * higher-precedence value is valid.
     *
     * @param predicate - Type predicate used to validate the bindable property, candidate values, and fallback.
     *
     * @param fallback - Component-owned fallback returned when no direct value or candidate satisfies `predicate`.
     *
     * @throws {@link TypeError} Thrown when `fallback` does not satisfy `predicate`.
     */
    constructor(predicate, fallback) {
        if (!predicate(fallback)) {
            throw new TypeError(`'fallback' does not satisfy the supplied predicate.`);
        }
        this.#predicate = predicate;
        this.#fallback = fallback;
    }
    /**
     * Resolves the effective value and records it as the value published back through the bindable component property.
     *
     * A `boundValue` differing from the value returned by the previous invocation is treated as an external assignment.
     * When valid, it becomes the direct value and takes precedence over all candidates. When invalid, any previous
     * direct value is cleared.
     *
     * When `boundValue` matches the previously published value, it is recognized as the component's own assignment
     * and does not alter direct-value provenance.
     *
     * Candidates are evaluated from left to right. The first candidate accepted by the configured predicate is
     * returned. If neither a direct value nor a candidate is valid, the constructor fallback is returned.
     *
     * The returned value should normally be assigned directly back to the bindable property:
     *
     * ```ts
     * $: store = storeControl.resolve(store, inputOptions.store);
     * ```
     *
     * @param boundValue - Current value of the exported bindable property.
     *
     * @param candidates - Additional candidate values evaluated in descending precedence order.
     *
     * @returns The valid direct value, first valid candidate, or fallback.
     */
    resolve(boundValue, ...candidates) {
        // A value different from the last published value represents an external assignment to the bindable property.
        if (this.#publishedValue === typeof _a.unset || !Object.is(boundValue, this.#publishedValue)) {
            this.#directValue = this.#predicate(boundValue) ? boundValue : _a.unset;
        }
        const resolvedValue = this.#directValue !== _a.unset ? this.#directValue :
            resolveByPredicate(this.#predicate, ...candidates) ?? this.#fallback;
        this.#publishedValue = resolvedValue;
        return resolvedValue;
    }
}
_a = PropBindingControl;

/**
 * Provides utilities to verify and parse {@link TJSSvelte.Config} configuration objects.
 */
class APIConfig {
    constructor() {
        throw new Error('APIConfig constructor: This is a static class and should not be constructed.');
    }
    /**
     * Validates `config` argument whether it is a valid {@link TJSSvelte.Config.Dynamic} or
     * {@link TJSSvelte.Config.Standard} configuration object suitable for parsing by
     * {@link TJSSvelte.API.Config.parseConfig}.
     *
     * @param config - The potential config object to validate.
     *
     * @param [options] - Options.
     *
     * @param [options.raiseException=false] - If validation fails raise an exception.
     *
     * @returns Is the config a valid TJSSvelte.Config.Dynamic or TJSSvelte.Config.Standard configuration object.
     *
     * @throws {TypeError}  Any validation error when `raiseException` is enabled.
     */
    static isConfig(config, { raiseException = false } = {}) {
        if (!isRecord(config)) {
            if (raiseException) {
                throw new TypeError(`TJSSvelte.config.isConfig error: 'config' is not an object.`);
            }
            return false;
        }
        if (!TJSSvelte.util.isComponent(config.class)) {
            if (raiseException) {
                throw new TypeError(`TJSSvelte.config.isConfig error: 'config.class' is not a Svelte component constructor.`);
            }
            return false;
        }
        return true;
    }
    /**
     * Validates `config` argument whether it is a valid {@link TJSSvelte.Config.Embed} configuration object
     * suitable for directly mounting via the `<svelte:component>` directive.
     *
     * @param config - The potential config object to validate.
     *
     * @param [options] - Options.
     *
     * @param [options.raiseException=false] - If validation fails raise an exception.
     *
     * @returns Is the config a valid TJSSvelte.Config.Embed configuration object.
     *
     * @throws {TypeError}  Any validation error when `raiseException` is enabled.
     */
    static isConfigEmbed(config, { raiseException = false } = {}) {
        if (!isRecord(config)) {
            if (raiseException) {
                throw new TypeError(`TJSSvelte.config.isConfigEmbed error: 'config' is not an object.`);
            }
            return false;
        }
        if (!TJSSvelte.util.isComponent(config.class)) {
            if (raiseException) {
                throw new TypeError(`TJSSvelte.config.isConfigEmbed error: 'config.class' is not a Svelte component constructor.`);
            }
            return false;
        }
        if (config.props !== void 0 && !isRecord(config.props)) {
            if (raiseException) {
                throw new TypeError(`TJSSvelte.config.isConfigEmbed error: 'config.props' is not an object.`);
            }
            return false;
        }
        return true;
    }
    /**
     * Parses a TyphonJS Svelte dynamic or standard config object ensuring that the class specified is a Svelte
     * component, loads any dynamic defined `context` or `props` preparing the config object for loading into the
     * Svelte component.
     *
     * @param config - Svelte config object.
     *
     * @param [options] - Options.
     *
     * @param [options.contextExternal] - When true any context data provided will be loaded into `#external`
     *        context separating it from any internal context created by the component.
     *
     * @param [options.thisArg] - `This` reference to set for invoking any `context` or `props` defined as
     *        functions for {@link Config.Dynamic} configuration objects.
     *
     * @returns The processed Svelte config object turned with parsed `props` & `context` converted into the format
     *          supported by Svelte.
     */
    static parseConfig(config, { contextExternal = false, thisArg = void 0 } = {}) {
        assertObject(config, `TJSSvelte.config.parseConfig - 'config' is not an object:\n${JSON.stringify(config)}.`);
        if (!TJSSvelte.util.isComponent(config.class)) {
            throw new TypeError(`TJSSvelte.config.parseConfig - 'class' is not a Svelte component constructor for config:\n${JSON.stringify(config)}.`);
        }
        if (config.intro !== void 0 && typeof config.intro !== 'boolean') {
            throw new TypeError(`TJSSvelte.config.parseConfig - 'intro' is not a boolean for config:\n${JSON.stringify(config)}.`);
        }
        if (config.target !== void 0 && !CrossRealm.browser.isElement(config.target) &&
            !CrossRealm.browser.isShadowRoot(config.target) && !CrossRealm.browser.isDocumentFragment(config.target)) {
            throw new TypeError(`TJSSvelte.config.parseConfig - 'target' is not a Element, ShadowRoot, or DocumentFragment for config:\n${JSON.stringify(config)}.`);
        }
        if (config.anchor !== void 0 && !CrossRealm.browser.isElement(config.anchor) &&
            !CrossRealm.browser.isShadowRoot(config.anchor) && !CrossRealm.browser.isDocumentFragment(config.anchor)) {
            throw new TypeError(`TJSSvelte.config.parseConfig - 'anchor' is not a string, Element for config:\n${JSON.stringify(config)}.`);
        }
        if (config.context !== void 0 && typeof config.context !== 'function' && !isRecord(config.context)) {
            throw new TypeError(`TJSSvelte.config.parseConfig - 'context' is not a function or object for config:\n${JSON.stringify(config)}.`);
        }
        const svelteConfig = { ...config };
        let context = {};
        // If a context callback function is provided then invoke it with `this` being the Foundry app.
        // If an object is returned it adds the entries to external context.
        if (typeof svelteConfig.context === 'function') {
            const contextFunc = svelteConfig.context;
            delete svelteConfig.context;
            const result = contextFunc.call(thisArg);
            if (isRecord(result)) {
                context = { ...result };
            }
            else {
                throw new Error(`TJSSvelte.config.parseConfig - 'context' is a function that did not return an object for config:\n${JSON.stringify(config)}`);
            }
        }
        else if (isRecord(svelteConfig.context)) {
            context = svelteConfig.context;
            delete svelteConfig.context;
        }
        // If a props is a function then invoke it with `this` being the Foundry app.
        // If an object is returned set it as the props.
        svelteConfig.props = this.#processProps(svelteConfig.props, thisArg, config);
        if (contextExternal) {
            svelteConfig.context = new Map();
            svelteConfig.context.set('#external', context);
        }
        else {
            svelteConfig.context = new Map(Object.entries(context));
        }
        return svelteConfig;
    }
    // Internal implementation ----------------------------------------------------------------------------------------
    /**
     * Processes Svelte props. Potentially props can be a function to invoke with `thisArg`.
     *
     * @param props - Svelte props.
     *
     * @param thisArg - `This` reference to set for invoking any props function.
     *
     * @param config - Svelte config
     *
     * @returns Svelte props.
     */
    static #processProps(props, thisArg, config) {
        // If a props is a function then invoke it with `this` being the Foundry app.
        // If an object is returned set it as the props.
        if (typeof props === 'function') {
            const result = props.call(thisArg);
            if (isRecord(result)) {
                return result;
            }
            else {
                throw new Error(`TJSSvelte.config.parseConfig - 'props' is a function that did not return an object for config:\n${JSON.stringify(config)}`);
            }
        }
        else if (isRecord(props)) {
            return props;
        }
        else if (props !== void 0) {
            throw new Error(`TJSSvelte.config.parseConfig - 'props' is not a function or an object for config:\n${JSON.stringify(config)}`);
        }
        return {};
    }
}
Object.seal(APIConfig);

// @ts-ignore
/**
 * Various utilities to duck type / detect Svelte components and run outro transition while destroying a component
 * externally.
 */
class APIUtil {
    constructor() {
        throw new Error('APIUtil constructor: This is a static class and should not be constructed.');
    }
    /**
     * Provides basic duck typing to determine if the provided function is a constructor function for a Svelte
     * component.
     *
     * @param comp - Data to check as a Svelte component.
     *
     * @returns Whether basic duck typing succeeds.
     */
    static isComponent(comp) {
        if (comp === null || comp === void 0 || typeof comp !== 'function') {
            return false;
        }
        // When using Vite in a developer build the SvelteComponent is wrapped in a ProxyComponent class.
        // This class doesn't define methods on the prototype, so we must check if the constructor name
        // starts with `Proxy<` as it provides the wrapped component as `Proxy<_wrapped component name_>`.
        const prototypeName = comp?.prototype?.constructor?.name;
        if (typeof prototypeName === 'string' && (prototypeName.startsWith('Proxy<') ||
            prototypeName === 'ProxyComponent')) {
            return true;
        }
        return typeof window !== 'undefined' ?
            typeof comp?.prototype?.$destroy === 'function' && typeof comp?.prototype?.$on === 'function' : // client-side
            typeof comp?.prototype?.render === 'function'; // server-side
    }
    /**
     * Provides basic duck typing to determine if the provided object is a HMR ProxyComponent instance or class.
     *
     * @param {unknown}  comp - Data to check as a HMR proxy component.
     *
     * @returns {boolean} Whether basic duck typing succeeds.
     */
    static isHMRProxy(comp) {
        const instanceName = comp?.constructor?.name;
        if (typeof instanceName === 'string' && (instanceName.startsWith('Proxy<') || instanceName === 'ProxyComponent')) {
            return true;
        }
        // @ts-ignore
        const prototypeName = comp?.prototype?.constructor?.name;
        return typeof prototypeName === 'string' && (prototypeName.startsWith('Proxy<') ||
            prototypeName === 'ProxyComponent');
    }
    /**
     * Runs outro transition then destroys Svelte component.
     *
     * Workaround for https://github.com/sveltejs/svelte/issues/4056
     *
     * @param instance - A Svelte component.
     *
     * @returns Promise returned after outro transition completed and component destroyed.
     */
    static async outroAndDestroy(instance) {
        if (instance === void 0 || instance === null) {
            return Promise.resolve();
        }
        return new Promise((resolve) => {
            if (instance?.$$?.fragment && instance?.$$?.fragment?.o) {
                group_outros();
                transition_out(instance.$$.fragment, 0, 0, () => {
                    instance?.$destroy?.();
                    resolve();
                });
                check_outros();
            }
            else {
                instance?.$destroy?.();
                resolve();
            }
        });
    }
}
Object.seal(APIUtil);

/**
 * Provides utilities to verify and parse {@link TJSSvelte.Config} configuration objects and general verification of
 * Svelte components.
 */
class TJSSvelte {
    constructor() {
        throw new Error('TJSSvelte constructor: This is a static class and should not be constructed.');
    }
    static get config() { return APIConfig; }
    /**
     * @returns The utility API.
     */
    static get util() { return APIUtil; }
}
Object.seal(TJSSvelte);

export { PropBindingControl, TJSSvelte };
//# sourceMappingURL=index.js.map
