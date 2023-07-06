/**
 * Converts a Svelte transition to an animation. Both transitions & animations use the same CSS / styles solution and
 * resulting data so wrap the transition function with the signature of an animation.
 *
 * @param {(node: Element, ...rest: any[]) => import('svelte/transition').TransitionConfig} fn -
 *        A Svelte transition function.
 *
 * @returns {(
 *    node: Element,
 *    data: { from: DOMRect, to: DOMRect },
 *    ...rest: any
 * ) => import('svelte/animation').AnimationConfig} - Transition function converted to an animation.
 */
export function toAnimation(fn)
{
   return (node, animations, ...rest) => fn(node, ...rest);
}
