import { Frozen }       from '#runtime/util';

import { CrossWindow }  from './CrossWindow';

import { URLParser }    from './URLParser';

/**
 * Provides a utility to validate media file types and determine the appropriate HTML element type for rendering.
 */
class AssetValidator
{
   /** Default media types. */
   static #mediaTypes: AssetValidator.DefaultMediaTypes = Object.freeze({
      all: Frozen.Set<AssetValidator.Options.MediaTypes>(['audio', 'img', 'svg', 'video']),
      audio: Frozen.Set<AssetValidator.Options.MediaTypes>(['audio']),
      img: Frozen.Set<AssetValidator.Options.MediaTypes>(['img']),
      img_svg: Frozen.Set<AssetValidator.Options.MediaTypes>(['img', 'svg']),
      img_svg_video: Frozen.Set<AssetValidator.Options.MediaTypes>(['img', 'svg', 'video']),
      video: Frozen.Set<AssetValidator.Options.MediaTypes>(['video']),
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
   constructor()
   {
      throw new Error('AssetValidator constructor: This is a static class and should not be constructed.');
   }

   /**
    * Provides several readonly default media type Sets useful for the `mediaTypes` option.
    */
   static get MediaTypes(): AssetValidator.DefaultMediaTypes
   {
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
   static parseMedia({ url, routePrefix, exclude, mediaTypes = this.#mediaTypes.all, raiseException = false }:
    AssetValidator.Options.ParseMedia): AssetValidator.Data.ParsedMediaResult
   {
      const throws = typeof raiseException === 'boolean' ? raiseException : true;

      if (typeof url !== 'string' && !CrossWindow.isURL(url))
      {
         if (throws) { throw new TypeError(`'url' is not a string or URL instance.`); }
         else { return { url, valid: false }; }
      }

      if (routePrefix !== void 0 && typeof routePrefix !== 'string')
      {
         if (throws) { throw new TypeError(`'routePrefix' is not a string.`); }
         else { return { url, valid: false }; }
      }

      if (exclude !== void 0 && !CrossWindow.isSet(exclude))
      {
         if (throws) { throw new TypeError(`'exclude' is not a Set.`); }
         else { return { url, valid: false }; }
      }

      if (!CrossWindow.isSet(mediaTypes))
      {
         if (throws) { throw new TypeError(`'mediaTypes' is not a Set.`); }
         else { return { url, valid: false }; }
      }

      const targetURL = typeof url === 'string' ? URLParser.parse({ url, routePrefix }) : url;

      if (!targetURL)
      {
         if (throws) { throw new TypeError(`'url' is invalid.`); }
         else { return { url, valid: false }; }
      }

      const extensionMatch = targetURL.pathname.match(/\.([a-zA-Z0-9]+)$/);
      const extension = extensionMatch ? extensionMatch[1].toLowerCase() : void 0;

      const isExcluded = extension && CrossWindow.isSet(exclude) ? exclude.has(extension) : false;

      let elementType: 'img' | 'video' | 'svg' | 'audio' | undefined = void 0;
      let valid = false;

      if (extension && !isExcluded)
      {
         if (this.#svgExtensions.has(extension) && mediaTypes.has('svg'))
         {
            elementType = 'svg';
            valid = true;
         }
         else if (this.#imageExtensions.has(extension) && mediaTypes.has('img'))
         {
            elementType = 'img';
            valid = true;
         }
         else if (this.#videoExtensions.has(extension) && mediaTypes.has('video'))
         {
            elementType = 'video';
            valid = true;
         }
         else if (this.#audioExtensions.has(extension) && mediaTypes.has('audio'))
         {
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
 * Defines various options and data types for {@link AssetValidator}.
 */
declare namespace AssetValidator {
   /**
    * Provides several default {@link AssetValidator.Options.MediaTypes} Sets that are commonly used.
    */
   export type DefaultMediaTypes = Readonly<{
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

   export namespace Options {
      /**
       * Valid media types to parse / define for {@link AssetValidator.parseMedia}`.
       */
      export type MediaTypes = 'audio' | 'img' | 'svg' | 'video';

      /**
       * Options for {@link AssetValidator.parseMedia}.
       */
      export interface ParseMedia {
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

   export namespace Data {
      /**
       * A non-valid parse media result.
       */
      export type InvalidMediaResult = {
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
      export type ValidMediaResult = {
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
      export type ParsedMediaResult = ValidMediaResult | InvalidMediaResult;
   }
}

export { AssetValidator }
