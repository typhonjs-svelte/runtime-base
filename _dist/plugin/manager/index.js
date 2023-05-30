/**
 * Provides common utility functions for Eventbus / EventbusProxy.
 */
class EventbusUtils
{
   /**
    * Used in instanceof checks to determine if callbacks are async.
    *
    * @type {Function}
    */
   static AsyncFunction = /* c8 ignore start */async function() {}.constructor;/* c8 ignore stop */

   /**
    * Used in instanceof checks to determine if callbacks are async.
    *
    * @type {Function}
    */
   static AsyncGeneratorFunction = /* c8 ignore start */async function *() {}.constructor;/* c8 ignore stop */

   /**
    * Regular expression used to split event strings.
    *
    * @type {RegExp}
    */
   static eventSplitter = /\s+/;

   /**
    * Iterates over the standard `event, callback` (as well as the fancy multiple space-separated events `"change blur",
    * callback` and event maps `{event: callback}`).
    *
    * @template T
    *
    * @param {Function}       iteratee - Event operation to invoke.
    *
    * @param {T}              events - EventbusEvents object
    *
    * @param {string | import('.').EventMap}  name - A single event name, compound event names, or a hash of event
    *        names.
    *
    * @param {Function}       callback - Event callback function
    *
    * @param {object}         opts - Optional parameters
    *
    * @returns {T} EventbusEvents object or processed data.
    */
   static eventsAPI(iteratee, events, name, callback, opts)
   {
      let i = 0, names;
      if (name && typeof name === 'object')
      {
         // Handle event maps.
         if (callback !== void 0 && 'context' in opts && opts.context === void 0) { opts.context = callback; }
         for (names = EventbusUtils.objectKeys(name); i < names.length; i++)
         {
            events = EventbusUtils.eventsAPI(iteratee, events, names[i], name[names[i]], opts);
         }
      }
      else if (name && typeof name === 'string' && EventbusUtils.eventSplitter.test(name))
      {
         // Handle space-separated event names by delegating them individually.
         for (names = name.split(EventbusUtils.eventSplitter); i < names.length; i++)
         {
            events = iteratee(events, names[i], callback, opts);
         }
      }
      else
      {
         // Finally, standard events.
         events = iteratee(events, name, callback, opts);
      }
      return events;
   }

   /**
    * Returns a string to output for error messages including any eventbus name.
    *
    * @param {import('.').Eventbus|import('.').EventbusProxy|import('.').EventbusSecure} eventbus - The eventbus to
    *        format.
    *
    * @returns {string} A string representing the eventbus.
    */
   static getErrorName(eventbus)
   {
      const name = eventbus.name;
      return name !== '' ? `[${name}] ` : '';
   }

   /**
    * The reducing API that returns the options for an event. Any guarded event sets guard and the higher type is set.
    *
    * @param {object}   output - The output object.
    *
    * @param {string}   name - Event name
    *
    * @param {Function} callback - Event callback
    *
    * @param {object}   opts - Optional parameters
    *
    * @returns {object} The output object.
    */
   static getOptions(output, name, callback, opts)
   {
      const events = opts.events;

      if (events)
      {
         const handlers = events[name];

         if (Array.isArray(handlers))
         {
            for (const handler of handlers)
            {
               if (handler.options.guard)
               {
                  output.guard = true;
               }

               if (handler.options.type > output.type)
               {
                  output.type = handler.options.type;
               }
            }
         }
      }

      return output;
   }

   /**
    * Provides  protected Object.keys functionality.
    *
    * @param {object}   object - Object to retrieve keys.
    *
    * @returns {string[]} Keys of object if any.
    */
   static objectKeys(object)
   {
      return object === null || typeof object !== 'object' ? [] : Object.keys(object);
   }

   /**
    * Reduces the event callbacks into a map of `{event: beforeWrapper}`. `after` unbinds the `beforeWrapper` after
    * it has been called the number of times specified by options.count.
    *
    * @param {import('.').EventbusEvents}   map - EventbusEvents object
    *
    * @param {string}   name - Event name
    *
    * @param {Function} callback - Event callback
    *
    * @param {object}   opts - Function to invoke after event has been triggered once; `off()`
    *
    * @returns {import('.').EventbusEvents} The EventbusEvents object.
    */
   static beforeMap(map, name, callback, opts)
   {
      const after = opts.after;
      const count = opts.count + 1;

      if (callback)
      {
         // @ts-ignore
         const beforeWrapper = map[name] = EventbusUtils.#s_BEFORE(count, function()
         {
            return callback.apply(this, arguments);
         }, () => { after(name, beforeWrapper); });

         // @ts-ignore
         beforeWrapper._callback = callback;
      }
      return map;
   }

   /**
    * Creates a function that invokes `before`, with the `this` binding and arguments of the created function, while
    * it's called less than `count` times. Subsequent calls to the created function return the result of the last `before`
    * invocation.
    *
    * `after` is invoked after the count is reduced.
    *
    * @param {number}   count - The number of calls at which `before` is no longer invoked and then `after` is invoked.
    *
    * @param {Function} before - The function to restrict.
    *
    * @param {Function} after - The function to invoke after count number of calls.
    *
    * @returns {Function} Returns the new restricted function.
    */
   static #s_BEFORE(count, before, after)
   {
      let result;

      return function(...args)
      {
         if (--count > 0) { result = before.apply(this, args); }

         if (count <= 1)
         {
            if (after) { after.apply(this, args); }
            after = void 0;
            before = void 0;
         }

         return result;
      };
   }
}

/**
 * Provides the ability to bind and trigger custom named events. Bound callback functions may be triggered
 * asynchronously or synchronously returning results.
 */
class Eventbus
{
   /**
    * Stores the name of this eventbus.
    *
    * @type {string}
    */
   #name = '';

   /**
    * Stores the events map for associated events and callback / context data.
    *
    * @type {import('.').EventbusEvents}
    */
   #events;

   /**
    * Provides a constructor which optionally takes the eventbus name.
    *
    * @param {string}   name - Optional eventbus name.
    */
   constructor(name = '')
   {
      if (typeof name !== 'string') { throw new TypeError(`'name' is not a string`); }

      this.#name = name;

      /**
       * Stores the Listening instances for this context.
       *
       * @type {{ [key: string]: object }}
       * @private
       */
      this._listeners = void 0;

      /**
       * A unique ID set when listened to.
       *
       * @type {string}
       * @private
       */
      this._listenId = void 0;

      /**
       * Stores the Listening instances for other contexts.
       *
       * @type {{ [key: string]: object }}
       * @private
       */
      this._listeningTo = void 0;
   }

   /**
    * Just like `on`, but causes the bound callback to fire several times up to the count specified before being
    * removed. When multiple events are passed in using the space separated syntax, the event
    * will fire count times for every event you passed in, not once for a combination of all events.
    *
    * @param {number}            count - Number of times the function will fire before being removed.
    *
    * @param {string|import('.').EventMap}   name - Event name(s) or event map.
    *
    * @param {Function|object}   callback - Event callback function or context for event map.
    *
    * @param {object}            [context] - Event context
    *
    * @param {import('.').EventOptions | import('.').EventOptionsOut} [options] - Event registration options.
    *
    * @returns {Eventbus} This Eventbus instance.
    */
   before(count, name, callback, context = void 0, options = {})
   {
      if (!Number.isInteger(count)) { throw new TypeError(`'count' is not an integer`); }

      const data = {};
      if (this.isGuarded(name, data))
      {
         console.warn(`@typhonjs-plugin/eventbus ${EventbusUtils.getErrorName(this)}` +
          `- before() failed as event name(s) are guarded: ${JSON.stringify(data.names)}`);
         return this;
      }

      // Map the event into a `{event: beforeWrapper}` object.
      const events = EventbusUtils.eventsAPI(EventbusUtils.beforeMap, {}, name, callback,
       { count, after: this.off.bind(this) });

      if (typeof name === 'string' && (context === null || context === void 0)) { callback = void 0; }

      return this.on(events, callback, context, options);
   }

