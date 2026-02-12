/**
 * LayoutService - Dashboard layout management service
 *
 * Handles dashboard layout persistence, responsive design, and layout configurations.
 * Manages grid layouts, widget positioning, and responsive breakpoints.
 */

import BaseService from '../core/BaseService';

export class LayoutService extends BaseService {
  constructor(config = {}) {
    super({
      ...config,
      baseUrl: '/api/v1/dashboard/layouts',
      serviceName: 'LayoutService'
    });

    // Layout cache and state
    this.layoutCache = new Map();
    this.currentLayout = null;
    this.layoutSettings = {
      breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
      cols: { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 },
      rowHeight: 60,
      margin: [10, 10],
      containerPadding: [20, 20],
      compactType: 'vertical',
      preventCollision: false,
      useCSSTransforms: true,
      resizeHandles: ['se']
    };

    // Initialize from localStorage
    this.initializeFromStorage();
  }

  /**
   * Initialize layout settings from localStorage
   */
  initializeFromStorage() {
    try {
      const savedLayouts = localStorage.getItem('fms_dashboard_layouts');
      const savedSettings = localStorage.getItem('fms_layout_settings');

      if (savedLayouts) {
        const layouts = JSON.parse(savedLayouts);
        Object.entries(layouts).forEach(([key, layout]) => {
          this.layoutCache.set(key, layout);
        });
      }

      if (savedSettings) {
        this.layoutSettings = {
          ...this.layoutSettings,
          ...JSON.parse(savedSettings)
        };
      }
    } catch (error) {
      this.logger.warn('Error loading layouts from localStorage:', error);
    }
  }

  /**
   * Save current layouts to localStorage
   */
  saveToStorage() {
    try {
      const layouts = {};
      this.layoutCache.forEach((layout, key) => {
        layouts[key] = layout;
      });

      localStorage.setItem('fms_dashboard_layouts', JSON.stringify(layouts));
      localStorage.setItem('fms_layout_settings', JSON.stringify(this.layoutSettings));
    } catch (error) {
      this.logger.error('Error saving layouts to localStorage:', error);
    }
  }

  /**
   * Get layout for specific breakpoint and user
   * @param {string} breakpoint - Current breakpoint (lg, md, sm, xs, xxs)
   * @param {string|number} userId - User ID
   * @param {string} dashboardId - Dashboard ID (optional)
   * @returns {Promise<FMSResponse>} Layout configuration
   */
  async getLayout(breakpoint = 'lg', userId = null, dashboardId = 'default') {
    try {
      const cacheKey = `${userId}-${dashboardId}-${breakpoint}`;
      const cached = this.layoutCache.get(cacheKey);

      if (cached) {
        return {
          success: true,
          data: cached,
          metadata: { fromCache: true }
        };
      }

      // Try to fetch from backend
      const response = await this.get(`/${dashboardId}/${breakpoint}?userId=${userId}`);

      if (response.success && response.data) {
        this.layoutCache.set(cacheKey, response.data);
        this.saveToStorage();
      } else {
        // Return default layout if no layout found
        const defaultLayout = this.generateDefaultLayout(breakpoint);
        this.layoutCache.set(cacheKey, defaultLayout);
        return {
          success: true,
          data: defaultLayout,
          metadata: { isDefault: true }
        };
      }

      return response;
    } catch (error) {
      this.logger.error(`Error fetching layout for ${breakpoint}:`, error);

      // Fallback to default layout
      const defaultLayout = this.generateDefaultLayout(breakpoint);
      return {
        success: true,
        data: defaultLayout,
        metadata: { isDefault: true, error: error.message }
      };
    }
  }

  /**
   * Save layout configuration
   * @param {string} breakpoint - Breakpoint name
   * @param {Object} layout - Layout configuration
   * @param {string|number} userId - User ID
   * @param {string} dashboardId - Dashboard ID
   * @returns {Promise<FMSResponse>} Save result
   */
  async saveLayout(breakpoint, layout, userId = null, dashboardId = 'default') {
    try {
      const cacheKey = `${userId}-${dashboardId}-${breakpoint}`;

      // Validate layout before saving
      const validatedLayout = this.validateLayout(layout);

      // Cache locally first
      this.layoutCache.set(cacheKey, validatedLayout);
      this.saveToStorage();

      // Save to backend
      const response = await this.post(`/${dashboardId}/${breakpoint}`, {
        layout: validatedLayout,
        userId: userId
      });

      if (!response.success) {
        // Revert cache if backend save failed
        this.layoutCache.delete(cacheKey);
        this.saveToStorage();
      }

      return response;
    } catch (error) {
      this.logger.error(`Error saving layout for ${breakpoint}:`, error);
      return this.handleError(error, 'Failed to save layout');
    }
  }

