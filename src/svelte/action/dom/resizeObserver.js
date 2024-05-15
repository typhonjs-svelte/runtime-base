import { ResizeObserverManager } from '#runtime/util/browser';

/**
 * Provides a single global ResizeObserverManager instance for the resizeObserver action.
 *
 * @type {ResizeObserverManager}
 */
const resizeObserverActionManager = new ResizeObserverManager();

/**
 * Provides an action to monitor the given {@link HTMLElement} node with {@link ResizeObserver} via
 * {@link ResizeObserverManager} posting width / height changes to the {@link ResizeObserverData.ResizeTarget} in
 * various ways depending on the shape of the target. The target can be one of the following and the
 * precedence order is listed from top to bottom:
 *
 * - has a `resizeObserved` function as attribute; offset then content width / height are passed as parameters.
 * - has a `setContentBounds` function as attribute; content width / height are passed as parameters.
 * - has a `setDimension` function as attribute; offset width / height are passed as parameters.
 * - target is an object; offset and content width / height attributes directly set on target.
 * - target is a function; the function invoked with offset then content width / height parameters.
 * - has a writable store `resizeObserved` as an attribute; updated with offset & content width / height.
 * - has an object 'stores' that has a writable store `resizeObserved` as an attribute; updated with offset &
 *   content width / height.
 *
 * Note: Svelte currently uses an archaic IFrame based workaround to monitor offset / client width & height changes.
 * A more up to date way to do this is with ResizeObserver. To track when Svelte receives ResizeObserver support
 * monitor this issue: {@link https://github.com/sveltejs/svelte/issues/4233}
 *
 * Can-I-Use: {@link https://caniuse.com/resizeobserver}
 *
 * @param {HTMLElement} node - The node associated with the action.
 *
 * @param {import('#runtime/util/browser').ResizeObserverData.ResizeTarget} target - A {@link ResizeObserverManager}
 *        target to update with observed width & height changes.
 *
 * @returns {import('svelte/action').ActionReturn<import('#runtime/util/browser').ResizeObserverData.ResizeTarget>} The
 *          action lifecycle methods.
 *
 * @see https://github.com/sveltejs/svelte/issues/4233
 */
function resizeObserver(node, target)
{
   resizeObserverActionManager.add(node, target);

   return {
      /**
       * @param {import('#runtime/util/browser').ResizeObserverData.ResizeTarget} newTarget - A
       *        {@link ResizeObserverManager} target to update with observed width & height changes.
       */
      update: (newTarget) =>
      {
         resizeObserverActionManager.remove(node, target);
         target = newTarget;
         resizeObserverActionManager.add(node, target);
      },

      destroy: () =>
      {
         resizeObserverActionManager.remove(node, target);
      }
   };
}

/**
 * Provides a function that when invoked with an element updates the cached styles for each subscriber of the element.
 *
 * The style attributes cached to calculate offset height / width include border & padding dimensions. You only need
 * to update the cache if you change border or padding attributes of the element.
 *
 * @param {HTMLElement} el - A HTML element.
 */
resizeObserver.updateCache = function(el)
{
   resizeObserverActionManager.updateCache(el);
};

export { resizeObserver };
