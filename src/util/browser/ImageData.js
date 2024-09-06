import {
   isIterable,
   isObject,
   safeAccess }   from '#runtime/util/object';

/**
 * Provides utility functions for retrieving data about images.
 */
export class ImageData
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
