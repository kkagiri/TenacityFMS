import React, { useEffect, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import DataGrid, { Column, Scrolling, Paging, FilterRow, SearchPanel, HeaderFilter, Export } from 'devextreme-react/data-grid';
import { SelectBox } from 'devextreme-react/select-box';
import LoadIndicator from 'devextreme-react/load-indicator';
import Button from 'devextreme-react/button';
import { useNavigate } from 'react-router-dom';
import { fetchMaintenanceAlerts } from '../../../redux/actions/vehicleDashboardActions';
import { fetchSiteList } from '../../../redux/actions/siteActions';
// Use the correct actions module for vehicle types
import { fetchVehicleTypes } from '../../../redux/actions/vehicleTypeActions';

const MaintenanceAlertsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // Normalize maintenanceAlerts: API may return an FMSResponse wrapper or null before load
  const rawMaintenanceAlerts = useSelector((state) => state.vehicleDashboard.maintenanceAlerts);
  const maintenanceAlerts = useMemo(() => {
    if (Array.isArray(rawMaintenanceAlerts)) return rawMaintenanceAlerts;
    if (rawMaintenanceAlerts && Array.isArray(rawMaintenanceAlerts.data)) return rawMaintenanceAlerts.data;
    return [];
  }, [rawMaintenanceAlerts]);
  const loading = useSelector((state) => state.vehicleDashboard.loading?.maintenanceAlerts);
  const errors = useSelector((state) => state.vehicleDashboard.errors?.maintenanceAlerts);
  const sites = useSelector((state) => state.site?.sites || []);
  const vehicleTypes = useSelector((state) => state.vehicle?.vehicleTypes || []);

  const [selectedSite, setSelectedSite] = useState(null);
  const [selectedVehicleType, setSelectedVehicleType] = useState(null);
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    dispatch(fetchMaintenanceAlerts());
    dispatch(fetchSiteList());
    dispatch(fetchVehicleTypes());
  }, [dispatch]);

  useEffect(() => {
    // Apply filters
    // Guard against non-iterable values
    const base = Array.isArray(maintenanceAlerts) ? maintenanceAlerts : [];
    let filtered = [...base];

    if (selectedSite) {
      filtered = filtered.filter(alert => alert.siteId === selectedSite);
    }

    if (selectedVehicleType) {
      filtered = filtered.filter(alert => alert.vehicleTypeId === selectedVehicleType);
    }

    setFilteredData(filtered);
  }, [maintenanceAlerts, selectedSite, selectedVehicleType]);

  const handleClearFilters = () => {
    setSelectedSite(null);
    setSelectedVehicleType(null);
  };

  const handleGoToMaintenance = () => {
    navigate('/maintenance/records');
  };

  // Calculate dashboard stats
  const totalAlerts = filteredData.length;
  const criticalAlerts = filteredData.filter(a => a.alertLevel === 'Critical').length;
  const overdueAlerts = filteredData.filter(a => a.daysOverdue > 0).length;
  const avgDaysOverdue = filteredData.length > 0
    ? (filteredData.reduce((sum, a) => sum + (a.daysOverdue || 0), 0) / filteredData.length).toFixed(1)
    : 0;

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
      {/* Header */}
      <div className="tw-mb-6">
        <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
          <h1 className="tw-text-3xl tw-font-bold tw-text-gray-800">
            <i className="fa-light fa-exclamation-triangle tw-mr-3"></i>
            Vehicle Maintenance Alerts
          </h1>
          <Button
            text="Go to Maintenance"
            icon="fa-light fa-external-link"
            onClick={handleGoToMaintenance}
            type="default"
            stylingMode="contained"
          />
        </div>
        <p className="tw-text-gray-600">
          Comprehensive list of all active and pending maintenance alerts for your fleet.
        </p>
      </div>

      {/* Dashboard - One Line Summary */}
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-4 tw-gap-4 tw-mb-6">
        <div className="tw-bg-blue-50 tw-p-4 tw-rounded-lg tw-border tw-border-blue-200">
          <div className="tw-flex tw-items-center tw-gap-3">
            <i className="fa-light fa-bell tw-text-2xl tw-text-blue-600"></i>
            <div>
              <p className="tw-text-xs tw-text-blue-600 tw-font-medium">Total Alerts</p>
              <p className="tw-text-xl tw-font-bold tw-text-blue-900">{totalAlerts}</p>
            </div>
          </div>
        </div>

        <div className="tw-bg-red-50 tw-p-4 tw-rounded-lg tw-border tw-border-red-200">
          <div className="tw-flex tw-items-center tw-gap-3">
            <i className="fa-light fa-exclamation-circle tw-text-2xl tw-text-red-600"></i>
            <div>
              <p className="tw-text-xs tw-text-red-600 tw-font-medium">Critical</p>
              <p className="tw-text-xl tw-font-bold tw-text-red-900">{criticalAlerts}</p>
            </div>
          </div>
        </div>

        <div className="tw-bg-orange-50 tw-p-4 tw-rounded-lg tw-border tw-border-orange-200">
          <div className="tw-flex tw-items-center tw-gap-3">
            <i className="fa-light fa-clock tw-text-2xl tw-text-orange-600"></i>
            <div>
              <p className="tw-text-xs tw-text-orange-600 tw-font-medium">Overdue</p>
              <p className="tw-text-xl tw-font-bold tw-text-orange-900">{overdueAlerts}</p>
            </div>
          </div>
        </div>

        <div className="tw-bg-yellow-50 tw-p-4 tw-rounded-lg tw-border tw-border-yellow-200">
          <div className="tw-flex tw-items-center tw-gap-3">
            <i className="fa-light fa-calendar-days tw-text-2xl tw-text-yellow-600"></i>
            <div>
              <p className="tw-text-xs tw-text-yellow-600 tw-font-medium">Avg Days Overdue</p>
              <p className="tw-text-xl tw-font-bold tw-text-yellow-900">{avgDaysOverdue}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="tw-bg-gray-50 tw-p-4 tw-rounded-lg tw-mb-6 tw-border tw-border-gray-200">
        <div className="tw-flex tw-flex-col md:tw-flex-row tw-items-start md:tw-items-center tw-gap-4">
          <div className="tw-flex tw-items-center tw-gap-2 tw-flex-1">
            <label className="tw-text-sm tw-font-medium tw-text-gray-700 tw-whitespace-nowrap">Site:</label>
            <SelectBox
              dataSource={sites}
              value={selectedSite}
              onValueChanged={(e) => setSelectedSite(e.value)}
              valueExpr="id"
              displayExpr="name"
              placeholder="All Sites"
              showClearButton={true}
              width="100%"
            />
          </div>

          <div className="tw-flex tw-items-center tw-gap-2 tw-flex-1">
            <label className="tw-text-sm tw-font-medium tw-text-gray-700 tw-whitespace-nowrap">Vehicle Type:</label>
            <SelectBox
              dataSource={vehicleTypes}
              value={selectedVehicleType}
              onValueChanged={(e) => setSelectedVehicleType(e.value)}
              valueExpr="id"
              displayExpr="name"
              placeholder="All Types"
              showClearButton={true}
              width="100%"
            />
          </div>

          <Button
            text="Clear Filters"
            icon="fa-light fa-filter-slash"
            onClick={handleClearFilters}
            stylingMode="outlined"
          />
        </div>
      </div>

      {/* Data Grid */}
      <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-border tw-border-gray-200 tw-p-6">
        <DataGrid
          dataSource={filteredData}
          showBorders={true}
          rowAlternationEnabled={true}
          columnAutoWidth={true}
          hoverStateEnabled={true}
        >
          <Scrolling mode="standard" />
          <Paging defaultPageSize={15} />
          <FilterRow visible={true} />
          <HeaderFilter visible={true} />
          <SearchPanel visible={true} width={300} placeholder="Search alerts..." />
          <Export enabled={true} fileName="maintenance-alerts" />

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
              <span className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${cellData.value === 'Critical' ? 'tw-bg-red-100 tw-text-red-800' :
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
