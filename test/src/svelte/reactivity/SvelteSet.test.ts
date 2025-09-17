import {
   beforeEach,
   expect,
   describe,
   it,
   vi }              from 'vitest';

import { SvelteSet } from '#runtime-test/svelte/reactivity';

type SubValue<T> = ReadonlySet<T> | Set<T>;

describe('SvelteSet', () =>
{
   describe('Constructor', () =>
   {
      it('Empty', () =>
      {
         const set = new SvelteSet<string>();
         expect(set.size).toEqual(0);
      });

      it('Iterator', () =>
      {
         const set = new SvelteSet<string>(['foo', 'bar']);
         expect(set.size).toEqual(2);
      });

      it('Error', () =>
      {
         expect(() => new SvelteSet<string>(null)).to.throw(TypeError, `'data' must be an iterable list.`);
      });
   });

   describe('Reactivity', () =>
   {
      let set: SvelteSet<number>;

      beforeEach(() =>
      {
         set = new SvelteSet<number>();
      });

      it('subscribe receives initial value and subsequent updates', () =>
      {
         const spy = vi.fn<(v: SubValue<number>) => void>();
         const unsub = set.subscribe(spy);

         // initial
         expect(spy).toHaveBeenCalledTimes(1);
         expect(spy.mock.calls[0][0] instanceof Set).toBe(true);
         expect((spy.mock.calls[0][0] as Set<number>).size).toBe(0);

         // add => emit
         const added = set.add(42);
         expect(added).toBe(set);
         expect(spy).toHaveBeenCalledTimes(2);
         expect((spy.mock.calls[1][0] as Set<number>).has(42)).toBe(true);

         // idempotent add => should not emit if nothing changes
         const addedAgain = set.add(42);
         expect(addedAgain).toBe(set);
         expect(set.size).toBe(1);
         expect(spy).toHaveBeenCalledTimes(2);

         // delete => emit
         const deleted = set.delete(42);
         expect(deleted).toBe(true);
         expect(spy).toHaveBeenCalledTimes(3);
         expect((spy.mock.calls[2][0] as Set<number>).has(42)).toBe(false);



         unsub();

         // further changes after unsubscribe should not notify
         set.add(7);
         expect(spy).toHaveBeenCalledTimes(3);
      });

      it('multiple subscribers are notified', () =>
      {
         const a = vi.fn();
         const b = vi.fn();

         const ua = set.subscribe(a);
         const ub = set.subscribe(b);

         // initial for both
         expect(a).toHaveBeenCalledTimes(1);
         expect(b).toHaveBeenCalledTimes(1);

         set.add(1);

         expect(a).toHaveBeenCalledTimes(2);
         expect(b).toHaveBeenCalledTimes(2);

         ua();
         set.add(2);

         expect(a).toHaveBeenCalledTimes(2);
         expect(b).toHaveBeenCalledTimes(3);

         ub();
      });

      it('clear empties and emits only when needed', () =>
      {
         const spy = vi.fn();
         const unsub = set.subscribe(spy);

         expect(spy).toHaveBeenCalledTimes(1);
         set.clear(); // already empty => ideally no emit
         expect(spy).toHaveBeenCalledTimes(1);

         set.add(1);
         set.add(2);
         expect(spy).toHaveBeenCalledTimes(3);

         set.clear(); // now non-empty => should emit once
         expect(spy).toHaveBeenCalledTimes(4);
         expect((spy.mock.calls[3][0] as Set<number>).size).toBe(0);

         unsub();
      });
   });
});
