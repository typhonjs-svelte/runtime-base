import { StyleMetric }              from '#runtime/util/dom/style';
import { ThemeObserver }            from '#runtime/util/dom/theme';
import { CrossRealm }               from '#runtime/util/realm';
import { findParentElement }        from '#runtime/util/dom/layout';
import { isObject }                 from '#runtime/util/object';
import { isMinimalWritableStore }   from '#runtime/svelte/store/util';

import type { ActionReturn }        from 'svelte/action';
import type { Unsubscriber }        from 'svelte/store';

import type { MinimalWritable }     from '#runtime/svelte/store/util';
import type { FindParentOptions }   from '#runtime/util/dom/layout';

/**
 * Provides a Svelte action that applies inline styles for `padding` to a parent element or `absolute positioning` to
 * the action element adjusting for any painted borders defined by CSS `border-image` properties of the target
 * node / element of this action.
 *
 * When enabled, this action computes the effective visual edge insets / painted border using
 * {@link #runtime/util/dom/style!StyleMetric.getVisualEdgeInsets} and applies these constraints to either `padding`
 * or absolute inline styles so the element aligns correctly within the visible (non-border) content area of its
 * container.
 *
 * Additionally, this action subscribes to {@link #runtime/util/dom/theme!ThemeObserver} and updates constraint
 * calculations when any global theme is changed. To force an update of constraint calculations provide and change
 * a superfluous / dummy property in the action options.
 *
 * @param node - Target element.
 *
 * @param [options] - Action Options.
 *
 * @returns Action Lifecycle functions.
 */
export function applyVisualEdgeInsets(node: HTMLElement, options: VisualEdgeInsetsOptions = {}):
  ActionReturn<VisualEdgeInsetsOptions>
{
   let state: InternalVisualEdgeState | undefined = new InternalVisualEdgeState(node, options);

   // This will invoke `state.updateConstraints` immediately.
   let unsubscribe: Unsubscriber | undefined = ThemeObserver.stores.themeName.subscribe(
    () => state?.updateConstraints());

   return {
      destroy: () =>
      {
         state?.destroy();
         state = void 0;

         unsubscribe?.();
         unsubscribe = void 0;
      },

      /**
       * @param newOptions - New options.
       */
      update: (newOptions: VisualEdgeInsetsOptions) => state?.updateOptions(newOptions)
   };
}

/**
 * Options for {@link applyVisualEdgeInsets}.
 */
export interface VisualEdgeInsetsOptions
{
   /**
    * Specifies which element applies the visual edge constraints inline styles and the type of styles to apply.
    * ```
    * - `absTo`: Applies inline styles to the direct action element for absolute positioning within visual edge
    * constraints of target / parent element.
    *
    * - `padTo`: Applies inline styles padding the target / parent element to that elements visual edge constraints.
    */
   action?: 'absTo' | 'padTo';

   /**
    * Which constraint / box sides to apply.
    *
    * Note: The extended `sides` options only apply with `action: 'padTo'`. For absolute positioning `action: 'absTo'`
    * all four edge constraints are always applied.
    *
    * @defaultValue `true`
    */
   sides?: VisualEdgeSides;

   /**
    * Enables parent element targeting for visual edge constraint detection.
    *
    * ```
    * - `true`: Direct parent element is the target.
    *
    * - `false`: The action element is the target.
    *
    * - `FindParentOptions` object: This configuration object is passed to `findParentElement`.
    * ```
    *
    * @defaultValue `false`
    *
    * @see {@link #runtime/util/dom/layout!findParentElement}
    */
   parent?: boolean | FindParentOptions;

   /**
    * A store that is updated with visual edge constraints. Updates to the calculated constraints occur even if `sides`
    * is `false`.
    */
   store?: MinimalWritable<StyleMetric.Data.BoxSides>

   /**
    * When true, enables console logging of which element is being targeted for visual edge detection, the constraints
    * calculated, along with any element that is has inline styles applied.
    *
    * @defaultValue `false`
    */
   debug?: boolean;

   /**
    * Allows unknown keys. When an unknown key changes it is ignored, but an update to visual edge constraint
    * calculation occurs. This is useful in the context of local theme changes that may not be picked up by the global
    * {@link ThemeObserver} subscription.
    */
   [key: string]: unknown;
}

