import { SvelteComponent, ComponentConstructorOptions, ComponentProps } from 'svelte';

/**
 * Defines the TRL / client side configuration object to load a Svelte component.
 *
 * @typeParam Component - A specific component to narrow the allowed `class` and `props`.
 *
 * @typeParam [Config] - Additional options to omit properties from allowed in `context` or `props`.
 */
type TJSSvelteConfig<
  Component extends SvelteComponent = SvelteComponent,
  Config extends {
    ContextOmit?: keyof NonNullable<Config['ContextShape']>;
    ContextShape?: {
      [key: string]: any;
    };
    PropsOmit?: string;
  } = {
    ContextOmit: never;
    ContextShape: {};
    PropsOmit: '';
  },
> = {
  /**
   * The Svelte component class / constructor function.
   */
  class: new (options: ComponentConstructorOptions<ComponentProps<Component>>) => Component;
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
/**
 * Always narrow and evaluate the `context` property even if `ConfigShape` just has the omitted keys. This is done
 * through the forced addition of `__uniqueKey_DO_NOT_USE_OR_REMOVE__`.
 *
 * Also do not evaluate if `ContextOmit` is undefined / never.
 */
type NarrowContext<
  Config extends {
    ContextOmit?: keyof NonNullable<Config['ContextShape']> | '__uniqueKey_DO_NOT_USE_OR_REMOVE__';
    ContextShape?: {
      [key: string]: unknown;
    };
  },
> = Config['ContextOmit'] extends never
  ? NonNullable<Config['ContextShape']>
  :
      | Omit<
          NonNullable<Config['ContextShape']> & {
            __uniqueKey_DO_NOT_USE_OR_REMOVE__?: never;
          },
          NonNullable<
            Config extends {
              ContextOmit: infer OmitType;
            }
              ? OmitType
              : ''
          >
        >
      | (() => Config['ContextOmit'] extends never
          ? NonNullable<Config['ContextShape']>
          : Omit<
              NonNullable<Config['ContextShape']> & {
                __uniqueKey_DO_NOT_USE_OR_REMOVE__?: never;
              },
              NonNullable<
                Config extends {
                  ContextOmit: infer OmitType;
                }
                  ? OmitType
                  : ''
              >
            >);
/**
 * Narrows allowed props omitting / preventing definition of anything defined in `PropsOmit`.
 */
type NarrowProps<
  Component extends SvelteComponent,
  Config extends {
    PropsOmit?: string;
  },
> =
  | Partial<Omit<ComponentProps<Component>, NonNullable<Config['PropsOmit']>>>
  | (() => Partial<{
      [K in keyof ComponentProps<Component>]: K extends NonNullable<Config['PropsOmit']>
        ? never
        : ComponentProps<Component>[K];
    }>);

/**
 * Provides utilities to verify and parse {@link TJSSvelteConfig} configuration objects.
 */
declare class TJSSvelteConfigUtil {
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
  static isConfig(
    config: unknown,
    {
      raiseException,
    }?: {
      raiseException?: boolean;
    },
  ): config is TJSSvelteConfig;
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
  static parseConfig(config: TJSSvelteConfig, thisArg?: any): TJSSvelteConfig;
}

/**
 * Various utilities to duck type / detect Svelte components and run outro transition while destroying a component
 * externally.
 */
declare class TJSSvelteUtil {
  /**
   * Provides basic duck typing to determine if the provided function is a constructor function for a Svelte component.
   *
   * @param {unknown}  comp - Data to check as a Svelte component.
   *
   * @returns {boolean} Whether basic duck typing succeeds.
   */
  static isComponent(comp: unknown): boolean;
  /**
   * Provides basic duck typing to determine if the provided object is a HMR ProxyComponent instance or class.
   *
   * @param {unknown}  comp - Data to check as a HMR proxy component.
   *
   * @returns {boolean} Whether basic duck typing succeeds.
   */
  static isHMRProxy(comp: unknown): boolean;
  /**
   * Runs outro transition then destroys Svelte component.
   *
   * Workaround for https://github.com/sveltejs/svelte/issues/4056
   *
   * @param {*}  instance - A Svelte component.
   *
   * @returns {Promise} Promise returned after outro transition completed and component destroyed.
   */
  static outroAndDestroy(instance: any): Promise<any>;
}

export { type TJSSvelteConfig, TJSSvelteConfigUtil, TJSSvelteUtil };
