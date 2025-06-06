import { hasSetter, isIterable, isObject, isPlainObject } from '@typhonjs-svelte/runtime-base/util/object';
import { getEasingFunc } from '@typhonjs-svelte/runtime-base/svelte/easing';
import { A11yHelper } from '@typhonjs-svelte/runtime-base/util/a11y';
import { radToDeg, degToRad, clamp } from '@typhonjs-svelte/runtime-base/math/util';
import { subscribeIgnoreFirst } from '@typhonjs-svelte/runtime-base/svelte/store/util';
import { propertyStore } from '@typhonjs-svelte/runtime-base/svelte/store/writable-derived';
import { lerp } from '@typhonjs-svelte/runtime-base/math/interpolate';
import { CrossWindow } from '@typhonjs-svelte/runtime-base/util/browser';
import { Vec3, Mat4 } from '@typhonjs-svelte/runtime-base/math/gl-matrix';
import { writable } from 'svelte/store';
import { StyleParse } from '@typhonjs-svelte/runtime-base/util/dom/style';
import { nextAnimationFrame } from '@typhonjs-svelte/runtime-base/util/animate';

/**
 * Provides an action to apply a TJSPosition instance to a HTMLElement and invoke `position.parent`
 *
 * @param node - The node associated with the action.
 *
 * @param position - A position or positionable instance.
 *
 * @returns The action lifecycle methods.
 */
function applyPosition(node, position) {
    /**
     * Find actual position instance checking for a Positionable instance.
     */
    let actualPosition = (position?.position ?? position);
    if (hasSetter(actualPosition, 'parent')) {
        actualPosition.parent = node;
    }
    return {
        update: (newPosition) => {
            const newActualPosition = (newPosition?.position ?? position);
            // Sanity case to short circuit update if positions are the same instance.
            if (newActualPosition === actualPosition && newActualPosition.parent === actualPosition.parent) {
                return;
            }
            if (hasSetter(actualPosition, 'parent')) {
                actualPosition.parent = void 0;
            }
            actualPosition = newActualPosition;
            if (hasSetter(actualPosition, 'parent')) {
                actualPosition.parent = node;
            }
        },
        destroy: () => { if (hasSetter(actualPosition, 'parent')) {
            actualPosition.parent = void 0;
        } }
    };
}

/**
 * Provides an action to enable pointer dragging of an HTMLElement and invoke `position.set` on a given
 * {@link TJSPosition} instance provided. When the attached boolean store state changes the draggable action is enabled
 * or disabled.
 *
 * @param node - The node associated with the action.
 *
 * @param options - Draggable action options.
 *
 * @returns Action lifecycle functions.
 */
function draggable(node, { position, enabled = true, button = 0, storeDragging = void 0, tween = false, tweenOptions = { duration: 1, ease: 'cubicOut' }, hasTargetClassList, ignoreTargetClassList }) {
    if (hasTargetClassList !== void 0 && !isIterable(hasTargetClassList)) {
        throw new TypeError(`'hasTargetClassList' is not iterable.`);
    }
    if (ignoreTargetClassList !== void 0 && !isIterable(ignoreTargetClassList)) {
        throw new TypeError(`'ignoreTargetClassList' is not iterable.`);
    }
    /**
     * Used for direct call to `position.set`.
     */
    const positionData = { left: 0, top: 0 };
    /**
     * Find actual position instance checking for a Positionable instance.
     */
    let actualPosition = (position?.position ?? position);
    /**
     * Duplicate the app / Positionable starting position to track differences.
     */
    let initialPosition = null;
    /**
     * Stores the initial X / Y on drag down.
     */
    let initialDragPoint = { x: 0, y: 0 };
    /**
     * Stores the current dragging state and gates the move pointer as the dragging store is not set until the first
     * pointer move.
     */
    let dragging = false;
    /**
     * Stores the quickTo callback to use for optimized tweening when easing is enabled.
     */
    let quickTo = actualPosition.animate.quickTo(['top', 'left'], tweenOptions);
    /**
     * Event handlers associated with this action, so they may be later unregistered.
     */
    const handlers = {
        dragDown: ['pointerdown', onDragPointerDown, false],
        dragMove: ['pointermove', onDragPointerChange, false],
        dragUp: ['pointerup', onDragPointerUp, false]
    };
    /**
     * Activates listeners.
     */
    function activateListeners() {
        // Drag handlers
        node.addEventListener(...handlers.dragDown);
        node.classList.add('draggable');
    }
    /**
     * Removes listeners.
     */
    function removeListeners() {
        if (typeof storeDragging?.set === 'function') {
            storeDragging.set(false);
        }
        // Drag handlers
        node.removeEventListener(...handlers.dragDown);
        node.removeEventListener(...handlers.dragMove);
        node.removeEventListener(...handlers.dragUp);
        node.classList.remove('draggable');
    }
    if (enabled) {
        activateListeners();
    }
    /**
     * Handle the initial pointer down that activates dragging behavior for the positionable.
     *
     * @param event - The pointer down event.
     */
    function onDragPointerDown(event) {
        if (event.button !== button || !event.isPrimary) {
            return;
        }
        // Do not process if the position system is not enabled.
        if (!actualPosition.enabled) {
            return;
        }
        // Potentially ignore this event if `ignoreTargetClassList` is defined and the `event.target` has a matching
        // class.
        if (ignoreTargetClassList !== void 0 && A11yHelper.isFocusTarget(event.target)) {
            for (const targetClass of ignoreTargetClassList) {
                if (event.target.classList.contains(targetClass)) {
                    return;
                }
            }
        }
        // Potentially ignore this event if `hasTargetClassList` is defined and the `event.target` does not have any
        // matching class from the list.
        if (hasTargetClassList !== void 0 && A11yHelper.isFocusTarget(event.target)) {
            let foundTarget = false;
            for (const targetClass of hasTargetClassList) {
                if (event.target.classList.contains(targetClass)) {
                    foundTarget = true;
                    break;
                }
            }
            if (!foundTarget) {
                return;
            }
        }
        event.preventDefault();
        dragging = false;
        // Record initial position.
        initialPosition = actualPosition.get();
        initialDragPoint = { x: event.clientX, y: event.clientY };
        // Add move and pointer up handlers.
        node.addEventListener(...handlers.dragMove);
        node.addEventListener(...handlers.dragUp);
        node.setPointerCapture(event.pointerId);
    }
    /**
     * Move the positionable.
     *
     * @param event - The pointer move event.
     */
    function onDragPointerChange(event) {
        // See chorded button presses for pointer events:
        // https://www.w3.org/TR/pointerevents3/#chorded-button-interactions
        // TODO: Support different button configurations for PointerEvents.
        if ((event.buttons & 1) === 0) {
            onDragPointerUp(event);
            return;
        }
        if (event.button !== -1 || !event.isPrimary) {
            return;
        }
        event.preventDefault();
        // Only set store dragging on first move event.
        if (!dragging && typeof storeDragging?.set === 'function') {
            dragging = true;
            storeDragging.set(true);
        }
        const newLeft = initialPosition?.left + (event.clientX - initialDragPoint.x);
        const newTop = initialPosition?.top + (event.clientY - initialDragPoint.y);
        if (tween) {
            quickTo(newTop, newLeft);
        }
        else {
            positionData.left = newLeft;
            positionData.top = newTop;
            actualPosition.set(positionData);
        }
    }
    /**
     * Finish dragging and set the final position and removing listeners.
     *
     * @param event - The pointer up event.
     */
    function onDragPointerUp(event) {
        event.preventDefault();
        dragging = false;
        if (typeof storeDragging?.set === 'function') {
            storeDragging.set(false);
        }
        node.removeEventListener(...handlers.dragMove);
        node.removeEventListener(...handlers.dragUp);
    }
    return {
        // The default of enabled being true won't automatically add listeners twice.
        update: (options) => {
            if (options.position !== void 0) {
                // Find actual position instance checking for a Positionable instance.
                const newPosition = (options.position?.position ?? options.position);
                if (newPosition !== actualPosition) {
                    actualPosition = newPosition;
                    quickTo = actualPosition.animate.quickTo(['top', 'left'], tweenOptions);
                }
            }
            if (typeof options.enabled === 'boolean') {
                enabled = options.enabled;
                if (enabled) {
                    activateListeners();
                }
                else {
                    removeListeners();
                }
            }
            if (typeof options.button === 'number') {
                button = options.button;
            }
            if (typeof options.tween === 'boolean') {
                tween = options.tween;
            }
            if (isObject(options.tweenOptions)) {
                tweenOptions = options.tweenOptions;
                quickTo.options(tweenOptions);
            }
            if (options.hasTargetClassList !== void 0) {
                if (!isIterable(options.hasTargetClassList)) {
                    throw new TypeError(`'hasTargetClassList' is not iterable.`);
                }
                else {
                    hasTargetClassList = options.hasTargetClassList;
                }
            }
            if (options.ignoreTargetClassList !== void 0) {
                if (!isIterable(options.ignoreTargetClassList)) {
                    throw new TypeError(`'ignoreTargetClassList' is not iterable.`);
                }
                else {
                    ignoreTargetClassList = options.ignoreTargetClassList;
                }
            }
        },
        destroy: () => removeListeners()
    };
}
/**
 * Provides an instance of the {@link draggable} action options support / Readable store to make updating / setting
 * draggable options much easier. When subscribing to the options instance returned by {@link draggable.options} the
 * Subscriber handler receives the entire instance.
 */
