import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useDispatch, useSelector } from "react-redux";
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
import { Workbook } from "exceljs";
import { saveAs } from "file-saver";
import { exportDataGrid } from "devextreme/excel_exporter";
import notify from "devextreme/ui/notify";
import { useStockFilters } from "../../../shared/context/StockFilterContext";
import {
  fetchPumpTransactions,
  clearPumpTransactions,
} from "../../../../../redux/actions/consumptionActions";
import { fetchVehicleList } from "../../../../../redux/actions/vehicleActions";
import { fetchPTSDeviceList } from "../../../../../redux/actions/ptsActions/ptsDeviceActions";
import { fetchTanks } from "../../../../../redux/actions/tankActions";
import { fetchSiteList } from "../../../../../redux/actions/siteActions";
import { fetchUsers } from "../../../../../redux/actions/userActions";
import PumpTransactionGroupingControls from "./PumpTransactionGroupingControls";
import "./PumpTransactionManager.scss";

// Default grouping state
const defaultGroupByState = {
  date: false,
  site: false,
  tank: false,
  vehicle: false,
  ptsDevice: false,
};

const PumpTransactionManager = ({ selectedSite, dateRange }) => {
  const dispatch = useDispatch();
  const dataGridRef = useRef(null);
  const {
    pumpTransactions,
    pumpTransactionsLoading,
    pumpTransactionsError,
    pumpTransactionsLastFetch,
    pumpTransactionsFilters,
  } = useSelector((state) => state.consumption);

  // Get vehicles, PTS devices, tanks, sites, users from Redux
  const vehicles = useSelector((state) => state.vehicle?.vehicles || []);
  const ptsDevices = useSelector((state) => state.pts?.ptsDeviceList || []);
  const tanks = useSelector((state) => state.tank?.tanks || []);
  const sites = useSelector((state) => state.site?.sites || []);
  const users = useSelector((state) => state.user?.users || []);

  // Get filters from shared context (header filters)
  const {
    startDate: headerStartDate,
    endDate: headerEndDate,
    selectedSiteIds,
    selectedTankIds,
  } = useStockFilters();

  // Filter panel state - client-side filters for the datagrid
  const [filterPanelVisible, setFilterPanelVisible] = useState(false);
  const [clientFilters, setClientFilters] = useState({
    vehicleIds: [],
    ptsIds: [],
    tankIds: [],
    siteIds: [],
    userIds: [],
    processedOnly: null,
  });

  // Grouping state
  const [groupBy, setGroupBy] = useState(defaultGroupByState);
  const [isGroupsExpanded, setIsGroupsExpanded] = useState(false);

  const hasActiveGrouping = useMemo(() => {
    return (
      groupBy.date ||
      groupBy.site ||
      groupBy.tank ||
      groupBy.vehicle ||
      groupBy.ptsDevice
    );
  }, [groupBy.date, groupBy.site, groupBy.tank, groupBy.vehicle, groupBy.ptsDevice]);

  // Load reference data on mount
  useEffect(() => {
    dispatch(fetchVehicleList());
    dispatch(fetchPTSDeviceList());
    dispatch(fetchTanks());
    dispatch(fetchSiteList());
    dispatch(fetchUsers());
  }, [dispatch]);

  // Build unique filter options from loaded data
  const filterOptions = useMemo(() => {
    if (!pumpTransactions || pumpTransactions.length === 0) {
      return {
        vehicles: [],
        ptsDevices: [],
        tanks: [],
        sites: [],
        users: [],
      };
    }

    // Extract unique values from transaction data
    const uniqueVehicles = [
      ...new Map(
        pumpTransactions
          .filter((t) => t.vehicleId && t.vehicleName)
          .map((t) => [
            t.vehicleId,
            {
              id: t.vehicleId,
              name: t.vehicleName,
              numberPlate: t.vehicleNumberPlate,
            },
          ])
      ).values(),
    ];

    const uniquePtsDevices = [
      ...new Map(
        pumpTransactions
          .filter((t) => t.ptsId)
          .map((t) => [t.ptsId, { ptsId: t.ptsId, name: t.ptsName || t.ptsId }])
      ).values(),
    ];

    const uniqueTanks = [
      ...new Map(
        pumpTransactions
          .filter((t) => t.tankId)
          .map((t) => [
            t.tankId,
            { id: t.tankId, name: t.tankName || `Tank ${t.tankId}` },
          ])
      ).values(),
    ];

    const uniqueSites = [
      ...new Map(
        pumpTransactions
          .filter((t) => t.siteId)
          .map((t) => [
            t.siteId,
            { id: t.siteId, name: t.siteName || `Site ${t.siteId}` },
          ])
      ).values(),
    ];

    const uniqueUsers = [
      ...new Map(
        pumpTransactions
          .filter((t) => t.fueledBy && t.fueledByUserName)
          .map((t) => [t.fueledBy, { id: t.fueledBy, name: t.fueledByUserName }])
      ).values(),
    ];

    return {
      vehicles: uniqueVehicles,
      ptsDevices: uniquePtsDevices,
      tanks: uniqueTanks,
      sites: uniqueSites,
      users: uniqueUsers,
    };
  }, [pumpTransactions]);

  // Apply client-side filters to the data and add computed date/time fields
  const filteredTransactions = useMemo(() => {
    if (!pumpTransactions || pumpTransactions.length === 0) {
      return [];
    }

    // Add computed date and time fields plus unique row key
    let filtered = pumpTransactions.map((t) => {
      const dateObj = t.dateTime ? new Date(t.dateTime) : null;
      return {
        ...t,
        transactionDate: dateObj ? dateObj.toISOString().split("T")[0] : null,
        transactionTime: dateObj ? dateObj.toTimeString().split(" ")[0] : null,
      };
    });

    // Filter by vehicles
    if (clientFilters.vehicleIds.length > 0) {
      filtered = filtered.filter((t) =>
        clientFilters.vehicleIds.includes(t.vehicleId)
      );
    }

    // Filter by PTS devices
    if (clientFilters.ptsIds.length > 0) {
      filtered = filtered.filter((t) => clientFilters.ptsIds.includes(t.ptsId));
    }

    // Filter by tanks
    if (clientFilters.tankIds.length > 0) {
      filtered = filtered.filter((t) =>
        clientFilters.tankIds.includes(t.tankId)
      );
    }

    // Filter by sites
    if (clientFilters.siteIds.length > 0) {
      filtered = filtered.filter((t) =>
        clientFilters.siteIds.includes(t.siteId)
      );
    }

    // Filter by users (fueledBy)
    if (clientFilters.userIds.length > 0) {
      filtered = filtered.filter((t) =>
        clientFilters.userIds.includes(t.fueledBy)
      );
    }

    // Filter by processing status
    if (clientFilters.processedOnly !== null) {
      filtered = filtered.filter(
        (t) => t.hasBeenProcessed === clientFilters.processedOnly
      );
    }

    return filtered;
  }, [pumpTransactions, clientFilters]);

  // Render group cell for date grouping
  const groupCellRenderDate = useCallback((cellInfo) => {
    if (!cellInfo.value) return "No Date";
    const date = new Date(cellInfo.value);
    if (isNaN(date.getTime())) return cellInfo.value;
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

  // Grouping handlers
  const handleGroupByChange = useCallback(
    (groupType) => {
      const dataGrid = dataGridRef.current?.instance;
      if (!dataGrid) return;

      const newGroupBy = { ...groupBy };
      newGroupBy[groupType] = !newGroupBy[groupType];

      dataGrid.clearGrouping();

      let groupIndex = 0;
      if (newGroupBy.date) {
        dataGrid.columnOption("transactionDate", "groupIndex", groupIndex++);
      }
      if (newGroupBy.site) {
        dataGrid.columnOption("siteName", "groupIndex", groupIndex++);
      }
      if (newGroupBy.tank) {
        dataGrid.columnOption("tankName", "groupIndex", groupIndex++);
      }
      if (newGroupBy.vehicle) {
        dataGrid.columnOption("vehicleName", "groupIndex", groupIndex++);
      }
      if (newGroupBy.ptsDevice) {
        dataGrid.columnOption("ptsId", "groupIndex", groupIndex++);
      }

      setGroupBy(newGroupBy);
    },
    [groupBy]
  );

  const handleClearGrouping = useCallback(() => {
    const dataGrid = dataGridRef.current?.instance;
    if (!dataGrid || !hasActiveGrouping) return;

    dataGrid.clearGrouping();
    setGroupBy(defaultGroupByState);
  }, [hasActiveGrouping]);

  const handleToggleExpandGroups = useCallback(() => {
    const dataGrid = dataGridRef.current?.instance;
    if (dataGrid) {
      if (isGroupsExpanded) {
        dataGrid.collapseAll(-1);
      } else {
        dataGrid.expandAll(-1);
      }
      setIsGroupsExpanded(!isGroupsExpanded);
    }
  }, [isGroupsExpanded]);

  // Processing status options
  const processingStatusOptions = useMemo(
    () => [
      { value: null, text: "All Transactions" },
      { value: true, text: "Processed Only" },
      { value: false, text: "Unprocessed Only" },
    ],
    []
  );

  // Handle filter reset - resets client-side filters
  const handleResetFilters = useCallback(() => {
    setClientFilters({
      vehicleIds: [],
      ptsIds: [],
      tankIds: [],
      siteIds: [],
      userIds: [],
      processedOnly: null,
    });
  }, []);

  // Handle data refresh
  const handleRefresh = useCallback(async () => {
    if (pumpTransactionsFilters) {
      const result = await dispatch(
        fetchPumpTransactions(pumpTransactionsFilters)
      );
      if (result.success) {
        notify({
          message: "Data refreshed successfully",
          type: "success",
          displayTime: 2000,
        });
      }
    }
  }, [dispatch, pumpTransactionsFilters]);

  // Handle data clear
  const handleClear = useCallback(() => {
    dispatch(clearPumpTransactions());
    handleResetFilters();
    notify({
      message: "Pump transaction data cleared",
      type: "info",
      displayTime: 2000,
    });
  }, [dispatch, handleResetFilters]);

  // Handle Excel export
  const handleExport = useCallback(() => {
    if (!dataGridRef.current) return;

    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet("Pump Transactions");

    exportDataGrid({
      component: dataGridRef.current.instance,
      worksheet,
      autoFilterEnabled: true,
      customizeCell: ({ gridCell, excelCell }) => {
        if (gridCell.rowType === "data") {
          // Format specific columns
          if (
            gridCell.column.dataField === "volume" ||
            gridCell.column.dataField === "tcVolume"
          ) {
            excelCell.numFmt = "#,##0.00";
          }
          if (gridCell.column.dataField === "odometer") {
            excelCell.numFmt = "#,##0";
          }
          if (gridCell.column.dataField === "transactionDate") {
            excelCell.numFmt = "dd/mm/yyyy";
          }
        }
        // Style header row
        if (gridCell.rowType === "header") {
          excelCell.font = { bold: true };
          excelCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE0E0E0" },
          };
        }
      },
    }).then(() => {
      workbook.xlsx.writeBuffer().then((buffer) => {
        const dateStr = new Date().toISOString().split("T")[0];
        saveAs(
          new Blob([buffer], { type: "application/octet-stream" }),
          `PumpTransactions_${dateStr}.xlsx`
        );
        notify({
          message: "Export completed successfully",
          type: "success",
          displayTime: 2000,
        });
      });
    });
  }, []);

  // Toolbar configuration
  const onToolbarPreparing = useCallback(
    (e) => {
      e.toolbarOptions.items.unshift(
        {
          location: "before",
          widget: "dxButton",
          options: {
            icon: "filter",
            text: "Filters",
            hint: "Open filter panel",
            onClick: () => setFilterPanelVisible(true),
          },
        },
        {
          location: "before",
          widget: "dxButton",
          options: {
            icon: "refresh",
            text: "Refresh",
            hint: "Refresh data",
            disabled: !pumpTransactionsFilters,
            onClick: handleRefresh,
          },
        },
        {
          location: "before",
          widget: "dxButton",
          options: {
            icon: "exportxlsx",
            text: "Export",
            hint: "Export to Excel",
            disabled:
              !filteredTransactions || filteredTransactions.length === 0,
            onClick: handleExport,
          },
        },
        {
          location: "before",
          widget: "dxButton",
          options: {
            icon: "clear",
            text: "Clear",
            hint: "Clear data",
            onClick: handleClear,
          },
        }
      );
    },
    [
      handleRefresh,
      handleClear,
      handleExport,
      pumpTransactionsFilters,
      filteredTransactions,
    ]
  );

  // Calculate summary statistics from filtered data
  const summaryStats = useMemo(() => {
    if (!filteredTransactions || filteredTransactions.length === 0) {
      return {
        totalTransactions: 0,
        totalVolume: 0,
        processedCount: 0,
        pendingCount: 0,
        uniqueVehicles: 0,
        uniqueTanks: 0,
      };
    }

    const processed = filteredTransactions.filter((t) => t.hasBeenProcessed);
    const pending = filteredTransactions.filter((t) => !t.hasBeenProcessed);
    const uniqueVehicles = new Set(
      filteredTransactions.filter((t) => t.vehicleId).map((t) => t.vehicleId)
    );
    const uniqueTanks = new Set(
      filteredTransactions.filter((t) => t.tankId).map((t) => t.tankId)
    );

    return {
      totalTransactions: filteredTransactions.length,
      totalVolume: filteredTransactions.reduce(
        (sum, t) => sum + (t.volume || 0),
        0
      ),
      processedCount: processed.length,
      pendingCount: pending.length,
      uniqueVehicles: uniqueVehicles.size,
      uniqueTanks: uniqueTanks.size,
    };
  }, [filteredTransactions]);

  // React to header filter changes and reload data
  useEffect(() => {
    if (
      pumpTransactionsFilters &&
      (headerStartDate || headerEndDate || selectedSiteIds || selectedTankIds)
    ) {
      // Automatically refresh data when header filters change
      const filters = { ...pumpTransactionsFilters };

      // Update with new header filters
      if (headerStartDate) filters.startDate = headerStartDate;
      if (headerEndDate) filters.endDate = headerEndDate;
      if (selectedSiteIds && selectedSiteIds.length > 0) {
        filters.siteIds = selectedSiteIds;
      }
      if (selectedTankIds && selectedTankIds.length > 0) {
        filters.tankIds = selectedTankIds;
      }

      dispatch(fetchPumpTransactions(filters));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerStartDate, headerEndDate, selectedSiteIds, selectedTankIds]);

  // Show error notification when error occurs
  useEffect(() => {
    if (pumpTransactionsError) {
      notify({
        message: pumpTransactionsError,
        type: "error",
        displayTime: 5000,
      });
    }
  }, [pumpTransactionsError]);

  // Auto-load data when header filters are available
  useEffect(() => {
    // Only auto-load if we have header filters (dates or sites/tanks)
    if (headerStartDate && headerEndDate) {
      const initialFilters = {
        startDate: headerStartDate,
        endDate: headerEndDate,
      };

      if (selectedSiteIds && selectedSiteIds.length > 0) {
        initialFilters.siteIds = selectedSiteIds;
      }
      if (selectedTankIds && selectedTankIds.length > 0) {
        initialFilters.tankIds = selectedTankIds;
      }

      // Auto-load data with initial filters
      dispatch(fetchPumpTransactions(initialFilters));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  return (
    <div className="pump-transaction-manager">
      {/* Header with summary information */}
      <div className="tw-mb-4 tw-p-4 tw-bg-gray-50 tw-rounded-lg">
        <div className="tw-flex tw-justify-between tw-items-center tw-mb-2">
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800">
            <i className="fa-light fa-gas-pump tw-mr-2"></i>
            Pump Transactions
          </h3>
          <div className="tw-flex tw-gap-2">
            <Button
              text={filterPanelVisible ? "Hide Filters" : "Show Filters"}
              icon={
                filterPanelVisible
                  ? "fa-light fa-chevron-up"
                  : "fa-light fa-filter"
              }
              type="default"
              stylingMode="outlined"
              onClick={() => setFilterPanelVisible(!filterPanelVisible)}
            />
          </div>
        </div>

        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-4 tw-text-sm tw-mb-4">
          <div className="summary-card">
            <div className="summary-value">
              {summaryStats.totalTransactions}
            </div>
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

        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-4 tw-text-sm">
          <div className="tw-flex tw-items-center tw-gap-2">
            <span className="tw-text-gray-600">Unique Vehicles:</span>
            <span className="tw-font-medium">
              {summaryStats.uniqueVehicles}
            </span>
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

      {/* Inline Filter Panel - Client-side filtering */}
      {filterPanelVisible && (
        <div className="tw-mb-4 tw-p-4 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg">
          <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
            <h4 className="tw-text-md tw-font-semibold tw-text-gray-800">
              <i className="fa-light fa-filter tw-mr-2"></i>
              Filter Loaded Data
              {pumpTransactions && pumpTransactions.length > 0 && (
                <span className="tw-ml-2 tw-text-sm tw-font-normal tw-text-gray-500">
                  (Showing {filteredTransactions.length} of{" "}
                  {pumpTransactions.length} records)
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
              {/* Vehicle Filter - Multi-select */}
              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                  <i className="fa-light fa-truck tw-mr-1"></i> Vehicles
                </label>
                <TagBox
                  value={clientFilters.vehicleIds}
                  onValueChanged={(e) =>
                    setClientFilters((prev) => ({
                      ...prev,
                      vehicleIds: e.value,
                    }))
                  }
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

              {/* PTS Device Filter - Multi-select by name */}
              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                  <i className="fa-light fa-gas-pump tw-mr-1"></i> PTS Devices
                </label>
                <TagBox
                  value={clientFilters.ptsIds}
                  onValueChanged={(e) =>
                    setClientFilters((prev) => ({ ...prev, ptsIds: e.value }))
                  }
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

              {/* Tank Filter - Multi-select */}
              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                  <i className="fa-light fa-database tw-mr-1"></i> Tanks
                </label>
                <TagBox
                  value={clientFilters.tankIds}
                  onValueChanged={(e) =>
                    setClientFilters((prev) => ({ ...prev, tankIds: e.value }))
                  }
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

              {/* Site Filter - Multi-select */}
              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                  <i className="fa-light fa-location-dot tw-mr-1"></i> Sites
                </label>
                <TagBox
                  value={clientFilters.siteIds}
                  onValueChanged={(e) =>
                    setClientFilters((prev) => ({ ...prev, siteIds: e.value }))
                  }
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

              {/* User Filter - Multi-select (Fueled By) */}
              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                  <i className="fa-light fa-user tw-mr-1"></i> Fueled By
                </label>
                <TagBox
                  value={clientFilters.userIds}
                  onValueChanged={(e) =>
                    setClientFilters((prev) => ({ ...prev, userIds: e.value }))
                  }
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
                  onValueChanged={(e) =>
                    setClientFilters((prev) => ({
                      ...prev,
                      processedOnly: e.value,
                    }))
                  }
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
      )}

      {/* DataGrid */}
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
            enabled: true,
            type: "localStorage",
            storageKey: "pumpTransactionDataGrid",
          }}
          noDataText="No pump transactions found. Use filters to search for transactions."
        >
          {/* Define columns inside DataGrid for proper grouping */}
          <Column
            dataField="transactionDate"
            caption="Date"
            width={110}
            dataType="date"
            format="dd/MM/yyyy"
            sortOrder="desc"
            allowGrouping={true}
            groupCellRender={groupCellRenderDate}
          />
          <Column
            dataField="transactionTime"
            caption="Time"
            width={90}
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
          <Column
            dataField="siteName"
            caption="Site"
            width={150}
            allowGrouping={true}
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
          <Column
            dataField="tankName"
            caption="Source Tank"
            width={120}
            allowGrouping={true}
          />
          <Column
            dataField="destinationTankName"
            caption="Dest. Tank"
            width={120}
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
          <Column dataField="fuelGradeName" caption="Fuel Grade" width={120} />
          <Column dataField="pump" caption="Pump" width={80} dataType="number" />
          <Column
            dataField="nozzle"
            caption="Nozzle"
            width={80}
            dataType="number"
          />
          <Column
            dataField="volume"
            caption="Volume (L)"
            width={120}
            dataType="number"
            format={{ type: "fixedPoint", precision: 2 }}
            alignment="right"
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
          <Column
            dataField="consumptionSinceLastRefuel"
            caption="Consumption (L/100km)"
            width={140}
            dataType="number"
            alignment="right"
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
                  {consumptionValue.toFixed(2)}
                </span>
              );
            }}
          />
          <Column dataField="driverName" caption="Driver" width={130} />
          <Column
            dataField="fueledByUserName"
            caption="Fueled By"
            width={120}
            cellRender={(data) => {
              const fueledBy =
                data.data.fueledByUserName ||
                data.data.operatorName ||
                data.data.userName ||
                "-";
              return <span>{fueledBy}</span>;
            }}
          />
          <Column
            dataField="transaction"
            caption="Transaction"
            width={120}
            dataType="number"
          />
          <Column
            dataField="hasBeenProcessed"
            caption="Status"
            width={120}
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

      {/* Grouping Controls Panel */}
      <PumpTransactionGroupingControls
        groupBy={groupBy}
        hasActiveGrouping={hasActiveGrouping}
        isGroupsExpanded={isGroupsExpanded}
        onGroupByChange={handleGroupByChange}
        onClearGrouping={handleClearGrouping}
        onToggleExpandGroups={handleToggleExpandGroups}
      />
    </div>
  );
};

export default PumpTransactionManager;
