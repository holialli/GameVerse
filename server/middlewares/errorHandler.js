/**
 * Global Error Boundary & Error Monitoring Middleware
 * Logs 5xx errors with request IDs for Cloudflare debugging
 *
 * Backend Usage (server.js):
 * const errorHandler = require('./middlewares/errorHandler');
 * app.use(errorHandler);
 *
 * Frontend Usage (React):
 * import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 */

// ============================================================================
// BACKEND: Express Error Handler Middleware
// ============================================================================

const errorHandler = (err, req, res, next) => {
  const requestId = req.id || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const statusCode = err.statusCode || 500;
  const isServerError = statusCode >= 500;

  // Log server errors with request ID
  if (isServerError) {
    console.error(`[${new Date().toISOString()}] [REQUEST_ID: ${requestId}] ERROR:`, {
      method: req.method,
      path: req.path,
      statusCode,
      message: err.message,
      stack: err.stack,
      query: req.query,
      body: req.body,
    });
  }

  // Send response
  res.status(statusCode).json({
    success: false,
    message: isServerError ? 'Internal Server Error' : err.message,
    requestId,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;

// ============================================================================
// FRONTEND: React Error Boundary Component
// ============================================================================

/*
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorId: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.error(`[ERROR_ID: ${errorId}] Caught error:`, error, errorInfo);
    
    // Log to monitoring service (e.g., Sentry, LogRocket)
    this.setState({ error, errorId });
    
    // Optionally send to backend for centralized logging
    fetch('/api/errors/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      }),
    }).catch(console.error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h1>Something went wrong</h1>
          <p>Error ID: {this.state.errorId}</p>
          <p>Please try refreshing the page.</p>
          <button onClick={() => window.location.reload()}>Reload Page</button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
*/
