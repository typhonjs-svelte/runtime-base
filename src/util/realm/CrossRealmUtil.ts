import { isObject } from '#runtime/util/object';

export abstract class CrossRealmUtil
{
   static isTagged(target: unknown, tag: string): target is Record<string, unknown>
   {
      return isObject(target) && Object.prototype.toString.call(target) === `[object ${tag}]`;
   }

   static isTaggedAny(target: unknown, ...tags: string[]): target is Record<string, unknown>
   {
      if (!isObject(target)) { return false; }

      const tag = Object.prototype.toString.call(target);

      return tags.some((entry) => tag === `[object ${entry}]`);
   }
}
