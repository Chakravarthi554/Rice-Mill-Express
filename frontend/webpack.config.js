const path = require('path');

module.exports = {
  // ... other config
  resolve: {
    fallback: {
      crypto: require.resolve('crypto-browserify'),
    },
  },
};