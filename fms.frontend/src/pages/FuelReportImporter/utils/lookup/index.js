/**
 * File: utils/lookup/index.js
 * Purpose: Entity lookup utilities (vehicles, sites)
 */

/**
 * Find vehicle by name (case-insensitive match)
 * Matches against hyoungNo, registrationNo, or name
 * @param {string} vehicleName - Vehicle name to search for
 * @param {Array} vehicles - List of available vehicles
 * @returns {Object|null} Matched vehicle or null
 */
export const findVehicleByName = (vehicleName, vehicles) => {
  if (!vehicleName || !vehicles || vehicles.length === 0) return null;
  const normalizedName = vehicleName.toString().trim().toLowerCase();
  return vehicles.find(
    (v) =>
      v.hyoungNo?.toLowerCase() === normalizedName ||
      v.registrationNo?.toLowerCase() === normalizedName ||
      v.name?.toLowerCase() === normalizedName
  );
};

/**
 * Find vehicle by ID
 * @param {number} vehicleId - Vehicle ID to search for
 * @param {Array} vehicles - List of available vehicles
 * @returns {Object|null} Matched vehicle or null
 */
export const findVehicleById = (vehicleId, vehicles) => {
  if (!vehicleId || !vehicles || vehicles.length === 0) return null;
  return vehicles.find((v) => v.vehicleId === vehicleId);
};

/**
 * Find site by name (case-insensitive match)
 * @param {string} siteName - Site name to search for
 * @param {Array} sites - List of available sites
 * @returns {Object|null} Matched site or null
 */
export const findSiteByName = (siteName, sites) => {
  if (!siteName || !sites || sites.length === 0) return null;

  // Apply special case mappings
  let normalizedName = siteName.trim();
  if (normalizedName.toLowerCase() === "british embassy") {
    normalizedName = "BHC";
  }

  return sites.find(
    (site) => site.name.toUpperCase() === normalizedName.toUpperCase()
  );
};

/**
 * Find site by ID
 * @param {number} siteId - Site ID to search for
 * @param {Array} sites - List of available sites
 * @returns {Object|null} Matched site or null
 */
export const findSiteById = (siteId, sites) => {
  if (!siteId || !sites || sites.length === 0) return null;
  return sites.find((site) => site.id === parseInt(siteId));
};
