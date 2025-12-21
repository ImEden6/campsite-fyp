import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Ensure the TS parser resolves the correct tsconfig when ESLint is run from the repo root
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Point the TS parser at the actual package root that contains tsconfig.json
const tsconfigRootDir = __dirname

export default [
    {
        ignores: ['dist/**', 'node_modules/**']
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            ecmaVersion: 2020,
            sourceType: 'module',
            parser: tseslint.parser,
            parserOptions: {
                tsconfigRootDir,
                project: ['./tsconfig.json']
            }
        },
        rules: {
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_'
                }
            ]
        }
    }
]
