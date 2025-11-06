import { isObject }        from '#runtime/util/object';

import { CrossRealmUtil }  from './CrossRealmUtil';

/**
 * Methods that perform realm-safe checks for built-in JavaScript types and core ECMAScript language objects.
 */
abstract class CrossRealmLanguage
{
   private constructor()
   {
      throw new Error('CrossRealmLanguage constructor: This is a static class and should not be constructed.');
   }

   /**
    * {@link CrossRealmLanguage.API.isCtorName}
    */
   static isCtorName(target: unknown, types: string | Set<string>): boolean
   {
      if (!isObject(target)) { return false; }

      if (typeof types === 'string' && target?.constructor?.name === types) { return true; }

      return !!(types as Set<string>)?.has(target?.constructor?.name);
   }

   /**
    * {@link CrossRealmLanguage.API.isDate}
    */
   static isDate(target: unknown): target is Date
   {
      return CrossRealmUtil.isTagged(target, 'Date');
   }

   /**
    * {@link CrossRealmLanguage.API.isMap}
    */
   static isMap(target: unknown): target is Map<unknown, unknown>
   {
      return CrossRealmUtil.isTagged(target, 'Map');
   }

   /**
    * {@link CrossRealmLanguage.API.isPromise}
    */
   static isPromise(target: unknown): target is Promise<unknown>
   {
      return CrossRealmUtil.isTagged(target, 'Promise');
   }

   /**
    * {@link CrossRealmLanguage.API.isRegExp}
    */
   static isRegExp(target: unknown): target is RegExp
   {
      return CrossRealmUtil.isTagged(target, 'RegExp');
   }

   /**
    * {@link CrossRealmLanguage.API.isSet}
    */
   static isSet(target: unknown): target is Set<unknown>
   {
      return CrossRealmUtil.isTagged(target, 'Set');
   }
}

declare namespace CrossRealmLanguage {
   export interface API {
      /**
       * Provides basic type checking by constructor name(s) for objects. This can be useful when checking multiple
       * constructor names against a provided Set.
       *
       * @param target - Object to test for constructor name.
       *
       * @param types Specific constructor name or Set of constructor names to match.
       *
       * @returns Does the provided object constructor name match the types provided.
       */
      isCtorName(target: unknown, types: string | Set<string>): boolean;

      /**
       * Provides basic prototype string type checking if `target` is a Date.
       *
       * @param target - A potential Date to test.
       *
       * @returns Is `target` a Date.
       */
      isDate(target: unknown): target is Date;

      /**
       * Provides basic prototype string type checking if `target` is a Map.
       *
       * @param target - A potential Map to test.
       *
       * @returns Is `target` a Map.
       */
      isMap(target: unknown): target is Map<unknown, unknown>;

      /**
       * Provides basic prototype string type checking if `target` is a Promise.
       *
       * @param target - A potential Promise to test.
       *
       * @returns Is `target` a Promise.
       */
      isPromise(target: unknown): target is Promise<unknown>;

      /**
       * Provides basic prototype string type checking if `target` is a RegExp.
       *
       * @param target - A potential RegExp to test.
       *
       * @returns Is `target` a RegExp.
       */
      isRegExp(target: unknown): target is RegExp;

      /**
       * Provides basic prototype string type checking if `target` is a Set.
       *
       * @param target - A potential Set to test.
       *
       * @returns Is `target` a Set.
       */
      isSet(target: unknown): target is Set<unknown>;
   }
}

export { CrossRealmLanguage };
