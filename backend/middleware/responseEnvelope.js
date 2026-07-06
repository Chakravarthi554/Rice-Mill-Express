/**
 * Response Envelope Middleware
 * 
 * Standardizes all API responses to a consistent format:
 * {
 *   success: boolean,
 *   data: any,
 *   message: string,
 *   meta: object (optional, for pagination etc.)
 * }
 */
const responseEnvelope = (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = (body) => {
    // Skip if the response is already wrapped in our envelope
    if (body && typeof body === 'object' && body._enveloped) {
      delete body._enveloped;
      return originalJson(body);
    }

    // Skip for health checks, swagger, static files, AND socket.io handshake requests
    if (req.originalUrl.includes('/health') ||
        req.originalUrl.includes('/api-docs') ||
        req.originalUrl.includes('/swagger') ||
        req.originalUrl.includes('/socket.io') ||
        req.originalUrl.includes('/status-socket.io')) {
      return originalJson(body);
    }

    const statusCode = res.statusCode;
    const isSuccess = statusCode >= 200 && statusCode < 300;

    // If body is already in { success, data } format, pass through
    if (body && typeof body === 'object' && 'success' in body && 'data' in body) {
      return originalJson(body);
    }

    // If body has a message field and error status, treat as error
    if (!isSuccess && body && body.message) {
      return originalJson({
        success: false,
        message: body.message,
        errors: body.errors || undefined,
        data: null,
      });
    }

    // Wrap successful responses
    const wrapped = {
      success: isSuccess,
      data: isSuccess ? body : null,
      message: !isSuccess ? (body?.message || 'An error occurred') : 'OK',
    };

    // Preserve pagination meta if present
    if (body && body.meta) {
      wrapped.meta = body.meta;
      if (wrapped.data) {
        delete wrapped.data.meta;
      }
    }

    return originalJson(wrapped);
  };

  next();
};

module.exports = responseEnvelope;
