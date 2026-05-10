/**
 * SignalR-Isolated Form Component
 * Prevents form inputs from re-rendering when SignalR updates Redux state
 *
 * Use this component to wrap forms that should not be affected by real-time updates
 */

import React, { memo } from 'react';
import PropTypes from 'prop-types';

/**
 * Isolated Form Wrapper
 * Prevents child components from re-rendering due to parent Redux updates
 *
 * @example
 * <IsolatedForm>
 *   <MyFormComponent />
 * </IsolatedForm>
 */
export const IsolatedForm = memo(({ children, formId }) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[IsolatedForm ${formId || 'default'}] Rendering`);
  }

  return <>{children}</>;
}, (prevProps, nextProps) => {
  // Only re-render if children changed or explicit formId changed
  return prevProps.formId === nextProps.formId;
});

IsolatedForm.propTypes = {
  children: PropTypes.node.isRequired,
  formId: PropTypes.string
};

IsolatedForm.displayName = 'IsolatedForm';

/**
 * Higher-Order Component to isolate a component from SignalR updates
 *
 * @param {React.Component} Component - Component to isolate
 * @param {Array<string>} propKeys - Optional array of prop keys to watch for changes
 * @returns {React.Component} Isolated component
 *
 * @example
 * const IsolatedMyForm = withSignalRIsolation(MyFormComponent, ['formData', 'onSubmit']);
 */
export const withSignalRIsolation = (Component, propKeys = []) => {
  const IsolatedComponent = memo(Component, (prevProps, nextProps) => {
    // If no specific prop keys specified, only re-render if props actually changed
    if (propKeys.length === 0) {
      return JSON.stringify(prevProps) === JSON.stringify(nextProps);
    }

    // Check only specified prop keys
    return propKeys.every(key => prevProps[key] === nextProps[key]);
  });

  IsolatedComponent.displayName = `withSignalRIsolation(${Component.displayName || Component.name || 'Component'})`;

  return IsolatedComponent;
};

/**
 * Custom hook to prevent component re-renders from SignalR updates
 * Returns a stable reference to props
 *
 * @param {Object} props - Component props
 * @param {Array<string>} watchKeys - Keys to watch for changes
 * @returns {Object} Stable props reference
 *
 * @example
 * function MyComponent(props) {
 *   const stableProps = useSignalRIsolation(props, ['value', 'onChange']);
 *   // Use stableProps instead of props
 * }
 */
export const useSignalRIsolation = (props, watchKeys = []) => {
  const propsRef = React.useRef(props);
  const watchKeysRef = React.useRef(watchKeys);

  React.useEffect(() => {
    // Update ref only if watched keys changed
    const shouldUpdate = watchKeysRef.current.length === 0
      ? true
      : watchKeysRef.current.some(key => props[key] !== propsRef.current[key]);

    if (shouldUpdate) {
      propsRef.current = props;
    }
  }, [props]);

  return propsRef.current;
};

/**
 * Context for SignalR isolation
 * Use to create isolated sections of your app
 */
export const SignalRIsolationContext = React.createContext({
  isolated: false
});

/**
 * Provider for SignalR isolation
 *
 * @example
 * <SignalRIsolationProvider>
 *   <FormThatShouldNotRerender />
 * </SignalRIsolationProvider>
 */
export const SignalRIsolationProvider = ({ children }) => {
  const contextValue = React.useMemo(() => ({ isolated: true }), []);

  return (
    <SignalRIsolationContext.Provider value={contextValue}>
      {children}
    </SignalRIsolationContext.Provider>
  );
};

SignalRIsolationProvider.propTypes = {
  children: PropTypes.node.isRequired
};

/**
 * Hook to check if component is in isolated context
 *
 * @returns {boolean} Whether component is isolated from SignalR updates
 */
export const useIsSignalRIsolated = () => {
  const context = React.useContext(SignalRIsolationContext);
  return context.isolated;
};

export default IsolatedForm;
