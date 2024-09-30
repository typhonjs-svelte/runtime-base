import { nextAnimationFrame }    from '#runtime/util/animate';

import { TJSPositionDataUtil }   from '../data';

/**
 * Decouples updates to any parent target HTMLElement inline styles. Invoke {@link TJSPosition.elementUpdated} to await
 * on the returned promise that is resolved with the current render time via `nextAnimationFrame` /
 * `requestAnimationFrame`. This allows the underlying data model to be updated immediately while updates to the
 * element are in sync with the browser and potentially in the future be further throttled.
 *
 * @param {HTMLElement} el - The target HTMLElement.
 */
export class UpdateElementManager
{
   /**
    * Stores the active list of all TJSPosition instances currently updating. The list entries are recycled between
    * updates.
    *
    * @type {[HTMLElement, import('./').UpdateElementData][]}
    */
   static list = [];

   /**
    * Tracks the current position in the list.
    *
    * @type {number}
    */
   static listCntr = 0;

   static updatePromise;

   /**
    * Potentially adds the given element and internal updateData instance to the list.
    *
    * @param {HTMLElement}       el - An HTMLElement instance.
    *
    * @param {import('./').UpdateElementData} updateData - An UpdateElementData instance.
    *
    * @returns {Promise<number>} The unified next frame update promise. Returns `currentTime`.
    */
   static add(el, updateData)
   {
      if (this.listCntr < this.list.length)
      {
         const entry = this.list[this.listCntr];
         entry[0] = el;
         entry[1] = updateData;
      }
      else
      {
         this.list.push([el, updateData]);
      }

      this.listCntr++;
      updateData.queued = true;

      if (!this.updatePromise) { this.updatePromise = this.wait(); }

      return this.updatePromise;
   }

   /**
    * Await on `nextAnimationFrame` and iterate over list map invoking callback functions.
    *
    * @returns {Promise<number>} The next frame Promise / currentTime from nextAnimationFrame.
    */
   static async wait()
   {
      // Await the next animation frame. In the future this can be extended to multiple frames to divide update rate.
      const currentTime = await nextAnimationFrame();

      this.updatePromise = void 0;

      for (let cntr = this.listCntr; --cntr >= 0;)
      {
         // Obtain data for entry.
         const entry = this.list[cntr];
         const el = entry[0];
         const updateData = entry[1];

         // Clear entry data.
         entry[0] = void 0;
         entry[1] = void 0;

         // Reset queued state.
         updateData.queued = false;

         // Early out if the element is no longer connected to the DOM / shadow root.
         // if (!el.isConnected || !updateData.changeSet.hasChange()) { continue; }
         if (!el.isConnected) { continue; }

         if (updateData.options.ortho)
         {
            UpdateElementManager.#updateElementOrtho(el, updateData);
         }
         else
         {
            UpdateElementManager.#updateElement(el, updateData);
         }

         // If calculate transform options is enabled then update the transform data and set the readable store.
         if (updateData.options.calculateTransform || updateData.options.transformSubscribed)
         {
            UpdateElementManager.#updateTransform(el, updateData);
         }

         // Update all subscribers with changed data.
         this.updateSubscribers(updateData);
      }

      this.listCntr = 0;

      return currentTime;
   }

   /**
    * Potentially immediately updates the given element.
    *
    * @param {HTMLElement}       el - An HTMLElement instance.
    *
    * @param {import('./').UpdateElementData} updateData - An UpdateElementData instance.
    */
   static immediate(el, updateData)
   {
      // Early out if the element is no longer connected to the DOM / shadow root.
      // if (!el.isConnected || !updateData.changeSet.hasChange()) { continue; }
      if (!el.isConnected) { return; }

      if (updateData.options.ortho)
      {
         UpdateElementManager.#updateElementOrtho(el, updateData);
      }
      else
      {
         UpdateElementManager.#updateElement(el, updateData);
      }

      // If calculate transform options is enabled then update the transform data and set the readable store.
      if (updateData.options.calculateTransform || updateData.options.transformSubscribed)
      {
         UpdateElementManager.#updateTransform(el, updateData);
      }

      // Update all subscribers with changed data.
      this.updateSubscribers(updateData);
   }

   /**
    * @param {import('./').UpdateElementData} updateData - Data change set.
    */
   static updateSubscribers(updateData)
   {
      const data = updateData.data;
      const changeSet = updateData.changeSet;

      if (!changeSet.hasChange()) { return; }

      // Make a copy of the data.
      const output = TJSPositionDataUtil.copyData(data, updateData.dataSubscribers);

      const subscribers = updateData.subscribers;

      // Early out if there are no subscribers.
      if (subscribers.length > 0)
      {
         for (let cntr = 0; cntr < subscribers.length; cntr++) { subscribers[cntr](output); }
      }

      // Update dimension data if width / height has changed.
      if (changeSet.width || changeSet.height)
      {
         updateData.dimensionData.width = data.width;
         updateData.dimensionData.height = data.height;
         updateData.storeDimension.set(updateData.dimensionData);
      }

      changeSet.set(false);
   }

