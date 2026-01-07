import React, { useState, useEffect, useCallback } from "react";
import { Button } from "devextreme-react/button";
import { LoadPanel } from "devextreme-react/load-panel";
import { Switch } from "devextreme-react/switch";
import {
  DataGrid,
  Column,
  Paging,
  FilterRow,
  SearchPanel,
  Selection,
} from "devextreme-react/data-grid";
import { Popup } from "devextreme-react/popup";
import notify from "devextreme/ui/notify";
import { usePermissions } from "../../../../hooks/usePermissions";
import geofenceService from "../../../../api/geofenceService";
import "./GeofenceManagement.scss";

/**
 * GeofenceManagement - Main component for managing geofences and location validation
 * 
 * SIMPLIFIED ARCHITECTURE (January 2026):
 * - Geofence validation is now a GLOBAL system-wide policy
 * - Groups are marked as "Allowed for Fueling" via toggle
 * - No more per-ruleset geofence assignments
 * - Fixed Location feature removed (use GPSGate geofences instead)
 * 
 * Provides:
 * 1. View cached geofences from GPSGate
 * 2. Sync geofences from GPSGate
 * 3. Toggle which groups are allowed for fueling (global policy)
 */

const TAB_CONFIG = [
  { id: "geofences", label: "Geofences", icon: "fa-location-dot" },
  { id: "groups", label: "Allowed Groups", icon: "fa-layer-group" },
];

