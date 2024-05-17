import { isObject } from '@typhonjs-svelte/runtime-base/util/object';

/**
 * Applies the given action dynamically allowing the hosted action to be updated reactively while still appropriately
 * handling the action lifecycle methods.
 *
 * @param {HTMLElement} node - The node associated with the action.
 *
 * @param {import('./types').DynamicActionOptions} options - Defines the action to dynamically mount.
 *
 * @returns {import('svelte/action').ActionReturn<import('./types').DynamicActionOptions>} The action lifecycle
 *          methods.
 */
function dynamicAction(node, { action, data } = {})
{
   let actionResult;

   if (typeof action === 'function') { actionResult = action(node, data); }

   return {
      /**
       * @param {import('./types').DynamicActionOptions} newOptions - Defines the new action to dynamically mount.
       */
      update: (newOptions) =>
      {
         // If `newOptions` is not an object then destroy any old action.
         if (!isObject(newOptions))
         {
            actionResult?.destroy?.();
            action = void 0;
            data = void 0;

            return;
         }

         const { action: newAction, data: newData } = newOptions;

         if (typeof newAction !== 'function')
         {
            console.warn(`dynamicAction.update warning: Aborting as 'action' is not a function.`);
            return;
         }

         const hasNewData = newData !== data;

         if (hasNewData) { data = newData; }

         if (newAction !== action)
         {
            // If the action changes destroy the previous action and apply the new one.
            actionResult?.destroy?.();

            action = newAction;
            actionResult = action(node, data);
         }
         else if (hasNewData)
         {
            actionResult?.update?.(data);
         }
      },

      destroy: () =>
      {
         actionResult?.destroy?.();

         action = void 0;
         data = void 0;
         actionResult = void 0;
      }
   };
}

export { dynamicAction };
//# sourceMappingURL=index.js.map
