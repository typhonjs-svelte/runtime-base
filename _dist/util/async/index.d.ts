/**
 * Provides management of a single Promise that can be shared and accessed across JS & Svelte components. This allows a
 * Promise to be created and managed as part of the TRL application lifecycle and accessed safely in various control
 * flow scenarios. When resolution of the current managed Promise starts further interaction is prevented.
 *
 * Note: to enable debugging / log statements set the static `logging` variable to true.
 */
declare class ManagedPromise {
    /**
     * Sets global logging enabled state.
     *
     * @param {boolean}  logging - New logging enabled state.
     */
    static set logging(arg: boolean);
    /**
     * @returns {boolean} Whether global logging is enabled.
     */
    static get logging(): boolean;
    /**
     * @returns {boolean} Whether there is an active managed Promise.
     */
    get isActive(): boolean;
    /**
     * @returns {boolean} Whether there is an active managed Promise and resolution is currently being processed.
     */
    get isProcessing(): boolean;
    /**
     * Resolves any current Promise with undefined and creates a new current Promise.
     *
     * @template T
     *
     * @param {object} opts - Options.
     *
     * @param {boolean}  [opts.reuse=false] - When true if there is an existing live Promise it is returned immediately.
     *
     * @returns {Promise<T>} The new current managed Promise.
     */
    create<T>({ reuse }?: {
        reuse?: boolean;
    }): Promise<T>;
    /**
     * Gets the current Promise if any.
     *
     * @returns {Promise<any>} Current Promise.
     */
    get(): Promise<any>;
    /**
     * Rejects the current Promise if applicable.
     *
     * @param {*}  [result] - Result to reject.
     *
     * @returns {boolean} Was the promise rejected.
     */
    reject(result?: any): boolean;
    /**
     * Resolves the current Promise if applicable.
     *
     * @param {*}  [result] - Result to resolve.
     *
     * @returns {boolean} Was the promise resolved.
     */
    resolve(result?: any): boolean;
    #private;
}

export { ManagedPromise };