/**
 * Defines the application of padding computation for visual edge insets for the {@link applyVisualEdgeInsets} Svelte
 * action. For absolute positioning any truthy value enables application of visual edge insets.
 *
 * ```
 * - `false` - Disabled
 * - `true` or `'all'` - Enabled / all sides.
 * - `'horizontal'` - Left and right sides.
 * - `'vertical'` - Top and bottom sides.
 * - `object` - Customizable sides with boolean properties for: `top`, `right`, `bottom`, `left`.
 * ```
 */
export type VisualEdgeSides =
   | false
   | true
   | 'all'
   | 'vertical'
   | 'horizontal'
   | { top?: boolean; right?: boolean; bottom?: boolean; left?: boolean };

// Internal Implementation -------------------------------------------------------------------------------------------

interface NormalizedSides
{
   disabled: boolean;
   all: boolean;
   top: boolean;
   right: boolean;
   bottom: boolean;
   left: boolean;
}

/**
 * Internal state object for the padToVisualEdgeInsets Svelte action. Normalizes all option values and computes the
 * effective target node.
 */
class InternalVisualEdgeState
{
   /**
    * The element associated with the action.
    */
   #actionNode: HTMLElement;

   /**
    * Current target node that is used for visual edge inset calculations.
    */
   #targetNode: Element | null;

   /**
    * The action to take if applying visual edge constraints.
    */
   #action?: string;

   /**
    * When true, debug logging is enabled.
    */
   #debug?: boolean;

   /**
    * Parent element search configuration.
    */
   #parent?: boolean | FindParentOptions;

   /**
    * Which sides to apply inline styles to for padding.
    */
   #sides: NormalizedSides;

   /**
    * External store to update with visual edge constraints.
    */
   #store?: MinimalWritable<StyleMetric.Data.BoxSides>;

   constructor(node: HTMLElement, opts: VisualEdgeInsetsOptions)
   {
      this.#actionNode = node;

      // Normalize initial options.
      this.#action = typeof opts.action === 'string' ? opts.action : void 0;
      this.#debug = typeof opts.debug === 'boolean' ? opts.debug : false;
      this.#parent = typeof opts.parent === 'boolean' || isObject(opts.parent) ? opts.parent : false;
      this.#sides  = this.#normalizeSides(opts.sides ?? true);
      this.#store = isMinimalWritableStore(opts.store) ? opts.store : void 0;

      this.#targetNode = this.#resolveParentTarget(this.#parent);
   }

   destroy()
   {
      this.#removeStyles();

      // @ts-ignore
      this.#actionNode = null;

      // @ts-ignore
      this.#sides = void 0;

      this.#targetNode = null;
      this.#parent = void 0;
      this.#store = void 0;
   }

