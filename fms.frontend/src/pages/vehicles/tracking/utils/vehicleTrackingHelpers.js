/**
 * File: vehicleTrackingHelpers.js
 * Purpose: Centralizes vehicle tracking constants, normalization helpers, formatting, and map marker builders
 * Dependencies: browser localStorage, Google Maps runtime APIs
 * Last Modified: 2026-03-11
 *
 * Key Exports:
 * - resolveInitialTrackingView(): Resolves the preferred tracking view from API and persisted state
 * - normalizeVehicle(): Normalizes raw tracking payloads for grid and map usage
 * - buildVehicleMarkerIcon(): Creates Google Maps marker icons for vehicle states
 * - buildInfoWindowContent(): Creates Google Maps info-window markup for selected vehicles
 */

export const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

export const defaultCenter = {
  lat: -1.2921,
  lng: 36.8219,
};

export const TRACKING_VIEW_STORAGE_KEY = 'fms_vehicle_tracking_selected_view';
export const TRACKING_GRID_STATE_STORAGE_KEY = 'fms_vehicle_tracking_grid_state_v2';
export const DEFAULT_TRACKING_VIEW_NAME = 'Report Industrial Plot';
export const SHOW_ALL_USERS_VIEW_NAMES = ['showallusers', 'show all users'];
export const VEHICLE_MOVING_SPEED_THRESHOLD = 5;
export const FOCUSED_VEHICLE_ZOOM_LEVEL = 10;
export const STREET_LEVEL_ZOOM = 16;
export const CITY_LEVEL_ZOOM = 12;
export const REGION_LEVEL_ZOOM = 8;
export const MARKER_CLUSTER_MAX_ZOOM = 20;

const TRACKING_STATUS_SORT_ORDER = {
  Moving: 0,
  Idling: 1,
  Stopped: 2,
  Parked: 3,
  Offline: 4,
  Unknown: 5,
};

const normalizeViewName = (value) => (value || '').trim().toLowerCase();
const ensureVehicle = (vehicle) => vehicle ?? {};

