/**
 * Defines reusable / frozen implementation of {@link BasicAnimationState}.
 *
 * @type {({
 *    cancelled: import('#runtime/util/animate').BasicAnimationState,
 *    notCancelled: import('#runtime/util/animate').BasicAnimationState
 * })}
 */
export const basicAnimationState = {
   cancelled: Object.freeze({ cancelled: true }),
   notCancelled: Object.freeze({ cancelled: false })
}
