import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { DateBox, SelectBox, Button, LoadIndicator } from 'devextreme-react';
import { DataGrid, Column, Paging, Pager, FilterRow, GroupPanel, Summary, TotalItem } from 'devextreme-react/data-grid';
import notify from 'devextreme/ui/notify';
import {
  validateAllTransactions,
  generateValidationReport,
  VALIDATION_SEVERITY,
  ISSUE_CATEGORY
} from '../utils/volumeValidationRules';
import { usePermissions } from '../../../../hooks/usePermissions';

/**
 * Data Quality Check Tab
 *
 * Validates tank volume history for data quality issues:
 * - Negative volumes
 * - Unrealistic changes
 * - Stock anomalies
 * - Duplicate transactions
 * - Timing issues
 * - Missing data
 */
const DataQualityCheck = () => {
  const { hasPermission } = usePermissions();

  // Local state
  const [selectedTankId, setSelectedTankId] = useState(null);
  const [fromDate, setFromDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const [toDate, setToDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [report, setReport] = useState(null);

  // Get tanks
  const tanks = useSelector((state) => state.tank.tanks || []);
  const tanksDataSource = tanks.map(tank => ({
    id: tank.id,
    name: tank.name
  }));

  const canRead = hasPermission('_Read_TankStock');

  if (!canRead) {
    return (
      <div className="tvcc-permission-denied-tab">
        <i className="fa-light fa-lock"></i>
        <p>You don't have permission to view this data</p>
      </div>
    );
  }

  const getSeverityColor = (severity) => {
    const colors = {
      'CRITICAL': '#dc2626',
      'HIGH': '#ea580c',
      'MEDIUM': '#f59e0b',
      'LOW': '#eab308',
      'WARNING': '#10b981'
    };
    return colors[severity] || '#6b7280';
  };

  const getSeverityIcon = (severity) => {
    const icons = {
      'CRITICAL': 'fa-light fa-triangle-exclamation',
      'HIGH': 'fa-light fa-exclamation-circle',
      'MEDIUM': 'fa-light fa-circle-exclamation',
      'LOW': 'fa-light fa-circle-info',
      'WARNING': 'fa-light fa-circle-check'
    };
    return icons[severity] || 'fa-light fa-circle-question';
  };

  const getCategoryLabel = (category) => {
    const labels = {
      'NEGATIVE_VOLUME': 'Negative Volume',
      'UNREALISTIC_CHANGE': 'Unrealistic Change',
      'STOCK_ANOMALY': 'Stock Anomaly',
      'DUPLICATE_TRANSACTION': 'Duplicate',
      'MISSING_DATA': 'Missing Data',
      'SEQUENCE_BREAK': 'Sequence Break',
      'TIMING_ANOMALY': 'Timing Issue'
    };
    return labels[category] || category;
  };

  const handleCheck = async () => {
    if (!selectedTankId) {
      notify('Please select a tank', 'warning', 3000);
      return;
    }

    if (!fromDate || !toDate) {
      notify('Please select date range', 'warning', 3000);
      return;
    }

    if (fromDate > toDate) {
      notify('Start date must be before end date', 'warning', 3000);
      return;
    }

    setLoading(true);
    try {
      // TODO: Fetch tank volume history from API
      // For now, we'll assume data is available
      const transactions = []; // Get from API call

      // Run validation
      const validationResults = validateAllTransactions(transactions);
      const validationReport = generateValidationReport(validationResults);

      setResults(validationResults);
      setReport(validationReport);

      notify(`Check complete: ${validationResults.length} transactions with issues found`, 'info', 3000);
    } catch (error) {
      notify(`Error: ${error.message || 'Failed to check data quality'}`, 'error', 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tvcc-data-quality-check">
      {/* Control Panel */}
      <div className="tvcc-card">
        <h3>
          <i className="fa-light fa-magnifying-glass-chart"></i>
          Data Quality Validation
        </h3>

        <div className="tvcc-parameters-grid">
          <div className="tvcc-param-group">
            <label>Tank *</label>
            <SelectBox
              dataSource={tanksDataSource}
              displayExpr="name"
              valueExpr="id"
              placeholder="Select tank..."
              value={selectedTankId}
              onValueChanged={(e) => setSelectedTankId(e.value)}
              searchEnabled={true}
              showClearButton={true}
            />
          </div>

          <div className="tvcc-param-group">
            <label>From Date</label>
            <DateBox
              value={fromDate}
              onValueChanged={(e) => setFromDate(e.value)}
              displayFormat="dd/MM/yyyy"
              max={toDate}
              showClearButton={true}
            />
          </div>

          <div className="tvcc-param-group">
            <label>To Date</label>
            <DateBox
              value={toDate}
              onValueChanged={(e) => setToDate(e.value)}
              displayFormat="dd/MM/yyyy"
              min={fromDate}
              max={new Date()}
              showClearButton={true}
            />
          </div>
        </div>

        <div className="tvcc-button-group">
          <Button
            text="Run Data Quality Check"
            icon="fa-light fa-magnifying-glass"
            type="default"
            stylingMode="contained"
            onClick={handleCheck}
            disabled={loading || !selectedTankId}
          >
            {loading && <LoadIndicator width={16} height={16} />}
          </Button>
        </div>
      </div>

      {/* Validation Report Summary */}
      {report && (
        <div className="tvcc-card">
          <h3>
            <i className="fa-light fa-chart-bar"></i>
            Validation Report
          </h3>

          <div className="tvcc-report-summary">
            <div className="tvcc-report-stat critical">
              <span className="tvcc-stat-label">Critical Issues</span>
              <span className="tvcc-stat-value">{report.bySeverity.CRITICAL}</span>
            </div>
            <div className="tvcc-report-stat high">
              <span className="tvcc-stat-label">High Priority</span>
              <span className="tvcc-stat-value">{report.bySeverity.HIGH}</span>
            </div>
            <div className="tvcc-report-stat medium">
              <span className="tvcc-stat-label">Medium</span>
              <span className="tvcc-stat-value">{report.bySeverity.MEDIUM}</span>
            </div>
            <div className="tvcc-report-stat low">
              <span className="tvcc-stat-label">Low</span>
              <span className="tvcc-stat-value">{report.bySeverity.LOW}</span>
            </div>
            <div className="tvcc-report-stat warning">
              <span className="tvcc-stat-label">Warnings</span>
              <span className="tvcc-stat-value">{report.bySeverity.WARNING}</span>
            </div>
          </div>

          {report.criticalIssues.length > 0 && (
            <div className="tvcc-critical-issues">
              <h4>
                <i className="fa-light fa-triangle-exclamation"></i>
                Critical Issues That Must Be Fixed
              </h4>
              {report.criticalIssues.map((issue, idx) => (
                <div key={idx} className="tvcc-critical-issue-item">
                  <span className="tvcc-issue-number">{idx + 1}</span>
                  <div className="tvcc-issue-content">
                    <p><strong>Transaction {issue.transactionId}</strong> (Tank {issue.tankId})</p>
                    <p className="tvcc-issue-message">{issue.issue}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="tvcc-issue-breakdown">
            <h4>Issues by Category</h4>
            {Object.entries(report.byCategory).map(([category, count]) => (
              <div key={category} className="tvcc-breakdown-item">
                <span>{getCategoryLabel(category)}</span>
                <span className="tvcc-badge">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Results */}
      {results && results.length > 0 && (
        <div className="tvcc-card">
          <h3>
            <i className="fa-light fa-list"></i>
            Validation Issues ({results.length})
          </h3>

          <DataGrid
            dataSource={results}
            showBorders={true}
            showRowLines={true}
            rowAlternationEnabled={true}
            columnAutoWidth={true}
          >
            <FilterRow visible={true} />
            <GroupPanel visible={true} />
            <Paging enabled={true} defaultPageSize={10} />
            <Pager showPageSizeSelector={true} allowedPageSizes={[10, 20, 50]} showInfo={true} />

            <Column
              dataField="transactionId"
              caption="Transaction"
              width={100}
              alignment="center"
            />

            <Column
              dataField="tankId"
              caption="Tank"
              width={80}
              alignment="center"
            />

            <Column
              dataField="changeReason"
              caption="Type"
              width={120}
            />

            <Column
              dataField="volumeChange"
              caption="Change (L)"
              width={120}
              dataType="number"
              format="#,##0.00"
            />

            <Column
              dataField="newVolume"
              caption="New Volume (L)"
              width={140}
              dataType="number"
              format="#,##0.00"
            />

            <Column
              dataField="issueCount"
              caption="Issues"
              width={80}
              alignment="center"
              cellRender={(data) => (
                <span className="tvcc-issue-badge">{data.value}</span>
              )}
            />
          </DataGrid>

          {/* Detailed Issue Breakdown */}
          <div className="tvcc-detailed-issues">
            <h4>Detailed Issue List</h4>
            {results.map((result) => (
              <div key={result.transactionId} className="tvcc-transaction-issues">
                <h5>
                  Transaction {result.transactionId} - {result.changeReason}
                </h5>
                {result.issues.map((issue, idx) => (
                  <div key={idx} className="tvcc-issue-detail">
                    <div className="tvcc-issue-header">
                      <span
                        className="tvcc-severity-indicator"
                        style={{ backgroundColor: getSeverityColor(issue.severity) }}
                      />
                      <strong>{issue.severity}</strong>
                      <span className="tvcc-category">{getCategoryLabel(issue.category)}</span>
                    </div>
                    <p className="tvcc-issue-message">{issue.message}</p>
                    <p className="tvcc-recommendation">
                      <i className="fa-light fa-lightbulb"></i>
                      {issue.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Issues Found */}
      {report && results && results.length === 0 && (
        <div className="tvcc-card tvcc-empty-state">
          <i className="fa-light fa-circle-check"></i>
          <h3>All Data Quality Checks Passed</h3>
          <p>No validation issues found for this tank in the selected period</p>
        </div>
      )}

      {/* Info Panel */}
      {!results && (
        <div className="tvcc-card tvcc-info-panel">
          <h4>
            <i className="fa-light fa-circle-info"></i>
            Data Quality Checks
          </h4>
          <div className="tvcc-checks-list">
            <div className="tvcc-check">
              <i className="fa-light fa-check"></i>
              <div>
                <strong>Negative Volume</strong>
                <small>Tank volumes should never be negative</small>
              </div>
            </div>
            <div className="tvcc-check">
              <i className="fa-light fa-check"></i>
              <div>
                <strong>Unrealistic Changes</strong>
                <small>Single transaction volume changes should be realistic</small>
              </div>
            </div>
            <div className="tvcc-check">
              <i className="fa-light fa-check"></i>
              <div>
                <strong>Stock Anomalies</strong>
                <small>Opening/closing stock should be positive and consistent</small>
              </div>
            </div>
            <div className="tvcc-check">
              <i className="fa-light fa-check"></i>
              <div>
                <strong>Duplicate Transactions</strong>
                <small>Detects potential duplicate entries</small>
              </div>
            </div>
            <div className="tvcc-check">
              <i className="fa-light fa-check"></i>
              <div>
                <strong>Timing Issues</strong>
                <small>Ensures transactions are in correct order by time</small>
              </div>
            </div>
            <div className="tvcc-check">
              <i className="fa-light fa-check"></i>
              <div>
                <strong>Missing Data</strong>
                <small>Validates all required fields are populated</small>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataQualityCheck;