  /**
   * Get all layouts for a user
   * @param {string|number} userId - User ID
   * @param {string} dashboardId - Dashboard ID
   * @returns {Promise<FMSResponse>} All layouts
   */
  async getAllLayouts(userId = null, dashboardId = 'default') {
    try {
      const response = await this.get(`/${dashboardId}?userId=${userId}`);

      if (response.success && response.data) {
        // Cache all layouts
        Object.entries(response.data).forEach(([breakpoint, layout]) => {
          const cacheKey = `${userId}-${dashboardId}-${breakpoint}`;
          this.layoutCache.set(cacheKey, layout);
        });
        this.saveToStorage();
      }

      return response;
    } catch (error) {
      this.logger.error('Error fetching all layouts:', error);
      return this.handleError(error, 'Failed to fetch layouts');
    }
  }

  /**
   * Reset layout to default
   * @param {string} breakpoint - Breakpoint to reset
   * @param {string|number} userId - User ID
   * @param {string} dashboardId - Dashboard ID
   * @returns {Promise<FMSResponse>} Reset result
   */
  async resetLayout(breakpoint, userId = null, dashboardId = 'default') {
    try {
      const cacheKey = `${userId}-${dashboardId}-${breakpoint}`;

      // Generate default layout
      const defaultLayout = this.generateDefaultLayout(breakpoint);

      // Update cache
      this.layoutCache.set(cacheKey, defaultLayout);
      this.saveToStorage();

      // Reset on backend
      const response = await this.delete(`/${dashboardId}/${breakpoint}?userId=${userId}`);

      return {
        success: true,
        data: defaultLayout,
        message: 'Layout reset to default'
      };
    } catch (error) {
      this.logger.error(`Error resetting layout for ${breakpoint}:`, error);
      return this.handleError(error, 'Failed to reset layout');
    }
  }

  /**
   * Generate default layout for breakpoint
   * @param {string} breakpoint - Breakpoint name
   * @returns {Array} Default layout array
   */
  generateDefaultLayout(breakpoint) {
    const cols = this.layoutSettings.cols[breakpoint] || 12;

    // Default widget positions based on breakpoint
    const defaultWidgets = [
      { i: 'quickActions', x: 0, y: 0, w: Math.min(4, cols), h: 3 },
      { i: 'stats', x: Math.min(4, cols - 4), y: 0, w: Math.min(4, cols), h: 3 },
      { i: 'systemModules', x: Math.min(8, cols - 4), y: 0, w: Math.min(4, cols), h: 3 },
      { i: 'events', x: 0, y: 3, w: Math.min(6, cols), h: 4 },
      { i: 'performance', x: Math.min(6, cols - 6), y: 3, w: Math.min(6, cols), h: 4 },
      { i: 'fuelManagement', x: 0, y: 7, w: Math.min(8, cols), h: 5 },
      { i: 'tankStatus', x: Math.min(8, cols - 4), y: 7, w: Math.min(4, cols), h: 5 }
    ];

    // Adjust for smaller breakpoints
    if (breakpoint === 'xs' || breakpoint === 'xxs') {
      return defaultWidgets.map((widget, index) => ({
        ...widget,
        x: 0,
        y: index * 4,
        w: cols,
        h: 4
      }));
    }

    if (breakpoint === 'sm') {
      return defaultWidgets.map((widget, index) => ({
        ...widget,
        x: (index % 2) * (cols / 2),
        y: Math.floor(index / 2) * 4,
        w: cols / 2,
        h: 4
      }));
    }

    return defaultWidgets;
  }

  /**
   * Validate layout configuration
   * @param {Array} layout - Layout to validate
   * @returns {Array} Validated layout
   */
  validateLayout(layout) {
    if (!Array.isArray(layout)) {
      this.logger.warn('Invalid layout: not an array');
      return [];
    }

    return layout.map(item => {
      // Ensure required properties
      const validatedItem = {
        i: item.i || `widget-${Date.now()}`,
        x: Math.max(0, parseInt(item.x) || 0),
        y: Math.max(0, parseInt(item.y) || 0),
        w: Math.max(1, parseInt(item.w) || 4),
        h: Math.max(1, parseInt(item.h) || 3),
        ...item
      };

      // Ensure reasonable bounds
      validatedItem.w = Math.min(validatedItem.w, 12);
      validatedItem.h = Math.min(validatedItem.h, 20);

      return validatedItem;
    });
  }

  /**
   * Get responsive layout for all breakpoints
   * @param {string|number} userId - User ID
   * @param {string} dashboardId - Dashboard ID
   * @returns {Promise<Object>} Layouts for all breakpoints
   */
  async getResponsiveLayouts(userId = null, dashboardId = 'default') {
    const layouts = {};
    const breakpoints = Object.keys(this.layoutSettings.breakpoints);

    const layoutPromises = breakpoints.map(async (breakpoint) => {
      try {
        const result = await this.getLayout(breakpoint, userId, dashboardId);
        if (result.success) {
          layouts[breakpoint] = result.data;
        }
      } catch (error) {
        this.logger.warn(`Error loading layout for ${breakpoint}:`, error);
        layouts[breakpoint] = this.generateDefaultLayout(breakpoint);
      }
    });

    await Promise.allSettled(layoutPromises);
    return layouts;
  }

