<script>
   /**
    * Provides a reusable absolute and block / flexbox positioned focus indicator for accessibility / keyboard
    * navigation across components. `TJSFocusIndicator` is used in the standard library for menus like {@link TJSMenu} /
    * {@link TJSContextMenu} and for folders like {@link TJSIconFolder} and {@link TJSSvgFolder}. This focus indicator
    * is also available for 3rd party implementation for external consumers. By default, the `span` element is
    * configured for block / flexbox usage. Set the prop `absolute` to `true` and absolute positioning is enabled.
    * In this case make sure the parent element containing `TJSFocusIndicator` has `relative` positioning. There are
    * several CSS variables that are available to alter the appearance.
    *
    * @example
    * ```svelte
    * // The following is an example of use case from {@link TJSMenu} which uses absolute positioning:
    *
    * <ol>
    *   <li class="tjs-menu-item"
    *       role=menuitem
    *       tabindex=0>
    *     <TJSFocusIndicator absolute={true} />
    *   </li>
    * </ol>
    *
    * <styl>
    *   .tjs-menu-item {
    *     display: flex;
    *     position: relative;
    *   }
    *
    *   .tjs-menu-item:focus-visible, .tjs-menu-item:focus-within:has(:focus-visible) {
    *      --tjs-focus-indicator-background: currentColor;
    *   }
    * </styl>
    * ```
    *
    * @componentDocumentation
    */

   /**
    * When true, absolute positioning is enabled.
    *
    * @type {boolean}
    */
   export let absolute = false;
</script>

<span class=tjs-focus-indicator class:absolute={absolute}></span>

<style>
   .tjs-focus-indicator {
      position: var(--tjs-focus-indicator-position);

      height: var(--tjs-focus-indicator-height);
      width: var(--tjs-focus-indicator-width, 0.25em);
      flex: 0 0 var(--tjs-focus-indicator-width, 0.25em);

      pointer-events: none;
      touch-action: none;

      align-self: var(--tjs-focus-indicator-align-self, stretch);
      background: var(--tjs-focus-indicator-background, transparent);
      border: var(--tjs-focus-indicator-border, none);
      border-radius: var(--tjs-focus-indicator-border-radius, 0.1em);

      transition: var(--tjs-focus-indicator-transition, none);
   }

   .tjs-focus-indicator.absolute {
      position: var(--tjs-focus-indicator-position, absolute);
      left: var(--tjs-focus-indicator-left, 2px);
      top: var(--tjs-focus-indicator-top, calc((100% - var(--tjs-focus-indicator-height, 80%)) / 2));
      right: var(--tjs-focus-indicator-right, unset);

      height: var(--tjs-focus-indicator-height, 80%);
   }
</style>
