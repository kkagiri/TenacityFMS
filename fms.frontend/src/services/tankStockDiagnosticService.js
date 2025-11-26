import axiosInstance from '../api/axiosInstance';

/**
 * Service for Tank Stock Period Diagnostic API operations
 * Provides comprehensive diagnostic data combining TankStock, TankVolumeHistory, and TankTransfers
 */
class TankStockDiagnosticService {
  constructor() {
    this.baseUrl = 'tankstockreports';
  }

  /**
   * Get comprehensive diagnostic data for a specific tank period
   * Returns all transactions, reconciliation calculations, and data quality warnings
   *
   * @param {Object} params - Diagnostic query parameters
   * @param {number} params.tankId - Tank ID to analyze (required)
   * @param {Date} params.startDate - Period start date (required)
   * @param {Date} params.endDate - Period end date (required)
   * @param {boolean} params.includeAllTransactionTypes - Include adjustments & reconciliations (default: true)
   * @param {boolean} params.includeDeletedRecords - Include soft-deleted records (default: false)
   * @returns {Promise<Object>} Diagnostic result with stock entries, volume transactions, transfers, and warnings
   */
  async getPeriodDiagnostic(params = {}) {
    try {
      const {
        tankId,
        startDate,
        endDate,
        includeAllTransactionTypes = true,
        includeDeletedRecords = false
      } = params;

      // Validate required parameters
      if (!tankId) {
        throw new Error('Tank ID is required');
      }
      if (!startDate || !endDate) {
        throw new Error('Start date and end date are required');
      }

      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('tankId', tankId);
      queryParams.append('startDate', startDate instanceof Date ? startDate.toISOString() : startDate);
      queryParams.append('endDate', endDate instanceof Date ? endDate.toISOString() : endDate);
      queryParams.append('includeAllTransactionTypes', includeAllTransactionTypes);
      queryParams.append('includeDeletedRecords', includeDeletedRecords);

      console.log('🔍 Fetching period diagnostic data:', {
        tankId,
        startDate: startDate instanceof Date ? startDate.toISOString() : startDate,
        endDate: endDate instanceof Date ? endDate.toISOString() : endDate,
        includeAllTransactionTypes,
        includeDeletedRecords
      });

      const response = await axiosInstance.get(
        `${this.baseUrl}/period-diagnostic?${queryParams}`
      );

      if (response.status === 200 && response.data) {
        console.log('✅ Period diagnostic data loaded successfully');
        return {
          success: true,
          data: response.data.data || response.data,
          message: response.data.message
        };
      }

      throw new Error(response.data?.message || 'Failed to fetch period diagnostic data');
    } catch (error) {
      console.error('❌ Error fetching period diagnostic data:', error);

      return {
        success: false,
        data: null,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Format diagnostic data for display
   * Enriches the raw diagnostic data with formatted values and metadata
   */
  formatDiagnosticData(rawData) {
    if (!rawData) return null;

    return {
      ...rawData,

      // Format dates for display
      startDateFormatted: new Date(rawData.startDate).toLocaleString(),
      endDateFormatted: new Date(rawData.endDate).toLocaleString(),

      // Calculate period duration
      periodDurationHours: this.calculatePeriodDuration(rawData.startDate, rawData.endDate),

      // Group volume transactions by type
      volumeTransactionsByType: this.groupVolumeTransactionsByType(rawData.volumeTransactions || []),

      // Get warning counts by severity
      warningCounts: this.getWarningCounts(rawData.warnings || []),

      // Add severity class for variance
      varianceSeverityClass: this.getVarianceSeverityClass(
        rawData.reconciliation?.variancePercentage,
        rawData.reconciliation?.variance
      )
    };
  }

  /**
   * Calculate period duration in hours
   */
  calculatePeriodDuration(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const durationMs = end - start;
    return (durationMs / (1000 * 60 * 60)).toFixed(1);
  }

  /**
   * Group volume transactions by change reason type
   */
  groupVolumeTransactionsByType(transactions) {
    const grouped = {};

    transactions.forEach(txn => {
      const reason = txn.changeReason || 'Unknown';
      if (!grouped[reason]) {
        grouped[reason] = [];
      }
      grouped[reason].push(txn);
    });

    return grouped;
  }

  /**
   * Count warnings by severity
   */
  getWarningCounts(warnings) {
    return {
      critical: warnings.filter(w => w.severity === 'critical').length,
      warning: warnings.filter(w => w.severity === 'warning').length,
      info: warnings.filter(w => w.severity === 'info').length,
      total: warnings.length
    };
  }

  /**
   * Get CSS class for variance severity
   */
  getVarianceSeverityClass(variancePercentage, variance) {
    const absPercentage = Math.abs(variancePercentage || 0);
    const absVariance = Math.abs(variance || 0);

    if (absPercentage <= 5 && absVariance <= 50) {
      return 'acceptable'; // Green
    } else if (absPercentage <= 10 && absVariance <= 200) {
      return 'moderate'; // Yellow
    } else {
      return 'high'; // Red
    }
  }

  /**
   * Export diagnostic data as JSON
   */
  exportAsJSON(diagnosticData, filename = null) {
    const fileName = filename || `diagnostic_tank_${diagnosticData.tankId}_${new Date().toISOString().split('T')[0]}.json`;
    const dataStr = JSON.stringify(diagnosticData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();

    URL.revokeObjectURL(url);
  }

  /**
   * Get summary statistics from diagnostic data
   */
  getSummaryStatistics(diagnosticData) {
    if (!diagnosticData) return null;

    const { reconciliation, stockEntries, volumeTransactions, transfers, warnings } = diagnosticData;

    return {
      // Reconciliation stats
      varianceAmount: reconciliation?.variance || 0,
      variancePercentage: reconciliation?.variancePercentage || 0,
      expectedClosing: reconciliation?.expectedClosing || 0,
      actualClosing: reconciliation?.actualClosing || 0,

      // Transaction counts
      stockEntryCount: stockEntries?.length || 0,
      volumeTransactionCount: volumeTransactions?.length || 0,
      transferCount: transfers?.length || 0,

      // Dispensing breakdown
      totalDispensing: reconciliation?.dispensingBreakdown?.total || 0,
      manualDispensing: reconciliation?.dispensingBreakdown?.manualAggregate || 0,
      sensorDispensing: reconciliation?.dispensingBreakdown?.sensorDispensing || 0,
      automatedDispensing: reconciliation?.dispensingBreakdown?.automatedDispensing || 0,

      // Transfers
      transfersIn: reconciliation?.transfersIn || 0,
      transfersOut: reconciliation?.transfersOut || 0,

      // Warnings
      criticalWarnings: warnings?.filter(w => w.severity === 'critical').length || 0,
      totalWarnings: warnings?.length || 0,

      // Data quality score (0-100)
      dataQualityScore: this.calculateDataQualityScore(diagnosticData)
    };
  }

  /**
   * Calculate data quality score based on various factors
   */
  calculateDataQualityScore(diagnosticData) {
    let score = 100;

    const { reconciliation, warnings, stockEntries, volumeTransactions } = diagnosticData;

    // Deduct points for high variance
    const variancePercentage = Math.abs(reconciliation?.variancePercentage || 0);
    if (variancePercentage > 20) {
      score -= 30;
    } else if (variancePercentage > 10) {
      score -= 15;
    } else if (variancePercentage > 5) {
      score -= 5;
    }

    // Deduct points for warnings
    const criticalWarnings = warnings?.filter(w => w.severity === 'critical').length || 0;
    const normalWarnings = warnings?.filter(w => w.severity === 'warning').length || 0;
    score -= (criticalWarnings * 15);
    score -= (normalWarnings * 5);

    // Deduct points for missing data
    if (!stockEntries || stockEntries.length === 0) {
      score -= 20;
    }
    if (!volumeTransactions || volumeTransactions.length === 0) {
      score -= 10;
    }

    return Math.max(0, score);
  }
}

const tankStockDiagnosticService = new TankStockDiagnosticService();
export default tankStockDiagnosticService;
