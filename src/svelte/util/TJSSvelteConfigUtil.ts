import { CrossWindow }     from '#runtime/util/browser';
import { isObject }        from '#runtime/util/object';

import { TJSSvelteUtil }   from './TJSSvelteUtil';

import type {
   ComponentConstructorOptions,
   ComponentProps,
   SvelteComponent } from 'svelte';

/**
 * Provides utilities to verify and parse {@link TJSSvelteConfig} configuration objects.
 */
class TJSSvelteConfigUtil
{
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
   static isConfig(config: unknown, { raiseException = false }: { raiseException?: boolean } = {}):
    config is TJSSvelteConfig
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
    * @param config - Svelte config object.
    *
    * @param [options] - Options.
    *
    * @param [options.thisArg] - `This` reference to set for invoking any `context` or `props` defined as functions.
    *
    * @returns The processed Svelte config object turned with parsed `props` & `context` converted into the format
    *          supported by Svelte.
    */
   static parseConfig(config: TJSSvelteConfig, { thisArg = void 0 }: { thisArg?: unknown } = {}): TJSParsedSvelteConfig
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

      const svelteConfig: { [key: string]: any } = { ...config };

      let externalContext: { [key: string]: any } = {};

      // If a context callback function is provided then invoke it with `this` being the Foundry app.
      // If an object is returned it adds the entries to external context.
      if (typeof svelteConfig.context === 'function')
      {
         const contextFunc: Function = svelteConfig.context;
         delete svelteConfig.context;

         const result: unknown = contextFunc.call(thisArg);
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

      return svelteConfig as TJSParsedSvelteConfig;
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
   static #processProps(props: { [key: string]: any } | Function, thisArg: unknown, config: TJSSvelteConfig):
    { [key: string]: any }
   {
      // If a props is a function then invoke it with `this` being the Foundry app.
      // If an object is returned set it as the props.
      if (typeof props === 'function')
      {
         const result: unknown = props.call(thisArg);
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

/**
 * The result of after parsing {@link TJSSvelteConfig} or {@link TJSSvelteConfigDynamic} by
 * {@link TJSSvelteConfigUtil.parseConfig}.
 */
interface TJSParsedSvelteConfig
{
   /**
    * The Svelte component class / constructor function.
    */
   class: new(options: ComponentConstructorOptions<ComponentProps<SvelteComponent>>) => SvelteComponent;

   /**
    * A child of `target` to render the component immediately before.
    */
   anchor?: Element;

   /**
    * The root-level additional data to add to the context passed to the component.
    */
   context: Map<string, any>;

   /**
    * If true, will play transitions on initial render, rather than waiting for subsequent state changes.
    */
   intro?: boolean;

   /**
    * Props to pass to the component.
    */
   props: { [key: string]: any };

   /**
    * The target to render component to.
    */
   target?: Element | Document | ShadowRoot;
}

/**
 * Provides the TRL / client side configuration object to load a Svelte component.
 *
 * Defines a dynamic config that allows the `context` and `props` properties to also be defined as a function that
 * returns an object of properties to respectively load into given component. This can be useful when defining a config
 * in a static context where it is helpful to pass an instance / `this` reference when defining `context` and `props`.
 *
 * See {@link TJSSvelteConfig} that narrows the type accepted for `context` and `props` to just an `object`.
 *
 * @typeParam Component - A specific component to narrow the allowed `class` and `props`.
 *
 * @typeParam [Config] - Additional options to omit properties from allowed in `context` or `props`.
 */
interface TJSSvelteConfigDynamic<Component extends SvelteComponent = SvelteComponent, Config extends {
   ContextOmit?: keyof NonNullable<Config['ContextShape']>;
   ContextShape?: { [key: string]: any };
   PropsOmit?: keyof ComponentProps<Component>;
} = { ContextOmit: never, ContextShape: {}, PropsOmit: never }>
{
   /**
    * The Svelte component class / constructor function.
    */
   class: new(options: ComponentConstructorOptions<ComponentProps<Component>>) => Component;

   /**
    * A child of `target` to render the component immediately before.
    */
   anchor?: Element;

   /**
    * The root-level additional data to add to the context passed to the component.
    */
   context?: NarrowContextObject<Config> | NarrowContextFunction<Config>;

   /**
    * If true, will play transitions on initial render, rather than waiting for subsequent state changes.
    */
   intro?: boolean;

   /**
    * Props to pass to the component. You may define props as an `object` or a function returning an `object`.
    */
   props?: NarrowPropsObject<Component, Config> | NarrowPropsFunction<Component, Config>;

   /**
    * The target to render component to. By default, `document.body` is used as the target if not otherwise defined.
    */
   target?: Element | Document | ShadowRoot;
}

/**
 * Defines the TRL / client side configuration object to load a Svelte component.
 *
 * @typeParam Component - A specific component to narrow the allowed `class` and `props`.
 *
 * @typeParam [Config] - Additional options to omit properties from allowed in `context` or `props`.
 */
interface TJSSvelteConfig<Component extends SvelteComponent = SvelteComponent, Config extends {
   ContextOmit?: keyof NonNullable<Config['ContextShape']>;
   ContextShape?: { [key: string]: any };
   PropsOmit?: keyof ComponentProps<Component>;
} = { ContextOmit: never, ContextShape: {}, PropsOmit: never }> extends TJSSvelteConfigDynamic<Component, Config>
{
   /**
    * The root-level additional data to add to the context passed to the component.
    */
   context?: NarrowContextObject<Config>;

   /**
    * Props to pass to the component. You may define props as an `object` or a function returning an `object`.
    */
   props?: NarrowPropsObject<Component, Config>;
}

export { TJSParsedSvelteConfig, TJSSvelteConfig, TJSSvelteConfigDynamic };

// Internal Utility Types --------------------------------------------------------------------------------------------

/**
 * Always narrow and evaluate the `context` property even if `ConfigShape` just has the omitted keys. This is done
 * through the forced addition of `__uniqueKey_DO_NOT_USE_OR_REMOVE__`.
 *
 * Also do not evaluate if `ContextOmit` is undefined / never.
 */
type NarrowContextObject<Config extends {
   ContextOmit?: keyof NonNullable<Config['ContextShape']> | '__uniqueKey_DO_NOT_USE_OR_REMOVE__';
   ContextShape?: { [key: string]: unknown };
}> = Config['ContextOmit'] extends never ? NonNullable<Config['ContextShape']> : Omit<
   NonNullable<Config['ContextShape']> & { __uniqueKey_DO_NOT_USE_OR_REMOVE__?: never },
   NonNullable<Config extends { ContextOmit: infer OmitType } ? OmitType : ''>
>;

/**
 * Always narrow and evaluate the `context` property even if `ConfigShape` just has the omitted keys. This is done
 * through the forced addition of `__uniqueKey_DO_NOT_USE_OR_REMOVE__`.
 *
 * Also do not evaluate if `ContextOmit` is undefined / never.
 */
type NarrowContextFunction<Config extends {
   ContextOmit?: keyof NonNullable<Config['ContextShape']> | '__uniqueKey_DO_NOT_USE_OR_REMOVE__';
   ContextShape?: { [key: string]: unknown };
}> = (() => Config['ContextOmit'] extends never ? NonNullable<Config['ContextShape']> : Omit<
   NonNullable<Config['ContextShape']> & { __uniqueKey_DO_NOT_USE_OR_REMOVE__?: never },
   NonNullable<Config extends { ContextOmit: infer OmitType } ? OmitType : ''>
>);

/**
 * Narrows allowed props omitting / preventing definition of anything defined in `PropsOmit`.
 */
type NarrowPropsObject<Component extends SvelteComponent, Config extends {
   PropsOmit?: keyof ComponentProps<Component>;
}> = Partial<Omit<ComponentProps<Component>, NonNullable<Config['PropsOmit']>>>;

/**
 * Narrows allowed props omitting / preventing definition of anything defined in `PropsOmit`.
 */
type NarrowPropsFunction<Component extends SvelteComponent, Config extends {
   PropsOmit?: keyof ComponentProps<Component>;
}> = (() => Partial<{
   [K in keyof ComponentProps<Component>]: K extends NonNullable<Config['PropsOmit']> ? never :
    ComponentProps<Component>[K];
}>);
