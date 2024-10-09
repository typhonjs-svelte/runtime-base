import { isMinimalWritableStore } from '@typhonjs-svelte/runtime-base/svelte/store/util';

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
 * @param {import('#runtime/svelte/store/util').MinimalWritable<boolean>}  storeFocused - Update store for focus
 *        changes.
 *
 * @returns {(import('svelte/action').ActionReturn<
 *    import('#runtime/svelte/store/util').MinimalWritable<boolean>
 * >)} Lifecycle functions.
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

      if (isMinimalWritableStore(storeFocused)) { storeFocused.set(localFocused); }
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
       * @param {import('#runtime/svelte/store/util').MinimalWritable<boolean>}  newStoreFocused - Update store for
       *        focus changes.
       */
      update: (newStoreFocused) =>
      {
         storeFocused = newStoreFocused;
         setFocused(localFocused);
      },

      destroy: () => removeListeners()
   };
}

export { alwaysBlur, autoBlur, isFocused };
//# sourceMappingURL=index.js.map
