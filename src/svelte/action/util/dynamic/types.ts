import type { Action } from 'svelte/action';

/**
 * Options for {@link dynamicAction}. Provide the hosted action and any associated data that is passed to the action.
 * You may update the action or data dynamically to apply new actions.
 */
export type DynamicActionOptions = undefined | {
   action: Action<HTMLElement, unknown>;

   data?: unknown
}
