import React, { Component } from 'react';
import FatalErrorBanner from './dashboard/FatalErrorBanner';
import NotFound from '../pages/NotFound';
import { devError } from '../utils/devLog';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error: {
        message: error.message || 'A critical error occurred',
        code: error.code || 'REACT_ERROR_BOUNDARY',
        timestamp: new Date().toISOString(),
        context: 'React Component',
        stack: error.stack
      }
    };
  }

  componentDidCatch(error, errorInfo) {
    devError('Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error: {
        message: error.message || 'A critical error occurred',
        code: error.code || 'REACT_ERROR_BOUNDARY',
        timestamp: new Date().toISOString(),
        context: errorInfo.componentStack || 'React Component',
        stack: error.stack
      },
      errorInfo
    });

    // Track error for analytics
    if (typeof window !== 'undefined' && window.trackEvent) {
      window.trackEvent('react_error_boundary', {
        error_message: error.message,
        error_stack: error.stack,
        component_stack: errorInfo.componentStack
      });
    }
  }

  handleDismiss = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    
    // Optionally reload the page
    if (this.props.reloadOnRetry) {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      const { showDetails = true, autoHide = false, autoHideDelay = 10000, fallbackMode = "wanderer" } = this.props;
      if (fallbackMode !== "banner") {
        return <NotFound />;
      }
      
      return (
        <FatalErrorBanner
          error={this.state.error}
          onDismiss={this.handleDismiss}
          onRetry={this.handleRetry}
          showDetails={showDetails}
          autoHide={autoHide}
          autoHideDelay={autoHideDelay}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
