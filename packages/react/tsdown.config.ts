import type { UserConfig } from 'tsdown';

const config: UserConfig = {
  entry: ['src/index.ts', 'src/paint/index.ts'],
  format: 'esm',
  platform: 'neutral',
  // isolatedDeclarations is on, so Oxc can emit declarations without the checker.
  dts: { generator: 'oxc' },
  sourcemap: true,
};

export default config;
