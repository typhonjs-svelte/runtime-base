<script>
   /**
    * Provides a convenient scrollable container / DIV that always allows keyboard scroll navigation by stopping
    * propagation of page up / down key events when the active element is or is contained by the container.
    *
    * Auto serialization of scroll state is handled by providing a store / `scrollTop`.
    *
    * A main slot is provided for a content component, but a fallback allows a child content component to be defined
    * by the `class` and `props` fields in {@link TJSScrollContainerData}.
    *
    * @componentDocumentation
    */

   import { applyScroll }              from '@typhonjs-svelte/runtime-base/svelte/action/dom/properties';
   import {
      applyStyles,
      applyVisualEdgeInsets }          from '@typhonjs-svelte/runtime-base/svelte/action/dom/style';
   import { isMinimalWritableStore }   from '@typhonjs-svelte/runtime-base/svelte/store/util';
   import { TJSSvelte }                from '@typhonjs-svelte/runtime-base/svelte/util';
   import { isObject }                 from '@typhonjs-svelte/runtime-base/util/object';
   import { CrossRealm }               from '@typhonjs-svelte/runtime-base/util/realm';

   /** @type {import('.').TJSScrollContainerData} */
   export let container = void 0;

   /**
    * @type {boolean}
    *
    * @defaultValue `false`
    */
   export let allowTabFocus = void 0;

   /**
    * @type {boolean}
    *
    * @defaultValue `false`
    */
   export let keyPropagate = void 0;

   /**
    * @type {boolean}
    *
    * @defaultValue `false`
    */
   export let gutterStable = void 0;

   /** @type {(data: { event: KeyboardEvent | PointerEvent }) => void} */
   export let onContextMenu = void 0;

   /**
    * When true, the inline styles for padding of the parent element to the scroll container element
    * is adjusted for any visual edge insets / border image applied to the parent element allowing the scroll
    * container to take up the entire visual content space.
    *
    * @type {import('@typhonjs-svelte/runtime-base/svelte/action/dom/style').VisualEdgeSides}
    *
    * @defaultValue `false`
    */
   export let padToVisualEdge = false;

   /** @type {import('@typhonjs-svelte/runtime-base/svelte/store/util').MinimalWritable<number>} */
   export let scrollLeft = void 0;

   /** @type {import('@typhonjs-svelte/runtime-base/svelte/store/util').MinimalWritable<number>} */
   export let scrollTop = void 0;

   /** @type {{ [key: string]: string | null }} */
   export let styles = void 0;

   $: allowTabFocus = isObject(container) && typeof container.allowTabFocus === 'boolean' ? container.allowTabFocus :
    typeof allowTabFocus === 'boolean' ? allowTabFocus : false;

   $: keyPropagate = isObject(container) && typeof container.keyPropagate === 'boolean' ? container.keyPropagate :
    typeof keyPropagate === 'boolean' ? keyPropagate : false;

   $: gutterStable = isObject(container) && typeof container.gutterStable === 'boolean' ? container.gutterStable :
    typeof gutterStable === 'boolean' ? gutterStable : false;

   $: onContextMenu = isObject(container) && typeof container.onContextMenu === 'function' ? container.onContextMenu :
    typeof onContextMenu === 'function' ? onContextMenu : void 0;

   $: padToVisualEdge = isObject(container) &&
    applyVisualEdgeInsets.validateSides(container.padToVisualEdge) ? container.padToVisualEdge :
     applyVisualEdgeInsets.validateSides(padToVisualEdge) ? padToVisualEdge : false;

   $: scrollLeft = isObject(container) && isMinimalWritableStore(container.scrollLeft) ? container.scrollLeft :
    isMinimalWritableStore(scrollLeft) ? scrollLeft : void 0;

   $: scrollTop = isObject(container) && isMinimalWritableStore(container.scrollTop) ? container.scrollTop :
    isMinimalWritableStore(scrollTop) ? scrollTop : void 0;

   $: styles = isObject(container) && isObject(container.styles) ? container.styles :
    isObject(styles) ? styles : void 0;

   $: svelte = isObject(container) && TJSSvelte.config.isConfigEmbed(container.svelte) ? container.svelte : void 0;

   /** @type {HTMLElement} */
   let containerEl;

   /**
    * Handle context menu callback.
    *
    * @param {PointerEvent | KeyboardEvent}   event -
    */
   function onContextMenuPress(event)
   {
      if (typeof onContextMenu === 'function')
      {
         onContextMenu({ event });

         event.preventDefault();
      }
   }

   /**
    * Stops propagation against any global key handlers when focus is inside the container for page up / down key
    * events.
    *
    * @param {KeyboardEvent}  event - A KeyboardEvent.
    */
   function onKeydown(event)
   {
      if (keyPropagate) { return; }

      switch (event.code)
      {
         case 'ArrowDown':
         case 'ArrowLeft':
         case 'ArrowRight':
         case 'ArrowUp':
         case 'End':
         case 'Home':
         case 'PageDown':
         case 'PageUp':
         case 'Space':
         {
            const activeEl = CrossRealm.browser.getActiveElement(event);
            if (activeEl === containerEl || containerEl.contains(activeEl)) { event.stopPropagation(); }

            break;
         }
      }
   }

   /**
    * Stops propagation against any global key handlers when focus is inside the container for page up / down key
    * events.
    *
    * @param {KeyboardEvent}  event - A KeyboardEvent.
    */
   function onKeyup(event)
   {
      if (keyPropagate) { return; }

      switch (event.code)
      {
         case 'ArrowDown':
         case 'ArrowLeft':
         case 'ArrowRight':
         case 'ArrowUp':
         case 'End':
         case 'Home':
         case 'PageDown':
         case 'PageUp':
         case 'Space':
         {
            const activeEl = CrossRealm.browser.getActiveElement(event);
            if (activeEl === containerEl || containerEl.contains(activeEl)) { event.stopPropagation(); }

            break;
         }
      }
   }

   /**
    * Handles stopping propagation and silently focusing the container element so key commands function when active
    * element is outside the container and the event target isn't focusable.
    *
    * @param {WheelEvent}  event - A WheelEvent.
    */
   function onWheel(event)
   {
      const activeEl = CrossRealm.browser.getActiveElement(event);

      if (activeEl !== containerEl && !containerEl.contains(activeEl) &&
       !CrossRealm.browser.isFocusableHTMLElement(event.target))
      {
         event.stopPropagation();
         containerEl.focus();
      }
   }
