/**
 * Tank Volume Validation Rules
 *
 * Advanced checks for detecting data quality issues beyond sequence breaks:
 * - Negative volumes
 * - Unrealistic volume changes
 * - Opening/Closing stock anomalies
 * - Duplicate transactions
 * - Missing transaction types
 */

// ============================================================================
// VALIDATION RULES
// ============================================================================

/**
 * Severity levels for validation issues
 */
export const VALIDATION_SEVERITY = {
  CRITICAL: 'CRITICAL',    // System-breaking issues
  HIGH: 'HIGH',            // Major data problems
  MEDIUM: 'MEDIUM',        // Significant anomalies
  LOW: 'LOW',              // Minor issues
  WARNING: 'WARNING'       // Informational
};

/**
 * Validation issue categories
 */
export const ISSUE_CATEGORY = {
  NEGATIVE_VOLUME: 'NEGATIVE_VOLUME',
  UNREALISTIC_CHANGE: 'UNREALISTIC_CHANGE',
  STOCK_ANOMALY: 'STOCK_ANOMALY',
  DUPLICATE_TRANSACTION: 'DUPLICATE_TRANSACTION',
  MISSING_DATA: 'MISSING_DATA',
  SEQUENCE_BREAK: 'SEQUENCE_BREAK',
  TIMING_ANOMALY: 'TIMING_ANOMALY'
};

// ============================================================================
// RULE 1: Negative Volume Check
// ============================================================================

/**
 * Check for negative volumes (opening, closing, or current)
 * CRITICAL: Tank volumes should NEVER be negative
 *
 * Examples from your data:
 * - ST2 OpeningStock: -2,135.00 (INVALID)
 * - ST1 OpeningStock: -5,323.00 (INVALID)
 * - ST2 ClosingStock: -2,480.00 (INVALID)
 */
export const validateNegativeVolume = (transaction) => {
  const issues = [];

  // Check NewVolume (current tank volume)
  if (transaction.newVolume < 0) {
    issues.push({
      severity: VALIDATION_SEVERITY.CRITICAL,
      category: ISSUE_CATEGORY.NEGATIVE_VOLUME,
      field: 'newVolume',
      value: transaction.newVolume,
      message: `Tank volume is negative: ${transaction.newVolume}L`,
      recommendation: 'Data entry error. Verify physical tank level.',
      affectedTransaction: transaction.id,
      transactionType: transaction.changeReason
    });
  }

  // Check VolumeChange (magnitude of change)
  if (transaction.volumeChange < 0) {
    // Negative changes are OK for Dispensing, TransferOut, ClosingStock
    // But check magnitude
    const validNegativeTypes = ['Dispensing', 'TransferOut', 'ClosingStock', 'Adjustment'];
    if (!validNegativeTypes.includes(transaction.changeReason)) {
      issues.push({
        severity: VALIDATION_SEVERITY.HIGH,
        category: ISSUE_CATEGORY.NEGATIVE_VOLUME,
        field: 'volumeChange',
        value: transaction.volumeChange,
        message: `Unexpected negative change for ${transaction.changeReason}: ${transaction.volumeChange}L`,
        recommendation: 'Verify transaction type and volume change direction.',
        affectedTransaction: transaction.id,
        transactionType: transaction.changeReason
      });
    }
  }

  return issues;
};

// ============================================================================
// RULE 2: Unrealistic Volume Change
// ============================================================================

/**
 * Detect unrealistic volume changes
 * - Dispensing > tank capacity is suspicious
 * - Delivery > tank capacity is suspicious
 * - Changes > reasonable daily amount
 *
 * Configurable thresholds:
 * - MAX_SINGLE_CHANGE: 5000L (most tanks don't dispense/deliver > 5000L at once)
 * - MAX_OPENING_STOCK: Tank capacity
 * - MAX_DAILY_THROUGHPUT: 10000L
 */
