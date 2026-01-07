import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

// https://vitejs.dev/config/
export default defineConfig({
  test: {
    globals: true,
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    // browser: {
    //   provider: playwright(),
    //   enabled: true,
    //   instances: [
    //     { browser: 'chromium' },
    //   ],
    //   headless: process.argv.includes('--run'),
    // },
  },
});