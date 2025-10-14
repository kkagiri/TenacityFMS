import React, { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import { saveDashboardLayout } from '../../redux/actions/dashboardLayoutActions';
import EnhancedWidgetRenderer from './EnhancedWidgetRenderer';
import dashboardService from '../../services/dashboardService';
import './CategoryGroupedWidgetRenderer.scss';

/**
 * Category Grouped Widget Renderer
 * Groups widgets by category with individual widget sizing
 *
 * RESPONSIVE BEHAVIOR:
 * - Desktop: Uses 12-column grid system with saved widget sizes (3, 6, 9, or 12 columns)
 * - Mobile (≤768px): Switches to flex column layout - ALL widgets display full-width
 *   in their own row, regardless of saved database layout
 * - Layout data in database remains unchanged - CSS handles mobile transformation
 *
 * This approach ensures:
 * - No backend changes needed for mobile support
 * - Database stores optimal desktop layout
 * - Mobile users get clean, full-width stacked layout
 * - Easy maintenance (CSS-only solution)
 */
const CategoryGroupedWidgetRenderer = ({
  widgets = [],
  widgetData = {},
  isLoading = {},
  errors = {},
  onRefresh = null,
  onConfigChange = null,
  onWidgetSizeChange = null,
  isEditMode = false,
  widgetStaleness = {}, // map of widgetId -> lastUpdated timestamp (ms) from hook
  onEditModeComplete = null, // New callback for when editing is done
  layoutSettings = {}
}) => {
  const dispatch = useDispatch();

  // Redux state for layout
  const layoutFromRedux = useSelector(state => state.dashboard?.layout || {
    layoutName: 'Category Grouped Dashboard',
    categoryOrder: [],
    widgetOrder: {},
    widgetSizes: {},
    version: '1.0'
  });

  const layoutLoading = useSelector(state => state.dashboard?.loading || false);
  const layoutError = useSelector(state => state.dashboard?.error || null);

  // Debug the Redux state (only when loading completes or errors occur)
  useEffect(() => {
    if (!layoutLoading && (Object.keys(layoutFromRedux.widgetSizes || {}).length > 0 || layoutError)) {
      console.log('Redux Dashboard State Update:', {
        hasWidgetSizes: Object.keys(layoutFromRedux.widgetSizes || {}).length,
        layoutError,
        widgetSizes: layoutFromRedux.widgetSizes
      });
    }
  }, [layoutFromRedux.widgetSizes, layoutLoading, layoutError]);

  const [collapsedCategories, setCollapsedCategories] = useState(new Set());

  // Local state for editing (only used during edit mode)
  const [editingWidgetSizes, setEditingWidgetSizes] = useState({});
  const [editingWidgetOrder, setEditingWidgetOrder] = useState({});
  const [editingCategoryOrder, setEditingCategoryOrder] = useState([]);

  // Use Redux state when not editing, local state when editing
  const widgetSizes = useMemo(() => {
    const result = isEditMode ? editingWidgetSizes : (layoutFromRedux.widgetSizes || {});
    return result;
  }, [isEditMode, editingWidgetSizes, layoutFromRedux.widgetSizes]);  const widgetOrder = useMemo(() =>
    isEditMode ? editingWidgetOrder : (layoutFromRedux.widgetOrder || {}),
    [isEditMode, editingWidgetOrder, layoutFromRedux.widgetOrder]
  );

  const categoryOrder = useMemo(() =>
    isEditMode ? editingCategoryOrder : (layoutFromRedux.categoryOrder || []),
    [isEditMode, editingCategoryOrder, layoutFromRedux.categoryOrder]
  );

  // Initialize editing state when entering edit mode
  useEffect(() => {
    if (isEditMode) {
      // Always reinitialize when entering edit mode to ensure we have latest Redux state
      console.log('Initializing editing state from Redux:', {
        currentEditingWidgetSizes: editingWidgetSizes,
        reduxWidgetSizes: layoutFromRedux.widgetSizes,
        reduxWidgetOrder: layoutFromRedux.widgetOrder,
        reduxCategoryOrder: layoutFromRedux.categoryOrder
      });

      setEditingWidgetSizes(layoutFromRedux.widgetSizes || {});
      setEditingWidgetOrder(layoutFromRedux.widgetOrder || {});
      setEditingCategoryOrder(layoutFromRedux.categoryOrder || []);
    } else {
      // Clear editing state when exiting edit mode
      setEditingWidgetSizes({});
      setEditingWidgetOrder({});
      setEditingCategoryOrder([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, layoutFromRedux.widgetSizes, layoutFromRedux.widgetOrder, layoutFromRedux.categoryOrder]);

  // Initialize default widget sizes ONLY for widgets not already in Redux state
  // This should only run when Redux layout is loaded, not during edit mode
  useEffect(() => {
    if (!isEditMode && layoutFromRedux.widgetSizes) {
      const initialSizes = {};
      widgets.forEach(widget => {
        const widgetId = String(widget.instanceId || widget.id);
        if (!layoutFromRedux.widgetSizes[widgetId]) {
          // Determine default height based on widget type
          const widgetType = (widget.widgetType || widget.templateType || widget.template?.widgetType || '').toLowerCase();
          let defaultHeight = 3; // Default for charts
          if (widgetType.includes('big_stat') || widgetType.includes('stat') || widgetType === 'bigstat') {
            defaultHeight = 2; // Shorter for stat cards
          }

          initialSizes[widgetId] = {
            width: widget.width || 6, // Default to half width (6/12 columns)
            height: widget.height || defaultHeight
          };
        }
      });

      // Only update Redux if we have new sizes to add
      if (Object.keys(initialSizes).length > 0) {
        console.log('Adding default sizes for new widgets:', initialSizes);
        // We should dispatch to Redux to update the layout with new defaults
        // For now, this is handled by the individual widget size change handlers
      }
    }
  }, [widgets, isEditMode, layoutFromRedux.widgetSizes]);

  // Group widgets by category with custom ordering
  const groupedWidgets = useMemo(() => {
    const groups = {};

    widgets.forEach(widget => {
      const category = widget.template?.category || widget.category || 'uncategorized';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(widget);
    });

    // Apply custom ordering if available
    Object.keys(groups).forEach(category => {
      const savedOrder = widgetOrder[category];
      if (savedOrder && Array.isArray(savedOrder)) {
        const orderedWidgets = [];
        const remainingWidgets = [...groups[category]];

        // First, add widgets in saved order
        savedOrder.forEach(widgetId => {
          const widgetIndex = remainingWidgets.findIndex(w => String(w.instanceId || w.id) === String(widgetId));
          if (widgetIndex !== -1) {
            orderedWidgets.push(remainingWidgets.splice(widgetIndex, 1)[0]);
          }
        });

        // Then add any remaining widgets that weren't in the saved order
        orderedWidgets.push(...remainingWidgets);
        groups[category] = orderedWidgets;
      }
    });

    return groups;
  }, [widgets, widgetOrder]);

  // Get ordered categories (respecting category order)
  const orderedCategories = useMemo(() => {
    const allCategories = Object.keys(groupedWidgets);

    if (categoryOrder.length === 0) {
      // If no custom order, sort alphabetically
      return allCategories.sort();
    }

    // Use custom order, placing any new categories at the end
    const orderedCats = [];
    const remainingCats = [...allCategories];

    // Add categories in saved order
    categoryOrder.forEach(category => {
      const index = remainingCats.indexOf(category);
      if (index !== -1) {
        orderedCats.push(remainingCats.splice(index, 1)[0]);
      }
    });

    // Add any remaining categories (alphabetically sorted)
    orderedCats.push(...remainingCats.sort());

    return orderedCats;
  }, [groupedWidgets, categoryOrder]);

  // Widget size options (in grid columns out of 12)
  const sizeOptions = [
    { key: 'small', label: '1/4 Width', cols: 3, icon: '▌' },
    { key: 'medium', label: '1/2 Width', cols: 6, icon: '▌▌' },
    { key: 'large', label: '3/4 Width', cols: 9, icon: '▌▌▌' },
    { key: 'full', label: 'Full Width', cols: 12, icon: '▌▌▌▌' }
  ];



  const handleWidgetSizeChange = (widgetId, newSize) => {
    const stringWidgetId = String(widgetId);

    if (isEditMode) {
      // Update local editing state
      setEditingWidgetSizes(prev => ({
        ...prev,
        [stringWidgetId]: newSize
      }));
    } else {
      // If not in edit mode, make individual API call (old behavior)
      updateWidgetSizeAPI(stringWidgetId, newSize);
    }

    // Call parent component callback if provided
    if (onWidgetSizeChange) {
      onWidgetSizeChange(stringWidgetId, newSize);
    }
  };

  // Handle widget order changes
  const handleWidgetOrderChange = (category, widgetId, direction) => {
    const categoryWidgets = groupedWidgets[category] || [];
    const currentIndex = categoryWidgets.findIndex(w => String(w.instanceId || w.id) === String(widgetId));

    if (currentIndex === -1) return;

    let newIndex;
    if (direction === 'left' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else if (direction === 'right' && currentIndex < categoryWidgets.length - 1) {
      newIndex = currentIndex + 1;
    } else {
      return; // No change needed
    }

    if (isEditMode) {
      // Update local editing state
      setEditingWidgetOrder(prev => {
        const categoryOrder = prev[category] || categoryWidgets.map(w => String(w.instanceId || w.id));
        const newOrder = [...categoryOrder];

        // Swap positions
        [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];

        return { ...prev, [category]: newOrder };
      });
    } else {
      // If not in edit mode, make individual API call (old behavior)
      const categoryOrderArray = widgetOrder[category] || categoryWidgets.map(w => String(w.instanceId || w.id));
      const newOrder = [...categoryOrderArray];
      [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];
      updateWidgetOrderAPI(category, newOrder);
    }
  };

  // Handle category order changes
  const handleCategoryOrderChange = (category, direction) => {
    const currentIndex = orderedCategories.indexOf(category);

    if (currentIndex === -1) return;

    let newIndex;
    if (direction === 'up' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else if (direction === 'down' && currentIndex < orderedCategories.length - 1) {
      newIndex = currentIndex + 1;
    } else {
      return; // No change needed
    }

    if (isEditMode) {
      // Update local editing state
      setEditingCategoryOrder(prev => {
        const newOrder = [...orderedCategories];
        // Swap positions
        [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];
        return newOrder;
      });
    } else {
      // If not in edit mode, make individual API call (old behavior)
      const newOrder = [...orderedCategories];
      [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];
      updateCategoryOrderAPI(newOrder);
    }
  };

  // Save all changes when editing is complete
  const saveAllChanges = async () => {
    if (!isEditMode) return;

    const layoutData = {
      layoutName: 'Category Grouped Dashboard',
      categoryOrder: editingCategoryOrder,
      widgetOrder: editingWidgetOrder,
      widgetSizes: editingWidgetSizes,
      version: '1.0'
    };

    try {
      // Use Redux action for saving
      await dispatch(saveDashboardLayout(layoutData));
      console.log('Dashboard layout saved successfully via Redux');

      // Trigger callback to parent to exit edit mode
      if (onEditModeComplete) {
        onEditModeComplete(layoutData);
      }
    } catch (error) {
      console.error('Failed to save dashboard layout via Redux:', error);
      // Could show user notification here
    }
  };

  // Update individual widget size via API
  const updateWidgetSizeAPI = async (widgetId, newSize) => {
    try {
      const result = await dashboardService.updateWidgetSize(String(widgetId), newSize);
      if (result.success) {
        console.log(`Widget size updated successfully via API for widget ${widgetId}`);
      } else {
        throw new Error(result.message || 'Failed to update widget size');
      }
    } catch (error) {
      console.error(`Failed to update widget size via API for widget ${widgetId}:`, error);
      // The UI state is already updated, just log the error
    }
  };

  // Update widget order via API
  const updateWidgetOrderAPI = async (category, widgetOrderArray) => {
    try {
      const result = await dashboardService.updateWidgetOrder(category, widgetOrderArray);
      if (result.success) {
        console.log(`Widget order updated successfully via API for category ${category}`);
      } else {
        throw new Error(result.message || 'Failed to update widget order');
      }
    } catch (error) {
      console.error(`Failed to update widget order via API for category ${category}:`, error);
      // The UI state is already updated, just log the error
    }
  };

  // Update category order via API
  const updateCategoryOrderAPI = async (categoryOrderArray) => {
    try {
      const result = await dashboardService.updateCategoryOrder(categoryOrderArray);
      if (result.success) {
        console.log('Category order updated successfully via API');
      } else {
        throw new Error(result.message || 'Failed to update category order');
      }
    } catch (error) {
      console.error('Failed to update category order via API:', error);
      // The UI state is already updated, just log the error
    }
  };

  // Load dashboard layout from Redux - remove the effect that loads and causes re-renders
  // Layout loading will be handled by the parent component (RealtimeDashboard)
  // when it first loads, using the Redux action

  const getWidgetGridColumns = (widgetId) => {
    const size = widgetSizes[String(widgetId)];
    return size?.width || 6; // Default to half width
  };

  const getSizeOptionFromCols = (cols) => {
    return sizeOptions.find(opt => opt.cols === cols) || sizeOptions[1];
  };

  const toggleCategoryCollapse = (category) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const getCategoryDisplayName = (category) => {
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const parseFilters = (configurationJson, liveData) => {
    try {
      const config = JSON.parse(configurationJson || '{}');
      const filters = [];

  // Prefer envelope/live data over static config; also prefer settings.datePreset over root datePreset
  const configDatePreset = (config.settings && config.settings.datePreset) || config.datePreset;
  const period = liveData?.timeRange || config.timeRange || configDatePreset;
      const mode = liveData?.mode || config.mode;

      if (period) {
        filters.push(`Period: ${period}`);
      }
      if (mode) {
        filters.push(`Mode: ${mode}`);
      }
      if (config.visualizationType && config.visualizationType !== 'default') {
        filters.push(`View: ${config.visualizationType}`);
      }
      if (config.filters) {
        Object.entries(config.filters).forEach(([key, value]) => {
          if (value && value !== null && value !== '') {
            filters.push(`${key}: ${value}`);
          }
        });
      }
      // Sites filter chip
      const siteIds = config?.settings?.siteIds;
      if (Array.isArray(siteIds)) {
        filters.push(siteIds.length > 0 ? `Sites: ${siteIds.length} selected` : 'Sites: all');
      } else {
        // If no explicit site selection, assume all
        filters.push('Sites: all');
      }

      return filters;
    } catch (e) {
      return [];
    }
  };

  if (!widgets || widgets.length === 0) {
    return (
      <div className="category-grouped-widgets empty">
        <div className="empty-state">
          <i className="fa-solid fa-chart-line" />
          <h3>No Widgets Available</h3>
          <p>Add widgets to your dashboard to get started.</p>
          {isEditMode && (
            <button className="btn btn-primary">
              <i className="fa-solid fa-plus" />
              Add Widget
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="category-grouped-widgets">
      {orderedCategories.map((category) => {
        const categoryWidgets = groupedWidgets[category];
        const isCollapsed = collapsedCategories.has(category);
        const categoryIndex = orderedCategories.indexOf(category);

        return (
          <div key={category} className={`widget-category ${isCollapsed ? 'collapsed' : ''}`}>
            {/* Category Header */}
            <div className="category-header">
              <div className="category-info">
                <button
                  className="category-toggle"
                  onClick={() => toggleCategoryCollapse(category)}
                  title={isCollapsed ? 'Expand category' : 'Collapse category'}
                >
                  <i className={`fa-solid ${isCollapsed ? 'fa-chevron-right' : 'fa-chevron-down'}`} />
                </button>
                <div className="category-title">
                  <h2>{getCategoryDisplayName(category)}</h2>
                </div>
              </div>

              {/* Category Order Controls (in edit mode) */}
              {isEditMode && (
                <div className="category-controls">
                  <div className="category-order-controls">
                    <button
                      className="category-order-btn"
                      onClick={() => handleCategoryOrderChange(category, 'up')}
                      disabled={categoryIndex === 0}
                      title="Move Category Up"
                    >
                      <i className="fa-solid fa-chevron-up" />
                    </button>
                    <button
                      className="category-order-btn"
                      onClick={() => handleCategoryOrderChange(category, 'down')}
                      disabled={categoryIndex === orderedCategories.length - 1}
                      title="Move Category Down"
                    >
                      <i className="fa-solid fa-chevron-down" />
                    </button>
                  </div>
                </div>
              )}

              {/* Individual Widget Sizing Info (in edit mode) */}
              {!isCollapsed && isEditMode && (
                <div className="layout-info">
                  <span className="layout-info-text">
                    <i className="fa-solid fa-info-circle" />
                    Make your changes, then click "Done Editing" to save all changes at once
                  </span>
                  <button
                    className="save-changes-btn"
                    onClick={saveAllChanges}
                    title="Save All Changes"
                  >
                    <i className="fa-solid fa-save" />
                    Save Changes
                  </button>
                </div>
              )}
            </div>

            {/* Category Content */}
            {!isCollapsed && (
              <div className="category-content">
                <div className="widgets-auto-grid">
                  {categoryWidgets.map(widget => {
                    const instanceId = widget.instanceId || widget.id;
                    const data = widgetData[instanceId];
                    const lastUpdated = data?.lastUpdated ? new Date(data.lastUpdated).getTime() : null;
                    const now = Date.now();
                    const ageMs = lastUpdated ? now - lastUpdated : null;
                    const isStale = ageMs != null && ageMs > 60000; // >60s
                    const loading = isLoading[instanceId] || false;
                    const rawError = errors[instanceId] || null;
                    const error = rawError ? (typeof rawError === 'string' ? { message: rawError } : rawError) : null;
                    const filters = parseFilters(widget.configurationJson, data);
                    const widgetCols = getWidgetGridColumns(instanceId);
                    const currentSizeOption = getSizeOptionFromCols(widgetCols);

                    // Determine smart default height based on widget type
                    const widgetType = (widget.widgetType || widget.templateType || widget.template?.widgetType || '').toLowerCase();
                    const defaultHeight = (widgetType.includes('big_stat') || widgetType.includes('stat') || widgetType === 'bigstat') ? 2 : 3;


                    return (
                      <div
                        key={instanceId}
                        className={`widget-wrapper widget-cols-${widgetCols}`}
                      >
                        <div className={`widget-card ${isEditMode ? 'edit-mode' : ''}`}>
                          {/* Widget Header with Custom Name and Filters */}
                          <div className="widget-card-header">
                            <div className="widget-title">
                              <h3>{widget.customName || widget.template?.displayName || 'Unnamed Widget'}</h3>
                              <div className="widget-filters">
                                {filters.map((filter, index) => (
                                  <span key={index} className="filter-tag">
                                    {filter}
                                  </span>
                                ))}
                                {isEditMode && (
                                  <span className="widget-size-badge" title={currentSizeOption.label}>
                                    {currentSizeOption.icon}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Compact Widget Controls (in edit mode) */}
                          {isEditMode && (
                            <div className="widget-edit-controls">
                              {/* Size controls */}
                              <div className="control-group">
                                <div className="control-buttons size-buttons">
                                  {sizeOptions.map(option => (
                                    <button
                                      key={option.key}
                                      className={`control-btn size-btn ${widgetCols === option.cols ? 'active' : ''}`}
                                      onClick={() => handleWidgetSizeChange(instanceId, { width: option.cols, height: widgetSizes[String(instanceId)]?.height || defaultHeight })}
                                      title={option.label}
                                    >
                                      {option.icon}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Position controls */}
                              <div className="control-group">
                                <div className="control-buttons position-buttons">
                                  <button
                                    className="control-btn position-btn"
                                    onClick={() => handleWidgetOrderChange(category, instanceId, 'left')}
                                    disabled={categoryWidgets.findIndex(w => (w.instanceId || w.id) === instanceId) === 0}
                                    title="Move Left"
                                  >
                                    <i className="fa-solid fa-arrow-left" />
                                  </button>
                                  <button
                                    className="control-btn position-btn"
                                    onClick={() => handleWidgetOrderChange(category, instanceId, 'right')}
                                    disabled={categoryWidgets.findIndex(w => (w.instanceId || w.id) === instanceId) === categoryWidgets.length - 1}
                                    title="Move Right"
                                  >
                                    <i className="fa-solid fa-arrow-right" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Widget Content */}
                          <div className="widget-card-content">
                            <EnhancedWidgetRenderer
                              widget={widget}
                              category={category}
                              data={data}
                              isLoading={loading}
                              error={error}
                              onRefresh={onRefresh}
                              onConfigChange={onConfigChange}
                              isEditMode={false} // Don't show widget-level edit controls
                              hideHeader={true}
                            />
                          </div>                          {/* Widget Footer with Meta Info */}
                          <div className="widget-card-footer">
                            <div className="widget-meta">
                              <span className="last-updated">
                                {data?.lastUpdated ? `Updated: ${new Date(data.lastUpdated).toLocaleTimeString()}` : 'No data'}
                              </span>
                              {isStale && (
                                <span className="stale-indicator" title={`Data stale (${Math.round(ageMs/1000)}s old)`}>
                                  <i className="fa-solid fa-clock" /> Stale
                                </span>
                              )}
                              {isEditMode && (
                                <div className="widget-controls">
                                  <button
                                    className="btn btn-sm btn-outline"
                                    onClick={() => onConfigChange && onConfigChange(widget)}
                                    title="Configure Widget"
                                  >
                                    <i className="fa-solid fa-cog" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Category Summary in Edit Mode */}
      {isEditMode && (
        <div className="category-summary">
          <h3>Dashboard Summary</h3>
          <div className="summary-stats">
            <div className="stat">
              <span className="value">{Object.keys(groupedWidgets).length}</span>
              <span className="label">Categories</span>
            </div>
            <div className="stat">
              <span className="value">{widgets.length}</span>
              <span className="label">Total Widgets</span>
            </div>
            <div className="stat">
              <span className="value">{Object.values(widgetSizes).filter(size => size.width === 12).length}</span>
              <span className="label">Full Width</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

CategoryGroupedWidgetRenderer.propTypes = {
  widgets: PropTypes.array.isRequired,
  widgetData: PropTypes.object,
  isLoading: PropTypes.object,
  errors: PropTypes.object,
  onRefresh: PropTypes.func,
  onConfigChange: PropTypes.func,
  onWidgetSizeChange: PropTypes.func,
  isEditMode: PropTypes.bool,
  onEditModeComplete: PropTypes.func, // New callback for when editing is complete
  layoutSettings: PropTypes.object
};

export default CategoryGroupedWidgetRenderer;
