export *                   from './action';
export *                   from './TJSPosition.js';

// From: position/TJSPosition.js ----------------------------------------------------------------------------------------

/**
 * @typedef {object} TJSPositionOptions Options set in constructor.
 *
 * @property {boolean} [calculateTransform] When true always calculate transform data.
 *
 * @property {import('./system/types').System.Initial.InitialSystem} [initial] Provides a helper for setting
 *           initial position location.
 *
 * @property {boolean} [ortho] Sets TJSPosition to orthographic mode using just transform / matrix3d for positioning.
 *
 * @property {boolean} [transformSubscribed] Set to true when there are subscribers to the readable transform store.
 *
 * @property {(
 *    import('./system/validators/types').ValidatorAPI.ValidatorFn |
 *    import('./system/validators/types').ValidatorAPI.ValidatorData |
 *    Iterable<import('./system/validators/types').ValidatorAPI.ValidatorFn |
 *     import('./system/validators/types').ValidatorAPI.ValidatorData>
 * )} [validator] - Provides an initial validator or list of validators.
 */

/**
 * @typedef {TJSPositionOptions & Partial<import('./data/types').Data.TJSPositionData>} TJSPositionOptionsAll
 */
