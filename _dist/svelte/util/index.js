import { CrossWindow } from '@typhonjs-svelte/runtime-base/util/browser';
import { isObject } from '@typhonjs-svelte/runtime-base/util/object';
import { group_outros, transition_out, check_outros } from 'svelte/internal';

// @ts-ignore
/**
 * Various utilities to duck type / detect Svelte components and run outro transition while destroying a component
 * externally.
 */
class TJSSvelteUtil {
    /**
     * Provides basic duck typing to determine if the provided function is a constructor function for a Svelte component.
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
Object.seal(TJSSvelteUtil);

/**
 * Provides utilities to verify and parse {@link TJSSvelteConfig} configuration objects.
 */
class TJSSvelteConfigUtil {
    /**
     * Validates `config` argument whether it is a valid {@link TJSSvelteConfig}.
     *
     * @param config - The potential config object to validate.
     *
     * @param [options] - Options.
     *
     * @param [options.raiseException=false] - If validation fails raise an exception.
     *
     * @returns Is the config a valid TJSSvelteConfig.
     *
     * @throws {TypeError}  Any validation error when `raiseException` is enabled.
     */
    static isConfig(config, { raiseException = false } = {}) {
        if (!isObject(config)) {
            if (raiseException) {
                throw new TypeError(`TJSSvelteConfigUtil.isConfig error: 'config' is not an object.`);
            }
            return false;
        }
        if (!TJSSvelteUtil.isComponent(config.class)) {
            if (raiseException) {
                throw new TypeError(`TJSSvelteConfigUtil.isConfig error: 'config.class' is not a Svelte component constructor.`);
            }
            return false;
        }
        return true;
    }
    /**
     * Parses a TyphonJS Svelte config object ensuring that the class specified is a Svelte component, loads any dynamic
     * defined `context` or `props` preparing the config object for loading into the Svelte component.
     *
     * @param config - Svelte config object.
     *
     * @param [options] - Options.
     *
     * @param [options.thisArg] - `This` reference to set for invoking any `context` or `props` defined as functions.
     *
     * @returns The processed Svelte config object turned with parsed `props` & `context` converted into the format
     *          supported by Svelte.
     */
    static parseConfig(config, { thisArg = void 0 } = {}) {
        if (!isObject(config)) {
            throw new TypeError(`TJSSvelteConfigUtil.parseConfig - 'config' is not an object:\n${JSON.stringify(config)}.`);
        }
        if (!TJSSvelteUtil.isComponent(config.class)) {
            throw new TypeError(`TJSSvelteConfigUtil.parseConfig - 'class' is not a Svelte component constructor for config:\n${JSON.stringify(config)}.`);
        }
        if (config.hydrate !== void 0 && typeof config.hydrate !== 'boolean') {
            throw new TypeError(`TJSSvelteConfigUtil.parseConfig - 'hydrate' is not a boolean for config:\n${JSON.stringify(config)}.`);
        }
        if (config.intro !== void 0 && typeof config.intro !== 'boolean') {
            throw new TypeError(`TJSSvelteConfigUtil.parseConfig - 'intro' is not a boolean for config:\n${JSON.stringify(config)}.`);
        }
        if (config.target !== void 0 && typeof config.target !== 'string' && !CrossWindow.isElement(config.target) &&
            !CrossWindow.isShadowRoot(config.target) && !CrossWindow.isDocumentFragment(config.target)) {
            throw new TypeError(`TJSSvelteConfigUtil.parseConfig - 'target' is not a Element, ShadowRoot, or DocumentFragment for config:\n${JSON.stringify(config)}.`);
        }
        if (config.anchor !== void 0 && typeof config.anchor !== 'string' && !CrossWindow.isElement(config.anchor) &&
            !CrossWindow.isShadowRoot(config.anchor) && !CrossWindow.isDocumentFragment(config.anchor)) {
            throw new TypeError(`TJSSvelteConfigUtil.parseConfig - 'anchor' is not a string, Element for config:\n${JSON.stringify(config)}.`);
        }
        if (config.context !== void 0 && typeof config.context !== 'function' && !isObject(config.context)) {
            throw new TypeError(`TJSSvelteConfigUtil.parseConfig - 'context' is not a function or object for config:\n${JSON.stringify(config)}.`);
        }
        const svelteConfig = { ...config };
        let externalContext = {};
        // If a context callback function is provided then invoke it with `this` being the Foundry app.
        // If an object is returned it adds the entries to external context.
        if (typeof svelteConfig.context === 'function') {
            const contextFunc = svelteConfig.context;
            delete svelteConfig.context;
            const result = contextFunc.call(thisArg);
            if (isObject(result)) {
                externalContext = { ...result };
            }
            else {
                throw new Error(`TJSSvelteConfigUtil.parseConfig - 'context' is a function that did not return an object for config:\n${JSON.stringify(config)}`);
            }
        }
        else if (isObject(svelteConfig.context)) {
            externalContext = svelteConfig.context;
            delete svelteConfig.context;
        }
        // If a props is a function then invoke it with `this` being the Foundry app.
        // If an object is returned set it as the props.
        svelteConfig.props = this.#processProps(svelteConfig.props, thisArg, config);
        svelteConfig.context = new Map();
        svelteConfig.context.set('#external', externalContext);
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
                throw new Error(`TJSSvelteConfigUtil.parseConfig - 'props' is a function that did not return an object for config:\n${JSON.stringify(config)}`);
            }
        }
        else if (isObject(props)) {
            return props;
        }
        else if (props !== void 0) {
            throw new Error(`TJSSvelteConfigUtil.parseConfig - 'props' is not a function or an object for config:\n${JSON.stringify(config)}`);
        }
        return {};
    }
}
Object.seal(TJSSvelteConfigUtil);

export { TJSSvelteConfigUtil, TJSSvelteUtil };
//# sourceMappingURL=index.js.map
