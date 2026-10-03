import type { StorybookConfig } from '@storybook/react-vite';
import { defaultClientConditions } from 'vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.tsx'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y', '@storybook/addon-vitest'],
  framework: '@storybook/react-vite',
  core: { disableTelemetry: true },
  // Resolve workspace packages to their TypeScript source, so the workbench
  // never runs against a stale build.
  viteFinal: (config) => ({
    ...config,
    resolve: { ...config.resolve, conditions: ['@rockaway/source', ...defaultClientConditions] },
    build: {
      ...config.build,
      rolldownOptions: {
        ...config.build?.rolldownOptions,
        // Components begin with `'use client'` for server-component apps. The
        // workbench is all client, so the bundler dropping it is correct here.
        onLog(level, log, handler) {
          if (log.code === 'MODULE_LEVEL_DIRECTIVE') return;
          const inherited = config.build?.rolldownOptions?.onLog;
          if (inherited) inherited(level, log, handler);
          else handler(level, log);
        },
      },
    },
  }),
};

export default config;
