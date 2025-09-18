import { subscribeIgnoreFirst }  from '#runtime/svelte/store/util';

import { SvelteSet }             from './SvelteSet'

import type {
   Readable,
   Subscriber,
   Unsubscriber }                from 'svelte/store';

/**
 * Provides a readonly variant of SvelteSet wrapping an instance of SvelteSet as the source.
 */
export class ReadonlySvelteSet<T> implements ReadonlySet<T>, Readable<ReadonlySvelteSet<T>>
{
   /**
    * Stores the subscribers.
    */
   #subscribers: Subscriber<ReadonlySvelteSet<T>>[] = [];

   /**
    * The backing wrapped SvelteSet implementation.
    */
   readonly #svelteSet: SvelteSet<T>;

   /**
    * Unsubscriber when subscribed to backing SvelteSet.
    */
   #unsubscribe?: Unsubscriber;

   /**
    * Creates a readonly variant of SvelteSet.
    *
    * @param svelteSet - Backing wrapped SvelteSet implementation.
    */
   constructor(svelteSet: SvelteSet<T>)
   {
      if (!(svelteSet instanceof SvelteSet))
      {
         throw new TypeError(`'svelteSet' is not an instance of SvelteSet.`);
      }

      this.#svelteSet = svelteSet;
   }

   /**
    * Iterates over values in the set.
    */
   [Symbol.iterator](): IterableIterator<T>
   {
      return this.#svelteSet.values();
   }

   /**
    * Returns the number of unique elements in this set.
    */
   get size(): number
   {
      return this.#svelteSet.size;
   }

   /**
    * Returns an iterable of [v,v] pairs for every value `v` in the set.
    */
   entries(): IterableIterator<[T, T]>
   {
      return this.#svelteSet.entries();
   }

   /**
    * Executes a provided function once for each value in this set, in insertion order.
    *
    * @param callbackfn - Callback function.
    *
    * @param thisArg - Optional this reference for callback function.
    */
   forEach(callbackfn: (value: T, value2: T, set: ReadonlySvelteSet<T>) => void, thisArg?: unknown): void
   {
      for (const v of this.#svelteSet.values())
      {
         callbackfn.call(thisArg as any, v, v, this);
      }
   }

   /**
    * Returns a boolean indicating whether an element with the specified value exists in this set or not.
    *
    * @param value - Value to test.
    */
   has(value: T): boolean
   {
      return this.#svelteSet.has(value);
   }

   /**
    * Despite its name, returns an iterable of the values in the set.
    */
   keys(): IterableIterator<T>
   {
      return this.#svelteSet.keys();
   }

   /**
    * Returns an iterable of values in the set.
    */
   values(): IterableIterator<T>
   {
      return this.#svelteSet.values();
   }

   // Store subscriber implementation --------------------------------------------------------------------------------

   /**
    * @param handler - Callback function that is invoked on update / changes.
    *
    * @returns Unsubscribe function.
    */
   subscribe(handler: Subscriber<ReadonlySvelteSet<T>>): Unsubscriber
   {
      const currentIdx = this.#subscribers.findIndex((sub) => sub === handler);
      if (currentIdx === -1)
      {
         this.#subscribers.push(handler);

         if (this.#subscribers.length === 1)
         {
            this.#unsubscribe = subscribeIgnoreFirst(this.#svelteSet, this.#updateSubscribers.bind(this));
         }

         handler(this);
      }

      // Return unsubscribe function.
      return () =>
      {
         const index = this.#subscribers.findIndex((sub) => sub === handler);
         if (index >= 0)
         {
            this.#subscribers.splice(index, 1);

            if (this.#subscribers.length === 0)
            {
               this.#unsubscribe?.();
               this.#unsubscribe = void 0;
            }
         }
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
