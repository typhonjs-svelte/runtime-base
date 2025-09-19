import * as svelte_action from 'svelte/action';

/**
 * Provides a popover tooltip action that by default uses the elements `title` attribute.
 *
 * Depending on the runtime and platform the use of `title` may be replaced with an alternate tooltip implementation.
 *
 * @param {HTMLElement} node - Target element.
 *
 * @param {TooltipOptions} options - Options.
 *
 * @returns {import('svelte/action').ActionReturn<TooltipOptions>} Lifecycle functions.
 */
declare function popoverTooltip(
  node: HTMLElement,
  { tooltip, ariaLabel }: TooltipOptions,
): svelte_action.ActionReturn<TooltipOptions>;
type TooltipOptions = {
  /**
   * Tooltip value or language key.
   */
  tooltip?: string;
  /**
   * When true, the tooltip value is also set to the `aria-label` attribute.
   */
  ariaLabel?: boolean;
};

export { popoverTooltip };
export type { TooltipOptions };
