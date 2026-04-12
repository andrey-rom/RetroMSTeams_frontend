import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import prettierPlugin from "eslint-plugin-prettier";
import importPlugin from "eslint-plugin-import";
import unusedImports from "eslint-plugin-unused-imports";
import svgJsx from "eslint-plugin-svg-jsx";
import perfectionist from "eslint-plugin-perfectionist";

export default [
  { ignores: ["**/node_modules/**", "**/dist/**"] },
  perfectionist.configs["recommended-natural"],
  {
    rules: {
      "perfectionist/sort-exports": "off",
      "perfectionist/sort-imports": "off",
      "perfectionist/sort-interfaces": [
        "error",
        {
          groups: ["required-member", "optional-member"],
          ignoreCase: true,
          order: "asc",
        },
      ],
      "perfectionist/sort-jsx-props": "off",
      "perfectionist/sort-named-exports": "off",
      "perfectionist/sort-named-imports": "off",
      "perfectionist/sort-object-types": [
        "error",
        {
          groups: ["required-member", "optional-member"],
          ignoreCase: true,
          order: "asc",
        },
      ],
    },
  },
  {
    files: ["**/*.js", "**/*.jsx", "**/*.mjs", "**/*.cjs"],
    ...js.configs.recommended,
    rules: {
      "no-multiple-empty-lines": ["error", { max: 1, maxEOF: 0 }],
      "no-unused-vars": "error",
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser },
      parser: tseslint.parser,
      parserOptions: { EXPERIMENTAL_useProjectService: false },
      sourceType: "module",
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      "unused-imports": unusedImports,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.eslintRecommended.rules,
      "@typescript-eslint/no-unused-vars": "off",
      "no-multiple-empty-lines": ["error", { max: 1, maxEOF: 0 }],
      "no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
    },
  },
  {
    files: ["**/*.jsx", "**/*.tsx"],
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "react/jsx-newline": ["error", { prevent: true }],
      "react/jsx-no-useless-fragment": "warn",
      "react/jsx-sort-props": [
        "error",
        {
          callbacksLast: true,
          ignoreCase: true,
          reservedFirst: true,
          shorthandFirst: true,
        },
      ],
      "react/no-children-prop": "off",
      "react/react-in-jsx-scope": "off",
    },
    settings: { react: { version: "detect" } },
  },
  {
    files: ["**/*.js", "**/*.jsx", "**/*.ts", "**/*.tsx", "**/*.mjs", "**/*.cjs"],
    plugins: {
      import: importPlugin,
      prettier: prettierPlugin,
      "svg-jsx": svgJsx,
    },
    rules: {
      curly: ["error", "all"],
      "import/no-unresolved": "off",
      "import/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index", "object", "type"],
          pathGroups: [
            { group: "external", pattern: "react", position: "before" },
            {
              group: "external",
              pattern: "react-router-dom",
              position: "before",
            },
            { group: "internal", pattern: "@/**", position: "after" },
          ],
          pathGroupsExcludedImportTypes: ["builtin"],
        },
      ],
      "padding-line-between-statements": [
        "error",
        { blankLine: "always", next: "*", prev: "import" },
        { blankLine: "any", next: "import", prev: "import" },
        { blankLine: "always", next: "export", prev: "*" },
        { blankLine: "always", next: "*", prev: "export" },
        { blankLine: "any", next: "export", prev: "export" },
        { blankLine: "always", next: "*", prev: ["const", "let"] },
        { blankLine: "any", next: ["const", "let"], prev: ["const", "let"] },
        { blankLine: "always", next: "function", prev: "*" },
        { blankLine: "always", next: "return", prev: "*" },
      ],
      "prettier/prettier": ["error", { bracketSameLine: false, endOfLine: "auto", printWidth: 120 }],
      "react/display-name": "off",
      "svg-jsx/camel-case-colon": "error",
      "svg-jsx/camel-case-dash": "error",
      "svg-jsx/no-style-string": "error",
    },
  },
];
