import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { DataGrid } from 'devextreme-react/data-grid';
import { Column, Paging, FilterRow, SearchPanel, Export, Selection, LoadPanel } from 'devextreme-react/data-grid';
import { DateBox } from 'devextreme-react/date-box';
import { SelectBox } from 'devextreme-react/select-box';
import Button from 'devextreme-react/button';
import { Popup } from 'devextreme-react/popup';
import { Form } from 'devextreme-react/form';
import notify from 'devextreme/ui/notify';

// Redux actions
import { fetchVehicleMaintenanceHistory, addMaintenanceRecord } from '../../../redux/actions/vehicleActions';

const VehicleMaintenanceHistory = ({ vehicleId }) => {
  const dispatch = useDispatch();
  const [dateFrom, setDateFrom] = useState(new Date(new Date().setDate(new Date().getDate() - 90)));
  const [dateTo, setDateTo] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState('All');
  const [maintenanceData, setMaintenanceData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addFormVisible, setAddFormVisible] = useState(false);
  const [newMaintenanceRecord, setNewMaintenanceRecord] = useState({});

  const statusOptions = [
    { value: 'All', text: 'All Status' },
    { value: 'Scheduled', text: 'Scheduled' },
    { value: 'In Progress', text: 'In Progress' },
    { value: 'Completed', text: 'Completed' },
    { value: 'Cancelled', text: 'Cancelled' }
  ];

  const maintenanceTypes = [
    { value: 'Routine Service', text: 'Routine Service' },
    { value: 'Oil Change', text: 'Oil Change' },
    { value: 'Tire Replacement', text: 'Tire Replacement' },
    { value: 'Brake Service', text: 'Brake Service' },
    { value: 'Engine Repair', text: 'Engine Repair' },
    { value: 'Transmission Service', text: 'Transmission Service' },
    { value: 'Battery Replacement', text: 'Battery Replacement' },
    { value: 'Air Filter Replacement', text: 'Air Filter Replacement' },
    { value: 'Inspection', text: 'Inspection' },
    { value: 'Other', text: 'Other' }
  ];

  useEffect(() => {
    if (vehicleId) {
      loadMaintenanceHistory();
    }
  }, [vehicleId]);

  const loadMaintenanceHistory = async () => {
    try {
      setIsLoading(true);
      const response = await dispatch(fetchVehicleMaintenanceHistory({
        vehicleId,
        dateFrom: dateFrom.toISOString(),
        dateTo: dateTo.toISOString(),
        status: statusFilter === 'All' ? null : statusFilter
      }));

      if (response.success) {
        setMaintenanceData(response.data);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Error loading maintenance history:', error);
      notify(error.message || 'Failed to load maintenance history', 'error', 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMaintenance = async () => {
    try {
      const response = await dispatch(addMaintenanceRecord({
        ...newMaintenanceRecord,
        vehicleId
      }));

      if (response.success) {
        notify('Maintenance record added successfully', 'success', 3000);
        setAddFormVisible(false);
        setNewMaintenanceRecord({});
        loadMaintenanceHistory();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Error adding maintenance record:', error);
      notify(error.message || 'Failed to add maintenance record', 'error', 3000);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value || 0);
  };

  const formatDate = (value) => {
    return value ? new Date(value).toLocaleDateString() : '';
  };

  const getStatusColor = (status) => {
    const colors = {
      'Scheduled': 'tw-bg-blue-100 tw-text-blue-800',
      'In Progress': 'tw-bg-yellow-100 tw-text-yellow-800',
      'Completed': 'tw-bg-green-100 tw-text-green-800',
      'Cancelled': 'tw-bg-red-100 tw-text-red-800'
    };
    return colors[status] || 'tw-bg-gray-100 tw-text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'High': 'tw-text-red-600',
      'Medium': 'tw-text-yellow-600',
      'Low': 'tw-text-green-600'
    };
    return colors[priority] || 'tw-text-gray-600';
  };

  const formItems = [
    {
      itemType: 'group',
      caption: 'Maintenance Details',
      items: [
        {
          dataField: 'maintenanceType',
          label: { text: 'Maintenance Type' },
          editorType: 'dxSelectBox',
          editorOptions: {
            dataSource: maintenanceTypes,
            valueExpr: 'value',
            displayExpr: 'text',
            placeholder: 'Select maintenance type'
          },
          validationRules: [{ type: 'required', message: 'Maintenance type is required' }]
        },
        {
          dataField: 'description',
          label: { text: 'Description' },
          editorType: 'dxTextArea',
          editorOptions: {
            height: 100,
            placeholder: 'Enter maintenance description'
          }
        },
        {
          dataField: 'scheduledDate',
          label: { text: 'Scheduled Date' },
          editorType: 'dxDateBox',
          editorOptions: {
            displayFormat: 'dd/MM/yyyy',
            placeholder: 'Select scheduled date'
          },
          validationRules: [{ type: 'required', message: 'Scheduled date is required' }]
        },
        {
          dataField: 'priority',
          label: { text: 'Priority' },
          editorType: 'dxSelectBox',
          editorOptions: {
            dataSource: ['High', 'Medium', 'Low'],
            placeholder: 'Select priority'
          }
        },
        {
          dataField: 'estimatedCost',
          label: { text: 'Estimated Cost' },
          editorType: 'dxNumberBox',
          editorOptions: {
            format: 'currency',
            min: 0,
            placeholder: 'Enter estimated cost'
          }
        },
        {
          dataField: 'serviceProvider',
          label: { text: 'Service Provider' },
          editorOptions: {
            placeholder: 'Enter service provider name'
          }
        }
      ]
    }
  ];

  return (
    <div className="vehicle-maintenance-history">
      <div className="tw-mb-6">
        <div className="tw-flex tw-justify-between tw-items-center tw-mb-4">
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800">
            Maintenance History
          </h3>
          <Button
            text="Add Maintenance"
            icon="fa-light fa-plus"
            onClick={() => setAddFormVisible(true)}
            type="default"
            stylingMode="contained"
          />
        </div>

        {/* Filter Controls */}
        <div className="tw-flex tw-items-center tw-gap-4 tw-mb-4 tw-p-4 tw-bg-gray-50 tw-rounded-lg">
          <div className="tw-flex tw-items-center tw-gap-2">
            <label className="tw-text-sm tw-font-medium tw-text-gray-700">From:</label>
            <DateBox
              value={dateFrom}
              onValueChanged={(e) => setDateFrom(e.value)}
              displayFormat="dd/MM/yyyy"
              width={140}
            />
          </div>
          <div className="tw-flex tw-items-center tw-gap-2">
            <label className="tw-text-sm tw-font-medium tw-text-gray-700">To:</label>
            <DateBox
              value={dateTo}
              onValueChanged={(e) => setDateTo(e.value)}
              displayFormat="dd/MM/yyyy"
              width={140}
            />
          </div>
          <div className="tw-flex tw-items-center tw-gap-2">
            <label className="tw-text-sm tw-font-medium tw-text-gray-700">Status:</label>
            <SelectBox
              dataSource={statusOptions}
              value={statusFilter}
              onValueChanged={(e) => setStatusFilter(e.value)}
              valueExpr="value"
              displayExpr="text"
              width={150}
            />
          </div>
          <Button
            text="Apply Filter"
            icon="fa-light fa-filter"
            onClick={loadMaintenanceHistory}
            type="default"
            stylingMode="outlined"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Data Grid */}
      <DataGrid
        dataSource={maintenanceData}
        keyExpr="id"
        showBorders={true}
        showRowLines={true}
        showColumnLines={true}
        allowColumnReordering={true}
        allowColumnResizing={true}
        columnAutoWidth={true}
        height={500}
      >
        <LoadPanel enabled={isLoading} />

        <Column
          dataField="scheduledDate"
          caption="Scheduled Date"
          dataType="date"
          format="dd/MM/yyyy"
          width={120}
          allowSorting={true}
        />

        <Column
          dataField="maintenanceType"
          caption="Type"
          width={150}
        />

        <Column
          dataField="description"
          caption="Description"
          width={200}
        />

        <Column
          dataField="priority"
          caption="Priority"
          width={100}
          cellRender={(cellData) => (
            <span className={`tw-font-medium ${getPriorityColor(cellData.value)}`}>
              {cellData.value}
            </span>
          )}
        />

        <Column
          dataField="status"
          caption="Status"
          width={120}
          cellRender={(cellData) => (
            <span className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${getStatusColor(cellData.value)}`}>
              {cellData.value}
            </span>
          )}
        />

        <Column
          dataField="serviceProvider"
          caption="Service Provider"
          width={150}
        />

        <Column
          dataField="estimatedCost"
          caption="Estimated Cost"
          dataType="number"
          width={130}
          alignment="right"
          cellRender={(cellData) => formatCurrency(cellData.value)}
        />

        <Column
          dataField="actualCost"
          caption="Actual Cost"
          dataType="number"
          width={130}
          alignment="right"
          cellRender={(cellData) => formatCurrency(cellData.value)}
        />

        <Column
          dataField="completedDate"
          caption="Completed Date"
          dataType="date"
          format="dd/MM/yyyy"
          width={130}
        />

        <Paging enabled={true} pageSize={20} />
        <FilterRow visible={true} />
        <SearchPanel visible={true} width={240} placeholder="Search maintenance records..." />
        <Export enabled={true} fileName="vehicle-maintenance-history" />
        <Selection mode="single" />
      </DataGrid>

      {/* Summary Cards */}
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-4 tw-gap-4 tw-mt-6">
        <div className="tw-bg-blue-50 tw-p-4 tw-rounded-lg tw-border tw-border-blue-200">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-sm tw-text-blue-600 tw-font-medium">Total Records</p>
              <p className="tw-text-2xl tw-font-bold tw-text-blue-900">
                {maintenanceData.length}
              </p>
            </div>
            <i className="fa-light fa-wrench tw-text-2xl tw-text-blue-600"></i>
          </div>
        </div>

        <div className="tw-bg-yellow-50 tw-p-4 tw-rounded-lg tw-border tw-border-yellow-200">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-sm tw-text-yellow-600 tw-font-medium">Pending</p>
              <p className="tw-text-2xl tw-font-bold tw-text-yellow-900">
                {maintenanceData.filter(item => item.status === 'Scheduled' || item.status === 'In Progress').length}
              </p>
            </div>
            <i className="fa-light fa-clock tw-text-2xl tw-text-yellow-600"></i>
          </div>
        </div>

        <div className="tw-bg-green-50 tw-p-4 tw-rounded-lg tw-border tw-border-green-200">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-sm tw-text-green-600 tw-font-medium">Completed</p>
              <p className="tw-text-2xl tw-font-bold tw-text-green-900">
                {maintenanceData.filter(item => item.status === 'Completed').length}
              </p>
            </div>
            <i className="fa-light fa-check-circle tw-text-2xl tw-text-green-600"></i>
          </div>
        </div>

        <div className="tw-bg-purple-50 tw-p-4 tw-rounded-lg tw-border tw-border-purple-200">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-sm tw-text-purple-600 tw-font-medium">Total Cost</p>
              <p className="tw-text-2xl tw-font-bold tw-text-purple-900">
                {formatCurrency(maintenanceData.reduce((sum, item) => sum + (item.actualCost || item.estimatedCost || 0), 0))}
              </p>
            </div>
            <i className="fa-light fa-dollar-sign tw-text-2xl tw-text-purple-600"></i>
          </div>
        </div>
      </div>

      {/* Add Maintenance Popup */}
      <Popup
        visible={addFormVisible}
        onHiding={() => setAddFormVisible(false)}
        dragEnabled={false}
        closeOnOutsideClick={true}
        showTitle={true}
        title="Add Maintenance Record"
        width={600}
        height={500}
      >
        <div className="tw-p-4">
          <Form
            formData={newMaintenanceRecord}
            items={formItems}
            colCount={1}
            onFieldDataChanged={(e) => {
              setNewMaintenanceRecord({
                ...newMaintenanceRecord,
                [e.dataField]: e.value
              });
            }}
          />

          <div className="tw-flex tw-justify-end tw-gap-3 tw-mt-6 tw-pt-4 tw-border-t tw-border-gray-200">
            <Button
              text="Cancel"
              onClick={() => setAddFormVisible(false)}
              stylingMode="outlined"
            />
            <Button
              text="Add Record"
              icon="fa-light fa-plus"
              onClick={handleAddMaintenance}
              type="default"
              stylingMode="contained"
            />
          </div>
        </div>
      </Popup>
    </div>
  );
};

export default VehicleMaintenanceHistory;
