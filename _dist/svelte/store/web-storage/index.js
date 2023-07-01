import { writable, get } from 'svelte/store';

/**
 * Generates derived, readable, writable helper functions wrapping the given Storage API provided with any additional
 * customization for data serialization. By default, JSON serialization is used.
 *
 * @param {object}   opts - Generator options.
 *
 * @param {Storage}  storage - The web storage source.
 *
 * @param {(value: any) => string}  [opts.serialize] - Replace with custom serialization; default: `JSON.stringify`.
 *
 * @param {(value: string) => any}  [opts.deserialize] - Replace with custom deserialization; default: `JSON.parse`.
 */
function storeGenerator({ storage, serialize = JSON.stringify, deserialize = JSON.parse }) {
    function isSimpleDeriver(deriver) {
        return deriver.length < 2;
    }
    function storageReadable(key, value, start) {
        return {
            subscribe: storageWritable(key, value, start).subscribe
        };
    }
    function storageWritable(key, value, start) {
        function wrap_start(ogSet) {
            return start(function wrap_set(new_value) {
                if (storage) {
                    storage.setItem(key, serialize(new_value));
                }
                return ogSet(new_value);
            }, function wrap_update(fn) {
                set(fn(get(ogStore)));
            });
        }
        if (storage) {
            const storageValue = storage.getItem(key);
            try {
                if (storageValue) {
                    value = deserialize(storageValue);
                }
            }
            catch (err) { /**/ }
            storage.setItem(key, serialize(value));
        }
        const ogStore = writable(value, start ? wrap_start : void 0);
        function set(new_value) {
            if (storage) {
                storage.setItem(key, serialize(new_value));
            }
            ogStore.set(new_value);
        }
        function update(fn) {
            set(fn(get(ogStore)));
        }
        function subscribe(run, invalidate) {
            return ogStore.subscribe(run, invalidate);
        }
        return { set, update, subscribe };
    }
    function storageDerived(key, stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single ? [stores] : stores;
        if (storage && storage.getItem(key)) {
            try {
                initial_value = deserialize(storage.getItem(key));
            }
            catch (err) { /**/ }
        }
        return storageReadable(key, initial_value, (set, update) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup?.();
                const input = single ? values[0] : values;
                if (isSimpleDeriver(fn)) {
                    set(fn(input));
                }
                else {
                    const result = fn(input, set, update);
                    if (typeof result === 'function') {
                        cleanup = result;
                    }
                }
            };
            const unsubscribers = stores_array.map((store, i) => store.subscribe((value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => { pending |= (1 << i); }));
            inited = true;
            sync();
            return function stop() {
                // Equivalent to run_all from Svelte internals.
                unsubscribers.forEach((unsubscriber) => unsubscriber());
                cleanup?.();
            };
        });
    }
    return {
        readable: storageReadable,
        writable: storageWritable,
        derived: storageDerived
    };
}

/**
 * Provides all Storage API enabled `localStorage` helper functions. Data is serialized as JSON.
 */
const localStores = storeGenerator({ storage: globalThis?.localStorage });
/**
 * Provides the Storage API enabled derived `localStorage` helper function. Data is serialized as JSON.
 */
localStores.derived;
/**
 * Provides the Storage API enabled readable `localStorage` helper function. Data is serialized as JSON.
 */
localStores.readable;
/**
 * Provides the Storage API enabled writable `localStorage` helper function. Data is serialized as JSON.
 */
localStores.writable;

/**
 * Provides all Storage API enabled `sessionStorage` helper functions. Data is serialized as JSON.
 */
const sessionStores = storeGenerator({ storage: globalThis?.sessionStorage });
/**
 * Provides the Storage API enabled derived `sessionStorage` helper function. Data is serialized as JSON.
 */
sessionStores.derived;
/**
 * Provides the Storage API enabled readable `sessionStorage` helper function. Data is serialized as JSON.
 */
sessionStores.readable;
/**
 * Provides the Storage API enabled writable `sessionStorage` helper function. Data is serialized as JSON.
 */
sessionStores.writable;

export { localStores, sessionStores, storeGenerator };
//# sourceMappingURL=index.js.map
