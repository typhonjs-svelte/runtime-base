import { TJSPositionData } from './TJSPositionData.js';

/**
 * Various internal utilities to work with {@link TJSPositionData}.
 */
export class TJSPositionDataUtil
{
   /**
    * Stores the TJSPositionData properties that can be animated.
    *
    * @type {ReadonlySet<string>}
    */
   static #animateKeys = Object.freeze(new Set([
      // Main keys
      'left', 'top', 'maxWidth', 'maxHeight', 'minWidth', 'minHeight', 'width', 'height',
      'rotateX', 'rotateY', 'rotateZ', 'scale', 'translateX', 'translateY', 'translateZ', 'zIndex',

      // Aliases
      'rotation'
   ]));

   /**
    * Stores the TJSPositionData property aliases that can be animated.
    *
    * @type {Readonly<Map<string, string>>}
    */
   static #animateKeyAliases = Object.freeze(new Map([['rotation', 'rotateZ']]));

   /**
    * Provides numeric defaults for all parameters. This is used by {@link TJSPosition.get} to optionally
    * provide numeric defaults.
    *
    * @type {Record<string, number | null>}
    */
   static #numericDefaults = Object.freeze({
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
    * Convenience to copy from source to target of two TJSPositionData like objects. If a target is not supplied a new
    * {@link TJSPositionData} instance is created.
    *
    * @param {Partial<import('./types').Data.TJSPositionData>}  source - The source instance to copy from.
    *
    * @param {import('./types').Data.TJSPositionData}  [target] - Target TJSPositionData like object; if one
    *        is not provided a new instance is created.
    *
    * @returns {import('./types').Data.TJSPositionData} The target instance with all TJSPositionData fields.
    */
   static copyData(source, target = new TJSPositionData())
   {
      target.height = source.height ?? null;
      target.left = source.left ?? null;
      target.maxHeight = source.maxHeight ?? null;
      target.maxWidth = source.maxWidth ?? null;
      target.minHeight = source.minHeight ?? null;
      target.minWidth = source.minWidth ?? null;
      target.rotateX = source.rotateX ?? null;
      target.rotateY = source.rotateY ?? null;
      target.rotateZ = source.rotateZ ?? null;
      target.scale = source.scale ?? null;
      target.top = source.top ?? null;
      target.transformOrigin = source.transformOrigin ?? null;
      target.translateX = source.translateX ?? null;
      target.translateY = source.translateY ?? null;
      target.translateZ = source.translateZ ?? null;
      target.width = source.width ?? null;
      target.zIndex = source.zIndex ?? null;

      return target;
   }

   /**
    * Returns the non-aliased animation key.
    *
    * @param {import('../animation/types').AnimationAPI.AnimationKey} key - Animation key / possibly aliased key.
    *
    * @returns {import('../animation/types').AnimationAPI.AnimationKey} Actual non-aliased animation key.
    */
   static getAnimationKey(key)
   {
      return this.#animateKeyAliases.get(key) ?? key;
   }

   /**
    * Queries an object by the given key or otherwise returns any numeric default.
    *
    * @param {object}   data - An object to query for the given animation key.
    *
    * @param {import('../animation/types').AnimationAPI.AnimationKey}   key - Animation key.
    *
    * @param {boolean}  [aliased=false] - When use non-aliased key.
    *
    * @returns {*|number|null}
    */
   static getDataOrDefault(data, key, aliased = false)
   {
      if (aliased) { key = this.#animateKeyAliases.get(key) ?? key; }

      return data[key] ?? this.#numericDefaults[key];
   }

   /**
    * Tests if the given key is an animation key.
    *
    * @param {unknown}   key - A potential animation key.
    *
    * @returns {key is import('../animation/types').AnimationAPI.AnimationKey} Is animation key.
    */
   static isAnimationKey(key)
   {
      return this.#animateKeys.has(key);
   }

   /**
    * Sets numeric defaults for a {@link TJSPositionData} like object.
    *
    * @param {object}   data - A TJSPositionData like object.
    */
   static setNumericDefaults(data)
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
}
