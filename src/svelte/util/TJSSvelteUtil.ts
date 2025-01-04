// @ts-ignore
import { check_outros, group_outros, transition_out } from '#svelte/internal';

import type { SvelteComponent } from 'svelte';

/**
 * Various utilities to duck type / detect Svelte components and run outro transition while destroying a component
 * externally.
 */
class TJSSvelteUtil
{
   /**
    * Provides basic duck typing to determine if the provided function is a constructor function for a Svelte component.
    *
    * @param comp - Data to check as a Svelte component.
    *
    * @returns Whether basic duck typing succeeds.
    */
   static isComponent(comp: unknown): boolean
   {
      if (comp === null || comp === void 0 || typeof comp !== 'function') { return false; }

      // When using Vite in a developer build the SvelteComponent is wrapped in a ProxyComponent class.
      // This class doesn't define methods on the prototype, so we must check if the constructor name
      // starts with `Proxy<` as it provides the wrapped component as `Proxy<_wrapped component name_>`.
      const prototypeName: unknown = comp?.prototype?.constructor?.name;

      if (typeof prototypeName === 'string' && (prototypeName.startsWith('Proxy<') ||
       prototypeName === 'ProxyComponent'))
      {
         return true;
      }

      return typeof window !== 'undefined' ?
       typeof comp?.prototype?.$destroy === 'function' && typeof comp?.prototype?.$on === 'function' : // client-side
        typeof comp?.prototype?.render === 'function'; // server-side
   }

   /**
    * Provides basic duck typing to determine if the provided object is a HMR ProxyComponent instance or class.
    *
    * @param {unknown}  comp - Data to check as a HMR proxy component.
    *
    * @returns {boolean} Whether basic duck typing succeeds.
    */
   static isHMRProxy(comp: unknown): boolean
   {
      const instanceName: string | undefined = comp?.constructor?.name;
      if (typeof instanceName === 'string' && (instanceName.startsWith('Proxy<') || instanceName === 'ProxyComponent'))
      {
         return true;
      }

      // @ts-ignore
      const prototypeName: unknown = comp?.prototype?.constructor?.name;
      return typeof prototypeName === 'string' && (prototypeName.startsWith('Proxy<') ||
       prototypeName === 'ProxyComponent');
   }

   /**
    * Runs outro transition then destroys Svelte component.
    *
    * Workaround for https://github.com/sveltejs/svelte/issues/4056
    *
    * @param instance - A Svelte component.
    *
    * @returns Promise returned after outro transition completed and component destroyed.
    */
   static async outroAndDestroy(instance: SvelteComponent): Promise<void>
   {
      if (instance === void 0 || instance === null) { return Promise.resolve(); }

      return new Promise((resolve: () => void): void =>
      {
         if (instance?.$$?.fragment && instance?.$$?.fragment?.o)
         {
            group_outros();
            transition_out(instance.$$.fragment, 0, 0, () =>
            {
               instance?.$destroy?.();
               resolve();
            });
            check_outros();
         }
         else
         {
            instance?.$destroy?.();
            resolve();
         }
      });
   }
}

Object.seal(TJSSvelteUtil);

export { TJSSvelteUtil };
