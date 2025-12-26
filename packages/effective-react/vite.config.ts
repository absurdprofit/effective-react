import { defineConfig } from 'vitest/config';

// https://vitejs.dev/config/
export default defineConfig({
  test: {
    globals: true,
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    browser: {
      provider: 'playwright', // or 'webdriverio'
      enabled: true,
      name: 'chromium', // browser name is required
      headless: process.argv.includes('--run'),
    },
  }
});