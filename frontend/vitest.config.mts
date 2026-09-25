import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  oxc: { jsx: { runtime: 'automatic' }, tsconfigRaw: { compilerOptions: { jsx: 'react-jsx' } } },
  test: { include: ['test/**/*.test.{ts,tsx}'], environment: 'node' },
});
