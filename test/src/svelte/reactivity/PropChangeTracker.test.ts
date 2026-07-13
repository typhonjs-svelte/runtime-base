import {
   assert,
   describe,
   it }                       from 'vitest';

import { PropChangeTracker }  from '#runtime-test/svelte/util';

interface TestProps
{
   datafield?: object;
   enabled: boolean;
   groupConfig?: object;
   inputConfig?: object;
   revision: number;
}

describe('PropChangeTracker', () =>
{
   it('All', () =>
   {
      const props: TestProps = { enabled: true, revision: 0 };

      const tracker = new PropChangeTracker<
         TestProps,
         'datafield' | 'enabled' | 'groupConfig' | 'inputConfig'>({
         keys: ['datafield', 'enabled', 'groupConfig', 'inputConfig'],
         initialMode: 'undefined'
      });

      const initialChanges = tracker.check(props);

      assert(initialChanges.changed, 'The initial enabled value should differ from undefined.');
      assert(initialChanges.count === 1, 'Only enabled should initially be changed.');
      assert(initialChanges.has('enabled'), 'Enabled should initially be changed.');
      assert(!initialChanges.has('datafield'), 'An initially undefined DataField should not be changed.');

      const unchanged = tracker.check(props);
      assert(unchanged === initialChanges, 'The change-set instance should be reused.');
      assert(!unchanged.changed, 'An unchanged object should not report changes.');

      props.inputConfig = {};
      const inputConfigChanges = tracker.check(props);
      assert(inputConfigChanges.count === 1, 'Only inputConfig should be changed.');
      assert(inputConfigChanges.has('inputConfig'), 'inputConfig should be changed.');

      tracker.sync(props);
      assert(!inputConfigChanges.changed, 'sync should clear the transient change-set state.');

      tracker.reset();
      assert(!tracker.initialized, 'reset should clear tracker initialization.');

      const comparatorTracker = new PropChangeTracker<TestProps, 'revision'>({
         keys: ['revision'],
         initialMode: 'baseline',
         equals: {
            revision: (previous, current) => Math.floor(previous / 10) === Math.floor(current / 10)
         }
      });

      comparatorTracker.check(props);
      props.revision = 5;
      assert(!comparatorTracker.check(props).changed, 'The custom comparator should suppress equivalent changes.');
      props.revision = 10;
      assert(comparatorTracker.check(props).has('revision'), 'The custom comparator should detect a bucket change.');
   });
});
