import { Mat4, Vec3 } from '@typhonjs-svelte/runtime-base/math/gl-matrix';
import * as _runtime_svelte_action_dom from '@typhonjs-svelte/runtime-base/svelte/action/dom';
import * as svelte_store from 'svelte/store';
import { Subscriber, Invalidator, Unsubscriber, Readable } from 'svelte/store';
import * as svelte_action from 'svelte/action';
import { EasingFunction } from 'svelte/transition';
import { InterpolateFunction } from '@typhonjs-svelte/runtime-base/math/interpolate';
import { IBasicAnimation } from '@typhonjs-svelte/runtime-base/util/animate';

/**
 * Defines the data objects / interfaces used by various TJSPosition APIs.
 */
declare namespace Data {
  /**
   * Defines the primary TJSPosition data object used by various TJSPosition APIs. To externally create a new instance
   * use the static accessor {@link TJSPosition.Data}.
   */
  interface TJSPositionData {
    height: number | 'auto' | 'inherit' | null;
    left: number | null;
    maxHeight: number | null;
    maxWidth: number | null;
    minHeight: number | null;
    minWidth: number | null;
    rotateX: number | null;
    rotateY: number | null;
    rotateZ: number | null;
    scale: number | null;
    top: number | null;
    transformOrigin: TransformAPI.TransformOrigin | null;
    translateX: number | null;
    translateY: number | null;
    translateZ: number | null;
    width: number | 'auto' | 'inherit' | null;
    zIndex: number | null;
  }
  /**
   * Defines a TJSPositionData instance that has extra properties / attributes.
   */
  interface TJSPositionDataExtra extends TJSPositionData {
    [key: string]: any;
  }
  /**
   * Defines the constructor function for {@link TJSPositionData}.
   */
  interface TJSPositionDataConstructor {
    new ({
      height,
      left,
      maxHeight,
      maxWidth,
      minHeight,
      minWidth,
      rotateX,
      rotateY,
      rotateZ,
      scale,
      translateX,
      translateY,
      translateZ,
      top,
      transformOrigin,
      width,
      zIndex,
    }?: {
      height?: number | 'auto' | 'inherit' | null;
      left?: number | null;
      maxHeight?: number | null;
      maxWidth?: number | null;
      minHeight?: number | null;
      minWidth?: number | null;
      rotateX?: number | null;
      rotateY?: number | null;
      rotateZ?: number | null;
      scale?: number | null;
      top?: number | null;
      transformOrigin?: TransformAPI.TransformOrigin | null;
      translateX?: number | null;
      translateY?: number | null;
      translateZ?: number | null;
      width?: number | 'auto' | 'inherit' | null;
      zIndex?: number | null;
    }): TJSPositionData;
  }
}

interface TransformAPI {
  /**
   * @returns {boolean} Whether there are active transforms in local data.
   */
  get isActive(): boolean;
  /**
   * @returns {number | undefined} Any local `rotateX` data.
   */
  get rotateX(): number | undefined;
  /**
   * @returns {number | undefined} Any local `rotateY` data.
   */
  get rotateY(): number | undefined;
  /**
   * @returns {number | undefined} Any local `rotateZ` data.
   */
  get rotateZ(): number | undefined;
  /**
   * @returns {number | undefined} Any local `scale` data.
   */
  get scale(): number | undefined;
  /**
   * @returns {number | undefined} Any local `translateX` data.
   */
  get translateX(): number | undefined;
  /**
   * @returns {number | undefined} Any local `translateY` data.
   */
  get translateY(): number | undefined;
  /**
   * @returns {number | undefined} Any local `translateZ` data.
   */
  get translateZ(): number | undefined;
  /**
   * Sets the local `rotateX` data if the value is a finite number otherwise removes the local data.
   *
   * @param {number | null | undefined}   value - A value to set.
   */
  set rotateX(value: number | null | undefined);
  /**
   * Sets the local `rotateY` data if the value is a finite number otherwise removes the local data.
   *
   * @param {number | null | undefined}   value - A value to set.
   */
  set rotateY(value: number | null | undefined);
  /**
   * Sets the local `rotateZ` data if the value is a finite number otherwise removes the local data.
   *
   * @param {number | null | undefined}   value - A value to set.
   */
  set rotateZ(value: number | null | undefined);
  /**
   * Sets the local `scale` data if the value is a finite number otherwise removes the local data.
   *
   * @param {number | null | undefined}   value - A value to set.
   */
  set scale(value: number | null | undefined);
  /**
   * Sets the local `translateX` data if the value is a finite number otherwise removes the local data.
   *
   * @param {number | null | undefined}   value - A value to set.
   */
  set translateX(value: number | null | undefined);
  /**
   * Sets the local `translateY` data if the value is a finite number otherwise removes the local data.
   *
   * @param {number | null | undefined}   value - A value to set.
   */
  set translateY(value: number | null | undefined);
  /**
   * Sets the local `translateZ` data if the value is a finite number otherwise removes the local data.
   *
   * @param {number | null | undefined}   value - A value to set.
   */
  set translateZ(value: number | null | undefined);
  /**
   * Returns the `matrix3d` CSS transform for the given position / transform data.
   *
   * @param {object} [data] - Optional position data otherwise use local stored transform data.
   *
   * @returns {string} The CSS `matrix3d` string.
   */
  getCSS(data?: object): string;
  /**
   * Returns the `matrix3d` CSS transform for the given position / transform data.
   *
   * @param {object} [data] - Optional position data otherwise use local stored transform data.
   *
   * @returns {string} The CSS `matrix3d` string.
   */
  getCSSOrtho(data?: object): string;
  /**
   * Collects all data including a bounding rect, transform matrix, and points array of the given
   * {@link TJSPositionData} instance with the applied local transform data.
   *
   * @param {Data.TJSPositionData} position - The position data to process.
   *
   * @param {TransformAPI.TransformData} [output] - Optional TransformAPI.Data output instance.
   *
   * @param {object} [validationData] - Optional validation data for adjustment parameters.
   *
   * @returns {TransformAPI.TransformData} The output TransformAPI.Data instance.
   */
  getData(
    position: Data.TJSPositionData,
    output?: TransformAPI.TransformData,
    validationData?: object,
  ): TransformAPI.TransformData;
  /**
   * Creates a transform matrix based on local data applied in order it was added.
   *
   * If no data object is provided then the source is the local transform data. If another data object is supplied
   * then the stored local transform order is applied then all remaining transform keys are applied. This allows the
   * construction of a transform matrix in advance of setting local data and is useful in collision detection.
   *
   * @param {Data.TJSPositionData}   [data] - TJSPositionData instance or local transform data.
   *
   * @param {Mat4}  [output] - The output mat4 instance.
   *
   * @returns {Mat4} Transform matrix.
   */
  getMat4(data?: object, output?: Mat4): Mat4;
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
   * @param {Data.TJSPositionData}   [data] - TJSPositionData instance or local transform data.
   *
   * @param {Mat4}  [output] - The output mat4 instance.
   *
   * @returns {Mat4} Transform matrix.
   */
  getMat4Ortho(data?: object, output?: Mat4): Mat4;
  /**
   * Tests an object if it contains transform keys and the values are finite numbers.
   *
   * @param {Data.TJSPositionData} data - An object to test for transform data.
   *
   * @returns {boolean} Whether the given TJSPositionData has transforms.
   */
  hasTransform(data: object): boolean;
  /**
   * Resets internal data from the given object containing valid transform keys.
   *
   * @param {object}   data - An object with transform data.
   */
  reset(data: object): void;
}
/**
 * Provides additional interfaces and type aliases for the transform API.
 */
