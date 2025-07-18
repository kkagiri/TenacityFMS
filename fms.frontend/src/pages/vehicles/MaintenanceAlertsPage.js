import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import DataGrid, { Column, Scrolling, Paging } from 'devextreme-react/data-grid';
import LoadIndicator from 'devextreme-react/load-indicator';
import { fetchMaintenanceAlerts } from '../../redux/actions/vehicleDashboardActions';

const MaintenanceAlertsPage = () => {
  const dispatch = useDispatch();
  const maintenanceAlerts = useSelector((state) => state.vehicleDashboard.maintenanceAlerts);
  const loading = useSelector((state) => state.vehicleDashboard.loading.maintenanceAlerts);
  const errors = useSelector((state) => state.vehicleDashboard.errors.maintenanceAlerts);

  useEffect(() => {
    dispatch(fetchMaintenanceAlerts());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="tw-flex tw-justify-center tw-items-center tw-h-full">
        <LoadIndicator width="32px" height="32px" visible={true} />
        <span className="tw-ml-3 tw-text-gray-600">Loading maintenance alerts...</span>
      </div>
    );
  }

  if (errors) {
    return (
      <div className="tw-text-red-600 tw-p-4">
        Error loading maintenance alerts: {errors.message || 'Unknown error'}
      </div>
    );
  }

  return (
    <div className="tw-p-6">
      <h1 className="tw-text-3xl tw-font-bold tw-text-gray-800 tw-mb-6">
        <i className="fa-light fa-exclamation-triangle tw-mr-3"></i>
        Vehicle Maintenance Alerts
      </h1>
      <p className="tw-text-gray-600 tw-mb-6">
        Comprehensive list of all active and pending maintenance alerts for your fleet.
      </p>

      <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-border tw-border-gray-200 tw-p-6">
        <DataGrid
          dataSource={maintenanceAlerts}
          showBorders={true}
          rowAlternationEnabled={true}
          columnAutoWidth={true}
          hoverStateEnabled={true}
        >
          <Scrolling mode="standard" />
          <Paging defaultPageSize={10} />
          
          <Column
            dataField="vehicleName"
            caption="Vehicle"
            minWidth={150}
          />
          <Column
            dataField="alertType"
            caption="Alert Type"
            minWidth={150}
          />
          <Column
            dataField="alertLevel"
            caption="Priority"
            minWidth={100}
            cellRender={(cellData) => (
              <span className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${
                cellData.value === 'Critical' ? 'tw-bg-red-100 tw-text-red-800' :
                cellData.value === 'High' ? 'tw-bg-orange-100 tw-text-orange-800' :
                cellData.value === 'Medium' ? 'tw-bg-yellow-100 tw-text-yellow-800' :
                'tw-bg-gray-100 tw-text-gray-800'
              }`}>
                {cellData.value}
              </span>
            )}
          />
          <Column
            dataField="daysOverdue"
            caption="Days Overdue"
            minWidth={120}
            cellRender={(cellData) => (
              <span className={cellData.value > 0 ? 'tw-text-red-600 tw-font-semibold' : 'tw-text-gray-600'}>
                {cellData.value > 0 ? `+${cellData.value}` : cellData.value}
              </span>
            )}
          />
          <Column
            dataField="lastServiceDate"
            caption="Last Service"
            dataType="date"
            format="shortDate"
            minWidth={120}
          />
          <Column
            dataField="nextServiceDate"
            caption="Next Service Due"
            dataType="date"
            format="shortDate"
            minWidth={150}
          />
          <Column
            dataField="description"
            caption="Description"
            minWidth={200}
          />
        </DataGrid>
      </div>
    </div>
  );
};

export default MaintenanceAlertsPage;
