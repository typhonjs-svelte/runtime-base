import {
   assertObject,
   isRecord }           from '#runtime/util/object';

import { CrossRealm }   from '#runtime/util/realm';

import { TJSSvelte }    from './TJSSvelte';

/**
 * Provides utilities to verify and parse {@link TJSSvelte.Config} configuration objects.
 */
abstract class APIConfig
{
   private constructor()
   {
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
   static isConfig(config: unknown, { raiseException = false }: { raiseException?: boolean } = {}):
    config is TJSSvelte.Config.Dynamic | TJSSvelte.Config.Standard
   {
      if (!isRecord(config))
      {
         if (raiseException) { throw new TypeError(`TJSSvelte.config.isConfig error: 'config' is not an object.`); }
         return false;
      }

      if (!TJSSvelte.util.isComponent(config.class))
      {
         if (raiseException)
         {
            throw new TypeError(
             `TJSSvelte.config.isConfig error: 'config.class' is not a Svelte component constructor.`);
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
   static isConfigEmbed(config: unknown, { raiseException = false }: { raiseException?: boolean } = {}):
    config is TJSSvelte.Config.Embed
   {
      if (!isRecord(config))
      {
         if (raiseException)
         {
            throw new TypeError(`TJSSvelte.config.isConfigEmbed error: 'config' is not an object.`);
         }
         return false;
      }

      if (!TJSSvelte.util.isComponent(config.class))
      {
         if (raiseException)
         {
            throw new TypeError(
             `TJSSvelte.config.isConfigEmbed error: 'config.class' is not a Svelte component constructor.`);
         }
         return false;
      }

      if (config.props !== void 0 && !isRecord(config.props))
      {
         if (raiseException)
         {
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
   static parseConfig(config: TJSSvelte.Config.Dynamic | TJSSvelte.Config.Standard,
    { contextExternal = false, thisArg = void 0 }: { contextExternal?: boolean, thisArg?: unknown } = {}):
     TJSSvelte.Config.Parsed
   {
      assertObject(config, `TJSSvelte.config.parseConfig - 'config' is not an object:\n${JSON.stringify(config)}.`);

      if (!TJSSvelte.util.isComponent(config.class))
      {
         throw new TypeError(
          `TJSSvelte.config.parseConfig - 'class' is not a Svelte component constructor for config:\n${
            JSON.stringify(config)}.`);
      }

      if (config.intro !== void 0 && typeof config.intro !== 'boolean')
      {
         throw new TypeError(
          `TJSSvelte.config.parseConfig - 'intro' is not a boolean for config:\n${JSON.stringify(config)}.`);
      }

      if (config.target !== void 0 && !CrossRealm.browser.isElement(config.target) &&
       !CrossRealm.browser.isShadowRoot(config.target) && !CrossRealm.browser.isDocumentFragment(config.target))
      {
         throw new TypeError(
          `TJSSvelte.config.parseConfig - 'target' is not a Element, ShadowRoot, or DocumentFragment for config:\n${
           JSON.stringify(config)}.`);
      }

      if (config.anchor !== void 0 && !CrossRealm.browser.isElement(config.anchor) &&
       !CrossRealm.browser.isShadowRoot(config.anchor) && !CrossRealm.browser.isDocumentFragment(config.anchor))
      {
         throw new TypeError(`TJSSvelte.config.parseConfig - 'anchor' is not a string, Element for config:\n${
          JSON.stringify(config)}.`);
      }

      if (config.context !== void 0 && typeof config.context !== 'function' && !isRecord(config.context))
      {
         throw new TypeError(
          `TJSSvelte.config.parseConfig - 'context' is not a function or object for config:\n${
           JSON.stringify(config)}.`);
      }

      const svelteConfig: { [key: string]: any } = { ...config };

      let context: { [key: string]: any } = {};

      // If a context callback function is provided then invoke it with `this` being the Foundry app.
      // If an object is returned it adds the entries to external context.
      if (typeof svelteConfig.context === 'function')
      {
         const contextFunc: Function = svelteConfig.context;
         delete svelteConfig.context;

         const result: unknown = contextFunc.call(thisArg);
         if (isRecord(result))
         {
            context = { ...result };
         }
         else
         {
            throw new Error(
             `TJSSvelte.config.parseConfig - 'context' is a function that did not return an object for config:\n${
              JSON.stringify(config)}`);
         }
      }
      else if (isRecord(svelteConfig.context))
      {
         context = svelteConfig.context;
         delete svelteConfig.context;
      }

      // If a props is a function then invoke it with `this` being the Foundry app.
      // If an object is returned set it as the props.
      svelteConfig.props = this.#processProps(svelteConfig.props, thisArg, config);


      if (contextExternal)
      {
         svelteConfig.context = new Map();
         svelteConfig.context.set('#external', context);
      }
      else
      {
         svelteConfig.context = new Map(Object.entries(context));
      }

      return svelteConfig as TJSSvelte.Config.Parsed;
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
   static #processProps(props: { [key: string]: any } | Function, thisArg: unknown,
    config: TJSSvelte.Config.Dynamic | TJSSvelte.Config.Standard): { [key: string]: any }
   {
      // If a props is a function then invoke it with `this` being the Foundry app.
      // If an object is returned set it as the props.
      if (typeof props === 'function')
      {
         const result: unknown = props.call(thisArg);
         if (isRecord(result))
         {
            return result;
         }
         else
         {
            throw new Error(
             `TJSSvelte.config.parseConfig - 'props' is a function that did not return an object for config:\n${
              JSON.stringify(config)}`);
         }
      }
      else if (isRecord(props))
      {
         return props;
      }
      else if (props !== void 0)
      {
         throw new Error(`TJSSvelte.config.parseConfig - 'props' is not a function or an object for config:\n${
          JSON.stringify(config)}`);
      }

      return {};
   }
}

Object.seal(APIConfig);

export { APIConfig };
