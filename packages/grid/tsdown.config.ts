import type { UserConfig } from 'tsdown';

const config: UserConfig = {
  entry: ['src/index.ts'],
  format: 'esm',
  platform: 'neutral',
  dts: { generator: 'oxc' },
  sourcemap: true,
};

export default config;
