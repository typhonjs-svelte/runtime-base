/**
 * Provides a lightweight plugin manager for Node / NPM & the browser with eventbus integration for plugins in a safe
 * and protected manner across NPM modules, local files, and preloaded object instances. This pattern facilitates
 * message passing between modules versus direct dependencies / method invocation.
 *
 * @module
 */

import * as _manager_eventbus from '@typhonjs-svelte/runtime-base/plugin/manager/eventbus';
import { Eventbus } from '@typhonjs-svelte/runtime-base/plugin/manager/eventbus';

/**
 * Defines a class holding the data associated with a plugin including its instance.
 */
declare class PluginEntry {
    /**
     * Instantiates a PluginEntry.
     *
     * @param {string}      name - The plugin name.
     *
     * @param {import('.').PluginData}  data - Describes the plugin, manager, and optional module data.
     *
     * @param {object}      instance - The loaded plugin instance.
     *
     * @param {import('#eventbus').EventbusProxy}  eventbusProxy - The EventbusProxy associated with the plugin wrapping
     *        the plugin manager eventbus.
     */
    constructor(name: string, data: PluginData, instance: object, eventbusProxy?: any);
    /**
     * Get plugin data.
     *
     * @returns {import('.').PluginData} The associated PluginData.
     */
    get data(): PluginData;
    /**
     * Set enabled.
     *
     * @param {boolean} enabled - New enabled state.
     */
    set enabled(arg: boolean);
    /**
     * Get enabled.
     *
     * @returns {boolean} Current enabled state.
     */
    get enabled(): boolean;
    /**
     * Set any associated import.meta data.
     *
     * @param {object} importmeta - import.meta data.
     */
    set importmeta(arg: any);
    /**
     * Get any stored import.meta object.
     *
     * @returns {undefined|object} Any set import.meta info.
     */
    get importmeta(): any;
    /**
     * Reset will cleanup most resources for remove / reload. 'remove' should manually destroy #eventbusProxy.
     */
    reset(): void;
    /**
     * Set associated EventbusProxy.
     *
     * @param {import('#eventbus').EventbusProxy} eventbusProxy - EventbusProxy instance to associate.
     */
    set eventbusProxy(arg: any);
    /**
     * Get associated EventbusProxy.
     *
     * @returns {import('#eventbus').EventbusProxy} Associated EventbusProxy.
     */
    get eventbusProxy(): any;
    /**
     * Set plugin instance.
     *
     * @param {object} instance - The plugin instance.
     */
    set instance(arg: any);
    /**
     * Get plugin instance.
     *
     * @returns {object} The plugin instance.
     */
    get instance(): any;
    /**
     * Get plugin name.
     *
     * @returns {string} Plugin name.
     */
    get name(): string;
    #private;
}

declare interface PluginSupportConstructor {
    new (pluginManager: PluginManager): PluginSupportImpl;
}
/**
 * Describes the interface that all PluginSupport classes must implement.
 */
declare interface PluginSupportImpl {
    /**
     * Destroys all managed plugins after unloading them.
     *
     * @param {object}     opts - An options object.
     *
     * @param {Eventbus}   opts.eventbus - The eventbus to disassociate.
     *
     * @param {string}     opts.eventPrepend - The current event prepend.
     */
    destroy({ eventbus, eventPrepend }: {
        eventbus: Eventbus;
        eventPrepend: string;
    }): Promise<void>;
    /**
     * Sets the eventbus associated with this plugin manager. If any previous eventbus was associated all plugin manager
     * events will be removed then added to the new eventbus. If there are any existing plugins being managed their
     * events will be removed from the old eventbus and then 'onPluginLoad' will be called with the new eventbus.
     *
     * @param {object}     opts - An options object.
     *
     * @param {Eventbus}   opts.oldEventbus - The old eventbus to disassociate.
     *
     * @param {Eventbus}   opts.newEventbus - The new eventbus to associate.
     *
     * @param {string}     opts.oldPrepend - The old event prepend.
     *
     * @param {string}     opts.newPrepend - The new event prepend.
     */
    setEventbus({ oldEventbus, newEventbus, oldPrepend, newPrepend }: {
        oldEventbus: Eventbus;
        newEventbus: Eventbus;
        oldPrepend: string;
        newPrepend: string;
    }): void;
    /**
     * Set optional parameters.
     *
     * @param {import('.').PluginManagerOptions} options Defines optional parameters to set.
     */
    setOptions(options: PluginManagerOptions): void;
}

