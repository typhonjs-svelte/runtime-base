/**
 * Defines the keys of TJSPositionData that are transform keys.
 *
 * @type {string[]}
 */
const transformKeys = Object.freeze([
 'rotateX', 'rotateY', 'rotateZ', 'scale', 'translateX', 'translateY', 'translateZ'
]);

/**
 * Defines bitwise keys for transforms used in {@link TJSTransforms.getMat4}.
 *
 * @type {object}
 */
const transformKeysBitwise = Object.freeze({
   rotateX: 1,
   rotateY: 2,
   rotateZ: 4,
   scale: 8,
   translateX: 16,
   translateY: 32,
   translateZ: 64
});

/**
 * Defines the default transform origin.
 *
 * @type {string}
 */
const transformOriginDefault = 'top left';

/**
 * Defines the valid transform origins.
 *
 * @type {string[]}
 */
const transformOrigins = Object.freeze(['top left', 'top center', 'top right', 'center left', 'center', 'center right',
 'bottom left', 'bottom center', 'bottom right']);

export {
   transformKeys,
   transformKeysBitwise,
   transformOriginDefault,
   transformOrigins
};
