/**
 * File: LoginForm.js
 * Purpose: Two-column authentication card (Inspinia auth-card-sign-in style) for fms.frontend.
 * Dependencies: React, react-router-dom, react-redux, authService, useBrandingLogo
 * Last Modified: 2026-05-17
 *
 * Key Functions/Components:
 * - LoginForm: Renders the sign-in card and orchestrates authentication flow
 */

import React, { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import notify from 'devextreme/ui/notify';

import serviceFactory from '../../services/core/ServiceFactory.js';
import { getSafeInternalRedirect } from '../../utils/authRedirect';
import useBrandingLogo from '../header/useBrandingLogo';
import { LOGIN_SUCCESS, USER_LOADED } from '../../redux/actions/types';
import { fetchMyPermissions } from '../../redux/actions/permissionActions';

import './LoginForm.scss';

const LoginForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const brandingLogoSrc = useBrandingLogo();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');

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
    setAuthError('');

    if (!username || !password) {
      notify('Please enter both username and password', 'warning', 2000);
      return;
    }

    try {
      setLoading(true);
      const result = await authService.signIn(username, password);

      if (result.success && result.data) {
        const { user, token } = result.data;

        dispatch({ type: LOGIN_SUCCESS, payload: { token } });
        dispatch({ type: USER_LOADED, payload: user });
        dispatch(fetchMyPermissions());

        notify(`Welcome back, ${user.userName || user.username}!`, 'success', 2000);

        const requestedRedirect = searchParams.get('redirect');
        const safeRequestedRedirect = getSafeInternalRedirect(requestedRedirect);
        const targetRoute =
          safeRequestedRedirect && !safeRequestedRedirect.startsWith('/login')
            ? safeRequestedRedirect
            : '/home';

        navigate(targetRoute, { replace: true });
      } else {
        const errorMessage = getAuthenticationErrorMessage(result);
        setAuthError(errorMessage);
        notify(errorMessage, 'error', 3000);
      }
    } catch (error) {
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
  }, [authService, dispatch, navigate, searchParams, username, password, getAuthenticationErrorMessage]);

  const handleFieldChange = (setter) => (e) => {
    if (authError) setAuthError('');
    setter(e.target.value);
  };

  return (
    <div className="auth-box">
      <div className="auth-card">
        <div className="auth-card__form">
          <div className="auth-brand">
            {brandingLogoSrc ? (
              <img className="auth-brand__logo" src={brandingLogoSrc} alt="Tenacy FMS" />
            ) : (
              <span className="auth-brand__mark">T</span>
            )}
            <h4 className="auth-brand__title">Welcome to Tenacy FMS</h4>
            <p className="auth-brand__subtitle">
              Let&rsquo;s get you signed in. Enter your username and password to continue.
            </p>
          </div>

          <form onSubmit={onSubmit} noValidate>
            <div className="auth-field">
              <label htmlFor="userName" className="auth-field__label">
                Username <span className="auth-field__required">*</span>
              </label>
              <div className="auth-input-group">
                <span className="auth-input-group__addon">
                  <i className="fa-light fa-user" aria-hidden="true" />
                </span>
                <input
                  id="userName"
                  className="auth-input"
                  type="text"
                  autoComplete="username"
                  placeholder="your.username"
                  value={username}
                  onChange={handleFieldChange(setUsername)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="userPassword" className="auth-field__label">
                Password <span className="auth-field__required">*</span>
              </label>
              <div className="auth-input-group">
                <span className="auth-input-group__addon">
                  <i className="fa-light fa-lock" aria-hidden="true" />
                </span>
                <input
                  id="userPassword"
                  className="auth-input"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={handleFieldChange(setPassword)}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="auth-input-group__toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  <i className={`fa-light ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="auth-row">
              <label className="auth-check">
                <input
                  type="checkbox"
                  className="auth-check__input"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                />
                <span className="auth-check__label">Keep me signed in</span>
              </label>
              <a href="/forgot-password" className="auth-link">Forgot password?</a>
            </div>

            {authError && (
              <div className="auth-error" role="alert" aria-live="assertive">
                <i className="fa-light fa-circle-exclamation" aria-hidden="true" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className={`auth-submit${loading ? ' auth-submit--loading' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fa-light fa-spinner-third fa-spin" aria-hidden="true" />
                  <span>Signing in&hellip;</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          <p className="auth-footer">
            &copy; {new Date().getFullYear()} Tenacy FMS &mdash;{' '}
            <span className="auth-footer__brand">Fleet Management System</span>
          </p>
        </div>

        <div className="auth-card__side" aria-hidden="true">
          <div className="auth-card__side-overlay">
            <div className="auth-card__side-content">
              <i className="fa-light fa-truck-fast auth-card__side-icon" />
              <h3 className="auth-card__side-title">Operate your fleet with confidence</h3>
              <p className="auth-card__side-text">
                Real-time tracking, fuel management, and operational insight &mdash; in one place.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
