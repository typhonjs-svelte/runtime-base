import { expect, describe, it, vi } from 'vitest';

import { StyleSheetResolve }        from '#runtime/util/dom/style';

const stringify = (value: [] | {} | undefined) => value ? JSON.stringify(value, null, 2) : '';

describe('StyleSheetResolve', () =>
{
   describe('Basic Resolution', () =>
   {
      it('exists', () =>
      {
         const styleMap: Map<string, {}> = new Map([
            ['.parent', { '--parent': 'red' }],
            ['.source', { color: 'var(--parent)' }]
         ]);

         const resolver = new StyleSheetResolve(styleMap);

         const result = resolver.get('.source', {
            resolve: ['.parent']
         });

         expect(stringify(result)).toMatchInlineSnapshot(`
           "{
             "color": "red"
           }"
         `);
      });
   });

   describe('Warnings', () =>
   {
      it ('warnCycles (basic)', () =>
      {
         const styleMap: Map<string, {}> = new Map([
            ['.parent', { '--a': 'var(--b)', '--b': 'var(--a)' }],
            ['.source', { background: 'var(--a)', color: 'var(--b)' }]
         ]);

         const resolver = new StyleSheetResolve(styleMap);

         const consoleLog: string[] = [];

         vi.spyOn(console, 'warn').mockImplementation((message: string) => consoleLog.push(message));

         resolver.get('.source', {
            resolve: ['.parent'],
            warnCycles: true
         });

         vi.restoreAllMocks();

         expect(stringify(consoleLog)).toMatchInlineSnapshot(`
           "[
             "[TyphonJS Runtime] StyleSheetResolve - CSS variable cyclic dependency detected: --a → --b → --a\\nAffected properties:\\n- background (via --a)\\n- color (via --b)\\n- background (via --a)",
             "[TyphonJS Runtime] StyleSheetResolve - CSS variable cyclic dependency detected: --b → --a → --b\\nAffected properties:\\n- color (via --b)\\n- background (via --a)\\n- color (via --b)"
           ]"
         `);
      });

      it ('warnCycles (complex)', () =>
      {
         const styleMap: Map<string, {}> = new Map([
            ['.p1', { '--x': 'var(--y)', '--a': 'var(--b)' }],
            ['.p2', {
               '--y': 'var(--z)', '--z': 'var(--a)', /* Indirect cycle: x → y → z → a → b → z */
               '--ok': '#123456' // Cleanly resolvable.
            }],
            ['.p3', { '--b': 'var(--z)' }],
            ['.source', { background: 'var(--ok)', border: 'var(--y)', color: 'var(--x)' }]
         ]);

         const resolver = new StyleSheetResolve(styleMap);

         const consoleLog: string[] = [];

         vi.spyOn(console, 'warn').mockImplementation((message: string) => consoleLog.push(message));

         const result = resolver.get('.source', {
            resolve: ['.p1', '.p2', '.p3'],
            warnCycles: true
         });

         vi.restoreAllMocks();

         expect(stringify(consoleLog)).toMatchInlineSnapshot(`
           "[
             "[TyphonJS Runtime] StyleSheetResolve - CSS variable cyclic dependency detected: --x → --y → --z → --a → --b → --z\\nAffected properties:\\n- color (via --x)\\n- border (via --y)",
             "[TyphonJS Runtime] StyleSheetResolve - CSS variable cyclic dependency detected: --y → --z → --a → --b → --z\\nAffected properties:\\n- border (via --y)"
           ]"
         `);

         expect(stringify(result)).toMatchInlineSnapshot(`
           "{
             "background": "#123456",
             "border": "var(--y)",
             "color": "var(--x)"
           }"
         `);

      });

      it ('warnResolve', () =>
      {
         const styleMap: Map<string, {}> = new Map([
            ['.parent', { '--parent': 'red' }],
            ['.source', { color: 'var(--parent)' }]
         ]);

         const resolver = new StyleSheetResolve(styleMap);


         const consoleLog: string[] = [];

         vi.spyOn(console, 'warn').mockImplementation((message: string) => consoleLog.push(message));

         resolver.get('.source', {
            resolve: ['.DUMMY'],
            warnResolve: true
         });

         vi.restoreAllMocks();

         expect(stringify(consoleLog)).toMatchInlineSnapshot(`
           "[
             "[TyphonJS Runtime] StyleSheetResolve - #resolve - Could not locate parent selector(s) for resolution: '.DUMMY'"
           ]"
         `);
      });
   });
});
