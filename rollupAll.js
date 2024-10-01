import fs                  from 'node:fs';

import commonjs            from '@rollup/plugin-commonjs';
import resolve             from '@rollup/plugin-node-resolve';
import { generateDTS }     from '@typhonjs-build-test/esm-d-ts';
import { importsExternal } from '@typhonjs-build-test/rollup-plugin-pkg-imports';
import { rollup }          from 'rollup';
import upath               from 'upath';

const sourcemap = true; // Defines whether source maps are generated.

// Bundle all top level external package exports.
const dtsPluginOptions = {
   bundlePackageExports: true,
   dtsReplace: { '/\\/\\/ <reference.*\\/>': '' } // Svelte v4 types currently add triple slash references.
};

const resolveOptions = { browser: true };

// -------------------------------------------------------------------------------------------------------------------

const rollupConfigs = [
   {
      input: {
         input: 'src/data/color/colord/index.js',
         plugins: [
            importsExternal(),
            resolve(resolveOptions),
            generateDTS.plugin(dtsPluginOptions)
         ]
      },
      output: {
         file: '_dist/data/color/colord/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         sourcemap
      }
   },
   {
      input: {
         input: 'src/data/compress/index.js',
         plugins: [
            importsExternal(),
            resolve(resolveOptions),
            generateDTS.plugin(dtsPluginOptions)
         ]
      },
      output: {
         file: '_dist/data/compress/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         sourcemap
      }
   },
   {
      input: {
         input: 'src/data/format/base64/index.js',
         plugins: [
            importsExternal(),
            resolve(resolveOptions),
            generateDTS.plugin(dtsPluginOptions)
         ]
      },
      output: {
         file: '_dist/data/format/base64/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         sourcemap
      }
   },
   {
      input: {
         input: 'src/data/format/json5/index.js',
         plugins: [
            commonjs(),
            importsExternal(),
            resolve(resolveOptions),
         ]
      },
      copyDTS: './src/data/format/json5/index.d.ts',
      output: {
         file: '_dist/data/format/json5/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         sourcemap
      }
   },
   {
      input: {
         input: 'src/data/format/msgpack/index.js',
         plugins: [
            importsExternal(),
            resolve(resolveOptions),
            generateDTS.plugin(dtsPluginOptions)
         ]
      },
      output: {
         file: '_dist/data/format/msgpack/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         sourcemap
      }
   },
   {
      input: {
         input: 'src/data/format/msgpack/compress/index.js',
         plugins: [
            importsExternal(),
            resolve(resolveOptions),
            generateDTS.plugin(dtsPluginOptions)
         ]
      },
      output: {
         file: '_dist/data/format/msgpack/compress/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         sourcemap
      }
   },
   {
      input: {
         input: 'src/data/format/unicode/index.js',
         plugins: [
            importsExternal()
         ]
      },
      copyDTS: './node_modules/@typhonjs-utils/unicode/dist-trl/index.d.ts',
      output: {
         file: '_dist/data/format/unicode/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         sourcemap
      }
   },
   {
      input: {
         input: 'src/data/struct/cache/quick-lru/index.js',
         plugins: [
            resolve(resolveOptions),
            generateDTS.plugin({
               ...dtsPluginOptions,
               checkDefaultPath: true,
               // Updates example code block.
               dtsReplace: {
                  "import QuickLRU from 'quick-lru'": "import { QuickLRU } from '#runtime/data/struct/cache/quick-lru'"
               }
            })
         ]
      },
      output: {
         file: '_dist/data/struct/cache/quick-lru/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         sourcemap
      }
   },
   {
      input: {
         input: 'src/data/struct/hash/array/index.js',
         plugins: [
            importsExternal()
         ]
      },
      copyDTS: './node_modules/@typhonjs-svelte/trie-search/dist-trl/hash/index.d.ts',
      output: {
         file: '_dist/data/struct/hash/array/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         sourcemap
      }
   },
   {
      input: {
         input: 'src/data/struct/search/trie/index.js',
         plugins: [
            importsExternal()
         ]
      },
      copyDTS: './node_modules/@typhonjs-svelte/trie-search/dist-trl/trie/index.d.ts',
      output: {
         file: '_dist/data/struct/search/trie/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         sourcemap
      }
   },
   {
      input: {
         input: 'src/data/struct/search/trie/query/index.js',
         plugins: [
            importsExternal()
         ]
      },
      copyDTS: './node_modules/@typhonjs-svelte/trie-search/dist-trl/query/index.d.ts',
      output: {
         file: '_dist/data/struct/search/trie/query/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         sourcemap
      }
   },

   {
      input: {
         input: 'src/math/gl-matrix/index.js',
         plugins: [
            importsExternal(),
            resolve(resolveOptions),
            generateDTS.plugin(dtsPluginOptions)
         ]
      },
      output: {
         file: '_dist/math/gl-matrix/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         sourcemap
      }
   },
   {
      input: {
         input: 'src/math/interpolate/index.js',
         plugins: [
            importsExternal(),
            resolve(resolveOptions),
            generateDTS.plugin(dtsPluginOptions)
         ]
      },
      output: {
         file: '_dist/math/interpolate/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         sourcemap
      }
   },
   {
      input: {
         input: 'src/math/physics/index.js',
         plugins: [
            importsExternal(),
            resolve(resolveOptions),
            generateDTS.plugin(dtsPluginOptions)
         ]
      },
      output: {
         file: '_dist/math/physics/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         sourcemap
      }
   },
   {
      input: {
         input: 'src/math/util/index.js',
         plugins: [
            importsExternal(),
            resolve(resolveOptions),
            generateDTS.plugin(dtsPluginOptions)
         ]
      },
      output: {
         file: '_dist/math/util/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         sourcemap
      }
   },

   {
      input: {
         input: 'src/plugin/manager/index.js',
         external: ['@typhonjs-plugin/manager/eventbus'],
         plugins: [
            importsExternal(),
            resolve(resolveOptions),
         ]
      },
      copyDTS: './node_modules/@typhonjs-plugin/manager/dist/manager/browser/index.d.ts',
      output: {
         file: '_dist/plugin/manager/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         paths: {
            '@typhonjs-plugin/manager/eventbus': '@typhonjs-svelte/runtime-base/plugin/manager/eventbus'
         },
         sourcemap
      }
   },
   {
      input: {
         input: 'src/plugin/manager/eventbus/index.js',
         external: ['@typhonjs-plugin/manager/*', '@typhonjs-svelte/runtime-base/*'],
         plugins: [
            importsExternal(),
            resolve(resolveOptions),
         ]
      },
      copyDTS: './node_modules/@typhonjs-plugin/manager/dist/eventbus/index.d.ts',
      output: {
         file: '_dist/plugin/manager/eventbus/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         sourcemap
      }
   },
   {
      input: {
         input: 'src/plugin/manager/eventbus/buses/index.js',
         external: ['@typhonjs-plugin/manager/eventbus'],
         plugins: [
            importsExternal(),
            resolve(resolveOptions),
         ]
      },
      copyDTS: './node_modules/@typhonjs-plugin/manager/dist/eventbus/buses/index.d.ts',
      output: {
         file: '_dist/plugin/manager/eventbus/buses/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         paths: {
            '@typhonjs-plugin/manager/eventbus': '@typhonjs-svelte/runtime-base/plugin/manager/eventbus'
         },
         sourcemap
      }
   },

   {
      input: {
         input: 'src/svelte/action/animate/index.js',
         plugins: [
            importsExternal(),
            resolve(resolveOptions),
            generateDTS.plugin(dtsPluginOptions)
         ]
      },
      output: {
         file: '_dist/svelte/action/animate/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         sourcemap
      }
   },
   {
      input: {
         input: 'src/svelte/action/dom/index.js',
         plugins: [
            importsExternal(),
            resolve(resolveOptions),
            generateDTS.plugin(dtsPluginOptions)
         ]
      },
      output: {
         file: '_dist/svelte/action/dom/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         sourcemap
      }
   },
   {
      input: {
         input: 'src/svelte/action/util/index.js',
         plugins: [
            importsExternal(),
            resolve(resolveOptions),
            generateDTS.plugin(dtsPluginOptions)
         ]
      },
      output: {
         file: '_dist/svelte/action/util/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         sourcemap
      }
   },
   {
      input: {
         input: 'src/svelte/animate/index.js',
         plugins: [
            importsExternal(),
            resolve(resolveOptions),
            generateDTS.plugin(dtsPluginOptions)
         ]
      },
      output: {
         file: '_dist/svelte/animate/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         sourcemap
      }
   },
   {
      input: {
         input: 'src/svelte/easing/index.js',
         plugins: [
            importsExternal(),
            resolve(resolveOptions),
            generateDTS.plugin(dtsPluginOptions)
         ]
      },
      output: {
         file: '_dist/svelte/easing/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         sourcemap
      }
   },
   {
      input: {
         input: 'src/svelte/store/dom/index.js',
         plugins: [
            importsExternal(),
            resolve(resolveOptions),
            generateDTS.plugin(dtsPluginOptions)
         ]
      },
      output: {
         file: '_dist/svelte/store/dom/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         sourcemap
      }
   },
   {
      input: {
         input: 'src/svelte/store/position/index.js',
         plugins: [
            importsExternal(),
            resolve(resolveOptions),
            generateDTS.plugin(dtsPluginOptions)
         ]
      },
      output: {
         file: '_dist/svelte/store/position/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         sourcemap
      }
   },
   {
      input: {
         input: 'src/svelte/store/reducer/index.js',
         plugins: [
            importsExternal(),
            resolve(resolveOptions),
            generateDTS.plugin(dtsPluginOptions)
         ]
      },
      output: {
         file: '_dist/svelte/store/reducer/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         sourcemap
      }
   },
   {
      input: {
         input: 'src/svelte/store/reducer/array-object/index.js',
         plugins: [
            importsExternal(),
            resolve(resolveOptions),
            generateDTS.plugin(dtsPluginOptions)
         ]
      },
      output: {
         file: '_dist/svelte/store/reducer/array-object/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         sourcemap
      }
   },
   {
      input: {
         input: 'src/svelte/store/web-storage/index.js',
         plugins: [
            importsExternal(),
            resolve(resolveOptions),
            generateDTS.plugin(dtsPluginOptions)
         ]
      },
      output: {
         file: '_dist/svelte/store/web-storage/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         sourcemap
      }
   },
   {
      input: {
         input: 'src/svelte/store/web-storage/msgpack/index.js',
         plugins: [
            importsExternal(),
            resolve(resolveOptions),
            generateDTS.plugin(dtsPluginOptions)
         ]
      },
      output: {
         file: '_dist/svelte/store/web-storage/msgpack/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         sourcemap
      }
   },
   {
      input: {
         input: 'src/svelte/store/writable-derived/index.js',
         plugins: [
            importsExternal(),
            resolve(resolveOptions),
            generateDTS.plugin({
               ...dtsPluginOptions,
               dtsReplace: {
                  ...dtsPluginOptions.dtsReplace,
                  // For now manually replace "type" to "export type"; see issue:
                  // https://github.com/PixievoltNo1/svelte-writable-derived/issues/24
                  '^type': 'export type'
               }
            })
         ]
      },
      output: {
         file: '_dist/svelte/store/writable-derived/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         sourcemap
      }
   },
   {
      input: {
         input: 'src/svelte/transition/index.js',
         plugins: [
            importsExternal(),
            resolve(resolveOptions),
            generateDTS.plugin(dtsPluginOptions)
         ]
      },
      output: {
         file: '_dist/svelte/transition/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         sourcemap
      }
   },
   {
      input: {
         input: 'src/svelte/util/index.js',
         plugins: [
            importsExternal(),
            resolve(resolveOptions),
            generateDTS.plugin(dtsPluginOptions)
         ]
      },
      output: {
         file: '_dist/svelte/util/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         sourcemap
      }
   },

   {
      input: {
         input: 'src/util/index.js',
         plugins: [
            importsExternal(),
            resolve(resolveOptions),
            generateDTS.plugin({ ...dtsPluginOptions, tsFileWalk: false })
         ]
      },
      output: {
         file: '_dist/util/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         sourcemap
      }
   },
   {
      input: {
         input: 'src/util/animate/index.js',
         plugins: [
            importsExternal(),
            resolve(resolveOptions),
            generateDTS.plugin(dtsPluginOptions)
         ]
      },
      output: {
         file: '_dist/util/animate/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         sourcemap
      }
   },
   {
      input: {
         input: 'src/util/async/index.js',
         plugins: [
            importsExternal(),
            resolve(resolveOptions),
            generateDTS.plugin(dtsPluginOptions)
         ]
      },
      output: {
         file: '_dist/util/async/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         sourcemap
      }
   },
   {
      input: {
         input: 'src/util/browser/index.js',
         plugins: [
            importsExternal(),
            resolve(resolveOptions),
            generateDTS.plugin(dtsPluginOptions)
         ]
      },
      output: {
         file: '_dist/util/browser/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         sourcemap
      }
   },
   {
      input: {
         input: 'src/util/dom/observer/resize/index.js',
         plugins: [
            importsExternal(),
            resolve(resolveOptions),
            generateDTS.plugin(dtsPluginOptions)
         ]
      },
      output: {
         file: '_dist/util/dom/observer/resize/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         sourcemap
      }
   },
   {
      input: {
         input: 'src/util/i18n/index.js',
         plugins: [
            importsExternal(),
            resolve(resolveOptions),
            generateDTS.plugin(dtsPluginOptions)
         ]
      },
      output: {
         file: '_dist/util/i18n/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         sourcemap
      }
   },
   {
      input: {
         input: 'src/util/loader-module/index.js',
         plugins: [
            importsExternal(),
            resolve(resolveOptions),
            generateDTS.plugin(dtsPluginOptions)
         ]
      },
      output: {
         file: '_dist/util/loader-module/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         sourcemap
      }
   },
   {
      input: {
         input: 'src/util/object/index.js',
         plugins: [
            importsExternal(),
            resolve(resolveOptions),
            generateDTS.plugin(dtsPluginOptions)
         ]
      },
      output: {
         file: '_dist/util/object/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         sourcemap
      }
   },
   {
      input: {
         input: 'src/util/store/index.js',
         plugins: [
            importsExternal(),
            resolve(resolveOptions),
            generateDTS.plugin(dtsPluginOptions)
         ]
      },
      output: {
         file: '_dist/util/store/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         sourcemap
      }
   }
];

