/**
 * Provides static data useful for handling custom props / options to components that allow dynamic configuration of
 * transitions. This is used in all application shells and components that have configurable transitions.
 *
 * @ignore
 */
class TJSDefaultTransition
{
   static #options = {};

   static #default = () => void 0;

   /**
    * @returns {() => undefined} Default empty transition.
    */
   static get default() { return this.#default; }

   /**
    * @returns {{}} Default empty options.
    */
   static get options() { return this.#options; }
}

export { TJSDefaultTransition };
