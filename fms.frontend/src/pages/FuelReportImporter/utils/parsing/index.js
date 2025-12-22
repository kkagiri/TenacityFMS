/**
 * File: utils/parsing/index.js
 * Purpose: File parsing and detection utilities for Excel imports
 */

/**
 * Site name mapping for special cases
 * Maps filename patterns to actual site names in the database
 */
const SITE_NAME_MAPPINGS = {
  FOOTBRIDGE: "BRIDGE",
  IP: "Industrial Plot",
};

/**
 * Month name to number mapping
 */
const MONTH_MAPPINGS = {
  january: "01",
  jan: "01",
  february: "02",
  feb: "02",
  march: "03",
  mar: "03",
  april: "04",
  apr: "04",
  may: "05",
  june: "06",
  jun: "06",
  july: "07",
  jul: "07",
  august: "08",
  aug: "08",
  september: "09",
  sep: "09",
  october: "10",
  oct: "10",
  november: "11",
  nov: "11",
  december: "12",
  dec: "12",
};

/**
 * Detect site from filename pattern
 * Expects pattern: "SITENAME Fuel Report MONTH YEAR.xlsx"
 * @param {string} filename - The filename to parse
 * @param {Array} sitesList - List of available sites
 * @returns {Object|null} Detected site or null
 */
export const detectSiteFromFilename = (filename, sitesList) => {
  if (!filename || !sitesList || sitesList.length === 0) return null;

  // Extract site name from filename pattern: SITENAME Fuel Report MONTH YEAR.xlsx
  const fileNamePattern = /^(.*?)(?:\s+)?Fuel Report/i;
  const match = filename.match(fileNamePattern);

  if (match && match[1]) {
    let siteName = match[1].trim();

    // Apply special case mappings
    const upperSiteName = siteName.toUpperCase();
    if (SITE_NAME_MAPPINGS[upperSiteName]) {
      siteName = SITE_NAME_MAPPINGS[upperSiteName];
    }

    // Find site by name (case-insensitive)
    const detectedSite = sitesList.find(
      (site) => site.name.toUpperCase() === siteName.toUpperCase()
    );

    return detectedSite || null;
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
  if (!filename) return null;

  const lowerFilename = filename.toLowerCase();

  // Try to find month name
  for (const [monthName, monthNum] of Object.entries(MONTH_MAPPINGS)) {
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
 * Helper function to get column value with flexible matching
 * Handles column names with newlines, extra spaces, typos, etc.
 * @param {Object} row - Excel row data
 * @param {Array<string>} possibleNames - Array of possible column names
 * @returns {*} Column value or empty string
 */
export const getColumnValue = (row, possibleNames) => {
  // Normalize a key for matching (remove newlines, extra spaces, lowercase)
  const normalize = (str) =>
    (str || "")
      .toString()
      .replace(/[\r\n]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

  // First try exact key matches
  for (const name of possibleNames) {
    const value = row[name];
    if (value !== undefined && value !== null && value !== "") {
      return typeof value === "string" ? value.trim() : value;
    }
  }

  // Try normalized matching (handles newlines/extra spaces in Excel headers)
  const rowKeys = Object.keys(row);
  for (const name of possibleNames) {
    const normalizedName = normalize(name);
    for (const key of rowKeys) {
      if (normalize(key) === normalizedName) {
        const value = row[key];
        if (value !== undefined && value !== null && value !== "") {
          return typeof value === "string" ? value.trim() : value;
        }
      }
    }
  }

  // Fallback: contains-match for partial matches
  for (const name of possibleNames) {
    const normalizedName = normalize(name);
    for (const key of rowKeys) {
      const normalizedKey = normalize(key);
      if (
        normalizedKey.includes(normalizedName) ||
        normalizedName.includes(normalizedKey)
      ) {
        const value = row[key];
        if (value !== undefined && value !== null && value !== "") {
          return typeof value === "string" ? value.trim() : value;
        }
      }
    }
  }

  return "";
};
