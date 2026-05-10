/**
 * SplashScreen - Initial loading screen with branding
 * Shows app logo, name, and loading indicator
 *
 * Fixed: Added error handling for image loading to prevent black screen
 */
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  Animated,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { APP_VERSION } from "../../config/appVersion";

const { width, height } = Dimensions.get("window");

// Fallback logo component when image fails to load
const FallbackLogo = () => (
  <View style={styles.fallbackLogo}>
    <Text style={styles.fallbackLogoText}>H</Text>
  </View>
);

const SplashScreen = ({
  message = "Loading...",
  showRetry = false,
  onRetry,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [imageError, setImageError] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Set ready immediately to ensure something shows
    // This prevents black screen on slow devices
    setIsReady(true);

    // Start animations with a small delay to ensure component is mounted
    const animationTimer = setTimeout(() => {
      try {
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
      } catch (animError) {
        console.warn("[SplashScreen] Animation error:", animError);
      }
    }, 50);

    return () => {
      clearTimeout(animationTimer);
      try {
        pulseAnim.stopAnimation();
      } catch (e) {
        // Ignore cleanup errors
      }
    };
  }, [fadeAnim, scaleAnim, pulseAnim]);

  // Handle image load error
  const handleImageError = (error) => {
    console.warn(
      "[SplashScreen] Logo image failed to load:",
      error?.nativeEvent?.error
    );
    setImageError(true);
  };

  // Early return with basic view if not ready (prevents black screen)
  if (!isReady) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

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
        {/* Logo - with fallback for image load errors */}
        <View style={styles.logoContainer}>
          {imageError ? (
            <FallbackLogo />
          ) : (
            <Image
              source={require("../../assets/images/tenacy-logo.png")}
              style={styles.logo}
              resizeMode="contain"
              onError={handleImageError}
            />
          )}
        </View>

        {/* App Name */}
        <Text style={styles.appName}>Tenacy FMS</Text>
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
            <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>

      {/* App Info at bottom */}
      <View style={styles.appInfo}>
        <Text style={styles.appVersion}>{APP_VERSION.displayName}</Text>
        <Text style={styles.appBuild}>Build {APP_VERSION.versionCode}</Text>
        <Text style={styles.copyright}>© 2026 Tenacy FMS</Text>
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
    marginBottom: 2,
  },
  appBuild: {
    fontSize: 11,
    color: "#64748b",
    marginBottom: 4,
  },
  copyright: {
    fontSize: 12,
    color: "#475569",
  },
  // Fallback logo styles when image fails to load
  fallbackLogo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
  },
  fallbackLogoText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "white",
  },
});

export default SplashScreen;