/**
 * Provides a lightweight plugin manager for Node / NPM & the browser with eventbus integration for plugins in a safe
 * and protected manner across NPM modules, local files, and preloaded object instances. This pattern facilitates
 * message passing between modules versus direct dependencies / method invocation.
 *
 * A default eventbus will be created, but you may also pass in an eventbus from `@typhonjs-plugin/eventbus` and the
 * plugin manager will register by default under these event categories:
 *
 * `plugins:async:add` - {@link PluginManager#add}
 *
 * `plugins:async:add:all` - {@link PluginManager#addAll}
 *
 * `plugins:async:destroy:manager` - {@link PluginManager#destroy}
 *
 * `plugins:async:remove` - {@link PluginManager#remove}
 *
 * `plugins:async:remove:all` - {@link PluginManager#removeAll}
 *
 * `plugins:get:enabled` - {@link PluginManager#getEnabled}
 *
 * `plugins:get:options` - {@link PluginManager#getOptions}
 *
 * `plugins:get:plugin:by:event` - {@link PluginManager#getPluginByEvent}
 *
 * `plugins:get:plugin:data` - {@link PluginManager#getPluginData}
 *
 * `plugins:get:plugin:events` - {@link PluginManager#getPluginEvents}
 *
 * `plugins:get:plugin:names` - {@link PluginManager#getPluginNames}
 *
 * `plugins:has:plugin` - {@link PluginManager#hasPlugins}
 *
 * `plugins:is:valid:config` - {@link PluginManager#isValidConfig}
 *
 * `plugins:set:enabled` - {@link PluginManager#setEnabled}
 *
 * `plugins:set:options` - {@link PluginManager#setOptions}
 *
 * Automatically when a plugin is loaded and unloaded respective functions `onPluginLoad` and `onPluginUnload` will
 * be attempted to be invoked on the plugin. This is an opportunity for the plugin to receive any associated eventbus
 * and wire itself into it. It should be noted that a protected proxy around the eventbus is passed to the plugins
 * such that when the plugin is removed automatically all events registered on the eventbus are cleaned up without
 * a plugin author needing to do this manually in the `onPluginUnload` callback. This solves any dangling event binding
 * issues.
 *
 * By supporting ES Modules / CommonJS in Node and ES Modules in the browser the plugin manager is by nature
 * asynchronous for the core methods of adding / removing plugins and destroying the manager. The lifecycle methods
 * `onPluginLoad` and `onPluginUnload` will be awaited on such that if a plugin returns a Promise or is an async method
 * then it will complete before execution continues.
 *
 * It is recommended to interact with the plugin manager eventbus through an eventbus proxy. The
 * `createEventbusProxy` method will return a proxy to the default or currently set eventbus.
 *
 * It should be noted that this module re-exports `@typhonjs-plugin/eventbus` which is available as named exports via
 * the `eventbus` subpath export:
 * ```js
 * // Main Eventbus implementations:
 * import { Eventbus, EventbusProxy, EventbusSecure } from '@typhonjs-svelte/runtime-base/plugin/manager/eventbus';
 *
 * // Consistent bus instances useful for testing and broad accessibility:
 * import { mainEventbus, pluginEventbus, testEventbus } from '@typhonjs-svelte/runtime-base/plugin/manager/eventbus/buses';
 * ```
 *
 * This reexport is for convenience as it provides one single distribution for Node & browser usage.
 *
 * If external eventbus functionality is enabled by passing in an eventbus in the constructor of PluginManager it is
 * important especially if using an existing process / global level eventbus instance from either this module or
 * `@typhonjs-plugin/eventbus` to call {@link PluginManager#destroy} to clean up all plugin eventbus resources and the
 * plugin manager event bindings; this is primarily a testing concern when running repeated tests over a reused
 * eventbus.
 *
 * For more information on Eventbus functionality please see:
 *
 * @see https://www.npmjs.com/package/@typhonjs-plugin/eventbus
 *
 * The PluginManager instance can be extended through runtime composition by passing in _classes_ that implement
 * {@link PluginSupportImpl}. One such implementation is available {@link PluginInvokeSupport} which enables directly
 * invoking methods of all or specific plugins. Please see the documentation for PluginInvokeSupport for more details.
 *
 * Several abbreviated examples follow. Please see the wiki for more details:
 * TODO: add wiki link
 *
 * @example
 * import PluginManager from '@typhonjs-plugin/manager';
 *
 * const pluginManager = new PluginManager();
 *
 * await pluginManager.add({ name: 'an-npm-plugin-enabled-module' });
 * await pluginManager.add({ name: 'my-local-module', target: './myModule.js' });
 *
 * const eventbus = pluginManager.createEventbusProxy();
 *
 * // Let's say an-npm-plugin-enabled-module responds to 'cool:event' which returns 'true'.
 * // Let's say my-local-module responds to 'hot:event' which returns 'false'.
 * // Both of the plugin / modules will have 'onPluginLoaded' invoked with a proxy to the eventbus and any plugin
 * // options defined.
 *
 * // One can then use the eventbus functionality to invoke associated module / plugin methods even retrieving results.
 * assert(eventbus.triggerSync('cool:event') === true);
 * assert(eventbus.triggerSync('hot:event') === false);
 */
