import {
   beforeEach,
   expect,
   describe,
   it,
   vi }                       from 'vitest';

import { StyleSheetResolve }  from '#runtime-test/util/dom/style';

const stringify = (value: [] | {} | undefined) => value ? JSON.stringify(value, null, 2) : '';

// `happy-dom` doesn't implement `CSSLayerBlockRule`, but we can reuse `CSSStyleSheet`.
class CSSLayerBlockRule extends CSSStyleSheet
{
   name: string | undefined = void 0;

   constructor(options?: object) { super(options); }
}

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

   describe('Resolution', () =>
   {
      describe('Basic', () =>
      {
         describe('direct parent', () =>
         {
            let resolver: StyleSheetResolve;

            const styleMap: Map<string, {}> = new Map([
               ['.source', {'background-color': 'var(--parent)'}],
               ['.parent', {'--parent': 'red'}]
            ]);

            const mergeMap: Map<string, {}> = new Map([
               ['.source', {'background-color': 'var(--parent)'}],
               ['.parent', {'--parent': 'blue'}]
            ]);

            const extraMap: Map<string, {}> = new Map([
               ['.foo', {'color': 'var(--parent)'}]
            ]);

            beforeEach(() => resolver = StyleSheetResolve.parse(styleMap));

            it('get() (can resolve [])', () =>
            {
               const result = resolver.get('.source', {resolve: ['.parent']});

               expect(stringify(result)).toMatchInlineSnapshot(`
                 "{
                   "background-color": "red"
                 }"
               `);
            });

            it('get() (can resolve Set)', () =>
            {
               const result = resolver.get('.source', {resolve: new Set(['.parent'])});

               expect(stringify(result)).toMatchInlineSnapshot(`
                 "{
                   "background-color": "red"
                 }"
               `);
            });

            it('get() (multiple selectors)', () =>
            {
               const result = resolver.get(['.source', '.parent']);

               expect(stringify(result)).toMatchInlineSnapshot(`
                 "{
                   "background-color": "var(--parent)",
                   "--parent": "red"
                 }"
               `);
            });

            it('get() (camelCase)', () =>
            {
               const result = resolver.get('.source', {camelCase: true});

               expect(stringify(result)).toMatchInlineSnapshot(`
                 "{
                   "backgroundColor": "var(--parent)"
                 }"
               `);
            });

            it('get() (camelCase / does not convert CSS variable key name)', () =>
            {
               const result = resolver.get(['.source', '.parent'], {camelCase: true});

               expect(stringify(result)).toMatchInlineSnapshot(`
                 "{
                   "backgroundColor": "var(--parent)",
                   "--parent": "red"
                 }"
               `);
            });

            it('getProperty() (can resolve string)', () =>
            {
               const result = resolver.getProperty('.source', 'background-color', {resolve: '.parent'});
               expect(result).toBe('red');
            });

            it('getProperty() (undefined result)', () =>
            {
               const result = resolver.getProperty('.source', 'BOGUS');
               expect(result).toBe(void 0);
            });

            it('merge() (override)', () =>
            {
               resolver.merge(StyleSheetResolve.parse(mergeMap));

               const result = resolver.get('.source', {resolve: ['.parent']});

               expect(stringify(result)).toMatchInlineSnapshot(`
                 "{
                   "background-color": "blue"
                 }"
               `);
            });

            it('merge() (exactMatch=true)', () =>
            {
               expect([...resolver.keys()]).toEqual([...styleMap.keys()]);

               resolver.merge(StyleSheetResolve.parse(extraMap), {exactMatch: true});

               expect([...resolver.keys()]).toEqual([...styleMap.keys()]);
            });

            it('merge() (preserve)', () =>
            {
               resolver.merge(StyleSheetResolve.parse(mergeMap), {strategy: 'preserve'});

               const result = resolver.get('.source', {resolve: ['.parent']});

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
               ['.source', {color: 'var(--b)'}],
               ['.p1', {'--b': 'var(--a)'}],
               ['.p2', {'--a': 'blue'}]
            ]);

            beforeEach(() => resolver = StyleSheetResolve.parse(styleMap));

            it('get() (can resolve)', () =>
            {
               const result = resolver.get('.source', {resolve: ['.p1', '.p2']});

               expect(stringify(result)).toMatchInlineSnapshot(`
                 "{
                   "color": "blue"
                 }"
               `);
            });

            it('get() (depth 1)', () =>
            {
               const result = resolver.get('.source', {depth: 1, resolve: ['.p1', '.p2']});

               // Does not resolve as `depth: 1` stops early.
               expect(stringify(result)).toMatchInlineSnapshot(`
                 "{
                   "color": "var(--a)"
                 }"
               `);
            });
         });
      });

      describe('Complex', () =>
      {
         let resolver: StyleSheetResolve;

         beforeEach(() => resolver = StyleSheetResolve.parse(styleMap));

         const styleMap: Map<string, {}> = new Map([
            ['.source-a', {
               color: 'var(--a)',
               'box-shadow': '0 0 4px var(--shadow-color)',
               'border-radius': 'var(--radius)',
               padding: 'var(--padding)',
               border: 'var(--border)'
            }],
            ['.source-b', {
               'background-color': 'var(--nonexistent, lightgray)',
               outline: '2px dashed var(--focus-color, red)',
               margin: '8px'
            }],
            ['.root-theme', {
               '--a': 'var(--b)',
               '--shadow-color': 'black',
               '--radius': '4px'
            }],
            ['.theme-1', {
               '--b': 'var(--c, var(--alt-c, blue))',
               '--alt-c': 'teal'
            }],
            ['.theme-2', {
               '--c': 'var(--d)'
            }],
            ['.theme-3', {
               '--d': 'var(--e)',
               '--unused': 'var(--ghost, gray)'
            }],
            ['.theme-4', {
               '--e': 'orange'
            }],
            ['.shared', {
               '--padding': '12px',
               '--border-color': 'teal',
               '--border': '1px solid var(--border-color, #ccc)'
            }]
         ]);

         it('individual source-a', () =>
         {
            const result = resolver.get('.source-a', {
               resolve: ['.root-theme', '.theme-1', '.theme-2', '.theme-3', '.theme-4', '.shared']
            });

            // color: --a → --b → --c → --d → --e → 'orange'
            // border: --border → var(--border-color, #ccc) → 'teal'
            // padding: --padding from .shared
            //
            // margin, borderRadius, boxShadow: resolved or literal

            expect(stringify(result)).toMatchInlineSnapshot(`
              "{
                "color": "orange",
                "box-shadow": "0 0 4px black",
                "border-radius": "4px",
                "padding": "12px",
                "border": "1px solid teal"
              }"
            `);
         });

         it('individual source-b', () =>
         {
            const result = resolver.get('.source-b', {
               resolve: ['.root-theme', '.theme-1', '.theme-2', '.theme-3', '.theme-4', '.shared']
            });

            // backgroundColor: --nonexistent not defined → 'lightgray'
            // outline: --focus-color not defined → fallback 'red'
            //
            // margin: literal

            expect(stringify(result)).toMatchInlineSnapshot(`
              "{
                "background-color": "var(--nonexistent, lightgray)",
                "outline": "2px dashed var(--focus-color, red)",
                "margin": "8px"
              }"
            `);
         });

         it('source-a + source-b', () =>
         {
            const result = resolver.get(['.source-a', '.source-b'], {
               resolve: ['.root-theme', '.theme-1', '.theme-2', '.theme-3', '.theme-4', '.shared']
            });

            // color: --a → --b → --c → --d → --e → 'orange'
            // padding: --padding from .shared
            // border: --border → var(--border-color, #ccc) → 'teal'
            // backgroundColor: --nonexistent not defined → 'lightgray'
            // outline: --focus-color not defined → fallback 'red'
            //
            // margin, borderRadius, boxShadow: resolved or literal

            expect(stringify(result)).toMatchInlineSnapshot(`
              "{
                "color": "orange",
                "box-shadow": "0 0 4px black",
                "border-radius": "4px",
                "padding": "12px",
                "border": "1px solid teal",
                "background-color": "var(--nonexistent, lightgray)",
                "outline": "2px dashed var(--focus-color, red)",
                "margin": "8px"
              }"
            `);
         });
      });

      describe('Fallbacks', () =>
      {
         it('no resolution', () =>
         {
            const resolve = new StyleSheetResolve();

            resolve.set('.source', { color: 'var(--x, blue)' });

            const result = resolve.get('.source');

            expect(result?.color).toBe('var(--x, blue)');
         });

         it('no resolution (chained)', () =>
         {
            const resolve = new StyleSheetResolve();

            resolve.set('.source', { color: 'var(--a, var(--b, var(--c, orange)))' });

            const result = resolve.get('.source');

            expect(result?.color).toBe('var(--a, var(--b, var(--c, orange)))');
         });

         it('w/ resolution', () =>
         {
            const resolve = new StyleSheetResolve();

            resolve.set('.source', { color: 'var(--x, blue)' });
            resolve.set('.p1', { '--x': 'red' });

            const result = resolve.get('.source', { resolve: '.p1' });

            expect(result?.color).toBe('red');
         });

         it('w/ calc resolution', () =>
         {
            const resolve = new StyleSheetResolve();

            resolve.set('.source', { color: 'calc(2rem + var(--x, 1rem))' });
            resolve.set('.p1', { '--x': '2rem' });

            const result = resolve.get('.source', { resolve: '.p1' });

            expect(result?.color).toBe('calc(2rem + 2rem)');
         });

         it('w/ resolution (indirect)', () =>
         {
            const resolve = new StyleSheetResolve();

            resolve.set('.source', { color: 'var(--a, blue)' });
            resolve.set('.p1', { '--a': 'var(--b, green)' });
            resolve.set('.p2', { '--b': 'red' });

            const result = resolve.get('.source', { resolve: ['.p1', '.p2'] });

            expect(result?.color).toBe('red');
         });

         it('chained resolution', () =>
         {
            const resolve = new StyleSheetResolve();

            resolve.set('.source', { color: 'var(--a, var(--b, green))' });
            resolve.set('.p1', { '--b': 'red' });

            const result = resolve.get('.source', { resolve: '.p1' });

            expect(result?.color).toBe('var(--a, red)');
         });

         it('deep fallback w/ 3rd resolved', () =>
         {
            const resolve = new StyleSheetResolve();

            resolve.set('.source', { color: 'var(--a, var(--b, var(--c, green)))' });
            resolve.set('.p1', { '--c': 'red' });

            const result = resolve.get('.source', { resolve: '.p1' });

            expect(result?.color).toBe('var(--a, var(--b, red))');
         });

         it('resolves at 2nd fallback', () =>
         {
            const resolve = new StyleSheetResolve();

            resolve.set('.source', { color: 'var(--a, var(--b, var(--c, pink)))' });
            resolve.set('.theme', { '--b': 'gray' });

            const result = resolve.get('.source', { resolve: '.theme' });

            expect(result?.color).toBe('var(--a, gray)');
         });

         it('multi-fallback w/ middle resolved var', () =>
         {
            const resolve = new StyleSheetResolve();

            resolve.set('.source', { color: 'var(--a, var(--b, var(--c, var(--d, var(--e, lime)))))' });

            resolve.set('.p1', { '--d': 'orchid' });
            resolve.set('.p2', {}); // intentionally empty.
            resolve.set('.p3', { '--b': 'var(--c)' });
            resolve.set('.p4', {}); // intentionally empty.
            resolve.set('.p5', { '--c': 'var(--d)' });

            const result = resolve.get('.source', { resolve: ['.p1', '.p2', '.p3', '.p4', '.p5'] });

            expect(result?.color).toBe('var(--a, orchid)');
         });

         it('deep chain no resolution', () =>
         {
            const resolve = new StyleSheetResolve();

            resolve.set('.source', { color: 'var(--v1, var(--v2, var(--v3, var(--v4, var(--v5, tomato)))))' });

            // All selectors define nothing resolvable
            resolve.set('.p1', {});
            resolve.set('.p2', {});
            resolve.set('.p3', {});
            resolve.set('.p4', {});
            resolve.set('.p5', {});

            const result = resolve.get('.source', {
               resolve: ['.p1', '.p2', '.p3', '.p4', '.p5']
            });

            expect(result?.color).toBe('var(--v1, var(--v2, var(--v3, var(--v4, var(--v5, tomato)))))');
         });
      });
   });

   describe('Parsing (CSSStyleSheet)', () =>
   {
      describe('CSSStyleRule', () =>
      {
         let sheet: CSSStyleSheet;

         beforeEach(() =>
         {
            sheet = new CSSStyleSheet();
            sheet.insertRule('.source { color: var(--a); }');
            sheet.insertRule('.parent { --a: red; }');
         });

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

         it('resolves parent w/ exiting rule override', () =>
         {
            sheet.insertRule('.parent { --a: blue; }');

            const resolver = StyleSheetResolve.parse(sheet);

            const result = resolver.get('.source', { resolve: ['.parent'] });

            expect(stringify(result)).toMatchInlineSnapshot(`
              "{
                "color": "blue"
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

         const mockLayerRule = new CSSLayerBlockRule();
         mockLayerRule.name = 'testing';
         mockLayerRule.insertRule('.source { color: var(--a); }');
         mockLayerRule.insertRule('.parent { --a: red; }');

         // @ts-expect-error  // Can push w/ `happy-dom`.
         baseSheet.cssRules.push(mockLayerRule);

         // `happy-dom` doesn't assign toStringTag for the mocked DOM API, but `CrossWindow` requires it for duck types.
         Object.defineProperty(Object.getPrototypeOf(baseSheet), Symbol.toStringTag, { value: 'CSSStyleSheet' });

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

         const mockLayerRule = new CSSLayerBlockRule();
         mockLayerRule.name = 'testing';

         const mockLayerRule2 = new CSSLayerBlockRule();
         mockLayerRule2.name = 'depth2';

         mockLayerRule2.insertRule('.source { color: var(--a); }');
         mockLayerRule2.insertRule('.parent { --a: red; }');

         // @ts-expect-error // Can push w/ `happy-dom`.
         mockLayerRule.cssRules.push(mockLayerRule2);
         // @ts-expect-error
         baseSheet.cssRules.push(mockLayerRule);

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

      describe('Relative Path URLs', () =>
      {
         const sheet = new CSSStyleSheet();

         sheet.insertRule(`
            .source {
               color: red;
               background: url(./images/bg.png);
               mask-image: url("/abs/path.png");
               --image-rel: url('../images/foo.png');
               --other-domain: url(http://some-other-domain.com/bar.png);
            }
         `);

         it('with baseHref', () =>
         {
            // Simulates `sheet` as if it is an inline stylesheet providing a base HREF value for sheet origin.
            const resolver = StyleSheetResolve.parse(sheet, { baseHref: 'http://localhost:8080/deeper/path/' });

            const result = resolver.get('.source');

            expect(stringify(result)).toMatchInlineSnapshot(`
              "{
                "color": "red",
                "background": "url(\\"/deeper/path/images/bg.png\\")",
                "mask-image": "url(\\"/abs/path.png\\")",
                "--image-rel": "url('/deeper/images/foo.png')",
                "--other-domain": "url(http://some-other-domain.com/bar.png)"
              }"
            `);
         });

         it('style sheet href', () =>
         {
            // By defining the CSSStyleSheet `href` which `happy-dom` does not the relative `url()` references are
            // resolved from this location.
            Object.defineProperty(sheet, 'href', { value: 'http://localhost:8080/styles/styles.css' });

            const resolver = StyleSheetResolve.parse(sheet);

            const result = resolver.get('.source');

            expect(stringify(result)).toMatchInlineSnapshot(`
              "{
                "color": "red",
                "background": "url(\\"/styles/images/bg.png\\")",
                "mask-image": "url(\\"/abs/path.png\\")",
                "--image-rel": "url('/images/foo.png')",
                "--other-domain": "url(http://some-other-domain.com/bar.png)"
              }"
            `);
         });

         it('with urlRewrite (false)', () =>
         {
            // Disables relative URL rewriting leaving `url()` values the same.
            const resolver = StyleSheetResolve.parse(sheet, { urlRewrite: false });

            const result = resolver.get('.source');

            expect(stringify(result)).toMatchInlineSnapshot(`
              "{
                "color": "red",
                "background": "url(\\"./images/bg.png\\")",
                "mask-image": "url(\\"/abs/path.png\\")",
                "--image-rel": "url('../images/foo.png')",
                "--other-domain": "url(http://some-other-domain.com/bar.png)"
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

         it('frozen', () =>
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

      describe('parse()', () =>
      {
         it('frozen', () =>
         {
            const resolver = new StyleSheetResolve();

            resolver.freeze();

            expect(() => resolver.parse(new Map())).to.throw(Error,
             `Cannot modify a frozen StyleSheetResolve instance.`);
         });

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

         it('options.baseHref (not string)', () =>
         {
            // @ts-expect-error
            expect(() => StyleSheetResolve.parse(new Map(), { baseHref: null })).to.throw(TypeError,
             `'baseHref' must be a string.`);
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

         it('options.urlRewrite (not boolean)', () =>
         {
            // @ts-expect-error
            expect(() => StyleSheetResolve.parse(new Map(), { urlRewrite: null })).to.throw(TypeError,
             `'urlRewrite' must be a boolean.`);
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
