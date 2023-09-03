import * as svelte_transition from 'svelte/transition';

/**
 * Provides a rotate transition. For options `easing` is applied to the rotate transition. The default easing is
 * linear.
 *
 * Note: that when reversing the transition that time goes from `1 - 0`, so if specific options are applied for
 * rotating out transition then `end` and `initial` are swapped.
 *
 * @param {HTMLElement} node - The transition node.
 *
 * @param {object}      [options] - Optional parameters.
 *
 * @param {number}      [options.delay] - Delay in ms before start of transition.
 *
 * @param {number}      [options.duration] - Total transition length in ms.
 *
 * @param {import('svelte/transition').EasingFunction}   [options.easing=linear] - The easing function to apply to the
 *        rotate transition.
 *
 * @param {number}      [options.end=0] - End rotation in degrees.
 *
 * @param {number}      [options.initial=0] - Initial rotation in degrees.
 *
 * @returns {import('svelte/transition').TransitionConfig} Transition config.
 */
declare function rotate(node: HTMLElement, options?: {
    delay?: number;
    duration?: number;
    easing?: svelte_transition.EasingFunction;
    end?: number;
    initial?: number;
}): svelte_transition.TransitionConfig;

/**
 * Combines rotate & fade transitions into a single transition. For options `easing` this is applied to both transitions,
 * however if provided `easingRotate` and / or `easingFade` will take precedence. The default easing is linear.
 *
 * Note: that when reversing the transition that time goes from `1 - 0`, so if specific options are applied for
 * rotating out transition then `end` and `initial` are swapped.
 *
 * @param {HTMLElement} node - The transition node.
 *
 * @param {object}      [options] - Optional parameters.
 *
 * @param {number}      [options.delay] - Delay in ms before start of transition.
 *
 * @param {number}      [options.duration] - Total transition length in ms.
 *
 * @param {import('svelte/transition').EasingFunction}   [options.easing=linear] - The easing function to apply to both
 *        slide & fade transitions.
 *
 * @param {import('svelte/transition').EasingFunction}   [options.easingFade=linear] - The easing function to apply to
 *        the fade transition.
 *
 * @param {import('svelte/transition').EasingFunction}   [options.easingRotate=linear] - The easing function to apply
 *        to the rotate transition.
 *
 * @param {number}      [options.end=0] - End rotation in degrees.
 *
 * @param {number}      [options.initial=0] - Initial rotation in degrees.
 *
 * @returns {import('svelte/transition').TransitionConfig} Transition config.
 */
declare function rotateFade(node: HTMLElement, options?: {
    delay?: number;
    duration?: number;
    easing?: svelte_transition.EasingFunction;
    easingFade?: svelte_transition.EasingFunction;
    easingRotate?: svelte_transition.EasingFunction;
    end?: number;
    initial?: number;
}): svelte_transition.TransitionConfig;

/**
 * Combines slide & fade transitions into a single transition. For options `easing` this is applied to both transitions,
 * however if provided `easingSlide` and / or `easingFade` will take precedence. The default easing is linear.
 *
 * @param {HTMLElement} node - The transition node.
 *
 * @param {object}      [options] - Optional parameters.
 *
 * @param {number}      [options.delay] - Delay in ms before start of transition.
 *
 * @param {number}      [options.duration] - Total transition length in ms.
 *
 * @param {import('svelte/transition').EasingFunction}   [options.easing=linear] - The easing function to apply to both
 *        slide & fade transitions.
 *
 * @param {import('svelte/transition').EasingFunction}   [options.easingFade=linear] - The easing function to apply to
 *        the fade transition.
 *
 * @param {import('svelte/transition').EasingFunction}   [options.easingSlide=linear] - The easing function to apply to
 *        the slide transition.
 *
 * @returns {import('svelte/transition').TransitionConfig} Transition config.
 */
declare function slideFade(node: HTMLElement, options?: {
    delay?: number;
    duration?: number;
    easing?: svelte_transition.EasingFunction;
    easingFade?: svelte_transition.EasingFunction;
    easingSlide?: svelte_transition.EasingFunction;
}): svelte_transition.TransitionConfig;

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
declare function toAnimation(fn: (node: Element, ...rest: any[]) => svelte_transition.TransitionConfig): (node: Element, data: {
    from: DOMRect;
    to: DOMRect;
}, ...rest: any) => any;

/**
 * Provides static data useful for handling custom props / options to components that allow dynamic configuration of
 * transitions. This is used in all application shells and components that have configurable transitions.
 *
 * @ignore
 */
declare class TJSDefaultTransition {
    /**
     * @returns {() => undefined} Default empty transition.
     */
    static get default(): () => undefined;
    /**
     * @returns {{}} Default empty options.
     */
    static get options(): {};
}

/**
 * Defines the shape of a transition function.
 */
type TransitionFunction = (node: Element, namedParameters?: object) => svelte_transition.TransitionConfig;

export { TJSDefaultTransition, TransitionFunction, rotate, rotateFade, slideFade, toAnimation };
