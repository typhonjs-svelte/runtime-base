import { CrossWindow } from './CrossWindow';

/**
 * Provides a utility function to parse / construct fully qualified URL instances from a URL string.
 */
export class URLParser
{
   /**
    * @private
    */
   constructor()
   {
      throw new Error('URLParser constructor: This is a static class and should not be constructed.');
   }

   /**
    * Parses a URL string converting it to a fully qualified URL. If URL is an existing URL instance, it is returned
    * immediately. Optionally, you may construct a fully qualified URL from a relative base origin / path or with a
    * route prefix added to the current location origin.
    *
    * @param options - Options.
    *
    * @param options.url - URL string to convert to a URL.
    *
    * @param [options.base] - Optional fully qualified base path for relative URL construction.
    *
    * @param [options.routePrefix] - Optional route prefix to add to location origin for absolute URL strings
    *        when `base` is not defined.
    *
    * @returns Parsed URL or null if `url` is not parsed.
    */
   static parse({ url, base, routePrefix }: { url: string | URL, base?: string, routePrefix?: string }): URL | null
   {
      if (CrossWindow.isURL(url)) { return url; }

      if (typeof url !== 'string') { return null; }

      if (base !== void 0 && typeof base !== 'string') { return null; }

      if (routePrefix !== void 0 && typeof routePrefix !== 'string') { return null; }

      const targetURL = this.#createURL(url);

      // Parse and return already fully qualified `url` string.
      if (targetURL) { return targetURL; }

      let targetBase;

      // Parse relative url string.
      if (url.startsWith('./') || url.startsWith('../'))
      {
         // Relative from provided `base` or current path.
         targetBase = base ? base : `${globalThis.location.origin}${globalThis.location.pathname}`;
      }
      else
      {
         let targetRoutePrefix = '';

         // Relative to current origin, but include any defined route prefix.
         if (routePrefix)
         {
            // Ensure route prefix starts and ends with `/` for proper URL parsing.
            targetRoutePrefix = routePrefix.startsWith('/') ? routePrefix : `/${routePrefix}`;
            targetRoutePrefix = targetRoutePrefix.endsWith('/') ? targetRoutePrefix : `${targetRoutePrefix}/`;
         }

         targetBase = `${globalThis.location.origin}${targetRoutePrefix}`;
      }

      return this.#createURL(url, targetBase);
   }

   // Internal implementation ----------------------------------------------------------------------------------------

   /**
    * Helper to create a URL and catch any exception. Useful until `URL.parse` and `URL.canParse` are more widespread.
    *
    * @param url - URL string.
    *
    * @param base - Base origin / path.
    *
    * @returns Valid URL or null.
    */
   static #createURL(url: string, base: string = ''): URL | null
   {
      try { return new URL(url, base); }
      catch(err) { return null; }
   }
}