declare namespace TransformAPI {
  /**
   * Describes the constructor function for {@link TransformData}.
   */
  interface TransformDataConstructor {
    new (): TransformData;
  }
  /**
   * Provides the output data for {@link TransformAPI.getData}.
   */
  interface TransformData {
    /**
     * @returns {DOMRect} The bounding rectangle.
     */
    get boundingRect(): DOMRect;
    /**
     * @returns {Vec3[]} The transformed corner points as Vec3 in screen space.
     */
    get corners(): Vec3[];
    /**
     * @returns {string} Returns the CSS style string for the transform matrix.
     */
    get css(): string;
    /**
     * @returns {Mat4} The transform matrix.
     */
    get mat4(): Mat4;
    /**
     * @returns {Mat4[]} The pre / post translation matrices for origin translation.
     */
    get originTranslations(): Mat4[];
  }
  /**
   * The supported transform origin strings.
   */
  type TransformOrigin =
    | 'top left'
    | 'top center'
    | 'top right'
    | 'center left'
    | 'center'
    | 'center right'
    | 'bottom left'
    | 'bottom center'
    | 'bottom right';
}

/**
 * Provides the validator API implementation for {@link TJSPosition.validators}. You may add one or more validator
 * functions which evaluate changes in the associated {@link TJSPosition} instance. This allows standard validation
 * for browser bounds / transform checking available via {@link TJSPosition.Validators} or custom validators added which
 * may provide unique bounding validation / constraints.
 */
interface ValidatorAPI {
  /**
   * @returns {boolean} Returns the enabled state.
   */
  get enabled(): boolean;
  /**
   * @returns {number} Returns the length of the validators array.
   */
  get length(): number;
  /**
   * @param {boolean}  enabled - Sets enabled state.
   */
  set enabled(enabled: boolean);
  /**
   * Provides an iterator for validators.
   *
   * @yields {ValidatorAPI.ValidatorData}
   * @returns {IterableIterator<ValidatorAPI.ValidatorData>} iterator.
   */
  [Symbol.iterator](): IterableIterator<ValidatorAPI.ValidatorData>;
  /**
   * Adds the given validators.
   *
   * @param {...(ValidatorAPI.ValidatorFn | ValidatorAPI.ValidatorData)}   validators - Validators to add.
   */
  add(...validators: (ValidatorAPI.ValidatorFn | ValidatorAPI.ValidatorData)[]): void;
  /**
   * Clears / removes all validators.
   */
  clear(): void;
  /**
   * Removes one or more given validators.
   *
   * @param {...(ValidatorAPI.ValidatorFn | ValidatorAPI.ValidatorData)}   validators - Validators to remove.
   */
  remove(...validators: (ValidatorAPI.ValidatorFn | ValidatorAPI.ValidatorData)[]): void;
  /**
   * Remove validators by the provided callback. The callback takes 3 parameters: `id`, `validator`, and `weight`.
   * Any truthy value returned will remove that validator.
   *
   * @param {ValidatorAPI.RemoveByCallback} callback - Callback function to evaluate each validator entry.
   */
  removeBy(callback: ValidatorAPI.RemoveByCallback): void;
  /**
   * Removes any validators with matching IDs.
   *
   * @param {...any} ids - IDs to remove.
   */
  removeById(...ids: any[]): void;
}
/**
 * Provides a namespace for all type aliases related to the validator API.
 */
declare namespace ValidatorAPI {
  /**
   * The data passed to validator functions to determine if the new `position` / TJSPosition data is valid.
   */
  type ValidationData = {
    /**
     * New position data to evaluate.
     */
    position: Data.TJSPositionData;
    /**
     * Associated parent element / container.
     */
    parent: TJSPositionParent;
    /**
     * Associated element being positioned.
     */
    el: HTMLElement;
    /**
     * Computed styles for the element.
     */
    computed: CSSStyleDeclaration;
    /**
     * Current applies transforms / transform tracking & conversion utility.
     */
    transforms: TransformAPI;
    /**
     * Current height
     */
    height: number;
    /**
     * Current width
     */
    width: number;
    /**
     * Current left margin.
     */
    marginLeft: number | undefined;
    /**
     * Current top margin.
     */
    marginTop: number | undefined;
    /**
     * Current max height.
     */
    maxHeight: number | undefined;
    /**
     * Current max width.
     */
    maxWidth: number | undefined;
    /**
     * Current min height.
     */
    minHeight: number | undefined;
    /**
     * Current min width.
     */
    minWidth: number | undefined;
    /**
     * The rest of any data submitted to {@link TJSPosition.set}.
     */
    rest: Record<string, any> | undefined;
  };
  /**
   * Defines a validator function entry with optional data such as assigning an `id` / `weight` or providing more
   * interactivity through attaching a subscriber function to monitor for updates that triggers validation.
   */
  type ValidatorData = {
    /**
     * TJSPosition validator function that takes a {@link Data.TJSPositionData} instance potentially modifying it or
     * returning null if invalid.
     */
    validate: ValidatorFn;
    /**
     * An ID associated with this validator. Can be used to remove the validator; default: `undefined`.
     */
    id?: any;
    /**
     * Optional subscribe function following the Svelte store / subscribe pattern. On updates validation will
     * be processed again.
     */
    subscribe?(this: void, run: Subscriber<any>, invalidate?: Invalidator<any>): Unsubscriber;
    /**
     * A number between 0 and 1 inclusive to position this validator against others; default: `1`.
     */
    weight?: number;
  };
  /**
   * Defines the {@link TJSPosition} validator options.
   */
  type Options = ValidatorFn | ValidatorData | Iterable<ValidatorFn | ValidatorData>;
  /**
   * Callback function to evaluate each validator entry. Return true to remove.
   *
   * @param {ValidatorData} data - ValidatorData instance to potentially filter / remove.
   */
  type RemoveByCallback = (data: ValidatorData) => boolean;
  interface ValidatorFn extends Function {
    /**
     * TJSPosition validator function that takes a {@link ValidationData} instance potentially modifying `position`
     * data or returning null if invalid.
     *
     * @param {ValidationData} data - Validation data to handle.
     *
     * @returns {Data.TJSPositionData | null} The validated position data or null to cancel position update.
     */
    (data: ValidationData): Data.TJSPositionData | null;
    /**
     * Optional subscribe function following the Svelte store / subscribe pattern. On updates validation will
     * be processed again.
     */
    subscribe?(this: void, run: Subscriber<any>, invalidate?: Invalidator<any>): Unsubscriber;
  }
}