   /**
    * Returns an iterable for all stored events yielding an array with event name, callback function, and event context.
    *
    * @param {RegExp} [regex] - Optional regular expression to filter event names.
    *
    * @returns {Generator<[string, Function, object, import('.').EventOptionsOut], void, unknown>} Generator
    * @yields {[string, Function, object, import('.').EventOptionsOut]}
    */
   *entries(regex = void 0)
   {
      if (regex !== void 0 && !(regex instanceof RegExp)) { throw new TypeError(`'regex' is not a RegExp`); }

      if (!this.#events) { return; }

      if (regex)
      {
         for (const name in this.#events)
         {
            if (regex.test(name))
            {
               for (const event of this.#events[name])
               {
                  yield [name, event.callback, event.context, JSON.parse(JSON.stringify(event.options))];
               }
            }
         }
      }
      else
      {
         for (const name in this.#events)
         {
            for (const event of this.#events[name])
            {
               yield [name, event.callback, event.context, JSON.parse(JSON.stringify(event.options))];
            }
         }
      }
   }

   /**
    * Returns the current event count.
    *
    * @returns {number} Returns the current event count.
    */
   get eventCount()
   {
      if (!this.#events) { return 0; }

      return Object.keys(this.#events).length;
   }

   /**
    * Returns the current callback count.
    *
    * @returns {number} The current callback count.
    */
   get callbackCount()
   {
      if (!this.#events) { return 0; }

      let count = 0;

      for (const name in this.#events) { count += this.#events[name].length; }

      return count;
   }

   /**
    * Returns the options of an event name.
    *
    * @param {string}   name - Event name(s) to verify.
    *
    * @returns {import('.').EventOptionsOut} The event options.
    */
   getOptions(name)
   {
      const result = EventbusUtils.eventsAPI(EventbusUtils.getOptions, { guard: false, type: 0 }, name, void 0,
       { events: this.#events });

      let type = void 0;

      switch (result.type)
      {
         case 1:
            type = 'sync';
            break;
         case 2:
            type = 'async';
            break;
      }

      return { guard: result.guard, type };
   }

   /**
    * Returns the trigger type of event name.
    * Note: if trigger type is not set then undefined is returned for type otherwise 'sync' or 'async' is returned.
    *
    * @param {string}   name - Event name(s) to verify.
    *
    * @returns {string|undefined} The trigger type.
    */
   getType(name)
   {
      const result = EventbusUtils.eventsAPI(Eventbus.#s_GET_TYPE, { type: 0 }, name, void 0, { events: this.#events });

      switch (result.type)
      {
         case 1:
            return 'sync';
         case 2:
            return 'async';
         default:
            return void 0;
      }
   }

   /**
    * Returns whether an event name is guarded.
    *
    * @param {string|import('.').EventMap}   name - Event name(s) or event map to verify.
    *
    * @param {object}         [data] - Stores the output of which names are guarded.
    *
    * @returns {boolean} Whether the given event name is guarded.
    */
   isGuarded(name, data = {})
   {
      data.names = [];
      data.guarded = false;

      const result = EventbusUtils.eventsAPI(Eventbus.#s_IS_GUARDED, data, name, void 0, { events: this.#events });

      return result.guarded;
   }

   /**
    * Returns an iterable for the event names / keys of registered event listeners.
    *
    * @param {RegExp} [regex] - Optional regular expression to filter event names.
    *
    * @yields {string}
    */
   *keys(regex = void 0)
   {
      if (regex !== void 0 && !(regex instanceof RegExp)) { throw new TypeError(`'regex' is not a RegExp`); }

      if (!this.#events) { return; }

      if (regex)
      {
         for (const name in this.#events)
         {
            if (regex.test(name))
            {
               yield name;
            }
         }
      }
      else
      {
         for (const name in this.#events)
         {
            yield name;
         }
      }
   }

   /**
    * Returns an iterable for the event names / keys of registered event listeners along with event options.
    *
    * @param {RegExp} [regex] - Optional regular expression to filter event names.
    *
    * @returns {Generator<[string, import('.').EventOptionsOut], void, unknown>} Generator
    * @yields {[string, import('.').EventOptionsOut]}
    */
   *keysWithOptions(regex = void 0)
   {
      if (regex !== void 0 && !(regex instanceof RegExp)) { throw new TypeError(`'regex' is not a RegExp`); }

      if (!this.#events) { return; }

      if (regex)
      {
         for (const name in this.#events)
         {
            if (regex.test(name))
            {
               yield [name, this.getOptions(name)];
            }
         }
      }
      else
      {
         for (const name in this.#events)
         {
            yield [name, this.getOptions(name)];
         }
      }
   }

   /**
    * Returns the current eventbus name.
    *
    * @returns {string} The current eventbus name.
    */
   get name()
   {
      return this.#name;
   }

   /**
    * Tell an object to listen to a particular event on another object. The advantage of using this form, instead of
    * other.on(event, callback, object), is that listenTo allows the object to keep track of the events, and they can
    * be removed all at once later on. The callback will always be called with object as context.
    *
    * @example
    * ```js
    * view.listenTo(model, 'change', view.render);
    * ```
    *
    * @param {object}            obj - Event context
    *
    * @param {string|import('.').EventMap}   name - Event name(s) or event map.
    *
    * @param {Function|object}   callback - Event callback function or context for event map.
    *
    * @returns {Eventbus} This Eventbus instance.
    */
   listenTo(obj, name, callback)
   {
      if (!obj) { return this; }

      const data = {};
      if (Eventbus.#s_TRY_CATCH_IS_GUARDED(obj, name, data))
      {
         console.warn(`@typhonjs-plugin/eventbus ${EventbusUtils.getErrorName(this)}` +
          `- listenTo() failed as event name(s) are guarded for target object: ${JSON.stringify(data.names)}`);
         return this;
      }

      const id = obj._listenId || (obj._listenId = Eventbus.#s_UNIQUE_ID('l'));
      const listeningTo = this._listeningTo || (this._listeningTo = {});
      let listening = Eventbus.#listening = listeningTo[id];

      // This object is not listening to any other events on `obj` yet.
      // Set up the necessary references to track the listening callbacks.
      if (!listening)
      {
         this._listenId || (this._listenId = Eventbus.#s_UNIQUE_ID('l'));
         listening = Eventbus.#listening = listeningTo[id] = new Eventbus.#Listening(this, obj);
      }

      // Bind callbacks on obj.
      const error = Eventbus.#s_TRY_CATCH_ON(obj, name, callback, this);
      Eventbus.#listening = void 0;

      if (error) { throw error; }

      // If the target obj is not an Eventbus, track events manually.
      if (listening.interop) { listening.on(name, callback); }

      return this;
   }

   /**
    * Just like `listenTo`, but causes the bound callback to fire count times before being removed.
    *
    * @param {number}            count - Number of times the function will fire before being removed.
    *
    * @param {object}            obj - Target event context.
    *
    * @param {string|import('.').EventMap}   name - Event name(s) or event map.
    *
    * @param {Function|object}   callback - Event callback function or context for event map.
    *
    * @returns {Eventbus} This Eventbus instance.
    */
   listenToBefore(count, obj, name, callback)
   {
      if (!Number.isInteger(count)) { throw new TypeError(`'count' is not an integer`); }

      // Map the event into a `{event: beforeWrapper}` object.
      const events = EventbusUtils.eventsAPI(EventbusUtils.beforeMap, {}, name, callback, {
         count,
         after: this.stopListening.bind(this, obj)
      });

      return this.listenTo(obj, events);
   }

   /**
    * Just like `listenTo`, but causes the bound callback to fire only once before being removed.
    *
    * @param {object}            obj - Target event context
    *
    * @param {string|import('.').EventMap}     name - Event name(s) or event map.
    *
    * @param {Function|object}   callback - Event callback function or context for event map.
    *
    * @returns {Eventbus} This Eventbus instance.
    */
   listenToOnce(obj, name, callback)
   {
      // Map the event into a `{event: beforeWrapper}` object.
      const events = EventbusUtils.eventsAPI(EventbusUtils.beforeMap, {}, name, callback, {
         count: 1,
         after: this.stopListening.bind(this, obj)
      });

      return this.listenTo(obj, events);
   }

   /**
    * Remove a previously-bound callback function from an object. If no context is specified, all the versions of
    * the callback with different contexts will be removed. If no callback is specified, all callbacks for the event
    * will be removed. If no event is specified, callbacks for all events will be removed.
    *
    * Note that calling model.off(), for example, will indeed remove all events on the model.
    *
    * @example
    * ```js
    * // Removes just the `onChange` callback.
    * object.off('change', onChange);
    *
    * // Removes all 'change' callbacks.
    * object.off('change');
    *
    * // Removes the `onChange` callback for all events.
    * object.off(null, onChange);
    *
    * // Removes all callbacks for `context` for all events.
    * object.off(null, null, context);
    *
    * // Removes all callbacks on `object`.
    * object.off();
    * ```
    *
    * @param {string|import('.').EventMap}   [name] - Event name(s) or event map.
    *
    * @param {Function}       [callback] - Event callback function
    *
    * @param {object}         [context] - Event context
    *
    * @returns {Eventbus} This Eventbus instance.
    */
   off(name, callback = void 0, context = void 0)
   {
      if (!this.#events) { return this; }

      this.#events = EventbusUtils.eventsAPI(Eventbus.#s_OFF_API, this.#events, name, callback,
       { context, listeners: this._listeners });

      return this;
   }

   /**
    * Bind a callback function to an object. The callback will be invoked whenever the event is fired. If you have a
    * large number of different events on a page, the convention is to use colons to namespace them: 'poll:start', or
    * 'change:selection'.
    *
    * To supply a context value for this when the callback is invoked, pass the optional last argument:
    * `model.on('change', this.render, this)` or `model.on({change: this.render}, this)`.
    *
    * @example
    * ```js
    * // The event string may also be a space-delimited list of several events...
    * book.on('change:title change:author', ...);
    * ```
    *
    * @example
    * ```js
    * Callbacks bound to the special 'all' event will be triggered when any event occurs, and are passed the name of
    * the event as the first argument. For example, to proxy all events from one object to another:
    * proxy.on('all', (eventName) => {
    *    object.trigger(eventName);
    * });
    * ```
    *
    * @example
    * ```js
    * All event methods also support an event map syntax, as an alternative to positional arguments:
    * book.on({
    *    'change:author': authorPane.update,
    *    'change:title change:subtitle': titleView.update,
    *    'destroy': bookView.remove
    * });
    * ```
    *
    * @param {string|import('.').EventMap}   name - Event name(s) or event map.
    *
    * @param {Function|object}   callback - Event callback function or context for event map.
    *
    * @param {object}            [context] - Event context
    *
    * @param {import('.').EventOptions | import('.').EventOptionsOut}         [options] - Event registration options.
    *
    * @returns {Eventbus} This Eventbus instance.
    */
   on(name, callback, context = void 0, options = {})
   {
      if (options == null || options.constructor !== Object)   // eslint-disable-line eqeqeq
      {
         throw new TypeError(`'options' must be an object literal.`);
      }

      const data = {};
      if (this.isGuarded(name, data))
      {
         console.warn(`@typhonjs-plugin/eventbus ${EventbusUtils.getErrorName(this)}` +
          `- on() failed as event name(s) are guarded: ${JSON.stringify(data.names)}`);
         return this;
      }

      this.#events = EventbusUtils.eventsAPI(Eventbus.#s_ON_API, this.#events || {}, name, callback, {
         context,
         ctx: this,
         options,
         listening: Eventbus.#listening
      });

      if (Eventbus.#listening)
      {
         const listeners = this._listeners || (this._listeners = {});
         listeners[Eventbus.#listening.id] = Eventbus.#listening;

         // Allow the listening to use a counter, instead of tracking callbacks for library interop.
         Eventbus.#listening.interop = false;
      }

      return this;
   }

   /**
    * Just like `on`, but causes the bound callback to fire only once before being removed. Handy for saying "the next
    * time that X happens, do this". When multiple events are passed in using the space separated syntax, the event
    * will fire once for every event you passed in, not once for a combination of all events
    *
    * @param {string|import('.').EventMap}   name - Event name(s) or event map.
    *
    * @param {Function|object}   callback - Event callback function or context for event map.
    *
    * @param {object}            [context] - Event context.
    *
    * @param {import('.').EventOptions | import('.').EventOptionsOut}         [options] - Event registration options.
    *
    * @returns {Eventbus} This Eventbus instance.
    */
   once(name, callback, context = void 0, options = {})
   {
      const data = {};
      if (this.isGuarded(name, data))
      {
         console.warn(`@typhonjs-plugin/eventbus ${EventbusUtils.getErrorName(this)}` +
          `- once() failed as event name(s) are guarded: ${JSON.stringify(data.names)}`);
         return this;
      }

      // Map the event into a `{event: beforeWrapper}` object.
      const events = EventbusUtils.eventsAPI(EventbusUtils.beforeMap, {}, name, callback,
       { count: 1, after: this.off.bind(this) });

      if (typeof name === 'string' && (context === null || context === void 0)) { callback = void 0; }

      return this.on(events, callback, context, options);
   }

   /**
    * Tell an object to stop listening to events. Either call stopListening with no arguments to have the object remove
    * all of its registered callbacks ... or be more precise by telling it to remove just the events it's listening to
    * on a specific object, or a specific event, or just a specific callback.
    *
    * @example
    * ```js
    * view.stopListening();
    *
    * view.stopListening(model);
    * ```
    *
    * @param {object}   obj - Event context
    *
    * @param {string}   [name] - Event name(s)
    *
    * @param {Function} [callback] - Event callback function
    *
    * @returns {Eventbus} This Eventbus instance.
    */
   stopListening(obj, name = void 0, callback = void 0)
   {
      const listeningTo = this._listeningTo;
      if (!listeningTo) { return this; }

      const ids = obj ? [obj._listenId] : EventbusUtils.objectKeys(listeningTo);

      for (let i = 0; i < ids.length; i++)
      {
         const listening = listeningTo[ids[i]];

         // If listening doesn't exist, this object is not currently listening to obj. Break out early.
         if (!listening) { break; }

         listening.obj.off(name, callback, this);

         if (listening.interop) { listening.off(name, callback); }
      }

      return this;
   }

   /**
    * Trigger callbacks for the given event, or space-delimited list of events. Subsequent arguments to trigger will be
    * passed along to the event callbacks.
    *
    * @param {string}   name - Event name(s)
    *
    * @param {...*}     args - Additional arguments passed to the event function(s).
    *
    * @returns {Eventbus} This Eventbus instance.
    */
   trigger(name, ...args)
   {
      if (!this.#events) { return this; }

      Eventbus.#s_RESULTS_TARGET_API(Eventbus.#s_TRIGGER_API, Eventbus.#s_TRIGGER_EVENTS, this.#events, name, void 0,
       args);

      return this;
   }

   /**
    * Provides `trigger` functionality, but collects any returned Promises from invoked targets and returns a
    * single Promise generated by `Promise.resolve` for a single value or `Promise.all` for multiple results. This is
    * a very useful mechanism to invoke asynchronous operations over an eventbus.
    *
    * @param {string}   name - Event name(s)
    *
    * @param {...*}     args - Additional arguments passed to the event function(s).
    *
    * @returns {Promise<void|*|*[]>} A Promise with any results.
    */
   async triggerAsync(name, ...args)
   {
      if (!this.#events) { return void 0; }

      const result = Eventbus.#s_RESULTS_TARGET_API(Eventbus.#s_TRIGGER_API, Eventbus.#s_TRIGGER_ASYNC_EVENTS,
       this.#events, name, void 0, args);

      // No event callbacks were triggered.
      if (result === void 0) { return void 0; }

      // A single Promise has been returned; just return it.
      if (!Array.isArray(result)) { return result; }

      // Multiple events & callbacks have been triggered so reduce the returned array of Promises and filter all
      // values from each Promise result removing any undefined values.
      return Promise.all(result).then((results) =>
      {
         let allResults = [];

         for (const pResult of results)
         {
            if (Array.isArray(pResult))
            {
               allResults = allResults.concat(pResult);
            }
            else if (pResult !== void 0)
            {
               allResults.push(pResult);
            }
         }

         return allResults.length > 1 ? allResults : allResults.length === 1 ? allResults[0] : void 0;
      });
   }

   /**
    * Defers invoking `trigger`. This is useful for triggering events in the next clock tick.
    *
    * @param {string}   name - Event name(s)
    *
    * @param {...*}     args - Additional arguments passed to the event function(s).
    *
    * @returns {Eventbus} This Eventbus instance.
    */
   triggerDefer(name, ...args)
   {
      setTimeout(() => { this.trigger(name, ...args); }, 0);

      return this;
   }

   /**
    * Provides `trigger` functionality, but collects any returned result or results from invoked targets as a single
    * value or in an array and passes it back to the callee in a synchronous manner.
    *
    * @param {string}   name - Event name(s).
    *
    * @param {...*}     args - Additional arguments passed to the event function(s).
    *
    * @returns {void|*|*[]} The results of the event invocation.
    */
   triggerSync(name, ...args)
   {
      if (!this.#events) { return void 0; }

      return Eventbus.#s_RESULTS_TARGET_API(Eventbus.#s_TRIGGER_API, Eventbus.#s_TRIGGER_SYNC_EVENTS, this.#events,
       name, void 0, args);
   }

   // Internal static reducers and data ------------------------------------------------------------------------------

   /**
    * Generate a unique integer ID (unique within the entire client session).
    *
    * @type {number} - unique ID counter.
    */
   static #idCounter = 0;

   /**
    * Static listening object
    *
    * @type {object}
    */
   static #listening;

   /**
    * A listening class that tracks and cleans up memory bindings when all callbacks have been offed.
    */
   static #Listening = class
   {
      /**
       * @type {import('.').EventbusEvents|{}}
       */
      #events;

      /**
       * @type {string}
       */
      #id;

      /**
       * @type {object}
       */
      #listener;

      /**
       * @type {object}
       */
      #obj;

      /**
       * @type {boolean}
       */
      #interop;

      /**
       * Current listening count.
       *
       * @type {number}
       */
      #count = 0;

      constructor(listener, obj)
      {
         this.#id = listener._listenId;
         this.#listener = listener;
         this.#obj = obj;
         this.#interop = true;
      }

      // Cleans up memory bindings between the listener and the target of the listener.
      cleanup()
      {
         delete this.#listener._listeningTo[this.#obj._listenId];
         if (!this.#interop) { delete this.#obj._listeners[this.#id]; }
      }

      get id() { return this.#id; }

      get interop() { return this.#interop; }

      get obj() { return this.#obj; }

      incrementCount() { this.#count++; }

      /**
       * @see {@link Eventbus#on}
       *
       * @param {string|import('.').EventMap}   name - Event name(s) or event map.
       *
       * @param {Function|object}   callback - Event callback function or context for event map.
       *
       * @param {object}            [context] - Event context
       *
       * @returns {object} This Listening instance.
       */
      on(name, callback, context = void 0)
      {
         this.#events = EventbusUtils.eventsAPI(Eventbus.#s_ON_API, this.#events || {}, name, callback,
         {
            context,
            ctx: this,
            options: {},
            listening: this
         });

         return this;
      }

      /**
       * Offs a callback (or several). Uses an optimized counter if the target of the listener uses Eventbus. Otherwise,
       * falls back to manual tracking to support events library interop.
       *
       * @param {string|import('.').EventMap}   [name] - Event name(s) or event map.
       *
       * @param {Function|object}   [callback] - Event callback function or context for event map.
       */
      off(name, callback)
      {
         let cleanup;

         if (this.#interop)
         {
            this.#events = EventbusUtils.eventsAPI(Eventbus.#s_OFF_API, this.#events, name, callback, {
               context: void 0,
               listeners: void 0
            });
            cleanup = !this.#events;
         }
         else
         {
            this.#count--;
            cleanup = this.#count === 0;
         }

         if (cleanup) { this.cleanup(); }
      }

      /**
       * Sets interop.
       *
       * @param {boolean} value Value to set.
       */
      set interop(value)
      {
         /* c8 ignore next 1 */
         if (typeof value !== 'boolean') { throw new TypeError(`'value' is not a boolean`); }
         this.#interop = value;
      }
   };

   /**
    * The reducing API that returns the trigger type for an event. The higher type is set.
    *
    * @param {object}   output - The output object.
    *
    * @param {string}   name - Event name
    *
    * @param {Function} callback - Event callback
    *
    * @param {object}   opts - Optional parameters
    *
    * @returns {object} The output object.
    */
   static #s_GET_TYPE(output, name, callback, opts)
   {
      const events = opts.events;

      if (events)
      {
         const handlers = events[name];

         if (Array.isArray(handlers))
         {
            for (const handler of handlers)
            {
               if (handler.options.type > output.type)
               {
                  output.type = handler.options.type;
               }
            }
         }
      }

      return output;
   }

   /**
    * The reducing API that tests if an event name is guarded. Any event data of a give event name can have the guarded
    * state set. If so the event name will be added to the output names array and `output.guarded` set to true.
    *
    * @param {object}   output - The output object.
    *
    * @param {string}   name - Event name
    *
    * @param {Function} callback - Event callback
    *
    * @param {object}   opts - Optional parameters
    *
    * @returns {object} The output object.
    */
   static #s_IS_GUARDED(output, name, callback, opts)
   {
      const events = opts.events;

      if (events)
      {
         const handlers = events[name];

         if (Array.isArray(handlers))
         {
            for (const handler of handlers)
            {
               if (handler.options.guard)
               {
                  output.names.push(name);
                  output.guarded = true;
                  return output;
               }
            }
         }
      }

      return output;
   }

   /**
    * The reducing API that removes a callback from the `events` object.
    *
    * @param {import('.').EventbusEvents}   events - EventbusEvents object
    *
    * @param {string}   name - Event name
    *
    * @param {Function} callback - Event callback
    *
    * @param {object}   opts - Optional parameters
    *
    * @returns {void | import('.').EventbusEvents} EventbusEvents object
    */
   static #s_OFF_API(events, name, callback, opts)
   {
      /* c8 ignore next 1 */
      if (!events) { return; }

      const context = opts.context, listeners = opts.listeners;
      let i = 0, names;

      // Delete all event listeners and `drop` events.
      if (!name && !context && !callback)
      {
         for (names = EventbusUtils.objectKeys(listeners); i < names.length; i++)
         {
            listeners[names[i]].cleanup();
         }
         return;
      }

      names = name ? [name] : EventbusUtils.objectKeys(events);

      for (; i < names.length; i++)
      {
         name = names[i];
         const handlers = events[name];

         // Bail out if there are no events stored.
         if (!handlers) { break; }

         // Find any remaining events.
         const remaining = [];
         for (let j = 0; j < handlers.length; j++)
         {
            const handler = handlers[j];
            // @ts-ignore
            if (callback && callback !== handler.callback && callback !== handler.callback._callback ||
             context && context !== handler.context)
            {
               remaining.push(handler);
            }
            else
            {
               const listening = handler.listening;
               if (listening) { listening.off(name, callback); }
            }
         }

         // Replace events if there are any remaining.  Otherwise, clean up.
         if (remaining.length)
         {
            events[name] = remaining;
         }
         else
         {
            delete events[name];
         }
      }

      return events;
   }

   /**
    * The reducing API that adds a callback to the `events` object.
    *
    * @param {import('.').EventbusEvents}   events - EventbusEvents object
    *
    * @param {string}   name - Event name
    *
    * @param {Function} callback - Event callback
    *
    * @param {object}   opts - Optional parameters
    *
    * @returns {import('.').EventbusEvents} EventbusEvents object.
    */
   static #s_ON_API(events, name, callback, opts)
   {
      if (callback)
      {
         const handlers = events[name] || (events[name] = []);
         const context = opts.context, ctx = opts.ctx, listening = opts.listening;

         // Make a copy of options.
         const options = JSON.parse(JSON.stringify(opts.options));

         // Ensure that guard is set.
         options.guard = typeof options.guard === 'boolean' ? options.guard : false;

         // Determine automatically if the callback is `async` via being defined with the `async` modifier.
         if (callback instanceof EventbusUtils.AsyncFunction ||
          callback instanceof EventbusUtils.AsyncGeneratorFunction)
         {
            options.type = 2;
         }
         else
         {
            // Ensure that type is set.
            switch (options.type)
            {
               case 'sync':
                  options.type = 1;
                  break;
               case 'async':
                  options.type = 2;
                  break;
               default:
                  options.type = 0;
                  break;
            }
         }

         if (listening) { listening.incrementCount(); }

         handlers.push({ callback, context, ctx: context || ctx, options, listening });
      }
      return events;
   }

   /**
    * Iterates over the standard `event, callback` (as well as the fancy multiple space-separated events `"change blur",
    * callback` and event maps `{event: callback}`).
    *
    * @param {Function} iteratee - Trigger API
    *
    * @param {Function} iterateeTarget - Internal function which is dispatched to.
    *
    * @param {import('.').EventbusEvents | {}}   events - Array of stored event callback data.
    *
    * @param {string}   name - Event name
    *
    * @param {Function} callback - callback
    *
    * @param {object}   opts - Optional parameters
    *
    * @returns {*} The results of the callback if any.
    */
   static #s_RESULTS_TARGET_API(iteratee, iterateeTarget, events, name, callback, opts)
   {
      let results = void 0;
      let i = 0, names;

      // Handle the case of multiple events being triggered. The potential results of each event & callbacks must be
      // processed into a single array of results.
      if (name && EventbusUtils.eventSplitter.test(name))
      {
         // Handle space-separated event names by delegating them individually.
         for (names = name.split(EventbusUtils.eventSplitter); i < names.length; i++)
         {
            const result = iteratee(iterateeTarget, events, names[i], callback, opts);

            // Determine type of `results`; 0: undefined, 1: single value, 2: an array of values.
            const resultsType = Array.isArray(results) ? 2 : results !== void 0 ? 1 : 0;

            // Handle an array result depending on existing results value.
            if (Array.isArray(result))
            {
               switch (resultsType)
               {
                  case 0:
                     // Simply set results.
                     results = result;
                     break;
                  case 1:
                     // Create a new array from existing results then concat the new result array.
                     results = [results].concat(result);
                     break;
                  case 2:
                     // `results` is already an array so concat the new result array.
                     results = results.concat(result);
                     break;
               }
            }
            else if (result !== void 0)
            {
               switch (resultsType)
               {
                  case 0:
                     // Simply set results.
                     results = result;
                     break;
                  case 1: {
                     // Create a new array from existing results then push the new result value.
                     const newArray = [results];
                     newArray.push(result);
                     results = newArray;
                     break;
                  }
                  case 2:
                     // `results` is already an array so push the new result array.
                     results.push(result);
                     break;
               }
            }
         }
      }
      else
      {
         // Just single event.
         results = iteratee(iterateeTarget, events, name, callback, opts);
      }

      return results;
   }

   /**
    * Handles triggering the appropriate event callbacks.
    *
    * @param {Function} iterateeTarget - Internal function which is dispatched to.
    *
    * @param {import('.').EventbusEvents}   objEvents - Array of stored event callback data.
    *
    * @param {string}   name - Event name
    *
    * @param {Function} callback - callback
    *
    * @param {*[]}      args - Arguments supplied to a trigger method.
    *
    * @returns {*} The results from the triggered event.
    */
   static #s_TRIGGER_API(iterateeTarget, objEvents, name, callback, args)
   {
      let result;

      if (objEvents)
      {
         const events = objEvents[name];
         let allEvents = objEvents.all;
         if (events && allEvents) { allEvents = allEvents.slice(); }
         if (events) { result = iterateeTarget(events, args); }
         if (allEvents) { result = iterateeTarget(allEvents, [name].concat(args)); }
      }

      return result;
   }

   /**
    * A difficult-to-believe, but optimized internal dispatch function for triggering events. Tries to keep the usual
    * cases speedy.
    *
    * @param {import('.').EventData[]} events - Array of stored event callback data.
    *
    * @param {*[]}         args - Event argument array
    */
   static #s_TRIGGER_EVENTS(events, args)
   {
      let ev, i = -1;
      const a1 = args[0], a2 = args[1], a3 = args[2], l = events.length;

      switch (args.length)
      {
         case 0:
            while (++i < l) { (ev = events[i]).callback.call(ev.ctx); }
            return;
         case 1:
            while (++i < l) { (ev = events[i]).callback.call(ev.ctx, a1); }
            return;
         case 2:
            while (++i < l) { (ev = events[i]).callback.call(ev.ctx, a1, a2); }
            return;
         case 3:
            while (++i < l) { (ev = events[i]).callback.call(ev.ctx, a1, a2, a3); }
            return;
         default:
            while (++i < l) { (ev = events[i]).callback.apply(ev.ctx, args); }
            return;
      }
   }

   /**
    * A difficult-to-believe, but optimized internal dispatch function for triggering events. Tries to keep the usual
    * cases speedy. This dispatch method uses ES6 Promises and adds any returned results to an array which is added to
    * a `Promise.all` construction which passes back a Promise which waits until all Promises complete. Any target
    * invoked may return a Promise or any result. This is very useful to use for any asynchronous operations.
    *
    * @param {import('.').EventData[]} events - Array of stored event callback data.
    *
    * @param {*[]}         args - Arguments supplied to `triggerAsync`.
    *
    * @returns {Promise<void|*|*[]>} A Promise of the results from the triggered event.
    */
   static async #s_TRIGGER_ASYNC_EVENTS(events, args)
   {
      let ev, i = -1;
      const a1 = args[0], a2 = args[1], a3 = args[2], l = events.length;

      const results = [];

      switch (args.length)
      {
         case 0:
            while (++i < l)
            {
               const result = (ev = events[i]).callback.call(ev.ctx);

               // If we received a valid result add it to the promises array.
               if (result !== void 0) { results.push(result); }
            }
            break;

         case 1:
            while (++i < l)
            {
               const result = (ev = events[i]).callback.call(ev.ctx, a1);

               // If we received a valid result add it to the promises array.
               if (result !== void 0) { results.push(result); }
            }
            break;

         case 2:
            while (++i < l)
            {
               const result = (ev = events[i]).callback.call(ev.ctx, a1, a2);

               // If we received a valid result add it to the promises array.
               if (result !== void 0) { results.push(result); }
            }
            break;

         case 3:
            while (++i < l)
            {
               const result = (ev = events[i]).callback.call(ev.ctx, a1, a2, a3);

               // If we received a valid result add it to the promises array.
               if (result !== void 0) { results.push(result); }
            }
            break;

         default:
            while (++i < l)
            {
               const result = (ev = events[i]).callback.apply(ev.ctx, args);

               // If we received a valid result add it to the promises array.
               if (result !== void 0) { results.push(result); }
            }
            break;
      }

      // If there are multiple results then use Promise.all otherwise Promise.resolve. Filter out any undefined results.
      return results.length > 1 ? Promise.all(results).then((values) =>
      {
         const filtered = values.filter((entry) => entry !== void 0);
         switch (filtered.length)
         {
            case 0: return void 0;
            case 1: return filtered[0];
            default: return filtered;
         }
      }) : results.length === 1 ? results[0] : void 0;
   }

   /**
    * A difficult-to-believe, but optimized internal dispatch function for triggering events. Tries to keep the usual
    * cases speedy. This dispatch method synchronously passes back a single value or an array with all results returned
    * by any invoked targets.
    *
    * @param {import('.').EventData[]} events - Array of stored event callback data.
    *
    * @param {*[]}         args - Arguments supplied to `triggerSync`.
    *
    * @returns {void|*|*[]} The results from the triggered event.
    */
   static #s_TRIGGER_SYNC_EVENTS(events, args)
   {
      let ev, i = -1;
      const a1 = args[0], a2 = args[1], a3 = args[2], l = events.length;

      const results = [];

      switch (args.length)
      {
         case 0:
            while (++i < l)
            {
               const result = (ev = events[i]).callback.call(ev.ctx);

               // If we received a valid result return immediately.
               if (result !== void 0) { results.push(result); }
            }
            break;
         case 1:
            while (++i < l)
            {
               const result = (ev = events[i]).callback.call(ev.ctx, a1);

               // If we received a valid result return immediately.
               if (result !== void 0) { results.push(result); }
            }
            break;
         case 2:
            while (++i < l)
            {
               const result = (ev = events[i]).callback.call(ev.ctx, a1, a2);

               // If we received a valid result return immediately.
               if (result !== void 0) { results.push(result); }
            }
            break;
         case 3:
            while (++i < l)
            {
               const result = (ev = events[i]).callback.call(ev.ctx, a1, a2, a3);

               // If we received a valid result return immediately.
               if (result !== void 0) { results.push(result); }
            }
            break;
         default:
            while (++i < l)
            {
               const result = (ev = events[i]).callback.apply(ev.ctx, args);

               // If we received a valid result return immediately.
               if (result !== void 0) { results.push(result); }
            }
            break;
      }

      // Return the results array if there are more than one or just a single result.
      return results.length > 1 ? results : results.length === 1 ? results[0] : void 0;
   }

   /**
    * A try-catch guarded function. Used when attempting to invoke `isGuarded` from another eventbus / context via
    * `listenTo`.
    *
    * @param {object}         obj - Event target / context
    *
    * @param {string|import('.').EventMap}   name - Event name(s) or event map.
    *
    * @param {object}         data - Output data.
    *
    * @returns {boolean} Any error if thrown.
    */
   static #s_TRY_CATCH_IS_GUARDED(obj, name, data = {})
   {
      let guarded = false;

      try
      {
         const result = obj.isGuarded(name, data);
         if (typeof result === 'boolean') { guarded = result; }
      }
      catch (err)
      {
         guarded = false;
         data.names = [];
         data.guarded = false;
      }

      return guarded;
   }

   /**
    * A try-catch guarded #on function, to prevent poisoning the static `Eventbus.#listening` variable. Used when
    * attempting to invoke `on` from another eventbus / context via `listenTo`.
    *
    * @param {object}            obj - Event target / context
    *
    * @param {string|import('.').EventMap}   name - Event name(s) or event map.
    *
    * @param {Function|object}   callback - Event callback function or context for event map.
    *
    * @param {object}            [context] - Event context
    *
    * @returns {Error} Any error if thrown.
    */
   static #s_TRY_CATCH_ON(obj, name, callback, context)
   {
      let error;

      try
      {
         obj.on(name, callback, context);
      }
      catch (err)
      {
         error = err;
      }

      return error;
   }

   /**
    * Creates a new unique ID with a given prefix
    *
    * @param {string}   prefix - An optional prefix to add to unique ID.
    *
    * @returns {string} A new unique ID with a given prefix.
    */
   static #s_UNIQUE_ID(prefix = '')
   {
      const id = `${++Eventbus.#idCounter}`;
      return prefix ? `${prefix}${id}` /* c8 ignore next */ : id;
   }
}

/**
 * EventbusProxy provides a protected proxy of another Eventbus instance.
 *
 * The main use case of EventbusProxy is to allow indirect access to an eventbus. This is handy when it comes to
 * managing the event lifecycle for a plugin system. When a plugin is added it could receive a callback, perhaps named
 * `onPluginLoaded`, which contains an EventbusProxy instance rather than the direct eventbus. This EventbusProxy
 * instance is associated in the management system controlling plugin lifecycle. When a plugin is removed / unloaded the
 * management system can automatically unregister all events for the plugin without requiring the plugin author doing it
 * correctly if they had full control. IE This allows to plugin system to guarantee no dangling listeners.
 *
 * EventbusProxy provides the on / off, before, once, and trigger methods with the same signatures as found in
 * Eventbus. However, the proxy tracks all added event bindings which is used to proxy between the target
 * eventbus which is passed in from the constructor. All registration methods (on / off / once) proxy. In addition,
 * there is a `destroy` method which will unregister all of proxied events and remove references to the managed
 * eventbus. Any further usage of a destroyed EventbusProxy instance results in a ReferenceError thrown.
 *
 * Finally, the EventbusProxy only allows events registered through it to be turned off providing a buffer between
 * any consumers such that they can not turn off other registrations made on the eventbus or other proxy instances.
 */
class EventbusProxy
{
   /**
    * Stores the target eventbus.
    *
    * @type {import('.').Eventbus}
    */
   #eventbus;

   /**
    * Stores all proxied event bindings.
    *
    * @type {import('.').EventbusEvents}
    */
   #events;

   /**
    * Creates the event proxy with an existing instance of Eventbus.
    *
    * @param {import('.').Eventbus}   eventbus - The target eventbus instance.
    */
   constructor(eventbus)
   {
      this.#eventbus = eventbus;

      Object.seal(this);
   }

   /**
    * Just like `on`, but causes the bound callback to fire several times up to the count specified before being
    * removed. When multiple events are passed in using the space separated syntax, the event
    * will fire count times for every event you passed in, not once for a combination of all events.
    *
    * @param {number}            count - Number of times the function will fire before being removed.
    *
    * @param {string|import('.').EventMap}   name - Event name(s) or event map.
    *
    * @param {Function|object}   callback - Event callback function or context for event map.
    *
    * @param {object}            [context] - Event context
    *
    * @param {import('.').EventOptions | import('.').EventOptionsOut}   [options] - Event registration options.
    *
    * @returns {EventbusProxy} This EventbusProxy instance.
    */
   before(count, name, callback, context = void 0, options = {})
   {
      if (this.isDestroyed) { throw new ReferenceError('This EventbusProxy instance has been destroyed.'); }
      if (!Number.isInteger(count)) { throw new TypeError(`'count' is not an integer`); }

      const data = {};
      if (this.#eventbus.isGuarded(name, data))
      {
         console.warn(`@typhonjs-plugin/eventbus ${EventbusUtils.getErrorName(this)}` +
          `- before() failed as event name(s) are guarded: ${JSON.stringify(data.names)}`);
         return this;
      }

      // Map the event into a `{event: beforeWrapper}` object.
      const events = EventbusUtils.eventsAPI(EventbusUtils.beforeMap, {}, name, callback,
       { count, after: this.off.bind(this) });

      if (typeof name === 'string' && (context === null || context === void 0)) { callback = void 0; }

      return this.on(events, callback, context, options);
   }

   /**
    * Creates an EventbusProxy wrapping the backing Eventbus instance. An EventbusProxy proxies events allowing all
    * listeners added to be easily removed from the wrapped Eventbus.
    *
    * @returns {EventbusProxy} A new EventbusProxy for this eventbus.
    */
   createProxy()
   {
      return new EventbusProxy(this.#eventbus);
   }

   /**
    * Unregisters all proxied events from the target eventbus and removes any local references. All subsequent calls
    * after `destroy` has been called result in a ReferenceError thrown.
    */
   destroy()
   {
      if (this.#eventbus !== null)
      {
         this.off();
      }

      this.#events = void 0;

      this.#eventbus = null;
   }

   /**
    * Returns an iterable for all events from the proxied eventbus yielding an array with event name, callback function,
    * and event context.
    *
    * @param {RegExp} [regex] - Optional regular expression to filter event names.
    *
    * @returns {Generator<[string, Function, object, import('.').EventOptionsOut], void, unknown>} Generator
    * @yields {[string, Function, object, import('.').EventOptionsOut]}
    */
   *entries(regex = void 0)
   {
      if (this.isDestroyed) { throw new ReferenceError('This EventbusProxy instance has been destroyed.'); }

      for (const entry of this.#eventbus.entries(regex))
      {
         yield entry;
      }
   }

   /**
    * Returns the current proxied eventbus event count.
    *
    * @returns {number} Returns the current proxied event count.
    */
   get eventCount()
   {
      if (this.isDestroyed) { throw new ReferenceError('This EventbusProxy instance has been destroyed.'); }

      return this.#eventbus.eventCount;
   }

   /**
    * Returns the current proxied eventbus callback count.
    *
    * @returns {number} Returns the current proxied callback count.
    */
   get callbackCount()
   {
      if (this.isDestroyed) { throw new ReferenceError('This EventbusProxy instance has been destroyed.'); }

      return this.#eventbus.callbackCount;
   }

   /**
    * Returns an iterable for the event names / keys of proxied eventbus event listeners.
    *
    * @param {RegExp} [regex] - Optional regular expression to filter event names.
    *
    * @yields {string}
    */
   *keys(regex = void 0)
   {
      if (this.isDestroyed) { throw new ReferenceError('This EventbusProxy instance has been destroyed.'); }

      for (const entry of this.#eventbus.keys(regex))
      {
         yield entry;
      }
   }

   /**
    * Returns an iterable for the event names / keys of registered event listeners along with event options.
    *
    * @param {RegExp} [regex] - Optional regular expression to filter event names.
    *
    * @returns {Generator<[string, import('.').EventOptionsOut], void, unknown>} Generator
    * @yields {[string, import('.').EventOptionsOut]}
    */
   *keysWithOptions(regex = void 0)
   {
      if (this.isDestroyed) { throw new ReferenceError('This EventbusProxy instance has been destroyed.'); }

      for (const entry of this.#eventbus.keysWithOptions(regex))
      {
         yield entry;
      }
   }

   /**
    * Returns whether this EventbusProxy has already been destroyed.
    *
    * @returns {boolean} Is destroyed state.
    */
   get isDestroyed()
   {
      return this.#eventbus === null;
   }

   /**
    * Returns the target eventbus name.
    *
    * @returns {string} The target eventbus name.
    */
   get name()
   {
      if (this.isDestroyed) { throw new ReferenceError('This EventbusProxy instance has been destroyed.'); }

      return `proxy-${this.#eventbus.name}`;
   }

   /**
    * Returns the current proxied event count.
    *
    * @returns {number} Returns the current proxied event count.
    */
   get proxyEventCount()
   {
      if (this.isDestroyed) { throw new ReferenceError('This EventbusProxy instance has been destroyed.'); }

      if (!this.#events) { return 0; }

      return Object.keys(this.#events).length;
   }

   /**
    * Returns the current proxied callback count.
    *
    * @returns {number} Returns the current proxied callback count.
    */
   get proxyCallbackCount()
   {
      if (this.isDestroyed) { throw new ReferenceError('This EventbusProxy instance has been destroyed.'); }

      if (!this.#events) { return 0; }

      let count = 0;

      for (const name in this.#events) { count += this.#events[name].length; }

      return count;
   }

   /**
    * Returns the options of an event name.
    *
    * @param {string}   name - Event name(s) to verify.
    *
    * @returns {import('.').EventOptionsOut} The event options.
    */
   getOptions(name)
   {
      if (this.isDestroyed) { throw new ReferenceError('This EventbusProxy instance has been destroyed.'); }

      return this.#eventbus.getOptions(name);
   }

   /**
    * Returns the trigger type of event name.
    * Note: if trigger type is not set then undefined is returned for type otherwise 'sync' or 'async' is returned.
    *
    * @param {string}   name - Event name(s) to verify.
    *
    * @returns {string|undefined} The trigger type.
    */
   getType(name)
   {
      if (this.isDestroyed) { throw new ReferenceError('This EventbusProxy instance has been destroyed.'); }

      return this.#eventbus.getType(name);
   }

   /**
    * Returns whether an event name is guarded.
    *
    * @param {string|import('.').EventMap}  name - Event name(s) or event map to verify.
    *
    * @param {object}         [data] - Stores the output of which names are guarded.
    *
    * @returns {boolean} Whether the given event name is guarded.
    */
   isGuarded(name, data = {})
   {
      if (this.isDestroyed) { throw new ReferenceError('This EventbusProxy instance has been destroyed.'); }

      return this.#eventbus.isGuarded(name, data);
   }

   /**
    * Remove a previously-bound proxied event binding.
    *
    * Please see {@link Eventbus#off}.
    *
    * @param {string|import('.').EventMap}  [name] - Event name(s) or event map.
    *
    * @param {Function}       [callback] - Event callback function
    *
    * @param {object}         [context] - Event context
    *
    * @returns {EventbusProxy} This EventbusProxy
    */
   off(name = void 0, callback = void 0, context = void 0)
   {
      if (this.isDestroyed) { throw new ReferenceError('This EventbusProxy instance has been destroyed.'); }

      this.#events = EventbusUtils.eventsAPI(EventbusProxy.#s_OFF_API, this.#events || {}, name, callback, {
         context,
         eventbus: this.#eventbus,
      });

      return this;
   }

   /**
    * Bind a callback function to an object. The callback will be invoked whenever the event is fired. If you have a
    * large number of different events on a page, the convention is to use colons to namespace them: `poll:start`, or
    * `change:selection`.
    *
    * Please see {@link Eventbus#on}.
    *
    * @param {string|import('.').EventMap}   name - Event name(s) or event map.
    *
    * @param {Function|object}   callback - Event callback function or context for event map.
    *
    * @param {object}            [context] - Event context.
    *
    * @param {import('.').EventOptions | import('.').EventOptionsOut}   [options] - Event registration options.
    *
    * @returns {EventbusProxy} This EventbusProxy
    */
   on(name, callback, context = void 0, options = {})
   {
      if (this.isDestroyed) { throw new ReferenceError('This EventbusProxy instance has been destroyed.'); }

      if (options == null || options.constructor !== Object)   // eslint-disable-line eqeqeq
      {
         throw new TypeError(`'options' must be an object literal.`);
      }

      const data = {};
      if (this.#eventbus.isGuarded(name, data))
      {
         console.warn(`@typhonjs-plugin/eventbus ${EventbusUtils.getErrorName(this)}` +
          `- on() failed as event name(s) are guarded: ${JSON.stringify(data.names)}`);
         return this;
      }

      // Hang onto the options as s_ON_API sets the context we need to pass to the eventbus in `opts.ctx`.
      const opts = { context, ctx: this, options };

      this.#events = EventbusUtils.eventsAPI(EventbusProxy.#s_ON_API, this.#events || {}, name, callback, opts);

      this.#eventbus.on(name, callback, opts.ctx, options);

      return this;
   }

   /**
    * Just like `on`, but causes the bound callback to fire only once before being removed. Handy for saying "the next
    * time that X happens, do this". When multiple events are passed in using the space separated syntax, the event
    * will fire once for every event you passed in, not once for a combination of all events
    *
    * @param {string|import('.').EventMap}   name - Event name(s) or event map.
    *
    * @param {Function|object}   callback - Event callback function or context for event map.
    *
    * @param {object}            context - Event context
    *
    * @param {import('.').EventOptions | import('.').EventOptionsOut}   [options] - Event registration options.
    *
    * @returns {EventbusProxy} This EventbusProxy instance.
    */
   once(name, callback, context = void 0, options = {})
   {
      if (this.isDestroyed) { throw new ReferenceError('This EventbusProxy instance has been destroyed.'); }

      const data = {};
      if (this.#eventbus.isGuarded(name, data))
      {
         console.warn(`@typhonjs-plugin/eventbus ${EventbusUtils.getErrorName(this)}` +
          `- once() failed as event name(s) are guarded: ${JSON.stringify(data.names)}`);
         return this;
      }

      // Map the event into a `{event: beforeWrapper}` object.
      const events = EventbusUtils.eventsAPI(EventbusUtils.beforeMap, {}, name, callback,
       { count: 1, after: this.off.bind(this) });

      if (typeof name === 'string' && (context === null || context === void 0)) { callback = void 0; }

      return this.on(events, callback, context, options);
   }

   /**
    * Returns an iterable for all stored locally proxied events yielding an array with event name, callback
    * function, and event context.
    *
    * @param {RegExp} [regex] - Optional regular expression to filter event names.
    *
    * @returns {Generator<[string, Function, object, import('.').EventOptionsOut], void, unknown>} Generator
    * @yields {[string, Function, object, import('.').EventOptionsOut]}
    */
   *proxyEntries(regex = void 0)
   {
      if (this.isDestroyed) { throw new ReferenceError('This EventbusProxy instance has been destroyed.'); }
      if (regex !== void 0 && !(regex instanceof RegExp)) { throw new TypeError(`'regex' is not a RegExp`); }

      if (!this.#events) { return; }

      if (regex)
      {
         for (const name in this.#events)
         {
            if (regex.test(name))
            {
               for (const event of this.#events[name])
               {
                  yield [name, event.callback, event.context, JSON.parse(JSON.stringify(event.options))];
               }
            }
         }
      }
      else
      {
         for (const name in this.#events)
         {
            for (const event of this.#events[name])
            {
               yield [name, event.callback, event.context, JSON.parse(JSON.stringify(event.options))];
            }
         }
      }
   }

   /**
    * Returns an iterable for the event names / keys of the locally proxied event names.
    *
    * @param {RegExp} [regex] - Optional regular expression to filter event names.
    *
    * @yields {string}
    */
   *proxyKeys(regex = void 0)
   {
      if (this.isDestroyed) { throw new ReferenceError('This EventbusProxy instance has been destroyed.'); }
      if (regex !== void 0 && !(regex instanceof RegExp)) { throw new TypeError(`'regex' is not a RegExp`); }

      if (!this.#events) { return; }

      if (regex)
      {
         for (const name in this.#events)
         {
            if (regex.test(name))
            {
               yield name;
            }
         }
      }
      else
      {
         for (const name in this.#events)
         {
            yield name;
         }
      }
   }

   /**
    * Returns an iterable for the event names / keys of the locally proxied event names with event options.
    *
    * Note: The event options returned will respect all the event options from a registered event on the main
    * eventbus if applicable.
    *
    * @param {RegExp} [regex] - Optional regular expression to filter event names.
    *
    * @returns {Generator<[string, import('.').EventOptionsOut], void, unknown>} Generator
    * @yields {[string, import('.').EventOptionsOut]}
    */
   *proxyKeysWithOptions(regex = void 0)
   {
      if (this.isDestroyed) { throw new ReferenceError('This EventbusProxy instance has been destroyed.'); }
      if (regex !== void 0 && !(regex instanceof RegExp)) { throw new TypeError(`'regex' is not a RegExp`); }

      if (regex)
      {
         for (const name in this.#events)
         {
            if (regex.test(name))
            {
               yield [name, this.#eventbus.getOptions(name)];
            }
         }
      }
      else
      {
         for (const name in this.#events)
         {
            yield [name, this.#eventbus.getOptions(name)];
         }
      }
   }

   /**
    * Trigger callbacks for the given event, or space-delimited list of events. Subsequent arguments to trigger will be
    * passed along to the event callbacks.
    *
    * @param {string}   name - Event name(s)
    *
    * @param {...*}     args - Additional arguments passed to the event function(s).
    *
    * @returns {EventbusProxy} This EventbusProxy.
    */
   trigger(name, ...args)
   {
      if (this.isDestroyed) { throw new ReferenceError('This EventbusProxy instance has been destroyed.'); }

      this.#eventbus.trigger(name, ...args);

      return this;
   }

   /**
    * Provides `trigger` functionality, but collects any returned Promises from invoked targets and returns a
    * single Promise generated by `Promise.resolve` for a single value or `Promise.all` for multiple results. This is
    * a very useful mechanism to invoke asynchronous operations over an eventbus.
    *
    * @param {string}   name - Event name(s)
    *
    * @param {...*}     args - Additional arguments passed to the event function(s).
    *
    * @returns {Promise<void|*|*[]>} A Promise returning any results.
    */
   triggerAsync(name, ...args)
   {
      if (this.isDestroyed) { throw new ReferenceError('This EventbusProxy instance has been destroyed.'); }

      return this.#eventbus.triggerAsync(name, ...args);
   }

   /**
    * Defers invoking `trigger`. This is useful for triggering events in the next clock tick.
    *
    * @param {string}   name - Event name(s)
    *
    * @param {...*}     args - Additional arguments passed to the event function(s).
    *
    * @returns {EventbusProxy} This EventbusProxy.
    */
   triggerDefer(name, ...args)
   {
      if (this.isDestroyed) { throw new ReferenceError('This EventbusProxy instance has been destroyed.'); }

      this.#eventbus.triggerDefer(name, ...args);

      return this;
   }

   /**
    * Provides `trigger` functionality, but collects any returned result or results from invoked targets as a single
    * value or in an array and passes it back to the callee in a synchronous manner.
    *
    * @param {string}   name - Event name(s)
    *
    * @param {...*}     args - Additional arguments passed to the event function(s).
    *
    * @returns {void|*|*[]} An Array of returned results.
    */
   triggerSync(name, ...args)
   {
      if (this.isDestroyed) { throw new ReferenceError('This EventbusProxy instance has been destroyed.'); }

      return this.#eventbus.triggerSync(name, ...args);
   }

   // Internal reducer API -------------------------------------------------------------------------------------------

   /**
    * The reducing API that removes a callback from the `events` object. And delegates invoking off to the eventbus
    * reference.
    *
    * @param {import('.').EventbusEvents}   events - EventbusEvents object
    *
    * @param {string}   name - Event name
    *
    * @param {Function} callback - Event callback
    *
    * @param {object}   opts - Optional parameters
    *
    * @returns {void | import('.').EventbusEvents} EventbusEvents object
    */
   static #s_OFF_API(events, name, callback, opts)
   {
      /* c8 ignore next 1 */
      if (!events) { return; }

      const context = opts.context;
      const eventbus = opts.eventbus;

      const names = name ? [name] : EventbusUtils.objectKeys(events);

      for (let i = 0; i < names.length; i++)
      {
         name = names[i];
         const handlers = events[name];

         // Bail out if there are no events stored.
         if (!handlers) { break; }

         // Find any remaining events.
         const remaining = [];
         for (let j = 0; j < handlers.length; j++)
         {
            const handler = handlers[j];

            // @ts-ignore
            if ((callback && callback !== handler.callback && callback !== handler.callback._callback) ||
             (context && context !== handler.context))
            {
               remaining.push(handler);
               continue;
            }

            // Must explicitly remove the event by the stored full set of name, handler, context to ensure
            // non-proxied event registrations are not removed.
            /* c8 ignore next 1 */ // @ts-ignore
            eventbus.off(name, handler.callback || handler.callback._callback, handler.context || handler.ctx);
         }

         // Replace events if there are any remaining.  Otherwise, clean up.
         if (remaining.length)
         {
            events[name] = remaining;
         }
         else
         {
            // eventbus.off(name, callback, context);
            delete events[name];
         }
      }

      return events;
   }

   /**
    * The reducing API that adds a callback to the `events` object.
    *
    * @param {import('.').EventbusEvents}   events - EventbusEvents object
    *
    * @param {string}   name - Event name
    *
    * @param {Function} callback - Event callback
    *
    * @param {object}   opts - Optional parameters
    *
    * @returns {import('.').EventbusEvents} EventbusEvents object.
    */
   static #s_ON_API(events, name, callback, opts)
   {
      if (callback)
      {
         const handlers = events[name] || (events[name] = []);
         const context = opts.context, ctx = opts.ctx;

         // Make a copy of options.
         const options = JSON.parse(JSON.stringify(opts.options));

         // Ensure that guard is set.
         options.guard = options.guard !== void 0 && typeof options.guard === 'boolean' ? options.guard : false;

         // Determine automatically if the callback is `async` via being defined with the `async` modifier.
         if (callback instanceof EventbusUtils.AsyncFunction ||
          callback instanceof EventbusUtils.AsyncGeneratorFunction)
         {
            options.type = 2;
         }
         else
         {
            // Ensure that type is set.
            switch (options.type)
            {
               case 'sync':
                  options.type = 1;
                  break;
               case 'async':
                  options.type = 2;
                  break;
               default:
                  options.type = 0;
                  break;
            }
         }

         // Set opts `ctx` as this is what we send to the eventbus.
         opts.ctx = context || ctx;

         handlers.push({ callback, context, ctx: opts.ctx, options });
      }

      return events;
   }
}

/**
 * EventbusSecure provides a secure wrapper around another Eventbus instance.
 *
 * The main use case of EventbusSecure is to provide a secure eventbus window for public consumption. Only
 * events can be triggered, but not registered / unregistered.
 *
 * You must use the initialize method passing in an existing Eventbus instance as the eventbus reference is private.
 * In order to secure the eventbus from unwanted access there is no way to access the eventbus reference externally from
 * the EventbusSecure instance. The initialize method returns an {@link EventbusSecureObj} object which
 * contains two functions to control the secure eventbus externally; `destroy` and `setEventbus`. Expose to end
 * consumers just the `eventbusSecure` instance.
 */
class EventbusSecure
{
   /**
    * Stores the target eventbus.
    *
    * @type {import('.').Eventbus | import('.').EventbusProxy}
    */
   #eventbus;

   /**
    * Stores a potentially alternate name instead of returning the wrapped Eventbus instance name.
    *
    * @type {string}
    */
   #name;

   /**
    * Creates the EventbusSecure instance with an existing instance of Eventbus. An object / EventbusSecureObj is
    * returned with an EventbusSecure reference and two functions for controlling the underlying Eventbus reference.
    *
    * `destroy()` will destroy the underlying Eventbus reference.
    * `setEventbus(<eventbus>)` will set the underlying reference.
    *
    * @param {import('.').Eventbus | import('.').EventbusProxy}  eventbus - The target eventbus instance.
    *
    * @param {string}                  [name] - If a name is provided this will be used instead of eventbus name.
    *
    * @returns {import('.').EventbusSecureObj} The control object which contains an EventbusSecure reference and
    *          control functions.
    */
   static initialize(eventbus, name = void 0)
   {
      if (name !== void 0 && typeof name !== 'string') { throw new TypeError(`'name' is not a string.`); }

      const eventbusSecure = new EventbusSecure();
      eventbusSecure.#eventbus = eventbus;
      eventbusSecure.#name = name === void 0 ? eventbus.name : name;
      Object.seal(eventbusSecure);

      return {
         destroy: function()
         {
            if (!eventbusSecure.isDestroyed)
            {
               eventbusSecure.#eventbus = null;

               if (this) { this.eventbusSecure = void 0; }
            }
         },

         /**
          * @param {import('.').Eventbus | import('.').EventbusProxy}   eventbus - Target eventbus.
          *
          * @param {string}   [name] - Eventbus name.
          */
         setEventbus: function(eventbus, name = void 0)
         {
            if (name !== void 0 && typeof name !== 'string') { throw new TypeError(`'name' is not a string.`); }

            if (!eventbusSecure.isDestroyed)
            {
               // Adopt the new eventbus name as the current name set matches the wrapped eventbus.
               if (name === void 0 && eventbusSecure.#name === eventbusSecure.#eventbus.name)
               {
                  eventbusSecure.#name = eventbus.name;
               }
               else if (name !== void 0)
               {
                  eventbusSecure.#name = name;
               }

               eventbusSecure.#eventbus = eventbus;
            }
         },

         eventbusSecure
      };
   }

   /**
    * Returns an iterable for the event names / keys of secured eventbus event listeners.
    *
    * @param {RegExp} [regex] - Optional regular expression to filter event names.
    *
    * @yields {string}
    */
   *keys(regex = void 0)
   {
      if (this.isDestroyed) { throw new ReferenceError('This EventbusSecure instance has been destroyed.'); }

      for (const entry of this.#eventbus.keys(regex))
      {
         yield entry;
      }
   }

   /**
    * Returns an iterable for the event names / keys of registered event listeners along with event options.
    *
    * @param {RegExp} [regex] - Optional regular expression to filter event names.
    *
    * @returns {Generator<[string, import('.').EventOptionsOut], void, unknown>} Generator
    * @yields {[string, import('.').EventOptionsOut]}
    */
   *keysWithOptions(regex = void 0)
   {
      if (this.isDestroyed) { throw new ReferenceError('This EventbusSecure instance has been destroyed.'); }

      for (const entry of this.#eventbus.keysWithOptions(regex))
      {
         yield entry;
      }
   }

   /**
    * Returns whether this instance has already been destroyed.
    *
    * @returns {boolean} Is destroyed state.
    */
   get isDestroyed()
   {
      return this.#eventbus === null;
   }

   /**
    * Returns the name associated with this instance.
    *
    * @returns {string} The target eventbus name.
    */
   get name()
   {
      if (this.isDestroyed) { throw new ReferenceError('This EventbusSecure instance has been destroyed.'); }

      return this.#name;
   }

   /**
    * Returns the options of an event name.
    *
    * @param {string}   name - Event name(s) to verify.
    *
    * @returns {import('.').EventOptionsOut} The event options.
    */
   getOptions(name)
   {
      if (this.isDestroyed) { throw new ReferenceError('This EventbusSecure instance has been destroyed.'); }

      return this.#eventbus.getOptions(name);
   }

   /**
    * Returns the trigger type of event name.
    * Note: if trigger type is not set then undefined is returned for type otherwise 'sync' or 'async' is returned.
    *
    * @param {string}   name - Event name(s) to verify.
    *
    * @returns {string|undefined} The trigger type.
    */
   getType(name)
   {
      if (this.isDestroyed) { throw new ReferenceError('This EventbusSecure instance has been destroyed.'); }

      return this.#eventbus.getType(name);
   }

   /**
    * Trigger callbacks for the given event, or space-delimited list of events. Subsequent arguments to trigger will be
    * passed along to the event callbacks.
    *
    * @param {string}   name - Event name(s)
    *
    * @param {...*}     args - Additional arguments passed to the event function(s).
    *
    * @returns {EventbusSecure} This instance.
    */
   trigger(name, ...args)
   {
      if (this.isDestroyed) { throw new ReferenceError('This EventbusSecure instance has been destroyed.'); }

      this.#eventbus.trigger(name, ...args);

      return this;
   }

   /**
    * Provides `trigger` functionality, but collects any returned Promises from invoked targets and returns a
    * single Promise generated by `Promise.resolve` for a single value or `Promise.all` for multiple results. This is
    * a very useful mechanism to invoke asynchronous operations over an eventbus.
    *
    * @param {string}   name - Event name(s)
    *
    * @param {...*}     args - Additional arguments passed to the event function(s).
    *
    * @returns {Promise<void|*|*[]>} A Promise to returning any results.
    */
   triggerAsync(name, ...args)
   {
      if (this.isDestroyed) { throw new ReferenceError('This EventbusSecure instance has been destroyed.'); }

      return this.#eventbus.triggerAsync(name, ...args);
   }

   /**
    * Defers invoking `trigger`. This is useful for triggering events in the next clock tick.
    *
    * @param {string}   name - Event name(s)
    *
    * @param {...*}     args - Additional arguments passed to the event function(s).
    *
    * @returns {EventbusSecure} This EventbusProxy.
    */
   triggerDefer(name, ...args)
   {
      if (this.isDestroyed) { throw new ReferenceError('This EventbusSecure instance has been destroyed.'); }

      this.#eventbus.triggerDefer(name, ...args);

      return this;
   }

   /**
    * Provides `trigger` functionality, but collects any returned result or results from invoked targets as a single
    * value or in an array and passes it back to the callee in a synchronous manner.
    *
    * @param {string}   name - Event name(s)
    *
    * @param {...*}     args - Additional arguments passed to the event function(s).
    *
    * @returns {void|*|*[]} An Array of returned results.
    */
   triggerSync(name, ...args)
   {
      if (this.isDestroyed) { throw new ReferenceError('This EventbusSecure instance has been destroyed.'); }

      return this.#eventbus.triggerSync(name, ...args);
   }
}

/**
 * Provides a custom error for Node to combine CJS and ESM module not found errors.
 */
class ModuleLoadError extends Error
{
   /**
    * @param {object} options - Options object.
    *
    * @param {string} options.message - Error message.
    *
    * @param {string} options.code - Error code.
    */
   constructor({ message, code })
   {
      super(`[${code}] ${message}`);
      this.name = 'ModuleLoadError';
      this.code = code;
   }
}

/**
 * URL matching RegExp
 *
 * @type {RegExp}
 */
const s_URL_REGEX = /^(https?:\/\/|file:\/\/)/;

class ModuleLoader
{
   /**
    * @template M, E
    *
    * Loads an ES Module in the browser passing back an object containing info about the loading process.
    *
    * @param {object}      options - Options object.
    *
    * @param {string|URL}  options.modulepath - A module name, file path, or URL.
    *
    * @param {(M) => E}    [options.resolveModule] - An optional function which resolves the import to set `instance`.
    *
    * @returns {Promise<ModuleLoaderObj<M, E>>} The module / instance and data about the loading process.
    */
   static async load({ modulepath, resolveModule = void 0 })
   {
      if (!(modulepath instanceof URL) && typeof modulepath !== 'string')
      {
         throw new TypeError(`'modulepath' is not a string or URL`);
      }

      if (resolveModule !== void 0 && typeof resolveModule !== 'function')
      {
         throw new TypeError(`'resolveModule' is not a function`);
      }

      const loadpath = modulepath instanceof URL ? modulepath.toString() : modulepath;

      const type = `import-${modulepath instanceof URL ||
      (typeof modulepath === 'string' && modulepath.match(s_URL_REGEX)) ? 'url' : 'path'}`;

      try
      {
         const module = await import(modulepath);

         const instance = resolveModule !== void 0 ? resolveModule(module) : module;

         return { filepath: loadpath, instance, isESM: true, loadpath, module, modulepath, type };
      }
      catch (error)
      {
         // In case the browser version of ModuleLoader is used on Node... The CJS and ESM loaders of Node have
         // different error codes. Collect both of these as one error with clear stack trace from ModuleLoader.
         /* istanbul ignore next */
         if (error.code === 'MODULE_NOT_FOUND' || error.code === 'ERR_MODULE_NOT_FOUND')
         {
            throw new ModuleLoadError({
               message: `import() failed to load ${loadpath}`,
               code: 'ERR_MODULE_NOT_FOUND'
            });
         }

         throw error;
      }
   }
}

/**
 * Defines a class holding the data associated with a plugin including its instance.
 */
class PluginEntry
{
   /**
    * Data describing the plugin, manager, and optional module data.
    *
    * @type {import('.').PluginData}
    */
   #data;

   /**
    * The plugin enabled state.
    *
    * @type {boolean}
    */
   #enabled;

   /**
    * The plugin name.
    *
    * @type {string}
    */
   #name;

   /**
    * Any stored import.meta data.
    *
    * @type {object}
    */
   #importmeta;

   /**
    * The loaded plugin instance.
    *
    * @type {object}
    */
   #instance;

   /**
    * An EventbusProxy associated with the plugin wrapping the plugin manager eventbus.
    *
    * @type {import('#eventbus').EventbusProxy}
    */
   #eventbusProxy;

   /**
    * Stores the proxied event names, callback functions, context and guarded state when this plugin is disabled.
    *
    * @type {Array<[string, Function, object, import('#eventbus').EventOptionsOut]>}
    */
   #events;

   /**
    * Instantiates a PluginEntry.
    *
    * @param {string}      name - The plugin name.
    *
    * @param {import('.').PluginData}  data - Describes the plugin, manager, and optional module data.
    *
    * @param {object}      instance - The loaded plugin instance.
    *
    * @param {import('#eventbus').EventbusProxy}  eventbusProxy - The EventbusProxy associated with the plugin wrapping
    *        the plugin manager eventbus.
    */
   constructor(name, data, instance, eventbusProxy = void 0)
   {
      this.#data = data;

      this.#enabled = true;

      this.#name = name;

      this.#instance = instance;

      this.#eventbusProxy = eventbusProxy;
   }

   /**
    * Get plugin data.
    *
    * @returns {import('.').PluginData} The associated PluginData.
    */
   get data() { return this.#data; }

   /**
    * Get enabled.
    *
    * @returns {boolean} Current enabled state.
    */
   get enabled() { return this.#enabled; }

   /**
    * Get any stored import.meta object.
    *
    * @returns {undefined|object} Any set import.meta info.
    */
   get importmeta() { return this.#importmeta; }

   /**
    * Reset will cleanup most resources for remove / reload. 'remove' should manually destroy #eventbusProxy.
    */
   reset()
   {
      try
      {
         this.#events = void 0;
         this.#importmeta = void 0;

         // Automatically remove any potential reference to a stored event proxy instance.
         delete this.#instance._eventbus;
      }
      catch (err) { /* noop */ }
   }

   /**
    * Set enabled.
    *
    * @param {boolean} enabled - New enabled state.
    */
   set enabled(enabled)
   {
      this.#enabled = enabled;

      // If enabled and there are stored events then turn them on with the eventbus proxy.
      if (enabled)
      {
         if (this.#eventbusProxy !== void 0 && Array.isArray(this.#events))
         {
            for (const event of this.#events)
            {
               this.#eventbusProxy.on(...event);
            }

            this.#events = void 0;
         }
      }
      else // Store any proxied events and unregister the proxied events.
      {
         if (this.#eventbusProxy !== void 0)
         {
            this.#events = Array.from(this.#eventbusProxy.proxyEntries());
            this.#eventbusProxy.off();
         }
      }
   }

   /**
    * Get associated EventbusProxy.
    *
    * @returns {import('#eventbus').EventbusProxy} Associated EventbusProxy.
    */
   get eventbusProxy() { return this.#eventbusProxy; }

   /**
    * Get plugin instance.
    *
    * @returns {object} The plugin instance.
    */
   get instance() { return this.#instance; }

   /**
    * Get plugin name.
    *
    * @returns {string} Plugin name.
    */
   get name() { return this.#name; }


   /**
    * Set associated EventbusProxy.
    *
    * @param {import('#eventbus').EventbusProxy} eventbusProxy - EventbusProxy instance to associate.
    */
   set eventbusProxy(eventbusProxy) { this.#eventbusProxy = eventbusProxy; }

   /**
    * Set any associated import.meta data.
    *
    * @param {object} importmeta - import.meta data.
    */
   set importmeta(importmeta) { this.#importmeta = importmeta; }

   /**
    * Set plugin instance.
    *
    * @param {object} instance - The plugin instance.
    */
   set instance(instance) { this.#instance = instance; }
}

/**
 * Provides common object manipulation utilities including depth traversal, obtaining accessors, safely setting values /
 * equality tests, and validation.
 */

/**
 * @typedef {object} ValidationEntry - Provides data for a validation check.
 *
 * @property {string}               [type] - Optionally tests with a typeof check.
 *
 * @property {Array<*>|Function|Set<*>}  [expected] - Optional array, function, or set of expected values to test
 * against.
 *
 * @property {string}               [message] - Optional message to include.
 *
 * @property {boolean}              [required=true] - When false if the accessor is missing validation is skipped.
 *
 * @property {boolean}              [error=true] - When true and error is thrown otherwise a boolean is returned.
 */

/**
 * Freezes all entries traversed that are objects including entries in arrays.
 *
 * @param {object|Array}   data - An object or array.
 *
 * @param {string[]}       skipFreezeKeys - An array of strings indicating keys of objects to not freeze.
 *
 * @returns {object|Array} The frozen object.
 */
function deepFreeze(data, skipFreezeKeys = [])
{
   /* istanbul ignore if */
   if (typeof data !== 'object') { throw new TypeError(`'data' is not an 'object'.`); }

   /* istanbul ignore if */
   if (!Array.isArray(skipFreezeKeys)) { throw new TypeError(`'skipFreezeKeys' is not an 'array'.`); }

   return _deepFreeze(data, skipFreezeKeys);
}

/**
 * Tests for whether an object is iterable.
 *
 * @param {*} value - Any value.
 *
 * @returns {boolean} Whether object is iterable.
 */
function isIterable(value)
{
   if (value === null || value === void 0 || typeof value !== 'object') { return false; }

   return typeof value[Symbol.iterator] === 'function';
}

/**
 * Tests for whether object is not null and a typeof object.
 *
 * @param {*} value - Any value.
 *
 * @returns {boolean} Is it an object.
 */
function isObject(value)
{
   return value !== null && typeof value === 'object';
}

// Module private ---------------------------------------------------------------------------------------------------

/**
 * Private implementation of depth traversal.
 *
 * @param {object|Array}   data - An object or array.
 *
 * @param {string[]}       skipFreezeKeys - An array of strings indicating keys of objects to not freeze.
 *
 * @returns {*} The frozen object.
 * @ignore
 * @private
 */
function _deepFreeze(data, skipFreezeKeys)
{
   if (Array.isArray(data))
   {
      for (let cntr = 0; cntr < data.length; cntr++) { _deepFreeze(data[cntr], skipFreezeKeys); }
   }
   else if (typeof data === 'object')
   {
      for (const key in data)
      {
         // eslint-disable-next-line no-prototype-builtins
         if (data.hasOwnProperty(key) && !skipFreezeKeys.includes(key)) { _deepFreeze(data[key], skipFreezeKeys); }
      }
   }

   return Object.freeze(data);
}

/**
 * PluginEvent - Provides the data / event passed to all invoked methods in
 * {@link PluginInvokeSupport#invokeSyncEvent}. The `event.data` field is returned to the caller. Before returning
 * though additional the following additional metadata is attached:
 *
 * (number)    `$$plugin_invoke_count` - The count of plugins invoked.
 *
 * (string[])  `$$plugin_invoke_names` - The names of plugins invoked.
 */
class PluginInvokeEvent
{
   /**
    * Initializes PluginEvent.
    *
    * @param {object} copyProps - Event data to copy.
    *
    * @param {object} passthruProps - Event data to pass through.
    */
   constructor(copyProps = {}, passthruProps = {})
   {
      /**
       * Provides the unified event data assigning any pass through data to the copied data supplied. Invoked functions
       * may add to or modify this data.
       *
       * @type {import('../../').PluginEventData}
       */
      this.data = Object.assign(JSON.parse(JSON.stringify(copyProps)), passthruProps);

      /**
       * Unique data available in each plugin invoked.
       *
       * @type {import('#eventbus').EventbusProxy} - The active EventbusProxy for that particular plugin.
       */
      this.eventbus = null;

      /**
       * Unique data available in each plugin invoked.
       *
       * @type {string} - The active plugin name.
       */
      this.pluginName = '';

      /**
       * Unique data available in each plugin invoked.
       *
       * @type {object} - The active plugin options.
       */
      this.pluginOptions = '';
   }
}

/**
 * Private implementation to invoke asynchronous events. This allows internal calls in PluginManager for
 * `onPluginLoad` and `onPluginUnload` callbacks to bypass optional error checking.
 *
 * This dispatch method asynchronously passes to and returns from any invoked targets a PluginEvent. Any invoked plugin
 * may return a Promise which is awaited upon by `Promise.all` before returning the PluginEvent data via a Promise.
 *
 * @param {object}                     opts - Options object.
 *
 * @param {string}                     opts.method - Method name to invoke.
 *
 * @param {import('../../').PluginManager}              opts.manager - A plugin manager instance.
 *
 * @param {object}                     [opts.copyProps] - Properties that are copied.
 *
 * @param {object}                     [opts.passthruProps] - Properties that are passed through.
 *
 * @param {string|Iterable<string>}    [opts.plugins] - Specific plugin name or iterable list of plugin names to invoke.
 *
 * @param {object}                     [opts.options] - Defines options for throwing exceptions. Turned off by default.
 *
 * @param {boolean}                    [opts.errorCheck=true] - If false optional error checking is disabled.
 *
 * @returns {Promise<import('../../').PluginEventData>} The PluginEvent data.
 */
async function invokeAsyncEvent({ method, manager, copyProps = {}, passthruProps = {}, plugins = void 0,
 options = void 0, errorCheck = true })
{
   if (typeof method !== 'string') { throw new TypeError(`'method' is not a string.`); }
   if (typeof passthruProps !== 'object') { throw new TypeError(`'passthruProps' is not an object.`); }
   if (typeof copyProps !== 'object') { throw new TypeError(`'copyProps' is not an object.`); }

   if (options === void 0) { options = manager.getOptions(); }
   if (plugins === void 0) { plugins = manager.getPluginMapKeys(); }

   if (typeof plugins !== 'string' && !isIterable(plugins))
   {
      throw new TypeError(`'plugins' is not a string or iterable.`);
   }

   // Track how many plugins were invoked.
   let pluginInvokeCount = 0;
   const pluginInvokeNames = [];

   // Track if a plugin method is invoked
   let hasMethod = false;
   let hasPlugin = false;

   // Create plugin event.
   const ev = new PluginInvokeEvent(copyProps, passthruProps);

   const results = [];

   if (typeof plugins === 'string')
   {
      const entry = manager.getPluginEntry(plugins);

      if (entry !== void 0 && entry.enabled && entry.instance)
      {
         hasPlugin = true;

         if (typeof entry.instance[method] === 'function')
         {
            ev.eventbus = entry.eventbusProxy;
            ev.pluginName = entry.name;
            ev.pluginOptions = entry.data.plugin.options;

            const result = entry.instance[method](ev);

            if (typeof result !== 'undefined' && result !== null) { results.push(result); }

            hasMethod = true;
            pluginInvokeCount++;
            pluginInvokeNames.push(entry.name);
         }
      }
   }
   else
   {
      for (const name of plugins)
      {
         const entry = manager.getPluginEntry(name);

         if (entry !== void 0 && entry.enabled && entry.instance)
         {
            hasPlugin = true;

            if (typeof entry.instance[method] === 'function')
            {
               ev.eventbus = entry.eventbusProxy;
               ev.pluginName = entry.name;
               ev.pluginOptions = entry.data.plugin.options;

               const result = entry.instance[method](ev);

               if (typeof result !== 'undefined' && result !== null) { results.push(result); }

               hasMethod = true;
               pluginInvokeCount++;
               pluginInvokeNames.push(entry.name);
            }
         }
      }
   }

   if (errorCheck && options.throwNoPlugin && !hasPlugin)
   {
      throw new Error(`PluginManager failed to find any target plugins.`);
   }

   if (errorCheck && options.throwNoMethod && !hasMethod)
   {
      throw new Error(`PluginManager failed to invoke '${method}'.`);
   }

   // Add meta data for plugin invoke count.
   ev.data.$$plugin_invoke_count = pluginInvokeCount;
   ev.data.$$plugin_invoke_names = pluginInvokeNames;

   await Promise.all(results);

   return ev.data;
}

/**
 * Private implementation to invoke synchronous events. This allows internal calls in PluginManager for
 * `onPluginLoad` and `onPluginUnload` callbacks to bypass optional error checking.
 *
 * This dispatch method synchronously passes to and returns from any invoked targets a PluginEvent.
 *
 * @param {object}                     opts - Options object.
 *
 * @param {string}                     opts.method - Method name to invoke.
 *
 * @param {import('../../').PluginManager}              opts.manager - A plugin manager instance.
 *
 * @param {object}                     [opts.copyProps] - Properties that are copied.
 *
 * @param {object}                     [opts.passthruProps] - Properties that are passed through.
 *
 * @param {string|Iterable<string>}    [opts.plugins] - Specific plugin name or iterable list of plugin names to invoke.
 *
 * @param {object}                     [opts.options] - Defines options for throwing exceptions. Turned off by default.
 *
 * @param {boolean}                    [opts.errorCheck=true] - If false optional error checking is disabled.
 *
 * @returns {import('../../').PluginEventData} The PluginEvent data.
 */
function invokeSyncEvent({ method, manager, copyProps = {}, passthruProps = {}, plugins = void 0,
 options = void 0, errorCheck = true })
{
   if (typeof method !== 'string') { throw new TypeError(`'method' is not a string.`); }
   if (typeof passthruProps !== 'object') { throw new TypeError(`'passthruProps' is not an object.`); }
   if (typeof copyProps !== 'object') { throw new TypeError(`'copyProps' is not an object.`); }

   if (options === void 0) { options = manager.getOptions(); }
   if (plugins === void 0) { plugins = manager.getPluginMapKeys(); }

   if (typeof plugins !== 'string' && !isIterable(plugins))
   {
      throw new TypeError(`'plugins' is not a string or iterable.`);
   }

   // Track how many plugins were invoked.
   let pluginInvokeCount = 0;
   const pluginInvokeNames = [];

   // Track if a plugin method is invoked
   let hasMethod = false;
   let hasPlugin = false;

   // Create plugin event.
   const ev = new PluginInvokeEvent(copyProps, passthruProps);

   if (typeof plugins === 'string')
   {
      const entry = manager.getPluginEntry(plugins);

      if (entry !== void 0 && entry.enabled && entry.instance)
      {
         hasPlugin = true;

         if (typeof entry.instance[method] === 'function')
         {
            ev.eventbus = entry.eventbusProxy;
            ev.pluginName = entry.name;
            ev.pluginOptions = entry.data.plugin.options;

            entry.instance[method](ev);

            hasMethod = true;
            pluginInvokeCount++;
            pluginInvokeNames.push(entry.name);
         }
      }
   }
   else
   {
      for (const name of plugins)
      {
         const entry = manager.getPluginEntry(name);

         if (entry !== void 0 && entry.enabled && entry.instance)
         {
            hasPlugin = true;

            if (typeof entry.instance[method] === 'function')
            {
               ev.eventbus = entry.eventbusProxy;
               ev.pluginName = entry.name;
               ev.pluginOptions = entry.data.plugin.options;

               entry.instance[method](ev);

               hasMethod = true;
               pluginInvokeCount++;
               pluginInvokeNames.push(entry.name);
            }
         }
      }
   }

   if (errorCheck && options.throwNoPlugin && !hasPlugin)
   {
      throw new Error(`PluginManager failed to find any target plugins.`);
   }

   if (errorCheck && options.throwNoMethod && !hasMethod)
   {
      throw new Error(`PluginManager failed to invoke '${method}'.`);
   }

   // Add meta data for plugin invoke count.
   ev.data.$$plugin_invoke_count = pluginInvokeCount;
   ev.data.$$plugin_invoke_names = pluginInvokeNames;

   return ev.data;
}

/**
 * @typedef {import('../../interfaces').PluginSupportImpl} MyInterface
 */

/**
 * PluginInvokeSupport adds direct method invocation support to PluginManager via the eventbus and alternately through
 * a wrapped instance of PluginManager depending on the use case.
 *
 * There are two types of invocation methods the first spreads an array of arguments to the invoked method. The second
 * constructs a {@link PluginInvokeEvent} to pass to the method with a single parameter.
 *
 * TODO: more info and wiki link
 *
 * When added to a PluginManager through constructor initialization the following events are registered on the plugin
 * manager eventbus:
 *
 * `plugins:async:invoke` - {@link PluginInvokeSupport#invokeAsync}
 *
 * `plugins:async:invoke:event` - {@link PluginInvokeSupport#invokeAsyncEvent}
 *
 * `plugins:get:method:names` - {@link PluginInvokeSupport#getMethodNames}
 *
 * `plugins:has:method` - {@link PluginInvokeSupport#hasMethod}
 *
 * `plugins:invoke` - {@link PluginInvokeSupport#invoke}
 *
 * `plugins:sync:invoke` - {@link PluginInvokeSupport#invokeSync}
 *
 * `plugins:sync:invoke:event` - {@link PluginInvokeSupport#invokeSyncEvent}
 *
 * @example
 * ```js
 * // One can also indirectly invoke any method of the plugin.
 * // Any plugin with a method named `aCoolMethod` is invoked.
 * eventbus.triggerSync('plugins:invoke:sync:event', { method: 'aCoolMethod' });
 *
 * // A specific invocation just for the 'an-npm-plugin-enabled-module'
 * eventbus.triggerSync('plugins:invoke:sync:event', {
 *    method: 'aCoolMethod',
 *    plugins: 'an-npm-plugin-enabled-module'
 * });
 *
 * // There are two other properties `copyProps` and `passthruProps` which can be set with object data to _copy_ or
 * // _pass through_ to the invoked method.
 * ```
 *
 * @implements {MyInterface}
 */
class PluginInvokeSupport
{
   /**
    * @type {import('../..').PluginManager}
    */
   #pluginManager = null;

   /**
    * Create PluginInvokeSupport
    *
    * @param {import('../..').PluginManager} pluginManager - The plugin manager to associate.
    */
   constructor(pluginManager)
   {
      this.#pluginManager = pluginManager;
   }

   /**
    * Returns whether the associated plugin manager has been destroyed.
    *
    * @returns {boolean} Returns whether the plugin manager has been destroyed.
    */
   get isDestroyed()
   {
      return this.#pluginManager === null || this.#pluginManager.isDestroyed;
   }

   /**
    * Returns the associated plugin manager options.
    *
    * @returns {import('../../').PluginManagerOptions} The associated plugin manager options.
    */
   get options()
   {
      /* c8 ignore next 1 */
      if (this.isDestroyed) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      return this.#pluginManager.getOptions();
   }

   /**
    * Gets the associated plugin manager.
    *
    * @returns {import('../../').PluginManager} The associated plugin manager
    */
   get pluginManager()
   {
      /* c8 ignore next 1 */
      if (this.isDestroyed) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      return this.#pluginManager;
   }

   /**
    * Destroys all managed plugins after unloading them.
    *
    * @param {object}     opts - An options object.
    *
    * @param {import('#eventbus').Eventbus}   opts.eventbus - The eventbus to disassociate.
    *
    * @param {string}     opts.eventPrepend - The current event prepend.
    */
   async destroy({ eventbus, eventPrepend })
   {
      if (eventbus !== null && eventbus !== void 0)
      {
         eventbus.off(`${eventPrepend}:async:invoke`, this.invokeAsync, this);
         eventbus.off(`${eventPrepend}:async:invoke:event`, this.invokeAsyncEvent, this);
         eventbus.off(`${eventPrepend}:get:method:names`, this.getMethodNames, this);
         eventbus.off(`${eventPrepend}:has:method`, this.hasMethod, this);
         eventbus.off(`${eventPrepend}:invoke`, this.invoke, this);
         eventbus.off(`${eventPrepend}:sync:invoke`, this.invokeSync, this);
         eventbus.off(`${eventPrepend}:sync:invoke:event`, this.invokeSyncEvent, this);
      }

      this.#pluginManager = null;
   }

   /**
    * Returns method names for a specific plugin, list of plugins, or all plugins. The enabled state can be specified
    * along with sorting methods by plugin name.
    *
    * @param {object}                  [opts] - Options object. If undefined all plugin data is returned.
    *
    * @param {boolean}                 [opts.enabled] - If enabled is a boolean it will return plugin methods names
    *                                                   given the respective enabled state.
    *
    * @param {string|Iterable<string>} [opts.plugins] - Plugin name or iterable list of names.
    *
    * @returns {string[]} A list of method names
    */
   getMethodNames({ enabled = void 0, plugins = [] } = {})
   {
      if (this.isDestroyed) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      if (enabled !== void 0 && typeof enabled !== 'boolean')
      {
         throw new TypeError(`'enabled' is not a boolean.`);
      }

      if (typeof plugins !== 'string' && !isIterable(plugins))
      {
         throw new TypeError(`'plugins' is not a string or iterable.`);
      }

      // Create an array from a single plugin name.
      if (typeof plugins === 'string')
      {
         plugins = [plugins];
      }

      const anyEnabledState = enabled === void 0;

      const results = {};

      let count = 0;

      for (const name of plugins)
      {
         const entry = this.pluginManager.getPluginEntry(name);

         if (entry !== void 0 && entry.instance && (anyEnabledState || entry.enabled === enabled))
         {
            for (const name of s_GET_ALL_PROPERTY_NAMES(entry.instance))
            {
               // Skip any names that are not a function or are the constructor.
               if (typeof entry.instance[name] === 'function' && name !== 'constructor') { results[name] = true; }
            }
         }

         count++;
      }

      // Iterable plugins had no entries so return all plugin data.
      if (count === 0)
      {
         for (const entry of this.pluginManager.getPluginMapValues())
         {
            if (entry.instance && (anyEnabledState || entry.enabled === enabled))
            {
               for (const name of s_GET_ALL_PROPERTY_NAMES(entry.instance))
               {
                  // Skip any names that are not a function or are the constructor.
                  if (typeof entry.instance[name] === 'function' && name !== 'constructor') { results[name] = true; }
               }
            }
         }
      }

      return Object.keys(results).sort();
   }

   /**
    * Checks if the provided method name exists across all plugins or specific plugins if defined.
    *
    * @param {object}                  opts - Options object.
    *
    * @param {string}                  opts.method - Method name to test.
    *
    * @param {string|Iterable<string>} [opts.plugins] - Plugin name or iterable list of names to check for method. If
    *                                                   undefined all plugins must contain the method.
    *
    * @returns {boolean} - True method is found.
    */
   hasMethod({ method, plugins = [] })
   {
      if (this.isDestroyed) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      if (typeof method !== 'string')
      {
         throw new TypeError(`'method' is not a string.`);
      }

      if (typeof plugins !== 'string' && !isIterable(plugins))
      {
         throw new TypeError(`'plugins' is not a string or iterable.`);
      }

      // Return a single boolean enabled result for a single plugin if found.
      if (typeof plugins === 'string')
      {
         const entry = this.pluginManager.getPluginEntry(plugins);
         return entry !== void 0 && typeof entry.instance[method] === 'function';
      }

      let count = 0;

      for (const name of plugins)
      {
         const entry = this.pluginManager.getPluginEntry(name);

         if (entry !== void 0 && typeof entry.instance[method] !== 'function') { return false; }

         count++;
      }

      // Iterable plugins had no entries so check all plugin data.
      if (count === 0)
      {
         for (const entry of this.pluginManager.getPluginMapValues())
         {
            if (typeof entry.instance[method] !== 'function') { return false; }
         }
      }

      return true;
   }

   /**
    * This dispatch method simply invokes any plugin targets for the given method name.
    *
    * @param {object}   opts - Options object.
    *
    * @param {string}   opts.method - Method name to invoke.
    *
    * @param {*[]}      [opts.args] - Method arguments. This array will be spread as multiple arguments.
    *
    * @param {string|Iterable<string>} [opts.plugins] - Specific plugin name or iterable list of plugin names to invoke.
    */
   invoke({ method, args = void 0, plugins = void 0 })
   {
      if (this.isDestroyed) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      if (typeof method !== 'string') { throw new TypeError(`'method' is not a string.`); }

      if (args !== void 0 && !Array.isArray(args)) { throw new TypeError(`'args' is not an array.`); }

      if (plugins === void 0) { plugins = this.pluginManager.getPluginMapKeys(); }

      if (typeof plugins !== 'string' && !isIterable(plugins))
      {
         throw new TypeError(`'plugins' is not a string or iterable.`);
      }

      // Track if a plugin method is invoked.
      let hasMethod = false;
      let hasPlugin = false;

      const isArgsArray = Array.isArray(args);

      if (typeof plugins === 'string')
      {
         const entry = this.pluginManager.getPluginEntry(plugins);

         if (entry !== void 0 && entry.enabled && entry.instance)
         {
            hasPlugin = true;

            if (typeof entry.instance[method] === 'function')
            {
               isArgsArray ? entry.instance[method](...args) : entry.instance[method]();

               hasMethod = true;
            }
         }
      }
      else
      {
         for (const name of plugins)
         {
            const entry = this.pluginManager.getPluginEntry(name);

            if (entry !== void 0 && entry.enabled && entry.instance)
            {
               hasPlugin = true;

               if (typeof entry.instance[method] === 'function')
               {
                  isArgsArray ? entry.instance[method](...args) : entry.instance[method]();

                  hasMethod = true;
               }
            }
         }
      }

      if (this.options.throwNoPlugin && !hasPlugin)
      {
         throw new Error(`PluginManager failed to find any target plugins.`);
      }

      if (this.options.throwNoMethod && !hasMethod)
      {
         throw new Error(`PluginManager failed to invoke '${method}'.`);
      }
   }

   /**
    * This dispatch method is asynchronous and adds any returned results to an array which is resolved via Promise.all
    * Any target invoked may return a Promise or any result.
    *
    * @param {object}   opts - Options object.
    *
    * @param {string}   opts.method - Method name to invoke.
    *
    * @param {*[]}      [opts.args] - Method arguments. This array will be spread as multiple arguments.
    *
    * @param {string|Iterable<string>} [opts.plugins] - Specific plugin name or iterable list of plugin names to invoke.
    *
    * @returns {Promise<*|*[]>} A single result or array of results.
    */
   async invokeAsync({ method, args = void 0, plugins = void 0 })
   {
      if (this.isDestroyed) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      if (typeof method !== 'string') { throw new TypeError(`'method' is not a string.`); }

      if (args !== void 0 && !Array.isArray(args)) { throw new TypeError(`'args' is not an array.`); }

      if (plugins === void 0) { plugins = this.pluginManager.getPluginMapKeys(); }

      if (typeof plugins !== 'string' && !isIterable(plugins))
      {
         throw new TypeError(`'plugins' is not a string or iterable.`);
      }

      // Track if a plugin method is invoked.
      let hasMethod = false;
      let hasPlugin = false;

      // Capture results.
      let result = void 0;
      const results = [];

      const isArgsArray = Array.isArray(args);

      if (typeof plugins === 'string')
      {
         const plugin = this.pluginManager.getPluginEntry(plugins);

         if (plugin !== void 0 && plugin.enabled && plugin.instance)
         {
            hasPlugin = true;

            if (typeof plugin.instance[method] === 'function')
            {
               result = isArgsArray ? plugin.instance[method](...args) : plugin.instance[method]();

               // If we received a valid result push it to the results.
               if (result !== void 0) { results.push(result); }

               hasMethod = true;
            }
         }
      }
      else
      {
         for (const name of plugins)
         {
            const plugin = this.pluginManager.getPluginEntry(name);

            if (plugin !== void 0 && plugin.enabled && plugin.instance)
            {
               hasPlugin = true;

               if (typeof plugin.instance[method] === 'function')
               {
                  result = isArgsArray ? plugin.instance[method](...args) : plugin.instance[method]();

                  // If we received a valid result push it to the results.
                  if (result !== void 0) { results.push(result); }

                  hasMethod = true;
               }
            }
         }
      }

      if (this.options.throwNoPlugin && !hasPlugin)
      {
         throw new Error(`PluginManager failed to find any target plugins.`);
      }

      if (this.options.throwNoMethod && !hasMethod)
      {
          throw new Error(`PluginManager failed to invoke '${method}'.`);
      }

      // If there are multiple results then use Promise.all otherwise Promise.resolve.
      return results.length > 1 ? Promise.all(results).then((values) =>
      {
         const filtered = values.filter((entry) => entry !== void 0);
         switch (filtered.length)
         {
            case 0: return void 0;
            case 1: return filtered[0];
            default: return filtered;
         }
      }) : result;
   }

   /**
    * This dispatch method synchronously passes to and returns from any invoked targets a PluginEvent.
    *
    * @param {object}   opts - Options object.
    *
    * @param {string}   opts.method - Method name to invoke.
    *
    * @param {object}   [opts.copyProps] - Properties that are copied.
    *
    * @param {object}   [opts.passthruProps] - Properties that are passed through.
    *
    * @param {string | Iterable<string>} [opts.plugins] - Specific plugin name or iterable list of plugin names to invoke.
    *
    * @returns {Promise<import('../../').PluginEventData>} The PluginEvent data.
    */
   async invokeAsyncEvent({ method, copyProps = {}, passthruProps = {}, plugins = void 0 })
   {
      if (this.isDestroyed) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      // Invokes the private internal async events method.
      return invokeAsyncEvent({ method, manager: this.pluginManager, copyProps, passthruProps, plugins });
   }

   /**
    * This dispatch method synchronously passes back a single value or an array with all results returned by any
    * invoked targets.
    *
    * @param {object}   opts - Options object.
    *
    * @param {string}   opts.method - Method name to invoke.
    *
    * @param {*[]}      [opts.args] - Method arguments. This array will be spread as multiple arguments.
    *
    * @param {string|Iterable<string>} [opts.plugins] - Specific plugin name or iterable list of plugin names to invoke.
    *
    * @returns {*|*[]} A single result or array of results.
    */
   invokeSync({ method, args = void 0, plugins = void 0 })
   {
      if (this.isDestroyed) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      if (typeof method !== 'string') { throw new TypeError(`'method' is not a string.`); }

      if (args !== void 0 && !Array.isArray(args)) { throw new TypeError(`'args' is not an array.`); }

      if (plugins === void 0) { plugins = this.pluginManager.getPluginMapKeys(); }

      if (typeof plugins !== 'string' && !isIterable(plugins))
      {
         throw new TypeError(`'plugins' is not a string or iterable.`);
      }

      // Track if a plugin method is invoked.
      let hasMethod = false;
      let hasPlugin = false;

      // Capture results.
      let result = void 0;
      const results = [];

      const isArgsArray = Array.isArray(args);

      if (typeof plugins === 'string')
      {
         const plugin = this.pluginManager.getPluginEntry(plugins);

         if (plugin !== void 0 && plugin.enabled && plugin.instance)
         {
            hasPlugin = true;

            if (typeof plugin.instance[method] === 'function')
            {
               result = isArgsArray ? plugin.instance[method](...args) : plugin.instance[method]();

               // If we received a valid result push it to the results.
               if (result !== void 0) { results.push(result); }

               hasMethod = true;
            }
         }
      }
      else
      {
         for (const name of plugins)
         {
            const plugin = this.pluginManager.getPluginEntry(name);

            if (plugin !== void 0 && plugin.enabled && plugin.instance)
            {
               hasPlugin = true;

               if (typeof plugin.instance[method] === 'function')
               {
                  result = isArgsArray ? plugin.instance[method](...args) : plugin.instance[method]();

                  // If we received a valid result push it to the results.
                  if (result !== void 0) { results.push(result); }

                  hasMethod = true;
               }
            }
         }
      }

      if (this.options.throwNoPlugin && !hasPlugin)
      {
         throw new Error(`PluginManager failed to find any target plugins.`);
      }

      if (this.options.throwNoMethod && !hasMethod)
      {
         throw new Error(`PluginManager failed to invoke '${method}'.`);
      }

      // Return the results array if there are more than one or just a single result.
      return results.length > 1 ? results : result;
   }

   /**
    * This dispatch method synchronously passes to and returns from any invoked targets a PluginEvent.
    *
    * @param {object}            opts - Options object.
    *
    * @param {string}            opts.method - Method name to invoke.
    *
    * @param {object}            [opts.copyProps] - Properties that are copied.
    *
    * @param {object}            [opts.passthruProps] - Properties that are passed through.
    *
    * @param {string|Iterable<string>} [opts.plugins] - Specific plugin name or iterable list of plugin names to invoke.
    *
    * @returns {import('../../').PluginEventData} The PluginEvent data.
    */
   invokeSyncEvent({ method, copyProps = {}, passthruProps = {}, plugins = void 0 })
   {
      if (this.isDestroyed) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      // Invokes the private internal sync events method.
      return invokeSyncEvent({ method, manager: this.pluginManager, copyProps, passthruProps, plugins });
   }

   /**
    * Sets the eventbus associated with this plugin manager. If any previous eventbus was associated all plugin manager
    * events will be removed then added to the new eventbus. If there are any existing plugins being managed their
    * events will be removed from the old eventbus and then `onPluginLoad` will be called with the new eventbus.
    *
    * @param {object}     opts - An options object.
    *
    * @param {import('#eventbus').Eventbus}   opts.oldEventbus - The old eventbus to disassociate.
    *
    * @param {import('#eventbus').Eventbus}   opts.newEventbus - The new eventbus to associate.
    *
    * @param {string}     opts.oldPrepend - The old event prepend.
    *
    * @param {string}     opts.newPrepend - The new event prepend.
    */
   setEventbus({ oldEventbus, newEventbus, oldPrepend, newPrepend })
   {
      if (this.isDestroyed) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      if (oldEventbus !== null && oldEventbus !== void 0)
      {
         oldEventbus.off(`${oldPrepend}:async:invoke`, this.invokeAsync, this);
         oldEventbus.off(`${oldPrepend}:async:invoke:event`, this.invokeAsyncEvent, this);
         oldEventbus.off(`${oldPrepend}:get:method:names`, this.getMethodNames, this);
         oldEventbus.off(`${oldPrepend}:has:method`, this.hasMethod, this);
         oldEventbus.off(`${oldPrepend}:invoke`, this.invoke, this);
         oldEventbus.off(`${oldPrepend}:sync:invoke`, this.invokeSync, this);
         oldEventbus.off(`${oldPrepend}:sync:invoke:event`, this.invokeSyncEvent, this);
      }

      if (newEventbus !== null && newEventbus !== void 0)
      {
         newEventbus.on(`${newPrepend}:async:invoke`, this.invokeAsync, this, { guard: true });
         newEventbus.on(`${newPrepend}:async:invoke:event`, this.invokeAsyncEvent, this, { guard: true });
         newEventbus.on(`${newPrepend}:get:method:names`, this.getMethodNames, this, { guard: true });
         newEventbus.on(`${newPrepend}:has:method`, this.hasMethod, this, { guard: true });
         newEventbus.on(`${newPrepend}:invoke`, this.invoke, this, { guard: true });
         newEventbus.on(`${newPrepend}:sync:invoke`, this.invokeSync, this, { guard: true });
         newEventbus.on(`${newPrepend}:sync:invoke:event`, this.invokeSyncEvent, this, { guard: true });
      }
   }

   /**
    * Set optional parameters.
    *
    * @param {import('../../').PluginManagerOptions} options Defines optional parameters to set.
    */
   setOptions(options)  // eslint-disable-line no-unused-vars
   {
      if (this.isDestroyed) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }
   }
}

// Module Private ----------------------------------------------------------------------------------------------------

/**
 * Walks an objects inheritance tree collecting property names stopping before `Object` is reached.
 *
 * @param {object}   obj - object to walks.
 *
 * @returns {string[]} A list of property names.
 * @ignore
 */
const s_GET_ALL_PROPERTY_NAMES = (obj) =>
{
   const props = [];

   do
   {
      Object.getOwnPropertyNames(obj).forEach((prop) => { if (props.indexOf(prop) === -1) { props.push(prop); } });
      obj = Object.getPrototypeOf(obj);
   } while (obj !== void 0 && obj !== null && !(obj === Object.prototype));

   return props;
};

const s_REGEX_ESCAPE_RELATIVE = /^([.]{1,2}[\\|/])+/g;
const s_REGEX_ESCAPE_FORWARD = /[\\]/g;
const s_REGEX_STRING_URL = /^(https?|file):/g;

/**
 * Creates an escaped path which is suitable for use in RegExp construction.
 *
 * Note: This function will throw if a malformed URL string is the target. In AbstractPluginManager this function
 * is used after the module has been loaded / is a good target.
 *
 * @param {string|URL}  target - Target full / relative path or URL to escape.
 *
 * @returns {string} The escaped target.
 */
function escapeTarget(target)
{
   if (typeof target !== 'string' && !(target instanceof URL))
   {
      throw new TypeError(`'target' is not a string or URL.`);
   }

   /** @type {string} */
   let targetEscaped = typeof target === 'string' ? target : void 0;

   if (target instanceof URL)
   {
      targetEscaped = target.pathname;
   }
   else if (target.match(s_REGEX_STRING_URL))
   {
      targetEscaped = new URL(target).pathname;
   }

   targetEscaped = targetEscaped.replace(s_REGEX_ESCAPE_RELATIVE, '');
   targetEscaped = targetEscaped.replace(s_REGEX_ESCAPE_FORWARD, '\\\\');

   return targetEscaped;
}

/**
 * Performs validation of a PluginConfig.
 *
 * @param {import('..').PluginConfig}   pluginConfig A PluginConfig to validate.
 *
 * @returns {boolean} True if the given PluginConfig is valid.
 */
function isValidConfig(pluginConfig)
{
   if (typeof pluginConfig !== 'object') { return false; }

   if (typeof pluginConfig.name !== 'string') { return false; }

   if (typeof pluginConfig.target !== 'undefined' && typeof pluginConfig.target !== 'string' &&
    !(pluginConfig.target instanceof URL))
   {
      return false;
   }

   if (typeof pluginConfig.options !== 'undefined' && typeof pluginConfig.options !== 'object') { return false; }

   return true;
}

/**
 * Resolves a dynamically imported module for PluginManager. This function is passed to `@typhonjs-utils/loader-module`.
 *
 * @param {object}   module - The imported module.
 *
 * @returns {*} The export most likely to match a valid plugin.
 */
function resolveModule(module)
{
   // If the module has a named export for `onPluginLoad` then take the module.
   if (typeof module.onPluginLoad === 'function')
   {
      return module;
   }
   // Then potentially resolve any default export / static class.
   else if (module.default)
   {
      return module.default;
   }
   // Finally resolve as just the module.
   else
   {
      return module;
   }
}

/**
 * Provides a lightweight plugin manager for Node / NPM & the browser with eventbus integration for plugins in a safe
 * and protected manner across NPM modules, local files, and preloaded object instances. This pattern facilitates
 * message passing between modules versus direct dependencies / method invocation.
 *
 * A default eventbus will be created, but you may also pass in an eventbus from `@typhonjs-plugin/eventbus` and the
 * plugin manager will register by default under these event categories:
 *
 * `plugins:async:add` - {@link PluginManager#add}
 *
 * `plugins:async:add:all` - {@link PluginManager#addAll}
 *
 * `plugins:async:destroy:manager` - {@link PluginManager#destroy}
 *
 * `plugins:async:remove` - {@link PluginManager#remove}
 *
 * `plugins:async:remove:all` - {@link PluginManager#removeAll}
 *
 * `plugins:get:enabled` - {@link PluginManager#getEnabled}
 *
 * `plugins:get:options` - {@link PluginManager#getOptions}
 *
 * `plugins:get:plugin:by:event` - {@link PluginManager#getPluginByEvent}
 *
 * `plugins:get:plugin:data` - {@link PluginManager#getPluginData}
 *
 * `plugins:get:plugin:events` - {@link PluginManager#getPluginEvents}
 *
 * `plugins:get:plugin:names` - {@link PluginManager#getPluginNames}
 *
 * `plugins:has:plugin` - {@link PluginManager#hasPlugins}
 *
 * `plugins:is:valid:config` - {@link PluginManager#isValidConfig}
 *
 * `plugins:set:enabled` - {@link PluginManager#setEnabled}
 *
 * `plugins:set:options` - {@link PluginManager#setOptions}
 *
 * Automatically when a plugin is loaded and unloaded respective functions `onPluginLoad` and `onPluginUnload` will
 * be attempted to be invoked on the plugin. This is an opportunity for the plugin to receive any associated eventbus
 * and wire itself into it. It should be noted that a protected proxy around the eventbus is passed to the plugins
 * such that when the plugin is removed automatically all events registered on the eventbus are cleaned up without
 * a plugin author needing to do this manually in the `onPluginUnload` callback. This solves any dangling event binding
 * issues.
 *
 * By supporting ES Modules / CommonJS in Node and ES Modules in the browser the plugin manager is by nature
 * asynchronous for the core methods of adding / removing plugins and destroying the manager. The lifecycle methods
 * `onPluginLoad` and `onPluginUnload` will be awaited on such that if a plugin returns a Promise or is an async method
 * then it will complete before execution continues.
 *
 * It is recommended to interact with the plugin manager eventbus through an eventbus proxy. The
 * `createEventbusProxy` method will return a proxy to the default or currently set eventbus.
 *
 * It should be noted that this module re-exports `@typhonjs-plugin/eventbus` which is available as named exports via
 * the `eventbus` subpath export:
 * ```js
 * // Main Eventbus implementations:
 * import { Eventbus, EventbusProxy, EventbusSecure } from '@typhonjs-plugin/manager/eventbus';
 *
 * // Consistent bus instances useful for testing and broad accessibility:
 * import { mainEventbus, pluginEventbus, testEventbus } from '@typhonjs-plugin/manager/eventbus/buses';
 * ```
 *
 * This reexport is for convenience as it provides one single distribution for Node & browser usage.
 *
 * If external eventbus functionality is enabled by passing in an eventbus in the constructor of PluginManager it is
 * important especially if using an existing process / global level eventbus instance from either this module or
 * `@typhonjs-plugin/eventbus` to call {@link PluginManager#destroy} to clean up all plugin eventbus resources and the
 * plugin manager event bindings; this is primarily a testing concern when running repeated tests over a reused
 * eventbus.
 *
 * For more information on Eventbus functionality please see:
 *
 * @see https://www.npmjs.com/package/@typhonjs-plugin/eventbus
 *
 * The PluginManager instance can be extended through runtime composition by passing in _classes_ that implement
 * {@link PluginSupportImpl}. One such implementation is available {@link PluginInvokeSupport} which enables directly
 * invoking methods of all or specific plugins. Please see the documentation for PluginInvokeSupport for more details.
 *
 * Several abbreviated examples follow. Please see the wiki for more details:
 * TODO: add wiki link
 *
 * @example
 * import PluginManager from '@typhonjs-plugin/manager';
 *
 * const pluginManager = new PluginManager();
 *
 * await pluginManager.add({ name: 'an-npm-plugin-enabled-module' });
 * await pluginManager.add({ name: 'my-local-module', target: './myModule.js' });
 *
 * const eventbus = pluginManager.createEventbusProxy();
 *
 * // Let's say an-npm-plugin-enabled-module responds to 'cool:event' which returns 'true'.
 * // Let's say my-local-module responds to 'hot:event' which returns 'false'.
 * // Both of the plugin / modules will have 'onPluginLoaded' invoked with a proxy to the eventbus and any plugin
 * // options defined.
 *
 * // One can then use the eventbus functionality to invoke associated module / plugin methods even retrieving results.
 * assert(eventbus.triggerSync('cool:event') === true);
 * assert(eventbus.triggerSync('hot:event') === false);
 */
class PluginManager
{
   /**
    * Stores the associated eventbus.
    *
    * @type {import('#manager/eventbus').Eventbus}
    */
   #eventbus = null;

   /**
    * Stores any EventbusProxy instances created, so that they may be automatically destroyed.
    *
    * @type {import('#manager/eventbus').EventbusProxy[]}
    */
   #eventbusProxies = [];

   /**
    * Stores any EventbusSecure instances created, so that they may be automatically destroyed.
    *
    * @type {import('#manager/eventbus').EventbusSecureObj[]}
    */
   #eventbusSecure = [];

   /**
    * Defines various options for the plugin manager. By default plugins are enabled, no event invoke, and no
    * event set options are enabled; the latter two preventing invoke dispatch methods functioning on the eventbus
    * along with not being able to set the plugin manager options by the eventbus. These must be explicitly turned
    * off.
    *
    * @type {import('.').PluginManagerOptions}
    */
   #options =
   {
      noEventAdd: false,
      noEventDestroy: true,
      noEventRemoval: false,
      noEventSetEnabled: true,
      noEventSetOptions: true,
      throwNoMethod: false,
      throwNoPlugin: false
   };

   /**
    * Stores the plugins currently being loaded by plugin name. During the add process this is important to track
    * in cases when PluginManager is being used incorrectly in a non-async / await manner.
    *
    * @type {Set<string>}
    */
   #pluginAddSet = new Set();

   /**
    * Stores the plugins by name with an associated PluginEntry.
    *
    * @type {Map<string, import('./PluginEntry.js').PluginEntry>}
    */
   #pluginMap = new Map();

   /**
    * Provides an array of PluginSupportImpl interfaces to extend the plugin manager through the eventbus API.
    *
    * @type {import('./interfaces').PluginSupportImpl[]}
    */
   #pluginSupport = [];

   /**
    * Instantiates PluginManager
    *
    * @param {object}   [options] - Provides various configuration options:
    *
    * @param {import('#manager/eventbus').Eventbus} [options.eventbus] - An instance of '@typhonjs-plugin/eventbus'
    *        used as the plugin eventbus. If not provided a default eventbus is created.
    *
    * @param {string}   [options.eventPrepend='plugin'] - A customized name to prepend PluginManager events on the
    *                                                     eventbus.
    *
    * @param {import('.').PluginManagerOptions}  [options.manager] - The plugin manager options.
    *
    * @param {(
    *    import('./interfaces').PluginSupportConstructor |
    *    Iterable<import('./interfaces').PluginSupportConstructor>
    * )} [options.PluginSupport] - Optional classes to pass in which extends the plugin manager. A default
    * implementation is available: {@link PluginInvokeSupport}
    */
   constructor(options = {})
   {
      if (!isObject(options)) { throw new TypeError(`'options' is not an object.`); }

      if (options.eventbus !== void 0 && !isObject(options.eventbus))
      {
         throw new TypeError(`'options.eventbus' is not an Eventbus.`);
      }

      if (options.eventPrepend !== void 0 && typeof options.eventPrepend !== 'string')
      {
         throw new TypeError(`'options.eventPrepend' is not a string.`);
      }

      if (options.manager !== void 0 && !isObject(options.manager))
      {
         throw new TypeError(`'options.manager' is not an object.`);
      }

      if (options.PluginSupport !== void 0 && typeof options.PluginSupport !== 'function' &&
       !isIterable(options.PluginSupport))
      {
         throw new TypeError(
          `'options.PluginSupport' must be a constructor function or iterable of such matching PluginSupportImpl.`);
      }

      // Instantiate any PluginSupport classes
      if (isIterable(options.PluginSupport) && Symbol.iterator in options.PluginSupport)
      {
         for (const PluginSupport of options.PluginSupport)
         {
            this.#pluginSupport.push(new PluginSupport(this));
         }
      }
      else if (options.PluginSupport !== void 0 && !(Symbol.iterator in options.PluginSupport))
      {
         const PluginSupport = options.PluginSupport;
         this.#pluginSupport.push(new PluginSupport(this));
      }

      this.setOptions(options.manager || {});

      this.setEventbus({
         eventbus: options.eventbus !== void 0 ? options.eventbus : new Eventbus(),
         eventPrepend: options.eventPrepend
      });
   }

   /**
    * Adds a plugin by the given configuration parameters. A plugin `name` is always required. If no other options
    * are provided then the `name` doubles as the NPM module / local file to load. The loading first checks for an
    * existing `instance` to use as the plugin. Then the `target` is chosen as the NPM module / local file to load.
    * By passing in `options` this will be stored and accessible to the plugin during all callbacks.
    *
    * @param {import('.').PluginConfig}   pluginConfig - Defines the plugin to load.
    *
    * @param {object}         [moduleData] - Optional object hash to associate with plugin.
    *
    * @returns {Promise<import('.').PluginData>} The PluginData that represents the plugin added.
    */
   async add(pluginConfig, moduleData)
   {
      if (this.isDestroyed) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      if (typeof pluginConfig !== 'object') { throw new TypeError(`'pluginConfig' is not an object.`); }

      if (typeof pluginConfig.name !== 'string')
      {
         throw new TypeError(
          `'pluginConfig.name' is not a string for entry:\n${JSON.stringify(pluginConfig, null, 3)}`);
      }

      if (pluginConfig.target !== void 0 && typeof pluginConfig.target !== 'string' &&
       !(pluginConfig.target instanceof URL))
      {
         throw new TypeError(
          `'pluginConfig.target' is not a string or URL for entry:\n${JSON.stringify(pluginConfig, null, 3)}`);
      }

      if (pluginConfig.options !== void 0 && typeof pluginConfig.options !== 'object')
      {
         throw new TypeError(
          `'pluginConfig.options' is not an object for entry:\n${JSON.stringify(pluginConfig, null, 3)}`);
      }

      if (moduleData !== void 0 && typeof moduleData !== 'object')
      {
         throw new TypeError(`'moduleData' is not an object for entry:\n${JSON.stringify(pluginConfig, null, 3)}`);
      }

      // If a plugin with the same name already exists post a warning and exit early.
      if (this.#pluginMap.has(pluginConfig.name))
      {
         throw new Error(`A plugin already exists with name: ${pluginConfig.name} for entry:\n${
          JSON.stringify(pluginConfig, null, 3)}`);
      }

      // If a plugin with the same name is also being currently loaded post a warning and exit early. This is the case
      // when add is used without await and multiple plugins w/ the same name are being dynamically imported.
      if (this.#pluginAddSet.has(pluginConfig.name))
      {
         throw new Error(`A plugin is already being loaded with name: ${pluginConfig.name} for entry:\n${
          JSON.stringify(pluginConfig, null, 3)}`);
      }

      this.#pluginAddSet.add(pluginConfig.name);

      let instance, target, type;

      // Use an existing instance of a plugin; a static class is assumed when instance is a function.
      if (typeof pluginConfig.instance === 'object' || typeof pluginConfig.instance === 'function')
      {
         instance = pluginConfig.instance;

         target = pluginConfig.name;

         type = 'instance';
      }
      else
      {
         // If a target is defined use it instead of the name.
         target = pluginConfig.target || pluginConfig.name;

         try
         {
            const result = await ModuleLoader.load({ modulepath: target, resolveModule });

            // Please note that a plugin or other logger must be setup on the associated eventbus.
            if (this.#eventbus !== null)
            {
               this.#eventbus.trigger('log:debug',
                `@typhonjs-plugin/manager - ${result.isESM ? 'import' : 'require'}: ${result.loadpath}`);
            }

            instance = result.instance;
            type = result.type;
         }
         catch (err)
         {
            // Remove tracking of given plugin config name.
            this.#pluginAddSet.delete(pluginConfig.name);

            throw new Error(`@typhonjs-plugin/manager - Could not load target: ${target}\n\nPluginConfig:\n` +
             `${JSON.stringify(pluginConfig, null, 3)}\n\n${err}`);
         }
      }

      // Convert any URL target a string.
      if (target instanceof URL)
      {
         target = target.toString();
      }

      /**
       * Create an object hash with data describing the plugin, manager, and any extra module data.
       *
       * @type {import('.').PluginData}
       */
      const pluginData = JSON.parse(JSON.stringify(
      {
         manager:
         {
            eventPrepend: this._eventPrepend,
            scopedName: `${this._eventPrepend}:${pluginConfig.name}`
         },

         module: moduleData || {},

         plugin:
         {
            name: pluginConfig.name,
            target,
            targetEscaped: escapeTarget(target),
            type,
            options: pluginConfig.options || {}
         }
      }));

      deepFreeze(pluginData, ['manager']);

      const eventbusProxy = this.#eventbus !== null && this.#eventbus !== void 0 ?
       new EventbusProxy(this.#eventbus) /* c8 ignore next */ : void 0;

      const entry = new PluginEntry(pluginConfig.name, pluginData, instance, eventbusProxy);

      this.#pluginMap.set(pluginConfig.name, entry);
      this.#pluginAddSet.delete(pluginConfig.name);

      // Invokes the private internal async events method which allows skipping of error checking.
      const invokeData = await invokeAsyncEvent({
         method: 'onPluginLoad',
         manager: this,
         plugins: pluginConfig.name,
         errorCheck: false
      });

      if (typeof invokeData.importmeta === 'object')
      {
         entry.importmeta = invokeData.importmeta;

         // Until we get a Snowpack HMR spec environment for testing ignore this block.
         /* c8 ignore next 7 */
         if (typeof invokeData.importmeta.hot === 'object' && typeof invokeData.importmeta.hot.accept === 'function')
         {
            invokeData.importmeta.hot.accept(({ module }) =>
            {
               this.reload({ plugin: pluginConfig.name, instance: resolveModule(module) });
            });
         }
      }

      // Invoke `typhonjs:plugin:manager:plugin:added` allowing external code to react to plugin addition.
      if (this.#eventbus)
      {
         await this.#eventbus.triggerAsync(`typhonjs:plugin:manager:plugin:added`, pluginData);
      }

      return pluginData;
   }

   /**
    * Initializes multiple plugins in a single call.
    *
    * @param {Iterable<import('.').PluginConfig>}   pluginConfigs - An iterable list of plugin config object hash entries.
    *
    * @param {object}                   [moduleData] - Optional object hash to associate with all plugins.
    *
    * @returns {Promise<import('.').PluginData[]>} An array of PluginData objects of all added plugins.
    */
   async addAll(pluginConfigs, moduleData)
   {
      if (this.isDestroyed) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      if (!isIterable(pluginConfigs)) { throw new TypeError(`'pluginConfigs' is not iterable.`); }

      const pluginsData = [];

      for (const pluginConfig of pluginConfigs)
      {
         const result = await this.add(pluginConfig, moduleData);

         if (result) { pluginsData.push(result); }
      }

      return pluginsData;
   }

   /**
    * Provides the eventbus callback which may prevent addition if optional `noEventAdd` is enabled. This disables
    * the ability for plugins to be added via events preventing any external code adding plugins in this manner.
    *
    * @param {import('.').PluginConfig}   pluginConfig - Defines the plugin to load.
    *
    * @param {object}         [moduleData] - Optional object hash to associate with all plugins.
    *
    * @returns {Promise<import('.').PluginData>} The PluginData that represents the plugin added.
    * @private
    */
   async _addEventbus(pluginConfig, moduleData)
   {
      /* c8 ignore next */
      if (this.isDestroyed) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      return !this.#options.noEventAdd ? this.add(pluginConfig, moduleData) : void 0;
   }

   /**
    * Provides the eventbus callback which may prevent addition if optional `noEventAdd` is enabled. This disables
    * the ability for plugins to be added via events preventing any external code adding plugins in this manner.
    *
    * @param {Iterable<import('.').PluginConfig>}  pluginConfigs - An iterable list of plugin config object hash entries.
    *
    * @param {object}                  [moduleData] - Optional object hash to associate with all plugins.
    *
    * @returns {Promise<import('.').PluginData[]>} An array of PluginData objects of all added plugins.
    * @private
    */
   async _addAllEventbus(pluginConfigs, moduleData)
   {
      /* c8 ignore next */
      if (this.isDestroyed) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      return !this.#options.noEventAdd ? this.addAll(pluginConfigs, moduleData) : [];
   }

   /**
    * If an eventbus is assigned to this plugin manager then a new EventbusProxy wrapping this eventbus is returned.
    * It is added to `this.#eventbusProxies` so †hat the instances are destroyed when the plugin manager is destroyed.
    *
    * @returns {import('#manager/eventbus').EventbusProxy} A proxy for the currently set Eventbus.
    */
   createEventbusProxy()
   {
      if (this.isDestroyed) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      /* c8 ignore next */
      if (this.#eventbus === null) { throw new ReferenceError('No eventbus assigned to plugin manager.'); }

      const eventbusProxy = new EventbusProxy(this.#eventbus);

      // Store proxy to make sure it is destroyed when the plugin manager is destroyed.
      this.#eventbusProxies.push(eventbusProxy);

      return eventbusProxy;
   }

   /**
    * If an eventbus is assigned to this plugin manager then a new EventbusSecure wrapping this eventbus is returned.
    * It is added to `this.#eventbusSecure` so †hat the instances are destroyed when the plugin manager is destroyed.
    *
    * @param {string}   [name] - Optional name for the EventbusSecure instance.
    *
    * @returns {import('#manager/eventbus').EventbusSecure} A secure wrapper for the currently set Eventbus.
    */
   createEventbusSecure(name = void 0)
   {
      if (this.isDestroyed) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      /* c8 ignore next */
      if (this.#eventbus === null) { throw new ReferenceError('No eventbus assigned to plugin manager.'); }

      const eventbusSecureObj = EventbusSecure.initialize(this.#eventbus, name);

      // Store EventbusSecure object to make sure it is destroyed when the plugin manager is destroyed.
      this.#eventbusSecure.push(eventbusSecureObj);

      return eventbusSecureObj.eventbusSecure;
   }

   /**
    * Destroys all managed plugins after unloading them.
    *
    * @returns {Promise<import('.').DataOutPluginRemoved[]>} A list of plugin names and removal success state.
    */
   async destroy()
   {
      if (this.isDestroyed) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      // Remove all plugins; this will invoke onPluginUnload.
      const results = await this.removeAll();

      // Destroy any EventbusSecure instances created.
      for (const eventbusSecureObj of this.#eventbusSecure)
      {
         eventbusSecureObj.destroy();
      }

      this.#eventbusSecure = [];

      // Destroy any EventbusProxy instances created.
      for (const eventbusProxy of this.#eventbusProxies)
      {
         eventbusProxy.destroy();
      }

      this.#eventbusProxies = [];

      if (this.#eventbus !== null && this.#eventbus !== void 0)
      {
         this.#eventbus.off(`${this._eventPrepend}:async:add`, this._addEventbus, this);
         this.#eventbus.off(`${this._eventPrepend}:async:add:all`, this._addAllEventbus, this);
         this.#eventbus.off(`${this._eventPrepend}:async:destroy:manager`, this._destroyEventbus, this);
         this.#eventbus.off(`${this._eventPrepend}:async:remove`, this._removeEventbus, this);
         this.#eventbus.off(`${this._eventPrepend}:async:remove:all`, this._removeAllEventbus, this);
         this.#eventbus.off(`${this._eventPrepend}:get:enabled`, this.getEnabled, this);
         this.#eventbus.off(`${this._eventPrepend}:get:plugin:by:event`, this.getPluginByEvent, this);
         this.#eventbus.off(`${this._eventPrepend}:get:plugin:data`, this.getPluginData, this);
         this.#eventbus.off(`${this._eventPrepend}:get:plugin:events`, this.getPluginEvents, this);
         this.#eventbus.off(`${this._eventPrepend}:get:plugin:names`, this.getPluginNames, this);
         this.#eventbus.off(`${this._eventPrepend}:get:options`, this.getOptions, this);
         this.#eventbus.off(`${this._eventPrepend}:has:plugin`, this.hasPlugins, this);
         this.#eventbus.off(`${this._eventPrepend}:is:valid:config`, this.isValidConfig, this);
         this.#eventbus.off(`${this._eventPrepend}:set:enabled`, this._setEnabledEventbus, this);
         this.#eventbus.off(`${this._eventPrepend}:set:options`, this._setOptionsEventbus, this);
      }

      for (const pluginSupport of this.#pluginSupport)
      {
         await pluginSupport.destroy({ eventbus: this.#eventbus, eventPrepend: this._eventPrepend });
      }

      this.#pluginSupport = [];
      this.#pluginMap = null;
      this.#eventbus = null;

      return results;
   }

   /**
    * Provides the eventbus callback which may prevent plugin manager destruction if optional `noEventDestroy` is
    * enabled. This disables the ability for the plugin manager to be destroyed via events preventing any external
    * code removing plugins in this manner.
    *
    * @private
    * @returns {Promise<import('.').DataOutPluginRemoved[]>} A list of plugin names and removal success state.
    */
   async _destroyEventbus()
   {
      /* c8 ignore next */
      if (this.isDestroyed) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      return !this.#options.noEventDestroy ? this.destroy() : [];
   }

   /**
    * Returns whether this plugin manager has been destroyed.
    *
    * @returns {boolean} Returns whether this plugin manager has been destroyed.
    */
   get isDestroyed()
   {
      return this.#pluginMap === null || this.#pluginMap === void 0;
   }

   /**
    * Returns the enabled state of a plugin, a list of plugins, or all plugins.
    *
    * @param {object}                  [opts] - Options object. If undefined all plugin enabled state is returned.
    *
    * @param {string|Iterable<string>} [opts.plugins] - Plugin name or iterable list of names to get state.
    *
    * @returns {boolean|import('.').DataOutPluginEnabled[]} Enabled state for single plugin or array of results for multiple
    *                                                plugins.
    */
   getEnabled({ plugins = [] } = {})
   {
      if (this.isDestroyed) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      if (typeof plugins !== 'string' && !isIterable(plugins))
      {
         throw new TypeError(`'plugins' is not a string or iterable.`);
      }

      // Return a single boolean enabled result for a single plugin if found.
      if (typeof plugins === 'string')
      {
         const entry = this.#pluginMap.get(plugins);
         return entry !== void 0 && entry.enabled;
      }

      const results = [];

      let count = 0;

      for (const plugin of plugins)
      {
         const entry = this.#pluginMap.get(plugin);
         const loaded = entry !== void 0;
         results.push({ plugin, enabled: loaded && entry.enabled, loaded });
         count++;
      }

      // Iterable plugins had no entries so return all plugin data.
      if (count === 0)
      {
         for (const [plugin, entry] of this.#pluginMap.entries())
         {
            const loaded = entry !== void 0;
            results.push({ plugin, enabled: loaded && entry.enabled, loaded });
         }
      }

      return results;
   }

   /**
    * Returns any associated eventbus.
    *
    * @returns {import('#manager/eventbus').EventBus} The associated eventbus.
    */
   getEventbus()
   {
      if (this.isDestroyed) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      return this.#eventbus;
   }

   /**
    * Returns a copy of the plugin manager options.
    *
    * @returns {import('.').PluginManagerOptions} A copy of the plugin manager options.
    */
   getOptions()
   {
      if (this.isDestroyed) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      return JSON.parse(JSON.stringify(this.#options));
   }

   /**
    * Returns the event binding names registered on any associated plugin EventbusProxy.
    *
    * @param {object}          opts - Options object.
    *
    * @param {string|RegExp}   opts.event - Event name or RegExp to match event names.
    *
    * @returns {string[] | import('.').DataOutPluginEvents[]} Event binding names registered from the plugin.
    */
   getPluginByEvent({ event })
   {
      if (this.isDestroyed) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      if (typeof event !== 'string' && !(event instanceof RegExp))
      {
         throw new TypeError(`'event' is not a string or RegExp.`);
      }

      const pluginEvents = this.getPluginEvents();

      const results = [];

      if (typeof event === 'string')
      {
         for (const entry of pluginEvents)
         {
            if (entry.events.includes(event)) { results.push(entry.plugin); }
         }
      }
      else
      {
         for (const entry of pluginEvents)
         {
            for (const eventEntry of entry.events)
            {
               if (event.test(eventEntry))
               {
                  results.push(entry.plugin);
                  break;
               }
            }
         }
      }

      return results;
   }

   /**
    * Gets the plugin data for a plugin, list of plugins, or all plugins.
    *
    * @param {object}                  [opts] - Options object. If undefined all plugin data is returned.
    *
    * @param {string|Iterable<string>} [opts.plugins] - Plugin name or iterable list of names to get plugin data.
    *
    * @returns {import('.').PluginData | import('.').PluginData[] | undefined} The plugin data for a plugin or list of plugins.
    */
   getPluginData({ plugins = [] } = {})
   {
      if (this.isDestroyed) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      if (typeof plugins !== 'string' && !isIterable(plugins))
      {
         throw new TypeError(`'plugins' is not a string or iterable.`);
      }

      // Return a PluginData result for a single plugin if found.
      if (typeof plugins === 'string')
      {
         const entry = this.#pluginMap.get(plugins);
         return entry !== void 0 ? JSON.parse(JSON.stringify(entry.data)) : void 0;
      }

      const results = [];

      let count = 0;

      for (const name of plugins)
      {
         const entry = this.#pluginMap.get(name);

         if (entry !== void 0)
         {
            results.push(JSON.parse(JSON.stringify(entry.data)));
         }
         count++;
      }

      // Iterable plugins had no entries so return all plugin data.
      if (count === 0)
      {
         for (const entry of this.#pluginMap.values())
         {
            if (entry !== void 0)
            {
               results.push(JSON.parse(JSON.stringify(entry.data)));
            }
         }
      }

      return results;
   }

   /**
    * Gets a PluginEntry instance for the given plugin name. This method is primarily for {@link PluginSupportImpl}
    * classes.
    *
    * @param {string} plugin - The plugin name to get.
    *
    * @returns {import('./PluginEntry.js').PluginEntry} The PluginEntry for the given plugin name.
    */
   getPluginEntry(plugin)
   {
      if (this.isDestroyed) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      return this.#pluginMap.get(plugin);
   }

   /**
    * Returns the event binding names registered on any associated plugin EventbusProxy.
    *
    * @param {object}                     [opts] - Options object. If undefined all plugin data is returned.
    *
    * @param {string | Iterable<string>}  [opts.plugins] - Plugin name or iterable list of names to get plugin data.
    *
    * @returns {import('.').DataOutPluginEvents[]} Event binding names registered from the plugin.
    */
   getPluginEvents({ plugins = [] } = {})
   {
      if (this.isDestroyed) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      if (typeof plugins !== 'string' && !isIterable(plugins))
      {
         throw new TypeError(`'plugins' is not a string or iterable.`);
      }

      // Return a PluginData result for a single plugin if found.
      if (typeof plugins === 'string')
      {
         const entry = this.#pluginMap.get(plugins);
         return entry !== void 0 && entry.eventbusProxy ? [{
            plugin: plugins,
            events: Array.from(entry.eventbusProxy.proxyKeys()).sort()
         }] /* c8 ignore next */ : [];
      }

      /** @type {import('.').DataOutPluginEvents[]} */
      const results = [];

      let count = 0;

      for (const plugin of plugins)
      {
         const entry = this.#pluginMap.get(plugin);

         if (entry !== void 0)
         {
            results.push({
               plugin,
               events: entry.eventbusProxy ?
                Array.from(entry.eventbusProxy.proxyKeys()).sort() /* c8 ignore next */ : []
            });
         }
         count++;
      }

      // Iterable plugins had no entries so return all plugin data.
      if (count === 0)
      {
         for (const entry of this.#pluginMap.values())
         {
            if (entry !== void 0)
            {
               results.push({
                  plugin: entry.name,
                  events: entry.eventbusProxy ?
                   Array.from(entry.eventbusProxy.proxyKeys()).sort() /* c8 ignore next */ : []
               });
            }
         }
      }

      return results;
   }

   /**
    * Returns an iterable of plugin map keys (plugin names). This method is primarily for {@link PluginSupportImpl}
    * classes.
    *
    * @returns {Iterable<string>} An iterable of plugin map keys.
    */
   getPluginMapKeys()
   {
      if (this.isDestroyed) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      return this.#pluginMap.keys();
   }

   /**
    * Returns an iterable of plugin map keys (plugin names). This method is primarily for {@link PluginSupportImpl}
    * classes.
    *
    * @returns {Iterable<PluginEntry>} An iterable of plugin map keys.
    */
   getPluginMapValues()
   {
      if (this.isDestroyed) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      return this.#pluginMap.values();
   }

   /**
    * Returns all plugin names or if enabled is set then return plugins matching the enabled state.
    *
    * @param {object}  [opts] - Options object. If undefined all plugin names are returned regardless of enabled state.
    *
    * @param {boolean} [opts.enabled] - If enabled is a boolean it will return plugins given their enabled state.
    *
    * @returns {string[]} A list of plugin names optionally by enabled state.
    */
   getPluginNames({ enabled = void 0 } = {})
   {
      if (this.isDestroyed) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      if (enabled !== void 0 && typeof enabled !== 'boolean')
      {
         throw new TypeError(`'enabled' is not a boolean.`);
      }

      const anyEnabledState = enabled === void 0;

      const results = [];

      for (const entry of this.#pluginMap.values())
      {
         if (anyEnabledState || entry.enabled === enabled) { results.push(entry.name); }
      }

      return results.sort();
   }

   /**
    * Returns true if there is a plugin loaded with the given plugin name(s). If no options are provided then
    * the result will be if any plugins are loaded.
    *
    * @param {object}                  [opts] - Options object. If undefined returns whether there are any plugins.
    *
    * @param {string|Iterable<string>} [opts.plugins] - Plugin name or iterable list of names to check existence.
    *
    * @returns {boolean} True if given plugin(s) exist.
    */
   hasPlugins({ plugins = [] } = {})
   {
      if (this.isDestroyed) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      if (typeof plugins !== 'string' && !isIterable(plugins))
      {
         throw new TypeError(`'plugins' is not a string or iterable.`);
      }

      // Return whether a single plugin exists.
      if (typeof plugins === 'string')
      {
         return this.#pluginMap.has(plugins);
      }

      let count = 0;

      // Return whether all plugins specified exist.
      for (const name of plugins)
      {
         if (!this.#pluginMap.has(name)) { return false; }

         count++;
      }

      // Iterable plugins had no entries so simply check size of the map.
      if (count === 0)
      {
         return this.#pluginMap.size !== 0;
      }

      return true;
   }

   /**
    * Performs validation of a PluginConfig.
    *
    * @param {import('.').PluginConfig}   pluginConfig - A PluginConfig to validate.
    *
    * @returns {boolean} True if the given PluginConfig is valid.
    */
   isValidConfig(pluginConfig)
   {
      return isValidConfig(pluginConfig);
   }

   /**
    * Unloads / reloads the plugin invoking `onPluginUnload` / then `onPluginReload`
    *
    * @param {object}   opts - Options object.
    *
    * @param {string}   opts.plugin - Plugin name to reload.
    *
    * @param {object}   [opts.instance] - Optional instance to replace.
    *
    * @param {boolean}  [opts.silent] - Does not trigger any reload notification on the eventbus.
    *
    * @returns {Promise<boolean>} Result of reload attempt.
    */
   async reload({ plugin, instance = void 0, silent = false })
   {
      if (typeof plugin !== 'string') { throw new TypeError(`'plugin' is not a string.`); }
      if (instance !== void 0 && typeof instance !== 'object') { throw new TypeError(`'instance' is not an object.`); }
      if (typeof silent !== 'boolean') { throw new TypeError(`'silent' is not a boolean.`); }

      const entry = this.#pluginMap.get(plugin);

      if (entry === void 0) { return false; }

      // Store any state to load into new plugin instance.
      let state = void 0;

      let error = void 0;

      try
      {
         // Invokes the private internal async events method which allows skipping of error checking.
         const unloadData = await invokeAsyncEvent({
            method: 'onPluginUnload',
            manager: this,
            plugins: plugin,
            errorCheck: false
         });

         state = unloadData.state;
      }
      catch (err)
      {
         error = err;
      }

      // Automatically clean up most resources.
      entry.reset();

      if (entry.eventbusProxy instanceof EventbusProxy) { entry.eventbusProxy.off(); }

      if (typeof instance === 'object')
      {
         entry.instance = instance;
      }

      // Invokes the private internal async events method which allows skipping of error checking.
      const invokeData = await invokeAsyncEvent({
         method: 'onPluginLoad',
         manager: this,
         plugins: plugin,
         passthruProps: { state },
         errorCheck: false
      });

      // Invoke `typhonjs:plugin:manager:plugin:reloaded` allowing external code to react to plugin reload.
      try
      {
         if (this.#eventbus && !silent)
         {
            await this.#eventbus.triggerAsync(`typhonjs:plugin:manager:plugin:reloaded`,
             JSON.parse(JSON.stringify(entry.data)));
         }
      }
      catch (err)
      {
         // Only track this error if no previous error exists from onPluginUnload invocation.
         if (error === void 0) { error = err; }
      }

      if (typeof invokeData.importmeta === 'object')
      {
         entry.importmeta = invokeData.importmeta;

         // Until we get a Snowpack HMR spec environment for testing ignore this block.
         /* c8 ignore next 7 */
         if (typeof invokeData.importmeta.hot === 'object' && typeof invokeData.importmeta.hot.accept === 'function')
         {
            invokeData.importmeta.hot.accept(({ module }) =>
            {
               this.reload({ plugin, instance: resolveModule(module) });
            });
         }
      }

      // Throw any error raised first from any onPluginUnload invocation then the
      // `typhonjs:plugin:manager:plugin:reloaded` event.
      if (error) { throw error; }

      return true;
  }

   /**
    * Removes a plugin by name or all names in an iterable list unloading them and clearing any event bindings
    * automatically.
    *
    * @param {object}                  opts - Options object.
    *
    * @param {string|Iterable<string>} opts.plugins - Plugin name or iterable list of names to remove.
    *
    * @returns {Promise<import('.').DataOutPluginRemoved[]>} A list of plugin names and removal success state.
    */
   async remove({ plugins })
   {
      if (this.isDestroyed) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      if (typeof plugins !== 'string' && !isIterable(plugins))
      {
         throw new TypeError(`'plugins' is not a string or iterable.`);
      }

      const removeEntry = async (entry) =>
      {
         const errors = [];

         const pluginName = entry.name;

         try
         {
            // Invokes the private internal async events method which allows skipping of error checking.
            await invokeAsyncEvent({ method: 'onPluginUnload', manager: this, plugins: pluginName, errorCheck: false });
         }
         catch (err)
         {
            errors.push(err);
         }

         entry.reset();

         if (entry.eventbusProxy instanceof EventbusProxy) { entry.eventbusProxy.destroy(); }

         this.#pluginMap.delete(pluginName);

         // Invoke `typhonjs:plugin:manager:plugin:removed` allowing external code to react to plugin removed.
         try
         {
            if (this.#eventbus)
            {
               await this.#eventbus.triggerAsync(`typhonjs:plugin:manager:plugin:removed`,
                JSON.parse(JSON.stringify(entry.data)));
            }
         }
         catch (err)
         {
            errors.push(err);
         }

         return { plugin: pluginName, success: errors.length === 0, errors };
      };

      const results = [];

      // Return a single boolean enabled result for a single plugin if found.
      if (typeof plugins === 'string')
      {
         const entry = this.#pluginMap.get(plugins);

         if (entry !== void 0)
         {
            results.push(await removeEntry(entry));
         }
      }
      else
      {
         for (const name of plugins)
         {
            const entry = this.#pluginMap.get(name);

            if (entry !== void 0)
            {
               results.push(await removeEntry(entry));
            }
         }
      }

      return results;
   }

   /**
    * Removes all plugins after unloading them and clearing any event bindings automatically.
    *
    * @returns {Promise.<import('.').DataOutPluginRemoved[]>} A list of plugin names and removal success state.
    */
   async removeAll()
   {
      if (this.isDestroyed) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      return this.remove({ plugins: Array.from(this.#pluginMap.keys()) });
   }

   /**
    * Provides the eventbus callback which may prevent removal if optional `noEventRemoval` is enabled. This disables
    * the ability for plugins to be removed via events preventing any external code removing plugins in this manner.
    *
    * @param {object}                  opts - Options object
    *
    * @param {string|Iterable<string>} opts.plugins - Plugin name or iterable list of names to remove.
    *
    * @returns {Promise<import('.').DataOutPluginRemoved[]>} A list of plugin names and removal success state.
    * @private
    */
   async _removeEventbus(opts)
   {
      /* c8 ignore next */
      if (this.isDestroyed) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      return !this.#options.noEventRemoval ? this.remove(opts) : [];
   }

   /**
    * Provides the eventbus callback which may prevent removal if optional `noEventRemoval` is enabled. This disables
    * the ability for plugins to be removed via events preventing any external code removing plugins in this manner.
    *
    * @returns {Promise.<import('.').DataOutPluginRemoved[]>} A list of plugin names and removal success state.
    * @private
    */
   async _removeAllEventbus()
   {
      /* c8 ignore next */
      if (this.isDestroyed) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      return !this.#options.noEventRemoval ? this.removeAll() : [];
   }

   /**
    * Sets the enabled state of a plugin, a list of plugins, or all plugins.
    *
    * @param {object}            opts - Options object.
    *
    * @param {boolean}           opts.enabled - The enabled state.
    *
    * @param {string|Iterable<string>} [opts.plugins] - Plugin name or iterable list of names to set state.
    */
   setEnabled({ enabled, plugins = [] })
   {
      if (this.isDestroyed) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      if (typeof plugins !== 'string' && !isIterable(plugins))
      {
         throw new TypeError(`'plugins' is not a string or iterable.`);
      }

      if (typeof enabled !== 'boolean') { throw new TypeError(`'enabled' is not a boolean.`); }

      const setEntryEnabled = (entry) =>
      {
         if (entry !== void 0)
         {
            entry.enabled = enabled;

            // Invoke `typhonjs:plugin:manager:plugin:enabled` allowing external code to react to plugin enabled state.
            if (this.#eventbus)
            {
               this.#eventbus.trigger(`typhonjs:plugin:manager:plugin:enabled`, Object.assign({
                  enabled
               }, JSON.parse(JSON.stringify(entry.data))));
            }
         }
      };

      // Set enabled state for a single plugin if found.
      if (typeof plugins === 'string')
      {
         setEntryEnabled(this.#pluginMap.get(plugins));
      }

      let count = 0;

      // First attempt to iterate through plugins.
      for (const name of plugins)
      {
         setEntryEnabled(this.#pluginMap.get(name));
         count++;
      }

      // If plugins is empty then set all plugins enabled state.
      if (count === 0)
      {
         for (const entry of this.#pluginMap.values())
         {
            setEntryEnabled(entry);
         }
      }
   }

   /**
    * Provides the eventbus callback which may prevent setEnabled if optional `noEventSetEnabled` is true. This
    * disables the ability for setting plugin enabled state via events preventing any external code from setting state.
    *
    * @param {object}   opts - Options object.
    *
    * @private
    */
   _setEnabledEventbus(opts)
   {
      /* c8 ignore next */
      if (this.isDestroyed) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      if (!this.#options.noEventSetEnabled) { this.setEnabled(opts); }
   }

   /**
    * Sets the eventbus associated with this plugin manager. If any previous eventbus was associated all plugin manager
    * events will be removed then added to the new eventbus. If there are any existing plugins being managed their
    * events will be removed from the old eventbus and then `onPluginLoad` will be called with the new eventbus.
    *
    * @param {object}     opts - An options object.
    *
    * @param {import('#manager/eventbus').Eventbus}   opts.eventbus - The new eventbus to associate.
    *
    * @param {string}     [opts.eventPrepend='plugins'] - An optional string to prepend to all of the event
    *                                                     binding targets.
    */
   async setEventbus({ eventbus, eventPrepend = 'plugins' })
   {
      if (this.isDestroyed) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      if (!isObject(eventbus)) { throw new TypeError(`'eventbus' is not an Eventbus.`); }
      if (typeof eventPrepend !== 'string') { throw new TypeError(`'eventPrepend' is not a string.`); }

      // Early escape if the eventbus is the same as the current eventbus.
      if (eventbus === this.#eventbus) { return; }

      const oldPrepend = this._eventPrepend;

      /**
       * Stores the prepend string for eventbus registration.
       *
       * @type {string}
       * @private
       */
      this._eventPrepend = eventPrepend;

      // Unload and reload any existing plugins from the old eventbus to the target eventbus.
      if (this.#pluginMap.size > 0)
      {
         // Invokes the private internal async events method which allows skipping of error checking.
         await invokeAsyncEvent({ method: 'onPluginUnload', manager: this, errorCheck: false });

         for (const entry of this.#pluginMap.values())
         {
            try
            {
               // Automatically remove any potential reference to a stored event proxy instance.
               delete entry.instance._eventbus;
            }
            /* c8 ignore next */
            catch (err) { /* nop */ }

            entry.data.manager.eventPrepend = eventPrepend;
            entry.data.manager.scopedName = `${eventPrepend}:${entry.name}`;

            if (entry.eventbusProxy instanceof EventbusProxy) { entry.eventbusProxy.destroy(); }

            entry.eventbusProxy = new EventbusProxy(eventbus);

            // Invokes the private internal async events method which allows skipping of error checking.
            if (entry.enabled)
            {
               await invokeAsyncEvent({
                  method: 'onPluginLoad',
                  manager: this,
                  plugins: entry.name,
                  errorCheck: false
               });
            }
         }
      }

      if (this.#eventbus !== null)
      {
         this.#eventbus.off(`${oldPrepend}:async:add`, this._addEventbus, this);
         this.#eventbus.off(`${oldPrepend}:async:add:all`, this._addAllEventbus, this);
         this.#eventbus.off(`${oldPrepend}:async:destroy:manager`, this._destroyEventbus, this);
         this.#eventbus.off(`${oldPrepend}:async:remove`, this._removeEventbus, this);
         this.#eventbus.off(`${oldPrepend}:async:remove:all`, this._removeAllEventbus, this);
         this.#eventbus.off(`${oldPrepend}:get:enabled`, this.getEnabled, this);
         this.#eventbus.off(`${oldPrepend}:get:options`, this.getOptions, this);
         this.#eventbus.off(`${oldPrepend}:get:plugin:by:event`, this.getPluginByEvent, this);
         this.#eventbus.off(`${oldPrepend}:get:plugin:data`, this.getPluginData, this);
         this.#eventbus.off(`${oldPrepend}:get:plugin:events`, this.getPluginEvents, this);
         this.#eventbus.off(`${oldPrepend}:get:plugin:names`, this.getPluginNames, this);
         this.#eventbus.off(`${oldPrepend}:has:plugin`, this.hasPlugins, this);
         this.#eventbus.off(`${oldPrepend}:is:valid:config`, this.isValidConfig, this);
         this.#eventbus.off(`${oldPrepend}:set:enabled`, this._setEnabledEventbus, this);
         this.#eventbus.off(`${oldPrepend}:set:options`, this._setOptionsEventbus, this);
      }

      eventbus.on(`${eventPrepend}:async:add`, this._addEventbus, this, { guard: true });
      eventbus.on(`${eventPrepend}:async:add:all`, this._addAllEventbus, this, { guard: true });
      eventbus.on(`${eventPrepend}:async:destroy:manager`, this._destroyEventbus, this, { guard: true });
      eventbus.on(`${eventPrepend}:async:remove`, this._removeEventbus, this, { guard: true });
      eventbus.on(`${eventPrepend}:async:remove:all`, this._removeAllEventbus, this, { guard: true });
      eventbus.on(`${eventPrepend}:get:enabled`, this.getEnabled, this, { guard: true });
      eventbus.on(`${eventPrepend}:get:options`, this.getOptions, this, { guard: true });
      eventbus.on(`${eventPrepend}:get:plugin:by:event`, this.getPluginByEvent, this, { guard: true });
      eventbus.on(`${eventPrepend}:get:plugin:data`, this.getPluginData, this, { guard: true });
      eventbus.on(`${eventPrepend}:get:plugin:events`, this.getPluginEvents, this, { guard: true });
      eventbus.on(`${eventPrepend}:get:plugin:names`, this.getPluginNames, this, { guard: true });
      eventbus.on(`${eventPrepend}:has:plugin`, this.hasPlugins, this, { guard: true });
      eventbus.on(`${eventPrepend}:is:valid:config`, this.isValidConfig, this, { guard: true });
      eventbus.on(`${eventPrepend}:set:enabled`, this._setEnabledEventbus, this, { guard: true });
      eventbus.on(`${eventPrepend}:set:options`, this._setOptionsEventbus, this, { guard: true });

      for (const pluginSupport of this.#pluginSupport)
      {
         pluginSupport.setEventbus({
            oldEventbus: this.#eventbus,
            newEventbus: eventbus,
            oldPrepend,
            newPrepend: eventPrepend
         });
      }

      // Set the new eventbus for any EventbusSecure instances created.
      for (const eventbusSecureObj of this.#eventbusSecure)
      {
         eventbusSecureObj.setEventbus(eventbus);
      }

      this.#eventbus = eventbus;
   }

   /**
    * Set optional parameters.
    *
    * @param {import('.').PluginManagerOptions} options - Defines optional parameters to set.
    */
   setOptions(options)
   {
      if (this.isDestroyed) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      if (!isObject(options)) { throw new TypeError(`'options' is not an object.`); }

      if (typeof options.noEventAdd === 'boolean') { this.#options.noEventAdd = options.noEventAdd; }

      if (typeof options.noEventDestroy === 'boolean') { this.#options.noEventDestroy = options.noEventDestroy; }

      if (typeof options.noEventRemoval === 'boolean') { this.#options.noEventRemoval = options.noEventRemoval; }

      if (typeof options.noEventSetEnabled === 'boolean')
      {
         this.#options.noEventSetEnabled = options.noEventSetEnabled;
      }

      if (typeof options.noEventSetOptions === 'boolean')
      {
         this.#options.noEventSetOptions = options.noEventSetOptions;
      }

      if (typeof options.throwNoMethod === 'boolean') { this.#options.throwNoMethod = options.throwNoMethod; }

      if (typeof options.throwNoPlugin === 'boolean') { this.#options.throwNoPlugin = options.throwNoPlugin; }

      for (const pluginSupport of this.#pluginSupport)
      {
         pluginSupport.setOptions(options);
      }
   }

   /**
    * Provides the eventbus callback which may prevent plugin manager options being set if optional `noEventSetOptions`
    * is enabled. This disables the ability for the plugin manager options to be set via events preventing any external
    * code modifying options.
    *
    * @param {import('.').PluginManagerOptions} options - Defines optional parameters to set.
    *
    * @private
    */
   _setOptionsEventbus(options)
   {
      /* c8 ignore next */
      if (this.isDestroyed) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      if (!this.#options.noEventSetOptions) { this.setOptions(options); }
   }
}

export { PluginInvokeEvent, PluginInvokeSupport, PluginManager, escapeTarget, isValidConfig };
//# sourceMappingURL=index.js.map
