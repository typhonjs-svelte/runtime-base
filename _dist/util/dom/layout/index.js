import { isObject, ensureNonEmptyIterable } from '@typhonjs-svelte/runtime-base/util/object';
import { CrossRealm } from '@typhonjs-svelte/runtime-base/util/realm';

/**
 * Recursive function that finds the closest parent stacking context.
 * See also https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Positioning/Understanding_z_index/The_stacking_context
 *
 * Original author: Kerry Liu / https://github.com/gwwar
 *
 * @see https://github.com/gwwar/z-context/blob/master/content-script.js
 * @see https://github.com/gwwar/z-context/blob/master/LICENSE
 *
 * @param {Element} node -
 *
 * @param [activeWindow] The target active window as applicable.
 *
 * @returns The closest parent stacking context or undefined if none.
 *
 */
function getStackingContext(node, activeWindow = window) {
    const activeDocument = activeWindow.document;
    // The root element (HTML).
    if (!node || node.nodeName === 'HTML') {
        return { node: activeDocument.documentElement, reason: 'root' };
    }
    // Handle shadow root elements.
    if (CrossRealm.browser.isShadowRoot(node)) // node.nodeName === '#document-fragment')
     {
        return getStackingContext(node.host, activeWindow);
    }
    const computedStyle = activeWindow.getComputedStyle(node);
    // position: fixed or sticky.
    if (computedStyle.position === 'fixed' || computedStyle.position === 'sticky') {
        return { node, reason: `position: ${computedStyle.position}` };
    }
    // positioned (absolutely or relatively) with a z-index value other than "auto".
    if (computedStyle.zIndex !== 'auto' && computedStyle.position !== 'static') {
        return { node, reason: `position: ${computedStyle.position}; z-index: ${computedStyle.zIndex}` };
    }
    // elements with an opacity value less than 1.
    if (computedStyle.opacity !== '1') {
        return { node, reason: `opacity: ${computedStyle.opacity}` };
    }
    // elements with a transform value other than "none".
    if (computedStyle.transform !== 'none') {
        return { node, reason: `transform: ${computedStyle.transform}` };
    }
    // elements with a mix-blend-mode value other than "normal".
    if (computedStyle.mixBlendMode !== 'normal') {
        return { node, reason: `mixBlendMode: ${computedStyle.mixBlendMode}` };
    }
    // elements with a filter value other than "none".
    if (computedStyle.filter !== 'none') {
        return { node, reason: `filter: ${computedStyle.filter}` };
    }
    // elements with a perspective value other than "none".
    if (computedStyle.perspective !== 'none') {
        return { node, reason: `perspective: ${computedStyle.perspective}` };
    }
    // elements with a clip-path value other than "none".
    if (computedStyle.clipPath !== 'none') {
        return { node, reason: `clip-path: ${computedStyle.clipPath} ` };
    }
    // elements with a mask value other than "none".
    const mask = computedStyle.mask || computedStyle.webkitMask;
    if (mask !== 'none' && mask !== undefined) {
        return { node, reason: `mask:  ${mask}` };
    }
    // elements with a mask-image value other than "none".
    const maskImage = computedStyle.maskImage || computedStyle.webkitMaskImage;
    if (maskImage !== 'none' && maskImage !== undefined) {
        return { node, reason: `mask-image: ${maskImage}` };
    }
    // elements with a mask-border value other than "none".
    const maskBorder = computedStyle.maskBorder || computedStyle.webkitMaskBorder;
    if (maskBorder !== 'none' && maskBorder !== undefined) {
        return { node, reason: `mask-border: ${maskBorder}` };
    }
    // elements with isolation set to "isolate".
    if (computedStyle.isolation === 'isolate') {
        return { node, reason: `isolation: ${computedStyle.isolation}` };
    }
    // transform or opacity in will-change even if you don't specify values for these attributes directly.
    if (computedStyle.willChange === 'transform' || computedStyle.willChange === 'opacity') {
        return { node, reason: `willChange: ${computedStyle.willChange}` };
    }
    // elements with -webkit-overflow-scrolling set to "touch".
    if (computedStyle.webkitOverflowScrolling === 'touch') {
        return { node, reason: '-webkit-overflow-scrolling: touch' };
    }
    // an item with a z-index value other than "auto".
    if (computedStyle.zIndex !== 'auto') {
        const parentStyle = activeWindow.getComputedStyle(node.parentNode);
        // with a flex|inline-flex parent.
        if (parentStyle.display === 'flex' || parentStyle.display === 'inline-flex') {
            return { node, reason: `flex-item; z-index: ${computedStyle.zIndex}` };
            // with a grid parent.
        }
        else if (parentStyle.grid !== 'none / none / none / row / auto / auto') {
            return { node, reason: `child of grid container; z-index: ${computedStyle.zIndex}` };
        }
    }
    // contain with a value of layout, or paint, or a composite value that includes either of them
    const contain = computedStyle.contain;
    if (['layout', 'paint', 'strict', 'content'].indexOf(contain) > -1 ||
        contain.indexOf('paint') > -1 ||
        contain.indexOf('layout') > -1) {
        return { node, reason: `contain: ${contain}` };
    }
    return getStackingContext(node.parentNode, activeWindow);
}

