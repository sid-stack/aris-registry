# FatalErrorBanner Component

A critical error notification banner component for displaying system-level errors and providing recovery options.

## Features

- **Fixed positioning** at the top of the viewport with high z-index
- **Auto-dismiss** functionality with countdown timer
- **Retry functionality** for recoverable errors
- **Expandable details** with full error information
- **Responsive design** with mobile-friendly layout
- **Accessibility** with proper ARIA labels and keyboard navigation
- **Analytics integration** for error tracking

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `error` | `Object` | `null` | Error object containing error details |
| `onDismiss` | `Function` | `null` | Callback when banner is dismissed |
| `onRetry` | `Function` | `null` | Callback when retry button is clicked |
| `showDetails` | `Boolean` | `false` | Whether to show details button |
| `autoHide` | `Boolean` | `false` | Whether to auto-hide the banner |
| `autoHideDelay` | `Number` | `10000` | Auto-hide delay in milliseconds |

## Error Object Structure

```javascript
{
  message: 'Error message displayed to user',
  code: 'ERROR_CODE',
  timestamp: '2023-01-01T00:00:00.000Z',
  context: 'Where the error occurred',
  stack: 'Full error stack trace (optional)'
}
```

## Mobile-First Design

The FatalErrorBanner is designed with a mobile-first approach, ensuring optimal user experience across all devices.

### Breakpoints

- **Mobile**: &lt;768px
- **Tablet**: 768px - 1023px  
- **Desktop**: 1024px+

### Mobile Features

#### Layout (Mobile)
- **Stacked button layout** - Actions appear vertically below the message
- **Compact spacing** - Optimized for smaller screens
- **Smaller icons** - 24px icons instead of 32px
- **Word wrapping** - Long messages wrap properly
- **Touch-friendly** - Larger tap targets for mobile users

#### Layout (Tablet+)
- **Horizontal button layout** - Actions appear inline with the message
- **Medium spacing** - Balanced padding and gaps
- **Standard icons** - 32px icons for better visibility
- **Optimized typography** - Slightly larger font sizes

#### Layout (Desktop)
- **Enhanced spacing** - More generous padding
- **Improved shadows** - Better depth perception
- **Hover effects** - Interactive feedback for mouse users
- **Refined typography** - Optimized reading experience

### Responsive Typography

| Breakpoint | Message Size | Meta Info Size | Button Size |
|------------|--------------|----------------|-------------|
| Mobile | 14px | 11px | 13px |
| Tablet | 15px | 11px | 12px |
| Desktop | 14px | 12px | 12px |

### Responsive Spacing

| Breakpoint | Container Padding | Icon Size | Button Padding |
|------------|-------------------|-----------|----------------|
| Mobile | 12px 16px | 24px | 8px 16px |
| Tablet | 16px 24px | 32px | 6px 12px |
| Desktop | 12px 20px | 32px | 6px 12px |

### Mobile Optimization Features

#### Touch Targets
- Minimum 44px touch targets for buttons
- Generous spacing between interactive elements
- Clear visual feedback on touch

#### Text Handling
- `wordBreak: 'break-word'` for long messages
- `flexWrap: 'wrap'` for meta information
- Optimized line height for readability

#### Viewport Constraints
- `maxWidth: '100vw'` to prevent overflow
- Proper box-sizing with `border-box`
- Responsive font scaling

## Usage Examples

### Basic Error Banner
```jsx
import FatalErrorBanner from './components/dashboard/FatalErrorBanner';

function MyComponent() {
  const [error, setError] = useState(null);

  const handleError = () => {
    setError({
      message: 'Connection to server failed',
      code: 'NETWORK_ERROR',
      timestamp: new Date().toISOString(),
      context: 'API Request'
    });
  };

  return (
    <div>
      <button onClick={handleError}>Trigger Error</button>
      
      {error && (
        <FatalErrorBanner
          error={error}
          onDismiss={() => setError(null)}
        />
      )}
    </div>
  );
}
```

### With Retry Functionality
```jsx
function ApiComponent() {
  const [error, setError] = useState(null);

  const makeApiCall = async () => {
    try {
      await fetchData();
      setError(null);
    } catch (err) {
      setError({
        message: 'API request failed',
        code: 'API_ERROR',
        timestamp: new Date().toISOString(),
        context: 'Data Fetch',
        stack: err.stack
      });
    }
  };

  const handleRetry = () => {
    makeApiCall();
  };

  return (
    <div>
      {error && (
        <FatalErrorBanner
          error={error}
          onRetry={handleRetry}
          showDetails={true}
        />
      )}
    </div>
  );
}
```

