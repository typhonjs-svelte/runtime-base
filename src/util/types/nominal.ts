declare const typeBrand: unique symbol;

/**
 * Adds compile-time nominal identity to a structurally typed value.
 *
 * @category Nominal Types
 *
 * @example
 * Distinguish values that share the same runtime representation.
 *
 * ```ts
 * type UserID = Brand<string, 'UserID'>;
 * type ProjectID = Brand<string, 'ProjectID'>;
 *
 * declare const userID: UserID;
 * declare const projectID: ProjectID;
 *
 * function loadUser(id: UserID): void
 * {
 *    // Load the user.
 * }
 *
 * loadUser(userID);
 *
 * // @ts-expect-error ProjectID is not assignable to UserID.
 * loadUser(projectID);
 * ```
 */
type Brand<T, Name extends PropertyKey> = T & { readonly [typeBrand]: Name; };

export { Brand };
