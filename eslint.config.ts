import { globalIgnores } from "eslint/config";
import { defineConfigWithVueTs, vueTsConfigs } from "@vue/eslint-config-typescript";
import pluginVue from "eslint-plugin-vue";

export default defineConfigWithVueTs(
  {
    name: "app/files-to-lint",
    files: ["**/*.{ts,mts,tsx,vue}"],
    rules: {
      "semi": ["error", "always"],
      "no-unused-vars": ["off"],
      "@typescript-eslint/no-unused-vars": ["off"],
      "quotes": ["error", "double"],
    },
  },

  globalIgnores(["**/dist/**", "**/dist-ssr/**", "**/coverage/**"]),

  pluginVue.configs["flat/essential"],
  vueTsConfigs.recommended,

  {
    name: "app/files-to-lint",
    files: ["**/*.{ts,mts,tsx,vue}"],
    rules: {
      "semi": ["error", "always"],
      "no-unused-vars": ["off"],
      "@typescript-eslint/no-unused-vars": ["off"],
      "quotes": ["error", "double"],
    },
  },
);
