/**
 * File: VehicleLiveMap.js
 * Purpose: Embedded Google Maps showing live vehicle positions with SignalR streaming.
 *          Uses react-native-maps (MapView) with vehicle markers, callouts, and auto-tracking.
 *          Gracefully falls back to a vehicle list if native map module is unavailable.
 *
 * Requires: npm install react-native-maps@1.14.0
 *           + Google Maps API key in AndroidManifest.xml and iOS AppDelegate
 *           + Clean native rebuild after install (cd android && ./gradlew clean)
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Linking,
  Alert,
  UIManager,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";
import { useSelector } from "react-redux";
import ApiService from "../../services/apiService";

// ─── Safe native module detection ──────────────────────────────────
// require("react-native-maps") can succeed (JS exists in node_modules)
// but the native AIRMap component may not be registered if the app
// wasn't rebuilt after `npm install`. We check UIManager to be sure.
let MapView = null;
let Marker = null;
let Callout = null;
let PROVIDER_GOOGLE = null;
let isMapAvailable = false;

try {
  // Check if native component is actually registered BEFORE importing
  const hasNativeMap =
    UIManager.getViewManagerConfig &&
    !!UIManager.getViewManagerConfig("AIRMap");

  if (hasNativeMap) {
    const Maps = require("react-native-maps");
    MapView = Maps.default;
    Marker = Maps.Marker;
    Callout = Maps.Callout;
    PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
    isMapAvailable = true;
    console.log("[VehicleLiveMap] react-native-maps native module available");
  } else {
    console.log("[VehicleLiveMap] AIRMap native component not found - using fallback");
  }
} catch (err) {
  console.log("[VehicleLiveMap] react-native-maps not installed - using fallback");
  isMapAvailable = false;
}

const VehicleLiveMap = ({ selectedVehicle, onSelectVehicle }) => {
  const mapRef = useRef(null);
  const hasFittedRef = useRef(false);
  // Select ONLY the fields we need — NOT the entire slice
  const vehicleLocations = useSelector((state) => state.vehicle.vehicleLocations);
  const liveLocations = useSelector((state) => state.vehicle.liveLocations);
  const [mapReady, setMapReady] = useState(false);
  const [followSelected, setFollowSelected] = useState(true);

  // Single vehicle location fetch (for detail view when vehicleLocations is empty)
  const [singleVehicleLocation, setSingleVehicleLocation] = useState(null);
  const [singleVehicleLoading, setSingleVehicleLoading] = useState(false);

  const selectedVehicleId = selectedVehicle?.vehicleId || selectedVehicle?.VehicleId || selectedVehicle?.id || selectedVehicle?.Id;

  // Fetch selected vehicle's GPS location when in single-vehicle detail view
  useEffect(() => {
    if (!selectedVehicleId || vehicleLocations.length > 0) {
      return; // Skip if no vehicle selected or if bulk locations exist
    }
    let isMounted = true;
    setSingleVehicleLoading(true);

    ApiService.getVehicleGPSInfo(selectedVehicleId)
      .then((response) => {
        if (!isMounted) return;
        const data = response?.data || response?.Data || response;
        if (data && (data.latitude || data.Latitude)) {
          setSingleVehicleLocation({
            vehicleId: selectedVehicleId,
            vehicleCode: selectedVehicle?.vehicleCode || selectedVehicle?.VehicleCode || "",
            vehicleName: selectedVehicle?.vehicleName || selectedVehicle?.VehicleName || "",
            numberPlate: selectedVehicle?.numberPlate || selectedVehicle?.NumberPlate || "",
            latitude: data.latitude || data.Latitude,
            longitude: data.longitude || data.Longitude,
            speed: data.speed || data.Speed || 0,
            speedKmh: data.speed || data.Speed || 0,
            heading: data.heading || data.Heading || 0,
            isOnline: data.isOnline !== undefined ? data.isOnline : true,
            isMoving: (data.speed || data.Speed || 0) > 2,
          });
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn("[VehicleLiveMap] Failed to fetch vehicle GPS:", err.message);
      })
      .finally(() => {
        if (isMounted) setSingleVehicleLoading(false);
      });

    return () => { isMounted = false; };
  }, [selectedVehicleId, vehicleLocations.length]);

  // Merge locations with live data (use single vehicle as fallback)
  const vehicles = useMemo(() => {
    const baseList = vehicleLocations.length > 0
      ? vehicleLocations
      : (singleVehicleLocation ? [singleVehicleLocation] : []);

    return baseList
      .map((v) => {
        const vId = v.vehicleId || v.VehicleId;
        const live = liveLocations[vId];
        return live ? { ...v, ...live } : v;
      })
      .filter((v) => {
        const lat = v.latitude || v.Latitude;
        const lng = v.longitude || v.Longitude;
        return lat && lng && lat !== 0 && lng !== 0;
      });
  }, [vehicleLocations, liveLocations, singleVehicleLocation]);

  // Selected vehicle's live data (selectedVehicleId already defined above)
  const selectedVehicleData = useMemo(() => {
    if (!selectedVehicleId) return null;
    return (
      vehicles.find((v) => (v.vehicleId || v.VehicleId) === selectedVehicleId) ||
      selectedVehicle
    );
  }, [selectedVehicleId, vehicles]);

  // Track the lat/lng as primitives so useEffect deps are stable
  const selectedLat = selectedVehicleData?.latitude || selectedVehicleData?.Latitude || 0;
  const selectedLng = selectedVehicleData?.longitude || selectedVehicleData?.Longitude || 0;

  // Auto-center on selected vehicle
  useEffect(() => {
    if (followSelected && selectedVehicleId && selectedLat && selectedLng && mapReady && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: selectedLat,
          longitude: selectedLng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        500
      );
    }
  }, [selectedLat, selectedLng, followSelected, mapReady, selectedVehicleId]);

  // Fit all vehicles once on first load
  const vehicleCount = vehicles.length;
  useEffect(() => {
    if (
      !selectedVehicleId &&
      mapReady &&
      vehicleCount > 0 &&
      !hasFittedRef.current &&
      mapRef.current
    ) {
      hasFittedRef.current = true;
      const coords = vehicles.map((v) => ({
        latitude: v.latitude || v.Latitude,
        longitude: v.longitude || v.Longitude,
      }));
      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
        animated: true,
      });
    }
  }, [mapReady, vehicleCount, selectedVehicleId]);

  const getVehicleStatus = useCallback((vehicle) => {
    const isOnline = vehicle.isOnline || vehicle.IsOnline;
    const speed = vehicle.speed || vehicle.Speed || vehicle.speedKmh || vehicle.SpeedKmh || 0;
    // Use isMoving if available, otherwise fall back to speed > 2 km/h (accounts for GPS drift)
    const isMoving = vehicle.isMoving || vehicle.IsMoving || speed > 2;
    return { isOnline, isMoving, speed };
  }, []);

  const getMarkerColor = useCallback((vehicle) => {
    const { isOnline, isMoving } = getVehicleStatus(vehicle);
    if (!isOnline) return "#9ca3af";
    if (isMoving) return "#8b5cf6";
    return "#f59e0b";
  }, [getVehicleStatus]);

  const openInExternalMaps = useCallback((vehicle) => {
    const lat = vehicle.latitude || vehicle.Latitude;
    const lng = vehicle.longitude || vehicle.Longitude;
    if (!lat || !lng) {
      Alert.alert("Error", "No GPS coordinates available");
      return;
    }
    const label =
      vehicle.vehicleCode ||
      vehicle.VehicleCode ||
      vehicle.vehicleName ||
      vehicle.VehicleName ||
      "Vehicle";
    const url = Platform.select({
      ios: `maps:?q=${label}&ll=${lat},${lng}`,
      android: `geo:${lat},${lng}?q=${lat},${lng}(${label})`,
    });
    const webUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

    Linking.canOpenURL(url)
      .then((supported) => Linking.openURL(supported ? url : webUrl))
      .catch(() => Linking.openURL(webUrl));
  }, []);

  // ─── Loading state (fetching single vehicle location) ──────────
  if (singleVehicleLoading && vehicles.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading vehicle location...</Text>
      </View>
    );
  }

  // ─── Fallback UI (no native maps available) ─────────────────────
  if (!isMapAvailable) {
    return (
      <ScrollView
        style={styles.fallbackContainer}
        contentContainerStyle={styles.fallbackContent}
      >
        <View style={styles.fallbackHeader}>
          <Icon name="map-marked-alt" size={36} color="#2563eb" />
          <Text style={styles.fallbackTitle}>Vehicle Locations</Text>
          <Text style={styles.fallbackText}>
            {vehicles.length} vehicles with GPS coordinates
          </Text>
        </View>

        {/* Selected vehicle info */}
        {selectedVehicleData && (
          <View style={styles.fallbackVehicleCard}>
            <View style={styles.fallbackVehicleHeader}>
              <View style={[styles.fallbackDotLarge, { backgroundColor: getMarkerColor(selectedVehicleData) }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.fallbackVehicleName}>
                  {selectedVehicleData.vehicleCode || selectedVehicleData.VehicleCode || selectedVehicleData.vehicleName || selectedVehicleData.VehicleName}
                </Text>
                <Text style={styles.fallbackVehicleCoords}>
                  {selectedLat.toFixed(6)}, {selectedLng.toFixed(6)}
                </Text>
              </View>
            </View>
            <View style={styles.fallbackVehicleStats}>
              <View style={styles.fallbackStat}>
                <Icon name="tachometer-alt" size={14} color="#6b7280" />
                <Text style={styles.fallbackStatText}>
                  {Math.round(selectedVehicleData.speedKmh || selectedVehicleData.SpeedKmh || selectedVehicleData.speed || 0)} km/h
                </Text>
              </View>
              <View style={styles.fallbackStat}>
                <Icon name="circle" size={8} color={getMarkerColor(selectedVehicleData)} solid />
                <Text style={styles.fallbackStatText}>
                  {getVehicleStatus(selectedVehicleData).isMoving ? "Moving" : getVehicleStatus(selectedVehicleData).isOnline ? "Parked" : "Offline"}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.fallbackMapButton}
              onPress={() => openInExternalMaps(selectedVehicleData)}
            >
              <Icon name="map-marked-alt" size={14} color="white" />
              <Text style={styles.fallbackMapButtonText}>Open in Google Maps</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Vehicle list */}
        {vehicles.map((v) => {
          const id = v.vehicleId || v.VehicleId;
          const { isOnline, isMoving } = getVehicleStatus(v);
          const isSelected = selectedVehicleId === id;
          return (
            <TouchableOpacity
              key={id}
              style={[styles.fallbackListItem, isSelected && styles.fallbackListItemSelected]}
              onPress={() => onSelectVehicle?.(v)}
            >
              <View style={[styles.fallbackDot, { backgroundColor: getMarkerColor(v) }]} />
              <View style={styles.fallbackListInfo}>
                <Text style={styles.fallbackListText}>
                  {v.vehicleCode || v.VehicleCode || v.vehicleName || v.VehicleName}
                </Text>
                <Text style={styles.fallbackListCoord}>
                  {(v.latitude || v.Latitude || 0).toFixed(4)}, {(v.longitude || v.Longitude || 0).toFixed(4)}
                </Text>
              </View>
              <View style={styles.fallbackListRight}>
                <Text style={[styles.fallbackListStatus, { color: getMarkerColor(v) }]}>
                  {isMoving ? "Moving" : isOnline ? "Parked" : "Offline"}
                </Text>
                {isOnline && (
                  <Text style={styles.fallbackListSpeed}>
                    {Math.round(v.speedKmh || v.SpeedKmh || v.speed || 0)} km/h
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.fallbackNavIcon}
                onPress={() => openInExternalMaps(v)}
              >
                <Icon name="directions" size={14} color="#2563eb" />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}

        {vehicles.length === 0 && (
          <View style={styles.emptyContainer}>
            <Icon name="satellite-dish" size={40} color="#d1d5db" />
            <Text style={styles.emptyText}>No vehicles with GPS data</Text>
          </View>
        )}
      </ScrollView>
    );
  }

  // ─── Native Map UI (react-native-maps available) ────────────────
  const defaultRegion = {
    latitude: selectedLat || (vehicles[0]?.latitude || vehicles[0]?.Latitude || 0),
    longitude: selectedLng || (vehicles[0]?.longitude || vehicles[0]?.Longitude || 0),
    latitudeDelta: selectedVehicleId ? 0.02 : 0.5,
    longitudeDelta: selectedVehicleId ? 0.02 : 0.5,
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        mapType="satellite"
        initialRegion={defaultRegion}
        onMapReady={() => setMapReady(true)}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        zoomEnabled={true}
        zoomControlEnabled={true}
        minZoomLevel={3}
        maxZoomLevel={20}
        onPanDrag={() => setFollowSelected(false)}
      >
        {vehicles.map((vehicle) => {
          const vehicleId = vehicle.vehicleId || vehicle.VehicleId;
          const lat = vehicle.latitude || vehicle.Latitude;
          const lng = vehicle.longitude || vehicle.Longitude;
          const heading = vehicle.heading || vehicle.Heading || 0;
          const { isOnline, isMoving, speed: rawSpeed } = getVehicleStatus(vehicle);
          const plate = vehicle.vehicleCode || vehicle.VehicleCode || vehicle.numberPlate || vehicle.NumberPlate || "";
          const name = vehicle.vehicleName || vehicle.VehicleName || "";
          const speed = Math.round(rawSpeed);
          const isSelected = selectedVehicleId === vehicleId;

          return (
            <Marker
              key={vehicleId}
              coordinate={{ latitude: lat, longitude: lng }}
              rotation={heading}
              anchor={{ x: 0.5, y: 0.5 }}
              pinColor={getMarkerColor(vehicle)}
              opacity={isSelected ? 1.0 : 0.8}
              onPress={() => onSelectVehicle?.(vehicle)}
            >
              <Callout tooltip onPress={() => openInExternalMaps(vehicle)}>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>{plate}</Text>
                  <Text style={styles.calloutSubtitle}>{name}</Text>
                  <View style={styles.calloutRow}>
                    <Text style={styles.calloutLabel}>Status:</Text>
                    <Text style={[styles.calloutValue, { color: getMarkerColor(vehicle) }]}>
                      {isMoving ? "Moving" : isOnline ? "Parked" : "Offline"}
                    </Text>
                  </View>
                  {isOnline && (
                    <View style={styles.calloutRow}>
                      <Text style={styles.calloutLabel}>Speed:</Text>
                      <Text style={styles.calloutValue}>{speed} km/h</Text>
                    </View>
                  )}
                  <Text style={styles.calloutHint}>Tap to open in Maps</Text>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      {/* Floating controls */}
      <View style={styles.floatingControls}>
        {selectedVehicle && (
          <TouchableOpacity
            style={[styles.floatingButton, followSelected && styles.floatingButtonActive]}
            onPress={() => setFollowSelected(!followSelected)}
          >
            <Icon
              name="crosshairs"
              size={16}
              color={followSelected ? "white" : "#374151"}
            />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => {
            if (mapRef.current && vehicles.length > 0) {
              const coords = vehicles
                .filter((v) => (v.latitude || v.Latitude) && (v.longitude || v.Longitude))
                .map((v) => ({
                  latitude: v.latitude || v.Latitude,
                  longitude: v.longitude || v.Longitude,
                }));
              if (coords.length > 0) {
                mapRef.current.fitToCoordinates(coords, {
                  edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
                  animated: true,
                });
              }
            }
          }}
        >
          <Icon name="expand" size={16} color="#374151" />
        </TouchableOpacity>
      </View>

      {/* Vehicle count badge */}
      <View style={styles.vehicleCountBadge}>
        <Icon name="truck" size={12} color="#2563eb" />
        <Text style={styles.vehicleCountText}>{vehicles.length} on map</Text>
      </View>

      {/* Selected vehicle info bar */}
      {selectedVehicleData && (
        <View style={styles.selectedBar}>
          <View style={[styles.selectedDot, { backgroundColor: getMarkerColor(selectedVehicleData) }]} />
          <View style={styles.selectedInfo}>
            <Text style={styles.selectedPlate}>
              {selectedVehicleData.vehicleCode || selectedVehicleData.VehicleCode || selectedVehicleData.vehicleName || selectedVehicleData.VehicleName}
            </Text>
            <Text style={styles.selectedStatus}>
              {(() => {
                const s = getVehicleStatus(selectedVehicleData);
                if (s.isMoving) return `Moving - ${Math.round(s.speed)} km/h`;
                if (s.isOnline) return "Parked";
                return "Offline";
              })()}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.selectedNavButton}
            onPress={() => openInExternalMaps(selectedVehicleData)}
          >
            <Icon name="directions" size={16} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.selectedCloseButton}
            onPress={() => onSelectVehicle?.(null)}
          >
            <Icon name="times" size={14} color="#6b7280" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
  },
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  // ─── Fallback styles ───────────────────────────────
  fallbackContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  fallbackContent: {
    paddingBottom: 24,
  },
  fallbackHeader: {
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: "#eff6ff",
    borderBottomWidth: 1,
    borderBottomColor: "#dbeafe",
  },
  fallbackTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e40af",
    marginTop: 8,
  },
  fallbackText: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 4,
  },
  fallbackVehicleCard: {
    backgroundColor: "white",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#dbeafe",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  fallbackVehicleHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  fallbackDotLarge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 12,
  },
  fallbackVehicleName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1f2937",
  },
  fallbackVehicleCoords: {
    fontSize: 12,
    color: "#6b7280",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    marginTop: 2,
  },
  fallbackVehicleStats: {
    flexDirection: "row",
    marginBottom: 12,
  },
  fallbackStat: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  fallbackStatText: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "500",
    marginLeft: 6,
  },
  fallbackMapButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    borderRadius: 10,
  },
  fallbackMapButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 8,
  },
  fallbackListItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    marginHorizontal: 16,
    marginTop: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  fallbackListItemSelected: {
    borderColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },
  fallbackDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  fallbackListInfo: {
    flex: 1,
  },
  fallbackListText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1f2937",
  },
  fallbackListCoord: {
    fontSize: 11,
    color: "#9ca3af",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    marginTop: 2,
  },
  fallbackListRight: {
    alignItems: "flex-end",
    marginRight: 8,
  },
  fallbackListStatus: {
    fontSize: 12,
    fontWeight: "600",
  },
  fallbackListSpeed: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 2,
  },
  fallbackNavIcon: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: "#9ca3af",
  },
  // ─── Callout styles ────────────────────────────────
  callout: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    minWidth: 160,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  calloutTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1f2937",
  },
  calloutSubtitle: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 6,
  },
  calloutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
  },
  calloutLabel: {
    fontSize: 12,
    color: "#9ca3af",
  },
  calloutValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },
  calloutHint: {
    fontSize: 10,
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 6,
    fontStyle: "italic",
  },
  // ─── Floating controls ─────────────────────────────
  floatingControls: {
    position: "absolute",
    right: 16,
    top: 16,
  },
  floatingButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  floatingButtonActive: {
    backgroundColor: "#2563eb",
  },
  vehicleCountBadge: {
    position: "absolute",
    top: 16,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  vehicleCountText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2563eb",
    marginLeft: 6,
  },
  selectedBar: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 14,
    borderRadius: 14,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  selectedDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  selectedInfo: {
    flex: 1,
  },
  selectedPlate: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
  },
  selectedStatus: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  selectedNavButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  selectedCloseButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default VehicleLiveMap;