declare class PluginManager {
    /**
     * Instantiates PluginManager
     *
     * @param {object}   [options] - Provides various configuration options:
     *
     * @param {import('#manager/eventbus').Eventbus} [options.eventbus] - An instance of '@typhonjs-plugin/eventbus'
     *        used as the plugin eventbus. If not provided a default eventbus is created.
     *
     * @param {string}   [options.eventPrepend='plugin'] - A customized name to prepend PluginManager events on the
     *                                                     eventbus.
     *
     * @param {import('.').PluginManagerOptions}  [options.manager] - The plugin manager options.
     *
     * @param {(
     *    import('./interfaces').PluginSupportConstructor |
     *    Iterable<import('./interfaces').PluginSupportConstructor>
     * )} [options.PluginSupport] - Optional classes to pass in which extends the plugin manager. A default
     * implementation is available: {@link PluginInvokeSupport}
     */
    constructor(options?: {
        eventbus?: _manager_eventbus.Eventbus;
        eventPrepend?: string;
        manager?: PluginManagerOptions;
        PluginSupport?: (PluginSupportConstructor | Iterable<PluginSupportConstructor>);
    });
    /**
     * Adds a plugin by the given configuration parameters. A plugin `name` is always required. If no other options
     * are provided then the `name` doubles as the NPM module / local file to load. The loading first checks for an
     * existing `instance` to use as the plugin. Then the `target` is chosen as the NPM module / local file to load.
     * By passing in `options` this will be stored and accessible to the plugin during all callbacks.
     *
     * @param {import('.').PluginConfig}   pluginConfig - Defines the plugin to load.
     *
     * @param {object}         [moduleData] - Optional object hash to associate with plugin.
     *
     * @returns {Promise<import('.').PluginData>} The PluginData that represents the plugin added.
     */
    add(pluginConfig: PluginConfig, moduleData?: object): Promise<PluginData>;
    /**
     * Initializes multiple plugins in a single call.
     *
     * @param {Iterable<import('.').PluginConfig>}   pluginConfigs - An iterable list of plugin config object hash entries.
     *
     * @param {object}                   [moduleData] - Optional object hash to associate with all plugins.
     *
     * @returns {Promise<import('.').PluginData[]>} An array of PluginData objects of all added plugins.
     */
    addAll(pluginConfigs: Iterable<PluginConfig>, moduleData?: object): Promise<PluginData[]>;
    /**
     * Provides the eventbus callback which may prevent addition if optional `noEventAdd` is enabled. This disables
     * the ability for plugins to be added via events preventing any external code adding plugins in this manner.
     *
     * @param {import('.').PluginConfig}   pluginConfig - Defines the plugin to load.
     *
     * @param {object}         [moduleData] - Optional object hash to associate with all plugins.
     *
     * @returns {Promise<import('.').PluginData>} The PluginData that represents the plugin added.
     * @private
     */
    private _addEventbus;
    /**
     * Provides the eventbus callback which may prevent addition if optional `noEventAdd` is enabled. This disables
     * the ability for plugins to be added via events preventing any external code adding plugins in this manner.
     *
     * @param {Iterable<import('.').PluginConfig>}  pluginConfigs - An iterable list of plugin config object hash entries.
     *
     * @param {object}                  [moduleData] - Optional object hash to associate with all plugins.
     *
     * @returns {Promise<import('.').PluginData[]>} An array of PluginData objects of all added plugins.
     * @private
     */
    private _addAllEventbus;
    /**
     * If an eventbus is assigned to this plugin manager then a new EventbusProxy wrapping this eventbus is returned.
     * It is added to `this.#eventbusProxies` so †hat the instances are destroyed when the plugin manager is destroyed.
     *
     * @returns {import('#manager/eventbus').EventbusProxy} A proxy for the currently set Eventbus.
     */
    createEventbusProxy(): _manager_eventbus.EventbusProxy;
    /**
     * If an eventbus is assigned to this plugin manager then a new EventbusSecure wrapping this eventbus is returned.
     * It is added to `this.#eventbusSecure` so †hat the instances are destroyed when the plugin manager is destroyed.
     *
     * @param {string}   [name] - Optional name for the EventbusSecure instance.
     *
     * @returns {import('#manager/eventbus').EventbusSecure} A secure wrapper for the currently set Eventbus.
     */
    createEventbusSecure(name?: string): _manager_eventbus.EventbusSecure;
    /**
     * Destroys all managed plugins after unloading them.
     *
     * @returns {Promise<import('.').DataOutPluginRemoved[]>} A list of plugin names and removal success state.
     */
    destroy(): Promise<DataOutPluginRemoved[]>;
    /**
     * Provides the eventbus callback which may prevent plugin manager destruction if optional `noEventDestroy` is
     * enabled. This disables the ability for the plugin manager to be destroyed via events preventing any external
     * code removing plugins in this manner.
     *
     * @private
     * @returns {Promise<import('.').DataOutPluginRemoved[]>} A list of plugin names and removal success state.
     */
    private _destroyEventbus;
    /**
     * Returns whether this plugin manager has been destroyed.
     *
     * @returns {boolean} Returns whether this plugin manager has been destroyed.
     */
    get isDestroyed(): boolean;
    /**
     * Returns the enabled state of a plugin, a list of plugins, or all plugins.
     *
     * @param {object}                  [opts] - Options object. If undefined all plugin enabled state is returned.
     *
     * @param {string|Iterable<string>} [opts.plugins] - Plugin name or iterable list of names to get state.
     *
     * @returns {boolean|import('.').DataOutPluginEnabled[]} Enabled state for single plugin or array of results for multiple
     *                                                plugins.
     */
    getEnabled({ plugins }?: {
        plugins?: string | Iterable<string>;
    }): boolean | DataOutPluginEnabled[];
    /**
     * Returns any associated eventbus.
     *
     * @returns {import('#manager/eventbus').EventBus} The associated eventbus.
     */
    getEventbus(): any;
    /**
     * Returns a copy of the plugin manager options.
     *
     * @returns {import('.').PluginManagerOptions} A copy of the plugin manager options.
     */
    getOptions(): PluginManagerOptions;
    /**
     * Returns the event binding names registered on any associated plugin EventbusProxy.
     *
     * @param {object}          opts - Options object.
     *
     * @param {string|RegExp}   opts.event - Event name or RegExp to match event names.
     *
     * @returns {string[] | import('.').DataOutPluginEvents[]} Event binding names registered from the plugin.
     */
    getPluginByEvent({ event }: {
        event: string | RegExp;
    }): string[] | DataOutPluginEvents[];
    /**
     * Gets the plugin data for a plugin, list of plugins, or all plugins.
     *
     * @param {object}                  [opts] - Options object. If undefined all plugin data is returned.
     *
     * @param {string|Iterable<string>} [opts.plugins] - Plugin name or iterable list of names to get plugin data.
     *
     * @returns {import('.').PluginData | import('.').PluginData[] | undefined} The plugin data for a plugin or list of plugins.
     */
    getPluginData({ plugins }?: {
        plugins?: string | Iterable<string>;
    }): PluginData | PluginData[] | undefined;
    /**
     * Gets a PluginEntry instance for the given plugin name. This method is primarily for {@link PluginSupportImpl}
     * classes.
     *
     * @param {string} plugin - The plugin name to get.
     *
     * @returns {import('./PluginEntry.js').PluginEntry} The PluginEntry for the given plugin name.
     */
    getPluginEntry(plugin: string): PluginEntry;
    /**
     * Returns the event binding names registered on any associated plugin EventbusProxy.
     *
     * @param {object}                     [opts] - Options object. If undefined all plugin data is returned.
     *
     * @param {string | Iterable<string>}  [opts.plugins] - Plugin name or iterable list of names to get plugin data.
     *
     * @returns {import('.').DataOutPluginEvents[]} Event binding names registered from the plugin.
     */
    getPluginEvents({ plugins }?: {
        plugins?: string | Iterable<string>;
    }): DataOutPluginEvents[];
    /**
     * Returns an iterable of plugin map keys (plugin names). This method is primarily for {@link PluginSupportImpl}
     * classes.
     *
     * @returns {Iterable<string>} An iterable of plugin map keys.
     */
    getPluginMapKeys(): Iterable<string>;
    /**
     * Returns an iterable of plugin map keys (plugin names). This method is primarily for {@link PluginSupportImpl}
     * classes.
     *
     * @returns {Iterable<PluginEntry>} An iterable of plugin map keys.
     */
    getPluginMapValues(): Iterable<PluginEntry>;
    /**
     * Returns all plugin names or if enabled is set then return plugins matching the enabled state.
     *
     * @param {object}  [opts] - Options object. If undefined all plugin names are returned regardless of enabled state.
     *
     * @param {boolean} [opts.enabled] - If enabled is a boolean it will return plugins given their enabled state.
     *
     * @returns {string[]} A list of plugin names optionally by enabled state.
     */
    getPluginNames({ enabled }?: {
        enabled?: boolean;
    }): string[];
    /**
     * Returns true if there is a plugin loaded with the given plugin name(s). If no options are provided then
     * the result will be if any plugins are loaded.
     *
     * @param {object}                  [opts] - Options object. If undefined returns whether there are any plugins.
     *
     * @param {string|Iterable<string>} [opts.plugins] - Plugin name or iterable list of names to check existence.
     *
     * @returns {boolean} True if given plugin(s) exist.
     */
    hasPlugins({ plugins }?: {
        plugins?: string | Iterable<string>;
    }): boolean;
    /**
     * Performs validation of a PluginConfig.
     *
     * @param {import('.').PluginConfig}   pluginConfig - A PluginConfig to validate.
     *
     * @returns {boolean} True if the given PluginConfig is valid.
     */
    isValidConfig(pluginConfig: PluginConfig): boolean;
    /**
     * Unloads / reloads the plugin invoking `onPluginUnload` / then `onPluginReload`
     *
     * @param {object}   opts - Options object.
     *
     * @param {string}   opts.plugin - Plugin name to reload.
     *
     * @param {object}   [opts.instance] - Optional instance to replace.
     *
     * @param {boolean}  [opts.silent] - Does not trigger any reload notification on the eventbus.
     *
     * @returns {Promise<boolean>} Result of reload attempt.
     */
    reload({ plugin, instance, silent }: {
        plugin: string;
        instance?: object;
        silent?: boolean;
    }): Promise<boolean>;
    /**
     * Removes a plugin by name or all names in an iterable list unloading them and clearing any event bindings
     * automatically.
     *
     * @param {object}                  opts - Options object.
     *
     * @param {string|Iterable<string>} opts.plugins - Plugin name or iterable list of names to remove.
     *
     * @returns {Promise<import('.').DataOutPluginRemoved[]>} A list of plugin names and removal success state.
     */
    remove({ plugins }: {
        plugins: string | Iterable<string>;
    }): Promise<DataOutPluginRemoved[]>;
    /**
     * Removes all plugins after unloading them and clearing any event bindings automatically.
     *
     * @returns {Promise.<import('.').DataOutPluginRemoved[]>} A list of plugin names and removal success state.
     */
    removeAll(): Promise<DataOutPluginRemoved[]>;
    /**
     * Provides the eventbus callback which may prevent removal if optional `noEventRemoval` is enabled. This disables
     * the ability for plugins to be removed via events preventing any external code removing plugins in this manner.
     *
     * @param {object}                  opts - Options object
     *
     * @param {string|Iterable<string>} opts.plugins - Plugin name or iterable list of names to remove.
     *
     * @returns {Promise<import('.').DataOutPluginRemoved[]>} A list of plugin names and removal success state.
     * @private
     */
    private _removeEventbus;
    /**
     * Provides the eventbus callback which may prevent removal if optional `noEventRemoval` is enabled. This disables
     * the ability for plugins to be removed via events preventing any external code removing plugins in this manner.
     *
     * @returns {Promise.<import('.').DataOutPluginRemoved[]>} A list of plugin names and removal success state.
     * @private
     */
    private _removeAllEventbus;
    /**
     * Sets the enabled state of a plugin, a list of plugins, or all plugins.
     *
     * @param {object}            opts - Options object.
     *
     * @param {boolean}           opts.enabled - The enabled state.
     *
     * @param {string|Iterable<string>} [opts.plugins] - Plugin name or iterable list of names to set state.
     */
    setEnabled({ enabled, plugins }: {
        enabled: boolean;
        plugins?: string | Iterable<string>;
    }): void;
    /**
     * Provides the eventbus callback which may prevent setEnabled if optional `noEventSetEnabled` is true. This
     * disables the ability for setting plugin enabled state via events preventing any external code from setting state.
     *
     * @param {object}   opts - Options object.
     *
     * @private
     */
    private _setEnabledEventbus;
    /**
     * Sets the eventbus associated with this plugin manager. If any previous eventbus was associated all plugin manager
     * events will be removed then added to the new eventbus. If there are any existing plugins being managed their
     * events will be removed from the old eventbus and then `onPluginLoad` will be called with the new eventbus.
     *
     * @param {object}     opts - An options object.
     *
     * @param {import('#manager/eventbus').Eventbus}   opts.eventbus - The new eventbus to associate.
     *
     * @param {string}     [opts.eventPrepend='plugins'] - An optional string to prepend to all of the event
     *                                                     binding targets.
     */
    setEventbus({ eventbus, eventPrepend }: {
        eventbus: _manager_eventbus.Eventbus;
        eventPrepend?: string;
    }): Promise<void>;
    /**
     * Stores the prepend string for eventbus registration.
     *
     * @type {string}
     * @private
     */
    private _eventPrepend;
    /**
     * Set optional parameters.
     *
     * @param {import('.').PluginManagerOptions} options - Defines optional parameters to set.
     */
    setOptions(options: PluginManagerOptions): void;
    /**
     * Provides the eventbus callback which may prevent plugin manager options being set if optional `noEventSetOptions`
     * is enabled. This disables the ability for the plugin manager options to be set via events preventing any external
     * code modifying options.
     *
     * @param {import('.').PluginManagerOptions} options - Defines optional parameters to set.
     *
     * @private
     */
    private _setOptionsEventbus;
    #private;
}

