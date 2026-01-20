import React, {
  useEffect,
  useState,
  Component,
  useRef,
  useCallback,
} from "react";
import {
  StatusBar,
  LogBox,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  AppState,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { Provider, useDispatch, useSelector } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import Toast from "react-native-toast-message";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { store, persistor } from "./redux/store";
import AppNavigator from "./navigation/AppNavigator";
import SplashScreen from "./screens/SplashScreen";
import { checkAuthStatus } from "./redux/slices/authSlice";
import { ENV } from "./config/environment";
import fuelingNotificationService from "./services/fuelingNotificationService";
import signalRService from "./services/signalRService";
import pushNotificationService, {
  setupBackgroundMessageHandler,
} from "./services/pushNotificationService";
import { navigationRef } from "./services/navigationService";

// Setup background message handler at app startup (must be outside component)
setupBackgroundMessageHandler();

// Ignore specific warnings
LogBox.ignoreLogs([
  "Non-serializable values were found in the navigation state",
  "Remote debugger",
  "Require cycle:", // Common in React Native
  "VirtualizedLists should never be nested", // Common warning
]);

// Error Boundary Component
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("❌ [App Error Boundary] Caught error:", error);
    console.error("❌ [App Error Boundary] Error info:", errorInfo);
    this.setState({ error, errorInfo });
  }

  handleRestart = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <View style={errorStyles.content}>
            <Text style={errorStyles.title}>⚠️ Something went wrong</Text>
            <Text style={errorStyles.message}>
              {this.state.error?.toString() || "Unknown error occurred"}
            </Text>
            <TouchableOpacity
              style={errorStyles.button}
              onPress={this.handleRestart}
            >
              <Text style={errorStyles.buttonText}>Restart App</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1f2937",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  content: {
    backgroundColor: "#374151",
    padding: 24,
    borderRadius: 12,
    width: "100%",
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#f87171",
    marginBottom: 16,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    color: "#d1d5db",
    marginBottom: 24,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#3b82f6",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

