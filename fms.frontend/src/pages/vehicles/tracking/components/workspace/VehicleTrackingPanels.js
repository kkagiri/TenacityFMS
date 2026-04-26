/**
 * File: VehicleTrackingPanels.js
 * Purpose: Renders the vehicle grid panel and map panel for the vehicle tracking workspace layout
 * Dependencies: React, DevExtreme DataGrid, vehicleTrackingHelpers
 * Last Modified: 2026-03-11
 *
 * Key Components:
 * - VehicleTrackingSidebarPanel: Renders the vehicle grid, search state, and cluster filter banner
 * - VehicleTrackingMapPanel: Renders the map surface, cluster menu, and map loading overlay
 */
import React, { useMemo } from 'react';
import DataGrid, {
  Column,
  ColumnChooser,
  FilterRow,
  Paging,
  Scrolling,
  Selection,
  Sorting,
  StateStoring,
} from 'devextreme-react/data-grid';
import {
  TRACKING_GRID_STATE_STORAGE_KEY,
  formatEngineHours,
  formatTrackingLastSeen,
  formatSpeedKmh,
  mapContainerStyle,
} from '../../utils/vehicleTrackingHelpers';

export const VehicleTrackingSidebarPanel = React.memo(({
  gridDataSource,
  handleTrackingGridContextMenuPreparing,
  handleToggleVehicleTracking,
  handleVehicleClick,
  loading,
  renderStatusCell,
  selectedVehicleId,
  trackedVehicleIds,
  trackingGridRef,
}) => {
  const selectedRowKeys = useMemo(
    () => (selectedVehicleId ? [selectedVehicleId] : []),
    [selectedVehicleId]
  );
  const trackedVehicleIdSet = useMemo(
    () => new Set(trackedVehicleIds || []),
    [trackedVehicleIds]
  );

  return (
    <div className="vehicle-tracking-sidebar tw-flex tw-h-full tw-min-h-0 tw-flex-col tw-bg-white">
      <div className="vehicle-tracking-grid tw-flex-1 tw-min-h-0">
        <DataGrid
          ref={trackingGridRef}
          dataSource={gridDataSource}
          keyExpr="id"
          repaintChangesOnly={true}
          height="100%"
          showBorders={false}
          showColumnLines={true}
          showRowLines={true}
          hoverStateEnabled={true}
          rowAlternationEnabled={false}
          allowColumnReordering={true}
          allowColumnResizing={true}
          columnAutoWidth={true}
          columnResizingMode="widget"
          focusedRowEnabled={false}
          selectedRowKeys={selectedRowKeys}
          noDataText={loading ? 'Loading vehicles...' : 'No vehicles found'}
          onRowClick={(event) => handleVehicleClick(event.data)}
          onContextMenuPreparing={handleTrackingGridContextMenuPreparing}
        >
          <ColumnChooser enabled={true} mode="select" height={420} />
          <Selection mode="single" />
          <Sorting mode="multiple" />
          <FilterRow visible={true} applyFilter="auto" />
          <Scrolling mode="virtual" rowRenderingMode="virtual" showScrollbar="always" />
          <Paging enabled={false} />
          <StateStoring enabled={true} type="localStorage" storageKey={TRACKING_GRID_STATE_STORAGE_KEY} />

          <Column
            name="track"
            caption="Track"
            width={84}
            alignment="center"
            allowSorting={false}
            allowFiltering={false}
            allowHiding={false}
            cellRender={({ data }) => {
              const isTracked = trackedVehicleIdSet.has(data.id);

              return (
                <label
                  className="tw-inline-flex tw-items-center tw-justify-center"
                  onClick={(event) => event.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={isTracked}
                    onChange={(event) => handleToggleVehicleTracking(data.id, event.target.checked)}
                    aria-label={`Track ${data.trackingCode || data.id}`}
                  />
                </label>
              );
            }}
          />
          <Column dataField="trackingCode" caption="Tenacy No" minWidth={110} allowFiltering={true} />
          <Column
            dataField="lastSeenAt"
            caption="Last seen"
            dataType="datetime"
            minWidth={150}
            allowFiltering={false}
            customizeText={({ value }) => formatTrackingLastSeen(value)}
          />
          <Column
            dataField="operationalStatusLabel"
            caption="Status"
            minWidth={110}
            allowFiltering={false}
            cellRender={renderStatusCell}
            calculateSortValue={(rowData) => rowData.statusSortValue}
          />
          <Column dataField="driverNameLabel" caption="Driver Name" minWidth={160} allowFiltering={false} visible={false} />
          <Column
            dataField="engineHoursValue"
            caption="Engine Hours"
            dataType="number"
            minWidth={120}
            alignment="right"
            allowFiltering={false}
            visible={false}
            customizeText={({ value }) => formatEngineHours(value)}
          />
          <Column
            dataField="speedValue"
            caption="Speed"
            dataType="number"
            minWidth={95}
            alignment="right"
            allowFiltering={false}
            visible={false}
            customizeText={({ value }) => formatSpeedKmh(value)}
          />
          <Column dataField="plateNumberLabel" caption="Plate No" minWidth={120} visible={false} allowFiltering={false} />
          <Column
            dataField="headingValue"
            caption="Heading"
            dataType="number"
            minWidth={95}
            alignment="right"
            allowFiltering={false}
            customizeText={({ value }) => `${(value || 0).toFixed(0)}°`}
            visible={false}
          />
          <Column dataField="ignitionLabel" caption="Ignition" minWidth={90} visible={false} allowFiltering={false} />
          <Column dataField="addressLabel" caption="Location" minWidth={220} visible={false} allowFiltering={false} />
        </DataGrid>
      </div>
    </div>
  );
});

export const VehicleTrackingMapPanel = ({
  applyClusterFilter,
  closeClusterContextMenu,
  clusterContextMenu,
  isMapLoaded,
  isMapLoading,
  mapContainerRef,
  mapSectionRef,
}) => (
  <div ref={mapSectionRef} className="tw-relative tw-h-full tw-min-h-0 tw-flex-1">
    <div ref={mapContainerRef} style={mapContainerStyle} className="tw-absolute tw-inset-0" />

    {clusterContextMenu && (
      <div
        className="vehicle-tracking-cluster-menu tw-absolute tw-z-20 tw-w-56 tw-rounded-lg tw-border tw-bg-white tw-shadow-lg"
        style={{ left: clusterContextMenu.x, top: clusterContextMenu.y }}
      >
        <div className="vehicle-tracking-cluster-menu__header tw-border-b tw-px-3 tw-py-2 tw-text-xs tw-font-semibold">
          Cluster actions
        </div>
        <div className="tw-p-2">
          <div className="vehicle-tracking-cluster-menu__summary tw-mb-2 tw-text-xs">
            {clusterContextMenu.count} vehicles in this cluster
          </div>
          <button
            type="button"
            onClick={() => applyClusterFilter(clusterContextMenu.vehicleIds)}
            className="vehicle-tracking-cluster-menu__action tw-flex tw-w-full tw-items-center tw-gap-2 tw-rounded-md tw-px-3 tw-py-2 tw-text-left tw-text-sm"
          >
            <i className="fa-light fa-filter"></i>
            Filter cluster
          </button>
          <button
            type="button"
            onClick={closeClusterContextMenu}
            className="vehicle-tracking-cluster-menu__action tw-mt-1 tw-flex tw-w-full tw-items-center tw-gap-2 tw-rounded-md tw-px-3 tw-py-2 tw-text-left tw-text-sm"
          >
            <i className="fa-light fa-xmark"></i>
            Close
          </button>
        </div>
      </div>
    )}

    {(isMapLoading || !isMapLoaded) && (
      <div className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center tw-bg-gray-100">
        <div className="tw-text-center tw-text-gray-500">
          <i className="fa-light fa-map tw-mb-2 tw-text-4xl"></i>
          <p>Loading map...</p>
        </div>
      </div>
    )}
  </div>
);
