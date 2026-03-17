import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  target: 'node18',
  clean: true,
  sourcemap: true,
  dts: false,
  outDir: 'dist',
  noExternal: [],
});