class DraggableOptionsStore {
    tween;
    tweenOptions;
    #initialTween;
    /**
     */
    #initialTweenOptions;
    #tween = false;
    /**
     */
    #tweenOptions = { duration: 1, ease: 'cubicOut' };
    /**
     * Stores the subscribers.
     */
    #subscribers = [];
    /**
     * @param [opts] - Optional parameters.
     *
     * @param [opts.tween = false] - Tween enabled.
     *
     * @param [opts.tweenOptions] - Quick tween options.
     */
    constructor({ tween = false, tweenOptions } = {}) {
        // Define the following getters directly on this instance and make them enumerable. This allows them to be
        // picked up w/ `Object.assign`.
        Object.defineProperty(this, 'tween', {
            get: () => { return this.#tween; },
            set: (newTween) => {
                if (typeof newTween !== 'boolean') {
                    throw new TypeError(`'tween' is not a boolean.`);
                }
                this.#tween = newTween;
                this.#updateSubscribers();
            },
            enumerable: true
        });
        Object.defineProperty(this, 'tweenOptions', {
            get: () => { return this.#tweenOptions; },
            set: (newTweenOptions) => {
                if (!isObject(newTweenOptions)) {
                    throw new TypeError(`'tweenOptions' is not an object.`);
                }
                if (newTweenOptions.duration !== void 0) {
                    if (!Number.isFinite(newTweenOptions.duration)) {
                        throw new TypeError(`'tweenOptions.duration' is not a finite number.`);
                    }
                    if (newTweenOptions.duration < 0) {
                        this.#tweenOptions.duration = 0;
                    }
                    else {
                        this.#tweenOptions.duration = newTweenOptions.duration;
                    }
                }
                if (newTweenOptions.ease !== void 0) {
                    const easeFn = getEasingFunc(newTweenOptions.ease);
                    if (typeof easeFn !== 'function') {
                        throw new TypeError(`'tweenOptions.ease' is not a function or Svelte easing function name.`);
                    }
                    this.#tweenOptions.ease = newTweenOptions.ease;
                }
                this.#updateSubscribers();
            },
            enumerable: true
        });
        // Set default options.
        if (tween !== void 0) {
            this.tween = tween;
        }
        if (tweenOptions !== void 0) {
            this.tweenOptions = tweenOptions;
        }
        this.#initialTween = this.#tween;
        this.#initialTweenOptions = Object.assign({}, this.#tweenOptions);
    }
    /**
     * @returns Get tween duration.
     */
    get tweenDuration() { return this.#tweenOptions.duration; }
    /**
     * @returns Get easing function or easing function name.
     */
    get tweenEase() { return this.#tweenOptions.ease; }
    /**
     * @param duration - Set tween duration.
     */
    set tweenDuration(duration) {
        if (!Number.isFinite(duration)) {
            throw new TypeError(`'duration' is not a finite number.`);
        }
        if (duration < 0) {
            duration = 0;
        }
        this.#tweenOptions.duration = duration;
        this.#updateSubscribers();
    }
    /**
     * @param ease - Set easing function by name or direct function.
     */
    set tweenEase(ease) {
        const easeFn = getEasingFunc(ease);
        if (typeof easeFn !== 'function') {
            throw new TypeError(`'ease' is not a function or Svelte easing function name.`);
        }
        this.#tweenOptions.ease = ease;
        this.#updateSubscribers();
    }
    /**
     * Resets all options data to initial values.
     */
    reset() {
        this.#tween = this.#initialTween;
        this.#tweenOptions = Object.assign({}, this.#initialTweenOptions);
        this.#updateSubscribers();
    }
    /**
     * Resets tween enabled state to initial value.
     */
    resetTween() {
        this.#tween = this.#initialTween;
        this.#updateSubscribers();
    }
    /**
     * Resets tween options to initial values.
     */
    resetTweenOptions() {
        this.#tweenOptions = Object.assign({}, this.#initialTweenOptions);
        this.#updateSubscribers();
    }
    /**
     * Store subscribe method.
     *
     * @param handler - Callback function that is invoked on update / changes. Receives the DraggableOptionsStore
     *        instance.
     *
     * @returns Unsubscribe function.
     */
    subscribe(handler) {
        const currentIdx = this.#subscribers.findIndex((entry) => entry === handler);
        if (currentIdx === -1) {
            this.#subscribers.push(handler); // add handler to the array of subscribers
            handler(this); // call handler with current value
        }
        // Return unsubscribe function.
        return () => {
            const existingIdx = this.#subscribers.findIndex((entry) => entry === handler);
            if (existingIdx !== -1) {
                this.#subscribers.splice(existingIdx, 1);
            }
        };
    }
    #updateSubscribers() {
        const subscriptions = this.#subscribers;
        // Early out if there are no subscribers.
        if (subscriptions.length > 0) {
            for (let cntr = 0; cntr < subscriptions.length; cntr++) {
                subscriptions[cntr](this);
            }
        }
    }
}
/**
 * Define a function to get a DraggableOptionsStore instance.
 *
 * @param options - Initial options for DraggableOptionsStore.
 *
 * @returns A new options instance.
 */
draggable.options = (options) => new DraggableOptionsStore(options);

/**
 * Provides a basic animation implementation for TJSPosition animation.
 */
class AnimationControl {
    /**
     */
    #animationData;
    /**
     */
    #finishedPromise;
    /**
     */
    #willFinish;
    /**
     * Defines a static empty / void animation control.
     */
    static #voidControl = new AnimationControl(null);
    /**
     * Provides a static void / undefined AnimationControl that is automatically resolved.
     */
    static get voidControl() { return this.#voidControl; }
    /**
     * @param [animationData] - Animation data.
     *
     * @param [willFinish] - Promise that tracks animation finished state.
     */
    constructor(animationData, willFinish = false) {
        this.#animationData = animationData;
        this.#willFinish = willFinish;
        // Set this control to animation data.
        if (isObject(animationData)) {
            animationData.control = this;
        }
    }
    /**
     * Get a promise that resolves when animation is finished.
     *
     * @returns Animation finished Promise.
     */
    get finished() {
        if (!CrossWindow.isPromise(this.#finishedPromise)) {
            this.#finishedPromise = this.#willFinish ? new Promise((resolve) => this.#animationData.resolve = resolve) :
                Promise.resolve({ cancelled: false });
        }
        return this.#finishedPromise;
    }
    /**
     * Returns whether this animation is currently active / animating.
     *
     * Note: a delayed animation may not be started / active yet. Use {@link AnimationControl.isFinished} to determine
     * if an animation is actually finished.
     *
     * @returns Animation active state.
     */
    get isActive() { return this.#animationData?.active ?? false; }
    /**
     * Returns whether this animation is completely finished.
     *
     * @returns Animation finished state.
     */
    get isFinished() { return this.#animationData?.finished ?? true; }
    /**
     * Cancels the animation.
     */
    cancel() {
        const animationData = this.#animationData;
        if (animationData === null || animationData === void 0) {
            return;
        }
        // Set cancelled state to true and this animation data instance will be removed from AnimationManager on next
        // update.
        animationData.cancelled = true;
    }
}

/**
 * Provides animation management and scheduling allowing all TJSPosition instances to utilize one micro-task.
 */
class AnimationManager {
    /**
     * Cancels all animations except `quickTo` animations.
     */
    static cancelFn = (data) => data?.quickTo !== true;
    /**
     * Cancels all animations.
     */
    static cancelAllFn = () => true;
    /**
     * Defines the options used for {@link TJSPosition.set}.
     */
    static #tjsPositionSetOptions = Object.freeze({ immediateElementUpdate: true });
    /**
     */
    static #activeList = [];
    /**
     * Provides the `this` context for {@link AnimationManager.animate} to be scheduled on rAF.
     */
    static #animateBound = (timeFrame) => this.animate(timeFrame);
    /**
     */
    static #pendingList = [];
    /**
     * Tracks whether a requestAnimationFrame callback is pending via {@link AnimationManager.add};
     */
    static #rafPending = false;
    /**
     * Time of last `rAF` callback.
     */
    static #timeFrame;
    /**
     * Time of `performance.now()` at last `rAF` callback.
     */
    static #timeNow;
    /**
     * @returns Time of last `rAF` callback.
     */
    static get timeFrame() {
        return this.#timeFrame;
    }
    /**
     * @returns Time of `performance.now()` at last `rAF` callback.
     */
    static get timeNow() {
        return this.#timeNow;
    }
    /**
     * Add animation data.
     *
     * @param data -
     */
    static add(data) {
        if (data.cancelled) {
            this.#cleanupData(data);
            return;
        }
        AnimationManager.#pendingList.push(data);
        // If there is no rAF pending schedule one now.
        if (!AnimationManager.#rafPending) {
            AnimationManager.#rafPending = true;
            globalThis.requestAnimationFrame(this.#animateBound);
        }
    }
    /**
     * Manage all animation.
     *
     * @param timeFrame - rAF callback time.
     */
    static animate(timeFrame) {
        AnimationManager.#rafPending = false;
        AnimationManager.#timeNow = globalThis.performance.now();
        AnimationManager.#timeFrame = timeFrame;
        // Early out of the continual rAF callback when there are no current animations scheduled.
        if (AnimationManager.#activeList.length === 0 && AnimationManager.#pendingList.length === 0) {
            return;
        }
        if (AnimationManager.#pendingList.length) {
            // Process new data
            for (let cntr = AnimationManager.#pendingList.length; --cntr >= 0;) {
                const data = AnimationManager.#pendingList[cntr];
                // If animation instance has been cancelled before start then remove it from new list and cleanup.
                if (data.cancelled || (data.el !== void 0 && !data.el.isConnected)) {
                    AnimationManager.#pendingList.splice(cntr, 1);
                    this.#cleanupData(data);
                }
                // If data is active then process it now. Delayed animations start with `active` false.
                if (data.active) {
                    // Set any transform origin for the animation.
                    if (data.transformOrigin) {
                        data.position.set({ transformOrigin: data.transformOrigin });
                    }
                    data.start = AnimationManager.#timeFrame;
                    // Remove from new list and add to active list.
                    AnimationManager.#pendingList.splice(cntr, 1);
                    AnimationManager.#activeList.push(data);
                }
            }
        }
        // Process active animations.
        for (let cntr = AnimationManager.#activeList.length; --cntr >= 0;) {
            const data = AnimationManager.#activeList[cntr];
            // Remove any animations that have been canceled.
            if (data.cancelled || (data.el !== void 0 && !data.el.isConnected)) {
                AnimationManager.#activeList.splice(cntr, 1);
                this.#cleanupData(data);
                continue;
            }
            data.current = timeFrame - data.start;
            // Remove this animation instance if current animating time exceeds duration.
            if (data.current >= data.duration) {
                // Prepare final update with end position data.
                for (let dataCntr = data.keys.length; --dataCntr >= 0;) {
                    const key = data.keys[dataCntr];
                    data.newData[key] = data.destination[key];
                }
                data.position.set(data.newData, AnimationManager.#tjsPositionSetOptions);
                AnimationManager.#activeList.splice(cntr, 1);
                this.#cleanupData(data);
                continue;
            }
            // Apply easing to create an eased time.
            const easedTime = data.ease(data.current / data.duration);
            for (let dataCntr = data.keys.length; --dataCntr >= 0;) {
                const key = data.keys[dataCntr];
                data.newData[key] = data.interpolate(data.initial[key], data.destination[key], easedTime);
            }
            data.position.set(data.newData, AnimationManager.#tjsPositionSetOptions);
        }
        globalThis.requestAnimationFrame(this.#animateBound);
    }
    /**
     * Cancels all animations for given TJSPosition instance.
     *
     * @param position - TJSPosition instance.
     *
     * @param [cancelFn] - An optional function to control cancelling animations.
     */
    static cancel(position, cancelFn = AnimationManager.cancelFn) {
        for (let cntr = AnimationManager.#activeList.length; --cntr >= 0;) {
            const data = AnimationManager.#activeList[cntr];
            if (data.position === position && cancelFn(data)) {
                AnimationManager.#activeList.splice(cntr, 1);
                data.cancelled = true;
                this.#cleanupData(data);
            }
        }
        for (let cntr = AnimationManager.#pendingList.length; --cntr >= 0;) {
            const data = AnimationManager.#pendingList[cntr];
            if (data.position === position && cancelFn(data)) {
                AnimationManager.#pendingList.splice(cntr, 1);
                data.cancelled = true;
                this.#cleanupData(data);
            }
        }
    }
    /**
     * Cancels all active and delayed animations.
     */
    static cancelAll() {
        for (let cntr = AnimationManager.#activeList.length; --cntr >= 0;) {
            const data = AnimationManager.#activeList[cntr];
            data.cancelled = true;
            this.#cleanupData(data);
        }
        for (let cntr = AnimationManager.#pendingList.length; --cntr >= 0;) {
            const data = AnimationManager.#pendingList[cntr];
            data.cancelled = true;
            this.#cleanupData(data);
        }
        AnimationManager.#activeList.length = 0;
        AnimationManager.#pendingList.length = 0;
    }
    /**
     * @param data - Animation data to cleanup.
     */
    static #cleanupData(data) {
        // Update state.
        data.active = false;
        data.finished = true;
        // Reset any transform origin for the animation to initial value.
        if (data.transformOriginInitial) {
            data.position.set({ transformOrigin: data.transformOriginInitial });
        }
        if (typeof data.cleanup === 'function') {
            data.cleanup(data);
        }
        if (typeof data.resolve === 'function') {
            data.resolve({ cancelled: data.cancelled });
        }
        // Remove retained data if not a `quickTo` animation.
        if (!data.quickTo) {
            data.cleanup = void 0;
            data.control = void 0;
            data.destination = void 0;
            data.el = void 0;
            data.ease = void 0;
            data.initial = void 0;
            data.interpolate = void 0;
            data.keys = void 0;
            data.newData = void 0;
            data.position = void 0;
            data.resolve = void 0;
        }
    }
    /**
     * Gets all {@link AnimationControl} instances for a given TJSPosition instance.
     *
     * @param position - TJSPosition instance.
     *
     * @returns All scheduled AnimationControl instances for the given TJSPosition instance.
     */
    static getScheduled(position) {
        const results = [];
        for (let cntr = AnimationManager.#activeList.length; --cntr >= 0;) {
            const data = AnimationManager.#activeList[cntr];
            if (data.position === position && data.control) {
                results.push(data.control);
            }
        }
        for (let cntr = AnimationManager.#pendingList.length; --cntr >= 0;) {
            const data = AnimationManager.#pendingList[cntr];
            if (data.position === position && data.control) {
                results.push(data.control);
            }
        }
        return results;
    }
    /**
     * Returns the status of any scheduled or pending animations for the given {@link TJSPosition} instance.
     *
     * @param position - TJSPosition instance.
     *
     * @param [options] - Scheduling options.
     *
     * @returns True if scheduled / false if not.
     */
    static isScheduled(position, { active = true, pending = true } = {}) {
        if (active) {
            for (let cntr = AnimationManager.#activeList.length; --cntr >= 0;) {
                if (AnimationManager.#activeList[cntr].position === position) {
                    return true;
                }
            }
        }
        if (pending) {
            for (let cntr = AnimationManager.#pendingList.length; --cntr >= 0;) {
                if (AnimationManager.#pendingList[cntr].position === position) {
                    return true;
                }
            }
        }
        return false;
    }
}

/**
 * Defines stored positional data.
 */
class TJSPositionData {
    height;
    left;
    maxHeight;
    maxWidth;
    minHeight;
    minWidth;
    rotateX;
    rotateY;
    rotateZ;
    scale;
    top;
    transformOrigin;
    translateX;
    translateY;
    translateZ;
    width;
    zIndex;
    /**
     * @param [opts] - Options.
     *
     * @param [opts.height] -
     *
     * @param [opts.left] -
     *
     * @param [opts.maxHeight] -
     *
     * @param [opts.maxWidth] -
     *
     * @param [opts.minHeight] -
     *
     * @param [opts.minWidth] -
     *
     * @param [opts.rotateX] -
     *
     * @param [opts.rotateY] -
     *
     * @param [opts.rotateZ] -
     *
     * @param [opts.scale] -
     *
     * @param [opts.translateX] -
     *
     * @param [opts.translateY] -
     *
     * @param [opts.translateZ] -
     *
     * @param [opts.top] -
     *
     * @param [opts.transformOrigin] -
     *
     * @param [opts.width] -
     *
     * @param [opts.zIndex] -
     *
     * @param [opts.rotation] - Alias for `rotateZ`.
     */
    constructor({ height = null, left = null, maxHeight = null, maxWidth = null, minHeight = null, minWidth = null, rotateX = null, rotateY = null, rotateZ = null, scale = null, translateX = null, translateY = null, translateZ = null, top = null, transformOrigin = null, width = null, zIndex = null } = {}) {
        this.height = height;
        this.left = left;
        this.maxHeight = maxHeight;
        this.maxWidth = maxWidth;
        this.minHeight = minHeight;
        this.minWidth = minWidth;
        this.rotateX = rotateX;
        this.rotateY = rotateY;
        this.rotateZ = rotateZ;
        this.scale = scale;
        this.top = top;
        this.transformOrigin = transformOrigin;
        this.translateX = translateX;
        this.translateY = translateY;
        this.translateZ = translateZ;
        this.width = width;
        this.zIndex = zIndex;
    }
}

/**
 * Various internal utilities to work with {@link TJSPositionData}.
 */
class TJSPositionDataUtil {
    /**
     * Stores the TJSPositionData properties that can be animated.
     */
    static #animateKeys = Object.freeze(new Set([
        // Main keys
        'left', 'top', 'maxWidth', 'maxHeight', 'minWidth', 'minHeight', 'width', 'height',
        'rotateX', 'rotateY', 'rotateZ', 'scale', 'translateX', 'translateY', 'translateZ', 'zIndex',
        // Aliases
        'rotation'
    ]));
    /**
     * Stores the TJSPositionData property aliases that can be animated.
     */
    static #animateKeyAliases = Object.freeze(new Map([['rotation', 'rotateZ']]));
    /**
     * Provides numeric defaults for all parameters. This is used by {@link TJSPosition.get} to optionally provide
     * numeric defaults.
     */
    static #numericDefaults = Object.freeze({
        // Other keys
        height: 0,
        left: 0,
        maxHeight: null,
        maxWidth: null,
        minHeight: null,
        minWidth: null,
        top: 0,
        transformOrigin: null,
        width: 0,
        zIndex: null,
        rotateX: 0,
        rotateY: 0,
        rotateZ: 0,
        scale: 1,
        translateX: 0,
        translateY: 0,
        translateZ: 0
    });
    /**
     * Convenience to copy from source to target of two TJSPositionData like objects. If a target is not supplied a new
     * {@link TJSPositionData} instance is created.
     *
     * @param source - The source instance to copy from.
     *
     * @param [target] - Target TJSPositionData like object; if one is not provided a new instance is created.
     *
     * @returns The target instance with all TJSPositionData fields.
     */
    static copyData(source, target = new TJSPositionData()) {
        target.height = source.height ?? null;
        target.left = source.left ?? null;
        target.maxHeight = source.maxHeight ?? null;
        target.maxWidth = source.maxWidth ?? null;
        target.minHeight = source.minHeight ?? null;
        target.minWidth = source.minWidth ?? null;
        target.rotateX = source.rotateX ?? null;
        target.rotateY = source.rotateY ?? null;
        target.rotateZ = source.rotateZ ?? null;
        target.scale = source.scale ?? null;
        target.top = source.top ?? null;
        target.transformOrigin = source.transformOrigin ?? null;
        target.translateX = source.translateX ?? null;
        target.translateY = source.translateY ?? null;
        target.translateZ = source.translateZ ?? null;
        target.width = source.width ?? null;
        target.zIndex = source.zIndex ?? null;
        return target;
    }
    /**
     * Returns the non-aliased animation key.
     *
     * @param key - Animation key / possibly aliased key.
     *
     * @returns Actual non-aliased animation key.
     */
    static getAnimationKey(key) {
        return this.#animateKeyAliases.get(key) ?? key;
    }
    /**
     * Queries an object by the given key or otherwise returns any numeric default.
     *
     * @param data - An object to query for the given animation key.
     *
     * @param key - Animation key.
     *
     * @returns Data at key or numeric default.
     */
    static getDataOrDefault(data, key) {
        key = this.#animateKeyAliases.get(key) ?? key;
        return data[key] ?? this.#numericDefaults[key];
    }
    /**
     * Tests if the given key is an animation key.
     *
     * @param key - A potential animation key.
     *
     * @returns Is animation key.
     */
    static isAnimationKey(key) {
        return this.#animateKeys.has(key);
    }
    /**
     * Sets numeric defaults for a {@link TJSPositionData} like object.
     *
     * @param data - A TJSPositionData like object.
     */
    static setNumericDefaults(data) {
        // Transform keys
        if (data.rotateX === null) {
            data.rotateX = 0;
        }
        if (data.rotateY === null) {
            data.rotateY = 0;
        }
        if (data.rotateZ === null) {
            data.rotateZ = 0;
        }
        if (data.translateX === null) {
            data.translateX = 0;
        }
        if (data.translateY === null) {
            data.translateY = 0;
        }
        if (data.translateZ === null) {
            data.translateZ = 0;
        }
        if (data.scale === null) {
            data.scale = 1;
        }
    }
}

/**
 * Converts {@link TJSPositionData} properties defined as strings to number values. The string values can be defined
 * as relative adjustments with a leading operator. Various unit formats are supported as well.
 */
class ConvertStringData {
    /**
     * Animation keys for different processing categories.
     */
    static #animKeyTypes = {
        // Animation keys that can be specified in `px` converted to a number.
        numPx: Object.freeze(new Set(['left', 'top', 'maxWidth', 'maxHeight', 'minWidth', 'minHeight', 'width', 'height',
            'translateX', 'translateY', 'translateZ'])),
        // Animation keys that can be specified in percentage of parent element constraint.
        percentParent: Object.freeze(new Set(['left', 'top', 'maxWidth', 'maxHeight', 'minWidth', 'minHeight', 'width',
            'height'])),
        // Only rotation animation keys can be specified in `rad` / `turn` converted to a number.
        rotationRadTurn: Object.freeze(new Set(['rotateX', 'rotateY', 'rotateZ', 'rotation']))
    };
    /**
     * Parses string data values. Relative values must start with leading values '+=', '-=', or '*=' followed by a
     * float / numeric value. IE `+=45` or for percentage '+=10%'. Also handles exact percent value such as `10` or
     * `10%`. Percentage values are based on the current value, parent element constraints, or constraints of the type
     * of value like rotation being bound by 360 degrees.
     *
     * @privateRemarks
     * TODO: In the future support more specific CSS unit types.
     */
    static #regexStringData = /^(?<operation>[-+*]=)?(?<value>-?\d*\.?\d+)(?<unit>%|%~|px|rad|turn)?$/;
    /**
     * Stores the results for match groups from `regexStringData`;
     */
    static #matchResults = Object.seal({
        operation: void 0,
        value: 0,
        unit: void 0
    });
    /**
     * Converts any relative string values for animatable keys to actual updates performed against current data.
     *
     * @param data - position data.
     *
     * @param position - The source position data.
     *
     * @param el - Target positioned element.
     *
     * @returns Converted data.
     */
    static process(data, position, el) {
        // Used in `%` calculations. The first `%` conversion that requires parent element height and width will attempt
        // to cache the parent element client height & width of the given element.
        let parentClientHeight = Number.NaN;
        let parentClientWidth = Number.NaN;
        for (const key in data) {
            // Key is animatable / numeric.
            if (TJSPositionDataUtil.isAnimationKey(key)) {
                const value = data[key];
                if (typeof value !== 'string') {
                    continue;
                }
                // Ignore 'auto' and 'inherit' string values.
                if (value === 'auto' || value === 'inherit') {
                    continue;
                }
                const animKey = key;
                const regexResults = this.#regexStringData.exec(value);
                // Additional state indicating a particular key is handled.
                let handled = false;
                if (regexResults && regexResults.groups) {
                    const results = this.#matchResults;
                    results.operation = regexResults.groups.operation;
                    results.value = parseFloat(regexResults.groups.value);
                    results.unit = regexResults.groups.unit;
                    // Retrieve current value, but if null use the numeric default.
                    const current = TJSPositionDataUtil.getDataOrDefault(position, key);
                    switch (results.unit) {
                        // Animation keys that support percentage changes including constraints against the parent element.
                        case '%':
                            {
                                // Cache parent client width / height on first parent percent based key.
                                if (this.#animKeyTypes.percentParent.has(key) && (Number.isNaN(parentClientHeight) ||
                                    Number.isNaN(parentClientWidth))) {
                                    if (el?.parentElement?.isConnected) {
                                        parentClientHeight = el.parentElement.clientHeight;
                                        parentClientWidth = el.parentElement.clientWidth;
                                    }
                                    else {
                                        parentClientHeight = 0;
                                        parentClientWidth = 0;
                                        console.warn(`TJSPosition - ConvertStringData warning: could not determine parent constraints for key '${key}' with value '${value}'.`);
                                        data[key] = void 0;
                                        continue;
                                    }
                                }
                                handled = this.#handlePercent(animKey, current, data, results, parentClientHeight, parentClientWidth);
                                break;
                            }
                        // Animation keys that support percentage changes from current values.
                        case '%~':
                            handled = this.#handleRelativePercent(animKey, current, data, results);
                            break;
                        // Animation keys that support `px` / treat as raw number.
                        case 'px':
                            handled = this.#animKeyTypes.numPx.has(key) ?
                                this.#applyResultsValue(animKey, current, data, results) : false;
                            break;
                        // Only rotation animation keys support `rad` / `turn`.
                        case 'rad':
                        case 'turn':
                            handled = this.#animKeyTypes.rotationRadTurn.has(key) ?
                                this.#handleRotationRadTurn(animKey, current, data, results) : false;
                            break;
                        // No units / treat as raw number.
                        default:
                            handled = this.#applyResultsValue(animKey, current, data, results);
                            break;
                    }
                }
                if (!regexResults || !handled) {
                    console.warn(`TJSPosition - ConvertStringData warning: malformed key '${key}' with value '${value}'.`);
                    data[key] = void 0;
                }
            }
        }
        return data;
    }
    // Internal implementation ----------------------------------------------------------------------------------------
    /**
     * Provides the common update to source data after `results.value` has been converted to the proper value
     * respectively.
     *
     * @param key - Animation key.
     *
     * @param current - Current value
     *
     * @param data - Source data to convert.
     *
     * @param results - Match results.
     *
     * @returns Adjustment successful.
     */
    static #applyResultsValue(key, current, data, results) {
        if (!results.operation) {
            data[key] = results.value;
            return true;
        }
        switch (results.operation) {
            case '-=':
                data[key] = current - results.value;
                break;
            case '+=':
                data[key] = current + results.value;
                break;
            case '*=':
                data[key] = current * results.value;
                break;
            default:
                return false;
        }
        return true;
    }
    /**
     * Handles the `%` unit type where values are adjusted against the parent element client width / height or in the
     * case of rotation the percentage of 360 degrees.
     *
     * @param key - Animation key.
     *
     * @param current - Current value
     *
     * @param data - Source data to convert.
     *
     * @param results - Match results.
     *
     * @param parentClientHeight - Parent element client height.
     *
     * @param parentClientWidth - Parent element client width.
     *
     * @returns Adjustment successful.
     */
    static #handlePercent(key, current, data, results, parentClientHeight, parentClientWidth) {
        switch (key) {
            // Calculate value; take into account keys that calculate parent client width.
            case 'left':
            case 'maxWidth':
            case 'minWidth':
            case 'width':
            case 'translateX':
                results.value = parentClientWidth * (results.value / 100);
                break;
            // Calculate value; take into account keys that calculate parent client height.
            case 'top':
            case 'maxHeight':
            case 'minHeight':
            case 'height':
            case 'translateY':
                results.value = parentClientHeight * (results.value / 100);
                break;
            // Calculate value; convert percentage into degrees
            case 'rotateX':
            case 'rotateY':
            case 'rotateZ':
            case 'rotation':
                results.value = 360 * (results.value / 100);
                break;
            default:
                return false;
        }
        return this.#applyResultsValue(key, current, data, results);
    }
    /**
     * Handles the `%~` unit type where values are adjusted against the current value for the given key.
     *
     * @param key - Animation key.
     *
     * @param current - Current value
     *
     * @param data - Source data to convert.
     *
     * @param results - Match results.
     *
     * @returns Adjustment successful.
     */
    static #handleRelativePercent(key, current, data, results) {
        // Normalize percentage.
        results.value = results.value / 100;
        if (!results.operation) {
            data[key] = current * results.value;
            return true;
        }
        switch (results.operation) {
            case '-=':
                data[key] = current - (current * results.value);
                break;
            case '+=':
                data[key] = current + (current * results.value);
                break;
            case '*=':
                data[key] = current * (current * results.value);
                break;
            default:
                return false;
        }
        return true;
    }
    /**
     * Handles the `rad` / `turn` unit types for rotation animation keys.
     *
     * @param key - Animation key.
     *
     * @param current - Current value
     *
     * @param data - Source data to convert.
     *
     * @param results - Match results.
     *
     * @returns Adjustment successful.
     */
    static #handleRotationRadTurn(key, current, data, results) {
        // Convert radians / turn into degrees.
        switch (results.unit) {
            case 'rad':
                results.value = radToDeg(results.value);
                break;
            case 'turn':
                results.value = 360 * results.value;
                break;
        }
        return this.#applyResultsValue(key, current, data, results);
    }
}

/**
 * Provides the output data for {@link TransformAPI.getData}.
 */
