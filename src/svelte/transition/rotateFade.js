import { fade }            from '#svelte/transition';
import { linear }          from '#svelte/easing';

import { lerp }            from '#runtime/math/interpolate';
import { getEasingFunc }   from '#runtime/svelte/easing';

/**
 * Combines rotate & fade transitions into a single transition. For options `easing` this is applied to both
 * transitions, however if provided `easingRotate` and / or `easingFade` will take precedence. The default easing is
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
 * @param {import('#runtime/svelte/easing').EasingReference}   [options.easing='linear'] - Easing function name or
 *        function to apply to both slide & fade transitions.
 *
 * @param {import('#runtime/svelte/easing').EasingReference}   [options.easingFade='linear'] - Easing function name or
 *        function to apply to the fade transition.
 *
 * @param {import('#runtime/svelte/easing').EasingReference}   [options.easingRotate='linear'] - Easing function name or
 *        function to apply to the rotate transition.
 *
 * @param {number}      [options.end=0] - End rotation in degrees.
 *
 * @param {number}      [options.initial=0] - Initial rotation in degrees.
 *
 * @returns {import('svelte/transition').TransitionConfig} Transition config.
 */
export function rotateFade(node, options)
{
   const easingFade = getEasingFunc(options.easingFade ?? options.easing);
   const easingRotate = getEasingFunc(options.easingRotate ?? options.easing);

   const fadeTransition = fade(node);

   const initialDeg = options.initial ?? 0;
   const endDeg = options.end ?? 0;

   return {
      delay: options.delay ?? 0,
      duration: options.duration ?? 500,
      easing: linear,
      css: (t) =>
      {
         const fadeT = easingFade(t);
         const rotateT = easingRotate(t);

         return `transform: rotate(${lerp(initialDeg, endDeg, rotateT)}deg); ${fadeTransition.css(fadeT, 1 - fadeT)}`;
      }
   };
}
