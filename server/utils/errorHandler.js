/**
 * Sanitized error response handler for production
 * Logs detailed errors server-side while returning generic messages to clients
 */

const crypto = require('crypto');

/**
 * Generate a reference ID for error tracking
 */
const generateErrorId = () => crypto.randomUUID();

/**
 * Sanitize error message for client response
 * In production, returns generic messages
 * In development, returns actual error details
 */
const sanitizeErrorMessage = (error, defaultMessage = 'An unexpected error occurred') => {
  if (process.env.NODE_ENV === 'production') {
    return defaultMessage;
  }
  return error?.message || defaultMessage;
};

/**
 * Send a safe error response
 * Logs full error server-side, sends sanitized message to client
 */
const sendErrorResponse = (res, error, statusCode = 500, defaultMessage = 'An unexpected error occurred') => {
  const referenceId = generateErrorId();
  
  // Log full error details server-side for debugging
  console.error(`[ERROR ${referenceId}] Status: ${statusCode}`, {
    timestamp: new Date().toISOString(),
    message: error?.message,
    code: error?.code,
    stack: error?.stack,
  });

  // Send sanitized response to client
  const message = sanitizeErrorMessage(error, defaultMessage);
  
  res.status(statusCode).json({
    status: 'error',
    message,
    referenceId,
    ...(process.env.NODE_ENV === 'development' && { details: error?.message }),
  });
};

/**
 * Middleware to catch async errors and pass to global handler
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  generateErrorId,
  sanitizeErrorMessage,
  sendErrorResponse,
  asyncHandler,
};
