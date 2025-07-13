import React, { useState, useEffect } from 'react';
import { DataGrid, Column } from 'devextreme-react/data-grid';
import { Button } from 'devextreme-react/button';
import { Popup } from 'devextreme-react/popup';
import { ScrollView } from 'devextreme-react/scroll-view';
import { Form, SimpleItem, GroupItem } from 'devextreme-react/form';
import { TextArea } from 'devextreme-react/text-area';
import { SelectBox } from 'devextreme-react/select-box';
import { TagBox } from 'devextreme-react/tag-box';
import notify from 'devextreme/ui/notify';

// Mock data for templates
// eslint-disable-next-line no-unused-vars
const mockTemplates = [
  {
    id: 1,
    name: 'Low Fuel Alert',
    type: 'email',
    category: 'alerts',
    subject: 'Low Fuel Level Alert - {{tankName}}',
    body: 'Dear {{recipientName}},\n\nThis is to notify you that the fuel level in tank {{tankName}} has dropped to {{currentLevel}}%, which is below the minimum threshold of {{threshold}}%.\n\nPlease take immediate action to refuel.\n\nBest regards,\nFMS System',
    variables: ['recipientName', 'tankName', 'currentLevel', 'threshold'],
    isActive: true,
    createdAt: '2024-01-15',
    lastModified: '2024-01-20',
    usageCount: 45
  },
  {
    id: 2,
    name: 'High Temperature Warning',
    type: 'email',
    category: 'warnings',
    subject: 'Temperature Alert - {{tankName}}',
    body: 'Alert: Tank {{tankName}} temperature has reached {{temperature}}°C, exceeding the safe limit of {{maxTemperature}}°C.\n\nImmediate attention required.',
    variables: ['tankName', 'temperature', 'maxTemperature'],
    isActive: true,
    createdAt: '2024-01-10',
    lastModified: '2024-01-18',
    usageCount: 23
  },
  {
    id: 3,
    name: 'Maintenance Reminder',
    type: 'email',
    category: 'maintenance',
    subject: 'Scheduled Maintenance - {{equipmentName}}',
    body: 'Dear {{recipientName}},\n\nThis is a reminder that {{equipmentName}} is due for maintenance on {{maintenanceDate}}.\n\nPlease schedule the maintenance accordingly.',
    variables: ['recipientName', 'equipmentName', 'maintenanceDate'],
    isActive: false,
    createdAt: '2024-01-05',
    lastModified: '2024-01-15',
    usageCount: 12
  }
];

