/**
 * File: GeofenceGeofencesTab.js
 * Purpose: Redesigned geofence tab with group sidebar, map view, list view, and edit support.
 * Dependencies: React, devextreme-react/button, devextreme-react/data-grid, GeofenceGroupMapView.
 * Last Modified: 2026-06-10
 *
 * Key Components:
 * - Left sidebar: Group navigation + classification filter
 * - View toggle: Map / List / Split
 * - Map view: Multi-geofence Google Maps (GeofenceGroupMapView)
 * - List view: DataGrid with columns and quick filters
 * - Actions: Create, Edit, Preview, Trip classification, Delete
 */
import React, { useMemo, useState } from "react";
import { Button } from "devextreme-react/button";
import { DataGrid, Column, FilterRow, Paging, SearchPanel, Selection } from "devextreme-react/data-grid";
import GeofenceGroupMapView from "./GeofenceGroupMapView";
import GeofenceDrawingMap from "../GeofenceDrawingMap";

const VIEW_MODES = [
  { id: "split", icon: "fa-light fa-table-columns", title: "Split view" },
  { id: "map", icon: "fa-light fa-map", title: "Map view" },
  { id: "list", icon: "fa-light fa-list", title: "List view" },
];

const CLASSIFICATION_FILTERS = [
  { id: "all", label: "All" },
  { id: "Fuel", label: "Fuel", icon: "fa-light fa-gas-pump" },
  { id: "Load", label: "Load", icon: "fa-light fa-truck-loading" },
  { id: "Dump", label: "Dump", icon: "fa-light fa-dumpster" },
  { id: "Parking", label: "Parking", icon: "fa-light fa-square-parking" },
  { id: "Workshop", label: "Workshop", icon: "fa-light fa-wrench" },
  { id: "Unknown", label: "Unknown" },
];

const CLASSIFICATION_BADGE_MAP = {
  Parking: { bg: "tw-bg-purple-100", text: "tw-text-purple-800", icon: "fa-light fa-square-parking" },
  Load: { bg: "tw-bg-orange-100", text: "tw-text-orange-800", icon: "fa-light fa-truck-loading" },
  Dump: { bg: "tw-bg-yellow-100", text: "tw-text-yellow-800", icon: "fa-light fa-dumpster" },
  Fuel: { bg: "tw-bg-amber-100", text: "tw-text-amber-800", icon: "fa-light fa-gas-pump" },
  Workshop: { bg: "tw-bg-teal-100", text: "tw-text-teal-800", icon: "fa-light fa-wrench" },
};

const renderClassificationCell = (cellData) => {
  const classification = cellData.value || "Unknown";
  const badge = CLASSIFICATION_BADGE_MAP[classification];
  if (!badge) {
    return <span className="tw-text-gray-400 tw-text-xs">Unknown</span>;
  }
  return (
    <span className={`tw-inline-flex tw-items-center tw-gap-1 tw-rounded-full ${badge.bg} tw-px-2 tw-py-1 tw-text-xs tw-font-medium ${badge.text}`}>
      <i className={badge.icon}></i>
      {classification}
    </span>
  );
};

const renderUsageBadges = (cellData) => {
  const geofence = cellData.data || {};
  const fuelingGroupNames = Array.isArray(geofence.fuelingGroupNames) ? geofence.fuelingGroupNames : [];
  const tripClassificationLabel = geofence.tripClassificationLabel || geofence.siteName || null;

  return (
    <div className="tw-flex tw-flex-wrap tw-gap-1.5 tw-py-1">
      {geofence.isUsedForFuelValidation ? (
        <span
          className="tw-inline-flex tw-items-center tw-gap-1 tw-rounded-full tw-bg-amber-100 tw-px-2 tw-py-1 tw-text-xs tw-font-medium tw-text-amber-800"
          title={fuelingGroupNames.length ? `Fuel validation groups: ${fuelingGroupNames.join(", ")}` : "Used by an allowed fueling group"}
        >
          <i className="fa-light fa-gas-pump"></i>
          Fuel
        </span>
      ) : (
        <span className="tw-inline-flex tw-items-center tw-gap-1 tw-rounded-full tw-bg-slate-100 tw-px-2 tw-py-0.5 tw-text-[10px] tw-font-medium tw-text-slate-400">
          <i className="fa-light fa-gas-pump"></i>
          No fuel
        </span>
      )}

      {geofence.isUsedForTripClassification ? (
        <span
          className="tw-inline-flex tw-items-center tw-gap-1 tw-rounded-full tw-bg-blue-100 tw-px-2 tw-py-1 tw-text-xs tw-font-medium tw-text-blue-800"
          title={tripClassificationLabel ? `Trip classification site: ${tripClassificationLabel}` : "Linked to trip classification"}
        >
          <i className="fa-light fa-route"></i>
          Trip
        </span>
      ) : (
        <span className="tw-inline-flex tw-items-center tw-gap-1 tw-rounded-full tw-bg-slate-100 tw-px-2 tw-py-0.5 tw-text-[10px] tw-font-medium tw-text-slate-400">
          <i className="fa-light fa-route"></i>
          No trip
        </span>
      )}
    </div>
  );
};

