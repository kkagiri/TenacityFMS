import { useState } from "react";
import {
  cleanNumericValue,
  formatNumericValue,
  formatDate,
} from "../utils/formatting";

/**
 * Hook for data processing functionality
 */
const useDataProcessing = ({
  parsedData,
  filteredData,
  selectedSite,
  sites,
  vehicles,
  skipRows,
  validationErrors,
  selectedRowKeys,
  findVehicleByName,
  findSiteByName,
}) => {
  /**
   * Maps data for km/l report type
   */
  const mapKmLData = (row, rowIndex) => {
    const vehicleInfo = findVehicleByName(row["Vehicle Name"] || "");
    const driverName = row["Driver"] || "";

    // Get the selected site name for locationName
    const selectedSiteObj = sites.find(
      (site) => site.id === parseInt(selectedSite)
    );
    const locationName = selectedSiteObj ? selectedSiteObj.name : "";

    const totalDistance =
      cleanNumericValue(row["Total Distance (GPS)"]) ||
      cleanNumericValue(row["Total Distance"]) ||
      cleanNumericValue(row["Distance"]) ||
      0;

    const maxSpeed =
      cleanNumericValue(row["Max Speed"]) ||
      cleanNumericValue(row["Maximum Speed"]) ||
      0;

    const avgSpeed =
      cleanNumericValue(row["Average Speed"]) ||
      cleanNumericValue(row["Avg Speed"]) ||
      cleanNumericValue(row["Avg. Speed"]) ||
      0;

    const expectedAvg =
      cleanNumericValue(row["Expected Fuel Avg (km/l)"]) ||
      cleanNumericValue(row["Expected Average"]) ||
      cleanNumericValue(row["Expected Avg"]) ||
      cleanNumericValue(row["Expected"]) ||
      0;

    const fuelEfficiency =
      cleanNumericValue(row["Fuel Efficiency"]) ||
      cleanNumericValue(row["Efficiency"]) ||
      0;

    const totalFuel =
      cleanNumericValue(row["Total Fuel"]) ||
      cleanNumericValue(row["Fuel Used"]) ||
      cleanNumericValue(row["Fuel Consumption"]) ||
      0;

    const fuelLost =
      cleanNumericValue(row["Fuel Lost"]) ||
      cleanNumericValue(row["Lost Fuel"]) ||
      0;

    return {
      _rowIndex: rowIndex,
      vehicleId: vehicleInfo?.vehicleId || 0,
      vehicleName: row["Vehicle Name"] || "",
      driverName: driverName,
      totalDistance: totalDistance,
      maxSpeed: maxSpeed,
      avgSpeed: avgSpeed,
      workingExpectedAverage: expectedAvg,
      fuelEfficiency: fuelEfficiency,
      totalFuel: totalFuel,
      fuelLost: fuelLost,
      comment: row["Comment"] || row["Comments"] || "",
      date: formatDate(row["Date"]),
      siteId: parseInt(selectedSite) || 0,
      isKmperLiter: true,
      isNightShift: false,
      engHours: 0,
      flowMeterEngineHrs: 0,
      flowMeterFuelUsed: 0,
      flowMeterEffiency: 0,
      flowMeterFuelLost: 0,
      excessWorkingHrsCost: 0,
      locationName: locationName,
    };
  };

  /**
   * Maps data for l/hr report type
   */
  const mapLHrData = (row, rowIndex) => {
    const vehicleInfo = findVehicleByName(
      row["Vehice Name"] || row["Vehicle Name"] || ""
    );
    const driverName = row["Driver Name"] || row["Driver"] || "";

    let locationName = row["Location"] || "";
    if (locationName.trim().toLowerCase() === "british embassy") {
      locationName = "BHC";
    }
    const siteInfo = findSiteByName(locationName);

    const commentText = row["Comments"] || row["Comment"] || "";
    const isNightShift = commentText.toLowerCase().includes("night shift");

    const engHours =
      cleanNumericValue(row["Runtime Eng hrs"]) ??
      cleanNumericValue(row["Engine Hours"]) ??
      0;

    return {
      _rowIndex: rowIndex,
      vehicleId: vehicleInfo?.vehicleId || 0,
      vehicleName: row["Vehice Name"] || row["Vehicle Name"] || "",
      driverName: driverName,
      engHours: engHours,
      totalFuel:
        cleanNumericValue(row["Total fuel"]) ??
        cleanNumericValue(row["Total Fuel"]) ??
        0,
      fuelEfficiency:
        cleanNumericValue(row["Fuel Eff (l/hr)"]) ??
        cleanNumericValue(row["Fuel Efficiency"]) ??
        0,
      workingExpectedAverage:
        cleanNumericValue(row["Expected Fuel Eff"]) ??
        cleanNumericValue(row["Expected Average"]) ??
        0,
      fuelLost:
        cleanNumericValue(row["Fuel lost"]) ??
        cleanNumericValue(row["Fuel Lost"]) ??
        0,
      flowMeterEngineHrs:
        cleanNumericValue(row["Flow meter Eng Hrs"]) ??
        cleanNumericValue(row["Flow Meter Engine Hours"]) ??
        0,
      flowMeterFuelUsed:
        cleanNumericValue(row["Flow meter Total fuel"]) ??
        cleanNumericValue(row["Flow Meter Fuel"]) ??
        0,
      flowMeterEffiency:
        cleanNumericValue(row["Flow meter Fuel eff"]) ??
        cleanNumericValue(row["Flow Meter Efficiency"]) ??
        0,
      flowMeterFuelLost:
        cleanNumericValue(row["Flow meter Fuel lost"]) ??
        cleanNumericValue(row["Flow Meter Fuel Lost"]) ??
        0,
      totalDistance:
        cleanNumericValue(row["Total Distance"]) ??
        cleanNumericValue(row["Distance"]) ??
        0,
      comment: commentText,
      excessWorkingHrsCost:
        cleanNumericValue(row["Excessive Hours (10)"]) ??
        cleanNumericValue(row["Excess Working Hours Cost"]) ??
        0,
      date: formatDate(row["Date"]),
      siteId: siteInfo?.id || 0,
      locationName: locationName,
      isKmperLiter: false,
      isNightShift: isNightShift,
      maxSpeed: 0,
      avgSpeed: 0,
    };
  };

  /**
   * Validates the data for import
   */
  const validateData = (data) => {
    const errors = [];
    data.forEach((row, index) => {
      const originalRowIndex = row._rowIndex + (skipRows || 0) + 1;

      if (!row.vehicleId || row.vehicleId <= 0) {
        errors.push({
          rowIndex: index,
          field: "vehicleName",
          message: `Row ${originalRowIndex}: Vehicle '${
            row.vehicleName || "(empty)"
          }' not found. Please select a valid vehicle.`,
        });
      }

      if (!row.driverName || row.driverName.trim() === "") {
        errors.push({
          rowIndex: index,
          field: "driverName",
          message: `Row ${originalRowIndex}: Driver name is missing.`,
        });
      }

      // Additional validation as needed...
    });

    return errors;
  };

  /**
   * Gets filtered data based on current filters
   */
  const getFilteredData = () => {
    return filteredData;
  };

  /**
   * Gets import summary data
   */
  const getImportSummary = () => {
    // Determine if we're using selected rows or all filtered data
    const usingSelectedRows = selectedRowKeys.length > 0;
    const sourceData = usingSelectedRows
      ? selectedRowKeys
          .map((key) => filteredData.find((row) => row._rowIndex === key))
          .filter(Boolean)
      : filteredData;

    const importCount = sourceData.length;

    return {
      dataCount: importCount,
      dateRange: "Multiple dates",
      selectedOnly: usingSelectedRows,
      totalRecordsInGrid: filteredData.length,
      vehicleCount: "Multiple",
      vehicleNames: "Multiple vehicles",
    };
  };

  /**
   * Gets selected rows count
   */
  const getSelectedRowsCount = () => {
    return selectedRowKeys?.length || 0;
  };

  /**
   * Checks if selected rows have errors
   */
  const selectedRowsHaveErrors = () => {
    if (getSelectedRowsCount() === 0) return false;

    // Check if any selected row has validation errors
    return selectedRowKeys.some((key) => {
      const row = filteredData.find((r) => r && r._rowIndex === key);
      if (!row) return false;

      const dataRowIndex = parsedData.findIndex(
        (item) => item && item._rowIndex === row._rowIndex
      );
      return validationErrors.some((err) => err.rowIndex === dataRowIndex);
    });
  };

  /**
   * Counts validation errors in selected rows
   */
  const countSelectedRowsErrors = () => {
    if (getSelectedRowsCount() === 0) return 0;

    let errorCount = 0;
    selectedRowKeys.forEach((key) => {
      const row = filteredData.find((r) => r && r._rowIndex === key);
      if (!row) return;

      const dataRowIndex = parsedData.findIndex(
        (item) => item && item._rowIndex === row._rowIndex
      );
      const rowErrors = validationErrors.filter(
        (err) => err.rowIndex === dataRowIndex
      );
      errorCount += rowErrors.length;
    });

    return errorCount;
  };

  return {
    formatDate,
    cleanNumericValue,
    formatNumericValue,
    mapKmLData,
    mapLHrData,
    validateData,
    getFilteredData,
    getImportSummary,
    getSelectedRowsCount,
    selectedRowsHaveErrors,
    countSelectedRowsErrors,
  };
};

export default useDataProcessing;
