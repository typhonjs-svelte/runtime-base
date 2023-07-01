import * as _runtime_svelte_store_web_storage from '@typhonjs-svelte/runtime-base/svelte/store/web-storage';

/**
 * Provides all MessagePack enabled `localStorage` store helper functions. Data is compressed and converted to base64.
 */
declare const localStoresBCMP: _runtime_svelte_store_web_storage.StorageStores;
/**
 * Provides all MessagePack enabled `sessionStorage` store helper functions. Data is compressed and converted to base64.
 */
declare const sessionStoresBCMP: _runtime_svelte_store_web_storage.StorageStores;

export { localStoresBCMP, sessionStoresBCMP };