/**
 * PluginEvent - Provides the data / event passed to all invoked methods in
 * {@link PluginInvokeSupport#invokeSyncEvent}. The `event.data` field is returned to the caller. Before returning
 * though additional the following additional metadata is attached:
 *
 * (number)    `$$plugin_invoke_count` - The count of plugins invoked.
 *
 * (string[])  `$$plugin_invoke_names` - The names of plugins invoked.
 */
declare class PluginInvokeEvent {
    /**
     * Initializes PluginEvent.
     *
     * @param {object} copyProps - Event data to copy.
     *
     * @param {object} passthruProps - Event data to pass through.
     */
    constructor(copyProps?: object, passthruProps?: object);
    /**
     * Provides the unified event data assigning any pass through data to the copied data supplied. Invoked functions
     * may add to or modify this data.
     *
     * @type {import('../../').PluginEventData}
     */
    data: PluginEventData;
    /**
     * Unique data available in each plugin invoked.
     *
     * @type {import('#eventbus').EventbusProxy} - The active EventbusProxy for that particular plugin.
     */
    eventbus: any;
    /**
     * Unique data available in each plugin invoked.
     *
     * @type {string} - The active plugin name.
     */
    pluginName: string;
    /**
     * Unique data available in each plugin invoked.
     *
     * @type {object} - The active plugin options.
     */
    pluginOptions: object;
}

