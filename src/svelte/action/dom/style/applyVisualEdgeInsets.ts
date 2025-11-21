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
    * Action to apply visual edge constraints to.
    * ```
    * - `absTo`: Applies inline styles to the direct action element for absolute positioning within visual edge
    * constraints of any parent element.
    *
    * - `padTo`: Applies inline styles padding any parent target to that elements visual edge constraints.
    */
   action?: 'absTo' | 'padTo';

   /**
    * Which constraint / box sides to target.
    */
   sides?: VisualEdgeSides;

   /**
    * Enables parent targeting for visual edge constraint detection.
    */
   parent?: boolean | FindParentOptions;

   /**
    * A store that is updated with visual edge constraints.
    */
   store?: MinimalWritable<StyleMetric.Data.BoxSides>
}

/**
 * Defines the application of padding computation for visual edge insets for {@link padToVisualEdgeInsets} Svelte
 * action.
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
   #applyNode: HTMLElement;

   // Normalized values.
   #action?: string;
   #targetNode: Element | null;
   #sides?: NormalizedSides;
   #parent?: boolean | FindParentOptions;
   #store?: MinimalWritable<StyleMetric.Data.BoxSides>;

   constructor(node: HTMLElement, opts: VisualEdgeInsetsOptions)
   {
      this.#applyNode = node;

      // Normalize initial options.
      this.#action = typeof opts.action === 'string' ? opts.action : void 0;
      this.#parent = opts.parent ?? false;
      this.#sides  = this.#normalizeSides(opts.sides ?? true);
      this.#targetNode = this.#resolveParentTarget(this.#parent);
      this.#store = isMinimalWritableStore(opts.store) ? opts.store : void 0;
   }

   destroy()
   {
      this.#removeStyles();

      // @ts-ignore
      this.#applyNode = null;
      this.#targetNode = null;

      this.#parent = void 0;
      this.#sides = void 0;
      this.#store = void 0;
   }

   /**
    * Update internal options and re-normalize.
    */
   updateOptions(options: VisualEdgeInsetsOptions)
   {
      if (options.action === void 0 || typeof options.action === 'string')
      {
         if (options.action !== this.#action) { this.#removeStyles(); }

         this.#action = options.action;
      }

      if (options.parent !== void 0)
      {
         this.#parent = options.parent;
      }

      if (options.sides !== void 0)
      {
         this.#sides = this.#normalizeSides(options.sides);
      }

      if (isMinimalWritableStore(options.store))
      {
         this.#store = options.store;
      }

      // Always recompute the effective target node.
      const newTarget = this.#resolveParentTarget(this.#parent);

      if (newTarget !== this.#targetNode) { this.#removeStyles(); }

      this.#targetNode = newTarget;

      this.updateConstraints();
   }

   updateConstraints()
   {
      if (this.#targetNode === null) { return; }

      const constraints: StyleMetric.Data.BoxSides = StyleMetric.getVisualEdgeInsets(this.#targetNode);

      if (isMinimalWritableStore(this.#store)) { this.#store.set(constraints); }

      this.#applyStyles(constraints);
   }

   // Internal implementation ----------------------------------------------------------------------------------------

   #applyStyles(constraints: StyleMetric.Data.BoxSides)
   {
      if (this.#sides === void 0) { return; }

      if (this.#action === 'padTo')
      {
         const el = this.#targetNode;

         if (!CrossRealm.browser.isHTMLElement(el)) { return; }

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
         const el = this.#applyNode;

         if (!this.#sides.disabled)
         {
            el.style.top = `${constraints.top}px`;
            el.style.left = `${constraints.left}px`;
            el.style.height = `calc(100% - ${constraints.top}px - ${constraints.bottom}px)`;
            el.style.width = `calc(100% - ${constraints.left}px - ${constraints.right}px)`;
            el.style.position = 'absolute';
         }
      }
   }

   /**
    * Remove padding from target node.
    */
   #removeStyles()
   {
      if (this.#action === 'padTo')
      {
         const el = this.#targetNode;

         if (!CrossRealm.browser.isHTMLElement(el)) { return; }

         el.style.padding = '';
         el.style.paddingTop = '';
         el.style.paddingRight = '';
         el.style.paddingBottom = '';
         el.style.paddingLeft = '';
      }
      else if (this.#action === 'absTo')
      {
         const el = this.#applyNode;

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
      if (parent === void 0 || parent === false) { return this.#applyNode; }

      if (parent === true) { return this.#applyNode.parentElement ?? this.#applyNode; }

      // Parent is a `FindParentOptions` object.
      return isObject(parent) ? findParentElement(this.#applyNode, parent) ?? this.#applyNode : this.#applyNode;
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
