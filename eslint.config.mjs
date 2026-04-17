import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Allow intentionally-unused identifiers prefixed with `_`
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          args: "after-used",
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_|^e\\d*$",
          ignoreRestSiblings: true,
        },
      ],
      // The codebase relies on third-party `any`-shaped APIs (Supabase, OpenAI
      // streaming, dynamic JSON state). Treating these as build-blocking is
      // not pragmatic; we keep them as warnings to surface new ones in PRs.
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
    },
  },
];

export default eslintConfig;
