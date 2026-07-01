const Module = require('module');
const originalRequire = Module.prototype.require;

// Intercept require calls to mock the 'bull' module globally
// This prevents Bull queues from opening real Redis connections during tests
Module.prototype.require = function(id) {
  if (id === 'bull') {
    // Return a mock Bull constructor
    return function MockBull(name, options) {
      return {
        add: () => Promise.resolve({ id: 'mock-job-id' }),
        process: () => {},
        on: () => {},
        close: () => Promise.resolve(),
        isReady: () => Promise.resolve(),
        pause: () => Promise.resolve(),
        resume: () => Promise.resolve(),
        getJob: () => Promise.resolve(null),
        getJobs: () => Promise.resolve([]),
      };
    };
  }
  return originalRequire.apply(this, arguments);
};
