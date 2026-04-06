import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Ensure the TS parser resolves the correct tsconfig when ESLint is run from the repo root
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Point the TS parser at the actual package root that contains tsconfig.json
const tsconfigRootDir = __dirname

export default [
  // Global ignores - files and directories that should not be linted
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '*.config.js',
      '*.config.ts',
      'vite.config.ts',
      'postcss.config.js',
      'src/tests/**',
      'src/**/__tests__/**',
      'preview-console.mjs',
      'clean_fails.js',
      'extract-failures.js',
      'get_fails.js',
      'parse_fails.js',
    ],
  },

  // Base JavaScript and TypeScript recommended rules
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Project-specific configuration for TypeScript and React files
  // This must come after recommended configs to override parser options
  {
    files: ['**/*.{ts,tsx}'],
    
    // Language configuration for ES2020 and module syntax
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      parser: tseslint.parser,
      parserOptions: {
        // Explicitly set tsconfigRootDir to prevent auto-detection conflicts
        tsconfigRootDir,
        project: ['./tsconfig.json'],
        ecmaFeatures: {
          jsx: true
        }
      }
    },

    // Plugin configuration
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh
    },

    // Rule configuration
    rules: {
      // React Hooks rules - enforce Rules of Hooks
      ...reactHooks.configs.recommended.rules,

      // React Refresh rules - warn on non-component exports
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true }
      ],

      // TypeScript-specific rules - allow unused vars with underscore prefix
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_'
        }
      ]
    }
  },

  // Configuration for Node.js scripts in the scripts directory
  // These files use CommonJS and need Node.js globals
  {
    files: ['scripts/**/*.js'],
    
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'commonjs',
      globals: {
        // Node.js globals
        console: 'readonly',
        process: 'readonly',
        require: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        module: 'readonly',
        exports: 'writable'
      }
    },

    rules: {
      // Allow require() for CommonJS modules
      '@typescript-eslint/no-require-imports': 'off'
    }
  }
]
