/**
 * File: batchImportUtils.js
 * Purpose: Utility functions for batch import operations
 * Last Modified: 2025-12-03
 */

/**
 * Format file size in human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
};

/**
 * Detect site from filename pattern
 * @param {string} filename - The filename to parse
 * @param {Array} sitesList - List of available sites
 * @returns {Object|null} Detected site or null
 */
export const detectSiteFromFilename = (filename, sitesList) => {
  // Extract site name from filename pattern: SITENAME Fuel Report MONTH YEAR.xlsx
  const fileNamePattern = /^(.*?)(?:\s+)?Fuel Report/i;
  const match = filename.match(fileNamePattern);

  if (match && match[1]) {
    let siteName = match[1].trim();

    // Special case for FOOTBRIDGE which should map to BRIDGE
    if (siteName.toUpperCase() === "FOOTBRIDGE") {
      siteName = "BRIDGE";
    }
    // Special case for IP which should map to Industrial Plot
    else if (siteName.toUpperCase() === "IP") {
      siteName = "Industrial Plot";
    }

    // Find site by name (case-insensitive)
    const detectedSite = sitesList.find(
      site => site.name.toUpperCase() === siteName.toUpperCase()
    );

    return detectedSite;
  }

  // Fallback: try simple includes check
  const lowerFilename = filename.toLowerCase();
  for (const site of sitesList) {
    const siteName = site.name.toLowerCase();
    if (lowerFilename.includes(siteName)) {
      return site;
    }
  }

  return null;
};

/**
 * Detect month from filename patterns
 * @param {string} filename - The filename to parse
 * @returns {string|null} Month in YYYY-MM format or null
 */
export const detectMonthFromFilename = (filename) => {
  const months = {
    january: "01", jan: "01",
    february: "02", feb: "02",
    march: "03", mar: "03",
    april: "04", apr: "04",
    may: "05",
    june: "06", jun: "06",
    july: "07", jul: "07",
    august: "08", aug: "08",
    september: "09", sep: "09",
    october: "10", oct: "10",
    november: "11", nov: "11",
    december: "12", dec: "12",
  };

  const lowerFilename = filename.toLowerCase();

  // Try to find month name
  for (const [monthName, monthNum] of Object.entries(months)) {
    if (lowerFilename.includes(monthName)) {
      // Try to extract year (e.g., "2025")
      const yearMatch = filename.match(/20\d{2}/);
      const year = yearMatch ? yearMatch[0] : new Date().getFullYear();
      return `${year}-${monthNum}`;
    }
  }

  // Try pattern like "01-2025" or "01_2025"
  const datePattern = /(\d{2})[-_]?(20\d{2})/;
  const match = filename.match(datePattern);
  if (match) {
    return `${match[2]}-${match[1]}`;
  }

  return null;
};

/**
 * Find vehicle by name (case-insensitive match)
 * @param {string} vehicleName - Vehicle name to search for
 * @param {Array} vehicles - List of available vehicles
 * @returns {Object|null} Matched vehicle or null
 */
export const findVehicleByName = (vehicleName, vehicles) => {
  if (!vehicleName || !vehicles || vehicles.length === 0) return null;
  const normalizedName = vehicleName.toString().trim().toLowerCase();
  return vehicles.find(
    (v) => v.hyoungNo?.toLowerCase() === normalizedName ||
           v.registrationNo?.toLowerCase() === normalizedName ||
           v.name?.toLowerCase() === normalizedName
  );
};

/**
 * Map Excel row data to km/l report format
 * @param {Object} row - Excel row data
 * @param {number} index - Row index
 * @param {Function} findVehicle - Function to find vehicle by name
 * @param {Object} fileData - File metadata
 * @param {Array} sites - Available sites
 * @returns {Object} Mapped data object
 */
