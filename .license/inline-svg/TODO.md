Modification notes...

In `src/svelte/action/dom/inline-svg/inline-svg.internal.js` the function `extractDimensionNumberAndUnit` was hardened
as the original did not take into account malformed or non-integer data like `width="123.45"`.
