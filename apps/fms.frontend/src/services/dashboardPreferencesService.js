import dashboardService from './dashboardService';

/**
 * Dashboard Preferences Service
 * Handles migration from localStorage to API-driven dashboard configuration
 * Provides automatic migration, fallback mechanisms, and debounced auto-save
 */
class DashboardPreferencesService {
  constructor() {
    this.preferences = null;
    this.isLoading = false;
    this.isMigrating = false;
    this.saveTimeout = null;
    this.listeners = new Set();
  }

  /**
   * Initialize preferences - load from API or migrate from localStorage
   * @returns {Promise<object>} User preferences object
   */
  async initialize() {
    if (this.isLoading) return this.preferences;

    this.isLoading = true;
    try {
      // Try to load from API first
      const apiResult = await dashboardService.getPreferences();
      if (apiResult.success && apiResult.data) {
        this.preferences = JSON.parse(apiResult.data.preferencesJson);
        console.log('Loaded preferences from API:', this.preferences);
        return this.preferences;
      }
    } catch (error) {
      console.warn('Failed to load preferences from API, attempting migration:', error);
    }

    // If API fails, try to migrate from localStorage
    await this.migrateFromLocalStorage();
    return this.preferences;
  }

  /**
   * Migrate existing localStorage data to API
   * @returns {Promise<void>}
   */
  async migrateFromLocalStorage() {
    if (this.isMigrating) return;
    this.isMigrating = true;

    try {
      // Get existing localStorage data
      const widgetConfig = this.getLocalStorageData('dashboard_widgetConfig');
      const todayFuelBaseline = this.getLocalStorageData('dashboard_todayFuelBaseline');

      // Create default preferences structure
      const defaultPreferences = {
        key_statistics: widgetConfig?.key_statistics || [],
        fuel_baseline: todayFuelBaseline ? parseFloat(todayFuelBaseline) : null,
        migrated_at: new Date().toISOString(),
        version: '2.0'
      };

      // Save to API
      const saveResult = await dashboardService.savePreferences({
        preferencesJson: JSON.stringify(defaultPreferences),
        version: '2.0'
      });

      if (saveResult.success) {
        this.preferences = defaultPreferences;
        console.log('Successfully migrated preferences to API');

        // Optionally clean up localStorage after successful migration
        // this.cleanupLocalStorage();
      } else {
        throw new Error(saveResult.message || 'Failed to save migrated preferences');
      }
    } catch (error) {
      console.error('Migration failed:', error);
      // Fallback to localStorage if migration fails
      this.preferences = this.getFallbackPreferences();
    } finally {
      this.isMigrating = false;
    }
  }

  /**
   * Get data from localStorage with error handling
   * @param {string} key - localStorage key
   * @returns {any} Parsed data or null
   */
  getLocalStorageData(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn(`Failed to parse localStorage key '${key}':`, error);
      return null;
    }
  }

  /**
   * Get fallback preferences when API and migration both fail
   * @returns {object} Default preferences
   */
  getFallbackPreferences() {
    return {
      key_statistics: [],
      fuel_baseline: null,
      version: '1.0',
      fallback_mode: true
    };
  }

  /**
   * Update preferences and auto-save to API
   * @param {object} newPreferences - New preferences object
   * @param {boolean} immediate - Save immediately instead of debouncing
   */
  async updatePreferences(newPreferences, immediate = false) {
    this.preferences = { ...this.preferences, ...newPreferences };

    if (immediate) {
      await this.saveToAPI();
    } else {
      this.debouncedSave();
    }

    // Notify listeners
    this.notifyListeners();
  }

  /**
   * Debounced save to API to avoid excessive calls
   */
  debouncedSave() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(async () => {
      await this.saveToAPI();
    }, 2000); // 2 second debounce
  }

  /**
   * Save current preferences to API
   * @returns {Promise<boolean>} Success status
   */
  async saveToAPI() {
    if (!this.preferences) return false;

    try {
      const saveResult = await dashboardService.savePreferences({
        preferencesJson: JSON.stringify(this.preferences),
        version: this.preferences.version || '2.0'
      });

      if (saveResult.success) {
        console.log('Preferences saved to API successfully');
        return true;
      } else {
        console.error('Failed to save preferences to API:', saveResult.message);
        return false;
      }
    } catch (error) {
      console.error('Error saving preferences to API:', error);
      return false;
    }
  }

  /**
   * Reset preferences to default
   * @returns {Promise<boolean>} Success status
   */
  async resetPreferences() {
    try {
      const resetResult = await dashboardService.resetPreferences();
      if (resetResult.success) {
        this.preferences = JSON.parse(resetResult.data.preferencesJson);
        this.notifyListeners();
        console.log('Preferences reset successfully');
        return true;
      } else {
        console.error('Failed to reset preferences:', resetResult.message);
        return false;
      }
    } catch (error) {
      console.error('Error resetting preferences:', error);
      return false;
    }
  }

  /**
   * Get current preferences (initialize if needed)
   * @returns {Promise<object>} Current preferences
   */
  async getPreferences() {
    if (!this.preferences) {
      await this.initialize();
    }
    return this.preferences;
  }

  /**
   * Subscribe to preference changes
   * @param {Function} callback - Callback function to call when preferences change
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of preference changes
   */
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.preferences);
      } catch (error) {
        console.error('Error notifying preference listener:', error);
      }
    });
  }

  /**
   * Clean up localStorage after successful migration
   * Call this only after confirming API storage is working
   */
  cleanupLocalStorage() {
    try {
      localStorage.removeItem('dashboard_widgetConfig');
      localStorage.removeItem('dashboard_todayFuelBaseline');
      console.log('Cleaned up localStorage after migration');
    } catch (error) {
      console.warn('Failed to cleanup localStorage:', error);
    }
  }

  /**
   * Force reload preferences from API
   * @returns {Promise<object>} Fresh preferences from API
   */
  async reloadFromAPI() {
    try {
      const apiResult = await dashboardService.getPreferences();
      if (apiResult.success && apiResult.data) {
        this.preferences = JSON.parse(apiResult.data.preferencesJson);
        this.notifyListeners();
        console.log('Reloaded preferences from API');
        return this.preferences;
      }
    } catch (error) {
      console.error('Failed to reload from API:', error);
    }
    return this.preferences;
  }
}

// Create and export singleton instance
const dashboardPreferencesService = new DashboardPreferencesService();
export default dashboardPreferencesService;