/**
 * Defines the extension points that are available to provide custom implementations for initial positioning and
 * validation of positional movement. There are default implementations for initial `Centered` positioning available
 * via {@link TJSPosition.Initial} and browser window / element bounds validation with and without transform support
 * available via {@link TJSPosition.Validators}.
 */
declare namespace System {
  /**
   * Defines the initial position extension point for positioning elements. The default implementation for initial
   * `Centered` positioning is available via {@link TJSPosition.Initial}. To
   *
   * To create a unique initial position system extend {@link TJSPosition.SystemBase} and implement the
   * {@link InitialSystem} interface.
   */
  namespace Initial {
    /**
     * Provides helper functions to initially position an element.
     */
    interface InitialSystem extends SystemBase {
      /**
       * Get the left constraint.
       *
       * @param {number}   width - Target width.
       *
       * @returns {number} Calculated left constraint.
       */
      getLeft(width: number): number;
      /**
       * Get the top constraint.
       *
       * @param {number}   height - Target height.
       *
       * @returns {number} Calculated top constraint.
       */
      getTop(height: number): number;
    }
    /**
     * Describes the constructor function for an {@link InitialSystem} implementation.
     */
    interface InitialSystemConstructor {
      /**
       * @param {object}      [options] - Initial options.
       *
       * @param {boolean}     [options.constrain=true] - Constrain state.
       *
       * @param {HTMLElement} [options.element] - Target element.
       *
       * @param {boolean}     [options.enabled=true] - Enabled state.
       *
       * @param {boolean}     [options.lock=false] - Lock parameters from being set.
       *
       * @param {number}      [options.width] - Manual width.
       *
       * @param {number}      [options.height] - Manual height.
       */
      new ({
        constrain,
        element,
        enabled,
        lock,
        width,
        height,
      }?: {
        constrain?: boolean;
        element?: HTMLElement;
        enabled?: boolean;
        lock?: boolean;
        width?: number;
        height?: number;
      }): InitialSystem;
    }
  }
  /**
   * Defines the position validator extension point for constraining positional changes. The browser window / element
   * bounds validation with and without transform support is available via {@link TJSPosition.Validators}.
   *
   * To create a unique validator extend {@link TJSPosition.SystemBase} and implement the {@link ValidatorSystem}
   * interface.
   */
  namespace Validator {
    /**
     * Provides a system to validate positional changes.
     */
    interface ValidatorSystem extends SystemBase {
      /**
       * Provides a validator that respects transforms in positional data constraining the position to within the
       * target elements bounds.
       *
       * @param {ValidatorAPI.ValidationData}   valData - The associated validation data for position updates.
       *
       * @returns {Data.TJSPositionData} Potentially adjusted position data.
       */
      validate: ValidatorAPI.ValidatorFn;
      /**
       * An ID associated with this validator. Can be used to remove the validator; default: `undefined`.
       */
      id?: any;
      /**
       * Optional subscribe function following the Svelte store / subscribe pattern. On updates validation will
       * be processed again.
       */
      subscribe?(this: void, run: Subscriber<any>, invalidate?: Invalidator<any>): Unsubscriber;
      /**
       * A number between 0 and 1 inclusive to position this validator against others; default: `1`.
       */
      weight?: number;
    }
    /**
     * Describes the constructor function for an {@link ValidatorSystem} implementation.
     */
    interface ValidatorSystemConstructor {
      /**
       * @param {object}      [options] - Initial options.
       *
       * @param {boolean}     [options.constrain=true] - Constrain state.
       *
       * @param {HTMLElement} [options.element] - Target element.
       *
       * @param {boolean}     [options.enabled=true] - Enabled state.
       *
       * @param {boolean}     [options.lock=false] - Lock parameters from being set.
       *
       * @param {number}      [options.width] - Manual width.
       *
       * @param {number}      [options.height] - Manual height.
       */
      new ({
        constrain,
        element,
        enabled,
        lock,
        width,
        height,
      }?: {
        constrain?: boolean;
        element?: HTMLElement;
        enabled?: boolean;
        lock?: boolean;
        width?: number;
        height?: number;
      }): ValidatorSystem;
    }
  }
  interface SystemBase {
    /**
     * @returns {boolean} The current constrain state.
     */
    get constrain(): boolean;
    /**
     * @returns {HTMLElement | undefined | null} Target element.
     */
    get element(): HTMLElement | undefined | null;
    /**
     * @returns {boolean} Get enabled state.
     */
    get enabled(): boolean;
    /**
     * @returns {number} Get manual height.
     */
    get height(): number;
    /**
     * @return {boolean} Get locked state.
     */
    get locked(): boolean;
    /**
     * @returns {number} Get manual width.
     */
    get width(): number;
    /**
     * @param {boolean}  constrain - Set constrain state.
     */
    set constrain(constrain: boolean);
    /**
     * @param {HTMLElement | undefined | null} element - Set target element.
     */
    set element(element: HTMLElement | undefined | null);
    /**
     * @param {boolean}  enabled - Set enabled state.
     */
    set enabled(enabled: boolean);
    /**
     * @param {number}   height - Set manual height.
     */
    set height(height: number);
    /**
     * @param {number}   width - Set manual width.
     */
    set width(width: number);
    /**
     * Set manual width & height.
     *
     * @param {number}   width - New manual width.
     *
     * @param {number}   height - New manual height.
     */
    setDimension(width: number, height: number): void;
  }
  /**
   * Describes the constructor function for anu {@link SystemBase} implementation.
   */
  interface SystemBaseConstructor {
    /**
     * @param {object}      [options] - Initial options.
     *
     * @param {boolean}     [options.constrain=true] - Constrain state.
     *
     * @param {HTMLElement} [options.element] - Target element.
     *
     * @param {boolean}     [options.enabled=true] - Enabled state.
     *
     * @param {boolean}     [options.lock=false] - Lock parameters from being set.
     *
     * @param {number}      [options.width] - Manual width.
     *
     * @param {number}      [options.height] - Manual height.
     */
    new ({
      constrain,
      element,
      enabled,
      lock,
      width,
      height,
    }?: {
      constrain?: boolean;
      element?: HTMLElement;
      enabled?: boolean;
      lock?: boolean;
      width?: number;
      height?: number;
    }): SystemBase;
  }
}

/**
 * Provides an action to apply a TJSPosition instance to a HTMLElement and invoke `position.parent`
 *
 * @param {HTMLElement}       node - The node associated with the action.
 *
 * @param {import('..').TJSPosition}   position - A position instance.
 *
 * @returns {import('svelte/action').ActionReturn<import('..').TJSPosition>} The action lifecycle methods.
 */
