/**
 * File: CategoryGroupedWidgetRenderer.js
 * Purpose: Renders dashboard widgets with editable grouping, sizing, and ordering behavior.
 * Dependencies: React, Redux, dashboard layout actions, EnhancedWidgetRenderer
 * Last Modified: 2026-03-11
 *
 * Key Functions:
 * - saveAllChanges(): Persists widget size and order updates.
 * - handleCategoryOrderChange(): Reorders rendered accordion groups.
 * - handleWidgetOrderChange(): Reorders widgets within the active group.
 */

import React, { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import { saveDashboardLayout } from '../../redux/actions/dashboardLayoutActions';
import EnhancedWidgetRenderer from './EnhancedWidgetRenderer';
import dashboardService from '../../services/dashboardService';
import {
  SIZE_OPTIONS,
  buildGroupedWidgets,
  getDefaultWidgetHeight,
  getGroupDisplayName,
  getOrderedGroupKeys,
  getSavedGroupOrder,
  parseWidgetFilters
} from './CategoryGroupedWidgetRenderer.utils';
import {
  EmptyDashboardState,
  LayoutSummary,
  WidgetGroupHeader
} from './CategoryGroupedWidgetRendererSections';
import './CategoryGroupedWidgetRenderer.scss';

const CategoryGroupedWidgetRenderer = ({
  widgets = [],
  widgetData = {},
  isLoading = {},
  errors = {},
  onRefresh = null,
  onConfigChange = null,
  onWidgetSizeChange = null,
  isEditMode = false,
  saveRequestVersion = 0,
  widgetStaleness = {}, // map of widgetId -> lastUpdated timestamp (ms) from hook
  onEditModeComplete = null, // New callback for when editing is done
  layoutSettings = {},
  onLayoutSettingsChange = null,
  groupBy = 'category'
}) => {
  const dispatch = useDispatch();

  const layoutFromRedux = useSelector(state => state.dashboard?.layout || {
    layoutName: 'Category Grouped Dashboard',
    categoryOrder: [],
    widgetOrder: {},
    widgetSizes: {},
    version: '1.0'
  });

  const layoutLoading = useSelector(state => state.dashboard?.loading || false);
  const layoutError = useSelector(state => state.dashboard?.error || null);

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

  const [editingWidgetSizes, setEditingWidgetSizes] = useState({});
  const [editingWidgetOrder, setEditingWidgetOrder] = useState({});
  const [editingCategoryOrder, setEditingCategoryOrder] = useState([]);

  const widgetSizes = useMemo(() => {
    const result = isEditMode ? editingWidgetSizes : (layoutFromRedux.widgetSizes || {});
    return result;
  }, [isEditMode, editingWidgetSizes, layoutFromRedux.widgetSizes]);

  const widgetOrder = useMemo(() =>
    isEditMode ? editingWidgetOrder : (layoutFromRedux.widgetOrder || {}),
    [isEditMode, editingWidgetOrder, layoutFromRedux.widgetOrder]
  );

  const categoryOrder = useMemo(() =>
    isEditMode ? editingCategoryOrder : (layoutFromRedux.categoryOrder || []),
    [isEditMode, editingCategoryOrder, layoutFromRedux.categoryOrder]
  );

  const activeGroupOrder = useMemo(() =>
    getSavedGroupOrder(groupBy, layoutSettings, categoryOrder),
    [groupBy, layoutSettings, categoryOrder]
  );

  useEffect(() => {
    if (isEditMode) {
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
      setEditingWidgetSizes({});
      setEditingWidgetOrder({});
      setEditingCategoryOrder([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, layoutFromRedux.widgetSizes, layoutFromRedux.widgetOrder, layoutFromRedux.categoryOrder]);

  useEffect(() => {
    if (!isEditMode && layoutFromRedux.widgetSizes) {
      const initialSizes = {};
      widgets.forEach(widget => {
        const widgetId = String(widget.instanceId || widget.id);
        if (!layoutFromRedux.widgetSizes[widgetId]) {
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

      if (Object.keys(initialSizes).length > 0) {
        console.log('Adding default sizes for new widgets:', initialSizes);
      }
    }
  }, [widgets, isEditMode, layoutFromRedux.widgetSizes]);

  const groupedWidgets = useMemo(() =>
    buildGroupedWidgets(widgets, groupBy, widgetOrder),
    [widgets, groupBy, widgetOrder]
  );

  const orderedCategories = useMemo(() =>
    getOrderedGroupKeys(groupedWidgets, activeGroupOrder),
    [groupedWidgets, activeGroupOrder]
  );
  const handleWidgetSizeChange = (widgetId, newSize) => {
    const stringWidgetId = String(widgetId);

    if (isEditMode) {
      setEditingWidgetSizes(prev => ({
        ...prev,
        [stringWidgetId]: newSize
      }));
    } else {
      updateWidgetSizeAPI(stringWidgetId, newSize);
    }

    if (onWidgetSizeChange) {
      onWidgetSizeChange(stringWidgetId, newSize);
    }
  };

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
      return;
    }

    if (isEditMode) {
      setEditingWidgetOrder(prev => {
        const categoryOrder = prev[category] || categoryWidgets.map(w => String(w.instanceId || w.id));
        const newOrder = [...categoryOrder];
        [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];

        return { ...prev, [category]: newOrder };
      });
    } else {
      const categoryOrderArray = widgetOrder[category] || categoryWidgets.map(w => String(w.instanceId || w.id));
      const newOrder = [...categoryOrderArray];
      [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];
      updateWidgetOrderAPI(category, newOrder);
    }
  };

  const handleCategoryOrderChange = (category, direction) => {
    const currentIndex = orderedCategories.indexOf(category);

    if (currentIndex === -1) return;

    let newIndex;
    if (direction === 'up' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else if (direction === 'down' && currentIndex < orderedCategories.length - 1) {
      newIndex = currentIndex + 1;
    } else {
      return;
    }

    if (isEditMode) {
      const newOrder = [...orderedCategories];
      [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];

      if (groupBy === 'category') {
        setEditingCategoryOrder(newOrder);
      } else if (groupBy !== 'none' && onLayoutSettingsChange) {
        onLayoutSettingsChange({
          ...layoutSettings,
          groupOrders: {
            ...(layoutSettings?.groupOrders || {}),
            [groupBy]: newOrder
          }
        });
      }
    } else {
      const newOrder = [...orderedCategories];
      [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];

      if (groupBy === 'category') {
        updateCategoryOrderAPI(newOrder);
      } else if (groupBy !== 'none' && onLayoutSettingsChange) {
        onLayoutSettingsChange({
          ...layoutSettings,
          groupOrders: {
            ...(layoutSettings?.groupOrders || {}),
            [groupBy]: newOrder
          }
        });
      }
    }
  };

  const saveAllChanges = async () => {
    if (!isEditMode) return;

    const layoutData = {
      layoutName: 'Category Grouped Dashboard',
      categoryOrder: groupBy === 'category' ? editingCategoryOrder : (layoutFromRedux.categoryOrder || []),
      widgetOrder: editingWidgetOrder,
      widgetSizes: editingWidgetSizes,
      version: '1.0'
    };

    try {
      await dispatch(saveDashboardLayout(layoutData));
      console.log('Dashboard layout saved successfully via Redux');

      if (onEditModeComplete) {
        onEditModeComplete(layoutData);
      }
    } catch (error) {
      console.error('Failed to save dashboard layout via Redux:', error);
    }
  };

  useEffect(() => {
    if (!isEditMode || saveRequestVersion === 0) {
      return;
    }

    saveAllChanges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveRequestVersion]);

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
    }
  };

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
    }
  };

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
    }
  };

  const getWidgetGridColumns = (widgetId) => {
    const size = widgetSizes[String(widgetId)];
    return size?.width || 6;
  };

  const getSizeOptionFromCols = (cols) => {
    return SIZE_OPTIONS.find(opt => opt.cols === cols) || SIZE_OPTIONS[1];
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

  if (!widgets || widgets.length === 0) {
    return <EmptyDashboardState isEditMode={isEditMode} />;
  }

  return (
    <div className="category-grouped-widgets">
      {orderedCategories.map((category) => {
        const categoryWidgets = groupedWidgets[category];
        const isCollapsed = collapsedCategories.has(category);
        const categoryIndex = orderedCategories.indexOf(category);
        const showGroupHeader = groupBy !== 'none' || isEditMode;
        const categoryTitle = getGroupDisplayName(category, groupBy);

        return (
          <div key={category} className={`widget-category ${isCollapsed ? 'collapsed' : ''}`}>
            <WidgetGroupHeader
              showGroupHeader={showGroupHeader}
              groupBy={groupBy}
              isCollapsed={isCollapsed}
              category={category}
              categoryTitle={categoryTitle}
              isEditMode={isEditMode}
              categoryIndex={categoryIndex}
              orderedCategoriesLength={orderedCategories.length}
              onToggleCategory={toggleCategoryCollapse}
              onMoveGroup={handleCategoryOrderChange}
            />

            {(!isCollapsed || groupBy === 'none') && (
              <div className="category-content">
                <div className="widgets-auto-grid">
                  {categoryWidgets.map(widget => {
                    const instanceId = widget.instanceId || widget.id;
                    const data = widgetData[instanceId];
                    const lastUpdated = data?.lastUpdated ? new Date(data.lastUpdated).getTime() : null;
                    const now = Date.now();
                    const ageMs = lastUpdated ? now - lastUpdated : null;
                    const isStale = ageMs != null && ageMs > 60000;
                    const loading = isLoading[instanceId] || false;
                    const rawError = errors[instanceId] || null;
                    const error = rawError ? (typeof rawError === 'string' ? { message: rawError } : rawError) : null;
                    const filters = parseWidgetFilters(widget.configurationJson, data, {
                      showFilterCards: layoutSettings?.showFilterCards !== false
                    });
                    const widgetCols = getWidgetGridColumns(instanceId);
                    const currentSizeOption = getSizeOptionFromCols(widgetCols);
                    const defaultHeight = getDefaultWidgetHeight(widget);
                    return (
                      <div
                        key={instanceId}
                        className={`widget-wrapper widget-cols-${widgetCols}`}
                      >
                        <div className={`widget-card ${isEditMode ? 'edit-mode' : ''}`}>
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

                          {isEditMode && (
                            <div className="widget-edit-controls">
                              <div className="control-group">
                                <div className="control-buttons size-buttons">
                                  {SIZE_OPTIONS.map(option => (
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

                          <div className="widget-card-content">
                            <EnhancedWidgetRenderer
                              widget={widget}
                              category={category}
                              data={data}
                              isLoading={loading}
                              error={error}
                              onRefresh={onRefresh}
                              onConfigChange={onConfigChange}
                              isEditMode={false}
                              hideHeader={true}
                            />
                          </div>                          {/* Widget Footer with Meta Info */}
                          <div className="widget-card-footer">
                            <div className="widget-meta">
                              <span className="last-updated">
                                {data?.lastUpdated ? `Updated: ${new Date(data.lastUpdated).toLocaleTimeString()}` : 'No data'}
                              </span>
                              {isStale && (
                                <span className="stale-indicator" title={`Data stale (${Math.round(ageMs / 1000)}s old)`}>
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
      {isEditMode && (
        <LayoutSummary
          groupedWidgets={groupedWidgets}
          widgets={widgets}
          widgetSizes={widgetSizes}
          groupBy={groupBy}
        />
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
  saveRequestVersion: PropTypes.number,
  onEditModeComplete: PropTypes.func,
  layoutSettings: PropTypes.object,
  onLayoutSettingsChange: PropTypes.func,
  groupBy: PropTypes.oneOf(['category', 'widgetType', 'none'])
};

export default CategoryGroupedWidgetRenderer;
