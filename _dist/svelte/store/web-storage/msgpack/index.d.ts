import * as _runtime_svelte_store_web_storage from '@typhonjs-svelte/runtime-base/svelte/store/web-storage';

/**
 * Provides all MessagePack enabled `localStorage` store helper functions. Data is compressed and converted to base64.
 */
declare const localStoresBCMP: {
    derived: _runtime_svelte_store_web_storage.StorageDerived;
    readable: _runtime_svelte_store_web_storage.StorageReadable;
    writable: _runtime_svelte_store_web_storage.StorageWritable;
};
/**
 * Provides all MessagePack enabled `sessionStorage` store helper functions. Data is compressed and converted to base64.
 */
declare const sessionStoresBCMP: {
    derived: _runtime_svelte_store_web_storage.StorageDerived;
    readable: _runtime_svelte_store_web_storage.StorageReadable;
    writable: _runtime_svelte_store_web_storage.StorageWritable;
};

export { localStoresBCMP, sessionStoresBCMP };
