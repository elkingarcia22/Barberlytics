import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    // Las entradas del registro de documentación exportan un `DocEntry` junto a
    // pequeños componentes de demo; Fast Refresh no aplica ahí.
    files: ['src/docs/registry/**/*.{ts,tsx}', 'src/docs/components/knobValues.ts'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
])
