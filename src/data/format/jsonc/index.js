/**
 * `JSONC` is JSON with JavaScript style comments. This provides a scanner and fault-tolerant parser that can process
 * `JSONC` but is also useful for standard JSON.
 *
 * In particular for just parsing like `JSON.parse` use the `parse` function. All the other functions provided involve
 * AST manipulation:
 *
 * ```
 * - the `parse` function evaluates the JavaScript object represented by JSON string in a fault-tolerant fashion.
 * - the `scanner` tokenizes the input string into tokens and token offsets
 * - the `visit` function implements a 'SAX' style parser with callbacks for the encountered properties and values.
 * - the `parseTree` function computes a hierarchical DOM with offsets representing the encountered properties and
 * values.
 * - the `getLocation` API returns a location object that describes the property or value located at a given offset in
 * a JSON document.
 * - the `findNodeAtLocation` API finds the node at a given location path in a JSON DOM.
 * - the `format` API computes edits to format a JSON document.
 * - the `modify` API computes edits to insert, remove or replace a property or value in a JSON document.
 * - the `applyEdits` API applies edits to a document.
 * ```
 *
 * @see https://www.npmjs.com/package/jsonc-parser
 *
 * @module
 */
export * from 'jsonc-parser';
