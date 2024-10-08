import * as _runtime_svelte_store_util from '@typhonjs-svelte/runtime-base/svelte/store/util';
import * as svelte_animate from 'svelte/animate';

/**
 * Svelte doesn't provide any events for the animate directive.
 *
 * The provided function below wraps a Svelte animate directive function generating bubbling events for start & end of
 * animation.
 *
 * These events are `animate:start` and `animate:end`.
 *
 * This is useful for instance if you are animating several nodes in a scrollable container where the overflow parameter
 * needs to be set to `none` while animating such that the scrollbar is not activated by the animation.
 *
 * Optionally you may also provide a boolean writable store that will be set to true when animation is active. In some
 * cases this leads to an easier implementation for gating on animation state.
 *
 * @example <caption>With events</caption>
 * const flipWithEvents = animateEvents(flip);
 * </script>
 *
 * <main on:animate:start={() => console.log('animate:start')
 *       on:animate:end={() => console.log('animate:end')}>
 *    {#each someData as entry (entry.id)}
 *       <section animate:flipWithEvents />
 *    {/each}

 * @example <caption>With optional store</caption>
 * const isAnimating = writable(false);
 * const flipWithEvents = animateEvents(flip, isAnimating);
 * </script>
 *
 * <main class:no-scroll={$isAnimating}>
 *    {#each someData as entry (entry.id)}
 *       <section animate:flipWithEvents />
 *    {/each}
 *
 * @param {(
 *    node: Element,
 *    data: { from: DOMRect, to: DOMRect },
 *    ...rest: any
 * ) => import('svelte/animate').AnimationConfig} fn - A Svelte animation function.
 *
 * @param {import('#runtime/svelte/store/util').MinimalWritable<boolean>} [store] - An optional boolean minimal
 *        writable store that is set to true when animation is active.
 *
 * @returns {(
 *    node: Element,
 *    data: { from: DOMRect, to: DOMRect },
 *    ...rest: any
 * ) => import('svelte/animate').AnimationConfig} Wrapped animation function.
 */
declare function animateEvents(
  fn: (
    node: Element,
    data: {
      from: DOMRect;
      to: DOMRect;
    },
    ...rest: any
  ) => svelte_animate.AnimationConfig,
  store?: _runtime_svelte_store_util.MinimalWritable<boolean>,
): (
  node: Element,
  data: {
    from: DOMRect;
    to: DOMRect;
  },
  ...rest: any
) => svelte_animate.AnimationConfig;

export { animateEvents };
