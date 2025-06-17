// Create this file: src/components/ErrorBoundary.jsx

import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorHistory: []
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 ERROR BOUNDARY CAUGHT:', error);
    console.error('🚨 ERROR INFO:', errorInfo);
    
    // Store error details
    const errorDetails = {
      error: error.toString(),
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    };
    
    this.setState(prevState => ({
      error,
      errorInfo,
      errorHistory: [...prevState.errorHistory, errorDetails]
    }));
    
    // Also log to console for debugging
    console.table(errorDetails);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container mt-4">
          <div className="alert alert-danger">
            <h2>🚨 Something went wrong!</h2>
            <details style={{ whiteSpace: 'pre-wrap' }}>
              <summary>Click to see error details</summary>
              <p><strong>Error:</strong> {this.state.error && this.state.error.toString()}</p>
              <p><strong>Component Stack:</strong></p>
              <code>{this.state.errorInfo?.componentStack || 'No component stack available'}</code>
              
              {this.state.errorHistory.length > 0 && (
                <div className="mt-3">
                  <h5>Error History:</h5>
                  {this.state.errorHistory.map((err, index) => (
                    <div key={index} className="border p-2 mb-2">
                      <small>Time: {err.timestamp}</small>
                      <pre>{err.error}</pre>
                    </div>
                  ))}
                </div>
              )}
            </details>
            
            <button 
              className="btn btn-primary mt-2"
              onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;