const GeofenceManagement = () => {
  const { hasPermission } = usePermissions();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [geofences, setGeofences] = useState([]);
  const [geofenceGroups, setGeofenceGroups] = useState([]);
  const [selectedTabId, setSelectedTabId] = useState("geofences");
  const [showSyncConfirm, setShowSyncConfirm] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Fetch geofences on mount
  useEffect(() => {
    fetchGeofences();
    fetchGeofenceGroups();
  }, []);

  const fetchGeofences = useCallback(async () => {
    setLoading(true);
    try {
      const data = await geofenceService.getGeofences();
      setGeofences(data);
      // Get last sync time from most recent geofence
      const lastSync = data.reduce((latest, gf) => {
        if (
          gf.lastSyncedAt &&
          (!latest || new Date(gf.lastSyncedAt) > new Date(latest))
        ) {
          return gf.lastSyncedAt;
        }
        return latest;
      }, null);
      setLastSyncTime(lastSync);
    } catch (error) {
      console.error("Error fetching geofences:", error);
      notify("Failed to load geofences", "error", 3000);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchGeofenceGroups = useCallback(async () => {
    setLoading(true);
    try {
      const data = await geofenceService.getGeofenceGroups(true);
      setGeofenceGroups(data);
    } catch (error) {
      console.error("Error fetching geofence groups:", error);
      notify("Failed to load geofence groups", "error", 3000);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSyncGeofences = async (forceFullSync = false) => {
    setSyncing(true);
    setShowSyncConfirm(false);
    try {
      const response = await geofenceService.syncGeofences(forceFullSync);
      if (response?.isSuccess) {
        notify(
          response.message || "Geofences synced successfully",
          "success",
          3000
        );
        // Refresh data
        await fetchGeofences();
        await fetchGeofenceGroups();
      } else {
        notify(response?.message || "Failed to sync geofences", "error", 3000);
      }
    } catch (error) {
      console.error("Error syncing geofences:", error);
      notify("Failed to sync geofences from GPSGate", "error", 3000);
    } finally {
      setSyncing(false);
    }
  };

  const handleRefreshCurrentTab = () => {
    switch (selectedTabId) {
      case "geofences":
        fetchGeofences();
        break;
      case "groups":
        fetchGeofenceGroups();
        break;
      default:
        break;
    }
  };

  const handleToggleAllowedForFueling = async (groupId, newValue) => {
    setSaving(true);
    try {
      const response = await geofenceService.updateGroupAllowedForFueling(groupId, newValue);
      if (response?.isSuccess) {
        notify(
          `Group ${newValue ? "enabled" : "disabled"} for fueling`,
          "success",
          2000
        );
        // Update local state
        setGeofenceGroups(prev => 
          prev.map(g => g.id === groupId ? { ...g, isAllowedForFueling: newValue } : g)
        );
      } else {
        notify(response?.message || "Failed to update group", "error", 3000);
      }
    } catch (error) {
      console.error("Error updating group:", error);
      notify("Failed to update group setting", "error", 3000);
    } finally {
      setSaving(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString();
  };

  const renderGeofenceTypeCell = (cellData) => {
    const type = cellData.value || "Unknown";
    const iconMap = {
      Circle: "fa-circle",
      Polygon: "fa-draw-polygon",
      Route: "fa-route",
    };
    return (
      <div className="tw-flex tw-items-center tw-gap-2">
        <i
          className={`fa-light ${
            iconMap[type] || "fa-location-dot"
          } tw-text-blue-600`}
        ></i>
        <span>{type}</span>
      </div>
    );
  };

  const renderActiveCell = (cellData) => {
    return (
      <span
        className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${
          cellData.value
            ? "tw-bg-green-100 tw-text-green-800"
            : "tw-bg-gray-100 tw-text-gray-600"
        }`}
      >
        {cellData.value ? "Active" : "Inactive"}
      </span>
    );
  };

  const renderAllowedForFuelingCell = (cellData) => {
    return (
      <div className="tw-flex tw-items-center tw-justify-center">
        <Switch
          value={cellData.value}
          onValueChanged={(e) => handleToggleAllowedForFueling(cellData.data.id, e.value)}
          disabled={saving}
        />
      </div>
    );
  };

  // Count allowed groups
  const allowedGroupsCount = geofenceGroups.filter(g => g.isAllowedForFueling).length;

  return (
    <div className="geofence-management">
      <LoadPanel
        visible={loading || syncing || saving}
        message={syncing ? "Syncing from GPSGate..." : saving ? "Saving..." : "Loading..."}
      />

      {/* Header Section */}
      <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-p-4 tw-mb-4">
        <div className="tw-flex tw-items-center tw-justify-between tw-flex-wrap tw-gap-4">
          <div>
            <h2 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-flex tw-items-center tw-gap-2">
              <i className="fa-light fa-map-location-dot tw-text-blue-600"></i>
              Geofence Management
            </h2>
            <p className="tw-text-sm tw-text-gray-600 tw-mt-1">
              Manage geofences synced from GPSGate. Select which groups are allowed for fueling validation.
            </p>
          </div>
          <div className="tw-flex tw-items-center tw-gap-3">
            {lastSyncTime && (
              <span className="tw-text-sm tw-text-gray-500">
                <i className="fa-light fa-clock tw-mr-1"></i>
                Last sync: {formatDateTime(lastSyncTime)}
              </span>
            )}
            <Button
              text="Sync from GPSGate"
              icon="fa-light fa-arrows-rotate"
              type="default"
              stylingMode="contained"
              onClick={() => setShowSyncConfirm(true)}
              disabled={syncing}
            />
          </div>
        </div>
      </div>

      {/* Info Banner - Simplified Global Policy */}
      <div className="tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-4 tw-mb-4 tw-flex tw-items-start tw-gap-3">
        <i className="fa-light fa-info-circle tw-text-blue-600 tw-text-lg tw-mt-0.5"></i>
        <div>
          <p className="tw-text-sm tw-font-medium tw-text-blue-800">
            Global Geofence Policy
          </p>
          <p className="tw-text-xs tw-text-blue-600 tw-mt-1">
            Geofence validation is a system-wide policy. Toggle the "Allowed for Fueling" switch 
            on groups to permit fueling within their geofences. When geofence validation is enabled 
            (in System Configuration → Location Rules), tankers can only fuel at locations inside 
            allowed groups' geofences.
            {allowedGroupsCount > 0 && (
              <span className="tw-font-medium"> Currently {allowedGroupsCount} group(s) allowed.</span>
            )}
          </p>
        </div>
      </div>

      {/* Custom Tab Navigation */}
      <div className="tw-bg-white tw-rounded-t-lg tw-shadow-sm tw-border-b tw-border-gray-200">
        <div className="tw-flex tw-items-center tw-justify-between tw-px-2">
          <div className="tw-flex tw-items-center">
            {TAB_CONFIG.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTabId(tab.id)}
                className={`tw-flex tw-flex-col tw-items-center tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-transition-colors tw-border-b-2 tw-min-w-[100px] tw-bg-white ${
                  selectedTabId === tab.id
                    ? "tw-border-blue-600 tw-text-blue-600 !tw-bg-blue-50"
                    : "tw-border-transparent tw-text-gray-600 hover:tw-text-gray-800 hover:tw-bg-gray-50"
                }`}
              >
                <i className={`fa-light ${tab.icon} tw-text-lg tw-mb-1`}></i>
                <span className="tw-uppercase tw-text-xs tw-tracking-wide">
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
          {/* Refresh Button */}
          <button
            onClick={handleRefreshCurrentTab}
            className="tw-flex tw-items-center tw-gap-2 tw-px-3 tw-py-2 tw-text-sm tw-text-gray-600 tw-bg-white hover:tw-text-blue-600 hover:tw-bg-blue-50 tw-rounded tw-border tw-border-gray-300 tw-transition-colors tw-mr-2"
            title="Refresh current tab"
          >
            <i className="fa-light fa-arrows-rotate"></i>
            <span className="tw-hidden sm:tw-inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="tw-bg-white tw-rounded-b-lg tw-shadow-sm">
        {selectedTabId === "geofences" && (
          <div className="tw-p-4">
            <DataGrid
              dataSource={geofences}
              keyExpr="id"
              showBorders={true}
              showRowLines={true}
              rowAlternationEnabled={true}
              allowColumnResizing={true}
              columnAutoWidth={true}
              height={500}
            >
              <SearchPanel visible={true} placeholder="Search geofences..." />
              <FilterRow visible={true} />
              <Paging defaultPageSize={15} />
              <Selection mode="single" />

              <Column dataField="name" caption="Name" />
              <Column dataField="description" caption="Description" />
              <Column
                dataField="geofenceType"
                caption="Type"
                width={120}
                cellRender={renderGeofenceTypeCell}
              />
              <Column
                dataField="centerLatitude"
                caption="Latitude"
                width={120}
                format={{ type: "fixedPoint", precision: 6 }}
              />
              <Column
                dataField="centerLongitude"
                caption="Longitude"
                width={120}
                format={{ type: "fixedPoint", precision: 6 }}
              />
              <Column
                dataField="radiusMeters"
                caption="Radius (m)"
                width={100}
                format={{ type: "fixedPoint", precision: 0 }}
              />
              <Column
                dataField="isActive"
                caption="Status"
                width={100}
                cellRender={renderActiveCell}
              />
              <Column
                dataField="lastSyncedAt"
                caption="Last Synced"
                width={160}
                dataType="datetime"
                format="yyyy-MM-dd HH:mm"
              />
            </DataGrid>
          </div>
        )}

        {selectedTabId === "groups" && (
          <div className="tw-p-4">
            <DataGrid
              dataSource={geofenceGroups}
              keyExpr="id"
              showBorders={true}
              showRowLines={true}
              rowAlternationEnabled={true}
              allowColumnResizing={true}
              columnAutoWidth={true}
              height={500}
            >
              <SearchPanel visible={true} placeholder="Search groups..." />
              <FilterRow visible={true} />
              <Paging defaultPageSize={15} />
              <Selection mode="single" />

              <Column 
                dataField="isAllowedForFueling" 
                caption="Allowed for Fueling"
                width={150}
                alignment="center"
                cellRender={renderAllowedForFuelingCell}
              />
              <Column dataField="name" caption="Name" />
              <Column dataField="description" caption="Description" />
              <Column
                dataField="geofenceCount"
                caption="Geofences"
                width={100}
                alignment="center"
              />
              <Column
                dataField="colour"
                caption="Color"
                width={80}
                cellRender={(cellData) => (
                  <div
                    className="tw-w-6 tw-h-6 tw-rounded tw-border"
                    style={{ backgroundColor: cellData.value || "#808080" }}
                  />
                )}
              />
              <Column
                dataField="isActive"
                caption="Status"
                width={100}
                cellRender={renderActiveCell}
              />
              <Column
                dataField="lastSyncedAt"
                caption="Last Synced"
                width={160}
                dataType="datetime"
                format="yyyy-MM-dd HH:mm"
              />
            </DataGrid>
          </div>
        )}
      </div>

      {/* Sync Confirmation Popup */}
      <Popup
        visible={showSyncConfirm}
        onHiding={() => setShowSyncConfirm(false)}
        title="Sync Geofences"
        width={400}
        height="auto"
        showCloseButton={true}
      >
        <div className="tw-p-4">
          <p className="tw-text-gray-700 tw-mb-4">
            This will sync all geofences and groups from GPSGate. Do you want to
            perform a full sync?
          </p>
          <div className="tw-flex tw-gap-3 tw-justify-end">
            <Button
              text="Cancel"
              stylingMode="outlined"
              onClick={() => setShowSyncConfirm(false)}
            />
            <Button
              text="Quick Sync"
              type="default"
              stylingMode="contained"
              onClick={() => handleSyncGeofences(false)}
            />
            <Button
              text="Full Sync"
              type="success"
              stylingMode="contained"
              onClick={() => handleSyncGeofences(true)}
            />
          </div>
        </div>
      </Popup>
    </div>
  );
};

export default GeofenceManagement;
