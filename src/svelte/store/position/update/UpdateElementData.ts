import { writable }                    from 'svelte/store';

import { TJSPositionData }             from '../data';
import { TJSTransformData }            from '../transform';

import type {
   Subscriber,
   Writable }                          from 'svelte/store';


import type { PositionChangeSet }      from './PositionChangeSet';

import type { OptionsInternal }        from '../types-local';

import type { DataAPI }                   from '../data/types';
import type { TJSPositionStyleCache }  from '../util';
import type { TransformAPI }           from '../transform/types';

/**
 * Encapsulates internal data from a TJSPosition instance to be manipulated by {@link UpdateElementManager}.
 */
export class UpdateElementData
{
   changeSet: PositionChangeSet;

   data: TJSPositionData;

   dataSubscribers: TJSPositionData;

   dimensionData: { width: number | 'auto' | 'inherit' | null, height: number | 'auto' | 'inherit' | null };

   options: OptionsInternal;

   queued: boolean;

   storeDimension: Writable<{ width: number | 'auto' | 'inherit' | null, height: number | 'auto' | 'inherit' | null }>;
   storeTransform: Writable<TransformAPI.TransformData>;

   styleCache: TJSPositionStyleCache;

   subscribers: Subscriber<DataAPI.TJSPositionData>[];

   transforms: TransformAPI;
   transformData: TJSTransformData;

   constructor(changeSet: PositionChangeSet, data: TJSPositionData, options: OptionsInternal,
    styleCache: TJSPositionStyleCache, subscribers: Subscriber<DataAPI.TJSPositionData>[],
     transforms: TransformAPI)
   {
      /**
       */
      this.changeSet = changeSet;

      /**
       * Stores the private data from TJSPosition.
       */
      this.data = data;

      /**
       * Provides a copy of local data sent to subscribers.
       *
       * @type {TJSPositionData}
       */
      this.dataSubscribers = Object.seal(new TJSPositionData());

      /**
       * Stores the current dimension data used for the readable `dimension` store.
       */
      this.dimensionData = Object.seal({ width: 0, height: 0 });

      /**
       */
      this.options = options;

      /**
       * Stores if this TJSPosition / update data is queued for update.
       */
      this.queued = false;

      /**
       */
      this.styleCache = styleCache;

      /**
       */
      this.storeDimension = writable(this.dimensionData);

      /**
       */
      this.subscribers = subscribers;

      /**
       */
      this.transforms = transforms;

      /**
       * Stores the current transform data used for the readable `transform` store. It is only active when there are
       * subscribers to the store or calculateTransform options is true.
       */
      this.transformData = new TJSTransformData();

      /**
       * When there are subscribers set option to calculate transform updates; set to false when no subscribers.
       */
      this.storeTransform = writable(this.transformData, () =>
      {
         this.options.transformSubscribed = true;
         return () => this.options.transformSubscribed = false;
      });
   }
}
