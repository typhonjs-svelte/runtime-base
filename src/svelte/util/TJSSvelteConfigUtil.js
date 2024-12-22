import { CrossWindow }     from '#runtime/util/browser';
import { isObject }        from '#runtime/util/object';

import { TJSSvelteUtil }   from './TJSSvelteUtil.js';

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
    * Parses a TyphonJS Svelte config object ensuring that the class specified is a Svelte component, loads any dynamic
    * defined `context` or `props` preparing the config object for loading into the Svelte component.
    *
    * @param {import('./types').TJSSvelteConfig}   config - Svelte config object.
    *
    * @param {object}   [options] - Options.
    *
    * @param {any}      [options.thisArg] - `This` reference to set for invoking any `context` or `props` defined as
    *        functions.
    *
    * @returns {import('./types').TJSParsedSvelteConfig} The processed Svelte config object turned with parsed `props` &
    * `context` converted into the format supported by Svelte.
    */
   static parseConfig(config, { thisArg = void 0 } = {})
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

      if (config.target !== void 0 && typeof config.target !== 'string' && !CrossWindow.isElement(config.target) &&
       !CrossWindow.isShadowRoot(config.target) && !CrossWindow.isDocumentFragment(config.target))
      {
         throw new TypeError(
          `TJSSvelteConfigUtil.parseConfig - 'target' is not a Element, ShadowRoot, or DocumentFragment for config:\n${
           JSON.stringify(config)}.`);
      }

      if (config.anchor !== void 0 && typeof config.anchor !== 'string' && !CrossWindow.isElement(config.anchor) &&
       !CrossWindow.isShadowRoot(config.anchor) && !CrossWindow.isDocumentFragment(config.anchor))
      {
         throw new TypeError(`TJSSvelteConfigUtil.parseConfig - 'anchor' is not a string, Element for config:\n${
          JSON.stringify(config)}.`);
      }

      if (config.context !== void 0 && typeof config.context !== 'function' && !isObject(config.context))
      {
         throw new TypeError(
          `TJSSvelteConfigUtil.parseConfig - 'context' is not a function or object for config:\n${
            JSON.stringify(config)}.`);
      }

      /** @type {import('./types').TJSParsedSvelteConfig} */
      const svelteConfig = { ...config };

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
      else if (isObject(svelteConfig.context))
      {
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

export { TJSSvelteConfigUtil };
