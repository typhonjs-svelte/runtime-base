import { Eventbus } from '@typhonjs-svelte/runtime-base/plugin/manager/eventbus';

/**
 * Provides a main eventbus instance.
 *
 * @type {import('#manager/eventbus').Eventbus}
 */
const eventbus = new Eventbus('mainEventbus');

/**
 * Provides an eventbus instance potentially for use with a plugin system.
 *
 * @type {import('#manager/eventbus').Eventbus}
 */
const pluginEventbus = new Eventbus('pluginEventbus');

/**
 * Provides an eventbus instance potentially for use for testing.
 *
 * @type {import('#manager/eventbus').Eventbus}
 */
const testEventbus = new Eventbus('testEventbus');

export { eventbus, pluginEventbus, testEventbus };
//# sourceMappingURL=index.js.map
