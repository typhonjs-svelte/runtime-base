import { localStores }     from './index.js';

import { TJSWebStorage }   from './TJSWebStorage.js';

/**
 * Provides a {@link TJSWebStorage} instance for standard browser local storage use cases.
 */
export class TJSLocalStorage extends TJSWebStorage
{
   constructor()
   {
      super(localStores);
   }
}
