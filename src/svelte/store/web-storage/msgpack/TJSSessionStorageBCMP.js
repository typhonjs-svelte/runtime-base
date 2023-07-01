import { sessionStoresBCMP }  from './index.js';

import { TJSWebStorage }      from '#runtime/svelte/store/web-storage';

/**
 * Provides a {@link TJSWebStorage} instance for browser session storage using compressed MessagePack to base64.
 */
export class TJSSessionStorageBCMP extends TJSWebStorage
{
   constructor()
   {
      super(sessionStoresBCMP);
   }
}
