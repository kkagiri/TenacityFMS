/**
 * TankStockService - Complete Tank Stock Management Service
 *
 * Migrated from tankStockAction.js to use BaseService architecture:
 * - FMSResponse<T> handling
 * - v1 API endpoints
 * - Standardized error handling
 * - Caching and performance optimization
 * - Enterprise patterns
 *
 * @version 1.0.0
 * @since API v1
 */

import BaseService from '../core/BaseService';

export class TankStockService extends BaseService {
  constructor(config) {
    super(config);
    this.baseUrl = '/tankstock';
  }

  // ===========================================
  // TANK STOCK CORE OPERATIONS
  // ===========================================

  /**
   * Fetch tank stocks with filtering
   * @param {Object} filters - Filter criteria
   * @param {number} [filters.siteId] - Site ID filter
   * @param {number} [filters.tankId] - Tank ID filter
   * @returns {Promise<FMSResponse<TankStock[]>>}
   */
  async fetchTankStocks(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.siteId) params.append('siteId', filters.siteId);
      if (filters.tankId) params.append('tankId', filters.tankId);

      const url = params.toString() ? `${this.baseUrl}?${params.toString()}` : this.baseUrl;

      return await this.get(url, {
        cacheKey: `tank-stocks-${JSON.stringify(filters)}`,
        cacheTTL: 2 * 60 * 1000 // 2 minutes cache
      });
    } catch (error) {
      return this.handleError('Error fetching tank stocks', error);
    }
  }

  /**
   * Fetch single tank stock by ID
   * @param {number} id - Tank stock ID
   * @returns {Promise<FMSResponse<TankStock>>}
   */
  async fetchTankStockById(id) {
    try {
      return await this.get(`${this.baseUrl}/${id}`, {
        cacheKey: `tank-stock-${id}`,
        cacheTTL: 5 * 60 * 1000 // 5 minutes cache
      });
    } catch (error) {
      return this.handleError(`Error fetching tank stock ${id}`, error);
    }
  }

  /**
   * Create new tank stock entry
   * @param {Object} tankStock - Tank stock data
   * @returns {Promise<FMSResponse<TankStock>>}
   */
  async createTankStock(tankStock) {
    try {
      const result = await this.post(this.baseUrl, tankStock);

      // Clear related caches
      this.clearCachePattern('tank-stocks-');

      return result;
    } catch (error) {
      return this.handleError('Error creating tank stock', error);
    }
  }

  /**
   * Update tank stock entry
   * @param {number} id - Tank stock ID
   * @param {Object} tankStock - Updated tank stock data
   * @returns {Promise<FMSResponse<TankStock>>}
   */
  async updateTankStock(id, tankStock) {
    try {
      const result = await this.put(`${this.baseUrl}/${id}`, tankStock);

      // Clear related caches
      this.clearCachePattern('tank-stocks-');
      this.clearCache(`tank-stock-${id}`);

      return result;
    } catch (error) {
      return this.handleError(`Error updating tank stock ${id}`, error);
    }
  }

  /**
   * Delete tank stock entry
   * @param {number} id - Tank stock ID
   * @returns {Promise<FMSResponse<boolean>>}
   */
  async deleteTankStock(id) {
    try {
      const result = await this.delete(`${this.baseUrl}/${id}`);

      // Clear related caches
      this.clearCachePattern('tank-stocks-');
      this.clearCache(`tank-stock-${id}`);

      return result;
    } catch (error) {
      return this.handleError(`Error deleting tank stock ${id}`, error);
    }
  }

  // ===========================================
  // STOCK ENTRY OPERATIONS
  // ===========================================

  /**
   * Create opening stock entry
   * @param {Object} params - Opening stock parameters
   * @param {number} params.tankId - Tank ID
   * @param {number} params.amount - Stock amount
   * @param {string|Date} params.dateTime - Entry date/time
   * @returns {Promise<FMSResponse<TankStock>>}
   */
  async createOpeningStock(params) {
    try {
      // Validate required parameters
      if (!params.tankId || params.tankId <= 0) {
        return this.createValidationErrorResponse('Invalid tank ID');
      }

      if (!params.amount || params.amount < 0) {
        return this.createValidationErrorResponse('Invalid stock amount');
      }

      const tankId = params.tankId;
      const amount = params.amount;
      const dateTime = this.formatDateTime(params.dateTime || params.date);

      const queryParams = new URLSearchParams({
        tankId: tankId.toString(),
        amount: amount.toString(),
        dateTime: dateTime
      });

      const result = await this.post(`${this.baseUrl}/openingstock?${queryParams.toString()}`);

      // Clear related caches
      this.clearCachePattern('tank-stocks-');

      return result;
    } catch (error) {
      return this.handleError('Error creating opening stock', error);
    }
  }

  /**
   * Create closing stock entry
   * @param {Object} params - Closing stock parameters
   * @param {number} params.tankId - Tank ID
   * @param {number} params.amount - Stock amount
   * @param {string|Date} params.dateTime - Entry date/time
   * @returns {Promise<FMSResponse<TankStock>>}
   */
  async createClosingStock(params) {
    try {
      // Validate required parameters
      if (!params.tankId || params.tankId <= 0) {
        return this.createValidationErrorResponse('Invalid tank ID');
      }

      if (!params.amount || params.amount < 0) {
        return this.createValidationErrorResponse('Invalid stock amount');
      }

      const tankId = params.tankId;
      const amount = params.amount;
      const dateTime = this.formatDateTime(params.dateTime || params.date);

      const queryParams = new URLSearchParams({
        tankId: tankId.toString(),
        amount: amount.toString(),
        dateTime: dateTime
      });

      if (params.confirmOverride) {
        queryParams.append('confirmOverride', 'true');
      }

      const result = await this.post(`${this.baseUrl}/closingstock?${queryParams.toString()}`);

      // Clear related caches
      this.clearCachePattern('tank-stocks-');

      return result;
    } catch (error) {
      return this.handleError('Error creating closing stock', error);
    }
  }

  /**
   * Create tank transfer
   * @param {Object} tankTransferDTO - Tank transfer data
   * @param {number} tankTransferDTO.sourceTankId - Source tank ID
   * @param {number} tankTransferDTO.destinationTankId - Destination tank ID
   * @param {number} tankTransferDTO.amount - Transfer amount
   * @returns {Promise<FMSResponse<TankTransfer>>}
   */
  async createTankTransfer(tankTransferDTO) {
    try {
      // Validate required fields
      if (!tankTransferDTO.sourceTankId || tankTransferDTO.sourceTankId <= 0) {
        return this.createValidationErrorResponse('Invalid source tank ID');
      }

      if (!tankTransferDTO.destinationTankId || tankTransferDTO.destinationTankId <= 0) {
        return this.createValidationErrorResponse('Invalid destination tank ID');
      }

      if (tankTransferDTO.sourceTankId === tankTransferDTO.destinationTankId) {
        return this.createValidationErrorResponse('Source and destination tanks must be different');
      }

      if (!tankTransferDTO.amount || tankTransferDTO.amount <= 0) {
        return this.createValidationErrorResponse('Transfer amount must be greater than 0');
      }

      const result = await this.post(`${this.baseUrl}/transfer`, tankTransferDTO);

      // Clear related caches
      this.clearCachePattern('tank-stocks-');

      return result;
    } catch (error) {
      return this.handleError('Error creating tank transfer', error);
    }
  }

  // ===========================================
  // DISCREPANCIES AND RECONCILIATION
  // ===========================================

  /**
   * Fetch stock discrepancies
   * @param {Object} filters - Filter criteria
   * @param {number} [filters.siteId] - Site ID filter
   * @param {number} [filters.threshold] - Discrepancy threshold
   * @returns {Promise<FMSResponse<StockDiscrepancy[]>>}
   */
  async fetchStockDiscrepancies(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.siteId) params.append('siteId', filters.siteId);
      if (filters.threshold !== undefined) params.append('threshold', filters.threshold);

      const url = `${this.baseUrl}/discrepancies${params.toString() ? '?' + params.toString() : ''}`;

      return await this.get(url, {
        cacheKey: `stock-discrepancies-${JSON.stringify(filters)}`,
        cacheTTL: 1 * 60 * 1000 // 1 minute cache (frequently changing data)
      });
    } catch (error) {
      return this.handleError('Error fetching stock discrepancies', error);
    }
  }

  /**
   * Reconcile stocks
   * @param {Object} reconciliationData - Reconciliation parameters
   * @param {number} reconciliationData.siteId - Site ID
   * @param {number} reconciliationData.userId - User ID
   * @returns {Promise<FMSResponse<ReconciliationResult>>}
   */
  async reconcileStocks(reconciliationData) {
    try {
      if (!reconciliationData.siteId) {
        return this.createValidationErrorResponse('Site ID is required');
      }

      if (!reconciliationData.userId) {
        return this.createValidationErrorResponse('User ID is required');
      }

      const result = await this.post(`${this.baseUrl}/reconcile`, {
        siteId: reconciliationData.siteId,
        userId: reconciliationData.userId
      });

      // Clear related caches after reconciliation
      this.clearCachePattern('stock-discrepancies-');
      this.clearCachePattern('tank-stocks-');

      return result;
    } catch (error) {
      return this.handleError('Error reconciling stocks', error);
    }
  }

  // ===========================================
  // STOCK ADJUSTMENTS
  // ===========================================

  /**
   * Create stock adjustment
   * @param {Object} adjustmentData - Adjustment data
   * @returns {Promise<FMSResponse<StockAdjustment>>}
   */
  async createStockAdjustment(adjustmentData) {
    try {
      const result = await this.post(`${this.baseUrl}/adjustments`, adjustmentData);

      // Clear related caches
      this.clearCachePattern('tank-stocks-');
      this.clearCachePattern('stock-adjustments-');

      return result;
    } catch (error) {
      return this.handleError('Error creating stock adjustment', error);
    }
  }

  /**
   * Fetch stock adjustments
   * @param {Object} filters - Filter criteria
   * @param {number} [filters.siteId] - Site ID filter
   * @param {number} [filters.tankId] - Tank ID filter
   * @param {string} [filters.startDate] - Start date filter
   * @param {string} [filters.endDate] - End date filter
   * @returns {Promise<FMSResponse<StockAdjustment[]>>}
   */
  async fetchStockAdjustments(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.siteId) params.append('siteId', filters.siteId);
      if (filters.tankId) params.append('tankId', filters.tankId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const url = `${this.baseUrl}/adjustments${params.toString() ? '?' + params.toString() : ''}`;

      return await this.get(url, {
        cacheKey: `stock-adjustments-${JSON.stringify(filters)}`,
        cacheTTL: 5 * 60 * 1000 // 5 minutes cache
      });
    } catch (error) {
      return this.handleError('Error fetching stock adjustments', error);
    }
  }

  // ===========================================
  // FUTURE RECORDS VALIDATION
  // ===========================================

  /**
   * Validate historical entry for future records policy
   * @param {Object} params - Validation parameters
   * @param {number} params.tankId - Tank ID
   * @param {string} params.entryDate - Entry date (ISO format)
   * @param {string} params.entryType - Entry type
   * @returns {Promise<FMSResponse<ValidationResult>>}
   */
  async validateHistoricalEntry(params) {
    try {
      if (!params.tankId || typeof params.tankId !== 'number') {
        return this.createValidationErrorResponse('Invalid tankId: must be a positive number');
      }

      if (!params.entryDate) {
        return this.createValidationErrorResponse('Invalid entryDate: must be provided');
      }

      if (!params.entryType) {
        return this.createValidationErrorResponse('Invalid entryType: must be provided');
      }

      // Ensure entryDate is in ISO format
      const entryDate = params.entryDate instanceof Date
        ? params.entryDate.toISOString()
        : params.entryDate;

      const requestPayload = {
        tankId: params.tankId,
        entryDate: entryDate,
        entryType: params.entryType
      };

      return await this.post(`${this.baseUrl}/validate-historical-entry`, requestPayload);
    } catch (error) {
      return this.handleError('Error validating historical entry', error);
    }
  }

  /**
   * Get future records policy configuration
   * @returns {Promise<FMSResponse<FutureRecordsPolicy>>}
   */
  async getFutureRecordsPolicy() {
    try {
      return await this.get(`${this.baseUrl}/future-records-policy`, {
        cacheKey: 'future-records-policy',
        cacheTTL: 10 * 60 * 1000 // 10 minutes cache
      });
    } catch (error) {
      return this.handleError('Error getting future records policy', error);
    }
  }

  /**
   * Update future records policy configuration
   * @param {Object} policy - Policy configuration
   * @returns {Promise<FMSResponse<FutureRecordsPolicy>>}
   */
  async updateFutureRecordsPolicy(policy) {
    try {
      const result = await this.put(`${this.baseUrl}/future-records-policy`, policy);

      // Clear policy cache
      this.clearCache('future-records-policy');

      return result;
    } catch (error) {
      return this.handleError('Error updating future records policy', error);
    }
  }

  // ===========================================
  // UTILITY METHODS
  // ===========================================

  /**
   * Format date for API consumption
   * @private
   */
  formatDateTime(date) {
    if (!date) return new Date().toISOString();

    if (date instanceof Date) {
      return date.toISOString();
    }

    // If it's already a string, ensure it's properly formatted
    if (typeof date === 'string') {
      const parsedDate = new Date(date);
      return parsedDate.toISOString();
    }

    return new Date().toISOString();
  }

  /**
   * Create validation error response
   * @private
   */
  createValidationErrorResponse(message) {
    return {
      success: false,
      data: null,
      message: message,
      errors: [message],
      errorType: 'VALIDATION'
    };
  }

  /**
   * Clear cache patterns
   * @private
   */
  clearCachePattern(pattern) {
    if (this.cache) {
      const keys = Array.from(this.cache.keys());
      keys.forEach(key => {
        if (key.startsWith(pattern)) {
          this.cache.delete(key);
        }
      });
    }
  }

  /**
   * Health check for tank stock service
   * @returns {Promise<Object>}
   */
  async healthCheck() {
    try {
      // Try to fetch a small amount of data to verify connectivity
      const result = await this.get(`${this.baseUrl}?limit=1`);

      return {
        status: 'healthy',
        message: 'Tank stock service is operational',
        timestamp: new Date().toISOString(),
        responseTime: result.responseTime || 'N/A'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Tank stock service error: ${error.message}`,
        timestamp: new Date().toISOString(),
        error: error
      };
    }
  }
}

export default TankStockService;