/**
 * File: PumpTransactionManager.js
 * Purpose: UI component for pump transaction management
 * Dependencies: react, devextreme-react, usePumpTransactionManager hook
 * Last Modified: 2026-01-22
 * 
 * Fix: DOM removeChild error when clicking map buttons
 * - Added transition state to prevent rapid popup opening/closing
 * - Delayed iframe unmounting to allow popup animation to complete
 * - Added unique key to iframe for proper React reconciliation
 * - Disabled map buttons during transitions
 */
import React from "react";
import DataGrid, {
  Column,
  Grouping,
  Summary,
  TotalItem,
  GroupItem,
} from "devextreme-react/data-grid";
import { Button } from "devextreme-react/button";
import { ScrollView } from "devextreme-react/scroll-view";
import { SelectBox, TagBox } from "devextreme-react";
import Popup from "devextreme-react/popup";
import usePumpTransactionManager from "./usePumpTransactionManager";
import PumpTransactionGroupingControls from "./PumpTransactionGroupingControls";
import "./PumpTransactionManager.scss";

const PumpTransactionManager = () => {
  const {
    // Refs
    dataGridRef,

    // State
    filterPanelVisible,
    clientFilters,
    groupBy,
    isGroupsExpanded,
    hasActiveGrouping,
    includeTransfers,
    setIncludeTransfers,

    // Data
    pumpTransactions,
    pumpTransactionsLoading,
    pumpTransactionsLastFetch,
    pumpTransactionsFilters,
    filteredTransactions,
    filterOptions,
    summaryStats,
    processingStatusOptions,

    // Handlers
    handleGroupByChange,
    handleClearGrouping,
    handleToggleExpandGroups,
    handleResetFilters,
    toggleFilterPanel,
    setFilterPanelVisible,
    updateClientFilter,
    onToolbarPreparing,
    groupCellRenderDate,
  } = usePumpTransactionManager();

  const [mapPopupVisible, setMapPopupVisible] = React.useState(false);
  const [mapTransaction, setMapTransaction] = React.useState(null);
  const [mapPopupTransitioning, setMapPopupTransitioning] = React.useState(false);
  const mapCleanupTimeoutRef = React.useRef(null);

  const normalizeCoordinate = React.useCallback((value) => {
    if (value === null || value === undefined) return null;
    const parsed = typeof value === "string" ? parseFloat(value) : value;
    return Number.isFinite(parsed) ? parsed : null;
  }, []);

  const resolveFuelingLocation = React.useCallback(
    (transaction) => {
      if (!transaction) return null;

      const fuelingLatitude = normalizeCoordinate(transaction.fuelingLatitude);
      const fuelingLongitude = normalizeCoordinate(transaction.fuelingLongitude);

      if (fuelingLatitude !== null && fuelingLongitude !== null) {
        return {
          lat: fuelingLatitude,
          lng: fuelingLongitude,
          label: "Fueling (Mobile)",
        };
      }

      const siteLatitude = normalizeCoordinate(transaction.siteLatitude);
      const siteLongitude = normalizeCoordinate(transaction.siteLongitude);

      if (siteLatitude !== null && siteLongitude !== null) {
        return {
          lat: siteLatitude,
          lng: siteLongitude,
          label: "Site (Fallback)",
        };
      }

      return null;
    },
    [normalizeCoordinate]
  );

  const handleOpenMapPopup = React.useCallback((transaction) => {
    // Prevent opening if already transitioning
    if (mapPopupTransitioning) {
      return;
    }
    
    // Clear any pending cleanup timeout
    if (mapCleanupTimeoutRef.current) {
      clearTimeout(mapCleanupTimeoutRef.current);
      mapCleanupTimeoutRef.current = null;
    }
    
    setMapPopupTransitioning(true);
    setMapTransaction(transaction);
    setMapPopupVisible(true);
    
    // Reset transitioning flag after popup is shown
    setTimeout(() => {
      setMapPopupTransitioning(false);
    }, 300);
  }, [mapPopupTransitioning]);

  const handleCloseMapPopup = React.useCallback(() => {
    // Prevent closing if already transitioning
    if (mapPopupTransitioning) {
      return;
    }
    
    setMapPopupTransitioning(true);
    setMapPopupVisible(false);
    
    // Delay clearing mapTransaction to allow popup animation to complete
    // This prevents React from trying to unmount iframe during animation
    mapCleanupTimeoutRef.current = setTimeout(() => {
      setMapTransaction(null);
      mapCleanupTimeoutRef.current = null;
      setMapPopupTransitioning(false);
    }, 300); // Match DevExtreme popup animation duration
  }, [mapPopupTransitioning]);

  // Cleanup effect for component unmount
  React.useEffect(() => {
    return () => {
      if (mapCleanupTimeoutRef.current) {
        clearTimeout(mapCleanupTimeoutRef.current);
      }
    };
  }, []);

  const mapLocation = resolveFuelingLocation(mapTransaction);
  const mapUrl = mapLocation
    ? `https://www.google.com/maps?q=${mapLocation.lat},${mapLocation.lng}&z=16&output=embed`
    : null;

  return (
    <div className="pump-transaction-manager">
      {/* Header with summary information */}
      <SummaryHeader
        summaryStats={summaryStats}
        filterPanelVisible={filterPanelVisible}
        toggleFilterPanel={toggleFilterPanel}
        pumpTransactionsLastFetch={pumpTransactionsLastFetch}
        pumpTransactionsFilters={pumpTransactionsFilters}
        includeTransfers={includeTransfers}
        setIncludeTransfers={setIncludeTransfers}
      />

      {/* Inline Filter Panel */}
      {filterPanelVisible && (
        <FilterPanel
          pumpTransactions={pumpTransactions}
          filteredTransactions={filteredTransactions}
          filterOptions={filterOptions}
          clientFilters={clientFilters}
          processingStatusOptions={processingStatusOptions}
          updateClientFilter={updateClientFilter}
          handleResetFilters={handleResetFilters}
          setFilterPanelVisible={setFilterPanelVisible}
        />
      )}

      {/* DataGrid */}
      <TransactionDataGrid
        dataGridRef={dataGridRef}
        filteredTransactions={filteredTransactions}
        pumpTransactionsLoading={pumpTransactionsLoading}
        isGroupsExpanded={isGroupsExpanded}
        onToolbarPreparing={onToolbarPreparing}
        groupCellRenderDate={groupCellRenderDate}
        onOpenMapPopup={handleOpenMapPopup}
        resolveFuelingLocation={resolveFuelingLocation}
        mapPopupTransitioning={mapPopupTransitioning}
      />

      {/* Grouping Controls Panel */}
      <PumpTransactionGroupingControls
        groupBy={groupBy}
        hasActiveGrouping={hasActiveGrouping}
        isGroupsExpanded={isGroupsExpanded}
        onGroupByChange={handleGroupByChange}
        onClearGrouping={handleClearGrouping}
        onToggleExpandGroups={handleToggleExpandGroups}
      />

      <Popup
        visible={mapPopupVisible}
        onHiding={handleCloseMapPopup}
        title={`Fueling Location${mapTransaction?.vehicleName ? ` - ${mapTransaction.vehicleName}` : ''}`}
        showCloseButton={true}
        width="80vw"
        height="80vh"
        maxWidth={1200}
        maxHeight={800}
        dragEnabled={true}
        resizeEnabled={true}
      >
        <div className="pump-transaction-map-popup">
          {mapLocation && mapPopupVisible ? (
            <>
              <div className="tw-mb-3 tw-text-sm tw-text-gray-700 tw-flex tw-items-center tw-justify-between tw-flex-wrap tw-gap-2">
                <span>
                  <i className={`fa-light ${mapLocation.label.includes('Mobile') ? 'fa-mobile' : 'fa-location-dot'} tw-mr-2`}></i>
                  {mapLocation.label} • {mapLocation.lat.toFixed(6)}, {mapLocation.lng.toFixed(6)}
                </span>
                <a
                  href={`https://www.google.com/maps?q=${mapLocation.lat},${mapLocation.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tw-text-blue-600 hover:tw-text-blue-800 tw-text-xs"
                >
                  <i className="fa-light fa-external-link tw-mr-1"></i>
                  Open in Google Maps
                </a>
              </div>
              <iframe
                key={`map-${mapTransaction?.id || 'default'}`}
                title="Fueling Location Map"
                className="pump-transaction-map-frame"
                src={mapUrl}
                loading="lazy"
                allowFullScreen
                style={{ minHeight: '400px' }}
              />
            </>
          ) : (
            <div className="tw-text-sm tw-text-gray-500 tw-p-4 tw-text-center">
              <i className="fa-light fa-map-location-slash tw-text-4xl tw-mb-3 tw-text-gray-400"></i>
              <p>No fueling location available for this transaction.</p>
              <p className="tw-text-xs tw-mt-2">Location data is captured when fueling is authorized from the mobile app.</p>
            </div>
          )}
        </div>
      </Popup>
    </div>
  );
};

// ============================================================================
// Sub-components
// ============================================================================

/**
 * Summary Header Component
 */
const SummaryHeader = ({
  summaryStats,
  filterPanelVisible,
  toggleFilterPanel,
  pumpTransactionsLastFetch,
  pumpTransactionsFilters,
  includeTransfers,
  setIncludeTransfers,
}) => (
  <div className="tw-mb-4 tw-p-4 tw-bg-gray-50 tw-rounded-lg">
    <div className="tw-flex tw-justify-between tw-items-center tw-mb-2">
      <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800">
        <i className="fa-light fa-gas-pump tw-mr-2"></i>
        Pump Transactions
      </h3>
      <div className="tw-flex tw-items-center tw-gap-4">
        {/* Include Transfers Checkbox */}
        <label className="tw-flex tw-items-center tw-gap-2 tw-cursor-pointer tw-text-sm">
          <input
            type="checkbox"
            checked={includeTransfers}
            onChange={(e) => setIncludeTransfers(e.target.checked)}
            className="tw-w-4 tw-h-4 tw-accent-purple-600"
          />
          <span className="tw-text-gray-700">
            <i className="fa-light fa-exchange-alt tw-mr-1 tw-text-purple-600"></i>
            Include Tank Transfers
          </span>
        </label>
        <Button
          text={filterPanelVisible ? "Hide Filters" : "Show Filters"}
          icon={
            filterPanelVisible
              ? "fa-light fa-chevron-up"
              : "fa-light fa-filter"
          }
          type="default"
          stylingMode="outlined"
          onClick={toggleFilterPanel}
        />
      </div>
    </div>

    {/* Summary Cards */}
    <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-4 tw-text-sm tw-mb-4">
      <div className="summary-card">
        <div className="summary-value">{summaryStats.totalTransactions}</div>
        <div className="summary-label">Total Transactions</div>
      </div>
      <div className="summary-card">
        <div className="summary-value">
          {summaryStats.totalVolume.toFixed(2)}L
        </div>
        <div className="summary-label">Total Volume</div>
      </div>
      <div className="summary-card">
        <div className="tw-flex tw-justify-between tw-items-center">
          <div>
            <span className="tw-text-green-600 tw-font-semibold">
              {summaryStats.processedCount}
            </span>
            <span className="tw-mx-1">/</span>
            <span className="tw-text-yellow-600 tw-font-semibold">
              {summaryStats.pendingCount}
            </span>
          </div>
        </div>
        <div className="summary-label">Processed / Pending</div>
      </div>
    </div>

    {/* Additional Info */}
    <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-4 tw-text-sm">
      <div className="tw-flex tw-items-center tw-gap-2">
        <span className="tw-text-gray-600">Unique Vehicles:</span>
        <span className="tw-font-medium">{summaryStats.uniqueVehicles}</span>
      </div>
      <div className="tw-flex tw-items-center tw-gap-2">
        <span className="tw-text-gray-600">Unique Tanks:</span>
        <span className="tw-font-medium">{summaryStats.uniqueTanks}</span>
      </div>
      {pumpTransactionsLastFetch && (
        <div className="tw-flex tw-items-center tw-gap-2">
          <span className="tw-text-gray-600">Last Updated:</span>
          <span className="tw-font-medium tw-text-xs">
            {new Date(pumpTransactionsLastFetch).toLocaleString()}
          </span>
        </div>
      )}
    </div>

    {/* Active Filters Display */}
    {pumpTransactionsFilters && (
      <div className="tw-mt-3 tw-flex tw-items-center tw-gap-2">
        <span className="tw-text-gray-600 tw-text-sm">Active Filters:</span>
        <div className="tw-flex tw-flex-wrap tw-gap-1">
          {Object.entries(pumpTransactionsFilters).map(([key, value]) => (
            <span
              key={key}
              className="tw-px-2 tw-py-1 tw-bg-blue-100 tw-text-blue-800 tw-rounded tw-text-xs"
            >
              {key}:{" "}
              {value instanceof Date
                ? value.toLocaleDateString()
                : String(value)}
            </span>
          ))}
        </div>
      </div>
    )}
  </div>
);

/**
 * Filter Panel Component
 */
const FilterPanel = ({
  pumpTransactions,
  filteredTransactions,
  filterOptions,
  clientFilters,
  processingStatusOptions,
  updateClientFilter,
  handleResetFilters,
  setFilterPanelVisible,
}) => (
  <div className="tw-mb-4 tw-p-4 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg">
    <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
      <h4 className="tw-text-md tw-font-semibold tw-text-gray-800">
        <i className="fa-light fa-filter tw-mr-2"></i>
        Filter Loaded Data
        {pumpTransactions && pumpTransactions.length > 0 && (
          <span className="tw-ml-2 tw-text-sm tw-font-normal tw-text-gray-500">
            (Showing {filteredTransactions.length} of {pumpTransactions.length}{" "}
            records)
          </span>
        )}
      </h4>
      <Button
        icon="fa-light fa-times"
        stylingMode="text"
        onClick={() => setFilterPanelVisible(false)}
        hint="Close filter panel"
      />
    </div>

    <ScrollView height="auto" width="100%" showScrollbar="onScroll">
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 lg:tw-grid-cols-6 tw-gap-4 tw-mb-4">
        {/* Vehicle Filter */}
        <div>
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
            <i className="fa-light fa-truck tw-mr-1"></i> Vehicles
          </label>
          <TagBox
            value={clientFilters.vehicleIds}
            onValueChanged={(e) => updateClientFilter("vehicleIds", e.value)}
            dataSource={filterOptions.vehicles}
            displayExpr="name"
            valueExpr="id"
            placeholder="All vehicles"
            showClearButton={true}
            searchEnabled={true}
            width="100%"
            noDataText="No vehicles in data"
            maxDisplayedTags={2}
            showMultiTagOnly={false}
          />
        </div>

        {/* PTS Device Filter */}
        <div>
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
            <i className="fa-light fa-gas-pump tw-mr-1"></i> PTS Devices
          </label>
          <TagBox
            value={clientFilters.ptsIds}
            onValueChanged={(e) => updateClientFilter("ptsIds", e.value)}
            dataSource={filterOptions.ptsDevices}
            displayExpr="name"
            valueExpr="ptsId"
            placeholder="All PTS devices"
            showClearButton={true}
            searchEnabled={true}
            width="100%"
            noDataText="No PTS devices in data"
            maxDisplayedTags={2}
            showMultiTagOnly={false}
          />
        </div>

        {/* Tank Filter */}
        <div>
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
            <i className="fa-light fa-database tw-mr-1"></i> Tanks
          </label>
          <TagBox
            value={clientFilters.tankIds}
            onValueChanged={(e) => updateClientFilter("tankIds", e.value)}
            dataSource={filterOptions.tanks}
            displayExpr="name"
            valueExpr="id"
            placeholder="All tanks"
            showClearButton={true}
            searchEnabled={true}
            width="100%"
            noDataText="No tanks in data"
            maxDisplayedTags={2}
            showMultiTagOnly={false}
          />
        </div>

        {/* Site Filter */}
        <div>
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
            <i className="fa-light fa-location-dot tw-mr-1"></i> Sites
          </label>
          <TagBox
            value={clientFilters.siteIds}
            onValueChanged={(e) => updateClientFilter("siteIds", e.value)}
            dataSource={filterOptions.sites}
            displayExpr="name"
            valueExpr="id"
            placeholder="All sites"
            showClearButton={true}
            searchEnabled={true}
            width="100%"
            noDataText="No sites in data"
            maxDisplayedTags={2}
            showMultiTagOnly={false}
          />
        </div>

        {/* User Filter */}
        <div>
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
            <i className="fa-light fa-user tw-mr-1"></i> Fueled By
          </label>
          <TagBox
            value={clientFilters.userIds}
            onValueChanged={(e) => updateClientFilter("userIds", e.value)}
            dataSource={filterOptions.users}
            displayExpr="name"
            valueExpr="id"
            placeholder="All users"
            showClearButton={true}
            searchEnabled={true}
            width="100%"
            noDataText="No users in data"
            maxDisplayedTags={2}
            showMultiTagOnly={false}
          />
        </div>

        {/* Processing Status Filter */}
        <div>
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
            <i className="fa-light fa-check-circle tw-mr-1"></i> Status
          </label>
          <SelectBox
            value={clientFilters.processedOnly}
            onValueChanged={(e) => updateClientFilter("processedOnly", e.value)}
            dataSource={processingStatusOptions}
            displayExpr="text"
            valueExpr="value"
            placeholder="All"
            width="100%"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="tw-flex tw-justify-end tw-gap-3">
        <Button
          text="Reset Filters"
          type="normal"
          stylingMode="outlined"
          icon="fa-light fa-rotate-left"
          onClick={handleResetFilters}
        />
        <Button
          text="Close"
          type="default"
          stylingMode="contained"
          icon="fa-light fa-check"
          onClick={() => setFilterPanelVisible(false)}
        />
      </div>
    </ScrollView>
  </div>
);

/**
 * Transaction DataGrid Component
 */
const TransactionDataGrid = ({
  dataGridRef,
  filteredTransactions,
  pumpTransactionsLoading,
  isGroupsExpanded,
  onToolbarPreparing,
  groupCellRenderDate,
  onOpenMapPopup,
  resolveFuelingLocation,
  mapPopupTransitioning,
}) => (
  <div className="tw-bg-white tw-rounded-lg tw-shadow-sm">
    <DataGrid
      ref={dataGridRef}
      dataSource={filteredTransactions}
      keyExpr="id"
      loading={pumpTransactionsLoading}
      showBorders={true}
      showRowLines={true}
      showColumnLines={true}
      rowAlternationEnabled={true}
      columnAutoWidth={true}
      onToolbarPreparing={onToolbarPreparing}
      filterRow={{ visible: true }}
      headerFilter={{ visible: true }}
      searchPanel={{
        visible: true,
        width: 240,
        placeholder: "Search transactions...",
      }}
      paging={{ pageSize: 20 }}
      pager={{
        visible: true,
        allowedPageSizes: [10, 20, 50, 100],
        showPageSizeSelector: true,
        showInfo: true,
        showNavigationButtons: true,
      }}
      sorting={{ mode: "multiple" }}
      selection={{ mode: "multiple" }}
      export={{ enabled: true }}
      columnChooser={{ enabled: true }}
      stateStoring={{
        enabled: false, // Disabled to ensure column order from code is respected
        type: "localStorage",
        storageKey: "pumpTransactionDataGrid",
      }}
      noDataText="No pump transactions found. Use filters to search for transactions."
    >
      <Column
        dataField="transactionDate"
        caption="Date"
        width={100}
        dataType="date"
        format="dd/MM/yyyy"
        sortOrder="desc"
        allowGrouping={true}
        groupCellRender={groupCellRenderDate}
      />
      <Column
        dataField="transactionTime"
        caption="Time"
        width={80}
        dataType="string"
      />
      <Column
        dataField="ptsId"
        caption="PTS Device"
        width={180}
        allowGrouping={true}
        cellRender={(data) => (
          <div>
            <div className="tw-text-xs tw-text-gray-500">{data.value}</div>
            {data.data.ptsName && (
              <div className="tw-font-medium">{data.data.ptsName}</div>
            )}
          </div>
        )}
      />
      <Column dataField="pump" caption="Pump" width={80} dataType="number" />
      <Column
        dataField="transaction"
        caption="Transaction"
        width={100}
        dataType="number"
      />
      <Column
        dataField="nozzle"
        caption="Nozzle"
        width={80}
        dataType="number"
      />
      <Column
        dataField="siteName"
        caption="Site"
        width={150}
        allowGrouping={true}
      />
      <Column
        caption="Map"
        width={90}
        allowSorting={false}
        allowFiltering={false}
        cellRender={(data) => {
          const location = resolveFuelingLocation(data.data);
          if (!location) {
            return <span className="tw-text-xs tw-text-gray-400">N/A</span>;
          }
          return (
            <Button
              text="Map"
              icon="fa-light fa-map-location-dot"
              stylingMode="text"
              onClick={() => onOpenMapPopup(data.data)}
              disabled={mapPopupTransitioning}
            />
          );
        }}
      />
      <Column
        dataField="vehicleName"
        caption="Vehicle"
        width={140}
        allowGrouping={true}
        cellRender={(data) => (
          <div>
            <div className="tw-font-medium">{data.value || "N/A"}</div>
            {data.data.vehicleNumberPlate && (
              <div className="tw-text-xs tw-text-gray-500">
                {data.data.vehicleNumberPlate}
              </div>
            )}
          </div>
        )}
      />
      <Column dataField="fuelGradeName" caption="Fuel Grade" width={100} />
      <Column
        dataField="volume"
        caption="Volume (L)"
        width={100}
        dataType="number"
        format={{ type: "fixedPoint", precision: 2 }}
        alignment="right"
      />

      <Column
        dataField="tankName"
        caption="Source Tank"
        width={110}
        allowGrouping={true}
      />
      <Column
        dataField="hasBeenProcessed"
        caption="Status"
        width={100}
        cellRender={(data) => (
          <span
            className={`tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-font-medium ${
              data.value
                ? "tw-bg-green-100 tw-text-green-800"
                : "tw-bg-yellow-100 tw-text-yellow-800"
            }`}
          >
            {data.value ? "Processed" : "Pending"}
          </span>
        )}
      />
      <Column
        dataField="odometer"
        caption="Odometer"
        width={110}
        dataType="number"
        alignment="right"
        cellRender={(data) => (
          <div>
            <div className="tw-font-medium">
              {data.value ? data.value.toLocaleString() : "N/A"}
            </div>
            {data.data.previousOdometer && (
              <div className="tw-text-xs tw-text-gray-500">
                Prev: {data.data.previousOdometer.toLocaleString()}
              </div>
            )}
          </div>
        )}
      />
      {/* Additional columns - less frequently used */}

      <Column
        dataField="destinationTankName"
        caption="Dest. Tank"
        width={110}
        visible={false}
        cellRender={(data) => (
          <span
            className={
              data.value
                ? "tw-text-purple-700 tw-font-medium"
                : "tw-text-gray-400"
            }
          >
            {data.value || "-"}
          </span>
        )}
      />
      <Column
        dataField="consumptionSinceLastRefuel"
        caption="Consumption"
        width={120}
        dataType="number"
        alignment="right"
        visible={false}
        cellRender={(data) => {
          if (!data.value || data.value === 0) return <span>N/A</span>;
          const consumptionValue = data.value;
          const colorClass =
            consumptionValue > 15
              ? "tw-text-red-600"
              : consumptionValue > 10
              ? "tw-text-yellow-600"
              : "tw-text-green-600";
          return (
            <span className={`tw-font-medium ${colorClass}`}>
              {consumptionValue.toFixed(2)} L/100km
            </span>
          );
        }}
      />
      <Column dataField="driverName" caption="Driver" width={120} visible={false} />
      <Column
        dataField="fueledByUserName"
        caption="Fueled By"
        width={120}
        visible={false}
        cellRender={(data) => {
          const fueledBy =
            data.data.fueledByUserName ||
            data.data.operatorName ||
            data.data.userName ||
            "-";
          return <span>{fueledBy}</span>;
        }}
      />
      <Grouping autoExpandAll={isGroupsExpanded} allowCollapsing={true} />
      <Summary>
        <GroupItem
          column="volume"
          summaryType="sum"
          valueFormat="#,##0.00"
          displayFormat="Volume: {0}L"
          alignByColumn={true}
        />
        <GroupItem
          column="transactionDate"
          summaryType="count"
          displayFormat="Transactions: {0}"
          alignByColumn={true}
        />
        <TotalItem
          column="volume"
          summaryType="sum"
          valueFormat="#,##0.00"
          displayFormat="Total Volume: {0}L"
        />
        <TotalItem
          column="transactionDate"
          summaryType="count"
          displayFormat="Total Transactions: {0}"
        />
      </Summary>
    </DataGrid>
  </div>
);

export default PumpTransactionManager;
