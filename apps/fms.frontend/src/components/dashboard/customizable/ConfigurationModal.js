import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Popup } from 'devextreme-react/popup';
import { CheckBox } from 'devextreme-react/check-box';
import { Button } from 'devextreme-react/button';
import { LoadIndicator } from 'devextreme-react/load-indicator';
import Tabs from 'devextreme-react/tabs';
import { SelectBox } from 'devextreme-react/select-box';
import { Switch } from 'devextreme-react/switch';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { usePreferencesContext } from './PreferencesProvider';
import { useSelector } from 'react-redux';
import SiteFiltersMultiSelect from './SiteFiltersMultiSelect';
import axiosInstance from '../../../api/axiosInstance';
import { getUserPrimaryRole, getAccessibleCategories } from './dashboardCategories';

// Ticker size options for layout system
const TICKER_SIZE_OPTIONS = [
  { value: 'full', text: 'Full Width (100%)', description: 'Takes entire row width' },
  { value: 'half', text: 'Half Width (50%)', description: 'Two tickers per row' },
  { value: 'quarter', text: 'Quarter Width (25%)', description: 'Four tickers per row' },
  { value: 'auto', text: 'Auto Size', description: 'Automatic based on content' }
];

// Default ticker sizes by category and type
const DEFAULT_TICKER_SIZES = {
  'active_alarms': {
    'critical_alarms': 'full',
    'tank_alerts': 'half',
    'pump_warnings': 'half',
    'system_alerts': 'quarter',
    'fuel_level_warnings': 'quarter'
  },
  'key_statistics': {
    'daily_fuel_consumed': 'quarter',
    'active_vehicles': 'quarter',
    'tank_capacity_utilization': 'quarter',
    'pump_efficiency': 'quarter',
    'transaction_count': 'quarter',
    'tank_levels_widget': 'half',
    'pump_status_widget': 'half'
  },
  'performance_metrics': {
    'fuel_efficiency_trends': 'half',
    'cost_analysis': 'half',
    'usage_patterns': 'full',
    'maintenance_schedules': 'half',
    'predictive_analytics': 'full',
    'weekly_performance': 'full',
    'engine_hours_analysis': 'half'
  },
  'fuel_management': {
    'inventory_levels': 'half',
    'dispensing_rates': 'quarter',
    'fuel_reconciliation': 'half',
    'consumption_analytics': 'full',
    'delivery_schedules': 'quarter',
    'fuel_management_widget': 'half',
    'fuel_efficiency_widget': 'half'
  }
};

// Default template configurations for role-based access
const DEFAULT_TEMPLATES = [
  // Active Alarms Category
  { tickerType: 'critical_alarms', name: 'Critical Alarms', category: 'active_alarms' },
  { tickerType: 'tank_alerts', name: 'Tank Alerts', category: 'active_alarms' },
  { tickerType: 'pump_warnings', name: 'Pump Warnings', category: 'active_alarms' },
  { tickerType: 'system_alerts', name: 'System Alerts', category: 'active_alarms' },
  { tickerType: 'fuel_level_warnings', name: 'Fuel Level Warnings', category: 'active_alarms' },

  // Key Statistics Category
  { tickerType: 'daily_fuel_consumed', name: 'Daily Fuel Consumed', category: 'key_statistics' },
  { tickerType: 'active_vehicles', name: 'Active Vehicles', category: 'key_statistics' },
  { tickerType: 'tank_capacity_utilization', name: 'Tank Capacity Utilization', category: 'key_statistics' },
  { tickerType: 'pump_efficiency', name: 'Pump Efficiency', category: 'key_statistics' },
  { tickerType: 'transaction_count', name: 'Transaction Count', category: 'key_statistics' },
  { tickerType: 'tank_levels_widget', name: 'Tank Levels Widget', category: 'key_statistics' },
  { tickerType: 'pump_status_widget', name: 'Pump Status Widget', category: 'key_statistics' },

  // Performance Metrics Category
  { tickerType: 'fuel_efficiency_trends', name: 'Fuel Efficiency Trends', category: 'performance_metrics' },
  { tickerType: 'cost_analysis', name: 'Cost Analysis', category: 'performance_metrics' },
  { tickerType: 'usage_patterns', name: 'Usage Patterns', category: 'performance_metrics' },
  { tickerType: 'maintenance_schedules', name: 'Maintenance Schedules', category: 'performance_metrics' },
  { tickerType: 'predictive_analytics', name: 'Predictive Analytics', category: 'performance_metrics' },
  { tickerType: 'weekly_performance', name: 'Weekly Performance Widget', category: 'performance_metrics' },
  { tickerType: 'engine_hours_analysis', name: 'Engine Hours Analysis', category: 'performance_metrics' },

  // Fuel Management Category
  { tickerType: 'inventory_levels', name: 'Inventory Levels', category: 'fuel_management' },
  { tickerType: 'dispensing_rates', name: 'Dispensing Rates', category: 'fuel_management' },
  { tickerType: 'fuel_reconciliation', name: 'Fuel Reconciliation', category: 'fuel_management' },
  { tickerType: 'consumption_analytics', name: 'Consumption Analytics', category: 'fuel_management' },
  { tickerType: 'delivery_schedules', name: 'Delivery Schedules', category: 'fuel_management' },
  { tickerType: 'fuel_management_widget', name: 'Fuel Management Widget', category: 'fuel_management' },
  { tickerType: 'fuel_efficiency_widget', name: 'Fuel Efficiency Widget', category: 'fuel_management' }
];