export const validateUnrealisticChange = (transaction, tankMetadata = {}) => {
  const issues = [];

  // Configuration - adjust based on your fleet
  const MAX_SINGLE_CHANGE = tankMetadata.maxSingleChange || 5000; // liters
  const MAX_OPENING_STOCK = tankMetadata.capacity || 50000; // liters
  const REALISTIC_THRESHOLD = 2000; // liters - what you mentioned

  const absChange = Math.abs(transaction.volumeChange);

  // Rule 2A: Opening/Closing stock should not exceed tank capacity
  if (['OpeningStock', 'ClosingStock'].includes(transaction.changeReason)) {
    if (transaction.newVolume > MAX_OPENING_STOCK) {
      issues.push({
        severity: VALIDATION_SEVERITY.HIGH,
        category: ISSUE_CATEGORY.UNREALISTIC_CHANGE,
        field: 'newVolume',
        value: transaction.newVolume,
        message: `${transaction.changeReason} exceeds tank capacity: ${transaction.newVolume}L (max: ${MAX_OPENING_STOCK}L)`,
        recommendation: 'Check tank capacity or data entry error.',
        affectedTransaction: transaction.id,
        transactionType: transaction.changeReason
      });
    }
  }

  // Rule 2B: Single transaction change should be reasonable
  if (absChange > MAX_SINGLE_CHANGE) {
    // More lenient for Delivery, stricter for Dispensing
    const severity = transaction.changeReason === 'Delivery'
      ? VALIDATION_SEVERITY.MEDIUM
      : VALIDATION_SEVERITY.HIGH;

    issues.push({
      severity: severity,
      category: ISSUE_CATEGORY.UNREALISTIC_CHANGE,
      field: 'volumeChange',
      value: transaction.volumeChange,
      message: `Unrealistic ${transaction.changeReason} volume: ${absChange}L (threshold: ${MAX_SINGLE_CHANGE}L)`,
      recommendation: 'Verify transaction details - may be data entry error or system issue.',
      affectedTransaction: transaction.id,
      transactionType: transaction.changeReason,
      threshold: MAX_SINGLE_CHANGE
    });
  }

  // Rule 2C: Flag unusual but within bounds
  if (absChange > REALISTIC_THRESHOLD && absChange <= MAX_SINGLE_CHANGE) {
    issues.push({
      severity: VALIDATION_SEVERITY.WARNING,
      category: ISSUE_CATEGORY.UNREALISTIC_CHANGE,
      field: 'volumeChange',
      value: transaction.volumeChange,
      message: `Large volume change detected: ${absChange}L for ${transaction.changeReason}`,
      recommendation: 'Verify this is a legitimate large transaction.',
      affectedTransaction: transaction.id,
      transactionType: transaction.changeReason,
      threshold: REALISTIC_THRESHOLD
    });
  }

  return issues;
};

// ============================================================================
// RULE 3: Stock Type Anomalies
// ============================================================================

/**
 * Detect anomalies in Opening/Closing stock
 * - OpeningStock should be positive
 * - ClosingStock should be positive
 * - ClosingStock should not be much different from previous day's ClosingStock
 *   (unless there's a delivery/dispensing)
 *
 * Your data shows:
 * - Multiple negative opening stocks
 * - Multiple negative closing stocks
 */
export const validateStockAnomalies = (transaction, previousDayClosing = null) => {
  const issues = [];

  if (transaction.changeReason === 'OpeningStock') {
    // Opening stock should be positive
    if (transaction.newVolume < 0) {
      issues.push({
        severity: VALIDATION_SEVERITY.CRITICAL,
        category: ISSUE_CATEGORY.STOCK_ANOMALY,
        field: 'newVolume',
        value: transaction.newVolume,
        message: 'Opening stock cannot be negative',
        recommendation: 'Must correct before processing any transactions for this day.',
        affectedTransaction: transaction.id,
        stockType: 'OpeningStock'
      });
    }

    // Opening stock should match previous closing stock
    if (previousDayClosing !== null &&
        Math.abs(transaction.newVolume - previousDayClosing) > 100) {
      issues.push({
        severity: VALIDATION_SEVERITY.MEDIUM,
        category: ISSUE_CATEGORY.STOCK_ANOMALY,
        field: 'newVolume',
        value: transaction.newVolume,
        message: `Opening stock (${transaction.newVolume}L) differs from previous closing (${previousDayClosing}L)`,
        recommendation: 'Expected opening = previous closing. Check for overnight transaction or error.',
        affectedTransaction: transaction.id,
        previousValue: previousDayClosing,
        variance: Math.abs(transaction.newVolume - previousDayClosing),
        stockType: 'OpeningStock'
      });
    }
  }

  if (transaction.changeReason === 'ClosingStock') {
    // Closing stock should be positive
    if (transaction.newVolume < 0) {
      issues.push({
        severity: VALIDATION_SEVERITY.CRITICAL,
        category: ISSUE_CATEGORY.STOCK_ANOMALY,
        field: 'newVolume',
        value: transaction.newVolume,
        message: 'Closing stock cannot be negative',
        recommendation: 'Tank cannot have negative volume. Critical data error.',
        affectedTransaction: transaction.id,
        stockType: 'ClosingStock'
      });
    }
  }

  return issues;
};

