import { TJSPositionData }    from './TJSPositionData';

import type { Data }       from './types';
import type { AnimationAPI }  from '../animation/types';

/**
 * Various internal utilities to work with {@link TJSPositionData}.
 */
export class TJSPositionDataUtil
{
   /**
    * Stores the TJSPositionData properties that can be animated.
    */
   static #animateKeys: ReadonlySet<string> = Object.freeze(new Set([
      // Main keys
      'left', 'top', 'maxWidth', 'maxHeight', 'minWidth', 'minHeight', 'width', 'height',
      'rotateX', 'rotateY', 'rotateZ', 'scale', 'translateX', 'translateY', 'translateZ', 'zIndex',

      // Aliases
      'rotation'
   ]));

   /**
    * Stores the TJSPositionData property aliases that can be animated.
    */
   static #animateKeyAliases: ReadonlyMap<string, AnimationAPI.AnimationKey> = Object.freeze(
    new Map([['rotation', 'rotateZ' as AnimationAPI.AnimationKey]]));

   /**
    * Provides numeric defaults for all parameters. This is used by {@link TJSPosition.get} to optionally
    * provide numeric defaults.
    */
   static #numericDefaults: Readonly<{ [key: string]: number | null }> = Object.freeze({
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
    * @param source - The source instance to copy from.
    *
    * @param [target] - Target TJSPositionData like object; if one is not provided a new instance is created.
    *
    * @returns The target instance with all TJSPositionData fields.
    */
   static copyData(source: Partial<Data.TJSPositionData>,
    target: Data.TJSPositionData = new TJSPositionData()): TJSPositionData
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
    * @param key - Animation key / possibly aliased key.
    *
    * @returns Actual non-aliased animation key.
    */
   static getAnimationKey(key: AnimationAPI.AnimationKey): AnimationAPI.AnimationKey
   {
      return this.#animateKeyAliases.get(key) ?? key;
   }

   /**
    * Queries an object by the given key or otherwise returns any numeric default.
    *
    * @param data - An object to query for the given animation key.
    *
    * @param key - Animation key.
    *
    * @param [aliased=false] - When use non-aliased key.
    *
    * @returns Data at key or numeric default.
    */
   static getDataOrDefault(data: { [key: string]: any }, key: keyof Data.TJSPositionData,
    aliased: boolean = false): number
   {
      if (aliased) { key = this.#animateKeyAliases.get(key) ?? key; }

      return data[key] ?? this.#numericDefaults[key];
   }

   /**
    * Tests if the given key is an animation key.
    *
    * @param key - A potential animation key.
    *
    * @returns Is animation key.
    */
   static isAnimationKey(key: string): key is AnimationAPI.AnimationKey
   {
      return this.#animateKeys.has(key);
   }

   /**
    * Sets numeric defaults for a {@link TJSPositionData} like object.
    *
    * @param data - A TJSPositionData like object.
    */
   static setNumericDefaults(data: { [key: string]: any })
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
