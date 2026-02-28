const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @react-native-firebase v23 compatibility:
 * The postinstall script (scripts/patch-firebase-imports.js) creates .js redirect
 * files in @react-native-firebase/app/lib/ that point to dist/commonjs/.
 * Metro prefers .js over .ts, so all code shares the same compiled modules and
 * avoids the duplicate NAMESPACE_REGISTRY issue.
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