### Auto-Hide Banner
```jsx
function NotificationComponent() {
  const [notification, setNotification] = useState(null);

  const showTemporaryError = () => {
    setNotification({
      message: 'Temporary system maintenance',
      code: 'MAINTENANCE_MODE',
      timestamp: new Date().toISOString(),
      context: 'System Status'
    });
  };

  return (
    <div>
      {notification && (
        <FatalErrorBanner
          error={notification}
          autoHide={true}
          autoHideDelay={5000} // 5 seconds
          showDetails={false}
          onDismiss={() => setNotification(null)}
        />
      )}
    </div>
  );
}
```

## Integration with Error Boundary

The FatalErrorBanner works seamlessly with the ErrorBoundary component:

```jsx
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary reloadOnRetry={false}>
      <MyApp />
    </ErrorBoundary>
  );
}
```

## Styling

The component uses inline styles for consistency with the existing dashboard design system. Key styling elements:

- **Background**: Red gradient (`#dc2626` to `#b91c1c`)
- **Text**: White with appropriate opacity levels
- **Border**: Subtle red border for definition
- **Shadow**: Red-tinted drop shadow
- **Animation**: Slide-down entrance effect

## Accessibility

- **Semantic HTML**: Proper button elements with type attributes
- **ARIA Labels**: Descriptive labels for screen readers
- **Keyboard Navigation**: Tab order and focus management
- **Color Contrast**: WCAG AA compliant color combinations
- **Focus Indicators**: Visible focus states for interactive elements

## Analytics Integration

The component automatically tracks error events when analytics are available:

```javascript
// Error tracking is automatic when analytics is initialized
trackEvent('error_occurred', {
  error_code: error.code,
  error_message: error.message,
  context: error.context
});
```

## Best Practices

1. **Use descriptive error codes** for debugging and tracking
2. **Provide context** about where the error occurred
3. **Include retry options** for recoverable errors
4. **Set appropriate auto-hide times** for temporary issues
5. **Test error states** regularly to ensure proper functionality

## Error Types

Common error codes used in the application:

- `NETWORK_ERROR`: Connection issues
- `API_ERROR`: API request failures
- `AUTH_ERROR`: Authentication problems
- `VALIDATION_ERROR`: Input validation issues
- `SYSTEM_ERROR`: Internal system failures
- `MAINTENANCE_MODE`: Scheduled maintenance

## Performance Considerations

- Component is optimized to prevent unnecessary re-renders
- Uses `useCallback` for event handlers
- Minimal DOM footprint with efficient styling
- Graceful degradation when analytics are unavailable

## Troubleshooting

### Banner Not Showing
- Check if error object is properly formatted
- Verify `isVisible` state is `true`
- Ensure z-index is not overridden by other elements

### Auto-Hide Not Working
- Verify `autoHide` prop is set to `true`
- Check `autoHideDelay` value is reasonable
- Ensure component is not being unmounted prematurely

### Retry Not Working
- Verify `onRetry` callback is provided
- Check if retry logic handles the error properly
- Ensure error state is cleared on successful retry

## Testing

```javascript
// Test example
import { render, screen, fireEvent } from '@testing-library/react';
import FatalErrorBanner from './FatalErrorBanner';

test('displays error message', () => {
  const error = {
    message: 'Test error',
    code: 'TEST_ERROR',
    timestamp: new Date().toISOString(),
    context: 'Test'
  };

  render(<FatalErrorBanner error={error} />);
  
  expect(screen.getByText('Test error')).toBeInTheDocument();
  expect(screen.getByText('TEST_ERROR')).toBeInTheDocument();
});

test('calls onDismiss when close button is clicked', () => {
  const onDismiss = jest.fn();
  const error = { message: 'Test', code: 'TEST', timestamp: new Date().toISOString() };

  render(<FatalErrorBanner error={error} onDismiss={onDismiss} />);
  
  fireEvent.click(screen.getByRole('button', { name: /close/i }));
  
  expect(onDismiss).toHaveBeenCalled();
});
```
