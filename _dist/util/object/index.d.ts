/**
 * Provides JavaScript and TypeScript utilities for validating, inspecting, traversing, comparing, cloning, and
 * modifying object structures. The API is designed for general-purpose object handling while preserving strong
 * TypeScript inference and predictable runtime behavior.
 *
 * The package includes runtime assertions and type guards for objects, plain objects, records, property keys,
 * array indexes, and iterable protocols. The property-path / {@link PropertyPath} API supports both dotted strings
 * and exact {@link PropertyKey} arrays, allowing strongly typed access to string, numeric, symbol, empty-string, and
 * literal-period keys. Utilities are provided for path validation, normalization, concatenation, comparison,
 * traversal, property lookup, descriptor and owner inspection, hardened assignment, and deletion.
 *
 * Additional capabilities include deep cloning, merging, freezing, and sealing; prototype and accessor inspection;
 * symbol-aware object traversal and structural comparison; and utilities for safely handling synchronous and
 * asynchronous iterables. Trie-backed {@link PropertyPathMap} and {@link WeakPropertyPathMap} collections provide
 * structural path storage, candidate-object matching, bounded subtree queries, and weakly held root associations.
 * Configurable depth, entry, trie-node, result, and visit limits provide defensive controls for broad or untrusted
 * property structures.
 *
 * @packageDocumentation
 *
 * @categoryDescription Accessors and Prototypes
 * > [!NOTE]
 * > Inspects getter and setter descriptors and evaluates constructor prototype relationships.
 * >
 * > **_`hasAccessor`_** — Determines whether a property descriptor provides both a getter and setter.
 * >
 * > **_`hasGetter`_** — Determines whether a property descriptor provides a getter.
 * >
 * > **_`hasPrototype`_** — Determines whether a constructor matches or inherits from another constructor's prototype.
 * >
 * > **_`hasSetter`_** — Determines whether a property descriptor provides a setter.
 *
 * @categoryDescription Deep Object Operations
 * > [!NOTE]
 * > Clones, combines, freezes, or seals complete object structures.
 * >
 * > **_`deepFreeze`_** — Recursively freezes traversed objects and arrays.
 * >
 * > **_`deepMerge`_** — Recursively merges one or more source objects into a target with inferred result typing.
 * >
 * > **_`deepSeal`_** — Recursively seals traversed objects and arrays.
 * >
 * > **_`klona`_** — Creates a deep clone using the re-exported `klona/full` implementation.
 *
 * @categoryDescription General Object Utilities
 * > [!NOTE]
 * > Provides small object-oriented convenience operations that do not belong to the more specialized API categories.
 * >
 * > **_`objectKeys`_** — Returns typed object keys with safe fallback behavior.
 * >
 * > **_`objectSize`_** — Determines the size of objects, arrays, maps, sets, and strings.
 *
 * @categoryDescription Iterable Utilities
 * > [!NOTE]
 * > Detects iterable protocols and safely prepares non-empty synchronous or asynchronous iterables.
 * >
 * > **_`ensureNonEmptyAsyncIterable`_** — Produces a non-empty asynchronous iterable from asynchronous or synchronous
 * > iterable input.
 * >
 * > **_`ensureNonEmptyIterable`_** — Peeks at a synchronous iterable and returns a replaying iterable when at least one
 * > value is available.
 * >
 * > **_`isAsyncIterable`_** — Determines whether a value implements the asynchronous iterable protocol.
 * >
 * > **_`isIterable`_** — Determines whether a value implements the synchronous iterable protocol while excluding
 * > strings.
 *
 * @categoryDescription Object Properties
 * > [!NOTE]
 * > Provides TypeScript type aliases for identifying and projecting writable, readonly, and non-callable object
 * > properties.
 * >
 * > **_`ReadonlyDataProperties<T>`_** — Projects `T` to an object containing only its readonly non-callable properties.
 * >
 * > **_`ReadonlyDataPropertyKeys<T>`_** — Produces the readonly property keys of `T` whose value types contain no
 * > callable member.
 * >
 * > **_`ReadonlyProperties<T>`_** — Projects `T` to an object containing only its readonly properties.
 * >
 * > **_`ReadonlyPropertyKeys<T>`_** — Produces the readonly property keys of `T` whose value types contain no callable
 * > member.
 * >
 * > **_`WritableDataProperties<T>`_** — Projects `T` to an object containing only its writable non-callable properties.
 * >
 * > **_`WritableDataPropertyKeys<T>`_** — Produces the writable property keys of `T` whose value types contain no
 * > callable member.
 * >
 * > **_`WritableProperties<T>`_** — Projects `T` to an object containing only its writable properties.
 * >
 * > **_`WritablePropertyKeys<T>`_** — Produces the property keys of `T` that support assignment.
 *
 * @categoryDescription Object Traversal and Comparison
 * > [!NOTE]
 * > Traverses object structures as exact property-key paths and compares corresponding values between objects.
 * >
 * > **_`PathKeyIteratorOptions`_** — Defines object traversal, property ownership, path-bound, and resource-limit
 * > options for `pathKeyIterator`.
 * >
 * > **_`PropertyPathTraversalLimits`_** — Defines common maximum depth, result, and visit controls for bounded
 * > property-path traversal.
 * >
 * > **_`pathKeyIterator`_** — Traverses a bounded object branch and yields exact property-key paths, including symbols
 * > and optionally numeric array indexes.
 * >
 * > **_`safeEqual`_** — Determines whether enumerable source paths and values are present and equal in a target object.
 *
 * @categoryDescription Object Validation
 * > [!NOTE]
 * > Validates runtime object shapes through assertions and type guards while preserving or refining TypeScript types.
 * >
 * > **_`assertNonNullObject`_** — Asserts a non-null object, including arrays, while preserving the value’s existing
 * > static type.
 * >
 * > **_`assertObject`_** — Asserts a non-null, non-array object while preserving the value's existing static type.
 * >
 * > **_`assertObjectOrFunction`_** — Asserts a non-null, non-array object or function while preserving the value's
 * > existing static type.
 * >
 * > **_`assertOrdinaryObject`_** — Asserts a non-null, non-callable object for which
 * > `Object.prototype.toString.call(value)` returns `'[object Object]'` while preserving the value's existing static
 * > type.
 * >
 * > **_`assertPlainObject`_** — Asserts an object whose prototype is `Object.prototype` or `null`.
 * >
 * > **_`assertRecord`_** — Asserts a non-null, non-array object that can be treated as a string-keyed record.
 * >
 * > **_`isNonNullObject`_** — Tests for a non-null object, including arrays, while preserving known object types where
 * > possible.
 * >
 * > **_`isObject`_** — Tests for a non-null, non-array object while preserving known object types where possible.
 * >
 * > **_`isObjectOrFunction`_** — Tests for a non-null, non-array object or function while preserving known object
 * > types where possible.
 * >
 * > **_`isOrdinaryObject`_** — Tests for a non-null, non-callable object for which
 * > `Object.prototype.toString.call(value)` returns `'[object Object]'`.
 * >
 * > **_`isPlainObject`_** — Tests for a plain dictionary-style object with no custom prototype.
 * >
 * > **_`isRecord`_** — Tests for a non-null, non-array object and narrows it to `Record<string, unknown>`.
 * >
 * > **_`NonNullObject`_** — Extracts the non-null, non-callable object members of a type, including arrays and
 * > specialized built-in objects.
 *
 * @categoryDescription Property Access and Inspection
 * > [!NOTE]
 * > Resolves structural property paths and inspects property existence, ownership, values, and descriptors.
 * >
 * > **_`getProperty`_** — Resolves a property value while preserving present `undefined` and `null` values.
 * >
 * > **_`getPropertyDescriptor`_** — Returns the descriptor defining the terminal property without invoking its getter.
 * >
 * > **_`getPropertyOwner`_** — Returns the object or prototype that owns the terminal property.
 * >
 * > **_`hasProperty`_** — Determines whether a complete property path exists without reading the terminal property
 * > value.
 * >
 * > **_`safeAccess`_** — Resolves a property path with optional default-value semantics for missing or nullish values.
 *
 * @categoryDescription Property Keys and Paths
 * > [!NOTE]
 * > Defines, validates, compares, and transforms property keys and structural property-path representations without
 * > accessing an object.
 * >
 * > **_`concatPropertyPath`_** — Concatenates multiple property paths into a newly allocated exact property-key path.
 * >
 * > **_`isArrayIndex`_** — Determines whether a number is a valid ECMAScript array index.
 * >
 * > **_`isJSONPropertyPath`_** — Validates a dotted string or array of string and finite-number segments that can be
 * > represented losslessly as a property path by JSON.
 * >
 * > **_`isPropertyKey`_** — Determines whether a value is a string, number, or symbol property key.
 * >
 * > **_`isPropertyPathEqual`_** — Determines whether two normalized property paths contain the same segments in the
 * > same order using SameValueZero comparison semantics.
 * >
 * > **_`isPropertyPath`_** — Validates a dotted string or exact property-key array as a property path.
 * >
 * > **_`isPropertyPathPrefix`_** — Determines whether one normalized property path is a structural prefix of another.
 * >
 * > **_`joinPropertyPath`_** — Converts an exact property-key path to dotted-string form when the conversion is
 * > lossless.
 * >
 * > **_`JSONPropertyPath`_** — Defines a non-empty property path that can be represented losslessly through ordinary
 * > JSON serialization.
 * >
 * > **_`normalizePropertyPath`_** — Converts a property path to its canonical property-key array representation.
 * >
 * > **_`PropertyPath`_** — Defines a dotted string path or exact readonly `PropertyKey` array accepted by path-aware
 * > APIs.
 * >
 * > **_`propertyPathIterator`_** — Produces a validating iterator from a single property path or iterable of property
 * > paths, giving valid single paths precedence over iterable interpretation.
 *
 * @categoryDescription Property Mutation
 * > [!NOTE]
 * > Performs hardened object mutation through structural property paths.
 * >
 * > **_`deleteProperty`_** — Deletes a configurable terminal property with explicit inherited-property handling and
 * > prototype-pollution protection.
 * >
 * > **_`safeSet`_** — Sets or updates a property-path value with optional missing-path creation and supported arithmetic
 * > operations.
 *
 * @categoryDescription Property Path Collections
 * > [!NOTE]
 * > Provides trie-backed collections keyed by structural property paths rather than array identity.
 * >
 * > **_`PropertyPathMap`_** — Map-like collection with structural path lookup, bounded iteration, subtree traversal,
 * > candidate-object matching, and configurable storage / traversal limits.
 * >
 * > **_`WeakPropertyPathMap`_** — Associates independently limited property-path maps with weakly held object roots.
 */

/**
 * Tests whether two types are identical.
 *
 * @typeParam A - First type.
 * @typeParam B - Second type.
 * @typeParam Equal - Result when the types are identical.
 * @typeParam NotEqual - Result when the types differ.
 */
type IfTypeEqual<A, B, Equal = true, NotEqual = false> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? Equal : NotEqual;
/**
 * Tests whether `T` is `any`.
 *
 * @typeParam T - Type to inspect.
 */
type IsAny<T> = 0 extends 1 & T ? true : false;
/**
 * Tests whether the non-nullish portion of `T` contains a callable type.
 *
 * `any` is conservatively treated as callable because it may represent a
 * callable value.
 *
 * @typeParam T - Type to inspect.
 */
type ContainsCallable<T> =
  IsAny<T> extends true ? true : Extract<NonNullable<T>, (...args: any[]) => unknown> extends never ? false : true;
/**
 * Produces the property keys of `T` that support assignment.
 *
 * Properties declared with `readonly` and getter-only accessors are excluded.
 * Getter / setter accessors, methods, and assignable function-valued properties
 * are included.
 *
 * @typeParam T - Object type to inspect.
 *
 * @example
 * ```ts
 * class Example
 * {
 *    value = 1;
 *
 *    readonly id = 'example';
 *
 *    get computed(): number
 *    {
 *       return this.value * 2;
 *    }
 *
 *    get configurable(): number
 *    {
 *       return this.value;
 *    }
 *
 *    set configurable(value: number)
 *    {
 *       this.value = value;
 *    }
 *
 *    reset(): void
 *    {
 *       this.value = 0;
 *    }
 * }
 *
 * type Keys = WritablePropertyKeys<Example>;
 * // "value" | "configurable" | "reset"
 * ```
 *
 * @category Object Properties
 */
type WritablePropertyKeys<T extends object> = {
  [K in keyof T]-?: IfTypeEqual<
    {
      [P in K]: T[P];
    },
    {
      -readonly [P in K]: T[P];
    },
    K,
    never
  >;
}[keyof T];
/**
 * Produces the property keys of `T` that do not support assignment.
 *
 * This includes explicitly readonly properties and getter-only accessors.
 *
 * @typeParam T - Object type to inspect.
 *
 * @example
 * ```ts
 * interface Example
 * {
 *    value: number;
 *    readonly id: string;
 * }
 *
 * type Keys = ReadonlyPropertyKeys<Example>;
 * // "id"
 * ```
 *
 * @category Object Properties
 */
