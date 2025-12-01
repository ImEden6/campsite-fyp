import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

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
      'preview-console.mjs'
    ]
  },

  // Base JavaScript and TypeScript recommended rules
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Project-specific configuration for TypeScript and React files
  {
    files: ['**/*.{ts,tsx}'],
    
    // Language configuration for ES2020 and module syntax
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      parser: tseslint.parser,
      parserOptions: {
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
