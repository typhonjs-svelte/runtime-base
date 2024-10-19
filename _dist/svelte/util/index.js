import { isObject } from '@typhonjs-svelte/runtime-base/util/object';
import { group_outros, transition_out, check_outros } from 'svelte/internal';

/**
 * Various utilities to duck type / detect Svelte components and run outro transition while destroying a component
 * externally.
 */
class TJSSvelteUtil
{
   /**
    * Provides basic duck typing to determine if the provided function is a constructor function for a Svelte component.
    *
    * @param {unknown}  comp - Data to check as a Svelte component.
    *
    * @returns {boolean} Whether basic duck typing succeeds.
    */
   static isComponent(comp)
   {
      if (comp === null || comp === void 0 || typeof comp !== 'function') { return false; }

      // When using Vite in a developer build the SvelteComponent is wrapped in a ProxyComponent class.
      // This class doesn't define methods on the prototype, so we must check if the constructor name
      // starts with `Proxy<` as it provides the wrapped component as `Proxy<_wrapped component name_>`.
      const prototypeName = comp?.prototype?.constructor?.name;

      if (typeof prototypeName === 'string' && (prototypeName.startsWith('Proxy<') ||
       prototypeName === 'ProxyComponent'))
      {
         return true;
      }

      return typeof window !== 'undefined' ?
       typeof comp.prototype.$destroy === 'function' && typeof comp.prototype.$on === 'function' : // client-side
        typeof comp.render === 'function'; // server-side
   }

   /**
    * Provides basic duck typing to determine if the provided object is a HMR ProxyComponent instance or class.
    *
    * @param {unknown}  comp - Data to check as a HMR proxy component.
    *
    * @returns {boolean} Whether basic duck typing succeeds.
    */
   static isHMRProxy(comp)
   {
      const instanceName = comp?.constructor?.name;
      if (typeof instanceName === 'string' && (instanceName.startsWith('Proxy<') || instanceName === 'ProxyComponent'))
      {
         return true;
      }

      const prototypeName = comp?.prototype?.constructor?.name;
      return typeof prototypeName === 'string' && (prototypeName.startsWith('Proxy<') ||
       prototypeName === 'ProxyComponent');
   }

   /**
    * Runs outro transition then destroys Svelte component.
    *
    * Workaround for https://github.com/sveltejs/svelte/issues/4056
    *
    * @param {*}  instance - A Svelte component.
    */
   static async outroAndDestroy(instance)
   {
      return new Promise((resolve) =>
      {
         if (instance.$$.fragment && instance.$$.fragment.o)
         {
            group_outros();
            transition_out(instance.$$.fragment, 0, 0, () =>
            {
               instance.$destroy();
               resolve();
            });
            check_outros();
         }
         else
         {
            instance.$destroy();
            resolve();
         }
      });
   }
}

Object.seal(TJSSvelteUtil);

/**
 * Provides utilities to verify and parse {@link TJSSvelteConfig} configuration objects.
 */
class TJSSvelteConfigUtil
{
   /**
    * Validates `config` argument whether it is a valid {@link TJSSvelteConfig}.
    *
    * @param {unknown}  config - The potential config object to validate.
    *
    * @param {object}   [options] - Options.
    *
    * @param {boolean}  [options.raiseException=false] - If validation fails raise an exception.
    *
    * @returns {config is import('./types').TJSSvelteConfig} Is the config a valid TJSSvelteConfig.
    *
    * @throws {TypeError}  Any validation error when `raiseException` is enabled.
    */
   static isConfig(config, { raiseException = false } = {})
   {
      if (!isObject(config))
      {
         if (raiseException) { throw new TypeError(`TJSSvelteConfigUtil.isConfig error: 'config' is not an object.`); }
         return false;
      }

      if (!TJSSvelteUtil.isComponent(config.class))
      {
         if (raiseException)
         {
            throw new TypeError(
             `TJSSvelteConfigUtil.isConfig error: 'config.class' is not a Svelte component constructor.`);
         }
         return false;
      }

      return true;
   }

