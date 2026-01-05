import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'
import reactCompiler from 'eslint-plugin-react-compiler'
console.log(reactCompiler.configs.recommended)

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      reactCompiler.configs.recommended
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      'no-magic-numbers': [
        'error',
        {
          'ignoreArrayIndexes': true, // Ignores numbers used as array indices
          'enforceConst': true, // Enforces that numbers be declared as constants
          'detectObjects': true, // Ignores numbers in object properties
        },
      ],
      '@typescript-eslint/explicit-member-accessibility': [
        'error',
        {
          accessibility: 'explicit',
          overrides: { constructors: 'off' },
        },
      ],
      'operator-linebreak': [
        'error',
        'before',
        { overrides: { '&&': 'before', '=': 'after' } },
      ],
      'object-curly-spacing': ['error', 'always'],
      quotes: ['error', 'single'],
      semi: ['error', 'always'],
      indent: ['error', 2, { SwitchCase: 1 }],
      'comma-dangle': [
        'error',
        {
          arrays: 'always-multiline',
          objects: 'always-multiline',
        },
      ],
    },
  },
  {
    files: ['**/constants.ts', '**/*.config.*s', '**/enums.ts'],
    // Override or add rules here
    rules: {
      'no-magic-numbers': 'off',
    },
  }
])
