import { isObject }           from '#runtime/util/object';
import { isUpdatableStore }   from '#runtime/util/store';

import { A11yHelper }         from '../A11yHelper.js';
import { StyleParse }         from '../style';

/**
 * Provides an instance of ResizeObserver that can manage multiple elements and notify a wide range of target
 * listeners. Offset width and height is also provided through caching the margin and padding styles of the target
 * element.
 *
 * The action, {@link resizeObserver}, utilizes ResizeObserverManager for automatic registration and removal
 * via Svelte.
 */
export class ResizeObserverManager
{
   /** @type {Map<HTMLElement, import('./types-local').ResizeObserverSubscriber[]>} */
   #elMap = new Map();

   /** @type {ResizeObserver} */
   #resizeObserver;

   /**
    * Defines the various shape / update type of the given target.
    *
    * @type {Record<string, number>}
    */
   static #updateTypes = Object.freeze({
      none: 0,
      attribute: 1,
      function: 2,
      resizeObserved: 3,
      setContentBounds: 4,
      setDimension: 5,
      storeObject: 6,
      storesObject: 7
   });

   constructor()
   {
      this.#resizeObserver = new ResizeObserver((entries) =>
      {
         for (const entry of entries)
         {
            const subscribers = this.#elMap.get(entry?.target);

            if (Array.isArray(subscribers))
            {
               const contentWidth = entry.contentRect.width;
               const contentHeight = entry.contentRect.height;

               for (const subscriber of subscribers)
               {
                  ResizeObserverManager.#updateSubscriber(subscriber, contentWidth, contentHeight);
               }
            }
         }
      });
   }

   /**
    * Add an HTMLElement and ResizeObserverTarget instance for monitoring. Create cached style attributes for the
    * given element include border & padding dimensions for offset width / height calculations.
    *
    * @param {HTMLElement}    el - The element to observe.
    *
    * @param {import('./types').ResizeObserverData.Target} target - A target that contains one of several mechanisms
    *        for updating resize data.
    */
   add(el, target)
   {
      const updateType = ResizeObserverManager.#getUpdateType(target);

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

      /**
       * @type {import('./types-local').ResizeObserverSubscriber}
       */
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

      if (this.#elMap.has(el))
      {
         const subscribers = this.#elMap.get(el);
         subscribers.push(data);
      }
      else
      {
         this.#elMap.set(el, [data]);
      }

      this.#resizeObserver.observe(el);
   }

   /**
    * Removes all targets from monitoring when just an element is provided otherwise removes a specific target
    * from the monitoring map. If no more targets remain then the element is removed from monitoring.
    *
    * @param {HTMLElement}          el - Element to remove from monitoring.
    *
    * @param {import('./types').ResizeObserverData.Target} [target] - A specific target to remove from monitoring.
    */
   remove(el, target = void 0)
   {
      const subscribers = this.#elMap.get(el);
      if (Array.isArray(subscribers))
      {
         // Remove specific target from subscribers.
         if (target !== void 0)
         {
            const index = subscribers.findIndex((entry) => entry.target === target);
            if (index >= 0)
            {
               // Update target subscriber with undefined values.
               ResizeObserverManager.#updateSubscriber(subscribers[index], void 0, void 0);

               subscribers.splice(index, 1);
            }
         }
         else
         {
            // Remove all subscribers for element.
            for (const subscriber of subscribers)
            {
               // Update target subscriber with undefined values.
               ResizeObserverManager.#updateSubscriber(subscriber, void 0, void 0);
            }

            subscribers.length = 0;
         }

         // Remove element monitoring if last target removed.
         if (subscribers.length === 0)
         {
            this.#elMap.delete(el);
            this.#resizeObserver.unobserve(el);
         }
      }
   }

   /**
    * Provides a function that when invoked with an element updates the cached styles for each subscriber of the
    * element.
    *
    * The style attributes cached to calculate offset height / width include border & padding dimensions. You only need
    * to update the cache if you change border or padding attributes of the element.
    *
    * @param {HTMLElement} el - A HTML element.
    */
   updateCache(el)
   {
      if (!A11yHelper.isFocusTarget(el))
      {
         throw new TypeError(`ResizeObserverManager.updateCache error: 'el' is not an HTMLElement.`);
      }

      const subscribers = this.#elMap.get(el);

      if (Array.isArray(subscribers))
      {
         const computed = globalThis.getComputedStyle(el);

         // Cache styles first from any inline styles then computed styles defaulting to 0 otherwise.
         // Used to create the offset width & height values from the context box ResizeObserver provides.
         const borderBottom = StyleParse.pixels(el.style.borderBottom) ?? StyleParse.pixels(computed.borderBottom) ?? 0;
         const borderLeft = StyleParse.pixels(el.style.borderLeft) ?? StyleParse.pixels(computed.borderLeft) ?? 0;
         const borderRight = StyleParse.pixels(el.style.borderRight) ?? StyleParse.pixels(computed.borderRight) ?? 0;
         const borderTop = StyleParse.pixels(el.style.borderTop) ?? StyleParse.pixels(computed.borderTop) ?? 0;
         const paddingBottom = StyleParse.pixels(el.style.paddingBottom) ??
          StyleParse.pixels(computed.paddingBottom) ?? 0;
         const paddingLeft = StyleParse.pixels(el.style.paddingLeft) ?? StyleParse.pixels(computed.paddingLeft) ?? 0;
         const paddingRight = StyleParse.pixels(el.style.paddingRight) ?? StyleParse.pixels(computed.paddingRight) ?? 0;
         const paddingTop = StyleParse.pixels(el.style.paddingTop) ?? StyleParse.pixels(computed.paddingTop) ?? 0;

         const additionalWidth = borderLeft + borderRight + paddingLeft + paddingRight;
         const additionalHeight = borderTop + borderBottom + paddingTop + paddingBottom;

         for (const subscriber of subscribers)
         {
            subscriber.styles.additionalWidth = additionalWidth;
            subscriber.styles.additionalHeight = additionalHeight;
            ResizeObserverManager.#updateSubscriber(subscriber, subscriber.contentWidth, subscriber.contentHeight);
         }
      }
   }

   // Internal implementation ----------------------------------------------------------------------------------------

   /**
    * Determines the shape of the target instance regarding valid update mechanisms to set width & height changes.
    *
    * @param {import('./types').ResizeObserverData.Target}  target - The target instance.
    *
    * @returns {number} Update type value.
    */
   static #getUpdateType(target)
   {
      if (typeof target?.resizeObserved === 'function') { return this.#updateTypes.resizeObserved; }
      if (typeof target?.setDimension === 'function') { return this.#updateTypes.setDimension; }
      if (typeof target?.setContentBounds === 'function') { return this.#updateTypes.setContentBounds; }

      const targetType = typeof target;

      // Does the target have resizeObserved writable store?
      if (targetType !== null && (targetType === 'object' || targetType === 'function'))
      {
         if (isUpdatableStore(target.resizeObserved))
         {
            return this.#updateTypes.storeObject;
         }

         // Now check for a child stores object which is a common TRL pattern for exposing stores.
         const stores = target?.stores;
         if (isObject(stores) || typeof stores === 'function')
         {
            if (isUpdatableStore(stores.resizeObserved))
            {
               return this.#updateTypes.storesObject;
            }
         }
      }

      if (targetType !== null && targetType === 'object') { return this.#updateTypes.attribute; }

      if (targetType === 'function') { return this.#updateTypes.function; }

      return this.#updateTypes.none;
   }

   /**
    * Updates a subscriber target with given content width & height values. Offset width & height is calculated from
    * the content values + cached styles.
    *
    * @param {import('./types-local').ResizeObserverSubscriber} subscriber - Internal data about subscriber.
    *
    * @param {number|undefined}  contentWidth - ResizeObserver `contentRect.width` value or undefined.
    *
    * @param {number|undefined}  contentHeight - ResizeObserver `contentRect.height` value or undefined.
    */
   static #updateSubscriber(subscriber, contentWidth, contentHeight)
   {
      const styles = subscriber.styles;

      subscriber.contentWidth = contentWidth;
      subscriber.contentHeight = contentHeight;

      const offsetWidth = Number.isFinite(contentWidth) ? contentWidth + styles.additionalWidth : void 0;
      const offsetHeight = Number.isFinite(contentHeight) ? contentHeight + styles.additionalHeight : void 0;

      const target = subscriber.target;

      switch (subscriber.updateType)
      {
         case this.#updateTypes.attribute:
            target.contentWidth = contentWidth;
            target.contentHeight = contentHeight;
            target.offsetWidth = offsetWidth;
            target.offsetHeight = offsetHeight;
            break;

         case this.#updateTypes.function:
            target?.(offsetWidth, offsetHeight, contentWidth, contentHeight);
            break;

         case this.#updateTypes.resizeObserved:
            target.resizeObserved?.(offsetWidth, offsetHeight, contentWidth, contentHeight);
            break;

         case this.#updateTypes.setContentBounds:
            target.setContentBounds?.(contentWidth, contentHeight);
            break;

         case this.#updateTypes.setDimension:
            target.setDimension?.(offsetWidth, offsetHeight);
            break;

         case this.#updateTypes.storeObject:
            target.resizeObserved.update((object) =>
            {
               object.contentHeight = contentHeight;
               object.contentWidth = contentWidth;
               object.offsetHeight = offsetHeight;
               object.offsetWidth = offsetWidth;

               return object;
            });
            break;

         case this.#updateTypes.storesObject:
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
}