declare function applyPosition(node: HTMLElement, position: TJSPosition): svelte_action.ActionReturn<TJSPosition>;

interface PositionStateAPI {
  /**
   * Returns any stored save state by name.
   *
   * @param {object}   options - Options
   *
   * @param {string}   options.name - Saved data set name.
   *
   * @returns {TJSPositionDataExtended} The saved data set.
   */
  get({ name }: { name: string }): TJSPositionDataExtended;
  /**
   * Returns any associated default data.
   *
   * @returns {TJSPositionDataExtended} Associated default data.
   */
  getDefault(): TJSPositionDataExtended;
  /**
   * Removes and returns any position state by name.
   *
   * @param {object}   options - Options.
   *
   * @param {string}   options.name - Name to remove and retrieve.
   *
   * @returns {TJSPositionDataExtended} Saved position data.
   */
  remove({ name }: { name: string }): TJSPositionDataExtended;
  /**
   * Resets data to default values and invokes set.
   *
   * @param {object}   [options] - Optional parameters.
   *
   * @param {boolean}  [options.keepZIndex=false] - When true keeps current z-index.
   *
   * @param {boolean}  [options.invokeSet=true] - When true invokes set method.
   *
   * @returns {boolean} Operation successful.
   */
  reset({ keepZIndex, invokeSet }: { keepZIndex: boolean; invokeSet: boolean }): boolean;
  /**
     * Restores a saved positional state returning the data. Several optional parameters are available
     * to control whether the restore action occurs silently (no store / inline styles updates), animates
     -   * to the stored data, or simply sets the stored data. Restoring via {@link AnimationAPI.to}
     * allows specification of the duration, easing, and interpolate functions along with configuring a Promise to be
     * returned if awaiting the end of the animation.
     *
     * @param {object}            options - Parameters
     *
     * @param {string}            options.name - Saved data set name.
     *
     * @param {boolean}           [options.remove=false] - Remove data set.
     *
     * @param {Iterable<string>}  [options.properties] - Specific properties to set / animate.
     *
     * @param {boolean}           [options.silent] - Set position data directly; no store or style updates.
     *
     * @param {boolean}           [options.async=false] - If animating return a Promise that resolves with any saved
     *        data.
     *
     * @param {boolean}           [options.animateTo=false] - Animate to restore data.
     *
     * @param {number}            [options.duration=0.1] - Duration in seconds.
     *
     * @param {EasingFunction}    [options.ease=linear] - Easing function.
     *
     * @param {InterpolateFunction}  [options.interpolate=lerp] - Interpolation function.
     *
     * @returns {TJSPositionDataExtended | Promise<TJSPositionDataExtended>} Saved position data.
     */
  restore({
    name,
    remove,
    properties,
    silent,
    async,
    animateTo,
    duration,
    ease,
    interpolate,
  }: {
    name: string;
    remove?: boolean;
    properties?: Iterable<string>;
    silent?: boolean;
    async?: boolean;
    animateTo?: boolean;
    duration?: number;
    ease?: EasingFunction;
    interpolate?: InterpolateFunction;
  }): TJSPositionDataExtended | Promise<TJSPositionDataExtended>;
  /**
   * Saves current position state with the opportunity to add extra data to the saved state. Simply include
   * extra properties in `options` to save extra data.
   *
   * @param {object}   options - Options.
   *
   * @param {string}   options.name - name to index this saved data.
   *
   * @returns {Data.TJSPositionDataExtra} Current position data
   */
  save({ name, ...extra }: { name: string; [key: string]: any }): Data.TJSPositionDataExtra;
  /**
   * Directly sets a position state. Simply include extra properties in `options` to set extra data.
   *
   * @param {object}   options - Options.
   *
   * @param {string}   options.name - name to index this saved data.
   */
  set({ name, ...data }: { name: string; [key: string]: any }): void;
}

/**
 * Provides a store for position following the subscriber protocol in addition to providing individual writable derived
 * stores for each independent variable.
 *
 * @implements {import('./types').TJSPositionTypes.ITJSPosition}
 */
