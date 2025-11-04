import { CrossRealm, Frozen } from '@typhonjs-svelte/runtime-base/util';

/**
 * Provides a utility function to parse / construct fully qualified URL instances from a URL string.
 */
class URLParser {
    /**
     * @private
     */
    constructor() {
        throw new Error('URLParser constructor: This is a static class and should not be constructed.');
    }
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
    static parse({ url, base, routePrefix }) {
        if (CrossRealm.isURL(url)) {
            return url;
        }
        if (typeof url !== 'string') {
            return null;
        }
        if (base !== void 0 && typeof base !== 'string') {
            return null;
        }
        if (routePrefix !== void 0 && typeof routePrefix !== 'string') {
            return null;
        }
        const targetURL = this.#createURL(url);
        // Parse and return already fully qualified `url` string.
        if (targetURL) {
            return targetURL;
        }
        let targetBase;
        // Parse relative url string.
        if (url.startsWith('./') || url.startsWith('../')) {
            // Relative from provided `base` or current path.
            targetBase = base ? base : `${globalThis.location.origin}${globalThis.location.pathname}`;
        }
        else {
            let targetRoutePrefix = '';
            // Relative to current origin, but include any defined route prefix.
            if (routePrefix) {
                // Ensure route prefix starts and ends with `/` for proper URL parsing.
                targetRoutePrefix = routePrefix.startsWith('/') ? routePrefix : `/${routePrefix}`;
                targetRoutePrefix = targetRoutePrefix.endsWith('/') ? targetRoutePrefix : `${targetRoutePrefix}/`;
            }
            targetBase = `${globalThis.location.origin}${targetRoutePrefix}`;
        }
        return this.#createURL(url, targetBase);
    }
    // Internal implementation ----------------------------------------------------------------------------------------
    /**
     * Helper to create a URL and catch any exception. Useful until `URL.parse` and `URL.canParse` are more widespread.
     *
     * @param url - URL string.
     *
     * @param base - Base origin / path.
     *
     * @returns Valid URL or null.
     */
    static #createURL(url, base = '') {
        try {
            return new URL(url, base);
        }
        catch (err) {
            return null;
        }
    }
}

/**
 * Provides a utility to validate media file types and determine the appropriate HTML element type for rendering.
 */
class AssetValidator {
    /** Default media types. */
    static #mediaTypes = Object.freeze({
        all: Frozen.Set(['audio', 'img', 'svg', 'video']),
        audio: Frozen.Set(['audio']),
        img: Frozen.Set(['img']),
        img_svg: Frozen.Set(['img', 'svg']),
        img_svg_video: Frozen.Set(['img', 'svg', 'video']),
        video: Frozen.Set(['video']),
    });
    /** Supported audio extensions. */
    static #audioExtensions = new Set(['mp3', 'wav', 'ogg', 'aac', 'flac', 'webm']);
    /** Supported image extensions. */
    static #imageExtensions = new Set(['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp']);
    /** Supported SVG extensions. */
    static #svgExtensions = new Set(['svg']);
    /** Supported video extensions. */
    static #videoExtensions = new Set(['mp4', 'webm', 'ogg']);
    /**
     * @private
     */
    constructor() {
        throw new Error('AssetValidator constructor: This is a static class and should not be constructed.');
    }
    /**
     * Provides several readonly default media type Sets useful for the `mediaTypes` option.
     */
    static get MediaTypes() {
        return this.#mediaTypes;
    }
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
    static parseMedia({ url, routePrefix, exclude, mediaTypes = this.#mediaTypes.all, raiseException = false }) {
        const throws = typeof raiseException === 'boolean' ? raiseException : true;
        if (typeof url !== 'string' && !CrossRealm.isURL(url)) {
            if (throws) {
                throw new TypeError(`'url' is not a string or URL instance.`);
            }
            else {
                return { url, valid: false };
            }
        }
        if (routePrefix !== void 0 && typeof routePrefix !== 'string') {
            if (throws) {
                throw new TypeError(`'routePrefix' is not a string.`);
            }
            else {
                return { url, valid: false };
            }
        }
        if (exclude !== void 0 && !CrossRealm.isSet(exclude)) {
            if (throws) {
                throw new TypeError(`'exclude' is not a Set.`);
            }
            else {
                return { url, valid: false };
            }
        }
        if (!CrossRealm.isSet(mediaTypes)) {
            if (throws) {
                throw new TypeError(`'mediaTypes' is not a Set.`);
            }
            else {
                return { url, valid: false };
            }
        }
        const targetURL = typeof url === 'string' ? URLParser.parse({ url, routePrefix }) : url;
        if (!targetURL) {
            if (throws) {
                throw new TypeError(`'url' is invalid.`);
            }
            else {
                return { url, valid: false };
            }
        }
        const extensionMatch = targetURL.pathname.match(/\.([a-zA-Z0-9]+)$/);
        const extension = extensionMatch ? extensionMatch[1].toLowerCase() : void 0;
        const isExcluded = extension && CrossRealm.isSet(exclude) ? exclude.has(extension) : false;
        let elementType = void 0;
        let valid = false;
        if (extension && !isExcluded) {
            if (this.#svgExtensions.has(extension) && mediaTypes.has('svg')) {
                elementType = 'svg';
                valid = true;
            }
            else if (this.#imageExtensions.has(extension) && mediaTypes.has('img')) {
                elementType = 'img';
                valid = true;
            }
            else if (this.#videoExtensions.has(extension) && mediaTypes.has('video')) {
                elementType = 'video';
                valid = true;
            }
            else if (this.#audioExtensions.has(extension) && mediaTypes.has('audio')) {
                elementType = 'audio';
                valid = true;
            }
        }
        return valid ? {
            src: url,
            url: targetURL,
            extension,
            elementType,
            valid
        } : { url, valid: false };
    }
}
Object.freeze(AssetValidator);