type ReadonlyPropertyKeys<T extends object> = Exclude<keyof T, WritablePropertyKeys<T>>;
/**
 * Projects `T` to an object containing only its writable properties.
 *
 * Property value types and optional modifiers are preserved. Methods and
 * writable function-valued properties are included.
 *
 * @typeParam T - Object type to project.
 *
 * @example
 * ```ts
 * interface Example
 * {
 *    value: number;
 *    optional?: boolean;
 *    readonly id: string;
 * }
 *
 * type Result = WritableProperties<Example>;
 *
 * // {
 * //    value: number;
 * //    optional?: boolean;
 * // }
 * ```
 *
 * @category Object Properties
 */
type WritableProperties<T extends object> = Pick<T, WritablePropertyKeys<T>>;
/**
 * Projects `T` to an object containing only its readonly properties.
 *
 * Explicit readonly modifiers, getter-only accessors, optional modifiers, and
 * property value types are preserved.
 *
 * @typeParam T - Object type to project.
 *
 * @example
 * ```ts
 * interface Example
 * {
 *    value: number;
 *    readonly id: string;
 *    readonly created?: Date;
 * }
 *
 * type Result = ReadonlyProperties<Example>;
 *
 * // {
 * //    readonly id: string;
 * //    readonly created?: Date;
 * // }
 * ```
 *
 * @category Object Properties
 */
type ReadonlyProperties<T extends object> = Pick<T, ReadonlyPropertyKeys<T>>;
/**
 * Produces the writable property keys of `T` whose value types contain no
 * callable member.
 *
 * Methods, function-valued properties, optional function-valued properties,
 * and unions containing a callable type are excluded. Properties typed as
 * `any` are also conservatively excluded.
 *
 * @typeParam T - Object type to inspect.
 *
 * @example
 * ```ts
 * interface Example
 * {
 *    value: number;
 *    callback: () => void;
 *    optionalCallback?: () => void;
 *    mixed: string | (() => void);
 * }
 *
 * type Keys = WritableDataPropertyKeys<Example>;
 * // "value"
 * ```
 *
 * @category Object Properties
 */
type WritableDataPropertyKeys<T extends object> = {
  [K in WritablePropertyKeys<T>]-?: ContainsCallable<T[K]> extends true ? never : K;
}[WritablePropertyKeys<T>];
/**
 * Produces the readonly property keys of `T` whose value types contain no
 * callable member.
 *
 * Readonly function-valued properties and readonly unions containing a
 * callable type are excluded. Properties typed as `any` are also
 * conservatively excluded.
 *
 * @typeParam T - Object type to inspect.
 *
 * @example
 * ```ts
 * interface Example
 * {
 *    readonly id: string;
 *    readonly callback: () => void;
 * }
 *
 * type Keys = ReadonlyDataPropertyKeys<Example>;
 * // "id"
 * ```
 *
 * @category Object Properties
 */
type ReadonlyDataPropertyKeys<T extends object> = {
  [K in ReadonlyPropertyKeys<T>]-?: ContainsCallable<T[K]> extends true ? never : K;
}[ReadonlyPropertyKeys<T>];
/**
 * Projects `T` to an object containing only its writable non-callable
 * properties.
 *
 * Property value types and optional modifiers are preserved.
 *
 * @typeParam T - Object type to project.
 *
 * @example
 * ```ts
 * interface Example
 * {
 *    value: number;
 *    optional?: string;
 *    callback: () => void;
 *    readonly id: string;
 * }
 *
 * type Result = WritableDataProperties<Example>;
 *
 * // {
 * //    value: number;
 * //    optional?: string;
 * // }
 * ```
 *
 * @category Object Properties
 */
type WritableDataProperties<T extends object> = Pick<T, WritableDataPropertyKeys<T>>;
/**
 * Projects `T` to an object containing only its readonly non-callable
 * properties.
 *
 * Readonly modifiers, optional modifiers, and property value types are
 * preserved.
 *
 * @typeParam T - Object type to project.
 *
 * @example
 * ```ts
 * interface Example
 * {
 *    readonly id: string;
 *    readonly created?: Date;
 *    readonly callback: () => void;
 *    value: number;
 * }
 *
 * type Result = ReadonlyDataProperties<Example>;
 *
 * // {
 * //    readonly id: string;
 * //    readonly created?: Date;
 * // }
 * ```
 *
 * @category Object Properties
 */
type ReadonlyDataProperties<T extends object> = Pick<T, ReadonlyDataPropertyKeys<T>>;

/**
 * Represents a {@link PropertyPath} that can be losslessly encoded as JSON.
 *
 * Symbol segments are excluded. Numeric segments must be finite at runtime because JSON converts `NaN` and infinities
 * to `null`.
 *
 * @category Property Keys and Paths
 */
type JSONPropertyPath = string | readonly (string | number)[];
/**
 * Extracts the non-null, non-callable object members of `T`.
 *
 * This includes arrays, ordinary objects, class instances, boxed primitives, and specialized built-in objects.
 * Primitive, nullish, callable, and constructable members are excluded.
 *
 * @category Object Validation
 *
 * @typeParam T - Type whose non-null object members are extracted.
 */
type NonNullObject<T> = Exclude<T & object, ((...args: any[]) => any) | (abstract new (...args: any[]) => any)>;
/**
 * Represents a structural path to a property within an object.
 *
 * A property path may be expressed as either a dotted string or a readonly array of exact {@link PropertyKey}
 * segments. Dotted strings provide concise access to ordinary string-keyed properties, while array paths preserve
 * strings, numbers, and symbols without coercion or delimiter ambiguity.
 *
 * Exact array paths are required for numeric array indexes, symbol keys, empty-string keys, and property names
 * containing literal periods. Runtime APIs validate that paths are non-empty and may apply additional traversal or
 * mutation constraints.
 *
 * @category Property Keys and Paths
 */
type PropertyPath = string | readonly PropertyKey[];
/**
 * Defines common defensive limits for property-path traversal.
 *
 * All limits must be non-negative safe integers. `maxDepth` establishes a structural boundary, `maxResults` ends an
 * iterator normally after the requested number of results, and `maxVisits` throws a `RangeError` before another
 * property or trie node is processed. Trie-backed collections may impose lower constructor-level caps.
 *
 * @category Object Traversal and Comparison
 */
interface PropertyPathTraversalLimits {
  /**
   * Maximum number of property-key segments traversed beneath a selected prefix, or beneath the root when no prefix
   * is supplied. A value of `0` selects only the prefix itself when the iterator supports a prefix.
   */
  maxDepth?: number;
  /**
   * Maximum number of paths or entries yielded by one traversal. Reaching this limit truncates normally.
   */
  maxResults?: number;
  /**
   * Maximum number of object properties or trie nodes processed during iterative traversal. Exceeding this limit
   * throws.
   */
  maxVisits?: number;
}
/**
 * Defines bounded traversal options for {@link pathKeyIterator}.
 *
 * Returned paths remain absolute when a prefix is selected. `stopPath` must equal or descend from `prefixPath` when
 * both are supplied.
 *
 * @category Object Traversal and Comparison
 */
interface PathKeyIteratorOptions extends PropertyPathTraversalLimits {
  /** Whether numeric array indexes are included. @default false */
  arrayIndex?: boolean;
  /** Whether traversal is restricted to enumerable own properties. @default true */
  hasOwnOnly?: boolean;
  /** Absolute enumerable property path selecting the object branch where traversal begins. */
  prefixPath?: PropertyPath;
  /** Absolute property path yielded as terminal while pruning all descendants beneath it. */
  stopPath?: PropertyPath;
}

/**
 * Stores values by structural {@link PropertyPath} paths using a property-key trie.
 *
 * `PropertyPathMap` combines exact structural path storage with trie-aware object matching and bounded subtree
 * traversal. In addition to normal map-style lookup, stored paths can be evaluated collectively against a candidate
 * object, allowing the map to operate as a reusable index of properties, bindings, field definitions, validators, or
 * other metadata associated with an object structure.
 *
 * Unlike `Map<readonly PropertyKey[], V>`, lookup does not depend on property-key array identity. Equivalent paths
 * resolve to the same entry even when a new property-key array is supplied:
 *
 * @example
 * ```ts
 * const map = new PropertyPathMap<number>();
 *
 * map.set(['actors', 0, 'id'], 42);
 * map.get(['actors', 0, 'id']); // 42
 * ```
 *
 * Dotted strings and equivalent string-key arrays share the same trie path:
 *
 * @example
 * ```ts
 * map.set('settings.theme', 'dark');
 * map.get(['settings', 'theme']); // 'dark'
 * ```
 *
 * Exact array property-key paths remain necessary for symbols, numeric keys, empty-string keys, and string keys
 * containing literal periods.
 *
 * ## Iterator families
 *
 * The collection provides three complementary iterator families:
 *
 * - `entries`, `keys`, and `values` iterate all stored entries in normal map insertion order.
 * - `matchingEntries`, `matchingKeys`, and `matchingValues` evaluate stored paths against a candidate object.
 * - `subtreeEntries`, `subtreeKeys`, and `subtreeValues` traverse a selected trie branch without inspecting an object.
 *
 * Every iterator supports bounded operation through depth, result, and visit limits. Matching and subtree iterators
 * additionally support absolute `pathPrefix` and `stopAt` bounds.
 *
 * ## Candidate-object matching
 *
 * The matching iterators treat the stored trie as a reusable structural query over a candidate object:
 *
 * @example
 * ```ts
 * const fields = new PropertyPathMap<string>();
 *
 * fields.set('system.attributes.hp.value', 'hit-points');
 * fields.set('system.attributes.hp.max', 'maximum-hit-points');
 * fields.set('system.attributes.ac.value', 'armor-class');
 *
 * const actor = {
 *    system: {
 *       attributes: {
 *          hp: {
 *             value: 12
 *          }
 *       }
 *    }
 * };
 *
 * [...fields.matchingEntries(actor)];
 * // [
 * //    [['system', 'attributes', 'hp', 'value'], 'hit-points']
 * // ]
 * ```
 *
 * Matching traverses the property-key trie and candidate object together. Shared path prefixes are inspected only
 * once for each matching operation. When a candidate prefix is missing or cannot be traversed, the complete stored
 * subtree beneath that prefix is rejected without resolving each descendant path independently. This makes matching
 * particularly useful when the map contains many paths with common prefixes.
 *
 * `matchingKeys` yields only the available stored paths, while `matchingValues` yields only their mapped values.
 * `matchingEntries` yields both:
 *
 * ```ts
 * for (const path of fields.matchingKeys(actor))
 * {
 *    // path: readonly PropertyKey[]
 * }
 *
 * for (const field of fields.matchingValues(actor))
 * {
 *    // field: string
 * }
 *
 * for (const [path, field] of fields.matchingEntries(actor))
 * {
 *    // path: readonly PropertyKey[]
 *    // field: string
 * }
 * ```
 *
 * By default, matching determines terminal property availability without reading the terminal value. This avoids
 * invoking a terminal getter or proxy `get` trap merely to establish that a path exists.
 *
 * Set `includePropertyValue` to include the resolved candidate value in the iterator result:
 *
 * @example
 * ```ts
 * for (const [path, field, propertyValue] of fields.matchingEntries(actor, {
 *    includePropertyValue: true
 * }))
 * {
 *    // path: readonly PropertyKey[]
 *    // field: string
 *    // propertyValue: unknown
 * }
 *
 * for (const [field, propertyValue] of fields.matchingValues(actor, {
 *    includePropertyValue: true
 * }))
 * {
 *    // field: string
 *    // propertyValue: unknown
 * }
 * ```
 *
 * The overloads for `matchingEntries` and `matchingValues` reflect a literal `includePropertyValue: true` option in
 * the returned iterator type.
 *
 * Matching follows normal JavaScript property lookup by default. Set `hasOwnOnly` to require every matched segment to
 * be an own property of the candidate value reached at that depth.
 *
 * ## Prefix and stop bounds
 *
 * `pathPrefix` begins matching or subtree traversal directly at one absolute stored trie path. Unrelated branches are
 * never visited:
 *
 * @example
 * ```ts
 * fields.matchingEntries(actor, {
 *    pathPrefix: 'system.attributes.hp'
 * });
 * ```
 *
 * Returned paths remain absolute. The prefix itself is included when it stores a mapped value and satisfies the
 * iterator operation.
 *
 * `stopAt` includes a selected path when it stores a value, but prunes every stored descendant beneath it:
 *
 * @example
 * ```ts
 * fields.matchingEntries(actor, {
 *    pathPrefix: 'system.attributes',
 *    stopAt: 'system.attributes.hp'
 * });
 * ```
 *
 * When both options are supplied, `stopAt` must equal or descend from `pathPrefix`.
 *
 * `maxDepth` is measured relative to `pathPrefix`, or relative to the trie root when no prefix is supplied.
 *
 * ## Candidate-independent subtree traversal
 *
 * Subtree iterators traverse stored entries without accessing a candidate object:
 *
 * @example
 * ```ts
 * for (const [path, field] of fields.subtreeEntries({
 *    pathPrefix: 'system.attributes.hp'
 * }))
 * {
 *    // Every yielded entry belongs to the stored HP subtree.
 * }
 * ```
 *
 * These iterators are useful for inspecting, processing, or removing logical groups of stored paths without scanning
 * unrelated branches. They share the same `pathPrefix`, `stopAt`, `maxDepth`, `maxResults`, and `maxVisits` controls
 * as matching traversal.
 *
 * Matching and subtree iterators use deterministic depth-first trie order rather than global insertion order.
 *
 * ## Key semantics
 *
 * Each path segment is stored in a native `Map<PropertyKey, ...>`:
 *
 * - Strings compare by value.
 * - Numbers compare with `Map` / SameValueZero semantics.
 * - Symbols compare by identity.
 * - Numeric and string segments remain distinct (`0` is not `'0'`).
 *
 * Stored canonical paths are copied and frozen once when first inserted. Overwriting an existing entry retains its
 * original insertion position and canonical path. Deleting and reinserting a path moves it to the end, matching normal
 * `Map` insertion-order behavior.
 *
 * ## Defensive limits
 *
 * Every instance applies configurable limits to stored path depth, terminal entries, allocated trie nodes, yielded
 * traversal results, and traversal visits. Storage limits are preflighted before mutation, so failed insertion cannot
 * leave a partial trie branch. Per-call `maxDepth`, `maxResults`, and `maxVisits` options may reduce, but never exceed,
 * the constructor traversal caps.
 *
 * Reaching `maxResults` ends an iterator normally after the configured number of results. Exceeding `maxVisits` throws
 * before another candidate property or trie node is processed during the iterative walk. Path normalization and fixed-
 * depth trie scope lookup are bounded separately by `maxPathDepth`. These limits do not measure the retained size of
 * mapped values or individual property keys.
 *
 * Candidate-object matching may invoke getters and proxy traps when descendant traversal or an explicitly requested
 * terminal property value requires a read. Exceptions from those operations are intentionally propagated.
 *
 * ## Complexity
 *
 * `get`, `has`, and `set` are `O(path length)`. `delete` is also `O(path length)` and prunes unused trie nodes.
 * Normal map iteration is `O(entry count)` and follows insertion order through a linked list of terminal entries.
 *
 * Trie-aware matching visits only reachable stored prefixes. An unavailable candidate prefix rejects every stored
 * descendant beneath it with one candidate-property check. Matching entry and value iterators may optionally include
 * the resolved candidate property value without performing a second path lookup.
 *
 * `pathPrefix` begins traversal directly at a selected stored trie node, while `stopAt` prunes one descendant branch
 * by node identity. Candidate-independent subtree iterators visit only terminal entries beneath the selected node.
 *
 * Mutation of the map while an iterator is active is intentionally unspecified.
 *
 * @category Property Path Collections
 *
 * @typeParam V - Stored value type.
 */
