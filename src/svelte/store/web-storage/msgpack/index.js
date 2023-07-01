import {
   inflateAndUnpackB64,
   packAndDeflateB64 }     from '#runtime/data/format/msgpack/compress';

import { storeGenerator }  from '#runtime/svelte/store/web-storage';

export * from './TJSLocalStorageBCMP.js';
export * from './TJSSessionStorageBCMP.js';

/**
 * Provides all MessagePack enabled `localStorage` store helper functions. Data is compressed and converted to base64.
 */
export const localStoresBCMP = storeGenerator({
   storage: globalThis?.localStorage,
   serialize: packAndDeflateB64,
   deserialize: inflateAndUnpackB64
});

/**
 * Provides all MessagePack enabled `sessionStorage` store helper functions. Data is compressed and converted to base64.
 */
export const sessionStoresBCMP = storeGenerator({
   storage: globalThis?.sessionStorage,
   serialize: packAndDeflateB64,
   deserialize: inflateAndUnpackB64
});
