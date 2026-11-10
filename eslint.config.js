// @ts-check
import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/coverage/**',
      'legacy/**',
      'docs/**',
      'pnpm-lock.yaml',
      '**/*.html',
      '**/*.css',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/scripts/**/*.mjs'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        URL: 'readonly',
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // react 包的 hooks 依赖完整性检查（组件内已有针对性 disable 注释）
    files: ['packages/react/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  {
    // 小程序展示宿主：CJS require 与 Page/wx/setTimeout 为小程序运行时全局
    files: ['packages/wechat/demo/**/*.{js,ts}'],
    languageOptions: {
      globals: {
        require: 'readonly',
        module: 'writable',
        Page: 'readonly',
        App: 'readonly',
        Component: 'readonly',
        wx: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        getCurrentPages: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
)
