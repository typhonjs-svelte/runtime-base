import { SvelteComponent } from 'svelte';

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
 */
declare class TJSFocusIndicator extends SvelteComponent<
  TJSFocusIndicator.Props,
  TJSFocusIndicator.Events,
  TJSFocusIndicator.Slots
> {}

/** Event / Prop / Slot type aliases for {@link TJSFocusIndicator | associated component}. */
declare namespace TJSFocusIndicator {
  /** Props type alias for {@link TJSFocusIndicator | associated component}. */
  export type Props = {
    /**
     * When true, absolute positioning is enabled.
     *
     * @type {boolean}
     */
    absolute?: boolean;
  };
  /** Events type alias for {@link TJSFocusIndicator | associated component}. */
  export type Events = { [evt: string]: CustomEvent<any> };
  /** Slots type alias for {@link TJSFocusIndicator | associated component}. */
  export type Slots = {};
}

/**
 * Provides a component to wrap focus to the first focusable element in the given `elementRoot` prop. Place this
 * component as the last child in `elementRoot`.
 *
 */
declare class TJSFocusWrap extends SvelteComponent<TJSFocusWrap.Props, TJSFocusWrap.Events, TJSFocusWrap.Slots> {}

/** Event / Prop / Slot type aliases for {@link TJSFocusWrap | associated component}. */
declare namespace TJSFocusWrap {
  /** Props type alias for {@link TJSFocusWrap | associated component}. */
  export type Props = {
    /** @type {HTMLElement} */
    elementRoot?: HTMLElement;
    /** @type {boolean} */
    enabled?: boolean;
  };
  /** Events type alias for {@link TJSFocusWrap | associated component}. */
  export type Events = { [evt: string]: CustomEvent<any> };
  /** Slots type alias for {@link TJSFocusWrap | associated component}. */
  export type Slots = {};
}

export { TJSFocusIndicator, TJSFocusWrap };