class TJSTransformData {
    constructor() {
        Object.seal(this);
    }
    /**
     * Stores the calculated bounding rectangle.
     */
    #boundingRect = new DOMRect();
    /**
     * Stores the individual transformed corner points of the window in screen space clockwise from:
     * top left -> top right -> bottom right -> bottom left.
     */
    #corners = [new Vec3(), new Vec3(), new Vec3(), new Vec3()];
    /**
     * Stores the current gl-matrix Mat4 data.
     */
    #mat4 = new Mat4();
    /**
     * Stores the pre-origin & post-origin translations to apply to matrix transforms.
     */
    #originTranslations = [new Mat4(), new Mat4()];
    /**
     * @returns The bounding rectangle.
     */
    get boundingRect() { return this.#boundingRect; }
    /**
     * @returns The transformed corner points as Vec3 in screen space.
     */
    get corners() { return this.#corners; }
    /**
     * @returns Returns the CSS style string for the transform matrix.
     */
    get css() { return `matrix3d(${this.mat4.join(',')})`; }
    /**
     * @returns The transform matrix.
     */
    get mat4() { return this.#mat4; }
    /**
     * @returns The pre / post translation matrices for origin translation.
     */
    get originTranslations() { return this.#originTranslations; }
}

/**
 * Provides type guards for `Number`.
 */
class NumberGuard {
    constructor() { }
    static isFinite(value) {
        return typeof value === 'number' && Number.isFinite(value);
    }
    static isFiniteOrNull(value) {
        return value === null || (typeof value === 'number' && Number.isFinite(value));
    }
}

/**
 * Caches computed styles of a {@link TJSPosition} target element.
 */
class TJSPositionStyleCache {
    el;
    computed;
    marginLeft;
    marginTop;
    maxHeight;
    maxWidth;
    minHeight;
    minWidth;
    hasWillChange;
    stores;
    resizeObserved;
    constructor() {
        this.el = void 0;
        this.computed = void 0;
        this.marginLeft = void 0;
        this.marginTop = void 0;
        this.maxHeight = void 0;
        this.maxWidth = void 0;
        this.minHeight = void 0;
        this.minWidth = void 0;
        this.hasWillChange = false;
        this.resizeObserved = Object.seal({
            contentHeight: void 0,
            contentWidth: void 0,
            offsetHeight: void 0,
            offsetWidth: void 0
        });
        /**
         * Provides a writable store to track offset & content width / height from an associated `resizeObserver` action.
         */
        const storeResizeObserved = writable(this.resizeObserved);
        this.stores = {
            element: writable(this.el),
            resizeContentHeight: propertyStore(storeResizeObserved, 'contentHeight'),
            resizeContentWidth: propertyStore(storeResizeObserved, 'contentWidth'),
            resizeObserved: storeResizeObserved,
            resizeObservable: writable(false),
            resizeOffsetHeight: propertyStore(storeResizeObserved, 'offsetHeight'),
            resizeOffsetWidth: propertyStore(storeResizeObserved, 'offsetWidth')
        };
    }
    /**
     * Returns the cached offsetHeight from any attached `resizeObserver` action otherwise gets the offsetHeight from
     * the element directly. The more optimized path is using `resizeObserver` as getting it from the element
     * directly is more expensive and alters the execution order of an animation frame.
     *
     * @returns The element offsetHeight.
     */
    get offsetHeight() {
        if (this.el !== void 0 && A11yHelper.isFocusTarget(this.el)) {
            return this.resizeObserved.offsetHeight !== void 0 ? this.resizeObserved.offsetHeight : this.el.offsetHeight;
        }
        throw new Error(`TJSPositionStyleCache - get offsetHeight error: no element assigned.`);
    }
    /**
     * Returns the cached offsetWidth from any attached `resizeObserver` action otherwise gets the offsetWidth from
     * the element directly. The more optimized path is using `resizeObserver` as getting it from the element
     * directly is more expensive and alters the execution order of an animation frame.
     *
     * @returns The element offsetHeight.
     */
    get offsetWidth() {
        if (this.el !== void 0 && A11yHelper.isFocusTarget(this.el)) {
            return this.resizeObserved.offsetWidth !== void 0 ? this.resizeObserved.offsetWidth : this.el.offsetWidth;
        }
        throw new Error(`TJSPositionStyleCache - get offsetWidth error: no element assigned.`);
    }
    /**
     * @param el -
     *
     * @returns Does element match cached element.
     */
    hasData(el) { return this.el === el; }
    /**
     * Resets the style cache.
     */
    reset() {
        // Remove will-change inline style from previous element if it is still connected.
        if (this.el !== void 0 && A11yHelper.isFocusTarget(this.el) && this.el.isConnected && !this.hasWillChange) {
            this.el.style.willChange = '';
        }
        this.el = void 0;
        this.computed = void 0;
        this.marginLeft = void 0;
        this.marginTop = void 0;
        this.maxHeight = void 0;
        this.maxWidth = void 0;
        this.minHeight = void 0;
        this.minWidth = void 0;
        this.hasWillChange = false;
        // Silently reset `resizedObserved`; With proper usage the `resizeObserver` action issues an update on removal.
        this.resizeObserved.contentHeight = void 0;
        this.resizeObserved.contentWidth = void 0;
        this.resizeObserved.offsetHeight = void 0;
        this.resizeObserved.offsetWidth = void 0;
        // Reset the tracked element this TJSPosition instance is modifying.
        this.stores.element.set(void 0);
    }
    /**
     * Updates the style cache with new data from the given element.
     *
     * @param el - An HTML element.
     */
    update(el) {
        this.el = el;
        this.computed = globalThis.getComputedStyle(el);
        this.marginLeft = StyleParse.pixels(el.style.marginLeft) ?? StyleParse.pixels(this.computed.marginLeft);
        this.marginTop = StyleParse.pixels(el.style.marginTop) ?? StyleParse.pixels(this.computed.marginTop);
        this.maxHeight = StyleParse.pixels(el.style.maxHeight) ?? StyleParse.pixels(this.computed.maxHeight);
        this.maxWidth = StyleParse.pixels(el.style.maxWidth) ?? StyleParse.pixels(this.computed.maxWidth);
        // Note that the computed styles for below will always be 0px / 0 when no style is active.
        this.minHeight = StyleParse.pixels(el.style.minHeight) ?? StyleParse.pixels(this.computed.minHeight);
        this.minWidth = StyleParse.pixels(el.style.minWidth) ?? StyleParse.pixels(this.computed.minWidth);
        // Tracks if there already is a will-change property on the inline or computed styles.
        const willChange = el.style.willChange !== '' ? el.style.willChange : this.computed.willChange ?? '';
        this.hasWillChange = willChange !== '' && willChange !== 'auto';
        // Update the tracked element this TJSPosition instance is modifying.
        this.stores.element.set(el);
    }
}

/**
 *
 */
class TJSTransforms {
    /**
     * Stores transform data.
     */
    #data = {};
    /**
     * Stores the transform keys in the order added.
     */
    #orderList = [];
    /**
     * Defines the keys of TJSPositionData that are transform keys.
     */
    static #transformKeys = Object.freeze([
        'rotateX', 'rotateY', 'rotateZ', 'scale', 'translateX', 'translateY', 'translateZ'
    ]);
    /**
     * Validates that a given key is a transform key.
     *
     * @param key - A potential transform key.
     */
    static #isTransformKey(key) {
        return this.#transformKeys.includes(key);
    }
    /**
     * Defines bitwise keys for transforms used in {@link TJSTransforms.getMat4}.
     */
    static #transformKeysBitwise = Object.freeze({
        rotateX: 1,
        rotateY: 2,
        rotateZ: 4,
        scale: 8,
        translateX: 16,
        translateY: 32,
        translateZ: 64
    });
    /**
     * Defines the default transform origin.
     */
    static #transformOriginDefault = 'top left';
    /**
     * Defines the valid transform origins.
     */
    static #transformOrigins = Object.freeze([
        'top left', 'top center', 'top right', 'center left', 'center', 'center right', 'bottom left', 'bottom center',
        'bottom right'
    ]);
    /**
     * Defines a valid Set of transform origins.
     */
    static #transformOriginsSet = Object.freeze(new Set(this.#transformOrigins));
    // Temporary variables --------------------------------------------------------------------------------------------
    /**
     */
    static #mat4Result = new Mat4();
    /**
     */
    static #mat4Temp = new Mat4();
    /**
     */
    static #vec3Temp = new Vec3();
    /**
     */
    static #vectorScale = [1, 1, 1];
    /**
     */
    static #vectorTranslate = [0, 0, 0];
    /**
     * Returns a list of supported transform origins.
     *
     * @returns The supported transform origin strings.
     */
    static get transformOrigins() {
        return this.#transformOrigins;
    }
    /**
     * Returns whether the given string is a {@link TransformAPI.TransformOrigin}.
     *
     * @param origin - A potential transform origin string.
     *
     * @returns True if origin is a TransformOrigin string.
     */
    static isTransformOrigin(origin) {
        return this.#transformOriginsSet.has(origin);
    }
    /**
     * @returns Whether there are active transforms in local data.
     */
    get isActive() { return this.#orderList.length > 0; }
    /**
     * @returns Any local rotateX data.
     */
    get rotateX() { return this.#data.rotateX; }
    /**
     * @returns Any local rotateY data.
     */
    get rotateY() { return this.#data.rotateY; }
    /**
     * @returns Any local rotateZ data.
     */
    get rotateZ() { return this.#data.rotateZ; }
    /**
     * @returns Any local rotateZ scale.
     */
    get scale() { return this.#data.scale; }
    /**
     * @returns Any local translateZ data.
     */
    get translateX() { return this.#data.translateX; }
    /**
     * @returns Any local translateZ data.
     */
    get translateY() { return this.#data.translateY; }
    /**
     * @returns Any local translateZ data.
     */
    get translateZ() { return this.#data.translateZ; }
    /**
     * Sets the local rotateX data if the value is a finite number otherwise removes the local data.
     *
     * @param value - A value to set.
     */
    set rotateX(value) {
        if (Number.isFinite(value)) {
            if (this.#data.rotateX === void 0) {
                this.#orderList.push('rotateX');
            }
            this.#data.rotateX = value;
        }
        else {
            if (this.#data.rotateX !== void 0) {
                const index = this.#orderList.findIndex((entry) => entry === 'rotateX');
                if (index >= 0) {
                    this.#orderList.splice(index, 1);
                }
            }
            delete this.#data.rotateX;
        }
    }
    /**
     * Sets the local rotateY data if the value is a finite number otherwise removes the local data.
     *
     * @param value - A value to set.
     */
    set rotateY(value) {
        if (Number.isFinite(value)) {
            if (this.#data.rotateY === void 0) {
                this.#orderList.push('rotateY');
            }
            this.#data.rotateY = value;
        }
        else {
            if (this.#data.rotateY !== void 0) {
                const index = this.#orderList.findIndex((entry) => entry === 'rotateY');
                if (index >= 0) {
                    this.#orderList.splice(index, 1);
                }
            }
            delete this.#data.rotateY;
        }
    }
    /**
     * Sets the local rotateZ data if the value is a finite number otherwise removes the local data.
     *
     * @param value - A value to set.
     */
    set rotateZ(value) {
        if (Number.isFinite(value)) {
            if (this.#data.rotateZ === void 0) {
                this.#orderList.push('rotateZ');
            }
            this.#data.rotateZ = value;
        }
        else {
            if (this.#data.rotateZ !== void 0) {
                const index = this.#orderList.findIndex((entry) => entry === 'rotateZ');
                if (index >= 0) {
                    this.#orderList.splice(index, 1);
                }
            }
            delete this.#data.rotateZ;
        }
    }
    /**
     * Sets the local scale data if the value is a finite number otherwise removes the local data.
     *
     * @param value - A value to set.
     */
    set scale(value) {
        if (Number.isFinite(value)) {
            if (this.#data.scale === void 0) {
                this.#orderList.push('scale');
            }
            this.#data.scale = value;
        }
        else {
            if (this.#data.scale !== void 0) {
                const index = this.#orderList.findIndex((entry) => entry === 'scale');
                if (index >= 0) {
                    this.#orderList.splice(index, 1);
                }
            }
            delete this.#data.scale;
        }
    }
    /**
     * Sets the local translateX data if the value is a finite number otherwise removes the local data.
     *
     * @param value - A value to set.
     */
    set translateX(value) {
        if (Number.isFinite(value)) {
            if (this.#data.translateX === void 0) {
                this.#orderList.push('translateX');
            }
            this.#data.translateX = value;
        }
        else {
            if (this.#data.translateX !== void 0) {
                const index = this.#orderList.findIndex((entry) => entry === 'translateX');
                if (index >= 0) {
                    this.#orderList.splice(index, 1);
                }
            }
            delete this.#data.translateX;
        }
    }
    /**
     * Sets the local translateY data if the value is a finite number otherwise removes the local data.
     *
     * @param value - A value to set.
     */
    set translateY(value) {
        if (Number.isFinite(value)) {
            if (this.#data.translateY === void 0) {
                this.#orderList.push('translateY');
            }
            this.#data.translateY = value;
        }
        else {
            if (this.#data.translateY !== void 0) {
                const index = this.#orderList.findIndex((entry) => entry === 'translateY');
                if (index >= 0) {
                    this.#orderList.splice(index, 1);
                }
            }
            delete this.#data.translateY;
        }
    }
    /**
     * Sets the local translateZ data if the value is a finite number otherwise removes the local data.
     *
     * @param value - A value to set.
     */
    set translateZ(value) {
        if (Number.isFinite(value)) {
            if (this.#data.translateZ === void 0) {
                this.#orderList.push('translateZ');
            }
            this.#data.translateZ = value;
        }
        else {
            if (this.#data.translateZ !== void 0) {
                const index = this.#orderList.findIndex((entry) => entry === 'translateZ');
                if (index >= 0) {
                    this.#orderList.splice(index, 1);
                }
            }
            delete this.#data.translateZ;
        }
    }
    /**
     * Returns the `matrix3d` CSS transform for the given position / transform data.
     *
     * @param [data] - Optional position data otherwise use local stored transform data.
     *
     * @returns The CSS `matrix3d` string.
     */
    getCSS(data = this.#data) {
        return `matrix3d(${this.getMat4(data, TJSTransforms.#mat4Result).join(',')})`;
    }
    /**
     * Returns the `matrix3d` CSS transform for the given position / transform data.
     *
     * @param [data] - Optional position data otherwise use local stored transform data.
     *
     * @returns The CSS `matrix3d` string.
     */
    getCSSOrtho(data = this.#data) {
        return `matrix3d(${this.getMat4Ortho(data, TJSTransforms.#mat4Result).join(',')})`;
    }
    /**
     * Collects all data including a bounding rect, transform matrix, and points array of the given
     * {@link TJSPositionData} instance with the applied local transform data.
     *
     * @param position - The position data to process.
     *
     * @param [output] - Optional TJSTransformData output instance.
     *
     * @param [validationData] - Optional validation data for adjustment parameters.
     *
     * @returns The output TJSTransformData instance.
     */
    getData(position, output = new TJSTransformData(), validationData) {
        const valWidth = validationData?.width ?? 0;
        const valHeight = validationData?.height ?? 0;
        const valOffsetTop = validationData?.offsetTop ?? validationData?.marginTop ?? 0;
        const valOffsetLeft = validationData?.offsetLeft ?? validationData?.marginLeft ?? 0;
        position.top += valOffsetTop;
        position.left += valOffsetLeft;
        const width = NumberGuard.isFinite(position.width) ? position.width : valWidth;
        const height = NumberGuard.isFinite(position.height) ? position.height : valHeight;
        const rect = output.corners;
        if (this.hasTransform(position)) {
            rect[0][0] = rect[0][1] = rect[0][2] = 0;
            rect[1][0] = width;
            rect[1][1] = rect[1][2] = 0;
            rect[2][0] = width;
            rect[2][1] = height;
            rect[2][2] = 0;
            rect[3][0] = 0;
            rect[3][1] = height;
            rect[3][2] = 0;
            const matrix = this.getMat4(position, output.mat4);
            const translate = TJSTransforms.#getOriginTranslation(position.transformOrigin, width, height, output.originTranslations);
            if (TJSTransforms.#transformOriginDefault === position.transformOrigin) {
                Vec3.transformMat4(rect[0], rect[0], matrix);
                Vec3.transformMat4(rect[1], rect[1], matrix);
                Vec3.transformMat4(rect[2], rect[2], matrix);
                Vec3.transformMat4(rect[3], rect[3], matrix);
            }
            else {
                Vec3.transformMat4(rect[0], rect[0], translate[0]);
                Vec3.transformMat4(rect[0], rect[0], matrix);
                Vec3.transformMat4(rect[0], rect[0], translate[1]);
                Vec3.transformMat4(rect[1], rect[1], translate[0]);
                Vec3.transformMat4(rect[1], rect[1], matrix);
                Vec3.transformMat4(rect[1], rect[1], translate[1]);
                Vec3.transformMat4(rect[2], rect[2], translate[0]);
                Vec3.transformMat4(rect[2], rect[2], matrix);
                Vec3.transformMat4(rect[2], rect[2], translate[1]);
                Vec3.transformMat4(rect[3], rect[3], translate[0]);
                Vec3.transformMat4(rect[3], rect[3], matrix);
                Vec3.transformMat4(rect[3], rect[3], translate[1]);
            }
            rect[0][0] = position.left + rect[0][0];
            rect[0][1] = position.top + rect[0][1];
            rect[1][0] = position.left + rect[1][0];
            rect[1][1] = position.top + rect[1][1];
            rect[2][0] = position.left + rect[2][0];
            rect[2][1] = position.top + rect[2][1];
            rect[3][0] = position.left + rect[3][0];
            rect[3][1] = position.top + rect[3][1];
        }
        else {
            rect[0][0] = position.left;
            rect[0][1] = position.top;
            rect[1][0] = position.left + width;
            rect[1][1] = position.top;
            rect[2][0] = position.left + width;
            rect[2][1] = position.top + height;
            rect[3][0] = position.left;
            rect[3][1] = position.top + height;
            Mat4.identity(output.mat4);
        }
        let maxX = Number.MIN_SAFE_INTEGER;
        let maxY = Number.MIN_SAFE_INTEGER;
        let minX = Number.MAX_SAFE_INTEGER;
        let minY = Number.MAX_SAFE_INTEGER;
        for (let cntr = 4; --cntr >= 0;) {
            if (rect[cntr][0] > maxX) {
                maxX = rect[cntr][0];
            }
            if (rect[cntr][0] < minX) {
                minX = rect[cntr][0];
            }
            if (rect[cntr][1] > maxY) {
                maxY = rect[cntr][1];
            }
            if (rect[cntr][1] < minY) {
                minY = rect[cntr][1];
            }
        }
        const boundingRect = output.boundingRect;
        boundingRect.x = minX;
        boundingRect.y = minY;
        boundingRect.width = maxX - minX;
        boundingRect.height = maxY - minY;
        position.top -= valOffsetTop;
        position.left -= valOffsetLeft;
        return output;
    }
    /**
     * Creates a transform matrix based on local data applied in order it was added.
     *
     * If no data object is provided then the source is the local transform data. If another data object is supplied
     * then the stored local transform order is applied then all remaining transform keys are applied. This allows the
     * construction of a transform matrix in advance of setting local data and is useful in collision detection.
     *
     * @param [data] - TJSPositionData instance or local transform data.
     *
     * @param [output] - The output mat4 instance.
     *
     * @returns Transform matrix.
     */
    getMat4(data = this.#data, output = new Mat4()) {
        const matrix = Mat4.identity(output);
        // Bitwise tracks applied transform keys from local transform data.
        let seenKeys = 0;
        const orderList = this.#orderList;
        // First apply ordered transforms from local transform data.
        for (let cntr = 0; cntr < orderList.length; cntr++) {
            const key = orderList[cntr];
            switch (key) {
                case 'rotateX':
                    seenKeys |= TJSTransforms.#transformKeysBitwise.rotateX;
                    Mat4.multiply(matrix, matrix, Mat4.fromXRotation(TJSTransforms.#mat4Temp, degToRad(data[key] ?? 0)));
                    break;
                case 'rotateY':
                    seenKeys |= TJSTransforms.#transformKeysBitwise.rotateY;
                    Mat4.multiply(matrix, matrix, Mat4.fromYRotation(TJSTransforms.#mat4Temp, degToRad(data[key] ?? 0)));
                    break;
                case 'rotateZ':
                    seenKeys |= TJSTransforms.#transformKeysBitwise.rotateZ;
                    Mat4.multiply(matrix, matrix, Mat4.fromZRotation(TJSTransforms.#mat4Temp, degToRad(data[key] ?? 0)));
                    break;
                case 'scale':
                    seenKeys |= TJSTransforms.#transformKeysBitwise.scale;
                    TJSTransforms.#vectorScale[0] = TJSTransforms.#vectorScale[1] = data[key] ?? 0;
                    Mat4.multiply(matrix, matrix, Mat4.fromScaling(TJSTransforms.#mat4Temp, TJSTransforms.#vectorScale));
                    break;
                case 'translateX':
                    seenKeys |= TJSTransforms.#transformKeysBitwise.translateX;
                    TJSTransforms.#vectorTranslate[0] = data.translateX ?? 0;
                    TJSTransforms.#vectorTranslate[1] = 0;
                    TJSTransforms.#vectorTranslate[2] = 0;
                    Mat4.multiply(matrix, matrix, Mat4.fromTranslation(TJSTransforms.#mat4Temp, TJSTransforms.#vectorTranslate));
                    break;
                case 'translateY':
                    seenKeys |= TJSTransforms.#transformKeysBitwise.translateY;
                    TJSTransforms.#vectorTranslate[0] = 0;
                    TJSTransforms.#vectorTranslate[1] = data.translateY ?? 0;
                    TJSTransforms.#vectorTranslate[2] = 0;
                    Mat4.multiply(matrix, matrix, Mat4.fromTranslation(TJSTransforms.#mat4Temp, TJSTransforms.#vectorTranslate));
                    break;
                case 'translateZ':
                    seenKeys |= TJSTransforms.#transformKeysBitwise.translateZ;
                    TJSTransforms.#vectorTranslate[0] = 0;
                    TJSTransforms.#vectorTranslate[1] = 0;
                    TJSTransforms.#vectorTranslate[2] = data.translateZ ?? 0;
                    Mat4.multiply(matrix, matrix, Mat4.fromTranslation(TJSTransforms.#mat4Temp, TJSTransforms.#vectorTranslate));
                    break;
            }
        }
        // Now apply any new keys not set in local transform data that have not been applied yet.
        if (data !== this.#data) {
            for (let cntr = 0; cntr < TJSTransforms.#transformKeys.length; cntr++) {
                const key = TJSTransforms.#transformKeys[cntr];
                // Reject bad / no data or if the key has already been applied.
                if (data[key] === null || (seenKeys & TJSTransforms.#transformKeysBitwise[key]) > 0) {
                    continue;
                }
                const value = data[key];
                switch (key) {
                    case 'rotateX':
                        Mat4.multiply(matrix, matrix, Mat4.fromXRotation(TJSTransforms.#mat4Temp, degToRad(value)));
                        break;
                    case 'rotateY':
                        Mat4.multiply(matrix, matrix, Mat4.fromYRotation(TJSTransforms.#mat4Temp, degToRad(value)));
                        break;
                    case 'rotateZ':
                        Mat4.multiply(matrix, matrix, Mat4.fromZRotation(TJSTransforms.#mat4Temp, degToRad(value)));
                        break;
                    case 'scale':
                        TJSTransforms.#vectorScale[0] = TJSTransforms.#vectorScale[1] = value;
                        Mat4.multiply(matrix, matrix, Mat4.fromScaling(TJSTransforms.#mat4Temp, TJSTransforms.#vectorScale));
                        break;
                    case 'translateX':
                        TJSTransforms.#vectorTranslate[0] = value;
                        TJSTransforms.#vectorTranslate[1] = 0;
                        TJSTransforms.#vectorTranslate[2] = 0;
                        Mat4.multiply(matrix, matrix, Mat4.fromTranslation(TJSTransforms.#mat4Temp, TJSTransforms.#vectorTranslate));
                        break;
                    case 'translateY':
                        TJSTransforms.#vectorTranslate[0] = 0;
                        TJSTransforms.#vectorTranslate[1] = value;
                        TJSTransforms.#vectorTranslate[2] = 0;
                        Mat4.multiply(matrix, matrix, Mat4.fromTranslation(TJSTransforms.#mat4Temp, TJSTransforms.#vectorTranslate));
                        break;
                    case 'translateZ':
                        TJSTransforms.#vectorTranslate[0] = 0;
                        TJSTransforms.#vectorTranslate[1] = 0;
                        TJSTransforms.#vectorTranslate[2] = value;
                        Mat4.multiply(matrix, matrix, Mat4.fromTranslation(TJSTransforms.#mat4Temp, TJSTransforms.#vectorTranslate));
                        break;
                }
            }
        }
        return matrix;
    }
    /**
     * Provides an orthographic enhancement to convert left / top positional data to a translate operation.
     *
     * This transform matrix takes into account that the remaining operations are , but adds any left / top attributes
     * from passed in data to translate X / Y.
     *
     * If no data object is provided then the source is the local transform data. If another data object is supplied
     * then the stored local transform order is applied then all remaining transform keys are applied. This allows the
     * construction of a transform matrix in advance of setting local data and is useful in collision detection.
     *
     * @param [data] - TJSPositionData instance or local transform data.
     *
     * @param [output] - The output mat4 instance.
     *
     * @returns Transform matrix.
     */
    getMat4Ortho(data = this.#data, output = new Mat4()) {
        const matrix = Mat4.identity(output);
        // Attempt to retrieve values from passed in data otherwise default to 0.
        // Always perform the translation last regardless of order added to local transform data.
        // Add data.left to translateX and data.top to translateY.
        TJSTransforms.#vectorTranslate[0] = (data.left ?? 0) + (data.translateX ?? 0);
        TJSTransforms.#vectorTranslate[1] = (data.top ?? 0) + (data.translateY ?? 0);
        TJSTransforms.#vectorTranslate[2] = data.translateZ ?? 0;
        Mat4.multiply(matrix, matrix, Mat4.fromTranslation(TJSTransforms.#mat4Temp, TJSTransforms.#vectorTranslate));
        // Scale can also be applied out of order.
        if (data.scale !== null && data.scale !== void 0) {
            TJSTransforms.#vectorScale[0] = TJSTransforms.#vectorScale[1] = data.scale;
            Mat4.multiply(matrix, matrix, Mat4.fromScaling(TJSTransforms.#mat4Temp, TJSTransforms.#vectorScale));
        }
        // Early out if there is no rotation data.
        if (data.rotateX === null && data.rotateY === null && data.rotateZ === null) {
            return matrix;
        }
        // Rotation transforms must be applied in the order they are added.
        // Bitwise tracks applied transform keys from local transform data.
        let seenKeys = 0;
        const orderList = this.#orderList;
        // First apply ordered transforms from local transform data.
        for (let cntr = 0; cntr < orderList.length; cntr++) {
            const key = orderList[cntr];
            switch (key) {
                case 'rotateX':
                    seenKeys |= TJSTransforms.#transformKeysBitwise.rotateX;
                    Mat4.multiply(matrix, matrix, Mat4.fromXRotation(TJSTransforms.#mat4Temp, degToRad(data[key] ?? 0)));
                    break;
                case 'rotateY':
                    seenKeys |= TJSTransforms.#transformKeysBitwise.rotateY;
                    Mat4.multiply(matrix, matrix, Mat4.fromYRotation(TJSTransforms.#mat4Temp, degToRad(data[key] ?? 0)));
                    break;
                case 'rotateZ':
                    seenKeys |= TJSTransforms.#transformKeysBitwise.rotateZ;
                    Mat4.multiply(matrix, matrix, Mat4.fromZRotation(TJSTransforms.#mat4Temp, degToRad(data[key] ?? 0)));
                    break;
            }
        }
        // Now apply any new keys not set in local transform data that have not been applied yet.
        if (data !== this.#data) {
            for (let cntr = 0; cntr < TJSTransforms.#transformKeys.length; cntr++) {
                const key = TJSTransforms.#transformKeys[cntr];
                // Reject bad / no data or if the key has already been applied.
                if (data[key] === null || (seenKeys & TJSTransforms.#transformKeysBitwise[key]) > 0) {
                    continue;
                }
                switch (key) {
                    case 'rotateX':
                        Mat4.multiply(matrix, matrix, Mat4.fromXRotation(TJSTransforms.#mat4Temp, degToRad(data[key] ?? 0)));
                        break;
                    case 'rotateY':
                        Mat4.multiply(matrix, matrix, Mat4.fromYRotation(TJSTransforms.#mat4Temp, degToRad(data[key] ?? 0)));
                        break;
                    case 'rotateZ':
                        Mat4.multiply(matrix, matrix, Mat4.fromZRotation(TJSTransforms.#mat4Temp, degToRad(data[key] ?? 0)));
                        break;
                }
            }
        }
        return matrix;
    }
    /**
     * Tests an object if it contains transform keys and the values are finite numbers.
     *
     * @param data - An object to test for transform data.
     *
     * @returns Whether the given TJSPositionData has transforms.
     */
    hasTransform(data) {
        for (const key of TJSTransforms.#transformKeys) {
            if (Number.isFinite(data[key])) {
                return true;
            }
        }
        return false;
    }
    /**
     * Resets internal data from the given object containing valid transform keys.
     *
     * @param data - An object with transform data.
     */
    reset(data) {
        for (const key in data) {
            if (TJSTransforms.#isTransformKey(key)) {
                const value = data[key];
                if (NumberGuard.isFinite(value)) {
                    this.#data[key] = value;
                }
                else {
                    const index = this.#orderList.findIndex((entry) => entry === key);
                    if (index >= 0) {
                        this.#orderList.splice(index, 1);
                    }
                    delete this.#data[key];
                }
            }
        }
    }
    // Internal implementation ----------------------------------------------------------------------------------------
    /**
     * Returns the translations necessary to translate a matrix operation based on the `transformOrigin` parameter of the
     * given position instance. The first entry / index 0 is the pre-translation and last entry / index 1 is the post-
     * translation.
     *
     * This method is used internally, but may be useful if you need the origin translation matrices to transform
     * bespoke points based on any `transformOrigin` set in {@link TJSPositionData}.
     *
     * @param transformOrigin - The transform origin attribute from TJSPositionData.
     *
     * @param width - The TJSPositionData width or validation data width when 'auto'.
     *
     * @param height - The TJSPositionData height or validation data height when 'auto'.
     *
     * @param output - Output Mat4 array.
     *
     * @returns Output Mat4 array.
     */
    static #getOriginTranslation(transformOrigin, width, height, output) {
        const vector = TJSTransforms.#vec3Temp;
        switch (transformOrigin) {
            case 'top left':
                vector[0] = vector[1] = 0;
                Mat4.fromTranslation(output[0], vector);
                Mat4.fromTranslation(output[1], vector);
                break;
            case 'top center':
                vector[0] = -width * 0.5;
                vector[1] = 0;
                Mat4.fromTranslation(output[0], vector);
                vector[0] = width * 0.5;
                Mat4.fromTranslation(output[1], vector);
                break;
            case 'top right':
                vector[0] = -width;
                vector[1] = 0;
                Mat4.fromTranslation(output[0], vector);
                vector[0] = width;
                Mat4.fromTranslation(output[1], vector);
                break;
            case 'center left':
                vector[0] = 0;
                vector[1] = -height * 0.5;
                Mat4.fromTranslation(output[0], vector);
                vector[1] = height * 0.5;
                Mat4.fromTranslation(output[1], vector);
                break;
            // By default, null / no transform is 'center'.
            case null:
            case 'center':
                vector[0] = -width * 0.5;
                vector[1] = -height * 0.5;
                Mat4.fromTranslation(output[0], vector);
                vector[0] = width * 0.5;
                vector[1] = height * 0.5;
                Mat4.fromTranslation(output[1], vector);
                break;
            case 'center right':
                vector[0] = -width;
                vector[1] = -height * 0.5;
                Mat4.fromTranslation(output[0], vector);
                vector[0] = width;
                vector[1] = height * 0.5;
                Mat4.fromTranslation(output[1], vector);
                break;
            case 'bottom left':
                vector[0] = 0;
                vector[1] = -height;
                Mat4.fromTranslation(output[0], vector);
                vector[1] = height;
                Mat4.fromTranslation(output[1], vector);
                break;
            case 'bottom center':
                vector[0] = -width * 0.5;
                vector[1] = -height;
                Mat4.fromTranslation(output[0], vector);
                vector[0] = width * 0.5;
                vector[1] = height;
                Mat4.fromTranslation(output[1], vector);
                break;
            case 'bottom right':
                vector[0] = -width;
                vector[1] = -height;
                Mat4.fromTranslation(output[0], vector);
                vector[0] = width;
                vector[1] = height;
                Mat4.fromTranslation(output[1], vector);
                break;
            // No valid transform origin parameter; set identity.
            default:
                Mat4.identity(output[0]);
                Mat4.identity(output[1]);
                break;
        }
        return output;
    }
}

class AnimationScheduler {
    /**
     * Used to copy data from a TJSPosition instance.
     */
    static #data = {};
    static #getEaseOptions = Object.freeze({ default: false });
    /**
     * Adds / schedules an animation w/ the AnimationManager. This contains the final steps common to all tweens.
     *
     * @param position -
     *
     * @param initial -
     *
     * @param destination -
     *
     * @param duration -
     *
     * @param el -
     *
     * @param delay -
     *
     * @param ease -
     *
     * @param [interpolate=lerp] -
     *
     * @param [transformOrigin] -
     *
     * @param [transformOriginInitial] -
     *
     * @param [cleanup] -
     *
     * @returns An AnimationControl instance or null if none created.
     */
    static #addAnimation(position, initial, destination, duration, el, delay, ease, interpolate = lerp, transformOrigin, transformOriginInitial, cleanup) {
        // Set initial data for transform values that are often null by default.
        TJSPositionDataUtil.setNumericDefaults(initial);
        TJSPositionDataUtil.setNumericDefaults(destination);
        // Reject all initial data that is not a number.
        for (const key in initial) {
            if (!Number.isFinite(initial[key])) {
                delete initial[key];
            }
        }
        const keys = Object.keys(initial);
        const newData = Object.assign({}, initial);
        // Nothing to animate, so return now.
        // TODO handle in respective animation controls.
        if (keys.length === 0) {
            return null;
        }
        /**
         */
        const animationData = {
            active: true,
            cleanup,
            cancelled: false,
            control: void 0,
            current: 0,
            destination,
            duration: duration * 1000, // Internally the AnimationManager works in ms.
            ease,
            el,
            finished: false,
            initial,
            interpolate,
            keys,
            newData,
            position,
            resolve: void 0,
            start: void 0,
            transformOrigin,
            transformOriginInitial,
            quickTo: false
        };
        if (delay > 0) {
            animationData.active = false;
            // Delay w/ setTimeout and make active w/ AnimationManager.
            setTimeout(() => animationData.active = true, delay * 1000);
        }
        // Schedule immediately w/ AnimationManager
        AnimationManager.add(animationData);
        // Create animation control
        return new AnimationControl(animationData, true);
    }
    /**
     * Provides a tween from given position data to the current position.
     *
     * @param position - The target position instance.
     *
     * @param fromData - The starting position.
     *
     * @param options - Tween options.
     *
     * @param [cleanup] - Custom animation cleanup function.
     *
     * @returns An AnimationControl instance or null if none created.
     */
    static from(position, fromData, options = {}, cleanup) {
        if (!isObject(fromData)) {
            throw new TypeError(`AnimationAPI.from error: 'fromData' is not an object.`);
        }
        // TJSPositionNS.PositionParent
        const parent = position.parent;
        // Early out if the application is not positionable.  TODO: THIS IS REFERENCING APPLICATION OPTIONS.
        if (parent !== void 0 && typeof parent?.options?.positionable === 'boolean' && !parent?.options?.positionable) {
            return null;
        }
        let { delay = 0, duration = 1, ease = 'cubicOut', strategy, transformOrigin } = options;
        // Handle any defined scheduling strategy.
        if (strategy !== void 0) {
            if (this.#handleStrategy(position, strategy) === null) {
                return null;
            }
        }
        // Cache any target element allowing AnimationManager to stop animation if it becomes disconnected from DOM.
        const targetEl = A11yHelper.isFocusTarget(parent) ? parent : parent?.elementTarget;
        const el = A11yHelper.isFocusTarget(targetEl) && targetEl.isConnected ? targetEl :
            void 0;
        if (!Number.isFinite(delay) || delay < 0) {
            throw new TypeError(`AnimationScheduler.from error: 'delay' is not a positive number.`);
        }
        if (!Number.isFinite(duration) || duration < 0) {
            throw new TypeError(`AnimationScheduler.from error: 'duration' is not a positive number.`);
        }
        ease = getEasingFunc(ease, this.#getEaseOptions);
        if (typeof ease !== 'function') {
            throw new TypeError(`AnimationScheduler.from error: 'ease' is not a function or valid Svelte easing function name.`);
        }
        // TODO: In the future potentially support more interpolation functions besides `lerp`.
        const initial = {};
        const destination = {};
        position.get(this.#data);
        // Determine if any transform origin for the animation is valid.
        transformOrigin = TJSTransforms.isTransformOrigin(transformOrigin) ? transformOrigin : void 0;
        // Given a valid transform origin store the initial transform origin to be restored.
        const transformOriginInitial = transformOrigin !== void 0 ?
            this.#data.transformOrigin : void 0;
        // Set initial data if the key / data is defined and the end position is not equal to current data.
        for (const key in fromData) {
            // Must use actual key from any aliases.
            const animKey = TJSPositionDataUtil.getAnimationKey(key);
            if (this.#data[animKey] !== void 0 && fromData[key] !== this.#data[animKey]) {
                initial[key] = fromData[key];
                destination[key] = this.#data[animKey];
            }
        }
        ConvertStringData.process(initial, this.#data, el);
        return this.#addAnimation(position, initial, destination, duration, el, delay, ease, lerp, transformOrigin, transformOriginInitial, cleanup);
    }
    /**
     * Provides a tween from given position data to the given position.
     *
     * @param position - The target position instance.
     *
     * @param fromData - The starting position.
     *
     * @param toData - The ending position.
     *
     * @param options - Tween options.
     *
     * @param [cleanup] - Custom animation cleanup function.
     *
     * @returns An AnimationControl instance or null if none created.
     */
    static fromTo(position, fromData, toData, options = {}, cleanup) {
        if (!isObject(fromData)) {
            throw new TypeError(`AnimationScheduler.fromTo error: 'fromData' is not an object.`);
        }
        if (!isObject(toData)) {
            throw new TypeError(`AnimationScheduler.fromTo error: 'toData' is not an object.`);
        }
        // TJSPositionNS.PositionParent
        const parent = position.parent;
        // Early out if the application is not positionable.  TODO: THIS IS REFERENCING APPLICATION OPTIONS.
        if (parent !== void 0 && typeof parent?.options?.positionable === 'boolean' && !parent?.options?.positionable) {
            return null;
        }
        let { delay = 0, duration = 1, ease = 'cubicOut', strategy, transformOrigin } = options;
        // Handle any defined scheduling strategy.
        if (strategy !== void 0) {
            if (this.#handleStrategy(position, strategy) === null) {
                return null;
            }
        }
        // Cache any target element allowing AnimationManager to stop animation if it becomes disconnected from DOM.
        const targetEl = A11yHelper.isFocusTarget(parent) ? parent : parent?.elementTarget;
        const el = A11yHelper.isFocusTarget(targetEl) && targetEl.isConnected ? targetEl :
            void 0;
        if (!Number.isFinite(delay) || delay < 0) {
            throw new TypeError(`AnimationScheduler.fromTo error: 'delay' is not a positive number.`);
        }
        if (!Number.isFinite(duration) || duration < 0) {
            throw new TypeError(`AnimationScheduler.fromTo error: 'duration' is not a positive number.`);
        }
        ease = getEasingFunc(ease, this.#getEaseOptions);
        if (typeof ease !== 'function') {
            throw new TypeError(`AnimationScheduler.fromTo error: 'ease' is not a function or valid Svelte easing function name.`);
        }
        // TODO: In the future potentially support more interpolation functions besides `lerp`.
        const initial = {};
        const destination = {};
        position.get(this.#data);
        // Determine if any transform origin for the animation is valid.
        transformOrigin = TJSTransforms.isTransformOrigin(transformOrigin) ? transformOrigin : void 0;
        // Given a valid transform origin store the initial transform origin to be restored.
        const transformOriginInitial = transformOrigin !== void 0 ?
            this.#data.transformOrigin : void 0;
        // Set initial data if the key / data is defined and the end position is not equal to current data.
        for (const key in fromData) {
            if (toData[key] === void 0) {
                console.warn(`AnimationScheduler.fromTo warning: skipping key ('${key}') from 'fromData' as it is missing in 'toData'.`);
                continue;
            }
            // Must use actual key from any aliases.
            const animKey = TJSPositionDataUtil.getAnimationKey(key);
            if (this.#data[animKey] !== void 0) {
                initial[key] = fromData[key];
                destination[key] = toData[key];
            }
        }
        ConvertStringData.process(initial, this.#data, el);
        ConvertStringData.process(destination, this.#data, el);
        return this.#addAnimation(position, initial, destination, duration, el, delay, ease, lerp, transformOrigin, transformOriginInitial, cleanup);
    }
    /**
     * Provides a tween to given position data from the current position.
     *
     * @param position - The target position instance.
     *
     * @param toData - The destination position.
     *
     * @param options - Tween options.
     *
     * @param [cleanup] - Custom animation cleanup function.
     *
     * @returns An AnimationControl instance or null if none created.
     */
    static to(position, toData, options, cleanup) {
        if (!isObject(toData)) {
            throw new TypeError(`AnimationScheduler.to error: 'toData' is not an object.`);
        }
        // TJSPositionNS.PositionParent
        const parent = position.parent;
        // Early out if the application is not positionable.  TODO: THIS IS REFERENCING APPLICATION OPTIONS.
        if (parent !== void 0 && typeof parent?.options?.positionable === 'boolean' && !parent?.options?.positionable) {
            return null;
        }
        let { delay = 0, duration = 1, ease = 'cubicOut', strategy, transformOrigin } = options;
        // Handle any defined scheduling strategy.
        if (strategy !== void 0) {
            if (this.#handleStrategy(position, strategy) === null) {
                return null;
            }
        }
        // Cache any target element allowing AnimationManager to stop animation if it becomes disconnected from DOM.
        const targetEl = A11yHelper.isFocusTarget(parent) ? parent : parent?.elementTarget;
        const el = A11yHelper.isFocusTarget(targetEl) && targetEl.isConnected ? targetEl : void 0;
        if (!Number.isFinite(delay) || delay < 0) {
            throw new TypeError(`AnimationScheduler.to error: 'delay' is not a positive number.`);
        }
        if (!Number.isFinite(duration) || duration < 0) {
            throw new TypeError(`AnimationScheduler.to error: 'duration' is not a positive number.`);
        }
        ease = getEasingFunc(ease, this.#getEaseOptions);
        if (typeof ease !== 'function') {
            throw new TypeError(`AnimationScheduler.to error: 'ease' is not a function or valid Svelte easing function name.`);
        }
        // TODO: In the future potentially support more interpolation functions besides `lerp`.
        const initial = {};
        const destination = {};
        position.get(this.#data);
        // Determine if any transform origin for the animation is valid.
        transformOrigin = TJSTransforms.isTransformOrigin(transformOrigin) ? transformOrigin : void 0;
        // Given a valid transform origin store the initial transform origin to be restored.
        const transformOriginInitial = transformOrigin !== void 0 ?
            this.#data.transformOrigin : void 0;
        // Set initial data if the key / data is defined and the end position is not equal to current data.
        for (const key in toData) {
            // Must use actual key from any aliases.
            const animKey = TJSPositionDataUtil.getAnimationKey(key);
            if (this.#data[animKey] !== void 0 && toData[key] !== this.#data[animKey]) {
                destination[key] = toData[key];
                initial[key] = this.#data[animKey];
            }
        }
        ConvertStringData.process(destination, this.#data, el);
        return this.#addAnimation(position, initial, destination, duration, el, delay, ease, lerp, transformOrigin, transformOriginInitial, cleanup);
    }
    // Internal implementation ----------------------------------------------------------------------------------------
    /**
     * Handle any defined scheduling strategy allowing existing scheduled animations for the same position instance
     * to be controlled.
     *
     * @param position - The target position instance.
     *
     * @param strategy - A scheduling strategy to apply.
     *
     * @returns Returns null to abort scheduling current animation.
     */
    static #handleStrategy(position, strategy) {
        switch (strategy) {
            case 'cancel':
                if (AnimationManager.isScheduled(position)) {
                    AnimationManager.cancel(position);
                }
                break;
            case 'cancelAll':
                if (AnimationManager.isScheduled(position)) {
                    AnimationManager.cancel(position, AnimationManager.cancelAllFn);
                }
                break;
            case 'exclusive':
                if (AnimationManager.isScheduled(position)) {
                    return null;
                }
                break;
            default:
                console.warn(`AnimationScheduler error: 'strategy' is not 'cancel', 'cancelAll', or 'exclusive'.`);
                return null;
        }
    }
}

/**
 */
class AnimationAPIImpl {
    static #getEaseOptions = Object.freeze({ default: false });
    /**
     */
    #data;
    #position;
    /**
     * @param position -
     *
     * @param data -
     */
    constructor(position, data) {
        this.#position = position;
        this.#data = data;
        Object.seal(this);
    }
    /**
     * Returns if there are scheduled animations whether active or pending for this TJSPosition instance.
     *
     * @returns Are there scheduled animations.
     */
    get isScheduled() {
        return AnimationManager.isScheduled(this.#position);
    }
    /**
     * Cancels all animation instances for this TJSPosition instance.
     */
    cancel() {
        AnimationManager.cancel(this.#position, AnimationManager.cancelAllFn);
    }
    /**
     * Returns all currently scheduled AnimationControl instances for this TJSPosition instance.
     *
     * @returns All currently scheduled animation controls for this TJSPosition instance.
     */
    getScheduled() {
        return AnimationManager.getScheduled(this.#position);
    }
    /**
     * Provides a tween from given position data to the current position.
     *
     * @param fromData - The starting position.
     *
     * @param [options] - Optional tween parameters.
     *
     * @returns A control object that can cancel animation and provides a `finished` Promise.
     */
    from(fromData, options) {
        const animationControl = AnimationScheduler.from(this.#position, fromData, options);
        return animationControl ? animationControl : AnimationControl.voidControl;
    }
    /**
     * Provides a tween from given position data to the given position.
     *
     * @param fromData - The starting position.
     *
     * @param toData - The ending position.
     *
     * @param [options] - Optional tween parameters.
     *
     * @returns A control object that can cancel animation and provides a `finished` Promise.
     */
    fromTo(fromData, toData, options) {
        const animationControl = AnimationScheduler.fromTo(this.#position, fromData, toData, options);
        return animationControl ? animationControl : AnimationControl.voidControl;
    }
    /**
     * Provides a tween to given position data from the current position.
     *
     * @param toData - The destination position.
     *
     * @param [options] - Optional tween parameters.
     *
     * @returns A control object that can cancel animation and provides a `finished` Promise.
     */
    to(toData, options) {
        const animationControl = AnimationScheduler.to(this.#position, toData, options);
        return animationControl ? animationControl : AnimationControl.voidControl;
    }
    /**
     * Returns a function that provides an optimized way to constantly update a to-tween.
     *
     * @param keys - The keys for quickTo.
     *
     * @param [options] - Optional quick tween parameters.
     *
     * @returns quick-to tween function.
     */
    quickTo(keys, options = {}) {
        if (!isIterable(keys)) {
            throw new TypeError(`AnimationAPI.quickTo error: 'keys' is not an iterable list.`);
        }
        // TJSPosition.PositionParent
        const parent = this.#position.parent;
        // Early out if the application is not positionable.
        if (parent !== void 0 && typeof parent?.options?.positionable === 'boolean' && !parent?.options?.positionable) {
            throw new Error(`AnimationAPI.quickTo error: 'parent' is not positionable.`);
        }
        let { duration = 1, ease = 'cubicOut' } = options;
        if (!Number.isFinite(duration) || duration < 0) {
            throw new TypeError(`AnimationAPI.quickTo error: 'duration' is not a positive number.`);
        }
        ease = getEasingFunc(ease, AnimationAPIImpl.#getEaseOptions);
        if (typeof ease !== 'function') {
            throw new TypeError(`AnimationAPI.quickTo error: 'ease' is not a function or valid Svelte easing function name.`);
        }
        // TODO: In the future potentially support more interpolation functions besides `lerp`.
        const initial = {};
        const destination = {};
        const data = this.#data;
        // Set initial data if the key / data is defined and the end position is not equal to current data.
        for (const key of keys) {
            if (typeof key !== 'string') {
                throw new TypeError(`AnimationAPI.quickTo error: key ('${key}') is not a string.`);
            }
            if (!TJSPositionDataUtil.isAnimationKey(key)) {
                throw new Error(`AnimationAPI.quickTo error: key ('${key}') is not animatable.`);
            }
            // Must use actual key from any aliases.
            const value = TJSPositionDataUtil.getDataOrDefault(data, key);
            if (value !== null) {
                destination[key] = value;
                initial[key] = value;
            }
        }
        const keysArray = [...keys];
        Object.freeze(keysArray);
        const newData = Object.assign({}, initial);
        const animationData = {
            active: true,
            cancelled: false,
            control: void 0,
            current: 0,
            destination,
            duration: duration * 1000, // Internally the AnimationManager works in ms.
            ease,
            el: void 0,
            finished: true, // Note: start in finished state to add to AnimationManager on first callback.
            initial,
            interpolate: lerp,
            keys: keysArray,
            newData,
            position: this.#position,
            resolve: void 0,
            start: 0,
            quickTo: true
        };
        const quickToCB = (...args) => {
            const argsLength = args.length;
            if (argsLength === 0) {
                return;
            }
            for (let cntr = keysArray.length; --cntr >= 0;) {
                const key = keysArray[cntr];
                // Must use actual key from any aliases.
                const animKey = TJSPositionDataUtil.getAnimationKey(key);
                if (data[animKey] !== void 0) {
                    initial[key] = data[animKey];
                }
            }
            // Handle case where the first arg is an object. Update all quickTo keys from data contained in the object.
            if (isObject(args[0])) {
                const objData = args[0];
                for (const key in objData) {
                    if (destination[key] !== void 0) {
                        destination[key] = objData[key];
                    }
                }
            }
            else // Assign each variable argument to the key specified in the initial `keys` array above.
             {
                for (let cntr = 0; cntr < argsLength && cntr < keysArray.length; cntr++) {
                    const key = keysArray[cntr];
                    if (destination[key] !== void 0) {
                        destination[key] = args[cntr];
                    }
                }
            }
            // Set initial data for transform values that are often null by default.
            TJSPositionDataUtil.setNumericDefaults(initial);
            TJSPositionDataUtil.setNumericDefaults(destination);
            // Set target element to animation data to track if it is removed from the DOM hence ending the animation.
            const targetEl = A11yHelper.isFocusTarget(parent) ? parent : parent?.elementTarget;
            animationData.el = A11yHelper.isFocusTarget(targetEl) && targetEl.isConnected ? targetEl : void 0;
            ConvertStringData.process(destination, data, animationData.el);
            // Reschedule the quickTo animation with AnimationManager as it is finished.
            if (animationData.finished) {
                animationData.cancelled = false;
                animationData.finished = false;
                animationData.active = true;
                animationData.current = 0;
                AnimationManager.add(animationData);
            }
            else // QuickTo animation is currently scheduled w/ AnimationManager so reset start and current time.
             {
                const now = globalThis.performance.now();
                animationData.cancelled = false;
                animationData.current = 0;
                // Offset start time by delta between last rAF time. This allows a delayed tween to start from the
                // precise delayed time.
                animationData.start = now + (AnimationManager.timeNow - now);
            }
        };
        Object.defineProperty(quickToCB, 'keys', {
            value: keysArray,
            writable: false,
            configurable: false
        });
        Object.defineProperty(quickToCB, 'options', {
            value: (optionsCB) => {
                let { duration, ease } = optionsCB;
                if (duration !== void 0 && (!Number.isFinite(duration) || duration < 0)) {
                    throw new TypeError(`AnimationAPI.quickTo.options error: 'duration' is not a positive number.`);
                }
                ease = getEasingFunc(ease, AnimationAPIImpl.#getEaseOptions);
                if (ease !== void 0 && typeof ease !== 'function') {
                    throw new TypeError(`AnimationAPI.quickTo.options error: 'ease' is not a function or valid Svelte easing function name.`);
                }
                // TODO: In the future potentially support more interpolation functions besides `lerp`.
                if (NumberGuard.isFinite(duration) && duration >= 0) {
                    animationData.duration = duration * 1000;
                }
                if (ease) {
                    animationData.ease = ease;
                }
                return quickToCB;
            },
            writable: false,
            configurable: false
        });
        return quickToCB;
    }
}

/**
 * Provides a implementation for a TJSPosition animation for a group of TJSPosition instances.
 */
class AnimationGroupControl {
    /**
     */
    #animationControls;
    /**
     */
    #finishedPromise;
    /**
     * Defines a static empty / void animation control.
     */
    static #voidControl = new AnimationGroupControl(null);
    /**
     * Provides a static void / undefined AnimationGroupControl that is automatically resolved.
     */
    static get voidControl() { return this.#voidControl; }
    /**
     * @param animationControls - A Set of AnimationControl instances.
     */
    constructor(animationControls) {
        this.#animationControls = animationControls;
    }
    /**
     * Get a promise that resolves when all animations are finished.
     *
     * @returns Finished Promise for all animations.
     */
    get finished() {
        const animationControls = this.#animationControls;
        if (!CrossWindow.isPromise(this.#finishedPromise)) {
            if (animationControls === null || animationControls === void 0 || animationControls.size === 0) {
                this.#finishedPromise = Promise.resolve({ cancelled: false });
            }
            else {
                const promises = [];
                for (const animationControl of animationControls) {
                    promises.push(animationControl.finished);
                }
                this.#finishedPromise = Promise.allSettled(promises).then((results) => {
                    // Check if any promises were rejected or resolved with `cancelled: true`.
                    const anyCancelled = results.some((result) => result.status === 'rejected' ||
                        (result.status === 'fulfilled' && result.value.cancelled));
                    // Return a single BasicAnimationState based on the aggregation of individual results.
                    return { cancelled: anyCancelled };
                });
            }
        }
        return this.#finishedPromise;
    }
    /**
     * Returns whether there are active animation instances for this group.
     *
     * Note: a delayed animation may not be started / active yet. Use {@link AnimationGroupControl.isFinished} to
     * determine if all animations in the group are finished.
     *
     * @returns Are there active animation instances.
     */
    get isActive() {
        const animationControls = this.#animationControls;
        if (animationControls === null || animationControls === void 0 || animationControls.size === 0) {
            return false;
        }
        for (const animationControl of animationControls) {
            if (animationControl.isActive) {
                return true;
            }
        }
        return false;
    }
    /**
     * Returns whether all animations in the group are finished.
     *
     * @returns Are all animation instances finished.
     */
    get isFinished() {
        const animationControls = this.#animationControls;
        if (animationControls === null || animationControls === void 0 || animationControls.size === 0) {
            return true;
        }
        for (const animationControl of animationControls) {
            if (!animationControl.isFinished) {
                return false;
            }
        }
        return true;
    }
    /**
     * Cancels the all animations.
     */
    cancel() {
        const animationControls = this.#animationControls;
        if (animationControls === null || animationControls === void 0 || animationControls.size === 0) {
            return;
        }
        for (const animationControl of animationControls) {
            animationControl.cancel();
        }
    }
}

/**
 * Provides a public API for grouping multiple {@link TJSPosition} animations together with the
 * AnimationManager.
 *
 * Note: To remove cyclic dependencies as this class provides the TJSPosition static / group Animation API `instanceof`
 * checks are not done against TJSPosition. Instead, a check for the animate property being an instanceof
 * {@link AnimationAPI} is performed in {@link AnimationGroupAPI.#getPosition}.
 *
 * Note: This is a static class that conforms to the {@link AnimationGroupAPI} interface.
 *
 * @see AnimationAPI
 */
class AnimationGroupAPIImpl {
    constructor() { }
    /**
     * Returns the TJSPosition instance for the possible given positionable by checking the instance by checking for
     * AnimationAPI.
     *
     * @param positionable - Possible position group entry.
     *
     * @returns Returns actual TJSPosition instance.
     */
    static #getPosition(positionable) {
        if (!isObject(positionable)) {
            return null;
        }
        if (positionable.animate instanceof AnimationAPIImpl) {
            return positionable;
        }
        if (positionable.position?.animate instanceof AnimationAPIImpl) {
            return positionable.position;
        }
        return null;
    }
    /**
     * Cancels any animation for given TJSPosition.PositionGroup data.
     *
     * @param positionGroup - The position group to cancel.
     */
    static cancel(positionGroup) {
        if (isIterable(positionGroup)) {
            let index = -1;
            for (const entry of positionGroup) {
                index++;
                const actualPosition = this.#getPosition(entry);
                if (!actualPosition) {
                    console.warn(`AnimationGroupAPI.cancel warning: No TJSPosition instance found at index: ${index}.`);
                    continue;
                }
                AnimationManager.cancel(actualPosition);
            }
        }
        else {
            const actualPosition = this.#getPosition(positionGroup);
            if (!actualPosition) {
                console.warn(`AnimationGroupAPI.cancel warning: No TJSPosition instance found.`);
                return;
            }
            AnimationManager.cancel(actualPosition);
        }
    }
    /**
     * Cancels all TJSPosition animation.
     */
    static cancelAll() { AnimationManager.cancelAll(); }
    /**
     * Gets all animation controls for the given position group data.
     *
     * @param positionGroup - A position group.
     *
     * @returns Results array.
     */
    static getScheduled(positionGroup) {
        const results = [];
        if (isIterable(positionGroup)) {
            let index = -1;
            for (const entry of positionGroup) {
                index++;
                const actualPosition = this.#getPosition(entry);
                if (!actualPosition) {
                    console.warn(`AnimationGroupAPI.getScheduled warning: No TJSPosition instance found at index: ${index}.`);
                    continue;
                }
                const controls = AnimationManager.getScheduled(actualPosition);
                results.push({
                    position: actualPosition,
                    entry: actualPosition !== entry ? entry : void 0,
                    controls
                });
            }
        }
        else {
            const actualPosition = this.#getPosition(positionGroup);
            if (!actualPosition) {
                console.warn(`AnimationGroupAPI.getScheduled warning: No TJSPosition instance found.`);
                return results;
            }
            const controls = AnimationManager.getScheduled(actualPosition);
            results.push({
                position: actualPosition,
                entry: actualPosition !== positionGroup ? positionGroup : void 0,
                controls
            });
        }
        return results;
    }
    /**
     * Provides a type guard to test in the given key is an {@link AnimationAPIImpl.AnimationKey}.
     *
     * @param key - A key value to test.
     *
     * @returns Whether the given key is an animation key.
     */
    static isAnimationKey(key) {
        return TJSPositionDataUtil.isAnimationKey(key);
    }
    /**
     * Returns the status _for the entire position group_ specified if all position instances of the group are scheduled.
     *
     * @param positionGroup - A position group.
     *
     * @param [options] - Options.
     *
     * @returns True if all are scheduled / false if just one position instance in the group is not scheduled.
     */
    static isScheduled(positionGroup, options) {
        if (isIterable(positionGroup)) {
            let index = -1;
            for (const entry of positionGroup) {
                index++;
                const actualPosition = this.#getPosition(entry);
                if (!actualPosition) {
                    console.warn(`AnimationGroupAPI.isScheduled warning: No TJSPosition instance found at index: ${index}.`);
                    continue;
                }
                if (!AnimationManager.isScheduled(actualPosition, options)) {
                    return false;
                }
            }
        }
        else {
            const actualPosition = this.#getPosition(positionGroup);
            if (!actualPosition) {
                console.warn(`AnimationGroupAPI.isScheduled warning: No TJSPosition instance found.`);
                return false;
            }
            if (!AnimationManager.isScheduled(actualPosition, options)) {
                return false;
            }
        }
        return true;
    }
    /**
     * Provides the `from` animation tween for one or more positionable instances as a group.
     *
     * @param positionGroup - A position group.
     *
     * @param fromData - A position data object assigned to all positionable instances or a callback function invoked for
     *        unique data for each instance.
     *
     * @param [options] - Tween options assigned to all positionable instances or a callback function invoked for unique
     *        options for each instance.
     *
     * @returns Basic animation control.
     */
    static from(positionGroup, fromData, options) {
        if (!isObject(fromData) && typeof fromData !== 'function') {
            throw new TypeError(`AnimationGroupAPI.from error: 'fromData' is not an object or function.`);
        }
        if (options !== void 0 && !isObject(options) && typeof options !== 'function') {
            throw new TypeError(`AnimationGroupAPI.from error: 'options' is not an object or function.`);
        }
        /**
         */
        const animationControls = new Set();
        /**
         */
        const cleanupFn = (data) => animationControls.delete(data.control);
        let index = -1;
        /**
         */
        let callbackOptions;
        const hasDataCallback = typeof fromData === 'function';
        const hasOptionCallback = typeof options === 'function';
        const hasCallback = hasDataCallback || hasOptionCallback;
        if (hasCallback) {
            callbackOptions = { index, position: void 0, entry: void 0 };
        }
        let actualFromData = fromData;
        let actualOptions = isObject(options) ? options : void 0;
        if (isIterable(positionGroup)) {
            for (const entry of positionGroup) {
                index++;
                const actualPosition = this.#getPosition(entry);
                if (!actualPosition) {
                    console.warn(`AnimationGroupAPI.from warning: No TJSPosition instance found at index: ${index}.`);
                    continue;
                }
                if (hasCallback) {
                    callbackOptions.index = index;
                    callbackOptions.position = actualPosition;
                    callbackOptions.entry = actualPosition !== entry ? entry : void 0;
                }
                if (hasDataCallback && typeof fromData === 'function') {
                    actualFromData = fromData(callbackOptions);
                    // Returned data from callback is null / undefined, so skip this position instance.
                    if (actualFromData === null || actualFromData === void 0) {
                        continue;
                    }
                    if (!isObject(actualFromData)) {
                        throw new TypeError(`AnimationGroupAPI.from error: 'fromData' callback function iteration(${index}) failed to return an object.`);
                    }
                }
                if (hasOptionCallback && typeof options === 'function') {
                    actualOptions = options(callbackOptions);
                    // Returned data from callback is null / undefined, so skip this position instance.
                    if (actualOptions === null || actualOptions === void 0) {
                        continue;
                    }
                    if (!isObject(actualOptions)) {
                        throw new TypeError(`AnimationGroupAPI.from error: 'options' callback function iteration(${index}) failed to return an object.`);
                    }
                }
                const animationControl = AnimationScheduler.from(actualPosition, actualFromData, actualOptions, cleanupFn);
                if (animationControl) {
                    animationControls.add(animationControl);
                }
            }
        }
        else {
            const actualPosition = this.#getPosition(positionGroup);
            if (!actualPosition) {
                console.warn(`AnimationGroupAPI.from warning: No TJSPosition instance found.`);
                return AnimationGroupControl.voidControl;
            }
            if (hasCallback) {
                callbackOptions.index = 0;
                callbackOptions.position = actualPosition;
                callbackOptions.entry = actualPosition !== positionGroup ? positionGroup :
                    void 0;
            }
            if (hasDataCallback && typeof fromData === 'function') {
                actualFromData = fromData(callbackOptions);
                // Returned data from callback is null / undefined, so skip this position instance.
                if (actualFromData === null || actualFromData === void 0) {
                    return AnimationGroupControl.voidControl;
                }
                if (!isObject(actualFromData)) {
                    throw new TypeError(`AnimationGroupAPI.from error: 'fromData' callback function failed to return an object.`);
                }
            }
            if (hasOptionCallback && typeof options === 'function') {
                actualOptions = options(callbackOptions);
                // Returned data from callback is null / undefined, so skip this position instance.
                if (actualOptions === null || actualOptions === void 0) {
                    return AnimationGroupControl.voidControl;
                }
                if (!isObject(actualOptions)) {
                    throw new TypeError(`AnimationGroupAPI.from error: 'options' callback function failed to return an object.`);
                }
            }
            const animationControl = AnimationScheduler.from(actualPosition, actualFromData, actualOptions, cleanupFn);
            if (animationControl) {
                animationControls.add(animationControl);
            }
        }
        return new AnimationGroupControl(animationControls);
    }
    /**
     * Provides the `fromTo` animation tween for one or more positionable instances as a group.
     *
     * @param positionGroup - A position group.
     *
     * @param fromData - A position data object assigned to all positionable instances or a callback function invoked for
     *        unique data for each instance.
     *
     * @param toData - A position data object assigned to all positionable instances or a callback function invoked for
     *        unique data for each instance.
     *
     * @param [options] - Tween options assigned to all positionable instances or a callback function invoked for unique
     *        options for each instance.
     *
     * @returns Basic animation control.
     */
    static fromTo(positionGroup, fromData, toData, options) {
        if (!isObject(fromData) && typeof fromData !== 'function') {
            throw new TypeError(`AnimationGroupAPI.fromTo error: 'fromData' is not an object or function.`);
        }
        if (!isObject(toData) && typeof toData !== 'function') {
            throw new TypeError(`AnimationGroupAPI.fromTo error: 'toData' is not an object or function.`);
        }
        if (options !== void 0 && !isObject(options) && typeof options !== 'function') {
            throw new TypeError(`AnimationGroupAPI.fromTo error: 'options' is not an object or function.`);
        }
        const animationControls = new Set();
        /**
         */
        const cleanupFn = (data) => animationControls.delete(data.control);
        let index = -1;
        /**
         */
        let callbackOptions;
        const hasFromCallback = typeof fromData === 'function';
        const hasToCallback = typeof toData === 'function';
        const hasOptionCallback = typeof options === 'function';
        const hasCallback = hasFromCallback || hasToCallback || hasOptionCallback;
        if (hasCallback) {
            callbackOptions = { index, position: void 0, entry: void 0 };
        }
        let actualFromData = fromData;
        let actualToData = toData;
        let actualOptions = isObject(options) ? options : void 0;
        if (isIterable(positionGroup)) {
            for (const entry of positionGroup) {
                index++;
                const actualPosition = this.#getPosition(entry);
                if (!actualPosition) {
                    console.warn(`AnimationGroupAPI.fromTo warning: No TJSPosition instance found at index: ${index}.`);
                    continue;
                }
                if (hasCallback) {
                    callbackOptions.index = index;
                    callbackOptions.position = actualPosition;
                    callbackOptions.entry = actualPosition !== entry ? entry : void 0;
                }
                if (hasFromCallback && typeof fromData === 'function') {
                    actualFromData = fromData(callbackOptions);
                    // Returned data from callback is null / undefined, so skip this position instance.
                    if (actualFromData === null || actualFromData === void 0) {
                        continue;
                    }
                    if (!isObject(actualFromData)) {
                        throw new TypeError(`AnimationGroupAPI.fromTo error: 'fromData' callback function iteration(${index}) failed to return an object.`);
                    }
                }
                if (hasToCallback && typeof toData === 'function') {
                    actualToData = toData(callbackOptions);
                    // Returned data from callback is null / undefined, so skip this position instance.
                    if (actualToData === null || actualToData === void 0) {
                        continue;
                    }
                    if (!isObject(actualToData)) {
                        throw new TypeError(`AnimationGroupAPI.fromTo error: 'toData' callback function iteration(${index}) failed to return an object.`);
                    }
                }
                if (hasOptionCallback && typeof options === 'function') {
                    actualOptions = options(callbackOptions);
                    // Returned data from callback is null / undefined, so skip this position instance.
                    if (actualOptions === null || actualOptions === void 0) {
                        continue;
                    }
                    if (!isObject(actualOptions)) {
                        throw new TypeError(`AnimationGroupAPI.fromTo error: 'options' callback function iteration(${index}) failed to return an object.`);
                    }
                }
                const animationControl = AnimationScheduler.fromTo(actualPosition, actualFromData, actualToData, actualOptions, cleanupFn);
                if (animationControl) {
                    animationControls.add(animationControl);
                }
            }
        }
        else {
            const actualPosition = this.#getPosition(positionGroup);
            if (!actualPosition) {
                console.warn(`AnimationGroupAPI.fromTo warning: No TJSPosition instance found.`);
                return AnimationGroupControl.voidControl;
            }
            if (hasCallback) {
                callbackOptions.index = 0;
                callbackOptions.position = actualPosition;
                callbackOptions.entry = actualPosition !== positionGroup ? positionGroup :
                    void 0;
            }
            if (hasFromCallback && typeof fromData === 'function') {
                actualFromData = fromData(callbackOptions);
                // Returned data from callback is null / undefined, so skip this position instance.
                if (actualFromData === null || actualFromData === void 0) {
                    return AnimationGroupControl.voidControl;
                }
                if (!isObject(actualFromData)) {
                    throw new TypeError(`AnimationGroupAPI.fromTo error: 'fromData' callback function failed to return an object.`);
                }
            }
            if (hasToCallback && typeof toData === 'function') {
                actualToData = toData(callbackOptions);
                // Returned data from callback is null / undefined, so skip this position instance.
                if (actualToData === null || actualToData === void 0) {
                    return AnimationGroupControl.voidControl;
                }
                if (!isObject(actualToData)) {
                    throw new TypeError(`AnimationGroupAPI.fromTo error: 'toData' callback function failed to return an object.`);
                }
            }
            if (hasOptionCallback && typeof options === 'function') {
                actualOptions = options(callbackOptions);
                // Returned data from callback is null / undefined, so skip this position instance.
                if (actualOptions === null || actualOptions === void 0) {
                    return AnimationGroupControl.voidControl;
                }
                if (!isObject(actualOptions)) {
                    throw new TypeError(`AnimationGroupAPI.fromTo error: 'options' callback function failed to return an object.`);
                }
            }
            const animationControl = AnimationScheduler.fromTo(actualPosition, actualFromData, actualToData, actualOptions, cleanupFn);
            if (animationControl) {
                animationControls.add(animationControl);
            }
        }
        return new AnimationGroupControl(animationControls);
    }
    /**
     * Provides the `to` animation tween for one or more positionable instances as a group.
     *
     * @param positionGroup - A position group.
     *
     * @param toData - A position data object assigned to all positionable instances or a callback function invoked for
     *        unique data for each instance.
     *
     * @param [options] - Tween options assigned to all positionable instances or a callback function invoked for unique
     *        options for each instance.
     *
     * @returns Basic animation control.
     */
    static to(positionGroup, toData, options) {
        if (!isObject(toData) && typeof toData !== 'function') {
            throw new TypeError(`AnimationGroupAPI.to error: 'toData' is not an object or function.`);
        }
        if (options !== void 0 && !isObject(options) && typeof options !== 'function') {
            throw new TypeError(`AnimationGroupAPI.to error: 'options' is not an object or function.`);
        }
        /**
         */
        const animationControls = new Set();
        /**
         */
        const cleanupFn = (data) => animationControls.delete(data.control);
        let index = -1;
        /**
         */
        let callbackOptions;
        const hasDataCallback = typeof toData === 'function';
        const hasOptionCallback = typeof options === 'function';
        const hasCallback = hasDataCallback || hasOptionCallback;
        if (hasCallback) {
            callbackOptions = { index, position: void 0, entry: void 0 };
        }
        let actualToData = toData;
        let actualOptions = isObject(options) ? options : void 0;
        if (isIterable(positionGroup)) {
            for (const entry of positionGroup) {
                index++;
                const actualPosition = this.#getPosition(entry);
                if (!actualPosition) {
                    console.warn(`AnimationGroupAPI.to warning: No TJSPosition instance found at index: ${index}.`);
                    continue;
                }
                if (hasCallback) {
                    callbackOptions.index = index;
                    callbackOptions.position = actualPosition;
                    callbackOptions.entry = actualPosition !== entry ? entry : void 0;
                }
                if (hasDataCallback && typeof toData === 'function') {
                    actualToData = toData(callbackOptions);
                    // Returned data from callback is null / undefined, so skip this position instance.
                    if (actualToData === null || actualToData === void 0) {
                        continue;
                    }
                    if (!isObject(actualToData)) {
                        throw new TypeError(`AnimationGroupAPI.to error: 'toData' callback function iteration(${index}) failed to return an object.`);
                    }
                }
                if (hasOptionCallback && typeof options === 'function') {
                    actualOptions = options(callbackOptions);
                    // Returned data from callback is null / undefined, so skip this position instance.
                    if (actualOptions === null || actualOptions === void 0) {
                        continue;
                    }
                    if (!isObject(actualOptions)) {
                        throw new TypeError(`AnimationGroupAPI.to error: 'options' callback function iteration(${index}) failed to return an object.`);
                    }
                }
                const animationControl = AnimationScheduler.to(actualPosition, actualToData, actualOptions, cleanupFn);
                if (animationControl) {
                    animationControls.add(animationControl);
                }
            }
        }
        else {
            const actualPosition = this.#getPosition(positionGroup);
            if (!actualPosition) {
                console.warn(`AnimationGroupAPI.to warning: No TJSPosition instance found.`);
                return AnimationGroupControl.voidControl;
            }
            if (hasCallback) {
                callbackOptions.index = 0;
                callbackOptions.position = actualPosition;
                callbackOptions.entry = actualPosition !== positionGroup ? positionGroup :
                    void 0;
            }
            if (hasDataCallback && typeof toData === 'function') {
                actualToData = toData(callbackOptions);
                // Returned data from callback is null / undefined, so skip this position instance.
                if (actualToData === null || actualToData === void 0) {
                    return AnimationGroupControl.voidControl;
                }
                if (!isObject(actualToData)) {
                    throw new TypeError(`AnimationGroupAPI.to error: 'toData' callback function failed to return an object.`);
                }
            }
            if (hasOptionCallback && typeof options === 'function') {
                actualOptions = options(callbackOptions);
                // Returned data from callback is null / undefined, so skip this position instance.
                if (actualOptions === null || actualOptions === void 0) {
                    return AnimationGroupControl.voidControl;
                }
                if (!isObject(actualOptions)) {
                    throw new TypeError(`AnimationGroupAPI.to error: 'options' callback function failed to return an object.`);
                }
            }
            const animationControl = AnimationScheduler.to(actualPosition, actualToData, actualOptions, cleanupFn);
            if (animationControl) {
                animationControls.add(animationControl);
            }
        }
        return new AnimationGroupControl(animationControls);
    }
    /**
     * Provides the `quickTo` animation tweening function for one or more positionable instances as a group.
     *
     * @param positionGroup - A position group.
     *
     * @param keys - Animation keys to target.
     *
     * @param [options] - Quick tween options assigned to all positionable instances or a callback function invoked for
     *        unique options for each instance.
     *
     * @returns quick-to tween function.
     */
    static quickTo(positionGroup, keys, options) {
        if (!isIterable(keys)) {
            throw new TypeError(`AnimationGroupAPI.quickTo error: 'keys' is not an iterable list.`);
        }
        if (options !== void 0 && !isObject(options) && typeof options !== 'function') {
            throw new TypeError(`AnimationGroupAPI.quickTo error: 'options' is not an object or function.`);
        }
        /**
         */
        const quickToCallbacks = [];
        let index = -1;
        const hasOptionCallback = typeof options === 'function';
        const callbackOptions = { index, position: void 0, entry: void 0 };
        let actualOptions = isObject(options) ? options : void 0;
        if (isIterable(positionGroup)) {
            for (const entry of positionGroup) {
                index++;
                const actualPosition = this.#getPosition(entry);
                if (!actualPosition) {
                    console.warn(`AnimationGroupAPI.quickTo warning: No TJSPosition instance found at index: ${index}.`);
                    continue;
                }
                callbackOptions.index = index;
                callbackOptions.position = actualPosition;
                callbackOptions.entry = actualPosition !== entry ? entry : void 0;
                if (hasOptionCallback && typeof options === 'function') {
                    actualOptions = options(callbackOptions);
                    // Returned data from callback is null / undefined, so skip this position instance.
                    if (actualOptions === null || actualOptions === void 0) {
                        continue;
                    }
                    if (!isObject(actualOptions)) {
                        throw new TypeError(`AnimationGroupAPI.quickTo error: 'options' callback function iteration(${index}) failed to return an object.`);
                    }
                }
                quickToCallbacks.push(actualPosition.animate.quickTo(keys, actualOptions));
            }
        }
        else {
            const actualPosition = this.#getPosition(positionGroup);
            if (!actualPosition) {
                console.warn(`AnimationGroupAPI.quickTo warning: No TJSPosition instance found.`);
                return;
            }
            callbackOptions.index = 0;
            callbackOptions.position = actualPosition;
            callbackOptions.entry = actualPosition !== positionGroup ? positionGroup : void 0;
            if (hasOptionCallback && typeof options === 'function') {
                actualOptions = options(callbackOptions);
                // Returned data from callback is null / undefined, so skip this position instance.
                if (actualOptions === null || actualOptions === void 0) {
                    return;
                }
                if (!isObject(actualOptions)) {
                    throw new TypeError(`AnimationGroupAPI.quickTo error: 'options' callback function failed to return an object.`);
                }
            }
            quickToCallbacks.push(actualPosition.animate.quickTo(keys, actualOptions));
        }
        const keysArray = [...keys];
        Object.freeze(keysArray);
        const quickToCB = (...args) => {
            const argsLength = args.length;
            if (argsLength === 0) {
                return;
            }
            if (typeof args[0] === 'function') {
                const dataCallback = args[0];
                index = -1;
                let cntr = 0;
                if (isIterable(positionGroup)) {
                    for (const entry of positionGroup) {
                        index++;
                        const actualPosition = this.#getPosition(entry);
                        if (!actualPosition) {
                            continue;
                        }
                        callbackOptions.index = index;
                        callbackOptions.position = actualPosition;
                        callbackOptions.entry = actualPosition !== entry ? entry : void 0;
                        const toData = dataCallback(callbackOptions);
                        // Returned data from callback is null / undefined, so skip this position instance.
                        if (toData === null || toData === void 0) {
                            continue;
                        }
                        /**
                         */
                        const toDataIterable = isIterable(toData);
                        if (!Number.isFinite(toData) && !toDataIterable && !isObject(toData)) {
                            throw new TypeError(`AnimationGroupAPI.quickTo error: 'toData' callback function iteration(${index}) failed to return a finite number, iterable list, or object.`);
                        }
                        if (toDataIterable) {
                            quickToCallbacks[cntr++](...toData);
                        }
                        else {
                            quickToCallbacks[cntr++](toData);
                        }
                    }
                }
                else {
                    const actualPosition = this.#getPosition(positionGroup);
                    if (!actualPosition) {
                        return;
                    }
                    callbackOptions.index = 0;
                    callbackOptions.position = actualPosition;
                    callbackOptions.entry = actualPosition !== positionGroup ? positionGroup : void 0;
                    const toData = dataCallback(callbackOptions);
                    // Returned data from callback is null / undefined, so skip this position instance.
                    if (toData === null || toData === void 0) {
                        return;
                    }
                    const toDataIterable = isIterable(toData);
                    if (!Number.isFinite(toData) && !toDataIterable && !isObject(toData)) {
                        throw new TypeError(`AnimationGroupAPI.quickTo error: 'toData' callback function iteration(${index}) failed to return a finite number, iterable list, or object.`);
                    }
                    if (toDataIterable) {
                        quickToCallbacks[cntr++](...toData);
                    }
                    else {
                        quickToCallbacks[cntr++](toData);
                    }
                }
            }
            else {
                for (let cntr = quickToCallbacks.length; --cntr >= 0;) {
                    quickToCallbacks[cntr](...args);
                }
            }
        };
        Object.defineProperty(quickToCB, 'keys', {
            value: keysArray,
            writable: false,
            configurable: false
        });
        Object.defineProperty(quickToCB, 'options', {
            /**
             * Sets options of quickTo tween.
             * @param options -
             */
            value: (options) => {
                if (options !== void 0 && !isObject(options)) {
                    throw new TypeError(`AnimationGroupAPI.quickTo error: 'options' is not an object.`);
                }
                // Set options object for each quickTo callback.
                if (isObject(options)) {
                    for (let cntr = quickToCallbacks.length; --cntr >= 0;) {
                        quickToCallbacks[cntr].options(options);
                    }
                }
                return quickToCB;
            },
            writable: false,
            configurable: false
        });
        return quickToCB;
    }
}
Object.seal(AnimationGroupAPIImpl);

/**
 *
 */
class PositionStateAPI {
    /**
     */
    #data;
    /**
     */
    #dataSaved = new Map();
    /**
     */
    #position;
    /**
     */
    #transforms;
    constructor(position, data, transforms) {
        this.#position = position;
        this.#data = data;
        this.#transforms = transforms;
        Object.seal(this);
    }
    /**
     * Clears all saved position data except any default state.
     */
    clear() {
        for (const key of this.#dataSaved.keys()) {
            if (key !== '#defaultData') {
                this.#dataSaved.delete(key);
            }
        }
    }
    /**
     * Returns any stored save state by name.
     *
     * @param options - Options.
     *
     * @param options.name - Saved data name.
     *
     * @returns Any saved position data.
     */
    get({ name }) {
        if (typeof name !== 'string') {
            throw new TypeError(`TJSPosition - get error: 'name' is not a string.`);
        }
        return this.#dataSaved.get(name);
    }
    /**
     * Returns any associated default position data.
     *
     * @returns Any saved default position data.
     */
    getDefault() {
        return this.#dataSaved.get('#defaultData');
    }
    /**
     * @returns The saved position data names / keys.
     */
    keys() {
        return this.#dataSaved.keys();
    }
    /**
     * Removes and returns any position data by name.
     *
     * @param options - Options.
     *
     * @param options.name - Name to remove and retrieve.
     *
     * @returns Any saved position data.
     */
    remove({ name }) {
        if (typeof name !== 'string') {
            throw new TypeError(`TJSPosition - remove: 'name' is not a string.`);
        }
        const data = this.#dataSaved.get(name);
        this.#dataSaved.delete(name);
        return data;
    }
    /**
     * Resets position instance to default data and invokes set.
     *
     * @param [options] - Optional parameters.
     *
     * @param [options.keepZIndex=false] - When true keeps current z-index.
     *
     * @param [options.invokeSet=true] - When true invokes set method.
     *
     * @returns Operation successful.
     */
    reset({ keepZIndex = false, invokeSet = true } = {}) {
        const defaultData = this.#dataSaved.get('#defaultData');
        // Quit early if there is no saved default data.
        if (!isObject(defaultData)) {
            return false;
        }
        // Cancel all animations for TJSPosition if there are currently any scheduled.
        if (this.#position.animate.isScheduled) {
            this.#position.animate.cancel();
        }
        const zIndex = this.#position.zIndex;
        const data = Object.assign({}, defaultData);
        if (keepZIndex) {
            data.zIndex = zIndex;
        }
        // Reset the transform data.
        this.#transforms.reset(data);
        const parent = this.#position.parent;
        // If current minimized invoke `maximize`. TODO: REFACTOR FOR APPLICATION DIRECT ACCESS.
        if (parent?.reactive?.minimized) {
            parent?.maximize?.({ animate: false, duration: 0 });
        }
        // Note next clock tick scheduling.
        if (invokeSet) {
            setTimeout(() => this.#position.set(data), 0);
        }
        return true;
    }
    /**
     * Restores a saved positional state returning the data. Several optional parameters are available to control
     * whether the restore action occurs silently (no store / inline styles updates), animates to the stored data, or
     * simply sets the stored data. Restoring via {@link AnimationAPI.to} allows specification of the duration and
     * easing along with configuring a Promise to be returned if awaiting the end of the animation.
     *
     * @param options - Parameters
     *
     * @param options.name - Saved data set name.
     *
     * @param [options.remove=false] - Deletes data set.
     *
     * @param [options.properties] - Specific properties to set / animate.
     *
     * @param [options.silent] - Set position data directly; no store or style updates.
     *
     * @param [options.async=false] - If animating return a Promise that resolves with any saved data.
     *
     * @param [options.animateTo=false] - Animate to restore data.
     *
     * @param [options.duration=0.1] - Duration in seconds.
     *
     * @param [options.ease='linear'] - Easing function name or function.
     *
     * @returns Any saved position data.
     */
    restore({ name, remove = false, properties, silent = false, async = false, animateTo = false, duration = 0.1, ease = 'linear' }) {
        if (typeof name !== 'string') {
            throw new TypeError(`TJSPosition - restore error: 'name' is not a string.`);
        }
        const dataSaved = this.#dataSaved.get(name);
        if (dataSaved) {
            if (remove) {
                this.#dataSaved.delete(name);
            }
            let data = dataSaved;
            if (isIterable(properties)) {
                data = {};
                for (const property of properties) {
                    data[property] = dataSaved[property];
                }
            }
            // Update data directly with no store or inline style updates.
            if (silent) {
                for (const property in data) {
                    if (property in this.#data) {
                        this.#data[property] = data[property];
                    }
                }
                return dataSaved;
            }
            else if (animateTo) // Animate to saved data.
             {
                // Provide special handling to potentially change transform origin as this parameter is not animated.
                if (data.transformOrigin !== this.#position.transformOrigin) {
                    this.#position.transformOrigin = data.transformOrigin;
                }
                // Return a Promise with saved data that resolves after animation ends.
                if (async) {
                    return this.#position.animate.to(data, { duration, ease }).finished.then(() => dataSaved);
                }
                else // Animate synchronously.
                 {
                    this.#position.animate.to(data, { duration, ease });
                }
            }
            else {
                // Default options is to set data for an immediate update.
                this.#position.set(data);
            }
        }
        // Saved data potentially not found, but must still return a Promise when async is true.
        return async ? Promise.resolve(dataSaved) : dataSaved;
    }
    /**
     * Saves current position state with the opportunity to add extra data to the saved state. Simply include extra
     * properties in `options` to save extra data.
     *
     * @param options - Options.
     *
     * @param options.name - name to index this saved data.
     *
     * @param [optionsGet] - Additional options for {@link TJSPosition.get} when serializing position state. By default,
     *        `nullable` values are included.
     *
     * @returns Current position data plus any extra data stored.
     */
    save({ name, ...extra }, optionsGet) {
        if (typeof name !== 'string') {
            throw new TypeError(`TJSPosition - save error: 'name' is not a string.`);
        }
        const data = this.#position.get(extra, optionsGet);
        this.#dataSaved.set(name, data);
        return data;
    }
    /**
     * Directly sets a saved position state. Simply include extra properties in `options` to set extra data.
     *
     * @param opts - Options.
     *
     * @param opts.name - name to index this saved data.
     */
    set({ name, ...data }) {
        if (typeof name !== 'string') {
            throw new TypeError(`TJSPosition - set error: 'name' is not a string.`);
        }
        this.#dataSaved.set(name, data);
    }
}

/**
 * Provides a base {@link System.SystemBase} implementation.
 */
class SystemBase {
    /**
     * When true constrains the min / max width or height to element.
     */
    #constrain;
    /**
     */
    #element;
    /**
     * When true the validator is active.
     */
    #enabled;
    /**
     * Provides a manual setting of the element height. As things go `offsetHeight` causes a browser layout and is not
     * performance oriented. If manually set this height is used instead of `offsetHeight`.
     */
    #height;
    /**
     * Set from an optional value in the constructor to lock accessors preventing modification.
     */
    #lock;
    /**
     * Stores the subscribers.
     */
    #subscribers = [];
    /**
     * Provides a manual setting of the element width. As things go `offsetWidth` causes a browser layout and is not
     * performance oriented. If manually set this width is used instead of `offsetWidth`.
     */
    #width;
    /**
     * @param [options] - Initial options.
     *
     * @param [options.constrain=true] - Initial constrained state.
     *
     * @param [options.element] - Target element.
     *
     * @param [options.enabled=true] - Enabled state.
     *
     * @param [options.lock=false] - Lock parameters from being set.
     *
     * @param [options.width] - Manual width.
     *
     * @param [options.height] - Manual height.
     */
    constructor({ constrain = true, element, enabled = true, lock = false, width, height } = {}) {
        this.#constrain = true;
        this.#enabled = true;
        this.constrain = constrain;
        this.element = element;
        this.enabled = enabled;
        this.width = width;
        this.height = height;
        this.#lock = typeof lock === 'boolean' ? lock : false;
    }
    /**
     * @returns The current constrain state.
     */
    get constrain() { return this.#constrain; }
    /**
     * @returns Target element.
     */
    get element() { return this.#element; }
    /**
     * @returns The current enabled state.
     */
    get enabled() { return this.#enabled; }
    /**
     * @returns Get manual height.
     */
    get height() { return this.#height; }
    /**
     * @return Get locked state.
     */
    get locked() { return this.#lock; }
    /**
     * @returns Get manual width.
     */
    get width() { return this.#width; }
    /**
     * @param constrain - New constrain state.
     */
    set constrain(constrain) {
        if (this.#lock) {
            return;
        }
        if (typeof constrain !== 'boolean') {
            throw new TypeError(`'constrain' is not a boolean.`);
        }
        this.#constrain = constrain;
        this.#updateSubscribers();
    }
    /**
     * @param element - Set target element.
     */
    set element(element) {
        if (this.#lock) {
            return;
        }
        if (element === void 0 || element === null || A11yHelper.isFocusTarget(element)) {
            this.#element = element;
        }
        else {
            throw new TypeError(`'element' is not a HTMLElement, undefined, or null.`);
        }
        this.#updateSubscribers();
    }
    /**
     * @param enabled - New enabled state.
     */
    set enabled(enabled) {
        if (this.#lock) {
            return;
        }
        if (typeof enabled !== 'boolean') {
            throw new TypeError(`'enabled' is not a boolean.`);
        }
        this.#enabled = enabled;
        this.#updateSubscribers();
    }
    /**
     * @param height - Set manual height.
     */
    set height(height) {
        if (this.#lock) {
            return;
        }
        if (height === void 0 || Number.isFinite(height)) {
            this.#height = height;
        }
        else {
            throw new TypeError(`'height' is not a finite number or undefined.`);
        }
        this.#updateSubscribers();
    }
    /**
     * @param width - Set manual width.
     */
    set width(width) {
        if (this.#lock) {
            return;
        }
        if (width === void 0 || Number.isFinite(width)) {
            this.#width = width;
        }
        else {
            throw new TypeError(`'width' is not a finite number or undefined.`);
        }
        this.#updateSubscribers();
    }
    /**
     * Set manual width & height.
     *
     * @param width - New manual width.
     *
     * @param height - New manual height.
     */
    setDimension(width, height) {
        if (this.#lock) {
            return;
        }
        if (width === void 0 || Number.isFinite(width)) {
            this.#width = width;
        }
        else {
            throw new TypeError(`'width' is not a finite number or undefined.`);
        }
        if (height === void 0 || Number.isFinite(height)) {
            this.#height = height;
        }
        else {
            throw new TypeError(`'height' is not a finite number or undefined.`);
        }
        this.#updateSubscribers();
    }
    /**
     * @param handler - Callback function that is invoked on update / changes. Receives a copy of the TJSPositionData.
     *
     * @returns Unsubscribe function.
     */
    subscribe(handler) {
        const currentIdx = this.#subscribers.findIndex((entry) => entry === handler);
        if (currentIdx === -1) {
            this.#subscribers.push(handler); // add handler to the array of subscribers
            handler(this); // call handler with current value
        }
        // Return unsubscribe function.
        return () => {
            const existingIdx = this.#subscribers.findIndex((entry) => entry === handler);
            if (existingIdx !== -1) {
                this.#subscribers.splice(existingIdx, 1);
            }
        };
    }
    /**
     * Updates subscribers on changes.
     */
    #updateSubscribers() {
        for (let cntr = 0; cntr < this.#subscribers.length; cntr++) {
            this.#subscribers[cntr](this);
        }
    }
}

/**
 * Provides a {@link System.Initial.InitialSystem} implementation to center an element being positioned.
 */
class Centered extends SystemBase {
    /**
     * Get the left constraint based on any manual target values or the browser inner width.
     *
     * @param width - Target width.
     *
     * @returns Calculated left constraint.
     */
    getLeft(width) {
        // Determine containing bounds from manual values; or any element; lastly the browser width / height.
        const boundsWidth = this.width ?? this.element?.offsetWidth ?? globalThis.innerWidth;
        return (boundsWidth - width) / 2;
    }
    /**
     * Get the top constraint based on any manual target values or the browser inner height.
     *
     * @param height - Target height.
     *
     * @returns Calculated top constraint.
     */
    getTop(height) {
        const boundsHeight = this.height ?? this.element?.offsetHeight ?? globalThis.innerHeight;
        return (boundsHeight - height) / 2;
    }
}

/**
 * Provides the storage and sequencing of managed position validators. Each validator added may be a bespoke function or
 * a {@link ValidatorData} object containing an `id`, `validator`, and `weight` attributes; `validator` is the only
 * required attribute.
 *
 * The `id` attribute can be anything that creates a unique ID for the validator; recommended strings or numbers. This
 * allows validators to be removed by ID easily.
 *
 * The `weight` attribute is a number between 0 and 1 inclusive that allows validators to be added in a predictable
 * order which is especially handy if they are manipulated at runtime. A lower weighted validator always runs before a
 * higher weighted validator. If no weight is specified the default of '1' is assigned, and it is appended to the end of
 * the validators list.
 *
 * This class forms the public API which is accessible from the {@link TJSPosition.validators} getter in the main
 * TJSPosition instance.
 * ```
 * const position = new TJSPosition();
 * position.validators.add(...);
 * position.validators.clear();
 * position.validators.length;
 * position.validators.remove(...);
 * position.validators.removeBy(...);
 * position.validators.removeById(...);
 * ```
 */
class AdapterValidators {
    /**
     */
    #enabled = true;
    /**
     */
    #validatorData;
    /**
     */
    #mapUnsubscribe = new Map();
    #updateFn;
    /**
     * @returns Returns this and internal storage for validator adapter.
     */
    static create(updateFn) {
        const validatorAPI = new AdapterValidators(updateFn);
        return [validatorAPI, validatorAPI.#validatorData];
    }
    /**
     */
    constructor(updateFn) {
        this.#validatorData = [];
        this.#updateFn = updateFn;
        Object.seal(this);
    }
    /**
     * @returns Returns the enabled state.
     */
    get enabled() { return this.#enabled; }
    /**
     * @returns Returns the length of the validators array.
     */
    get length() { return this.#validatorData.length; }
    /**
     * @param enabled - Sets enabled state.
     */
    set enabled(enabled) {
        if (typeof enabled !== 'boolean') {
            throw new TypeError(`'enabled' is not a boolean.`);
        }
        this.#enabled = enabled;
    }
    /**
     * Provides an iterator for validators.
     *
     * @returns iterator.
     */
    *[Symbol.iterator]() {
        if (this.#validatorData.length === 0) {
            return;
        }
        for (const entry of this.#validatorData) {
            yield { ...entry };
        }
    }
    /**
     * Adds the given validators.
     *
     * @param validators - Validators to add.
     */
    add(...validators) {
        /**
         * Tracks the number of validators added that have subscriber functionality.
         */
        let subscribeCount = 0;
        for (const validator of validators) {
            const validatorType = typeof validator;
            if ((validatorType !== 'function' && validatorType !== 'object') || validator === null) {
                throw new TypeError(`AdapterValidator error: 'validator' is not a function or object.`);
            }
            /**
             */
            let data = void 0;
            /**
             */
            let subscribeFn = void 0;
            switch (validatorType) {
                case 'function':
                    data = {
                        id: void 0,
                        validate: validator,
                        weight: 1
                    };
                    subscribeFn = validator.subscribe;
                    break;
                case 'object':
                    if ('validate' in validator) {
                        if (typeof validator.validate !== 'function') {
                            throw new TypeError(`AdapterValidator error: 'validate' attribute is not a function.`);
                        }
                        if (validator.weight !== void 0 && typeof validator.weight !== 'number' ||
                            (validator?.weight < 0 || validator?.weight > 1)) {
                            throw new TypeError(`AdapterValidator error: 'weight' attribute is not a number between '0 - 1' inclusive.`);
                        }
                        data = {
                            id: validator.id !== void 0 ? validator.id : void 0,
                            validate: validator.validate.bind(validator),
                            weight: validator.weight || 1
                        };
                        subscribeFn = validator.validate.subscribe ?? validator.subscribe;
                    }
                    else {
                        throw new TypeError(`AdapterValidator error: 'validate' attribute is not a function.`);
                    }
                    break;
            }
            // Find the index to insert where data.weight is less than existing values weight.
            const index = this.#validatorData.findIndex((value) => data.weight < value.weight);
            // If an index was found insert at that location.
            if (index >= 0) {
                this.#validatorData.splice(index, 0, data);
            }
            else // push to end of validators.
             {
                this.#validatorData.push(data);
            }
            if (typeof subscribeFn === 'function') {
                const unsubscribe = subscribeFn.call(validator, this.#updateFn);
                // Ensure that unsubscribe is a function.
                if (typeof unsubscribe !== 'function') {
                    throw new TypeError('AdapterValidator error: Validator has subscribe function, but no unsubscribe function is returned.');
                }
                // Ensure that the same validator is not subscribed to multiple times.
                if (this.#mapUnsubscribe.has(data.validate)) {
                    throw new Error('AdapterValidator error: Validator added already has an unsubscribe function registered.');
                }
                this.#mapUnsubscribe.set(data.validate, unsubscribe);
                subscribeCount++;
            }
        }
        // Validators with subscriber functionality are assumed to immediately invoke the `subscribe` callback. If the
        // subscriber count is less than the amount of validators added then automatically trigger an update manually.
        if (subscribeCount < validators.length) {
            this.#updateFn();
        }
    }
    /**
     * Clears / removes all validators.
     */
    clear() {
        this.#validatorData.length = 0;
        // Unsubscribe from all validators with subscription support.
        for (const unsubscribe of this.#mapUnsubscribe.values()) {
            unsubscribe();
        }
        this.#mapUnsubscribe.clear();
        this.#updateFn();
    }
    /**
     * Removes one or more given validators.
     *
     * @param validators - Validators to remove.
     */
    remove(...validators) {
        const length = this.#validatorData.length;
        if (length === 0) {
            return;
        }
        for (const data of validators) {
            // Handle the case that the validator may either be a function or a validator entry / object.
            const actualValidator = typeof data === 'function' ? data : isObject(data) ? data.validate : void 0;
            if (!actualValidator) {
                continue;
            }
            for (let cntr = this.#validatorData.length; --cntr >= 0;) {
                if (this.#validatorData[cntr].validate === actualValidator) {
                    this.#validatorData.splice(cntr, 1);
                    // Invoke any unsubscribe function for given validator then remove from tracking.
                    let unsubscribe = void 0;
                    if (typeof (unsubscribe = this.#mapUnsubscribe.get(actualValidator)) === 'function') {
                        unsubscribe();
                        this.#mapUnsubscribe.delete(actualValidator);
                    }
                }
            }
        }
        // Invoke update as a validator was removed.
        if (length !== this.#validatorData.length) {
            this.#updateFn();
        }
    }
    /**
     * Remove validators by the provided callback. The callback takes 3 parameters: `id`, `validator`, and `weight`.
     * Any truthy value returned will remove that validator.
     *
     * @param callback - Callback function to evaluate each validator entry.
     */
    removeBy(callback) {
        const length = this.#validatorData.length;
        if (length === 0) {
            return;
        }
        if (typeof callback !== 'function') {
            throw new TypeError(`AdapterValidator error: 'callback' is not a function.`);
        }
        this.#validatorData = this.#validatorData.filter((data) => {
            const remove = callback.call(callback, { ...data });
            if (remove) {
                let unsubscribe;
                if (typeof (unsubscribe = this.#mapUnsubscribe.get(data.validate)) === 'function') {
                    unsubscribe();
                    this.#mapUnsubscribe.delete(data.validate);
                }
            }
            // Reverse remove boolean to properly validator / remove this validator.
            return !remove;
        });
        if (length !== this.#validatorData.length) {
            this.#updateFn();
        }
    }
    /**
     * Removes any validators with matching IDs.
     *
     * @param ids - IDs to remove.
     */
    removeById(...ids) {
        const length = this.#validatorData.length;
        if (length === 0) {
            return;
        }
        this.#validatorData = this.#validatorData.filter((data) => {
            let remove = false;
            for (const id of ids) {
                remove ||= data.id === id;
            }
            // If not keeping invoke any unsubscribe function for given validator then remove from tracking.
            if (remove) {
                let unsubscribe;
                if (typeof (unsubscribe = this.#mapUnsubscribe.get(data.validate)) === 'function') {
                    unsubscribe();
                    this.#mapUnsubscribe.delete(data.validate);
                }
            }
            return !remove; // Swap here to actually remove the item via array validator method.
        });
        if (length !== this.#validatorData.length) {
            this.#updateFn();
        }
    }
}

class TransformBounds extends SystemBase {
    static #TRANSFORM_DATA = new TJSTransformData();
    /**
     * Provides a validator that respects transforms in positional data constraining the position to within the target
     * elements bounds.
     *
     * @param valData - The associated validation data for position updates.
     *
     * @returns Potentially adjusted position data.
     */
    validate(valData) {
        // Early out if element is undefined or local enabled state is false.
        if (!this.enabled) {
            return valData.position;
        }
        // Determine containing bounds from manual values; or any element; lastly the browser width / height.
        const boundsWidth = this.width ?? this.element?.offsetWidth ?? globalThis.innerWidth;
        const boundsHeight = this.height ?? this.element?.offsetHeight ?? globalThis.innerHeight;
        // Ensure min / max width constraints when position width is a number; not 'auto' or 'inherit'. If constrain is
        // true cap width bounds.
        if (typeof valData.position.width === 'number') {
            const maxW = valData.maxWidth ?? (this.constrain ? boundsWidth : Number.MAX_SAFE_INTEGER);
            valData.position.width = clamp(valData.width, valData.minWidth, maxW);
        }
        // Ensure min / max height constraints when position height is a number; not 'auto' or 'inherit'. If constrain
        // is true cap height bounds.
        if (typeof valData.position.height === 'number') {
            const maxH = valData.maxHeight ?? (this.constrain ? boundsHeight : Number.MAX_SAFE_INTEGER);
            valData.position.height = clamp(valData.height, valData.minHeight, maxH);
        }
        // Get transform data. First set constraints including any margin top / left as offsets and width / height. Used
        // when position width / height is 'auto'.
        const data = valData.transforms.getData(valData.position, TransformBounds.#TRANSFORM_DATA, valData);
        // Check the bounding rectangle against browser height / width. Adjust position based on how far the overlap of
        // the bounding rect is outside the bounds height / width. The order below matters as the constraints are top /
        // left oriented, so perform those checks last.
        const initialX = data.boundingRect.x;
        const initialY = data.boundingRect.y;
        const marginTop = valData.marginTop ?? 0;
        const marginLeft = valData.marginLeft ?? 0;
        if (data.boundingRect.bottom + marginTop > boundsHeight) {
            data.boundingRect.y += boundsHeight - data.boundingRect.bottom - marginTop;
        }
        if (data.boundingRect.right + marginLeft > boundsWidth) {
            data.boundingRect.x += boundsWidth - data.boundingRect.right - marginLeft;
        }
        if (data.boundingRect.top - marginTop < 0) {
            data.boundingRect.y += Math.abs(data.boundingRect.top - marginTop);
        }
        if (data.boundingRect.left - marginLeft < 0) {
            data.boundingRect.x += Math.abs(data.boundingRect.left - marginLeft);
        }
        valData.position.left -= initialX - data.boundingRect.x;
        valData.position.top -= initialY - data.boundingRect.y;
        return valData.position;
    }
}

/**
 * Tracks changes to positional data during {@link TJSPosition.set} updates to minimize changes to the element style in
 * {@link UpdateElementManager}.
 */
class PositionChangeSet {
    left;
    top;
    width;
    height;
    maxHeight;
    maxWidth;
    minHeight;
    minWidth;
    zIndex;
    transform;
    transformOrigin;
    constructor() {
        this.left = false;
        this.top = false;
        this.width = false;
        this.height = false;
        this.maxHeight = false;
        this.maxWidth = false;
        this.minHeight = false;
        this.minWidth = false;
        this.zIndex = false;
        this.transform = false;
        this.transformOrigin = false;
    }
    hasChange() {
        return this.left || this.top || this.width || this.height || this.maxHeight || this.maxWidth || this.minHeight ||
            this.minWidth || this.zIndex || this.transform || this.transformOrigin;
    }
    set(value) {
        this.left = value;
        this.top = value;
        this.width = value;
        this.height = value;
        this.maxHeight = value;
        this.maxWidth = value;
        this.minHeight = value;
        this.minWidth = value;
        this.zIndex = value;
        this.transform = value;
        this.transformOrigin = value;
    }
}

/**
 * Encapsulates internal data from a TJSPosition instance to be manipulated by {@link UpdateElementManager}.
 */
class UpdateElementData {
    changeSet;
    data;
    dataSubscribers;
    dimensionData;
    options;
    queued;
    storeDimension;
    storeTransform;
    styleCache;
    subscribers;
    transforms;
    transformData;
    constructor(changeSet, data, options, styleCache, subscribers, transforms) {
        /**
         */
        this.changeSet = changeSet;
        /**
         * Stores the private data from TJSPosition.
         */
        this.data = data;
        /**
         * Provides a copy of local data sent to subscribers.
         */
        this.dataSubscribers = Object.seal(new TJSPositionData());
        /**
         * Stores the current dimension data used for the readable `dimension` store.
         */
        this.dimensionData = Object.seal({ width: 0, height: 0 });
        /**
         */
        this.options = options;
        /**
         * Stores if this TJSPosition / update data is queued for update.
         */
        this.queued = false;
        /**
         */
        this.styleCache = styleCache;
        /**
         */
        this.storeDimension = writable(this.dimensionData);
        /**
         */
        this.subscribers = subscribers;
        /**
         */
        this.transforms = transforms;
        /**
         * Stores the current transform data used for the readable `transform` store. It is only active when there are
         * subscribers to the store or calculateTransform options is true.
         */
        this.transformData = new TJSTransformData();
        /**
         * When there are subscribers set option to calculate transform updates; set to false when no subscribers.
         */
        this.storeTransform = writable(this.transformData, () => {
            this.options.transformSubscribed = true;
            return () => this.options.transformSubscribed = false;
        });
    }
}

/**
 * Decouples updates to any parent target HTMLElement inline styles. Invoke {@link TJSPosition.elementUpdated} to await
 * on the returned promise that is resolved with the current render time via `nextAnimationFrame` /
 * `requestAnimationFrame`. This allows the underlying data model to be updated immediately while updates to the
 * element are in sync with the browser and potentially in the future be further throttled.
 */
class UpdateElementManager {
    /**
     * Stores the active list of all TJSPosition instances currently updating. The list entries are recycled between
     * updates.
     */
    static list = [];
    /**
     * Tracks the current position in the list.
     */
    static listCntr = 0;
    static updatePromise;
    /**
     * Potentially adds the given element and internal updateData instance to the list.
     *
     * @param el - An HTMLElement instance.
     *
     * @param updateData - An UpdateElementData instance.
     *
     * @returns The unified next frame update promise. Returns `currentTime`.
     */
    static add(el, updateData) {
        if (this.listCntr < this.list.length) {
            const entry = this.list[this.listCntr];
            entry[0] = el;
            entry[1] = updateData;
        }
        else {
            this.list.push([el, updateData]);
        }
        this.listCntr++;
        updateData.queued = true;
        if (!this.updatePromise) {
            this.updatePromise = this.wait();
        }
        return this.updatePromise;
    }
    /**
     * Await on `nextAnimationFrame` and iterate over list map invoking callback functions.
     *
     * @returns The next frame Promise / currentTime from nextAnimationFrame.
     */
    static async wait() {
        // Await the next animation frame. In the future this can be extended to multiple frames to divide update rate.
        const currentTime = await nextAnimationFrame();
        this.updatePromise = void 0;
        for (let cntr = this.listCntr; --cntr >= 0;) {
            // Obtain data for entry.
            const entry = this.list[cntr];
            const el = entry[0];
            const updateData = entry[1];
            // Clear entry data.
            entry[0] = void 0;
            entry[1] = void 0;
            // Reset queued state.
            updateData.queued = false;
            // Early out if the element is no longer connected to the DOM / shadow root.
            if (!el.isConnected) {
                continue;
            }
            if (updateData.options.ortho) {
                UpdateElementManager.#updateElementOrtho(el, updateData);
            }
            else {
                UpdateElementManager.#updateElement(el, updateData);
            }
            // If calculate transform options is enabled then update the transform data and set the readable store.
            if (updateData.options.calculateTransform || updateData.options.transformSubscribed) {
                UpdateElementManager.#updateTransform(updateData);
            }
            // Update all subscribers with changed data.
            this.updateSubscribers(updateData);
        }
        this.listCntr = 0;
        return currentTime;
    }
    /**
     * Potentially immediately updates the given element.
     *
     * @param el - An HTMLElement instance.
     *
     * @param updateData - An UpdateElementData instance.
     */
    static immediate(el, updateData) {
        // Early out if the element is no longer connected to the DOM / shadow root.
        if (!el.isConnected) {
            return;
        }
        if (updateData.options.ortho) {
            UpdateElementManager.#updateElementOrtho(el, updateData);
        }
        else {
            UpdateElementManager.#updateElement(el, updateData);
        }
        // If calculate transform options is enabled then update the transform data and set the readable store.
        if (updateData.options.calculateTransform || updateData.options.transformSubscribed) {
            UpdateElementManager.#updateTransform(updateData);
        }
        // Update all subscribers with changed data.
        this.updateSubscribers(updateData);
    }
    /**
     * @param updateData - Data change set.
     */
    static updateSubscribers(updateData) {
        const data = updateData.data;
        const changeSet = updateData.changeSet;
        if (!changeSet.hasChange()) {
            return;
        }
        // Make a copy of the data.
        const output = TJSPositionDataUtil.copyData(data, updateData.dataSubscribers);
        const subscribers = updateData.subscribers;
        // Early out if there are no subscribers.
        if (subscribers.length > 0) {
            for (let cntr = 0; cntr < subscribers.length; cntr++) {
                subscribers[cntr](output);
            }
        }
        // Update dimension data if width / height has changed.
        if (changeSet.width || changeSet.height) {
            updateData.dimensionData.width = data.width;
            updateData.dimensionData.height = data.height;
            updateData.storeDimension.set(updateData.dimensionData);
        }
        changeSet.set(false);
    }
    // Internal Implementation ----------------------------------------------------------------------------------------
    /**
     * Temporary data for validation.
     */
    static #validationData = Object.seal({
        height: 0,
        width: 0,
        marginLeft: 0,
        marginTop: 0
    });
    /**
     * Decouples updates to any parent target HTMLElement inline styles. Invoke {@link TJSPosition.elementUpdated} to
     * await on the returned promise that is resolved with the current render time via `nextAnimationFrame` /
     * `requestAnimationFrame`. This allows the underlying data model to be updated immediately while updates to the
     * element are in sync with the browser and potentially in the future be further throttled.
     *
     * @param el - The target HTMLElement.
     *
     * @param updateData - Update data.
     */
    static #updateElement(el, updateData) {
        const changeSet = updateData.changeSet;
        const data = updateData.data;
        if (changeSet.left) {
            el.style.left = `${data.left}px`;
        }
        if (changeSet.top) {
            el.style.top = `${data.top}px`;
        }
        if (changeSet.zIndex) {
            el.style.zIndex = typeof data.zIndex === 'number' ? `${data.zIndex}` : '';
        }
        if (changeSet.width) {
            el.style.width = typeof data.width === 'number' ? `${data.width}px` : data.width;
        }
        if (changeSet.height) {
            el.style.height = typeof data.height === 'number' ? `${data.height}px` : data.height;
        }
        if (changeSet.transformOrigin) {
            el.style.transformOrigin = data.transformOrigin;
        }
        // Update all transforms in order added to transforms object.
        if (changeSet.transform) {
            el.style.transform = updateData.transforms.isActive ? updateData.transforms.getCSS() : '';
        }
    }
    /**
     * Decouples updates to any parent target HTMLElement inline styles. Invoke {@link TJSPosition.elementUpdated} to
     * await on the returned promise that is resolved with the current render time via `nextAnimationFrame` /
     * `requestAnimationFrame`. This allows the underlying data model to be updated immediately while updates to the
     * element are in sync with the browser and potentially in the future be further throttled.
     *
     * @param el - The target HTMLElement.
     *
     * @param updateData - Update data.
     */
    static #updateElementOrtho(el, updateData) {
        const changeSet = updateData.changeSet;
        const data = updateData.data;
        if (changeSet.zIndex) {
            el.style.zIndex = typeof data.zIndex === 'number' ? `${data.zIndex}` : '';
        }
        if (changeSet.width) {
            el.style.width = typeof data.width === 'number' ? `${data.width}px` : data.width;
        }
        if (changeSet.height) {
            el.style.height = typeof data.height === 'number' ? `${data.height}px` : data.height;
        }
        if (changeSet.transformOrigin) {
            el.style.transformOrigin = data.transformOrigin;
        }
        // Update all transforms in order added to transforms object.
        if (changeSet.left || changeSet.top || changeSet.transform) {
            el.style.transform = updateData.transforms.getCSSOrtho(data);
        }
    }
    /**
     * Updates the applied transform data and sets the readable `transform` store.
     *
     * @param updateData - Update element data.
     */
    static #updateTransform(updateData) {
        const validationData = this.#validationData;
        validationData.height = updateData.data.height !== 'auto' && updateData.data.height !== 'inherit' ?
            updateData.data.height : updateData.styleCache.offsetHeight;
        validationData.width = updateData.data.width !== 'auto' && updateData.data.width !== 'inherit' ?
            updateData.data.width : updateData.styleCache.offsetWidth;
        validationData.marginLeft = updateData.styleCache.marginLeft;
        validationData.marginTop = updateData.styleCache.marginTop;
        // Get transform data. First set constraints including any margin top / left as offsets and width / height. Used
        // when position width / height is 'auto'.
        updateData.transforms.getData(updateData.data, updateData.transformData, validationData);
        updateData.storeTransform.set(updateData.transformData);
    }
}

var _a;
/**
 * Provides an advanced compound store for positioning elements dynamically including an optimized pipeline for updating
 * an associated element. Essential tweening / animation is supported in addition to a validation API to constrain
 * positional updates.
 */
class TJSPosition {
    /**
     * Public API for {@link TJSPosition.Initial}.
     */
    static #positionInitial = Object.freeze({
        browserCentered: new Centered({ lock: true }),
        Centered
    });
    /**
     * Public API for {@link TJSPosition.Validators}
     */
    static #positionValidators = Object.freeze({
        TransformBounds,
        transformWindow: new TransformBounds({ lock: true })
    });
    /**
     * Stores all position data / properties.
     */
    #data = Object.seal(new TJSPositionData());
    /**
     * Provides the animation API.
     */
    #animate = new AnimationAPIImpl(this, this.#data);
    /**
     * Provides a way to turn on / off the position handling.
     */
    #enabled = true;
    /**
     * Stores ongoing options that are set in the constructor or by transform store subscription.
     */
    #options = {
        calculateTransform: false,
        initial: void 0,
        ortho: true,
        transformSubscribed: false,
    };
    /**
     * The associated parent for positional data tracking. Used in validators.
     */
    #parent;
    /**
     * Stores the style attributes that changed on update.
     */
    #positionChangeSet = new PositionChangeSet();
    /**
     * Tracks the current state if this position instance is a candidate for resize observation by the `resizeObserver`
     * action. This is `true` when `width` or `height` is `auto` or `inherit`.
     */
    #resizeObservable = false;
    /**
     */
    #stores;
    /**
     * Stores an instance of the computer styles for the target element.
     */
    #styleCache;
    /**
     * Stores the subscribers.
     */
    #subscribers = [];
    /**
     */
    #transforms = new TJSTransforms();
    /**
     */
    #updateElementData;
    /**
     * Stores the UpdateElementManager wait promise.
     */
    #updateElementPromise;
    /**
     */
    #validators;
    /**
     */
    #validatorData;
    /**
     */
    #state = new PositionStateAPI(this, this.#data, this.#transforms);
    /**
     * @returns Public Animation Group API.
     */
    static get Animate() { return AnimationGroupAPIImpl; }
    /**
     * @returns TJSPositionData constructor.
     */
    static get Data() { return TJSPositionData; }
    /**
     * @returns TJSPosition default initial systems.
     */
    static get Initial() { return this.#positionInitial; }
    /**
     * @returns `SystemBase` constructor.
     */
    static get SystemBase() { return SystemBase; }
    /**
     * Returns TJSTransformData class / constructor.
     *
     * @returns TransformData class / constructor.
     */
    static get TransformData() { return TJSTransformData; }
    /**
     * Returns default validator systems.
     *
     * @returns Available validators.
     */
    static get Validators() { return this.#positionValidators; }
    /**
     * Returns a list of supported transform origins.
     *
     * @returns The supported transform origin strings.
     */
    static get transformOrigins() {
        return TJSTransforms.transformOrigins;
    }
    /**
     * Convenience to copy from source to target of two TJSPositionData like objects. If a target is not supplied a new
     * {@link TJSPositionData} instance is created.
     *
     * @param source - The source instance to copy from.
     *
     * @param [target] - Target TJSPositionData like object; if one is not provided a new instance is created.
     *
     * @returns The target instance with all TJSPositionData fields.
     */
    static copyData(source, target) {
        return TJSPositionDataUtil.copyData(source, target);
    }
    /**
     * Returns a duplicate of a given position instance copying any options and validators. The position parent is not
     * copied and a new one must be set manually via the {@link TJSPosition.parent} setter.
     *
     * @param position - A position instance.
     *
     * @param [options] - Unique new options to set.
     *
     * @returns A duplicate position instance.
     */
    static duplicate(position, options = {}) {
        if (!(position instanceof _a)) {
            throw new TypeError(`'position' is not an instance of TJSPosition.`);
        }
        const newPosition = new _a(options);
        newPosition.#options = Object.assign({}, position.#options, options);
        newPosition.#validators.add(...position.#validators);
        newPosition.set(position.#data);
        return newPosition;
    }
    /**
     * @param [parentOrOptions] - A  potential parent element or object w/ `elementTarget` accessor. You may also forego
     *        setting the parent and pass in the options object.
     *
     * @param [options] - The options object.
     */
    constructor(parentOrOptions, options) {
        // Test if `parent` is a plain object; if so treat as options object.
        if (isPlainObject(parentOrOptions)) {
            options = parentOrOptions;
        }
        else {
            this.#parent = parentOrOptions;
        }
        this.#styleCache = new TJSPositionStyleCache();
        const updateData = new UpdateElementData(this.#positionChangeSet, this.#data, this.#options, this.#styleCache, this.#subscribers, this.#transforms);
        this.#updateElementData = updateData;
        // Set TJSPosition options -------------------------------------------------------------------------------------
        if (typeof options?.calculateTransform === 'boolean') {
            this.#options.calculateTransform = options.calculateTransform;
        }
        if (typeof options?.ortho === 'boolean') {
            this.#options.ortho = options.ortho;
        }
        // Initialize stores -------------------------------------------------------------------------------------------
        this.#stores = Object.freeze({
            // The main properties for manipulating TJSPosition.
            height: propertyStore(this, 'height'),
            left: propertyStore(this, 'left'),
            rotateX: propertyStore(this, 'rotateX'),
            rotateY: propertyStore(this, 'rotateY'),
            rotateZ: propertyStore(this, 'rotateZ'),
            scale: propertyStore(this, 'scale'),
            top: propertyStore(this, 'top'),
            transformOrigin: propertyStore(this, 'transformOrigin'),
            translateX: propertyStore(this, 'translateX'),
            translateY: propertyStore(this, 'translateY'),
            translateZ: propertyStore(this, 'translateZ'),
            width: propertyStore(this, 'width'),
            zIndex: propertyStore(this, 'zIndex'),
            // Stores that control validation when width / height is not `auto`.
            maxHeight: propertyStore(this, 'maxHeight'),
            maxWidth: propertyStore(this, 'maxWidth'),
            minHeight: propertyStore(this, 'minHeight'),
            minWidth: propertyStore(this, 'minWidth'),
            // Readable stores based on updates or from resize observer changes.
            dimension: { subscribe: updateData.storeDimension.subscribe },
            element: { subscribe: this.#styleCache.stores.element.subscribe },
            resizeContentHeight: { subscribe: this.#styleCache.stores.resizeContentHeight.subscribe },
            resizeContentWidth: { subscribe: this.#styleCache.stores.resizeContentWidth.subscribe },
            resizeObservable: { subscribe: this.#styleCache.stores.resizeObservable.subscribe },
            resizeOffsetHeight: { subscribe: this.#styleCache.stores.resizeOffsetHeight.subscribe },
            resizeOffsetWidth: { subscribe: this.#styleCache.stores.resizeOffsetWidth.subscribe },
            transform: { subscribe: updateData.storeTransform.subscribe },
            // Protected store that should only be set by resizeObserver action.
            resizeObserved: this.#styleCache.stores.resizeObserved,
        });
        /**
         * Define 'values' getter to retrieve static transform origins.
         */
        Object.defineProperty(this.#stores.transformOrigin, 'values', {
            get: () => _a.transformOrigins
        });
        // When resize change from any applied `resizeObserver` action automatically set data for new validation run.
        // A resizeObserver prop should be set to true for ApplicationShell components or usage of resizeObserver action
        // to monitor for changes. This should only be used on elements that have 'auto' or `inherit` for width or height.
        subscribeIgnoreFirst(this.#stores.resizeObserved, (resizeData) => {
            const parent = this.#parent;
            const el = A11yHelper.isFocusTarget(parent) ? parent : parent?.elementTarget;
            // Only invoke set if there is a target element and the resize data has a valid offset width & height.
            if (A11yHelper.isFocusTarget(el) && Number.isFinite(resizeData?.offsetWidth) &&
                Number.isFinite(resizeData?.offsetHeight)) {
                this.set();
            }
        });
        [this.#validators, this.#validatorData] = AdapterValidators.create(() => this.set());
        if (options?.initial) {
            const initial = options.initial;
            if (typeof initial?.getLeft !== 'function' || typeof initial?.getTop !== 'function') {
                throw new Error(`'options.initial' position helper does not contain 'getLeft' and / or 'getTop' functions.`);
            }
            this.#options.initial = initial;
        }
        if (options?.validator) {
            if (isIterable(options?.validator)) {
                this.validators.add(...options.validator);
            }
            else {
                /**
                 */
                const validatorFn = options.validator;
                this.validators.add(validatorFn);
            }
        }
        Object.seal(this);
        // Set any remaining position data.
        if (isObject(options)) {
            this.set(options);
        }
    }
    /**
     * Returns the animation API.
     *
     * @returns Animation instance API.
     */
    get animate() {
        return this.#animate;
    }
    /**
     * Returns the dimension data for the readable store.
     *
     * @returns Dimension data.
     */
    get dimension() {
        return this.#updateElementData.dimensionData;
    }
    /**
     * Returns the enabled state.
     *
     * @returns Enabled state.
     */
    get enabled() {
        return this.#enabled;
    }
    /**
     * Returns the current HTMLElement being positioned.
     *
     * @returns Current HTMLElement being positioned.
     */
    get element() {
        return this.#styleCache.el;
    }
    /**
     * Returns a promise that is resolved on the next element update with the time of the update.
     *
     * @returns Promise resolved on element update.
     */
    get elementUpdated() {
        return this.#updateElementPromise;
    }
    /**
     * Returns the associated {@link TJSPosition.PositionParent} instance.
     *
     * @returns The current position parent instance.
     */
    get parent() { return this.#parent; }
    /**
     * Returns the state API.
     *
     * @returns TJSPosition state API.
     */
    get state() { return this.#state; }
    /**
     * Returns the derived writable stores for individual data variables.
     *
     * @returns Derived / writable stores.
     */
    get stores() { return this.#stores; }
    /**
     * Returns the transform data for the readable store.
     *
     * @returns Transform Data.
     */
    get transform() {
        return this.#updateElementData.transformData;
    }
    /**
     * Returns the validators.
     *
     * @returns Validators API
     */
    get validators() { return this.#validators; }
    /**
     * Sets the enabled state.
     *
     * @param enabled - New enabled state.
     */
    set enabled(enabled) {
        if (typeof enabled !== 'boolean') {
            throw new TypeError(`'enabled' is not a boolean.`);
        }
        this.#enabled = enabled;
    }
    /**
     * Sets the associated {@link TJSPosition.PositionParent} instance. Resets the style cache and default data.
     *
     * @param parent - A PositionParent instance or undefined to disassociate
     */
    set parent(parent) {
        if (parent !== void 0 && !A11yHelper.isFocusTarget(parent) && !isObject(parent)) {
            throw new TypeError(`'parent' is not an HTMLElement, object, or undefined.`);
        }
        this.#parent = parent;
        // Reset any stored default data & the style cache.
        this.#state.remove({ name: '#defaultData' });
        this.#styleCache.reset();
        // If a parent is defined then invoke set to update any parent element.
        if (parent) {
            this.set(this.#data);
        }
    }
    // Data accessors ----------------------------------------------------------------------------------------------------
    /**
     * @returns height
     */
    get height() { return this.#data.height; }
    /**
     * @returns left
     */
    get left() { return this.#data.left; }
    /**
     * @returns maxHeight
     */
    get maxHeight() { return this.#data.maxHeight; }
    /**
     * @returns maxWidth
     */
    get maxWidth() { return this.#data.maxWidth; }
    /**
     * @returns minHeight
     */
    get minHeight() { return this.#data.minHeight; }
    /**
     * @returns minWidth
     */
    get minWidth() { return this.#data.minWidth; }
    /**
     * @returns rotateX
     */
    get rotateX() { return this.#data.rotateX; }
    /**
     * @returns rotateY
     */
    get rotateY() { return this.#data.rotateY; }
    /**
     * @returns rotateZ
     */
    get rotateZ() { return this.#data.rotateZ; }
    /**
     * @returns Alias for rotateZ
     */
    get rotation() { return this.#data.rotateZ; }
    /**
     * @returns scale
     */
    get scale() { return this.#data.scale; }
    /**
     * @returns top
     */
    get top() { return this.#data.top; }
    /**
     * @returns transformOrigin
     */
    get transformOrigin() { return this.#data.transformOrigin; }
    /**
     * @returns translateX
     */
    get translateX() { return this.#data.translateX; }
    /**
     * @returns translateY
     */
    get translateY() { return this.#data.translateY; }
    /**
     * @returns translateZ
     */
    get translateZ() { return this.#data.translateZ; }
    /**
     * @returns width
     */
    get width() { return this.#data.width; }
    /**
     * @returns z-index
     */
    get zIndex() { return this.#data.zIndex; }
    /**
     * @param height -
     */
    set height(height) {
        this.#stores.height.set(height);
    }
    /**
     * @param left -
     */
    set left(left) {
        this.#stores.left.set(left);
    }
    /**
     * @param maxHeight -
     */
    set maxHeight(maxHeight) {
        this.#stores.maxHeight.set(maxHeight);
    }
    /**
     * @param maxWidth -
     */
    set maxWidth(maxWidth) {
        this.#stores.maxWidth.set(maxWidth);
    }
    /**
     * @param minHeight -
     */
    set minHeight(minHeight) {
        this.#stores.minHeight.set(minHeight);
    }
    /**
     * @param minWidth -
     */
    set minWidth(minWidth) {
        this.#stores.minWidth.set(minWidth);
    }
    /**
     * @param rotateX -
     */
    set rotateX(rotateX) {
        this.#stores.rotateX.set(rotateX);
    }
    /**
     * @param rotateY -
     */
    set rotateY(rotateY) {
        this.#stores.rotateY.set(rotateY);
    }
    /**
     * @param rotateZ -
     */
    set rotateZ(rotateZ) {
        this.#stores.rotateZ.set(rotateZ);
    }
    /**
     * @param  rotateZ - alias for rotateZ
     */
    set rotation(rotateZ) {
        this.#stores.rotateZ.set(rotateZ);
    }
    /**
     * @param scale -
     */
    set scale(scale) {
        this.#stores.scale.set(scale);
    }
    /**
     * @param top -
     */
    set top(top) {
        this.#stores.top.set(top);
    }
    /**
     * @param transformOrigin -
     */
    set transformOrigin(transformOrigin) {
        if (TJSTransforms.transformOrigins.includes(transformOrigin)) {
            this.#stores.transformOrigin.set(transformOrigin);
        }
    }
    /**
     * @param translateX -
     */
    set translateX(translateX) {
        this.#stores.translateX.set(translateX);
    }
    /**
     * @param translateY -
     */
    set translateY(translateY) {
        this.#stores.translateY.set(translateY);
    }
    /**
     * @param translateZ -
     */
    set translateZ(translateZ) {
        this.#stores.translateZ.set(translateZ);
    }
    /**
     * @param width -
     */
    set width(width) {
        this.#stores.width.set(width);
    }
    /**
     * @param zIndex -
     */
    set zIndex(zIndex) {
        this.#stores.zIndex.set(zIndex);
    }
    /**
     * Assigns current position data to given object `data` object. By default, `null` position data is not assigned.
     * Other options allow configuration of the data assigned including setting default numeric values for any properties
     * that are null.
     *
     * @param [data] - Target to assign current position data.
     *
     * @param [options] - Defines options for specific keys and substituting null for numeric default values. By
     *        default, nullable keys are included.
     *
     * @returns Passed in object with current position data.
     */
    get(data = {}, options = {}) {
        const keys = options?.keys;
        const excludeKeys = options?.exclude;
        const nullable = options?.nullable ?? true;
        const numeric = options?.numeric ?? false;
        if (isIterable(keys)) {
            for (const key of keys) {
                // Convert any null values to numeric defaults if `numeric` is true.
                data[key] = numeric ? TJSPositionDataUtil.getDataOrDefault(this, key) : this[key];
                // Potentially remove null keys.
                if (!nullable && data[key] === null) {
                    delete data[key];
                }
            }
            // Remove any excluded keys.
            if (isIterable(excludeKeys)) {
                for (const key of excludeKeys) {
                    delete data[key];
                }
            }
            return data;
        }
        else {
            data = Object.assign(data, this.#data);
            // Remove any excluded keys.
            if (isIterable(excludeKeys)) {
                for (const key of excludeKeys) {
                    delete data[key];
                }
            }
            // Potentially set numeric defaults.
            if (numeric) {
                TJSPositionDataUtil.setNumericDefaults(data);
            }
            if (!nullable) {
                for (const key in data) {
                    if (data[key] === null) {
                        delete data[key];
                    }
                }
            }
            return data;
        }
    }
    /**
     * @returns Current position data.
     */
    toJSON() {
        return Object.assign({}, this.#data);
    }
    /**
     * All calculation and updates of position are implemented in {@link TJSPosition}. This allows position to be fully
     * reactive and in control of updating inline styles for a connected {@link HTMLElement}.
     *
     * The initial set call with a target element will always set width / height as this is necessary for correct
     * calculations.
     *
     * When a target element is present updated styles are applied after validation. To modify the behavior of set
     * implement one or more validator functions and add them via the validator API available from
     * {@link TJSPosition.validators}.
     *
     * Updates to any target element are decoupled from the underlying TJSPosition data. This method returns this
     * instance that you can then await on the target element inline style update by using
     * {@link TJSPosition.elementUpdated}.
     *
     * Relative updates to any property of {@link TJSPositionData} are possible by specifying properties as strings.
     * This string should be in the form of '+=', '-=', or '*=' and float / numeric value. IE '+=0.2'.
     * {@link TJSPosition.set} will apply the `addition`, `subtraction`, or `multiplication` operation specified against
     * the current value of the given property. Please see {@link Data.TJSPositionDataRelative} for a detailed
     * description.
     *
     * @param [position] - TJSPosition data to set.
     *
     * @param [options] - Additional options.
     *
     * @returns This TJSPosition instance.
     */
    set(position = {}, options = {}) {
        if (!isObject(position)) {
            throw new TypeError(`TJSPosition - set error: 'position' is not an object.`);
        }
        // TJSPosition.PositionParent
        const parent = this.#parent;
        // An early out to prevent `set` from taking effect if not enabled.
        if (!this.#enabled) {
            return this;
        }
        // An early out to prevent `set` from taking effect if options `positionable` is false.
        // TODO: THIS IS REFERENCING APPLICATION OPTIONS.
        if (parent !== void 0 && typeof parent?.options?.positionable === 'boolean' && !parent?.options?.positionable) {
            return this;
        }
        const immediateElementUpdate = options?.immediateElementUpdate ?? false;
        const data = this.#data;
        const transforms = this.#transforms;
        // Find the target HTML element and verify that it is connected storing it in `el`.
        const targetEl = A11yHelper.isFocusTarget(parent) ? parent : parent?.elementTarget;
        const el = A11yHelper.isFocusTarget(targetEl) && targetEl.isConnected ? targetEl :
            void 0;
        const changeSet = this.#positionChangeSet;
        const styleCache = this.#styleCache;
        if (el) {
            // Cache the computed styles of the element.
            if (!styleCache.hasData(el)) {
                styleCache.update(el);
                // Add will-change property if not already set in inline or computed styles.
                if (!styleCache.hasWillChange) ;
                // Update all properties / clear queued state.
                changeSet.set(true);
                this.#updateElementData.queued = false;
            }
            // Converts any string position data to numeric inputs.
            ConvertStringData.process(position, this.#data, el);
            position = this.#updatePosition(position, parent, el, styleCache);
            // Check if a validator cancelled the update.
            if (position === null) {
                return this;
            }
        }
        if (NumberGuard.isFinite(position.left)) {
            position.left = Math.round(position.left);
            if (data.left !== position.left) {
                data.left = position.left;
                changeSet.left = true;
            }
        }
        if (NumberGuard.isFinite(position.top)) {
            position.top = Math.round(position.top);
            if (data.top !== position.top) {
                data.top = position.top;
                changeSet.top = true;
            }
        }
        if (NumberGuard.isFiniteOrNull(position.maxHeight)) {
            position.maxHeight = typeof position.maxHeight === 'number' ? Math.round(position.maxHeight) : null;
            if (data.maxHeight !== position.maxHeight) {
                data.maxHeight = position.maxHeight;
                changeSet.maxHeight = true;
            }
        }
        if (NumberGuard.isFiniteOrNull(position.maxWidth)) {
            position.maxWidth = typeof position.maxWidth === 'number' ? Math.round(position.maxWidth) : null;
            if (data.maxWidth !== position.maxWidth) {
                data.maxWidth = position.maxWidth;
                changeSet.maxWidth = true;
            }
        }
        if (NumberGuard.isFiniteOrNull(position.minHeight)) {
            position.minHeight = typeof position.minHeight === 'number' ? Math.round(position.minHeight) : null;
            if (data.minHeight !== position.minHeight) {
                data.minHeight = position.minHeight;
                changeSet.minHeight = true;
            }
        }
        if (NumberGuard.isFiniteOrNull(position.minWidth)) {
            position.minWidth = typeof position.minWidth === 'number' ? Math.round(position.minWidth) : null;
            if (data.minWidth !== position.minWidth) {
                data.minWidth = position.minWidth;
                changeSet.minWidth = true;
            }
        }
        if (NumberGuard.isFiniteOrNull(position.rotateX)) {
            if (data.rotateX !== position.rotateX) {
                data.rotateX = transforms.rotateX = position.rotateX;
                changeSet.transform = true;
            }
        }
        if (NumberGuard.isFiniteOrNull(position.rotateY)) {
            if (data.rotateY !== position.rotateY) {
                data.rotateY = transforms.rotateY = position.rotateY;
                changeSet.transform = true;
            }
        }
        if (NumberGuard.isFiniteOrNull(position.rotateZ)) {
            if (data.rotateZ !== position.rotateZ) {
                data.rotateZ = transforms.rotateZ = position.rotateZ;
                changeSet.transform = true;
            }
        }
        if (NumberGuard.isFiniteOrNull(position.scale)) {
            position.scale = typeof position.scale === 'number' ? clamp(position.scale, 0, 1000) : null;
            if (data.scale !== position.scale) {
                data.scale = transforms.scale = position.scale;
                changeSet.transform = true;
            }
        }
        if ((typeof position.transformOrigin === 'string' && TJSTransforms.transformOrigins.includes(position.transformOrigin)) || position.transformOrigin === null) {
            if (data.transformOrigin !== position.transformOrigin) {
                data.transformOrigin = position.transformOrigin;
                changeSet.transformOrigin = true;
            }
        }
        if (NumberGuard.isFiniteOrNull(position.translateX)) {
            if (data.translateX !== position.translateX) {
                data.translateX = transforms.translateX = position.translateX;
                changeSet.transform = true;
            }
        }
        if (NumberGuard.isFiniteOrNull(position.translateY)) {
            if (data.translateY !== position.translateY) {
                data.translateY = transforms.translateY = position.translateY;
                changeSet.transform = true;
            }
        }
        if (NumberGuard.isFiniteOrNull(position.translateZ)) {
            if (data.translateZ !== position.translateZ) {
                data.translateZ = transforms.translateZ = position.translateZ;
                changeSet.transform = true;
            }
        }
        if (NumberGuard.isFinite(position.zIndex)) {
            position.zIndex = Math.round(position.zIndex);
            if (data.zIndex !== position.zIndex) {
                data.zIndex = position.zIndex;
                changeSet.zIndex = true;
            }
        }
        const widthIsObservable = position.width === 'auto' || position.width === 'inherit';
        if (NumberGuard.isFiniteOrNull(position.width) || widthIsObservable) {
            position.width = typeof position.width === 'number' ? Math.round(position.width) : position.width;
            if (data.width !== position.width) {
                data.width = position.width;
                changeSet.width = true;
            }
        }
        const heightIsObservable = position.height === 'auto' || position.height === 'inherit';
        if (NumberGuard.isFiniteOrNull(position.height) || heightIsObservable) {
            position.height = typeof position.height === 'number' ? Math.round(position.height) : position.height;
            if (data.height !== position.height) {
                data.height = position.height;
                changeSet.height = true;
            }
        }
        // Potentially update the `resizeObservable` store when the state of `width` or `height` changes between
        // `auto` / `inherit` to a number or null.
        const resizeObservable = widthIsObservable || heightIsObservable;
        if (this.#resizeObservable !== resizeObservable) {
            this.#resizeObservable = resizeObservable;
            // Set store on next clock tick.
            // setTimeout(() => this.#styleCache.stores.resizeObservable.set(resizeObservable), 0);
            this.#styleCache.stores.resizeObservable.set(resizeObservable);
        }
        if (el) {
            const defaultData = this.#state.getDefault();
            // Set default data after first set operation that has a target element.
            if (!isObject(defaultData)) {
                this.#state.save({ name: '#defaultData', ...Object.assign({}, data) });
            }
            // If `immediateElementUpdate` is true then update the element immediately. This is for rAF based library
            // integrations like GSAP and updates coming from AnimationManager.
            if (immediateElementUpdate) {
                UpdateElementManager.immediate(el, this.#updateElementData);
                this.#updateElementPromise = Promise.resolve(globalThis.performance.now());
            }
            // Else if not queued then queue an update for the next rAF callback.
            else if (!this.#updateElementData.queued) {
                this.#updateElementPromise = UpdateElementManager.add(el, this.#updateElementData);
            }
        }
        else {
            // Notify main store subscribers.
            UpdateElementManager.updateSubscribers(this.#updateElementData);
        }
        return this;
    }
    /**
     * @param handler - Callback function that is invoked on update / changes. Receives a readonly copy of the
     *        TJSPositionData.
     *
     * @returns Unsubscribe function.
     */
    subscribe(handler) {
        const currentIdx = this.#subscribers.findIndex((entry) => entry === handler);
        if (currentIdx === -1) {
            this.#subscribers.push(handler); // add handler to the array of subscribers
            handler(Object.assign({}, this.#data)); // call handler with current value
        }
        // Return unsubscribe function.
        return () => {
            const existingIdx = this.#subscribers.findIndex((entry) => entry === handler);
            if (existingIdx !== -1) {
                this.#subscribers.splice(existingIdx, 1);
            }
        };
    }
    /**
     * Provides the {@link Writable} store `update` method. Receive and return a {@link TJSPositionData} instance to
     * update the position state. You may manipulate numeric properties by providing relative adjustments described in
     * {@link TJSPositionDataRelative}.
     *
     * @param updater -
     */
    update(updater) {
        const result = updater(this.get());
        if (!isObject(result)) {
            throw new TypeError(`'result' of 'updater' is not an object.`);
        }
        this.set(result);
    }
    // Internal Implementation ----------------------------------------------------------------------------------------
    /**
     * Temporary data storage for `TJSPosition.#updatePosition`.
     */
    static #updateDataCopy = Object.seal(new TJSPositionData());
    /**
     * Temporary data storage for `TJSPosition.#updatePosition`.
     */
    static #validationData = Object.seal({
        position: void 0,
        parent: void 0,
        el: void 0,
        computed: void 0,
        transforms: void 0,
        height: void 0,
        width: void 0,
        marginLeft: void 0,
        marginTop: void 0,
        maxHeight: void 0,
        maxWidth: void 0,
        minHeight: void 0,
        minWidth: void 0,
        rest: void 0
    });
    /**
     * @param data -
     *
     * @param parent -
     *
     * @param el -
     *
     * @param styleCache -
     *
     * @returns Updated position data or null if validation fails.
     */
    #updatePosition({ 
    // Directly supported parameters
    left, top, maxWidth, maxHeight, minWidth, minHeight, width, height, rotateX, rotateY, rotateZ, scale, transformOrigin, translateX, translateY, translateZ, zIndex, 
    // Aliased parameters
    rotation, ...rest }, parent, el, styleCache) {
        let currentPosition = TJSPositionDataUtil.copyData(this.#data, _a.#updateDataCopy);
        // Update width if an explicit value is passed, or if no width value is set on the element.
        if (width !== void 0 || el.style.width === '') {
            const widthValid = width === null || Number.isFinite(width);
            if (width === 'auto' || (currentPosition.width === 'auto' && !widthValid)) {
                currentPosition.width = 'auto';
                width = styleCache.offsetWidth;
            }
            else if (width === 'inherit' || (currentPosition.width === 'inherit' && !widthValid)) {
                currentPosition.width = 'inherit';
                width = styleCache.offsetWidth;
            }
            else {
                const newWidth = NumberGuard.isFinite(width) ? width :
                    currentPosition.width;
                currentPosition.width = width = NumberGuard.isFinite(newWidth) ? Math.round(newWidth) :
                    styleCache.offsetWidth;
            }
        }
        else {
            width = Number.isFinite(currentPosition.width) ? currentPosition.width : styleCache.offsetWidth;
        }
        // Update height if an explicit value is passed, or if no height value is set on the element.
        if (height !== void 0 || el.style.height === '') {
            const heightValid = height === null || Number.isFinite(height);
            if (height === 'auto' || (currentPosition.height === 'auto' && !heightValid)) {
                currentPosition.height = 'auto';
                height = styleCache.offsetHeight;
            }
            else if (height === 'inherit' || (currentPosition.height === 'inherit' && !heightValid)) {
                currentPosition.height = 'inherit';
                height = styleCache.offsetHeight;
            }
            else {
                const newHeight = NumberGuard.isFinite(height) ? height :
                    currentPosition.height;
                currentPosition.height = height = NumberGuard.isFinite(newHeight) ? Math.round(newHeight) :
                    styleCache.offsetHeight;
            }
        }
        else {
            height = Number.isFinite(currentPosition.height) ? currentPosition.height : styleCache.offsetHeight;
        }
        // Update left
        if (NumberGuard.isFinite(left)) {
            currentPosition.left = left;
        }
        else if (!Number.isFinite(currentPosition.left)) {
            // Potentially use any initial position helper if available or set to 0.
            currentPosition.left = typeof this.#options?.initial?.getLeft === 'function' ?
                this.#options.initial.getLeft(width) : 0;
        }
        // Update top
        if (Number.isFinite(top)) {
            currentPosition.top = top;
        }
        else if (!Number.isFinite(currentPosition.top)) {
            // Potentially use any initial position helper if available or set to 0.
            currentPosition.top = typeof this.#options?.initial?.getTop === 'function' ?
                this.#options.initial.getTop(height) : 0;
        }
        if (NumberGuard.isFiniteOrNull(maxHeight)) {
            currentPosition.maxHeight = NumberGuard.isFinite(maxHeight) ? Math.round(maxHeight) : null;
        }
        if (NumberGuard.isFiniteOrNull(maxWidth)) {
            currentPosition.maxWidth = NumberGuard.isFinite(maxWidth) ? Math.round(maxWidth) : null;
        }
        if (NumberGuard.isFiniteOrNull(minHeight)) {
            currentPosition.minHeight = NumberGuard.isFinite(minHeight) ? Math.round(minHeight) : null;
        }
        if (NumberGuard.isFiniteOrNull(minWidth)) {
            currentPosition.minWidth = NumberGuard.isFinite(minWidth) ? Math.round(minWidth) : null;
        }
        // Update rotate X/Y/Z, scale, z-index
        if (NumberGuard.isFiniteOrNull(rotateX)) {
            currentPosition.rotateX = rotateX;
        }
        if (NumberGuard.isFiniteOrNull(rotateY)) {
            currentPosition.rotateY = rotateY;
        }
        // Handle alias for rotateZ. First check if `rotateZ` is valid and different from the current value. Next check if
        // `rotation` is valid and use it for `rotateZ`.
        if (rotateZ !== currentPosition.rotateZ && (NumberGuard.isFiniteOrNull(rotateZ))) {
            currentPosition.rotateZ = rotateZ;
        }
        else if (rotation !== currentPosition.rotateZ && (NumberGuard.isFiniteOrNull(rotation))) {
            currentPosition.rotateZ = rotation;
        }
        if (NumberGuard.isFiniteOrNull(translateX)) {
            currentPosition.translateX = translateX;
        }
        if (NumberGuard.isFiniteOrNull(translateY)) {
            currentPosition.translateY = translateY;
        }
        if (NumberGuard.isFiniteOrNull(translateZ)) {
            currentPosition.translateZ = translateZ;
        }
        if (NumberGuard.isFiniteOrNull(scale)) {
            currentPosition.scale = typeof scale === 'number' ? clamp(scale, 0, 1000) : null;
        }
        if (typeof transformOrigin === 'string' || transformOrigin === null) {
            currentPosition.transformOrigin = TJSTransforms.transformOrigins.includes(transformOrigin) ? transformOrigin :
                null;
        }
        if (NumberGuard.isFiniteOrNull(zIndex)) {
            currentPosition.zIndex = typeof zIndex === 'number' ? Math.round(zIndex) : zIndex;
        }
        const validatorData = this.#validatorData;
        // If there are any validators allow them to potentially modify position data or reject the update.
        if (this.#validators.enabled && validatorData.length) {
            const validationData = _a.#validationData;
            validationData.parent = parent;
            validationData.el = el;
            validationData.computed = styleCache.computed;
            validationData.transforms = this.#transforms;
            validationData.height = height;
            validationData.width = width;
            validationData.marginLeft = styleCache.marginLeft;
            validationData.marginTop = styleCache.marginTop;
            validationData.maxHeight = styleCache.maxHeight ?? currentPosition.maxHeight;
            validationData.maxWidth = styleCache.maxWidth ?? currentPosition.maxWidth;
            // Given a parent w/ reactive state and is minimized ignore styleCache min-width/height.
            // TODO: THIS IS REFERENCING APPLICATION OPTIONS.
            const isMinimized = parent?.reactive?.minimized ?? false;
            // Note the use of || for accessing the style cache as the left hand is ignored w/ falsy values such as '0'.
            validationData.minHeight = isMinimized ? currentPosition.minHeight ?? 0 :
                styleCache.minHeight || (currentPosition.minHeight ?? 0);
            validationData.minWidth = isMinimized ? currentPosition.minWidth ?? 0 :
                styleCache.minWidth || (currentPosition.minWidth ?? 0);
            for (let cntr = 0; cntr < validatorData.length; cntr++) {
                validationData.position = currentPosition;
                validationData.rest = rest;
                currentPosition = validatorData[cntr].validate(validationData);
                if (currentPosition === null) {
                    return null;
                }
            }
        }
        // Return the updated position object.
        return currentPosition;
    }
}
_a = TJSPosition;

export { TJSPosition, applyPosition, draggable };
//# sourceMappingURL=index.js.map