declare class PropertyPathMap<V> implements Iterable<[readonly PropertyKey[], V]> {
  #private;
  /**
   * Creates a new property path map and optionally initializes it from {@link PropertyPath} / value pairs.
   *
   * Later duplicate paths overwrite earlier values without changing the original insertion position. Resource limits
   * are validated before initial entries are inserted and apply to every subsequent operation.
   *
   * @param entries - Optional initial {@link PropertyPath} / value entries.
   *
   * @param options - Defensive storage and traversal limits.
   *
   * @param options.maxEntries - Maximum number of exact stored paths; default: `16384`.
   *
   * @param options.maxNodes - Maximum number of allocated non-root trie nodes; default: `65536`.
   *
   * @param options.maxPathDepth - Maximum number of property-key segments in any stored path; default: `64`.
   *
   * @param options.maxTraversalResults - Maximum results produced by one iterator unless reduced per call; default:
   *        `16384`.
   *
   * @param options.maxTraversalVisits - Maximum properties or trie nodes inspected by one iterator unless reduced per
   *        call; default: `65536`.
   *
   * @throws {TypeError} If a constructor option is not a non-negative safe integer.
   * @throws {RangeError} If an initial entry exceeds a configured storage limit.
   */
  constructor(entries?: Iterable<readonly [PropertyPath, V]> | null, options?: PropertyPathMap.Options.Constructor);
  /**
   * Number of exact property paths currently stored.
   */
  get size(): number;
  /**
   * Number of allocated non-root trie nodes.
   *
   * This value is maintained incrementally and may be used to monitor current trie resource consumption.
   */
  get nodeCount(): number;
  /**
   * Provides the standard object tag used by `Object.prototype.toString`.
   */
  get [Symbol.toStringTag](): string;
  /**
   * Removes every stored entry and releases the complete trie.
   *
   * This operation is `O(1)` with respect to explicit traversal; the prior structure becomes available for garbage
   * collection once no active iterator or external references remain.
   */
  clear(): void;
  /**
   * Deletes the value stored at an exact property path.
   *
   * Descendant entries do not count as a match. Deleting `['settings']` does not remove
   * `['settings', 'theme']`, and deleting a parentless path does not affect siblings.
   *
   * After removal, unused nodes are pruned from the terminal node toward the root. Pruning stops at the first node
   * that still stores a value or has another child.
   *
   * @param path - Dotted or exact property-key path.
   *
   * @returns `true` when an entry existed and was removed; otherwise `false`.
   *
   * @throws {TypeError} If `path` is not a valid {@link PropertyPath}.
   * @throws {RangeError} If the path exceeds the configured `maxPathDepth`.
   */
  delete(path: PropertyPath): boolean;
  /**
   * Returns an insertion-order iterator of `[path, value]` pairs.
   *
   * Paths are canonical frozen arrays owned by this map. `maxDepth` is measured from the trie root, `maxResults`
   * truncates the iterator normally, and `maxVisits` throws when exceeded. Yielded entries retain insertion order.
   *
   * @param options - Optional insertion-order traversal limits.
   *
   * @returns Entry iterator.
   *
   * @throws {TypeError} If a numeric traversal option is invalid.
   * @throws {RangeError} If `options.maxVisits` is exceeded.
   */
  entries(options?: PropertyPathMap.Options.Iteration): IterableIterator<[readonly PropertyKey[], V]>;
  /**
   * Invokes a callback once for every entry in insertion order.
   *
   * The callback arguments follow `Map.prototype.forEach`: value, key, then map. The key is the canonical readonly
   * property-key array associated with the stored entry. Unlike the explicit iterator methods, `forEach` always
   * visits the complete map, which is already bounded by the configured `maxEntries` storage limit.
   *
   * @param callback - Function invoked for each entry.
   *
   * @param thisArg - Optional callback `this` value.
   */
  forEach(callback: (value: V, key: readonly PropertyKey[], map: PropertyPathMap<V>) => void, thisArg?: unknown): void;
  /**
   * Retrieves the value stored at an exact structural path.
   *
   * `undefined` may mean either that the path is absent or that `undefined` is the stored value. Use {@link has} when
   * that distinction matters.
   *
   * @param path - Dotted or exact property-key path.
   *
   * @returns Stored value or `undefined` when the exact path is absent.
   *
   * @throws {TypeError} If `path` is not a valid {@link PropertyPath}.
   * @throws {RangeError} If the path exceeds the configured `maxPathDepth`.
   */
  get(path: PropertyPath): V | undefined;
  /**
   * Determines whether a value is stored at an exact structural path.
   *
   * Descendant paths do not cause a prefix to be reported as present.
   *
   * @param path - Dotted or exact property-key path.
   *
   * @returns Whether the exact path stores a value.
   *
   * @throws {TypeError} If `path` is not a valid {@link PropertyPath}.
   * @throws {RangeError} If the path exceeds the configured `maxPathDepth`.
   */
  has(path: PropertyPath): boolean;
  /**
   * Returns the default insertion-order iterator of `[path, value]` pairs.
   *
   * Constructor-level traversal result and visit caps apply. Use {@link entries} when per-call limits are required.
   */
  [Symbol.iterator](): IterableIterator<[readonly PropertyKey[], V]>;
  /**
   * Returns an insertion-order iterator of canonical property-key paths.
   *
   * `maxDepth` is measured from the trie root, `maxResults` truncates normally, and `maxVisits` throws when exceeded.
   *
   * @param options - Optional insertion-order traversal limits.
   *
   * @returns Key iterator.
   *
   * @throws {TypeError} If a numeric traversal option is invalid.
   * @throws {RangeError} If `options.maxVisits` is exceeded.
   */
  keys(options?: PropertyPathMap.Options.Iteration): IterableIterator<readonly PropertyKey[]>;
  /**
   * Yields stored entries whose complete paths are available in a candidate value.
   *
   * Matching traverses the property-key trie directly instead of resolving every stored path independently. Once a
   * candidate prefix is missing or cannot be traversed, every stored descendant below that prefix is rejected without
   * additional property access. Shared prefixes are therefore checked and read at most once per matching operation.
   *
   * Set `pathPrefix` to begin matching at one absolute stored path and ignore every unrelated trie branch. The prefix
   * itself is yielded when it stores an entry and exists in the candidate object. Set `stopAt` to match one absolute
   * path normally while pruning every stored descendant beneath it. Returned paths always remain absolute.
   *
   * A terminal property is considered available when it exists, even when its value is `undefined` or `null`. By
   * default, terminal-only properties are not read, avoiding unnecessary getter and proxy `get` trap invocation. Set
   * `includePropertyValue` to `true` to append the resolved candidate property value to each yielded tuple.
   *
   * Array matching follows the same rules as the package property-path utilities: numeric indexes must be numbers in
   * the ECMAScript array-index range, while symbol properties remain valid. String array indexes such as `'0'` are
   * rejected. Ordinary objects retain normal JavaScript key coercion semantics.
   *
   * Circular candidate values are safe because traversal is bounded by the finite depth of the stored trie; no cycle
   * tracking is required.
   *
   * Matching uses depth-first trie order, with sibling branches following the order in which their first trie nodes
   * were created. This order is deterministic for an unchanged map but is not the map's global insertion order.
   * `maxDepth` is relative to `pathPrefix`, or to the trie root when no prefix is supplied. `maxResults` truncates
   * normally, while `maxVisits` throws before another candidate property or trie node is processed.
   *
   * @param data - Candidate object or function to inspect. Non-traversable values produce an empty iterator.
   *
   * @param options - Matching options.
   *
   * @returns Iterator of canonical stored paths and their associated mapped values, optionally followed by the
   *          resolved candidate property value.
   *
   * @throws {TypeError} If a boolean, numeric limit, or path option is invalid.
   * @throws {RangeError} If a path bound exceeds configured limits, `options.stopAt` is outside
   *          `options.pathPrefix`, or `options.maxVisits` is exceeded.
   */
  matchingEntries(
    data: unknown,
    options: PropertyPathMap.Options.Match & {
      includePropertyValue: true;
    },
  ): IterableIterator<[readonly PropertyKey[], V, unknown]>;
  matchingEntries(
    data: unknown,
    options?: PropertyPathMap.Options.Match & {
      includePropertyValue?: false;
    },
  ): IterableIterator<[readonly PropertyKey[], V]>;
  matchingEntries(
    data: unknown,
    options?: PropertyPathMap.Options.Match,
  ): IterableIterator<[readonly PropertyKey[], V] | [readonly PropertyKey[], V, unknown]>;
  /**
   * Yields canonical stored paths whose complete paths are available in a candidate value.
   *
   * This is a path-only projection of {@link matchingEntries} and uses the same trie-aware pruning, prefix / stop
   * bounds, property semantics, and depth-first trie order. Candidate terminal values are never requested solely for
   * this iterator; properties are read only when descendant traversal requires them.
   *
   * @param data - Candidate object or function to inspect.
   *
   * @param options - Path-only matching options.
   *
   * @returns Iterator of matching canonical property-key paths.
   *
   * @throws {TypeError} If a boolean, numeric limit, or path option is invalid.
   * @throws {RangeError} If path bounds exceed configured limits or `options.maxVisits` is exceeded.
   */
  matchingKeys(data: unknown, options?: PropertyPathMap.Options.MatchKeys): IterableIterator<readonly PropertyKey[]>;
  /**
   * Yields mapped values whose stored path paths are available in a candidate value.
   *
   * By default, this returns only each value stored in the map. Set `includePropertyValue` to `true` to return
   * `[mappedValue, propertyValue]` tuples, where `propertyValue` is resolved from the candidate data object at the
   * matching property path. Prefix and stop bounds follow the semantics documented by {@link matchingEntries}.
   *
   * @param data - Candidate object or function to inspect.
   *
   * @param options - Matching options.
   *
   * @returns Iterator of mapped values or mapped-value / candidate-property-value tuples.
   *
   * @throws {TypeError} If a boolean, numeric limit, or path option is invalid.
   * @throws {RangeError} If path bounds exceed configured limits or `options.maxVisits` is exceeded.
   */
  matchingValues(
    data: unknown,
    options: PropertyPathMap.Options.Match & {
      includePropertyValue: true;
    },
  ): IterableIterator<[V, unknown]>;
  matchingValues(
    data: unknown,
    options?: PropertyPathMap.Options.Match & {
      includePropertyValue?: false;
    },
  ): IterableIterator<V>;
  matchingValues(data: unknown, options?: PropertyPathMap.Options.Match): IterableIterator<V | [V, unknown]>;
  /**
   * Stores a value at an exact structural path.
   *
   * Existing trie nodes are inspected first so path depth, entry count, and node count limits can be validated before
   * any mutation occurs. Overwriting an existing path updates only its value, preserving size and insertion order.
   * A new entry copies and freezes its normalized path once for stable iteration.
   *
   * @param path - Dotted or exact property-key path.
   *
   * @param value - Value to store. `undefined` is valid.
   *
   * @returns This map.
   *
   * @throws {TypeError} If `path` is not a valid {@link PropertyPath}.
   * @throws {RangeError} If the path depth, entry count, or trie node count limit would be exceeded.
   */
  set(path: PropertyPath, value: V): this;
  /**
   * Yields stored entries from one trie subtree without inspecting a candidate data object.
   *
   * `pathPrefix` selects the absolute trie node where traversal begins. The prefix entry is included when the exact
   * path stores a value, even when it has no descendants. A missing stored prefix produces an empty iterator.
   * `stopAt` includes its own entry when present and prunes all descendants beneath that node.
   *
   * Subtree traversal uses deterministic depth-first trie order rather than global insertion order. Returned
   * canonical paths remain absolute and are reused from their stored entries. `maxDepth` is relative to `pathPrefix`,
   * or to the trie root when no prefix is supplied. `maxResults` truncates normally, while `maxVisits` throws.
   *
   * @param options - Subtree bounds.
   *
   * @returns Iterator of canonical stored paths and mapped values.
   *
   * @throws {TypeError} If a numeric limit or path option is invalid.
   * @throws {RangeError} If path bounds exceed configured limits or `options.maxVisits` is exceeded.
   */
  subtreeEntries(options?: PropertyPathMap.Options.Subtree): IterableIterator<[readonly PropertyKey[], V]>;
  /**
   * Yields canonical stored paths from one trie subtree.
   *
   * This is a path-only projection of {@link subtreeEntries}. It performs no candidate object access and allocates no
   * temporary entry tuples.
   *
   * @param options - Subtree bounds.
   *
   * @returns Iterator of canonical stored property-key paths.
   *
   * @throws {TypeError} If a numeric limit or path option is invalid.
   * @throws {RangeError} If path bounds exceed configured limits or `options.maxVisits` is exceeded.
   */
  subtreeKeys(options?: PropertyPathMap.Options.Subtree): IterableIterator<readonly PropertyKey[]>;
  /**
   * Yields mapped values from one trie subtree.
   *
   * This is a value-only projection of {@link subtreeEntries}. It performs no candidate object access and allocates no
   * temporary entry tuples.
   *
   * @param options - Subtree bounds.
   *
   * @returns Iterator of mapped values.
   *
   * @throws {TypeError} If a numeric limit or path option is invalid.
   * @throws {RangeError} If path bounds exceed configured limits or `options.maxVisits` is exceeded.
   */
  subtreeValues(options?: PropertyPathMap.Options.Subtree): IterableIterator<V>;
  /**
   * Returns an insertion-order iterator of stored values.
   *
   * `maxDepth` is measured from the trie root, `maxResults` truncates normally, and `maxVisits` throws when exceeded.
   *
   * @param options - Optional insertion-order traversal limits.
   *
   * @returns Value iterator.
   *
   * @throws {TypeError} If a numeric traversal option is invalid.
   * @throws {RangeError} If `options.maxVisits` is exceeded.
   */
  values(options?: PropertyPathMap.Options.Iteration): IterableIterator<V>;
}
/**
 * Defines configuration options for {@link PropertyPathMap}.
 *
 * @category Property Path Collections
 */
