//Cursor - Mobile Loading Overlay Component
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";

const LoadingOverlay = ({
  visible = true,
  message = "Loading...",
  subMessage = null,
  transparent = true,
  // Error state props
  hasError = false,
  errorMessage = null,
  onRetry = null,
  onCancel = null,
  retryLabel = "Retry",
  cancelLabel = "Cancel",
}) => {
  if (!visible) return null;

  // Determine if error message is long (multi-line validation errors)
  const isLongError = errorMessage && errorMessage.length > 50;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            hasError && isLongError && styles.containerWide,
          ]}
        >
          {!hasError ? (
            // Loading state
            <>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={styles.message}>{message}</Text>
              {subMessage && (
                <Text style={styles.subMessage}>{subMessage}</Text>
              )}
              {onCancel && (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={onCancel}
                >
                  <Text style={styles.cancelButtonText}>{cancelLabel}</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            // Error state with retry
            <>
              <View style={styles.errorIconContainer}>
                <Icon name="exclamation-circle" size={40} color="#ef4444" />
              </View>
              <Text style={styles.errorTitle}>
                {isLongError ? "Authorization Failed" : "Error"}
              </Text>
              <Text
                style={[
                  styles.errorMessage,
                  isLongError && styles.errorMessageWide,
                ]}
              >
                {errorMessage || "Something went wrong"}
              </Text>
              <View style={styles.buttonRow}>
                {onCancel && (
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButtonSecondary]}
                    onPress={onCancel}
                  >
                    <Text style={styles.cancelButtonSecondaryText}>
                      {cancelLabel}
                    </Text>
                  </TouchableOpacity>
                )}
                {onRetry && (
                  <TouchableOpacity
                    style={[styles.button, styles.retryButton]}
                    onPress={onRetry}
                  >
                    <Icon
                      name="redo"
                      size={14}
                      color="white"
                      style={styles.buttonIcon}
                    />
                    <Text style={styles.retryButtonText}>{retryLabel}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: "white",
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 200,
    maxWidth: 300,
  },
  containerWide: {
    maxWidth: "85%",
    paddingHorizontal: 24,
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    color: "#374151",
    textAlign: "center",
  },
  subMessage: {
    marginTop: 8,
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
  },
  cancelButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  cancelButtonText: {
    fontSize: 14,
    color: "#6b7280",
  },
  // Error state styles
  errorIconContainer: {
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  errorMessageWide: {
    textAlign: "left",
    lineHeight: 22,
    fontSize: 15,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
  },
  cancelButtonSecondary: {
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cancelButtonSecondaryText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  retryButton: {
    backgroundColor: "#2563eb",
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
  },
  buttonIcon: {
    marginRight: 6,
  },
});

export default LoadingOverlay;