   /**
    * Parses a TyphonJS Svelte config object ensuring that classes specified are Svelte components and props are set
    * correctly.
    *
    * @param {import('./types').TJSSvelteConfig}   config - Svelte config object.
    *
    * @param {any}       [thisArg] - `This` reference to set for invoking any props function.
    *
    * @returns {import('./types').TJSSvelteConfig} The processed Svelte config object.
    */
   static parseConfig(config, thisArg = void 0)
   {
      if (!isObject(config))
      {
         throw new TypeError(
          `TJSSvelteConfigUtil.parseConfig - 'config' is not an object:\n${JSON.stringify(config)}.`);
      }

      if (!TJSSvelteUtil.isComponent(config.class))
      {
         throw new TypeError(
          `TJSSvelteConfigUtil.parseConfig - 'class' is not a Svelte component constructor for config:\n${
            JSON.stringify(config)}.`);
      }

      if (config.hydrate !== void 0 && typeof config.hydrate !== 'boolean')
      {
         throw new TypeError(
          `TJSSvelteConfigUtil.parseConfig - 'hydrate' is not a boolean for config:\n${JSON.stringify(config)}.`);
      }

      if (config.intro !== void 0 && typeof config.intro !== 'boolean')
      {
         throw new TypeError(
          `TJSSvelteConfigUtil.parseConfig - 'intro' is not a boolean for config:\n${JSON.stringify(config)}.`);
      }

      if (config.target !== void 0 && typeof config.target !== 'string' && !(config.target instanceof Element) &&
       !(config.target instanceof ShadowRoot) && !(config.target instanceof DocumentFragment))
      {
         throw new TypeError(
          `TJSSvelteConfigUtil.parseConfig - 'target' is not a Element, ShadowRoot, or DocumentFragment for config:\n${
           JSON.stringify(config)}.`);
      }

      if (config.anchor !== void 0 && typeof config.anchor !== 'string' && !(config.anchor instanceof Element) &&
       !(config.anchor instanceof ShadowRoot) && !(config.anchor instanceof DocumentFragment))
      {
         throw new TypeError(`TJSSvelteConfigUtil.parseConfig - 'anchor' is not a string, Element for config:\n${
          JSON.stringify(config)}.`);
      }

      if (config.context !== void 0 && typeof config.context !== 'function' && !(config.context instanceof Map) &&
       !isObject(config.context))
      {
         throw new TypeError(
          `TJSSvelteConfigUtil.parseConfig - 'context' is not a Map, function or object for config:\n${
            JSON.stringify(config)}.`);
      }

      // Validate extra TyphonJS options --------------------------------------------------------------------------------

      // `selectorTarget` optionally stores a target element found in main element.
      if (config.selectorTarget !== void 0 && typeof config.selectorTarget !== 'string')
      {
         throw new TypeError(
          `TJSSvelteConfigUtil.parseConfig - 'selectorTarget' is not a string for config:\n${JSON.stringify(config)}.`);
      }

      // `options` stores `injectApp`, `injectEventbus`, and `selectorElement`.
      if (config.options !== void 0 && !isObject(config.options))
      {
         throw new TypeError(
          `TJSSvelteConfigUtil.parseConfig - 'options' is not an object for config:\n${JSON.stringify(config)}.`);
      }

      // Validate TyphonJS standard options. // TODO: This will change in `0.3.0`!
      if (isObject(config.options))
      {
         if (config.options.injectApp !== void 0 && typeof config.options.injectApp !== 'boolean')
         {
            throw new TypeError(`TJSSvelteConfigUtil.parseConfig - 'options.injectApp' is not a boolean for config:\n${
             JSON.stringify(config)}.`);
         }

         if (config.options.injectEventbus !== void 0 && typeof config.options.injectEventbus !== 'boolean')
         {
            throw new TypeError(
             `TJSSvelteConfigUtil.parseConfig - 'options.injectEventbus' is not a boolean for config:\n${
              JSON.stringify(config)}.`);
         }

         // `selectorElement` optionally stores a main element selector to be found in a HTMLElement target.
         if (config.options.selectorElement !== void 0 && typeof config.options.selectorElement !== 'string')
         {
            throw new TypeError(`TJSSvelteConfigUtil.parseConfig - 'selectorElement' is not a string for config:\n${
             JSON.stringify(config)}.`);
         }
      }

      const svelteConfig = { ...config };

      // Delete extra Svelte options.
      delete svelteConfig.options;

      let externalContext = {};

      // If a context callback function is provided then invoke it with `this` being the Foundry app.
      // If an object is returned it adds the entries to external context.
      if (typeof svelteConfig.context === 'function')
      {
         const contextFunc = svelteConfig.context;
         delete svelteConfig.context;

         const result = contextFunc.call(thisArg);
         if (isObject(result))
         {
            externalContext = { ...result };
         }
         else
         {
            throw new Error(
             `TJSSvelteConfigUtil.parseConfig - 'context' is a function that did not return an object for config:\n${
              JSON.stringify(config)}`);
         }
      }
      else if (svelteConfig.context instanceof Map)
      {
         externalContext = Object.fromEntries(svelteConfig.context);
         delete svelteConfig.context;
      }
      else if (isObject(svelteConfig.context))
      {
         externalContext = svelteConfig.context;
         delete svelteConfig.context;
      }

      // If a props is a function then invoke it with `this` being the Foundry app.
      // If an object is returned set it as the props.
      svelteConfig.props = this.#processProps(svelteConfig.props, thisArg, config);

      // Process children components attaching to external context.
      if (Array.isArray(svelteConfig.children))
      {
         const children = [];

         for (let cntr = 0; cntr < svelteConfig.children.length; cntr++)
         {
            const child = svelteConfig.children[cntr];

            if (!TJSSvelteUtil.isComponent(child.class))
            {
               throw new Error(`TJSSvelteConfigUtil.parseConfig - 'class' is not a Svelte component for child[${
                cntr}] for config:\n${JSON.stringify(config)}`);
            }

            child.props = this.#processProps(child.props, thisArg, config);

            children.push(child);
         }

         if (children.length > 0)
         {
            externalContext.children = children;
         }

         delete svelteConfig.children;
      }
      else if (isObject(svelteConfig.children))
      {
         if (!TJSSvelteUtil.isComponent(svelteConfig.children.class))
         {
            throw new Error(
             `TJSSvelteConfigUtil.parseConfig - 'class' is not a Svelte component for children object for config:\n${
              JSON.stringify(config)}`);
         }

         svelteConfig.children.props = this.#processProps(svelteConfig.children.props, thisArg, config);

         externalContext.children = [svelteConfig.children];
         delete svelteConfig.children;
      }

      if (!(svelteConfig.context instanceof Map))
      {
         svelteConfig.context = new Map();
      }

      svelteConfig.context.set('#external', externalContext);

      return svelteConfig;
   }

