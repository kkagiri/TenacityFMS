import React, { useEffect, useState } from "react";
import { StatusBar, LogBox } from "react-native";
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

// Ignore specific warnings
LogBox.ignoreLogs([
  "Non-serializable values were found in the navigation state",
  "Remote debugger",
]);

// Inner component that handles initialization
const AppContent = () => {
  const dispatch = useDispatch();
  const [isInitializing, setIsInitializing] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Starting up...");
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setHasError(false);
      setIsInitializing(true);

      // Log environment config for debugging
      ENV.printConfig();

      setLoadingMessage("Testing connection...");

      // Test API connectivity
      const connectionTest = await ENV.testConnection();
      if (!connectionTest.success) {
        console.warn(
          "API connection test failed:",
          connectionTest.error || connectionTest.status
        );
        setLoadingMessage("Server may be unreachable...");
      } else {
        console.log("API connection successful");
      }

      setLoadingMessage("Checking authentication...");

      // Check if user is already authenticated
      await dispatch(checkAuthStatus()).unwrap();

      setLoadingMessage("Ready!");

      // Small delay to show "Ready!" message
      setTimeout(() => {
        setIsInitializing(false);
      }, 500);
    } catch (error) {
      console.error("App initialization error:", error);
      setHasError(true);
      setLoadingMessage("Failed to initialize");
      // Still proceed to app even on error
      setTimeout(() => {
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
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor="#1f2937" />
      <AppNavigator />
      <Toast />
    </NavigationContainer>
  );
};

const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <PersistGate
          loading={<SplashScreen message="Loading data..." />}
          persistor={persistor}
        >
          <AppContent />
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
};

export default App;
