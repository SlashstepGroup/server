import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
      "no-useless-catch": "warn",
      "no-case-declarations": "warn",
      "no-unused-private-class-members": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "no-async-promise-executor": "warn"
    }
  }
);