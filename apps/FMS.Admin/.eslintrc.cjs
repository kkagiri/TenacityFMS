/**
 * File:          .eslintrc.cjs (FMS.Admin)
 * Purpose:       PRD §4 design-language enforcement for the operator portal.
 *                FMS.Admin currently relies on `tsc --noEmit` for lint (see
 *                package.json#scripts.lint) — ESLint is not yet wired up. This
 *                config is here so when ESLint is installed (npm i -D eslint
 *                @typescript-eslint/parser @typescript-eslint/eslint-plugin)
 *                the rules from the PRD activate automatically.
 *
 * Run (once deps are installed):
 *   npx eslint src --ext .ts,.tsx
 */

module.exports = {
  root: false,
  parser: "@typescript-eslint/parser",
  parserOptions: { ecmaVersion: 2022, sourceType: "module" },
  rules: {
    // 4.1 — Ban new relative .css imports inside src/. SCSS-only policy.
    "no-restricted-syntax": [
      "warn",
      {
        selector:
          "ImportDeclaration[source.value=/^\\./][source.value=/\\.css$/]",
        message:
          "PRD §4: SCSS only — do not import new .css files inside src/. Convert to .scss and use design tokens.",
      },
    ],
  },
  overrides: [
    {
      files: ["src/main.tsx"],
      rules: {
        // main.tsx imports the FontAwesome stylesheet by relative path —
        // that's an externally-vended CSS asset, not new app CSS.
        "no-restricted-syntax": "off",
      },
    },
  ],
};
