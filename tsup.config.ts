import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  minify: false,
  splitting: false,
  treeshake: true,
  target: 'es2025',
  outDir: 'dist',
  banner: {
    js: '// avro-phonetic — MIT/MPL-2.0 — https://github.com/subhesadek/avro-phonetic',
  },
});
