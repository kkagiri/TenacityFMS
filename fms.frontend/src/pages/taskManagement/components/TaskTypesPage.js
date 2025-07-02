import React, { useState } from 'react';
import { DataGrid, Column, Paging, FilterRow, HeaderFilter, Editing, Popup, Form } from 'devextreme-react/data-grid';
import { Item as FormItem, SimpleItem, RequiredRule } from 'devextreme-react/form';
import { Button } from 'devextreme-react/button';
import notify from 'devextreme/ui/notify';

const TaskTypesPage = ({ onNavigate }) => {
  const [taskTypes, setTaskTypes] = useState([
    {
      id: 1,
      name: 'Manual',
      description: 'Manually created tasks for general operations',
      color: '#6c757d',
      isActive: true,
      displayOrder: 1
    },
    {
      id: 2,
      name: 'Maintenance',
      description: 'Equipment maintenance and repair tasks',
      color: '#fd7e14',
      isActive: true,
      displayOrder: 2
    },
    {
      id: 3,
      name: 'Discrepancy',
      description: 'Tasks related to stock discrepancy investigations',
      color: '#dc3545',
      isActive: true,
      displayOrder: 3
    },
    {
      id: 4,
      name: 'Stock',
      description: 'Stock reconciliation and audit tasks',
      color: '#28a745',
      isActive: true,
      displayOrder: 4
    },
    {
      id: 5,
      name: 'Inspection',
      description: 'Regular inspection and safety check tasks',
      color: '#007bff',
      isActive: true,
      displayOrder: 5
    },
    {
      id: 6,
      name: 'Calibration',
      description: 'Equipment calibration and accuracy verification',
      color: '#6f42c1',
      isActive: true,
      displayOrder: 6
    },
    {
      id: 7,
      name: 'TransactionCorrection',
      description: 'Transaction correction and data cleanup tasks',
      color: '#20c997',
      isActive: true,
      displayOrder: 7
    }
  ]);

  const handleRowUpdated = (e) => {
    notify('Task type updated successfully', 'success', 3000);
  };

  const handleRowInserted = (e) => {
    const newId = Math.max(...taskTypes.map(t => t.id)) + 1;
    e.data.id = newId;
    setTaskTypes(prev => [...prev, e.data]);
    notify('Task type created successfully', 'success', 3000);
  };

  const handleRowRemoved = (e) => {
    notify('Task type deleted successfully', 'success', 3000);
  };

  const renderColorCell = (cellData) => (
    <div className="tw-flex tw-items-center tw-space-x-2">
      <div
        className="tw-w-4 tw-h-4 tw-rounded-full tw-border tw-border-gray-300"
        style={{ backgroundColor: cellData.value }}
      ></div>
      <span className="tw-text-sm">{cellData.value}</span>
    </div>
  );

  const renderStatusCell = (cellData) => (
    <span className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${
      cellData.value
        ? 'tw-bg-green-100 tw-text-green-800'
        : 'tw-bg-red-100 tw-text-red-800'
    }`}>
      {cellData.value ? 'Active' : 'Inactive'}
    </span>
  );

  return (
    <div className="tw-p-6">
      <div className="tw-mb-6">
        <div className="tw-flex tw-items-center tw-justify-between">
          <div>
            <h2 className="tw-text-2xl tw-font-bold tw-text-gray-900">Task Types</h2>
            <p className="tw-text-sm tw-text-gray-600 tw-mt-1">
              Manage task types and their configurations
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
            <i className="fa-light fa-list tw-mr-2 tw-text-blue-600"></i>
            Task Type Configuration
          </h3>
          <p className="tw-text-sm tw-text-gray-600 tw-mt-1">
            Configure available task types, their appearance, and behavior
          </p>
        </div>

        <div className="tw-p-4">
          <DataGrid
            dataSource={taskTypes}
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
              <Popup title="Task Type Details" showTitle={true} width={500} height={400} />
              <Form>
                <SimpleItem dataField="name" isRequired={true}>
                  <RequiredRule message="Task type name is required" />
                </SimpleItem>
                <SimpleItem dataField="description" editorType="dxTextArea" />
                <SimpleItem dataField="color" />
                <SimpleItem dataField="displayOrder" dataType="number" />
                <SimpleItem dataField="isActive" dataType="boolean" />
              </Form>
            </Editing>

            <Column dataField="displayOrder" caption="Order" dataType="number" width={80} />
            <Column dataField="name" caption="Name" />
            <Column dataField="description" caption="Description" />
            <Column
              dataField="color"
              caption="Color"
              cellRender={renderColorCell}
              width={120}
            />
            <Column
              dataField="isActive"
              caption="Status"
              dataType="boolean"
              cellRender={renderStatusCell}
              width={100}
            />

            <Paging defaultPageSize={10} />
            <FilterRow visible={true} />
            <HeaderFilter visible={true} />
          </DataGrid>
        </div>
      </div>

      <div className="tw-mt-6 tw-p-4 tw-bg-blue-50 tw-rounded-lg tw-border tw-border-blue-200">
        <h4 className="tw-text-sm tw-font-semibold tw-text-blue-900 tw-mb-2">
          <i className="fa-light fa-info-circle tw-mr-1"></i>
          Task Type Guidelines
        </h4>
        <div className="tw-text-xs tw-text-blue-700 tw-space-y-1">
          <p>• Task types define the category and behavior of tasks in the system</p>
          <p>• Colors are used in the UI to visually distinguish task types</p>
          <p>• Display order controls the sequence in dropdown menus</p>
          <p>• Inactive task types are hidden from new task creation but existing tasks remain</p>
        </div>
      </div>
    </div>
  );
};

export default TaskTypesPage;
