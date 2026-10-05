import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

// Dependency rules from ARCHITECTURE.md section 3. Each layer lists the layers
// it must not import. A layer is matched by its alias (@/data/...) and by any
// relative path that passes through its folder name (../../data/...).
const layerPaths = (layer) => [
  `@/${layer}`,
  `@/${layer}/**`,
  `**/${layer}`,
  `**/${layer}/**`,
]

const forbid = (layers, message, extra = []) => ({
  '@typescript-eslint/no-restricted-imports': [
    'error',
    {
      patterns: [
        ...layers.map((layer) => ({ group: layerPaths(layer), message })),
        ...extra,
      ],
    },
  ],
})

export default tseslint.config(
  { ignores: ['dist', 'coverage'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
    },
  },
  {
    files: ['src/domain/**/*.{ts,tsx}'],
    rules: forbid(
      [],
      'domain imports nothing else from src/ and never React (ARCHITECTURE.md section 3).',
      [
        {
          group: ['@/**', '../**'],
          message:
            'domain imports nothing else from src/ (ARCHITECTURE.md section 3).',
        },
        {
          group: ['react', 'react/**', 'react-dom', 'react-dom/**'],
          message: 'domain is pure TypeScript and never imports React.',
        },
      ],
    ),
  },
  {
    files: ['src/data/**/*.{ts,tsx}'],
    rules: forbid(
      ['app', 'features', 'components', 'lib'],
      'data imports domain only (ARCHITECTURE.md section 3).',
      [
        {
          group: ['react', 'react/**', 'react-dom', 'react-dom/**'],
          message: 'data is not UI code and does not import React.',
        },
      ],
    ),
  },
  {
    files: ['src/lib/**/*.{ts,tsx}'],
    rules: forbid(
      ['app', 'data', 'features', 'components'],
      'lib sits below features and components and may import domain types only.',
      [
        {
          // Type imports are allowed; a value import from domain is not.
          group: ['@/domain', '@/domain/**'],
          allowTypeImports: true,
          message: 'lib may import domain types only (use `import type`).',
        },
      ],
    ),
  },
  {
    files: ['src/components/**/*.{ts,tsx}'],
    rules: forbid(
      ['app', 'data', 'features'],
      'components imports nothing from features or data (ARCHITECTURE.md section 3).',
    ),
  },
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: forbid(
      ['app', 'data'],
      'features never import data or app. Get the repository with useClaimsRepository() from @/lib/claimsRepository.',
    ),
  },
  prettier,
)
