import { TJSPosition }  from './TJSPosition';

import type {
   Readable,
   Subscriber,
   Unsubscriber }       from 'svelte/store';

/**
 * Provides an adjunct store to track the {@link TJSPosition} state that affects the validity of container query
 * types that perform size queries. When `width` or `height` is `auto` or `inherit` the size query containers may be
 * invalid.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries#using_container_size_queries
 */
export class ContainerQueryTypes implements Readable<ContainerQueryTypes>
{
   /**
    * Associated TJSPosition.
    */
   #position: WeakRef<TJSPosition>;

   /**
    * Stores the subscribers.
    */
   #subscribers: Subscriber<ContainerQueryTypes>[] = [];

   /**
    * Unsubscriber when subscribed to backing SvelteSet.
    */
   #unsubscribe: Unsubscriber[] = [];

   #resizeObservableHeight = false;
   #resizeObservableWidth = false;

   readonly #updateStateBound: Subscriber<boolean>;

   /**
    * @param [position] - Associated TJSPosition instance.
    */
   constructor(position?: TJSPosition)
   {
      this.#updateStateBound = this.#updateState.bind(this);

      if (position) { this.setPosition(position); }
   }

   #cleanup(notify = false)
   {
      for (const unsubscribe of this.#unsubscribe) { unsubscribe(); }
      this.#unsubscribe.length = 0;

      this.#resizeObservableHeight = false;
      this.#resizeObservableWidth = false;

      if (notify) { this.#updateSubscribers(); }
   }

   #deref(): TJSPosition
   {
      const position = this.#position?.deref();

      if (!position) { this.#cleanup(true); }

      return position;
   }

   /**
    * Returns the associated TJSPosition instance.
    */
   getPosition(): TJSPosition | undefined
   {
      return this.#deref();
   }

   /**
    * @param cqType - The container query type.
    *
    * @returns Whether the associated TJSPosition current state supports the requested container query type.
    */
   has(cqType: string): boolean
   {
      const hasPosition = this.#deref() !== void 0;

      switch (cqType)
      {
         case 'inline-size':
            return hasPosition && !this.#resizeObservableWidth;

         case 'normal':
            return true;

         case 'size':
            return hasPosition && !this.#resizeObservableWidth && !this.#resizeObservableHeight;
      }

      return false;
   }

   setPosition(newPosition: TJSPosition)
   {
      const current = this.#deref();

      if (newPosition === current) { return; }

      this.#cleanup();

      this.#position = void 0;

      if (newPosition instanceof TJSPosition)
      {
         this.#position = new WeakRef(newPosition);
         if (this.#subscribers.length)
         {
            this.#unsubscribe.push(newPosition.stores.resizeObservableHeight.subscribe(this.#updateStateBound));
            this.#unsubscribe.push(newPosition.stores.resizeObservableWidth.subscribe(this.#updateStateBound));
         }
      }
   }

   /**
    * Returns the serialized state tracking supported container types.
    */
   toJSON(): { inlineSize: boolean; normal: boolean; size: boolean }
   {
      return {
         inlineSize: !this.#resizeObservableWidth,
         normal: true,
         size: !this.#resizeObservableWidth && !this.#resizeObservableHeight
      }
   }

   #updateState()
   {
      const position = this.#deref();
      if (position)
      {
         this.#resizeObservableHeight = position.resizeObservableHeight;
         this.#resizeObservableWidth = position.resizeObservableWidth;
      }

      this.#updateSubscribers();
   }

   // Store subscriber implementation --------------------------------------------------------------------------------

   /**
    * @param handler - Callback function that is invoked on update / changes.
    *
    * @returns Unsubscribe function.
    */
   subscribe(handler: Subscriber<ContainerQueryTypes>): Unsubscriber
   {
      const currentIdx = this.#subscribers.findIndex((sub) => sub === handler);
      if (currentIdx === -1)
      {
         this.#subscribers.push(handler);

         if (this.#subscribers.length === 1)
         {
            const position = this.#deref();

            if (position)
            {
               this.#unsubscribe.push(position.stores.resizeObservableHeight.subscribe(this.#updateStateBound));
               this.#unsubscribe.push(position.stores.resizeObservableWidth.subscribe(this.#updateStateBound));
            }
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

            if (this.#subscribers.length === 0) { this.#cleanup(); }
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
