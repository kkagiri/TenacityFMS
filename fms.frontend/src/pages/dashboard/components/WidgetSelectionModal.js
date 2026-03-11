/**
 * WidgetSelectionModal - Modal for selecting and configuring new widgets
 *
 * Allows users to browse available widget templates, configure settings,
 * and add new widgets to their dashboard.
 */

import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Popup } from 'devextreme-react/popup';
import { ScrollView } from 'devextreme-react/scroll-view';
import { Button } from 'devextreme-react/button';
import { TextBox } from 'devextreme-react/text-box';
import { SelectBox } from 'devextreme-react/select-box';
import notify from 'devextreme/ui/notify';
import serviceFactory from '../../../services/core/ServiceFactory';

// Available widget templates
const WIDGET_TEMPLATES = [
  {
    id: 'quickActions',
    name: 'Quick Actions',
    description: 'Commonly used action buttons with role-based access',
    icon: 'fa-bolt',
    category: 'Navigation',
    defaultSize: { w: 4, h: 3 },
    configurable: false
  },
  {
    id: 'stats',
    name: 'Key Statistics',
    description: 'Important metrics and KPIs with real-time updates',
    icon: 'fa-chart-line',
    category: 'Analytics',
    defaultSize: { w: 4, h: 3 },
    configurable: true
  },
  {
    id: 'systemModules',
    name: 'System Modules',
    description: 'Quick access to system modules and features',
    icon: 'fa-th-large',
    category: 'Navigation',
    defaultSize: { w: 4, h: 3 },
    configurable: false
  },
  {
    id: 'alarms',
    name: 'Active Alarms',
    description: 'Real-time display of system alarms and alerts',
    icon: 'fa-exclamation-triangle',
    category: 'Monitoring',
    defaultSize: { w: 6, h: 4 },
    configurable: true
  },
  {
    id: 'performance',
    name: 'Performance Metrics',
    description: 'System performance indicators and health status',
    icon: 'fa-tachometer-alt',
    category: 'Analytics',
    defaultSize: { w: 6, h: 4 },
    configurable: true
  },
  {
    id: 'fuelManagement',
    name: 'Fuel Management',
    description: 'Fuel levels, consumption, and management overview',
    icon: 'fa-gas-pump',
    category: 'Operations',
    defaultSize: { w: 8, h: 5 },
    configurable: true
  },
  {
    id: 'tankStatus',
    name: 'Tank Status',
    description: 'Tank levels, capacity, and status monitoring',
    icon: 'fa-oil-can',
    category: 'Operations',
    defaultSize: { w: 4, h: 5 },
    configurable: true
  },
  {
    id: 'vehicleTracking',
    name: 'Vehicle Tracking',
    description: 'Real-time vehicle locations and status',
    icon: 'fa-car',
    category: 'Operations',
    defaultSize: { w: 8, h: 6 },
    configurable: true
  },
  {
    id: 'weather',
    name: 'Weather Information',
    description: 'Current weather conditions and forecasts',
    icon: 'fa-cloud-sun',
    category: 'Information',
    defaultSize: { w: 3, h: 3 },
    configurable: true
  },
  {
    id: 'notes',
    name: 'Notes & Reminders',
    description: 'Personal notes and reminder system',
    icon: 'fa-sticky-note',
    category: 'Productivity',
    defaultSize: { w: 4, h: 4 },
    configurable: true
  }
];

const WIDGET_CATEGORIES = [
  { value: 'all', text: 'All Categories' },
  { value: 'Navigation', text: 'Navigation' },
  { value: 'Analytics', text: 'Analytics' },
  { value: 'Monitoring', text: 'Monitoring' },
  { value: 'Operations', text: 'Operations' },
  { value: 'Information', text: 'Information' },
  { value: 'Productivity', text: 'Productivity' }
];

/**
 * WidgetSelectionModal Component
 */
