/**
 * Tracks changes to positional data during {@link TJSPosition.set} updates to minimize changes to the element
 * style in {@link UpdateElementManager}.
 */
export class PositionChangeSet
{
   left: boolean;
   top: boolean;
   width: boolean;
   height: boolean;
   maxHeight: boolean;
   maxWidth: boolean;
   minHeight: boolean;
   minWidth: boolean;
   zIndex: boolean;
   transform: boolean;
   transformOrigin: boolean;

   constructor()
   {
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

   hasChange(): boolean
   {
      return this.left || this.top || this.width || this.height || this.maxHeight || this.maxWidth || this.minHeight ||
       this.minWidth || this.zIndex || this.transform || this.transformOrigin;
   }

   set(value: boolean): void
   {
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
