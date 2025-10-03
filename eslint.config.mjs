import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    files: ["**/*.js"],
    ignores: ["tests/**", "test-results/**", "playwright-report/**", "node_modules/**"],
    languageOptions: {
      globals: globals.browser,
      ecmaVersion: 2024,
      sourceType: "script" // Most of our code is script, not module
    },
    rules: {
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
      "no-console": "off", // We use console for debugging
      "no-undef": "warn", // Make this a warning instead of error
      "no-useless-escape": "off", // Allow escaped characters in regex
      "no-case-declarations": "off", // Allow declarations in case blocks
      "no-dupe-class-members": "warn" // Duplicate methods might be intentional
    }
  }
];