declare class TJSPosition implements TJSPositionTypes.ITJSPosition {
  /**
   * @returns {import('./animation/types').AnimationGroupAPI} Public Animation API.
   */
  static get Animate(): AnimationGroupAPI;
  /**
   * @returns {import('./data/types').Data.TJSPositionDataConstructor} TJSPositionData constructor.
   */
  static get Data(): Data.TJSPositionDataConstructor;
  /**
   * @returns {import('./types').TJSPositionTypes.PositionInitial} TJSPosition default initial helpers.
   */
  static get Initial(): TJSPositionTypes.PositionInitial;
  /**
   * @returns {import('./system/types').System.SystemBaseConstructor} `SystemBase` constructor.
   */
  static get SystemBase(): System.SystemBaseConstructor;
  /**
   * Returns TJSTransformData class / constructor.
   *
   * @returns {import('./transform/types').TransformAPI.TransformDataConstructor} TransformData class /
   *          constructor.
   */
  static get TransformData(): TransformAPI.TransformDataConstructor;
  /**
   * Returns default validators.
   *
   * Note: `basicWindow` and `BasicBounds` will eventually be removed.
   *
   * @returns {import('./types').TJSPositionTypes.PositionValidators} Available validators.
   */
  static get Validators(): TJSPositionTypes.PositionValidators;
  /**
   * Convenience to copy from source to target of two TJSPositionData like objects. If a target is not supplied a new
   * {@link TJSPositionData} instance is created.
   *
   * @param {import('./data/types').Data.TJSPositionData}  source - The source instance to copy from.
   *
   * @param {import('./data/types').Data.TJSPositionData}  [target] - Target TJSPositionData like object; if one is not
   *        provided a new instance is created.
   *
   * @returns {import('./data/types').Data.TJSPositionData} The target instance.
   */
  static copyData(source: Data.TJSPositionData, target?: Data.TJSPositionData): Data.TJSPositionData;
  /**
   * Returns a duplicate of a given position instance copying any options and validators.
   *
   * // TODO: Consider more safety over options processing.
   *
   * @param {TJSPosition}          position - A position instance.
   *
   * @param {import('./').TJSPositionOptionsAll}   options - TJSPosition options.
   *
   * @returns {TJSPosition} A duplicate position instance.
   */
  static duplicate(position: TJSPosition, options: TJSPositionOptionsAll): TJSPosition;
  /**
   * @param {import('./').TJSPositionParent | import('./').TJSPositionOptionsAll}   [parent] - A
   *        potential parent element or object w/ `elementTarget` getter. May also be the TJSPositionOptions object
   *        w/ 1 argument.
   *
   * @param {import('./').TJSPositionOptionsAll}   [options] - Default values.
   */
  constructor(parent?: TJSPositionParent | TJSPositionOptionsAll, options?: TJSPositionOptionsAll);
  /**
   * Returns the animation API.
   *
   * @returns {import('./animation/types').AnimationAPI} Animation API.
   */
  get animate(): AnimationAPI;
  /**
   * Returns the dimension data for the readable store.
   *
   * @returns {{width: number | 'auto' | 'inherit', height: number | 'auto' | 'inherit'}} Dimension data.
   */
  get dimension(): {
    width: number | 'auto' | 'inherit';
    height: number | 'auto' | 'inherit';
  };
  /**
   * Sets the enabled state.
   *
   * @param {boolean}  enabled - New enabled state.
   */
  set enabled(enabled: boolean);
  /**
   * Returns the enabled state.
   *
   * @returns {boolean} Enabled state.
   */
  get enabled(): boolean;
  /**
   * Returns the current HTMLElement being positioned.
   *
   * @returns {HTMLElement | undefined} Current HTMLElement being positioned.
   */
  get element(): HTMLElement;
  /**
   * Returns a promise that is resolved on the next element update with the time of the update.
   *
   * @returns {Promise<number>} Promise resolved on element update.
   */
  get elementUpdated(): Promise<number>;
  /**
   * Sets the associated {@link TJSPositionParent} instance. Resets the style cache and default data.
   *
   * @param {import('./').TJSPositionParent} parent - A TJSPositionParent instance.
   */
  set parent(parent: TJSPositionParent);
  /**
   * Returns the associated {@link TJSPositionParent} instance.
   *
   * @returns {import('./').TJSPositionParent} The TJSPositionParent instance.
   */
  get parent(): TJSPositionParent;
  /**
   * Returns the state API.
   *
   * @returns {import('./state/types').PositionStateAPI} TJSPosition state API.
   */
  get state(): PositionStateAPI;
  /**
   * Returns the derived writable stores for individual data variables.
   *
   * @returns {import('./').TJSPositionStores} Derived / writable stores.
   */
  get stores(): TJSPositionStores;
  /**
   * Returns the transform data for the readable store.
   *
   * @returns {import('./transform/types').TransformAPI.TransformData} Transform Data.
   */
  get transform(): TransformAPI.TransformData;
  /**
   * Returns the validators.
   *
   * @returns {import('./system/validators/types').ValidatorAPI} validators.
   */
  get validators(): ValidatorAPI;
  /**
   * @param {number | string | null} height -
   */
  set height(height: number | 'auto' | 'inherit');
  /**
   * @returns {number | 'auto' | 'inherit' | null} height
   */
  get height(): number | 'auto' | 'inherit';
  /**
   * @param {number | string | null} left -
   */
  set left(left: number);
  /**
   * @returns {number | null} left
   */
  get left(): number;
  /**
   * @param {number | string | null} maxHeight -
   */
  set maxHeight(maxHeight: number);
  /**
   * @returns {number | null} maxHeight
   */
  get maxHeight(): number;
  /**
   * @param {number | string | null} maxWidth -
   */
  set maxWidth(maxWidth: number);
  /**
   * @returns {number | null} maxWidth
   */
  get maxWidth(): number;
  /**
   * @param {number | string | null} minHeight -
   */
  set minHeight(minHeight: number);
  /**
   * @returns {number | null} minHeight
   */
  get minHeight(): number;
  /**
   * @param {number | string | null} minWidth -
   */
  set minWidth(minWidth: number);
  /**
   * @returns {number | null} minWidth
   */
  get minWidth(): number;
  /**
   * @param {number | string | null} rotateX -
   */
  set rotateX(rotateX: number);
  /**
   * @returns {number | null} rotateX
   */
  get rotateX(): number;
  /**
   * @param {number | string | null} rotateY -
   */
  set rotateY(rotateY: number);
  /**
   * @returns {number | null} rotateY
   */
  get rotateY(): number;
  /**
   * @param {number | string | null} rotateZ -
   */
  set rotateZ(rotateZ: number);
  /**
   * @returns {number | null} rotateZ
   */
  get rotateZ(): number;
  /**
   * @param {number | string | null} rotateZ - alias for rotateZ
   */
  set rotation(rotateZ: number);
  /**
   * @returns {number | null} alias for rotateZ
   */
  get rotation(): number;
  /**
   * @param {number | string | null} scale -
   */
  set scale(scale: number);
  /**
   * @returns {number | null} scale
   */
  get scale(): number;
  /**
   * @param {number | string | null} top -
   */
  set top(top: number);
  /**
   * @returns {number | null} top
   */
  get top(): number;
  /**
   * @param {import('./transform/types').TransformAPI.TransformOrigin} transformOrigin -
   */
  set transformOrigin(transformOrigin: TransformAPI.TransformOrigin);
  /**
   * @returns {import('./transform/types').TransformAPI.TransformOrigin | null} transformOrigin
   */
  get transformOrigin(): TransformAPI.TransformOrigin;
  /**
   * @param {number | string | null} translateX -
   */
  set translateX(translateX: number);
  /**
   * @returns {number | null} translateX
   */
  get translateX(): number;
  /**
   * @param {number | string | null} translateY -
   */
  set translateY(translateY: number);
  /**
   * @returns {number | null} translateY
   */
  get translateY(): number;
  /**
   * @param {number | string | null} translateZ -
   */
  set translateZ(translateZ: number);
  /**
   * @returns {number | null} translateZ
   */
  get translateZ(): number;
  /**
   * @param {number | string | null} width -
   */
  set width(width: number | 'auto' | 'inherit');
  /**
   * @returns {number | 'auto' | 'inherit' | null} width
   */
  get width(): number | 'auto' | 'inherit';
  /**
   * @param {number | string | null} zIndex -
   */
  set zIndex(zIndex: number);
  /**
   * @returns {number | null} z-index
   */
  get zIndex(): number;
  /**
   * Assigns current position data to object passed into method.
   *
   * @param {object}  [data] - Target to assign current position data.
   *
   * @param {import('./types').TJSPositionTypes.OptionsGet}   [options] - Defines options for specific keys and
   *        substituting null for numeric default values.
   *
   * @returns {Partial<import('./data/types').Data.TJSPositionData>} Passed in object with current position data.
   */
  get(data?: object, options?: TJSPositionTypes.OptionsGet): Partial<Data.TJSPositionData>;
  /**
   * @returns {import('./data/types').Data.TJSPositionData} Current position data.
   */
  toJSON(): Data.TJSPositionData;
  /**
   * All calculation and updates of position are implemented in {@link TJSPosition}. This allows position to be fully
   * reactive and in control of updating inline styles for the application.
   *
   * Note: the logic for updating position is improved and changes a few aspects from the default
   * {@link globalThis.Application.setPosition}. The gate on `popOut` is removed, so to ensure no positional
   * application occurs popOut applications can set `this.options.positionable` to false ensuring no positional inline
   * styles are applied.
   *
   * The initial set call on an application with a target element will always set width / height as this is
   * necessary for correct calculations.
   *
   * When a target element is present updated styles are applied after validation. To modify the behavior of set
   * implement one or more validator functions and add them from the application via
   * `this.position.validators.add(<Function>)`.
   *
   * Updates to any target element are decoupled from the underlying TJSPosition data. This method returns this instance
   * that you can then await on the target element inline style update by using {@link TJSPosition.elementUpdated}.
   *
   * @param {import('./').TJSPositionDataExtended} [position] - TJSPosition data to set.
   *
   * @param {object} [options] - Additional options.
   *
   * @param {boolean} [options.immediateElementUpdate] Perform the update to position state immediately. Callers can
   *        specify to immediately update the associated element. This is useful if set is called from
   *        requestAnimationFrame / rAF. Library integrations like GSAP invoke set from rAF.
   *
   * @returns {TJSPosition} This TJSPosition instance.
   */
  set(
    position?: TJSPositionDataExtended,
    options?: {
      immediateElementUpdate?: boolean;
    },
  ): TJSPosition;
  /**
   * @param {import('svelte/store').Subscriber<import('./data/types').Data.TJSPositionData>} handler - Callback
   *        function that is invoked on update / changes. Receives a copy of the TJSPositionData.
   *
   * @returns {import('svelte/store').Unsubscriber} Unsubscribe function.
   */
  subscribe(handler: svelte_store.Subscriber<Data.TJSPositionData>): svelte_store.Unsubscriber;
  #private;
}

