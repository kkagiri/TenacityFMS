import React, { useState, useMemo } from 'react';
import Popup from 'devextreme-react/popup';
import Button from 'devextreme-react/button';
import SelectBox from 'devextreme-react/select-box';
import TextBox from 'devextreme-react/text-box';

export default function CustomWidgetDialog({
  open,
  onClose,
  onComplete,
  metricOptions
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [widgetConfig, setWidgetConfig] = useState({
    category: '',
    visualizationType: '',
    customName: '',
    metric: ''
  });

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
    if (!widgetConfig.category) return [];
    return widgetTypesByCategory[widgetConfig.category] || [];
  }, [widgetConfig.category, widgetTypesByCategory]);

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

  const totalSteps = 4;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete the configuration
      onComplete(widgetConfig);
      handleClose();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setWidgetConfig({
      category: '',
      visualizationType: '',
      customName: '',
      metric: ''
    });
    onClose();
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return widgetConfig.category;
      case 2:
        return widgetConfig.visualizationType;
      case 3:
        return widgetConfig.customName.trim();
      case 4:
        // Data source is optional for some categories
        const requiresMetric = ['fuel_management', 'vehicle_performance', 'alerts_monitoring'].includes(widgetConfig.category);
        return !requiresMetric || widgetConfig.metric;
      default:
        return false;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return 'Choose Category';
      case 2:
        return 'Select Widget Type';
      case 3:
        return 'Name Your Widget';
      case 4:
        return 'Configure Data Source';
      default:
        return 'Custom Widget';
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="tw-space-y-4">
            <p className="tw-text-gray-600 tw-text-sm">
              Select the category that best describes your widget's purpose.
            </p>
            <SelectBox
              items={categoryOptions}
              value={widgetConfig.category}
              displayExpr="label"
              valueExpr="id"
              width="100%"
              placeholder="Choose widget category"
              searchEnabled={true}
              onValueChanged={(e) => setWidgetConfig(prev => ({
                ...prev,
                category: e.value,
                visualizationType: ''
              }))}
            />
            {/* Debug info */}
            {widgetConfig.category && (
              <div className="tw-text-xs tw-text-gray-500">
                Selected: {widgetConfig.category}
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="tw-space-y-4">
            <p className="tw-text-gray-600 tw-text-sm">
              Choose the visualization type for your widget.
            </p>
            {/* Debug info */}
            <div className="tw-text-xs tw-text-gray-500 tw-mb-2">
              Available types: {availableWidgetTypes.length} found for category: {widgetConfig.category}
            </div>
            <SelectBox
              items={availableWidgetTypes}
              value={widgetConfig.visualizationType}
              displayExpr="label"
              valueExpr="id"
              width="100%"
              placeholder="Choose widget type"
              searchEnabled={true}
              onValueChanged={(e) => setWidgetConfig(prev => ({
                ...prev,
                visualizationType: e.value
              }))}
            />
            {/* Debug: Show first available widget type */}
            {availableWidgetTypes.length > 0 && (
              <div className="tw-text-xs tw-text-gray-500">
                Example widget: {availableWidgetTypes[0]?.label} (ID: {availableWidgetTypes[0]?.id})
              </div>
            )}
            {availableWidgetTypes.length === 0 && (
              <div className="tw-text-red-500 tw-text-sm">
                No widget types available for this category. Please select a different category.
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="tw-space-y-4">
            <p className="tw-text-gray-600 tw-text-sm">
              Give your custom widget a descriptive name.
            </p>
            <TextBox
              value={widgetConfig.customName}
              placeholder="Enter widget name..."
              width="100%"
              onValueChanged={(e) => setWidgetConfig(prev => ({
                ...prev,
                customName: e.value
              }))}
            />
          </div>
        );

      case 4:
        const requiresMetric = ['fuel_management', 'vehicle_performance', 'alerts_monitoring'].includes(widgetConfig.category);
        return (
          <div className="tw-space-y-4">
            <p className="tw-text-gray-600 tw-text-sm">
              {requiresMetric
                ? 'Select the data source for your widget.'
                : 'Optionally select a data source for your widget.'}
            </p>
            <SelectBox
              items={metricOptions.filter(metric =>
                !widgetConfig.category ||
                metric.category === widgetConfig.category ||
                ['key_statistics', 'performance_metrics'].includes(widgetConfig.category)
              )}
              value={widgetConfig.metric}
              displayExpr="label"
              valueExpr="id"
              width="100%"
              placeholder={requiresMetric ? "Choose data source *" : "Choose data source (optional)"}
              searchEnabled={true}
              onValueChanged={(e) => setWidgetConfig(prev => ({
                ...prev,
                metric: e.value
              }))}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Popup
      visible={open}
      onHiding={handleClose}
      title="Create Custom Widget"
      width={500}
      height={400}
      showCloseButton={true}
      dragEnabled={true}
      className="custom-widget-dialog"
    >
      <div className="tw-p-6 tw-h-full tw-flex tw-flex-col">
        {/* Progress Indicator */}
        <div className="tw-mb-6">
          <div className="tw-flex tw-justify-between tw-items-center tw-mb-2">
            <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900">
              {getStepTitle()}
            </h3>
            <span className="tw-text-sm tw-text-gray-500">
              Step {currentStep} of {totalSteps}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="tw-w-full tw-bg-gray-200 tw-rounded-full tw-h-2">
            <div
              className="tw-bg-blue-500 tw-h-2 tw-rounded-full tw-transition-all tw-duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="tw-flex-1">
          {renderStepContent()}
        </div>

        {/* Actions */}
        <div className="tw-flex tw-justify-between tw-pt-6 tw-border-t tw-border-gray-200">
          <Button
            text="Back"
            type="normal"
            stylingMode="outlined"
            disabled={currentStep === 1}
            onClick={handleBack}
          />

          <div className="tw-flex tw-gap-2">
            <Button
              text="Cancel"
              type="normal"
              stylingMode="text"
              onClick={handleClose}
            />
            <Button
              text={currentStep === totalSteps ? "Create Widget" : "Next"}
              type="default"
              disabled={!isStepValid()}
              onClick={handleNext}
            />
          </div>
        </div>
      </div>
    </Popup>
  );
}
