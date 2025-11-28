export { default as TJSGlassPane }           from './TJSGlassPane.svelte';
export { default as TJSScrollContainer }     from './TJSScrollContainer.svelte';

/**
 * @typedef {object} TJSScrollContainerData
 *
 * @property {boolean} [allowTabFocus=false] When true, the scroll container is keyboard navigation focusable.
 *
 * @property {import('svelte/action').Action} [attach] Optional Svelte action to attach to scroll container element.
 *
 * @property {boolean} [keyPropagate=false] By default, the scroll container stops propagation of all keys that are
 * related to keyboard scrolling accessibility. When true, the scroll container will not capture scrolling key events.
 *
 * @property {boolean} [gutterStable=false] When true, the scrollbar gutter is set to `stable`. This is a convenience
 * for automatic configuration without a wrapping element to set a CSS variable.
 *
 * @property {(data: { event: KeyboardEvent | PointerEvent }) => void} [onContextMenu] Callback to handle context menu
 * presses.
 *
 * @property {import('#runtime/svelte/action/dom/style').VisualEdgeSides} [padToVisualEdge=false] When true, the
 * inline styles for padding of the parent element to the scroll container element is adjusted for any visual edge
 * insets / border image applied to the parent element allowing the scroll container to take up the entire visual
 * content space. You may also specify specific sides for application of visual edge padding inset constraints.
 *
 * @property {import('#runtime/svelte/store/util').MinimalWritable<number>} [scrollLeft] A Svelte store that serializes
 * the scroll left position of the scrollable container.
 *
 * @property {import('#runtime/svelte/store/util').MinimalWritable<number>} [scrollTop] A Svelte store that serializes
 * the scroll top position of the scrollable container.
 *
 * @property {{ [key: string]: string | null }}  [styles] Inline styles to assign to the container.
 *
 * @property {import('#runtime/svelte/util').TJSSvelte.Config.Embed} [svelte] A svelte component configuration object
 * used as the content component when there is no slotted component defined.
 */
