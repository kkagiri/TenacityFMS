/**
 * File: LocationSettingsOverview.js
 * Purpose: Show location settings overview for users, PTS devices, and vehicles in a tabbed panel view.
 * Dependencies: devextreme-react, geofenceService
 * Last Modified: 2026-03-03
 *
 * Key Components:
 * - LocationSettingsOverview: Tabbed overview with summary cards and three data grids.
 */
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
  Selection,
} from "devextreme-react/data-grid";
import notify from "devextreme/ui/notify";
import { getLocationSettingsOverview } from "../../../api/geofenceService";
import SlidePanel from "../../../components/ui/SlidePanel";
import "./LocationSettingsOverview.scss";

const TAB_ITEMS = [
  { id: "users", label: "Users", icon: "fa-light fa-users" },
  { id: "pts", label: "PTS Devices", icon: "fa-light fa-gas-pump" },
];

/**
 * LocationSettingsOverview - Displays an overview of location-related settings across the system
 * Shows:
 * - Users with mobile bypass settings
 * - PTS devices with location validation settings
 * - Vehicles with GPS settings
 */
const LocationSettingsOverview = ({ onClose }) => {
  const [loading, setLoading] = useState(true);
  const [activeTabId, setActiveTabId] = useState("users");
  const [showUserEditor, setShowUserEditor] = useState(false);
  const [showPtsEditor, setShowPtsEditor] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingPts, setEditingPts] = useState(null);
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

  const normalizeUser = (item = {}) => ({
    userId: item.userId ?? item.UserId ?? "",
    userName: item.userName ?? item.UserName ?? "",
    email: item.email ?? item.Email ?? "",
    bypassLocationValidation: item.bypassLocationValidation ?? item.BypassLocationValidation ?? false,
    isDeleted: item.isDeleted ?? item.IsDeleted ?? false,
  });

  const normalizePts = (item = {}) => ({
    ptsId: item.ptsId ?? item.PtsId ?? "",
    ptsName: item.ptsName ?? item.PtsName ?? "",
    siteName: item.siteName ?? item.SiteName ?? "",
    enableLocationValidation: item.enableLocationValidation ?? item.EnableLocationValidation ?? false,
    requireVehicleProximity: item.requireVehicleProximity ?? item.RequireVehicleProximity ?? false,
    requireMobileAppProximity: item.requireMobileAppProximity ?? item.RequireMobileAppProximity ?? false,
    vehicleProximityRadius: item.vehicleProximityRadius ?? item.VehicleProximityRadius ?? null,
    mobileAppProximityRadius: item.mobileAppProximityRadius ?? item.MobileAppProximityRadius ?? null,
    bypassOnGPSFailure: item.bypassOnGPSFailure ?? item.BypassOnGPSFailure ?? false,
    isActive: item.isActive ?? item.IsActive ?? false,
    connectionStatus: item.connectionStatus ?? item.ConnectionStatus ?? "Unknown",
  });

  const normalizeVehicle = (item = {}) => ({
    vehicleId: item.vehicleId ?? item.VehicleId ?? 0,
    hyoungNo: item.hyoungNo ?? item.HyoungNo ?? "",
    numberPlate: item.numberPlate ?? item.NumberPlate ?? "",
    vehicleTypeName: item.vehicleTypeName ?? item.VehicleTypeName ?? "",
    hasGPSInstalled: item.hasGPSInstalled ?? item.HasGPSInstalled ?? false,
    isActive: item.isActive ?? item.IsActive ?? false,
    isCompanyVehicle: item.isCompanyVehicle ?? item.IsCompanyVehicle ?? false,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getLocationSettingsOverview();
      if (response?.isSuccess && response?.data) {
        const source = response.data || {};
        const users = (source.users || source.Users || []).map(normalizeUser);
        const ptsDevices = (source.ptsDevices || source.pTSDevices || source.PTSDevices || []).map(normalizePts);
        const vehicles = (source.vehicles || source.Vehicles || []).map(normalizeVehicle);

        setData({
          users,
          ptsDevices,
          vehicles,
          totalUsersWithBypass:
            source.totalUsersWithBypass ?? source.TotalUsersWithBypass ?? users.filter((u) => u?.bypassLocationValidation || u?.BypassLocationValidation).length,
          totalUsersWithoutBypass:
            source.totalUsersWithoutBypass ?? source.TotalUsersWithoutBypass ?? users.filter((u) => !(u?.bypassLocationValidation || u?.BypassLocationValidation)).length,
          totalPTSDevicesWithLocationValidation:
            source.totalPTSDevicesWithLocationValidation ?? source.TotalPTSDevicesWithLocationValidation ?? ptsDevices.filter((p) => p?.enableLocationValidation || p?.EnableLocationValidation).length,
          totalPTSDevicesWithoutLocationValidation:
            source.totalPTSDevicesWithoutLocationValidation ?? source.TotalPTSDevicesWithoutLocationValidation ?? ptsDevices.filter((p) => !(p?.enableLocationValidation || p?.EnableLocationValidation)).length,
          totalVehiclesWithGPS:
            source.totalVehiclesWithGPS ?? source.TotalVehiclesWithGPS ?? vehicles.filter((v) => v?.hasGPSInstalled || v?.HasGPSInstalled).length,
          totalVehiclesWithoutGPS:
            source.totalVehiclesWithoutGPS ?? source.TotalVehiclesWithoutGPS ?? vehicles.filter((v) => !(v?.hasGPSInstalled || v?.HasGPSInstalled)).length,
        });
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

  const handleUserRowUpdating = (e) => {
    const updated = { ...e.oldData, ...e.newData };
    setData((prev) => {
      const users = prev.users.map((u) => (u.userId === e.key ? updated : u));
      return {
        ...prev,
        users,
        totalUsersWithBypass: users.filter((u) => u.bypassLocationValidation).length,
        totalUsersWithoutBypass: users.filter((u) => !u.bypassLocationValidation).length,
      };
    });
    notify("User details updated", "success", 1800);
  };

  const handlePtsRowUpdating = (e) => {
    const updated = { ...e.oldData, ...e.newData };
    setData((prev) => {
      const ptsDevices = prev.ptsDevices.map((p) => (p.ptsId === e.key ? updated : p));
      return {
        ...prev,
        ptsDevices,
        totalPTSDevicesWithLocationValidation: ptsDevices.filter((p) => p.enableLocationValidation).length,
        totalPTSDevicesWithoutLocationValidation: ptsDevices.filter((p) => !p.enableLocationValidation).length,
      };
    });
    notify("PTS device details updated", "success", 1800);
  };

  const handleVehicleRowUpdating = (e) => {
    const updated = { ...e.oldData, ...e.newData };
    setData((prev) => {
      const vehicles = prev.vehicles.map((v) => (v.vehicleId === e.key ? updated : v));
      return {
        ...prev,
        vehicles,
        totalVehiclesWithGPS: vehicles.filter((v) => v.hasGPSInstalled).length,
        totalVehiclesWithoutGPS: vehicles.filter((v) => !v.hasGPSInstalled).length,
      };
    });
    notify("Vehicle details updated", "success", 1800);
  };

  const openUserEditor = (row) => {
    setEditingUser({ ...row });
    setShowUserEditor(true);
  };

  const openPtsEditor = (row) => {
    setEditingPts({ ...row });
    setShowPtsEditor(true);
  };

  const saveUserEditor = () => {
    if (!editingUser?.userId) return;
    handleUserRowUpdating({ key: editingUser.userId, oldData: {}, newData: editingUser });
    setShowUserEditor(false);
  };

  const savePtsEditor = () => {
    if (!editingPts?.ptsId) return;
    handlePtsRowUpdating({ key: editingPts.ptsId, oldData: {}, newData: editingPts });
    setShowPtsEditor(false);
  };

  const handleUserSelectionChanged = (e) => {
    const selected = e.selectedRowsData?.[0];
    if (selected) {
      openUserEditor(selected);
    }
  };

  const handlePtsSelectionChanged = (e) => {
    const selected = e.selectedRowsData?.[0];
    if (selected) {
      openPtsEditor(selected);
    }
  };

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
      </div>

      <div className="location-settings-overview__tabs">
        {TAB_ITEMS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTabId(tab.id)}
            className={`location-settings-overview__tab ${activeTabId === tab.id ? "location-settings-overview__tab--active" : ""}`}
          >
            <i className={tab.icon}></i>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="tw-flex-1 tw-overflow-hidden tw-p-4">
        {activeTabId === "users" && (
          <div className="location-settings-overview__grid-pane tw-h-full">
            <div className="tw-mb-3 tw-text-xs tw-text-gray-500">
              Users with <strong>Bypass Location Validation</strong> can skip GPS validation during mobile fueling.
            </div>
            <div className="tw-mb-2 tw-text-xs tw-text-blue-600">
              Select a row to edit validation settings.
            </div>
            <DataGrid
              keyExpr="userId"
              dataSource={data.users}
              showBorders={true}
              rowAlternationEnabled={true}
              columnAutoWidth={true}
              width="100%"
              height="calc(100% - 36px)"
              wordWrapEnabled={true}
              noDataText="No users found"
              onRowUpdating={handleUserRowUpdating}
              onSelectionChanged={handleUserSelectionChanged}
            >
              <Selection mode="single" />
              <Scrolling mode="virtual" />
              <FilterRow visible={true} />
              <SearchPanel visible={true} width={220} placeholder="Search users..." />
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
                  <span className={`tw-inline-flex tw-items-center tw-px-2 tw-py-0.5 tw-rounded-full tw-text-xs tw-font-medium ${cellData.value ? "tw-bg-red-100 tw-text-red-800" : "tw-bg-green-100 tw-text-green-800"
                    }`}>
                    {cellData.value ? "Deleted" : "Active"}
                  </span>
                )}
              />
            </DataGrid>
          </div>
        )}

        {activeTabId === "pts" && (
          <div className="location-settings-overview__grid-pane tw-h-full">
            <div className="tw-mb-3 tw-text-xs tw-text-gray-500">
              Devices with <strong>Enable Location Validation</strong> check proximity before fueling.
            </div>
            <div className="tw-mb-2 tw-text-xs tw-text-blue-600">
              Select a row to edit validation settings.
            </div>
            <DataGrid
              keyExpr="ptsId"
              dataSource={data.ptsDevices}
              showBorders={true}
              rowAlternationEnabled={true}
              columnAutoWidth={true}
              width="100%"
              height="calc(100% - 36px)"
              wordWrapEnabled={true}
              noDataText="No PTS devices found"
              onRowUpdating={handlePtsRowUpdating}
              onSelectionChanged={handlePtsSelectionChanged}
            >
              <Selection mode="single" />
              <Scrolling mode="virtual" />
              <FilterRow visible={true} />
              <SearchPanel visible={true} width={220} placeholder="Search PTS devices..." />
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
              <Column dataField="vehicleProximityRadius" caption="Vehicle Radius (m)" width={130} alignment="center" />
              <Column dataField="mobileAppProximityRadius" caption="Mobile Radius (m)" width={130} alignment="center" />
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

      </div>

      <SlidePanel
        open={showUserEditor}
        onClose={() => setShowUserEditor(false)}
        title="Edit User Validation"
        width={680}
      >
        <div className="tw-p-5 tw-space-y-4">
          <p className="tw-text-sm tw-text-gray-600 tw-m-0">
            Only location validation setting is editable here.
          </p>
          <label className="tw-flex tw-items-center tw-gap-2 tw-text-sm">
            <input
              type="checkbox"
              checked={!!editingUser?.bypassLocationValidation}
              onChange={(e) => setEditingUser((prev) => ({ ...prev, bypassLocationValidation: e.target.checked }))}
            />
            Bypass Location Validation
          </label>
          <div className="tw-flex tw-justify-end tw-gap-2 tw-pt-2">
            <Button text="Cancel" stylingMode="outlined" onClick={() => setShowUserEditor(false)} />
            <Button text="Save" type="default" stylingMode="contained" onClick={saveUserEditor} />
          </div>
        </div>
      </SlidePanel>

      <SlidePanel
        open={showPtsEditor}
        onClose={() => setShowPtsEditor(false)}
        title="Edit PTS Validation"
        width={760}
      >
        <div className="tw-p-5 tw-space-y-4">
          <p className="tw-text-sm tw-text-gray-600 tw-m-0">
            Only validation settings are editable here.
          </p>
          <div className="tw-grid tw-grid-cols-2 tw-gap-3">
            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-mb-1">Vehicle Radius (m)</label>
              <input
                type="number"
                className="tw-w-full tw-border tw-border-gray-300 tw-rounded tw-px-3 tw-py-2"
                value={editingPts?.vehicleProximityRadius ?? ""}
                onChange={(e) => setEditingPts((prev) => ({ ...prev, vehicleProximityRadius: Number(e.target.value || 0) }))}
              />
            </div>
            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-mb-1">Mobile Radius (m)</label>
              <input
                type="number"
                className="tw-w-full tw-border tw-border-gray-300 tw-rounded tw-px-3 tw-py-2"
                value={editingPts?.mobileAppProximityRadius ?? ""}
                onChange={(e) => setEditingPts((prev) => ({ ...prev, mobileAppProximityRadius: Number(e.target.value || 0) }))}
              />
            </div>
          </div>
          <div className="tw-grid tw-grid-cols-2 tw-gap-3">
            <label className="tw-flex tw-items-center tw-gap-2 tw-text-sm"><input type="checkbox" checked={!!editingPts?.enableLocationValidation} onChange={(e) => setEditingPts((prev) => ({ ...prev, enableLocationValidation: e.target.checked }))} />Enable Location Validation</label>
            <label className="tw-flex tw-items-center tw-gap-2 tw-text-sm"><input type="checkbox" checked={!!editingPts?.requireVehicleProximity} onChange={(e) => setEditingPts((prev) => ({ ...prev, requireVehicleProximity: e.target.checked }))} />Require Vehicle Proximity</label>
            <label className="tw-flex tw-items-center tw-gap-2 tw-text-sm"><input type="checkbox" checked={!!editingPts?.requireMobileAppProximity} onChange={(e) => setEditingPts((prev) => ({ ...prev, requireMobileAppProximity: e.target.checked }))} />Require Mobile Proximity</label>
            <label className="tw-flex tw-items-center tw-gap-2 tw-text-sm"><input type="checkbox" checked={!!editingPts?.bypassOnGPSFailure} onChange={(e) => setEditingPts((prev) => ({ ...prev, bypassOnGPSFailure: e.target.checked }))} />Bypass on GPS Failure</label>
          </div>
          <div className="tw-flex tw-justify-end tw-gap-2 tw-pt-2">
            <Button text="Cancel" stylingMode="outlined" onClick={() => setShowPtsEditor(false)} />
            <Button text="Save" type="default" stylingMode="contained" onClick={savePtsEditor} />
          </div>
        </div>
      </SlidePanel>

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
