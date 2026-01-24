import React, { useState, useMemo, useEffect, useCallback } from 'react';
import SelectBox from 'devextreme-react/select-box';
import TagBox from 'devextreme-react/tag-box';
import LoadIndicator from 'devextreme-react/load-indicator';
import TextBox from 'devextreme-react/text-box';
import Button from 'devextreme-react/button';
import dataSourceService from '../../../services/dataSourceService';
import widgetFactoryService from '../../../services/widgetFactoryService';
import ModeSelector from './ModeSelector';
import {
  getRecommendedMode
} from '../../../utils/widgetModeCompatibility';

const WIDGET_TYPE_DEFINITIONS = {
  BIG_STAT_CARD: {
    id: 'BIG_STAT_CARD',
    label: 'Big Statistics Card',
    description: 'Prominent stat card with primary value and contextual metadata'
  },
  CHART_LINE_TREND: {
    id: 'CHART_LINE_TREND',
    label: 'Line Chart',
    description: 'Time-series trend chart for historical and cumulative data'
  },
  CHART_BAR_COMPARISON: {
    id: 'CHART_BAR_COMPARISON',
    label: 'Bar Comparison',
    description: 'Compare categories with aggregated bars'
  },
  CHART_PIE_DISTRIBUTION: {
    id: 'CHART_PIE_DISTRIBUTION',
    label: 'Pie Distribution',
    description: 'Distribution of values across categories'
  },
  DATA_TABLE_DETAILED: {
    id: 'DATA_TABLE_DETAILED',
    label: 'Detailed Table',
    description: 'Tabular breakdown of metrics'
  },
  PROGRESS_LIST: {
    id: 'PROGRESS_LIST',
    label: 'Progress List',
    description: 'Ranked list with progress indicators'
  },
  ALERT_NOTIFICATION: {
    id: 'ALERT_NOTIFICATION',
    label: 'Alerts & Notifications',
    description: 'Stream of alert notifications with severity'
  },
  ticker: {
    id: 'ticker',
    label: 'Ticker',
    description: 'Rolling statistic ticker card'
  }
};

const formatCategoryLabel = (category = '') => category
  .split('_')
  .map(part => part.charAt(0).toUpperCase() + part.slice(1))
  .join(' ');

const LEGACY_CATEGORY_OPTIONS = [
  { id: 'fuel_management', label: 'Fuel Management' },
  { id: 'vehicle_performance', label: 'Vehicle Performance' },
  { id: 'alerts_monitoring', label: 'Alerts & Monitoring' },
  { id: 'key_statistics', label: 'Key Statistics' },
  { id: 'performance_metrics', label: 'Performance Metrics' },
  { id: 'system_status', label: 'System Status' },
  { id: 'reporting', label: 'Reporting' },
  { id: 'configuration', label: 'Configuration' }
];

