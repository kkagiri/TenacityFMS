import React, { useState } from 'react';
import { DataGrid, Column, Paging, FilterRow, HeaderFilter, Editing, Popup, Form } from 'devextreme-react/data-grid';
import { SimpleItem, RequiredRule } from 'devextreme-react/form';
import { Button } from 'devextreme-react/button';
import notify from 'devextreme/ui/notify';

const TaskTemplatesPage = ({ onNavigate }) => {
  const [templates, setTemplates] = useState([
    {
      id: 1,
      name: 'Daily Tank Inspection',
      description: 'Standard daily tank level and condition inspection checklist',
      taskType: 'Inspection',
      titleTemplate: 'Daily Inspection - Tank {tankName} - {siteName}',
      descriptionTemplate: 'Perform daily inspection of tank levels, gauges, and visual condition check. Record any anomalies or maintenance requirements.',
      defaultPriority: 'Medium',
      estimatedDuration: 30,
      isActive: true,
      createdOn: '2024-01-15T00:00:00Z'
    },
    {
      id: 2,
      name: 'Pump Maintenance',
      description: 'Standard pump maintenance and service template',
      taskType: 'Maintenance',
      titleTemplate: 'Pump Maintenance - {pumpId} - {siteName}',
      descriptionTemplate: 'Perform routine maintenance on pump including filter check, electrical connections, flow rate verification, and general condition assessment.',
      defaultPriority: 'High',
      estimatedDuration: 120,
      isActive: true,
      createdOn: '2024-01-15T00:00:00Z'
    },
    {
      id: 3,
      name: 'Monthly Reconciliation',
      description: 'Monthly stock reconciliation process template',
      taskType: 'Stock',
      titleTemplate: 'Monthly Stock Reconciliation - {month} {year}',
      descriptionTemplate: 'Perform monthly stock reconciliation comparing physical measurements with system records. Document variances and investigate discrepancies.',
      defaultPriority: 'High',
      estimatedDuration: 180,
      isActive: true,
      createdOn: '2024-01-15T00:00:00Z'
    },
    {
      id: 4,
      name: 'Discrepancy Investigation',
      description: 'Stock discrepancy investigation template',
      taskType: 'Discrepancy',
      titleTemplate: 'Investigate Discrepancy - Tank {tankName}',
      descriptionTemplate: 'Investigate stock discrepancy in tank {tankName}. Variance: {variance}L. Check for leaks, theft, measurement errors, or system issues.',
      defaultPriority: 'Critical',
      estimatedDuration: 90,
      isActive: true,
      createdOn: '2024-01-15T00:00:00Z'
    },
    {
      id: 5,
      name: 'Gauge Calibration',
      description: 'Tank gauge calibration procedure template',
      taskType: 'Calibration',
      titleTemplate: 'Calibrate Tank Gauge - {tankName}',
      descriptionTemplate: 'Calibrate tank gauge to ensure accurate readings. Verify against known measurements and adjust as necessary. Update calibration records.',
      defaultPriority: 'Medium',
      estimatedDuration: 60,
      isActive: true,
      createdOn: '2024-01-15T00:00:00Z'
    }
  ]);

  const handleRowUpdated = (e) => {
    notify('Template updated successfully', 'success', 3000);
  };

  const handleRowInserted = (e) => {
    const newId = Math.max(...templates.map(t => t.id)) + 1;
    e.data.id = newId;
    e.data.createdOn = new Date().toISOString();
    setTemplates(prev => [...prev, e.data]);
    notify('Template created successfully', 'success', 3000);
  };

  const handleRowRemoved = (e) => {
    notify('Template deleted successfully', 'success', 3000);
  };

  const renderPriorityCell = (cellData) => {
    const priorityColors = {
      'Low': 'tw-bg-green-100 tw-text-green-800',
      'Medium': 'tw-bg-yellow-100 tw-text-yellow-800',
      'High': 'tw-bg-orange-100 tw-text-orange-800',
      'Critical': 'tw-bg-red-100 tw-text-red-800'
    };

    return (
      <span className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${priorityColors[cellData.value] || 'tw-bg-gray-100 tw-text-gray-800'}`}>
        {cellData.value}
      </span>
    );
  };

  const renderStatusCell = (cellData) => (
    <span className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${
      cellData.value
        ? 'tw-bg-green-100 tw-text-green-800'
        : 'tw-bg-red-100 tw-text-red-800'
    }`}>
      {cellData.value ? 'Active' : 'Inactive'}
    </span>
  );

  const renderDurationCell = (cellData) => (
    <span className="tw-text-sm tw-text-gray-700">
      {cellData.value} min
    </span>
  );

  return (
    <div className="tw-p-6">
      <div className="tw-mb-6">
        <div className="tw-flex tw-items-center tw-justify-between">
          <div>
            <h2 className="tw-text-2xl tw-font-bold tw-text-gray-900">Task Templates</h2>
            <p className="tw-text-sm tw-text-gray-600 tw-mt-1">
              Manage task templates for quick task creation
            </p>
          </div>
          <Button
            icon="fa-light fa-arrow-left"
            text="Back to Dashboard"
            type="default"
            stylingMode="outlined"
            onClick={() => onNavigate && onNavigate('dashboard')}
          />
        </div>
      </div>

      <div className="tw-bg-white tw-rounded-lg tw-shadow tw-border tw-border-gray-200">
        <div className="tw-p-4 tw-border-b tw-border-gray-200">
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900">
            <i className="fa-light fa-file-text tw-mr-2 tw-text-blue-600"></i>
            Task Template Configuration
          </h3>
          <p className="tw-text-sm tw-text-gray-600 tw-mt-1">
            Create and manage reusable task templates for common operations
          </p>
        </div>

        <div className="tw-p-4">
          <DataGrid
            dataSource={templates}
            keyExpr="id"
            showBorders={true}
            columnAutoWidth={true}
            rowAlternationEnabled={true}
            onRowUpdated={handleRowUpdated}
            onRowInserted={handleRowInserted}
            onRowRemoved={handleRowRemoved}
          >
            <Editing
              mode="popup"
              allowUpdating={true}
              allowAdding={true}
              allowDeleting={true}
            >
              <Popup title="Task Template Details" showTitle={true} width={600} height={500} />
              <Form>
                <SimpleItem dataField="name" isRequired={true}>
                  <RequiredRule message="Template name is required" />
                </SimpleItem>
                <SimpleItem dataField="description" editorType="dxTextArea" />
                <SimpleItem dataField="taskType" editorType="dxSelectBox"
                  editorOptions={{
                    items: ['Manual', 'Maintenance', 'Discrepancy', 'Stock', 'Inspection', 'Calibration', 'TransactionCorrection'],
                    searchEnabled: true
                  }}
                />
                <SimpleItem dataField="titleTemplate" />
                <SimpleItem dataField="descriptionTemplate" editorType="dxTextArea" />
                <SimpleItem dataField="defaultPriority" editorType="dxSelectBox"
                  editorOptions={{
                    items: ['Low', 'Medium', 'High', 'Critical']
                  }}
                />
                <SimpleItem dataField="estimatedDuration" dataType="number"
                  editorOptions={{
                    min: 1,
                    max: 480
                  }}
                />
                <SimpleItem dataField="isActive" dataType="boolean" />
              </Form>
            </Editing>

            <Column dataField="name" caption="Template Name" />
            <Column dataField="taskType" caption="Task Type" width={120} />
            <Column
              dataField="defaultPriority"
              caption="Priority"
              cellRender={renderPriorityCell}
              width={100}
            />
            <Column
              dataField="estimatedDuration"
              caption="Duration"
              cellRender={renderDurationCell}
              width={100}
            />
            <Column
              dataField="isActive"
              caption="Status"
              dataType="boolean"
              cellRender={renderStatusCell}
              width={100}
            />
            <Column dataField="createdOn" caption="Created" dataType="date" width={120} />

            <Paging defaultPageSize={10} />
            <FilterRow visible={true} />
            <HeaderFilter visible={true} />
          </DataGrid>
        </div>
      </div>

      <div className="tw-mt-6 tw-p-4 tw-bg-blue-50 tw-rounded-lg tw-border tw-border-blue-200">
        <h4 className="tw-text-sm tw-font-semibold tw-text-blue-900 tw-mb-2">
          <i className="fa-light fa-info-circle tw-mr-1"></i>
          Template Guidelines
        </h4>
        <div className="tw-text-xs tw-text-blue-700 tw-space-y-1">
          <p>• Use placeholder variables like {`{tankName}, {siteName}, {pumpId}`} in title and description templates</p>
          <p>• Estimated duration helps with planning and scheduling</p>
          <p>• Templates speed up task creation by providing pre-filled content</p>
          <p>• Inactive templates are hidden from task creation but existing tasks remain</p>
        </div>
      </div>
    </div>
  );
};

export default TaskTemplatesPage;
