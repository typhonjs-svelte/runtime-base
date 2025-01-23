import type { DynArrayReducer }  from '#runtime/svelte/store/reducer';
import type { MinimalWritable }  from '#runtime/svelte/store/util';

import type { ArrayObjectStore } from './ArrayObjectStore';

/**
 * @typeParam S - Store type.
 */
interface ArrayObjectStoreParams<S extends BaseObjectEntryStore<any>> {
   /**
    * The entry store class that is instantiated.
    */
   StoreClass: new (...args: any[]) => S;

   /**
    * An array of default data objects.
    */
   defaultData?: ExtractDataType<S>[];

   /**
    * An integer between and including 0 - 1000; a debounce time in milliseconds for child store subscriptions to
    * invoke {@link ArrayObjectStore.updateSubscribers} notifying subscribers to this array store. Default value: `250`.
    */
   childDebounce?: number;

   /**
    * When true a {@link DynArrayReducer} will be instantiated wrapping store data and accessible from
    * {@link ArrayObjectStore.dataReducer}; default value: `false`.
    */
   dataReducer?: boolean;

   /**
    * When true {@link ArrayObjectStore.updateSubscribers} must be invoked with a single boolean parameter for
    * subscribers to be updated; default value: `false`.
    */
   manualUpdate?: boolean;
}

interface BaseArrayObject {
   /**
    * Optional UUIDv4 compatible ID string.
    */
   id?: string;
}

/**
 * @typeParam D - Store data type.
 */
interface BaseObjectEntryStore<D> extends MinimalWritable<D> {
   /**
    * @returns UUIDv4 compatible string.
    */
   get id(): string;

   /**
    * Convert or return data in JSON.
    *
    * @returns JSON data.
    */
   toJSON(): D;
}

/**
 * Utility type that extracts and infers generic data type of store.
 *
 * @typeParam S - Store type.
 */
type ExtractDataType<S> = S extends BaseObjectEntryStore<infer D> ? D : never;

// Crud types --------------------------------------------------------------------------------------------------------

/**
 * @typeParam S - Store type.
 */
interface CrudArrayObjectStoreParams<S extends BaseObjectEntryStore<any>> extends ArrayObjectStoreParams<S> {
   crudDispatch?: CrudDispatch<ExtractDataType<S>>;

   extraData?: object;
}

/**
 * A function that accepts an object w/ 'action', 'moduleId', 'key' properties and optional 'id' / UUIDv4 string and
 * 'data' property.
 *
 * @typeParam D - Store data type.
 */
type CrudDispatch<D> = (data: { action: string, id?: string, data?: D, [key: string]: any; }) => boolean;

export {
   ArrayObjectStoreParams,
   BaseArrayObject,
   BaseObjectEntryStore,
   CrudArrayObjectStoreParams,
   CrudDispatch,
   ExtractDataType
}
