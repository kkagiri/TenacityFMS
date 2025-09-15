import React, { useState, useMemo } from 'react';
import SelectBox from 'devextreme-react/select-box';
import TagBox from 'devextreme-react/tag-box';
import LoadIndicator from 'devextreme-react/load-indicator';
import TextBox from 'devextreme-react/text-box';
import Button from 'devextreme-react/button';

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

  // Widget types available for each category
  const widgetTypesByCategory = useMemo(() => ({
    key_statistics: [
      { id: 'ticker', label: 'Ticker', description: 'Simple numeric display with trend' }
    ],
    fuel_management: [
      { id: 'BIG_STAT_CARD', label: 'Big Statistics Card', description: 'Large card with main value and sub-metrics' },
      { id: 'CHART_LINE_TREND', label: 'Line Chart', description: 'Time series trend chart' },
      { id: 'CHART_BAR_COMPARISON', label: 'Bar Chart', description: 'Comparative bar chart' },
      { id: 'CHART_PIE_DISTRIBUTION', label: 'Pie Chart', description: 'Distribution pie chart' },
      { id: 'DATA_TABLE_DETAILED', label: 'Data Table', description: 'Detailed data table with pagination' },
      { id: 'PROGRESS_LIST', label: 'Progress List', description: 'Progress bars with percentages' }
    ],
    vehicle_performance: [
      { id: 'BIG_STAT_CARD', label: 'Big Statistics Card', description: 'Large card with main value and sub-metrics' },
      { id: 'CHART_LINE_TREND', label: 'Line Chart', description: 'Performance trend over time' },
      { id: 'CHART_BAR_COMPARISON', label: 'Bar Chart', description: 'Vehicle comparison chart' },
      { id: 'DATA_TABLE_DETAILED', label: 'Data Table', description: 'Vehicle performance data table' },
      { id: 'PROGRESS_LIST', label: 'Progress List', description: 'Performance metrics by vehicle' }
    ],
    alerts_monitoring: [
      { id: 'ALERT_NOTIFICATION', label: 'Alert Widget', description: 'System alerts and notifications' },
      { id: 'DATA_TABLE_DETAILED', label: 'Alert Table', description: 'Detailed alert history table' },
      { id: 'BIG_STAT_CARD', label: 'Alert Summary Card', description: 'Alert count with severity breakdown' }
    ],
    performance_metrics: [
      { id: 'BIG_STAT_CARD', label: 'Metric Card', description: 'Performance metric with trend' },
      { id: 'CHART_LINE_TREND', label: 'Trend Chart', description: 'Performance trend over time' },
      { id: 'CHART_BAR_COMPARISON', label: 'Comparison Chart', description: 'Compare performance metrics' },
      { id: 'DATA_TABLE_DETAILED', label: 'Metrics Table', description: 'Detailed performance data' }
    ],
    system_status: [
      { id: 'BIG_STAT_CARD', label: 'Status Card', description: 'System status overview' },
      { id: 'ALERT_NOTIFICATION', label: 'Status Alerts', description: 'System status notifications' },
      { id: 'PROGRESS_LIST', label: 'Component Status', description: 'Individual component status' }
    ],
    reporting: [
      { id: 'DATA_TABLE_DETAILED', label: 'Report Table', description: 'Tabular report data' },
      { id: 'CHART_BAR_COMPARISON', label: 'Report Chart', description: 'Visual report charts' },
      { id: 'BIG_STAT_CARD', label: 'Report Summary', description: 'Key report metrics' }
    ],
    configuration: [
      { id: 'DATA_TABLE_DETAILED', label: 'Config Table', description: 'Configuration settings table' },
      { id: 'BIG_STAT_CARD', label: 'Config Summary', description: 'Configuration status overview' }
    ]
  }), []);

  // Get available widget types for current category
  const availableWidgetTypes = useMemo(() => {
    if (!newWidget.category) return [];
    return widgetTypesByCategory[newWidget.category] || [];
  }, [newWidget.category, widgetTypesByCategory]);

  // Category options
  const categoryOptions = [
    { id: 'fuel_management', label: 'Fuel Management' },
    { id: 'vehicle_performance', label: 'Vehicle Performance' },
    { id: 'alerts_monitoring', label: 'Alerts & Monitoring' },
    { id: 'key_statistics', label: 'Key Statistics' },
    { id: 'performance_metrics', label: 'Performance Metrics' },
    { id: 'system_status', label: 'System Status' },
    { id: 'reporting', label: 'Reporting' },
    { id: 'configuration', label: 'Configuration' }
  ];

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

  // Smart unit options based on metric type
  const getUnitOptionsForMetric = useMemo(() => {
    if (!newWidget.metric) {
      // Return all units if no metric selected
      return [
        { value: 'liters', text: 'Liters (L)', category: 'fuel' },
        { value: 'gallons', text: 'Gallons (gal)', category: 'fuel' },
        { value: 'kilometers', text: 'Kilometers (km)', category: 'distance' },
        { value: 'miles', text: 'Miles (mi)', category: 'distance' },
        { value: 'hours', text: 'Hours (hrs)', category: 'time' },
        { value: 'minutes', text: 'Minutes (min)', category: 'time' },
        { value: 'count', text: 'Count (#)', category: 'quantity' },
        { value: 'percentage', text: 'Percentage (%)', category: 'ratio' },
        { value: 'currency', text: 'Currency ($)', category: 'financial' },
        { value: 'kg', text: 'Kilograms (kg)', category: 'weight' },
        { value: 'tons', text: 'Tons (t)', category: 'weight' },
        { value: 'kmh', text: 'Kilometers/Hour (km/h)', category: 'speed' },
        { value: 'mph', text: 'Miles/Hour (mph)', category: 'speed' },
        { value: 'rpm', text: 'Revolutions/Minute (RPM)', category: 'rotation' }
      ];
    }

    const metric = newWidget.metric.toLowerCase();

    // Define unit mappings for different metric types
    const unitMappings = {
      // Fuel-related metrics
      fuel: {
        keywords: ['fuel_dispensed', 'fuel_consumed', 'fuel_cost', 'fuel_efficiency', 'consumption', 'dispensed', 'refill'],
        units: [
          { value: 'liters', text: 'Liters (L)', category: 'fuel', default: true },
          { value: 'gallons', text: 'Gallons (gal)', category: 'fuel' },
          { value: 'currency', text: 'Currency ($)', category: 'financial' }
        ]
      },

      // Distance-related metrics
      distance: {
        keywords: ['distance_traveled', 'distance_travelled', 'mileage', 'odometer', 'trip', 'route'],
        units: [
          { value: 'kilometers', text: 'Kilometers (km)', category: 'distance', default: true },
          { value: 'miles', text: 'Miles (mi)', category: 'distance' }
        ]
      },

      // Time-related metrics
      time: {
        keywords: ['engine_hours', 'runtime', 'operating_hours', 'idle_time', 'hours', 'duration'],
        units: [
          { value: 'hours', text: 'Hours (hrs)', category: 'time', default: true },
          { value: 'minutes', text: 'Minutes (min)', category: 'time' }
        ]
      },

      // Speed-related metrics
      speed: {
        keywords: ['speed_average', 'speed_max', 'velocity', 'rate'],
        units: [
          { value: 'kmh', text: 'Kilometers/Hour (km/h)', category: 'speed', default: true },
          { value: 'mph', text: 'Miles/Hour (mph)', category: 'speed' }
        ]
      },

      // Count/quantity metrics
      quantity: {
        keywords: ['transaction_count', 'trip_count', 'user_activity', 'alerts', 'count', 'number'],
        units: [
          { value: 'count', text: 'Count (#)', category: 'quantity', default: true }
        ]
      },

      // Financial metrics
      financial: {
        keywords: ['cost_analysis', 'revenue', 'total_cost', 'maintenance_cost', 'cost', 'price'],
        units: [
          { value: 'currency', text: 'Currency ($)', category: 'financial', default: true }
        ]
      },

      // Percentage/ratio metrics
      ratio: {
        keywords: ['efficiency', 'utilization', 'performance', 'ratio', 'percent'],
        units: [
          { value: 'percentage', text: 'Percentage (%)', category: 'ratio', default: true }
        ]
      },

      // Weight/volume metrics
      weight: {
        keywords: ['weight', 'mass', 'load', 'cargo'],
        units: [
          { value: 'kg', text: 'Kilograms (kg)', category: 'weight', default: true },
          { value: 'tons', text: 'Tons (t)', category: 'weight' }
        ]
      },

      // Tank/volume metrics
      volume: {
        keywords: ['tank_level', 'tank_capacity', 'tank_volume', 'volume', 'level'],
        units: [
          { value: 'liters', text: 'Liters (L)', category: 'fuel', default: true },
          { value: 'gallons', text: 'Gallons (gal)', category: 'fuel' },
          { value: 'percentage', text: 'Percentage (%)', category: 'ratio' }
        ]
      }
    };

    // Find matching unit category
    for (const [, config] of Object.entries(unitMappings)) {
      if (config.keywords.some(keyword => metric.includes(keyword))) {
        return config.units;
      }
    }

    // Default fallback units if no specific match found
    return [
      { value: 'count', text: 'Count (#)', category: 'quantity', default: true },
      { value: 'liters', text: 'Liters (L)', category: 'fuel' },
      { value: 'hours', text: 'Hours (hrs)', category: 'time' },
      { value: 'kilometers', text: 'Kilometers (km)', category: 'distance' },
      { value: 'percentage', text: 'Percentage (%)', category: 'ratio' },
      { value: 'currency', text: 'Currency ($)', category: 'financial' }
    ];
  }, [newWidget.metric]);

  // Get smart default unit based on metric
  const getDefaultUnitForMetric = useMemo(() => {
    const availableUnits = getUnitOptionsForMetric;
    const defaultUnit = availableUnits.find(unit => unit.default);
    return defaultUnit ? defaultUnit.value : availableUnits[0]?.value || 'count';
  }, [getUnitOptionsForMetric]);

  // Smart filter configuration based on data source/metric
  const getAvailableFilters = useMemo(() => {
    if (!newWidget.metric) return {};

    const metric = newWidget.metric.toLowerCase();

    // Define filter rules for different data sources
    const filterRules = {
      // Fuel-related metrics need aggregation, sites, dates, and vehicle types
      fuel_dispensed: ['aggregation', 'sites', 'dateRange', 'vehicleTypes'],
      fuel_consumed: ['aggregation', 'sites', 'dateRange', 'vehicleTypes'],
      fuel_efficiency: ['aggregation', 'sites', 'dateRange', 'vehicleTypes'],
      fuel_cost: ['aggregation', 'sites', 'dateRange', 'vehicleTypes'],

      // Tank-related metrics only need sites and dates (no vehicle types)
      tank_level: ['sites', 'dateRange'],
      tank_capacity: ['sites', 'dateRange'],
      tank_volume: ['aggregation', 'sites', 'dateRange'],
      tank_status: ['sites', 'dateRange'],

      // System alerts only need dates and maybe sites (no aggregation or vehicle types)
      system_alerts: ['sites', 'dateRange'],
      maintenance_alerts: ['sites', 'dateRange', 'vehicleTypes'],
      critical_alerts: ['sites', 'dateRange'],

      // Vehicle performance metrics - all need vehicle types
      vehicle_performance: ['aggregation', 'sites', 'dateRange', 'vehicleTypes'],
      engine_hours: ['aggregation', 'sites', 'dateRange', 'vehicleTypes'],
      engine_runtime: ['aggregation', 'sites', 'dateRange', 'vehicleTypes'],
      mileage: ['aggregation', 'sites', 'dateRange', 'vehicleTypes'],
      distance_traveled: ['aggregation', 'sites', 'dateRange', 'vehicleTypes'],
      distance_travelled: ['aggregation', 'sites', 'dateRange', 'vehicleTypes'], // Alternative spelling
      speed_average: ['aggregation', 'sites', 'dateRange', 'vehicleTypes'],
      speed_max: ['aggregation', 'sites', 'dateRange', 'vehicleTypes'],
      idle_time: ['aggregation', 'sites', 'dateRange', 'vehicleTypes'],
      operating_hours: ['aggregation', 'sites', 'dateRange', 'vehicleTypes'],
      runtime: ['aggregation', 'sites', 'dateRange', 'vehicleTypes'],

      // Financial metrics
      cost_analysis: ['aggregation', 'sites', 'dateRange', 'vehicleTypes'],
      revenue: ['aggregation', 'sites', 'dateRange'],
      total_cost: ['aggregation', 'sites', 'dateRange', 'vehicleTypes'],

      // Usage statistics
      transaction_count: ['aggregation', 'sites', 'dateRange', 'vehicleTypes'],
      user_activity: ['aggregation', 'sites', 'dateRange'],
      trip_count: ['aggregation', 'sites', 'dateRange', 'vehicleTypes'],

      // Maintenance metrics
      maintenance_cost: ['aggregation', 'sites', 'dateRange', 'vehicleTypes'],
      maintenance_frequency: ['aggregation', 'sites', 'dateRange', 'vehicleTypes']
    };    // Find exact match or partial match
    let availableFilters = filterRules[metric];

    if (!availableFilters) {
      // Try partial matching for dynamic metrics
      for (const [key, filters] of Object.entries(filterRules)) {
        if (metric.includes(key) || key.includes(metric)) {
          availableFilters = filters;
          break;
        }
      }
    }

    // Intelligent default filters if no match found
    if (!availableFilters) {
      // Check if metric is vehicle-related by pattern matching
      const vehicleRelatedPatterns = [
        'vehicle', 'engine', 'motor', 'distance', 'speed', 'trip', 'travel',
        'runtime', 'hours', 'idle', 'efficiency', 'consumption', 'maintenance',
        'service', 'odometer', 'mileage', 'driver', 'ignition', 'location'
      ];

      const isVehicleRelated = vehicleRelatedPatterns.some(pattern =>
        metric.toLowerCase().includes(pattern)
      );

      if (isVehicleRelated) {
        availableFilters = ['aggregation', 'sites', 'dateRange', 'vehicleTypes'];
      } else {
        availableFilters = ['aggregation', 'sites', 'dateRange'];
      }
    }

    return {
      aggregation: availableFilters.includes('aggregation'),
      sites: availableFilters.includes('sites'),
      dateRange: availableFilters.includes('dateRange'),
      vehicleTypes: availableFilters.includes('vehicleTypes')
    };
  }, [newWidget.metric]);

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
            {metricOptions && metricOptions.length > 0 ? (
              <SelectBox
                items={metricOptions.filter(metric =>
                  !newWidget.category ||
                  metric.category === newWidget.category ||
                  ['key_statistics', 'performance_metrics'].includes(newWidget.category)
                )}
                value={newWidget.metric}
                displayExpr="label"
                valueExpr="id"
                width="100%"
                maxWidth="300px"
                placeholder="Choose the data source for this widget"
                className="tw-border-gray-300 focus:tw-border-blue-500"
                onValueChanged={(e) => {
                  console.log('Data source changed:', e.value);
                  setNewWidget(prev => ({ ...prev, metric: e.value }));
                }}
              />
            ) : (
              <div className="tw-bg-yellow-50 tw-border tw-border-yellow-200 tw-text-yellow-700 tw-p-3 tw-rounded-md tw-text-sm">
                <i className="fa-solid fa-exclamation-triangle tw-mr-2"></i>
                No metric options available. Please ensure metric options are loaded.
              </div>
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

          {/* Aggregation Filter - Only show for numeric data sources */}
          {getAvailableFilters.aggregation && (
            <div className="tw-space-y-2">
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
                Aggregation Method
              </label>
              <SelectBox
                items={[
                  { value: 'SUM', text: 'SUM - Total sum of values' },
                  { value: 'COUNT', text: 'COUNT - Count of records' },
                  { value: 'AVG', text: 'AVG - Average of values' }
                ]}
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
                items={[{ value: 'live', text: 'Live' }, { value: 'cumulative', text: 'Cumulative' }]}
                value={newWidget.mode}
                displayExpr="text"
                valueExpr="value"
                width="100%"
                className="tw-border-gray-300 focus:tw-border-blue-500"
                onValueChanged={(e) => setNewWidget(prev => ({
                  ...prev,
                  mode: e.value,
                  datePreset: e.value === 'live' ? 'today' : 'yesterday'
                }))}
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
            <div className="tw-flex tw-items-center tw-gap-3 tw-mb-3">
              <Button
                text="Test Configuration"
                icon="fa-solid fa-refresh"
                type="normal"
                stylingMode="outlined"
                height={32}
                onClick={onPreviewData}
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
