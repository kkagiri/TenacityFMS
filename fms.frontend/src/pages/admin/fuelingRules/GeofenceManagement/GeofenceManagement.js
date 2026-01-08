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
  { id: "sync", label: "Sync Groups", icon: "fa-cloud-arrow-down" },
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

  // Async sync job state
  const [syncJobId, setSyncJobId] = useState(null);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStatusMessage, setSyncStatusMessage] = useState("");

  // Selective sync state
  const [availableGroups, setAvailableGroups] = useState([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [loadingAvailableGroups, setLoadingAvailableGroups] = useState(false);

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

  const fetchAvailableGroups = useCallback(async () => {
    setLoadingAvailableGroups(true);
    try {
      const response = await geofenceService.getAvailableGroups();
      if (response?.isSuccess && response?.data) {
        setAvailableGroups(response.data);
      } else {
        throw new Error(response?.message || "Failed to fetch available groups");
      }
    } catch (error) {
      console.error("Error fetching available groups:", error);
      notify("Failed to load available groups from GPSGate", "error", 3000);
    } finally {
      setLoadingAvailableGroups(false);
    }
  }, []);

  // Fetch available groups when switching to sync tab
  useEffect(() => {
    if (selectedTabId === "sync") {
      fetchAvailableGroups();
    }
  }, [selectedTabId, fetchAvailableGroups]);

  const handleSyncGeofences = async (forceFullSync = false, groupIds = null) => {
    setShowSyncConfirm(false);

    // Check if already syncing
    if (syncing) {
      notify("A sync is already in progress", "warning", 3000);
      return;
    }

    const isSelectiveSync = groupIds && groupIds.length > 0;
    setSyncing(true);
    setSyncProgress(0);
    setSyncStatusMessage(isSelectiveSync 
      ? `Starting sync for ${groupIds.length} group(s)...` 
      : "Starting full sync...");

    try {
      // Start the async sync job
      const startResponse = await geofenceService.startSyncJob({ 
        forceFullSync, 
        groupIds: isSelectiveSync ? groupIds : null 
      });

      if (!startResponse?.isSuccess || !startResponse?.data?.jobId) {
        throw new Error(startResponse?.message || "Failed to start sync job");
      }

      const jobId = startResponse.data.jobId;
      setSyncJobId(jobId);

      // Show initial notification - user can continue working
      notify(
        isSelectiveSync
          ? `Syncing ${groupIds.length} selected group(s). You can continue working.`
          : `Full sync started${forceFullSync ? " (force)" : ""}. You can continue working.`,
        "info",
        5000
      );

      // Poll until complete (non-blocking - user can still interact with UI)
      const finalJob = await geofenceService.pollSyncJobUntilComplete(
        jobId,
        // Progress callback - update status bar only, no blocking
        (job) => {
          setSyncProgress(job.progressPercent || 0);
          setSyncStatusMessage(
            job.statusMessage ||
            `Syncing... ${job.geofencesSynced || 0} geofences, ${job.groupsSynced || 0} groups`
          );
        },
        2000, // poll every 2 seconds
        180   // max 6 minutes
      );

      // Show success notification
      notify(
        `Sync completed: ${finalJob.geofencesSynced} geofences, ${finalJob.groupsSynced} groups synced`,
        "success",
        5000
      );

      // Refresh data in background
      fetchGeofences();
      fetchGeofenceGroups();
      fetchAvailableGroups();
      setSelectedGroupIds([]); // Clear selection after successful sync
    } catch (error) {
      console.error("Error syncing geofences:", error);
      notify(error.message || "Failed to sync geofences from GPSGate", "error", 5000);
    } finally {
      setSyncing(false);
      setSyncJobId(null);
      setSyncProgress(0);
      setSyncStatusMessage("");
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
      case "sync":
        fetchAvailableGroups();
        break;
      default:
        break;
    }
  };

  const handleSyncSelectedGroups = () => {
    if (selectedGroupIds.length === 0) {
      notify("Please select at least one group to sync", "warning", 3000);
      return;
    }
    handleSyncGeofences(true, selectedGroupIds);
  };

  const handleGroupSelectionChanged = (e) => {
    setSelectedGroupIds(e.selectedRowKeys || []);
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
      {/* LoadPanel only for loading/saving - NOT for syncing (sync is non-blocking) */}
      <LoadPanel
        visible={loading || saving}
        message={saving ? "Saving..." : "Loading..."}
      />

      {/* Non-blocking Sync Progress Banner (visible during sync) */}
      {syncing && (
        <div className="tw-fixed tw-bottom-4 tw-right-4 tw-z-50 tw-bg-white tw-rounded-lg tw-shadow-lg tw-p-4 tw-w-80 tw-border tw-border-blue-200">
          <div className="tw-flex tw-items-center tw-gap-3 tw-mb-2">
            <i className="fa-light fa-arrows-rotate tw-text-blue-600 tw-animate-spin"></i>
            <span className="tw-font-medium tw-text-gray-800">Syncing Geofences</span>
          </div>
          <div className="tw-text-sm tw-text-gray-600 tw-mb-2">
            {syncStatusMessage || "Syncing from GPSGate..."}
          </div>
          <div className="tw-w-full tw-bg-gray-200 tw-rounded-full tw-h-2">
            <div
              className="tw-bg-blue-600 tw-h-2 tw-rounded-full tw-transition-all tw-duration-300"
              style={{ width: `${syncProgress}%` }}
            />
          </div>
          <div className="tw-text-xs tw-text-gray-500 tw-mt-1 tw-text-right">
            {syncProgress}%
          </div>
        </div>
      )}

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

        {selectedTabId === "sync" && (
          <div className="tw-p-4">
            {/* Info banner for selective sync */}
            <div className="tw-bg-amber-50 tw-border tw-border-amber-200 tw-rounded-lg tw-p-4 tw-mb-4 tw-flex tw-items-start tw-gap-3">
              <i className="fa-light fa-lightbulb tw-text-amber-600 tw-text-lg tw-mt-0.5"></i>
              <div>
                <p className="tw-text-sm tw-font-medium tw-text-amber-800">
                  Selective Group Sync
                </p>
                <p className="tw-text-xs tw-text-amber-600 tw-mt-1">
                  Select specific groups below to sync only their geofences. This is faster than syncing everything.
                  Already synced groups show when they were last updated.
                </p>
              </div>
            </div>

            {/* Action bar */}
            <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
              <div className="tw-text-sm tw-text-gray-600">
                {selectedGroupIds.length > 0 
                  ? <span className="tw-font-medium tw-text-blue-600">{selectedGroupIds.length} group(s) selected</span>
                  : "Select groups to sync"}
              </div>
              <div className="tw-flex tw-items-center tw-gap-3">
                <Button
                  text="Sync Selected"
                  icon="fa-light fa-cloud-arrow-down"
                  type="success"
                  stylingMode="contained"
                  onClick={handleSyncSelectedGroups}
                  disabled={syncing || selectedGroupIds.length === 0}
                />
                <Button
                  text="Sync All"
                  icon="fa-light fa-arrows-rotate"
                  type="default"
                  stylingMode="outlined"
                  onClick={() => setShowSyncConfirm(true)}
                  disabled={syncing}
                />
              </div>
            </div>

            <LoadPanel
              visible={loadingAvailableGroups}
              message="Loading groups from GPSGate..."
            />

            <DataGrid
              dataSource={availableGroups}
              keyExpr="externalGroupId"
              showBorders={true}
              showRowLines={true}
              rowAlternationEnabled={true}
              allowColumnResizing={true}
              columnAutoWidth={true}
              height={450}
              selectedRowKeys={selectedGroupIds}
              onSelectionChanged={handleGroupSelectionChanged}
            >
              <SearchPanel visible={true} placeholder="Search groups..." />
              <FilterRow visible={true} />
              <Paging defaultPageSize={15} />
              <Selection mode="multiple" showCheckBoxesMode="always" />

              <Column dataField="name" caption="Group Name" />
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
                dataField="isSynced"
                caption="Synced"
                width={100}
                alignment="center"
                cellRender={(cellData) => (
                  <span
                    className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${
                      cellData.value
                        ? "tw-bg-green-100 tw-text-green-800"
                        : "tw-bg-gray-100 tw-text-gray-600"
                    }`}
                  >
                    {cellData.value ? "Synced" : "Not Synced"}
                  </span>
                )}
              />
              <Column
                dataField="isAllowedForFueling"
                caption="Allowed for Fueling"
                width={140}
                alignment="center"
                cellRender={(cellData) => (
                  cellData.data.isSynced ? (
                    <span className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${
                      cellData.value
                        ? "tw-bg-blue-100 tw-text-blue-800"
                        : "tw-bg-gray-100 tw-text-gray-500"
                    }`}>
                      {cellData.value ? "Yes" : "No"}
                    </span>
                  ) : (
                    <span className="tw-text-gray-400">-</span>
                  )
                )}
              />
              <Column
                dataField="lastSyncedAt"
                caption="Last Synced"
                width={160}
                dataType="datetime"
                format="yyyy-MM-dd HH:mm"
                cellRender={(cellData) => (
                  cellData.value 
                    ? new Date(cellData.value).toLocaleString()
                    : <span className="tw-text-gray-400">Never</span>
                )}
              />
            </DataGrid>
          </div>
        )}
      </div>

      {/* Sync Confirmation Popup */}
      <Popup
        visible={showSyncConfirm}
        onHiding={() => setShowSyncConfirm(false)}
        title="Full Sync - All Geofences"
        width={450}
        height="auto"
        showCloseButton={true}
      >
        <div className="tw-p-4">
          <p className="tw-text-gray-700 tw-mb-3">
            This will sync <strong>all</strong> geofences and groups from GPSGate.
            This may take a few minutes depending on the number of geofences.
          </p>
          <p className="tw-text-sm tw-text-blue-600 tw-mb-4">
            <i className="fa-light fa-lightbulb tw-mr-1"></i>
            Tip: Use the "Sync Groups" tab for faster selective sync.
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
              onClick={() => handleSyncGeofences(false, null)}
            />
            <Button
              text="Full Sync"
              type="success"
              stylingMode="contained"
              onClick={() => handleSyncGeofences(true, null)}
            />
          </div>
        </div>
      </Popup>
    </div>
  );
};

export default GeofenceManagement;
