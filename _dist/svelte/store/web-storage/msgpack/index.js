import { packAndDeflateB64, inflateAndUnpackB64 } from '@typhonjs-svelte/runtime-base/data/format/msgpack/compress';
import { TJSWebStorage, storeGenerator } from '@typhonjs-svelte/runtime-base/svelte/store/web-storage';

/**
 * Provides a {@link TJSWebStorage} instance for browser local storage using compressed MessagePack to base64.
 */
class TJSLocalStorageBCMP extends TJSWebStorage
{
   constructor()
   {
      super(localStoresBCMP);
   }
}

/**
 * Provides a {@link TJSWebStorage} instance for browser session storage using compressed MessagePack to base64.
 */
class TJSSessionStorageBCMP extends TJSWebStorage
{
   constructor()
   {
      super(sessionStoresBCMP);
   }
}

/**
 * Provides all MessagePack enabled `localStorage` store helper functions. Data is compressed and converted to base64.
 */
const localStoresBCMP = storeGenerator({
   storage: globalThis?.localStorage,
   serialize: packAndDeflateB64,
   deserialize: inflateAndUnpackB64
});

/**
 * Provides all MessagePack enabled `sessionStorage` store helper functions. Data is compressed and converted to base64.
 */
const sessionStoresBCMP = storeGenerator({
   storage: globalThis?.sessionStorage,
   serialize: packAndDeflateB64,
   deserialize: inflateAndUnpackB64
});

export { TJSLocalStorageBCMP, TJSSessionStorageBCMP, localStoresBCMP, sessionStoresBCMP };
//# sourceMappingURL=index.js.map
