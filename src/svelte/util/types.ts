import type {
   ComponentConstructorOptions,
   SvelteComponent } from 'svelte';

/**
 * Defines the TRL / client side configuration object to load a Svelte component.
 */
export type TJSSvelteConfig = {
   /**
    * The Svelte component class / constructor function.
    */
   class: { new(options: ComponentConstructorOptions): SvelteComponent };

   /**
    * A child of `target` to render the component immediately before.
    */
   anchor?: Element;

   /**
    * The root-level context to pass to the component. You may define context as a callback function.
    */
   context?: (() => ({ [key: string]: any } | Map<string, any>)) | Map<string, any> | { [key: string]: any }

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
    * Props to pass to the component. You may define props as a callback function.
    */
   props?: (() => { [key: string]: any }) | { [key: string]: any };

   /**
    * The target to render component to. By default, `document.body` is used as the target if not otherwise defined.
    */
   target?: Element | Document | ShadowRoot;
};
