/**
 * File: usePumpTransactionManager.js
 * Purpose: Custom hook for pump transaction management logic and state
 * Dependencies: react, react-redux, devextreme, exceljs, file-saver
 * Last Modified: 2026-01-19
 */
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
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

// Default grouping state
const defaultGroupByState = {
  date: false,
  site: false,
  tank: false,
  vehicle: false,
  ptsDevice: false,
};

// Parse UTC to local date
const parseUtcToLocal = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    const hasTimezone = /[zZ]|[+-]\d{2}:?\d{2}$/.test(trimmed);
    const hasTime = trimmed.includes("T");
    if (hasTimezone) return new Date(trimmed);
    if (hasTime) return new Date(`${trimmed}Z`);
    return new Date(trimmed);
  }
  return new Date(value);
};

const usePumpTransactionManager = () => {
  const dispatch = useDispatch();
  const dataGridRef = useRef(null);

  // Redux state
  const {
    pumpTransactions,
    pumpTransactionsLoading,
    pumpTransactionsError,
    pumpTransactionsLastFetch,
    pumpTransactionsFilters,
  } = useSelector((state) => state.consumption);

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

  // Include tank-to-tank transfers option (default: false - only vehicle fueling)
  const [includeTransfers, setIncludeTransfers] = useState(false);

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

    // Add computed date and time fields
    let filtered = pumpTransactions.map((t) => {
      const dateObj = parseUtcToLocal(t.dateTime);
      const localDate = dateObj
        ? `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`
        : null;
      const localTime = dateObj
        ? `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}:${String(dateObj.getSeconds()).padStart(2, '0')}`
        : null;
      return {
        ...t,
        transactionDate: localDate,
        transactionTime: localTime,
      };
    });

    // Apply filters
    if (clientFilters.vehicleIds.length > 0) {
      filtered = filtered.filter((t) =>
        clientFilters.vehicleIds.includes(t.vehicleId)
      );
    }
    if (clientFilters.ptsIds.length > 0) {
      filtered = filtered.filter((t) => clientFilters.ptsIds.includes(t.ptsId));
    }
    if (clientFilters.tankIds.length > 0) {
      filtered = filtered.filter((t) =>
        clientFilters.tankIds.includes(t.tankId)
      );
    }
    if (clientFilters.siteIds.length > 0) {
      filtered = filtered.filter((t) =>
        clientFilters.siteIds.includes(t.siteId)
      );
    }
    if (clientFilters.userIds.length > 0) {
      filtered = filtered.filter((t) =>
        clientFilters.userIds.includes(t.fueledBy)
      );
    }
    if (clientFilters.processedOnly !== null) {
      filtered = filtered.filter(
        (t) => t.hasBeenProcessed === clientFilters.processedOnly
      );
    }

    return filtered;
  }, [pumpTransactions, clientFilters]);

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

  // Processing status options
  const processingStatusOptions = useMemo(
    () => [
      { value: null, text: "All Transactions" },
      { value: true, text: "Processed Only" },
      { value: false, text: "Unprocessed Only" },
    ],
    []
  );

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
    (groupType, newValue) => {
      const dataGrid = dataGridRef.current?.instance;
      if (!dataGrid) return;

      const newGroupBy = { ...groupBy };
      newGroupBy[groupType] = newValue !== undefined ? newValue : !newGroupBy[groupType];

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

  // Toggle filter panel
  const toggleFilterPanel = useCallback(() => {
    setFilterPanelVisible((prev) => !prev);
  }, []);

  // Update client filter
  const updateClientFilter = useCallback((filterKey, value) => {
    setClientFilters((prev) => ({
      ...prev,
      [filterKey]: value,
    }));
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

  // React to header filter changes and reload data
  useEffect(() => {
    if (
      pumpTransactionsFilters &&
      (headerStartDate || headerEndDate || selectedSiteIds || selectedTankIds)
    ) {
      const filters = { ...pumpTransactionsFilters };

      if (headerStartDate) filters.startDate = headerStartDate;
      if (headerEndDate) filters.endDate = headerEndDate;
      if (selectedSiteIds && selectedSiteIds.length > 0) {
        filters.siteIds = selectedSiteIds;
      }
      if (selectedTankIds && selectedTankIds.length > 0) {
        filters.tankIds = selectedTankIds;
      }
      filters.includeTransfers = includeTransfers;

      dispatch(fetchPumpTransactions(filters));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerStartDate, headerEndDate, selectedSiteIds, selectedTankIds, includeTransfers]);

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
    if (headerStartDate && headerEndDate) {
      const initialFilters = {
        startDate: headerStartDate,
        endDate: headerEndDate,
        includeTransfers: includeTransfers,
      };

      if (selectedSiteIds && selectedSiteIds.length > 0) {
        initialFilters.siteIds = selectedSiteIds;
      }
      if (selectedTankIds && selectedTankIds.length > 0) {
        initialFilters.tankIds = selectedTankIds;
      }

      dispatch(fetchPumpTransactions(initialFilters));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
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
    handleRefresh,
    handleClear,
    handleExport,
    toggleFilterPanel,
    setFilterPanelVisible,
    updateClientFilter,
    onToolbarPreparing,
    groupCellRenderDate,
  };
};

export default usePumpTransactionManager;
