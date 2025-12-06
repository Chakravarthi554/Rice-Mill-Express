// craco.config.js
const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // 1. THIS LINE FIXES ALL @mui/x-date-pickers "fully specified" errors
      webpackConfig.module.rules.push({
        test: /\.m?js$/,
        resolve: { fullySpecified: false },
      });

      // 2. Fix Node.js polyfills (required for many libraries like jspdf, qrcode, etc.)
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        buffer: require.resolve('buffer/'),
        process: require.resolve('process/browser'),
        stream: require.resolve('stream-browserify'),
        crypto: require.resolve('crypto-browserify'),
        util: require.resolve('util/'),
        assert: false,
        http: false,
        https: false,
        os: false,
        url: false,
        path: false,
        zlib: false,
      };

      // 3. Provide global variables
      webpackConfig.plugins.push(
        new webpack.ProvidePlugin({
          process: 'process/browser',
          Buffer: ['buffer', 'Buffer'],
        })
      );

      return webpackConfig;
    },
  },
};