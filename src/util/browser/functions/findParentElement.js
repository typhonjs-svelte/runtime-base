import { isIterable } from '#runtime/util/object';

/**
 * Finds any parent element from the source element that matches and contains the CSS ID / class data specified.
 *
 * @param {{ source: HTMLElement, id?: string, class?: string | Iterable<string> }} options - Search options.
 *
 * @returns {HTMLElement | undefined} The matching parent element if any.
 */
export function findParentElement(options)
{
   const source = options?.source;
   const id = options?.id;
   const classData = options?.class;

   const classDataIterable = isIterable(classData);

   if (!source instanceof HTMLElement) { throw new TypeError(`'source' is not an HTMLElement.`); }

   if (id !== void 0 && typeof id !== 'string') { throw new TypeError(`'id' is not a string.`); }

   if (classData !== void 0 && typeof classData !== 'string' && !classDataIterable)
   {
      throw new TypeError(`'class' is not a string or list of strings.`);
   }

   let currentElement = source.parentElement;

   while (currentElement)
   {
      const hasMatchingId = id !== void 0 ? currentElement.id === id : true;

      let hasMatchingClass = true;

      if (classData !== void 0)
      {
         if (typeof classData === 'string')
         {
            hasMatchingClass = currentElement.classList.contains(classData);
         }
         else
         {
            for (const className of classData)
            {
               if (!currentElement.classList.contains(className))
               {
                  hasMatchingClass = false;
                  break;
               }
            }
         }
      }

      if (hasMatchingId && hasMatchingClass) { return currentElement; }

      currentElement = currentElement.parentElement;
   }

   return void 0;
}