/**
 * @typedef {import('../../interfaces').PluginSupportImpl} MyInterface
 */
/**
 * PluginInvokeSupport adds direct method invocation support to PluginManager via the eventbus and alternately through
 * a wrapped instance of PluginManager depending on the use case.
 *
 * There are two types of invocation methods the first spreads an array of arguments to the invoked method. The second
 * constructs a {@link PluginInvokeEvent} to pass to the method with a single parameter.
 *
 * TODO: more info and wiki link
 *
 * When added to a PluginManager through constructor initialization the following events are registered on the plugin
 * manager eventbus:
 *
 * `plugins:async:invoke` - {@link PluginInvokeSupport#invokeAsync}
 *
 * `plugins:async:invoke:event` - {@link PluginInvokeSupport#invokeAsyncEvent}
 *
 * `plugins:get:method:names` - {@link PluginInvokeSupport#getMethodNames}
 *
 * `plugins:has:method` - {@link PluginInvokeSupport#hasMethod}
 *
 * `plugins:invoke` - {@link PluginInvokeSupport#invoke}
 *
 * `plugins:sync:invoke` - {@link PluginInvokeSupport#invokeSync}
 *
 * `plugins:sync:invoke:event` - {@link PluginInvokeSupport#invokeSyncEvent}
 *
 * @example
 * ```js
 * // One can also indirectly invoke any method of the plugin.
 * // Any plugin with a method named `aCoolMethod` is invoked.
 * eventbus.triggerSync('plugins:invoke:sync:event', { method: 'aCoolMethod' });
 *
 * // A specific invocation just for the 'an-npm-plugin-enabled-module'
 * eventbus.triggerSync('plugins:invoke:sync:event', {
 *    method: 'aCoolMethod',
 *    plugins: 'an-npm-plugin-enabled-module'
 * });
 *
 * // There are two other properties `copyProps` and `passthruProps` which can be set with object data to _copy_ or
 * // _pass through_ to the invoked method.
 * ```
 *
 * @implements {MyInterface}
 */