/**
 * Provides all interfaces and type aliases used by {@link TJSPosition}.
 */
declare namespace TJSPositionTypes {
  /**
   * Defines the shape of an instance / object that is positionable.
   */
  interface Positionable {
    position: TJSPosition;
  }
  interface ITJSPosition extends Readable<Data.TJSPositionData> {}
  /**
   * Options for {@link TJSPosition.get}
   */
  type OptionsGet = {
    /**
     * When provided only these keys are copied.
     */
    keys?: Iterable<string>;
    /**
     * When provided these keys are excluded.
     */
    exclude?: Iterable<string>;
    /**
     * When true any `null` values are converted into defaults.
     */
    numeric?: boolean;
  };
  /**
   * Defines one or more positions or positionable objects.
   */
  type PositionGroup = TJSPosition | Positionable | Iterable<TJSPosition> | Iterable<Positionable>;
  /**
   * Provides the default {@link System.Initial.InitialSystem} implementations available.
   */
  type PositionInitial = {
    /**
     * A locked instance of the `Centered` initial helper suitable for displaying elements in the browser window.
     */
    browserCentered: System.Initial.InitialSystem;
    /**
     * The `Centered` class constructor to instantiate a new instance.
     * @constructor
     */
    Centered: System.Initial.InitialSystemConstructor;
  };
  /**
   * Provides the default {@link System.Initial.ValidatorSystem} implementations available.
   */
  type PositionValidators = {
    /**
     * The `BasicBounds` class constructor to instantiate a new instance.
     */
    BasicBounds: System.Validator.ValidatorSystemConstructor;
    /**
     * A locked instance of the `BasicBounds` validator suitable for non-transformed bounds checking against the
     * browser window.
     */
    basicWindow: System.Validator.ValidatorSystem;
    /**
     * The `TransformBounds` class constructor to instantiate a new instance.
     */
    TransformBounds: System.Validator.ValidatorSystemConstructor;
    /**
     * A locked instance of the `TransformBounds` validator suitable for transformed bounds checking against the
     * browser window.
     */
    transformWindow: System.Validator.ValidatorSystem;
  };
}

/**
 * Provides a public API for grouping multiple {@link TJSPosition} animations together and is accessible from
 * {@link TJSPosition.Animate}.
 *
 *
 * @see AnimationAPI
 */
