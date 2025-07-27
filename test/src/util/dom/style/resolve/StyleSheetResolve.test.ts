import {
   beforeEach,
   expect,
   describe,
   it,
   vi }                       from 'vitest';

import { StyleSheetResolve }  from '#runtime-test/util/dom/style';

const stringify = (value: [] | {} | undefined) => value ? JSON.stringify(value, null, 2) : '';

describe('StyleSheetResolve', () =>
{
   describe('Accessors / Iterator / Methods', () =>
   {
      let resolver: StyleSheetResolve;

      beforeEach(() => {
         const styleMap: Map<string, {}> = new Map([
            ['.source', { color: 'var(--parent)' }],
            ['.parent', { '--parent': 'red' }]
         ]);

         resolver = StyleSheetResolve.parse(styleMap);
      });

      it('get frozen', () =>
      {
         expect(resolver.frozen).to.be.false;
         resolver.freeze();
         expect(resolver.frozen).to.be.true;
      });

      it('get size', () =>
      {
         expect(resolver.size).toBe(2);
      });

      it('iterator', () =>
      {
         const result = Array.from(resolver);
         expect(result).toEqual([['.source',{'color': 'var(--parent)'}],['.parent',{'--parent':'red'}]]);
      });

      it('clear()', () =>
      {
         expect(resolver.size).toBe(2);
         resolver.clear();
         expect(resolver.size).toBe(0);
      })

      it('clone()', () =>
      {
         const clone = resolver.clone();

         expect(clone instanceof StyleSheetResolve).to.be.true;
         expect(Array.from(resolver)).toEqual(Array.from(clone));
      });

      it('delete()', () =>
      {
         expect(resolver.size).toBe(2);
         resolver.delete('.parent');
         expect(resolver.size).toBe(1);
         resolver.delete('.source');
         expect(resolver.size).toBe(0);
      });

      it('entries()', () =>
      {
         const result = Array.from(resolver.entries());
         expect(result).toEqual([['.source',{'color': 'var(--parent)'}],['.parent',{'--parent':'red'}]]);
      });

      it('has()', () =>
      {
         expect(resolver.has('.source')).to.be.true;
         expect(resolver.has('.parent')).to.be.true;
         expect(resolver.has('BOGUS')).to.be.false;
      });

      it('keys()', () =>
      {
         const result = Array.from(resolver.keys());
         expect(result).toEqual(['.source', '.parent']);
      });

      it('set()', () =>
      {
         expect(resolver.size).toBe(2);
         resolver.set('.test', { color: 'blue' });
         expect(resolver.size).toBe(3);
      });
   });

   describe('Basic Resolution', () =>
   {
      describe('direct parent', () =>
      {
         let resolver: StyleSheetResolve;

         const styleMap: Map<string, {}> = new Map([
            ['.source', { 'background-color': 'var(--parent)' }],
            ['.parent', { '--parent': 'red' }]
         ]);

         const mergeMap: Map<string, {}> = new Map([
            ['.source', { 'background-color': 'var(--parent)' }],
            ['.parent', { '--parent': 'blue' }]
         ]);

         const extraMap: Map<string, {}> = new Map([
            ['.foo', { 'color': 'var(--parent)' }]
         ]);

         beforeEach(() => resolver = StyleSheetResolve.parse(styleMap));

         it ('get() (can resolve [])', () =>
         {
            const result = resolver.get('.source', { resolve: ['.parent'] });

            expect(stringify(result)).toMatchInlineSnapshot(`
              "{
                "background-color": "red"
              }"
            `);
         });

         it ('get() (can resolve Set)', () =>
         {
            const result = resolver.get('.source', { resolve: new Set(['.parent']) });

            expect(stringify(result)).toMatchInlineSnapshot(`
              "{
                "background-color": "red"
              }"
            `);
         });

         it ('get() (multiple selectors)', () =>
         {
            const result = resolver.get(['.source', '.parent']);

            expect(stringify(result)).toMatchInlineSnapshot(`
              "{
                "background-color": "var(--parent)",
                "--parent": "red"
              }"
            `);
         });

         it ('get() (camelCase)', () =>
         {
            const result = resolver.get('.source', { camelCase: true });

            expect(stringify(result)).toMatchInlineSnapshot(`
              "{
                "backgroundColor": "var(--parent)"
              }"
            `);
         });

         it ('getProperty() (can resolve string)', () =>
         {
            const result = resolver.getProperty('.source', 'background-color', { resolve: '.parent' });
            expect(result).toBe('red');
         });

         it ('getProperty() (undefined result)', () =>
         {
            const result = resolver.getProperty('.source', 'BOGUS');
            expect(result).toBe(void 0);
         });

         it ('merge() (override)', () =>
         {
            resolver.merge(StyleSheetResolve.parse(mergeMap));

            const result = resolver.get('.source', { resolve: ['.parent'] });

            expect(stringify(result)).toMatchInlineSnapshot(`
              "{
                "background-color": "blue"
              }"
            `);
         });

         it ('merge() (exactMatch=true)', () =>
         {
            expect([...resolver.keys()]).toEqual([...styleMap.keys()]);

            resolver.merge(StyleSheetResolve.parse(extraMap), { exactMatch: true });

            expect([...resolver.keys()]).toEqual([...styleMap.keys()]);
         });

         it ('merge() (preserve)', () =>
         {
            resolver.merge(StyleSheetResolve.parse(mergeMap), { strategy: 'preserve' });

            const result = resolver.get('.source', { resolve: ['.parent'] });

            expect(stringify(result)).toMatchInlineSnapshot(`
              "{
                "background-color": "red"
              }"
            `);
         });
      });

      describe('indirect parent', () =>
      {
         let resolver: StyleSheetResolve;

         const styleMap: Map<string, {}> = new Map([
            ['.source', { color: 'var(--b)' }],
            ['.p1', { '--b': 'var(--a)' }],
            ['.p2', { '--a': 'blue' }]
         ]);

         beforeEach(() => resolver = StyleSheetResolve.parse(styleMap));

         it('get() (can resolve)', () =>
         {
            const result = resolver.get('.source', { resolve: ['.p1', '.p2'] });

            expect(stringify(result)).toMatchInlineSnapshot(`
              "{
                "color": "blue"
              }"
            `);
         });

         it('get() (depth 1)', () =>
         {
            const result = resolver.get('.source', { depth: 1, resolve: ['.p1', '.p2'] });

            // Does not resolve as `depth: 1` stops early.
            expect(stringify(result)).toMatchInlineSnapshot(`
              "{
                "color": "var(--a)"
              }"
            `);
         });
      });
   });

   describe('Complex Resolution', () =>
   {
      // TODO: FIGURE OUT A COMPLEX RESOLUTION TEST CASE
      it('direct parent', () =>
      {
         const styleMap: Map<string, {}> = new Map([
            ['.parent', { '--parent': 'red' }],
            ['.source', { color: 'var(--parent)' }]
         ]);

         const resolver = StyleSheetResolve.parse(styleMap);

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

   describe('Parsing (CSSStyleSheet)', () =>
   {
      describe('CSSStyleRule', () =>
      {
         const sheet = new CSSStyleSheet();
         sheet.insertRule('.source { color: var(--a); }');
         sheet.insertRule('.parent { --a: red; }');

         // `happy-dom` doesn't assign toStringTag for the mocked DOM API, but `CrossWindow` requires it for
         // duck types.
         Object.defineProperty(Object.getPrototypeOf(sheet), Symbol.toStringTag, { value: 'CSSStyleSheet' });
         Object.defineProperty(Object.getPrototypeOf(sheet.cssRules[0]), Symbol.toStringTag, { value: 'CSSStyleRule' });
         Object.defineProperty(Object.getPrototypeOf(sheet.cssRules[1]), Symbol.toStringTag, { value: 'CSSStyleRule' });

         it('resolves parent', () =>
         {
            const resolver = StyleSheetResolve.parse(sheet);

            const result = resolver.get('.source', { resolve: ['.parent'] });

            expect(stringify(result)).toMatchInlineSnapshot(`
              "{
                "color": "red"
              }"
            `);
         });

         it('excludeSelectorParts option', () =>
         {
            const resolver = StyleSheetResolve.parse(sheet, { excludeSelectorParts: [/\.parent/] });

            const result = resolver.get('.source', { resolve: ['.parent'] });

            // Only includes `source` so `var(--a)` does not resolve.
            expect(stringify(result)).toMatchInlineSnapshot(`
              "{
                "color": "var(--a)"
              }"
            `);
         });

         it('includeSelectorPartSet option', () =>
         {
            const resolver = StyleSheetResolve.parse(sheet, { includeSelectorPartSet: new Set(['.source']) });

            const result = resolver.get('.source', { resolve: ['.parent'] });

            // Only includes `source` so `var(--a)` does not resolve.
            expect(stringify(result)).toMatchInlineSnapshot(`
              "{
                "color": "var(--a)"
              }"
            `);
         });
      });

      describe('CSSLayerBlockRule (single)', () =>
      {
         const baseSheet = new CSSStyleSheet();

         const mockLayerRule = new CSSStyleSheet();
         // @ts-expect-error
         mockLayerRule.name = 'testing';
         mockLayerRule.insertRule('.source { color: var(--a); }');
         mockLayerRule.insertRule('.parent { --a: red; }');

         // Override prototype to spoof [object CSSLayerBlockRule]
         Object.defineProperty(mockLayerRule, Symbol.toStringTag, { value: 'CSSLayerBlockRule' });

         // @ts-expect-error  // Can push w/ `happy-dom`.
         baseSheet.cssRules.push(mockLayerRule);

         // `happy-dom` doesn't assign toStringTag for the mocked DOM API, but `CrossWindow` requires it for duck types.
         Object.defineProperty(Object.getPrototypeOf(baseSheet), Symbol.toStringTag, { value: 'CSSStyleSheet' });

         Object.defineProperty(Object.getPrototypeOf(mockLayerRule.cssRules[0]), Symbol.toStringTag,
            { value: 'CSSStyleRule' });

         Object.defineProperty(Object.getPrototypeOf(mockLayerRule.cssRules[1]), Symbol.toStringTag,
            { value: 'CSSStyleRule' });

         it('resolves', () =>
         {
            const resolver = StyleSheetResolve.parse(baseSheet);

            const result = resolver.get('.source', {
               resolve: ['.parent']
            });

            expect(stringify(result)).toMatchInlineSnapshot(`
              "{
                "color": "red"
              }"
            `);
         });

         it('includeCSSLayers option', () =>
         {
            const resolver = StyleSheetResolve.parse(baseSheet, { includeCSSLayers: [/BOGUS/] });

            const result = resolver.get('.source', { resolve: ['.parent'] });

            // No CSS layers processed due to `includeCSSLayers`.
            expect(result).toEqual(void 0);
         });
      });

      describe('CSSLayerBlockRule (nested)', () =>
      {
         const baseSheet = new CSSStyleSheet();

         const mockLayerRule = new CSSStyleSheet();
         // @ts-expect-error
         mockLayerRule.name = 'testing';

         const mockLayerRule2 = new CSSStyleSheet();
         // @ts-expect-error
         mockLayerRule2.name = 'depth2';

         mockLayerRule2.insertRule('.source { color: var(--a); }');
         mockLayerRule2.insertRule('.parent { --a: red; }');

         // Override prototype to spoof [object CSSLayerBlockRule]
         Object.defineProperty(mockLayerRule, Symbol.toStringTag, { value: 'CSSLayerBlockRule' });
         Object.defineProperty(mockLayerRule2, Symbol.toStringTag, { value: 'CSSLayerBlockRule' });

         // @ts-expect-error // Can push w/ `happy-dom`.
         mockLayerRule.cssRules.push(mockLayerRule2);
         // @ts-expect-error
         baseSheet.cssRules.push(mockLayerRule);

         // `happy-dom` doesn't assign toStringTag for the mocked DOM API, but `CrossWindow` requires it for duck types.
         Object.defineProperty(Object.getPrototypeOf(baseSheet), Symbol.toStringTag, { value: 'CSSStyleSheet' });

         Object.defineProperty(Object.getPrototypeOf(mockLayerRule2.cssRules[0]), Symbol.toStringTag,
            { value: 'CSSStyleRule' });

         Object.defineProperty(Object.getPrototypeOf(mockLayerRule2.cssRules[1]), Symbol.toStringTag,
            { value: 'CSSStyleRule' });

         it('resolves', () =>
         {
            const resolver = StyleSheetResolve.parse(baseSheet);

            const result = resolver.get('.source', { resolve: ['.parent'] });

            expect(stringify(result)).toMatchInlineSnapshot(`
              "{
                "color": "red"
              }"
            `);
         });
      });
   });

   describe('Errors', () =>
   {
      describe('clear()', () =>
      {
         it('frozen', () =>
         {
            const resolver = new StyleSheetResolve();

            resolver.freeze();

            expect(() => resolver.clear()).to.throw(Error, `Cannot modify a frozen StyleSheetResolve instance.`);
         });
      });

      describe('delete()', () =>
      {
         it('frozen', () =>
         {
            const resolver = new StyleSheetResolve();

            resolver.freeze();

            expect(() => resolver.delete('')).to.throw(Error, `Cannot modify a frozen StyleSheetResolve instance.`);
         });
      });

      describe('get() types', () =>
      {
         let resolver: StyleSheetResolve;

         beforeEach(() => resolver = new StyleSheetResolve());

         it(`selector (not string)`, () =>
         {
            // @ts-expect-error
            expect(() => resolver.get(null)).to.throw(TypeError,
             `'selector' must be a string or an iterable list of strings.`);
         });

         it(`camelCase (not boolean)`, () =>
         {
            // @ts-expect-error
            expect(() => resolver.get('.bogus', { camelCase: null })).to.throw(TypeError,
             `'camelCase' must be a boolean.`);
         });

         it(`depth (not number)`, () =>
         {
            // @ts-expect-error
            expect(() => resolver.get('.bogus', { depth: null })).to.throw(TypeError,
             `'depth' must be a positive integer >= 1.`);
         });

         it(`depth (< 1)`, () =>
         {
            expect(() => resolver.get('.bogus', { depth: 0 })).to.throw(TypeError,
             `'depth' must be a positive integer >= 1.`);
         });

         it(`resolve (not string)`, () =>
         {
            // @ts-expect-error
            expect(() => resolver.get('.bogus', { resolve: null })).to.throw(TypeError,
             `'resolve' must be a string or an iterable list of strings.`);
         });

         it(`warnCycles (not boolean)`, () =>
         {
            // @ts-expect-error
            expect(() => resolver.get('.bogus', { warnCycles: null })).to.throw(TypeError,
             `'warnCycles' must be a boolean.`);
         });

         it(`warnResolve (not boolean)`, () =>
         {
            // @ts-expect-error
            expect(() => resolver.get('.bogus', { warnResolve: null })).to.throw(TypeError,
             `'warnResolve' must be a boolean.`);
         });
      });

      describe('merge() errors', () =>
      {
         let resolver: StyleSheetResolve;

         beforeEach(() => resolver = new StyleSheetResolve());

         it('frozen target', () =>
         {
            resolver.freeze();

            expect(() => resolver.merge(new StyleSheetResolve())).to.throw(Error,
             `Cannot modify a frozen StyleSheetResolve instance.`);
         });

         it('source (null)', () =>
         {
            // @ts-expect-error
            expect(() => resolver.merge(null)).to.throw(TypeError, `'source' is not a StyleSheetResolve instance.`);
         });
      });

      describe('parse() types', () =>
      {
         it('styleSheetOrMap (not Map or CSSStyleSheet)', () =>
         {
            // @ts-expect-error
            expect(() => StyleSheetResolve.parse(null)).to.throw(TypeError,
             `'styleSheetOrMap' must be a 'CSSStyleSheet' instance or a parsed Map of stylesheet entries.`);
         });

         it('options (not object)', () =>
         {
            // @ts-expect-error
            expect(() => StyleSheetResolve.parse(new Map(), null)).to.throw(TypeError,
             `'options' is not an object.`);
         });

         it('options.excludeSelectorParts (not iterable)', () =>
         {
            // @ts-expect-error
            expect(() => StyleSheetResolve.parse(new Map(), { excludeSelectorParts: null })).to.throw(TypeError,
             `'excludeSelectorParts' must be a list of RegExp instances.`);
         });

         it('options.includeCSSLayers (not iterable)', () =>
         {
            // @ts-expect-error
            expect(() => StyleSheetResolve.parse(new Map(), { includeCSSLayers: null })).to.throw(TypeError,
             `'includeCSSLayers' must be a list of RegExp instances.`);
         });

         it('options.includeSelectorPartSet (not Set)', () =>
         {
            // @ts-expect-error
            expect(() => StyleSheetResolve.parse(new Map(), { includeSelectorPartSet: null })).to.throw(TypeError,
             `'includeSelectorPartSet' must be a Set of strings.`);
         });
      });

      describe('set()', () =>
      {
         let resolver: StyleSheetResolve;

         beforeEach(() => resolver = new StyleSheetResolve());

         it('frozen', () =>
         {
            resolver.freeze();

            expect(() => resolver.set('', {})).to.throw(Error, `Cannot modify a frozen StyleSheetResolve instance.`);
         });

         it('selector (not string)', () =>
         {
            // @ts-expect-error
            expect(() => resolver.set(null, {})).to.throw(TypeError, `'selector' must be a string.`);
         });

         it('styleObj (not object)', () =>
         {
            // @ts-expect-error
            expect(() => resolver.set('', null)).to.throw(TypeError, `'styleObj' must be an object.`);
         });
      });
   });

   describe('Runtime (warnings)', () =>
   {
      it ('warnCycles (basic)', () =>
      {
         const styleMap: Map<string, {}> = new Map([
            ['.parent', { '--a': 'var(--b)', '--b': 'var(--a)' }],
            ['.source', { background: 'var(--a)', color: 'var(--b)' }]
         ]);

         const resolver = StyleSheetResolve.parse(styleMap);

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
            ['.p1', { '--x': 'var(--y)', '--a': 'var(--b)' }], // Indirect cycle: y → z → a → b → z
            ['.p2', {
               '--y': 'var(--z)', '--z': 'var(--a)',  // Indirect cycle: x → y → z → a → b → z
               '--ok': '#123456'                      // Cleanly resolvable.
            }],
            ['.p3', { '--b': 'var(--z)' }],
            ['.source', { background: 'var(--ok)', border: 'var(--y)', color: 'var(--x)' }]
         ]);

         const resolver = StyleSheetResolve.parse(styleMap);

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

         const resolver = StyleSheetResolve.parse(styleMap);

         const consoleLog: string[] = [];

         vi.spyOn(console, 'warn').mockImplementation((message: string) => consoleLog.push(message));

         resolver.get('.source', {
            resolve: ['.DUMMY'],
            warnResolve: true
         });

         vi.restoreAllMocks();

         expect(stringify(consoleLog)).toMatchInlineSnapshot(`
           "[
             "[TyphonJS Runtime] StyleSheetResolve - resolve - Could not locate parent selector(s) for resolution: '.DUMMY'"
           ]"
         `);
      });
   });
});