const TemplateManagement = () => {
  const [templates, setTemplates] = useState([]);
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showPreviewPopup, setShowPreviewPopup] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

  // Mock data for templates
  const mockTemplates = [
    {
      id: 1,
      name: 'Low Fuel Alert',
      type: 'email',
      category: 'alerts',
      subject: 'Low Fuel Level Alert - {{tankName}}',
      body: 'Dear {{recipientName}},\n\nThis is to notify you that the fuel level in tank {{tankName}} has dropped to {{currentLevel}}%, which is below the minimum threshold of {{threshold}}%.\n\nPlease take immediate action to refuel.\n\nBest regards,\nFMS System',
      variables: ['recipientName', 'tankName', 'currentLevel', 'threshold'],
      isActive: true,
      createdAt: '2024-01-15',
      lastModified: '2024-01-20',
      usageCount: 45
    },
    {
      id: 2,
      name: 'High Temperature Warning',
      type: 'email',
      category: 'warnings',
      subject: 'Temperature Alert - {{tankName}}',
      body: 'Alert: Tank {{tankName}} temperature has reached {{temperature}}°C, exceeding the safe limit of {{maxTemperature}}°C.\n\nImmediate attention required.',
      variables: ['tankName', 'temperature', 'maxTemperature'],
      isActive: true,
      createdAt: '2024-01-10',
      lastModified: '2024-01-18',
      usageCount: 23
    },
    {
      id: 3,
      name: 'Maintenance Reminder',
      type: 'email',
      category: 'maintenance',
      subject: 'Scheduled Maintenance - {{equipmentName}}',
      body: 'Dear {{recipientName}},\n\nThis is a reminder that {{equipmentName}} is due for maintenance on {{maintenanceDate}}.\n\nPlease schedule the maintenance accordingly.',
      variables: ['recipientName', 'equipmentName', 'maintenanceDate'],
      isActive: false,
      createdAt: '2024-01-05',
      lastModified: '2024-01-15',
      usageCount: 12
    }
  ];

  const templateTypes = [
    { value: 'email', text: 'Email' },
    { value: 'sms', text: 'SMS' },
    { value: 'push', text: 'Push Notification' }
  ];

  const templateCategories = [
    { value: 'alerts', text: 'Alerts' },
    { value: 'warnings', text: 'Warnings' },
    { value: 'maintenance', text: 'Maintenance' },
    { value: 'reports', text: 'Reports' },
    { value: 'notifications', text: 'General Notifications' }
  ];

  const availableVariables = [
    'recipientName', 'tankName', 'currentLevel', 'threshold', 'temperature',
    'maxTemperature', 'equipmentName', 'maintenanceDate', 'siteName',
    'alertTime', 'pressure', 'volume', 'fuelType'
  ];

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        setTemplates(mockTemplates);
        setLoading(false);
      }, 500);
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = () => {
    setFormData({
      name: '',
      type: 'email',
      category: 'alerts',
      subject: '',
      body: '',
      variables: [],
      isActive: true
    });
    setShowCreatePopup(true);
  };

  const handleEdit = (template) => {
    setSelectedTemplate(template);
    setFormData({ ...template });
    setShowEditPopup(true);
  };

  const handlePreview = (template) => {
    setSelectedTemplate(template);
    setShowPreviewPopup(true);
  };

  const handleSave = async () => {
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      if (selectedTemplate) {
        // Update existing template
        setTemplates(prev => prev.map(t =>
          t.id === selectedTemplate.id ? { ...formData, id: selectedTemplate.id } : t
        ));
        notify('Template updated successfully!', 'success', 3000);
        setShowEditPopup(false);
      } else {
        // Create new template
        const newTemplate = {
          ...formData,
          id: Math.max(...templates.map(t => t.id)) + 1,
          createdAt: new Date().toISOString().split('T')[0],
          lastModified: new Date().toISOString().split('T')[0],
          usageCount: 0
        };
        setTemplates(prev => [...prev, newTemplate]);
        notify('Template created successfully!', 'success', 3000);
        setShowCreatePopup(false);
      }
      setLoading(false);
      setSelectedTemplate(null);
      setFormData({});
    }, 1000);
  };

  const handleDelete = async (template) => {
    if (window.confirm(`Are you sure you want to delete template "${template.name}"?`)) {
      setLoading(true);

      // Simulate API call
      setTimeout(() => {
        setTemplates(prev => prev.filter(t => t.id !== template.id));
        notify('Template deleted successfully!', 'success', 3000);
        setLoading(false);
      }, 500);
    }
  };

  const handleToggleStatus = async (template) => {
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setTemplates(prev => prev.map(t =>
        t.id === template.id ? { ...t, isActive: !t.isActive } : t
      ));
      notify(`Template ${template.isActive ? 'deactivated' : 'activated'} successfully!`, 'success', 3000);
      setLoading(false);
    }, 500);
  };

  const renderActionButtons = (data) => {
    return (
      <div className="tw-flex tw-space-x-2">
        <Button
          icon="fa-solid fa-eye"
          hint="Preview"
          onClick={() => handlePreview(data.data)}
          type="normal"
          stylingMode="text"
        />
        <Button
          icon="fa-solid fa-edit"
          hint="Edit"
          onClick={() => handleEdit(data.data)}
          type="normal"
          stylingMode="text"
        />
        <Button
          icon={data.data.isActive ? "fa-solid fa-pause" : "fa-solid fa-play"}
          hint={data.data.isActive ? "Deactivate" : "Activate"}
          onClick={() => handleToggleStatus(data.data)}
          type="normal"
          stylingMode="text"
        />
        <Button
          icon="fa-solid fa-trash"
          hint="Delete"
          onClick={() => handleDelete(data.data)}
          type="normal"
          stylingMode="text"
        />
      </div>
    );
  };

  const renderStatus = (data) => {
    return (
      <span className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${
        data.value ? 'tw-bg-green-100 tw-text-green-800' : 'tw-bg-red-100 tw-text-red-800'
      }`}>
        {data.value ? 'Active' : 'Inactive'}
      </span>
    );
  };

  const renderType = (data) => {
    const icons = {
      email: 'fa-solid fa-envelope',
      sms: 'fa-solid fa-sms',
      push: 'fa-solid fa-bell'
    };

    return (
      <span className="tw-flex tw-items-center">
        <i className={`${icons[data.value]} tw-mr-2`}></i>
        {data.value.toUpperCase()}
      </span>
    );
  };

  const insertVariable = (variable) => {
    const currentBody = formData.body || '';
    const variableTag = `{{${variable}}}`;
    setFormData(prev => ({
      ...prev,
      body: currentBody + (currentBody ? ' ' : '') + variableTag
    }));
  };

  return (
    <div className="form-container">
      <div className="form-content">
        <div className="tw-p-6 notification-form">
          <div className="tw-bg-white tw-rounded-lg tw-shadow-md">
        {/* Header */}
        <div className="tw-p-6 tw-border-b tw-border-gray-200">
          <div className="tw-flex tw-justify-between tw-items-center">
            <div>
              <h2 className="tw-text-2xl tw-font-bold tw-text-gray-800">
                <i className="fa-solid fa-file-alt tw-mr-2 tw-text-blue-600"></i>
                Template Management
              </h2>
              <p className="tw-text-gray-600 tw-mt-1">
                Manage notification templates for emails, SMS, and push notifications
              </p>
            </div>
            <Button
              text="Create Template"
              icon="fa-solid fa-plus"
              type="default"
              onClick={handleCreate}
            />
          </div>
        </div>

        {/* Templates Grid */}
        <div className="tw-p-6">
          <DataGrid
            dataSource={templates}
            showBorders={true}
            showRowLines={true}
            showColumnLines={false}
            rowAlternationEnabled={true}
            columnAutoWidth={true}
            loadPanel={{ enabled: loading }}
          >
            <Column dataField="name" caption="Template Name" />
            <Column dataField="type" caption="Type" cellRender={renderType} width={120} />
            <Column dataField="category" caption="Category" />
            <Column dataField="subject" caption="Subject" />
            <Column dataField="usageCount" caption="Usage" width={80} />
            <Column dataField="isActive" caption="Status" cellRender={renderStatus} width={100} />
            <Column dataField="lastModified" caption="Last Modified" dataType="date" width={120} />
            <Column caption="Actions" cellRender={renderActionButtons} width={200} allowSorting={false} />
          </DataGrid>
        </div>
      </div>

      {/* Create Template Popup */}
      <Popup
        visible={showCreatePopup}
        onHiding={() => setShowCreatePopup(false)}
        dragEnabled={false}
        title="Create New Template"
        width={800}
        height={600}
        showCloseButton={true}
        contentRender={() => (
          <div className="tw-h-full tw-flex tw-flex-col">
            <ScrollView
              className="tw-flex-1"
              showScrollbar="onScroll"
              bounceEnabled={false}
            >
              <div className="tw-p-4">
                <Form formData={formData} onFieldDataChanged={(e) => setFormData(prev => ({ ...prev, [e.dataField]: e.value }))}>
                  <GroupItem caption="Basic Information">
                    <SimpleItem dataField="name" isRequired={true} label={{ text: "Template Name" }} />
                    <SimpleItem dataField="type" isRequired={true} label={{ text: "Type" }}>
                      <SelectBox dataSource={templateTypes} valueExpr="value" displayExpr="text" />
                    </SimpleItem>
                    <SimpleItem dataField="category" isRequired={true} label={{ text: "Category" }}>
                      <SelectBox dataSource={templateCategories} valueExpr="value" displayExpr="text" />
                    </SimpleItem>
                  </GroupItem>

                  <GroupItem caption="Content">
                    <SimpleItem dataField="subject" isRequired={true} label={{ text: "Subject" }} />
                    <SimpleItem dataField="body" isRequired={true} label={{ text: "Message Body" }}>
                      <TextArea height={200} />
                    </SimpleItem>
                    <SimpleItem dataField="variables" label={{ text: "Variables" }}>
                      <TagBox dataSource={availableVariables} />
                    </SimpleItem>
                  </GroupItem>
                </Form>

                <div className="tw-mt-4 tw-border-t tw-pt-4">
                  <h4 className="tw-font-semibold tw-mb-2">Available Variables:</h4>
                  <div className="tw-flex tw-flex-wrap tw-gap-2">
                    {availableVariables.map(variable => (
                      <button
                        key={variable}
                        className="tw-px-2 tw-py-1 tw-bg-blue-100 tw-text-blue-800 tw-rounded tw-text-sm hover:tw-bg-blue-200"
                        onClick={() => insertVariable(variable)}
                      >
                        {variable}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollView>

            <div className="tw-border-t tw-p-4 tw-bg-gray-50">
              <div className="tw-flex tw-justify-end tw-space-x-3">
                <Button
                  text="Cancel"
                  onClick={() => setShowCreatePopup(false)}
                />
                <Button
                  text="Create Template"
                  type="default"
                  onClick={handleSave}
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        )}
      />

      {/* Edit Template Popup */}
      <Popup
        visible={showEditPopup}
        onHiding={() => setShowEditPopup(false)}
        dragEnabled={false}
        title="Edit Template"
        width={800}
        height={600}
        showCloseButton={true}
        contentRender={() => (
          <div className="tw-h-full tw-flex tw-flex-col">
            <ScrollView
              className="tw-flex-1"
              showScrollbar="onScroll"
              bounceEnabled={false}
            >
              <div className="tw-p-4">
                <Form formData={formData} onFieldDataChanged={(e) => setFormData(prev => ({ ...prev, [e.dataField]: e.value }))}>
                  <GroupItem caption="Basic Information">
                    <SimpleItem dataField="name" isRequired={true} label={{ text: "Template Name" }} />
                    <SimpleItem dataField="type" isRequired={true} label={{ text: "Type" }}>
                      <SelectBox dataSource={templateTypes} valueExpr="value" displayExpr="text" />
                    </SimpleItem>
                    <SimpleItem dataField="category" isRequired={true} label={{ text: "Category" }}>
                      <SelectBox dataSource={templateCategories} valueExpr="value" displayExpr="text" />
                    </SimpleItem>
                  </GroupItem>

                  <GroupItem caption="Content">
                    <SimpleItem dataField="subject" isRequired={true} label={{ text: "Subject" }} />
                    <SimpleItem dataField="body" isRequired={true} label={{ text: "Message Body" }}>
                      <TextArea height={200} />
                    </SimpleItem>
                    <SimpleItem dataField="variables" label={{ text: "Variables" }}>
                      <TagBox dataSource={availableVariables} />
                    </SimpleItem>
                  </GroupItem>
                </Form>

                <div className="tw-mt-4 tw-border-t tw-pt-4">
                  <h4 className="tw-font-semibold tw-mb-2">Available Variables:</h4>
                  <div className="tw-flex tw-flex-wrap tw-gap-2">
                    {availableVariables.map(variable => (
                      <button
                        key={variable}
                        className="tw-px-2 tw-py-1 tw-bg-blue-100 tw-text-blue-800 tw-rounded tw-text-sm hover:tw-bg-blue-200"
                        onClick={() => insertVariable(variable)}
                      >
                        {variable}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollView>

            <div className="tw-border-t tw-p-4 tw-bg-gray-50">
              <div className="tw-flex tw-justify-end tw-space-x-3">
                <Button
                  text="Cancel"
                  onClick={() => setShowEditPopup(false)}
                />
                <Button
                  text="Update Template"
                  type="default"
                  onClick={handleSave}
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        )}
      />

      {/* Preview Template Popup */}
      <Popup
        visible={showPreviewPopup}
        onHiding={() => setShowPreviewPopup(false)}
        dragEnabled={false}
        title="Template Preview"
        width={600}
        height={400}
        showCloseButton={true}
        contentRender={() => (
          selectedTemplate && (
            <ScrollView
              showScrollbar="onScroll"
              bounceEnabled={false}
              className="tw-h-full"
            >
              <div className="tw-p-4">
                <div className="tw-bg-gray-50 tw-p-4 tw-rounded-lg tw-mb-4">
                  <h3 className="tw-font-semibold tw-text-lg tw-mb-2">{selectedTemplate.name}</h3>
                  <div className="tw-flex tw-items-center tw-space-x-4 tw-text-sm tw-text-gray-600">
                    <span><i className="fa-light fa-tag tw-mr-1"></i>{selectedTemplate.category}</span>
                    <span><i className="fa-light fa-envelope tw-mr-1"></i>{selectedTemplate.type}</span>
                    <span className={`tw-px-2 tw-py-1 tw-rounded tw-text-xs ${
                      selectedTemplate.isActive ? 'tw-bg-green-100 tw-text-green-800' : 'tw-bg-red-100 tw-text-red-800'
                    }`}>
                      {selectedTemplate.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="tw-space-y-4">
                  <div>
                    <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">Subject:</label>
                    <div className="tw-bg-white tw-border tw-p-3 tw-rounded">{selectedTemplate.subject}</div>
                  </div>

                  <div>
                    <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">Message Body:</label>
                    <div className="tw-bg-white tw-border tw-p-3 tw-rounded tw-whitespace-pre-wrap">{selectedTemplate.body}</div>
                  </div>

                  {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
                    <div>
                      <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">Variables Used:</label>
                      <div className="tw-flex tw-flex-wrap tw-gap-2">
                        {selectedTemplate.variables.map(variable => (
                          <span key={variable} className="tw-px-2 tw-py-1 tw-bg-blue-100 tw-text-blue-800 tw-rounded tw-text-sm">
                            {variable}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="tw-flex tw-justify-end tw-mt-6">
                  <Button
                    text="Close"
                    onClick={() => setShowPreviewPopup(false)}
                  />
                </div>
              </div>
            </ScrollView>
          )
        )}
      />
        </div>
      </div>
    </div>
  );
};

export default TemplateManagement;