</script>

<!-- svelte-ignore a11y-no-noninteractive-element-interactions a11y-no-noninteractive-tabindex -->
<div class="tjs-scroll-container tjs-a11y-focusable tjs-content-vars"
     class:gutter-stable={gutterStable}
     bind:this={containerEl}
     on:contextmenu={onContextMenuPress}
     on:keydown={onKeydown}
     on:keyup={onKeyup}
     on:wheel={onWheel}
     use:applyScroll={{ scrollLeft, scrollTop }}
     use:applyStyles={styles}
     use:applyVisualEdgeInsets={{ sides: padToVisualEdge, action: 'padTarget', parent: true }}
     role=region
     tabindex={allowTabFocus ? 0 : -1}>
   <slot>
      {#if svelte}
         <svelte:component this={svelte.class} {...(isObject(svelte.props) ? svelte.props : {})} />
      {/if}
   </slot>
</div>

<style>
   .tjs-scroll-container {
      display: var(--tjs-scroll-container-display, flex);
      flex: var(--tjs-scroll-container-flex, 1);
      flex-direction: var(--tjs-scroll-container-flex-direction, column);
      flex-wrap: var(--tjs-scroll-container-flex-wrap, nowrap);
      gap: var(--tjs-scroll-container-gap, 0);

      background: var(--tjs-scroll-container-background);
      border: var(--tjs-scroll-container-border);
      border-radius: var(--tjs-scroll-container-border-radius);
      box-shadow: var(--tjs-scroll-container-box-shadow);
      color: var(--tjs-scroll-container-color, inherit);

      max-height: var(--tjs-scroll-container-max-height, unset);
      max-width: var(--tjs-scroll-container-max-width, unset);
      min-height: var(--tjs-scroll-container-min-height, unset);
      min-width: var(--tjs-scroll-container-min-width, unset);

      margin: var(--tjs-scroll-container-margin, 0);
      padding: var(--tjs-scroll-container-padding, 0);

      overflow: var(--tjs-scroll-container-overflow, auto);
      overscroll-behavior: var(--tjs-scroll-container-overscroll-behavior, contain);

      scrollbar-gutter: var(--tjs-scroll-container-scrollbar-gutter, auto);
      scrollbar-color: var(--tjs-scroll-container-scrollbar-color, inherit);
      scrollbar-width: var(--tjs-scroll-container-scrollbar-width, thin);

      transition: var(--tjs-scroll-container-transition);
   }

   .tjs-scroll-container.gutter-stable {
      scrollbar-gutter: var(--tjs-scroll-container-scrollbar-gutter, stable);
   }

   .tjs-scroll-container:focus {
      background: var(--tjs-scroll-container-background-focus, var(--tjs-scroll-container-background));
      border: var(--tjs-scroll-container-border-focus, var(--tjs-scroll-container-border));
      border-radius: var(--tjs-scroll-container-border-radius-focus, var(--tjs-scroll-container-border-radius));
      box-shadow: var(--tjs-scroll-container-box-shadow-focus, var(--tjs-scroll-container-box-shadow));
   }

   .tjs-scroll-container:focus-visible {
      outline: var(--tjs-scroll-container-outline-focus-visible, 2px solid transparent);
   }

   .tjs-scroll-container[tabindex="0"]:focus-visible {
      background: var(--tjs-scroll-container-background-focus-visible, var(--tjs-scroll-container-background));
      border: var(--tjs-scroll-container-border-focus-visible, var(--tjs-scroll-container-border));
      border-radius: var(--tjs-scroll-container-border-radius-focus-visible, var(--tjs-scroll-container-border-radius));
      box-shadow: var(--tjs-scroll-container-box-shadow-focus-visible, var(--tjs-scroll-container-box-shadow));
   }
</style>
