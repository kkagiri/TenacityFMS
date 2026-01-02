/**
 * @format
 */

import "react-native-gesture-handler";
import { AppRegistry } from "react-native";
import App from "./src/App";
import { name as appName } from "./package.json";

// Global error handler for uncaught errors
const globalErrorHandler = (error, isFatal) => {
  console.error("🔴 [Global Error Handler] Uncaught error:", error);
  console.error("🔴 [Global Error Handler] Is fatal:", isFatal);
  console.error("🔴 [Global Error Handler] Stack:", error.stack);

  if (isFatal) {
    console.error("🔴 [Global Error Handler] Fatal error - app will crash");
  }
};

// Set global error handlers
if (ErrorUtils) {
  ErrorUtils.setGlobalHandler(globalErrorHandler);
}

// Catch promise rejections
const originalHandler = global.Promise.prototype.catch;
global.Promise.prototype.catch = function (onRejected) {
  return originalHandler.call(this, function (error) {
    console.error("🔴 [Unhandled Promise Rejection]:", error);
    if (onRejected) {
      return onRejected(error);
    }
    throw error;
  });
};

console.log("✅ [Index] Global error handlers installed");
console.log("🚀 [Index] Registering app component:", appName);

AppRegistry.registerComponent(appName, () => App);
