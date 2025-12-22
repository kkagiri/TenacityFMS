/**
 * File: useExcelParsing.js
 * Purpose: Hook for Excel file parsing and data mapping
 * Extracted from: useImportUtils.js
 */

import * as XLSX from "xlsx";
import { cleanNumericValue, formatDate } from "../utils/formatting";
import {
  findVehicleByName as findVehicle,
  findSiteByName as findSite,
} from "../utils/lookup";

/**
 * Hook for Excel parsing functionality
 */
const useExcelParsing = ({
  sites,
  vehicles,
  skipRows,
  reportType,
  selectedSite,
  file,
  setParsedData,
  setPreviewedOnce,
  showToast,
  handleClearPreview,
  validateData,
}) => {
  /**
   * Finds a vehicle by name (wrapper that uses local vehicles array)
   */
  const findVehicleByName = (name) => findVehicle(name, vehicles);

  /**
   * Finds a site by name (wrapper that uses local sites array)
   */
  const findSiteByName = (name) => findSite(name, sites);

  /**
   * Checks if a row has enough data to be considered for validation and import
   */
  const isRowComplete = (row) => {
    // Check for minimum required data based on report type
    if (reportType === "km/l") {
      // For km/l reports, we need vehicle name and at least some distance or fuel data
      return (
        row.vehicleName?.trim() &&
        ((row.totalDistance && row.totalDistance > 0) ||
          (row.totalFuel && row.totalFuel > 0))
      );
    } else if (reportType === "l/hr") {
      // For l/hr reports, we need vehicle name and engine hours or fuel data
      return (
        row.vehicleName?.trim() &&
        ((row.engHours && row.engHours > 0) ||
          (row.totalFuel && row.totalFuel > 0))
      );
    }

    // Default case
    return false;
  };

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
      comment: (() => {
        // Try multiple variations of comment column names (case-insensitive)
        let commentText =
          row["Comments"] ||
          row["Comment"] ||
          row["comments"] ||
          row["comment"] ||
          row["COMMENTS"] ||
          row["COMMENT"] ||
          row["Comments "] || // With trailing space
          row[" Comment"] || // With leading space
          row[" Comments"] || // With leading space
          "";

        // If still empty, do case-insensitive lookup with normalization
        if (!commentText && row) {
          const commentKey = Object.keys(row).find((key) => {
            if (!key) return false;
            const normalizedKey = key.toLowerCase().trim().replace(/\s+/g, " ");
            return normalizedKey === "comment" || normalizedKey === "comments";
          });
          if (commentKey) {
            commentText = row[commentKey] || "";
          }
        }
        return commentText;
      })(),
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

    // Try multiple variations of comment column names (case-insensitive)
    let commentText =
      row["Comments"] ||
      row["Comment"] ||
      row["comments"] ||
      row["comment"] ||
      row["COMMENTS"] ||
      row["COMMENT"] ||
      row["Comments "] || // With trailing space
      row[" Comment"] || // With leading space
      row[" Comments"] || // With leading space
      "";

    // If still empty, do case-insensitive lookup with normalization
    if (!commentText && row) {
      const commentKey = Object.keys(row).find((key) => {
        if (!key) return false;
        const normalizedKey = key.toLowerCase().trim().replace(/\s+/g, " ");
        return normalizedKey === "comment" || normalizedKey === "comments";
      });
      if (commentKey) {
        commentText = row[commentKey] || "";
      }
    }

    const isNightShift =
      commentText && commentText.toLowerCase().includes("night shift");

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
   * Processes the data preview from the selected file
   */
  const processPreview = () => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array", cellDates: true });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

        const useSkipRows =
          skipRows !== null && !isNaN(parseInt(skipRows))
            ? Math.max(0, parseInt(skipRows))
            : 0;

        const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
          range: useSkipRows,
          defval: null,
          header: 1,
        });

        if (jsonData.length < 2) {
          throw new Error("Excel sheet is empty or has no data rows.");
        }

        const headers = jsonData[0].map(String);
        const dataRows = jsonData.slice(1);

        const dataObjects = dataRows.map((row) => {
          let obj = {};
          headers.forEach((header, index) => {
            obj[header] = row[index];
          });
          return obj;
        });

        // Filter out empty rows that don't have required data
        const filteredObjects = dataObjects.filter((row) => {
          // For km/l reports
          if (reportType === "km/l") {
            return (
              row["Vehicle Name"] ||
              row["Total Distance (GPS)"] ||
              row["Total Distance"] ||
              row["Distance"] ||
              row["Total Fuel"] ||
              row["Fuel Used"] ||
              row["Fuel Consumption"]
            );
          }
          // For l/hr reports
          else if (reportType === "l/hr") {
            return (
              row["Vehice Name"] ||
              row["Vehicle Name"] ||
              row["Total fuel"] ||
              row["Total Fuel"] ||
              row["Runtime Eng hrs"] ||
              row["Engine Hours"]
            );
          }
          return false;
        });

        console.log(
          `Filtered out ${
            dataObjects.length - filteredObjects.length
          } empty rows`
        );

        let processedData = [];
        if (reportType === "km/l") {
          processedData = filteredObjects.map((row, index) =>
            mapKmLData(row, index)
          );
        } else if (reportType === "l/hr") {
          processedData = filteredObjects.map((row, index) =>
            mapLHrData(row, index)
          );
        }

        setParsedData(processedData);
        const clientErrors = validateData(processedData);

        setPreviewedOnce(true);
        if (clientErrors.length > 0) {
          showToast(
            `Preview generated for ${processedData.length} rows with ${clientErrors.length} potential issues.`,
            "warning"
          );
        } else {
          showToast(
            `Preview generated for ${processedData.length} rows. Data looks good!`,
            "info"
          );
        }
      } catch (error) {
        console.error("Error parsing Excel file:", error);
        showToast(`Error processing Excel file: ${error.message}`, "error");
        handleClearPreview();
      }
    };
    reader.onerror = (error) => {
      console.error("FileReader error:", error);
      showToast("Error reading file", "error");
    };
    reader.readAsArrayBuffer(file);
  };

  return {
    processPreview,
    mapKmLData,
    mapLHrData,
    isRowComplete,
    findVehicleByName,
    findSiteByName,
  };
};

export default useExcelParsing;
