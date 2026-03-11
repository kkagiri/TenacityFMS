/**
 * File: vehicleTrackingPreferencesService.js
 * Purpose: Loads and saves vehicle tracking user preferences using API persistence with local fallback migration
 * Dependencies: axiosInstance
 * Last Modified: 2026-03-09
 *
 * Key Functions:
 * - loadPreferences(): Loads persisted preferences and falls back to legacy local storage values
 * - savePreferences(): Saves current tracking preferences to the backend API
 * - cacheLegacyPreferences(): Mirrors preferences into local storage for fallback compatibility
 */
import axiosInstance from '../../../api/axiosInstance';

const TRACKING_VIEW_STORAGE_KEY = 'fms_vehicle_tracking_selected_view';
const TRACKING_WORKSPACE_LAYOUT_STORAGE_KEY = 'fms_vehicle_tracking_workspace_layout';
const PREFERENCES_ENDPOINT = '/vehicletracking/preferences';

const parseJson = (value) => {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn('[VehicleTrackingPreferences] Failed to parse JSON payload:', error);
    return null;
  }
};

const normalizeWorkspaceLayout = (workspaceLayout) => {
  if (!workspaceLayout || typeof workspaceLayout !== 'object') {
    return null;
  }

  return {
    layoutMode: typeof workspaceLayout.layoutMode === 'string' ? workspaceLayout.layoutMode : undefined,
    splitByAxis: {
      horizontal: Number.isFinite(Number(workspaceLayout.splitByAxis?.horizontal))
        ? Number(workspaceLayout.splitByAxis.horizontal)
        : undefined,
      vertical: Number.isFinite(Number(workspaceLayout.splitByAxis?.vertical))
        ? Number(workspaceLayout.splitByAxis.vertical)
        : undefined,
    },
  };
};

const normalizePreferences = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return {
      selectedView: null,
      workspaceLayout: null,
    };
  }

  return {
    selectedView: payload.selectedTagId
      ? {
        id: Number(payload.selectedTagId),
        name: payload.selectedTagName || '',
      }
      : null,
    workspaceLayout: normalizeWorkspaceLayout({
      layoutMode: payload.workspaceLayoutMode,
      splitByAxis: {
        horizontal: payload.workspaceHorizontalSplit,
        vertical: payload.workspaceVerticalSplit,
      },
    }),
  };
};

const buildPayload = (preferences = {}) => ({
  selectedTagId: preferences.selectedView?.id ?? null,
  selectedTagName: preferences.selectedView?.name ?? '',
  workspaceLayoutMode: preferences.workspaceLayout?.layoutMode ?? null,
  workspaceHorizontalSplit: preferences.workspaceLayout?.splitByAxis?.horizontal ?? null,
  workspaceVerticalSplit: preferences.workspaceLayout?.splitByAxis?.vertical ?? null,
});

const readLegacyPreferences = () => {
  const selectedView = parseJson(localStorage.getItem(TRACKING_VIEW_STORAGE_KEY));
  const workspaceLayout = parseJson(localStorage.getItem(TRACKING_WORKSPACE_LAYOUT_STORAGE_KEY));

  return {
    selectedView: selectedView?.id
      ? {
        id: Number(selectedView.id),
        name: selectedView.name || '',
      }
      : null,
    workspaceLayout: normalizeWorkspaceLayout(workspaceLayout),
  };
};

const hasMeaningfulPreferences = (preferences) => Boolean(
  preferences?.selectedView?.id
  || preferences?.workspaceLayout?.layoutMode
  || Number.isFinite(Number(preferences?.workspaceLayout?.splitByAxis?.horizontal))
  || Number.isFinite(Number(preferences?.workspaceLayout?.splitByAxis?.vertical))
);

const cacheLegacyPreferences = (preferences = {}) => {
  try {
    const selectedView = preferences.selectedView;
    if (selectedView?.id) {
      localStorage.setItem(TRACKING_VIEW_STORAGE_KEY, JSON.stringify({
        id: selectedView.id,
        name: selectedView.name || '',
      }));
    }

    const workspaceLayout = preferences.workspaceLayout;
    if (workspaceLayout?.layoutMode || workspaceLayout?.splitByAxis) {
      localStorage.setItem(TRACKING_WORKSPACE_LAYOUT_STORAGE_KEY, JSON.stringify({
        layoutMode: workspaceLayout.layoutMode,
        splitByAxis: {
          horizontal: workspaceLayout.splitByAxis?.horizontal,
          vertical: workspaceLayout.splitByAxis?.vertical,
        },
      }));
    }
  } catch (error) {
    console.warn('[VehicleTrackingPreferences] Failed to cache local fallback preferences:', error);
  }
};

const vehicleTrackingPreferencesService = {
  async loadPreferences() {
    const legacyPreferences = readLegacyPreferences();

    try {
      const response = await axiosInstance.get(PREFERENCES_ENDPOINT);
      if (response.data?.isSuccess) {
        const persistedPreferences = normalizePreferences(response.data.data);
        return {
          preferences: {
            selectedView: persistedPreferences.selectedView || legacyPreferences.selectedView,
            workspaceLayout: persistedPreferences.workspaceLayout || legacyPreferences.workspaceLayout,
          },
          shouldPersist: !hasMeaningfulPreferences(persistedPreferences) && hasMeaningfulPreferences(legacyPreferences),
        };
      }
    } catch (error) {
      console.warn('[VehicleTrackingPreferences] Failed to load API preferences, using local fallback:', error);
    }

    return {
      preferences: legacyPreferences,
      shouldPersist: hasMeaningfulPreferences(legacyPreferences),
    };
  },

  async savePreferences(preferences = {}) {
    const payload = buildPayload(preferences);
    const response = await axiosInstance.put(PREFERENCES_ENDPOINT, payload);

    if (!response.data?.isSuccess) {
      throw new Error(response.data?.message || 'Failed to save vehicle tracking preferences');
    }

    return normalizePreferences(response.data.data);
  },

  cacheLegacyPreferences,
};

export default vehicleTrackingPreferencesService;
