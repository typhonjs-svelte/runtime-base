import * as svelte from 'svelte';

/**
 * Provides basic duck typing to determine if the provided object is a HMR ProxyComponent instance or class.
 *
 * @param {*}  comp - Data to check as a HMR proxy component.
 *
 * @returns {boolean} Whether basic duck typing succeeds.
 */
declare function isHMRProxy(comp: any): boolean;

/**
 * Provides basic duck typing to determine if the provided function is a constructor function for a Svelte component.
 *
 * @param {*}  comp - Data to check as a Svelte component.
 *
 * @returns {boolean} Whether basic duck typing succeeds.
 */
declare function isSvelteComponent(comp: any): boolean;

/**
 * Validates `config` argument whether it is a valid {@link TJSSvelteConfig}.
 *
 * @param {*}  config - The potential config object to validate.
 *
 * @param {boolean}  [raiseException=false] - If validation fails raise an exception.
 *
 * @returns {boolean} Is the config a valid TJSSvelteConfig.
 *
 * @throws {TypeError}  Any validation error when `raiseException` is enabled.
 */
declare function isTJSSvelteConfig(config: any, raiseException?: boolean): boolean;
/**
 * Defines the TRL / client side configuration object to load a Svelte component.
 */
type TJSSvelteConfig = {
    /**
     * The Svelte component class / constructor function.
     */
    class: new (options: svelte.ComponentConstructorOptions) => svelte.SvelteComponent | svelte.SvelteComponentTyped;
    /**
     * A {@link HTMLElement } or {@link ShadowRoot } to
     * render to. By default, `document.body` is used as the target if not otherwise defined.
     */
    target?: HTMLElement | ShadowRoot;
    /**
     * A child of `target` to render the component immediately before.
     */
    anchor?: HTMLElement;
    /**
     * Props to pass to the component.
     */
    props?: () => Record<string, any> | Record<string, any>;
    /**
     * The root-level
     * context to pass to the component.
     */
    context?: () => (Record<string, any> | Map<string, any>) | Map<string, any> | Record<string, any>;
    /**
     * See description in main Svelte docs
     * {@link https://svelte.dev/docs/client-side-component-api#creating-a-component | Creating a component.}
     */
    hydrate?: boolean;
    /**
     * If true, will play transitions on initial render, rather than waiting for subsequent
     * state changes.
     */
    intro?: boolean;
};

/**
 * Runs outro transition then destroys Svelte component.
 *
 * Workaround for https://github.com/sveltejs/svelte/issues/4056
 *
 * @param {*}  instance - A Svelte component.
 */
declare function outroAndDestroy(instance: any): Promise<any>;

/**
 * Parses a TyphonJS Svelte config object ensuring that classes specified are Svelte components and props are set
 * correctly.
 *
 * @param {object}   config - Svelte config object.
 *
 * @param {*}        [thisArg] - `This` reference to set for invoking any props function.
 *
 * @returns {object} The processed Svelte config object.
 */
declare function parseTJSSvelteConfig(config: object, thisArg?: any): object;

export { TJSSvelteConfig, isHMRProxy, isSvelteComponent, isTJSSvelteConfig, outroAndDestroy, parseTJSSvelteConfig };
