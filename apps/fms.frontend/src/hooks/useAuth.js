/**
 * useAuth Custom Hook
 *
 * Provides authentication state management and operations using the enterprise service architecture.
 * This hook abstracts authentication logic and provides a clean interface for components.
 */

import { useState, useEffect, useCallback, useContext, createContext } from 'react';
import serviceFactory from '../services/core/ServiceFactory.js';

// Create Auth Context
const AuthContext = createContext(null);

/**
 * AuthProvider Component
 * Provides authentication context to the application
 */
export const AuthProvider = ({ children }) => {
  const authValue = useAuthProvider();
  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to provide authentication functionality
 */
const useAuthProvider = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState(null);

  const authService = serviceFactory.getAuthenticationService();

  /**
   * Initialize authentication state on app startup
   */
  const initializeAuth = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user has a stored token and validate it
      const validation = await authService.validateAuth();

      console.log('Auth validation result:', validation); // Debug log

      if (validation.success && validation.data.isValid && validation.data.user) {
        console.log('Setting user from validation:', validation.data.user); // Debug log
        setUser(validation.data.user);
        setIsAuthenticated(true);
      } else {
        console.log('Validation failed or no user, clearing auth state'); // Debug log
        setUser(null);
        setIsAuthenticated(false);
      }

    } catch (error) {
      console.error('Auth initialization failed:', error);
      setUser(null);
      setIsAuthenticated(false);
      setError(error.message || 'Authentication initialization failed');
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, [authService]);

  /**
   * Sign in user
   * @param {string} username
   * @param {string} password
   * @returns {Promise<{success: boolean, message?: string, errors?: Array}>}
   */
  const signIn = useCallback(async (username, password) => {
    try {
      setLoading(true);
      setError(null);

      const result = await authService.signIn(username, password);

      if (result.success && result.data) {
        const { user } = result.data;

        setUser(user);
        setIsAuthenticated(true);

        return {
          success: true,
          user: user
        };
      } else {
        setError(result.message);
        return {
          success: false,
          message: result.message,
          errors: result.errors
        };
      }

    } catch (error) {
      console.error('Sign in error:', error);
      const errorMessage = 'An unexpected error occurred during sign in';
      setError(errorMessage);

      return {
        success: false,
        message: errorMessage,
        errors: ['UNEXPECTED_ERROR']
      };
    } finally {
      setLoading(false);
    }
  }, [authService]);

  /**
   * Sign out user
   * @returns {Promise<{success: boolean}>}
   */
  const signOut = useCallback(async () => {
    try {
      setLoading(true);

      await authService.signOut();

      // Clear all auth state
      setUser(null);
      setIsAuthenticated(false);
      setError(null);

      return { success: true };

    } catch (error) {
      console.error('Sign out error:', error);

      // Still clear local state even if API call fails
      setUser(null);
      setIsAuthenticated(false);
      setError(null);

      return { success: true }; // Local cleanup succeeded
    } finally {
      setLoading(false);
    }
  }, [authService]);

  /**
   * Refresh user session
   * @returns {Promise<{success: boolean}>}
   */
  const refreshSession = useCallback(async () => {
    try {
      const result = await authService.refreshSession();

      if (result.success) {
        // Optionally update user data
        const userResponse = await authService.getCurrentUser();
        if (userResponse.success) {
          setUser(userResponse.data);
        }
      }

      return result;

    } catch (error) {
      console.error('Session refresh error:', error);
      return { success: false, message: 'Failed to refresh session' };
    }
  }, [authService]);

  /**
   * Get current user profile
   * @returns {Promise<{success: boolean, data?: object}>}
   */
  const getCurrentUser = useCallback(async () => {
    try {
      const result = await authService.getCurrentUser();

      if (result.success && result.data) {
        setUser(result.data);
      }

      return result;

    } catch (error) {
      console.error('Get current user error:', error);
      return { success: false, message: 'Failed to get current user' };
    }
  }, [authService]);

  /**
   * Check if user has specific permission
   * @param {string} permission
   * @returns {boolean}
   */
  const hasPermission = useCallback((permission) => {
    if (!user || !user.permissions) return false;

    return user.permissions.some(p =>
      p === permission ||
      p.name === permission ||
      p.Permission === permission
    );
  }, [user]);

  /**
   * Check if user has specific role
   * @param {string} role
   * @returns {boolean}
   */
  const hasRole = useCallback((role) => {
    if (!user || !user.roles) return false;

    return user.roles.some(r =>
      r === role ||
      r.name === role ||
      r.Name === role ||
      (typeof r === 'string' && r.toLowerCase() === role.toLowerCase())
    );
  }, [user]);

  /**
   * Clear authentication error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initialize authentication on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return {
    // State
    user,
    isAuthenticated,
    loading,
    initialized,
    error,

    // Actions
    signIn,
    signOut,
    refreshSession,
    getCurrentUser,
    initializeAuth,
    clearError,

    // Helpers
    hasPermission,
    hasRole,

    // Service access (for advanced usage)
    authService
  };
};

/**
 * useAuth Hook
 * Provides access to authentication context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

export default useAuth;