declare class PluginInvokeSupport implements MyInterface {
    /**
     * Create PluginInvokeSupport
     *
     * @param {import('../..').PluginManager} pluginManager - The plugin manager to associate.
     */
    constructor(pluginManager: PluginManager);
    /**
     * Returns whether the associated plugin manager has been destroyed.
     *
     * @returns {boolean} Returns whether the plugin manager has been destroyed.
     */
    get isDestroyed(): boolean;
    /**
     * Returns the associated plugin manager options.
     *
     * @returns {import('../../').PluginManagerOptions} The associated plugin manager options.
     */
    get options(): PluginManagerOptions;
    /**
     * Gets the associated plugin manager.
     *
     * @returns {import('../../').PluginManager} The associated plugin manager
     */
    get pluginManager(): PluginManager;
    /**
     * Destroys all managed plugins after unloading them.
     *
     * @param {object}     opts - An options object.
     *
     * @param {import('#eventbus').Eventbus}   opts.eventbus - The eventbus to disassociate.
     *
     * @param {string}     opts.eventPrepend - The current event prepend.
     */
    destroy({ eventbus, eventPrepend }: {
        eventbus: any;
        eventPrepend: string;
    }): Promise<void>;
    /**
     * Returns method names for a specific plugin, list of plugins, or all plugins. The enabled state can be specified
     * along with sorting methods by plugin name.
     *
     * @param {object}                  [opts] - Options object. If undefined all plugin data is returned.
     *
     * @param {boolean}                 [opts.enabled] - If enabled is a boolean it will return plugin methods names
     *                                                   given the respective enabled state.
     *
     * @param {string|Iterable<string>} [opts.plugins] - Plugin name or iterable list of names.
     *
     * @returns {string[]} A list of method names
     */
    getMethodNames({ enabled, plugins }?: {
        enabled?: boolean;
        plugins?: string | Iterable<string>;
    }): string[];
    /**
     * Checks if the provided method name exists across all plugins or specific plugins if defined.
     *
     * @param {object}                  opts - Options object.
     *
     * @param {string}                  opts.method - Method name to test.
     *
     * @param {string|Iterable<string>} [opts.plugins] - Plugin name or iterable list of names to check for method. If
     *                                                   undefined all plugins must contain the method.
     *
     * @returns {boolean} - True method is found.
     */
    hasMethod({ method, plugins }: {
        method: string;
        plugins?: string | Iterable<string>;
    }): boolean;
    /**
     * This dispatch method simply invokes any plugin targets for the given method name.
     *
     * @param {object}   opts - Options object.
     *
     * @param {string}   opts.method - Method name to invoke.
     *
     * @param {*[]}      [opts.args] - Method arguments. This array will be spread as multiple arguments.
     *
     * @param {string|Iterable<string>} [opts.plugins] - Specific plugin name or iterable list of plugin names to invoke.
     */
    invoke({ method, args, plugins }: {
        method: string;
        args?: any[];
        plugins?: string | Iterable<string>;
    }): void;
    /**
     * This dispatch method is asynchronous and adds any returned results to an array which is resolved via Promise.all
     * Any target invoked may return a Promise or any result.
     *
     * @param {object}   opts - Options object.
     *
     * @param {string}   opts.method - Method name to invoke.
     *
     * @param {*[]}      [opts.args] - Method arguments. This array will be spread as multiple arguments.
     *
     * @param {string|Iterable<string>} [opts.plugins] - Specific plugin name or iterable list of plugin names to invoke.
     *
     * @returns {Promise<*|*[]>} A single result or array of results.
     */
    invokeAsync({ method, args, plugins }: {
        method: string;
        args?: any[];
        plugins?: string | Iterable<string>;
    }): Promise<any | any[]>;
    /**
     * This dispatch method synchronously passes to and returns from any invoked targets a PluginEvent.
     *
     * @param {object}   opts - Options object.
     *
     * @param {string}   opts.method - Method name to invoke.
     *
     * @param {object}   [opts.copyProps] - Properties that are copied.
     *
     * @param {object}   [opts.passthruProps] - Properties that are passed through.
     *
     * @param {string | Iterable<string>} [opts.plugins] - Specific plugin name or iterable list of plugin names to invoke.
     *
     * @returns {Promise<import('../../').PluginEventData>} The PluginEvent data.
     */
    invokeAsyncEvent({ method, copyProps, passthruProps, plugins }: {
        method: string;
        copyProps?: object;
        passthruProps?: object;
        plugins?: string | Iterable<string>;
    }): Promise<PluginEventData>;
    /**
     * This dispatch method synchronously passes back a single value or an array with all results returned by any
     * invoked targets.
     *
     * @param {object}   opts - Options object.
     *
     * @param {string}   opts.method - Method name to invoke.
     *
     * @param {*[]}      [opts.args] - Method arguments. This array will be spread as multiple arguments.
     *
     * @param {string|Iterable<string>} [opts.plugins] - Specific plugin name or iterable list of plugin names to invoke.
     *
     * @returns {*|*[]} A single result or array of results.
     */
    invokeSync({ method, args, plugins }: {
        method: string;
        args?: any[];
        plugins?: string | Iterable<string>;
    }): any | any[];
    /**
     * This dispatch method synchronously passes to and returns from any invoked targets a PluginEvent.
     *
     * @param {object}            opts - Options object.
     *
     * @param {string}            opts.method - Method name to invoke.
     *
     * @param {object}            [opts.copyProps] - Properties that are copied.
     *
     * @param {object}            [opts.passthruProps] - Properties that are passed through.
     *
     * @param {string|Iterable<string>} [opts.plugins] - Specific plugin name or iterable list of plugin names to invoke.
     *
     * @returns {import('../../').PluginEventData} The PluginEvent data.
     */
    invokeSyncEvent({ method, copyProps, passthruProps, plugins }: {
        method: string;
        copyProps?: object;
        passthruProps?: object;
        plugins?: string | Iterable<string>;
    }): PluginEventData;
    /**
     * Sets the eventbus associated with this plugin manager. If any previous eventbus was associated all plugin manager
     * events will be removed then added to the new eventbus. If there are any existing plugins being managed their
     * events will be removed from the old eventbus and then `onPluginLoad` will be called with the new eventbus.
     *
     * @param {object}     opts - An options object.
     *
     * @param {import('#eventbus').Eventbus}   opts.oldEventbus - The old eventbus to disassociate.
     *
     * @param {import('#eventbus').Eventbus}   opts.newEventbus - The new eventbus to associate.
     *
     * @param {string}     opts.oldPrepend - The old event prepend.
     *
     * @param {string}     opts.newPrepend - The new event prepend.
     */
    setEventbus({ oldEventbus, newEventbus, oldPrepend, newPrepend }: {
        oldEventbus: any;
        newEventbus: any;
        oldPrepend: string;
        newPrepend: string;
    }): void;
    /**
     * Set optional parameters.
     *
     * @param {import('../../').PluginManagerOptions} options Defines optional parameters to set.
     */
    setOptions(options: PluginManagerOptions): void;
    #private;
}
type MyInterface = PluginSupportImpl;

