import axiosInstance from "../api/axiosInstance";

const tankService = {
  /**
   * Get all tanks for a specific site
   * @param {number} siteId - Site ID to get tanks for
   * @returns {Promise<Array>} - Array of tank objects
   */
  getTanksBySite: async (siteId) => {
    try {
      const response = await axiosInstance.get(`/tank/site/${siteId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching tanks for site ${siteId}:`, error);
      throw error;
    }
  },

  /**
   * Get a specific tank by ID
   * @param {number} tankId - Tank ID
   * @returns {Promise<object>} - Tank object
   */
  getTankById: async (tankId) => {
    try {
      const response = await axiosInstance.get(`/tank/${tankId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching tank ${tankId}:`, error);
      throw error;
    }
  },

  /**
   * Get all tanks (optionally filtered by site IDs)
   * @param {string} siteIds - Comma-separated site IDs (optional)
   * @returns {Promise<Array>} - Array of tank objects
   */
  getAllTanks: async (siteIds = null) => {
    try {
      const url = siteIds ? `/tank?siteIds=${siteIds}` : '/tank';
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching tanks:', error);
      throw error;
    }
  },

  /**
   * Extract tank data from UploadStatus probe measurements
   * Maps probe measurements to tank objects with real-time data
   * @param {object} uploadStatus - Raw upload status from device
   * @param {Array} tanks - Array of tank objects from database
   * @returns {Array} - Tanks enriched with real-time probe data
   */
  enrichTanksWithProbeData: (uploadStatus, tanks) => {
    if (!uploadStatus?.probes?.onlineStatus || !tanks || tanks.length === 0) {
      return tanks;
    }

    const probes = uploadStatus.probes.onlineStatus;
    const enrichedTanks = tanks.map(tank => {
      // Find matching probe by ProbeId or ProbeNumber
      const probeIndex = probes.ids?.findIndex(id => id === tank.probeId);

      if (probeIndex !== -1 && probes.measurements && probes.measurements[probeIndex]) {
        const measurement = probes.measurements[probeIndex];

        // Measurement array structure:
        // [probeNumber, productHeight, waterHeight, temperature, productVolume,
        //  waterVolume, productUllage, productTCVolume, density, mass, fillingPercentage]

        return {
          ...tank,
          currentLevel: measurement[4] || tank.currentStock || 0, // ProductVolume
          fillingPercentage: measurement[10] || 0, // TankFillingPercentage
          temperature: measurement[3] || null, // Temperature
          waterLevel: measurement[2] || null, // WaterHeight
          lastUpdated: new Date().toISOString(),
          probeOnline: true,
        };
      }

      // No probe data available, return tank with database values
      return {
        ...tank,
        currentLevel: tank.currentStock || tank.physicalStockValue || 0,
        fillingPercentage: tank.currentStock && tank.capacity
          ? Math.round((tank.currentStock / tank.capacity) * 100)
          : 0,
        probeOnline: false,
      };
    });

    return enrichedTanks;
  },

  /**
   * Format tank display text for SelectBox
   * @param {object} tank - Tank object with currentLevel and capacity
   * @returns {string} - Formatted display text
   */
  formatTankDisplay: (tank) => {
    if (!tank) return '';

    const currentLevel = tank.currentLevel || tank.currentStock || 0;
    const capacity = tank.capacity || 0;
    const percentage = tank.fillingPercentage || 0;

    return `${tank.name} (${currentLevel.toLocaleString()}L / ${capacity.toLocaleString()}L) - ${percentage}%`;
  },

  /**
   * Get tank status color based on filling percentage
   * @param {number} percentage - Filling percentage (0-100)
   * @returns {string} - Status color class
   */
  getTankStatusColor: (percentage) => {
    if (percentage > 60) return 'success';
    if (percentage > 30) return 'warning';
    return 'danger';
  },
};

export default tankService;
