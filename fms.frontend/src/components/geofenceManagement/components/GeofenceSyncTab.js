/**
 * File: GeofenceSyncTab.js
 * Purpose: Renders selective GPSGate group sync controls for the geofence workbench.
 * Dependencies: React, devextreme-react/button, devextreme-react/load-panel, devextreme-react/data-grid.
 * Last Modified: 2026-03-13
 */
import React from "react";
import { Button } from "devextreme-react/button";
import { LoadPanel } from "devextreme-react/load-panel";
import { DataGrid, Column, FilterRow, Paging, SearchPanel, Selection } from "devextreme-react/data-grid";

const GeofenceSyncTab = ({
  canManage = false,
  availableGroups,
  loadingAvailableGroups,
  onSelectionChanged,
  onSyncAll,
  onSyncSelected,
  selectedGroupIds,
  syncing,
}) => (
  <div className="tw-p-4">
    <div className="tw-space-y-3 tw-mb-4">
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-flex-wrap">
        <div className="tw-text-sm tw-text-gray-600">
          {selectedGroupIds.length > 0
            ? <span className="tw-font-medium tw-text-blue-600">{selectedGroupIds.length} group(s) selected</span>
            : "Select groups to sync"}
        </div>
        <div className="tw-flex tw-items-center tw-gap-3">
          <Button
            text="Sync selected"
            icon="fa-light fa-cloud-arrow-down"
            type="success"
            stylingMode="contained"
            onClick={onSyncSelected}
            disabled={syncing || selectedGroupIds.length === 0 || !canManage}
          />
          <Button
            text="Sync all"
            icon="fa-light fa-arrows-rotate"
            type="default"
            stylingMode="outlined"
            onClick={onSyncAll}
            disabled={syncing || !canManage}
          />
        </div>
      </div>
      <div className="tw-rounded-lg tw-border tw-border-gray-200 tw-bg-gray-50 tw-p-3 tw-text-sm tw-text-gray-600">
        Sync brings GPSGate groups into the shared geofence component so users can assign them during creation and enable them for fueling validation.
      </div>
    </div>

    <LoadPanel visible={loadingAvailableGroups} message="Loading groups from GPSGate..." />

    <DataGrid
      className="geofence-grid"
      dataSource={availableGroups}
      keyExpr="externalGroupId"
      showBorders={true}
      showRowLines={true}
      rowAlternationEnabled={true}
      allowColumnResizing={true}
      columnAutoWidth={true}
      height={450}
      selectedRowKeys={selectedGroupIds}
      onSelectionChanged={onSelectionChanged}
    >
      <SearchPanel visible={true} placeholder="Search groups..." />
      <FilterRow visible={true} />
      <Paging defaultPageSize={15} />
      <Selection mode="multiple" showCheckBoxesMode="always" />

      <Column dataField="name" caption="Group Name" />
      <Column dataField="description" caption="Description" />
      <Column dataField="geofenceCount" caption="Geofences" width={100} alignment="center" />
      <Column
        dataField="colour"
        caption="Color"
        width={80}
        cellRender={(cellData) => (
          <div className="tw-w-6 tw-h-6 tw-rounded tw-border" style={{ backgroundColor: cellData.value || "#808080" }} />
        )}
      />
      <Column
        dataField="isSynced"
        caption="Synced"
        width={100}
        alignment="center"
        cellRender={(cellData) => (
          <span className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${cellData.value ? "tw-bg-green-100 tw-text-green-800" : "tw-bg-gray-100 tw-text-gray-600"}`}>
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
            <span className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${cellData.value ? "tw-bg-blue-100 tw-text-blue-800" : "tw-bg-gray-100 tw-text-gray-500"}`}>
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
);

export default GeofenceSyncTab;
