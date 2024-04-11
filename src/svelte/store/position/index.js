export *                   from './action';
export *                   from './TJSPosition.js';
// import { TJSPosition }     from './TJSPosition.js';
// export { TJSPosition }

// From: position/TJSPosition.js ----------------------------------------------------------------------------------------

/**
 * @typedef {object} TJSPositionOptions Options set in constructor.
 *
 * @property {boolean} [calculateTransform] When true always calculate transform data.
 *
 * @property {import('./system/types').System.Initial.IInitialSystem} [initial] Provides a helper for setting
 *           initial position location.
 *
 * @property {boolean} [ortho] Sets TJSPosition to orthographic mode using just transform / matrix3d for positioning.
 *
 * @property {boolean} [transformSubscribed] Set to true when there are subscribers to the readable transform store.
 *
 * @property {(
 *    import('./system/validators/types').IValidatorAPI.ValidatorFn |
 *    import('./system/validators/types').IValidatorAPI.ValidatorData |
 *    Iterable<import('./system/validators/types').IValidatorAPI.ValidatorFn |
 *     import('./system/validators/types').IValidatorAPI.ValidatorData>
 * )} [validator] - Provides an initial validator or list of validators.
 */

/**
 * @typedef {TJSPositionOptions & Partial<import('./data/types').Data.TJSPositionData>} TJSPositionOptionsAll
 */

/**
 * @typedef {HTMLElement | { elementTarget?: HTMLElement }} TJSPositionParent Defines the TJSPosition parent
 * element. Provide either an HTMLElement directly or an object with an `elementTarget` property / accessor defining
 * the parent HTMLElement.
 */

/**
 * @typedef {object} TJSPositionStores Provides individual writable stores for {@link TJSPosition}.
 *
 * @property {import('svelte/store').Readable<{width: number, height: number}>} dimension Readable store for dimension
 *           data.
 *
 * @property {import('svelte/store').Readable<HTMLElement>} element Readable store for current element.
 *
 * @property {import('svelte/store').Writable<number|null>} left Derived store for `left` updates.
 *
 * @property {import('svelte/store').Writable<number|null>} top Derived store for `top` updates.
 *
 * @property {import('svelte/store').Writable<number|'auto'|null>} width Derived store for `width` updates.
 *
 * @property {import('svelte/store').Writable<number|'auto'|null>} height Derived store for `height` updates.
 *
 * @property {import('svelte/store').Writable<number|null>} maxHeight Derived store for `maxHeight` updates.
 *
 * @property {import('svelte/store').Writable<number|null>} maxWidth Derived store for `maxWidth` updates.
 *
 * @property {import('svelte/store').Writable<number|null>} minHeight Derived store for `minHeight` updates.
 *
 * @property {import('svelte/store').Writable<number|null>} minWidth Derived store for `minWidth` updates.
 *
 * @property {import('svelte/store').Readable<number|undefined>} resizeContentHeight Readable store for `contentHeight`.
 *
 * @property {import('svelte/store').Readable<number|undefined>} resizeContentWidth Readable store for `contentWidth`.
 *
 * @property {import('svelte/store').Writable<
 *    import('#runtime/svelte/action/dom').ResizeObserverData.Object
 * >} resizeObserved Protected store for resize observer updates.
 *
 * @property {import('svelte/store').Readable<number|undefined>} resizeOffsetHeight Readable store for `offsetHeight`.
 *
 * @property {import('svelte/store').Readable<number|undefined>} resizeOffsetWidth Readable store for `offsetWidth`.
 *
 * @property {import('svelte/store').Writable<number|null>} rotate Derived store for `rotate` updates.
 *
 * @property {import('svelte/store').Writable<number|null>} rotateX Derived store for `rotateX` updates.
 *
 * @property {import('svelte/store').Writable<number|null>} rotateY Derived store for `rotateY` updates.
 *
 * @property {import('svelte/store').Writable<number|null>} rotateZ Derived store for `rotateZ` updates.
 *
 * @property {import('svelte/store').Writable<number|null>} scale Derived store for `scale` updates.
 *
 * @property {import('svelte/store').Readable<
 *    import('./transform/types').ITransformAPI.ITransformData
 * >} transform Readable store for transform data.
 *
 * @property {import('svelte/store').Writable<string>} transformOrigin Derived store for `transformOrigin`.
 *
 * @property {import('svelte/store').Writable<number|null>} translateX Derived store for `translateX` updates.
 *
 * @property {import('svelte/store').Writable<number|null>} translateY Derived store for `translateY` updates.
 *
 * @property {import('svelte/store').Writable<number|null>} translateZ Derived store for `translateZ` updates.
 *
 * @property {import('svelte/store').Writable<number|null>} zIndex Derived store for `zIndex` updates.
 */

/**
 * @typedef {object} TJSPositionDataExtended
 *
 * @property {number|string|null} [height] -
 *
 * @property {number|string|null} [left] -
 *
 * @property {number|string|null} [maxHeight] -
 *
 * @property {number|string|null} [maxWidth] -
 *
 * @property {number|string|null} [minHeight] -
 *
 * @property {number|string|null} [minWidth] -
 *
 * @property {number|string|null} [rotateX] -
 *
 * @property {number|string|null} [rotateY] -
 *
 * @property {number|string|null} [rotateZ] -
 *
 * @property {number|string|null} [scale] -
 *
 * @property {number|string|null} [top] -
 *
 * @property {string|null} [transformOrigin] -
 *
 * @property {number|string|null} [translateX] -
 *
 * @property {number|string|null} [translateY] -
 *
 * @property {number|string|null} [translateZ] -
 *
 * @property {number|string|null} [width] -
 *
 * @property {number|string|null} [zIndex] -
 *
 * Extended properties -----------------------------------------------------------------------------------------------
 *
 * @property {number|null} [rotation] Alias for `rotateZ`.
 */