  /**
   * Update layout settings
   * @param {Object} newSettings - New layout settings
   */
  updateLayoutSettings(newSettings) {
    this.layoutSettings = {
      ...this.layoutSettings,
      ...newSettings
    };
    this.saveToStorage();
  }

  /**
   * Get current layout settings
   * @returns {Object} Current layout settings
   */
  getLayoutSettings() {
    return { ...this.layoutSettings };
  }

  /**
   * Add widget to layout
   * @param {string} breakpoint - Breakpoint
   * @param {Object} widgetConfig - Widget configuration
   * @param {string|number} userId - User ID
   * @param {string} dashboardId - Dashboard ID
   * @returns {Promise<FMSResponse>} Updated layout
   */
  async addWidgetToLayout(breakpoint, widgetConfig, userId = null, dashboardId = 'default') {
    try {
      const layoutResult = await this.getLayout(breakpoint, userId, dashboardId);

      if (!layoutResult.success) {
        return layoutResult;
      }

      const currentLayout = layoutResult.data || [];

      // Find available position
      const newPosition = this.findAvailablePosition(currentLayout, widgetConfig.w || 4, widgetConfig.h || 3);

      const newWidget = {
        i: widgetConfig.i || `widget-${Date.now()}`,
        x: newPosition.x,
        y: newPosition.y,
        w: widgetConfig.w || 4,
        h: widgetConfig.h || 3,
        ...widgetConfig
      };

      const updatedLayout = [...currentLayout, newWidget];

      return this.saveLayout(breakpoint, updatedLayout, userId, dashboardId);
    } catch (error) {
      this.logger.error('Error adding widget to layout:', error);
      return this.handleError(error, 'Failed to add widget to layout');
    }
  }

  /**
   * Remove widget from layout
   * @param {string} breakpoint - Breakpoint
   * @param {string} widgetId - Widget ID to remove
   * @param {string|number} userId - User ID
   * @param {string} dashboardId - Dashboard ID
   * @returns {Promise<FMSResponse>} Updated layout
   */
  async removeWidgetFromLayout(breakpoint, widgetId, userId = null, dashboardId = 'default') {
    try {
      const layoutResult = await this.getLayout(breakpoint, userId, dashboardId);

      if (!layoutResult.success) {
        return layoutResult;
      }

      const currentLayout = layoutResult.data || [];
      const updatedLayout = currentLayout.filter(item => item.i !== widgetId);

      return this.saveLayout(breakpoint, updatedLayout, userId, dashboardId);
    } catch (error) {
      this.logger.error('Error removing widget from layout:', error);
      return this.handleError(error, 'Failed to remove widget from layout');
    }
  }

  /**
   * Find available position for new widget
   * @param {Array} layout - Current layout
   * @param {number} width - Widget width
   * @param {number} height - Widget height
   * @returns {Object} Position {x, y}
   */
  findAvailablePosition(layout, width, height) {
    const cols = 12; // Default columns
    const maxY = Math.max(...layout.map(item => item.y + item.h), 0);

    // Try to place widget starting from top-left
    for (let y = 0; y <= maxY + height; y++) {
      for (let x = 0; x <= cols - width; x++) {
        const position = { x, y };

        if (!this.isPositionOccupied(layout, position, width, height)) {
          return position;
        }
      }
    }

    // If no position found, place at bottom
    return { x: 0, y: maxY };
  }

  /**
   * Check if position is occupied
   * @param {Array} layout - Current layout
   * @param {Object} position - Position to check {x, y}
   * @param {number} width - Widget width
   * @param {number} height - Widget height
   * @returns {boolean} True if occupied
   */
  isPositionOccupied(layout, position, width, height) {
    return layout.some(item => {
      return !(
        position.x >= item.x + item.w ||
        position.x + width <= item.x ||
        position.y >= item.y + item.h ||
        position.y + height <= item.y
      );
    });
  }

  /**
   * Clear all cached layouts
   */
  clearLayoutCache() {
    this.layoutCache.clear();
    localStorage.removeItem('fms_dashboard_layouts');
  }

  /**
   * Get layout statistics
   * @returns {Object} Layout statistics
   */
  getLayoutStatistics() {
    return {
      cachedLayouts: this.layoutCache.size,
      layoutSettings: this.layoutSettings,
      cacheKeys: Array.from(this.layoutCache.keys())
    };
  }

  /**
   * Cleanup service resources
   */
  cleanup() {
    this.saveToStorage();
    super.cleanup && super.cleanup();
  }
}

export default LayoutService;