// ============================================================================
// RULE 4: Duplicate Transaction Detection
// ============================================================================

/**
 * Detect duplicate or near-duplicate transactions
 * - Same tank, same time, same reason, same amount
 * - Usually caused by double-entry or system retry
 */
export const validateDuplicateTransaction = (transaction, allTransactions) => {
  const issues = [];

  // Find transactions with same key attributes within 1 minute
  const oneMinuteAgo = new Date(new Date(transaction.timestamp).getTime() - 60000);
  const oneMinuteAfter = new Date(new Date(transaction.timestamp).getTime() + 60000);

  const potentialDuplicates = allTransactions.filter(t =>
    t.id !== transaction.id &&
    t.tankId === transaction.tankId &&
    t.changeReason === transaction.changeReason &&
    Math.abs(t.volumeChange - transaction.volumeChange) < 1 &&
    new Date(t.timestamp) >= oneMinuteAgo &&
    new Date(t.timestamp) <= oneMinuteAfter
  );

  if (potentialDuplicates.length > 0) {
    issues.push({
      severity: VALIDATION_SEVERITY.HIGH,
      category: ISSUE_CATEGORY.DUPLICATE_TRANSACTION,
      field: 'transaction',
      value: transaction.id,
      message: `Potential duplicate transaction: ${potentialDuplicates.length} similar transactions within 1 minute`,
      recommendation: 'Verify if duplicate entry. Delete if accidental.',
      affectedTransaction: transaction.id,
      potentialDuplicates: potentialDuplicates.map(t => ({
        id: t.id,
        timestamp: t.timestamp,
        volumeChange: t.volumeChange
      }))
    });
  }

  return issues;
};

// ============================================================================
// RULE 5: Timing Anomalies
// ============================================================================

/**
 * Detect timing anomalies
 * - Transactions out of order
 * - OpeningStock not first transaction of day
 * - ClosingStock not last transaction of day
 * - Transactions with future timestamps
 */
export const validateTimingAnomalies = (transaction, dayTransactions) => {
  const issues = [];
  const txTime = new Date(transaction.timestamp);
  const now = new Date();

  // Rule 5A: Future timestamp
  if (txTime > now) {
    issues.push({
      severity: VALIDATION_SEVERITY.HIGH,
      category: ISSUE_CATEGORY.TIMING_ANOMALY,
      field: 'timestamp',
      value: transaction.timestamp,
      message: 'Transaction has future timestamp',
      recommendation: 'Verify transaction date/time.',
      affectedTransaction: transaction.id,
      timestamp: transaction.timestamp
    });
  }

  // Rule 5B: OpeningStock must be first of day
  if (transaction.changeReason === 'OpeningStock') {
    const earlierTx = dayTransactions.find(t =>
      new Date(t.timestamp) < txTime && t.id !== transaction.id
    );
    if (earlierTx) {
      issues.push({
        severity: VALIDATION_SEVERITY.MEDIUM,
        category: ISSUE_CATEGORY.TIMING_ANOMALY,
        field: 'timestamp',
        value: transaction.timestamp,
        message: 'OpeningStock should be first transaction of day',
        recommendation: 'Move OpeningStock before other transactions.',
        affectedTransaction: transaction.id,
        conflictingTransaction: earlierTx.id
      });
    }
  }

  // Rule 5C: ClosingStock must be last of day
  if (transaction.changeReason === 'ClosingStock') {
    const laterTx = dayTransactions.find(t =>
      new Date(t.timestamp) > txTime && t.id !== transaction.id
    );
    if (laterTx) {
      issues.push({
        severity: VALIDATION_SEVERITY.MEDIUM,
        category: ISSUE_CATEGORY.TIMING_ANOMALY,
        field: 'timestamp',
        value: transaction.timestamp,
        message: 'ClosingStock should be last transaction of day',
        recommendation: 'Move ClosingStock after other transactions.',
        affectedTransaction: transaction.id,
        conflictingTransaction: laterTx.id
      });
    }
  }

  return issues;
};

// ============================================================================
// RULE 6: Missing Data Check
// ============================================================================

/**
 * Detect missing required data
 */