// Controlled modal for dashboard ticker & filter configuration with categories
export const ConfigurationModal = ({ open, onClose }) => {
  const {
    templates = [],
    enabledTickers = [],
    tickerOrder = [],
    tickerSizes = {},
    layoutSettings = { compactMode: false, responsiveLayout: true },
    toggleTicker,
    setOrder,
    setTickerSizes,
    setLayoutSettings,
    loading,
    siteFilters
  } = usePreferencesContext() || {};

  // Get current user and role
  const currentUser = useSelector(state => state.auth.user);
  const primaryRole = getUserPrimaryRole(currentUser);

  const [authorizedSites, setAuthorizedSites] = useState([]);
  const [sitesLoading, setSitesLoading] = useState(false);
  const [sitesError, setSitesError] = useState(null);
  const [fetched, setFetched] = useState(false);
  const [activeCategory, setActiveCategory] = useState('active_alarms');
  const [layoutPreviewMode, setLayoutPreviewMode] = useState(false);

  // Get ticker size for a specific ticker
  const getTickerSize = useCallback((tickerType, categoryId) => {
    return tickerSizes[tickerType] ||
           DEFAULT_TICKER_SIZES[categoryId]?.[tickerType] ||
           'quarter';
  }, [tickerSizes]);

  // Update ticker size
  const updateTickerSize = useCallback((tickerType, size) => {
    const newSizes = { ...tickerSizes, [tickerType]: size };
    setTickerSizes?.(newSizes);
  }, [tickerSizes, setTickerSizes]);

  // Update layout settings
  const updateLayoutSettings = useCallback((newSettings) => {
    setLayoutSettings?.({ ...layoutSettings, ...newSettings });
  }, [layoutSettings, setLayoutSettings]);

  // Filter categories based on user role
  const accessibleCategories = useMemo(() => {
    return getAccessibleCategories(primaryRole);
  }, [primaryRole]);

  // Group templates by category and filter by role
  const categorizedTemplates = useMemo(() => {
    const categorized = {};

    // Initialize categories
    Object.keys(accessibleCategories).forEach(categoryId => {
      categorized[categoryId] = [];
    });

    // Use default templates as fallback if no templates are loaded
    const templatesToUse = templates.length > 0 ? templates : DEFAULT_TEMPLATES;

    // Categorize templates based on their tickerType
    templatesToUse.forEach(template => {
      let assigned = false;
      Object.entries(accessibleCategories).forEach(([categoryId, category]) => {
        if (category.tickers.includes(template.tickerType)) {
          categorized[categoryId].push(template);
          assigned = true;
        }
      });

      // If template doesn't match any category, add to first accessible category
      if (!assigned && Object.keys(accessibleCategories).length > 0) {
        const firstCategory = Object.keys(accessibleCategories)[0];
        categorized[firstCategory].push(template);
      }
    });

    return categorized;
  }, [templates, accessibleCategories]);

  // Get enabled templates for current category with ordering
  const getCategoryOrderedTemplates = useCallback((categoryId) => {
    const categoryTemplates = categorizedTemplates[categoryId] || [];
    const enabledInCategory = categoryTemplates.filter(t => enabledTickers.includes(t.tickerType));

    const orderKey = `${categoryId}_order`;
    const categoryOrder = tickerOrder[orderKey] || [];

    return enabledInCategory.sort((a, b) => {
      const indexA = categoryOrder.indexOf(a.tickerType);
      const indexB = categoryOrder.indexOf(b.tickerType);

      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;

      return indexA - indexB;
    });
  }, [categorizedTemplates, enabledTickers, tickerOrder]);

  const handleDragEnd = useCallback((result) => {
    if (!result.destination) return;

    const categoryTemplates = getCategoryOrderedTemplates(activeCategory);
    const items = Array.from(categoryTemplates);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const newOrder = items.map(item => item.tickerType);
    const orderKey = `${activeCategory}_order`;

    setOrder({
      ...tickerOrder,
      [orderKey]: newOrder
    });
  }, [getCategoryOrderedTemplates, activeCategory, tickerOrder, setOrder]);

  // --- Performance: Pre-derive active category data to narrow downstream memo dependencies ---
  const activeCategoryTemplates = useMemo(() => (
    categorizedTemplates[activeCategory] || []
  ), [categorizedTemplates, activeCategory]);

  const orderedEnabledTemplatesForActive = useMemo(() => (
    getCategoryOrderedTemplates(activeCategory)
  ), [getCategoryOrderedTemplates, activeCategory]);

  useEffect(() => {
    if (!open || fetched) return;
    let active = true;
    const run = async () => {
      setSitesLoading(true); setSitesError(null);
      try {
        let resp=await axiosInstance.get('/site/getsitebyuserid');

        if (!active) return;
        setAuthorizedSites(Array.isArray(resp.data) ? resp.data : []);
        setFetched(true);
      } catch (e) {
        if (!active) return;
        setSitesError(e.response?.data?.message || e.message);
      } finally { if (active) setSitesLoading(false); }
    };
    run();
    return () => { active = false; };
  }, [open, fetched]);

  // Create tab data for accessible categories (for Tabs component)
  const categoryTabData = useMemo(() => {
    return Object.entries(accessibleCategories).map(([categoryId, category]) => ({
      id: categoryId,
      text: category.name,
      icon: category.icon,
      color: category.color
    }));
  }, [accessibleCategories]);

  // Get the active category index
  const activeCategoryIndex = useMemo(() => {
    const categoryIds = Object.keys(accessibleCategories);
    const index = categoryIds.indexOf(activeCategory);
    return index >= 0 ? index : 0;
  }, [activeCategory, accessibleCategories]);

  // Custom tab item renderer with proper styling
  const renderTabItem = useCallback((item) => {
    return (
      <div className="tw-flex tw-items-center tw-gap-2 tw-px-3 tw-py-2">
        <span className="tw-text-lg">{item.icon}</span>
        <span className="tw-font-medium tw-text-black">{item.text}</span>
      </div>
    );
  }, []);

  // Handle tab selection change
  const handleTabSelectionChange = useCallback((e) => {
    const categoryIds = Object.keys(accessibleCategories);
    const selectedCategoryId = categoryIds[e.itemIndex];
    if (selectedCategoryId) {
      setActiveCategory(selectedCategoryId);
    }
  }, [accessibleCategories]);

  // Get the current category content - use useMemo to avoid circular dependencies
  const currentCategoryContent = useMemo(() => {
    const category = accessibleCategories[activeCategory];
    if (!category) return null;

    // Use memoized arrays (activeCategoryTemplates & orderedEnabledTemplatesForActive)
    const categoryTemplates = activeCategoryTemplates;
    const orderedEnabledTemplates = orderedEnabledTemplatesForActive;

    return (
      <>
        <div className="tw-mb-4 tw-p-4 tw-bg-gray-50 tw-rounded-lg tw-border-l-4"
             style={{ borderLeftColor: category.color }}>
          <div className="tw-flex tw-items-center tw-gap-2 tw-mb-2">
            <span className="tw-text-xl">{category.icon}</span>
            <h3 className="tw-font-semibold tw-text-lg" style={{ color: category.color }}>
              {category.name}
            </h3>
          </div>
          <p className="tw-text-sm tw-text-gray-600">{category.description}</p>
          <div className="tw-mt-2 tw-text-xs tw-text-gray-500">
            Accessible to: {category.allowedRoles.join(', ')} | Your role: {primaryRole}
          </div>
        </div>

        {/* Enabled Tickers with Drag & Drop Ordering */}
        {orderedEnabledTemplates.length > 0 && (
          <>
            <div className="tw-font-semibold tw-text-md tw-mb-3">Active Tickers ({orderedEnabledTemplates.length})</div>
            <div className="tw-mb-6">
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId={`enabled-tickers-${activeCategory}`}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`tw-space-y-2 tw-p-3 tw-rounded-lg tw-border-2 tw-border-dashed ${
                        snapshot.isDraggingOver
                          ? 'tw-border-blue-400 tw-bg-blue-50'
                          : 'tw-border-gray-300 tw-bg-gray-50'
                      }`}
                    >
                      <div className="tw-text-xs tw-opacity-70 tw-mb-2">
                        Drag to reorder tickers within this category
                      </div>
                      {orderedEnabledTemplates.map((template, index) => (
                        <Draggable
                          key={template.tickerType}
                          draggableId={`${activeCategory}-${template.tickerType}`}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`tw-p-3 tw-rounded tw-border tw-flex tw-items-center tw-gap-3 tw-transition-all ${
                                snapshot.isDragging
                                  ? 'tw-bg-white tw-shadow-lg tw-border-blue-400 tw-transform tw-rotate-1'
                                  : 'tw-bg-white tw-border-gray-200 hover:tw-shadow-sm'
                              }`}
                            >
                              <div className="tw-text-gray-400 tw-cursor-grab active:tw-cursor-grabbing">
                                ⋮⋮
                              </div>
                              <div className="tw-flex-1">
                                <div className="tw-flex tw-items-center tw-justify-between">
                                  <span className="tw-font-medium tw-text-sm">
                                    {template.name || template.tickerType}
                                  </span>
                                  <div className="tw-flex tw-items-center tw-gap-2">
                                    <span className="tw-text-xs tw-text-gray-500">Size:</span>
                                    <SelectBox
                                      dataSource={TICKER_SIZE_OPTIONS}
                                      value={getTickerSize(template.tickerType, activeCategory)}
                                      valueExpr="value"
                                      displayExpr="text"
                                      onValueChanged={(e) => updateTickerSize(template.tickerType, e.value)}
                                      width={120}
                                      className="tw-text-xs"
                                    />
                                  </div>
                                </div>
                                <div className="tw-text-xs tw-text-gray-400 tw-mt-1">
                                  {TICKER_SIZE_OPTIONS.find(opt => opt.value === getTickerSize(template.tickerType, activeCategory))?.description}
                                </div>
                              </div>
                              <div className="tw-text-xs tw-text-green-600 tw-bg-green-100 tw-px-2 tw-py-1 tw-rounded">
                                Active
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          </>
        )}

        {/* Available Tickers for Enable/Disable */}
        <div className="tw-font-semibold tw-text-md tw-mb-3">Available Tickers</div>
        <div className="tw-grid tw-grid-cols-1 tw-gap-3 tw-mb-4">
          {categoryTemplates.map(t => {
            const checked = enabledTickers.includes(t.tickerType);
            return (
              <div key={t.tickerType} className={`tw-border tw-rounded-lg tw-p-3 tw-transition-all hover:tw-shadow-sm ${
                checked
                  ? 'tw-bg-blue-50 tw-border-blue-200 dark:tw-bg-blue-900/20'
                  : 'tw-bg-gray-50 tw-border-gray-200 dark:tw-bg-gray-800'
              }`}>
                <div className="tw-flex tw-items-center tw-justify-between">
                  <div className="tw-flex-1">
                    <CheckBox
                      value={checked}
                      onValueChanged={(e) => toggleTicker?.(t.tickerType)}
                      text={t.name || t.tickerType}
                      className="tw-text-sm"
                    />
                  </div>
                  {checked && (
                    <div className="tw-flex tw-items-center tw-gap-2 tw-ml-4">
                      <span className="tw-text-xs tw-text-gray-500">Size:</span>
                      <SelectBox
                        dataSource={TICKER_SIZE_OPTIONS}
                        value={getTickerSize(t.tickerType, activeCategory)}
                        valueExpr="value"
                        displayExpr="text"
                        onValueChanged={(e) => updateTickerSize(t.tickerType, e.value)}
                        width={120}
                        className="tw-text-xs"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {categoryTemplates.length === 0 && (
          <div className="tw-text-sm tw-text-gray-500 tw-text-center tw-py-4 tw-bg-gray-50 tw-rounded">
            No tickers available for this category
          </div>
        )}
      </>
    );
  }, [accessibleCategories, activeCategory, activeCategoryTemplates, orderedEnabledTemplatesForActive, enabledTickers, primaryRole, handleDragEnd, getTickerSize, updateTickerSize, toggleTicker]);

  const content = (
    <div className="dx-dashboard-config tw-max-w-5xl tw-mx-auto" style={{ minHeight: '50vh' }}>
      {(loading?.templates || sitesLoading) ? (
        <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-min-h-[40vh] tw-gap-4">
          <LoadIndicator height={32} width={32} />
          <span className="tw-text-sm tw-opacity-70">
            {loading?.templates ? 'Loading templates...' : 'Loading sites...'}
          </span>
        </div>
      ) : (
        <>
          {Object.keys(accessibleCategories).length === 0 ? (
            <div className="tw-text-center tw-py-8">
              <div className="tw-text-lg tw-text-gray-500 tw-mb-2">No dashboard categories available</div>
              <div className="tw-text-sm tw-text-gray-400">
                Your role ({primaryRole}) does not have access to any dashboard categories.
              </div>
            </div>
          ) : (
            <>
              <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-border">
                <Tabs
                  dataSource={categoryTabData}
                  selectedIndex={activeCategoryIndex}
                  onItemClick={handleTabSelectionChange}
                  width="100%"
                  className="tw-mb-4"
                  itemRender={renderTabItem}
                />

                {/* Tab Content */}
                <div className="tw-p-4">
                  {currentCategoryContent}
                </div>
              </div>

              {/* Global Filters Section */}
              <div className="tw-mt-8 tw-border-t tw-pt-6">
                <div className="tw-font-semibold tw-text-lg tw-mb-4">Global Filters</div>

                <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-3 tw-gap-6 tw-mb-6">
                  <div>
                    <div className="tw-font-semibold tw-text-md tw-mb-3">Site Filters</div>
                    {sitesError ? (
                      <div className="tw-text-sm tw-text-red-500 tw-p-3 tw-bg-red-50 tw-rounded">{sitesError}</div>
                    ) : (
                      <>
                        <SiteFiltersMultiSelect allSites={authorizedSites} />
                        <div className="tw-mt-2 tw-text-xs tw-text-gray-600">
                          Selected: {siteFilters?.length || 0} sites
                        </div>
                      </>
                    )}
                  </div>

                  <div>
                    <div className="tw-font-semibold tw-text-md tw-mb-3">Layout Settings</div>
                    <div className="tw-space-y-3">
                      <div className="tw-flex tw-items-center tw-justify-between">
                        <span className="tw-text-sm">Compact Mode</span>
                        <Switch
                          value={layoutSettings.compactMode || false}
                          onValueChanged={(e) => updateLayoutSettings({ compactMode: e.value })}
                        />
                      </div>
                      <div className="tw-flex tw-items-center tw-justify-between">
                        <span className="tw-text-sm">Responsive Layout</span>
                        <Switch
                          value={layoutSettings.responsiveLayout !== false}
                          onValueChanged={(e) => updateLayoutSettings({ responsiveLayout: e.value })}
                        />
                      </div>
                      <div className="tw-flex tw-items-center tw-justify-between">
                        <span className="tw-text-sm">Preview Mode</span>
                        <Switch
                          value={layoutPreviewMode}
                          onValueChanged={(e) => setLayoutPreviewMode(e.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="tw-font-semibold tw-text-md tw-mb-3">Dashboard Statistics</div>
                    <div className="tw-text-sm tw-space-y-2">
                      <div>Total Enabled Tickers: <span className="tw-font-medium">{enabledTickers.length}</span></div>
                      <div>Available Categories: <span className="tw-font-medium">{Object.keys(accessibleCategories).length}</span></div>
                      <div>Your Role: <span className="tw-font-medium tw-capitalize">{primaryRole}</span></div>
                    </div>
                  </div>
                </div>

                {layoutPreviewMode && (
                  <div className="tw-mt-6 tw-p-4 tw-bg-blue-50 tw-rounded-lg tw-border tw-border-blue-200">
                    <div className="tw-font-semibold tw-text-md tw-mb-2 tw-text-blue-800">Layout Preview</div>
                    <div className="tw-text-sm tw-text-blue-600">
                      This feature will show a live preview of your dashboard layout with current settings.
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );

  return (
    <Popup
      visible={open}
      onHiding={onClose}
      title="Dashboard Configuration"
      width="90%"
      height="80%"
      showCloseButton={true}
      dragEnabled={true}
      resizeEnabled={true}
      className="dx-dashboard-config-popup"
    >
      {content}
      <div className="tw-flex tw-justify-end tw-gap-2 tw-mt-6 tw-pt-4 tw-border-t">
        <Button text="Cancel" onClick={onClose} />
        <Button
          text="Save & Apply"
          type="success"
          onClick={onClose}
          icon="check"
        />
      </div>
    </Popup>
  );
};

export default ConfigurationModal;
