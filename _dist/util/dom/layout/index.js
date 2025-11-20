import { isObject, ensureNonEmptyIterable } from '@typhonjs-svelte/runtime-base/util/object';
import { CrossRealm } from '@typhonjs-svelte/runtime-base/util/realm';

/**
 * Walks up the DOM parentElement chain and returns the first ancestor that
 * satisfies multiple filtering rules (class, ID, selector, predicate), while
 * optionally limiting traversal depth.
 *
 * @param el       Starting element.
 * @param options  Filtering and traversal options.
 * @returns        The first acceptable parent element, or null.
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
    const { excludeClasses, includeClasses, excludeIds, includeIds, selector, excludeSelector, predicate, stopAt, maxDepth } = options;
    if (maxDepth !== void 0 && !Number.isInteger(maxDepth) && maxDepth <= 0) {
        throw new TypeError(`'maxDepth' is not a positive integer.`);
    }
    // Normalize iterables via ensureNonEmptyIterable
    const exClasses = ensureNonEmptyIterable(excludeClasses);
    const inClasses = ensureNonEmptyIterable(includeClasses);
    const exIds = ensureNonEmptyIterable(excludeIds);
    const inIds = ensureNonEmptyIterable(includeIds);
    let current = el.parentElement;
    // Depth limit (Infinity if not provided)
    let depth = 0;
    const limit = maxDepth ?? Infinity;
    while (current && depth <= limit) {
        // Stop traversal at boundary element
        if (stopAt && current === stopAt) {
            return null;
        }
        // Exclusion checks --------------------------------------------------------------------------------------------
        let reject = false;
        // Excluded classes
        if (exClasses) {
            for (const cls of exClasses) {
                if (current.classList.contains(cls)) {
                    reject = true;
                    break;
                }
            }
        }
        // Excluded IDs
        if (!reject && exIds) {
            for (const id of exIds) {
                if (current.id === id) {
                    reject = true;
                    break;
                }
            }
        }
        // Excluded selector
        if (!reject && excludeSelector && current.matches(excludeSelector)) {
            reject = true;
        }
        if (reject) {
            current = current.parentElement;
            depth++;
            continue;
        }
        // Inclusion checks --------------------------------------------------------------------------------------------
        let accept = true;
        // Must contain all included classes
        if (inClasses) {
            for (const cls of inClasses) {
                if (!current.classList.contains(cls)) {
                    accept = false;
                    break;
                }
            }
        }
        // Must match all included IDs
        if (accept && inIds) {
            for (const id of inIds) {
                if (current.id !== id) {
                    accept = false;
                    break;
                }
            }
        }
        // Must match inclusion selector
        if (accept && selector && !current.matches(selector)) {
            accept = false;
        }
        // Custom predicate must return true
        if (accept && predicate && predicate(current) !== true) {
            accept = false;
        }
        if (accept) {
            return current;
        }
        current = current.parentElement;
        depth++;
    }
    return null;
}
// /**
//  * @param el - Starting element.
//  *
//  * @param [excludeClasses] - Optional iterable list of CSS class names to skip parent element
//  * traversal.
//  *
//  * @returns First parent element not potentially excluded.
//  */
// export function findParentElement(el: Element, excludeClasses?: Iterable<string>): HTMLElement | null
// {
//    if (!CrossRealm.browser.isElement(el)) { throw new TypeError(`'el' is not a valid Element`); }
//
//    const exclusions = ensureNonEmptyIterable(excludeClasses);
//
//    // No exclusions → return the immediate parent.
//    if (!exclusions) { return el.parentElement; }
//
//    let current = el.parentElement;
//
//    while (current)
//    {
//       let hasExcluded = false;
//
//       for (const cls of exclusions)
//       {
//          if (current.classList.contains(cls))
//          {
//             hasExcluded = true;
//             break;
//          }
//       }
//
//       if (!hasExcluded) { return current; }
//
//       current = current.parentElement;
//    }
//
//    return null;
// }

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

export { findParentElement, getStackingContext };
//# sourceMappingURL=index.js.map
