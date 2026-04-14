/**
 * File: LoginForm.js
 * Purpose: Provides the authentication form for unauthenticated users and handles sign-in workflow
 * Dependencies: React, DevExtreme Form, AuthenticationService, Redux
 * Last Modified: 2025-10-08
 *
 * Key Functions/Components:
 * - LoginForm: Renders the login form and orchestrates authentication flow
 */

import React, { useState, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import serviceFactory from '../../services/core/ServiceFactory.js';
import { getSafeInternalRedirect } from '../../utils/authRedirect';
import Form, {
  Item,
  Label,
  ButtonItem,
  ButtonOptions,
  RequiredRule,
} from 'devextreme-react/form';
import LoadIndicator from 'devextreme-react/load-indicator';
import notify from 'devextreme/ui/notify';

// Redux actions for state management (temporarily keeping these until full Redux migration)
import { LOGIN_SUCCESS, USER_LOADED } from '../../redux/actions/types';
import { fetchMyPermissions } from '../../redux/actions/permissionActions';

import './LoginForm.scss';

/**
 * Modernized LoginForm Component
 *
 * Updated to use enterprise service architecture:
 * - AuthenticationService for standardized authentication
 * - FMSResponse<T> format handling
 * - v1 API integration
 * - Consistent error handling
 * - Maintains DevExtreme UI components
 */
const LoginForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch(); // Temporarily keeping for Redux state updates
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const formData = useRef({ username: '', password: '' });

  // Get authentication service from factory
  const authService = serviceFactory.getAuthenticationService();

  const getAuthenticationErrorMessage = useCallback((result) => {
    if (result?.errors?.includes('INVALID_CREDENTIALS')) {
      return 'Invalid username or password.';
    }

    if (result?.errors?.includes('ACCOUNT_LOCKED')) {
      return 'Account is locked. Please contact administrator.';
    }

    if (result?.errors?.includes('MISSING_TOKEN')) {
      return 'Authentication service error. Please try again.';
    }

    if (result?.errorType === 'AUTHENTICATION') {
      return result?.message || 'Invalid username or password.';
    }

    return result?.message || 'Sign in failed. Please try again.';
  }, []);

  const onSubmit = useCallback(async (e) => {
    e.preventDefault();
    const { username, password } = formData.current;
    setAuthError('');

    if (!username || !password) {
      notify('Please enter both username and password', 'warning', 2000);
      return;
    }

    try {
      setLoading(true);

      console.log('🔐 Attempting sign in with AuthenticationService...', { username });

      // ✅ Use standardized service call with FMSResponse format
      const result = await authService.signIn(username, password);

      console.log('🔐 Sign in response:', result);

      // ✅ Consistent FMSResponse handling
      if (result.success && result.data) {
        const { user, token, navigationItems } = result.data;

        // Update Redux state (temporary - will be replaced with service-based state management)
        dispatch({
          type: LOGIN_SUCCESS,
          payload: { token }
        });

        dispatch({
          type: USER_LOADED,
          payload: user
        });

        // Fetch user permissions from backend (not from JWT)
        dispatch(fetchMyPermissions());

        // Store navigation items if available
        if (navigationItems && navigationItems.length > 0) {
          // You can dispatch navigation action or store in local state
          console.log('📋 Navigation items loaded:', navigationItems.length);
        }

        // Show success notification
        notify(`Welcome back, ${user.userName || user.username}!`, 'success', 2000);

        const requestedRedirect = searchParams.get('redirect');
        const safeRequestedRedirect = getSafeInternalRedirect(requestedRedirect);
        const targetRoute =
          safeRequestedRedirect && !safeRequestedRedirect.startsWith('/login')
            ? safeRequestedRedirect
            : '/home';

        console.log('✅ Sign in successful, navigating to:', targetRoute);
        navigate(targetRoute, { replace: true });

      } else {
        // Handle authentication failure
        const errorMessage = getAuthenticationErrorMessage(result);
        console.error('❌ Sign in failed:', errorMessage);
        setAuthError(errorMessage);

        notify(errorMessage, 'error', 3000);
      }

    } catch (error) {
      console.error('🚨 Login exception:', error);

      // Handle network errors and other exceptions
      if (error.message?.includes('Network Error') || error.code === 'ERR_NETWORK') {
        setAuthError('Cannot connect to server. Please check your connection.');
        notify('Cannot connect to server. Please check your connection.', 'error', 4000);
      } else if (error.response?.status === 503) {
        setAuthError('Service temporarily unavailable. Please try again later.');
        notify('Service temporarily unavailable. Please try again later.', 'error', 4000);
      } else {
        setAuthError('An unexpected error occurred. Please try again.');
        notify('An unexpected error occurred. Please try again.', 'error', 3000);
      }

    } finally {
      setLoading(false);
    }
  }, [authService, navigate, dispatch, searchParams, getAuthenticationErrorMessage]);

  // Handle form field changes for validation
  const onFieldDataChanged = useCallback((e) => {
    if (authError) {
      setAuthError('');
    }

    if (e.dataField === 'username') {
      formData.current.username = e.value || '';
    } else if (e.dataField === 'password') {
      formData.current.password = e.value || '';
    }
  }, [authError]);

  const authValidationErrors = authError ? [{ message: authError }] : null;

  return (
    <form className={'login-form tw-flex tw-flex-col tw-gap-6 tw-w-full'} onSubmit={onSubmit}>
      <Form
        formData={formData.current}
        disabled={loading}
        onFieldDataChanged={onFieldDataChanged}
      >
        <Item
          dataField={'username'}
          editorType={'dxTextBox'}
          editorOptions={{
            ...UserNameEditorOptions,
            validationStatus: authError ? 'invalid' : 'valid',
            validationErrors: authValidationErrors,
            onEnterKey: onSubmit // Enable Enter key submission
          }}
        >
          <RequiredRule message="Username is required" />
          <Label visible={false} />
        </Item>
        <Item
          dataField={'password'}
          editorType={'dxTextBox'}
          editorOptions={{
            ...passwordEditorOptions,
            validationStatus: authError ? 'invalid' : 'valid',
            validationErrors: authValidationErrors,
            onEnterKey: onSubmit // Enable Enter key submission
          }}
        >
          <RequiredRule message="Password is required" />
          <Label visible={false} />
        </Item>
        <ButtonItem>
          <ButtonOptions
            width={'100%'}
            type={'default'}
            useSubmitBehavior={true}
            stylingMode={'contained'}
            disabled={loading}
            elementAttr={{
              class: `login-submit-button${loading ? ' loading' : ''}`
            }}
          >
            <span className="dx-button-text tw-flex tw-items-center tw-justify-center tw-gap-3">
              {loading ? (
                <>
                  <LoadIndicator
                    visible={true}
                    width={20}
                    height={20}
                    elementAttr={{ class: 'login-submit-spinner' }}
                  />
                  <span>Signing in...</span>
                </>
              ) : (
                'Sign In'
              )}
            </span>
          </ButtonOptions>
        </ButtonItem>
      </Form>

      {authError && (
        <div className="login-form__error" role="alert" aria-live="assertive">
          {authError}
        </div>
      )}

      {/* Development debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="tw-mt-4 tw-p-2 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded tw-text-xs">
          <div className="tw-font-medium tw-text-blue-800">Development Info:</div>
          <div className="tw-text-blue-600">
            • Using AuthenticationService with v1 API<br />
            • FMSResponse format handling<br />
            • Enterprise error classification<br />
            • Service health: {authService ? '✅ Ready' : '❌ Not initialized'}
          </div>
        </div>
      )}
    </form>
  );
}

const UserNameEditorOptions = {
  stylingMode: 'filled',
  placeholder: 'Username',
  mode: 'username',
  maxLength: 50,
  showClearButton: true
};

const passwordEditorOptions = {
  stylingMode: 'filled',
  placeholder: 'Password',
  mode: 'password',
  maxLength: 100,
  showClearButton: false // Don't show clear button for password for security
};

export default LoginForm;