export const readSavedTrackingViewPreference = () => {
  try {
    const saved = localStorage.getItem(TRACKING_VIEW_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.warn('[VehicleTracking] Failed to read saved tracking view preference:', error);
    return null;
  }
};

export const saveTrackingViewPreference = (view) => {
  if (!view?.id) {
    return;
  }

  try {
    localStorage.setItem(TRACKING_VIEW_STORAGE_KEY, JSON.stringify({
      id: view.id,
      name: view.name || '',
    }));
  } catch (error) {
    console.warn('[VehicleTracking] Failed to save tracking view preference:', error);
  }
};

export const resolveInitialTrackingView = (views = [], persistedPreference = null) => {
  if (!views.length) {
    return null;
  }

  const savedPreference = persistedPreference || readSavedTrackingViewPreference();
  const savedView = savedPreference
    ? views.find((view) => (
      view.id === savedPreference.id
      || normalizeViewName(view.name) === normalizeViewName(savedPreference.name)
    ))
    : null;

  if (savedView) {
    return savedView;
  }

  const defaultView = views.find((view) => (
    normalizeViewName(view.name) === normalizeViewName(DEFAULT_TRACKING_VIEW_NAME)
  ));

  if (defaultView) {
    return defaultView;
  }

  const firstNonShowAllUsersView = views.find((view) => (
    !SHOW_ALL_USERS_VIEW_NAMES.includes(normalizeViewName(view.name))
  ));

  return firstNonShowAllUsersView || views[0];
};

const toNumberOrNull = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getAdditionalFieldValue = (vehicle = {}, candidateKeys = []) => {
  const sourceVehicle = ensureVehicle(vehicle);
  const fields = sourceVehicle.additionalFields;
  if (!fields || typeof fields !== 'object') {
    return null;
  }

  const entries = Object.entries(fields);

  for (const key of candidateKeys) {
    if (fields[key] != null) {
      return fields[key];
    }

    const matchingEntry = entries.find(([entryKey]) => entryKey.toLowerCase() === key.toLowerCase());
    if (matchingEntry?.[1] != null) {
      return matchingEntry[1];
    }
  }

  return null;
};

export const getVehicleSpeed = (vehicle = {}) => {
  const sourceVehicle = ensureVehicle(vehicle);

  return (
    toNumberOrNull(sourceVehicle.speed)
    ?? toNumberOrNull(sourceVehicle.speedKmh)
    ?? toNumberOrNull(sourceVehicle.groundSpeed)
    ?? toNumberOrNull(sourceVehicle.calculatedSpeed)
    ?? 0
  );
};

export const getVehicleHeading = (vehicle = {}) => {
  const sourceVehicle = ensureVehicle(vehicle);
  return toNumberOrNull(sourceVehicle.heading) ?? 0;
};

export const getVehicleCode = (vehicle = {}) => {
  const sourceVehicle = ensureVehicle(vehicle);

  return sourceVehicle.hyoungNo
    || sourceVehicle.numberPlate
    || sourceVehicle.plateNumber
    || sourceVehicle.name
    || sourceVehicle.vehicleName
    || `Vehicle ${sourceVehicle.id ?? ''}`.trim();
};

export const getVehicleDriverName = (vehicle = {}) => {
  const sourceVehicle = ensureVehicle(vehicle);

  return sourceVehicle.driverName
    || sourceVehicle.currentDriverName
    || sourceVehicle.assignedDriverName
    || sourceVehicle.driver
    || getAdditionalFieldValue(sourceVehicle, ['DriverName', 'driverName', 'Driver', 'CurrentDriver'])
    || '—';
};

export const getVehicleEngineHours = (vehicle = {}) => {
  const sourceVehicle = ensureVehicle(vehicle);

  return (
    toNumberOrNull(sourceVehicle.engineHours)
    ?? toNumberOrNull(sourceVehicle.engineHour)
    ?? toNumberOrNull(sourceVehicle.runHours)
    ?? toNumberOrNull(getAdditionalFieldValue(sourceVehicle, ['EngineHours', 'engineHours', 'EngineHour', 'RunHours']))
    ?? null
  );
};

export const formatEngineHours = (value) => {
  if (value == null) {
    return '—';
  }

  return `${value.toFixed(2)} h`;
};

export const formatSpeedKmh = (value) => `${(value || 0).toFixed(1)} km/h`;

export const getVehicleLastUpdated = (vehicle = {}) => {
  const sourceVehicle = ensureVehicle(vehicle);

  return sourceVehicle.lastUpdated
    || sourceVehicle.serverTimestamp
    || sourceVehicle.gpsTimestamp
    || sourceVehicle.utc
    || sourceVehicle.UTC
    || sourceVehicle.lastTransport
    || null;
};

export const formatTrackingTimestamp = (timestamp) => {
  if (!timestamp) {
    return 'Never';
  }

  return new Date(timestamp).toLocaleString();
};

export const formatTrackingLastSeen = (timestamp) => {
  if (!timestamp) {
    return 'Never';
  }

  const value = new Date(timestamp);
  if (Number.isNaN(value.getTime())) {
    return 'Never';
  }

  const now = new Date();
  const isToday = value.getFullYear() === now.getFullYear()
    && value.getMonth() === now.getMonth()
    && value.getDate() === now.getDate();

  return isToday
    ? value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : value.toLocaleDateString();
};

export const getVehicleOnlineStatus = (vehicle = {}) => {
  const sourceVehicle = ensureVehicle(vehicle);

  if (typeof sourceVehicle.isOnline === 'boolean') {
    return sourceVehicle.isOnline;
  }

  return String(sourceVehicle.deviceActivity || '').trim().length > 0;
};

export const getVehicleOperationalStatus = (vehicle = {}) => {
  const sourceVehicle = ensureVehicle(vehicle);

  if (sourceVehicle.operationalStatus) {
    return sourceVehicle.operationalStatus;
  }

  if (sourceVehicle.isMoving) {
    return 'Moving';
  }

  if (sourceVehicle.isParked || sourceVehicle.ignitionOn === false) {
    return 'Parked';
  }

  return 'Stopped';
};

export const getVehicleStatusSortValue = (vehicle = {}) => {
  const sourceVehicle = ensureVehicle(vehicle);
  const status = getVehicleOperationalStatus(vehicle);
  if (sourceVehicle.isOnline === false) {
    return TRACKING_STATUS_SORT_ORDER.Offline;
  }

  return TRACKING_STATUS_SORT_ORDER[status] ?? TRACKING_STATUS_SORT_ORDER.Unknown;
};

export const getVehicleStatusTone = (vehicle = {}) => {
  const status = getVehicleOperationalStatus(vehicle);

  if (status === 'Moving') {
    return {
      badge: 'tw-bg-green-100 tw-text-green-700',
      marker: 'moving',
    };
  }

  if (status === 'Parked') {
    return {
      badge: 'tw-bg-slate-100 tw-text-slate-700',
      marker: 'parked',
    };
  }

  return {
    badge: 'tw-bg-amber-100 tw-text-amber-700',
    marker: 'stopped',
  };
};

export const isVehicleMoving = (vehicle = {}) => {
  const sourceVehicle = ensureVehicle(vehicle);

  if (typeof sourceVehicle.isMoving === 'boolean') {
    return sourceVehicle.isMoving;
  }

  return getVehicleSpeed(sourceVehicle) > VEHICLE_MOVING_SPEED_THRESHOLD;
};

export const normalizeVehicle = (vehicle = {}) => {
  const sourceVehicle = ensureVehicle(vehicle);
  const speed = getVehicleSpeed(sourceVehicle);
  const heading = getVehicleHeading(sourceVehicle);

  return {
    ...sourceVehicle,
    latitude: toNumberOrNull(sourceVehicle.latitude),
    longitude: toNumberOrNull(sourceVehicle.longitude),
    speed,
    heading,
    lastUpdated: getVehicleLastUpdated(sourceVehicle),
    isOnline: getVehicleOnlineStatus(sourceVehicle),
    isMoving: isVehicleMoving({ ...sourceVehicle, speed }),
    isParked: Boolean(sourceVehicle.isParked),
    operationalStatus: getVehicleOperationalStatus(sourceVehicle),
  };
};

export const getVehicleMarkerLabel = (vehicle = {}) => {
  const sourceVehicle = ensureVehicle(vehicle);
  const rawLabel = sourceVehicle.hyoungNo
    || sourceVehicle.numberPlate
    || sourceVehicle.plateNumber
    || sourceVehicle.name
    || sourceVehicle.vehicleName
    || 'Vehicle';

  const text = String(rawLabel).trim();
  if (!text) {
    return 'Vehicle';
  }

  return text.length > 14 ? `${text.slice(0, 13)}…` : text;
};

export const buildVehicleMarkerIcon = (status, selected = false) => {
  const bodyColor = status === 'moving'
    ? '#16a34a'
    : status === 'parked'
      ? '#475569'
      : '#d97706';
  const strokeColor = selected ? '#2563eb' : bodyColor;
  const haloColor = selected ? 'rgba(37, 99, 235, 0.22)' : 'white';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
      <g fill="none" fill-rule="evenodd">
        <circle cx="22" cy="22" r="21" fill="${haloColor}" fill-opacity="0.95" stroke="${strokeColor}" stroke-width="${selected ? 3 : 2}"/>
        <path fill="${bodyColor}" d="M13 24.5v-6.2c0-.8.5-1.5 1.2-1.8l5.1-2.1c.4-.2.9-.3 1.4-.3h6.9c.7 0 1.3.2 1.8.7l3.2 3.1h3.2c1.2 0 2.2 1 2.2 2.2v4.4c0 1.2-1 2.2-2.2 2.2H35a3 3 0 0 1-6 0h-8a3 3 0 0 1-6 0h-.8A1.2 1.2 0 0 1 13 24.5Zm7-7.4-3.7 1.5v2.3h5.7v-3.8H20Zm4.3 0v3.8h6.8l-2.6-2.5a1 1 0 0 0-.7-.3h-3.5ZM18 30a1.4 1.4 0 1 0 0-2.8A1.4 1.4 0 0 0 18 30Zm14 0a1.4 1.4 0 1 0 0-2.8A1.4 1.4 0 0 0 32 30Z"/>
      </g>
    </svg>`;

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new window.google.maps.Size(36, 36),
    anchor: new window.google.maps.Point(18, 18),
    labelOrigin: new window.google.maps.Point(18, 2),
  };
};

export const buildClusterMarkerIcon = (count, isDarkTheme = false) => {
  const fillColor = isDarkTheme ? '#1d4ed8' : '#2563eb';
  const ringColor = isDarkTheme ? 'rgba(147, 197, 253, 0.35)' : 'rgba(37, 99, 235, 0.2)';
  const fontSize = count > 99 ? 12 : 14;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="54" height="54" viewBox="0 0 54 54">
      <circle cx="27" cy="27" r="24" fill="${ringColor}" />
      <circle cx="27" cy="27" r="18" fill="${fillColor}" />
      <text x="27" y="31" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="${fontSize}" font-weight="700" fill="#ffffff">${count}</text>
    </svg>`;

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new window.google.maps.Size(54, 54),
    anchor: new window.google.maps.Point(27, 27),
  };
};

