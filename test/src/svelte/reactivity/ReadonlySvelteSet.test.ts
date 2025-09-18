import {
   beforeEach,
   expect,
   describe,
   it,
   vi }              from 'vitest';

import {
   ReadonlySvelteSet,
   SvelteSet }       from '#runtime-test/svelte/reactivity';

type SubValue<T> = ReadonlySet<T> | Set<T>;

describe('ReadonlySvelteSet', () =>
{
   describe('Constructor', () =>
   {
      it('SvelteSet', () =>
      {
         const set = new ReadonlySvelteSet<string>(new SvelteSet<string>(['foo', 'bar']));
         expect(set.size).toEqual(2);
      });

      it('Error', () =>
      {
         // @ts-expect-error
         expect(() => new ReadonlySvelteSet<string>(null)).to.throw(TypeError,
          `'svelteSet' is not an instance of SvelteSet.`);
      });
   });


   describe('Methods', () =>
   {
      let set: SvelteSet<number>;
      let roSet: ReadonlySvelteSet<number>;

      beforeEach(() =>
      {
         set = new SvelteSet<number>([0, 1, 2]);
         roSet = new ReadonlySvelteSet<number>(set);
      });

      it('Symbol.iterator', () =>
      {
         let cntr = 0;
         for (const entry of roSet) { expect(entry).toBe(cntr++); }
      });

      it('entries()', () =>
      {
         let cntr = 0;
         for (const entry of roSet.entries())
         {
            expect(entry).toEqual([cntr, cntr]);
            cntr++;
         }
      });

      it('forEach()', () =>
      {
         let cntr = 0;

         roSet.forEach((entry) => expect(entry).toBe(cntr++));
      });

      it('keys()', () =>
      {
         let cntr = 0;
         for (const entry of roSet.keys()) { expect(entry).toBe(cntr++); }
      });

      it('values()', () =>
      {
         let cntr = 0;
         for (const entry of roSet.values()) { expect(entry).toBe(cntr++); }
      });
   });

   describe('Reactivity', () =>
   {
      let set: SvelteSet<number>;
      let roSet: ReadonlySvelteSet<number>;

      beforeEach(() =>
      {
         set = new SvelteSet<number>();
         roSet = new ReadonlySvelteSet<number>(set);
      });

      it('subscribe receives initial value and subsequent updates', () =>
      {
         const spy = vi.fn<(v: SubValue<number>) => void>();
         const unsub = roSet.subscribe(spy);

         // initial
         expect(spy).toHaveBeenCalledTimes(1);
         expect(spy.mock.calls[0][0] instanceof ReadonlySvelteSet).toBe(true);
         expect((spy.mock.calls[0][0] as Set<number>).size).toBe(0);

         // add => emit
         set.add(42);
         expect(spy).toHaveBeenCalledTimes(2);
         expect((spy.mock.calls[1][0] as Set<number>).has(42)).toBe(true);

         // idempotent add => should not emit if nothing changes.
         set.add(42);
         expect(set.size).toBe(1);
         expect(roSet.size).toBe(1);
         expect(spy).toHaveBeenCalledTimes(2);

         // delete => emit
         set.delete(42);
         expect(spy).toHaveBeenCalledTimes(3);
         expect((spy.mock.calls[2][0] as Set<number>).has(42)).toBe(false);

         unsub();

         // further changes after unsubscribe should not notify.
         set.add(7);
         expect(spy).toHaveBeenCalledTimes(3);
      });

      it('multiple subscribers are notified', () =>
      {
         const a = vi.fn();
         const b = vi.fn();

         const ua = roSet.subscribe(a);
         const ub = roSet.subscribe(b);

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
         const unsub = roSet.subscribe(spy);

         expect(spy).toHaveBeenCalledTimes(1);
         set.clear(); // already empty => ideally no emit.
         expect(spy).toHaveBeenCalledTimes(1);

         set.add(1);
         set.add(2);
         expect(spy).toHaveBeenCalledTimes(3);

         set.clear(); // now non-empty => should emit once.
         expect(spy).toHaveBeenCalledTimes(4);
         expect((spy.mock.calls[3][0] as Set<number>).size).toBe(0);

         unsub();
      });
   });
});
