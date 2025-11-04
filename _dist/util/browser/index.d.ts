/**
 * Provides a utility to validate media file types and determine the appropriate HTML element type for rendering.
 */
declare class AssetValidator {
  #private;
  /**
   * @private
   */
  constructor();
  /**
   * Provides several readonly default media type Sets useful for the `mediaTypes` option.
   */
  static get MediaTypes(): AssetValidator.DefaultMediaTypes;
  /**
   * Parses the provided file path to determine the media type and validity based on the file extension. Certain
   * extensions can be excluded in addition to filtering by specified media types.
   *
   * @param options - Options.
   *
   * @returns The parsed asset information containing the file path, extension, element type, and whether the parsing
   *          is valid for the file extension is supported and not excluded.
   *
   * @throws {TypeError} If the provided `url` is not a string or URL, `routePrefix` is not a string,
   *         `exclude` is not a Set, or `mediaTypes` is not a Set.
   */
  static parseMedia({
    url,
    routePrefix,
    exclude,
    mediaTypes,
    raiseException,
  }: AssetValidator.Options.ParseMedia): AssetValidator.Data.ParsedMediaResult;
}
/**
 * Defines various options and data types for {@link AssetValidator}.
 */
declare namespace AssetValidator {
  /**
   * Provides several default {@link AssetValidator.Options.MediaTypes} Sets that are commonly used.
   */
  type DefaultMediaTypes = Readonly<{
    /**
     * All supported media types 'audio' | 'img' | 'svg' | 'video'.
     */
    all: ReadonlySet<AssetValidator.Options.MediaTypes>;
    /**
     * Only media type 'audio'.
     */
    audio: ReadonlySet<AssetValidator.Options.MediaTypes>;
    /**
     * Only media type 'img'.
     */
    img: ReadonlySet<AssetValidator.Options.MediaTypes>;
    /**
     * Only media types 'img' | 'svg'.
     */
    img_svg: ReadonlySet<AssetValidator.Options.MediaTypes>;
    /**
     * Only media types 'img' | 'svg' | 'video'.
     */
    img_svg_video: ReadonlySet<AssetValidator.Options.MediaTypes>;
    /**
     * Only media type 'video'.
     */
    video: ReadonlySet<AssetValidator.Options.MediaTypes>;
  }>;
  namespace Options {
    /**
     * Valid media types to parse / define for {@link AssetValidator.parseMedia}`.
     */
    type MediaTypes = 'audio' | 'img' | 'svg' | 'video';
    /**
     * Options for {@link AssetValidator.parseMedia}.
     */
    interface ParseMedia {
      /**
       * The URL of the media asset to validate.
       */
      url: string | URL;
      /**
       * A set of file extensions to exclude from validation.
       */
      exclude?: Set<string>;
      /**
       * A set of media types to validate against including: `audio`, `img`, `svg`, `video`.
       *
       * @defaultValue `'audio', 'img', 'svg', 'video'`
       */
      mediaTypes?: ReadonlySet<MediaTypes> | Set<MediaTypes>;
      /**
       * When true exceptions are thrown.
       *
       * @defaultValue `false`
       */
      raiseException?: boolean;
      /**
       * An additional route / URL prefix to add in constructing URL.
       */
      routePrefix?: string;
    }
  }
  namespace Data {
    /**
     * A non-valid parse media result.
     */
    type InvalidMediaResult = {
      /**
       * Original URL.
       */
      url: string | URL;
      /**
       * Extension type
       */
      extension?: undefined;
      /**
       * Key to indicate which element should render the URL.
       */
      elementType?: undefined;
      /**
       * Result indicating invalid.
       */
      valid: false;
    };
    /**
     * A valid parse media result.
     */
    type ValidMediaResult = {
      /**
       * Original URL.
       */
      src: string | URL;
      /**
       * Parsed URL.
       */
      url: URL;
      /**
       * Extension type
       */
      extension?: string;
      /**
       * Key to indicate which element should render the URL.
       */
      elementType?: 'img' | 'video' | 'svg' | 'audio';
      /**
       * Result indicating valid.
       */
      valid: true;
    };
    /**
     * The `parseMedia` result indicating either a valid / non-valid parse attempt.
     */
    type ParsedMediaResult = ValidMediaResult | InvalidMediaResult;
  }
}

/**
 * Provides utility methods for checking browser capabilities.
 *
 * @see https://kilianvalkhof.com/2021/web/detecting-media-query-support-in-css-and-javascript/
 *
 * @privateRemarks
 * TODO: perhaps add support for various standard media query checks for level 4 & 5.
 */
declare class BrowserSupports {
  /**
   * @private
   */
  constructor();
  /**
   * Check for container query support.
   *
   * @returns True if container queries supported.
   */
  static get containerQueries(): boolean;
}

/**
 * Provides access to the Clipboard API for reading / writing text strings. This requires a secure context.
 *
 * Note: `writeText` will attempt to use the older `execCommand` if available when `navigator.clipboard` is not
 * available.
 */
declare class ClipboardAccess {
  /**
   * @private
   */
  constructor();
  /**
   * Uses `navigator.clipboard` if available to read text from the clipboard.
   *
   * Note: Always returns `undefined` when `navigator.clipboard` is not available or the clipboard contains the
   * empty string.
   *
   * @param [activeWindow=window] Optional active current window.
   *
   * @returns {Promise<string|undefined>} The current clipboard text or undefined.
   */
  static readText(activeWindow?: Window): Promise<string | undefined>;
  /**
   * Uses `navigator.clipboard` if available then falls back to `document.execCommand('copy')` if available to copy
   * the given text to the clipboard.
   *
   * @param text - Text to copy to the browser clipboard.
   *
   * @param [activeWindow=window] Optional active current window.
   *
   * @returns Copy successful.
   */
  static writeText(text: string, activeWindow?: Window): Promise<boolean>;
}

/**
 * Provides a utility function to parse / construct fully qualified URL instances from a URL string.
 */
declare class URLParser {
  #private;
  /**
   * @private
   */
  constructor();
  /**
   * Parses a URL string converting it to a fully qualified URL. If URL is an existing URL instance, it is returned
   * immediately. Optionally, you may construct a fully qualified URL from a relative base origin / path or with a
   * route prefix added to the current location origin.
   *
   * @param options - Options.
   *
   * @param options.url - URL string to convert to a URL.
   *
   * @param [options.base] - Optional fully qualified base path for relative URL construction.
   *
   * @param [options.routePrefix] - Optional route prefix to add to location origin for absolute URL strings
   *        when `base` is not defined.
   *
   * @returns Parsed URL or null if `url` is not parsed.
   */
  static parse({ url, base, routePrefix }: { url: string | URL; base?: string; routePrefix?: string }): URL | null;
}

export { AssetValidator, BrowserSupports, ClipboardAccess, URLParser };