export const mapKmLReportRow = (row, index, findVehicle, fileData, sites) => {
  const vehicleName = row["Vehicle Name"] || row["Vehicle"] || row["VEHICLE"] || row["Reg#"] || "";
  const vehicle = findVehicle(vehicleName);
  const site = sites.find(s => s.id === fileData.siteId);
  const dateValue = row["Date"] ? new Date(row["Date"]) : null;

  return {
    date: dateValue,
    vehicleName: vehicleName,
    vehicleId: vehicle?.vehicleId || null,
    siteId: fileData.siteId,
    siteName: site?.name || "",
    driverName: row["Driver"] || row["Driver Name"] || "",
    totalDistance: parseFloat(row["Km Covered"] || row["Total Distance"]) || 0,
    totalFuel: parseFloat(row["Fuel"] || row["Total Fuel"]) || 0,
    fuelEfficiency: parseFloat(row["Km/ Litre"] || row["Fuel Efficiency"]) || 0,
    maxSpeed: parseFloat(row["Max Speed"]) || 0,
    avgSpeed: parseFloat(row["Avg Speed"]) || 0,
    comment: row["Comment"] || row["Comments"] || "",
    isNightShift: (row["Shift"]?.toLowerCase() || "").includes("night"),
    isKmperLiter: true,
    engHours: 0,
    workingExpectedAverage: parseFloat(row["Expected Average"]) || 0,
    fuelLost: parseFloat(row["Fuel Lost"]) || 0,
    _rowIndex: index,
    skipDuplicates: fileData.duplicateHandling === "skip",
  };
};

/**
 * Map Excel row data to l/hr report format
 * @param {Object} row - Excel row data
 * @param {number} index - Row index
 * @param {Function} findVehicle - Function to find vehicle by name
 * @param {Object} fileData - File metadata
 * @param {Array} sites - Available sites
 * @returns {Object} Mapped data object
 */
export const mapLHrReportRow = (row, index, findVehicle, fileData, sites) => {
  const vehicleName = row["Vehicle Name"] || row["Vehice Name"] || row["Vehicle"] || row["VEHICLE"] || row["Reg#"] || "";
  const vehicle = findVehicle(vehicleName);
  const site = sites.find(s => s.id === fileData.siteId);
  const dateValue = row["Date"] ? new Date(row["Date"]) : null;
  const commentText = row["Comments"] || row["Comment"] || "";
  const isNightShift = (row["Shift"]?.toLowerCase() || commentText.toLowerCase() || "").includes("night");

  return {
    date: dateValue,
    vehicleName: vehicleName,
    vehicleId: vehicle?.vehicleId || null,
    siteId: fileData.siteId,
    siteName: site?.name || "",
    driverName: row["Driver"] || row["Driver Name"] || "",
    engHours: parseFloat(row["Working Hrs"] || row["Runtime Eng hrs"] || row["Engine Hours"]) || 0,
    totalFuel: parseFloat(row["Total fuel"] || row["Total Fuel"] || row["Fuel"]) || 0,
    fuelEfficiency: parseFloat(row["Fuel Eff (l/hr)"] || row["Ltr/Hr"] || row["Fuel Efficiency"]) || 0,
    workingExpectedAverage: parseFloat(row["Expected Fuel Eff"] || row["Expected Average"]) || 0,
    fuelLost: parseFloat(row["Fuel lost"] || row["Fuel Lost"]) || 0,
    flowMeterEngineHrs: parseFloat(row["Flow meter Eng Hrs"] || row["Flow Meter Engine Hrs"]) || 0,
    flowMeterFuelUsed: parseFloat(row["Flow meter Total fuel"] || row["Flow Meter Fuel Used"]) || 0,
    flowMeterEffiency: parseFloat(row["Flow meter Fuel eff"] || row["Flow Meter Efficiency"]) || 0,
    flowMeterFuelLost: parseFloat(row["Flow meter Fuel lost"] || row["Flow Meter Fuel Lost"]) || 0,
    excessWorkingHrsCost: parseFloat(row["Excessive Hours (10)"] || row["Excess Working Hrs Cost"]) || 0,
    totalDistance: parseFloat(row["Total Distance"]) || 0,
    comment: commentText,
    isNightShift: isNightShift,
    isKmperLiter: false,
    maxSpeed: 0,
    avgSpeed: 0,
    _rowIndex: index,
    skipDuplicates: fileData.duplicateHandling === "skip",
  };
};
