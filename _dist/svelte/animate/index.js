import { isMinimalWritableStore } from '@typhonjs-svelte/runtime-base/svelte/store/util';

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
function animateEvents(fn, store = void 0)
{
   if (typeof fn !== 'function') { throw new TypeError(`'fn' is not a function.`); }
   if (store !== void 0 && !isMinimalWritableStore(store))
   {
      throw new TypeError(`'store' is not a minimal writable store.`);
   }

   // Track a single start / end sequence across all animations.
   let startFired = false;
   let endFired = false;

   return (node, animations, ...rest) =>
   {
      const animationConfig = fn(node, animations, ...rest);

      // Store any existing tick function.
      const existingTick = animationConfig.tick;

      // Use tick callback to fire events only once when t / time is 0 and 1.
      animationConfig.tick = (t, u) =>
      {
         // If there is any tick function then invoke it.
         if (existingTick) { existingTick(t, u); }

         if (!startFired && t === 0)
         {
            if (store) { store.set(true); }
            node.dispatchEvent(new CustomEvent('animate:start', { bubbles: true }));
            startFired = true;
            endFired = false;
         }

         if (!endFired && t === 1)
         {
            if (store) { store.set(false); }
            node.dispatchEvent(new CustomEvent('animate:end', { bubbles: true }));
            endFired = true;
            startFired = false;
         }
      };

      return animationConfig;
   };
}

export { animateEvents };
//# sourceMappingURL=index.js.map