declare namespace PropertyPathMap {
  /**
   * Defines configuration options for {@link PropertyPathMap}.
   */
  namespace Options {
    /**
     * Constructor-level defensive limits applied to storage and every iterator.
     */
    interface Constructor {
      /**
       * Maximum number of exact stored paths. Overwriting an existing path does not consume another entry.
       *
       * @default 16384
       */
      maxEntries?: number;
      /**
       * Maximum number of allocated non-root trie nodes. Shared path prefixes consume one node per unique segment.
       *
       * @default 65536
       */
      maxNodes?: number;
      /**
       * Maximum number of property-key segments in a stored or queried path.
       *
       * @default 64
       */
      maxPathDepth?: number;
      /**
       * Maximum results produced by one iterator unless reduced per call. Reaching the limit truncates normally.
       *
       * @default 16384
       */
      maxTraversalResults?: number;
      /**
       * Maximum properties or trie nodes processed during iterator traversal unless reduced per call. Exceeding the limit
       * throws a `RangeError`.
       *
       * @default 65536
       */
      maxTraversalVisits?: number;
    }
    /**
     * Limits for insertion-order entries, keys, and values iterators.
     */
    interface Iteration extends PropertyPathTraversalLimits {}
    /**
     * Common absolute trie bounds and defensive limits shared by matching and subtree iterators.
     */
    interface Common extends PropertyPathTraversalLimits {
      /** Absolute stored path selecting the trie subtree where traversal begins. */
      pathPrefix?: PropertyPath;
      /** Absolute stored path whose entry is included while every descendant beneath it is pruned. */
      stopAt?: PropertyPath;
    }
    /**
     * Options shared by every candidate-object matching iterator.
     */
    interface MatchCommon extends Common {
      /**
       * When `true`, every path segment must be an own property of the candidate value reached at that depth.
       *
       * @default false
       */
      hasOwnOnly?: boolean;
    }
    /** Options for matching path iteration. */
    interface MatchKeys extends MatchCommon {}
    /** Options for matching entry and mapped-value iteration. */
    interface Match extends MatchCommon {
      /** Whether matching entries / values also include the property value resolved from candidate data. */
      includePropertyValue?: boolean;
    }
    /** Options for candidate-independent subtree iteration. */
    interface Subtree extends Common {}
  }
}

/**
 * Associates structural {@link PropertyPath} paths with values beneath weakly held root objects.
 *
 * Each root is stored as a key in an internal `WeakMap`, and each root value is a trie-based
 * {@link PropertyPathMap}. This provides structural path lookup while allowing the root and its complete path map to
 * become eligible for garbage collection when the root is no longer referenced elsewhere.
 *
 * @example
 * ```ts
 * const maps = new WeakPropertyPathMap<object, DataModel>();
 * const document = {};
 *
 * maps.set(document, ['system', 'attributes', 'hp'], hpModel);
 * maps.set(document, ['system', 'attributes', 'ac'], acModel);
 *
 * maps.get(document, ['system', 'attributes', 'hp']);
 * // hpModel
 * ```
 *
 * ## Weak collection constraints
 *
 * Like `WeakMap`, this collection cannot expose global `size`, `entries`, `keys`, `values`, or iteration because weak
 * roots are intentionally not enumerable. Every query requires a known root object. {@link clear} is supported by
 * replacing the internal `WeakMap` in constant time.
 *
 * ## Root and path semantics
 *
 * - Root keys must be non-null objects or functions.
 * - Property paths use all structural and symbol semantics provided by {@link PropertyPathMap}.
 * - Different roots may store identical paths without conflict.
 * - `undefined` is a valid stored value; use {@link has} to distinguish it from an absent path.
 * - Deleting the final path for a root also removes that root from the internal `WeakMap` immediately.
 *
 * ## Defensive limits
 *
 * The constructor accepts the same storage and traversal limits as {@link PropertyPathMap}. Limits apply independently
 * to each root trie, and a failed first insertion is validated before the root is retained. Aggregate limits across all
 * roots are intentionally unavailable because tracking weak roots globally would require strong retention and violate
 * weak-collection semantics.
 *
 * Matching and subtree iterators support `maxDepth`, `maxResults`, and `maxVisits` through the delegated
 * {@link PropertyPathMap} options. Candidate getters and proxy traps may execute when matching requires property reads;
 * their exceptions are intentionally propagated.
 *
 * ## Complexity
 *
 * Root lookup is expected `O(1)`. Path operations retain the `O(path length)` behavior of {@link PropertyPathMap}.
 * Trie-aware matching retains shared-prefix pruning and visits only candidate branches reachable from stored paths.
 * Matching entry and value iterators may optionally include the property value resolved from the candidate object.
 * Prefix-bounded matching and candidate-independent subtree iteration retain the corresponding behavior of
 * {@link PropertyPathMap}.
 *
 * @category Property Path Collections
 *
 * @typeParam R - Weak root object type.
 * @typeParam V - Stored value type.
 */
declare class WeakPropertyPathMap<R extends object, V> {
  #private;
  /**
   * Creates a weak property-path map with limits applied independently to every live root trie.
   *
   * Because weak roots are not enumerable, aggregate limits across all live roots cannot be tracked without retaining
   * those roots strongly. Constructor limits therefore apply per root while preserving normal weak-key collection
   * semantics.
   *
   * @param options - Per-root storage and traversal limits accepted by {@link PropertyPathMap}.
   *
   * @throws {TypeError} If `options` is invalid or a limit is not a non-negative safe integer.
   */
  constructor(options?: PropertyPathMap.Options.Constructor);
  /**
   * Provides the standard object tag used by `Object.prototype.toString`.
   */
  get [Symbol.toStringTag](): string;
  /**
   * Removes every root association in constant time.
   *
   * The prior `WeakMap` and all path tries reachable only through it become eligible for garbage collection. Any
   * iterator already returned by a matching or subtree method retains its direct reference to the corresponding path
   * trie and may continue independently.
   */
  clear(): void;
  /**
   * Deletes one exact property path beneath a root.
   *
   * If the removed path was the final entry beneath the root, the now-empty per-root trie is removed from the
   * internal `WeakMap`. Missing roots and missing exact paths return `false`.
   *
   * @param root - Weak root object or function.
   *
   * @param path - Dotted or exact property-key path.
   *
   * @returns `true` when an exact path existed and was removed; otherwise `false`.
   *
   * @throws {TypeError} If `root` is not a non-null object or function.
   * @throws {TypeError} If `path` is not a valid {@link PropertyPath}.
   * @throws {RangeError} If the path exceeds the configured per-root `maxPathDepth`.
   */
  delete(root: R, path: PropertyPath): boolean;
  /**
   * Removes every path association beneath one known root.
   *
   * @param root - Weak root object or function.
   *
   * @returns `true` when the root had an associated path trie; otherwise `false`.
   *
   * @throws {TypeError} If `root` is not a non-null object or function.
   */
  deleteRoot(root: R): boolean;
  /**
   * Retrieves the value stored at an exact structural path beneath a root.
   *
   * `undefined` may mean either that the root / path is absent or that `undefined` is the stored value. Use
   * {@link has} when that distinction matters.
   *
   * @param root - Weak root object or function.
   *
   * @param path - Dotted or exact property-key path.
   *
   * @returns Stored value or `undefined` when the root or exact path is absent.
   *
   * @throws {TypeError} If `root` is not a non-null object or function.
   * @throws {TypeError} If `path` is not a valid {@link PropertyPath}.
   * @throws {RangeError} If the path exceeds the configured per-root `maxPathDepth`.
   */
  get(root: R, path: PropertyPath): V | undefined;
  /**
   * Determines whether an exact path stores a value beneath a root.
   *
   * @param root - Weak root object or function.
   *
   * @param path - Dotted or exact property-key path.
   *
   * @returns Whether the root exists and the exact path stores a value.
   *
   * @throws {TypeError} If `root` is not a non-null object or function.
   * @throws {TypeError} If `path` is not a valid {@link PropertyPath}.
   * @throws {RangeError} If the path exceeds the configured per-root `maxPathDepth`.
   */
  has(root: R, path: PropertyPath): boolean;
  /**
   * Determines whether a root currently has at least one associated path.
   *
   * Roots whose final path is deleted are removed eagerly, so a `true` result always indicates a non-empty
   * per-root trie.
   *
   * @param root - Weak root object or function.
   *
   * @returns Whether the root currently owns a path trie.
   *
   * @throws {TypeError} If `root` is not a non-null object or function.
   */
  hasRoot(root: R): boolean;
  /**
   * Returns a trie-aware iterator of matching entries for one root.
   *
   * Matching behavior, prefix pruning, `pathPrefix` / `stopAt` bounds, `maxDepth`, result / visit budgets,
   * array-index rules, inherited-property handling, optional candidate property values, and iteration order are
   * delegated directly to {@link PropertyPathMap.matchingEntries}. A missing root behaves as an empty configured trie
   * while still validating matching options during iterator consumption.
   *
   * @param root - Weak root object or function identifying the stored path trie.
   *
   * @param data - Candidate object or function to match against stored paths.
   *
   * @param options - Matching options.
   *
   * @returns Iterator of canonical matching paths, mapped values, and optionally resolved candidate property values.
   *
   * @throws {TypeError} If `root`, a boolean, numeric limit, or path option is invalid.
   * @throws {RangeError} If path bounds exceed configured limits or `options.maxVisits` is exceeded.
   */
  matchingEntries(
    root: R,
    data: unknown,
    options: PropertyPathMap.Options.Match & {
      includePropertyValue: true;
    },
  ): IterableIterator<[readonly PropertyKey[], V, unknown]>;
  matchingEntries(
    root: R,
    data: unknown,
    options?: PropertyPathMap.Options.Match & {
      includePropertyValue?: false;
    },
  ): IterableIterator<[readonly PropertyKey[], V]>;
  matchingEntries(
    root: R,
    data: unknown,
    options?: PropertyPathMap.Options.Match,
  ): IterableIterator<[readonly PropertyKey[], V] | [readonly PropertyKey[], V, unknown]>;
  /**
   * Returns a trie-aware iterator of canonical matching paths for one root.
   *
   * This delegates to {@link PropertyPathMap.matchingKeys}; see {@link matchingEntries} for complete matching,
   * path-bound, and stop-bound semantics. A missing root produces an empty iterator while retaining option validation.
   *
   * @param root - Weak root object or function identifying the stored path trie.
   *
   * @param data - Candidate object or function to match against stored paths.
   *
   * @param options - Path-only matching options.
   *
   * @returns Iterator of canonical matching property paths.
   *
   * @throws {TypeError} If `root`, a boolean, numeric limit, or path option is invalid.
   * @throws {RangeError} If path bounds exceed configured limits or `options.maxVisits` is exceeded.
   */
  matchingKeys(
    root: R,
    data: unknown,
    options?: PropertyPathMap.Options.MatchKeys,
  ): IterableIterator<readonly PropertyKey[]>;
  /**
   * Returns a trie-aware iterator of mapped values whose paths match a candidate value for one root.
   *
   * By default, mapped values are yielded directly. Set `includePropertyValue` to `true` to receive
   * `[mappedValue, propertyValue]` tuples. Prefix and stop bounds are delegated to
   * {@link PropertyPathMap.matchingValues}. A missing root produces an empty iterator while retaining normal option
   * validation.
   *
   * @param root - Weak root object or function identifying the stored path trie.
   *
   * @param data - Candidate object or function to match against stored paths.
   *
   * @param options - Matching options.
   *
   * @returns Iterator of mapped values or mapped-value / candidate-property-value tuples.
   *
   * @throws {TypeError} If `root`, a boolean, numeric limit, or path option is invalid.
   * @throws {RangeError} If path bounds exceed configured limits or `options.maxVisits` is exceeded.
   */
  matchingValues(
    root: R,
    data: unknown,
    options: PropertyPathMap.Options.Match & {
      includePropertyValue: true;
    },
  ): IterableIterator<[V, unknown]>;
  matchingValues(
    root: R,
    data: unknown,
    options?: PropertyPathMap.Options.Match & {
      includePropertyValue?: false;
    },
  ): IterableIterator<V>;
  matchingValues(root: R, data: unknown, options?: PropertyPathMap.Options.Match): IterableIterator<V | [V, unknown]>;
  /**
   * Stores a value at an exact structural path beneath a weak root.
   *
   * The per-root trie is created lazily on the first successful insertion. Invalid paths therefore cannot leave
   * an empty root association behind. Existing roots reuse their current trie and retain all normal
   * {@link PropertyPathMap.set} overwrite and insertion-order semantics.
   *
   * @param root - Weak root object or function.
   *
   * @param path - Dotted or exact property-key path.
   *
   * @param value - Value to store. `undefined` is valid.
   *
   * @returns This weak map.
   *
   * @throws {TypeError} If `root` is not a non-null object or function.
   * @throws {TypeError} If `path` is not a valid {@link PropertyPath}.
   * @throws {RangeError} If the per-root path depth, entry count, or trie node count limit would be exceeded.
   */
  set(root: R, path: PropertyPath, value: V): this;
  /**
   * Returns a bounded subtree entry iterator for one weak root.
   *
   * Candidate-independent subtree behavior, absolute `pathPrefix` selection, descendant pruning through `stopAt`,
   * relative `maxDepth`, result / visit budgets, and deterministic trie order are delegated to
   * {@link PropertyPathMap.subtreeEntries}. A missing root behaves as an empty configured trie while still validating
   * all options during iterator consumption.
   *
   * @param root - Weak root object or function identifying the stored path trie.
   *
   * @param options - Subtree bounds.
   *
   * @returns Iterator of canonical stored paths and mapped values.
   *
   * @throws {TypeError} If `root`, a numeric limit, or path option is invalid.
   * @throws {RangeError} If path bounds exceed configured limits or `options.maxVisits` is exceeded.
   */
  subtreeEntries(root: R, options?: PropertyPathMap.Options.Subtree): IterableIterator<[readonly PropertyKey[], V]>;
  /**
   * Returns a bounded subtree key iterator for one weak root.
   *
   * This delegates to {@link PropertyPathMap.subtreeKeys}. A missing root produces an empty iterator while retaining
   * normal option validation.
   *
   * @param root - Weak root object or function identifying the stored path trie.
   *
   * @param options - Subtree bounds.
   *
   * @returns Iterator of canonical stored property paths.
   *
   * @throws {TypeError} If `root`, a numeric limit, or path option is invalid.
   * @throws {RangeError} If path bounds exceed configured limits or `options.maxVisits` is exceeded.
   */
  subtreeKeys(root: R, options?: PropertyPathMap.Options.Subtree): IterableIterator<readonly PropertyKey[]>;
  /**
   * Returns a bounded subtree value iterator for one weak root.
   *
   * This delegates to {@link PropertyPathMap.subtreeValues}. A missing root produces an empty iterator while retaining
   * normal option validation.
   *
   * @param root - Weak root object or function identifying the stored path trie.
   *
   * @param options - Subtree bounds.
   *
   * @returns Iterator of mapped values.
   *
   * @throws {TypeError} If `root`, a numeric limit, or path option is invalid.
   * @throws {RangeError} If path bounds exceed configured limits or `options.maxVisits` is exceeded.
   */
  subtreeValues(root: R, options?: PropertyPathMap.Options.Subtree): IterableIterator<V>;
}

