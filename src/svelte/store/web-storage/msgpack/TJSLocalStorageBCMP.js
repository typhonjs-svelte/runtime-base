import { localStoresBCMP } from './index.js';

import { TJSWebStorage }   from '#runtime/svelte/store/web-storage';

/**
 * Provides a {@link TJSWebStorage} instance for browser local storage using compressed MessagePack to base64.
 */
export class TJSLocalStorageBCMP extends TJSWebStorage
{
   constructor()
   {
      super(localStoresBCMP);
   }
}
