import { BrowserSupports } from '#runtime/util/browser';

import { TJSPosition }     from './TJSPosition';

import type {
   Readable,
   Subscriber,
   Unsubscriber }          from 'svelte/store';

/**
 * Provides an adjunct store to track an associated {@link TJSPosition} state that affects the validity of container
 * query types that perform size queries. When `width` or `height` is `auto` or `inherit` the size query containers may
 * be invalid. {@link CQPositionValidate.validate} also checks if the browser supports container queries.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries#using_container_size_queries
 */
export class CQPositionValidate implements Readable<CQPositionValidate>
{
   /**
    * Associated TJSPosition.
    */
   #position: WeakRef<TJSPosition>;

   /**
    * Stores the subscribers.
    */
   #subscribers: Subscriber<CQPositionValidate>[] = [];

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

   /**
    * Manually destroy and cleanup associations to any subscribers and TJSPosition instance.
    */
   destroy()
   {
      this.#cleanup();
   }

   /**
    * Returns the associated TJSPosition instance.
    */
   getPosition(): TJSPosition | undefined
   {
      return this.#deref();
   }

   /**
    * Set a new TJSPosition instance to monitor.
    *
    * @param position - New TJSPosition instance to associate.
    */
   setPosition(position: TJSPosition)
   {
      const current = this.#deref();

      if (position === current) { return; }

      this.#cleanup();

      this.#position = void 0;

      if (position instanceof TJSPosition)
      {
         this.#position = new WeakRef(position);
         if (this.#subscribers.length)
         {
            this.#unsubscribe.push(position.stores.resizeObservableHeight.subscribe(this.#updateStateBound));
            this.#unsubscribe.push(position.stores.resizeObservableWidth.subscribe(this.#updateStateBound));
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

   /**
    * @param cqType - The container query type to validate against current associated {@link TJSPosition} state.
    *
    * @returns Whether the browser and associated TJSPosition current state supports the requested container query type.
    */
   validate(cqType: string): boolean
   {
      if (!BrowserSupports.containerQueries) { return false; }

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

   // Store subscriber implementation --------------------------------------------------------------------------------

   /**
    * @param handler - Callback function that is invoked on update / changes.
    *
    * @returns Unsubscribe function.
    */
   subscribe(handler: Subscriber<CQPositionValidate>): Unsubscriber
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

   // Internal Implementation ----------------------------------------------------------------------------------------

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

   /**
    * Updates subscribers.
    */
   #updateSubscribers()
   {
      for (let cntr = 0; cntr < this.#subscribers.length; cntr++) { this.#subscribers[cntr](this); }
   }
}