for (const config of rollupConfigs)
{
   console.log(`Generating bundle: ${config.input.input}`);

   const bundle = await rollup(config.input);
   await bundle.write(config.output);
   await bundle.close();

   const copyDTS = config.copyDTS;
   const skipDTS = config.skipDTS ?? false;
   const dtsFile = config.dtsFile ?? config.output.file ?? config.file; // eslint-disable-line no-unused-vars
   const outFile = config.output.file ?? config.file;

   // Skip generating some DTS files.
   if (skipDTS)
   {
      console.warn(`Skipping TS Declaration: ${config.input.input}`);
      continue;
   }

   const outFileDTS = upath.changeExt(outFile, '.d.ts');

   if (copyDTS)
   {
      console.log(`Copying TS Declaration: ${copyDTS}`);

      let fileData = fs.readFileSync(copyDTS, 'utf-8');

      // For #runtime from external TRL libraries.
      fileData = fileData.replaceAll('#runtime/', '@typhonjs-svelte/runtime-base/');

      // For #svelte from external TRL libraries.
      fileData = fileData.replaceAll('#svelte', 'svelte');

      // For @typhonjs-plugin/manager
      fileData = fileData.replaceAll('@typhonjs-plugin/manager/eventbus',
       '@typhonjs-svelte/runtime-base/plugin/manager/eventbus');

      fs.writeFileSync(outFileDTS, fileData, 'utf-8');
   }
}