const GeofenceGeofencesTab = ({
  deleting,
  geofences,
  geofenceGroups = [],
  isCreating,
  createGeofenceType,
  createShape,
  onCreateShapeChange,
  createMapViewport,
  onCreate,
  onCancelCreate,
  onDelete,
  onEdit,
  onPreview,
  onSelectionChanged,
  onWorksite,
  renderActiveCell,
  renderGeofenceTypeCell,
  selectedGeofence,
  selectedGeofenceIds,
}) => {
  const [viewMode, setViewMode] = useState("list");
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [classificationFilter, setClassificationFilter] = useState("all");

  // Filter geofences by selected group
  const groupFilteredGeofences = useMemo(() => {
    if (!selectedGroupId) return geofences;

    const group = geofenceGroups.find((g) => g.id === selectedGroupId);
    if (!group || !Array.isArray(group.geofences)) return geofences;

    const groupGeofenceIds = new Set(group.geofences.map((gf) => Number(gf.id)));
    return geofences.filter((gf) => groupGeofenceIds.has(Number(gf.id)));
  }, [geofences, geofenceGroups, selectedGroupId]);

  // Then filter by classification
  const filteredGeofences = useMemo(() => {
    if (classificationFilter === "all") return groupFilteredGeofences;
    return groupFilteredGeofences.filter((gf) => (gf.classification || "Unknown") === classificationFilter);
  }, [groupFilteredGeofences, classificationFilter]);

  // Classification counts for pills
  const classificationCounts = useMemo(() => {
    const counts = { all: groupFilteredGeofences.length };
    CLASSIFICATION_FILTERS.forEach((f) => {
      if (f.id !== "all") {
        counts[f.id] = groupFilteredGeofences.filter((gf) => (gf.classification || "Unknown") === f.id).length;
      }
    });
    return counts;
  }, [groupFilteredGeofences]);

  const selectedGroupObj = geofenceGroups.find((g) => g.id === selectedGroupId) || null;

  const handleMapGeofenceClick = (geofence) => {
    if (onSelectionChanged) {
      onSelectionChanged({ selectedRowKeys: [geofence.id] });
    }
  };

  const showMap = !isCreating && (viewMode === "map" || viewMode === "split");
  const showList = !isCreating && (viewMode === "list" || viewMode === "split");

  return (
    <div className="tw-flex tw-h-full" style={{ minHeight: 600 }}>
      {/* ── Left Sidebar: Groups ── */}
      <div className="tw-w-[220px] tw-flex-shrink-0 tw-border-r tw-border-gray-200 tw-bg-[#faf9f8] tw-overflow-y-auto">
        <div className="tw-px-3 tw-pt-3 tw-pb-2">
          <div className="tw-text-[11px] tw-font-semibold tw-text-gray-500 tw-uppercase tw-tracking-wide tw-mb-2">Groups</div>
          <button
            type="button"
            onClick={() => setSelectedGroupId(null)}
            className={`tw-w-full tw-text-left tw-px-2.5 tw-py-2 tw-rounded tw-text-[13px] tw-transition-colors tw-mb-0.5 tw-flex tw-items-center tw-justify-between ${selectedGroupId === null ? "tw-bg-[#deecf9] tw-text-[#0078d4] tw-font-medium" : "tw-text-gray-700 hover:tw-bg-gray-100"}`}
          >
            <span className="tw-flex tw-items-center tw-gap-1.5">
              <i className="fa-light fa-globe tw-text-xs"></i>
              All geofences
            </span>
            <span className="tw-text-[11px] tw-text-gray-400">{geofences.length}</span>
          </button>

          {geofenceGroups.map((group) => {
            const isSelected = selectedGroupId === group.id;
            const count = Array.isArray(group.geofences) ? group.geofences.length : (group.geofenceCount || 0);
            return (
              <button
                key={group.id}
                type="button"
                onClick={() => setSelectedGroupId(group.id)}
                className={`tw-w-full tw-text-left tw-px-2.5 tw-py-2 tw-rounded tw-text-[13px] tw-transition-colors tw-mb-0.5 tw-flex tw-items-center tw-justify-between tw-gap-1 ${isSelected ? "tw-bg-[#deecf9] tw-text-[#0078d4] tw-font-medium" : "tw-text-gray-700 hover:tw-bg-gray-100"}`}
              >
                <span className="tw-flex tw-items-center tw-gap-1.5 tw-min-w-0">
                  {group.colour && (
                    <span className="tw-w-2.5 tw-h-2.5 tw-rounded-full tw-flex-shrink-0 tw-border tw-border-gray-300" style={{ backgroundColor: group.colour }} />
                  )}
                  <span className="tw-truncate">{group.name}</span>
                  {group.isAllowedForFueling && (
                    <i className="fa-light fa-gas-pump tw-text-[10px] tw-text-amber-600 tw-flex-shrink-0" title="Fueling enabled"></i>
                  )}
                </span>
                <span className="tw-text-[11px] tw-text-gray-400 tw-flex-shrink-0">{count}</span>
              </button>
            );
          })}

          {geofenceGroups.length === 0 && (
            <p className="tw-text-xs tw-text-gray-400 tw-px-2 tw-py-3">No groups synced yet.</p>
          )}
        </div>

        {/* Classification filter in sidebar */}
        <div className="tw-px-3 tw-pt-2 tw-pb-3 tw-border-t tw-border-gray-200">
          <div className="tw-text-[11px] tw-font-semibold tw-text-gray-500 tw-uppercase tw-tracking-wide tw-mb-2">Classification</div>
          {CLASSIFICATION_FILTERS.map((filter) => {
            const count = classificationCounts[filter.id] || 0;
            const isActive = classificationFilter === filter.id;
            if (filter.id !== "all" && count === 0) return null;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setClassificationFilter(filter.id)}
                className={`tw-w-full tw-text-left tw-px-2.5 tw-py-1.5 tw-rounded tw-text-[13px] tw-transition-colors tw-mb-0.5 tw-flex tw-items-center tw-justify-between ${isActive ? "tw-bg-[#deecf9] tw-text-[#0078d4] tw-font-medium" : "tw-text-gray-700 hover:tw-bg-gray-100"}`}
              >
                <span className="tw-flex tw-items-center tw-gap-1.5">
                  {filter.icon && <i className={`${filter.icon} tw-text-xs`}></i>}
                  {filter.label}
                </span>
                <span className="tw-text-[11px] tw-text-gray-400">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="tw-flex-1 tw-min-w-0 tw-flex tw-flex-col">
        {/* Toolbar */}
        <div className="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-px-4 tw-py-2.5 tw-border-b tw-border-gray-200 tw-flex-wrap">
          <div className="tw-flex tw-items-center tw-gap-3">
            {/* Group context */}
            <div className="tw-text-sm tw-text-gray-700">
              {selectedGroupObj ? (
                <span className="tw-flex tw-items-center tw-gap-1.5">
                  {selectedGroupObj.colour && <span className="tw-w-3 tw-h-3 tw-rounded-full tw-border tw-border-gray-300" style={{ backgroundColor: selectedGroupObj.colour }} />}
                  <span className="tw-font-medium">{selectedGroupObj.name}</span>
                  {selectedGroupObj.isAllowedForFueling && (
                    <span className="tw-inline-flex tw-items-center tw-gap-0.5 tw-rounded-full tw-bg-amber-100 tw-px-1.5 tw-py-0.5 tw-text-[10px] tw-font-medium tw-text-amber-800">
                      <i className="fa-light fa-gas-pump"></i> Fueling enabled
                    </span>
                  )}
                  <span className="tw-text-gray-400">•</span>
                  <span className="tw-text-gray-500">{filteredGeofences.length} geofences</span>
                </span>
              ) : (
                <span>
                  <span className="tw-font-medium">All geofences</span>
                  <span className="tw-text-gray-400 tw-ml-2">• {filteredGeofences.length} shown</span>
                </span>
              )}
            </div>

            {/* View mode toggle */}
            <div className="tw-flex tw-items-center tw-rounded tw-border tw-border-gray-300 tw-bg-white tw-overflow-hidden">
              {VIEW_MODES.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setViewMode(mode.id)}
                  title={mode.title}
                  className={`tw-px-2.5 tw-py-1.5 tw-text-[13px] tw-transition-colors tw-border-none ${viewMode === mode.id ? "tw-bg-[#0078d4] tw-text-white" : "tw-bg-white tw-text-gray-600 hover:tw-bg-gray-50"}`}
                >
                  <i className={mode.icon}></i>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="tw-flex tw-items-center tw-gap-2 tw-flex-wrap">
            {isCreating ? (
              <Button text="Cancel drawing" icon="fa-light fa-xmark" stylingMode="outlined" type="normal" onClick={onCancelCreate} />
            ) : (
              <Button text="Create" icon="fa-light fa-plus" type="default" stylingMode="contained" onClick={onCreate} />
            )}
            <Button text="Edit" icon="fa-light fa-pen-to-square" stylingMode="outlined" onClick={onEdit} disabled={!selectedGeofence} />
            <Button text="Preview" icon="fa-light fa-map-location-dot" stylingMode="outlined" onClick={onPreview} disabled={!selectedGeofence} />
            <Button text="Trip class." icon="fa-light fa-industry-windows" stylingMode="outlined" onClick={onWorksite} disabled={!selectedGeofence} />
            <Button text={deleting ? "Deleting..." : "Delete"} icon="fa-light fa-trash" stylingMode="outlined" type="danger" onClick={onDelete} disabled={!selectedGeofence || deleting} />
          </div>
        </div>

        {/* Content area */}
        <div className="tw-flex-1 tw-overflow-auto tw-p-4">
          {/* Drawing map when creating */}
          {isCreating && (
            <GeofenceDrawingMap
              geofenceType={createGeofenceType || "Circle"}
              centerLatitude={createShape?.centerLatitude}
              centerLongitude={createShape?.centerLongitude}
              radiusMeters={createShape?.radiusMeters}
              coordinates={createShape?.coordinates || []}
              height={560}
              initialViewport={createMapViewport}
              onShapeChange={onCreateShapeChange}
            />
          )}

          {/* Map view */}
          {showMap && (
            <div className={showList ? "tw-mb-4" : ""}>
              <GeofenceGroupMapView
                geofences={filteredGeofences}
                selectedGeofenceId={selectedGeofence?.id || null}
                onGeofenceClick={handleMapGeofenceClick}
                height={showList ? 300 : 500}
              />
            </div>
          )}

          {/* List view */}
          {showList && (
            <DataGrid
              className="geofence-grid"
              dataSource={filteredGeofences}
              keyExpr="id"
              showBorders={true}
              showRowLines={true}
              rowAlternationEnabled={true}
              allowColumnResizing={true}
              columnAutoWidth={true}
              height={showMap ? 340 : 520}
              selectedRowKeys={selectedGeofenceIds}
              onSelectionChanged={onSelectionChanged}
            >
              <SearchPanel visible={true} placeholder="Search geofences..." />
              <FilterRow visible={true} />
              <Paging defaultPageSize={15} />
              <Selection mode="single" />

              <Column dataField="name" caption="Name" />
              <Column dataField="classification" caption="Classification" width={130} cellRender={renderClassificationCell} />
              <Column caption="Usage" minWidth={180} cellRender={renderUsageBadges} />
              <Column dataField="geofenceType" caption="Type" width={110} cellRender={renderGeofenceTypeCell} />
              <Column dataField="description" caption="Description" visible={false} />
              <Column dataField="centerLatitude" caption="Lat" width={100} format={{ type: "fixedPoint", precision: 6 }} />
              <Column dataField="centerLongitude" caption="Lng" width={100} format={{ type: "fixedPoint", precision: 6 }} />
              <Column dataField="radiusMeters" caption="Radius" width={80} format={{ type: "fixedPoint", precision: 0 }} />
              <Column dataField="isActive" caption="Status" width={90} cellRender={renderActiveCell} />
              <Column dataField="lastSyncedAt" caption="Last Synced" width={150} dataType="datetime" format="yyyy-MM-dd HH:mm" />
            </DataGrid>
          )}

          {/* Empty state */}
          {!isCreating && filteredGeofences.length === 0 && (
            <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-py-12 tw-text-gray-500">
              <i className="fa-light fa-map-location-dot tw-text-4xl tw-text-gray-300 tw-mb-3"></i>
              <p className="tw-text-sm tw-font-medium tw-mb-1">No geofences found</p>
              <p className="tw-text-xs tw-text-gray-400">
                {selectedGroupId ? "This group has no geofences matching the current filter." : "Sync from GPSGate or create a new geofence to get started."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeofenceGeofencesTab;
