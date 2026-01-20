import React, { useState, useEffect, useCallback } from "react";
import { Button } from "devextreme-react/button";
import { LoadPanel } from "devextreme-react/load-panel";
import DataGrid, {
  Column,
  Paging,
  FilterRow,
  SearchPanel,
  HeaderFilter,
  Scrolling,
  Export,
} from "devextreme-react/data-grid";
import Tabs from "devextreme-react/tabs";
import notify from "devextreme/ui/notify";
import { getLocationSettingsOverview } from "../../../api/geofenceService";
import "./LocationSettingsOverview.scss";

/**
 * LocationSettingsOverview - Displays an overview of location-related settings across the system
 * Shows:
 * - Users with mobile bypass settings
 * - PTS devices with location validation settings
 * - Vehicles with GPS settings
 */
const LocationSettingsOverview = ({ onClose }) => {
  const [loading, setLoading] = useState(true);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [data, setData] = useState({
    users: [],
    ptsDevices: [],
    vehicles: [],
    totalUsersWithBypass: 0,
    totalUsersWithoutBypass: 0,
    totalPTSDevicesWithLocationValidation: 0,
    totalPTSDevicesWithoutLocationValidation: 0,
    totalVehiclesWithGPS: 0,
    totalVehiclesWithoutGPS: 0,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getLocationSettingsOverview();
      if (response?.isSuccess && response?.data) {
        setData(response.data);
      } else {
        notify(response?.message || "Failed to fetch settings overview", "error", 3000);
      }
    } catch (error) {
      console.error("Error fetching location settings overview:", error);
      notify("Failed to fetch location settings overview", "error", 3000);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const renderBooleanCell = (cellData, trueLabel = "Yes", falseLabel = "No") => {
    const value = cellData.value;
    if (value) {
      return (
        <span className="tw-inline-flex tw-items-center tw-px-2.5 tw-py-0.5 tw-rounded-full tw-text-xs tw-font-medium tw-bg-green-100 tw-text-green-800">
          <i className="fa-light fa-check tw-mr-1"></i>
          {trueLabel}
        </span>
      );
    }
    return (
      <span className="tw-inline-flex tw-items-center tw-px-2.5 tw-py-0.5 tw-rounded-full tw-text-xs tw-font-medium tw-bg-gray-100 tw-text-gray-600">
        <i className="fa-light fa-times tw-mr-1"></i>
        {falseLabel}
      </span>
    );
  };

  const renderConnectionStatus = (cellData) => {
    const status = cellData.value?.toLowerCase();
    let colorClass = "tw-bg-gray-100 tw-text-gray-600";
    let icon = "fa-circle-question";

    if (status === "online" || status === "connected") {
      colorClass = "tw-bg-green-100 tw-text-green-800";
      icon = "fa-circle-check";
    } else if (status === "offline" || status === "disconnected") {
      colorClass = "tw-bg-red-100 tw-text-red-800";
      icon = "fa-circle-xmark";
    }

    return (
      <span className={`tw-inline-flex tw-items-center tw-px-2.5 tw-py-0.5 tw-rounded-full tw-text-xs tw-font-medium ${colorClass}`}>
        <i className={`fa-light ${icon} tw-mr-1`}></i>
        {cellData.value || "Unknown"}
      </span>
    );
  };

  const StatCard = ({ icon, iconColor, label, value, subValue, bgColor }) => (
    <div className={`tw-rounded-lg tw-p-4 tw-border ${bgColor}`}>
      <div className="tw-flex tw-items-center tw-gap-3">
        <div className={`tw-w-10 tw-h-10 tw-rounded-lg tw-flex tw-items-center tw-justify-center ${iconColor}`}>
          <i className={`${icon} tw-text-lg`}></i>
        </div>
        <div>
          <div className="tw-text-2xl tw-font-bold tw-text-gray-800">{value}</div>
          <div className="tw-text-xs tw-text-gray-600">{label}</div>
          {subValue && <div className="tw-text-xs tw-text-gray-500">{subValue}</div>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="location-settings-overview tw-flex tw-flex-col tw-h-full">
      {/* Header */}
      <div className="tw-flex tw-items-center tw-justify-between tw-p-4 tw-border-b tw-border-gray-200">
        <p className="tw-text-sm tw-text-gray-600 tw-m-0">
          <i className="fa-light fa-info-circle tw-mr-2 tw-text-blue-500"></i>
          View users, PTS devices, and vehicles with location-related settings
        </p>
        <div className="tw-flex tw-items-center tw-gap-2">
          <Button
            icon="fa-light fa-refresh"
            text="Refresh"
            stylingMode="outlined"
            onClick={fetchData}
            disabled={loading}
          />
          {onClose && (
            <Button
              icon="fa-light fa-times"
              stylingMode="text"
              onClick={onClose}
            />
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-3 lg:tw-grid-cols-6 tw-gap-3 tw-p-4 tw-bg-gray-50 tw-border-b tw-border-gray-200">
        <StatCard
          icon="fa-light fa-user-check"
          iconColor="tw-bg-purple-100 tw-text-purple-600"
          label="Users with Bypass"
          value={data.totalUsersWithBypass}
          bgColor="tw-bg-purple-50 tw-border-purple-200"
        />
        <StatCard
          icon="fa-light fa-user"
          iconColor="tw-bg-gray-100 tw-text-gray-600"
          label="Users without Bypass"
          value={data.totalUsersWithoutBypass}
          bgColor="tw-bg-gray-50 tw-border-gray-200"
        />
        <StatCard
          icon="fa-light fa-location-dot"
          iconColor="tw-bg-green-100 tw-text-green-600"
          label="PTS with Location"
          value={data.totalPTSDevicesWithLocationValidation}
          bgColor="tw-bg-green-50 tw-border-green-200"
        />
        <StatCard
          icon="fa-light fa-gas-pump"
          iconColor="tw-bg-gray-100 tw-text-gray-600"
          label="PTS without Location"
          value={data.totalPTSDevicesWithoutLocationValidation}
          bgColor="tw-bg-gray-50 tw-border-gray-200"
        />
        <StatCard
          icon="fa-light fa-satellite"
          iconColor="tw-bg-blue-100 tw-text-blue-600"
          label="Vehicles with GPS"
          value={data.totalVehiclesWithGPS}
          bgColor="tw-bg-blue-50 tw-border-blue-200"
        />
        <StatCard
          icon="fa-light fa-car"
          iconColor="tw-bg-gray-100 tw-text-gray-600"
          label="Vehicles without GPS"
          value={data.totalVehiclesWithoutGPS}
          bgColor="tw-bg-gray-50 tw-border-gray-200"
        />
      </div>

      {/* Tab Navigation - Similar to StockManagement */}
      <div className="tw-bg-white tw-border-b tw-border-gray-200">
        <Tabs
          dataSource={[
            { text: "Users", icon: "fa-light fa-users" },
            { text: "PTS Devices", icon: "fa-light fa-gas-pump" },
            { text: "Vehicles", icon: "fa-light fa-car" },
          ]}
          selectedIndex={activeTabIndex}
          onItemClick={(e) => setActiveTabIndex(e.itemIndex)}
          width="100%"
          itemRender={(item) => (
            <div className="tw-flex tw-items-center tw-gap-2">
              <i className={item.icon}></i>
              <span>{item.text}</span>
            </div>
          )}
        />
      </div>

      {/* Tab Content */}
      <div className="tw-flex-1 tw-overflow-hidden tw-p-4">
        {/* Users Tab */}
        {activeTabIndex === 0 && (
          <div className="tw-h-full">
              <div className="tw-mb-3">
                <div className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-gray-600">
                  <i className="fa-light fa-info-circle tw-text-blue-500"></i>
                  <span>Users with <strong>Bypass Location Validation</strong> enabled can skip GPS validation during mobile fueling.</span>
                </div>
              </div>
              <DataGrid
                dataSource={data.users}
                showBorders={true}
                rowAlternationEnabled={true}
                columnAutoWidth={true}
                height="calc(100% - 40px)"
                wordWrapEnabled={true}
              >
                <Scrolling mode="virtual" />
                <FilterRow visible={true} />
                <SearchPanel visible={true} width={200} placeholder="Search users..." />
                <HeaderFilter visible={true} />
                <Paging defaultPageSize={20} />
                <Export enabled={true} allowExportSelectedData={false} />

                <Column dataField="userName" caption="Username" width={150} />
                <Column dataField="email" caption="Email" width={200} />
                <Column
                  dataField="bypassLocationValidation"
                  caption="Bypass Enabled"
                  width={140}
                  alignment="center"
                  cellRender={(cellData) => renderBooleanCell(cellData, "Enabled", "Disabled")}
                />
                <Column
                  dataField="isDeleted"
                  caption="Status"
                  width={100}
                  alignment="center"
                  cellRender={(cellData) => (
                    <span className={`tw-inline-flex tw-items-center tw-px-2 tw-py-0.5 tw-rounded-full tw-text-xs tw-font-medium ${
                      cellData.value ? "tw-bg-red-100 tw-text-red-800" : "tw-bg-green-100 tw-text-green-800"
                    }`}>
                      {cellData.value ? "Deleted" : "Active"}
                    </span>
                  )}
                />
              </DataGrid>
          </div>
        )}

        {/* PTS Devices Tab */}
        {activeTabIndex === 1 && (
          <div className="tw-h-full">
              <div className="tw-mb-3">
                <div className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-gray-600">
                  <i className="fa-light fa-info-circle tw-text-blue-500"></i>
                  <span>PTS devices with location validation settings. Devices with <strong>Enable Location Validation</strong> will check proximity before fueling.</span>
                </div>
              </div>
              <DataGrid
                dataSource={data.ptsDevices}
                showBorders={true}
                rowAlternationEnabled={true}
                columnAutoWidth={true}
                height="calc(100% - 40px)"
                wordWrapEnabled={true}
              >
                <Scrolling mode="virtual" />
                <FilterRow visible={true} />
                <SearchPanel visible={true} width={200} placeholder="Search PTS devices..." />
                <HeaderFilter visible={true} />
                <Paging defaultPageSize={20} />
                <Export enabled={true} allowExportSelectedData={false} />

                <Column dataField="ptsId" caption="PTS ID" width={120} />
                <Column dataField="ptsName" caption="Name" width={150} />
                <Column dataField="siteName" caption="Site" width={150} />
                <Column
                  dataField="enableLocationValidation"
                  caption="Location Validation"
                  width={150}
                  alignment="center"
                  cellRender={(cellData) => renderBooleanCell(cellData, "Enabled", "Disabled")}
                />
                <Column
                  dataField="requireVehicleProximity"
                  caption="Vehicle Proximity"
                  width={140}
                  alignment="center"
                  cellRender={(cellData) => renderBooleanCell(cellData, "Required", "Off")}
                />
                <Column
                  dataField="requireMobileAppProximity"
                  caption="Mobile Proximity"
                  width={140}
                  alignment="center"
                  cellRender={(cellData) => renderBooleanCell(cellData, "Required", "Off")}
                />
                <Column
                  dataField="vehicleProximityRadius"
                  caption="Vehicle Radius (m)"
                  width={130}
                  alignment="center"
                />
                <Column
                  dataField="mobileAppProximityRadius"
                  caption="Mobile Radius (m)"
                  width={130}
                  alignment="center"
                />
                <Column
                  dataField="bypassOnGPSFailure"
                  caption="Bypass on GPS Fail"
                  width={140}
                  alignment="center"
                  cellRender={(cellData) => renderBooleanCell(cellData, "Yes", "No")}
                />
                <Column
                  dataField="isActive"
                  caption="Active"
                  width={100}
                  alignment="center"
                  cellRender={(cellData) => renderBooleanCell(cellData, "Active", "Inactive")}
                />
                <Column
                  dataField="connectionStatus"
                  caption="Connection"
                  width={120}
                  alignment="center"
                  cellRender={renderConnectionStatus}
                />
              </DataGrid>
          </div>
        )}

        {/* Vehicles Tab */}
        {activeTabIndex === 2 && (
          <div className="tw-h-full">
              <div className="tw-mb-3">
                <div className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-gray-600">
                  <i className="fa-light fa-info-circle tw-text-blue-500"></i>
                  <span>Vehicles with GPS settings. Only vehicles with <strong>GPS Installed</strong> can participate in location validation.</span>
                </div>
              </div>
              <DataGrid
                dataSource={data.vehicles}
                showBorders={true}
                rowAlternationEnabled={true}
                columnAutoWidth={true}
                height="calc(100% - 40px)"
                wordWrapEnabled={true}
              >
                <Scrolling mode="virtual" />
                <FilterRow visible={true} />
                <SearchPanel visible={true} width={200} placeholder="Search vehicles..." />
                <HeaderFilter visible={true} />
                <Paging defaultPageSize={20} />
                <Export enabled={true} allowExportSelectedData={false} />

                <Column dataField="vehicleId" caption="ID" width={80} />
                <Column dataField="hyoungNo" caption="Hyoung No" width={150} />
                <Column dataField="numberPlate" caption="Number Plate" width={130} />
                <Column dataField="vehicleTypeName" caption="Type" width={150} />
                <Column
                  dataField="hasGPSInstalled"
                  caption="GPS Installed"
                  width={130}
                  alignment="center"
                  cellRender={(cellData) => renderBooleanCell(cellData, "Yes", "No")}
                />
                <Column
                  dataField="isActive"
                  caption="Active"
                  width={100}
                  alignment="center"
                  cellRender={(cellData) => renderBooleanCell(cellData, "Active", "Inactive")}
                />
                <Column
                  dataField="isCompanyVehicle"
                  caption="Company Vehicle"
                  width={130}
                  alignment="center"
                  cellRender={(cellData) => renderBooleanCell(cellData, "Yes", "No")}
                />
              </DataGrid>
          </div>
        )}
      </div>

      <LoadPanel
        visible={loading}
        showIndicator={true}
        shading={true}
        shadingColor="rgba(0, 0, 0, 0.4)"
        showPane={true}
        message="Loading settings overview..."
      />
    </div>
  );
};

export default LocationSettingsOverview;
