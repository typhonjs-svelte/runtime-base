import { isObject } from '#runtime/util/object';

/**
 * Provides cross window checks for DOM elements, events, and essential duck typing for any class based object with a
 * constructor name. The impetus is that certain browsers such as Chrome and Firefox behave differently when
 * performing `instanceof` checks when elements are moved between browser windows. With Firefox in particular the
 * entire JS runtime can not use `instanceof` checks as the instances of fundamental DOM elements differ between
 * windows.
 *
 * TRL supports moving applications from a main central browser window and popping them out into separate standalone
 * app instances in a separate browser window. In this case for essential DOM element and event checks it's necessary to
 * employ the workarounds found in `CrossWindowCheck`.
 */
export class CrossWindowCheck
{
   /**
    * @private
    */
   constructor() {} // eslint-disable-line no-useless-constructor

   // Cached DOM nodes from initial `globalThis` reference / originating window.
   static #Element = globalThis.Element;
   static #HTMLElement = globalThis.HTMLElement;
   static #Node = globalThis.Node;
   static #SVGElement = globalThis.SVGElement;

   static #InputEventSet = new Set(['KeyboardEvent', 'MouseEvent', 'PointerEvent']);

   // Collection typing ----------------------------------------------------------------------------------------------

   /**
    * Provides basic prototype string type checking if `map` is a Map.
    *
    * @param {unknown}  map - A potential Map to test.
    *
    * @returns {boolean} Is `map` a Map.
    */
   static isMap(map)
   {
      return isObject(map) && Object.prototype.toString.call(map) === '[object Map]';
   }

   /**
    * Provides basic prototype string type checking if `element` is an Element.
    *
    * @param {unknown}  set - A potential Set to test.
    *
    * @returns {boolean} Is `set` a Set.
    */
   static isSet(set)
   {
      return isObject(set) && Object.prototype.toString.call(set) === '[object Set]';
   }

   // DOM Element typing ---------------------------------------------------------------------------------------------

   /**
    * Provides precise type checking if `element` is an Element.
    *
    * @param {unknown}  element - A potential Element to test.
    *
    * @returns {boolean} Is `element` an Element.
    */
   static isElement(element)
   {
      if (element?.nodeType !== 1) { return false; }

      if (element instanceof this.#Element) { return true; }

      const OwnerElement = element?.ownerDocument?.defaultView?.Element;

      return OwnerElement && element instanceof OwnerElement;
   }

   /**
    * Provides precise type checking if `element` is a HTMLElement.
    *
    * @param {unknown}  element - A potential HTMLElement to test.
    *
    * @returns {boolean} Is `element` an HTMLElement.
    */
   static isHTMLElement(element)
   {
      if (element?.nodeType !== 1) { return false; }

      if (element instanceof this.#HTMLElement) { return true; }

      const OwnerHTMLElement = element?.ownerDocument?.defaultView?.HTMLElement;

      return OwnerHTMLElement && element instanceof OwnerHTMLElement;
   }

   /**
    * Provides precise type checking if `element` is a Node.
    *
    * @param {unknown}  node - A potential Node to test.
    *
    * @returns {boolean} Is `node` a DOM Node.
    */
   static isNode(node)
   {
      if (typeof node?.nodeType !== 'number') { return false; }

      if (node instanceof this.#Node) { return true; }

      const OwnerNode = node?.ownerDocument?.defaultView?.Node;

      return OwnerNode && node instanceof OwnerNode;
   }

   /**
    * Provides precise type checking if `element` is a SVGElement.
    *
    * @param {unknown}  element - A potential SVGElement to test.
    *
    * @returns {boolean} Is `element` an SVGElement.
    */
   static isSVGElement(element)
   {
      if (element?.nodeType !== 1) { return false; }

      if (element instanceof this.#SVGElement) { return true; }

      const OwnerSVGElement = element?.ownerDocument?.defaultView?.SVGElement;

      return OwnerSVGElement && element instanceof OwnerSVGElement;
   }

   // Generic typing -------------------------------------------------------------------------------------------------

   /**
    * Provides basic type checking by constructor name(s) for objects. This can be useful when checking multiple
    * constructor names against a provided Set.
    *
    * @param {unknown}  object - Object to test for constructor name.
    *
    * @param {string | Set<string>} types Specific constructor name or Set of constructor names to match.
    *
    * @returns {boolean} Does the provided object constructor name match the types provided.
    */
   static isCtorName(object, types)
   {
      if (!isObject(object)) { return false; }

      if (typeof types === 'string' && object?.constructor?.name === types) { return true; }

      return !!types?.has(object?.constructor?.name);
   }

   /**
    * Provides basic duck type checking for `Event` signature and optional constructor name(s).
    *
    * @param {unknown}  event - A potential DOM event to test.
    *
    * @param {string | Set<string>} [types] Specific constructor name or Set of constructor names to match.
    *
    * @returns {boolean} Is `event` an Event with optional constructor name check.
    */
   static isEvent(event, types)
   {
      if (typeof event?.type !== 'string' || typeof event?.defaultPrevented !== 'boolean' ||
       typeof event?.stopPropagation !== 'function')
      {
         return false;
      }

      return types !== void 0 ? this.isCtorName(event, types) : true;
   }

   /**
    * Provides basic duck type checking for `Event` signature for standard input events including `KeyboardEvent`,
    * `MouseEvent`, and `PointerEvent`. This method is useful when constructing a Set for constructor name testing is
    * not convenient.
    *
    * @param {unknown}  event - A potential DOM event to test.
    *
    * @returns {boolean} Is `event` a Keyboard, MouseEvent, or PointerEvent.
    */
   static isInputEvent(event)
   {
      return this.isEvent(event, this.#InputEventSet);
   }
}
