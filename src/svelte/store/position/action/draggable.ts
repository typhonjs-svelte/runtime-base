import { getEasingFunc }         from '#runtime/svelte/easing';

import { A11yHelper }            from '#runtime/util/a11y';

import {
   isIterable,
   isObject }                    from '#runtime/util/object';

import type { ActionReturn }     from 'svelte/action';

import type {
   Subscriber,
   Unsubscriber }                from 'svelte/store';

import type { EasingReference }  from '#runtime/svelte/easing';

import type { TJSPosition }      from '../TJSPosition';

import type { Action }           from './types';

import type { AnimationAPI }     from '../animation/types';
import type { Data }          from '../data/types';

/**
 * Provides an action to enable pointer dragging of an HTMLElement and invoke `position.set` on a given
 * {@link TJSPosition} instance provided. When the attached boolean store state changes the draggable action is enabled
 * or disabled.
 *
 * @param node - The node associated with the action.
 *
 * @param options - Draggable action options.
 *
 * @returns Action lifecycle functions.
 */
function draggable(node: HTMLElement, { position, enabled = true, button = 0, storeDragging = void 0, tween = false,
 tweenOptions = { duration: 1, ease: 'cubicOut' }, hasTargetClassList, ignoreTargetClassList }:
  Action.DraggableOptions): ActionReturn<Partial<Action.DraggableOptions>>
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
    */
   const positionData: { left: number, top: number } = { left: 0, top: 0 };

   /**
    * Find actual position instance checking for a Positionable instance.
    */
   let actualPosition: TJSPosition = ((position as TJSPosition.Positionable)?.position ?? position) as TJSPosition;

   /**
    * Duplicate the app / Positionable starting position to track differences.
    */
   let initialPosition: Partial<Data.TJSPositionData> | null = null;

   /**
    * Stores the initial X / Y on drag down.
    */
   let initialDragPoint: { x: number, y: number } = { x: 0, y: 0 };

   /**
    * Stores the current dragging state and gates the move pointer as the dragging store is not set until the first
    * pointer move.
    */
   let dragging: boolean = false;

   /**
    * Stores the quickTo callback to use for optimized tweening when easing is enabled.
    */
   let quickTo: AnimationAPI.QuickToCallback = actualPosition.animate.quickTo(['top', 'left'],
    tweenOptions);

   /**
    * Event handlers associated with this action, so they may be later unregistered.
    */
   const handlers: { [p: string]: [string, EventListener, boolean] } = {
      dragDown: ['pointerdown', onDragPointerDown as EventListener, false],
      dragMove: ['pointermove', onDragPointerChange as EventListener, false],
      dragUp: ['pointerup', onDragPointerUp as EventListener, false]
   };

   /**
    * Activates listeners.
    */
   function activateListeners(): void
   {
      // Drag handlers
      node.addEventListener(...handlers.dragDown);
      node.classList.add('draggable');
   }

   /**
    * Removes listeners.
    */
   function removeListeners(): void
   {
      if (typeof storeDragging?.set === 'function') { storeDragging.set(false); }

      // Drag handlers
      node.removeEventListener(...handlers.dragDown);
      node.removeEventListener(...handlers.dragMove);
      node.removeEventListener(...handlers.dragUp);
      node.classList.remove('draggable');
   }

   if (enabled)
   {
      activateListeners();
   }

   /**
    * Handle the initial pointer down that activates dragging behavior for the positionable.
    *
    * @param event - The pointer down event.
    */
   function onDragPointerDown(event: PointerEvent): void
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
         let foundTarget: boolean = false;

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
    * @param event - The pointer move event.
    */
   function onDragPointerChange(event: PointerEvent): void
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

      const newLeft: number = initialPosition?.left! + (event.clientX - initialDragPoint.x);
      const newTop: number = initialPosition?.top! + (event.clientY - initialDragPoint.y);

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
    * @param event - The pointer up event.
    */
   function onDragPointerUp(event: PointerEvent): void
   {
      event.preventDefault();

      dragging = false;
      if (typeof storeDragging?.set === 'function') { storeDragging.set(false); }

      node.removeEventListener(...handlers.dragMove);
      node.removeEventListener(...handlers.dragUp);
   }

   return {
      // The default of enabled being true won't automatically add listeners twice.
      update: (options: Partial<Action.DraggableOptions>): void =>
      {
         if (options.position !== void 0)
         {
            // Find actual position instance checking for a Positionable instance.
            const newPosition: TJSPosition =
             ((options.position as TJSPosition.Positionable)?.position ?? options.position) as TJSPosition;

            if (newPosition !== actualPosition)
            {
               actualPosition = newPosition;
               quickTo = actualPosition.animate.quickTo(['top', 'left'], tweenOptions);
            }
         }

         if (typeof options.enabled === 'boolean')
         {
            enabled = options.enabled;
            if (enabled) { activateListeners(); }
            else { removeListeners(); }
         }

         if (typeof options.button === 'number')
         {
            button = options.button;
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
 */
class DraggableOptionsStore implements Action.DraggableOptionsStore
{
   tween!: boolean;
   tweenOptions!: AnimationAPI.QuickTweenOptions;

   readonly #initialTween: boolean;

   /**
    */
   readonly #initialTweenOptions: AnimationAPI.QuickTweenOptions;

   #tween: boolean = false;

   /**
    */
   #tweenOptions: AnimationAPI.QuickTweenOptions = { duration: 1, ease: 'cubicOut' };

   /**
    * Stores the subscribers.
    */
   #subscribers: Subscriber<Action.DraggableOptionsStore>[] = [];

   /**
    * @param [opts] - Optional parameters.
    *
    * @param [opts.tween = false] - Tween enabled.
    *
    * @param [opts.tweenOptions] - Quick tween options.
    */
   constructor({ tween = false, tweenOptions }: { tween?: boolean,
    tweenOptions?: AnimationAPI.QuickTweenOptions } = {})
   {
      // Define the following getters directly on this instance and make them enumerable. This allows them to be
      // picked up w/ `Object.assign`.
      Object.defineProperty(this, 'tween', {
         get: (): boolean => { return this.#tween; },
         set: (newTween: boolean): void =>
         {
            if (typeof newTween !== 'boolean') { throw new TypeError(`'tween' is not a boolean.`); }

            this.#tween = newTween;
            this.#updateSubscribers();
         },
         enumerable: true
      });

      Object.defineProperty(this, 'tweenOptions', {
         get: (): AnimationAPI.QuickTweenOptions => { return this.#tweenOptions; },
         set: (newTweenOptions: AnimationAPI.QuickTweenOptions): void =>
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
               const easeFn = getEasingFunc(newTweenOptions.ease);

               if (typeof easeFn !== 'function')
               {
                  throw new TypeError(`'tweenOptions.ease' is not a function or Svelte easing function name.`);
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
    * @returns Get tween duration.
    */
   get tweenDuration(): number { return this.#tweenOptions.duration as number; }

   /**
    * @returns Get easing function or easing function name.
    */
   get tweenEase(): EasingReference { return this.#tweenOptions.ease as EasingReference; }

   /**
    * @param duration - Set tween duration.
    */
   set tweenDuration(duration: number)
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
    * @param ease - Set easing function by name or direct function.
    */
   set tweenEase(ease: EasingReference)
   {
      const easeFn = getEasingFunc(ease);

      if (typeof easeFn !== 'function')
      {
         throw new TypeError(`'ease' is not a function or Svelte easing function name.`);
      }

      this.#tweenOptions.ease = ease;
      this.#updateSubscribers();
   }

   /**
    * Resets all options data to initial values.
    */
   reset(): void
   {
      this.#tween = this.#initialTween;
      this.#tweenOptions = Object.assign({}, this.#initialTweenOptions);
      this.#updateSubscribers();
   }

   /**
    * Resets tween enabled state to initial value.
    */
   resetTween(): void
   {
      this.#tween = this.#initialTween;
      this.#updateSubscribers();
   }

   /**
    * Resets tween options to initial values.
    */
   resetTweenOptions(): void
   {
      this.#tweenOptions = Object.assign({}, this.#initialTweenOptions);
      this.#updateSubscribers();
   }

   /**
    * Store subscribe method.
    *
    * @param handler - Callback function that is invoked on update / changes. Receives the DraggableOptionsStore
    *        instance.
    *
    * @returns Unsubscribe function.
    */
   subscribe(handler: Subscriber<Action.DraggableOptionsStore>): Unsubscriber
   {
      const currentIdx: number = this.#subscribers.findIndex((entry: Function): boolean => entry === handler);
      if (currentIdx === -1)
      {
         this.#subscribers.push(handler); // add handler to the array of subscribers
         handler(this);                   // call handler with current value
      }

      // Return unsubscribe function.
      return (): void =>
      {
         const existingIdx: number = this.#subscribers.findIndex((entry: Function): boolean => entry === handler);
         if (existingIdx !== -1) { this.#subscribers.splice(existingIdx, 1); }
      }
   }

   #updateSubscribers(): void
   {
      const subscriptions: Subscriber<Action.DraggableOptionsStore>[] = this.#subscribers;

      // Early out if there are no subscribers.
      if (subscriptions.length > 0)
      {
         for (let cntr: number = 0; cntr < subscriptions.length; cntr++) { subscriptions[cntr](this); }
      }
   }
}

/**
 * Define a function to get a DraggableOptionsStore instance.
 *
 * @param options - Initial options for DraggableOptionsStore.
 *
 * @returns A new options instance.
 */
draggable.options = (options: {
   tween?: boolean,
   tweenOptions?: AnimationAPI.QuickTweenOptions
}): Action.DraggableOptionsStore => new DraggableOptionsStore(options);

export { draggable };
