import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'dist-lib', 'public/mockServiceWorker.js', 'playwright-report', 'test-results']),
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
    // Deuda heredada del proyecto de origen: los componentes copiados usan
    // patrones que las reglas nuevas de react-hooks marcan (setState en
    // efectos, refs durante el render, `any` puntual). Se dejan como
    // advertencia para no reescribir semántica sin pruebas; al migrar cada
    // archivo, vuelve a subirlas a error. El código nuevo (app, features,
    // lib/api, lib/query, themes, mocks) sí las tiene como error.
    files: ['src/components/**/*.{ts,tsx}', 'src/lib/use*.ts', 'src/config/**/*.ts', 'src/hooks/**/*.ts'],
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      'react-refresh/only-export-components': 'warn',
    },
  },
  {
    // Las entradas del registro de documentación exportan un `DocEntry` junto a
    // pequeños componentes de demo; Fast Refresh no aplica ahí.
    files: ['src/docs/registry/**/*.{ts,tsx}', 'src/docs/components/knobValues.ts', 'src/test/**/*.{ts,tsx}'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
])
