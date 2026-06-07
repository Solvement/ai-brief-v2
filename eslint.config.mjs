import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

const appAndSrcFiles = ["app/**/*.{js,jsx,ts,tsx}", "src/**/*.{js,jsx,ts,tsx}"];
const scriptFiles = ["scripts/**/*.mjs"];

const ignoredPaths = [
  "**/node_modules/**",
  "**/.next/**",
  "**/out/**",
  "**/public/**",
  "**/content/**",
  "**/data/**",
  "**/brief-wiki/**",
  "**/samples/**",
  "**/logs/**",
  "**/.cache/**",
  "**/.codegraph/**",
  "**/.claude/**",
  "**/.agents/**",
  "**/.tmp-shots/**",
  "**/.backup-*/**",
  "**/coverage/**",
];

const appBaselineWarnRules = {
  "@typescript-eslint/ban-ts-comment": "warn",
  "@typescript-eslint/no-explicit-any": "warn",
  "@typescript-eslint/no-unused-vars": "warn",
  "no-empty": "warn",
  "prefer-const": "warn",
  "react-hooks/refs": "warn",
  "react-hooks/set-state-in-effect": "warn",
};

const scriptBaselineWarnRules = {
  "no-control-regex": "warn",
  "no-irregular-whitespace": "warn",
  "no-unreachable": "warn",
  "no-unused-vars": "warn",
  "no-useless-escape": "warn",
};

const appLanguageOptions = {
  ecmaVersion: "latest",
  sourceType: "module",
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
  },
  globals: {
    ...globals.browser,
    ...globals.node,
    ...globals.es2025,
    React: "readonly",
  },
};

const appTsConfigs = tseslint.configs.recommended.map((config) => ({
  ...config,
  files: appAndSrcFiles,
  languageOptions: {
    ...config.languageOptions,
    parserOptions: {
      ...appLanguageOptions.parserOptions,
      ...config.languageOptions?.parserOptions,
    },
    globals: {
      ...appLanguageOptions.globals,
      ...config.languageOptions?.globals,
    },
  },
}));

export default [
  {
    name: "ai-brief/ignores",
    ignores: ignoredPaths,
  },
  {
    name: "ai-brief/app-src/js-recommended",
    files: appAndSrcFiles,
    languageOptions: appLanguageOptions,
    rules: js.configs.recommended.rules,
  },
  ...appTsConfigs,
  {
    name: "ai-brief/app-src/react",
    files: appAndSrcFiles,
    languageOptions: appLanguageOptions,
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      react,
      "react-hooks": reactHooks,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...react.configs.flat["jsx-runtime"].rules,
      ...reactHooks.configs.flat.recommended.rules,
      ...appBaselineWarnRules,
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },
  {
    name: "ai-brief/scripts",
    files: scriptFiles,
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.es2025,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...scriptBaselineWarnRules,
      "no-console": "off",
    },
  },
];
