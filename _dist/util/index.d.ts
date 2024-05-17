import { Writable } from 'svelte/store';

declare class Hashing {
  /**
   * Provides a solid string hashing algorithm.
   *
   * Sourced from: https://stackoverflow.com/a/52171480
   *
   * @param {string}   str - String to hash.
   *
   * @param {number}   seed - A seed value altering the hash.
   *
   * @returns {number} Hash code.
   */
  static hashCode(str: string, seed?: number): number;
  /**
   * Validates that the given string is formatted as a UUIDv4 string.
   *
   * @param {string}   uuid - UUID string to test.
   *
   * @returns {boolean} Is UUIDv4 string.
   */
  static isUuidv4(uuid: string): boolean;
  /**
   * Generates a UUID v4 compliant ID. Please use a complete UUID generation package for guaranteed compliance.
   *
   * This code is an evolution of the following Gist.
   * https://gist.github.com/jed/982883
   *
   * There is a public domain / free copy license attached to it that is not a standard OSS license...
   * https://gist.github.com/jed/982883#file-license-txt
   *
   * @returns {string} UUIDv4
   */
  static uuidv4(): string;
}

/**
 * Provides utility functions for strings.
 */
declare class Strings {
  /**
   * Escape a given input string prefacing special characters with backslashes for use in a regular expression.
   *
   * @param {string}   string - An un-escaped input string.
   *
   * @returns {string} The escaped string suitable for use in a regular expression.
   */
  static escape(string: string): string;
  /**
   * Normalizes a string.
   *
   * @param {string}   string - A string to normalize for comparisons.
   *
   * @returns {string} Cleaned string.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize
   */
  static normalize(string: string): string;
}

/**
 * Provides timing related higher-order functions.
 */
declare class Timing {
  /**
   * Wraps a callback in a debounced timeout.
   *
   * Delay execution of the callback function until the function has not been called for the given delay in milliseconds.
   *
   * @param {Function} callback - A function to execute once the debounced threshold has been passed.
   *
   * @param {number}   delay - An amount of time in milliseconds to delay.
   *
   * @returns {Function} A wrapped function that can be called to debounce execution.
   */
  static debounce(callback: Function, delay: number): Function;
  /**
   * @param {object}   opts - Optional parameters.
   *
   * @param {Function} opts.single - Single click callback.
   *
   * @param {Function} opts.double - Double click callback.
   *
   * @param {number}   [opts.delay=400] - Double click delay.
   *
   * @returns {(event: Event) => void} The gated double-click handler.
   */
  static doubleClick({
    single,
    double,
    delay,
  }: {
    single: Function;
    double: Function;
    delay?: number;
  }): (event: Event) => void;
}

/**
 * State that is available in the resolution of the {@link Promise} for {@link BasicAnimation.finished}.
 */
type BasicAnimationState = {
  /**
   * True if the animation was cancelled.
   */
  cancelled: boolean;
};
/**
 * Defines the implementation for basic animation control.
 */
interface BasicAnimation {
  /**
   * True if animation is active; note: delayed animations are not active until start.
   */
  readonly isActive: boolean;
  /**
   * True if animation is completely finished.
   */
  readonly isFinished: boolean;
  /**
   * A Promise that is resolved when animation is finished.
   */
  readonly finished: Promise<BasicAnimationState>;
  /**
   * Cancels animation when invoked.
   */
  cancel(): void;
}

/**
 * Provides various type aliases used by {@link ResizeObserverManager}.
 */
declare namespace ResizeObserverData {
  /**
   * A function that receives offset / content height & width changes.
   */
  type ResizeFunction = (
    offsetWidth: number,
    offsetHeight: number,
    contentWidth?: number,
    contentHeight?: number,
  ) => unknown;
  /**
   * An object to update as a target for {@link ResizeObserverManager} resize updates.
   */
  type ResizeObject = {
    /** Stores `contentHeight` attribute. */
    contentHeight?: number;
    /** Stores `contentWidth` attribute. */
    contentWidth?: number;
    /** Stores `offsetHeight` attribute. */
    offsetHeight?: number;
    /** Stores `offsetWidth` attribute. */
    offsetWidth?: number;
  };
  /**
   * An extended object type defining various ways to create a valid target for {@link ResizeObserverManager}.
   */
  type ResizeObjectExtended = {
    /** Either a function or a writable store to receive resize updates. */
    resizeObserved?: Writable<ResizeObject> | ResizeFunction;
    /** A function that is invoked with content width & height changes. */
    setContentBounds?: (contentWidth: number, contentHeight: number) => unknown;
    /** A function that is invoked with offset width & height changes. */
    setDimension?: (offsetWidth: number, offsetHeight: number) => unknown;
    /** An object with a `stores` attribute and subsequent `resizeObserved` writable store. */
    stores?: {
      resizeObserved: Writable<ResizeObject>;
    };
  };
  /**
   * The receiving target for observed resize data associated with {@link ResizeObserverManager}. Just one of the
   * mechanisms defined is required to conform to a valid target.
   */
  type ResizeTarget = ResizeObject | ResizeObjectExtended | ResizeFunction;
}

export { type BasicAnimation, type BasicAnimationState, Hashing, ResizeObserverData, Strings, Timing };
