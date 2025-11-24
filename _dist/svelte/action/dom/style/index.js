import { isObject } from '@typhonjs-svelte/runtime-base/util/object';
import { get } from 'svelte/store';
import { StyleMetric } from '@typhonjs-svelte/runtime-base/util/dom/style';
import { ThemeObserver } from '@typhonjs-svelte/runtime-base/util/dom/theme';
import { CrossRealm } from '@typhonjs-svelte/runtime-base/util/realm';
import { findParentElement } from '@typhonjs-svelte/runtime-base/util/dom/layout';
import { isMinimalWritableStore } from '@typhonjs-svelte/runtime-base/svelte/store/util';

/**
 * Provides an action to apply CSS style properties provided as an object.
 *
 * @param node - Target element
 *
 * @param properties - Hyphen case CSS property key / value object of properties to set.
 *
 * @returns Action lifecycle functions.
 */
function applyStyles(node, properties) {
    /** Sets properties on node. */
    function setProperties() {
        if (!isObject(properties)) {
            return;
        }
        for (const prop of Object.keys(properties)) {
            node.style.setProperty(`${prop}`, properties[prop]);
        }
    }
    setProperties();
    return {
        /**
         * @param newProperties - Key / value object of properties to set.
         */
        update: (newProperties) => {
            properties = newProperties;
            setProperties();
        }
    };
}

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
 * You may also provide no `action` option, but provide a `store` and the visual edge constraint calculations will
 * be updated in the store with no inline styles applied to an element.
 *
 * @param node - Target element.
 *
 * @param [options] - Action Options.
 *
 * @returns Action Lifecycle functions.
 */
function applyVisualEdgeInsets(node, options = {}) {
    let state = new InternalVisualEdgeState(node, options);
    // This will invoke `state.updateConstraints` immediately.
    let unsubscribe = ThemeObserver.stores.themeName.subscribe(recalculateTrigger);
    /**
     * Event handler + ThemeObserver subscriber - update constraints.
     *
     * Other instances of `applyVisualEdgeInsets` will trigger an event ('tjs-visual-edge-recalculate') to any action
     * and target node when they are destroyed. This allows recalculation of constraints when other action events
     * targeting the same node occurs.
     */
    function recalculateTrigger() {
        state?.updateConstraints();
    }
    node.addEventListener('tjs-visual-edge-recalculate', recalculateTrigger);
    return {
        destroy: () => {
            node.removeEventListener('tjs-visual-edge-recalculate', recalculateTrigger);
            state?.destroy();
            state = void 0;
            unsubscribe?.();
            unsubscribe = void 0;
        },
        /**
         * @param newOptions - New options.
         */
        update: (newOptions) => state?.updateOptions(newOptions)
    };
}
/**
 * Extension utility functions for {@link applyVisualEdgeInsets}.
 */
(function (applyVisualEdgeInsets) {
    /**
     * Validates a {@link VisualEdgeSides} value.
     *
     * This utility is attached to {@link applyVisualEdgeInsets} and can be used to perform lightweight runtime checks
     * before passing values to the action. It performs the same structural checks that the action's internal
     * normalization logic uses.
     *
     * @param sides - The value to validate.
     *
     * @returns `true` if the value is a valid `VisualEdgeSides` type otherwise `false`.
     */
    function validateSides(sides) {
        return typeof sides === 'boolean' || typeof sides === 'string' || isObject(sides);
    }
    applyVisualEdgeInsets.validateSides = validateSides;
})(applyVisualEdgeInsets || (applyVisualEdgeInsets = {}));
/**
 * Internal state object for the applyVisualEdgeInsets Svelte action. Normalizes all option values and computes the
 * effective target node.
 */
