import { isIterable, isObject, safeAccess } from '@typhonjs-svelte/runtime-base/util/object';
import { CrossWindow } from '@typhonjs-svelte/runtime-base/util/browser';

/**
 * Provides utility functions for retrieving data about images.
 */
class ImageData
{
   /**
    * Loads given URLs into image elements returning those that resolved with width & height dimensions. This is useful
    * when the size of an image is necessary before usage.
    *
    * @param {string | { url?: string } | Iterable<string | { url?: string }>} urls - A list of image URLS to load or
    *        object with an `url` property.
    *
    * @param {object} [options] - Optional options.
    *
    * @param {string} [options.accessor='url'] - Accessor string to access child attribute when `urls` entry contains
    *        objects.
    *
    * @param {boolean} [options.warn=false] - Log debug warnings when a target URL can not be determined; default: false.
    *
    * @returns {(Promise<{
    *    fulfilled: { url: string, width: number, height: number }[],
    *    rejected: { url: string }[]
    * }>)} An object with `fulfilled` and `rejected` requests.
    */
   static async getDimensions(urls, { accessor = 'url', warn = false } = {})
   {
      const promises = [];
      const fulfilled = [];
      const rejected = [];

      const targetURLs = isIterable(urls) ? urls : [urls];

      for (const url of targetURLs)
      {
         let targetURL;

         if (typeof url === 'string')
         {
            targetURL = url;
         }
         else if (isObject(url))
         {
            targetURL = safeAccess(url, accessor);
         }

         if (typeof targetURL !== 'string')
         {
            if (warn)
            {
               console.warn('ImageData.getDimensions warning: Failed to locate target URL.');
            }

            continue;
         }

         promises.push(new Promise((resolve, reject) =>
         {
            const img = new Image();
            img.src = targetURL;

            // Get the actual width / height of the image.
            img.onload = () => resolve({ url: targetURL, width: img.naturalWidth, height: img.naturalHeight });
            img.onerror = () => reject({ url: targetURL });
         }));
      }

      const promiseResults = await Promise.allSettled(promises);

      for (const result of promiseResults)
      {
         switch (result.status)
         {
            case 'fulfilled':
               fulfilled.push(result.value);
               break;

            case 'rejected':
               rejected.push(result.reason);
               break;
         }
      }

      return { fulfilled, rejected };
   }
}

/**
 * Provides management of a single Promise that can be shared and accessed across JS & Svelte components. This allows a
 * Promise to be created and managed as part of the TRL application lifecycle and accessed safely in various control
 * flow scenarios. When resolution of the current managed Promise starts further interaction is prevented.
 *
 * Note: to enable debugging / log statements set the static `logging` variable to true.
 */
class ManagedPromise
{
   /** @type {boolean} */
   static #logging = false;

   /** @type {{ isProcessing?: boolean, promise?: Promise, reject: Function, resolve: Function }} */
   #current;

   /**
    * @returns {boolean} Whether global logging is enabled.
    */
   static get logging()
   {
      return this.#logging;
   }

   /**
    * @returns {boolean} Whether there is an active managed Promise.
    */
   get isActive()
   {
      return this.#current !== void 0;
   }

   /**
    * @returns {boolean} Whether there is an active managed Promise and resolution is currently being processed.
    */
   get isProcessing()
   {
      return this.#current !== void 0 ? this.#current.isProcessing : false;
   }

   /**
    * Sets global logging enabled state.
    *
    * @param {boolean}  logging - New logging enabled state.
    */
   static set logging(logging)
   {
      if (typeof logging !== 'boolean')
      {
         throw new TypeError(`[TRL] ManagedPromise.logging error: 'logging' is not a boolean.`);
      }

      this.#logging = logging;
   }

   // ----------------------------------------------------------------------------------------------------------------

   /**
    * Resolves any current Promise with undefined and creates a new current Promise.
    *
    * @template T
    *
    * @param {object} opts - Options.
    *
    * @param {boolean}  [opts.reuse=false] - When true if there is an existing live Promise it is returned immediately.
    *
    * @returns {Promise<T>} The new current managed Promise.
    */
   create({ reuse = false } = {})
   {
      if (typeof reuse !== 'boolean')
      {
         throw new TypeError(`[TRL] ManagedPromise.create error: 'reuse' is not a boolean.`);
      }

      if (reuse && this.#current !== void 0 && CrossWindow.isPromise(this.#current.promise))
      {
         if (ManagedPromise.#logging)
         {
            console.warn(`[TRL] ManagedPromise.create info: Reusing / returning existing managed Promise.`);
         }

         return this.#current.promise;
      }

      if (this.#current !== void 0)
      {
         if (ManagedPromise.#logging)
         {
            console.warn(
             `[TRL] ManagedPromise.create info: Creating a new Promise and resolving existing immediately.`);
         }

         this.#current.resolve(void 0);
         this.#current = void 0;
      }

      const promise = new Promise((resolve, reject) =>
      {
         this.#current = {
            isProcessing: false,
            reject,
            resolve
         };
      });

      this.#current.promise = promise;

      return promise;
   }

   /**
    * Gets the current Promise if any.
    *
    * @returns {Promise<any>} Current Promise.
    */
   get()
   {
      return this.#current ? this.#current.promise : void 0;
   }

   /**
    * Rejects the current Promise if applicable.
    *
    * @param {*}  [result] - Result to reject.
    *
    * @returns {boolean} Was the promise rejected.
    */
   reject(result = void 0)
   {
      // Early out as Promise resolution is currently processing.
      if (this.#current !== void 0 && this.#current.isProcessing)
      {
         if (ManagedPromise.#logging)
         {
            console.warn(`[TRL] ManagedPromise.reject info: Currently processing promise.`);
         }

         return true;
      }

      if (this.#current !== void 0)
      {
         this.#current.isProcessing = true;

         if (CrossWindow.isPromise(result))
         {
            result.then((value) =>
            {
               this.#current.reject(value);
               this.#current = void 0;
            }).catch((err) =>
            {
               this.#current.reject(err);
               this.#current = void 0;
            });
         }
         else
         {
            this.#current.reject(result);
            this.#current = void 0;
         }

         return true;
      }
      else
      {
         if (ManagedPromise.#logging)
         {
            console.warn(`[TRL] ManagedPromise.reject warning: No current managed Promise to reject.`);
         }

         return false;
      }
   }

   /**
    * Resolves the current Promise if applicable.
    *
    * @param {*}  [result] - Result to resolve.
    *
    * @returns {boolean} Was the promise resolved.
    */
   resolve(result = void 0)
   {
      // Early out as Promise resolution is currently processing.
      if (this.#current !== void 0 && this.#current.isProcessing)
      {
         if (ManagedPromise.#logging)
         {
            console.warn(`[TRL] ManagedPromise.resolve info: Currently processing promise.`);
         }

         return true;
      }

      if (this.#current !== void 0)
      {
         if (CrossWindow.isPromise(result))
         {
            this.#current.isProcessing = true;

            result.then((value) =>
            {
               this.#current.resolve(value);
               this.#current = void 0;
            }).catch((err) =>
            {
               this.#current.reject(err);
               this.#current = void 0;
            });
         }
         else
         {
            this.#current.resolve(result);
            this.#current = void 0;
         }

         return true;
      }
      else
      {
         if (ManagedPromise.#logging)
         {
            console.warn(`[TRL] ManagedPromise.resolve warning: No current managed Promise to resolve.`);
         }

         return false;
      }
   }
}

export { ImageData, ManagedPromise };
//# sourceMappingURL=index.js.map