/**
 * Provides utility methods for checking browser capabilities.
 *
 * @see https://kilianvalkhof.com/2021/web/detecting-media-query-support-in-css-and-javascript/
 *
 * @privateRemarks
 * TODO: perhaps add support for various standard media query checks for level 4 & 5.
 */
class BrowserSupports {
    /**
     * @private
     */
    constructor() {
        throw new Error('BrowserSupports constructor: This is a static class and should not be constructed.');
    }
    /**
     * Check for container query support.
     *
     * @returns True if container queries supported.
     */
    static get containerQueries() {
        return 'container' in document.documentElement.style;
    }
}

/**
 * Provides access to the Clipboard API for reading / writing text strings. This requires a secure context.
 *
 * Note: `writeText` will attempt to use the older `execCommand` if available when `navigator.clipboard` is not
 * available.
 */
class ClipboardAccess {
    /**
     * @private
     */
    constructor() {
        throw new Error('ClipboardAccess constructor: This is a static class and should not be constructed.');
    }
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
    static async readText(activeWindow = window) {
        let result = '';
        if (!CrossRealm.isWindow(activeWindow)) {
            throw new TypeError(`ClipboardAccess.readText error: 'activeWindow' is not a Window.`);
        }
        if (activeWindow?.navigator?.clipboard) {
            try {
                result = await activeWindow.navigator.clipboard.readText();
            }
            catch (err) { /**/ }
        }
        return result === '' ? void 0 : result;
    }
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
    static async writeText(text, activeWindow = window) {
        if (typeof text !== 'string') {
            throw new TypeError(`ClipboardAccess.writeText error: 'text' is not a string.`);
        }
        if (!CrossRealm.isWindow(activeWindow)) {
            throw new TypeError(`ClipboardAccess.writeText error: 'activeWindow' is not a Window.`);
        }
        let success = false;
        if (activeWindow?.navigator?.clipboard) {
            try {
                await activeWindow.navigator.clipboard.writeText(text);
                success = true;
            }
            catch (err) { /**/ }
        }
        else if (typeof activeWindow?.document?.execCommand === 'function') {
            const textArea = activeWindow.document.createElement('textarea');
            // Place in the top-left corner of the screen regardless of scroll position.
            textArea.style.position = 'fixed';
            textArea.style.top = '0';
            textArea.style.left = '0';
            // Ensure it has a small width and height. Setting to 1px / 1em
            // doesn't work as this gives a negative w/h on some browsers.
            textArea.style.width = '2em';
            textArea.style.height = '2em';
            // We don't need padding, reducing the size if it does flash render.
            textArea.style.padding = '0';
            // Clean up any borders.
            textArea.style.border = 'none';
            textArea.style.outline = 'none';
            textArea.style.boxShadow = 'none';
            // Avoid the flash of the white box if rendered for any reason.
            textArea.style.background = 'transparent';
            textArea.value = text;
            activeWindow.document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                success = activeWindow.document.execCommand('copy');
            }
            catch (err) { /**/ }
            activeWindow.document.body.removeChild(textArea);
        }
        return success;
    }
}

export { AssetValidator, BrowserSupports, ClipboardAccess, URLParser };
//# sourceMappingURL=index.js.map
