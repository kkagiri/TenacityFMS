/**
 * File: WidgetForm.js
 * Purpose: Render the dashboard widget creation form for template-based and custom widgets.
 * Dependencies: React, DevExtreme inputs, dataSourceService, widgetFactoryService, ModeSelector
 * Last Modified: 2026-03-07
 *
 * Key Functions:
 * - handleTemplateSelect(): Applies template defaults for a one-touch widget setup flow
 * - handleCreateCustom(): Resets the form into advanced custom-widget mode
 * - mergeWithMetadataDefaults(): Normalizes widget settings using data source metadata
 */
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import SelectBox from 'devextreme-react/select-box';
import TagBox from 'devextreme-react/tag-box';
import LoadIndicator from 'devextreme-react/load-indicator';
import TextBox from 'devextreme-react/text-box';
import dataSourceService from '../../../services/dataSourceService';
import widgetFactoryService from '../../../services/widgetFactoryService';
import ModeSelector from './ModeSelector';
import './WidgetForm.scss';
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

const getWidgetDisplayStyleLabel = (widgetType = '') => {
  if (!widgetType) return '';
  return WIDGET_TYPE_DEFINITIONS[widgetType]?.label || formatCategoryLabel(widgetType.toLowerCase());
};

const SYSTEM_CATEGORY_OPTIONS = [
  { id: 'admin', label: 'Admin' },
  { id: 'fuel_management', label: 'Fuel Management' },
  { id: 'vehicle_performance', label: 'Vehicle Performance' },
  { id: 'operational_metrics', label: 'Operational Metrics' },
  { id: 'financial_analysis', label: 'Financial Analysis' },
  { id: 'alerts_monitoring', label: 'Alerts & Monitoring' },
  { id: 'custom_analytics', label: 'Custom Analytics' }
];

const CATEGORY_ALIAS_MAP = {
  key_statistics: 'operational_metrics',
  performance_metrics: 'vehicle_performance',
  system_status: 'alerts_monitoring',
  reporting: 'financial_analysis',
  configuration: 'custom_analytics',
  general: 'custom_analytics'
};

