import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { cssText } from './scripts/vite-css-text.mjs';

export default defineConfig({
  plugins: [cssText()],
  // The tests import src/ only; scanning the demo site for dependencies
  // makes the first run reload halfway through.
  optimizeDeps: { noDiscovery: true, include: ['axe-core'] },
  test: {
    // Real key presses go to whichever page has focus, so one file at a time.
    fileParallelism: false,
    include: ['src/components/**/*.test.js', 'src/core/**/*.test.js', 'src/ai/**/*.test.js', 'test/**/*.test.js'],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
      screenshotFailures: false
    }
  }
});
