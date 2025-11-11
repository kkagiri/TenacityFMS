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
    sass: {
      loaderOptions: {
        sourceMap: false, // Disable to avoid Windows path issues
      },
    },
  },
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // Fix resolve-url-loader source map issues by disabling it
      const oneOfRule = webpackConfig.module.rules.find((rule) => rule.oneOf);

      if (oneOfRule) {
        oneOfRule.oneOf.forEach((rule) => {
          if (rule.test && rule.test.toString().includes("scss|sass")) {
            if (rule.use && Array.isArray(rule.use)) {
              // Remove resolve-url-loader entirely to avoid source map issues on Windows
              rule.use = rule.use.filter((loader) => {
                if (typeof loader === "string") return true;
                if (!loader.loader) return true;
                return !loader.loader.includes("resolve-url-loader");
              });

              // Ensure sass-loader has proper source map settings
              rule.use.forEach((loader) => {
                if (loader.loader && loader.loader.includes("sass-loader")) {
                  loader.options = {
                    ...loader.options,
                    sourceMap: false, // Disable source maps to avoid mapping errors
                  };
                }
              });
            }
          }
        });
      }

      // Remove the ModuleScopePlugin
      webpackConfig.resolve.plugins = webpackConfig.resolve.plugins.filter(
        (plugin) =>
          !(plugin instanceof require("react-dev-utils/ModuleScopePlugin"))
      );

      // Add support for importing files from outside of src/
      webpackConfig.resolve.modules.push(path.resolve(__dirname, "src"));

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