interface AnimationGroupAPI {
  /**
   * Cancels any animation for given PositionGroup data.
   *
   * @param {TJSPositionTypes.PositionGroup} position - The position group to cancel.
   */
  cancel(position: TJSPositionTypes.PositionGroup): void;
  /**
   * Cancels all TJSPosition animation.
   */
  cancelAll(): void;
  /**
   * Gets all animation controls for the given position group data.
   *
   * @param {TJSPositionTypes.PositionGroup} position - A position group.
   *
   * @returns {{ position: TJSPosition, data: object | undefined, controls: IBasicAnimation[]}[]} Results array.
   */
  getScheduled(position: TJSPositionTypes.PositionGroup): {
    position: TJSPosition;
    data: object | undefined;
    controls: IBasicAnimation[];
  }[];
  /**
   * Provides the `from` animation tween for one or more TJSPosition instances as a group.
   *
   * @param {TJSPositionTypes.PositionGroup}  position - A position group.
   *
   * @param {object | Function} fromData -
   *
   * @param {AnimationAPI.TweenOptions | (() => AnimationAPI.TweenOptions)}   [options] -
   *
   * @returns {IBasicAnimation} Basic animation control.
   */
  from(
    position: TJSPositionTypes.PositionGroup,
    fromData: object | Function,
    options?: AnimationAPI.TweenOptions | (() => AnimationAPI.TweenOptions),
  ): IBasicAnimation;
  /**
   * Provides the `fromTo` animation tween for one or more TJSPosition instances as a group.
   *
   * @param {TJSPositionTypes.PositionGroup} position - A position group.
   *
   * @param {object | Function}   fromData -
   *
   * @param {object | Function}   toData -
   *
   * @param {object | Function}   [options] -
   *
   * @returns {IBasicAnimation} Basic animation control.
   */
  fromTo(
    position: TJSPositionTypes.PositionGroup,
    fromData: object | Function,
    toData: object | Function,
    options?: object | Function,
  ): IBasicAnimation;
  /**
   * Provides the `to` animation tween for one or more TJSPosition instances as a group.
   *
   * @param {TJSPositionTypes.PositionGroup} position - A position group.
   *
   * @param {object | Function}   toData -
   *
   * @param {object | Function}   [options] -
   *
   * @returns {IBasicAnimation} Basic animation control.
   */
  to(position: TJSPositionTypes.PositionGroup, toData: object | Function, options?: object | Function): IBasicAnimation;
  /**
   * Provides the `to` animation tween for one or more TJSPosition instances as a group.
   *
   * @param {TJSPositionTypes.PositionGroup} position - A position group.
   *
   * @param {Iterable<AnimationAPI.AnimationKeys>}  keys -
   *
   * @param {AnimationAPI.QuickTweenOptions | (() => AnimationAPI.QuickTweenOptions)}  [options] -
   *
   * @returns {AnimationAPI.QuickToCallback} quick-to tween function.
   */
  quickTo(
    position: TJSPositionTypes.PositionGroup,
    keys: Iterable<AnimationAPI.AnimationKeys>,
    options?: AnimationAPI.QuickTweenOptions | (() => AnimationAPI.QuickTweenOptions),
  ): AnimationAPI.QuickToCallback;
}
interface AnimationAPI {
  /**
   * Returns whether there are scheduled animations whether active or delayed for this TJSPosition.
   *
   * @returns {boolean} Are there active animation instances.
   */
  get isScheduled(): boolean;
  /**
   * Cancels all animation instances for this TJSPosition instance.
   */
  cancel(): void;
  /**
   * Returns all currently scheduled AnimationControl instances for this TJSPosition instance.
   *
   * @returns {IBasicAnimation[]} All currently scheduled animation controls for this TJSPosition instance.
   */
  getScheduled(): IBasicAnimation[];
  /**
   * Provides a tween from given position data to the current position.
   *
   * @param {TJSPositionDataExtended} fromData - The starting position.
   *
   * @param {AnimationAPI.TweenOptions} [options] - Optional tween parameters.
   *
   * @returns {IBasicAnimation}  A control object that can cancel animation and provides a `finished` Promise.
   */
  from(fromData: TJSPositionDataExtended, options?: AnimationAPI.TweenOptions): IBasicAnimation;
  /**
   * Provides a tween from given position data to the current position.
   *
   * @param {TJSPositionDataExtended} fromData - The starting position.
   *
   * @param {TJSPositionDataExtended} toData - The ending position.
   *
   * @param {AnimationAPI.TweenOptions} [options] - Optional tween parameters.
   *
   * @returns {IBasicAnimation}  A control object that can cancel animation and provides a `finished` Promise.
   */
  fromTo(
    fromData: TJSPositionDataExtended,
    toData: TJSPositionDataExtended,
    options?: AnimationAPI.TweenOptions,
  ): IBasicAnimation;
  /**
   * Provides a tween to given position data from the current position.
   *
   * @param {TJSPositionDataExtended} toData - The destination position.
   *
   * @param {AnimationAPI.TweenOptions} [options] - Optional tween parameters.
   *
   * @returns {IBasicAnimation}  A control object that can cancel animation and provides a `finished` Promise.
   */
  to(toData: TJSPositionDataExtended, options?: AnimationAPI.TweenOptions): IBasicAnimation;
  /**
   * Returns a function that provides an optimized way to constantly update a to-tween.
   *
   * @param {Iterable<AnimationAPI.AnimationKeys>}  keys - The keys for quickTo.
   *
   * @param {AnimationAPI.QuickTweenOptions} [options] - Optional quick tween parameters.
   *
   * @returns {AnimationAPI.QuickToCallback} quick-to tween function.
   */
  quickTo(
    keys: Iterable<AnimationAPI.AnimationKeys>,
    options?: AnimationAPI.QuickTweenOptions,
  ): AnimationAPI.QuickToCallback;
}
declare namespace AnimationAPI {
  /**
   * The position keys that can be animated.
   */
  type AnimationKeys =
    | 'left'
    | 'top'
    | 'maxWidth'
    | 'maxHeight'
    | 'minWidth'
    | 'minHeight'
    | 'width'
    | 'height'
    | 'rotateX'
    | 'rotateY'
    | 'rotateZ'
    | 'scale'
    | 'translateX'
    | 'translateY'
    | 'translateZ'
    | 'zIndex'
    | 'rotation';
  /**
   * Defines the quick tweening options.
   */
  type QuickTweenOptions = {
    /**
     * Duration in seconds; default: 1
     */
    duration?: number;
    /**
     * Easing function; default: cubicOut
     */
    ease?: EasingFunction;
    /**
     * Interpolation function; default: lerp
     */
    interpolate?: InterpolateFunction;
  };
  /**
   * Defines the tweening options.
   */
  type TweenOptions = QuickTweenOptions & {
    /**
     * Delay in seconds before animation starts; default: 0
     */
    delay?: number;
  };
  interface QuickToCallback extends Function {
    /**
     * @param args - Individual numbers corresponding to the order in which animation keys are specified.
     */
    (...args: number[]): void;
    /**
     * @param arg - A single object with animation keys specified and numerical values.
     */
    (arg: Record<AnimationKeys, number>): void;
    /**
     * The keys assigned for this quickTo callback.
     */
    readonly keys: AnimationKeys[];
    /**
     * Sets options of quickTo tween.
     *
     * @param data - Quick tween options.
     *
     * @returns This quickTo callback function.
     */
    options: (data: QuickTweenOptions) => QuickToCallback;
  }
}

declare namespace Action {
  /**
   * Provides an interface of the {@link draggable} action options support / Readable store to make updating / setting
   * draggable options much easier. When subscribing to the options instance returned by {@link draggable.options} the
   * Subscriber handler receives the entire instance.
   */
  interface DraggableOptions extends Readable<DraggableOptions> {
    /**
     * Tweening enabled state.
     */
    tween: boolean;
    /**
     * Quick tween options for easing function and duration.
     */
    tweenOptions: AnimationAPI.QuickTweenOptions;
    /**
     * @returns {number} Get tween duration.
     */
    get tweenDuration(): number;
    /**
     * @returns {EasingFunction} Get easing function.
     */
    get tweenEase(): EasingFunction;
    /**
     * @param {number}   duration - Set tween duration.
     */
    set tweenDuration(duration: number);
    /**
     * @param {EasingFunction} ease - Set easing function.
     */
    set tweenEase(ease: EasingFunction);
    /**
     * Resets all options data to initial values.
     */
    reset(): void;
    /**
     * Resets tween enabled state to initial value.
     */
    resetTween(): void;
    /**
     * Resets tween options to initial values.
     */
    resetTweenOptions(): void;
  }
}

/**
 * Provides an action to enable pointer dragging of an HTMLElement and invoke `position.set` on a given
 * {@link TJSPosition} instance provided. When the attached boolean store state changes the draggable
 * action is enabled or disabled.
 *
 * @param {HTMLElement}       node - The node associated with the action.
 *
 * @param {object}            params - Required parameters.
 *
 * @param {import('..').TJSPosition}   params.position - A position instance.
 *
 * @param {boolean}           [params.active=true] - A boolean value; attached to a readable store.
 *
 * @param {number}            [params.button=0] - MouseEvent button;
 *        {@link https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button}.
 *
 * @param {import('svelte/store').Writable<boolean>} [params.storeDragging] - A writable store that tracks "dragging"
 *        state.
 *
 * @param {boolean}           [params.tween=false] - When true tweening is enabled.
 *
 * @param {import('../animation/types').AnimationAPI.QuickTweenOptions} [params.tweenOptions] - Quick tween options.
 *
 * @param {Iterable<string>}  [params.hasTargetClassList] - When defined any event targets that have a class in this
 *        list are allowed.
 *
 * @param {Iterable<string>}  [params.ignoreTargetClassList] - When defined any event targets that have a class in this
 *        list are ignored.
 *
 * @returns {import('svelte/action').ActionReturn<Record<string, any>>} Lifecycle functions.
 */
