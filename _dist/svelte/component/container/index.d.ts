import * as _typhonjs_svelte_runtime_base_svelte_util from '@typhonjs-svelte/runtime-base/svelte/util';
import * as _typhonjs_svelte_runtime_base_svelte_store_util from '@typhonjs-svelte/runtime-base/svelte/store/util';
import * as _typhonjs_svelte_runtime_base_svelte_action_dom_style from '@typhonjs-svelte/runtime-base/svelte/action/dom/style';
import * as svelte_action from 'svelte/action';
import { SvelteComponent } from 'svelte';

/**
 * @privateRemarks
 * TODO: Add description
 *
 */
declare class TJSGlassPane extends SvelteComponent<TJSGlassPane.Props, TJSGlassPane.Events, TJSGlassPane.Slots> {}

/** Event / Prop / Slot type aliases for {@link TJSGlassPane | associated component}. */
declare namespace TJSGlassPane {
  /** Props type alias for {@link TJSGlassPane | associated component}. */
  export type Props = {
    /** @type {string} */
    id?: string;
    /** @type {string} */
    background?: string;
    transition?: any;
    /** @type {boolean} */
    captureInput?: boolean;
    /**
     * When true, any input fires an event `glasspane:close`.
     *
     * @type {boolean}
     */
    closeOnInput?: boolean;
    /** @type {boolean} */
    slotSeparate?: boolean;
    /** @type {{ [key: string]: string | null }} */
    styles?: { [key: string]: string | null };
    inTransition?: any;
    outTransition?: any;
    transitionOptions?: any;
    inTransitionOptions?: {};
    outTransitionOptions?: {};
  };
  /** Events type alias for {@link TJSGlassPane | associated component}. */
  export type Events = {
    'glasspane:close':
      | PointerEvent
      | MouseEvent
      | UIEvent
      | Event
      | ErrorEvent
      | AnimationEvent
      | ClipboardEvent
      | CompositionEvent
      | DragEvent
      | FocusEvent
      | FormDataEvent
      | InputEvent
      | KeyboardEvent
      | ProgressEvent<EventTarget>
      | SecurityPolicyViolationEvent
      | SubmitEvent
      | TouchEvent
      | TransitionEvent
      | WheelEvent;
    'glasspane:keydown:escape':
      | PointerEvent
      | MouseEvent
      | UIEvent
      | Event
      | ErrorEvent
      | AnimationEvent
      | ClipboardEvent
      | CompositionEvent
      | DragEvent
      | FocusEvent
      | FormDataEvent
      | InputEvent
      | KeyboardEvent
      | ProgressEvent<EventTarget>
      | SecurityPolicyViolationEvent
      | SubmitEvent
      | TouchEvent
      | TransitionEvent
      | WheelEvent;
    'glasspane:pointerdown':
      | PointerEvent
      | MouseEvent
      | UIEvent
      | Event
      | ErrorEvent
      | AnimationEvent
      | ClipboardEvent
      | CompositionEvent
      | DragEvent
      | FocusEvent
      | FormDataEvent
      | InputEvent
      | KeyboardEvent
      | ProgressEvent<EventTarget>
      | SecurityPolicyViolationEvent
      | SubmitEvent
      | TouchEvent
      | TransitionEvent
      | WheelEvent;
  } & { [evt: string]: CustomEvent<any> };
  /** Slots type alias for {@link TJSGlassPane | associated component}. */
  export type Slots = { default: {} };
}

/**
 * Provides a convenient scrollable container / DIV that always allows keyboard scroll navigation by stopping
 * propagation of page up / down key events when the active element is or is contained by the container.
 *
 * Auto serialization of scroll state is handled by providing a store / `scrollTop`.
 *
 * A main slot is provided for a content component, but a fallback allows a child content component to be defined
 * by the `class` and `props` fields in {@link TJSScrollContainerData}.
 *
 */
declare class TJSScrollContainer extends SvelteComponent<
  TJSScrollContainer.Props,
  TJSScrollContainer.Events,
  TJSScrollContainer.Slots
> {}