/**
 * Creates an escaped path which is suitable for use in RegExp construction.
 *
 * Note: This function will throw if a malformed URL string is the target. In AbstractPluginManager this function
 * is used after the module has been loaded / is a good target.
 *
 * @param {string|URL}  target - Target full / relative path or URL to escape.
 *
 * @returns {string} The escaped target.
 */
declare function escapeTarget(target: string | URL): string;

/**
 * Performs validation of a PluginConfig.
 *
 * @param {import('..').PluginConfig}   pluginConfig A PluginConfig to validate.
 *
 * @returns {boolean} True if the given PluginConfig is valid.
 */
declare function isValidConfig(pluginConfig: PluginConfig): boolean;

/**
 * PluginManager 'getEnabled' return object format.
 */
type DataOutPluginEnabled = {
    /**
     * The plugin name.
     */
    plugin: string;
    /**
     * The enabled state of the plugin.
     */
    enabled: boolean;
    /**
     * True if the plugin is actually loaded.
     */
    loaded: boolean;
};
/**
 * PluginManager 'getPluginEvents' / 'getPluginByEvent' return object format.
 */
type DataOutPluginEvents = {
    /**
     * The plugin name.
     */
    plugin: string;
    /**
     * The event names registered.
     */
    events: string[];
};
/**
 * PluginManager 'remove' return object format.
 */
