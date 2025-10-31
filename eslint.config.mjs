// eslint.config.js (Flat Config)

import { defineConfig, globalIgnores } from 'eslint/config'
import reactHooks from 'eslint-plugin-react-hooks';

export default defineConfig([
  reactHooks.configs.flat.recommended,
  globalIgnores([
    '.next/**',
    'node_modules/**',
    'turbo/**',
    'vercel/**',
    'out/**',
    'build/**'
  ]),
]);[]