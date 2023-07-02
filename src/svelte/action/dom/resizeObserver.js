import { StyleParse }         from '#runtime/util/browser';
import { isObject }           from '#runtime/util/object';
import { isUpdatableStore }   from '#runtime/util/store';

/**
 * Provides an action to monitor the given HTMLElement node with `ResizeObserver` posting width / height changes
 * to the target in various ways depending on the shape of the target. The target can be one of the following and the
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
 * @param {HTMLElement}          node - The node associated with the action.
 *
 * @param {ResizeObserverTarget} target - An object or function to update with observed width & height changes.
 *
 * @returns {import('svelte/action').ActionReturn<ResizeObserverTarget>} The action lifecycle methods.
 * @see {@link https://github.com/sveltejs/svelte/issues/4233}
 */
function resizeObserver(node, target)
{
   ResizeObserverManager.add(node, target);

   return {
      /**
       * @param {ResizeObserverTarget} newTarget - An object or function to update with observed width & height changes.
       */
      update: (newTarget) =>
      {
         ResizeObserverManager.remove(node, target);
         target = newTarget;
         ResizeObserverManager.add(node, target);
      },

      destroy: () =>
      {
         ResizeObserverManager.remove(node, target);
      }
   };
}

/**
 * Provides a function that when invoked with an element updates the cached styles for each subscriber of the element.
 *
 * The style attributes cached to calculate offset height / width include border & padding dimensions. You only need
 * to update the cache if you change border or padding attributes of the element.
 *
 * @param {HTMLElement} el - An HTML element.
 */
resizeObserver.updateCache = function(el)
{
   if (!(el instanceof HTMLElement)) { throw new TypeError(`resizeObserverUpdate error: 'el' is not an HTMLElement.`); }

   const subscribers = s_MAP.get(el);

   if (Array.isArray(subscribers))
   {
      const computed = globalThis.getComputedStyle(el);

      // Cache styles first from any inline styles then computed styles defaulting to 0 otherwise.
      // Used to create the offset width & height values from the context box ResizeObserver provides.
      const borderBottom = StyleParse.pixels(el.style.borderBottom) ?? StyleParse.pixels(computed.borderBottom) ?? 0;
      const borderLeft = StyleParse.pixels(el.style.borderLeft) ?? StyleParse.pixels(computed.borderLeft) ?? 0;
      const borderRight = StyleParse.pixels(el.style.borderRight) ?? StyleParse.pixels(computed.borderRight) ?? 0;
      const borderTop = StyleParse.pixels(el.style.borderTop) ?? StyleParse.pixels(computed.borderTop) ?? 0;
      const paddingBottom = StyleParse.pixels(el.style.paddingBottom) ?? StyleParse.pixels(computed.paddingBottom) ?? 0;
      const paddingLeft = StyleParse.pixels(el.style.paddingLeft) ?? StyleParse.pixels(computed.paddingLeft) ?? 0;
      const paddingRight = StyleParse.pixels(el.style.paddingRight) ?? StyleParse.pixels(computed.paddingRight) ?? 0;
      const paddingTop = StyleParse.pixels(el.style.paddingTop) ?? StyleParse.pixels(computed.paddingTop) ?? 0;

      const additionalWidth = borderLeft + borderRight + paddingLeft + paddingRight;
      const additionalHeight = borderTop + borderBottom + paddingTop + paddingBottom;

      for (const subscriber of subscribers)
      {
         subscriber.styles.additionalWidth = additionalWidth;
         subscriber.styles.additionalHeight = additionalHeight;
         s_UPDATE_SUBSCRIBER(subscriber, subscriber.contentWidth, subscriber.contentHeight);
      }
   }
};

export { resizeObserver };

// Below is the static ResizeObserverManager ------------------------------------------------------------------------

const s_MAP = new Map();

/**
 * Provides a static / single instance of ResizeObserver that can notify listeners in different ways.
 *
 * The action, {@link resizeObserver}, utilizes ResizeObserverManager for automatic registration and removal
 * via Svelte.
 */
