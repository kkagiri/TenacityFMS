import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { LoadPanel } from 'devextreme-react/load-panel';
import { SelectBox } from 'devextreme-react/select-box';
import { TextBox } from 'devextreme-react/text-box';
import { Button } from 'devextreme-react/button';
import axiosInstance from '../../../api/axiosInstance';
import notify from 'devextreme/ui/notify';
// DISABLED: RabbitMQ vehicle tracking temporarily disabled (2026-01-28)
// Uncomment the line below to re-enable real-time vehicle tracking via SignalR
// import vehicleTrackingSignalRService from '../../../signalR/vehicleTrackingSignalRService';

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = {
  lat: -1.2921,
  lng: 36.8219
};

const VehicleTrackingPage = () => {
  const [tags, setTags] = useState([]);
  const [selectedTagId, setSelectedTagId] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [mapApiKey, setMapApiKey] = useState(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isMapLoading, setIsMapLoading] = useState(false);
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);
  const markerClustererRef = useRef(null);
  const initialBoundsFitRef = useRef(false);
  const prevVehicleIdsRef = useRef('');

  // Load Google Maps API key from system configuration
  const loadMapApiKey = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/SystemConfiguration/by-key/GoogleMaps.ApiKey');
      if (response.data && (response.data.success || response.data.isSuccess) && response.data.data) {
        const apiKey = response.data.data.configurationValue;
        setMapApiKey(apiKey);
      } else {
        console.error('Failed to load Google Maps API key from configuration');
        notify('Failed to load map configuration', 'warning', 3000);
      }
    } catch (error) {
      console.error('Error loading Google Maps API key:', error);
      notify('Error loading map configuration', 'warning', 3000);
    }
  }, []);

  // Load Google Maps script
  const loadGoogleMapsScript = useCallback(() => {
    if (!mapApiKey) return;

    // Check if Google Maps script is already loaded
    if (window.google && window.google.maps) {
      setIsMapLoaded(true);
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        setIsMapLoaded(true);
        setIsMapLoading(false);
      });
      return;
    }

    setIsMapLoading(true);
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${mapApiKey}&libraries=places,marker`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setIsMapLoaded(true);
      setIsMapLoading(false);
    };
    script.onerror = () => {
      setIsMapLoading(false);
      console.error('Failed to load Google Maps script');
      notify('Failed to load Google Maps', 'error', 3000);
    };
    document.head.appendChild(script);
  }, [mapApiKey]);

  // Initialize map
  const initializeMap = useCallback(() => {
    if (!mapContainerRef.current || !window.google || !window.google.maps) return;
    if (mapRef.current) return; // Already initialized

    const map = new window.google.maps.Map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 10,
      mapTypeId: 'roadmap',
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true
    });

    mapRef.current = map;
    infoWindowRef.current = new window.google.maps.InfoWindow();
  }, []);

  // Update markers on map
  const updateMarkers = useCallback(() => {
    if (!mapRef.current || !window.google) return;

    const vehiclesWithPosition = filteredVehicles.filter(v => v.latitude && v.longitude);

    // Check if vehicle IDs changed (new set of vehicles)
    const currentIds = vehiclesWithPosition.map(v => v.id).sort().join(',');
    const vehicleSetChanged = currentIds !== prevVehicleIdsRef.current;
    prevVehicleIdsRef.current = currentIds;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Clear clusterer if exists
    if (markerClustererRef.current) {
      markerClustererRef.current.clearMarkers();
    }

    // Create new markers
    const markers = vehiclesWithPosition.map(vehicle => {
      const isMoving = (vehicle.speed ?? 0) > 0;
      const marker = new window.google.maps.Marker({
        position: { lat: vehicle.latitude, lng: vehicle.longitude },
        map: mapRef.current,
        title: vehicle.name || 'Unknown',
        icon: {
          url: isMoving
            ? 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
            : 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
          scaledSize: new window.google.maps.Size(32, 32)
        }
      });

      marker.addListener('click', () => {
        setSelectedVehicle(vehicle);
        const speed = vehicle.speed ?? 0;
        const heading = vehicle.heading ?? 0;
        const content = `
          <div style="padding: 8px; min-width: 200px;">
            <h4 style="margin: 0 0 8px 0; font-weight: bold;">${vehicle.name || 'Unknown'}</h4>
            ${vehicle.description ? `<p style="margin: 4px 0; color: #666;">${vehicle.description}</p>` : ''}
            <div style="margin-top: 8px; font-size: 12px;">
              <p style="margin: 4px 0;"><strong>Speed:</strong> ${speed.toFixed(1)} km/h</p>
              <p style="margin: 4px 0;"><strong>Heading:</strong> ${heading.toFixed(0)}°</p>
              ${vehicle.address ? `<p style="margin: 4px 0;"><strong>Location:</strong> ${vehicle.address}</p>` : ''}
            </div>
          </div>
        `;
        infoWindowRef.current.setContent(content);
        infoWindowRef.current.open(mapRef.current, marker);
      });

      return marker;
    });

    markersRef.current = markers;

    // Only fit bounds on initial load or when vehicle set changes significantly
    if (vehiclesWithPosition.length > 0 && (!initialBoundsFitRef.current || vehicleSetChanged)) {
      const bounds = new window.google.maps.LatLngBounds();
      vehiclesWithPosition.forEach(v => {
        bounds.extend({ lat: v.latitude, lng: v.longitude });
      });
      if (vehiclesWithPosition.length > 1) {
        mapRef.current.fitBounds(bounds, { padding: 50 });
      }
      initialBoundsFitRef.current = true;
    }
  }, [filteredVehicles]);

  // Fetch tags from views API
  const fetchTags = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/vehicletracking/tags');
      if (response.data?.isSuccess) {
        const tagsData = response.data.data || [];
        setTags(tagsData);
        // Auto-select first tag if available and no tag selected
        if (tagsData.length > 0) {
          setSelectedTagId(prev => prev || tagsData[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching tags:', err);
      notify('Failed to fetch vehicle groups', 'error', 3000);
    }
  }, []); // No dependencies - only runs once

  // Fetch vehicles by tag
  const fetchVehiclesByTag = useCallback(async (tagId) => {
    if (!tagId) return;

    try {
      setLoading(true);
      const response = await axiosInstance.get(`/vehicletracking/tags/${tagId}/vehicles`);
      if (response.data?.isSuccess) {
        const vehicleData = response.data.data || [];
        setVehicles(vehicleData);
        setFilteredVehicles(vehicleData);
        setLastRefresh(new Date());
      } else {
        notify(response.data?.message || 'Failed to fetch vehicles', 'error', 3000);
      }
    } catch (err) {
      console.error('Error fetching vehicles:', err);
      notify('Failed to fetch vehicles', 'error', 3000);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load - fetch API key and tags (runs once)
  useEffect(() => {
    loadMapApiKey();
    fetchTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load Google Maps script when API key is available
  useEffect(() => {
    if (mapApiKey) {
      loadGoogleMapsScript();
    }
  }, [mapApiKey, loadGoogleMapsScript]);

  // Initialize map when script is loaded
  useEffect(() => {
    if (isMapLoaded && mapContainerRef.current) {
      initializeMap();
    }
  }, [isMapLoaded, initializeMap]);

  // Update markers when vehicles change
  useEffect(() => {
    if (isMapLoaded && mapRef.current) {
      updateMarkers();
    }
  }, [isMapLoaded, filteredVehicles, updateMarkers]);

  // Fetch vehicles when tag changes
  useEffect(() => {
    if (selectedTagId) {
      // Reset bounds flag when tag changes to fit new set of vehicles
      initialBoundsFitRef.current = false;
      prevVehicleIdsRef.current = '';
      fetchVehiclesByTag(selectedTagId);
    }
  }, [selectedTagId, fetchVehiclesByTag]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!selectedTagId) return;

    const interval = setInterval(() => {
      fetchVehiclesByTag(selectedTagId);
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedTagId, fetchVehiclesByTag]);

  // DISABLED: RabbitMQ vehicle tracking temporarily disabled (2026-01-28)
  // The SignalR subscription for real-time vehicle tracking is commented out.
  // The page will continue to work with REST API polling (auto-refresh every 30 seconds).
  // Uncomment the block below to re-enable real-time vehicle tracking via SignalR/RabbitMQ.
  /*
  // Setup SignalR subscription for real-time vehicle tracking
  // This should only be active when user is on the tracking page
  useEffect(() => {
    // Subscribe to tag when tag is selected
    const setupSignalRSubscription = async () => {
      if (!selectedTagId || !vehicleTrackingSignalRService.isConnected) {
        return;
      }

      try {
        // Subscribe to the specific tag for real-time updates
        await vehicleTrackingSignalRService.subscribeToTag(selectedTagId);
        console.log(`[VehicleTracking] Subscribed to tag ${selectedTagId}`);
      } catch (err) {
        console.error('[VehicleTracking] Failed to subscribe to tag:', err);
      }
    };

    // Listen for real-time location updates
    const unsubscribeLocationUpdate = vehicleTrackingSignalRService.on('locationUpdate', (location) => {
      if (!location) return;

      setVehicles(prevVehicles => {
        const updated = prevVehicles.map(v =>
          v.id === location.vehicleId
            ? {
                ...v,
                latitude: location.latitude,
                longitude: location.longitude,
                speed: location.speed ?? v.speed,
                heading: location.heading ?? v.heading,
                address: location.address ?? v.address,
                lastUpdated: new Date(),
              }
            : v
        );
        return updated;
      });
    });

    // Listen for connection status changes
    const unsubscribeConnectionStatus = vehicleTrackingSignalRService.on('connectionStatus', (status) => {
      if (!status) return;

      setVehicles(prevVehicles => {
        const updated = prevVehicles.map(v =>
          v.id === status.vehicleId
            ? { ...v, isOnline: status.isOnline }
            : v
        );
        return updated;
      });
    });

    // Setup subscription if connected
    setupSignalRSubscription();

    // Cleanup subscriptions when tag changes or component unmounts
    return () => {
      if (selectedTagId && vehicleTrackingSignalRService.isConnected) {
        vehicleTrackingSignalRService.unsubscribeFromTag(selectedTagId).catch(err => {
          console.warn('[VehicleTracking] Failed to unsubscribe from tag:', err);
        });
      }
      unsubscribeLocationUpdate();
      unsubscribeConnectionStatus();
    };
  }, [selectedTagId]);
  */

  // Filter vehicles by search text (with debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!searchText) {
        setFilteredVehicles(vehicles);
      } else {
        const searchLower = searchText.toLowerCase();
        const filtered = vehicles.filter(v =>
          v.name?.toLowerCase().includes(searchLower) ||
          v.description?.toLowerCase().includes(searchLower)
        );
        setFilteredVehicles(filtered);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchText, vehicles]);

  const handleRefresh = () => {
    if (selectedTagId) {
      fetchVehiclesByTag(selectedTagId);
      notify('Refreshing vehicle locations...', 'info', 2000);
    }
  };

  const handleVehicleClick = (vehicle) => {
    setSelectedVehicle(vehicle);

    // Only pan/zoom if map is ready and vehicle has coordinates
    if (mapRef.current && vehicle?.latitude && vehicle?.longitude) {
      try {
        mapRef.current.panTo({ lat: vehicle.latitude, lng: vehicle.longitude });
        mapRef.current.setZoom(15);

        // Open info window for clicked vehicle
        if (infoWindowRef.current) {
          const speed = vehicle.speed ?? 0;
          const heading = vehicle.heading ?? 0;
          const content = `
            <div style="padding: 8px; min-width: 200px;">
              <h4 style="margin: 0 0 8px 0; font-weight: bold;">${vehicle.name || 'Unknown'}</h4>
              ${vehicle.description ? `<p style="margin: 4px 0; color: #666;">${vehicle.description}</p>` : ''}
              <div style="margin-top: 8px; font-size: 12px;">
                <p style="margin: 4px 0;"><strong>Speed:</strong> ${speed.toFixed(1)} km/h</p>
                <p style="margin: 4px 0;"><strong>Heading:</strong> ${heading.toFixed(0)}°</p>
                ${vehicle.address ? `<p style="margin: 4px 0;"><strong>Location:</strong> ${vehicle.address}</p>` : ''}
              </div>
            </div>
          `;
          infoWindowRef.current.setContent(content);
          infoWindowRef.current.setPosition({ lat: vehicle.latitude, lng: vehicle.longitude });
          infoWindowRef.current.open(mapRef.current);
        }
      } catch (err) {
        console.error('Error handling vehicle click:', err);
      }
    }
  };

  // Calculate statistics
  const stats = useMemo(() => ({
    total: vehicles.length,
    moving: vehicles.filter(v => (v.speed ?? 0) > 0).length,
    online: vehicles.filter(v => v.isOnline !== false).length,
    offline: vehicles.filter(v => v.isOnline === false).length
  }), [vehicles]);

  const formatLastUpdate = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="tw-h-full tw-flex tw-flex-col">
      <LoadPanel visible={loading} />

      {/* Header */}
      <div className="tw-bg-white tw-border-b tw-px-4 tw-py-3 tw-flex tw-items-center tw-justify-between">
        <div className="tw-flex tw-items-center tw-gap-4">
          <h2 className="tw-text-xl tw-font-bold tw-text-gray-800">
            <i className="fa-light fa-satellite tw-mr-2"></i>
            Vehicle Tracking
          </h2>
          <SelectBox
            dataSource={tags}
            displayExpr="name"
            valueExpr="id"
            value={selectedTagId}
            onValueChanged={(e) => setSelectedTagId(e.value)}
            placeholder="Select Group"
            width={200}
            showClearButton={false}
          />
        </div>
        <div className="tw-flex tw-items-center tw-gap-4">
          {lastRefresh && (
            <span className="tw-text-sm tw-text-gray-500">
              Last update: {formatLastUpdate(lastRefresh)}
            </span>
          )}
          <Button
            icon="fa-light fa-refresh"
            text="Refresh"
            type="default"
            stylingMode="outlined"
            onClick={handleRefresh}
          />
        </div>
      </div>

      {/* Statistics Bar */}
      <div className="tw-bg-gray-50 tw-border-b tw-px-4 tw-py-2 tw-flex tw-gap-6">
        <div className="tw-flex tw-items-center tw-gap-2">
          <i className="fa-light fa-truck tw-text-blue-500"></i>
          <span className="tw-text-sm tw-font-medium">Total: {stats.total}</span>
        </div>
        <div className="tw-flex tw-items-center tw-gap-2">
          <i className="fa-light fa-location-arrow tw-text-green-500"></i>
          <span className="tw-text-sm tw-font-medium">Moving: {stats.moving}</span>
        </div>
        <div className="tw-flex tw-items-center tw-gap-2">
          <i className="fa-light fa-wifi tw-text-green-500"></i>
          <span className="tw-text-sm tw-font-medium">Online: {stats.online}</span>
        </div>
        <div className="tw-flex tw-items-center tw-gap-2">
          <i className="fa-light fa-wifi-slash tw-text-red-500"></i>
          <span className="tw-text-sm tw-font-medium">Offline: {stats.offline}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="tw-flex tw-flex-1 tw-overflow-hidden">
        {/* Vehicle List Sidebar */}
        <div className="tw-w-80 tw-bg-white tw-border-r tw-flex tw-flex-col">
          <div className="tw-p-3 tw-border-b">
            <TextBox
              placeholder="Search vehicles..."
              value={searchText}
              onValueChanged={(e) => setSearchText(e.value)}
              showClearButton={true}
              mode="search"
            />
          </div>
          <div className="tw-flex-1 tw-overflow-y-auto">
            {filteredVehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className={`tw-p-3 tw-border-b tw-cursor-pointer tw-transition-colors hover:tw-bg-gray-50 ${selectedVehicle?.id === vehicle.id ? 'tw-bg-blue-50 tw-border-l-4 tw-border-l-blue-500' : ''
                  }`}
                onClick={() => handleVehicleClick(vehicle)}
              >
                <div className="tw-flex tw-items-center tw-justify-between">
                  <span className="tw-font-medium tw-text-gray-800">{vehicle.name || 'Unknown'}</span>
                  <span className={`tw-px-2 tw-py-0.5 tw-rounded tw-text-xs ${(vehicle.speed ?? 0) > 0 ? 'tw-bg-green-100 tw-text-green-700' : 'tw-bg-gray-100 tw-text-gray-600'
                    }`}>
                    {(vehicle.speed ?? 0) > 0 ? 'Moving' : 'Stopped'}
                  </span>
                </div>
                {vehicle.description && (
                  <p className="tw-text-sm tw-text-gray-500 tw-mt-1">{vehicle.description}</p>
                )}
                <div className="tw-flex tw-items-center tw-gap-3 tw-mt-2 tw-text-xs tw-text-gray-500">
                  <span>
                    <i className="fa-light fa-gauge tw-mr-1"></i>
                    {(vehicle.speed ?? 0).toFixed(1)} km/h
                  </span>
                  <span>
                    <i className="fa-light fa-compass tw-mr-1"></i>
                    {(vehicle.heading ?? 0).toFixed(0)}°
                  </span>
                </div>
              </div>
            ))}
            {filteredVehicles.length === 0 && !loading && (
              <div className="tw-p-4 tw-text-center tw-text-gray-500">
                <i className="fa-light fa-truck tw-text-3xl tw-mb-2"></i>
                <p>No vehicles found</p>
              </div>
            )}
          </div>
        </div>

        {/* Map */}
        <div className="tw-flex-1 tw-relative">
          <div
            ref={mapContainerRef}
            style={mapContainerStyle}
            className="tw-absolute tw-inset-0"
          />
          {(isMapLoading || !isMapLoaded) && (
            <div className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center tw-bg-gray-100">
              <div className="tw-text-center tw-text-gray-500">
                <i className="fa-light fa-map tw-text-4xl tw-mb-2"></i>
                <p>Loading map...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleTrackingPage;