const normalizeCategoryId = (category = '') => CATEGORY_ALIAS_MAP[category] || category || 'custom_analytics';

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
  const [selectedTemplateCategory, setSelectedTemplateCategory] = useState('');

  const selectedTemplate = useMemo(() => {
    if (!newWidget.templateId) return null;
    const templatesArray = Array.isArray(widgetTemplates) ? widgetTemplates : [];
    return templatesArray.find(template => String(template.id) === String(newWidget.templateId)) || null;
  }, [newWidget.templateId, widgetTemplates]);

  const isTemplateWidget = useMemo(() => Boolean(newWidget.templateId && !isCustomWidget), [isCustomWidget, newWidget.templateId]);

  const categoryOptions = useMemo(() => {
    const rawCategories = catalog.categories?.length
      ? catalog.categories.map(({ category }) => normalizeCategoryId(category))
      : SYSTEM_CATEGORY_OPTIONS.map(({ id }) => id);

    return [...new Set(rawCategories)]
      .map(category => ({
        id: category,
        label: SYSTEM_CATEGORY_OPTIONS.find(option => option.id === category)?.label || formatCategoryLabel(category)
      }))
      .sort((left, right) => left.label.localeCompare(right.label));
  }, [catalog.categories]);

  const categoryLabelLookup = useMemo(() => categoryOptions.reduce((lookup, option) => {
    lookup[option.id] = option.label;
    return lookup;
  }, {}), [categoryOptions]);

  const dataSourceCategoryLookup = useMemo(() => {
    const items = Array.isArray(catalog.items) ? catalog.items : [];
    return items.reduce((lookup, item) => {
      if (!item?.id) {
        return lookup;
      }

      lookup[item.id] = normalizeCategoryId(item.metadata?.category || item.category || '');
      return lookup;
    }, {});
  }, [catalog.items]);

  const resolveTemplateCategory = useCallback((template) => {
    if (!template) {
      return 'custom_analytics';
    }

    return dataSourceCategoryLookup[template.dataSource]
      || normalizeCategoryId(template.category)
      || 'custom_analytics';
  }, [dataSourceCategoryLookup]);

  const templateSelectItems = useMemo(() => {
    const templatesArray = Array.isArray(widgetTemplates) ? widgetTemplates : [];
    return [...templatesArray]
      .map(template => {
        const categoryId = resolveTemplateCategory(template);
        const categoryLabel = categoryLabelLookup[categoryId] || formatCategoryLabel(categoryId);

        return {
          ...template,
          categoryId,
          categoryLabel,
          pickerLabel: `${template.displayName} · ${categoryLabel} · ${getWidgetDisplayStyleLabel(template.widgetType)}`
        };
      })
      .sort((left, right) => {
        const categoryCompare = (left.categoryLabel || '').localeCompare(right.categoryLabel || '');
        if (categoryCompare !== 0) {
          return categoryCompare;
        }

        return (left.displayName || '').localeCompare(right.displayName || '');
      });
  }, [categoryLabelLookup, resolveTemplateCategory, widgetTemplates]);

  const templateCategoryOptions = useMemo(() => {
    const availableTemplateCategories = new Set(templateSelectItems.map(template => template.categoryId));
    return categoryOptions.filter(option => availableTemplateCategories.has(option.id));
  }, [categoryOptions, templateSelectItems]);

  const filteredTemplateSelectItems = useMemo(() => {
    if (!selectedTemplateCategory) {
      return templateSelectItems;
    }

    return templateSelectItems.filter(template => template.categoryId === selectedTemplateCategory);
  }, [selectedTemplateCategory, templateSelectItems]);

  const templateBehaviorSummary = useMemo(() => {
    if (!selectedTemplate) return [];

    const items = [];
    if (newWidget.visualizationType) {
      items.push({ label: 'Display', value: getWidgetDisplayStyleLabel(newWidget.visualizationType) });
    }
    if (newWidget.metric) {
      items.push({ label: 'Data', value: formatCategoryLabel(newWidget.metric) });
    }
    if (newWidget.aggregation) {
      items.push({ label: 'Aggregation', value: newWidget.aggregation });
    }
    if (newWidget.groupBy && newWidget.groupBy !== 'none') {
      items.push({ label: 'Group by', value: formatCategoryLabel(newWidget.groupBy) });
    }
    if (newWidget.granularity && ['CHART_LINE_TREND', 'ticker', 'BIG_STAT_CARD'].includes(newWidget.visualizationType)) {
      items.push({ label: 'Trend', value: formatCategoryLabel(newWidget.granularity) });
    }

    return items;
  }, [newWidget.aggregation, newWidget.granularity, newWidget.groupBy, newWidget.metric, newWidget.visualizationType, selectedTemplate]);

  const templateFriendlySummary = useMemo(() => {
    if (!selectedTemplate) return '';

    const displayStyle = getWidgetDisplayStyleLabel(newWidget.visualizationType);
    if (!displayStyle) {
      return 'This template is ready to use. Only set the name, site scope, and date range.';
    }

    return `This template is ready to use as a ${displayStyle}. You only need to set the name, site scope, and date range.`;
  }, [newWidget.visualizationType, selectedTemplate]);

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
        admin: ['BIG_STAT_CARD', 'CHART_BAR_COMPARISON', 'DATA_TABLE_DETAILED', 'PROGRESS_LIST'],
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

  const selectedWidgetTypeDefinition = useMemo(
    () => availableWidgetTypes.find(type => type.id === newWidget.visualizationType) || null,
    [availableWidgetTypes, newWidget.visualizationType]
  );

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
    const supportsVehicleType = dataSourceMeta?.requiresVehicleFilter ?? false;
    const supportsGrouping = Boolean(
      newWidget.visualizationType &&
      ['CHART_BAR_COMPARISON', 'CHART_PIE_DISTRIBUTION', 'DATA_TABLE_DETAILED', 'PROGRESS_LIST'].includes(newWidget.visualizationType) &&
      (dataSourceMeta?.supportedGroupBy?.length || 0) > 1
    );

    if (isTemplateWidget) {
      return {
        aggregation: false,
        granularity: false,
        sites: true,
        dateRange: true,
        vehicleTypes: supportsVehicleType,
        groupBy: supportsGrouping
      };
    }

    // Always show aggregation and granularity - they are fundamental configuration options
    // The SelectBox will use defaults if metadata isn't available
    return {
      aggregation: true, // Always show - use defaults if no metadata
      granularity: true, // Always show granularity option
      sites: dataSourceMeta?.requiresSiteFilter ?? true,
      dateRange: true,
      vehicleTypes: supportsVehicleType,
      groupBy: supportsGrouping
    };
  }, [dataSourceMeta, isTemplateWidget, newWidget.visualizationType]);

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
    const selectedTemplate = templateSelectItems.find(t => String(t.id) === String(templateId));
    if (selectedTemplate) {
      const config = JSON.parse(selectedTemplate.configurationJson || '{}');
      const defaultSettings = config.defaultSettings || {};
      const templateText = `${selectedTemplate.displayName || ''} ${selectedTemplate.description || ''} ${selectedTemplate.name || ''}`.toLowerCase();
      const inferredGroupBy = templateText.includes('by site')
        ? 'site'
        : templateText.includes('vehicle type')
          ? 'vehicleType'
          : (defaultSettings.groupBy || 'none');
      const inferredAggregation = templateText.includes('average') || templateText.includes('avg')
        ? 'AVG'
        : (defaultSettings.aggregation || config.aggregation || 'SUM');
      const inferredMode = templateText.includes('live')
        ? 'live'
        : (defaultSettings.mode || config.defaultMode || 'cumulative');
      const inferredDatePreset = templateText.includes('today')
        ? 'today'
        : templateText.includes('yesterday')
          ? 'yesterday'
          : templateText.includes('last week')
            ? 'last_7_days'
            : (defaultSettings.datePreset || config.defaultDatePreset || 'yesterday');
      const inferredGranularity = defaultSettings.granularity || config.defaultGranularity || (selectedTemplate.widgetType === 'CHART_LINE_TREND' ? 'day' : 'none');
      const nextSettings = {
        ...defaultSettings,
        aggregation: inferredAggregation,
        groupBy: inferredGroupBy,
        granularity: inferredGranularity,
        mode: inferredMode,
        datePreset: inferredDatePreset,
        dataSource: selectedTemplate.dataSource || defaultSettings.dataSource
      };

      setNewWidget(prev => ({
        ...prev,
        templateId: templateId,
        customName: prev.customName || selectedTemplate.displayName,
        category: selectedTemplate.categoryId,
        settings: nextSettings,
        visualizationType: selectedTemplate.widgetType,
        metric: selectedTemplate.dataSource || defaultSettings.dataSource || prev.metric,
        aggregation: inferredAggregation,
        groupBy: inferredGroupBy,
        granularity: inferredGranularity,
        mode: inferredMode,
        datePreset: inferredDatePreset
      }));

      setSelectedTemplateCategory(selectedTemplate.categoryId);
      setIsCustomWidget(false);
    }
  };

  // Handle custom widget creation
  const handleCreateCustom = () => {
    setIsCustomWidget(true);
    setNewWidget(prev => ({
      ...prev,
      templateId: null,
      category: selectedTemplateCategory || prev.category || '',
      visualizationType: '',
      customName: '',
      metric: '',
      settings: {},
      mode: 'cumulative',
      datePreset: 'yesterday'
    }));
  };

  useEffect(() => {
    if (!selectedTemplate) {
      return;
    }

    const resolvedCategory = resolveTemplateCategory(selectedTemplate);
    if (resolvedCategory !== selectedTemplateCategory) {
      setSelectedTemplateCategory(resolvedCategory);
    }
  }, [resolveTemplateCategory, selectedTemplate, selectedTemplateCategory]);

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
    <div className="widget-form-m365 tw-space-y-4">
      {/* Edit Mode Header */}
      {isEditMode && (
        <div className="widget-form-m365__section widget-form-m365__section--muted tw-space-y-4">
          <div className="widget-form-m365__section-header tw-mb-0">
            <h4 className="widget-form-m365__section-title">Editing widget</h4>
            <p className="widget-form-m365__section-copy">
              {newWidget.templateId ? 'Template-based widget' : 'Custom widget'}
            </p>
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
          <div className="widget-form-m365__intro">
            {/* Use Template Option */}
            <button
              type="button"
              className={`widget-form-m365__choice ${!isCustomWidget
                ? 'widget-form-m365__choice--active'
                : ''
                }`}
              onClick={() => {
                setIsCustomWidget(false);
                setSelectedTemplateCategory(prev => prev || normalizeCategoryId(newWidget.category || ''));
              }}
            >
              <h4 className="widget-form-m365__choice-title">Choose template</h4>
              <p className="widget-form-m365__choice-copy">
                Quick start with pre-configured widgets designed for common dashboard needs
              </p>
            </button>

            {/* Custom Widget Option */}
            <button
              type="button"
              className={`widget-form-m365__choice ${isCustomWidget
                ? 'widget-form-m365__choice--active'
                : ''
                }`}
              onClick={handleCreateCustom}
            >
              <h4 className="widget-form-m365__choice-title">Create custom</h4>
              <p className="widget-form-m365__choice-copy">
                Build a unique widget tailored to your specific requirements
              </p>
            </button>
          </div>
        </div>
      )}

      {/* Template Selection - Show in Add mode when using templates */}
      {!isEditMode && !isCustomWidget && (
        <div className="widget-form-m365__section">
          <div className="widget-form-m365__section-header">
            <label className="tw-block tw-text-sm tw-font-semibold tw-text-gray-800 tw-mb-1">
              Select Template
            </label>
            <p className="widget-form-m365__section-copy">Choose from available pre-built widgets</p>
          </div>

          {templatesLoading && (
            <div className="tw-flex tw-items-center tw-justify-center tw-py-8">
              <LoadIndicator width={24} height={24} />
            </div>
          )}

          {templatesError && (
            <div className="widget-form-m365__message">{templatesError}</div>
          )}

          {!templatesLoading && !templatesError && (
            <div className="tw-space-y-4">
              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                  Category <span className="tw-text-red-500">*</span>
                </label>
                <SelectBox
                  items={templateCategoryOptions}
                  value={selectedTemplateCategory || null}
                  displayExpr="label"
                  valueExpr="id"
                  width="100%"
                  placeholder="Select a category..."
                  searchEnabled={true}
                  searchMode="contains"
                  onValueChanged={(e) => {
                    const nextCategory = e.value || '';
                    setSelectedTemplateCategory(nextCategory);

                    const activeTemplate = templateSelectItems.find(template => String(template.id) === String(newWidget.templateId));
                    if (activeTemplate && activeTemplate.categoryId !== nextCategory) {
                      setNewWidget(prev => ({
                        ...prev,
                        templateId: null,
                        category: nextCategory,
                        visualizationType: '',
                        metric: '',
                        customName: '',
                        settings: {},
                        mode: 'cumulative',
                        datePreset: 'yesterday'
                      }));
                    }
                  }}
                />
              </div>

              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                  Template <span className="tw-text-red-500">*</span>
                </label>
                <SelectBox
                  items={filteredTemplateSelectItems}
                  value={newWidget.templateId}
                  displayExpr="pickerLabel"
                  valueExpr="id"
                  width="100%"
                  placeholder={selectedTemplateCategory ? 'Select a template...' : 'Select a category first...'}
                  searchEnabled={true}
                  searchMode="contains"
                  disabled={!selectedTemplateCategory}
                  onValueChanged={(e) => handleTemplateSelect(e.value)}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {!isEditMode && isTemplateWidget && (
        <div className="widget-form-m365__section tw-space-y-4">
          <div className="widget-form-m365__section-header">
            <h4 className="widget-form-m365__section-title">Template quick setup</h4>
            <p className="widget-form-m365__section-copy">
              {templateFriendlySummary}
            </p>
          </div>

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

      {/* Custom Widget Configuration - Show in Add mode for custom widgets OR Edit mode for custom widgets */}
      {((!isEditMode && isCustomWidget) || isEditingCustomWidget) && (
        <div className="widget-form-m365__section tw-space-y-4">
          <div className="widget-form-m365__section-header">
            <h4 className="widget-form-m365__section-title">Custom widget configuration</h4>
            <p className="widget-form-m365__section-copy">Configure your widget settings</p>
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
              onValueChanged={(e) => {
                const nextCategory = e.value;
                setSelectedTemplateCategory(nextCategory || '');
                setNewWidget(prev => ({
                  ...prev,
                  category: nextCategory,
                  visualizationType: ''
                }));
              }}
            />
          </div>

          {/* Widget Type Selection */}
          {newWidget.category && (
            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                Widget Type <span className="tw-text-red-500">*</span>
              </label>
              <select
                className="widget-form-m365__native-select"
                value={newWidget.visualizationType || ''}
                onChange={(e) => {
                  const newWidgetType = e.target.value;
                  const recommendedMode = getRecommendedMode(newWidgetType, dataSourceMeta);

                  setNewWidget(prev => mergeWithMetadataDefaults(prev, {
                    visualizationType: newWidgetType,
                    mode: recommendedMode
                  }));
                }}
              >
                <option value="">Select widget type...</option>
                {availableWidgetTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                  </option>
                ))}
              </select>

              {selectedWidgetTypeDefinition?.description && (
                <div className="widget-form-m365__field-help">
                  {selectedWidgetTypeDefinition.description}
                </div>
              )}
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
        <div className="widget-form-m365__section tw-space-y-4">
          <div className="widget-form-m365__section-header">
            <h4 className="widget-form-m365__section-title">Data source</h4>
            <p className="widget-form-m365__section-copy">Select what data this widget will display</p>
          </div>

          {/* Data Source SelectBox */}
          {isTemplateWidget && selectedTemplate ? (
            <div className="widget-form-m365__summary">
              <div className="tw-flex tw-items-start tw-justify-between tw-gap-3">
                <div>
                  <div className="widget-form-m365__summary-title">{selectedTemplate.displayName}</div>
                  <div className="widget-form-m365__summary-copy">{templateFriendlySummary}</div>
                </div>
                <span className="widget-form-m365__chip">
                  {getWidgetDisplayStyleLabel(newWidget.visualizationType) || formatCategoryLabel(newWidget.metric || '')}
                </span>
              </div>

              {templateBehaviorSummary.length > 0 && (
                <div className="widget-form-m365__chips">
                  {templateBehaviorSummary.map(item => (
                    <span key={`${item.label}-${item.value}`} className="widget-form-m365__chip">
                      <span className="tw-font-semibold tw-mr-1">{item.label}:</span>
                      <span>{item.value}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : dsLoading ? (
            <div className="tw-flex tw-items-center tw-justify-center tw-py-4">
              <LoadIndicator width={20} height={20} />
            </div>
          ) : dsError ? (
            <div className="widget-form-m365__message">{dsError}</div>
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
        <div className="widget-form-m365__section tw-space-y-4">
          <div className="widget-form-m365__section-header">
            <h4 className="widget-form-m365__section-title">Data filters</h4>
            <p className="widget-form-m365__section-copy">Configure how data is aggregated and displayed</p>
          </div>

          {/* Aggregation */}
          {getAvailableFilters.aggregation && (
            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                Aggregation
              </label>
              <SelectBox
                items={(dataSourceMeta?.supportedAggregations || ['SUM', 'COUNT', 'AVG']).map(a => ({ value: a, text: a }))}
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
          {getAvailableFilters.groupBy && (
            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                Group By
              </label>
              <SelectBox
                items={(dataSourceMeta?.supportedGroupBy || ['none', 'site', 'vehicleType']).map(g => ({
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
                items={(dataSourceMeta?.supportedGranularities || dataSourceMeta?.supportedGranularity || ['minute', 'hour', 'day', 'week']).map(g => ({ value: g, text: g.charAt(0).toUpperCase() + g.slice(1) }))}
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

      {isTemplateWidget && templateBehaviorSummary.length > 0 && (
        <div className="widget-form-m365__section widget-form-m365__section--muted tw-space-y-3">
          <div className="widget-form-m365__section-header tw-mb-0">
            <h4 className="widget-form-m365__section-title">Template behavior</h4>
            <p className="widget-form-m365__section-copy">Preset configuration from the selected template.</p>
          </div>

          <div className="widget-form-m365__grid">
            {templateBehaviorSummary.map(item => (
              <div key={`${item.label}-readonly`} className="widget-form-m365__detail-card">
                <div className="widget-form-m365__detail-label">{item.label}</div>
                <div className="widget-form-m365__detail-value">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Configuration - Mode & Sites */}
      {(isEditMode || newWidget.templateId || (isCustomWidget && newWidget.visualizationType)) && (
        <div className="widget-form-m365__section tw-space-y-4">
          <div className="widget-form-m365__section-header">
            <h4 className="widget-form-m365__section-title">Configuration</h4>
            <p className="widget-form-m365__section-copy">Data mode and site selection</p>
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
            <div className="widget-form-m365__preset-list">
              {(newWidget.mode === 'live' ? liveDatePresets : cumulativeDatePresets).map(p => (
                <button
                  key={p.id}
                  type="button"
                  className={`widget-form-m365__preset-btn ${newWidget.datePreset === p.id ? 'widget-form-m365__preset-btn--active' : ''}`}
                  onClick={() => setNewWidget(prev => ({ ...prev, datePreset: p.id }))}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
