import React from 'react';

/**
 * Error Boundary Component
 * Catches React component errors and displays fallback UI
 * Logs errors with ID for debugging
 *
 * Usage:
 * import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
 * 
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 */
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

    // Send error to backend for centralized logging
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
    }).catch((err) => console.error('Failed to log error:', err));

    this.setState({ error, errorId });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '40px 20px',
            textAlign: 'center',
            fontFamily: 'Arial, sans-serif',
          }}
        >
          <h1>⚠️ Something went wrong</h1>
          <p>We're sorry for the inconvenience. Our team has been notified.</p>
          <p style={{ color: '#999', marginTop: '20px' }}>
            Error ID: <code>{this.state.errorId}</code>
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
