import type { EasingFunction } from 'svelte/transition';

/**
 * Defines all the standard 1-dimensional Svelte easing function names.
 */
type EasingFunctionName = 'backIn' | 'backInOut' | 'backOut' | 'bounceIn' | 'bounceInOut' | 'bounceOut' | 'circIn' |
 'circInOut' | 'circOut' | 'cubicIn' | 'cubicInOut' | 'cubicOut' | 'elasticIn' | 'elasticInOut' | 'elasticOut' |
  'expoIn' | 'expoInOut' | 'expoOut' | 'linear' | 'quadIn' | 'quadInOut' | 'quadOut' | 'quartIn' | 'quartInOut' |
   'quartOut' | 'quintIn' | 'quintInOut' | 'quintOut' | 'sineIn' | 'sineInOut' | 'sineOut';

/**
 * Defines an easing input as either a predefined easing function name or a custom easing function.
 */
type EasingReference = EasingFunctionName | EasingFunction;

export {
   EasingFunction,
   EasingFunctionName,
   EasingReference
};