export const buildInfoWindowContent = (vehicle = {}, isDarkTheme = false) => {
  const sourceVehicle = ensureVehicle(vehicle);
  const speed = getVehicleSpeed(sourceVehicle);
  const heading = getVehicleHeading(sourceVehicle);
  const themeClass = isDarkTheme ? 'vehicle-tracking-info-window--dark' : 'vehicle-tracking-info-window--light';

  return `
    <div class="vehicle-tracking-info-window ${themeClass}">
      <h4 class="vehicle-tracking-info-window__title">${sourceVehicle.name || 'Unknown'}</h4>
      ${sourceVehicle.description ? `<p class="vehicle-tracking-info-window__description">${sourceVehicle.description}</p>` : ''}
      <div class="vehicle-tracking-info-window__details">
        <p><strong>Status:</strong> ${getVehicleOperationalStatus(sourceVehicle)}</p>
        <p><strong>Speed:</strong> ${speed.toFixed(1)} km/h</p>
        <p><strong>Heading:</strong> ${heading.toFixed(0)}°</p>
        <p><strong>Updated:</strong> ${formatTrackingTimestamp(sourceVehicle.lastUpdated)}</p>
        ${sourceVehicle.address ? `<p><strong>Location:</strong> ${sourceVehicle.address}</p>` : ''}
      </div>
    </div>
  `;
};
