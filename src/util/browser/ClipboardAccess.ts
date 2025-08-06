import { CrossWindow } from './CrossWindow';

/**
 * Provides access to the Clipboard API for reading / writing text strings. This requires a secure context.
 *
 * Note: `writeText` will attempt to use the older `execCommand` if available when `navigator.clipboard` is not
 * available.
 */
export class ClipboardAccess
{
   /**
    * @private
    */
   constructor() {} // eslint-disable-line no-useless-constructor

   /**
    * Uses `navigator.clipboard` if available to read text from the clipboard.
    *
    * Note: Always returns `undefined` when `navigator.clipboard` is not available or the clipboard contains the
    * empty string.
    *
    * @param [activeWindow=window] Optional active current window.
    *
    * @returns {Promise<string|undefined>} The current clipboard text or undefined.
    */
   static async readText(activeWindow: Window = window): Promise<string | undefined>
   {
      let result: string = '';

      if (!CrossWindow.isWindow(activeWindow))
      {
         throw new TypeError(`ClipboardAccess.readText error: 'activeWindow' is not a Window.`);
      }

      if (activeWindow?.navigator?.clipboard)
      {
         try
         {
            result = await activeWindow.navigator.clipboard.readText();
         }
         catch (err) { /**/ }
      }

      return result === '' ? void 0 : result;
   }

   /**
    * Uses `navigator.clipboard` if available then falls back to `document.execCommand('copy')` if available to copy
    * the given text to the clipboard.
    *
    * @param text - Text to copy to the browser clipboard.
    *
    * @param [activeWindow=window] Optional active current window.
    *
    * @returns Copy successful.
    */
   static async writeText(text: string, activeWindow: Window = window): Promise<boolean>
   {
      if (typeof text !== 'string')
      {
         throw new TypeError(`ClipboardAccess.writeText error: 'text' is not a string.`);
      }

      if (!CrossWindow.isWindow(activeWindow))
      {
         throw new TypeError(`ClipboardAccess.writeText error: 'activeWindow' is not a Window.`);
      }

      let success = false;

      if (activeWindow?.navigator?.clipboard)
      {
         try
         {
            await activeWindow.navigator.clipboard.writeText(text);
            success = true;
         }
         catch (err) { /**/ }
      }
      else if (typeof activeWindow?.document?.execCommand === 'function')
      {
         const textArea = activeWindow.document.createElement('textarea');

         // Place in the top-left corner of the screen regardless of scroll position.
         textArea.style.position = 'fixed';
         textArea.style.top = '0';
         textArea.style.left = '0';

         // Ensure it has a small width and height. Setting to 1px / 1em
         // doesn't work as this gives a negative w/h on some browsers.
         textArea.style.width = '2em';
         textArea.style.height = '2em';

         // We don't need padding, reducing the size if it does flash render.
         textArea.style.padding = '0';

         // Clean up any borders.
         textArea.style.border = 'none';
         textArea.style.outline = 'none';
         textArea.style.boxShadow = 'none';

         // Avoid the flash of the white box if rendered for any reason.
         textArea.style.background = 'transparent';

         textArea.value = text;

         activeWindow.document.body.appendChild(textArea);
         textArea.focus();
         textArea.select();

         try
         {
            success = activeWindow.document.execCommand('copy');
         }
         catch (err) { /**/ }

         activeWindow.document.body.removeChild(textArea);
      }

      return success;
   }
}