   /**
    * Update internal options and re-normalize.
    */
   updateOptions(options: VisualEdgeInsetsOptions)
   {
      if (options.action === void 0 || typeof options.action === 'string')
      {
         // TODO: VERIFY THAT THE ACTION IS SUPPORTED

         if (options.action !== this.#action) { this.#removeStyles(); }

         this.#action = options.action;
      }

      if (typeof options.parent === 'boolean' || isObject(options.parent)) { this.#parent = options.parent; }

      if (options.sides !== void 0) { this.#sides = this.#normalizeSides(options.sides); }

      if (isMinimalWritableStore(options.store)) { this.#store = options.store; }

      // Always recompute the effective target node.
      const newTarget = this.#resolveParentTarget(this.#parent);

      if (newTarget !== this.#targetNode) { this.#removeStyles(); }

      this.#targetNode = newTarget;

      this.updateConstraints();
   }

   /**
    * Updates visual edge constraint calculation.
    */
   updateConstraints()
   {
      if (this.#targetNode === null) { return; }

      if (this.#debug) { this.#log(`updateConstraints - target node: `, this.#targetNode); }

      const constraints: StyleMetric.Data.BoxSides = StyleMetric.getVisualEdgeInsets(this.#targetNode);

      if (this.#debug) { this.#log(`updateConstraints - new visual edge insets: `, constraints); }

      if (isMinimalWritableStore(this.#store)) { this.#store.set(constraints); }

      this.#applyStyles(constraints);
   }

   // Internal implementation ----------------------------------------------------------------------------------------

   /**
    * Applies styles to target node.
    *
    * @param constraints - Constraints to apply.
    */
   #applyStyles(constraints: StyleMetric.Data.BoxSides)
   {
      if (this.#action === 'padTo')
      {
         const el = this.#targetNode;

         if (!CrossRealm.browser.isHTMLElement(el)) { return; }

         if (this.#debug) { this.#log(`#applyStyles (padTo) - target node: `, el); }

         if (this.#sides.all)
         {
            el.style.padding =
             `${constraints.top}px ${constraints.right}px ${constraints.bottom}px ${constraints.left}px`;
         }
         else
         {
            if (this.#sides.top) { el.style.paddingTop = `${constraints.top}px`; }
            if (this.#sides.right) { el.style.paddingRight = `${constraints.right}px`; }
            if (this.#sides.bottom) { el.style.paddingBottom = `${constraints.bottom}px`; }
            if (this.#sides.left) { el.style.paddingLeft = `${constraints.left}px`; }
         }
      }
      else if (this.#action === 'absTo')
      {
         const el = this.#actionNode;

         if (!this.#sides.disabled)
         {
            if (this.#debug) { this.#log(`#applyStyles (absTo) - target node: `, el); }

            el.style.top = `${constraints.top}px`;
            el.style.left = `${constraints.left}px`;
            el.style.height = `calc(100% - ${constraints.top}px - ${constraints.bottom}px)`;
            el.style.width = `calc(100% - ${constraints.left}px - ${constraints.right}px)`;
            el.style.position = 'absolute';
         }
      }
   }

   /**
    * @param message - Log message to post.
    *
    * @param [obj] - Object to log.
    */
   #log(message: string, obj: unknown = void 0)
   {
      console.log(`[TRL] applyVisualEdgeInsets - ${message}`, obj);
   }

   /**
    * Remove styles from target node.
    */
   #removeStyles()
   {
      if (this.#action === 'padTo')
      {
         const el = this.#targetNode;

         if (!CrossRealm.browser.isHTMLElement(el)) { return; }

         if (this.#debug) { this.#log(`#removeStyles (padTo) - target node: `, el); }

         if (this.#sides.all)
         {
            el.style.padding = '';
         }
         else {
            if (this.#sides.top) el.style.paddingTop = '';
            if (this.#sides.right) el.style.paddingRight = '';
            if (this.#sides.bottom) el.style.paddingBottom = '';
            if (this.#sides.left) el.style.paddingLeft = '';
         }
      }
      else if (this.#action === 'absTo')
      {
         const el = this.#actionNode;

         if (this.#debug) { this.#log(`#removeStyles (absTo) - target node: `, el); }

         el.style.top = '';
         el.style.left = '';
         el.style.height = '';
         el.style.width = '';
         el.style.position = '';
      }
   }

   /**
    * Normalize the `parent` option into a meaningful HTMLElement.
    */
   #resolveParentTarget(parent?: boolean | FindParentOptions): Element
   {
      if (parent === void 0 || parent === false) { return this.#actionNode; }

      if (parent === true) { return this.#actionNode.parentElement ?? this.#actionNode; }

      // Parent is a `FindParentOptions` object.
      return isObject(parent) ? findParentElement(this.#actionNode, parent) ?? this.#actionNode : this.#actionNode;
   }

   /**
    * Normalize the `sides` option into a full boolean mask.
    */
   #normalizeSides(sides?: VisualEdgeSides): NormalizedSides
   {
      // Disabled entirely.
      if (sides === false)
      {
         return { disabled: true, all: false, top: false, right: false, bottom: false, left: false };
      }

      // Default or 'all'.
      if (sides === true || sides === void 0 || sides === 'all')
      {
         return { disabled: false, all: true, top: true, right: true, bottom: true, left: true };
      }

      if (sides === 'horizontal')
      {
         return { disabled: false, all: false, top: false, right: true, bottom: false, left: true };
      }

      if (sides === 'vertical')
      {
         return { disabled: false, all: false, top: true, right: false, bottom: true, left: false };
      }

      // Custom object mask.
      return { disabled: false, all: false, top: !!sides.top, right: !!sides.right, bottom: !!sides.bottom,
       left: !!sides.left };
   }
}
