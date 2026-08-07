import { defineConfig } from 'oxlint';

export default defineConfig({
  plugins: ['typescript', 'vue', 'import', 'unicorn', 'oxc'],
  categories: {
    correctness: 'error',
    suspicious: 'warn',
    perf: 'warn',
  },
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  ignorePatterns: [
    'dist',
    'dist-ssr',
    'src-tauri/target',
    'src-tauri/gen',
    'node_modules',
    '*.d.ts',
  ],
  rules: {
    'eslint/no-console': ['warn', { allow: ['warn', 'error'] }],
    'eslint/no-debugger': 'error',
    'eslint/eqeqeq': ['error', 'smart'],
    'eslint/prefer-const': 'error',
    'eslint/no-var': 'error',

    'typescript/no-explicit-any': 'warn',
    'typescript/no-unused-vars': 'warn',
    'typescript/consistent-type-definitions': ['error', 'interface'],
    'typescript/array-type': ['error', { default: 'array' }],
    'typescript/no-non-null-assertion': 'warn',

    'vue/no-dupe-keys': 'error',
    'vue/no-required-prop-with-default': 'warn',
    'vue/no-reserved-component-names': 'error',
    'vue/no-reserved-props': 'error',
    'vue/define-props-declaration': 'error',
    'vue/prefer-import-from-vue': 'error',
    'vue/valid-define-props': 'error',

    'import/no-cycle': 'error',
    'import/no-duplicates': 'error',

    'unicorn/no-null': 'off',
  },
  overrides: [
    {
      files: ['vite.config.ts', '*.config.ts'],
      rules: {
        'typescript/no-explicit-any': 'off',
      },
    },
  ],
});
