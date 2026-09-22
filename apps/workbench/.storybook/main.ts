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
  }),
};

export default config;
