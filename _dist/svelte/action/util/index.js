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
function dynamicAction(node, { action, data, warn } = {})
{
   let actionResult;

   if (typeof warn !== 'boolean') { warn = false; }

   if (warn && typeof action !== 'function')
   {
      console.warn(`dynamicAction initialize warning: 'action' is not a function.`);
   }

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
            if (warn)
            {
               console.warn(`dynamicAction.update warning: Aborting update as new options is not an object.`);
            }

            actionResult?.destroy?.();
            action = void 0;
            data = void 0;

            return;
         }

         const { action: newAction, data: newData, warn: newWarn } = newOptions;

         warn = typeof newWarn === 'boolean' ? newWarn : false;

         if (warn && typeof newAction !== 'function')
         {
            console.warn(`dynamicAction.update warning: New action is not a function.`);
         }

         const hasNewData = newData !== data;

         if (hasNewData) { data = newData; }

         if (newAction !== action)
         {
            // If the action changes destroy the previous action and apply the new one.
            actionResult?.destroy?.();

            action = newAction;

            actionResult = typeof action === 'function' ? action(node, data) : void 0;
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