export const validateMissingData = (transaction) => {
  const issues = [];
  const requiredFields = ['tankId', 'timestamp', 'changeReason', 'newVolume', 'volumeChange'];

  requiredFields.forEach(field => {
    if (transaction[field] === null || transaction[field] === undefined || transaction[field] === '') {
      issues.push({
        severity: VALIDATION_SEVERITY.HIGH,
        category: ISSUE_CATEGORY.MISSING_DATA,
        field: field,
        value: null,
        message: `Missing required field: ${field}`,
        recommendation: 'Complete missing data before processing.',
        affectedTransaction: transaction.id
      });
    }
  });

  return issues;
};

// ============================================================================
// MASTER VALIDATION FUNCTION
// ============================================================================

/**
 * Run all validation rules on a transaction
 * Returns array of all issues found
 */
export const validateTransaction = (
  transaction,
  allTransactions = [],
  tankMetadata = {},
  previousDayClosing = null
) => {
  const allIssues = [];

  // Run all validation rules
  allIssues.push(...validateMissingData(transaction));
  allIssues.push(...validateNegativeVolume(transaction));
  allIssues.push(...validateUnrealisticChange(transaction, tankMetadata));
  allIssues.push(...validateStockAnomalies(transaction, previousDayClosing));
  allIssues.push(...validateDuplicateTransaction(transaction, allTransactions));
  allIssues.push(...validateTimingAnomalies(transaction, allTransactions));

  // Sort by severity
  const severityOrder = {
    CRITICAL: 0,
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
    WARNING: 4
  };

  allIssues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return allIssues;
};

/**
 * Batch validate all transactions
 */
export const validateAllTransactions = (
  transactions,
  tankMetadata = {},
  groupByDay = false
) => {
  const validationResults = [];
  let dayTransactions = [];
  let currentDay = null;

  transactions.forEach((tx, index) => {
    const txDay = new Date(tx.timestamp).toDateString();

    // Group by day for timing checks
    if (txDay !== currentDay) {
      dayTransactions = [];
      currentDay = txDay;
    }
    dayTransactions.push(tx);

    // Get previous day's closing stock
    const previousTx = index > 0 ? transactions[index - 1] : null;
    const previousDayClosing = previousTx?.changeReason === 'ClosingStock'
      ? previousTx.newVolume
      : null;

    // Validate transaction
    const issues = validateTransaction(
      tx,
      dayTransactions,
      tankMetadata,
      previousDayClosing
    );

    if (issues.length > 0) {
      validationResults.push({
        transactionId: tx.id,
        timestamp: tx.timestamp,
        tankId: tx.tankId,
        changeReason: tx.changeReason,
        volumeChange: tx.volumeChange,
        newVolume: tx.newVolume,
        issues: issues,
        issueCount: issues.length,
        criticalCount: issues.filter(i => i.severity === VALIDATION_SEVERITY.CRITICAL).length,
        highCount: issues.filter(i => i.severity === VALIDATION_SEVERITY.HIGH).length
      });
    }
  });

  return validationResults;
};

/**
 * Generate summary report
 */
export const generateValidationReport = (validationResults) => {
  const report = {
    totalTransactionsChecked: 0,
    transactionsWithIssues: validationResults.length,
    totalIssues: 0,
    bySeverity: {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
      WARNING: 0
    },
    byCategory: {},
    affectedTanks: new Set(),
    criticalIssues: [],
    topIssues: []
  };

  validationResults.forEach(result => {
    report.totalIssues += result.issues.length;
    report.affectedTanks.add(result.tankId);

    result.issues.forEach(issue => {
      report.bySeverity[issue.severity]++;

      if (!report.byCategory[issue.category]) {
        report.byCategory[issue.category] = 0;
      }
      report.byCategory[issue.category]++;

      if (issue.severity === VALIDATION_SEVERITY.CRITICAL) {
        report.criticalIssues.push({
          transactionId: result.transactionId,
          issue: issue.message,
          tankId: result.tankId
        });
      }
    });
  });

  report.affectedTanks = Array.from(report.affectedTanks);

  return report;
};

export default {
  validateNegativeVolume,
  validateUnrealisticChange,
  validateStockAnomalies,
  validateDuplicateTransaction,
  validateTimingAnomalies,
  validateMissingData,
  validateTransaction,
  validateAllTransactions,
  generateValidationReport,
  VALIDATION_SEVERITY,
  ISSUE_CATEGORY
};