export default function WidgetForm({
  newWidget,
  setNewWidget,
  widgetTemplates,
  templatesLoading,
  templatesError,
  sites,
  sitesLoading,
  sitesError,
  vehicleTypes,
  vehicleTypesLoading,
  vehicleTypesError,
  metricOptions,
  liveDatePresets,
  cumulativeDatePresets,
  previewData,
  previewLoading,
  previewError,
  onPreviewData,
  isEditMode = false,
  editingWidget = null
}) {
  const [isCustomWidget, setIsCustomWidget] = useState(false);
  const [dataSources, setDataSources] = useState([]);
  const [dsLoading, setDsLoading] = useState(false);
  const [dsError, setDsError] = useState('');
  const [dataSourceMeta, setDataSourceMeta] = useState(null);
  const [catalog, setCatalog] = useState({ items: [], categories: [], widgetCompatibility: {} });

  const categoryOptions = useMemo(() => {
    if (catalog.categories?.length) {
      return catalog.categories.map(({ category }) => ({
        id: category,
        label: formatCategoryLabel(category)
      }));
    }
    return LEGACY_CATEGORY_OPTIONS;
  }, [catalog.categories]);

  const mergeWithMetadataDefaults = useCallback((prevState, partial = {}, metadataOverride = null) => {
    const draft = { ...prevState, ...partial };
    const baseConfig = {
      mode: partial.mode ?? prevState.mode,
      aggregation: partial.aggregation ?? prevState.aggregation,
      granularity: partial.granularity ?? prevState.granularity,
      datePreset: partial.datePreset ?? prevState.datePreset,
      unit: partial.unit ?? prevState.unit,
      includeTotal: partial.includeTotal ?? prevState.includeTotal,
      topK: partial.topK ?? prevState.topK,
      cumulative: partial.cumulative ?? prevState.cumulative,
      smoothing: partial.smoothing ?? prevState.smoothing,
      groupBy: partial.groupBy ?? prevState.groupBy
    };

    const metadata = metadataOverride || dataSourceMeta;

    const normalized = metadata
      ? dataSourceService.applyMetadataDefaults(metadata, baseConfig)
      : baseConfig;

    const next = { ...draft };
    next.mode = normalized.mode ?? next.mode;
    next.aggregation = normalized.aggregation ?? next.aggregation;
    next.granularity = normalized.granularity ?? next.granularity;
    next.datePreset = normalized.datePreset ?? next.datePreset;
    if (normalized.unit !== undefined) {
      next.unit = normalized.unit;
    }
    if (normalized.includeTotal !== undefined) {
      next.includeTotal = normalized.includeTotal;
    }
    if (normalized.topK !== undefined) {
      next.topK = normalized.topK;
    }
    if (normalized.cumulative !== undefined) {
      next.cumulative = normalized.cumulative;
    }
    if (normalized.smoothing !== undefined) {
      next.smoothing = normalized.smoothing;
    }
    if (normalized.groupBy !== undefined) {
      next.groupBy = normalized.groupBy;
    }

    next.settings = {
      ...(prevState.settings || {}),
      ...(partial.settings || {}),
      mode: next.mode,
      aggregation: next.aggregation,
      granularity: next.granularity,
      datePreset: next.datePreset,
      unit: next.unit,
      includeTotal: next.includeTotal,
      topK: next.topK,
      groupBy: next.groupBy
    };

    return next;
  }, [dataSourceMeta]);

  const availableWidgetTypes = useMemo(() => {
    if (!newWidget.category) return [];
    const categoryEntry = catalog.categories?.find(cat => cat.category === newWidget.category);
    const widgetTypeSet = new Set();

    (categoryEntry?.sources || []).forEach(source => {
      (source.metadata?.compatibleWidgetTypes || source.metadata?.CompatibleWidgetTypes || []).forEach(type => {
        if (type) widgetTypeSet.add(type);
      });
    });

    // Comprehensive fallback widget types per category when catalog doesn't have metadata
    if (widgetTypeSet.size === 0) {
      const fallbackWidgetTypes = {
        key_statistics: ['BIG_STAT_CARD', 'ticker'],
        performance_metrics: ['BIG_STAT_CARD', 'CHART_LINE_TREND', 'CHART_BAR_COMPARISON', 'DATA_TABLE_DETAILED'],
        fuel_management: ['BIG_STAT_CARD', 'CHART_LINE_TREND', 'CHART_BAR_COMPARISON', 'CHART_PIE_DISTRIBUTION', 'DATA_TABLE_DETAILED', 'PROGRESS_LIST'],
        vehicle_performance: ['BIG_STAT_CARD', 'CHART_LINE_TREND', 'CHART_BAR_COMPARISON', 'DATA_TABLE_DETAILED', 'PROGRESS_LIST'],
        alerts_monitoring: ['ALERT_NOTIFICATION', 'DATA_TABLE_DETAILED', 'BIG_STAT_CARD'],
        system_status: ['BIG_STAT_CARD', 'ALERT_NOTIFICATION', 'PROGRESS_LIST'],
        reporting: ['DATA_TABLE_DETAILED', 'CHART_BAR_COMPARISON', 'BIG_STAT_CARD'],
        configuration: ['DATA_TABLE_DETAILED', 'BIG_STAT_CARD']
      };

      const categoryFallbacks = fallbackWidgetTypes[newWidget.category] || ['BIG_STAT_CARD'];
      categoryFallbacks.forEach(type => widgetTypeSet.add(type));
    }

    return Array.from(widgetTypeSet).map(type => {
      const definition = WIDGET_TYPE_DEFINITIONS[type];
      if (definition) return definition;
      return {
        id: type,
        label: formatCategoryLabel(type.toLowerCase()),
        description: 'Supported widget type'
      };
    });
  }, [catalog.categories, newWidget.category]);

  // Vehicle type options - combines loaded vehicle types with "All" option
  const vehicleTypeOptions = useMemo(() => {
    const options = [];

    if (Array.isArray(vehicleTypes) && vehicleTypes.length > 0) {
      vehicleTypes.forEach(vt => {
        // Assuming vehicle type object has properties like 'id' and 'name' or 'type'
        options.push({
          value: vt.id || vt.vehicleTypeId || vt.name || vt.type,
          text: vt.name || vt.displayName || vt.type || vt.id
        });
      });
    } else {
      // Fallback to hardcoded types if no vehicle types are loaded
      options.push(
        { value: 1, text: 'Truck' },
        { value: 2, text: 'Car' },
        { value: 3, text: 'Van' },
        { value: 4, text: 'Motorcycle' },
        { value: 5, text: 'Bus' },
        { value: 6, text: 'Trailer' }
      );
    }

    return options;
  }, [vehicleTypes]);

  const availableDataSources = useMemo(() => {
    if (!Array.isArray(dataSources) || dataSources.length === 0) {
      console.log('[WidgetForm] No data sources available');
      return [];
    }

    const filtered = dataSources.filter(item => {
      const metadata = item.metadata || {};

      // In edit mode, be more lenient with filtering - include the current metric
      if (isEditMode && newWidget.metric && item.id === newWidget.metric) {
        return true;
      }

      const categoryMatch = !newWidget.category || metadata.category === newWidget.category || ['key_statistics', 'performance_metrics'].includes(newWidget.category);
      if (!categoryMatch) return false;

      if (newWidget.visualizationType) {
        const compatible = (metadata.compatibleWidgetTypes || []).includes(newWidget.visualizationType);
        if (!compatible && ['key_statistics', 'performance_metrics'].indexOf(newWidget.category) === -1) {
          return false;
        }
      }

      return metadata.isCatalogVisible !== false;
    }).map(item => ({
      id: item.id,
      label: item.displayName || item.id,
      category: item.metadata?.category,
      metadata: item.metadata
    }));

    console.log('[WidgetForm] Available data sources:', filtered.length, 'for category:', newWidget.category, 'metric:', newWidget.metric);
    return filtered;
  }, [dataSources, newWidget.category, newWidget.visualizationType, isEditMode, newWidget.metric]);

  // Smart unit options based on metric type
  const getUnitOptionsForMetric = useMemo(() => {
    if (dataSourceMeta?.supportedUnits?.length) {
      return dataSourceMeta.supportedUnits.map(unit => ({
        value: unit,
        text: formatCategoryLabel(unit.replace(/_/g, ' ').toLowerCase()),
        default: dataSourceMeta.recommendedUnits?.includes(unit)
      }));
    }

    return [
      { value: 'count', text: 'Count (#)', default: true },
      { value: 'liters', text: 'Liters (L)' },
      { value: 'hours', text: 'Hours (hrs)' },
      { value: 'kilometers', text: 'Kilometers (km)' },
      { value: 'percentage', text: 'Percentage (%)' },
      { value: 'currency', text: 'Currency ($)' }
    ];
  }, [dataSourceMeta]);

  const getDefaultUnitForMetric = useMemo(() => {
    if (dataSourceMeta?.recommendedUnits?.length) {
      return dataSourceMeta.recommendedUnits[0];
    }
    if (dataSourceMeta?.defaultConfiguration?.unit) {
      return dataSourceMeta.defaultConfiguration.unit;
    }
    const availableUnits = getUnitOptionsForMetric;
    const defaultUnit = availableUnits.find(unit => unit.default);
    return defaultUnit ? defaultUnit.value : availableUnits[0]?.value || 'count';
  }, [dataSourceMeta, getUnitOptionsForMetric]);

  // Smart filter configuration based on data source/metric
  const getAvailableFilters = useMemo(() => {
    // Always show aggregation and granularity - they are fundamental configuration options
    // The SelectBox will use defaults if metadata isn't available
    return {
      aggregation: true, // Always show - use defaults if no metadata
      granularity: true, // Always show granularity option
      sites: dataSourceMeta?.requiresSiteFilter ?? true,
      dateRange: true,
      vehicleTypes: dataSourceMeta?.requiresVehicleFilter ?? false
    };
  }, [dataSourceMeta]);

  // Widget types available for each category - moved to CustomWidgetDialog  // Widget types available for each category - moved to CustomWidgetDialog
  // const widgetTypesByCategory = useMemo(() => ({
  //   key_statistics: [
  //     { id: 'ticker', label: 'Ticker', description: 'Simple numeric display with trend' }
  //   ],
  //   fuel_management: [
  //     { id: 'BIG_STAT_CARD', label: 'Big Statistics Card', description: 'Large card with main value and sub-metrics' },
  //     { id: 'CHART_LINE_TREND', label: 'Line Chart', description: 'Time series trend chart' },
  //     { id: 'CHART_BAR_COMPARISON', label: 'Bar Chart', description: 'Comparative bar chart' },
  //     { id: 'CHART_PIE_DISTRIBUTION', label: 'Pie Chart', description: 'Distribution pie chart' },
  //     { id: 'DATA_TABLE_DETAILED', label: 'Data Table', description: 'Detailed data table with pagination' },
  //     { id: 'PROGRESS_LIST', label: 'Progress List', description: 'Progress bars with percentages' }
  //   ],
  //   vehicle_performance: [
  //     { id: 'BIG_STAT_CARD', label: 'Big Statistics Card', description: 'Large card with main value and sub-metrics' },
  //     { id: 'CHART_LINE_TREND', label: 'Line Chart', description: 'Performance trend over time' },
  //     { id: 'CHART_BAR_COMPARISON', label: 'Bar Chart', description: 'Vehicle comparison chart' },
  //     { id: 'DATA_TABLE_DETAILED', label: 'Data Table', description: 'Vehicle performance data table' },
  //     { id: 'PROGRESS_LIST', label: 'Progress List', description: 'Performance metrics by vehicle' }
  //   ],
  //   alerts_monitoring: [
  //     { id: 'ALERT_NOTIFICATION', label: 'Alert Widget', description: 'System alerts and notifications' },
  //     { id: 'DATA_TABLE_DETAILED', label: 'Alert Table', description: 'Detailed alert history table' },
  //     { id: 'BIG_STAT_CARD', label: 'Alert Summary Card', description: 'Alert count with severity breakdown' }
  //   ],
  //   performance_metrics: [
  //     { id: 'BIG_STAT_CARD', label: 'Metric Card', description: 'Performance metric with trend' },
  //     { id: 'CHART_LINE_TREND', label: 'Trend Chart', description: 'Performance trend over time' },
  //     { id: 'CHART_BAR_COMPARISON', label: 'Comparison Chart', description: 'Compare performance metrics' },
  //     { id: 'DATA_TABLE_DETAILED', label: 'Metrics Table', description: 'Detailed performance data' }
  //   ],
  //   system_status: [
  //     { id: 'BIG_STAT_CARD', label: 'Status Card', description: 'System status overview' },
  //     { id: 'ALERT_NOTIFICATION', label: 'Status Alerts', description: 'System status notifications' },
  //     { id: 'PROGRESS_LIST', label: 'Component Status', description: 'Individual component status' }
  //   ],
  //   reporting: [
  //     { id: 'DATA_TABLE_DETAILED', label: 'Report Table', description: 'Tabular report data' },
  //     { id: 'CHART_BAR_COMPARISON', label: 'Report Chart', description: 'Visual report charts' },
  //     { id: 'BIG_STAT_CARD', label: 'Report Summary', description: 'Key report metrics' }
  //   ],
  //   configuration: [
  //     { id: 'DATA_TABLE_DETAILED', label: 'Config Table', description: 'Configuration settings table' },
  //     { id: 'BIG_STAT_CARD', label: 'Config Summary', description: 'Configuration status overview' }
  //   ]
  // }), []);

  // Get available widget types for current category - kept for future use if needed
  // const availableWidgetTypes = useMemo(() => {
  //   if (!newWidget.category) return [];
  //   return widgetTypesByCategory[newWidget.category] || [];
  // }, [newWidget.category, widgetTypesByCategory]);

  // Handle template selection
  const handleTemplateSelect = (templateId) => {
    const templatesArray = Array.isArray(widgetTemplates) ? widgetTemplates : [];
    const selectedTemplate = templatesArray.find(t => t.id === templateId);
    if (selectedTemplate) {
      const config = JSON.parse(selectedTemplate.configurationJson || '{}');
      const defaultSettings = config.defaultSettings || {};

      console.log('Template selected:', selectedTemplate);
      console.log('Template dataSource:', selectedTemplate.dataSource);
      console.log('Default settings dataSource:', defaultSettings.dataSource);

      setNewWidget(prev => ({
        ...prev,
        templateId: templateId,
        customName: prev.customName || selectedTemplate.displayName,
        category: selectedTemplate.category,
        settings: defaultSettings,
        visualizationType: selectedTemplate.widgetType,
        metric: selectedTemplate.dataSource || defaultSettings.dataSource || prev.metric,
        mode: defaultSettings.mode || config.defaultMode || 'cumulative',
        datePreset: defaultSettings.datePreset || config.defaultDatePreset || 'yesterday'
      }));

      // Additional debug logging after state update
      console.log('Widget state after template selection:', {
        templateId: templateId,
        category: selectedTemplate.category,
        visualizationType: selectedTemplate.widgetType,
        metric: selectedTemplate.dataSource || defaultSettings.dataSource,
        dataSource: selectedTemplate.dataSource
      });
      setIsCustomWidget(false);
    }
  };

  // Handle custom widget creation
  const handleCreateCustom = () => {
    setIsCustomWidget(true);
    setNewWidget(prev => ({
      ...prev,
      templateId: null,
      category: '',
      visualizationType: '',
      customName: '',
      metric: '',
      settings: {},
      mode: 'cumulative',
      datePreset: 'yesterday'
    }));
  };

  // Auto-update unit when metric changes (for smart defaults)
  React.useEffect(() => {
    if (newWidget.metric && newWidget.visualizationType === 'BIG_STAT_CARD') {
      const smartDefaultUnit = getDefaultUnitForMetric;
      // Only update unit if it's still the generic default or doesn't match the new metric context
      if (!newWidget.unit || newWidget.unit === 'count' || newWidget.unit === 'liters') {
        setNewWidget(prev => ({
          ...prev,
          unit: smartDefaultUnit,
          settings: {
            ...prev.settings,
            unit: smartDefaultUnit
          }
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newWidget.metric, newWidget.visualizationType, getDefaultUnitForMetric]);

  // Auto-suggest groupBy for categorical chart types
  React.useEffect(() => {
    if (!newWidget.visualizationType || !dataSourceMeta) return;

    // Chart types that benefit from categorical grouping
    const needsGrouping = ['CHART_PIE_DISTRIBUTION', 'CHART_BAR_COMPARISON'].includes(newWidget.visualizationType);

    if (needsGrouping && (!newWidget.groupBy || newWidget.groupBy === 'none')) {
      // Suggest first non-'none' groupBy option
      const supportedGroupBy = dataSourceMeta?.supportedGroupBy || [];
      const firstCategorical = supportedGroupBy.find(g => g !== 'none');

      if (firstCategorical) {
        setNewWidget(prev => ({
          ...prev,
          groupBy: firstCategorical,
          settings: {
            ...prev.settings,
            groupBy: firstCategorical
          }
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newWidget.visualizationType, dataSourceMeta]);

  // Load data sources on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      setDsLoading(true);
      try {
        const catalogResult = await dataSourceService.getDataSourceCatalog({ includeMetadata: true });
        if (mounted) {
          setCatalog(catalogResult);
          setDataSources(catalogResult.items);
          setDsError('');
        }
      } catch (e) {
        if (mounted) setDsError(e?.message || 'Failed to load data sources');
      } finally {
        if (mounted) setDsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Initialize isCustomWidget state when entering edit mode
  useEffect(() => {
    if (isEditMode && editingWidget) {
      // Custom widgets have no templateId
      const isCustom = !editingWidget.templateId && editingWidget.category && editingWidget.visualizationType;
      setIsCustomWidget(isCustom);
    }
  }, [isEditMode, editingWidget]);

  // Fetch metadata and apply defaults when metric changes
  useEffect(() => {
    let mounted = true;
    (async () => {
      const metricId = newWidget.metric;
      if (!metricId) {
        if (mounted) setDataSourceMeta(null);
        return;
      }

      try {
        const snapshot = {
          mode: newWidget.mode,
          aggregation: newWidget.aggregation,
          granularity: newWidget.granularity,
          datePreset: newWidget.datePreset,
          unit: newWidget.unit,
          includeTotal: newWidget.includeTotal,
          topK: newWidget.topK
        };

        const { metadata } = await dataSourceService.normalizeConfigurationForSource(metricId, snapshot);
        if (!mounted) return;
        setDataSourceMeta(metadata);

        // Apply recommended mode for widget type when metadata is first loaded
        const shouldApplyRecommendedMode = prev => {
          // Only apply if we just got metadata and user hasn't explicitly set a mode
          if (!metadata || prev.metric !== metricId) return false;
          // Apply recommended mode if current mode is not supported by data source
          if (metadata.supportedModes && !metadata.supportedModes.includes(prev.mode)) {
            return true;
          }
          return false;
        };

        setNewWidget(prev => {
          if (prev.metric !== metricId) return prev;

          let updates = {};
          if (shouldApplyRecommendedMode(prev)) {
            const recommendedMode = getRecommendedMode(prev.visualizationType, metadata);
            updates.mode = recommendedMode;
            console.log(`[WidgetForm] Auto-applying recommended mode: ${recommendedMode}`);
          }

          return mergeWithMetadataDefaults(prev, updates, metadata);
        });
      } catch (error) {
        console.warn('[WidgetForm] Failed to normalize configuration', error);
        if (mounted) setDataSourceMeta(null);
      }
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newWidget.metric]);

  const getWidgetConfig = () => ({
    widgetType: newWidget.visualizationType,
    dataSource: newWidget.metric,
    settings: {
      mode: newWidget.mode,
      datePreset: newWidget.datePreset,
      aggregation: newWidget.aggregation,
      groupBy: newWidget.groupBy || 'none',
      granularity: newWidget.granularity,
      includeTotal: newWidget.includeTotal,
      topK: newWidget.topK,
      unit: newWidget.unit
    },
    filters: {
      siteIds: newWidget.siteIds || [],
      vehicleTypeIds: newWidget.vehicleTypeIds || []
    }
  });

  // Debounced validation
  const debouncedValidate = useCallback((config) => {
    widgetFactoryService
      .validateOnChange(config, {
        cacheKey: `${newWidget.metric || 'default'}:${newWidget.visualizationType || 'widget'}`,
        debounceMs: 300
      })
      .then(result => {
        // Validation removed for simplified UI
      })
      .catch(() => {
        // Validation removed for simplified UI
      });
  }, [newWidget.metric, newWidget.visualizationType]);

  useEffect(() => {
    if (!newWidget.metric) return;
    debouncedValidate(getWidgetConfig());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newWidget.metric, newWidget.mode, newWidget.datePreset, newWidget.aggregation, newWidget.groupBy, newWidget.granularity, newWidget.includeTotal, newWidget.topK]);

  useEffect(() => () => {
    widgetFactoryService.cancelValidation(`${newWidget.metric || 'default'}:${newWidget.visualizationType || 'widget'}`);
  }, [newWidget.metric, newWidget.visualizationType]);

  // Handle widget type selection for custom widgets - moved to CustomWidgetDialog
  // const handleWidgetTypeSelect = (widgetType) => {
  //   setNewWidget(prev => ({
  //     ...prev,
  //     visualizationType: widgetType
  //   }));
  // };

  // In edit mode, determine if it's a custom widget based on whether it has a templateId
  const isEditingCustomWidget = isEditMode && !newWidget.templateId && newWidget.category && newWidget.visualizationType;

  // Skip template/custom selection when editing - go straight to the configuration
  const showTemplateSelection = !isEditMode && !newWidget.templateId && !(isCustomWidget && newWidget.category && newWidget.visualizationType);

  return (
    <div className="tw-space-y-6">
      {/* Edit Mode Header */}
      {isEditMode && (
        <div className="tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-4 tw-space-y-4">
          <div className="tw-flex tw-items-center">
            <i className="fa-light fa-pen-to-square tw-text-blue-600 tw-text-xl tw-mr-3"></i>
            <div>
              <h4 className="tw-font-semibold tw-text-blue-900">Editing Widget</h4>
              <p className="tw-text-sm tw-text-blue-700">
                {newWidget.templateId ? 'Template-based widget' : 'Custom widget'}
              </p>
            </div>
          </div>

          {/* Widget Name Input */}
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
              Widget Name <span className="tw-text-red-500">*</span>
            </label>
            <TextBox
              value={newWidget.customName}
              placeholder="Enter a descriptive name..."
              width="100%"
              onValueChanged={(e) => setNewWidget(prev => ({ ...prev, customName: e.value }))}
            />
          </div>
        </div>
      )}

      {/* Template vs Custom Selection - Simple and Clean (only for Add mode) */}
      {showTemplateSelection && (
        <div className="tw-space-y-3">
          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-3">
            {/* Use Template Option */}
            <button
              type="button"
              className={`tw-border-2 tw-rounded-lg tw-p-6 tw-transition-all tw-text-left ${
                !isCustomWidget
                  ? 'tw-border-blue-500 tw-bg-blue-50 tw-shadow-sm'
                  : 'tw-border-gray-300 hover:tw-border-blue-300 hover:tw-bg-gray-50'
              }`}
              onClick={() => setIsCustomWidget(false)}
            >
              <div className="tw-flex tw-items-center tw-mb-3">
                <i className="fa-light fa-layer-group tw-text-2xl tw-text-blue-600 tw-mr-3"></i>
                <h4 className="tw-text-lg tw-font-semibold tw-text-gray-900">Choose Template</h4>
              </div>
              <p className="tw-text-sm tw-text-gray-600 tw-leading-relaxed">
                Quick start with pre-configured widgets designed for common dashboard needs
              </p>
            </button>

            {/* Custom Widget Option */}
            <button
              type="button"
              className={`tw-border-2 tw-rounded-lg tw-p-6 tw-transition-all tw-text-left ${
                isCustomWidget
                  ? 'tw-border-blue-500 tw-bg-blue-50 tw-shadow-sm'
                  : 'tw-border-gray-300 hover:tw-border-blue-300 hover:tw-bg-gray-50'
              }`}
              onClick={handleCreateCustom}
            >
              <div className="tw-flex tw-items-center tw-mb-3">
                <i className="fa-light fa-wand-magic-sparkles tw-text-2xl tw-text-purple-600 tw-mr-3"></i>
                <h4 className="tw-text-lg tw-font-semibold tw-text-gray-900">Create Custom</h4>
              </div>
              <p className="tw-text-sm tw-text-gray-600 tw-leading-relaxed">
                Build a unique widget tailored to your specific requirements
              </p>
            </button>
          </div>
        </div>
      )}

      {/* Template Selection - Show in Add mode when using templates */}
      {!isEditMode && !isCustomWidget && (
        <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-4">
          <div className="tw-mb-3">
            <label className="tw-block tw-text-sm tw-font-semibold tw-text-gray-800 tw-mb-1">
              <i className="fa-light fa-rectangle-history tw-mr-2 tw-text-blue-600"></i>
              Select Template
            </label>
            <p className="tw-text-xs tw-text-gray-500">Choose from available pre-built widgets</p>
          </div>

          {templatesLoading && (
            <div className="tw-flex tw-items-center tw-justify-center tw-py-8">
              <LoadIndicator width={24} height={24} />
            </div>
          )}

          {templatesError && (
            <div className="tw-bg-red-50 tw-border tw-border-red-200 tw-text-red-700 tw-p-3 tw-rounded-md tw-text-sm">
              <i className="fa-light fa-circle-exclamation tw-mr-2"></i>
              {templatesError}
            </div>
          )}

          {!templatesLoading && !templatesError && (
            <SelectBox
              items={Array.isArray(widgetTemplates) ? widgetTemplates : []}
              value={newWidget.templateId}
              displayExpr="displayName"
              valueExpr="id"
              width="100%"
              placeholder="Select a template..."
              searchEnabled={true}
              searchMode="contains"
              onValueChanged={(e) => handleTemplateSelect(e.value)}
            />
          )}
        </div>
      )}

      {/* Custom Widget Configuration - Show in Add mode for custom widgets OR Edit mode for custom widgets */}
      {((!isEditMode && isCustomWidget) || isEditingCustomWidget) && (
        <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-4 tw-space-y-4">
          <div className="tw-mb-2">
            <h4 className="tw-text-sm tw-font-semibold tw-text-gray-800 tw-flex tw-items-center">
              <i className="fa-light fa-sliders tw-mr-2 tw-text-purple-600"></i>
              Custom Widget Configuration
            </h4>
            <p className="tw-text-xs tw-text-gray-500 tw-mt-1">Configure your widget settings</p>
          </div>

          {/* Category Selection */}
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
              Category <span className="tw-text-red-500">*</span>
            </label>
            <SelectBox
              items={categoryOptions}
              value={newWidget.category}
              displayExpr="label"
              valueExpr="id"
              width="100%"
              placeholder="Select a category..."
              searchEnabled={true}
              searchMode="contains"
              onValueChanged={(e) => setNewWidget(prev => ({
                ...prev,
                category: e.value,
                visualizationType: ''
              }))}
            />
          </div>

          {/* Widget Type Selection */}
          {newWidget.category && (
            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                Widget Type <span className="tw-text-red-500">*</span>
              </label>
              <SelectBox
                items={availableWidgetTypes}
                value={newWidget.visualizationType}
                displayExpr="label"
                valueExpr="id"
                width="100%"
                placeholder="Select widget type..."
                searchEnabled={true}
                searchMode="contains"
                itemRender={(data) => (
                  <div className="tw-py-1">
                    <div className="tw-font-medium tw-text-sm">{data.label}</div>
                    {data.description && (
                      <div className="tw-text-xs tw-text-gray-500">{data.description}</div>
                    )}
                  </div>
                )}
                onValueChanged={(e) => {
                  const newWidgetType = e.value;
                  // Get recommended mode for this widget type
                  const recommendedMode = getRecommendedMode(newWidgetType, dataSourceMeta);

                  setNewWidget(prev => mergeWithMetadataDefaults(prev, {
                    visualizationType: newWidgetType,
                    mode: recommendedMode
                  }));
                }}
              />
            </div>
          )}

          {/* Custom Widget Name */}
          {newWidget.category && newWidget.visualizationType && (
            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                Widget Name <span className="tw-text-red-500">*</span>
              </label>
              <TextBox
                value={newWidget.customName}
                placeholder="Enter a descriptive name..."
                width="100%"
                onValueChanged={(e) => setNewWidget(prev => ({ ...prev, customName: e.value }))}
              />
            </div>
          )}
        </div>
      )}

      {/* Data Source & Configuration */}
      {(isEditMode || newWidget.templateId || (isCustomWidget && newWidget.visualizationType)) && (
        <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-4 tw-space-y-4">
          <div className="tw-mb-2">
            <h4 className="tw-text-sm tw-font-semibold tw-text-gray-800 tw-flex tw-items-center">
              <i className="fa-light fa-database tw-mr-2 tw-text-green-600"></i>
              Data Source
            </h4>
            <p className="tw-text-xs tw-text-gray-500 tw-mt-1">Select what data this widget will display</p>
          </div>

          {/* Data Source SelectBox */}
          {dsLoading ? (
            <div className="tw-flex tw-items-center tw-justify-center tw-py-4">
              <LoadIndicator width={20} height={20} />
            </div>
          ) : dsError ? (
            <div className="tw-bg-red-50 tw-border tw-border-red-200 tw-text-red-700 tw-p-3 tw-rounded-md tw-text-sm">
              <i className="fa-light fa-circle-exclamation tw-mr-2"></i>
              {dsError}
            </div>
          ) : (
            <SelectBox
              items={availableDataSources}
              value={newWidget.metric}
              displayExpr="label"
              valueExpr="id"
              width="100%"
              placeholder="Select data source..."
              searchEnabled={true}
              searchMode="contains"
              onValueChanged={(e) => {
                // Will trigger useEffect to fetch metadata and apply recommended mode
                setNewWidget(prev => ({ ...prev, metric: e.value }));
              }}
            />
          )}

          {/* Widget Type Specific Fields - BIG_STAT_CARD */}
          {newWidget.visualizationType === 'BIG_STAT_CARD' && (
            <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-3 tw-pt-2">
              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                  Default Value
                </label>
                <TextBox
                  value={newWidget.defaultValue || '0'}
                  placeholder="0"
                  width="100%"
                  onValueChanged={(e) => setNewWidget(prev => ({
                    ...prev,
                    defaultValue: e.value,
                    settings: {
                      ...prev.settings,
                      value: e.value
                    }
                  }))}
                />
              </div>

              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                  Unit
                </label>
                <SelectBox
                  items={getUnitOptionsForMetric}
                  value={newWidget.unit || getDefaultUnitForMetric}
                  displayExpr="text"
                  valueExpr="value"
                  width="100%"
                  placeholder="Select unit..."
                  onValueChanged={(e) => setNewWidget(prev => ({
                    ...prev,
                    unit: e.value,
                    settings: {
                      ...prev.settings,
                      unit: e.value
                    }
                  }))}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Data Filters - Simplified */}
      {(isEditMode || newWidget.templateId || (isCustomWidget && newWidget.visualizationType)) && (
        <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-4 tw-space-y-4">
          <div className="tw-mb-2">
            <h4 className="tw-text-sm tw-font-semibold tw-text-gray-800 tw-flex tw-items-center">
              <i className="fa-light fa-filter tw-mr-2 tw-text-indigo-600"></i>
              Data Filters
            </h4>
            <p className="tw-text-xs tw-text-gray-500 tw-mt-1">Configure how data is aggregated and displayed</p>
          </div>

          {/* Aggregation */}
          {getAvailableFilters.aggregation && (
            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                Aggregation
              </label>
              <SelectBox
                items={(dataSourceMeta?.supportedAggregations || ['SUM','COUNT','AVG']).map(a => ({ value: a, text: a }))}
                value={newWidget.aggregation || 'SUM'}
                displayExpr="text"
                valueExpr="value"
                width="100%"
                placeholder="Select aggregation..."
                onValueChanged={(e) => {
                  setNewWidget(prev => ({ ...prev, aggregation: e.value }));
                }}
              />
            </div>
          )}

          {/* Group By */}
          {newWidget.visualizationType && ['CHART_BAR_COMPARISON','CHART_PIE_DISTRIBUTION','DATA_TABLE_DETAILED','PROGRESS_LIST'].includes(newWidget.visualizationType) && (
            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                Group By
              </label>
              <SelectBox
                items={(dataSourceMeta?.supportedGroupBy || ['none','site','vehicleType']).map(g => ({
                  value: g,
                  text: g === 'none' ? 'Time-based' : g.charAt(0).toUpperCase() + g.slice(1).replace(/([A-Z])/g, ' $1')
                }))}
                value={newWidget.groupBy || 'none'}
                displayExpr="text"
                valueExpr="value"
                width="100%"
                placeholder="Select grouping..."
                onValueChanged={(e) => setNewWidget(prev => ({ ...prev, groupBy: e.value }))}
              />
            </div>
          )}

          {/* Granularity - Always show as a fundamental configuration option */}
          {getAvailableFilters.granularity && (
            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                Granularity
              </label>
              <SelectBox
                items={(dataSourceMeta?.supportedGranularities || dataSourceMeta?.supportedGranularity || ['minute','hour','day','week']).map(g => ({ value: g, text: g.charAt(0).toUpperCase() + g.slice(1) }))}
                value={newWidget.granularity || (newWidget.mode === 'live' ? 'minute' : 'day')}
                displayExpr="text"
                valueExpr="value"
                width="100%"
                placeholder="Select time interval..."
                onValueChanged={(e) => setNewWidget(prev => ({ ...prev, granularity: e.value }))}
              />
            </div>
          )}

          {/* Vehicle Types */}
          {getAvailableFilters.vehicleTypes && (
            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                Vehicle Types
              </label>
              <TagBox
                dataSource={vehicleTypeOptions}
                value={newWidget.vehicleTypeIds || []}
                displayExpr="text"
                valueExpr="value"
                placeholder="Select vehicle types..."
                showSelectionControls={true}
                applyValueMode="useButtons"
                searchEnabled={true}
                disabled={vehicleTypesLoading}
                onValueChanged={(e) => {
                  setNewWidget(prev => ({ ...prev, vehicleTypeIds: e.value }));
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Configuration - Mode & Sites */}
      {(isEditMode || newWidget.templateId || (isCustomWidget && newWidget.visualizationType)) && (
        <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-4 tw-space-y-4">
          <div className="tw-mb-2">
            <h4 className="tw-text-sm tw-font-semibold tw-text-gray-800 tw-flex tw-items-center">
              <i className="fa-light fa-gear tw-mr-2 tw-text-gray-600"></i>
              Configuration
            </h4>
            <p className="tw-text-xs tw-text-gray-500 tw-mt-1">Data mode and site selection</p>
          </div>

          {/* Data Mode - New Hybrid Selector */}
          <ModeSelector
            selectedMode={newWidget.mode}
            widgetType={newWidget.visualizationType}
            dataSourceMeta={dataSourceMeta}
            onChange={(newMode, defaults) => {
              setNewWidget(prev => mergeWithMetadataDefaults(prev, {
                mode: newMode,
                ...defaults
              }));
            }}
          />

          {/* Site Selection */}
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
              Site Selection
            </label>
            <SelectBox
              items={[
                { value: 'all', text: 'All Sites' },
                { value: 'custom', text: 'Specific Sites' }
              ]}
              value={newWidget.sitesMode}
              displayExpr="text"
              valueExpr="value"
              width="100%"
              onValueChanged={(e) => setNewWidget(prev => ({
                ...prev,
                sitesMode: e.value,
                siteIds: e.value === 'all' ? [] : prev.siteIds
              }))}
            />
          </div>

          {/* Site Selection for custom */}
          {newWidget.sitesMode === 'custom' && (
            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                Select Sites
              </label>
              {sitesLoading ? (
                <div className="tw-flex tw-items-center tw-py-2">
                  <LoadIndicator width={16} height={16} />
                </div>
              ) : sitesError ? (
                <div className="tw-text-xs tw-text-red-500">{sitesError}</div>
              ) : (
                <TagBox
                  dataSource={sites}
                  value={newWidget.siteIds}
                  valueExpr="id"
                  displayExpr="name"
                  width="100%"
                  showSelectionControls
                  applyValueMode="instantly"
                  onValueChanged={(e) => setNewWidget(prev => ({ ...prev, siteIds: e.value }))}
                />
              )}
            </div>
          )}

          {/* Date Range */}
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
              Date Range
            </label>
            <div className="tw-flex tw-flex-wrap tw-gap-2">
              {(newWidget.mode === 'live' ? liveDatePresets : cumulativeDatePresets).map(p => (
                <Button
                  key={p.id}
                  text={p.label}
                  type={newWidget.datePreset === p.id ? 'default' : 'normal'}
                  stylingMode={newWidget.datePreset === p.id ? 'contained' : 'outlined'}
                  height={32}
                  onClick={() => setNewWidget(prev => ({ ...prev, datePreset: p.id }))}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
