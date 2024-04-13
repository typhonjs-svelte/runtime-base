import { cubicOut }     from '#svelte/easing';

import { A11yHelper }   from '#runtime/util/browser';

import {
   isIterable,
   isObject }           from '#runtime/util/object';

/**
 * Provides an action to enable pointer dragging of an HTMLElement and invoke `position.set` on a given
 * {@link TJSPosition} instance provided. When the attached boolean store state changes the draggable
 * action is enabled or disabled.
 *
 * @param {HTMLElement}       node - The node associated with the action.
 *
 * @param {import('./types').Action.DraggableOptions} options - Draggable action options.
 *
 * @returns {import('svelte/action').ActionReturn<import('./types').Action.DraggableOptions>} Action lifecycle
 *          functions.
 */
function draggable(node, { position, active = true, button = 0, storeDragging = void 0, tween = false,
 tweenOptions = { duration: 1, ease: cubicOut }, hasTargetClassList, ignoreTargetClassList })
{
   if (hasTargetClassList !== void 0 && !isIterable(hasTargetClassList))
   {
      throw new TypeError(`'hasTargetClassList' is not iterable.`);
   }

   if (ignoreTargetClassList !== void 0 && !isIterable(ignoreTargetClassList))
   {
      throw new TypeError(`'ignoreTargetClassList' is not iterable.`);
   }

   /**
    * Used for direct call to `position.set`.
    *
    * @type {{top: number, left: number}}
    */
   const positionData = { left: 0, top: 0 };

   /**
    * Find actual position instance checking for a Positionable instance.
    *
    * @type {import('..').TJSPosition}
    */
   let actualPosition = position?.position ?? position;

   /**
    * Duplicate the app / Positionable starting position to track differences.
    *
    * @type {object}
    */
   let initialPosition = null;

   /**
    * Stores the initial X / Y on drag down.
    *
    * @type {object}
    */
   let initialDragPoint = {};

   /**
    * Stores the current dragging state and gates the move pointer as the dragging store is not
    * set until the first pointer move.
    *
    * @type {boolean}
    */
   let dragging = false;

   /**
    * Stores the quickTo callback to use for optimized tweening when easing is enabled.
    *
    * @type {import('../animation/types').AnimationAPI.QuickToCallback}
    */
   let quickTo = actualPosition.animate.quickTo(['top', 'left'], tweenOptions);

   /**
    * Remember event handlers associated with this action, so they may be later unregistered.
    *
    *  @type {{ [key: string]: [string, Function, boolean] }}
    */
   const handlers = {
      dragDown: ['pointerdown', onDragPointerDown, false],
      dragMove: ['pointermove', onDragPointerChange, false],
      dragUp: ['pointerup', onDragPointerUp, false]
   };

   /**
    * Activates listeners.
    */
   function activateListeners()
   {
      // Drag handlers
      node.addEventListener(...handlers.dragDown);
      node.classList.add('draggable');
   }

   /**
    * Removes listeners.
    */
   function removeListeners()
   {
      if (typeof storeDragging?.set === 'function') { storeDragging.set(false); }

      // Drag handlers
      node.removeEventListener(...handlers.dragDown);
      node.removeEventListener(...handlers.dragMove);
      node.removeEventListener(...handlers.dragUp);
      node.classList.remove('draggable');
   }

   if (active)
   {
      activateListeners();
   }

   /**
    * Handle the initial pointer down that activates dragging behavior for the positionable.
    *
    * @param {PointerEvent} event - The pointer down event.
    */
   function onDragPointerDown(event)
   {
      if (event.button !== button || !event.isPrimary) { return; }

      // Do not process if the position system is not enabled.
      if (!actualPosition.enabled) { return; }

      // Potentially ignore this event if `ignoreTargetClassList` is defined and the `event.target` has a matching
      // class.
      if (ignoreTargetClassList !== void 0 && A11yHelper.isFocusTarget(event.target))
      {
         for (const targetClass of ignoreTargetClassList)
         {
            if (event.target.classList.contains(targetClass)) { return; }
         }
      }

      // Potentially ignore this event if `hasTargetClassList` is defined and the `event.target` does not have any
      // matching class from the list.
      if (hasTargetClassList !== void 0 && A11yHelper.isFocusTarget(event.target))
      {
         let foundTarget = false;

         for (const targetClass of hasTargetClassList)
         {
            if (event.target.classList.contains(targetClass))
            {
               foundTarget = true;
               break;
            }
         }

         if (!foundTarget) { return; }
      }

      event.preventDefault();

      dragging = false;

      // Record initial position.
      initialPosition = actualPosition.get();
      initialDragPoint = { x: event.clientX, y: event.clientY };

      // Add move and pointer up handlers.
      node.addEventListener(...handlers.dragMove);
      node.addEventListener(...handlers.dragUp);

      node.setPointerCapture(event.pointerId);
   }

   /**
    * Move the positionable.
    *
    * @param {PointerEvent} event - The pointer move event.
    */
   function onDragPointerChange(event)
   {
      // See chorded button presses for pointer events:
      // https://www.w3.org/TR/pointerevents3/#chorded-button-interactions
      // TODO: Support different button configurations for PointerEvents.
      if ((event.buttons & 1) === 0)
      {
         onDragPointerUp(event);
         return;
      }

      if (event.button !== -1 || !event.isPrimary) { return; }

      event.preventDefault();

      // Only set store dragging on first move event.
      if (!dragging && typeof storeDragging?.set === 'function')
      {
         dragging = true;
         storeDragging.set(true);
      }

      /** @type {number} */
      const newLeft = initialPosition.left + (event.clientX - initialDragPoint.x);
      /** @type {number} */
      const newTop = initialPosition.top + (event.clientY - initialDragPoint.y);

      if (tween)
      {
         quickTo(newTop, newLeft);
      }
      else
      {
         positionData.left = newLeft;
         positionData.top = newTop;

         actualPosition.set(positionData);
      }
   }

   /**
    * Finish dragging and set the final position and removing listeners.
    *
    * @param {PointerEvent} event - The pointer up event.
    */
   function onDragPointerUp(event)
   {
      event.preventDefault();

      dragging = false;
      if (typeof storeDragging?.set === 'function') { storeDragging.set(false); }

      node.removeEventListener(...handlers.dragMove);
      node.removeEventListener(...handlers.dragUp);
   }

   return {
      // The default of active being true won't automatically add listeners twice.
      update: (options) =>
      {
         if (typeof options.active === 'boolean')
         {
            active = options.active;
            if (active) { activateListeners(); }
            else { removeListeners(); }
         }

         if (typeof options.button === 'number')
         {
            button = options.button;
         }

         if (options.position !== void 0)
         {
            // Find actual position instance checking for a Positionable instance.
            const newPosition = options.position?.position ?? options.position;
            if (newPosition !== actualPosition)
            {
               actualPosition = newPosition;
               quickTo = actualPosition.animate.quickTo(['top', 'left'], tweenOptions);
            }
         }

         if (typeof options.tween === 'boolean') { tween = options.tween; }

         if (isObject(options.tweenOptions))
         {
            tweenOptions = options.tweenOptions;
            quickTo.options(tweenOptions);
         }

         if (options.hasTargetClassList !== void 0)
         {
            if (!isIterable(options.hasTargetClassList))
            {
               throw new TypeError(`'hasTargetClassList' is not iterable.`);
            }
            else
            {
               hasTargetClassList = options.hasTargetClassList;
            }
         }

         if (options.ignoreTargetClassList !== void 0)
         {
            if (!isIterable(options.ignoreTargetClassList))
            {
               throw new TypeError(`'ignoreTargetClassList' is not iterable.`);
            }
            else
            {
               ignoreTargetClassList = options.ignoreTargetClassList;
            }
         }
      },

      destroy: () => removeListeners()
   };
}

