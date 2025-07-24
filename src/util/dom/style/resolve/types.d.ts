/**
 * Additional tracking data passed to CSS variable resolution path.
 */
type ResolveData = {
   /**
    * Stores resolution parents that are not found.
    */
   parentNotFound: Set<string>;

   /**
    * Dedupes warnings for cyclic dependency warnings.
    */
   seenCycles: Set<string>;

   /**
    * Cyclic dependency warnings enabled.
    */
   warnCycles: boolean;
}

export {
   ResolveData
}
