/**
 * File: GeofenceGroupsTab.js
 * Purpose: Renders fueling-group policy and membership management for geofence groups with map preview.
 * Dependencies: React, devextreme-react/button, devextreme-react/data-grid, GeofenceGroupMapView.
 * Last Modified: 2026-06-10
 */
import React, { useMemo, useState } from "react";
import { Button } from "devextreme-react/button";
import { DataGrid, Column, FilterRow, Paging, SearchPanel, Selection } from "devextreme-react/data-grid";
import GeofenceGroupMapView from "./GeofenceGroupMapView";

const QUICK_FILTERS = [
  { id: "all", label: "All groups" },
  { id: "fueling", label: "Fueling enabled" },
  { id: "general", label: "General purpose" },
  { id: "empty", label: "No geofences" },
];

const GeofenceGroupsTab = ({
  geofenceGroups,
  geofences = [],
  onCreateGroup,
  onEditGroup,
  onSelectionChanged,
  renderActiveCell,
  renderAllowedForFuelingCell,
  selectedGroup,
  selectedGroupIds,
}) => {
  const [quickFilterId, setQuickFilterId] = useState("all");
  const [showGroupMap, setShowGroupMap] = useState(false);

  const filteredGroups = useMemo(() => {
    switch (quickFilterId) {
      case "fueling":
        return geofenceGroups.filter((group) => Boolean(group.isAllowedForFueling));
      case "general":
        return geofenceGroups.filter((group) => !group.isAllowedForFueling);
      case "empty":
        return geofenceGroups.filter((group) => Number(group.geofenceCount || 0) === 0);
      case "all":
      default:
        return geofenceGroups;
    }
  }, [geofenceGroups, quickFilterId]);

  // Geofences belonging to the selected group (for map view)
  const groupGeofences = useMemo(() => {
    if (!selectedGroup || !Array.isArray(selectedGroup.geofences)) return [];
    const groupGeofenceIds = new Set(selectedGroup.geofences.map((gf) => Number(gf.id)));
    return geofences.filter((gf) => groupGeofenceIds.has(Number(gf.id)));
  }, [selectedGroup, geofences]);

  return (
  <div className="tw-p-4">
    <div className="tw-mb-4 tw-grid tw-grid-cols-1 lg:tw-grid-cols-[minmax(0,1fr)_auto] tw-gap-3 tw-items-start">
      <div className="tw-space-y-3">
        <div className="tw-text-sm tw-text-gray-600">
          {selectedGroup
            ? <span>Selected group: <span className="tw-font-semibold tw-text-gray-900">{selectedGroup.name}</span></span>
            : "Select a group to edit memberships or fueling policy."}
        </div>
        <div className="tw-rounded-lg tw-border tw-border-amber-200 tw-bg-amber-50 tw-p-3 tw-text-sm tw-text-amber-800">
          Allowed-for-fueling groups are the route and zone sets used during fueling validation. Group membership is configured here and during geofence creation.
        </div>
        <div className="tw-flex tw-flex-wrap tw-gap-2">
          {QUICK_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setQuickFilterId(filter.id)}
              className={`tw-inline-flex tw-items-center tw-rounded-full tw-border tw-px-3 tw-py-1.5 tw-text-xs tw-font-medium tw-transition-colors ${quickFilterId === filter.id ? "tw-border-amber-300 tw-bg-amber-100 tw-text-amber-800" : "tw-border-gray-200 tw-bg-white tw-text-gray-600 hover:tw-border-gray-300 hover:tw-text-gray-800"}`}
            >
              {filter.label}
            </button>
          ))}
          <span className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-gray-100 tw-px-3 tw-py-1.5 tw-text-xs tw-font-medium tw-text-gray-600">
            {filteredGroups.length} shown
          </span>
        </div>
      </div>

      <div className="tw-flex tw-items-center tw-gap-2 tw-flex-wrap tw-justify-end">
        <Button text="New group" icon="fa-light fa-plus" type="default" stylingMode="contained" onClick={onCreateGroup} />
        <Button text="Edit group" icon="fa-light fa-pen-to-square" stylingMode="outlined" onClick={onEditGroup} disabled={!selectedGroup} />
        <Button
          text={showGroupMap ? "Hide map" : "View on map"}
          icon={showGroupMap ? "fa-light fa-map-xmark" : "fa-light fa-map"}
          stylingMode="outlined"
          onClick={() => setShowGroupMap(!showGroupMap)}
          disabled={!selectedGroup}
        />
      </div>
    </div>

    {/* Group geofences map view */}
    {showGroupMap && selectedGroup && (
      <div className="tw-mb-4">
        <div className="tw-flex tw-items-center tw-gap-2 tw-mb-2">
          <span className="tw-text-sm tw-font-medium tw-text-gray-700">
            <i className="fa-light fa-map tw-mr-1 tw-text-blue-600"></i>
            Geofences in "{selectedGroup.name}"
          </span>
          <span className="tw-text-xs tw-text-gray-400">({groupGeofences.length} geofences)</span>
        </div>
        {groupGeofences.length > 0 ? (
          <GeofenceGroupMapView geofences={groupGeofences} height={320} />
        ) : (
          <div className="tw-flex tw-items-center tw-justify-center tw-bg-gray-50 tw-border tw-border-gray-200 tw-rounded-lg tw-text-sm tw-text-gray-500 tw-py-8">
            <i className="fa-light fa-map tw-text-gray-300 tw-mr-2"></i>
            This group has no geofences to display on the map.
          </div>
        )}
      </div>
    )}

    <DataGrid
      className="geofence-grid"
      dataSource={filteredGroups}
      keyExpr="id"
      showBorders={true}
      showRowLines={true}
      rowAlternationEnabled={true}
      allowColumnResizing={true}
      columnAutoWidth={true}
      height={500}
      selectedRowKeys={selectedGroupIds}
      onSelectionChanged={onSelectionChanged}
    >
      <SearchPanel visible={true} placeholder="Search groups..." />
      <FilterRow visible={true} />
      <Paging defaultPageSize={15} />
      <Selection mode="single" />

      <Column dataField="isAllowedForFueling" caption="Allowed for Fueling" width={150} alignment="center" cellRender={renderAllowedForFuelingCell} />
      <Column dataField="name" caption="Name" />
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
      <Column dataField="isActive" caption="Status" width={100} cellRender={renderActiveCell} />
      <Column dataField="lastSyncedAt" caption="Last Synced" width={160} dataType="datetime" format="yyyy-MM-dd HH:mm" />
    </DataGrid>
  </div>
  );
};

export default GeofenceGroupsTab;