class ResizeObserverManager
{
   /**
    * Add an HTMLElement and ResizeObserverTarget instance for monitoring. Create cached style attributes for the
    * given element include border & padding dimensions for offset width / height calculations.
    *
    * @param {HTMLElement}    el - The element to observe.
    *
    * @param {ResizeObserverTarget} target - A target that contains one of several mechanisms for updating resize data.
    */
   static add(el, target)
   {
      const updateType = s_GET_UPDATE_TYPE(target);

      if (updateType === 0)
      {
         throw new Error(`'target' does not match supported ResizeObserverManager update mechanisms.`);
      }

      const computed = globalThis.getComputedStyle(el);

      // Cache styles first from any inline styles then computed styles defaulting to 0 otherwise.
      // Used to create the offset width & height values from the context box ResizeObserver provides.
      const borderBottom = StyleParse.pixels(el.style.borderBottom) ?? StyleParse.pixels(computed.borderBottom) ?? 0;
      const borderLeft = StyleParse.pixels(el.style.borderLeft) ?? StyleParse.pixels(computed.borderLeft) ?? 0;
      const borderRight = StyleParse.pixels(el.style.borderRight) ?? StyleParse.pixels(computed.borderRight) ?? 0;
      const borderTop = StyleParse.pixels(el.style.borderTop) ?? StyleParse.pixels(computed.borderTop) ?? 0;
      const paddingBottom = StyleParse.pixels(el.style.paddingBottom) ?? StyleParse.pixels(computed.paddingBottom) ?? 0;
      const paddingLeft = StyleParse.pixels(el.style.paddingLeft) ?? StyleParse.pixels(computed.paddingLeft) ?? 0;
      const paddingRight = StyleParse.pixels(el.style.paddingRight) ?? StyleParse.pixels(computed.paddingRight) ?? 0;
      const paddingTop = StyleParse.pixels(el.style.paddingTop) ?? StyleParse.pixels(computed.paddingTop) ?? 0;

      const data = {
         updateType,
         target,

         // Stores most recent contentRect.width and contentRect.height values from ResizeObserver.
         contentWidth: 0,
         contentHeight: 0,

         // Convenience data for total border & padding for offset width & height calculations.
         styles: {
            additionalWidth: borderLeft + borderRight + paddingLeft + paddingRight,
            additionalHeight: borderTop + borderBottom + paddingTop + paddingBottom
         }
      };

      if (s_MAP.has(el))
      {
         const subscribers = s_MAP.get(el);
         subscribers.push(data);
      }
      else
      {
         s_MAP.set(el, [data]);
      }

      s_RESIZE_OBSERVER.observe(el);
   }

   /**
    * Removes all targets from monitoring when just an element is provided otherwise removes a specific target
    * from the monitoring map. If no more targets remain then the element is removed from monitoring.
    *
    * @param {HTMLElement}          el - Element to remove from monitoring.
    *
    * @param {ResizeObserverTarget} [target] - A specific target to remove from monitoring.
    */
   static remove(el, target = void 0)
   {
      const subscribers = s_MAP.get(el);
      if (Array.isArray(subscribers))
      {
         const index = subscribers.findIndex((entry) => entry.target === target);
         if (index >= 0)
         {
            // Update target subscriber with undefined values.
            s_UPDATE_SUBSCRIBER(subscribers[index], void 0, void 0);

            subscribers.splice(index, 1);
         }

         // Remove element monitoring if last target removed.
         if (subscribers.length === 0)
         {
            s_MAP.delete(el);
            s_RESIZE_OBSERVER.unobserve(el);
         }
      }
   }
}

/**
 * Defines the various shape / update type of the given target.
 *
 * @type {Record<string, number>}
 */
const s_UPDATE_TYPES = {
   none: 0,
   attribute: 1,
   function: 2,
   resizeObserved: 3,
   setContentBounds: 4,
   setDimension: 5,
   storeObject: 6,
   storesObject: 7
};

const s_RESIZE_OBSERVER = new ResizeObserver((entries) =>
{
   for (const entry of entries)
   {
      const subscribers = s_MAP.get(entry?.target);

      if (Array.isArray(subscribers))
      {
         const contentWidth = entry.contentRect.width;
         const contentHeight = entry.contentRect.height;

         for (const subscriber of subscribers)
         {
            s_UPDATE_SUBSCRIBER(subscriber, contentWidth, contentHeight);
         }
      }
   }
});

/**
 * Determines the shape of the target instance regarding valid update mechanisms to set width & height changes.
 *
 * @param {*}  target - The target instance.
 *
 * @returns {number} Update type value.
 */
