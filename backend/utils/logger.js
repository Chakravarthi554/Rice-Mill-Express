const winston = require('winston');

// Custom format with timestamp, level, and message
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    const msg = stack || message;
    return `[${timestamp}] ${level.toUpperCase()}: ${msg}`;
  })
);

// Console transport (for development)
const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize(),
    customFormat
  )
});

// Create logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: customFormat,
  transports: [consoleTransport],
  exceptionHandlers: [consoleTransport],
  rejectionHandlers: [consoleTransport]
});

// Add fallback for missing methods (safety)
['info', 'error', 'warn', 'debug'].forEach(level => {
  if (typeof logger[level] !== 'function') {
    logger[level] = console.log;
  }
});

module.exports = logger;