const WidgetSelectionModal = ({
  visible,
  onSubmit,
  onCancel,
  currentWidgets,
  availableTemplates
}) => {
  // Local state
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [widgetName, setWidgetName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [widgetConfig, setWidgetConfig] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverTemplates, setServerTemplates] = useState([]);

  // Load available templates from server
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const widgetService = serviceFactory.getWidgetService();
        const response = await widgetService.getWidgetTemplates();

        if (response.success && response.data) {
          // Map server templates to frontend format
          const mappedTemplates = (Array.isArray(response.data) ? response.data : []).map(template => ({
            id: template.id || template.Id,
            name: template.displayName || template.DisplayName || template.name || template.Name,
            description: template.description || template.Description || '',
            icon: getCategoryIcon(template.category || template.Category),
            category: mapCategoryToUICategory(template.category || template.Category),
            dataSource: template.dataSource || template.DataSource,
            widgetType: template.widgetType || template.WidgetType,
            defaultSize: { w: 4, h: 3 },
            configurable: true,
            configurationJson: template.configurationJson || template.ConfigurationJson,
            isServerTemplate: true
          }));
          setServerTemplates(mappedTemplates);
        }
      } catch (error) {
        console.error('Error loading widget templates:', error);
      }
    };

    if (visible) {
      loadTemplates();
    }
  }, [visible]);

  // Helper to map backend category to UI category
  const mapCategoryToUICategory = (category) => {
    const categoryMap = {
      'admin': 'Admin',
      'fuel_management': 'Operations',
      'vehicle_performance': 'Analytics',
      'alerts_monitoring': 'Monitoring',
      'key_statistics': 'Analytics',
      'performance_metrics': 'Analytics',
      'system_status': 'Monitoring',
      'reporting': 'Analytics',
      'configuration': 'Navigation'
    };
    return categoryMap[category] || category || 'Operations';
  };

  // Helper to get icon based on category
  const getCategoryIcon = (category) => {
    const iconMap = {
      'admin': 'fa-user-shield',
      'fuel_management': 'fa-gas-pump',
      'vehicle_performance': 'fa-car',
      'alerts_monitoring': 'fa-exclamation-triangle',
      'key_statistics': 'fa-chart-line',
      'performance_metrics': 'fa-tachometer-alt',
      'system_status': 'fa-server',
      'reporting': 'fa-file-alt',
      'configuration': 'fa-cog'
    };
    return iconMap[category] || 'fa-cube';
  };

  // Combine local and server templates
  const allTemplates = useMemo(() => {
    const combined = [...WIDGET_TEMPLATES];

    // Add server templates that aren't already in local templates
    serverTemplates.forEach(serverTemplate => {
      if (!combined.find(t => t.id === serverTemplate.id)) {
        combined.push(serverTemplate);
      }
    });

    return combined;
  }, [serverTemplates]);

  // Filter templates based on search and category
  const filteredTemplates = useMemo(() => {
    let filtered = allTemplates;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query)
      );
    }

    // Filter out already added widgets (optional)
    // filtered = filtered.filter(template =>
    //   !currentWidgets.some(widget => widget.templateId === template.id)
    // );

    return filtered;
  }, [allTemplates, selectedCategory, searchQuery]);

  // Handle template selection
  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setWidgetName(template.name);
    setWidgetConfig({
      width: template.defaultSize.w,
      height: template.defaultSize.h,
      settings: {}
    });
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedTemplate) {
      notify('Please select a widget template', 'warning', 3000);
      return;
    }

    if (!widgetName.trim()) {
      notify('Please enter a widget name', 'warning', 3000);
      return;
    }

    setIsLoading(true);

    try {
      const widgetData = {
        templateId: selectedTemplate.id,
        name: widgetName.trim(),
        customName: widgetName.trim(),
        category: selectedTemplate.category,
        width: widgetConfig.width,
        height: widgetConfig.height,
        enabled: true,
        settings: widgetConfig.settings || {},
        filters: {},
        positionX: 0,
        positionY: 0
      };

      await onSubmit(widgetData);
    } catch (error) {
      console.error('Error submitting widget:', error);
      notify('Failed to add widget', 'error', 3000);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setSelectedTemplate(null);
    setWidgetName('');
    setSelectedCategory('all');
    setSearchQuery('');
    setWidgetConfig({});
    onCancel();
  };

  // Render template card
  const renderTemplateCard = (template) => (
    <div
      key={template.id}
      onClick={() => handleTemplateSelect(template)}
      className={`
        template-card tw-p-4 tw-border tw-rounded-lg tw-cursor-pointer tw-transition-all
        ${selectedTemplate?.id === template.id
          ? 'tw-border-blue-500 tw-bg-blue-50'
          : 'tw-border-gray-200 hover:tw-border-gray-300 hover:tw-shadow-md'
        }
      `}
    >
      <div className="tw-flex tw-items-start tw-space-x-3">
        <div className={`
          tw-flex-shrink-0 tw-w-12 tw-h-12 tw-rounded-lg tw-flex tw-items-center tw-justify-center
          ${selectedTemplate?.id === template.id ? 'tw-bg-blue-100' : 'tw-bg-gray-100'}
        `}>
          <i className={`fa-light ${template.icon} tw-text-xl ${
            selectedTemplate?.id === template.id ? 'tw-text-blue-600' : 'tw-text-gray-600'
          }`}></i>
        </div>

        <div className="tw-flex-1 tw-min-w-0">
          <h4 className="tw-font-medium tw-text-gray-900 tw-mb-1">
            {template.name}
          </h4>
          <p className="tw-text-sm tw-text-gray-600 tw-mb-2">
            {template.description}
          </p>
          <div className="tw-flex tw-items-center tw-space-x-4 tw-text-xs tw-text-gray-500">
            <span className="tw-bg-gray-100 tw-px-2 tw-py-1 tw-rounded">
              {template.category}
            </span>
            <span>
              {template.defaultSize.w}×{template.defaultSize.h}
            </span>
            {template.configurable && (
              <span className="tw-text-green-600">
                <i className="fa-light fa-cog tw-mr-1"></i>
                Configurable
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Popup
      visible={visible}
      onHiding={handleCancel}
      dragEnabled={false}
      closeOnOutsideClick={true}
      showCloseButton={true}
      title="Add New Widget"
      width={800}
      height={600}
      className="widget-selection-modal"
    >
      <div className="tw-h-full tw-flex tw-flex-col">
        {/* Search and Filter Controls */}
        <div className="tw-p-4 tw-border-b tw-border-gray-200">
          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
            <TextBox
              placeholder="Search widgets..."
              value={searchQuery}
              onValueChanged={(e) => setSearchQuery(e.value)}
              stylingMode="outlined"
            >
              <Button name="search" location="after" stylingMode="text">
                <i className="fa-light fa-search"></i>
              </Button>
            </TextBox>

            <SelectBox
              items={WIDGET_CATEGORIES}
              value={selectedCategory}
              onValueChanged={(e) => setSelectedCategory(e.value)}
              placeholder="Filter by category"
              stylingMode="outlined"
              displayExpr="text"
              valueExpr="value"
            />
          </div>
        </div>

        {/* Template Grid */}
        <div className="tw-flex-1 tw-overflow-hidden">
          <ScrollView>
            <div className="tw-p-4">
              {filteredTemplates.length > 0 ? (
                <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
                  {filteredTemplates.map(renderTemplateCard)}
                </div>
              ) : (
                <div className="tw-text-center tw-py-8 tw-text-gray-500">
                  <i className="fa-light fa-search tw-text-3xl tw-mb-3"></i>
                  <p>No widgets found matching your criteria</p>
                </div>
              )}
            </div>
          </ScrollView>
        </div>

        {/* Configuration Panel */}
        {selectedTemplate && (
          <div className="tw-border-t tw-border-gray-200 tw-p-4 tw-bg-gray-50">
            <h5 className="tw-font-medium tw-text-gray-900 tw-mb-3">
              Widget Configuration
            </h5>

            <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-4">
              <TextBox
                label="Widget Name"
                value={widgetName}
                onValueChanged={(e) => setWidgetName(e.value)}
                stylingMode="outlined"
              />

              <TextBox
                label="Width (grid units)"
                value={widgetConfig.width}
                onValueChanged={(e) => setWidgetConfig(prev => ({ ...prev, width: parseInt(e.value) || 4 }))}
                stylingMode="outlined"
                mode="number"
              />

              <TextBox
                label="Height (grid units)"
                value={widgetConfig.height}
                onValueChanged={(e) => setWidgetConfig(prev => ({ ...prev, height: parseInt(e.value) || 3 }))}
                stylingMode="outlined"
                mode="number"
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="tw-border-t tw-border-gray-200 tw-p-4 tw-flex tw-justify-end tw-space-x-3">
          <Button
            text="Cancel"
            onClick={handleCancel}
            disabled={isLoading}
            stylingMode="outlined"
          />

          <Button
            text={isLoading ? "Adding..." : "Add Widget"}
            onClick={handleSubmit}
            disabled={!selectedTemplate || isLoading}
            type="default"
            useSubmitBehavior={true}
          >
            {isLoading && <i className="fa-light fa-spinner fa-spin tw-mr-2"></i>}
          </Button>
        </div>
      </div>
    </Popup>
  );
};

WidgetSelectionModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  currentWidgets: PropTypes.array,
  availableTemplates: PropTypes.array
};

WidgetSelectionModal.defaultProps = {
  currentWidgets: [],
  availableTemplates: []
};

export default WidgetSelectionModal;