// Inner component that handles initialization
const AppContent = () => {
  const dispatch = useDispatch();
  const [isInitializing, setIsInitializing] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Starting up...");
  const [hasError, setHasError] = useState(false);

  // App state management for SignalR reconnection
  const appState = useRef(AppState.currentState);
  const backgroundTimestamp = useRef(null);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const authToken = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);
  // Handle both PascalCase (Id) and camelCase (id) for user ID
  const userId = user?.Id || user?.id;

  // Handle navigation ready - setup notification open handlers
  // This must be defined before any conditional returns (React hooks rule)
  const handleNavigationReady = useCallback(() => {
    console.log("🧭 [App] Navigation ready, setting up notification handlers...");
    pushNotificationService.setupNotificationOpenHandlers();
  }, []);

  // Initialize push notifications when user authenticates
  useEffect(() => {
    const initializePushNotifications = async () => {
      console.log("📲 [App] Push init check:", { isAuthenticated, hasToken: !!authToken, userId, userKeys: user ? Object.keys(user) : null });

      if (isAuthenticated && authToken && userId) {
        console.log("📲 [App] User authenticated, initializing push notifications...");
        try {
          const success = await pushNotificationService.initialize(authToken, userId);
          if (success) {
            console.log("✅ [App] Push notifications initialized");
          } else {
            console.log("ℹ️ [App] Push notifications not available or disabled");
          }
        } catch (error) {
          console.warn("⚠️ [App] Push notification init failed:", error.message);
        }
      } else if (!isAuthenticated) {
        // Cleanup push notifications on logout
        pushNotificationService.cleanup();
      }
    };

    initializePushNotifications();
  }, [isAuthenticated, authToken, userId, user]);

  // Handle app state changes for SignalR connection management
  const handleAppStateChange = useCallback(
    async (nextAppState) => {
      const previousState = appState.current;

      console.log(`📱 [App] State change: ${previousState} -> ${nextAppState}`);

      // App is going to background
      if (nextAppState === "background" || nextAppState === "inactive") {
        backgroundTimestamp.current = Date.now();
        console.log("[App] Going to background, pausing SignalR...");
        signalRService.pause();
      }

      // App is coming to foreground
      if (previousState !== "active" && nextAppState === "active") {
        console.log("[App] Returning to foreground");

        const wasInBackground = backgroundTimestamp.current !== null;
        const timeInBackground = wasInBackground
          ? Date.now() - backgroundTimestamp.current
          : 0;

        console.log(
          `[App] Time in background: ${Math.round(timeInBackground / 1000)}s`
        );

        // Only attempt reconnection if user is authenticated
        if (isAuthenticated) {
          try {
            // Resume SignalR (it will check if reconnection is needed)
            const resumed = await signalRService.resume();
            if (resumed) {
              console.log("[App] ✅ SignalR resumed successfully");
            } else {
              console.warn("[App] ⚠️ SignalR resume returned false");
            }
          } catch (error) {
            console.error("[App] ❌ SignalR resume failed:", error.message);
            // Don't crash the app, just log the error
            // User can manually retry via pull-to-refresh on screens
          }
        }

        backgroundTimestamp.current = null;
      }

      appState.current = nextAppState;
    },
    [isAuthenticated]
  );

  // Subscribe to app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      if (subscription?.remove) {
        subscription.remove();
      }
    };
  }, [handleAppStateChange]);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    console.log("🚀 [App] Starting initialization...");

    try {
      setHasError(false);
      setIsInitializing(true);

      // Step 1: Log environment config
      console.log("📋 [App] Step 1: Loading environment config...");
      try {
        ENV.printConfig();
      } catch (envError) {
        console.warn("⚠️ [App] Environment config warning:", envError.message);
      }

      // Step 2: Test API connectivity (non-blocking)
      setLoadingMessage("Testing connection...");
      console.log("🌐 [App] Step 2: Testing API connectivity...");
      try {
        const connectionTest = await ENV.testConnection();
        if (!connectionTest.success) {
          console.warn(
            "⚠️ [App] API connection test failed:",
            connectionTest.error || connectionTest.status
          );
          setLoadingMessage("Server may be unreachable...");
        } else {
          console.log("✅ [App] API connection successful");
        }
      } catch (connError) {
        console.warn("⚠️ [App] Connection test failed:", connError.message);
        // Continue anyway - user might still be able to login
      }

      // Step 3: Check authentication status
      setLoadingMessage("Checking authentication...");
      console.log("🔐 [App] Step 3: Checking authentication status...");
      try {
        await dispatch(checkAuthStatus()).unwrap();
        console.log("✅ [App] Auth status checked");
      } catch (authError) {
        console.log(
          "ℹ️ [App] No existing auth session (normal for first launch):",
          authError.message
        );
        // This is expected if user is not logged in
      }

      // Step 4: Initialize notification service (non-critical)
      setLoadingMessage("Setting up notifications...");
      console.log("🔔 [App] Step 4: Initializing notification service...");
      try {
        await fuelingNotificationService.initialize();
        console.log("✅ [App] Notification service initialized");
      } catch (notifError) {
        console.warn(
          "⚠️ [App] Notification service failed (non-critical):",
          notifError.message
        );
        // Non-critical - app can work without notifications
      }

      setLoadingMessage("Ready!");
      console.log("✅ [App] Initialization complete");

      // Small delay to show "Ready!" message
      setTimeout(() => {
        setIsInitializing(false);
      }, 500);
    } catch (error) {
      console.error("❌ [App] Critical initialization error:", error);
      console.error("❌ [App] Error stack:", error.stack);
      setHasError(true);
      setLoadingMessage("Failed to initialize");

      // Still proceed to app even on error - let user try to continue
      setTimeout(() => {
        console.log("⚠️ [App] Proceeding despite initialization error...");
        setIsInitializing(false);
      }, 1000);
    }
  };

  if (isInitializing) {
    return (
      <SplashScreen
        message={loadingMessage}
        showRetry={hasError}
        onRetry={initializeApp}
      />
    );
  }

  return (
    <NavigationContainer ref={navigationRef} onReady={handleNavigationReady}>
      <StatusBar barStyle="light-content" backgroundColor="#1f2937" />
      <AppNavigator />
      <Toast />
    </NavigationContainer>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Provider store={store}>
          <PersistGate
            loading={<SplashScreen message="Loading data..." />}
            persistor={persistor}
            onBeforeLift={() => {
              console.log("📦 [App] Redux store rehydrated");
            }}
          >
            <AppContent />
          </PersistGate>
        </Provider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
};

export default App;