/**
 * Asserts that a value is a non-null object, including arrays.
 *
 * Unlike {@link isNonNullObject}, this function preserves the **existing** static type of the variable while removing
 * nullish, primitive, function, and class-constructor union members.
 *
 * This assertion accepts arrays, ordinary objects, class instances, boxed primitives, and specialized built-in
 * objects such as `Date`, `Map`, and `Set`.
 *
 * Use this function when:
 * ```
 *   - You expect a non-null object at runtime, including an array, **and**
 *   - You want to keep its compile-time type intact after validation.
 * ```
 *
 * @example
 * function process(value: string[] | (() => void) | undefined): void
 * {
 *    assertNonNullObject(value);
 *
 *    value.push('entry');
 *    // `value` is narrowed to `string[]`.
 * }
 *
 * @category Object Validation
 *
 * @param value - The value to validate.
 *
 * @param errorMsg - Optional message used for the thrown TypeError.
 *
 * @throws {TypeError} if the value is null, primitive, or callable.
 */
declare function assertNonNullObject<T>(value: T, errorMsg?: string): asserts value is NonNullObject<T>;
/**
 * Asserts that a value is an object, not null, and not an array.
 *
 * Unlike {@link isObject}, this function does **not** narrow the value to a generic indexable structure. Instead, it
 * preserves the **existing** static type of the variable. This makes it ideal for validating option objects or
 * interface-based inputs where all properties may be optional.
 *
 * Use this function when:
 * ```
 *   - You expect a value to be an object at runtime, **and**
 *   - You want to keep its compile-time type intact after validation.
 * ```
 *
 * @example
 * interface Options { flag?: boolean; value?: number; }
 *
 * function run(opts: Options = {}) {
 *   assertObject(opts, `'opts' is not an object.`);  // `opts` remains `Options`, not widened or reduced.
 *   opts.value;                                      // Fully typed access remains available.
 * }
 *
 * @category Object Validation
 *
 * @param value - The value to validate.
 *
 * @param errorMsg - Optional message used for the thrown TypeError.
 *
 * @throws {TypeError} if the value is null, non-object, or an array.
 */
declare function assertObject<T>(value: T, errorMsg?: string): asserts value is T & object;
/**
 * Asserts that a value is a non-null object or function.
 *
 * Unlike {@link isObjectOrFunction}, this function does **not** narrow the value to a generic object type. Instead, it
 * preserves the **existing** static type of the variable while removing primitive and nullish union members.
 *
 * This assertion accepts all JavaScript reference values, including arrays, functions, class constructors, ordinary
 * objects, and specialized built-in objects.
 *
 * Use this function when:
 * ```
 *   - You expect a value to be an object or function at runtime, **and**
 *   - You want to keep its compile-time type intact after validation.
 * ```
 *
 * @example
 * function execute(value: Date | (() => void) | undefined): void
 * {
 *    assertIsObjectOrFunction(value);
 *
 *    // `value` is now `Date | (() => void)`.
 * }
 *
 * @category Object Validation
 *
 * @param value - The value to validate.
 *
 * @param errorMsg - Optional message used for the thrown TypeError.
 *
 * @throws {TypeError} if the value is null or a primitive value.
 */
declare function assertObjectOrFunction<T>(value: T, errorMsg?: string): asserts value is T & object;
/**
 * Asserts that a value is an ordinary object.
 *
 * Unlike {@link isOrdinaryObject}, this function preserves the **existing** static type of the variable rather than
 * narrowing it to a generic indexable structure. It accepts plain objects, custom-prototype objects, and ordinary
 * class instances, while rejecting arrays, functions, primitives, and specialized built-in objects.
 *
 * Use this function when:
 * ```
 *   - You expect a value to be an ordinary object at runtime, **and**
 *   - You want to keep its compile-time type intact after validation.
 * ```
 *
 * @example
 * class Options {
 *   flag?: boolean;
 *   value?: number;
 * }
 *
 * function run(opts: Options) {
 *   assertOrdinaryObject(opts, `'opts' is not an ordinary object.`);
 *   opts.value; // `opts` remains typed as `Options`.
 * }
 *
 * @category Object Validation
 *
 * @param value - The value to validate.
 *
 * @param errorMsg - Optional message used for the thrown TypeError.
 *
 * @throws {TypeError} if the value is not an ordinary object.
 */
declare function assertOrdinaryObject<T>(value: T, errorMsg?: string): asserts value is T & object;
/**
 * Asserts that a value is a plain object, not null, and not an array.
 *
 * Unlike {@link isPlainObject}, this function does **not** narrow the value to a generic indexable structure. Instead,
 * it preserves the **existing** static type of the variable. This makes it ideal for validating option objects or
 * interface-based inputs where all properties may be optional.
 *
 * Use this function when:
 * ```
 *   - You expect a value to be a plain object at runtime, **and**
 *   - You want to keep its compile-time type intact after validation.
 * ```
 *
 * @example
 * interface Options { flag?: boolean; value?: number; }
 *
 * function run(opts: Options = {}) {
 *   assertPlainObject(opts, `'opts' is not a plain object.`); // `opts` remains `Options`, not widened or reduced.
 *   opts.value;                                               // Fully typed access remains available.
 * }
 *
 * @category Object Validation
 *
 * @param value - The value to validate.
 *
 * @param errorMsg - Optional message used for the thrown TypeError.
 *
 * @throws {TypeError} if the value is null, non-object, or an array.
 */
declare function assertPlainObject<T>(value: T, errorMsg?: string): asserts value is T & object;
/**
 * Asserts that a value is a non-null, non-array object that can be treated as a string-keyed record.
 *
 * Unlike {@link isRecord}, this function does **not** narrow the value to a generic indexable structure. Instead,
 * it preserves the **existing** static type of the variable. This makes it ideal for validating option objects or
 * interface-based inputs where all properties may be optional.
 *
 * Use this function when:
 * ```
 *   - You need to reject `null`, primitives, or arrays at runtime.
 *   - You want to safely treat the value as a record, **without losing its compile-time shape**.
 * ```
 *
 * @example
 * interface Options { flag?: boolean; value?: number; }
 *
 * function run(opts: Options = {}) {
 *   assertPlainObject(opts, `'opts' is not a record object.`);   // `opts` remains `Options`, not widened or reduced.
 *   opts.value;                                                  // Fully typed access remains available.
 * }
 *
 * @category Object Validation
 *
 * @param value - The value to validate.
 *
 * @param errorMsg - Optional message used for the thrown TypeError.
 *
 * @throws {TypeError} if the value is null, non-object, or an array.
 */
declare function assertRecord<T>(value: T, errorMsg?: string): asserts value is T & Record<PropertyKey, unknown>;
/**
 * Concatenates one or more property paths into a newly allocated exact property-key path.
 *
 * Every path is normalized before concatenation. Dotted strings therefore contribute one segment per delimiter,
 * while array property-keys preserve numbers, symbols, empty-string keys, and literal periods exactly. The returned
 * array is independent of every input array and may be retained or modified by the caller without affecting those
 * inputs.
 *
 * @example
 * ```ts
 * concatPropertyPath('actor.system', ['attributes', 'hp'], 'value');
 * // ['actor', 'system', 'attributes', 'hp', 'value']
 * ```
 * @category Property Keys and Paths
 *
 * @param path - First path to concatenate.
 *
 * @param paths - Additional property paths appended in order.
 *
 * @returns A newly allocated exact property-key path.
 *
 * @throws {TypeError} If any argument is not a valid {@link PropertyPath} or no path is supplied at runtime.
 */
declare function concatPropertyPath(path: PropertyPath, ...paths: PropertyPath[]): readonly PropertyKey[];
/**
 * Freezes all traversed object and array values.
 *
 * @category Deep Object Operations
 *
 * @param data - An object or array.
 *
 * @param [options] - Options.
 *
 * @param [options.skipKeys] - A readonly set of property keys whose values are excluded from traversal. Numeric keys are
 *        normalized to their JavaScript string-key representation. A matching key is skipped regardless of where it
 *        appears in the object graph.
 *
 * @returns The frozen object.
 *
 * @typeParam T - Type of data.
 */
