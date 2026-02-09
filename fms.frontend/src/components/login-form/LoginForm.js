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
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import serviceFactory from '../../services/core/ServiceFactory.js';
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
  const dispatch = useDispatch(); // Temporarily keeping for Redux state updates
  const [loading, setLoading] = useState(false);
  const formData = useRef({ username: '', password: '' });

  // Get authentication service from factory
  const authService = serviceFactory.getAuthenticationService();

  const onSubmit = useCallback(async (e) => {
    e.preventDefault();
    const { username, password } = formData.current;

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

        console.log('✅ Sign in successful, navigating to home...');
        navigate('/home', { replace: true });

      } else {
        // Handle authentication failure
        const errorMessage = result.message || 'Sign in failed';
        console.error('❌ Sign in failed:', errorMessage);

        // Show user-friendly error message
        if (result.errors && result.errors.length > 0) {
          // Handle specific error types
          if (result.errors.includes('INVALID_CREDENTIALS')) {
            notify('Invalid username or password', 'error', 3000);
          } else if (result.errors.includes('ACCOUNT_LOCKED')) {
            notify('Account is locked. Please contact administrator.', 'error', 4000);
          } else if (result.errors.includes('MISSING_TOKEN')) {
            notify('Authentication service error. Please try again.', 'error', 3000);
          } else {
            notify(errorMessage, 'error', 3000);
          }
        } else {
          notify(errorMessage, 'error', 3000);
        }
      }

    } catch (error) {
      console.error('🚨 Login exception:', error);

      // Handle network errors and other exceptions
      if (error.message?.includes('Network Error') || error.code === 'ERR_NETWORK') {
        notify('Cannot connect to server. Please check your connection.', 'error', 4000);
      } else if (error.response?.status === 503) {
        notify('Service temporarily unavailable. Please try again later.', 'error', 4000);
      } else {
        notify('An unexpected error occurred. Please try again.', 'error', 3000);
      }

    } finally {
      setLoading(false);
    }
  }, [authService, navigate, dispatch]);

  // Handle form field changes for validation
  const onFieldDataChanged = useCallback((e) => {
    if (e.dataField === 'username') {
      formData.current.username = e.value || '';
    } else if (e.dataField === 'password') {
      formData.current.password = e.value || '';
    }
  }, []);

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