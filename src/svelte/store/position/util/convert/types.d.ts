// Defines local private types that are not included in the public declarations / API.

/**
 * Defines the relative match group results from `regexRelative` used in
 */
export type RelativeMatch = {
   /**
    * The operation to perform if any: '+=' | '-=' | '*='
    */
   operation: string | undefined,

   /**
    * The value / number to parse.
    */
   value: number,

   /**
    * Any associated unit: '%' | '%~' | 'px'
    */
   unit: string | undefined;
};
