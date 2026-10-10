import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

const engine = (process.env.RK_ENGINE ?? 'chromium') as 'chromium' | 'firefox' | 'webkit';

export default defineConfig({
  test: {
    include: ['scratch/**/*.measure.ts'],
    testTimeout: 120_000,
    browser: {
      enabled: true,
      headless: true,
      viewport: { width: 1600, height: 1200 },
      provider: playwright({
        contextOptions: {
          viewport: { width: 1600, height: 1200 },
          deviceScaleFactor: Number(process.env.RK_DPR ?? 1),
        },
      }),
      instances: [{ browser: engine }],
    },
  },
});
