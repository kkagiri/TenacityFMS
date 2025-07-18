const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  style: {
    postcss: {
      loaderOptions: {
        postcssOptions: {
          plugins: [require("tailwindcss"), require("autoprefixer")],
        },
      },
    },
  },
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // Remove the ModuleScopePlugin
      webpackConfig.resolve.plugins = webpackConfig.resolve.plugins.filter(
        (plugin) =>
          !(plugin instanceof require("react-dev-utils/ModuleScopePlugin"))
      );

      // Add support for importing files from outside of src/
      webpackConfig.resolve.modules.push(path.resolve(__dirname, 'src'));

      // Copy FontAwesome assets and web.config to build folder
      webpackConfig.plugins.push(
        new CopyWebpackPlugin({
          patterns: [
            {
              from: path.resolve(__dirname, "src", "assests", "fontawesome"),
              to: path.resolve(paths.appBuild, "assets", "fontawesome"),
              noErrorOnMissing: true,
            },
            {
              from: path.resolve(__dirname, "public", "web.config"),
              to: path.resolve(paths.appBuild, "web.config"),
            },
          ],
        })
      );

      return webpackConfig;
    },
  },
};