declare function deepFreeze<T extends object>(
  data: T,
  {
    skipKeys,
  }?: {
    skipKeys?: ReadonlySet<PropertyKey>;
  },
): T;
/**
 * Recursively deep merges all source objects into the target object in place. Like `Object.assign` if you provide `{}`
 * as the target a shallow copy is produced. If the target and source property are object literals they are merged.
 *
 * Note: The output type is inferred, but you may provide explicit generic types as well.
 *
 * @category Deep Object Operations
 *
 * @param target - Target object.
 *
 * @param sourceObj - One or more source objects.
 *
 * @returns Target object.
 */
declare function deepMerge<T extends object, U extends object>(target: T, sourceObj: U): DeepMerge<T, [U]>;
declare function deepMerge<T extends object, U extends object, V extends object>(
  target: T,
  sourceObj1: U,
  sourceObj2: V,
): DeepMerge<T, [U, V]>;
declare function deepMerge<T extends object, U extends object[]>(target: T, ...sourceObj: U): DeepMerge<T, U>;
/**
 * Seals all traversed object and array values.
 *
 * @category Deep Object Operations
 *
 * @param data - An object or array.
 *
 * @param [options] - Options.
 *
 * @param [options.skipKeys] - A readonly set of property keys whose values are excluded from traversal. Numeric keys
 *        are normalized to their JavaScript string-key representation. A matching key is skipped regardless of where it
 *        appears in the object graph.
 *
 * @returns The sealed object.
 *
 * @typeParam T - Type of data.
 */
declare function deepSeal<T extends object | []>(
  data: T,
  {
    skipKeys,
  }?: {
    skipKeys?: ReadonlySet<PropertyKey>;
  },
): T;
/**
 * Deletes the property resolved by a property path.
 *
 * By default, every path segment must be an own property. Set `hasOwnOnly` to `false` to permit inherited traversal;
 * when the final property is inherited, the property is deleted from the prototype object that owns it. This explicit
 * opt-in prevents accidental prototype mutation during ordinary use.
 *
 * Prototype-pollution keys (`__proto__`, `prototype`, and `constructor`) and ECMAScript well-known symbols are rejected
 * at every path segment, matching the mutation hardening applied by {@link safeSet}. Non-configurable properties are
 * not deleted.
 *
 * @category Property Mutation
 *
 * @param data - Object containing the property path.
 *
 * @param path - Dotted or exact property-key path.
 *
 * @param options - Deletion options.
 *
 * @param options.hasOwnOnly - Whether every path segment must be an own property; default: `true`.
 *
 * @returns Whether an existing configurable property was deleted.
 *
 * @throws {TypeError} If `options.hasOwnOnly` is not a boolean.
 */
declare function deleteProperty(
  data: object,
  path: PropertyPath,
  {
    hasOwnOnly,
  }?: {
    hasOwnOnly?: boolean;
  },
): boolean;
/**
 * Ensures that a value is a *non-empty async iterable*.
 * ```
 * - If the value is not async iterable, `undefined` is returned.
 * - If the async iterable yields no items, `undefined` is returned.
 * - If it yields at least one item, a fresh async iterable is returned which yields the first peeked item followed by
 * the rest, preserving behavior for one-shot async generators.
 * ```
 *
 * Supports both AsyncIterable<T> and (optionally) synchronous Iterable<T>.
 *
 * @category Iterable Utilities
 *
 * @param value - The value to test as an async iterable.
 *
 * @returns A non-empty async iterable, or `undefined`.
 */
declare function ensureNonEmptyAsyncIterable<T>(
  value: AsyncIterable<T> | Iterable<T> | null | undefined,
): Promise<AsyncIterable<T> | undefined>;
/**
 * Ensures that a given value is a *non-empty iterable*.
 * ```
 * - If the value is not iterable → returns `undefined`.
 * - If the value is an iterable but contains no entries → returns `undefined`.
 * - If the value is a non-empty iterable → returns a fresh iterable (generator) that yields the first peeked value
 * followed by the remaining values. This guarantees restartable iteration even when the original iterable is a
 * one-shot generator.
 * ```
 *
 * This function is ideal when you need a safe, non-empty iterable for iteration but cannot consume or trust the
 * original iterable’s internal iterator state.
 *
 * @example
 * const iter = ensureNonEmptyIterable(['a', 'b']);
 * // `iter` is an iterable yielding 'a', 'b'.
 *
 * const empty = ensureNonEmptyIterable([]);
 * // `undefined`
 *
 * const gen = ensureNonEmptyIterable((function*(){ yield 1; yield 2; })());
 * // Safe: returns an iterable yielding 1, 2 without consuming the generator.
 *
 * @category Iterable Utilities
 *
 * @param value - The value to inspect.
 *
 * @returns A restartable iterable containing all values, or `undefined` if the input was not iterable or contained no
 *          items.
 */
declare function ensureNonEmptyIterable<T>(value: Iterable<T> | null | undefined): Iterable<T> | undefined;
/**
 * Returns the value resolved by a property path while preserving present `undefined` and `null` values.
 *
 * Unlike {@link safeAccess}, this function returns a present nullish property unchanged. A missing or invalid path
 * returns `undefined`; use {@link hasProperty} when that result must be distinguished from a present `undefined`
 * property. Array indexes require numeric keys through an exact array property-key path.
 *
 * @category Property Access and Inspection
 *
 * @param data - Object to inspect.
 *
 * @param path - Dotted or exact property-key path.
 *
 * @param options - Property lookup options.
 *
 * @param options.hasOwnOnly - Whether every path segment must be an own property; default: `false`.
 *
 * @returns The resolved property value, or `undefined` when the path cannot be resolved.
 *
 * @throws {TypeError} If `options.hasOwnOnly` is not a boolean.
 *
 * @typeParam T - Root object type.
 * @typeParam P - Property path type.
 */
declare function getProperty<T extends object, const P extends PropertyPath>(
  data: T,
  path: P,
  {
    hasOwnOnly,
  }?: {
    hasOwnOnly?: boolean;
  },
): DeepAccess<T, P> | undefined;
/**
 * Returns the own property descriptor that defines the final segment of a property path.
 *
 * Intermediate values are read as necessary to continue traversal, but the final property value is not read. Getter
 * accessors at the terminal segment are therefore not invoked. When inherited lookup is enabled, the descriptor is
 * returned from the prototype object that owns the final property.
 *
 * @category Property Access and Inspection
 *
 * @param data - Object to inspect.
 *
 * @param path - Dotted or exact property-key path.
 *
 * @param options - Property lookup options.
 *
 * @param options.hasOwnOnly - Whether every path segment must be an own property; default: `false`.
 *
 * @returns The terminal property descriptor, or `undefined` when the path cannot be resolved.
 *
 * @throws {TypeError} If `options.hasOwnOnly` is not a boolean.
 */
declare function getPropertyDescriptor(
  data: object,
  path: PropertyPath,
  {
    hasOwnOnly,
  }?: {
    hasOwnOnly?: boolean;
  },
): PropertyDescriptor | undefined;
/**
 * Returns the object that owns the final property resolved by a property path.
 *
 * The owner may be the object reached directly by the parent path or one of its prototypes. Intermediate values are
 * read to continue traversal, but the final property value is not read. Set `hasOwnOnly` to `true` to require every
 * segment, including the terminal property, to be owned directly by the value reached at that depth.
 *
 * @category Property Access and Inspection
 *
 * @param data - Object to inspect.
 *
 * @param path - Dotted or exact property-key path.
 *
 * @param options - Property lookup options.
 *
 * @param options.hasOwnOnly - Whether every path segment must be an own property; default: `false`.
 *
 * @returns The terminal property owner, or `undefined` when the path cannot be resolved.
 *
 * @throws {TypeError} If `options.hasOwnOnly` is not a boolean.
 */
declare function getPropertyOwner(
  data: object,
  path: PropertyPath,
  {
    hasOwnOnly,
  }?: {
    hasOwnOnly?: boolean;
  },
): object | undefined;
/**
 * Determine if the given object has a getter & setter accessor.
 *
 * @category Accessors and Prototypes
 *
 * @param object - An object.
 *
 * @param accessor - Accessor to test.
 *
 * @returns Whether the given object has the getter and setter for accessor.
 *
 * @typeParam T - Type of data.
 * @typeParam K - Accessor key.
 */
declare function hasAccessor<T extends object, K extends keyof T>(
  object: T,
  accessor: K,
): object is T & {
  [P in K]: T[P];
};
/**
 * Determine if the given object has a getter accessor.
 *
 * @category Accessors and Prototypes
 *
 * @param object - An object.
 *
 * @param accessor - Accessor to test.
 *
 * @returns Whether the given object has the getter for accessor.
 *
 * @typeParam T - Type of data.
 * @typeParam K - Accessor key.
 */
declare function hasGetter<T extends object, K extends keyof T>(
  object: T,
  accessor: K,
): object is T & {
  [P in K]: T[P];
};
/**
 * Determines whether an property path exists on an object.
 *
 * Traversal aborts immediately when a property is missing, an intermediate value cannot be traversed, or an invalid
 * array index is encountered. Properties whose values are `undefined` or `null` are considered present. The terminal
 * property value is not read, so a getter at the final segment is not invoked merely to test existence.
 *
 * Array indexes may only be accessed by number through the array property-key form.
 *
 * @category Property Access and Inspection
 *
 * @param data - An object to inspect.
 *
 * @param path - A dotted string path or an array of exact string, number, or symbol property keys.
 *
 * @param options - Property lookup options.
 *
 * @param options.hasOwnOnly - Whether every path segment must be an own property; default: `false`.
 *
 * @returns Whether the complete property path exists.
 *
 * @throws {TypeError} If `options.hasOwnOnly` is not a boolean.
 */
declare function hasProperty(
  data: object,
  path: PropertyPath,
  {
    hasOwnOnly,
  }?: {
    hasOwnOnly?: boolean;
  },
): boolean;
/**
 * Returns whether the target is or has the given prototype walking up the prototype chain.
 *
 * @category Accessors and Prototypes
 *
 * @param target - Any target class / constructor function to test.
 *
 * @param Prototype - Class / constructor function to find.
 *
 * @returns Target matches prototype.
 *
 * @typeParam T - Prototype class / constructor.
 */
declare function hasPrototype<T extends new (...args: any[]) => any>(
  target: new (...args: any[]) => any,
  Prototype: T,
): target is T;
/**
 * Determine if the given object has a setter accessor.
 *
 * @category Accessors and Prototypes
 *
 * @param object - An object.
 *
 * @param accessor - Accessor to test.
 *
 * @returns Whether the given object has the setter for accessor.
 *
 * @typeParam T - Type of data.
 * @typeParam K - Accessor key.
 */
declare function hasSetter<T extends object, K extends keyof T>(
  object: T,
  accessor: K,
): object is T & {
  [P in K]: T[P];
};
/**
 * Returns whether a value is a valid ECMAScript array index.
 *
 * The maximum array index is `2^32 - 2`; `2^32 - 1` is reserved and does not update an array's `length`.
 *
 * @category Property Keys and Paths
 *
 * @param value - Candidate numeric property key.
 *
 * @returns Whether `value` is an integer in the ECMAScript array-index range.
 */
declare function isArrayIndex(value: unknown): value is number;
/**
 * Tests for whether an _object_ is async iterable.
 *
 * @category Iterable Utilities
 *
 * @param value - Any value.
 *
 * @returns Whether value is async iterable.
 */
declare function isAsyncIterable<T>(value: unknown): value is AsyncIterable<T>;
/**
 * Tests for whether an _object_ is iterable.
 *
 * Note: Excludes `strings` in iterable test even though they are technically iterable.
 *
 * @category Iterable Utilities
 *
 * @param value - Any value.
 *
 * @returns Whether object is iterable.
 */
declare function isIterable<T>(value: unknown): value is Iterable<T>;
/**
 * Determines whether a value is a {@link JSONPropertyPath}.
 *
 * A JSON property path is either:
 *
 * - A non-empty dotted string.
 * - A non-empty, dense array containing only strings and finite numbers.
 *
 * Symbol segments are rejected because symbols cannot be represented by JSON. Non-finite numbers are also rejected
 * because `JSON.stringify` converts `NaN`, `Infinity`, and `-Infinity` to `null`. Sparse arrays are rejected because
 * missing elements are likewise serialized as `null`.
 *
 * Numeric values do not need to be integers or valid array indexes. This function validates lossless JSON
 * representation only; array-index constraints remain dependent on the value traversed by a path-aware operation.
 *
 * `-0` is accepted because JSON normalizes it to `0`, which is equivalent under the package's property-key comparison
 * semantics.
 *
 * @example
 * ```ts
 * isJSONPropertyPath('actor.system.hp');       // true
 * isJSONPropertyPath(['actors', 0, 'name']);   // true
 * isJSONPropertyPath(['literal.period']);      // true
 *
 * isJSONPropertyPath([Symbol('metadata')]);    // false
 * isJSONPropertyPath(['actors', NaN]);         // false
 * isJSONPropertyPath(new Array(1));            // false
 * ```
 *
 * @category Property Keys and Paths
 *
 * @param value - Value to evaluate.
 *
 * @returns Whether the value is a non-empty property path that can be represented losslessly through ordinary JSON
 *          serialization.
 */
