import React, { useState, useEffect, useCallback } from 'react';
import { DataGrid } from 'devextreme-react/data-grid';
import { Column, Paging, FilterRow, SearchPanel, Export, Selection, LoadPanel } from 'devextreme-react/data-grid';
import Button from 'devextreme-react/button';
import notify from 'devextreme/ui/notify';
import { useNavigate } from 'react-router-dom';

const VehicleMaintenanceHistory = ({ vehicleId }) => {
  const navigate = useNavigate();
  const [maintenanceData, setMaintenanceData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadMaintenanceHistory = useCallback(async () => {
    if (!vehicleId) return;

    try {
      setIsLoading(true);

      // Call the real API endpoint
      const response = await fetch(`/api/v1/VehicleMaintenance?vehicleId=${vehicleId}`);

      if (response.ok) {
        const data = await response.json();

        // Process the data
        const processedData = (data || []).map(item => ({
          ...item,
          scheduledDate: item.scheduledDate ? new Date(item.scheduledDate) : null,
          completedDate: item.completedDate ? new Date(item.completedDate) : null,
          dateCreated: item.dateCreated ? new Date(item.dateCreated) : null,
        }));

        setMaintenanceData(processedData);
      } else {
        throw new Error('Failed to load maintenance history');
      }
    } catch (error) {
      console.error('Error loading maintenance history:', error);
      notify(error.message || 'Failed to load maintenance history', 'error', 3000);
      setMaintenanceData([]);
    } finally {
      setIsLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    loadMaintenanceHistory();
  }, [loadMaintenanceHistory]);

  const handleAddMaintenance = () => {
    // Navigate to maintenance list page
    navigate('/maintenance/records');
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

  const getPriorityLabel = (priority) => {
    const labels = {
      1: 'Low',
      2: 'Normal',
      3: 'Medium',
      4: 'High',
      5: 'Critical'
    };
    return labels[priority] || priority;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      1: 'tw-text-gray-600',
      2: 'tw-text-blue-600',
      3: 'tw-text-yellow-600',
      4: 'tw-text-orange-600',
      5: 'tw-text-red-600'
    };
    return colors[priority] || 'tw-text-gray-600';
  };

  return (
    <div className="vehicle-maintenance-history">
      <div className="tw-mb-6">
        <div className="tw-flex tw-flex-col md:tw-flex-row md:tw-justify-between md:tw-items-center tw-mb-4">
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-4 md:tw-mb-0">
            Maintenance History
          </h3>
          <Button
            text="Go to Maintenance"
            icon="fa-light fa-external-link"
            onClick={handleAddMaintenance}
            type="default"
            stylingMode="contained"
          />
        </div>
      </div>

      {/* Data Grid */}
      <DataGrid
        dataSource={maintenanceData}
        keyExpr="maintenanceId"
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
              {getPriorityLabel(cellData.value)}
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
          dataField="notes"
          caption="Notes"
          width={200}
        />

        <Column
          dataField="issueNote"
          caption="Issue Notes"
          width={200}
        />

        <Column
          dataField="completedDate"
          caption="Completed Date"
          dataType="date"
          format="dd/MM/yyyy"
          width={130}
        />

        <Column
          dataField="odometerAtSchedule"
          caption="Odometer (KM)"
          dataType="number"
          width={120}
          format="#,##0"
        />

        <Paging enabled={true} pageSize={20} />
        <FilterRow visible={true} />
        <SearchPanel visible={true} width={240} placeholder="Search maintenance records..." />
        <Export enabled={true} fileName="vehicle-maintenance-history" />
        <Selection mode="single" />
      </DataGrid>

      {/* Summary Cards */}
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-4 tw-mt-6">
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
              <p className="tw-text-sm tw-text-purple-600 tw-font-medium">Overdue</p>
              <p className="tw-text-2xl tw-font-bold tw-text-purple-900">
                {maintenanceData.filter(item => item.isOverdue).length}
              </p>
            </div>
            <i className="fa-light fa-exclamation-triangle tw-text-2xl tw-text-purple-600"></i>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleMaintenanceHistory;
