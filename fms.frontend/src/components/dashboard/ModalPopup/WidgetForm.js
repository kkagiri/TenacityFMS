import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import SelectBox from 'devextreme-react/select-box';
import TagBox from 'devextreme-react/tag-box';
import LoadIndicator from 'devextreme-react/load-indicator';
import TextBox from 'devextreme-react/text-box';
import Button from 'devextreme-react/button';
import dataSourceService from '../../../services/dataSourceService';
import widgetFactoryService from '../../../services/widgetFactoryService';

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

const MODE_DEFINITIONS = {
  live: {
    value: 'live',
    label: 'Live',
    description: 'Stream the most recent telemetry as updates arrive'
  },
  historical_snapshot: {
    value: 'historical_snapshot',
    label: 'Snapshot',
    description: 'Single point-in-time value for the chosen preset'
  },
  daily_aggregated: {
    value: 'daily_aggregated',
    label: 'Daily Aggregated',
    description: 'One aggregated data point per day for the preset window'
  },
  running_cumulative: {
    value: 'running_cumulative',
    label: 'Running Cumulative',
    description: 'Running totals (e.g., MBFU) accumulating across the range'
  },
  rolling_window: {
    value: 'rolling_window',
    label: 'Rolling Window',
    description: 'Fixed-size moving window (e.g., last 24h) recomputed over time'
  },
  compare_periods: {
    value: 'compare_periods',
    label: 'Compare Periods',
    description: 'Compare current window against a previous period'
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
  onPreviewData
}) {
  const [isCustomWidget, setIsCustomWidget] = useState(false);
  const [dataSources, setDataSources] = useState([]);
  const [dsLoading, setDsLoading] = useState(false);
  const [dsError, setDsError] = useState('');
  const [dataSourceMeta, setDataSourceMeta] = useState(null);
  const [validationState, setValidationState] = useState({ isValid: true, errors: [], suggestions: [], normalizedConfig: null });
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
      smoothing: partial.smoothing ?? prevState.smoothing
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

    next.settings = {
      ...(prevState.settings || {}),
      ...(partial.settings || {}),
      mode: next.mode,
      aggregation: next.aggregation,
      granularity: next.granularity,
      datePreset: next.datePreset,
      unit: next.unit,
      includeTotal: next.includeTotal,
      topK: next.topK
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

    if (widgetTypeSet.size === 0 && ['key_statistics', 'performance_metrics'].includes(newWidget.category)) {
      ['BIG_STAT_CARD', 'ticker'].forEach(type => widgetTypeSet.add(type));
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
    if (!Array.isArray(dataSources) || dataSources.length === 0) return [];

    return dataSources.filter(item => {
      const metadata = item.metadata || {};
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
  }, [dataSources, newWidget.category, newWidget.visualizationType]);

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

  const modeOptions = useMemo(() => {
    const supported = dataSourceMeta?.supportedModes?.length
      ? dataSourceMeta.supportedModes
      : Object.keys(MODE_DEFINITIONS);

    return supported.map(mode => {
      const definition = MODE_DEFINITIONS[mode] || {
        value: mode,
        label: formatCategoryLabel(mode.replace(/-/g, ' ')),
        description: ''
      };
      return {
        value: definition.value,
        text: definition.label,
        description: definition.description
      };
    });
  }, [dataSourceMeta]);

  // Smart filter configuration based on data source/metric
  const getAvailableFilters = useMemo(() => {
    if (!newWidget.metric) return {};
    return {
      aggregation: (dataSourceMeta?.supportedAggregations || []).length > 0,
      sites: dataSourceMeta?.requiresSiteFilter ?? true,
      dateRange: true,
      vehicleTypes: dataSourceMeta?.requiresVehicleFilter ?? false
    };
  }, [newWidget.metric, dataSourceMeta]);

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
        setNewWidget(prev => {
          if (prev.metric !== metricId) return prev;
          return mergeWithMetadataDefaults(prev, {}, metadata);
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
        setValidationState({
          isValid: result?.isValid !== false,
          errors: result?.errors || result?.validationErrors || [],
          suggestions: result?.suggestions || [],
          normalizedConfig: result?.normalizedConfig || null
        });
      })
      .catch(() => {
        setValidationState({ isValid: true, errors: [], suggestions: [], normalizedConfig: null });
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

  return (
    <div className="tw-space-y-6">
      {/* Template vs Custom Selection - Hide once something is selected */}
      {!newWidget.templateId && !(isCustomWidget && newWidget.category && newWidget.visualizationType) && (
        <div className="tw-space-y-4">
          <h3 className="tw-text-lg tw-font-medium tw-text-gray-900 tw-border-b tw-border-gray-200 tw-pb-2">
            Choose Widget Creation Method
          </h3>

          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
            {/* Use Template Option */}
            <div className={`tw-border-2 tw-rounded-lg tw-p-4 tw-cursor-pointer tw-transition-all ${!isCustomWidget ? 'tw-border-blue-500 tw-bg-blue-50' : 'tw-border-gray-200 hover:tw-border-gray-300'}`}
                 onClick={() => setIsCustomWidget(false)}>
              <div className="tw-flex tw-items-start tw-space-x-3">
                <div className="tw-flex-shrink-0">
                  <div className={`tw-w-4 tw-h-4 tw-rounded-full tw-border-2 tw-flex tw-items-center tw-justify-center ${!isCustomWidget ? 'tw-border-blue-500 tw-bg-blue-500' : 'tw-border-gray-300'}`}>
                    {!isCustomWidget && <div className="tw-w-2 tw-h-2 tw-bg-white tw-rounded-full"></div>}
                  </div>
                </div>
                <div>
                  <h4 className="tw-font-medium tw-text-gray-900">Use Template</h4>
                  <p className="tw-text-sm tw-text-gray-600">Start with a pre-built widget template</p>
                </div>
              </div>
            </div>

            {/* Custom Widget Option */}
            <div className={`tw-border-2 tw-rounded-lg tw-p-4 tw-cursor-pointer tw-transition-all ${isCustomWidget ? 'tw-border-blue-500 tw-bg-blue-50' : 'tw-border-gray-200 hover:tw-border-gray-300'}`}
                 onClick={handleCreateCustom}>
              <div className="tw-flex tw-items-start tw-space-x-3">
                <div className="tw-flex-shrink-0">
                  <div className={`tw-w-4 tw-h-4 tw-rounded-full tw-border-2 tw-flex tw-items-center tw-justify-center ${isCustomWidget ? 'tw-border-blue-500 tw-bg-blue-500' : 'tw-border-gray-300'}`}>
                    {isCustomWidget && <div className="tw-w-2 tw-h-2 tw-bg-white tw-rounded-full"></div>}
                  </div>
                </div>
                <div>
                  <h4 className="tw-font-medium tw-text-gray-900">Create Custom</h4>
                  <p className="tw-text-sm tw-text-gray-600">Build your own custom widget</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template Selection (when using template) */}
      {!isCustomWidget && (
        <div className="tw-space-y-4">
          <h4 className="tw-text-md tw-font-medium tw-text-gray-900">Select Template</h4>
          {templatesLoading && <LoadIndicator width={16} height={16} />}
          {templatesError && <div className="tw-text-xs tw-text-red-500">{templatesError}</div>}

          {!templatesLoading && !templatesError && (
            <div className="tw-space-y-2">
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
                Widget Template <span className="tw-text-red-500">*</span>
              </label>
              <SelectBox
                items={Array.isArray(widgetTemplates) ? widgetTemplates : []}
                value={newWidget.templateId}
                displayExpr="displayName"
                valueExpr="id"
                width="100%"
                maxWidth="400px"
                placeholder="Choose a widget template"
                searchEnabled={true}
                className="tw-border-gray-300 focus:tw-border-blue-500"
                onValueChanged={(e) => handleTemplateSelect(e.value)}
              />
            </div>
          )}
        </div>
      )}

      {/* Custom Widget Configuration (when creating custom) */}
      {isCustomWidget && (
        <div className="tw-space-y-4">
          {/* Category Selection */}
          <div className="tw-space-y-2">
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
              Category <span className="tw-text-red-500">*</span>
            </label>
            <SelectBox
              items={categoryOptions}
              value={newWidget.category}
              displayExpr="label"
              valueExpr="id"
              width="100%"
              maxWidth="400px"
              placeholder="Choose widget category"
              searchEnabled={true}
              className="tw-border-gray-300 focus:tw-border-blue-500"
              onValueChanged={(e) => setNewWidget(prev => ({
                ...prev,
                category: e.value,
                visualizationType: '' // Reset widget type when category changes
              }))}
            />
          </div>

          {/* Widget Type Selection */}
          {newWidget.category && (
            <div className="tw-space-y-2">
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
                Widget Type <span className="tw-text-red-500">*</span>
              </label>
              <SelectBox
                items={availableWidgetTypes}
                value={newWidget.visualizationType}
                displayExpr="label"
                valueExpr="id"
                width="100%"
                maxWidth="400px"
                placeholder="Choose widget type"
                searchEnabled={true}
                className="tw-border-gray-300 focus:tw-border-blue-500"
                onValueChanged={(e) => setNewWidget(prev => ({
                  ...prev,
                  visualizationType: e.value
                }))}
              />
            </div>
          )}

          {/* Custom Widget Name */}
          {newWidget.category && newWidget.visualizationType && (
            <div className="tw-space-y-2">
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
                Widget Name <span className="tw-text-red-500">*</span>
              </label>
              <TextBox
                value={newWidget.customName}
                placeholder="Enter custom widget name..."
                width="100%"
                maxWidth="400px"
                onValueChanged={(e) => setNewWidget(prev => ({ ...prev, customName: e.value }))}
                className="tw-border-gray-300 focus:tw-border-blue-500"
              />
            </div>
          )}
        </div>
      )}

      {/* Data Source Selection */}
      {(newWidget.templateId || (isCustomWidget && newWidget.visualizationType)) &&
       (newWidget.category === 'key_statistics' ||
        newWidget.category === 'performance_metrics' ||
        newWidget.category === 'fuel_management' ||
        newWidget.category === 'vehicle_performance' ||
        newWidget.category === 'alerts_monitoring') && (
        <div className="tw-space-y-4">
          <div className="tw-space-y-2">
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
              Data Source {newWidget.category === 'fuel_management' ? <span className="tw-text-red-500">*</span> : ''}
            </label>

            {/* Data Source SelectBox */}
            {dsLoading && <LoadIndicator width={16} height={16} />}
            {dsError && <div className="tw-text-xs tw-text-red-500">{dsError}</div>}
            {!dsLoading && !dsError && (
              <SelectBox
                items={availableDataSources}
                value={newWidget.metric}
                displayExpr="label"
                valueExpr="id"
                width="100%"
                maxWidth="300px"
                placeholder="Choose the data source for this widget"
                className="tw-border-gray-300 focus:tw-border-blue-500"
                onValueChanged={(e) => {
                  setNewWidget(prev => ({ ...prev, metric: e.value }));
                }}
              />
            )}

            <div className="tw-text-xs tw-text-gray-500">
              Select the primary data source that this widget will display
            </div>
          </div>

          {/* Widget Type Specific Required Fields */}
          {newWidget.visualizationType === 'BIG_STAT_CARD' && (
            <div className="tw-space-y-4">
              <div className="tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-md tw-p-3">
                <div className="tw-text-sm tw-font-medium tw-text-blue-900 tw-mb-2">
                  <i className="fa-solid fa-info-circle tw-mr-2"></i>
                  Big Statistics Card Configuration
                </div>
                <div className="tw-text-xs tw-text-blue-800">
                  This widget type requires additional configuration for display format.
                </div>
              </div>

              <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-4">
                {/* Default Value */}
                <div className="tw-space-y-2">
                  <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
                    Default Value <span className="tw-text-red-500">*</span>
                  </label>
                  <TextBox
                    value={newWidget.defaultValue || '0'}
                    placeholder="Enter default display value..."
                    width="100%"
                    onValueChanged={(e) => setNewWidget(prev => ({
                      ...prev,
                      defaultValue: e.value,
                      settings: {
                        ...prev.settings,
                        value: e.value
                      }
                    }))}
                    className="tw-border-gray-300 focus:tw-border-blue-500"
                  />
                  <div className="tw-text-xs tw-text-gray-500">
                    This will be overridden when real data is loaded
                  </div>
                </div>

                {/* Unit */}
                <div className="tw-space-y-2">
                  <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
                    Unit <span className="tw-text-red-500">*</span>
                  </label>
                  <SelectBox
                    items={getUnitOptionsForMetric}
                    value={newWidget.unit || getDefaultUnitForMetric}
                    displayExpr="text"
                    valueExpr="value"
                    width="100%"
                    placeholder="Select unit of measurement"
                    className="tw-border-gray-300 focus:tw-border-blue-500"
                    onValueChanged={(e) => setNewWidget(prev => ({
                      ...prev,
                      unit: e.value,
                      settings: {
                        ...prev.settings,
                        unit: e.value
                      }
                    }))}
                  />
                  <div className="tw-text-xs tw-text-gray-500">
                    Unit of measurement for the displayed values
                    {newWidget.metric && (
                      <span className="tw-block tw-text-blue-600 tw-mt-1">
                        <i className="fa-light fa-info-circle tw-mr-1"></i>
                        Smart units for "{newWidget.metric}" metric
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Smart Data Filters Section */}
      {(newWidget.templateId || (isCustomWidget && newWidget.visualizationType)) && newWidget.metric && (
        <div className="tw-space-y-4">
          <h4 className="tw-text-sm tw-font-medium tw-text-gray-900 tw-border-b tw-border-gray-200 tw-pb-2">
            Data Filters
            <span className="tw-text-xs tw-text-gray-500 tw-font-normal tw-ml-2">
              (Contextual filters based on data source)
            </span>
          </h4>

          {/* Aggregation Filter */}
          {getAvailableFilters.aggregation && (
            <div className="tw-space-y-2">
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
                Aggregation Method
              </label>
              <SelectBox
                items={(dataSourceMeta?.supportedAggregations || ['SUM','COUNT','AVG']).map(a => ({ value: a, text: a }))}
                value={newWidget.aggregation || 'SUM'}
                displayExpr="text"
                valueExpr="value"
                width="100%"
                maxWidth="300px"
                placeholder="Select aggregation method"
                className="tw-border-gray-300 focus:tw-border-blue-500"
                onValueChanged={(e) => {
                  setNewWidget(prev => ({ ...prev, aggregation: e.value }));
                }}
              />
              <div className="tw-text-xs tw-text-gray-500">
                Choose how the data should be aggregated for display
              </div>
            </div>
          )}

          {/* Group By */}
          {newWidget.visualizationType && ['CHART_BAR_COMPARISON','CHART_PIE_DISTRIBUTION','DATA_TABLE_DETAILED','PROGRESS_LIST'].includes(newWidget.visualizationType) && (
            <div className="tw-space-y-2">
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">Group By</label>
              <SelectBox
                items={(dataSourceMeta?.supportedGroupBy || ['none','site','vehicleType']).map(g => ({ value: g, text: g }))}
                value={newWidget.groupBy || 'none'}
                displayExpr="text"
                valueExpr="value"
                width="100%"
                maxWidth="300px"
                placeholder="Select grouping"
                className="tw-border-gray-300 focus:tw-border-blue-500"
                onValueChanged={(e) => setNewWidget(prev => ({ ...prev, groupBy: e.value }))}
              />
              <div className="tw-text-xs tw-text-gray-500">Choose categorical grouping for comparisons</div>
            </div>
          )}

          {/* Granularity */}
          {newWidget.visualizationType && ['CHART_LINE_TREND','BIG_STAT_CARD'].includes(newWidget.visualizationType) && (
            <div className="tw-space-y-2">
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">Granularity</label>
              <SelectBox
                items={(dataSourceMeta?.supportedGranularities || dataSourceMeta?.supportedGranularity || ['minute','hour','day','week']).map(g => ({ value: g, text: g }))}
                value={newWidget.granularity || (newWidget.mode === 'live' ? 'minute' : 'day')}
                displayExpr="text"
                valueExpr="value"
                width="100%"
                maxWidth="300px"
                placeholder="Select time bucket size"
                className="tw-border-gray-300 focus:tw-border-blue-500"
                onValueChanged={(e) => setNewWidget(prev => ({ ...prev, granularity: e.value }))}
              />
              <div className="tw-text-xs tw-text-gray-500">Server buckets data by this interval for time-series</div>
            </div>
          )}

          {/* Vehicle Type Filter - Multi-select, only for vehicle-related data */}
          {getAvailableFilters.vehicleTypes && (
            <div className="tw-space-y-2">
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
                Vehicle Types
                <span className="tw-text-xs tw-text-gray-500 tw-font-normal">(Multi-select)</span>
              </label>
              {vehicleTypesLoading && (
                <div className="tw-text-xs tw-text-gray-500">Loading vehicle types...</div>
              )}
              {vehicleTypesError && (
                <div className="tw-text-xs tw-text-red-500">{vehicleTypesError}</div>
              )}
              <TagBox
                dataSource={vehicleTypeOptions}
                value={newWidget.vehicleTypeIds || []}
                displayExpr="text"
                valueExpr="value"
                placeholder="Select vehicle types (leave empty for all)"
                showSelectionControls={true}
                applyValueMode="useButtons"
                searchEnabled={true}
                className="tw-border-gray-300 focus:tw-border-blue-500"
                disabled={vehicleTypesLoading}
                onValueChanged={(e) => {
                  setNewWidget(prev => ({ ...prev, vehicleTypeIds: e.value }));
                }}
              />
              <div className="tw-text-xs tw-text-gray-500">
                Leave empty to include all vehicle types
              </div>
            </div>
          )}

          {/* Include Total */}
          {newWidget.visualizationType && ['CHART_BAR_COMPARISON','CHART_PIE_DISTRIBUTION','DATA_TABLE_DETAILED'].includes(newWidget.visualizationType) && (
            <div className="tw-flex tw-items-center tw-gap-2">
              <input
                id="include-total"
                type="checkbox"
                className="tw-form-checkbox"
                checked={!!newWidget.includeTotal}
                onChange={(e) => setNewWidget(prev => ({ ...prev, includeTotal: e.target.checked }))}
              />
              <label htmlFor="include-total" className="tw-text-sm tw-text-gray-700">Include Total</label>
            </div>
          )}

          {/* Top K */}
          {newWidget.visualizationType && ['PROGRESS_LIST','CHART_BAR_COMPARISON','DATA_TABLE_DETAILED'].includes(newWidget.visualizationType) && (
            <div className="tw-space-y-2">
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">Top K</label>
              <SelectBox
                items={[5,10,15,20].map(n => ({ value: n, text: `${n}` }))}
                value={newWidget.topK || 10}
                displayExpr="text"
                valueExpr="value"
                width="120px"
                className="tw-border-gray-300 focus:tw-border-blue-500"
                onValueChanged={(e) => setNewWidget(prev => ({ ...prev, topK: e.value }))}
              />
            </div>
          )}

          {/* Filter Information Panel - Only show if filters are applied */}
          {(newWidget.aggregation || (newWidget.vehicleTypeIds && newWidget.vehicleTypeIds.length > 0)) && (
            <div className="tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-md tw-p-3">
              <div className="tw-text-sm tw-font-medium tw-text-blue-900 tw-mb-2">
                <i className="fa-solid fa-info-circle tw-mr-2"></i>
                Applied Filters
              </div>
              <div className="tw-text-xs tw-text-blue-800 tw-space-y-1">
                {getAvailableFilters.aggregation && newWidget.aggregation && (
                  <div>• Aggregation: <strong>{newWidget.aggregation}</strong></div>
                )}
                {getAvailableFilters.vehicleTypes && newWidget.vehicleTypeIds && newWidget.vehicleTypeIds.length > 0 && (
                  <div>• Vehicle Types: <strong>{newWidget.vehicleTypeIds.length} selected</strong></div>
                )}
                {(!getAvailableFilters.aggregation && !getAvailableFilters.vehicleTypes) && (
                  <div className="tw-text-green-700">• This data source uses default filtering (sites and date range only)</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Configuration Section */}
      {(newWidget.templateId || (isCustomWidget && newWidget.visualizationType)) && (
        <div className="tw-space-y-4">
          <h4 className="tw-text-sm tw-font-medium tw-text-gray-900 tw-border-b tw-border-gray-200 tw-pb-2">
            Widget Configuration
          </h4>

          {/* Data Mode */}
          <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-4">
            <div className="tw-space-y-2">
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">Data Mode</label>
              <SelectBox
                items={modeOptions}
                value={newWidget.mode}
                displayExpr="text"
                valueExpr="value"
                width="100%"
                className="tw-border-gray-300 focus:tw-border-blue-500"
                onValueChanged={(e) => setNewWidget(prev => (
                  mergeWithMetadataDefaults(prev, { mode: e.value })
                ))}
              />
            </div>

            <div className="tw-space-y-2">
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">Site Selection</label>
              <SelectBox
                items={[
                  { value: 'all', text: 'All Sites' },
                  { value: 'custom', text: 'Specific Sites' }
                ]}
                value={newWidget.sitesMode}
                displayExpr="text"
                valueExpr="value"
                width="100%"
                className="tw-border-gray-300 focus:tw-border-blue-500"
                onValueChanged={(e) => setNewWidget(prev => ({
                  ...prev,
                  sitesMode: e.value,
                  siteIds: e.value === 'all' ? [] : prev.siteIds
                }))}
              />
            </div>
          </div>

          {/* Site Selection Tags */}
          {newWidget.sitesMode === 'custom' && (
            <div className="tw-space-y-2">
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">Selected Sites</label>
              {sitesLoading && <LoadIndicator width={16} height={16} />}
              {sitesError && <div className="tw-text-xs tw-text-red-500">{sitesError}</div>}
              {!sitesLoading && !sitesError && (
                <TagBox
                  dataSource={sites}
                  value={newWidget.siteIds}
                  valueExpr="id"
                  displayExpr="name"
                  width="100%"
                  maxWidth="500px"
                  showSelectionControls
                  applyValueMode="instantly"
                  className="tw-border-gray-300 focus:tw-border-blue-500"
                  onValueChanged={(e) => setNewWidget(prev => ({ ...prev, siteIds: e.value }))}
                />
              )}
            </div>
          )}

          {/* Date Range */}
          <div className="tw-space-y-2">
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">Date Range</label>
            <div className="tw-flex tw-flex-wrap tw-gap-2">
              {(newWidget.mode === 'live' ? liveDatePresets : cumulativeDatePresets).map(p => (
                <Button
                  key={p.id}
                  text={p.label}
                  type={newWidget.datePreset === p.id ? 'default' : 'normal'}
                  stylingMode={newWidget.datePreset === p.id ? 'contained' : 'outlined'}
                  height={28}
                  onClick={() => setNewWidget(prev => ({ ...prev, datePreset: p.id }))}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Data Preview Section */}
      {(newWidget.templateId || (isCustomWidget && newWidget.visualizationType)) && (
        <div className="tw-space-y-4">
          <h4 className="tw-text-sm tw-font-medium tw-text-gray-900 tw-border-b tw-border-gray-200 tw-pb-2">
            Data Preview
          </h4>

          <div className="tw-bg-gray-50 tw-border tw-border-gray-200 tw-rounded-md tw-p-4">
            {!validationState.isValid && (
              <div className="tw-bg-yellow-50 tw-border tw-border-yellow-200 tw-text-yellow-800 tw-p-2 tw-rounded-md tw-text-xs tw-mb-3">
                <div className="tw-flex tw-items-start tw-justify-between tw-gap-2">
                  <div>
                    Some configuration options aren’t supported; please adjust.
                    {validationState.errors?.length > 0 && (
                      <ul className="tw-mt-2 tw-list-disc tw-list-inside">
                        {validationState.errors.slice(0,3).map((err, idx) => (
                          <li key={idx}>{err.message}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {validationState.suggestions?.length > 0 && (
                    <Button
                      text="Apply suggested fixes"
                      type="default"
                      stylingMode="contained"
                      height={26}
                      onClick={() => {
                        const norm = validationState.normalizedConfig || {};
                        const s = norm.settings || {};
                        setNewWidget(prev => ({
                          ...prev,
                          mode: s.mode ?? prev.mode,
                          datePreset: s.datePreset ?? prev.datePreset,
                          aggregation: s.aggregation ?? prev.aggregation,
                          granularity: s.granularity ?? prev.granularity,
                          includeTotal: s.includeTotal ?? prev.includeTotal,
                          topK: s.topK ?? prev.topK,
                          unit: s.unit ?? prev.unit,
                          settings: {
                            ...(prev.settings || {}),
                            ...s
                          }
                        }));
                      }}
                    />
                  )}
                </div>
              </div>
            )}
            <div className="tw-flex tw-items-center tw-gap-3 tw-mb-3">
              <Button
                text="Test Configuration"
                icon="fa-solid fa-refresh"
                type="normal"
                stylingMode="outlined"
                height={32}
                  onClick={() => onPreviewData && onPreviewData(getWidgetConfig())}
                disabled={previewLoading || (!newWidget.templateId && !(isCustomWidget && newWidget.visualizationType))}
              />
              {previewLoading && <LoadIndicator width={16} height={16} />}
            </div>

            {previewError && (
              <div className="tw-bg-red-50 tw-border tw-border-red-200 tw-text-red-700 tw-p-3 tw-rounded-md tw-text-sm">
                <i className="fa-solid fa-exclamation-triangle tw-mr-2"></i>
                {previewError}
              </div>
            )}

            {previewData && (
              <div className="tw-bg-white tw-border tw-border-gray-200 tw-p-3 tw-rounded-md">
                <div className="tw-text-xs tw-font-medium tw-text-gray-600 tw-mb-2">Test Result</div>
                <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-x-4 tw-gap-y-2 tw-text-sm">
                  <div className="tw-flex tw-justify-between">
                    <span className="tw-text-gray-600">Metric:</span>
                    <span className="tw-font-medium tw-text-gray-900">{previewData.metric}</span>
                  </div>
                  <div className="tw-flex tw-justify-between">
                    <span className="tw-text-gray-600">Status:</span>
                    <span className={`tw-font-medium ${previewData.status === 'success' ? 'tw-text-green-600' : 'tw-text-red-600'}`}>
                      {previewData.status}
                    </span>
                  </div>
                  <div className="tw-flex tw-justify-between tw-col-span-1 sm:tw-col-span-2">
                    <span className="tw-text-gray-600">Value:</span>
                    <span className="tw-font-medium tw-text-lg tw-text-blue-600">
                      {previewData.value} {previewData.unit}
                    </span>
                  </div>
                </div>
                {previewData.lastUpdated && (
                  <div className="tw-text-xs tw-text-gray-500 tw-mt-2 tw-pt-2 tw-border-t tw-border-gray-100">
                    Last updated: {new Date(previewData.lastUpdated).toLocaleString()}
                  </div>
                )}
              </div>
            )}

            {!previewData && !previewError && !previewLoading && (
              <div className="tw-text-sm tw-text-gray-500 tw-text-center tw-py-4">
                <i className="fa-solid fa-info-circle tw-mr-2 tw-text-gray-400"></i>
                {(newWidget.templateId || (isCustomWidget && newWidget.visualizationType))
                  ? 'Click "Test Configuration" to preview widget data'
                  : 'Select a widget template or configure custom widget to enable preview'
                }
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
