/**
 * Provides a reactive compound store and related actions for advanced and optimized positioning of elements including
 * essential animation / tweening and validation of positional changes. {@link TJSPosition} is the main reactive store
 * along with the {@link applyPosition} and {@link draggable} actions to respectively attach a `TJSPosition` instance
 * to an element in a Svelte template and make it draggable.
 *
 * @packageDocumentation
 */

import * as svelte_action from 'svelte/action';
import * as svelte_store from 'svelte/store';
import { Writable, Subscriber, Invalidator, Unsubscriber, Readable } from 'svelte/store';
import { ResizeObserverData } from '@typhonjs-svelte/runtime-base/util/dom/observer/resize';
import { InterpolateFunctionName } from '@typhonjs-svelte/runtime-base/math/interpolate';
import { EasingReference } from '@typhonjs-svelte/runtime-base/svelte/easing';
import { BasicAnimation } from '@typhonjs-svelte/runtime-base/util/animate';
import { Mat4, Vec3 } from '@typhonjs-svelte/runtime-base/math/gl-matrix';

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
  /**
   * Provides a custom writable for the `transformOrigin` store adding a read only property `values` that
   * contains a list of all transform origin values.
   */
  interface TransformOriginWritable extends Writable<TransformOrigin> {
    get values(): Readonly<TransformOrigin[]>;
  }
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
   * @param {TJSPositionTypes.PositionGroup} positionGroup - The position group to cancel.
   */
  cancel(positionGroup: TJSPositionTypes.PositionGroup): void;
  /**
   * Cancels all TJSPosition animation.
   */
  cancelAll(): void;
  /**
   * Provides a type guard to test in the given key is an {@link AnimationAPI.AnimationKey}.
   *
   * @param {unknown}  key - A key value to test.
   *
   * @returns {key is AnimationAPI.AnimationKey} Whether the given key is an animation key.
   */
  isAnimationKey(key: unknown): key is AnimationAPI.AnimationKey;
  /**
   * Gets all animation controls for the given position group data.
   *
   * @param {TJSPositionTypes.PositionGroup} positionGroup - A position group.
   *
   * @returns {({
   *    position: TJSPosition,
   *    entry: TJSPositionTypes.Positionable | undefined,
   *    controls: BasicAnimation[]
   * }[])} Results array.
   */
  getScheduled(positionGroup: TJSPositionTypes.PositionGroup): {
    position: TJSPosition;
    entry: TJSPositionTypes.Positionable | undefined;
    controls: BasicAnimation[];
  }[];
  /**
   * Returns the status _for the entire position group_ specified if all position instances of the group are scheduled.
   *
   * @param {TJSPositionTypes.PositionGroup}   positionGroup - A position group.
   *
   * @param {AnimationAPI.ScheduleOptions}     [options] - Scheduling options.
   *
   * @returns True if all are scheduled / false if just one position instance in the group is not scheduled.
   */
  isScheduled(positionGroup: TJSPositionTypes.PositionGroup, options?: AnimationAPI.ScheduleOptions): boolean;
  /**
   * Provides the `from` animation tween for one or more positionable instances as a group.
   *
   * @param {TJSPositionTypes.PositionGroup}  positionGroup - A position group.
   *
   * @param {Data.TJSPositionDataRelative | AnimationAPI.GroupDataCallback} fromData - A position data object assigned
   *        to all positionable instances or a callback function invoked for unique data for each instance.
   *
   * @param {AnimationAPI.TweenOptions | AnimationAPI.GroupTweenOptionsCallback}   [options] - Tween options assigned
   *        to all positionable instances or a callback function invoked for unique options for each instance.
   *
   * @returns {BasicAnimation} Basic animation control.
   */
  from(
    positionGroup: TJSPositionTypes.PositionGroup,
    fromData: Data.TJSPositionDataRelative | AnimationAPI.GroupDataCallback,
    options?: AnimationAPI.TweenOptions | AnimationAPI.GroupTweenOptionsCallback,
  ): BasicAnimation;
  /**
   * Provides the `fromTo` animation tween for one or more positionable instances as a group.
   *
   * @param {TJSPositionTypes.PositionGroup} positionGroup - A position group.
   *
   * @param {Data.TJSPositionDataRelative | AnimationAPI.GroupDataCallback}   fromData - A position data object
   *        assigned to all positionable instances or a callback function invoked for unique data for each instance.
   *
   * @param {Data.TJSPositionDataRelative | AnimationAPI.GroupDataCallback}   toData - A position data object assigned
   *        to all positionable instances or a callback function invoked for unique data for each instance.
   *
   * @param {AnimationAPI.TweenOptions | AnimationAPI.GroupTweenOptionsCallback}   [options] - Tween options assigned
   *        to all positionable instances or a callback function invoked for unique options for each instance.
   *
   * @returns {BasicAnimation} Basic animation control.
   */
  fromTo(
    positionGroup: TJSPositionTypes.PositionGroup,
    fromData: Data.TJSPositionDataRelative | AnimationAPI.GroupDataCallback,
    toData: Data.TJSPositionDataRelative | AnimationAPI.GroupDataCallback,
    options?: AnimationAPI.TweenOptions | AnimationAPI.GroupTweenOptionsCallback,
  ): BasicAnimation;
  /**
   * Provides the `to` animation tween for one or more positionable instances as a group.
   *
   * @param {TJSPositionTypes.PositionGroup} positionGroup - A position group.
   *
   * @param {Data.TJSPositionDataRelative | AnimationAPI.GroupDataCallback}   toData - A position data object assigned
   *        to all positionable instances or a callback function invoked for unique data for each instance.
   *
   * @param {AnimationAPI.TweenOptions | AnimationAPI.GroupTweenOptionsCallback}   [options] - Tween options assigned
   *        to all positionable instances or a callback function invoked for unique options for each instance.
   *
   * @returns {BasicAnimation} Basic animation control.
   */
  to(
    positionGroup: TJSPositionTypes.PositionGroup,
    toData: Data.TJSPositionDataRelative | AnimationAPI.GroupDataCallback,
    options?: AnimationAPI.TweenOptions | AnimationAPI.GroupTweenOptionsCallback,
  ): BasicAnimation;
  /**
   * Provides the `quickTo` animation tweening function for one or more positionable instances as a group.
   *
   * @param {TJSPositionTypes.PositionGroup} positionGroup - A position group.
   *
   * @param {Iterable<AnimationAPI.AnimationKey>}  keys - Animation keys to target.
   *
   * @param {AnimationAPI.QuickTweenOptions | AnimationAPI.GroupQuickTweenOptionsCallback}  [options] - Quick tween
   *        options assigned to all positionable instances or a callback function invoked for unique options for each
   *        instance.
   *
   * @returns {AnimationAPI.GroupQuickToCallback | undefined} quick-to tween function.
   */
  quickTo(
    positionGroup: TJSPositionTypes.PositionGroup,
    keys: Iterable<AnimationAPI.AnimationKey>,
    options?: AnimationAPI.QuickTweenOptions | AnimationAPI.GroupQuickTweenOptionsCallback,
  ): AnimationAPI.GroupQuickToCallback;
}
interface AnimationAPI {
  /**
   * Returns if there are scheduled animations whether active or pending for this TJSPosition instance.
   *
   * @returns {boolean} Are there scheduled animations.
   */
  get isScheduled(): boolean;
  /**
   * Cancels all animation instances for this TJSPosition instance.
   */
  cancel(): void;
  /**
   * Returns all currently scheduled AnimationControl instances for this TJSPosition instance.
   *
   * @returns {BasicAnimation[]} All currently scheduled animation controls for this TJSPosition instance.
   */
  getScheduled(): BasicAnimation[];
  /**
   * Provides a tween from given position data to the current position.
   *
   * @param {Data.TJSPositionDataRelative} fromData - The starting position.
   *
   * @param {AnimationAPI.TweenOptions} [options] - Optional tween parameters.
   *
   * @returns {BasicAnimation}  A control object that can cancel animation and provides a `finished` Promise.
   */
  from(fromData: Data.TJSPositionDataRelative, options?: AnimationAPI.TweenOptions): BasicAnimation;
  /**
   * Provides a tween from given position data to the given position.
   *
   * @param {Data.TJSPositionDataRelative} fromData - The starting position.
   *
   * @param {Data.TJSPositionDataRelative} toData - The ending position.
   *
   * @param {AnimationAPI.TweenOptions} [options] - Optional tween parameters.
   *
   * @returns {BasicAnimation}  A control object that can cancel animation and provides a `finished` Promise.
   */
  fromTo(
    fromData: Data.TJSPositionDataRelative,
    toData: Data.TJSPositionDataRelative,
    options?: AnimationAPI.TweenOptions,
  ): BasicAnimation;
  /**
   * Provides a tween to given position data from the current position.
   *
   * @param {Data.TJSPositionDataRelative} toData - The destination position.
   *
   * @param {AnimationAPI.TweenOptions} [options] - Optional tween parameters.
   *
   * @returns {BasicAnimation}  A control object that can cancel animation and provides a `finished` Promise.
   */
  to(toData: Data.TJSPositionDataRelative, options?: AnimationAPI.TweenOptions): BasicAnimation;
  /**
   * Returns a function that provides an optimized way to constantly update a to-tween.
   *
   * @param {Iterable<AnimationAPI.AnimationKey>}  keys - The keys for quickTo.
   *
   * @param {AnimationAPI.QuickTweenOptions} [options] - Optional quick tween parameters.
   *
   * @returns {AnimationAPI.QuickToCallback} quick-to tween function.
   */
  quickTo(
    keys: Iterable<AnimationAPI.AnimationKey>,
    options?: AnimationAPI.QuickTweenOptions,
  ): AnimationAPI.QuickToCallback;
}
declare namespace AnimationAPI {
  /**
   * The position keys that can be animated.
   */
  type AnimationKey =
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
   * Options passed to any group animation callbacks for {@link Data.TJSPositionDataRelative} data or
   * {@link TweenOptions}.
   */
  type GroupCallbackOptions = {
    /**
     * The index of the {@link TJSPositionTypes.PositionGroup} being processed.
     */
    index?: number;
    /**
     * The actual TJSPosition instance being processed.
     */
    position?: TJSPosition;
    /**
     * Any associated positionable entry / object.
     */
    entry?: TJSPositionTypes.Positionable | undefined;
  };
  /**
   * Defines a callback to process each {@link TJSPosition} / {@link TJSPositionTypes.Positionable} instance allowing
   * different position data to be assigned to each instance in the grouped animation.
   */
  interface GroupDataCallback {
    /**
     * @param {GroupCallbackOptions} options - The group callback options defining the order of the current
     *        position / positionable being processed.
     *
     * @returns {Data.TJSPositionDataRelative} - The unique position data target to animate for this position /
     *          positionable instance.  When null or undefined is returned the current position / positionable is
     *          removed from the animation.
     */
    (options?: GroupCallbackOptions): Data.TJSPositionDataRelative | null | undefined;
  }
  /**
   * Defines a callback to process each {@link TJSPosition} / {@link TJSPositionTypes.Positionable} instance allowing
   * different tween options to be assigned to each instance in the grouped animation.
   */
  interface GroupTweenOptionsCallback {
    /**
     * @param {GroupCallbackOptions} options - The group callback options defining the order of the current
     *        position / positionable being processed.
     *
     * @returns {TweenOptions} - The unique tween options to set for this position / positionable instance. When null
     *          or undefined is returned the current position / positionable is removed from the animation.
     */
    (options?: GroupCallbackOptions): TweenOptions | null | undefined;
  }
  /**
   * The `quickTo` callback function returned from {@link AnimationGroupAPI.quickTo}. Extends `QuickToCallback`
   * accepting functions for setting each instance of group with new position data and / or options.
   */
  interface GroupQuickToCallback extends QuickToCallback {
    /**
     * @param arg - A callback function invoked for unique positional data for each instance of the group.
     */
    (arg: GroupDataCallback): void;
    /**
     * Sets options of quickTo tween.
     *
     * @param options - Quick tween options or callback function returning options per instance of the group.
     *
     * @returns This quickTo callback function.
     */
    options: (options: QuickTweenOptions | GroupQuickTweenOptionsCallback) => GroupQuickToCallback;
  }
  /**
   * Defines a callback to process each {@link TJSPosition} / {@link TJSPositionTypes.Positionable} instance allowing
   * different quick tween options to be assigned to each instance in the grouped animation.
   */
  interface GroupQuickTweenOptionsCallback {
    /**
     * @param {GroupCallbackOptions} options - The group callback options defining the order of the current
     *        position / positionable being processed.
     *
     * @returns {QuickTweenOptions} - The unique quick tween options to set for this position / positionable instance.
     *          When null or undefined is returned the current position / positionable is removed from the animation.
     */
    (options?: GroupCallbackOptions): QuickTweenOptions | null | undefined;
  }
  /**
   * Defines the quick tweening options.
   */
  type QuickTweenOptions = {
    /**
     * Duration in seconds; default: 1
     */
    duration?: number;
    /**
     * Easing function or easing function name; controls the time variable for interpolation. Default: `cubicOut`
     */
    ease?: EasingReference;
    /**
     * Interpolation function name. Currently, only `lerp` is supported and doesn't need to be specified.
     */
    interpolate?: InterpolateFunctionName;
  };
  /**
   * Defines options for the {@link AnimationGroupAPI.isScheduled}.
   */
  type ScheduleOptions = {
    /**
     * When false exclude searching active animations.
     */
    active?: boolean;
    /**
     * When false exclude searching pending animations that have not started.
     */
    pending?: boolean;
  };
  /**
   * Defines the tweening options.
   */
  type TweenOptions = QuickTweenOptions & {
    /**
     * Delay in seconds before animation starts; default: 0
     */
    delay?: number;
    /**
     * Defines the scheduling strategy for handling new animations when an existing animation is already scheduled for
     * the same target.
     *
     * ```
     * - `cancel`: Cancels any non `quickTo` pending and ongoing animations on the same target and schedules the new
     *   animation immediately. This option ensures that the new animation takes precedence by clearing any existing
     *   animations.
     *
     * - `cancelAll`: Cancels _all_ pending and ongoing animations on the same target and schedules the new animation
     *   immediately. This option ensures that the new animation takes precedence by clearing any existing animations.
     *
     * - `exclusive`: Only schedules the new animation if there are no other animations currently scheduled for the
     *   same target. This option avoids animation conflicts by ensuring that only one animation can run at a time.
     * ```
     */
    strategy?: 'cancel' | 'cancelAll' | 'exclusive';
    /**
     * A transform origin to apply for the animation. The initial transform origin is reset when the animation
     * finishes.
     */
    transformOrigin?: TransformAPI.TransformOrigin;
  };
  /**
   * The `quickTo` callback function returned from {@link AnimationAPI.quickTo}.
   */
  interface QuickToCallback {
    /**
     * @param args - Individual numbers or relative strings corresponding to the order in which animation keys are
     * specified.
     */
    (...args: (string | number)[]): void;
    /**
     * @param arg - A single object with animation keys specified and numerical or relative string values.
     */
    (arg: Partial<Record<AnimationKey, string | number>>): void;
    /**
     * The keys assigned for this quickTo callback.
     */
    readonly keys: AnimationKey[];
    /**
     * Sets options of quickTo tween.
     *
     * @param options - Quick tween options.
     *
     * @returns This quickTo callback function.
     */
    options: (options: QuickTweenOptions) => QuickToCallback;
  }
}

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
    rotation: number | null;
  }
  /**
   * Defines a TJSPositionData instance that has extra properties / attributes.
   */
  interface TJSPositionDataExtra extends Partial<TJSPositionData> {
    [key: string]: any;
  }
  /**
   * Defines an extension to {@link Data.TJSPositionData} where each animatable property defined by
   * {@link AnimationAPI.AnimationKey} can also be a string. Relative adjustments to animatable properties should be
   * a string the form of '+=', '-=', or '*=' and float / numeric value. IE '+=0.2'. {@link TJSPosition.set} will
   * apply the `addition`, `subtraction`, or `multiplication` operation specified against the current value of the
   * given property. Various unit types are also supported including: `%`, `%~`, `px`, `rad`, `turn`:
   *
   * ```
   * - `no unit type` - The natural value for each property is adjusted which may be `px` for properties like `width`
   * or degrees for rotation based properties.
   *
   * - `%`: Properties such as `width` are calculated against the parent elements client bounds. Other properties such
   * as rotation are a percentage bound by 360 degrees.
   *
   * - `%~`: Relative percentage. Properties are calculated as a percentage of the current value of the property.
   * IE `width: '150%~` results in `150%` of the current width value.
   *
   * - `px`: Only properties that support `px` will be adjusted all other properties like rotation will be rejected
   * with a warning.
   *
   * - `rad`: Only rotation properties may be specified and the rotation is performed in `radians`.
   *
   * - `turn`: Only rotation properties may be specified and rotation is performed in respect to the `turn` CSS
   * specification. `1turn` is 360 degrees. `0.25turn` is 90 degrees.
   * ```
   *
   * Additional properties may be added that are not specified by {@link TJSPositionData} and are forwarded through
   * {@link ValidatorAPI.ValidationData} as the `rest` property allowing extra data to be sent to any custom validator.
   */
  type TJSPositionDataRelative = Partial<
    {
      [P in keyof TJSPositionData as P extends AnimationAPI.AnimationKey ? P : never]: TJSPositionData[P] | string;
    } & {
      [P in keyof TJSPositionData as P extends AnimationAPI.AnimationKey ? never : P]: TJSPositionData[P];
    }
  > & {
    [key: string]: any;
  };
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
      rotation,
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
      rotation?: number | null;
    }): TJSPositionData;
  }
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
     * Associated position parent instance.
     */
    parent: TJSPositionTypes.PositionParent;
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
     * The rest of any data submitted to {@link TJSPosition.set}. This may be used to provide directives to
     * validators.
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
   * Defines the {@link TJSPosition} validator option.
   */
  type ValidatorOption = ValidatorFn | ValidatorData | Iterable<ValidatorFn | ValidatorData>;
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

