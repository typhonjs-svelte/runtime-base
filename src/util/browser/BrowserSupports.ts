/**
 * Provides utility methods for checking browser capabilities.
 *
 * @see https://kilianvalkhof.com/2021/web/detecting-media-query-support-in-css-and-javascript/
 *
 * @privateRemarks
 * TODO: perhaps add support for various standard media query checks for level 4 & 5.
 */
export class BrowserSupports
{
   /**
    * @private
    */
   constructor()
   {
      throw new Error('BrowserSupports constructor: This is a static class and should not be constructed.');
   }

   /**
    * Check for container query support.
    *
    * @returns True if container queries supported.
    */
   static get containerQueries(): boolean
   {
      return 'container' in document.documentElement.style;
   }
}