/**
 * Provides an instance of the {@link draggable} action options support / Readable store to make updating / setting
 * draggable options much easier. When subscribing to the options instance returned by {@link draggable.options} the
 * Subscriber handler receives the entire instance.
 *
 * @implements {import('./types').Action.DraggableOptionsStore}
 */
class DraggableOptionsStore
{
   /** @type {boolean} */
   #initialTween;

   /**
    * @type {import('../animation/types').AnimationAPI.QuickTweenOptions}
    */
   #initialTweenOptions;

   /** @type {boolean} */
   #tween;

   /**
    * @type {import('../animation/types').AnimationAPI.QuickTweenOptions}
    */
   #tweenOptions = { duration: 1, ease: cubicOut };

   /**
    * Stores the subscribers.
    *
    * @type {import('svelte/store').Subscriber<import('./types').Action.DraggableOptionsStore>[]}
    */
   #subscriptions = [];

   /**
    * @param {object} [opts] - Optional parameters.
    *
    * @param {boolean}  [opts.tween = false] - Tween enabled.
    *
    * @param {import('../animation/types').AnimationAPI.QuickTweenOptions}   [opts.tweenOptions] - Quick tween options.
    */
   constructor({ tween = false, tweenOptions } = {})
   {
      // Define the following getters directly on this instance and make them enumerable. This allows them to be
      // picked up w/ `Object.assign`.
      Object.defineProperty(this, 'tween', {
         get: () => { return this.#tween; },
         set: (newTween) =>
         {
            if (typeof newTween !== 'boolean') { throw new TypeError(`'tween' is not a boolean.`); }

            this.#tween = newTween;
            this.#updateSubscribers();
         },
         enumerable: true
      });

      Object.defineProperty(this, 'tweenOptions', {
         get: () => { return this.#tweenOptions; },
         set: (newTweenOptions) =>
         {
            if (!isObject(newTweenOptions))
            {
               throw new TypeError(`'tweenOptions' is not an object.`);
            }

            if (newTweenOptions.duration !== void 0)
            {
               if (!Number.isFinite(newTweenOptions.duration))
               {
                  throw new TypeError(`'tweenOptions.duration' is not a finite number.`);
               }

               if (newTweenOptions.duration < 0)
               {
                  this.#tweenOptions.duration = 0;
               }
               else
               {
                  this.#tweenOptions.duration = newTweenOptions.duration;
               }
            }

            if (newTweenOptions.ease !== void 0)
            {
               if (typeof newTweenOptions.ease !== 'function')
               {
                  throw new TypeError(`'tweenOptions.ease' is not a function.`);
               }

               this.#tweenOptions.ease = newTweenOptions.ease;
            }

            this.#updateSubscribers();
         },
         enumerable: true
      });

      // Set default options.
      if (tween !== void 0) { this.tween = tween; }
      if (tweenOptions !== void 0) { this.tweenOptions = tweenOptions; }

      this.#initialTween = this.#tween;
      this.#initialTweenOptions = Object.assign({}, this.#tweenOptions);
   }

   /**
    * @returns {number} Get tween duration.
    */
   get tweenDuration() { return this.#tweenOptions.duration; }

   /**
    * @returns {import('svelte/transition').EasingFunction} Get easing function.
    */
   get tweenEase() { return this.#tweenOptions.ease; }

   /**
    * @param {number}   duration - Set tween duration.
    */
   set tweenDuration(duration)
   {
      if (!Number.isFinite(duration))
      {
         throw new TypeError(`'duration' is not a finite number.`);
      }

      if (duration < 0) { duration = 0; }

      this.#tweenOptions.duration = duration;
      this.#updateSubscribers();
   }

   /**
    * @param {import('svelte/transition').EasingFunction} ease - Set easing function.
    */
   set tweenEase(ease)
   {
      if (typeof ease !== 'function')
      {
         throw new TypeError(`'ease' is not a function.`);
      }

      this.#tweenOptions.ease = ease;
      this.#updateSubscribers();
   }

   /**
    * Resets all options data to initial values.
    */
   reset()
   {
      this.#tween = this.#initialTween;
      this.#tweenOptions = Object.assign({}, this.#initialTweenOptions);
      this.#updateSubscribers();
   }

   /**
    * Resets tween enabled state to initial value.
    */
   resetTween()
   {
      this.#tween = this.#initialTween;
      this.#updateSubscribers();
   }

   /**
    * Resets tween options to initial values.
    */
   resetTweenOptions()
   {
      this.#tweenOptions = Object.assign({}, this.#initialTweenOptions);
      this.#updateSubscribers();
   }

   /**
    * Store subscribe method.
    *
    * @param {import('svelte/store').Subscriber<import('./types').Action.DraggableOptionsStore>} handler - Callback function that
    *        is invoked on update / changes. Receives the DraggableOptionsStore object / instance.
    *
    * @returns {import('svelte/store').Unsubscriber} Unsubscribe function.
    */
   subscribe(handler)
   {
      this.#subscriptions.push(handler); // add handler to the array of subscribers

      handler(this);                     // call handler with current value

      // Return unsubscribe function.
      return () =>
      {
         const index = this.#subscriptions.findIndex((sub) => sub === handler);
         if (index >= 0) { this.#subscriptions.splice(index, 1); }
      };
   }

   #updateSubscribers()
   {
      const subscriptions = this.#subscriptions;

      // Early out if there are no subscribers.
      if (subscriptions.length > 0)
      {
         for (let cntr = 0; cntr < subscriptions.length; cntr++) { subscriptions[cntr](this); }
      }
   }
}

/**
 * Define a function to get an DraggableOptionsStore instance.
 *
 * @param {({
 *    tween?: boolean,
 *    tweenOptions?: import('../animation/types').AnimationAPI.QuickTweenOptions
 * })} options - Initial options for DraggableOptionsStore.
 *
 * @returns {import('./types').Action.DraggableOptionsStore} A new options instance.
 */
draggable.options = (options) => new DraggableOptionsStore(options);

export { draggable };