function s_GET_UPDATE_TYPE(target)
{
   if (target?.resizeObserved instanceof Function) { return s_UPDATE_TYPES.resizeObserved; }
   if (target?.setDimension instanceof Function) { return s_UPDATE_TYPES.setDimension; }
   if (target?.setContentBounds instanceof Function) { return s_UPDATE_TYPES.setContentBounds; }

   const targetType = typeof target;

   // Does the target have resizeObserved writable store?
   if (targetType !== null && (targetType === 'object' || targetType === 'function'))
   {
      if (isUpdatableStore(target.resizeObserved))
      {
         return s_UPDATE_TYPES.storeObject;
      }

      // Now check for a child stores object which is a common TRL pattern for exposing stores.
      const stores = target?.stores;
      if (isObject(stores) || typeof stores === 'function')
      {
         if (isUpdatableStore(stores.resizeObserved))
         {
            return s_UPDATE_TYPES.storesObject;
         }
      }
   }

   if (targetType !== null && targetType === 'object') { return s_UPDATE_TYPES.attribute; }

   if (targetType === 'function') { return s_UPDATE_TYPES.function; }

   return s_UPDATE_TYPES.none;
}

/**
 * Updates a subscriber target with given content width & height values. Offset width & height is calculated from
 * the content values + cached styles.
 *
 * @param {object}            subscriber - Internal data about subscriber.
 *
 * @param {number|undefined}  contentWidth - ResizeObserver contentRect.width value or undefined.
 *
 * @param {number|undefined}  contentHeight - ResizeObserver contentRect.height value or undefined.
 */
function s_UPDATE_SUBSCRIBER(subscriber, contentWidth, contentHeight)
{
   const styles = subscriber.styles;

   subscriber.contentWidth = contentWidth;
   subscriber.contentHeight = contentHeight;

   const offsetWidth = Number.isFinite(contentWidth) ? contentWidth + styles.additionalWidth : void 0;
   const offsetHeight = Number.isFinite(contentHeight) ? contentHeight + styles.additionalHeight : void 0;

   const target = subscriber.target;

   switch (subscriber.updateType)
   {
      case s_UPDATE_TYPES.attribute:
         target.contentWidth = contentWidth;
         target.contentHeight = contentHeight;
         target.offsetWidth = offsetWidth;
         target.offsetHeight = offsetHeight;
         break;

      case s_UPDATE_TYPES.function:
         target?.(offsetWidth, offsetHeight, contentWidth, contentHeight);
         break;

      case s_UPDATE_TYPES.resizeObserved:
         target.resizeObserved?.(offsetWidth, offsetHeight, contentWidth, contentHeight);
         break;

      case s_UPDATE_TYPES.setContentBounds:
         target.setContentBounds?.(contentWidth, contentHeight);
         break;

      case s_UPDATE_TYPES.setDimension:
         target.setDimension?.(offsetWidth, offsetHeight);
         break;

      case s_UPDATE_TYPES.storeObject:
         target.resizeObserved.update((object) =>
         {
            object.contentHeight = contentHeight;
            object.contentWidth = contentWidth;
            object.offsetHeight = offsetHeight;
            object.offsetWidth = offsetWidth;

            return object;
         });
         break;

      case s_UPDATE_TYPES.storesObject:
         target.stores.resizeObserved.update((object) =>
         {
            object.contentHeight = contentHeight;
            object.contentWidth = contentWidth;
            object.offsetHeight = offsetHeight;
            object.offsetWidth = offsetWidth;

            return object;
         });
         break;
   }
}

/**
 * @typedef {(
 *    offsetWidth: number,
 *    offsetHeight: number,
 *    contentWidth: number,
 *    contentHeight: number
 * ) => void } ResizeObserverFunction A function that receives offset / content height & width.
 */

/**
 * @typedef {ResizeObserverObject | ResizeObserverObjectExtended | ResizeObserverFunction} ResizeObserverTarget The
 *          receiving target for observed resize data.
 */

/**
 * @typedef {object} ResizeObserverObject A direct object to update observed resize updates.
 *
 * @property {number} [contentHeight] Direct attribute to store contentHeight.
 *
 * @property {number} [contentWidth] Direct attribute to store contentWidth.
 *
 * @property {number} [offsetHeight] Direct attribute to store offsetHeight.
 *
 * @property {number} [offsetWidth] Direct attribute to store offsetWidth.
 */

/**
 * @typedef {object} ResizeObserverObjectExtended Provides extended attributes supported for observed resize updates.
 *
 * @property {import('svelte/store').Writable<ResizeObserverObject> | ResizeObserverFunction} [resizedObserver] Either
 *           a function or a writable store.
 *
 * @property {(contentWidth: number, contentHeight: number) => void} [setContentBounds] - A function that is invoked
 *           with content width & height changes.
 *
 * @property {(offsetWidth: number, offsetHeight: number) => void} [setDimension] - A function that is invoked with
 *           offset width & height changes.
 *
 * @property {{resizedObserver: import('svelte/store').Writable<ResizeObserverObject>}} [stores] - An object with a
 *           `stores` attribute and subsequent `resizedObserver` writable store.
 */