   // Internal Implementation ----------------------------------------------------------------------------------------

   /**
    * Temporary data for validation.
    *
    * @type {{width, marginTop, height, marginLeft}}
    */
   static #validationData = Object.seal({
      height: void 0,
      width: void 0,
      marginLeft: void 0,
      marginTop: void 0
   });

   /**
    * Decouples updates to any parent target HTMLElement inline styles. Invoke {@link TJSPosition.elementUpdated} to
    * await on the returned promise that is resolved with the current render time via `nextAnimationFrame` /
    * `requestAnimationFrame`. This allows the underlying data model to be updated immediately while updates to the
    * element are in sync with the browser and potentially in the future be further throttled.
    *
    * @param {HTMLElement} el - The target HTMLElement.
    *
    * @param {import('./').UpdateElementData} updateData - Update data.
    */
   static #updateElement(el, updateData)
   {
      const changeSet = updateData.changeSet;
      const data = updateData.data;

      if (changeSet.left)
      {
         el.style.left = `${data.left}px`;
      }

      if (changeSet.top)
      {
         el.style.top = `${data.top}px`;
      }

      if (changeSet.zIndex)
      {
         el.style.zIndex = typeof data.zIndex === 'number' ? `${data.zIndex}` : null;
      }

      if (changeSet.width)
      {
         el.style.width = typeof data.width === 'number' ? `${data.width}px` : data.width;
      }

      if (changeSet.height)
      {
         el.style.height = typeof data.height === 'number' ? `${data.height}px` : data.height;
      }

      if (changeSet.transformOrigin)
      {
         el.style.transformOrigin = data.transformOrigin;
      }

      // Update all transforms in order added to transforms object.
      if (changeSet.transform)
      {
         el.style.transform = updateData.transforms.isActive ? updateData.transforms.getCSS() : null;
      }
   }

   /**
    * Decouples updates to any parent target HTMLElement inline styles. Invoke
    * {@link TJSPosition.elementUpdated} to await on the returned promise that is resolved with the current
    * render time via `nextAnimationFrame` / `requestAnimationFrame`. This allows the underlying data model to be updated
    * immediately while updates to the element are in sync with the browser and potentially in the future be further
    * throttled.
    *
    * @param {HTMLElement} el - The target HTMLElement.
    *
    * @param {import('./').UpdateElementData} updateData - Update data.
    */
   static #updateElementOrtho(el, updateData)
   {
      const changeSet = updateData.changeSet;
      const data = updateData.data;

      if (changeSet.zIndex)
      {
         el.style.zIndex = typeof data.zIndex === 'number' ? `${data.zIndex}` : null;
      }

      if (changeSet.width)
      {
         el.style.width = typeof data.width === 'number' ? `${data.width}px` : data.width;
      }

      if (changeSet.height)
      {
         el.style.height = typeof data.height === 'number' ? `${data.height}px` : data.height;
      }

      if (changeSet.transformOrigin)
      {
         el.style.transformOrigin = data.transformOrigin;
      }

      // Update all transforms in order added to transforms object.
      if (changeSet.left || changeSet.top || changeSet.transform)
      {
         el.style.transform = updateData.transforms.getCSSOrtho(data);
      }
   }

   /**
    * Updates the applied transform data and sets the readble `transform` store.
    *
    * @param {HTMLElement} el - The target HTMLElement.
    *
    * @param {import('./').UpdateElementData} updateData - Update element data.
    */
   static #updateTransform(el, updateData)
   {
      const validationData = this.#validationData;

      validationData.height = updateData.data.height !== 'auto' && updateData.data.height !== 'inherit' ?
       updateData.data.height : updateData.styleCache.offsetHeight;

      validationData.width = updateData.data.width !== 'auto' && updateData.data.height !== 'inherit' ?
       updateData.data.width : updateData.styleCache.offsetWidth;

      validationData.marginLeft = updateData.styleCache.marginLeft;

      validationData.marginTop = updateData.styleCache.marginTop;

      // Get transform data. First set constraints including any margin top / left as offsets and width / height. Used
      // when position width / height is 'auto'.
      updateData.transforms.getData(updateData.data, updateData.transformData, validationData);

      updateData.storeTransform.set(updateData.transformData);
   }
}
