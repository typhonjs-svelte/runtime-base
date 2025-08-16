import {
   configDefaults,
   defineConfig }    from 'vitest/config';

export default defineConfig({
   test: {
      environment: 'happy-dom',
      exclude: [...configDefaults.exclude],
      include: ['./test/src/**/*.test.ts'],
      coverage: {
         include: ['src/util/dom/style/resolve/**'],
         exclude: ['test/**', 'src/**/*.d.ts'],
         provider: 'v8',
         reporter: ['text', 'json', 'html']
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
