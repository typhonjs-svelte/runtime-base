import { CrossRealmBrowser }  from './CrossRealmBrowser';
import { CrossRealmLanguage } from './CrossRealmLanguage';

/**
 * Provides cross-realm checks for DOM nodes / elements, events, and essential duck typing for any class-based object
 * with a constructor name. A realm is an execution environment with its own global object and intrinsics; values
 * created in different realms do not share prototypes, so checks like `instanceof` can fail across realms. This
 * includes sharing JS code across browser windows.
 *
 * The impetus is that certain browsers such as Chrome and Firefox behave differently when performing `instanceof`
 * checks when elements are moved between browser windows. With Firefox in particular, the entire JS runtime cannot use
 * `instanceof` checks as the instances of fundamental DOM elements differ between windows.
 *
 * TRL supports moving applications from a main central browser window and popping them out into separate standalone
 * app instances in a separate browser window. In this case, for essential DOM element and event checks, it is necessary
 * to employ the workarounds found in `CrossRealm`.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model#realms
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/instanceof#instanceof_and_multiple_realms
 * @see https://262.ecma-international.org/#sec-code-realms
 */
abstract class CrossRealm
{
   private constructor()
   {
      throw new Error('CrossRealm constructor: This is a static class and should not be constructed.');
   }

   /**
    * @returns Methods that perform realm-safe checks for DOM elements, browser globals, and Web Platform APIs.
    */
   static get browser(): CrossRealm.Browser.API { return CrossRealmBrowser; }

   /**
    * @returns Methods that perform realm-safe checks for built-in JavaScript types and core ECMAScript language
    *          objects.
    */
   static get lang(): CrossRealm.Language.API { return CrossRealmLanguage; }
}

declare namespace CrossRealm {
   export namespace Browser {
      export import Options = CrossRealmBrowser.Options;
      export import API = CrossRealmBrowser.API;
   }

   export namespace Language {
      export import API = CrossRealmLanguage.API;
   }
}

export { CrossRealm }