   // Internal implementation ----------------------------------------------------------------------------------------

   /**
    * Processes Svelte props. Potentially props can be a function to invoke with `thisArg`.
    *
    * @param {{ [key: string]: any } | Function}   props - Svelte props.
    *
    * @param {*}                 thisArg - `This` reference to set for invoking any props function.
    *
    * @param {object}            config - Svelte config
    *
    * @returns {{ [key: string]: any } | undefined}     Svelte props.
    */
   static #processProps(props, thisArg, config)
   {
      // If a props is a function then invoke it with `this` being the Foundry app.
      // If an object is returned set it as the props.
      if (typeof props === 'function')
      {
         const result = props.call(thisArg);
         if (isObject(result))
         {
            return result;
         }
         else
         {
            throw new Error(
             `TJSSvelteConfigUtil.parseConfig - 'props' is a function that did not return an object for config:\n${
              JSON.stringify(config)}`);
         }
      }
      else if (isObject(props))
      {
         return props;
      }
      else if (props !== void 0)
      {
         throw new Error(`TJSSvelteConfigUtil.parseConfig - 'props' is not a function or an object for config:\n${
          JSON.stringify(config)}`);
      }

      return {};
   }
}

Object.seal(TJSSvelteConfigUtil);

export { TJSSvelteConfigUtil, TJSSvelteUtil };
//# sourceMappingURL=index.js.map
