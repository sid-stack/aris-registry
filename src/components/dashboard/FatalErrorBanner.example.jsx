import React, { useState } from 'react';
import FatalErrorBanner from './FatalErrorBanner';
import { Button, Card } from '../../ui';

// Example 1: Basic usage with dismiss
export const BasicExample = () => {
  const [showError, setShowError] = useState(false);

  const triggerError = () => {
    setShowError(true);
  };

  const handleError = () => {
    setShowError(false);
  };

  return (
    <div>
      <Button onClick={triggerError}>Trigger Error Banner</Button>
      
      {showError && (
        <FatalErrorBanner
          error={{
            message: 'Connection to server failed',
            code: 'NETWORK_ERROR',
            timestamp: new Date().toISOString(),
            context: 'API Request'
          }}
          onDismiss={handleError}
        />
      )}
    </div>
  );
};

// Example 2: With retry functionality
export const RetryExample = () => {
  const [error, setError] = useState(null);

  const simulateApiCall = async () => {
    try {
      // Simulate API call that might fail
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          if (Math.random() > 0.5) {
            resolve('Success');
          } else {
            reject(new Error('API request timed out'));
          }
        }, 1000);
      });
      
      setError(null); // Clear error on success
      console.log('API call successful');
    } catch (err) {
      setError({
        message: err.message,
        code: 'API_TIMEOUT',
        timestamp: new Date().toISOString(),
        context: 'Data Fetch',
        stack: err.stack
      });
    }
  };

  const handleRetry = () => {
    simulateApiCall();
  };

  return (
    <div>
      <Button onClick={simulateApiCall}>Make API Call</Button>
      
      {error && (
        <FatalErrorBanner
          error={error}
          onRetry={handleRetry}
          showDetails={true}
        />
      )}
    </div>
  );
};

// Example 3: Auto-hide with details
export const AutoHideExample = () => {
  const [error, setError] = useState(null);

  const triggerTemporaryError = () => {
    setError({
      message: 'Temporary system maintenance in progress',
      code: 'MAINTENANCE_MODE',
      timestamp: new Date().toISOString(),
      context: 'System Status',
      stack: null
    });
  };

  return (
    <div>
      <Button onClick={triggerTemporaryError}>Show Temporary Error</Button>
      
      {error && (
        <FatalErrorBanner
          error={error}
          autoHide={true}
          autoHideDelay={5000} // 5 seconds
          showDetails={true}
          onDismiss={() => setError(null)}
        />
      )}
    </div>
  );
};

// Example 4: Critical system error
export const CriticalErrorExample = () => {
  const criticalError = {
    message: 'Critical system failure detected',
    code: 'CRITICAL_SYSTEM_ERROR',
    timestamp: new Date().toISOString(),
    context: 'Application Startup',
    stack: 'Error: Critical system failure\n    at App.initialize (app.js:42)\n    at main.js:15'
  };

  return (
    <div>
      <FatalErrorBanner
        error={criticalError}
        showDetails={true}
        onRetry={() => window.location.reload()}
      />
    </div>
  );
};

// Complete example with all features
export const CompleteExample = () => {
  const [errors, setErrors] = useState([]);

  const addRandomError = () => {
    const errorTypes = [
      {
        message: 'Failed to load user data',
        code: 'USER_DATA_ERROR',
        context: 'User Service'
      },
      {
        message: 'Database connection lost',
        code: 'DB_CONNECTION_ERROR',
        context: 'Database Layer'
      },
      {
        message: 'Authentication token expired',
        code: 'AUTH_TOKEN_EXPIRED',
        context: 'Authentication'
      },
      {
        message: 'File upload failed',
        code: 'UPLOAD_ERROR',
        context: 'File Service'
      }
    ];

    const randomError = errorTypes[Math.floor(Math.random() * errorTypes.length)];
    
    setErrors(prev => [...prev, {
      ...randomError,
      timestamp: new Date().toISOString(),
      stack: `Error: ${randomError.message}\n    at ${randomError.context} (line 123)\n    at main.js:456`
    }]);
  };

  const clearErrors = () => {
    setErrors([]);
  };

  return (
    <Card style={{ padding: '20px' }}>
      <h3>FatalErrorBanner Examples</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <Button onClick={addRandomError} style={{ marginRight: '10px' }}>
          Add Random Error
        </Button>
        <Button onClick={clearErrors} variant="secondary">
          Clear All Errors
        </Button>
      </div>

      {errors.map((error, index) => (
        <div key={index} style={{ marginBottom: '10px' }}>
          <FatalErrorBanner
            error={error}
            showDetails={true}
            onDismiss={() => {
              setErrors(prev => prev.filter((_, i) => i !== index));
            }}
            onRetry={() => {
              console.log('Retrying operation for error:', error.code);
            }}
          />
        </div>
      ))}

      {errors.length === 0 && (
        <p style={{ color: '#666', fontStyle: 'italic' }}>
          Click "Add Random Error" to see the FatalErrorBanner in action
        </p>
      )}
    </Card>
  );
};

export default {
  BasicExample,
  RetryExample,
  AutoHideExample,
  CriticalErrorExample,
  CompleteExample
};
