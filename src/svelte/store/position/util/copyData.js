import { TJSPositionData } from '../data';

/**
 * Convenience to copy from source to target of two TJSPositionData like objects. If a target is not supplied a new
 * {@link TJSPositionData} instance is created.
 *
 * @param {import('../data/types').Data.TJSPositionData}  source - The source instance to copy from.
 *
 * @param {import('../data/types').Data.TJSPositionData}  [target] - Target TJSPositionData like object; if one is not
 *        provided a new instance is created.
 *
 * @returns {import('../data/types').Data.TJSPositionData} The target instance.
 */
export function copyData(source, target = new TJSPositionData())
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
