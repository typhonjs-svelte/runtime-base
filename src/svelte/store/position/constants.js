/**
 * Stores the TJSPositionData properties that can be animated.
 *
 * @type {ReadonlySet<string>}
 */
const animateKeys = Object.freeze(new Set([
   // Main keys
   'left', 'top', 'maxWidth', 'maxHeight', 'minWidth', 'minHeight', 'width', 'height',
   'rotateX', 'rotateY', 'rotateZ', 'scale', 'translateX', 'translateY', 'translateZ', 'zIndex',

   // Aliases
   'rotation'
]));

/**
 * Defines the keys of TJSPositionData that are transform keys.
 *
 * @type {string[]}
 */
const transformKeys = Object.freeze([
 'rotateX', 'rotateY', 'rotateZ', 'scale', 'translateX', 'translateY', 'translateZ'
]);

/**
 * Parses relative values in addition to other string formats such as percent value. Relative values must start with
 * leading values '+=', '-=', or '*=' followed by a float / numeric value. IE `+=45` or for percentage '+=10%'.
 * Also handles exact percent value such as `10` or `10%`. Percentage values are based on the current value,
 * parent element constraints, or constraints of the type of value like rotation being bound by 360 degrees.
 *
 * TODO: In the future support more specific CSS unit types.
 *
 * @type {RegExp}
 */
const regexRelative = /^(?<operation>[-+*]=)?(?<value>-?\d*\.?\d+)(?<unit>%|%~|px)?$/;

/**
 * Provides numeric defaults for all parameters. This is used by {@link TJSPosition.get} to optionally
 * provide numeric defaults.
 *
 * @type {{rotation: number, scale: number, minWidth: null, minHeight: null, translateZ: number, top: number, left: number, maxHeight: null, translateY: number, translateX: number, width: number, transformOrigin: null, rotateX: number, rotateY: number, height: number, maxWidth: null, zIndex: null, rotateZ: number}}
 */
const numericDefaults = Object.freeze({
   // Other keys
   height: 0,
   left: 0,
   maxHeight: null,
   maxWidth: null,
   minHeight: null,
   minWidth: null,
   top: 0,
   transformOrigin: null,
   width: 0,
   zIndex: null,

   rotateX: 0,
   rotateY: 0,
   rotateZ: 0,
   scale: 1,
   translateX: 0,
   translateY: 0,
   translateZ: 0,

   rotation: 0
});

/**
 * Sets numeric defaults for a {@link TJSPositionData} like object.
 *
 * @param {object}   data - A TJSPositionData like object.
 */
function setNumericDefaults(data)
{
   // Transform keys
   if (data.rotateX === null) { data.rotateX = 0; }
   if (data.rotateY === null) { data.rotateY = 0; }
   if (data.rotateZ === null) { data.rotateZ = 0; }
   if (data.translateX === null) { data.translateX = 0; }
   if (data.translateY === null) { data.translateY = 0; }
   if (data.translateZ === null) { data.translateZ = 0; }
   if (data.scale === null) { data.scale = 1; }

   // Aliases
   if (data.rotation === null) { data.rotation = 0; }
}

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
   animateKeys,
   numericDefaults,
   regexRelative,
   setNumericDefaults,
   transformKeys,
   transformKeysBitwise,
   transformOriginDefault,
   transformOrigins
};
