import "devextreme/dist/css/dx.common.css";
import "./themes/generated/theme.base.css";
import "./themes/generated/dx.fluent.custom-scheme1.css";
import "./themes/generated/theme.additional.css";
import "./../assests/fontawesome/js/fontawesome";
import "./../assests/fontawesome/js/light";

import "./../assests/fontawesome/css/fontawesome.css";
import "./../assests/fontawesome/css/light.css";

import "ace-builds/css/ace.css";
import "ace-builds/css/theme/dreamweaver.css";
import "ace-builds/css/theme/ambiance.css";
//import './reportDesignerStyles.css';

import React, { useEffect, useState } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import StoreProvider from "./store";
import "./dx-styles.scss";
import LoadPanel from "devextreme-react/load-panel";
import { NavigationProvider } from "./contexts/navigation";
import { AuthProvider } from "./hooks/useAuth"; // Import AuthProvider
import { useScreenSizeClass } from "./utils/media-query";
import Content from "./Content";
import ProtectedRoute from "./components/ProtectedRoute/protectedRoute";
import UnauthenticatedContent from "./UnauthenticatedContent";
import { fetchNavigationItems } from "./redux/actions/navigationActions";
import { loadUser } from "./redux/actions/AuthActions";
import { initializeAxiosInstance } from "./api/axiosInstance";
import GlobalErrorBoundary from "./GlobalErrorBoundary";
import ErrorBoundary from "./pages/ATG/fuelingprocess/Components/ErrorBoundary";
import webPushNotificationService from "./services/webPushNotificationService";

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth);
  const [isApiInitialized, setIsApiInitialized] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeAxiosInstance(); // Initialize Axios instance
        setIsApiInitialized(true);

        // SignalR connection is now manual - components will start it when needed

        //Cursor: Only load user if there's a token in localStorage
        const token = localStorage.getItem('token');
        if (token) {
          console.log('🔑 Token found, loading user data...');
          const result = await dispatch(loadUser());

          // If token is invalid or expired, loadUser will handle cleanup
          if (!result || !result.success) {
            console.log('⚠️ Token validation failed - user will be logged out');
          }
        } else {
          console.log('🔓 No token found, skipping user load');
        }
      } catch (error) {
        console.error('❌ Failed to initialize app:', error);
        // Still set API as initialized to prevent infinite loading
        setIsApiInitialized(true);
      }
    };
    initialize();
  }, [dispatch]);

  // Initialize push notifications when user is authenticated
  useEffect(() => {
    const initializePushNotifications = async () => {
      if (isAuthenticated && user) {
        console.log('📲 [App] User authenticated, initializing web push notifications...');
        try {
          // Check if push is already enabled or if user has previously granted permission
          const permission = webPushNotificationService.getPermissionStatus();

          if (permission === 'granted') {
            // User already granted permission, auto-register
            const success = await webPushNotificationService.enablePushNotifications();
            if (success) {
              console.log('✅ [App] Web push notifications enabled');
            }
          } else if (permission === 'default') {
            // Permission not yet requested - will be requested via preferences UI
            console.log('ℹ️ [App] Push permission not yet requested');
          }
          // If 'denied', don't try to request again
        } catch (error) {
          console.warn('⚠️ [App] Web push init failed:', error.message);
        }
      } else if (!isAuthenticated) {
        // Cleanup on logout
        webPushNotificationService.cleanup();
      }
    };

    initializePushNotifications();
  }, [isAuthenticated, user]);

  //Cursor: Only show loading if API is not initialized or if we're actually loading user data (and there's a token)
  const shouldShowLoading = !isApiInitialized || (loading && localStorage.getItem('token'));

  if (shouldShowLoading) {
    return <LoadPanel visible={true} />;
  }

  // CRITICAL FIX: Check for BOTH token AND user data
  // This prevents the "app loads but no user in header" issue
  const isFullyAuthenticated = isAuthenticated && user;

  if (isAuthenticated && !user) {
    console.warn('⚠️ Token exists but no user data - redirecting to login');
    // Token exists but no user = invalid state, force logout
    localStorage.removeItem('token');
    return <UnauthenticatedContent />;
  }

  return isFullyAuthenticated ? <Content /> : <UnauthenticatedContent />;
}
export default function Root() {
  const screenSizeClass = useScreenSizeClass();

  return (
        <GlobalErrorBoundary>
    <AuthProvider>
      <NavigationProvider>
        <div className={`app ${screenSizeClass}`}>
          <App />
        </div>
      </NavigationProvider>
    </AuthProvider>
    </GlobalErrorBoundary>
  );
}
