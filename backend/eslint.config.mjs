import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    // Global ignores
    {
        ignores: [
            'dist/**',
            'node_modules/**',
            '*.config.js',
            '*.config.ts',
            '*.config.mjs',
            'coverage/**',
            'uploads/**',
            'prisma/**',
            'src/**/__tests__/**',
            'tests/**',
            'test-*.ts',
            'test-*.js'
        ]
    },
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['src/**/*.ts'],
        languageOptions: {
            ecmaVersion: 2020,
            sourceType: 'module',
            parser: tseslint.parser,
            parserOptions: {
                project: ['./tsconfig.json'],
                tsconfigRootDir: import.meta.dirname
            }
        },
        rules: {
            // Direct rules translation from .eslintrc.json
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/no-require-imports': 'off'
        }
    },
    {
        // CommonJS compatibility for config files if needed (though we use ESM imports here)
        files: ['**/*.js'],
        languageOptions: {
            sourceType: 'commonjs'
        }
    }
);