declare function isJSONPropertyPath(value: unknown): value is JSONPropertyPath;
/**
 * Determines whether a value is a non-null object, including arrays.
 *
 * This predicate accepts arrays, ordinary objects, class instances, boxed primitives, and specialized built-in
 * objects such as `Date`, `Map`, and `Set`. It rejects `null`, primitive values, functions, and class constructors.
 *
 * Unlike {@link isObject}, this function accepts arrays. Unlike {@link isObjectOrFunction}, it rejects functions and
 * class constructors.
 *
 * Known object types retain their existing static type. Mixed unions are narrowed to their non-null, non-callable
 * object members.
 *
 * @example
 * const value: string[] | (() => void) | undefined = [];
 *
 * if (isNonNullObject(value))
 * {
 *    value.push('entry');
 *    // `value` is narrowed to `string[]`.
 * }
 *
 * @category Object Validation
 *
 * @param value - The value to evaluate.
 *
 * @returns Whether the value has a runtime type of `object` and is not `null`.
 */
declare function isNonNullObject<T>(value: T): value is NonNullObject<T>;
declare function isObject<T extends object>(value: T): value is T;
/**
 * Runtime check for whether a value is an object:
 * ```
 * - typeof === 'object'
 * - not null
 * - not an array
 * ```
 *
 * This function performs **type narrowing**. If the check succeeds, TypeScript refines the type of `value` to `T`,
 * allowing known object types (interfaces, classes, mapped structures) to retain their original shape.
 *
 * Type Behavior:
 * - When called with a value that already has a specific object type (interface or shaped object), that type is
 *   preserved after narrowing. Property access remains fully typed.
 *
 * - When called with `unknown`, `any`, or an untyped object literal, `T` becomes `object`, ensuring only that a
 *   non-null object exists. No indexing or deep property inference is provided in this case.
 *
 * In other words:
 * ```
 * - Known object type   → remains that type (preferred behavior)
 * - Unknown / untyped   → narrows only to `object`
 * ```
 *
 * Use this when you want runtime object validation **and** want to preserve typing when a value is already known to be
 * a specific object type. If you instead need to **retain** the declared type regardless of narrowing, use
 * {@link assertObject}. If you need indexable key / value access use a dedicated record check such as
 * {@link isRecord} or {@link isPlainObject}.
 *
 * @category Object Validation
 *
 * @param value - Any value to check.
 *
 * @returns True if the value is a non-null object and not an array.
 */
declare function isObject(value: unknown): value is object;
declare function isObjectOrFunction<T extends object>(value: T): value is T;
/**
 * Determines whether a value is a non-null object or function.
 *
 * This predicate accepts all JavaScript reference values, including arrays, functions, class constructors, ordinary
 * objects, and specialized built-in objects such as `Date`, `Map`, and `Set`. It rejects `null` and all primitive
 * values.
 *
 * Unlike {@link isObject}, this function accepts arrays and functions.
 *
 * Known object and function types retain their existing static type. Values typed as `unknown` are narrowed to
 * `object`.
 *
 * @example
 * function execute(value: object | (() => void) | undefined): void
 * {
 *    if (!isObjectOrFunction(value)) { return; }
 *
 *    // `value` retains its object-compatible union members.
 * }
 *
 * @category Object Validation
 *
 * @param value - The value to evaluate.
 *
 * @returns Whether the value is a non-null object or function.
 */
declare function isObjectOrFunction(value: unknown): value is object;
declare function isOrdinaryObject<T extends object>(value: T): value is T;
/**
 * Runtime check for whether a value is an ordinary object:
 *
 * An ordinary object in this context is a non-null, non-callable object for which
 * `Object.prototype.toString.call(value)` returns `'[object Object]'`.
 *
 * This includes:
 *
 * - Object literals created with `{}`.
 * - Objects created with `new Object()`.
 * - Objects with a `null` prototype.
 * - Objects with a custom prototype.
 * - Instances of ordinary user-defined classes.
 *
 * This excludes:
 *
 * - Arrays.
 * - Functions and class constructors.
 * - Primitive and boxed primitive values.
 * - Specialized built-in objects such as `Date`, `RegExp`, `Map`, `Set`, `Promise`, `Error`, `ArrayBuffer`,
 *   `DataView`, and typed arrays.
 *
 * This predicate occupies the middle ground between the other object predicates:
 *
 * - {@link isObject} accepts the broader category of non-null, non-array objects, including specialized built-ins.
 * - {@link isRecord} accepts the same broad record-like category, but narrows the result for dictionary-style keyed
 *   access.
 * - `isOrdinaryObject` additionally requires the runtime string tag `'[object Object]'`. It accepts class instances
 *   and objects with custom prototypes, but rejects specialized built-ins.
 * - {@link isPlainObject} requires the prototype to be exactly `Object.prototype` or `null`. It therefore rejects
 *   class instances and objects with other custom prototypes.
 *
 * Unlike {@link isPlainObject}, this function does not inspect or restrict the object's prototype.
 *
 * @remarks
 * This is a tag-based classification and is not an implementation of the ECMAScript specification's internal
 * distinction between ordinary and exotic objects.
 *
 * The result of `Object.prototype.toString.call` can be influenced by `Symbol.toStringTag`. Consequently, an object
 * may opt out of this classification by supplying another tag, and a specialized object may present itself with the
 * tag `'Object'`.
 *
 * @example
 * ```ts
 * isOrdinaryObject({ value: 1 });             // true
 * isOrdinaryObject(Object.create(null));      // true
 *
 * class Configuration {}
 * isOrdinaryObject(new Configuration());      // true
 *
 * isOrdinaryObject(new Map());                // false
 * isOrdinaryObject(new Date());               // false
 * isOrdinaryObject([]);                       // false
 * ```
 *
 * @example
 * The distinction from {@link isPlainObject} concerns the prototype:
 *
 * ```ts
 * class Configuration {}
 *
 * const value = new Configuration();
 *
 * isOrdinaryObject(value); // true
 * isPlainObject(value);    // false
 * ```
 *
 * @example
 * `Symbol.toStringTag` can alter the result:
 *
 * ```ts
 * const value = {
 *    [Symbol.toStringTag]: 'Configuration'
 * };
 *
 * isOrdinaryObject(value); // false: '[object Configuration]'
 * ```
 *
 * @category Object Validation
 *
 * @param value - Any value to evaluate.
 *
 * @returns Whether `value` is a non-null object with the runtime string tag `'[object Object]'`.
 */
declare function isOrdinaryObject(value: unknown): value is Record<PropertyKey, unknown>;
declare function isPlainObject<T extends object>(value: T): value is T;
/**
 * Determines whether a value is a **plain** object.
 *
 * A plain object is one whose prototype is either:
 *   - `Object.prototype` (created via `{}` or `new Object()`)
 *   - `null` (created via `Object.create(null)`)
 *
 * This excludes arrays, functions, class instances, DOM objects, and any object with a custom prototype. In other
 * words, this function detects JSON-like dictionary objects rather than structural or callable object types.
 *
 * Type Behavior:
 * - If the input already has a known object type `T`, that type is preserved after narrowing.
 * - If the input is `unknown` or untyped the result narrows to `Record<PropertyKey, unknown>` allowing safe keyed
 * access.
 *
 * Useful when validating configuration objects, cloning or merging data, performing deep equality, or working with
 * structured JSON where non-plain / prototype values would be considered invalid.
 *
 * @example
 * const a = { x: 1 };
 * isPlainObject(a);   // true
 *
 * class Foo {}
 * isPlainObject(new Foo()); // false
 *
 * @example
 * let data: unknown = getValue();
 * if (isPlainObject(data)) {
 *   data.foo;         // ok — key is `unknown`, but structure is guaranteed.
 * }
 *
 * @category Object Validation
 *
 * @param value - Any value to evaluate.
 *
 * @returns True if the value is a plain object with no special prototype.
 */
declare function isPlainObject(value: unknown): value is Record<PropertyKey, unknown>;
/**
 * Determines whether a value is a JavaScript property key.
 *
 * Property keys are strings, numbers, or symbols. Numbers are accepted because exact property-key arrays preserve
 * numeric array indexes and ordinary JavaScript property access coerces numeric object keys as usual.
 *
 * @category Property Keys and Paths
 *
 * @param value - Candidate property key.
 *
 * @returns Whether `value` is a string, number, or symbol.
 */
declare function isPropertyKey(value: unknown): value is PropertyKey;
/**
 * Checks whether a value is a generic key / value object / `Record<string, unknown>`.
 *
 * A record in this context means:
 *   - `typeof value === 'object'`
 *   - value is not `null`
 *   - value is not an array
 *
 * Unlike {@link isObject}, this function does **not** attempt to preserve the original object type. All successful
 * results narrow to `Record<string, unknown>` making the returned value safe for key-indexed access but without any
 * knowledge of property names or expected value types.
 *
 * This is useful when processing untyped JSON-like data structures, dynamic configuration blocks, response bodies,
 * or any case where a dictionary-style object is expected rather than a typed interface value.
 *
 * Contrast With:
 * - {@link isObject} → preserves known object types where possible; use when typing should remain intact.
 * - {@link isPlainObject} → narrows to plain JSON objects only (no prototypes, no class instances).
 * - `isRecord()` → always narrows to a dictionary-style record for keyed lookup.
 *
 * @category Object Validation
 *
 * @param value - Any value to test.
 *
 * @returns True if the value is an object that is neither null nor an array.
 */
declare function isRecord(value: unknown): value is Record<string, unknown>;
/**
 * Determines whether a value is a valid property path.
 *
 * A valid path is either:
 *
 * - A non-empty dotted string.
 * - A non-empty readonly array containing only string, number, or symbol property keys.
 *
 * This function validates the property path representation only. Numeric array-index constraints are evaluated during
 * traversal because whether a numeric key is required depends on the value reached at runtime.
 *
 * @category Property Keys and Paths
 *
 * @param value - Value to validate.
 *
 * @returns Whether the value is a valid {@link PropertyPath}.
 */
declare function isPropertyPath(value: unknown): value is PropertyPath;
/**
 * Determines whether two property paths are structurally equivalent.
 *
 * Both paths are normalized before comparison, so an ordinary dotted path and its equivalent string-key array compare
 * as equal:
 *
 * @example
 * ```ts
 * isPropertyPathEqual('actor.system.name', ['actor', 'system', 'name']);
 * // true
 * ```
 *
 * Segment comparison follows native `Map` / SameValueZero semantics:
 *
 * - Strings compare by value.
 * - Numbers compare with SameValueZero semantics, so `0` equals `-0` and `NaN` equals `NaN`.
 * - Symbols compare by identity.
 * - Numeric and string segments remain distinct.
 *
 * Invalid property paths return `false` rather than throwing, matching predicate conventions.
 *
 * @see [SameValueZero - TC39](https://tc39.es/ecma262/multipage/abstract-operations.html#sec-samevaluezero)
 *
 * @category Property Keys and Paths
 *
 * @param pathA - First property path.
 * @param pathB - Second property path.
 *
 * @returns Whether both paths contain the same property-key segments in the same order.
 */
declare function isPropertyPathEqual(pathA: PropertyPath | undefined, pathB: PropertyPath | undefined): boolean;
/**
 * Determines whether one property path is an exact structural prefix of another.
 *
 * Both property paths are compared after normalization. Segment comparison follows native `Map` / SameValueZero
 * semantics: strings compare by value, symbols by identity, `0` equals `-0`, and numeric `NaN` segments compare as
 * equal. Numeric and string segments remain distinct.
 *
 * Invalid path values return `false` rather than throwing, matching predicate conventions.
 *
 * @category Property Keys and Paths
 *
 * @param prefix - Candidate prefix path.
 *
 * @param path - Complete path that must equal or descend from `prefix`.
 *
 * @returns Whether `prefix` is an exact structural prefix of `path`.
 */
declare function isPropertyPathPrefix(prefix: PropertyPath, path: PropertyPath): boolean;
/**
 * Converts a property path to an equivalent dotted string path when that conversion is lossless.
 *
 * Exact property-key arrays containing numbers, symbols, or string segments with literal periods cannot be represented
 * by dotted-string syntax without changing their property-path semantics and are rejected. Empty segments are retained,
 * so `['level1', '', 'value']` becomes `'level1..value'`. The exact single empty-string key `['']` is rejected because
 * an empty dotted string is not a valid {@link PropertyPath}.
 *
 * @category Property Keys and Paths
 *
 * @param path - Property path to convert.
 *
 * @returns An equivalent dotted string property path.
 *
 * @throws {TypeError} If `path` is invalid or cannot be represented losslessly as a dotted string property path.
 */
declare function joinPropertyPath(path: PropertyPath): string;
/**
 * Converts a property path to its canonical readonly property-key array representation.
 *
 * Dotted strings are split on `.` while property-key arrays are returned unchanged. Exact array property-keys should be
 * used for symbols, numeric array indexes, empty-string keys, and property names containing literal periods.
 *
 * @category Property Keys and Paths
 *
 * @param path - Property path to normalize.
 *
 * @param [errorMessage] - Optional custom error message.
 *
 * @returns The path as a readonly property-key array.
 *
 * @throws {TypeError} If `path` is not a valid {@link PropertyPath}.
 */
declare function normalizePropertyPath(path: PropertyPath, errorMessage?: string): readonly PropertyKey[];
/**
 * Safely returns keys on an object or an empty array if not an object.
 *
 * @category General Object Utilities
 *
 * @param object - An object.
 *
 * @returns Object keys or empty array.
 */
