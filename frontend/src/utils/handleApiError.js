export const handleApiError = (error) => {
  // Enhanced logging for debugging
  if (error.response) {
    // The request was made and the server responded with a status code
    console.error('🔴 API Error Response:', {
      status: error.response.status,
      data: error.response.data,
      url: error.config?.url,
      method: error.config?.method
    });

    const { status, data } = error.response;

    // Handle specific status codes with detailed messages
    switch (status) {
      case 400:
        // Bad Request - validation errors or invalid input
        if (data.details) return data.details;
        if (data.message) return data.message;
        if (data.errors && Array.isArray(data.errors)) {
          return data.errors.join(', ');
        }
        return 'Bad request. Please check your input and try again.';
      
      case 401:
        // Unauthorized - authentication required
        if (data.message) return data.message;
        return 'Session expired. Please log in again.';
      
      case 403:
        // Forbidden - insufficient permissions
        if (data.message) return data.message;
        return 'You do not have permission to perform this action.';
      
      case 404:
        // Not Found - resource doesn't exist
        if (data.message) return data.message;
        return 'The requested resource was not found.';
      
      case 409:
        // Conflict - duplicate or conflicting data
        if (data.message) return data.message;
        return 'A conflict occurred. Please try again.';
      
      case 422:
        // Unprocessable Entity - validation errors
        if (data.errors && Array.isArray(data.errors)) {
          return data.errors.join(', ');
        }
        if (data.details) return data.details;
        if (data.message) return data.message;
        return 'Validation failed. Please check your input.';
      
      case 429:
        // Too Many Requests - rate limiting
        return 'Too many requests. Please wait a moment and try again.';
      
      case 500:
        // Internal Server Error
        if (data.message) return data.message;
        return 'Server error. Please try again later.';
      
      case 502:
      case 503:
      case 504:
        // Gateway/Service Unavailable
        return 'Service temporarily unavailable. Please try again later.';
      
      default:
        // Other status codes
        if (data.details) return data.details;
        if (data.message) return data.message;
        return `Request failed with status ${status}. Please try again.`;
    }
  } else if (error.request) {
    // The request was made but no response was received
    console.error('🔴 API No Response:', {
      request: error.request,
      url: error.config?.url,
      method: error.config?.method
    });
    
    // Check for specific network errors
    if (error.code === 'NETWORK_ERROR') {
      return 'Network error. Please check your internet connection.';
    }
    if (error.code === 'ECONNABORTED') {
      return 'Request timeout. Please check your connection and try again.';
    }
    
    return 'No response from server. Please check your internet connection or server status.';
  } else {
    // Something happened in setting up the request
    console.error('🔴 API Request Setup Error:', error.message);
    
    if (error.message?.includes('Network Error')) {
      return 'Network error. Please check your internet connection.';
    }
    if (error.message?.includes('timeout')) {
      return 'Request timeout. Please try again.';
    }
    
    return 'Request setup failed: ' + error.message;
  }
};

/**
 * Check if error is a network error
 * @param {Error} error - The error object
 * @returns {boolean} - True if it's a network error
 */
export const isNetworkError = (error) => {
  return !error.response || 
         error.code === 'NETWORK_ERROR' || 
         error.message?.includes('Network Error');
};

/**
 * Check if error is a timeout error
 * @param {Error} error - The error object
 * @returns {boolean} - True if it's a timeout error
 */
export const isTimeoutError = (error) => {
  return error.code === 'ECONNABORTED' || 
         error.message?.includes('timeout') ||
         (error.response?.status === 408);
};

/**
 * Check if error is an endpoint not found error
 * @param {Error} error - The error object
 * @returns {boolean} - True if it's a 404 error
 */
export const isEndpointNotFound = (error) => {
  return error.response?.status === 404 || 
         error.isEndpointNotFound;
};

/**
 * Check if error is an authentication error (401 or 403)
 * @param {Error} error - The error object
 * @returns {boolean} - True if it's an auth error
 */
export const isAuthError = (error) => {
  return error.response?.status === 401 || 
         error.response?.status === 403;
};

/**
 * Check if error is a server error (5xx)
 * @param {Error} error - The error object
 * @returns {boolean} - True if it's a server error
 */
export const isServerError = (error) => {
  return error.response?.status >= 500 && 
         error.response?.status < 600;
};

/**
 * Check if error is a client error (4xx)
 * @param {Error} error - The error object
 * @returns {boolean} - True if it's a client error
 */
export const isClientError = (error) => {
  return error.response?.status >= 400 && 
         error.response?.status < 500;
};

/**
 * Extract validation errors from response
 * @param {Error} error - The error object
 * @returns {Array|null} - Array of validation errors or null
 */
export const getValidationErrors = (error) => {
  if (error.response?.data?.errors) {
    return error.response.data.errors;
  }
  if (error.response?.data?.details && Array.isArray(error.response.data.details)) {
    return error.response.data.details;
  }
  return null;
};

/**
 * Extract field-specific validation errors
 * @param {Error} error - The error object
 * @returns {Object|null} - Object with field names as keys and error messages as values
 */
export const getFieldValidationErrors = (error) => {
  if (error.response?.data?.errors && typeof error.response.data.errors === 'object') {
    return error.response.data.errors;
  }
  return null;
};

/**
 * Get the original error message from server
 * @param {Error} error - The error object
 * @returns {string|null} - Original error message or null
 */
export const getOriginalErrorMessage = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.details) {
    return error.response.data.details;
  }
  return null;
};

/**
 * Check if error should trigger a logout (auth issues)
 * @param {Error} error - The error object
 * @returns {boolean} - True if logout should be triggered
 */
export const shouldTriggerLogout = (error) => {
  return error.response?.status === 401 || 
         (error.response?.status === 403 && 
          error.response.data?.message?.toLowerCase().includes('token'));
};

/**
 * Get error type for analytics or logging
 * @param {Error} error - The error object
 * @returns {string} - Error type category
 */
export const getErrorType = (error) => {
  if (isNetworkError(error)) return 'network';
  if (isTimeoutError(error)) return 'timeout';
  if (isAuthError(error)) return 'authentication';
  if (isServerError(error)) return 'server';
  if (isClientError(error)) return 'client';
  if (isEndpointNotFound(error)) return 'not_found';
  return 'unknown';
};

/**
 * Enhanced error handler with callback support
 * @param {Error} error - The error object
 * @param {Object} options - Handler options
 * @param {Function} options.onAuthError - Callback for auth errors
 * @param {Function} options.onNetworkError - Callback for network errors
 * @param {Function} options.onServerError - Callback for server errors
 * @param {Function} options.onValidationError - Callback for validation errors
 * @returns {string} - User-friendly error message
 */
export const handleApiErrorWithCallbacks = (error, options = {}) => {
  const {
    onAuthError,
    onNetworkError,
    onServerError,
    onValidationError
  } = options;

  const errorType = getErrorType(error);
  const userMessage = handleApiError(error);

  // Trigger appropriate callbacks
  switch (errorType) {
    case 'authentication':
      if (onAuthError) onAuthError(error, userMessage);
      break;
    case 'network':
    case 'timeout':
      if (onNetworkError) onNetworkError(error, userMessage);
      break;
    case 'server':
      if (onServerError) onServerError(error, userMessage);
      break;
    case 'client':
      if (getValidationErrors(error) && onValidationError) {
        onValidationError(error, userMessage, getValidationErrors(error));
      }
      break;
  }

  return userMessage;
};

// Export default for backward compatibility
export default handleApiError;