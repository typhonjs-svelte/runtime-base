import { Timing } from '@typhonjs-svelte/runtime-base/util';
import { isWritableStore } from '@typhonjs-svelte/runtime-base/util/store';
import { ResizeObserverManager } from '@typhonjs-svelte/runtime-base/util/dom/observer/resize';
import { isObject } from '@typhonjs-svelte/runtime-base/util/object';

/**
 * Provides an action to always blur the element when any pointer up event occurs on the element.
 *
 * @param {HTMLElement}   node - The node to handle always blur on pointer up.
 *
 * @returns {import('svelte/action').ActionReturn} Lifecycle functions.
 */
function alwaysBlur(node)
{
   /**
    * Blurs node if active element.
    */
   function blurNode()
   {
      setTimeout(() => { if (document.activeElement === node) { node.blur(); } }, 0);
   }

   node.addEventListener('pointerup', blurNode);

   return {
      destroy: () => node.removeEventListener('pointerup', blurNode)
   };
}

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
 * @param {import('#runtime/util/dom/observer/resize').ResizeObserverData.ResizeTarget} target - A
 *        {@link ResizeObserverManager} target to update with observed width & height changes.
 *
 * @returns {(import('svelte/action').ActionReturn<
 *   import('#runtime/util/dom/observer/resize').ResizeObserverData.ResizeTarget
 * >)} The action lifecycle methods.
 *
 * @see https://github.com/sveltejs/svelte/issues/4233
 */
