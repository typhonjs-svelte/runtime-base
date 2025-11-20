import { StyleMetric } from '@typhonjs-svelte/runtime-base/util/dom/style';
import { ThemeObserver } from '@typhonjs-svelte/runtime-base/util/dom/theme';
import { CrossRealm } from '@typhonjs-svelte/runtime-base/util/realm';
import { isObject } from '@typhonjs-svelte/runtime-base/util/object';
import { findParentElement } from '@typhonjs-svelte/runtime-base/util/dom/layout';

/**
 * Provides a Svelte action that applies absolute positioning to an element adjusting for any painted borders defined
 * by CSS `border-image` properties of the parent element of the target node / element of this action.
 *
 * When enabled, this action computes the effective visual edge insets / painted border using
 * {@link #runtime/util/dom/style!StyleMetric.getVisualEdgeInsets} and applies inline `position: absolute` styles so
 * the element aligns correctly within the visible (non-border) content area of its container.
 *
 * Additionally, this action subscribes to {@link #runtime/util/dom/theme!ThemeObserver} and updates constraint
 * calculations when any global theme is changed. To force an update of constraint calculations provide and change
 * a superfluous / dummy property in the action options.
 *
 * @param node - Target element.
 *
 * @param [options] - Action Options.
 *
 * @param [options.enabled] - When enabled set inline styles for absolute positioning taking into account visual edge
 *        insets / any border image constraints.
 *
 * @returns Action lifecycle functions.
 */
function absToVisualEdgeInsets(node, { enabled = true } = {}) {
    let top = 0;
    let right = 0;
    let left = 0;
    let bottom = 0;
    /** Sets properties on node. */
    function updateConstraints() {
        if (!CrossRealm.browser.isHTMLElement(node?.parentElement)) {
            top = right = bottom = left = 0;
        }
        else {
            ({ top, right, bottom, left } = StyleMetric.getVisualEdgeInsets(node.parentElement));
        }
        if (enabled) {
            node.style.top = `${top}px`;
            node.style.left = `${left}px`;
            node.style.height = `calc(100% - ${top}px - ${bottom}px)`;
            node.style.width = `calc(100% - ${left}px - ${right}px)`;
            node.style.position = 'absolute';
        }
        else {
            top = right = bottom = left = 0;
            node.style.top = '';
            node.style.right = '';
            node.style.bottom = '';
            node.style.left = '';
            node.style.position = '';
        }
    }
    let unsubscribe = ThemeObserver.stores.themeName.subscribe(() => updateConstraints());
    return {
        destroy: () => {
            unsubscribe?.();
            unsubscribe = void 0;
        },
        /**
         * @param newOptions - New options.
         */
        update: (newOptions) => {
            if (typeof newOptions?.enabled === 'boolean') {
                enabled = newOptions?.enabled;
            }
            updateConstraints();
        }
    };
}

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
 * Provides a Svelte action that applies inline styles for `padding` to an element adjusting for any painted borders
 * defined by CSS `border-image` properties of the target node / element of this action.
 *
 * When enabled, this action computes the effective visual edge insets / painted border using
 * {@link #runtime/util/dom/style!StyleMetric.getVisualEdgeInsets} and applies inline `position: absolute` styles so
 * the element aligns correctly within the visible (non-border) content area of its container.
 *
 * Additionally, this action subscribes to {@link #runtime/util/dom/theme!ThemeObserver} and updates constraint
 * calculations when any global theme is changed. To force an update of constraint calculations provide and change
 * a superfluous / dummy property in the action options.
 *
 * @param node - Target element.
 *
 * @param [options] - Action Options.
 *
 * @param [options.sides] - Padding sides configuration. When undefined or true all sides receive padding.
 *
 * @param [options.parent] - Parent targeting for visual edge computations. When false, the target is this actions
 *        element.
 *
 * @returns Action Lifecycle functions.
 */
function padToVisualEdgeInsets(node, options = {}) {
    let state = new InternalPadState(node, options);
    // This will invoke `state.updateConstraints` immediately.
    let unsubscribe = ThemeObserver.stores.themeName.subscribe(() => state?.updateConstraints());
    return {
        destroy: () => {
            state?.destroy();
            state = void 0;
            unsubscribe?.();
            unsubscribe = void 0;
        },
        /**
         * @param newOptions - New options.
         */
        update: (newOptions) => {
            state?.updateOptions(node, newOptions);
            state?.updateConstraints();
        }
    };
}
/**
 * Internal state object for the padToVisualEdgeInsets Svelte action.
 * Normalizes all option values and computes the effective target node.
 */
class InternalPadState {
    #options = { sides: true, parent: false };
    // Normalized values.
    targetNode;
    sides;
    parent;
    constructor(node, opts) {
        // Normalize initial options
        this.parent = opts.parent ?? false;
        this.sides = this.#normalizeSides(opts.sides ?? true);
        this.targetNode = this.#resolveParentTarget(node, this.parent);
    }
    destroy() {
        this.#removePadding(this.targetNode);
        this.#options = void 0;
        this.parent = void 0;
        this.sides = void 0;
        this.targetNode = null;
    }
    /**
     * Update internal options and re-normalize.
     */
    updateOptions(node, options) {
        if (options.parent !== void 0) {
            this.parent = options.parent;
        }
        if (options.sides !== void 0) {
            this.sides = this.#normalizeSides(options.sides);
        }
        if (CrossRealm.browser.isHTMLElement(this.targetNode))
            // Apply updates to stored options object.
            this.#options = { ...this.#options, ...options };
        // Always recompute the effective target node.
        const newTarget = this.#resolveParentTarget(node, this.parent);
        if (newTarget !== this.targetNode) {
            this.#removePadding(this.targetNode);
        }
        this.targetNode = newTarget;
    }
    updateConstraints() {
        if (this.sides === void 0 || this.sides?.disabled || this.targetNode === null) {
            return;
        }
        const { top, right, bottom, left } = StyleMetric.getVisualEdgeInsets(this.targetNode);
        if (this.sides.all) {
            this.targetNode.style.padding = `${top}px ${right}px ${bottom}px ${left}px`;
        }
        else {
            if (this.sides.top) {
                this.targetNode.style.paddingTop = `${top}px`;
            }
            if (this.sides.right) {
                this.targetNode.style.paddingRight = `${right}px`;
            }
            if (this.sides.bottom) {
                this.targetNode.style.paddingBottom = `${bottom}px`;
            }
            if (this.sides.left) {
                this.targetNode.style.paddingLeft = `${left}px`;
            }
        }
    }
    // Internal implementation ----------------------------------------------------------------------------------------
    /**
     * Remove padding from target node.
     */
    #removePadding(targetNode) {
        if (!CrossRealm.browser.isHTMLElement(targetNode)) {
            return;
        }
        targetNode.style.padding = '';
        targetNode.style.paddingTop = '';
        targetNode.style.paddingRight = '';
        targetNode.style.paddingBottom = '';
        targetNode.style.paddingLeft = '';
    }
    /**
     * Normalize the `parent` option into a meaningful HTMLElement.
     */
    #resolveParentTarget(node, parent) {
        if (parent === void 0 || parent === false) {
            return node;
        }
        if (parent === true) {
            return node.parentElement ?? node;
        }
        // Parent is a `FindParentOptions` object.
        return isObject(parent) ? findParentElement(node, parent) ?? node : node;
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

export { absToVisualEdgeInsets, applyStyles, padToVisualEdgeInsets };
//# sourceMappingURL=index.js.map
