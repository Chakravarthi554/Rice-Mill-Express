const path = require('path');

module.exports = function override(config, env) {
  // Add fallback for Node.js core modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    buffer: require.resolve('buffer/'),
    stream: require.resolve('stream-browserify'),
    crypto: require.resolve('crypto-browserify'),
  };

  // Ensure Buffer is available globally by modifying the runtime
  config.plugins = config.plugins || [];
  config.plugins.push({
    apply: (compiler) => {
      compiler.hooks.compilation.tap('BufferPolyfill', (compilation) => {
        compilation.hooks.afterOptimizeChunkAssets.tap('BufferPolyfill', () => {
          compilation.outputOptions.globalObject = 'this';
        });
      });
    },
  });

  return config;
};