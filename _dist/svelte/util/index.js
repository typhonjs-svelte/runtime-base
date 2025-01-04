import { CrossWindow } from '@typhonjs-svelte/runtime-base/util/browser';
import { isObject } from '@typhonjs-svelte/runtime-base/util/object';
import { group_outros, transition_out, check_outros } from 'svelte/internal';

/**
 * Provides utilities to verify and parse {@link TJSSvelte.Config} configuration objects.
 */
class APIConfig {
    constructor() { }
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
        if (!isObject(config)) {
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
        if (!isObject(config)) {
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
        if (config.props !== void 0 && !isObject(config.props)) {
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
        if (!isObject(config)) {
            throw new TypeError(`TJSSvelte.config.parseConfig - 'config' is not an object:\n${JSON.stringify(config)}.`);
        }
        if (!TJSSvelte.util.isComponent(config.class)) {
            throw new TypeError(`TJSSvelte.config.parseConfig - 'class' is not a Svelte component constructor for config:\n${JSON.stringify(config)}.`);
        }
        if (config.hydrate !== void 0 && typeof config.hydrate !== 'boolean') {
            throw new TypeError(`TJSSvelte.config.parseConfig - 'hydrate' is not a boolean for config:\n${JSON.stringify(config)}.`);
        }
        if (config.intro !== void 0 && typeof config.intro !== 'boolean') {
            throw new TypeError(`TJSSvelte.config.parseConfig - 'intro' is not a boolean for config:\n${JSON.stringify(config)}.`);
        }
        if (config.target !== void 0 && !CrossWindow.isElement(config.target) &&
            !CrossWindow.isShadowRoot(config.target) && !CrossWindow.isDocumentFragment(config.target)) {
            throw new TypeError(`TJSSvelte.config.parseConfig - 'target' is not a Element, ShadowRoot, or DocumentFragment for config:\n${JSON.stringify(config)}.`);
        }
        if (config.anchor !== void 0 && !CrossWindow.isElement(config.anchor) &&
            !CrossWindow.isShadowRoot(config.anchor) && !CrossWindow.isDocumentFragment(config.anchor)) {
            throw new TypeError(`TJSSvelte.config.parseConfig - 'anchor' is not a string, Element for config:\n${JSON.stringify(config)}.`);
        }
        if (config.context !== void 0 && typeof config.context !== 'function' && !isObject(config.context)) {
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
            if (isObject(result)) {
                context = { ...result };
            }
            else {
                throw new Error(`TJSSvelte.config.parseConfig - 'context' is a function that did not return an object for config:\n${JSON.stringify(config)}`);
            }
        }
        else if (isObject(svelteConfig.context)) {
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
            if (isObject(result)) {
                return result;
            }
            else {
                throw new Error(`TJSSvelte.config.parseConfig - 'props' is a function that did not return an object for config:\n${JSON.stringify(config)}`);
            }
        }
        else if (isObject(props)) {
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
    constructor() { }
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
    constructor() { }
    static get config() { return APIConfig; }
    /**
     * @returns The utility API.
     */
    static get util() { return APIUtil; }
}
Object.seal(TJSSvelte);

export { TJSSvelte };
//# sourceMappingURL=index.js.map