type DataOutPluginRemoved = {
    /**
     * The plugin name.
     */
    plugin: string;
    /**
     * The success state for removal.
     */
    success: boolean;
    /**
     * A list of errors that may have been thrown during removal.
     */
    errors: Error[];
};
/**
 * PluginManager 'add' / 'isValidConfig' plugin configuration.
 */
type PluginConfig = {
    /**
     * Defines the name of the plugin; if no `target` entry is present the name doubles
     * as the target (please see target).
     */
    name: string;
    /**
     * Defines the target Node module to load or defines a local file (full path or
     * relative to current working directory to load. Target may also be a file URL / string or in the browser a web URL.
     */
    target?: string | URL;
    /**
     * Defines an existing object instance to use as the plugin.
     */
    instance?: object;
    /**
     * Defines an object of options for the plugin.
     */
    options?: object;
};
/**
 * PluginManager plugin data object describes a loaded plugin.
 */
type PluginData = {
    /**
     * Data about the plugin manager.
     */
    manager: {
        eventPrepend: string;
        scopedName: string;
    };
    /**
     * Optional object hash to associate with plugin.
     */
    module: object;
    /**
     * Data about the plugin.
     */
    plugin: {
        name: string;
        target: string;
        targetEscaped: string;
        type: string;
        options: object;
    };
};
/**
 * Provides the unified event data including any pass through data to the
 * copied data supplied. Invoked functions may add to or modify this data.
 */
type PluginEventData = object;
/**
 * PluginManager options.
 */
type PluginManagerOptions = {
    /**
     * If true this prevents plugins from being added by `plugins:add` and
     * `plugins:add:all` events forcing direct method invocation for addition.
     */
    noEventAdd?: boolean;
    /**
     * If true this prevents the plugin manager from being destroyed by
     * `plugins:destroy:manager` forcing direct method invocation for destruction.
     */
    noEventDestroy?: boolean;
    /**
     * If true this prevents plugins from being removed by `plugins:remove` and
     * `plugins:remove:all` events forcing direct method invocation for removal.
     */
    noEventRemoval?: boolean;
    /**
     * If true this prevents the plugins from being enabled / disabled
     * from the eventbus via `plugins:set:enabled`.
     */
    noEventSetEnabled?: boolean;
    /**
     * If true this prevents setting options for the plugin manager by
     * `plugins:set:options` forcing direct method invocation for setting options.
     */
    noEventSetOptions?: boolean;
    /**
     * If true then when a method fails to be invoked by any plugin an exception
     * will be thrown.
     */
    throwNoMethod?: boolean;
    /**
     * If true then when no plugin is matched to be invoked an exception will be
     * thrown.
     */
    throwNoPlugin?: boolean;
};

export { DataOutPluginEnabled, DataOutPluginEvents, DataOutPluginRemoved, PluginConfig, PluginData, PluginEventData, PluginInvokeEvent, PluginInvokeSupport, PluginManager, PluginManagerOptions, PluginSupportConstructor, PluginSupportImpl, escapeTarget, isValidConfig };
