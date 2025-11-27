/**
 * Provides a basic test for a given variable to test if it has the shape of a readable store by having a `subscribe`
 * function.
 *
 * Note: functions are also objects, so test that the variable might be a function w/ a `subscribe` function.
 *
 * @param store - variable to test that might be a store.
 *
 * @returns Whether the variable tested has the shape of a store.
 *
 * @typeParam T - type of data.
 */
function isReadableStore(store) {
    if (store === null || store === void 0) {
        return false;
    }
    switch (typeof store) {
        case 'function':
        case 'object':
            return typeof store.subscribe === 'function';
    }
    return false;
}
/**
 * Provides a basic test for a given variable to test if it has the shape of a minimal writable store by having a
 * `subscribe` and `set` functions.
 *
 * Note: functions are also objects, so test that the variable might be a function w/ `subscribe` & `set` functions.
 *
 * @param store - variable to test that might be a store.
 *
 * @returns Whether the variable tested has the shape of a {@link MinimalWritable} store.
 *
 * @typeParam T - type of data.
 */
function isMinimalWritableStore(store) {
    if (store === null || store === void 0) {
        return false;
    }
    switch (typeof store) {
        case 'function':
        case 'object':
            return typeof store.subscribe === 'function' &&
                typeof store.set === 'function';
    }
    return false;
}
/**
 * Provides a basic test for a given variable to test if it has the shape of a writable store by having a `subscribe`
 * `set`, and `update` functions.
 *
 * Note: functions are also objects, so test that the variable might be a function w/ `subscribe`, `set, and `update`
 * functions.
 *
 * @param {*}  store - variable to test that might be a store.
 *
 * @returns Whether the variable tested has the shape of a writable store.
 *
 * @typeParam T - type of data.
 */
function isWritableStore(store) {
    if (store === null || store === void 0) {
        return false;
    }
    switch (typeof store) {
        case 'function':
        case 'object':
            return typeof store.subscribe === 'function' &&
                typeof store.set === 'function' &&
                typeof store.update === 'function';
    }
    return false;
}
/**
 * Subscribes to the given store with the subscriber function provided and ignores the first automatic
 * update. All future updates are dispatched to the subscriber function.
 *
 * @param store - Store to subscribe to...
 *
 * @param subscriber - Function to receive future updates.
 *
 * @returns Store unsubscribe function.
 *
 * @typeParam T - type of data.
 */
function subscribeIgnoreFirst(store, subscriber) {
    let firedFirst = false;
    return store.subscribe((value) => {
        if (!firedFirst) {
            firedFirst = true;
        }
        else {
            subscriber(value);
        }
    });
}
/**
 * Subscribes to the given store with two subscriber functions provided. The first function is invoked on the initial
 * subscription. All future updates are dispatched to the subscriber function.
 *
 * @param store - Store to subscribe to...
 *
 * @param first - Function to receive first update.
 *
 * @param subscriber - Function to receive future updates.
 *
 * @returns Store unsubscribe function.
 *
 * @typeParam T - type of data.
 */
function subscribeFirstRest(store, first, subscriber) {
    let firedFirst = false;
    return store.subscribe((value) => {
        if (!firedFirst) {
            firedFirst = true;
            first(value);
        }
        else {
            subscriber(value);
        }
    });
}

export { isMinimalWritableStore, isReadableStore, isWritableStore, subscribeFirstRest, subscribeIgnoreFirst };
//# sourceMappingURL=index.js.map