class InternalVisualEdgeState {
    /**
     * The element associated with the action.
     */
    #actionNode;
    /**
     * Current target node that is used for visual edge inset calculations.
     */
    #targetNode;
    /**
     * The action to take if applying visual edge constraints.
     */
    #action;
    /**
     * When true, debug logging is enabled.
     */
    #debug;
    /**
     * Parent element search configuration.
     */
    #parent;
    /**
     * Which sides to apply inline styles to for padding.
     */
    #sides;
    /**
     * External store to update with visual edge constraints.
     */
    #store;
    constructor(node, opts) {
        this.#actionNode = node;
        // Normalize initial options.
        this.#action = typeof opts.action === 'string' ? opts.action : void 0;
        this.#debug = typeof opts.debug === 'boolean' ? opts.debug : false;
        this.#parent = typeof opts.parent === 'boolean' || isObject(opts.parent) ? opts.parent : false;
        this.#sides = this.#normalizeSides(opts.sides ?? true);
        this.#store = isMinimalWritableStore(opts.store) ? opts.store : void 0;
        this.#targetNode = this.#resolveParentTarget(this.#parent);
    }
    /**
     * Destroy all retained references.
     */
    destroy() {
        this.#removeStyles();
        this.#actionNode?.dispatchEvent?.(new CustomEvent('tjs-visual-edge-recalculate'));
        this.#targetNode?.dispatchEvent?.(new CustomEvent('tjs-visual-edge-recalculate'));
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
    updateOptions(opts) {
        if (typeof opts.debug === 'boolean') {
            this.#debug = opts.debug;
        }
        if (opts.action === void 0 || typeof opts.action === 'string') {
            let applyAction = true;
            if (typeof opts.action === 'string' && opts.action !== 'absThis' && opts.action !== 'padTarget' &&
                opts.action !== 'padThis') {
                if (this.#debug) {
                    this.#log(`updateOptions - unknown action: ${opts.action}`);
                }
                applyAction = false;
            }
            if (applyAction) {
                if (opts.action !== this.#action) {
                    this.#removeStyles();
                }
                this.#action = opts.action;
            }
        }
        if (typeof opts.parent === 'boolean' || isObject(opts.parent)) {
            this.#parent = opts.parent;
        }
        if (opts.sides !== void 0) {
            this.#removeStyles();
            this.#sides = this.#normalizeSides(opts.sides);
        }
        if (opts.store === void 0 || isMinimalWritableStore(opts.store)) {
            this.#store = opts.store;
        }
        // Always recompute the effective target node.
        const newTarget = this.#resolveParentTarget(this.#parent);
        if (newTarget !== this.#targetNode) {
            this.#removeStyles();
        }
        this.#targetNode = newTarget;
        this.updateConstraints();
    }
    /**
     * Updates visual edge constraint calculation.
     */
    updateConstraints() {
        if (this.#targetNode === null) {
            return;
        }
        if (this.#debug) {
            this.#log(`updateConstraints - target node: `, this.#targetNode);
        }
        const constraints = StyleMetric.getVisualEdgeInsets(this.#targetNode);
        if (this.#debug) {
            this.#log(`updateConstraints - new visual edge insets: `, constraints);
        }
        if (isMinimalWritableStore(this.#store)) {
            // Usually avoiding `get` is best practice, but in this case this isn't triggered often, so evaluate existing
            // store value before triggering an update.
            const current = get(this.#store);
            if (current?.top !== constraints.top || current?.right !== constraints.right ||
                current?.bottom !== constraints.bottom || current?.left !== constraints.left) {
                this.#store.set(constraints);
            }
        }
        this.#applyStyles(constraints);
    }
    // Internal implementation ----------------------------------------------------------------------------------------
    /**
     * Applies styles to target node.
     *
     * @param constraints - Constraints to apply.
     */
    #applyStyles(constraints) {
        if (this.#action === 'padTarget' || this.#action === 'padThis') {
            const el = this.#action === 'padTarget' ? this.#targetNode : this.#actionNode;
            if (!CrossRealm.browser.isHTMLElement(el) || this.#sides.disabled) {
                return;
            }
            if (this.#debug) {
                this.#log(`#applyStyles (${this.#action}) - element: `, el);
            }
            if (this.#sides.all) {
                el.style.padding =
                    `${constraints.top}px ${constraints.right}px ${constraints.bottom}px ${constraints.left}px`;
            }
            else {
                if (this.#sides.top) {
                    el.style.paddingTop = `${constraints.top}px`;
                }
                if (this.#sides.right) {
                    el.style.paddingRight = `${constraints.right}px`;
                }
                if (this.#sides.bottom) {
                    el.style.paddingBottom = `${constraints.bottom}px`;
                }
                if (this.#sides.left) {
                    el.style.paddingLeft = `${constraints.left}px`;
                }
            }
        }
        else if (this.#action === 'absThis') {
            const el = this.#actionNode;
            if (!this.#sides.disabled) {
                if (this.#debug) {
                    this.#log(`#applyStyles (absThis) - element: `, el);
                }
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
    #log(message, obj = void 0) {
        console.log(`[TRL] applyVisualEdgeInsets - ${message}`, obj);
    }
    /**
     * Remove styles from target node.
     */
    #removeStyles() {
        if (this.#action === 'padTarget' || this.#action === 'padThis') {
            const el = this.#action === 'padTarget' ? this.#targetNode : this.#actionNode;
            if (!CrossRealm.browser.isHTMLElement(el)) {
                return;
            }
            if (this.#debug) {
                this.#log(`#removeStyles (${this.#action}) - element: `, el);
            }
            if (this.#sides.all) {
                el.style.padding = '';
            }
            else {
                if (this.#sides.top)
                    el.style.paddingTop = '';
                if (this.#sides.right)
                    el.style.paddingRight = '';
                if (this.#sides.bottom)
                    el.style.paddingBottom = '';
                if (this.#sides.left)
                    el.style.paddingLeft = '';
            }
        }
        else if (this.#action === 'absThis') {
            const el = this.#actionNode;
            if (this.#debug) {
                this.#log(`#removeStyles (absThis) - element: `, el);
            }
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
    #resolveParentTarget(parent) {
        if (parent === void 0 || parent === false) {
            return this.#actionNode;
        }
        if (parent === true) {
            return this.#actionNode.parentElement ?? this.#actionNode;
        }
        // Parent is a `FindParentOptions` object.
        return isObject(parent) ? findParentElement(this.#actionNode, parent) ?? this.#actionNode : this.#actionNode;
    }
    /**
     * Normalize the `sides` option into a full boolean mask.
     */
    #normalizeSides(sides) {
        // Disabled entirely.
        if (sides === false) {
            return { disabled: true, all: false, top: false, right: false, bottom: false, left: false };
        }
        // Default or 'all'.
        if (sides === true || sides === void 0 || sides === 'all') {
            return { disabled: false, all: true, top: true, right: true, bottom: true, left: true };
        }
        if (sides === 'horizontal') {
            return { disabled: false, all: false, top: false, right: true, bottom: false, left: true };
        }
        if (sides === 'vertical') {
            return { disabled: false, all: false, top: true, right: false, bottom: true, left: false };
        }
        // Custom object mask.
        return { disabled: false, all: false, top: !!sides.top, right: !!sides.right, bottom: !!sides.bottom,
            left: !!sides.left };
    }
}

export { applyStyles, applyVisualEdgeInsets };
//# sourceMappingURL=index.js.map
