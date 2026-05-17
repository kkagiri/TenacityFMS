/**
 * File:          .eslintrc.cjs (fms.frontend)
 * Purpose:       Extends CRA's eslintConfig with the design-system enforcement
 *                rules from PRD §4 (Design Language Enforcement).
 *
 * Notes:
 * - The base config is still declared in package.json (eslintConfig field).
 *   This file extends it via `extends: ["react-app"]`.
 * - Run via `npx eslint src --ext .js,.jsx`.
 */

module.exports = {
  root: false,
  extends: ["react-app", "react-app/jest"],
  rules: {
    // 4.1 — Ban new .css files inside src/. Relative imports ending in .css
    //       are by definition app-source CSS. External CSS from node_modules
    //       (DevExtreme themes, FontAwesome, ace-builds, etc.) still works
    //       because those paths don't start with "." . Pre-existing CSS
    //       files can be silenced individually with eslint-disable until
    //       they're migrated to SCSS.
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
      // The legacy entry-point CSS files still ship and are explicitly allowed
      // until Phase 4 follow-up converts them. Adding them here silences the
      // ban only for these specific imports.
      files: [
        "src/App.js",
        "src/index.js",
        "src/themes/**/*.js",
      ],
      rules: { "no-restricted-syntax": "off" },
    },
  ],
};
