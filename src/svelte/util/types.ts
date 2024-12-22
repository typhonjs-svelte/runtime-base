import type {
   ComponentConstructorOptions,
   ComponentProps,
   SvelteComponent } from 'svelte';

/**
 * The result of after parsing {@link TJSSvelteConfig} or {@link TJSSvelteConfigDynamic} by
 * {@link TJSSvelteConfigUtil.parseConfig}.
 */
interface TJSParsedSvelteConfig
{
   /**
    * The Svelte component class / constructor function.
    */
   class: new(options: ComponentConstructorOptions) => SvelteComponent;

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
