/**
 * Options for `inlineSvg` action.
 */
export interface InlineSvgOptions
{
   /**
    * Automatically calculate dimensions from the available attributes of both the local SVG element (on which action
    * is used) and the remote SVG.
    *
    * For example, if you specify only `width` to the local SVG element, the height will automatically be calculated
    * from the remote SVG.
    *
    * For this to work, `width` & `height` must be "extractable" from the remote element, that is, the remote SVG must
    * either have the `viewBox` or both `width` and `height` attributes that is in the same unit.
    *
    * @defaultValue `true`
    */
   autoDimensions?: boolean;

   /**
    * Cache policy for use in fetch from svg `src`.
    *
    * @defaultValue `no-cache`
    */
   cache?: Request['cache'];

   /**
    * SVG remote URI.
    */
   src: string;

   /**
    * Optionally transform the SVG string fetched from remote source before inlining.
    */
   transform?: (svg: string) => string;
}
