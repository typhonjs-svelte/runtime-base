import type {
   ComponentConstructorOptions,
   ComponentProps,
   SvelteComponent } from 'svelte';

/**
 * Defines the TRL / client side configuration object to load a Svelte component.
 *
 * @typeParam Component - A specific component to narrow the allowed `class` and `props`.
 *
 * @typeParam [Config] - Additional options to omit properties from allowed in `context` or `props`.
 */
export type TJSSvelteConfig<Component extends SvelteComponent = SvelteComponent, Config extends {
   ContextOmit?: keyof NonNullable<Config['ContextShape']>;
   ContextShape?: { [key: string]: any };
   PropsOmit?: string;
} = { ContextOmit: never, ContextShape: {}, PropsOmit: '' }> =
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
    * The root-level context to pass to the component. You may define context as an `object` or a `function` returning
    * an `object`.
    */
   context?: NarrowContext<Config>;

   /**
    * See description in main Svelte docs
    * {@link https://svelte.dev/docs/client-side-component-api#creating-a-component | Creating a component.}
    */
   hydrate?: boolean;

   /**
    * If true, will play transitions on initial render, rather than waiting for subsequent state changes.
    */
   intro?: boolean;

   /**
    * Props to pass to the component. You may define props as an `object` or a function returning an `object`.
    */
   props?: NarrowProps<Component, Config>;

   /**
    * The target to render component to. By default, `document.body` is used as the target if not otherwise defined.
    */
   target?: Element | Document | ShadowRoot;
};

// Internal Utility Types --------------------------------------------------------------------------------------------

/**
 * Always narrow and evaluate the `context` property even if `ConfigShape` just has the omitted keys. This is done
 * through the forced addition of `__uniqueKey_DO_NOT_USE_OR_REMOVE__`.
 *
 * Also do not evaluate if `ContextOmit` is undefined / never.
 */
type NarrowContext<Config extends {
   ContextOmit?: keyof NonNullable<Config['ContextShape']> | '__uniqueKey_DO_NOT_USE_OR_REMOVE__';
   ContextShape?: { [key: string]: unknown };
}> =
   Config['ContextOmit'] extends never
      ? NonNullable<Config['ContextShape']>
      : Omit<
         NonNullable<Config['ContextShape']> & { __uniqueKey_DO_NOT_USE_OR_REMOVE__?: never },
         NonNullable<Config extends { ContextOmit: infer OmitType } ? OmitType : ''>
      >
   |
   (() => (Config['ContextOmit'] extends never
      ? NonNullable<Config['ContextShape']>
      : Omit<
         NonNullable<Config['ContextShape']> & { __uniqueKey_DO_NOT_USE_OR_REMOVE__?: never },
         NonNullable<Config extends { ContextOmit: infer OmitType } ? OmitType : ''>
      >
   ));

/**
 * Narrows allowed props omitting / preventing definition of anything defined in `PropsOmit`.
 */
type NarrowProps<Component extends SvelteComponent, Config extends {
   PropsOmit?: string;
}> = Partial<Omit<ComponentProps<Component>, NonNullable<Config['PropsOmit']>>> | (() => Partial<{
   [K in keyof ComponentProps<Component>]: K extends NonNullable<Config['PropsOmit']> ? never :
    ComponentProps<Component>[K];
}>);
