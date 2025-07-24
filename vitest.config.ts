import path          from 'node:path';

import {
   configDefaults,
   defineConfig }    from 'vitest/config';

export default defineConfig({
   test: {
      environment: 'happy-dom',
      exclude: [...configDefaults.exclude],
      include: ['./test/src/**/*.test.ts'],
      coverage: {
         include: ['src/**'],
         exclude: ['test/**', 'src/**/*.ts'],
         provider: 'v8',
         reporter: ['text', 'json', 'html']
      },
      alias: {
        "#runtime/": path.resolve(__dirname, "./src"),
      },
      reporters: ['default', 'html'],
      globals: true,
      testTimeout: 20000,
      server: {
         watch: {
            ignored: ['./test/fixture/**/*']
         }
      }
   }
});