/**
 * Tests the given element against several optional exclusion / inclusion criteria such as CSS classes / IDs, selector
 * matches or a general purpose provided predicate function.
 *
 * @param el - Element to test.
 *
 * @param options - Filter options.
 */
function elementMatchesFilter(el, options = {}) {
    if (!CrossRealm.browser.isElement(el)) {
        return false;
    }
    if (!isObject(options)) {
        throw new TypeError(`'options' is not an object.`);
    }
    // Unpack options.
    const { excludeClasses, includeClasses, excludeIds, includeIds, selector, excludeSelector, predicate } = options;
    const classList = el.classList;
    const id = el.id;
    // Exclusions -----------------------------------------------------------------------------------------------------
    if (excludeClasses) {
        const iter = ensureNonEmptyIterable(excludeClasses);
        if (iter) {
            for (const cls of iter) {
                if (classList.contains(cls)) {
                    return false;
                }
            }
        }
    }
    if (excludeIds) {
        const iter = ensureNonEmptyIterable(excludeIds);
        if (iter) {
            for (const exId of iter) {
                if (id === exId) {
                    return false;
                }
            }
        }
    }
    if (typeof excludeSelector === 'string' && el.matches(excludeSelector)) {
        return false;
    }
    // Inclusions -----------------------------------------------------------------------------------------------------
    if (includeClasses) {
        const iter = ensureNonEmptyIterable(includeClasses);
        if (iter) {
            for (const cls of iter) {
                if (!classList.contains(cls)) {
                    return false;
                }
            }
        }
    }
    if (includeIds) {
        const iter = ensureNonEmptyIterable(includeIds);
        if (iter) {
            for (const incId of iter) {
                if (id !== incId) {
                    return false;
                }
            }
        }
    }
    // Explicit selector check.
    if (typeof selector === 'string' && !el.matches(selector)) {
        return false;
    }
    // Predicate must explicitly return `true` to accept.
    if (typeof predicate === 'function' && !predicate(el)) {
        return false;
    }
    return true;
}

/**
 * Provides a data defined mechanism to walk up the DOM parent element chain and return the first ancestor that
 * satisfies multiple filtering rules (stacking context, class, ID, selector, predicate) while optionally limiting
 * traversal depth.
 *
 * @param el - Starting element.
 *
 * @param [options] - Filtering and traversal options.
 *
 * @returns The first acceptable parent element or null.
 */
function findParentElement(el, options = {}) {
    if (!CrossRealm.browser.isElement(el)) {
        throw new TypeError(`'el' is not a valid Element.`);
    }
    if (options === void 0) {
        return el.parentElement;
    }
    else if (!isObject(options)) {
        throw new TypeError(`'options' is not an object.`);
    }
    const { stackingContext, stopAt, maxDepth } = options;
    if (typeof stackingContext === 'boolean' && stackingContext) {
        const activeWindow = CrossRealm.browser.getWindow(el);
        let current = el.parentElement;
        while (current) {
            const ctx = getStackingContext(current, activeWindow);
            const next = ctx?.node ?? null;
            if (!next) {
                return null;
            }
            // Apply filtering rules.
            if (elementMatchesFilter(next, options)) {
                return next;
            }
            // Continue walking upward through stacking contexts.
            current = next.parentElement;
        }
        return null;
    }
    // Handle direct / normal traversal -------------------------------------------------------------------------------
    if (maxDepth !== void 0 && !Number.isInteger(maxDepth) && maxDepth <= 0) {
        throw new TypeError(`'maxDepth' is not a positive integer.`);
    }
    let current = el.parentElement;
    // Depth limit; `Infinity` if not provided.
    let depth = 0;
    const limit = maxDepth ?? Infinity;
    while (current && depth <= limit) {
        // Stop traversal at boundary element.
        if (stopAt && current === stopAt) {
            return elementMatchesFilter(current, options) ? current : null;
        }
        if (elementMatchesFilter(current, options)) {
            return current;
        }
        current = current.parentElement;
        depth++;
    }
    return null;
}

export { elementMatchesFilter, findParentElement, getStackingContext };
//# sourceMappingURL=index.js.map