function resizeObserver(node, target)
{
   resizeObserverActionManager.add(node, target);

   return {
      /**
       * @param {import('#runtime/util/dom/observer/resize').ResizeObserverData.ResizeTarget} newTarget - A
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

/**
 * Provides an action to save `scrollTop` of an element with a vertical scrollbar. This action should be used on the
 * scrollable element and must include a writable store that holds the active store for the current `scrollTop` value.
 * You may switch the stores externally and this action will set the `scrollTop` based on the newly set store. This is
 * useful for instance providing a select box that controls the scrollable container.
 *
 * @param {HTMLElement} element - The target scrollable HTML element.
 *
 * @param {import('svelte/store').Writable<number>}   store - A writable store that stores the element scrollTop.
 *
 * @returns {import('svelte/action').ActionReturn<import('svelte/store').Writable<number>>} Lifecycle functions.
 */
function applyScrolltop(element, store)
{
   if (!isWritableStore(store))
   {
      throw new TypeError(`applyScrolltop error: 'store' must be a writable Svelte store.`);
   }

   /**
    * Updates element `scrollTop`.
    *
    * @param {number}   value -
    */
   function storeUpdate(value)
   {
      if (!Number.isFinite(value)) { return; }

      // For some reason for scrollTop to take on first update from a new element setTimeout is necessary.
      setTimeout(() => element.scrollTop = value, 0);
   }

   let unsubscribe = store.subscribe(storeUpdate);

   const resizeControl = resizeObserver(element, Timing.debounce(() =>
   {
      if (element.isConnected) { store.set(element.scrollTop); }
   }, 500));

   /**
    * Save target `scrollTop` to the current set store.
    *
    * @param {Event} event -
    */
   function onScroll(event)
   {
      store.set(event.target.scrollTop);
   }

   const debounceFn = Timing.debounce((e) => onScroll(e), 500);

   element.addEventListener('scroll', debounceFn);

   return {
      /**
       * @param {import('svelte/store').Writable<number>} newStore - A writable store that stores the element scrollTop.
       */
      update: (newStore) =>
      {
         unsubscribe();
         store = newStore;

         if (!isWritableStore(store))
         {
            throw new TypeError(`applyScrolltop.update error: 'store' must be a writable Svelte store.`);
         }

         unsubscribe = store.subscribe(storeUpdate);
      },

      destroy: () =>
      {
         element.removeEventListener('scroll', debounceFn);
         unsubscribe();
         resizeControl.destroy();
      }
   };
}

/**
 * Provides an action to apply style properties provided as an object.
 *
 * @param {HTMLElement} node - Target element
 *
 * @param {Record<string, string>}  properties - Key / value object of properties to set.
 *
 * @returns {import('svelte/action').ActionReturn<Record<string, string>>} Lifecycle functions.
 */
function applyStyles(node, properties)
{
   /** Sets properties on node. */
   function setProperties()
   {
      if (!isObject(properties)) { return; }

      for (const prop of Object.keys(properties))
      {
         node.style.setProperty(`${prop}`, properties[prop]);
      }
   }

   setProperties();

   return {
      /**
       * @param {Record<string, string>}  newProperties - Key / value object of properties to set.
       */
      update: (newProperties) =>
      {
         properties = newProperties;
         setProperties();
      }
   };
}

/**
 * Provides an action to blur the element when any pointer down event occurs outside the element. This can be useful
 * for input elements including select to blur / unfocus the element when any pointer down occurs outside the element.
 *
 * @param {HTMLElement}   node - The node to handle automatic blur on focus loss.
 *
 * @returns {import('svelte/action').ActionReturn} Lifecycle functions.
 */
function autoBlur(node)
{
   /**
    * Removes listener on blur.
    */
   function onBlur() { document.body.removeEventListener('pointerdown', onPointerDown); }

   /**
    * Adds listener on focus.
    */
   function onFocus() { document.body.addEventListener('pointerdown', onPointerDown); }

   /**
    * Blur the node if a pointer down event happens outside the node.
    *
    * @param {PointerEvent} event -
    */
   function onPointerDown(event)
   {
      if (event.target === node || node.contains(event.target)) { return; }

      if (document.activeElement === node) { node.blur(); }
   }

   node.addEventListener('blur', onBlur);
   node.addEventListener('focus', onFocus);

   return {
      destroy: () =>
      {
         document.body.removeEventListener('pointerdown', onPointerDown);
         node.removeEventListener('blur', onBlur);
         node.removeEventListener('focus', onFocus);
      }
   };
}

/**
 * Provides an action to monitor focus state of a given element and set an associated store with current focus state.
 *
 * This action is usable with any writable store.
 *
 * @param {HTMLElement} node - Target element.
 *
 * @param {import('svelte/store').Writable<boolean>}  storeFocused - Update store for focus changes.
 *
 * @returns {import('svelte/action').ActionReturn<import('svelte/store').Writable<boolean>>} Lifecycle functions.
 */
function isFocused(node, storeFocused)
{
   let localFocused = false;

   /**
    * Updates `storeFocused` w/ current focused state.
    *
    * @param {boolean}  current - current focused state.
    */
   function setFocused(current)
   {
      localFocused = current;

      if (isWritableStore(storeFocused)) { storeFocused.set(localFocused); }
   }

   /**
    * Focus event listener.
    */
   function onFocus()
   {
      setFocused(true);
   }

   /**
    * Blur event listener.
    */
   function onBlur()
   {
      setFocused(false);
   }

   /**
    * Activate listeners.
    */
   function activateListeners()
   {
      node.addEventListener('focus', onFocus);
      node.addEventListener('blur', onBlur);
   }

   /**
    * Remove listeners.
    */
   function removeListeners()
   {
      node.removeEventListener('focus', onFocus);
      node.removeEventListener('blur', onBlur);
   }

   activateListeners();

   return {
      /**
       * @param {import('svelte/store').Writable<boolean>}  newStoreFocused - Update store for focus changes.
       */
      update: (newStoreFocused) =>
      {
         storeFocused = newStoreFocused;
         setFocused(localFocused);
      },

      destroy: () => removeListeners()
   };
}

export { alwaysBlur, applyScrolltop, applyStyles, autoBlur, isFocused, resizeObserver };
//# sourceMappingURL=index.js.map
