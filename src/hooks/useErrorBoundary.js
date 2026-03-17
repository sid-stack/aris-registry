import { useState, useCallback } from 'react';

const useErrorBoundary = () => {
  const [error, setError] = useState(null);
  const [errorInfo, setErrorInfo] = useState(null);

  const resetError = useCallback(() => {
    setError(null);
    setErrorInfo(null);
  }, []);

  const captureError = useCallback((error, errorInfo = null) => {
    console.error('Error captured by boundary:', error, errorInfo);
    
    const formattedError = {
      message: error?.message || 'An unknown error occurred',
      code: error?.code || 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString(),
      context: errorInfo?.componentStack || 'Unknown component',
      stack: error?.stack || null,
      ...(errorInfo && { additionalInfo: errorInfo })
    };

    setError(formattedError);
    setErrorInfo(errorInfo);

    // Track error for analytics
    if (typeof window !== 'undefined' && window.trackEvent) {
      window.trackEvent('error_occurred', {
        error_code: formattedError.code,
        error_message: formattedError.message,
        context: formattedError.context
      });
    }
  }, []);

  const handleRetry = useCallback(() => {
    resetError();
    // Optional: trigger a page reload or specific retry logic
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }, [resetError]);

  return {
    error,
    errorInfo,
    hasError: !!error,
    captureError,
    resetError,
    handleRetry
  };
};

export default useErrorBoundary;
