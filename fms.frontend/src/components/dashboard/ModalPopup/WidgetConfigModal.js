import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Popup from 'devextreme-react/popup';
import Button from 'devextreme-react/button';
import notify from 'devextreme/ui/notify';
import dashboardMetricsService from '../../../services/DashboardMetricsService'; // Still using for widget testing
import dataSourceService from '../../../services/dataSourceService'; // Phase 2 unified service
import dashboardService from '../../../services/dashboardService';

// Import Redux actions
import { fetchVehicleTypes } from '../../../redux/actions/vehicleTypeActions';
import { fetchSiteList } from '../../../redux/actions/siteActions';

// Import our new components
import WidgetForm from './WidgetForm';
import WidgetList from './WidgetList';
import WidgetVisibilityModal from './WidgetVisibilityModal';

import './WidgetConfigModal.css';
import './WidgetVisibilityModal.css';

export default function WidgetConfigModal({
  open,
  onClose,
  onWidgetAdded,
  onWidgetUpdated,
  onWidgetDeleted,
  onWidgetsReordered
}) {
  // Redux setup
  const dispatch = useDispatch();
  const vehicleTypes = useSelector(state => state.vehicleType?.vehicleTypes || []);
  const sites = useSelector(state => state.site?.sites || []);
  const sitesLoadingFromRedux = useSelector(state => state.site?.loading || false);
  const sitesErrorFromRedux = useSelector(state => state.site?.error || null);
  const vehicleTypesLoadingFromRedux = useSelector(state => state.vehicleType?.loading || false);
  const vehicleTypesErrorFromRedux = useSelector(state => state.vehicleType?.error || null);

  // State management
  // view: 'list' | 'form'
  const [view, setView] = useState('list');
  // form mode: 'add' | 'edit'
  const [formMode, setFormMode] = useState('add');
  const [isSaving, setIsSaving] = useState(false);
  const [showVisibilityModal, setShowVisibilityModal] = useState(false);
  const [editingWidget, setEditingWidget] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');

  // Widget form state
  const [newWidget, setNewWidget] = useState({
    customName: '',
    templateId: null,
    category: '',
    settings: {},
    visualizationType: '',
    metric: '',
    mode: 'cumulative',
    datePreset: 'yesterday',
    sitesMode: 'all',
    siteIds: [],
    aggregation: 'SUM',
    vehicleTypeIds: [],
    // Add default values for BIG_STAT_CARD required fields
    defaultValue: '0',
    unit: 'count' // Changed from 'liters' to more generic 'count'
  });

  // Data loading states
  const [widgetTemplates, setWidgetTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState(null);

  const [widgets, setWidgets] = useState([]);
  const [widgetsLoading, setWidgetsLoading] = useState(false);
  const [widgetsError, setWidgetsError] = useState(null);

  // Loading states for Redux data
  const [vehicleTypesLoading, setVehicleTypesLoading] = useState(false);
  const [vehicleTypesError, setVehicleTypesError] = useState(null);
  const [sitesLoading, setSitesLoading] = useState(false);
  const [sitesError, setSitesError] = useState(null);

  // Use Redux loading states when available, fallback to local states
  const finalSitesLoading = sitesLoadingFromRedux || sitesLoading;
  const finalSitesError = sitesErrorFromRedux || sitesError;
  const finalVehicleTypesLoading = vehicleTypesLoadingFromRedux || vehicleTypesLoading;
  const finalVehicleTypesError = vehicleTypesErrorFromRedux || vehicleTypesError;

  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);

  // Constants - Updated for enhanced widgets
  const metricOptions = [
    // Fuel Management Metrics
    { id: 'fuel_dispensed', label: 'Fuel Dispensed', category: 'fuel_management' },
    { id: 'fuel_used_gps', label: 'Fuel Used (GPS)', category: 'fuel_management' },
    { id: 'fuel_lost_gps', label: 'Fuel Lost (GPS)', category: 'fuel_management' },
    { id: 'flowmeter_fuel_used', label: 'Fuel Used (Flow Meter)', category: 'fuel_management' },
    { id: 'flowmeter_fuel_lost', label: 'Fuel Lost (Flow Meter)', category: 'fuel_management' },
    { id: 'transactions_count', label: 'Transaction Count', category: 'fuel_management' },
    { id: 'average_fuel_per_transaction', label: 'Average Fuel per Transaction', category: 'fuel_management' },
    { id: 'peak_hours', label: 'Peak Hours', category: 'fuel_management' },
    { id: 'site_efficiency', label: 'Site Efficiency', category: 'fuel_management' },
    { id: 'tank_levels', label: 'Tank Levels', category: 'fuel_management' },

    // Vehicle Performance Metrics
    { id: 'engine_hours', label: 'Engine Hours', category: 'vehicle_performance' },
    { id: 'engine_hours_gps', label: 'Engine Hours (GPS)', category: 'vehicle_performance' },
    { id: 'km_travel', label: 'Distance Traveled', category: 'vehicle_performance' },
    { id: 'distance_travel', label: 'Distance Travel (GPS)', category: 'vehicle_performance' },
    { id: 'fuel_efficiency', label: 'Fuel Efficiency', category: 'vehicle_performance' },
    { id: 'flowmeter_efficiency', label: 'Flow Meter Efficiency', category: 'vehicle_performance' },
    { id: 'max_speed', label: 'Maximum Speed', category: 'vehicle_performance' },
    { id: 'avg_speed', label: 'Average Speed', category: 'vehicle_performance' },
    { id: 'performance_trends', label: 'Performance Trends', category: 'vehicle_performance' },
    { id: 'vehicle_utilization', label: 'Vehicle Utilization', category: 'vehicle_performance' },

    // Alert and Monitoring
    { id: 'alert_summary', label: 'System Alerts', category: 'alerts_monitoring' },
    { id: 'system_status', label: 'System Status', category: 'alerts_monitoring' },
    { id: 'notification_log', label: 'Notification Log', category: 'alerts_monitoring' }
  ];

  const liveDatePresets = [
    { id: 'today', label: 'Today' },
    { id: 'last_hour', label: 'Last Hour' },
    { id: 'last_4_hours', label: 'Last 4 Hours' },
    { id: 'last_12_hours', label: 'Last 12 Hours' }
  ];

  const cumulativeDatePresets = [
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'last_7_days', label: 'Last 7 Days' },
    { id: 'last_30_days', label: 'Last 30 Days' },
    { id: 'this_month', label: 'This Month' },
    { id: 'last_month', label: 'Last Month' }
  ];

  // Load data functions
  const loadWidgetTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    setTemplatesError(null);
    try {
      const templates = await dashboardService.getWidgetTemplates();
      const data = templates?.data || templates;
      setWidgetTemplates(Array.isArray(data) ? data : (data?.items || []));
    } catch (error) {
      console.error('Error loading widget templates:', error);
      setTemplatesError('Failed to load widget templates');
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  const loadWidgets = useCallback(async () => {
    setWidgetsLoading(true);
    setWidgetsError(null);
    try {
      // Using new API naming (instances)
      const instances = await dashboardService.getWidgetInstances();
      const data = instances?.data || instances; // backend may wrap in {success,data}
      setWidgets(Array.isArray(data) ? data : (data?.items || []));
    } catch (error) {
      console.error('Error loading widgets:', error);
      setWidgetsError('Failed to load widgets');
    } finally {
      setWidgetsLoading(false);
    }
  }, []);

  const loadSites = useCallback(async () => {
    setSitesLoading(true);
    setSitesError(null);
    try {
      const result = await dispatch(fetchSiteList());
      if (!result.success) {
        setSitesError(result.message || 'Failed to load sites');
      }
    } catch (error) {
      console.error('Error loading sites:', error);
      setSitesError('Failed to load sites');
    } finally {
      setSitesLoading(false);
    }
  }, [dispatch]);

  const loadVehicleTypes = useCallback(async () => {
    setVehicleTypesLoading(true);
    setVehicleTypesError(null);
    try {
      const result = await dispatch(fetchVehicleTypes());
      if (!result.success) {
        setVehicleTypesError(result.message || 'Failed to load vehicle types');
      }
    } catch (error) {
      console.error('Error loading vehicle types:', error);
      setVehicleTypesError('Failed to load vehicle types');
    } finally {
      setVehicleTypesLoading(false);
    }
  }, [dispatch]);

  // Effects
  useEffect(() => {
    if (open) {
      loadWidgetTemplates();
      loadWidgets();
      loadSites();
      loadVehicleTypes();
      setView('list');
      setFormMode('add');
    }
  }, [open, loadWidgetTemplates, loadWidgets, loadSites, loadVehicleTypes]);

  // Populate form when editing
  useEffect(() => {
    if (editingWidget) {
      const templateId = editingWidget.templateId || editingWidget.template?.id;
      const category = editingWidget.category || editingWidget.template?.category || '';

      // Parse configurationJson if it's a string
      let parsedConfig = {};
      if (editingWidget.configurationJson) {
        try {
          parsedConfig = typeof editingWidget.configurationJson === 'string'
            ? JSON.parse(editingWidget.configurationJson)
            : editingWidget.configurationJson;
        } catch (e) {
          console.warn('Failed to parse configurationJson:', e);
        }
      }

      // Merge all possible settings sources
      const settings = {
        ...parsedConfig,
        ...(editingWidget.settings || {}),
        ...(editingWidget.configuration || {})
      };

      // Extract metric/data source from various locations (backend uses 'dataSource')
      const metric = editingWidget.dataSource ||
                    editingWidget.metric ||
                    settings.dataSource ||
                    settings.metric ||
                    editingWidget.template?.dataSource ||
                    '';

      // Extract visualization type
      const visualizationType = editingWidget.widgetType ||
                               editingWidget.visualizationType ||
                               editingWidget.template?.widgetType ||
                               settings.visualizationType ||
                               '';

      console.log('[WidgetConfigModal] Populating edit form:', {
        editingWidget,
        parsedConfig,
        metric,
        visualizationType,
        category
      });

      setNewWidget({
        customName: editingWidget.customName || editingWidget.template?.displayName || '',
        templateId: templateId,
        category: category,
        settings: settings,
        visualizationType: visualizationType,
        metric: metric,
        mode: settings.mode || 'cumulative',
        datePreset: settings.datePreset || 'yesterday',
        sitesMode: settings.sitesMode || (settings.siteIds?.length ? 'custom' : 'all'),
        siteIds: settings.siteIds || editingWidget.siteIds || [],
        // Add smart filter properties
        aggregation: settings.aggregation || 'SUM',
        vehicleTypeIds: settings.vehicleTypeIds || (settings.vehicleType ? [settings.vehicleType] : []),
        // Add other fields that might be in settings
        unit: settings.unit || 'count',
        defaultValue: settings.defaultValue || settings.value || '0',
        groupBy: settings.groupBy || 'none',
        granularity: settings.granularity || 'daily'
      });
    }
  }, [editingWidget]);

  // Form validation - Updated for enhanced widgets (template or custom)
  const isFormValid = useMemo(() => {
    if (!newWidget.customName?.trim()) {
      return false;
    }

    // Either template or custom widget type must be selected
    const hasWidgetType = newWidget.templateId || (newWidget.category && newWidget.visualizationType);
    if (!hasWidgetType) {
      return false;
    }

    // For enhanced widgets, check if metric is required based on category
    const requiresMetric = ['fuel_management', 'vehicle_performance', 'alerts_monitoring'].includes(newWidget.category);
    if (requiresMetric && !newWidget.metric) {
      return false;
    }

    // Check BIG_STAT_CARD specific requirements
    if (newWidget.visualizationType === 'BIG_STAT_CARD') {
      if (!newWidget.defaultValue && !newWidget.settings?.value) {
        return false;
      }
      if (!newWidget.unit && !newWidget.settings?.unit) {
        return false;
      }
    }

    return true;
  }, [newWidget.customName, newWidget.templateId, newWidget.category, newWidget.visualizationType, newWidget.metric, newWidget.defaultValue, newWidget.unit, newWidget.settings]);

  // Calculate categories from widgets
  const categories = useMemo(() => {
    const set = new Set();
    widgets.forEach(w => set.add(w.template?.category || w.category || 'uncategorized'));
    return Array.from(set).sort();
  }, [widgets]);

  // Event handlers
  const handleSave = async () => {
    if (!isFormValid) {
      notify('Please fill in all required fields', 'warning', 3000);
      return;
    }

    setIsSaving(true);
    try {
      // Build widget payload with enhanced widget support
      const widgetPayload = {
        customName: newWidget.customName.trim(),
        settings: {
          ...newWidget.settings,
          mode: newWidget.mode,
          datePreset: newWidget.datePreset,
          sitesMode: newWidget.sitesMode,
          siteIds: newWidget.siteIds,
          // Add smart filter properties
          aggregation: newWidget.aggregation,
          vehicleTypeIds: newWidget.vehicleTypeIds
        }
      };

      // Handle template-based widgets
      if (newWidget.templateId) {
        widgetPayload.templateId = newWidget.templateId;
      }
      // Handle custom widgets - use existing template as base
      else if (newWidget.category && newWidget.visualizationType) {
        // Find a template that matches the widget type or category to use as a base
        const baseTemplate = widgetTemplates.find(t =>
          t.widgetType === newWidget.visualizationType ||
          t.category === newWidget.category
        ) || widgetTemplates[0]; // Fallback to first template

        if (baseTemplate) {
          widgetPayload.templateId = baseTemplate.id;
          widgetPayload.visualizationType = newWidget.visualizationType;

          // Override with custom settings
          widgetPayload.settings = {
            ...widgetPayload.settings,
            isCustomWidget: true,
            originalCategory: newWidget.category,
            customWidgetType: newWidget.visualizationType,
            baseTemplateId: baseTemplate.id
          };
        } else {
          throw new Error('No templates available to use as base for custom widget');
        }
      }

      // Add metric/dataSource if specified
      if (newWidget.metric) {
        widgetPayload.metric = newWidget.metric;
        widgetPayload.settings.dataSource = newWidget.metric;
      }

      // Add widget-type specific required fields
      if (newWidget.visualizationType === 'BIG_STAT_CARD') {
        // Ensure required fields for BIG_STAT_CARD widget type
        widgetPayload.settings.value = newWidget.defaultValue || newWidget.settings?.value || '0';
        widgetPayload.settings.unit = newWidget.unit || newWidget.settings?.unit || 'count';

        // Also add to filters for validation compatibility
        if (!widgetPayload.filters) {
          widgetPayload.filters = {};
        }
        // Only add to filters if not already in settings
        if (!widgetPayload.settings.value) {
          widgetPayload.filters.value = widgetPayload.settings.value;
        }
        if (!widgetPayload.settings.unit) {
          widgetPayload.filters.unit = widgetPayload.settings.unit;
        }
      }

      let result;
      if (formMode === 'edit' && editingWidget?.id) {
        result = await dashboardService.updateWidgetInstance(editingWidget.id, widgetPayload);
        notify('Widget updated successfully', 'success', 3000);
        if (onWidgetUpdated) onWidgetUpdated(result);
      } else {
        result = await dashboardService.createWidgetInstance(widgetPayload);
        notify('Widget created successfully', 'success', 3000);
        if (onWidgetAdded) onWidgetAdded(result);
      }

      // Reset form
      setNewWidget({
        customName: '',
        templateId: null,
        category: '',
        settings: {},
        visualizationType: '',
        metric: '',
        mode: 'cumulative',
        datePreset: 'yesterday',
        sitesMode: 'all',
        siteIds: [],
        aggregation: 'SUM',
        vehicleTypeIds: [],
        // Add default values for BIG_STAT_CARD required fields
        defaultValue: '0',
        unit: 'count'
      });
      setEditingWidget(null);
      setPreviewData(null);
      setPreviewError(null);

      await loadWidgets();
      setView('list');
      setFormMode('add');
    } catch (error) {
      console.error('Error saving widget:', error);
      notify('Failed to save widget. Please try again.', 'error', 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setNewWidget({
      customName: '',
      templateId: null,
      category: '',
      settings: {},
      visualizationType: '',
      metric: '',
      mode: 'cumulative',
      datePreset: 'yesterday',
      sitesMode: 'all',
      siteIds: [],
      aggregation: 'SUM',
      vehicleTypeIds: [],
      // Add default values for BIG_STAT_CARD required fields
      defaultValue: '0',
      unit: 'count'
    });
    setPreviewData(null);
    setPreviewError(null);
    setEditingWidget(null);
    setView('list');
    setFormMode('add');
  };

  const handleClose = () => {
    handleCancel();
    if (onClose) onClose();
  };

  const handleEditWidget = (widget) => {
    setEditingWidget(widget);
    setFormMode('edit');
    setView('form');
  };

  const handleDeleteWidget = async (widgetId) => {
    try {
      await dashboardService.deleteWidgetInstance(widgetId);
      notify('Widget deleted successfully', 'success', 3000);
      await loadWidgets();
      if (onWidgetDeleted) onWidgetDeleted(widgetId);
    } catch (error) {
      console.error('Error deleting widget:', error);
      notify('Failed to delete widget', 'error', 3000);
    }
  };

  const handleToggleVisibility = async (widget) => {
    try {
      const payload = {
        customName: widget.customName,
        templateId: widget.templateId || widget.template?.id,
        metric: widget.metric,
        settings: {
          ...(widget.settings || {}),
          ...(widget.configuration || {}),
          isVisible: !widget.isVisible
        }
      };
      await dashboardService.updateWidgetInstance(widget.id, payload);
      notify(`Widget ${!widget.isVisible ? 'shown' : 'hidden'} successfully`, 'success', 2000);
      await loadWidgets();
    } catch (error) {
      console.error('Error updating widget visibility:', error);
      notify('Failed to update widget visibility', 'error', 3000);
    }
  };

  const handlePreviewData = async () => {
    // For enhanced widgets, preview might not require a metric
    const hasWidgetConfig = newWidget.templateId || (newWidget.category && newWidget.visualizationType);
    if (!hasWidgetConfig) {
      notify('Please select a widget template or configure a custom widget first', 'warning', 3000);
      return;
    }

    // Check if metric is required for this category
    const requiresMetric = ['fuel_management', 'vehicle_performance', 'alerts_monitoring'].includes(newWidget.category);
    if (requiresMetric && !newWidget.metric) {
      notify('Please select a data source first', 'warning', 3000);
      return;
    }

    setPreviewLoading(true);
    setPreviewError(null);

    try {
      const testConfig = {
        templateId: newWidget.templateId,
        category: newWidget.category,
        visualizationType: newWidget.visualizationType,
        metric: newWidget.metric || 'default',
        mode: newWidget.mode,
        datePreset: newWidget.datePreset,
        siteIds: newWidget.sitesMode === 'all' ? [] : newWidget.siteIds
      };

      const result = await dashboardMetricsService.testWidgetConfiguration(testConfig);
      setPreviewData(result);
    } catch (error) {
      console.error('Error testing widget configuration:', error);
      setPreviewError('Failed to test configuration. Please check your settings.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleReorder = async (category, reorderedWidgets) => {
    // Optimistic update
    setWidgets(prev => {
      const others = prev.filter(w => (w.template?.category || w.category) !== category);
      return [...others, ...reorderedWidgets];
    });
    try {
      // Persist new positions sequentially
      for (let i = 0; i < reorderedWidgets.length; i++) {
        const w = reorderedWidgets[i];
        const payload = {
          customName: w.customName,
          templateId: w.templateId || w.template?.id,
          metric: w.metric,
          settings: {
            ...(w.settings || {}),
            ...(w.configuration || {}),
            position: w.position
          }
        };
        await dashboardService.updateWidgetInstance(w.id, payload);
      }
      notify('Widget order saved', 'success', 1500);
      if (onWidgetsReordered) onWidgetsReordered();
    } catch (error) {
      notify('Failed to save order. Reverting.', 'error', 3000);
      console.error('Reorder persist error:', error);
      loadWidgets(); // revert
    }
  };

  // Render functions
  const renderContent = () => {
    if (view === 'form') {
      return (
        <div className="tw-h-full tw-flex tw-flex-col">
          {/* Scrollable Form Content */}
          <div className="tw-flex-1 tw-overflow-y-auto tw-p-4 sm:tw-p-6">
            <WidgetForm
              newWidget={newWidget}
              setNewWidget={setNewWidget}
              widgetTemplates={widgetTemplates}
              templatesLoading={templatesLoading}
              templatesError={templatesError}
              sites={sites}
              sitesLoading={finalSitesLoading}
              sitesError={finalSitesError}
              vehicleTypes={vehicleTypes}
              vehicleTypesLoading={finalVehicleTypesLoading}
              vehicleTypesError={finalVehicleTypesError}
              metricOptions={metricOptions}
              liveDatePresets={liveDatePresets}
              cumulativeDatePresets={cumulativeDatePresets}
              previewData={previewData}
              previewLoading={previewLoading}
              previewError={previewError}
              onPreviewData={handlePreviewData}
              isEditMode={formMode === 'edit'}
              editingWidget={editingWidget}
            />
          </div>

          {/* Fixed Footer with Action Buttons */}
          <div className="tw-border-t tw-border-gray-200 tw-bg-white tw-p-4 sm:tw-p-6 tw-flex-shrink-0">
            <div className="tw-flex tw-flex-row tw-justify-end tw-gap-3">
              <Button
                text="Cancel"
                type="normal"
                stylingMode="outlined"
                width="100%"
                elementAttr={{ style: 'max-width: 120px;' }}
                height={36}
                onClick={handleCancel}
              />
              <Button
                text={isSaving ? "Saving..." : (formMode === 'add' ? "Save Widget" : "Update Widget")}
                type="default"
                stylingMode="contained"
                width="100%"
                elementAttr={{ style: 'max-width: 150px;' }}
                height={36}
                disabled={!isFormValid || isSaving}
                onClick={handleSave}
              />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="tw-h-full tw-flex tw-flex-col tw-overflow-hidden">
        {/* Header with category filters */}
        <div className="tw-border-b tw-border-gray-200 tw-px-4 sm:tw-px-6 tw-py-4">
          {/* Add Widget Button Row - Mobile: Full width, Desktop: Top right */}
          <div className="tw-flex tw-justify-center sm:tw-justify-end tw-mb-4">
            <Button
              text="Add Widget"
              icon="fa-solid fa-plus"
              type="default"
              stylingMode="contained"
              height={36}
              width="100%"
              className="sm:tw-w-auto"
              elementAttr={{ style: 'max-width: 300px;' }}
              onClick={() => { setView('form'); setFormMode('add'); setEditingWidget(null); }}
            />
          </div>

          {/* Category Filters Row */}
          <div className="tw-flex tw-flex-wrap tw-gap-2 tw-mb-3">
            <Button
              text={`All (${widgets.length})`}
              type={activeCategory === 'all' ? 'default' : 'normal'}
              stylingMode={activeCategory === 'all' ? 'contained' : 'outlined'}
              height={32}
              onClick={() => setActiveCategory('all')}
            />
            {categories.map(cat => (
              <Button
                key={cat}
                text={`${cat.replace(/_/g,' ')} (${widgets.filter(w => (w.template?.category || w.category) === cat).length})`}
                type={activeCategory === cat ? 'default' : 'normal'}
                stylingMode={activeCategory === cat ? 'contained' : 'outlined'}
                height={32}
                onClick={() => setActiveCategory(cat)}
              />
            ))}
          </div>

          {/* Drag Instructions */}
          <div className="tw-text-xs tw-text-gray-500">
            <i className="fa-solid fa-arrows-up-down-left-right tw-mr-1"></i>
            Drag to reorder within categories
          </div>
        </div>        <div className="tw-flex-1 tw-overflow-y-auto tw-p-4 sm:tw-p-6">
          <WidgetList
            widgets={widgets}
            loading={widgetsLoading}
            error={widgetsError}
            onEditWidget={handleEditWidget}
            onDeleteWidget={handleDeleteWidget}
            onToggleVisibility={handleToggleVisibility}
            onReorder={handleReorder}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
          />
        </div>
      </div>
    );
  };

  return (
    <>
      <Popup
        visible={open}
        onHiding={handleClose}
        title={view === 'form' ? (formMode === 'add' ? 'Add New Widget' : 'Edit Widget') : 'Dashboard Widgets'}
        width="95vw"
        maxWidth={1200}
        minWidth={320}
        height="90vh"
        maxHeight={900}
        showCloseButton={true}
        dragEnabled={true}
        resizeEnabled={true}
        className="widget-config-modal"
      >
        {renderContent()}
      </Popup>

      {/* Widget Visibility Modal */}
      {/* Legacy visibility modal retained (can be removed later) */}
      {showVisibilityModal && (
        <WidgetVisibilityModal
          open={showVisibilityModal}
          onClose={() => setShowVisibilityModal(false)}
        />
      )}
    </>
  );
}