/** Event / Prop / Slot type aliases for {@link TJSScrollContainer | associated component}. */
declare namespace TJSScrollContainer {
  /** Props type alias for {@link TJSScrollContainer | associated component}. */
  export type Props = {
    /** @type {import('.').TJSScrollContainerData} */
    container?: TJSScrollContainerData;
    /** @type {import('@typhonjs-svelte/runtime-base/svelte/store/util').MinimalWritable<number>} */
    scrollLeft?: _typhonjs_svelte_runtime_base_svelte_store_util.MinimalWritable<number>;
    /** @type {import('@typhonjs-svelte/runtime-base/svelte/store/util').MinimalWritable<number>} */
    scrollTop?: _typhonjs_svelte_runtime_base_svelte_store_util.MinimalWritable<number>;
    /** @type {{ [key: string]: string | null }} */
    styles?: { [key: string]: string | null };
    /**
     * @type {boolean}
     *
     * @defaultValue `false`
     */
    gutterStable?: boolean;
    /**
     * @type {boolean}
     *
     * @defaultValue `false`
     */
    allowTabFocus?: boolean;
    /**
     * External dynamic action to attach to scroll container element.
     *
     * @type {import('svelte/action').Action}
     */
    attach?: svelte_action.Action;
    /**
     * @type {boolean}
     *
     * @defaultValue `false`
     */
    keyPropagate?: boolean;
    /** @type {(data: { event: KeyboardEvent | PointerEvent }) => void} */
    onContextMenu?: (data: { event: KeyboardEvent | PointerEvent }) => void;
    /**
     * When true, the inline styles for padding of the parent element to the scroll container element
     * is adjusted for any visual edge insets / border image applied to the parent element allowing the scroll
     * container to take up the entire visual content space.
     *
     * @type {import('@typhonjs-svelte/runtime-base/svelte/action/dom/style').VisualEdgeSides}
     *
     * @defaultValue `false`
     */
    padToVisualEdge?: _typhonjs_svelte_runtime_base_svelte_action_dom_style.VisualEdgeSides;
  };
  /** Events type alias for {@link TJSScrollContainer | associated component}. */
  export type Events = { [evt: string]: CustomEvent<any> };
  /** Slots type alias for {@link TJSScrollContainer | associated component}. */
  export type Slots = { default: {} };
}

type TJSScrollContainerData = {
  /**
   * When true, the scroll container is keyboard navigation focusable.
   */
  allowTabFocus?: boolean;
  /**
   * Optional Svelte action to attach to scroll container element.
   */
  attach?: svelte_action.Action;
  /**
   * By default, the scroll container stops propagation of all keys that are
   * related to keyboard scrolling accessibility. When true, the scroll container will not capture scrolling key events.
   */
  keyPropagate?: boolean;
  /**
   * When true, the scrollbar gutter is set to `stable`. This is a convenience
   * for automatic configuration without a wrapping element to set a CSS variable.
   */
  gutterStable?: boolean;
  /**
   * Callback to handle context menu
   * presses.
   */
  onContextMenu?: (data: { event: KeyboardEvent | PointerEvent }) => void;
  /**
   * When true, the
   * inline styles for padding of the parent element to the scroll container element is adjusted for any visual edge
   * insets / border image applied to the parent element allowing the scroll container to take up the entire visual
   * content space. You may also specify specific sides for application of visual edge padding inset constraints.
   */
  padToVisualEdge?: _typhonjs_svelte_runtime_base_svelte_action_dom_style.VisualEdgeSides;
  /**
   * A Svelte store that serializes
   * the scroll left position of the scrollable container.
   */
  scrollLeft?: _typhonjs_svelte_runtime_base_svelte_store_util.MinimalWritable<number>;
  /**
   * A Svelte store that serializes
   * the scroll top position of the scrollable container.
   */
  scrollTop?: _typhonjs_svelte_runtime_base_svelte_store_util.MinimalWritable<number>;
  /**
   * Inline styles to assign to the container.
   */
  styles?: {
    [key: string]: string | null;
  };
  /**
   * A svelte component configuration object
   * used as the content component when there is no slotted component defined.
   */
  svelte?: _typhonjs_svelte_runtime_base_svelte_util.TJSSvelte.Config.Embed;
};

export { TJSGlassPane, TJSScrollContainer };
export type { TJSScrollContainerData };
