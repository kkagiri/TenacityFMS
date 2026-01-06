/**
 * FMS Mobile App Entry Point
 * @format
 */

import "react-native-gesture-handler";
import { AppRegistry, LogBox } from "react-native";
import App from "./src/App";
import { name as appName } from "./package.json";

// Suppress specific warnings that are known and non-critical
LogBox.ignoreLogs([
  "Non-serializable values were found in the navigation state",
  "Remote debugger",
  "Require cycle:", // Common in React Native
  "VirtualizedLists should never be nested",
  "componentWillReceiveProps has been renamed",
  "componentWillMount has been renamed",
]);

/**
 * Global error handler for uncaught errors
 * This catches errors that escape React's error boundaries
 */
const globalErrorHandler = (error, isFatal) => {
  // Log all errors for debugging
  console.error(
    "🔴 [Global Error Handler] Uncaught error:",
    error?.message || error
  );

  if (__DEV__) {
    console.error("🔴 [Global Error Handler] Is fatal:", isFatal);
    console.error("🔴 [Global Error Handler] Stack:", error?.stack);
  }

  if (isFatal) {
    console.error("🔴 [Global Error Handler] Fatal error - app may restart");
    // In production, you might want to:
    // 1. Log to crash reporting service (e.g., Sentry, Crashlytics)
    // 2. Show a friendly error screen
    // 3. Attempt graceful recovery
  }
};

// Set global error handler
try {
  if (typeof ErrorUtils !== "undefined" && ErrorUtils.setGlobalHandler) {
    ErrorUtils.setGlobalHandler(globalErrorHandler);
    console.log("✅ [Index] Global error handler installed");
  }
} catch (e) {
  console.warn("⚠️ [Index] Failed to set global error handler:", e?.message);
}

/**
 * Handle unhandled promise rejections
 * These can cause silent failures that are hard to debug
 */
const setupPromiseRejectionHandler = () => {
  // Track unhandled rejections
  const unhandledRejections = new Map();

  // Note: In React Native, we can't override Promise.reject directly
  // Instead, we rely on the global error handler and proper async/await usage

  if (typeof global.Promise !== "undefined") {
    // Log when promises are rejected
    const originalThen = Promise.prototype.then;
    Promise.prototype.then = function (onFulfilled, onRejected) {
      return originalThen.call(
        this,
        onFulfilled,
        onRejected ||
          ((error) => {
            console.error(
              "🔴 [Unhandled Promise Rejection]:",
              error?.message || error
            );
            throw error;
          })
      );
    };
  }
};

try {
  setupPromiseRejectionHandler();
} catch (e) {
  console.warn(
    "⚠️ [Index] Failed to setup promise rejection handler:",
    e?.message
  );
}

console.log("🚀 [Index] Registering app component:", appName);

// Register the main app component
try {
  AppRegistry.registerComponent(appName, () => App);
  console.log("✅ [Index] App component registered successfully");
} catch (e) {
  console.error("❌ [Index] Failed to register app component:", e);
}
