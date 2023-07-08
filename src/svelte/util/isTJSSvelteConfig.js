import { isObject }           from '#runtime/util/object';

import { isSvelteComponent }  from './isSvelteComponent.js';

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
export function isTJSSvelteConfig(config, raiseException = false)
{
   if (!isObject(config))
   {
      if (raiseException) { throw new TypeError(`isTJSSvelteConfig error: 'config' is not an object.`); }
      return false;
   }

   if (!isSvelteComponent(config.class))
   {
      if (raiseException)
      {
         throw new TypeError(`isTJSSvelteConfig error: 'config.class' is not a Svelte component constructor.`);
      }
      return false;
   }

   return true;
}

/* eslint-disable */  // jsdoc/valid-types doesn't like the Google closure constructor function. TODO: verify in future eslint-plugin-jsdoc version
/**
 * @typedef {object} TJSSvelteConfig Defines the TRL / client side configuration object to load a Svelte component.
 *
 * @property {({
 *    new(options: import('svelte').ComponentConstructorOptions):
 *     import('svelte').SvelteComponent | import('svelte').SvelteComponentTyped
 * })} class The Svelte component class / constructor function.
 *
 * @property {HTMLElement | ShadowRoot}   [target=document.body] A {@link HTMLElement} or {@link ShadowRoot} to
 * render to. By default, `document.body` is used as the target if not otherwise defined.
 *
 * @property {HTMLElement} [anchor] A child of `target` to render the component immediately before.
 *
 * @property {() => Record<string, *> | Record<string, *>} [props] Props to pass to the component.
 *
 * @property {() => (Record<string, *> | Map<string, *>) | Map<string, *> | Record<string, *>} [context] The root-level
 * context to pass to the component.
 *
 * @property {boolean}  [hydrate] See description in main Svelte docs
 * {@link https://svelte.dev/docs/client-side-component-api#creating-a-component | Creating a component.}
 *
 * @property {boolean} [intro] If true, will play transitions on initial render, rather than waiting for subsequent
 * state changes.
*/
/* eslint-enable */