declare function objectKeys<T extends object>(object: T): (keyof T)[];
/**
 * Safely returns an objects size. Note for String objects Unicode is not taken into consideration.
 *
 * @category General Object Utilities
 *
 * @param object - Any value, but size returned for object / Map / Set / arrays / strings.
 *
 * @returns Size of object.
 */
declare function objectSize(object: any): number;
/**
 * Returns an iterator of property-key path arrays useful with {@link safeAccess} and {@link safeSet} by traversing
 * the given object. Enumerable string and symbol keys are included, and numeric array indexes may be enabled.
 *
 * Traversal may be bounded by absolute property paths relative to `data`. `prefixPath` selects one branch and keeps
 * all yielded paths absolute. `stopPath` yields the selected path itself and prunes every descendant beneath it.
 * `maxDepth` limits traversal relative to `prefixPath`, or relative to the root when no prefix is supplied. Properties
 * reached at the maximum depth are yielded as terminal paths and are not traversed further.
 *
 * `maxResults` limits the number of yielded paths. `maxVisits` limits the number of enumerable properties and array
 * indexes inspected; exceeding this budget throws before another property value is read. These limits reduce exposure
 * to unexpectedly broad objects, sparse arrays with extreme lengths, getters, and proxy traps. Exceptions raised by
 * getters or proxy operations are intentionally propagated.
 *
 * When both path bounds are supplied, `stopPath` must equal or descend from `prefixPath`. If `maxDepth` is also
 * supplied, traversal stops at whichever boundary is reached first.
 *
 * Note: Keys are only generated for ordinary objects and arrays; {@link Map} and {@link Set} are not indexed. Array
 * elements are treated as terminal paths even when their values are objects.
 *
 * @category Object Traversal and Comparison
 *
 * @param data - An object to traverse for property path keys.
 *
 * @param [options] - Traversal options.
 *
 * @param [options.arrayIndex] - Set to `true` to include numeric array indexes. Enumerable symbol properties on arrays
 *        remain included; default: `false`.
 *
 * @param [options.hasOwnOnly] - Set to `false` to include enumerable prototype properties; default: `true`.
 *
 * @param [options.maxDepth] - Maximum number of property-key segments traversed beneath `prefixPath`, or beneath the
 *        root when no prefix is supplied. A value of `0` yields only the prefix itself when selected; default:
 *        unlimited.
 *
 * @param [options.maxResults] - Maximum number of paths yielded; default: `16384`.
 *
 * @param [options.maxVisits] - Maximum number of enumerable properties or array indexes inspected; default: `65536`.
 *
 * @param [options.prefixPath] - Absolute property path selecting the branch where traversal begins. Returned paths
 *        remain absolute. A missing or non-enumerable prefix produces an empty iterator.
 *
 * @param [options.stopPath] - Absolute property path to yield as a terminal path while pruning all descendants beneath
 *        it. When `prefixPath` is supplied, this path must equal or descend from it.
 *
 * @returns An iterator of absolute readonly property-key paths.
 *
 * @throws {TypeError} If `data`, a boolean option, a numeric limit, or a property-path option is invalid.
 * @throws {RangeError} If `options.stopPath` is outside `options.prefixPath` or `options.maxVisits` is exceeded.
 */
declare function pathKeyIterator(
  data: object,
  options?: PathKeyIteratorOptions,
): IterableIterator<readonly PropertyKey[]>;
/**
 * Returns a validating iterator for either one {@link PropertyPath} or an iterable of property paths.
 *
 * A value satisfying {@link isPropertyPath} is always interpreted as one path before iterable detection occurs. This
 * precedence is necessary because dotted strings and exact property-key arrays are themselves iterable.
 *
 * Consequently, an array containing only property keys represents one exact path:
 *
 * @example
 * ```ts
 * [...propertyPathIterator(['actor', 'name'])];
 * // [
 * //    ['actor', 'name']
 * // ]
 * ```
 *
 * To supply multiple dotted-string paths, use an iterable that is not itself a valid property path, such as a `Set`:
 *
 * @example
 * ```ts
 * [...propertyPathIterator(new Set([
 *    'actor.name',
 *    'actor.id'
 * ]))];
 * // ['actor.name', 'actor.id']
 * ```
 *
 * An outer array of exact array paths is also unambiguous because its entries are arrays rather than property keys:
 *
 * @example
 * ```ts
 * [...propertyPathIterator([
 *    ['actor', 'name'],
 *    ['actor', 'id']
 * ])];
 * // [
 * //    ['actor', 'name'],
 * //    ['actor', 'id']
 * // ]
 * ```
 *
 * Iterable entries are validated lazily as iteration advances. An invalid entry throws when that entry is reached;
 * valid preceding entries may already have been yielded. An empty iterable produces an empty iterator.
 *
 * Paths are yielded unchanged. Exact array paths are not normalized, copied, or frozen.
 *
 * @category Property Keys and Paths
 *
 * @param paths - A single property path or an iterable containing property paths.
 *
 * @returns A validating iterator that yields each property path in source order.
 *
 * @throws {TypeError} During iteration if `paths` is neither a property path nor an iterable.
 * @throws {TypeError} During iteration if an iterable entry is not a valid property path.
 */
declare function propertyPathIterator(paths: PropertyPath | Iterable<PropertyPath>): IterableIterator<PropertyPath>;
/**
 * Provides a way to safely access an object's data / entries using either a dotted property path string or an array of
 * exact property keys.
 *
 * Array indexes may only be accessed by number through the array property-key form.
 *
 * @category Property Access and Inspection
 *
 * @param data - An object to access entry data.
 *
 * @param path - A dotted string property path or an array of exact string, number, or symbol property keys.
 *
 * @param [defaultValue] - (Optional) A default value to return if an entry for property path is not found.
 *
 * @returns The value referenced by the path.
 *
 * @typeParam T - Type of data.
 * @typeParam P - Property path type.
 * @typeParam R - Return value / Inferred deep access type or any provided default value type.
 */
declare function safeAccess<T extends object, const P extends PropertyPath, R = DeepAccess<T, P>>(
  data: T,
  path: P,
  defaultValue?: DeepAccess<T, P> extends undefined ? R : DeepAccess<T, P>,
): DeepAccess<T, P> extends undefined ? R : DeepAccess<T, P>;
/**
 * Compares a source object and values of entries against a target object. If the entries in the source object match
 * the target object then `true` is returned otherwise `false`. If either object is undefined or null then false
 * is returned.
 *
 * Note: The source and target should be ordinary objects or arrays; {@link Map} and {@link Set} entries are not
 * compared. Present properties whose values are `undefined` or `null` remain distinct from missing properties.
 * Comparison disables the normal {@link pathKeyIterator} result cap so a successful result is never based on a
 * silently truncated path set. The visit budget remains enforced to bound unexpectedly broad source objects.
 *
 * @category Object Traversal and Comparison
 *
 * @param source - Source object.
 *
 * @param target - Target object.
 *
 * @param [options] - Options.
 *
 * @param [options.arrayIndex] - Set to `true` to include equality testing for numeric array indexes; default: `false`.
 *
 * @param [options.hasOwnOnly] - Set to `false` to include enumerable prototype properties; default: `true`.
 *
 * @param [options.maxVisits] - Maximum number of enumerable source properties or array indexes inspected;
 *        default: `65536`.
 *
 * @returns True if equal.
 *
 * @throws {TypeError} If an option is invalid.
 * @throws {RangeError} If `options.maxVisits` is exceeded.
 */
declare function safeEqual<T extends object>(
  source: T,
  target: object,
  options?: {
    arrayIndex?: boolean;
    hasOwnOnly?: boolean;
    maxVisits?: number;
  },
): target is T;
/**
 * Provides a way to safely set an object's data / entries using either a dotted path string or an array of exact
 * property keys. Array indexes may only be accessed by number through the array property-key form.
 *
 * @category Property Mutation
 *
 * @param data - An object to access entry data.
 *
 * @param path - A dotted string path or an array of exact string, number, or symbol property keys.
 *
 * The string keys `__proto__`, `prototype`, and `constructor` are rejected to prevent prototype-pollution access
 * paths. ECMAScript well-known symbols, such as `Symbol.toStringTag`, `Symbol.iterator`, and `Symbol.toPrimitive`,
 * are also rejected because they modify built-in language protocols and object behavior. User-created symbols and
 * symbols from {@link Symbol.for} remain valid.
 *
 * @param value - A new value to set if an entry for path is found.
 *
 * @param [options] - Options.
 *
 * @param [options.operation] - Operation to perform including: `add`, `div`, `mult`, `set`, `set-undefined`, `sub`;
 *        default: `set`.
 *
 * @param [options.createMissing] - If `true` missing path entries will be created as objects automatically;
 *        default: `false`.
 *
 * @returns True if successful.
 */
declare function safeSet(
  data: object,
  path: PropertyPath,
  value: any,
  {
    operation,
    createMissing,
  }?: {
    operation?: 'add' | 'div' | 'mult' | 'set' | 'set-undefined' | 'sub';
    createMissing?: boolean;
  },
): boolean;
/**
 * Utility type for `safeAccess`. Infers compound string property paths and readonly tuple paths in object T.
 */
type DeepAccess<T, P extends PropertyPath> = P extends string
  ? P extends ''
    ? undefined
    : DeepAccessString<T, P>
  : P extends readonly PropertyKey[]
    ? DeepAccessArray<T, P>
    : undefined;
/**
 * Infers a dotted string path in object T. Primitive and array traversal is rejected, matching runtime behavior.
 */
type DeepAccessString<T, P extends string> = T extends object
  ? T extends readonly unknown[]
    ? undefined
    : P extends `${infer K}.${infer Rest}`
      ? K extends keyof T
        ? DeepAccessString<T[K], Rest>
        : undefined
      : P extends keyof T
        ? T[P]
        : undefined
  : undefined;
/**
 * Infers a readonly tuple path in object T. Array traversal accepts only numeric or symbol keys, matching runtime
 * behavior. Primitive traversal is rejected. A non-tuple path array returns `unknown`.
 */
type DeepAccessArray<T, P extends readonly PropertyKey[]> = number extends P['length']
  ? unknown
  : P extends readonly [infer K extends PropertyKey, ...infer Rest extends readonly PropertyKey[]]
    ? T extends object
      ? T extends readonly unknown[]
        ? K extends number | symbol
          ? K extends keyof T
            ? Rest extends readonly []
              ? T[K]
              : DeepAccessArray<T[K], Rest>
            : undefined
          : undefined
        : K extends keyof T
          ? Rest extends readonly []
            ? T[K]
            : DeepAccessArray<T[K], Rest>
          : undefined
      : undefined
    : undefined;
/**
 * Recursively merges multiple object types ensuring correct property resolution.
 *
 * This utility takes a target object `T` and applies a sequence of merges from `U` progressively combining their
 * properties while respecting key precedence. Later objects overwrite earlier ones, similar to `Object.assign`.
 *
 * @typeParam T - The base object type.
 * @typeParam U - A tuple of objects to be deeply merged with `T`.
 */
type DeepMerge<T extends object, U extends object[]> = U extends [infer First, ...infer Rest]
  ? DeepMerge<
      {
        [K in keyof (Omit<T, keyof First> & First)]: (Omit<T, keyof First> & First)[K];
      },
      Rest extends object[] ? Rest : []
    >
  : T;

/**
 * Unlike a "shallow copy" (eg, Object.assign), a "deep clone" recursively traverses a source input and copies its
 * values — instead of references to its values — into a new instance of that input. The result is a structurally
 * equivalent clone that operates independently of the original source and controls its own values.
 *
 * @category Deep Object Operations
 *
 * @see https://www.npmjs.com/package/klona
 */
declare function klona<T>(input: T): T;

export {
  PropertyPathMap,
  WeakPropertyPathMap,
  assertNonNullObject,
  assertObject,
  assertObjectOrFunction,
  assertOrdinaryObject,
  assertPlainObject,
  assertRecord,
  concatPropertyPath,
  deepFreeze,
  deepMerge,
  deepSeal,
  deleteProperty,
  ensureNonEmptyAsyncIterable,
  ensureNonEmptyIterable,
  getProperty,
  getPropertyDescriptor,
  getPropertyOwner,
  hasAccessor,
  hasGetter,
  hasProperty,
  hasPrototype,
  hasSetter,
  isArrayIndex,
  isAsyncIterable,
  isIterable,
  isJSONPropertyPath,
  isNonNullObject,
  isObject,
  isObjectOrFunction,
  isOrdinaryObject,
  isPlainObject,
  isPropertyKey,
  isPropertyPath,
  isPropertyPathEqual,
  isPropertyPathPrefix,
  isRecord,
  joinPropertyPath,
  klona,
  normalizePropertyPath,
  objectKeys,
  objectSize,
  pathKeyIterator,
  propertyPathIterator,
  safeAccess,
  safeEqual,
  safeSet,
};
export type {
  JSONPropertyPath,
  NonNullObject,
  PathKeyIteratorOptions,
  PropertyPath,
  PropertyPathTraversalLimits,
  ReadonlyDataProperties,
  ReadonlyDataPropertyKeys,
  ReadonlyProperties,
  ReadonlyPropertyKeys,
  WritableDataProperties,
  WritableDataPropertyKeys,
  WritableProperties,
  WritablePropertyKeys,
};
