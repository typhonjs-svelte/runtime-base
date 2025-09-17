import { isIterable }   from '#runtime/util/object';

import type {
   Readable,
   Subscriber,
   Unsubscriber }       from 'svelte/store';

/**
 * Provides a Svelte 4 Readable store based Set implementation.
 *
 * Note: This implementation will be removed in transition to Svelte 5.
 */
export class SvelteSet<T> extends Set<T> implements Readable<SvelteSet<T>>
{
   /**
    * Stores the subscribers.
    */
   #subscribers: Subscriber<SvelteSet<T>>[] = [];

   constructor(data?: Iterable<T>)
   {
      super();

      if (data !== void 0 && !isIterable(data))
      {
         throw new TypeError(`'data' must be an iterable list.`);
      }

      if (data)
      {
         for (const entry of data) { super.add(entry); }
      }
   }

   /**
    * Appends a new element with a specified value to the end of the Set.
    *
    * @param value - Value to add.
    *
    * @returns This instance.
    */
   add(value: T): this
   {
      const hasValue = super.has(value);

      super.add(value);

      if (!hasValue) { this.#updateSubscribers(); }

      return this;
   }

   /**
    * Clears this set.
    */
   clear()
   {
      if (this.size === 0) { return; }

      super.clear();

      this.#updateSubscribers();
   }

   /**
    * Removes a specified value from the Set.
    *
    * @param value - Value to delete.
    *
    * @returns Returns true if an element in the Set existed and has been removed, or false if the element
    *          does not exist.
    */
   delete(value: T): boolean
   {
      const result = super.delete(value);

      if (result) { this.#updateSubscribers(); }

      return result;
   }

   // Store subscriber implementation --------------------------------------------------------------------------------

   /**
    * @param handler - Callback function that is invoked on update / changes.
    *
    * @returns Unsubscribe function.
    */
   subscribe(handler: Subscriber<SvelteSet<T>>): Unsubscriber
   {
      const currentIdx = this.#subscribers.findIndex((sub) => sub === handler);
      if (currentIdx === -1)
      {
         this.#subscribers.push(handler);
         handler(this);
      }

      // Return unsubscribe function.
      return () =>
      {
         const index = this.#subscribers.findIndex((sub) => sub === handler);
         if (index >= 0) { this.#subscribers.splice(index, 1); }
      };
   }

   /**
    * Updates subscribers.
    */
   #updateSubscribers()
   {
      for (let cntr = 0; cntr < this.#subscribers.length; cntr++) { this.#subscribers[cntr](this); }
   }
}
