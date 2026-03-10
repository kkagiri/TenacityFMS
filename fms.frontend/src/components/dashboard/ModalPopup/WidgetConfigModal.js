/**
 * File: WidgetConfigModal.js
 * Purpose: Configure, create, and update dashboard widgets from the modal workflow
 * Dependencies: React, Redux, DevExtreme button, M365SidePanel, dashboardService, widgetFactoryService
 * Last Modified: 2026-03-06
 *
 * Key Functions:
 * - loadWidgetTemplates(): Fetches widget templates for add/edit flows
 * - handleSave(): Creates or updates widget instances with normalized payloads
 * - handlePreviewData(): Requests preview data for current widget configuration
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Button from 'devextreme-react/button';
import notify from 'devextreme/ui/notify';
import dashboardService from '../../../services/dashboardService';
import widgetFactoryService from '../../../services/widgetFactoryService';
import M365SidePanel from '../../common/M365SidePanel';

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

  const createDefaultWidgetState = useCallback(() => ({
    customName: '',
    templateId: null,
    category: '',
    settings: {},
    filters: {},
    visualizationType: '',
    metric: '',
    mode: 'cumulative',
    datePreset: 'yesterday',
    sitesMode: 'all',
    siteIds: [],
    aggregation: 'SUM',
    vehicleTypeIds: [],
    defaultValue: '0',
    unit: 'count',
    groupBy: 'none',
    granularity: 'daily',
    includeTotal: false,
    topK: undefined
  }), []);

  // Widget form state
  const [newWidget, setNewWidget] = useState(createDefaultWidgetState);

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

  const parseConfigurationJson = useCallback((configurationJson) => {
    if (!configurationJson) {
      return {};
    }

    try {
      return typeof configurationJson === 'string'
        ? JSON.parse(configurationJson)
        : configurationJson;
    } catch (error) {
      console.warn('[WidgetConfigModal] Failed to parse configurationJson:', error);
      return {};
    }
  }, []);

  const getTemplateById = useCallback((templateId) => {
    if (!templateId) {
      return null;
    }

    const templatesArray = Array.isArray(widgetTemplates) ? widgetTemplates : [];
    return templatesArray.find(template => String(template.id) === String(templateId)) || null;
  }, [widgetTemplates]);

  const buildWidgetStateFromInstance = useCallback((widget) => {
    const parsedConfig = parseConfigurationJson(widget.configurationJson);
    const parsedSettings = parsedConfig.settings || {};
    const parsedFilters = parsedConfig.filters || {};
    const templateId = widget.templateId || widget.template?.id || null;
    const template = getTemplateById(templateId) || widget.template || null;

    return {
      ...createDefaultWidgetState(),
      customName: widget.customName || widget.template?.displayName || '',
      templateId,
      category: widget.category || parsedConfig.category || parsedSettings.originalCategory || template?.category || '',
      settings: parsedSettings,
      filters: parsedFilters,
      visualizationType:
        widget.widgetType ||
        parsedConfig.visualizationType ||
        parsedSettings.customWidgetType ||
        template?.widgetType ||
        '',
      metric:
        widget.dataSource ||
        parsedConfig.dataSource ||
        parsedSettings.dataSource ||
        template?.dataSource ||
        '',
      mode: parsedSettings.mode || parsedConfig.mode || 'cumulative',
      datePreset: parsedSettings.datePreset || parsedConfig.datePreset || 'yesterday',
      sitesMode: parsedSettings.sitesMode || (parsedFilters.siteIds?.length ? 'custom' : 'all'),
      siteIds: parsedFilters.siteIds || [],
      aggregation: parsedSettings.aggregation || 'SUM',
      vehicleTypeIds: parsedFilters.vehicleTypeIds || [],
      defaultValue: parsedSettings.defaultValue || parsedSettings.value || '0',
      unit: parsedSettings.unit || 'count',
      groupBy: parsedSettings.groupBy || 'none',
      granularity: parsedSettings.granularity || 'daily',
      includeTotal: parsedSettings.includeTotal || false,
      topK: parsedSettings.topK
    };
  }, [createDefaultWidgetState, getTemplateById, parseConfigurationJson]);

  const buildCanonicalWidgetPayload = useCallback((widgetState, options = {}) => {
    const templatesArray = Array.isArray(widgetTemplates) ? widgetTemplates : [];
    const template = getTemplateById(widgetState.templateId);
    const resolvedVisualizationType = widgetState.visualizationType || template?.widgetType || 'default';
    const hasCustomDefinition = Boolean(widgetState.category && resolvedVisualizationType);
    const isCustomWidget = !widgetState.templateId && hasCustomDefinition;
    const baseTemplate = template || (isCustomWidget
      ? templatesArray.find(item =>
        item.widgetType === resolvedVisualizationType ||
        item.category === widgetState.category
      ) || null
      : null);
    const resolvedTemplateId = widgetState.templateId || options.fallbackTemplateId || baseTemplate?.id || null;
    const resolvedCategory = isCustomWidget
      ? widgetState.category
      : (template?.category || widgetState.category || '');
    const resolvedDataSource = isCustomWidget
      ? (widgetState.metric || widgetState.settings?.dataSource || '')
      : (template?.dataSource || widgetState.metric || widgetState.settings?.dataSource || '');

    const settings = {
      ...(widgetState.settings || {}),
      ...((options.extraSettings) || {}),
      mode: widgetState.mode || widgetState.settings?.mode || 'cumulative',
      datePreset: widgetState.datePreset || widgetState.settings?.datePreset || 'yesterday',
      sitesMode: widgetState.sitesMode || widgetState.settings?.sitesMode || ((widgetState.siteIds || []).length ? 'custom' : 'all'),
      aggregation: widgetState.aggregation || widgetState.settings?.aggregation || 'SUM',
      dataSource: resolvedDataSource
    };

    if (widgetState.groupBy && widgetState.groupBy !== 'none') {
      settings.groupBy = widgetState.groupBy;
    }

    if (widgetState.granularity) {
      settings.granularity = widgetState.granularity;
    }

    if (widgetState.includeTotal !== undefined) {
      settings.includeTotal = widgetState.includeTotal;
    }

    if (widgetState.topK !== undefined && widgetState.topK !== null && widgetState.topK !== '') {
      settings.topK = widgetState.topK;
    }

    if (widgetState.unit) {
      settings.unit = widgetState.unit;
    }

    if (resolvedVisualizationType === 'BIG_STAT_CARD') {
      settings.value = widgetState.defaultValue || settings.value || '0';
      settings.unit = widgetState.unit || settings.unit || 'count';
    }

    if (isCustomWidget) {
      settings.isCustomWidget = true;
      settings.originalCategory = resolvedCategory;
      settings.customWidgetType = resolvedVisualizationType;

      if (baseTemplate?.id) {
        settings.baseTemplateId = baseTemplate.id;
      }
    }

    const filters = {
      ...(widgetState.filters || {}),
      ...((options.extraFilters) || {}),
      siteIds: widgetState.sitesMode === 'all' ? [] : (widgetState.siteIds || []),
      vehicleTypeIds: widgetState.vehicleTypeIds || []
    };

    const payload = {
      customName: widgetState.customName?.trim?.() || '',
      visualizationType: resolvedVisualizationType,
      settings,
      filters
    };

    if (resolvedTemplateId) {
      payload.templateId = resolvedTemplateId;
    }

    if (widgetState.positionX !== undefined) {
      payload.positionX = widgetState.positionX;
    }

    if (widgetState.positionY !== undefined) {
      payload.positionY = widgetState.positionY;
    }

    if (widgetState.width !== undefined) {
      payload.width = widgetState.width;
    }

    if (widgetState.height !== undefined) {
      payload.height = widgetState.height;
    }

    return payload;
  }, [getTemplateById, widgetTemplates]);

  const buildFactoryRequest = useCallback((widgetState, options = {}) => {
    const payload = buildCanonicalWidgetPayload(widgetState, options);
    const template = getTemplateById(payload.templateId);
    const category = payload.settings?.originalCategory || template?.category || widgetState.category || '';
    const dataSource = payload.settings?.dataSource || template?.dataSource || '';

    return {
      widgetType: payload.visualizationType,
      category,
      dataSource,
      filters: payload.filters || {},
      settings: payload.settings || {},
      mode: payload.settings?.mode || 'cumulative',
      timeRange: payload.settings?.datePreset || 'yesterday',
      aggregationType: payload.settings?.aggregation || 'SUM'
    };
  }, [buildCanonicalWidgetPayload, getTemplateById]);

  const resetWidgetForm = useCallback(() => {
    setNewWidget(createDefaultWidgetState());
    setPreviewData(null);
    setPreviewError(null);
  }, [createDefaultWidgetState]);

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
      const hydratedWidgetState = buildWidgetStateFromInstance(editingWidget);

      console.log('[WidgetConfigModal] Populating edit form:', {
        editingWidget,
        hydratedWidgetState
      });

      setNewWidget(hydratedWidgetState);
    }
  }, [buildWidgetStateFromInstance, editingWidget]);

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
    const requiresMetric = ['admin', 'fuel_management', 'vehicle_performance', 'alerts_monitoring'].includes(newWidget.category);
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
      const editingTemplateId = formMode === 'edit'
        ? (editingWidget?.templateId || editingWidget?.template?.id || null)
        : null;
      const widgetPayload = buildCanonicalWidgetPayload(newWidget, { fallbackTemplateId: editingTemplateId });

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
      resetWidgetForm();
      setEditingWidget(null);

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
    resetWidgetForm();
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
      const widgetState = buildWidgetStateFromInstance(widget);
      const payload = buildCanonicalWidgetPayload(widgetState, {
        extraSettings: {
          isVisible: !widget.isVisible
        }
      });

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
    const requiresMetric = ['admin', 'fuel_management', 'vehicle_performance', 'alerts_monitoring'].includes(newWidget.category);
    if (requiresMetric && !newWidget.metric) {
      notify('Please select a data source first', 'warning', 3000);
      return;
    }

    setPreviewLoading(true);
    setPreviewError(null);

    try {
      const factoryRequest = buildFactoryRequest(newWidget, {
        fallbackTemplateId: formMode === 'edit'
          ? (editingWidget?.templateId || editingWidget?.template?.id || null)
          : null
      });

      const validation = await widgetFactoryService.validateWidgetConfiguration({
        ...factoryRequest,
        aggregationType: factoryRequest.aggregationType
      });

      if (!validation.isValid) {
        const errorMessage = Array.isArray(validation.validationErrors) && validation.validationErrors.length > 0
          ? validation.validationErrors.map(error => error?.message || error).join(', ')
          : (validation.message || 'Widget configuration is invalid.');

        setPreviewData(null);
        setPreviewError(errorMessage);
        return;
      }

      const result = await widgetFactoryService.getWidgetData(factoryRequest);
      if (!result.success) {
        throw new Error(result.error || 'Failed to generate widget preview.');
      }

      setPreviewData({
        ...result,
        validation
      });
    } catch (error) {
      console.error('Error testing widget configuration:', error);
      setPreviewData(null);
      setPreviewError(error.message || 'Failed to test configuration. Please check your settings.');
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
        const widgetState = buildWidgetStateFromInstance(w);
        const payload = buildCanonicalWidgetPayload(widgetState, {
          extraSettings: {
            position: w.position
          }
        });

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
        <div className="tw-border-b tw-border-gray-200 tw-px-4 sm:tw-px-6 tw-py-4 tw-space-y-4">
          <div className="tw-flex tw-flex-col sm:tw-flex-row sm:tw-items-start sm:tw-justify-between tw-gap-3">
            <div className="tw-space-y-1">
              <div className="tw-text-sm tw-font-semibold tw-text-gray-900">Manage dashboard widgets</div>
              <div className="tw-text-xs tw-text-gray-500">Shared widgets appear together with your own widgets and are marked in the list.</div>
            </div>

            <button
              type="button"
              className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-shadow-none tw-bg-[#0078d4] tw-px-3 tw-py-1.5 tw-text-xs tw-font-medium tw-text-white hover:tw-bg-[#106ebe] focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-[#0078d4]/30"
              onClick={() => {
                resetWidgetForm();
                setView('form');
                setFormMode('add');
                setEditingWidget(null);
              }}
            >
              <span className="tw-mr-1.5 tw-text-sm tw-leading-none">+</span>
              Add widget
            </button>
          </div>

          {/* Category Filters Row */}
          <div className="tw-flex tw-flex-wrap tw-gap-2 tw-mb-3">
            <button
              type="button"
              className={`tw-rounded-full tw-px-3 tw-py-1.5 tw-text-xs tw-font-medium ${activeCategory === 'all'
                ? 'tw-bg-[#eff6fc] tw-text-[#005a9e]'
                : 'tw-bg-[#f3f2f1] tw-text-gray-600 hover:tw-bg-[#edebe9]'
                }`}
              onClick={() => setActiveCategory('all')}
            >
              {`All (${widgets.length})`}
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                className={`tw-rounded-full tw-px-3 tw-py-1.5 tw-text-xs tw-font-medium ${activeCategory === cat
                  ? 'tw-bg-[#eff6fc] tw-text-[#005a9e]'
                  : 'tw-bg-[#f3f2f1] tw-text-gray-600 hover:tw-bg-[#edebe9]'
                  }`}
                onClick={() => setActiveCategory(cat)}
              >
                {`${cat.replace(/_/g, ' ')} (${widgets.filter(w => (w.template?.category || w.category) === cat).length})`}
              </button>
            ))}
          </div>

          {/* Drag Instructions */}
          <div className="tw-text-xs tw-text-gray-500">
            Drag to reorder within categories
          </div>
        </div>

        <div className="tw-flex-1 tw-overflow-y-auto tw-p-4 sm:tw-p-6">
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
      <M365SidePanel
        visible={open}
        onClose={handleClose}
        title={view === 'form' ? (formMode === 'add' ? 'Add New Widget' : 'Edit Widget') : 'Dashboard Widgets'}
        width={1200}
      >
        {renderContent()}
      </M365SidePanel>

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
