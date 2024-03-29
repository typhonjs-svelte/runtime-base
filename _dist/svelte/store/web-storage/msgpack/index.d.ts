import * as _runtime_svelte_store_web_storage from '@typhonjs-svelte/runtime-base/svelte/store/web-storage';
import { TJSWebStorage } from '@typhonjs-svelte/runtime-base/svelte/store/web-storage';

/**
 * Provides a {@link TJSWebStorage} instance for browser local storage using compressed MessagePack to base64.
 */
declare class TJSLocalStorageBCMP extends TJSWebStorage {
  constructor();
}

/**
 * Provides a {@link TJSWebStorage} instance for browser session storage using compressed MessagePack to base64.
 */
declare class TJSSessionStorageBCMP extends TJSWebStorage {
  constructor();
}

/**
 * Provides all MessagePack enabled `localStorage` store helper functions. Data is compressed and converted to base64.
 */
declare const localStoresBCMP: _runtime_svelte_store_web_storage.StorageStores;
/**
 * Provides all MessagePack enabled `sessionStorage` store helper functions. Data is compressed and converted to base64.
 */
declare const sessionStoresBCMP: _runtime_svelte_store_web_storage.StorageStores;

export { TJSLocalStorageBCMP, TJSSessionStorageBCMP, localStoresBCMP, sessionStoresBCMP };
