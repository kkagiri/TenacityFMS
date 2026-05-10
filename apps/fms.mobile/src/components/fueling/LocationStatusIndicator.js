/**
 * LocationStatusIndicator - GPS Status Display with Manual Refresh
 * Shows current GPS location status (age, accuracy) and provides manual refresh button
 * Used in fueling process to help users get fresh GPS fix before authorization
 */
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";
import locationService from "../../services/locationService";

/**
 * GPS Status states
 */
const LocationStatus = {
  UNKNOWN: "unknown",
  FETCHING: "fetching",
  FRESH: "fresh",
  STALE: "stale",
  ERROR: "error",
  DISABLED: "disabled",
};

/**
 * LocationStatusIndicator Component
 * @param {Object} props
 * @param {Function} props.onLocationUpdate - Callback when location is updated
 * @param {number} props.maxAgeSeconds - Max acceptable age (default: 60)
 * @param {boolean} props.autoRefreshOnMount - Whether to fetch location on mount (default: true)
 * @param {boolean} props.showDetails - Show detailed location info (default: true)
 * @param {Object} props.style - Additional container styles
 */
const LocationStatusIndicator = ({
  onLocationUpdate,
  maxAgeSeconds = 60,
  autoRefreshOnMount = true,
  showDetails = true,
  style,
}) => {
  const [status, setStatus] = useState(LocationStatus.UNKNOWN);
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [locationAge, setLocationAge] = useState(null);

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);
  // Track if a refresh is in progress to prevent duplicate calls
  const refreshInProgressRef = useRef(false);

  // Animation for pulse effect when fetching
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      // Cancel any pending location requests when component unmounts
      locationService.cancelPendingLocationRequest();
    };
  }, []);

  // Update location age every second
  useEffect(() => {
    const updateAge = () => {
      if (location?.timestamp) {
        const ageSeconds = (Date.now() - new Date(location.timestamp).getTime()) / 1000;
        setLocationAge(Math.round(ageSeconds));

        // Update status based on age
        if (ageSeconds > maxAgeSeconds) {
          setStatus(LocationStatus.STALE);
        } else {
          setStatus(LocationStatus.FRESH);
        }
      }
    };

    updateAge();
    const interval = setInterval(updateAge, 1000);
    return () => clearInterval(interval);
  }, [location, maxAgeSeconds]);

  // Pulse animation when fetching
  useEffect(() => {
    if (isRefreshing) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.6,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRefreshing, pulseAnim]);

  /**
   * Refresh GPS location
   */
  const handleRefreshLocation = useCallback(async () => {
    // Prevent duplicate concurrent requests
    if (isRefreshing || refreshInProgressRef.current) {
      console.log("[LocationStatusIndicator] Refresh already in progress, skipping");
      return;
    }

    refreshInProgressRef.current = true;
    setIsRefreshing(true);
    setStatus(LocationStatus.FETCHING);
    setError(null);

    try {
      // First ensure settings are loaded
      await locationService.loadServerSettings();

      // Check if still mounted before continuing
      if (!isMountedRef.current) {
        console.log("[LocationStatusIndicator] Component unmounted, aborting refresh");
        return;
      }

      // Force a fresh GPS fix - clear cache and get new location
      const result = await locationService.getFreshLocationForAuthorization({
        maxAgeSeconds,
        maxAccuracyMeters: 500,
        silentMode: true, // Don't show alerts, we'll handle display here
        rejectCached: true, // Force fresh location
      });

      // Check if still mounted before updating state
      if (!isMountedRef.current) {
        console.log("[LocationStatusIndicator] Component unmounted after fetch, not updating state");
        return;
      }

      if (result.location) {
        setLocation(result.location);
        setStatus(LocationStatus.FRESH);
        setError(null);

        // Notify parent component
        onLocationUpdate?.(result.location);

        console.log(
          "[LocationStatusIndicator] Fresh location obtained:",
          `lat=${result.location.latitude}, lng=${result.location.longitude}, accuracy=${result.location.accuracy}m`
        );
      } else {
        setStatus(LocationStatus.ERROR);
        setError(result.error || "Could not get GPS location");
        onLocationUpdate?.(null);
      }
    } catch (err) {
      console.error("[LocationStatusIndicator] Error refreshing location:", err);
      // Only update state if still mounted
      if (isMountedRef.current) {
        setStatus(LocationStatus.ERROR);
        setError(err.message || "Failed to get location");
        onLocationUpdate?.(null);
      }
    } finally {
      refreshInProgressRef.current = false;
      if (isMountedRef.current) {
        setIsRefreshing(false);
      }
    }
  }, [isRefreshing, maxAgeSeconds, onLocationUpdate]);

  // Auto-refresh on mount if enabled
  useEffect(() => {
    if (autoRefreshOnMount) {
      // Check if we have a recent cached location first
      const cached = locationService.getLastKnownLocation();
      if (cached && !locationService.isLocationStale(cached, maxAgeSeconds)) {
        setLocation(cached);
        setStatus(LocationStatus.FRESH);
        onLocationUpdate?.(cached);
      } else {
        // Need to fetch fresh location
        handleRefreshLocation();
      }
    }
  }, [autoRefreshOnMount, maxAgeSeconds]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Get status configuration (icon, color, text)
   */
  const getStatusConfig = () => {
    switch (status) {
      case LocationStatus.FRESH:
        return {
          icon: "check-circle",
          iconType: "solid",
          color: "#10b981",
          bgColor: "#d1fae5",
          borderColor: "#6ee7b7",
          text: "GPS Ready",
          subtext: locationAge !== null ? `Updated ${locationAge}s ago` : null,
        };
      case LocationStatus.STALE:
        return {
          icon: "exclamation-triangle",
          iconType: "solid",
          color: "#f59e0b",
          bgColor: "#fef3c7",
          borderColor: "#fcd34d",
          text: "GPS Stale",
          subtext: locationAge !== null ? `${locationAge}s old - Refresh needed` : "Refresh needed",
        };
      case LocationStatus.FETCHING:
        return {
          icon: "satellite-dish",
          iconType: "solid",
          color: "#3b82f6",
          bgColor: "#dbeafe",
          borderColor: "#93c5fd",
          text: "Getting GPS...",
          subtext: "Please wait",
        };
      case LocationStatus.ERROR:
        return {
          icon: "times-circle",
          iconType: "solid",
          color: "#ef4444",
          bgColor: "#fee2e2",
          borderColor: "#fca5a5",
          text: "GPS Error",
          subtext: error || "Tap to retry",
        };
      case LocationStatus.DISABLED:
        return {
          icon: "location-slash",
          iconType: "solid",
          color: "#6b7280",
          bgColor: "#f3f4f6",
          borderColor: "#d1d5db",
          text: "GPS Disabled",
          subtext: "Enable in settings",
        };
      default:
        return {
          icon: "location-arrow",
          iconType: "solid",
          color: "#6b7280",
          bgColor: "#f3f4f6",
          borderColor: "#d1d5db",
          text: "GPS Status",
          subtext: "Tap to check",
        };
    }
  };

  const config = getStatusConfig();

  /**
   * Format accuracy for display
   */
  const formatAccuracy = (accuracy) => {
    if (!accuracy) return "Unknown";
    if (accuracy < 10) return `${Math.round(accuracy)}m (Excellent)`;
    if (accuracy < 30) return `${Math.round(accuracy)}m (Good)`;
    if (accuracy < 100) return `${Math.round(accuracy)}m (Fair)`;
    return `${Math.round(accuracy)}m (Poor)`;
  };

  return (
    <View style={[styles.container, style]}>
      {/* Main Status Card */}
      <TouchableOpacity
        style={[
          styles.statusCard,
          { backgroundColor: config.bgColor, borderColor: config.borderColor },
        ]}
        onPress={handleRefreshLocation}
        disabled={isRefreshing}
        activeOpacity={0.7}
      >
        <Animated.View
          style={[
            styles.iconContainer,
            { opacity: isRefreshing ? pulseAnim : 1 },
          ]}
        >
          {isRefreshing ? (
            <ActivityIndicator size="small" color={config.color} />
          ) : (
            <Icon name={config.icon} size={20} color={config.color} solid />
          )}
        </Animated.View>

        <View style={styles.textContainer}>
          <Text style={[styles.statusText, { color: config.color }]}>
            {config.text}
          </Text>
          {config.subtext && (
            <Text style={styles.subtextText}>{config.subtext}</Text>
          )}
        </View>

        {/* Refresh Button */}
        <TouchableOpacity
          style={[
            styles.refreshButton,
            isRefreshing && styles.refreshButtonDisabled,
          ]}
          onPress={handleRefreshLocation}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Icon name="sync" size={12} color="#ffffff" />
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </>
          )}
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Detailed Location Info (optional) */}
      {showDetails && location && status === LocationStatus.FRESH && (
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Icon name="crosshairs" size={12} color="#6b7280" />
            <Text style={styles.detailLabel}>Accuracy:</Text>
            <Text style={styles.detailValue}>
              {formatAccuracy(location.accuracy)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="map-pin" size={12} color="#6b7280" />
            <Text style={styles.detailLabel}>Coords:</Text>
            <Text style={styles.detailValue}>
              {location.latitude?.toFixed(5)}, {location.longitude?.toFixed(5)}
            </Text>
          </View>
        </View>
      )}

      {/* Error Details */}
      {status === LocationStatus.ERROR && error && (
        <View style={styles.errorDetails}>
          <Icon name="info-circle" size={12} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Help Text for Stale Location */}
      {status === LocationStatus.STALE && (
        <View style={styles.helpContainer}>
          <Icon name="lightbulb" size={12} color="#f59e0b" />
          <Text style={styles.helpText}>
            Tap "Refresh" to get a new GPS fix before authorizing
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.5)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 15,
    fontWeight: "600",
  },
  subtextText: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563eb",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  refreshButtonDisabled: {
    backgroundColor: "#93c5fd",
  },
  refreshButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  detailsContainer: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailLabel: {
    fontSize: 11,
    color: "#6b7280",
    marginLeft: 4,
  },
  detailValue: {
    fontSize: 11,
    color: "#374151",
    fontWeight: "500",
  },
  errorDetails: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  errorText: {
    fontSize: 12,
    color: "#ef4444",
    flex: 1,
  },
  helpContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  helpText: {
    fontSize: 12,
    color: "#92400e",
    flex: 1,
    fontStyle: "italic",
  },
});

export default LocationStatusIndicator;
export { LocationStatus };