declare function draggable(
  node: HTMLElement,
  {
    position,
    active,
    button,
    storeDragging,
    tween,
    tweenOptions,
    hasTargetClassList,
    ignoreTargetClassList,
  }: {
    position: TJSPosition;
    active?: boolean;
    button?: number;
    storeDragging?: svelte_store.Writable<boolean>;
    tween?: boolean;
    tweenOptions?: AnimationAPI.QuickTweenOptions;
    hasTargetClassList?: Iterable<string>;
    ignoreTargetClassList?: Iterable<string>;
  },
): svelte_action.ActionReturn<Record<string, any>>;
declare namespace draggable {
  /**
   * Define a function to get an DraggableOptions instance.
   *
   * @param {({
   *    tween?: boolean,
   *    tweenOptions?: import('../animation/types').AnimationAPI.QuickTweenOptions
   * })} options - Initial options for DraggableOptions.
   *
   * @returns {import('./types').Action.DraggableOptions} A new options instance.
   */
  function options(options: {
    tween?: boolean;
    tweenOptions?: AnimationAPI.QuickTweenOptions;
  }): Action.DraggableOptions;
}

/**
 * Options set in constructor.
 */
type TJSPositionOptions = {
  /**
   * When true always calculate transform data.
   */
  calculateTransform?: boolean;
  /**
   * Provides a helper for setting
   * initial position location.
   */
  initial?: System.Initial.InitialSystem;
  /**
   * Sets TJSPosition to orthographic mode using just transform / matrix3d for positioning.
   */
  ortho?: boolean;
  /**
   * Set to true when there are subscribers to the readable transform store.
   */
  transformSubscribed?: boolean;
  /**
   * - Provides an initial validator or list of validators.
   */
  validator?:
    | ValidatorAPI.ValidatorFn
    | ValidatorAPI.ValidatorData
    | Iterable<ValidatorAPI.ValidatorFn | ValidatorAPI.ValidatorData>;
};
type TJSPositionOptionsAll = TJSPositionOptions & Partial<Data.TJSPositionData>;
/**
 * Defines the TJSPosition parent
 * element. Provide either an HTMLElement directly or an object with an `elementTarget` property / accessor defining
 * the parent HTMLElement.
 */
type TJSPositionParent =
  | HTMLElement
  | {
      elementTarget?: HTMLElement;
    };
/**
 * Provides individual writable stores for {@link TJSPosition }.
 */
type TJSPositionStores = {
  /**
   * Readable store for dimension
   * data.
   */
  dimension: svelte_store.Readable<{
    width: number;
    height: number;
  }>;
  /**
   * Readable store for current element.
   */
  element: svelte_store.Readable<HTMLElement>;
  /**
   * Derived store for `left` updates.
   */
  left: svelte_store.Writable<number | null>;
  /**
   * Derived store for `top` updates.
   */
  top: svelte_store.Writable<number | null>;
  /**
   * Derived store for `width` updates.
   */
  width: svelte_store.Writable<number | 'auto' | null>;
  /**
   * Derived store for `height` updates.
   */
  height: svelte_store.Writable<number | 'auto' | null>;
  /**
   * Derived store for `maxHeight` updates.
   */
  maxHeight: svelte_store.Writable<number | null>;
  /**
   * Derived store for `maxWidth` updates.
   */
  maxWidth: svelte_store.Writable<number | null>;
  /**
   * Derived store for `minHeight` updates.
   */
  minHeight: svelte_store.Writable<number | null>;
  /**
   * Derived store for `minWidth` updates.
   */
  minWidth: svelte_store.Writable<number | null>;
  /**
   * Readable store for `contentHeight`.
   */
  resizeContentHeight: svelte_store.Readable<number | undefined>;
  /**
   * Readable store for `contentWidth`.
   */
  resizeContentWidth: svelte_store.Readable<number | undefined>;
  /**
   * Protected store for resize observer updates.
   */
  resizeObserved: svelte_store.Writable<_runtime_svelte_action_dom.ResizeObserverData.Object>;
  /**
   * Readable store for `offsetHeight`.
   */
  resizeOffsetHeight: svelte_store.Readable<number | undefined>;
  /**
   * Readable store for `offsetWidth`.
   */
  resizeOffsetWidth: svelte_store.Readable<number | undefined>;
  /**
   * Derived store for `rotate` updates.
   */
  rotate: svelte_store.Writable<number | null>;
  /**
   * Derived store for `rotateX` updates.
   */
  rotateX: svelte_store.Writable<number | null>;
  /**
   * Derived store for `rotateY` updates.
   */
  rotateY: svelte_store.Writable<number | null>;
  /**
   * Derived store for `rotateZ` updates.
   */
  rotateZ: svelte_store.Writable<number | null>;
  /**
   * Derived store for `scale` updates.
   */
  scale: svelte_store.Writable<number | null>;
  /**
   * Readable store for transform data.
   */
  transform: svelte_store.Readable<TransformAPI.TransformData>;
  /**
   * Derived store for `transformOrigin`.
   */
  transformOrigin: svelte_store.Writable<string>;
  /**
   * Derived store for `translateX` updates.
   */
  translateX: svelte_store.Writable<number | null>;
  /**
   * Derived store for `translateY` updates.
   */
  translateY: svelte_store.Writable<number | null>;
  /**
   * Derived store for `translateZ` updates.
   */
  translateZ: svelte_store.Writable<number | null>;
  /**
   * Derived store for `zIndex` updates.
   */
  zIndex: svelte_store.Writable<number | null>;
};
type TJSPositionDataExtended = {
  /**
   * -
   */
  height?: number | string | null;
  /**
   * -
   */
  left?: number | string | null;
  /**
   * -
   */
  maxHeight?: number | string | null;
  /**
   * -
   */
  maxWidth?: number | string | null;
  /**
   * -
   */
  minHeight?: number | string | null;
  /**
   * -
   */
  minWidth?: number | string | null;
  /**
   * -
   */
  rotateX?: number | string | null;
  /**
   * -
   */
  rotateY?: number | string | null;
  /**
   * -
   */
  rotateZ?: number | string | null;
  /**
   * -
   */
  scale?: number | string | null;
  /**
   * -
   */
  top?: number | string | null;
  /**
   * -
   */
  transformOrigin?: string | null;
  /**
   * -
   */
  translateX?: number | string | null;
  /**
   * -
   */
  translateY?: number | string | null;
  /**
   * -
   */
  translateZ?: number | string | null;
  /**
   * -
   */
  width?: number | string | null;
  /**
   * -
   *
   * Extended properties -----------------------------------------------------------------------------------------------
   */
  zIndex?: number | string | null;
  /**
   * Alias for `rotateZ`.
   */
  rotation?: number | null;
};

export {
  Action,
  AnimationAPI,
  type AnimationGroupAPI,
  Data,
  type PositionStateAPI,
  System,
  TJSPosition,
  type TJSPositionDataExtended,
  type TJSPositionOptions,
  type TJSPositionOptionsAll,
  type TJSPositionParent,
  type TJSPositionStores,
  TJSPositionTypes,
  TransformAPI,
  ValidatorAPI,
  applyPosition,
  draggable,
};
