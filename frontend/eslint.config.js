// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import js from "@eslint/js";
import globals from "globals";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";
import vitest from "@vitest/eslint-plugin";
import importPlugin from "eslint-plugin-import";
import testingLibrary from "eslint-plugin-testing-library";
import unusedImports from "eslint-plugin-unused-imports";
import { configs } from "typescript-eslint";
import { jsdoc } from "eslint-plugin-jsdoc";

export default defineConfig([
  globalIgnores(["coverage/**", "dist", "playwright-report/**", "src/api/generated/**", "storybook-static/**", "test-results/**"]),
  jsdoc({
    config: "flat/recommended",
    rules: {
      "jsdoc/check-values": [
        "error",
        {
          allowedLicenses: ["MIT", "ISC"],
        },
      ],
      "jsdoc/require-jsdoc": [
        "error",
        {
          publicOnly: true,
          require: {
            FunctionDeclaration: true,
            MethodDefinition: true,
            ClassDeclaration: true,
            ArrowFunctionExpression: false,
          },
        },
      ],
      "jsdoc/require-description": "error",
      "jsdoc/require-param": "off",
      "jsdoc/require-returns": "off",
      "jsdoc/require-param-description": "off",
      "jsdoc/require-returns-description": "off",
    },
    settings: {
      structuredTags: {
        see: {
          name: "namepath-referencing",
          required: ["name"],
        },
      },
    },
  }),
  {
    plugins: {
      vitest,
      "unused-imports": unusedImports,
      "jsx-a11y": jsxA11y,
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      configs.recommendedTypeChecked,
      importPlugin.flatConfigs.recommended,
      importPlugin.flatConfigs.typescript,
    ],
    settings: {
      "import/resolver": {
        typescript: true,
        node: true,
      },
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      "no-console": "warn",
      "no-debugger": "error",
      camelcase: ["warn", { properties: "never" }],
      "@typescript-eslint/switch-exhaustiveness-check": "warn",
      "import/order": [
        "error",
        {
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
      "jsx-a11y/alt-text": "error",
    },
  },
  {
    files: [
      "**/*.test.{ts,tsx}",
      "**/*.spec.{ts,tsx}",
      "**/__tests__/**/*.{ts,tsx}",
      "**/tests/**/**/*.{ts,tsx}",
    ],
    ...testingLibrary.configs["flat/react"],
    rules: {
      ...vitest.configs.recommended.rules,
      "@typescript-eslint/no-unsafe-call": "off",
      "vitest/max-nested-describe": ["error", { max: 3 }],
      "vitest/no-focused-tests": "error",
      "vitest/no-disabled-tests": "warn",
      "import/order": "off",
    },
    settings: {
      vitest: { typecheck: true },
    },
    languageOptions: { globals: { ...vitest.environments.env.globals } },
  },
  ...storybook.configs["flat/recommended"],
]);