interface PositionStateAPI {
  /**
   * Clears all saved position data except any default state.
   */
  clear(): void;
  /**
   * Gets any stored saved position data by name.
   *
   * @param {object}   options - Options.
   *
   * @param {string}   options.name - Saved data name.
   *
   * @returns {Data.TJSPositionDataExtra | undefined} Any saved position data.
   */
  get({ name }: { name: string }): Data.TJSPositionDataExtra | undefined;
  /**
   * Returns any associated default position data.
   *
   * @returns {Data.TJSPositionDataExtra | undefined} Any saved default position data.
   */
  getDefault(): Data.TJSPositionDataExtra | undefined;
  /**
   * @returns {IterableIterator<string>} The saved position data names / keys.
   */
  keys(): IterableIterator<string>;
  /**
   * Removes and returns any position data by name.
   *
   * @param {object}   options - Options.
   *
   * @param {string}   options.name - Name to remove and retrieve.
   *
   * @returns {Data.TJSPositionDataExtra | undefined} Any saved position data.
   */
  remove({ name }: { name: string }): Data.TJSPositionDataExtra | undefined;
  /**
   * Resets position instance to default data and invokes set.
   *
   * @param {object}   [options] - Optional parameters.
   *
   * @param {boolean}  [options.keepZIndex=false] - When true keeps current z-index.
   *
   * @param {boolean}  [options.invokeSet=true] - When true invokes set method.
   *
   * @returns {boolean} Operation successful.
   */
  reset({ keepZIndex, invokeSet }?: { keepZIndex?: boolean; invokeSet?: boolean }): boolean;
  /**
   * Restores a saved positional state returning the data. Several optional parameters are available to control
   * whether the restore action occurs silently (no store / inline styles updates), animates to the stored data, or
   * simply sets the stored data. Restoring via {@link AnimationAPI.to} allows specification of the duration and
   * easing along with configuring a Promise to be returned if awaiting the end of the animation.
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
   * @param {EasingReference}   [options.ease='linear'] - Easing function name or function.
   *
   * @returns {Data.TJSPositionDataExtra | Promise<Data.TJSPositionDataExtra | undefined> | undefined} Any saved
   *          position data.
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
  }: {
    name: string;
    remove?: boolean;
    properties?: Iterable<string>;
    silent?: boolean;
    async?: boolean;
    animateTo?: boolean;
    duration?: number;
    ease?: EasingReference;
  }): Data.TJSPositionDataExtra | Promise<Data.TJSPositionDataExtra | undefined> | undefined;
  /**
   * Saves current position state with the opportunity to add extra data to the saved state. Simply include
   * extra properties in `options` to save extra data.
   *
   * @param {object}   options - Options.
   *
   * @param {string}   options.name - name to index this saved data.
   *
   * @param {import('../types').TJSPositionTypes.OptionsGet} [optionsGet] - Additional options for
   *        {@link TJSPosition.get} when serializing position state. By default, `nullable` values are included.
   *
   * @returns {Data.TJSPositionDataExtra} Current position data
   */
  save(
    {
      name,
      ...extra
    }: {
      name: string;
      [key: string]: any;
    },
    optionsGet: TJSPositionTypes.OptionsGet,
  ): Data.TJSPositionDataExtra;
  /**
   * Directly sets a saved position state. Simply include extra properties in `options` to set extra data.
   *
   * @param {object}   options - Options.
   *
   * @param {string}   options.name - name to index this saved data.
   */
  set({ name, ...data }: { name: string; [key: string]: any }): void;
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
 * Provides an advanced compound store for positioning elements dynamically including an optimized pipeline for updating
 * an associated element. Essential tweening / animation is supported in addition to a validation API to constrain
 * positional updates.
 *
 * @implements {import('./types').TJSPositionTypes.TJSPositionWritable}
 */
declare class TJSPosition implements TJSPositionTypes.TJSPositionWritable {
  /**
   * @returns {import('./animation/types').AnimationGroupAPI} Public Animation API.
   */
  static get Animate(): AnimationGroupAPI;
  /**
   * @returns {import('./data/types').Data.TJSPositionDataConstructor} TJSPositionData constructor.
   */
  static get Data(): Data.TJSPositionDataConstructor;
  /**
   * @returns {Readonly<import('./types').TJSPositionTypes.PositionInitial>} TJSPosition default initial helpers.
   */
  static get Initial(): Readonly<TJSPositionTypes.PositionInitial>;
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
   * @returns {Readonly<import('./types').TJSPositionTypes.PositionValidators>} Available validators.
   */
  static get Validators(): Readonly<TJSPositionTypes.PositionValidators>;
  /**
   * Returns a list of supported transform origins.
   *
   * @returns {Readonly<import('./transform/types').TransformAPI.TransformOrigin[]>} The supported transform origin
   *          strings.
   */
  static get transformOrigins(): readonly TransformAPI.TransformOrigin[];
  /**
   * Convenience to copy from source to target of two TJSPositionData like objects. If a target is not supplied a new
   * {@link TJSPositionData} instance is created.
   *
   * @param {Partial<import('./data/types').Data.TJSPositionData>}  source - The source instance to copy from.
   *
   * @param {import('./data/types').Data.TJSPositionData}  [target] - Target TJSPositionData like object; if one is not
   *        provided a new instance is created.
   *
   * @returns {import('./data/types').Data.TJSPositionData} The target instance with all TJSPositionData fields.
   */
  static copyData(source: Partial<Data.TJSPositionData>, target?: Data.TJSPositionData): Data.TJSPositionData;
  /**
   * Returns a duplicate of a given position instance copying any options and validators. The position parent is not
   * copied and a new one must be set manually via the {@link TJSPosition.parent} setter.
   *
   * @param {TJSPosition} position - A position instance.
   *
   * @param {import('./types').TJSPositionTypes.OptionsCtorAll}   [options] - Unique new options to set.
   *
   * @returns {TJSPosition} A duplicate position instance.
   */
  static duplicate(position: TJSPosition, options?: TJSPositionTypes.OptionsCtorAll): TJSPosition;
  /**
   * @param {(
   *    import('./types').TJSPositionTypes.PositionParent |
   *    import('./types').TJSPositionTypes.OptionsCtorAll
   * )} [parentOrOptions] - A  potential parent element or object w/ `elementTarget` accessor. You may also forego
   *    setting the parent and pass in the options object.
   *
   * @param {import('./types').TJSPositionTypes.OptionsCtorAll}  [options] - The options object.
   */
  constructor(
    parentOrOptions?: TJSPositionTypes.PositionParent | TJSPositionTypes.OptionsCtorAll,
    options?: TJSPositionTypes.OptionsCtorAll,
  );
  /**
   * Returns the animation API.
   *
   * @returns {import('./animation/types').AnimationAPI} Animation API.
   */
  get animate(): AnimationAPI;
  /**
   * Returns the dimension data for the readable store.
   *
   * @returns {Readonly<{width: number | 'auto' | 'inherit', height: number | 'auto' | 'inherit'}>} Dimension data.
   */
  get dimension(): Readonly<{
    width: number | 'auto' | 'inherit';
    height: number | 'auto' | 'inherit';
  }>;
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
   * Sets the associated {@link TJSPositionTypes.PositionParent} instance. Resets the style cache and default data.
   *
   * @param {import('./types').TJSPositionTypes.PositionParent | undefined} parent - A PositionParent instance or
   *        undefined to disassociate
   */
  set parent(parent: TJSPositionTypes.PositionParent);
  /**
   * Returns the associated {@link TJSPositionTypes.PositionParent} instance.
   *
   * @returns {import('./types').TJSPositionTypes.PositionParent} The current position parent instance.
   */
  get parent(): TJSPositionTypes.PositionParent;
  /**
   * Returns the state API.
   *
   * @returns {import('./state/types').PositionStateAPI} TJSPosition state API.
   */
  get state(): PositionStateAPI;
  /**
   * Returns the derived writable stores for individual data variables.
   *
   * @returns {import('./types').TJSPositionTypes.Stores} Derived / writable stores.
   */
  get stores(): TJSPositionTypes.Stores;
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
   * @param {number | 'auto' | 'inherit' | null} height -
   */
  set height(height: number | 'auto' | 'inherit');
  /**
   * @returns {number | 'auto' | 'inherit' | null} height
   */
  get height(): number | 'auto' | 'inherit';
  /**
   * @param {number | string | null} left -
   */
  set left(left: string | number);
  /**
   * @returns {number | null} left
   */
  get left(): number;
  /**
   * @param {number | string | null} maxHeight -
   */
  set maxHeight(maxHeight: string | number);
  /**
   * @returns {number | null} maxHeight
   */
  get maxHeight(): number;
  /**
   * @param {number | string | null} maxWidth -
   */
  set maxWidth(maxWidth: string | number);
  /**
   * @returns {number | null} maxWidth
   */
  get maxWidth(): number;
  /**
   * @param {number | string | null} minHeight -
   */
  set minHeight(minHeight: string | number);
  /**
   * @returns {number | null} minHeight
   */
  get minHeight(): number;
  /**
   * @param {number | string | null} minWidth -
   */
  set minWidth(minWidth: string | number);
  /**
   * @returns {number | null} minWidth
   */
  get minWidth(): number;
  /**
   * @param {number | string | null} rotateX -
   */
  set rotateX(rotateX: string | number);
  /**
   * @returns {number | null} rotateX
   */
  get rotateX(): number;
  /**
   * @param {number | string | null} rotateY -
   */
  set rotateY(rotateY: string | number);
  /**
   * @returns {number | null} rotateY
   */
  get rotateY(): number;
  /**
   * @param {number | string | null} rotateZ -
   */
  set rotateZ(rotateZ: string | number);
  /**
   * @returns {number | null} rotateZ
   */
  get rotateZ(): number;
  /**
   * @param {number | string | null} rotateZ - alias for rotateZ
   */
  set rotation(rotateZ: string | number);
  /**
   * @returns {number | null} alias for rotateZ
   */
  get rotation(): number;
  /**
   * @param {number | string | null} scale -
   */
  set scale(scale: string | number);
  /**
   * @returns {number | null} scale
   */
  get scale(): number;
  /**
   * @param {number | string | null} top -
   */
  set top(top: string | number);
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
  set translateX(translateX: string | number);
  /**
   * @returns {number | null} translateX
   */
  get translateX(): number;
  /**
   * @param {number | string | null} translateY -
   */
  set translateY(translateY: string | number);
  /**
   * @returns {number | null} translateY
   */
  get translateY(): number;
  /**
   * @param {number | string | null} translateZ -
   */
  set translateZ(translateZ: string | number);
  /**
   * @returns {number | null} translateZ
   */
  get translateZ(): number;
  /**
   * @param {number | 'auto' | 'inherit' | null} width -
   */
  set width(width: number | 'auto' | 'inherit');
  /**
   * @returns {number | 'auto' | 'inherit' | null} width
   */
  get width(): number | 'auto' | 'inherit';
  /**
   * @param {number | string | null} zIndex -
   */
  set zIndex(zIndex: string | number);
  /**
   * @returns {number | null} z-index
   */
  get zIndex(): number;
  /**
   * Assigns current position data to given object `data` object. By default, `null` position data is not assigned.
   * Other options allow configuration of the data assigned including setting default numeric values for any properties
   * that are null.
   *
   * @param {object}  [data] - Target to assign current position data.
   *
   * @param {import('./types').TJSPositionTypes.OptionsGet}   [options] - Defines options for specific keys and
   *        substituting null for numeric default values. By default, nullable keys are included.
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
   * @param {import('./data/types').Data.TJSPositionDataRelative} [position] - TJSPosition data to set.
   *
   * @param {import('./types').TJSPositionTypes.OptionsSet} [options] - Additional options.
   *
   * @returns {TJSPosition} This TJSPosition instance.
   */
  set(position?: Data.TJSPositionDataRelative, options?: TJSPositionTypes.OptionsSet): TJSPosition;
  /**
   * @param {import('svelte/store').Subscriber<Readonly<import('./data/types').Data.TJSPositionData>>} handler -
   *        Callback function that is invoked on update / changes. Receives a readonly copy of the TJSPositionData.
   *
   * @returns {import('svelte/store').Unsubscriber} Unsubscribe function.
   */
  subscribe(handler: svelte_store.Subscriber<Readonly<Data.TJSPositionData>>): svelte_store.Unsubscriber;
  /**
   * Provides the {@link Writable} store `update` method. Receive and return a {@link TJSPositionData} instance to
   * update the position state. You may manipulate numeric properties by providing relative adjustments described in
   * {@link TJSPositionDataRelative}.
   *
   * @param {import('svelte/store').Updater<import('./data/types').Data.TJSPositionDataRelative>} updater -
   */
  update(updater: svelte_store.Updater<Data.TJSPositionDataRelative>): void;
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
  /**
   * Provides an overloaded {@link Writable} store interface for {@link TJSPosition.set}.
   */
  interface TJSPositionWritable extends Writable<Data.TJSPositionDataRelative> {
    set(this: void, value: Data.TJSPositionDataRelative, options?: OptionsSet): TJSPosition;
  }
  /**
   * Defines the unique options available for setting in the constructor of {@link TJSPosition}.
   */
  type OptionsCtor = {
    /**
     * When true always calculate transform data.
     */
    calculateTransform: boolean;
    /**
     * Provides a helper for setting initial position location.
     */
    initial: System.Initial.InitialSystem;
    /**
     * Sets TJSPosition to orthographic mode using just `transform` / `matrix3d` CSS for positioning.
     */
    ortho: boolean;
    /**
     * Provides an initial validator or list of validators.
     */
    validator: ValidatorAPI.ValidatorOption;
  };
  /**
   * Provides the complete options object including unique {@link TJSPosition} options in addition to positional
   * data that is available to set in the constructor.
   */
  type OptionsCtorAll = Partial<OptionsCtor & Data.TJSPositionDataExtra>;
  /**
   * Options for {@link TJSPosition.get}.
   */
  type OptionsGet = {
    /**
     * When provided only these keys are copied.
     */
    keys?: Iterable<keyof Data.TJSPositionData>;
    /**
     * When provided these keys are excluded.
     */
    exclude?: Iterable<keyof Data.TJSPositionData>;
    /**
     * When true all `nullable` values are included.
     */
    nullable?: boolean;
    /**
     * When true any `null` values are converted into default numeric values.
     */
    numeric?: boolean;
  };
  /**
   * Options for {@link TJSPosition.set}.
   */
  type OptionsSet = {
    /**
     * Perform the update to position state immediately. Callers can specify to immediately update the associated
     * element. This is useful if set is called from requestAnimationFrame / rAF. Library integrations like GSAP
     * invoke set from rAF.
     */
    immediateElementUpdate: boolean;
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
   * Defines the TJSPosition parent element. Provide either an HTMLElement directly or an object with an
   * `elementTarget` property / accessor defining the parent HTMLElement.
   */
  type PositionParent =
    | HTMLElement
    | {
        elementTarget?: HTMLElement;
      };
  /**
   * Provides the default {@link System.Initial.ValidatorSystem} implementations available.
   */
  type PositionValidators = {
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
  /**
   * Defines all derived stores for positional properties. These property stores can be used to update the position
   * state.
   *
   * There are several readable stores for additional derived data.
   */
  type Stores = {
    /**
     * Derived store for `left` updates.
     */
    left: Writable<number | null>;
    /**
     * Derived store for `top` updates.
     */
    top: Writable<number | null>;
    /**
     * Derived store for `width` updates.
     */
    width: Writable<number | 'auto' | 'inherit' | null>;
    /**
     * Derived store for `height` updates.
     */
    height: Writable<number | 'auto' | 'inherit' | null>;
    /**
     * Derived store for `maxHeight` updates.
     */
    maxHeight: Writable<number | null>;
    /**
     * Derived store for `maxWidth` updates.
     */
    maxWidth: Writable<number | null>;
    /**
     * Derived store for `minHeight` updates.
     */
    minHeight: Writable<number | null>;
    /**
     * Derived store for `minWidth` updates.
     */
    minWidth: Writable<number | null>;
    /**
     * Derived store for `rotateX` updates.
     */
    rotateX: Writable<number | null>;
    /**
     * Derived store for `rotateY` updates.
     */
    rotateY: Writable<number | null>;
    /**
     * Derived store for `rotateZ` updates.
     */
    rotateZ: Writable<number | null>;
    /**
     * Derived store for `scale` updates.
     */
    scale: Writable<number | null>;
    /**
     * Derived store for `transformOrigin` updates.
     */
    transformOrigin: TransformAPI.TransformOriginWritable;
    /**
     * Derived store for `translateX` updates.
     */
    translateX: Writable<number | null>;
    /**
     * Derived store for `translateY` updates.
     */
    translateY: Writable<number | null>;
    /**
     * Derived store for `translateZ` updates.
     */
    translateZ: Writable<number | null>;
    /**
     * Derived store for `zIndex` updates.
     */
    zIndex: Writable<number | null>;
    /**
     * Readable store for dimension data.
     */
    dimension: Readable<{
      width: number | 'auto' | 'inherit';
      height: number | 'auto' | 'inherit';
    }>;
    /**
     * Readable store for current element.
     */
    element: Readable<HTMLElement>;
    /**
     * Readable store for `contentHeight`.
     */
    resizeContentHeight: Readable<number | undefined>;
    /**
     * Readable store for `contentWidth`.
     */
    resizeContentWidth: Readable<number | undefined>;
    /**
     * Readable store indicating when `width` or `height` is `auto` or `inherit` indicating that this position
     * instance is a good candidate for the {@link resizeObserver} action.
     */
    resizeObservable: Readable<boolean>;
    /**
     * Readable store for `offsetHeight`.
     */
    resizeOffsetHeight: Readable<number | undefined>;
    /**
     * Readable store for `offsetWidth`.
     */
    resizeOffsetWidth: Readable<number | undefined>;
    /**
     * Protected store for resize observer updates.
     */
    resizeObserved: Writable<ResizeObserverData.ResizeObject>;
    /**
     * Readable store for transform data.
     */
    transform: Readable<TransformAPI.TransformData>;
  };
}

/**
 * Provides an action to apply a TJSPosition instance to a HTMLElement and invoke `position.parent`
 *
 * @param {HTMLElement}       node - The node associated with the action.
 *
 * @param {import('..').TJSPosition | import('../types').TJSPositionTypes.Positionable}   position - A position or
 *        positionable instance.
 *
 * @returns {(import('svelte/action').ActionReturn<
 *    import('..').TJSPosition |
 *    import('../types').TJSPositionTypes.Positionable
 * >)} The action lifecycle methods.
 */
declare function applyPosition(
  node: HTMLElement,
  position: TJSPosition | TJSPositionTypes.Positionable,
): svelte_action.ActionReturn<TJSPosition | TJSPositionTypes.Positionable>;

declare namespace Action {
  /**
   * Defines the options for the {@link draggable} action.
   */
  type DraggableOptions = {
    /**
     * A position or positionable instance.
     */
    position: TJSPosition | TJSPositionTypes.Positionable;
    /**
     * MouseEvent button that activates dragging; default: 0
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
     */
    button?: number;
    /**
     * A boolean value; controlling the `enabled` state.
     */
    enabled: boolean;
    /**
     *  When defined any event targets that have a class in this list are allowed.
     */
    hasTargetClassList?: Iterable<string>;
    /**
     * When defined any event targets that have a class in this list are ignored.
     */
    ignoreTargetClassList?: Iterable<string>;
    /**
     *  A writable store that tracks "dragging" state.
     */
    storeDragging?: Writable<boolean>;
    /**
     * When true tweening is enabled; default: false
     */
    tween?: boolean;
    /**
     * Quick tween options.
     */
    tweenOptions?: AnimationAPI.QuickTweenOptions;
  };
  /**
   * Provides an interface of the {@link draggable} action options support / Readable store to make updating / setting
   * draggable options much easier. When subscribing to the options instance returned by {@link draggable.options} the
   * Subscriber handler receives the entire instance.
   */
  interface DraggableOptionsStore extends Readable<DraggableOptionsStore> {
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
     * @returns {EasingReference} Get easing function or easing function name.
     */
    get tweenEase(): EasingReference;
    /**
     * @param {number}   duration - Set tween duration.
     */
    set tweenDuration(duration: number);
    /**
     * @param {EasingReference} ease - Set easing function by name or direct function.
     */
    set tweenEase(ease: EasingReference);
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
 * @param {import('./types').Action.DraggableOptions} options - Draggable action options.
 *
 * @returns {import('svelte/action').ActionReturn<Partial<import('./types').Action.DraggableOptions>>} Action lifecycle
 *          functions.
 */
declare function draggable(
  node: HTMLElement,
  {
    position,
    enabled,
    button,
    storeDragging,
    tween,
    tweenOptions,
    hasTargetClassList,
    ignoreTargetClassList,
  }: Action.DraggableOptions,
): svelte_action.ActionReturn<Partial<Action.DraggableOptions>>;
declare namespace draggable {
  /**
   * Define a function to get a DraggableOptionsStore instance.
   *
   * @param {({
   *    tween?: boolean,
   *    tweenOptions?: import('../animation/types').AnimationAPI.QuickTweenOptions
   * })} options - Initial options for DraggableOptionsStore.
   *
   * @returns {import('./types').Action.DraggableOptionsStore} A new options instance.
   */
  function options(options: {
    tween?: boolean;
    tweenOptions?: AnimationAPI.QuickTweenOptions;
  }): Action.DraggableOptionsStore;
}

export {
  Action,
  AnimationAPI,
  type AnimationGroupAPI,
  Data,
  type PositionStateAPI,
  System,
  TJSPosition,
  TJSPositionTypes,
  TransformAPI,
  ValidatorAPI,
  applyPosition,
  draggable,
};
