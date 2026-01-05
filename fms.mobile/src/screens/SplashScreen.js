/**
 * SplashScreen - Initial loading screen with branding
 * Shows app logo, name, and loading indicator
 */
import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  Animated,
  Dimensions,
} from "react-native";

const { width, height } = Dimensions.get("window");

const SplashScreen = ({
  message = "Loading...",
  showRetry = false,
  onRetry,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Fade in and scale animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for loader
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [fadeAnim, scaleAnim, pulseAnim]);

  return (
    <View style={styles.container}>
      {/* Background gradient effect */}
      <View style={styles.backgroundTop} />
      <View style={styles.backgroundBottom} />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require("../assets/images/hyoung-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* App Name */}
        <Text style={styles.appName}>Hyoung FMS</Text>
        <Text style={styles.appSubtitle}>Fleet Management System</Text>

        {/* Loading Indicator */}
        <Animated.View
          style={[
            styles.loaderContainer,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <ActivityIndicator size="large" color="#2563eb" />
        </Animated.View>

        {/* Loading Message */}
        <Text style={styles.message}>{message}</Text>

        {/* Retry Button (if error) */}
        {showRetry && onRetry && (
          <View style={styles.retryContainer}>
            <Text style={styles.errorText}>
              Failed to load. Please try again.
            </Text>
            <View style={styles.retryButton}>
              <Text style={styles.retryButtonText} onPress={onRetry}>
                Retry
              </Text>
            </View>
          </View>
        )}
      </Animated.View>

      {/* App Info at bottom */}
      <View style={styles.appInfo}>
        <Text style={styles.appVersion}>Hyoung FMS v1.0.1</Text>
        <Text style={styles.copyright}>© 2026 Hyoung FMS</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f172a",
  },
  backgroundTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.4,
    backgroundColor: "#1e3a5f",
    borderBottomLeftRadius: 100,
    borderBottomRightRadius: 100,
  },
  backgroundBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.3,
    backgroundColor: "#0c1929",
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 40,
  },
  logoContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 15,
  },
  logo: {
    width: 100,
    height: 100,
  },
  appName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  appSubtitle: {
    fontSize: 16,
    color: "#94a3b8",
    marginBottom: 40,
    letterSpacing: 1,
  },
  loaderContainer: {
    marginBottom: 20,
  },
  message: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
  },
  retryContainer: {
    marginTop: 30,
    alignItems: "center",
  },
  errorText: {
    fontSize: 14,
    color: "#ef4444",
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  appInfo: {
    position: "absolute",
    bottom: 30,
    alignItems: "center",
  },
  appVersion: {
    fontSize: 14,
    color: "#94a3b8",
    fontWeight: "600",
    marginBottom: 4,
  },
  copyright: {
    fontSize: 12,
    color: "#475569",
  },
});

export default SplashScreen;
