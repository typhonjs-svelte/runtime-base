import { sessionStores }  from './index.js';

import { TJSWebStorage }  from './TJSWebStorage.js';

/**
 * Provides a {@link TJSWebStorage} instance for standard browser session storage use cases.
 */
export class TJSSessionStorage extends TJSWebStorage
{
   constructor()
   {
      super(sessionStores);
   }
}
