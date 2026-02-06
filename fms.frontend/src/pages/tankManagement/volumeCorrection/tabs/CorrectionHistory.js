import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DateBox, SelectBox, Button, LoadIndicator } from 'devextreme-react';
import { DataGrid, Column, Paging, Pager, FilterRow, HeaderFilter, Export } from 'devextreme-react/data-grid';
import notify from 'devextreme/ui/notify';
import {
  getCorrectionHistory,
  selectCorrectionHistory,
  selectLoading,
  selectError
} from '../../../../redux/slices/tankVolumeCorrectionSlice';
import { usePermissions } from '../../../../hooks/usePermissions';

/**
 * Correction History Tab
 * VERIFY Phase - View correction history and audit trail
 *
 * Features:
 * - Correction history retrieval
 * - Filter by tank and date range
 * - Audit trail display
 * - Before/after comparison
 */
const CorrectionHistory = () => {
  const dispatch = useDispatch();
  const { hasPermission } = usePermissions();

  // Local state
  const [selectedTankId, setSelectedTankId] = useState(null);
  const [fromDate, setFromDate] = useState(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)); // 90 days ago
  const [toDate, setToDate] = useState(new Date());

  // Redux state
  const history = useSelector(selectCorrectionHistory);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);

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

  const handleGetHistory = async () => {
    if (!selectedTankId) {
      notify('Please select a tank', 'warning', 3000);
      return;
    }

    if (!fromDate || !toDate) {
      notify('Please select date range', 'warning', 3000);
      return;
    }

    const formattedFrom = fromDate.toISOString().split('T')[0];
    const formattedTo = toDate.toISOString().split('T')[0];

    try {
      await dispatch(
        getCorrectionHistory({ tankId: selectedTankId, fromDate: formattedFrom, toDate: formattedTo })
      ).unwrap();
      notify('Correction history loaded successfully', 'success', 3000);
    } catch (err) {
      notify(
        `Error: ${err?.message || 'Failed to load history'}`,
        'error',
        5000
      );
    }
  };

  const getStrategyColor = (strategy) => {
    const colors = {
      'RECALCULATE': '#3b82f6',
      'MANUAL': '#8b5cf6',
      'RECALCULATE_SINGLE': '#06b6d4',
      'RECALCULATE_FROM_POINT': '#f97316'
    };
    return colors[strategy] || '#6b7280';
  };

  const isProcessing = loading.getCorrectionHistory;
  const selectedTank = tanksDataSource.find(t => t.id === selectedTankId);

  return (
    <div className="tvcc-correction-history">
      {/* History Retrieval Controls */}
      <div className="tvcc-card">
        <h3>
          <i className="fa-light fa-clock-rotate-left"></i>
          View Correction History
        </h3>

        <div className="tvcc-history-filters">
          <div className="tvcc-filter-group">
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

          <div className="tvcc-filter-group">
            <label>From Date</label>
            <DateBox
              value={fromDate}
              onValueChanged={(e) => setFromDate(e.value)}
              displayFormat="dd/MM/yyyy"
              max={toDate}
              showClearButton={true}
            />
          </div>

          <div className="tvcc-filter-group">
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

          <Button
            text="Load History"
            icon="fa-light fa-rotate"
            type="default"
            stylingMode="contained"
            onClick={handleGetHistory}
            disabled={isProcessing || !selectedTankId}
          >
            {isProcessing && <LoadIndicator width={16} height={16} />}
          </Button>
        </div>
      </div>

      {/* History Results */}
      {history && history.length > 0 && (
        <div className="tvcc-card">
          <h3>
            <i className="fa-light fa-list"></i>
            Correction Records ({history.length})
          </h3>

          <div className="tvcc-history-timeline">
            {history.map((record, index) => (
              <div key={index} className="tvcc-history-record">
                <div className="tvcc-record-header">
                  <span className="tvcc-record-index">{index + 1}</span>
                  <div className="tvcc-record-info">
                    <strong>{record.correctionType}</strong>
                    <span className="tvcc-record-date">
                      {new Date(record.correctionDate).toLocaleString()}
                    </span>
                  </div>
                  <div className="tvcc-record-meta">
                    <span className="tvcc-record-user">
                      <i className="fa-light fa-user"></i>
                      {record.userName}
                    </span>
                    <span className="tvcc-record-success">
                      {record.success ? (
                        <i className="fa-light fa-circle-check tvcc-success"></i>
                      ) : (
                        <i className="fa-light fa-circle-xmark tvcc-error"></i>
                      )}
                    </span>
                  </div>
                </div>

                <div className="tvcc-record-body">
                  <div className="tvcc-record-section">
                    <strong>Strategy:</strong>
                    <span
                      className="tvcc-strategy-tag"
                      style={{ backgroundColor: getStrategyColor(record.correctionType) }}
                    >
                      {record.correctionType}
                    </span>
                  </div>

                  <div className="tvcc-record-section">
                    <strong>Reason:</strong>
                    <p>{record.reason || 'No reason provided'}</p>
                  </div>

                  <div className="tvcc-record-stats">
                    <div className="tvcc-record-stat">
                      <span>Transactions Corrected:</span>
                      <strong>{record.transactionsCorrected}</strong>
                    </div>
                    <div className="tvcc-record-stat">
                      <span>Total Processed:</span>
                      <strong>{record.totalTransactionsProcessed}</strong>
                    </div>
                  </div>

                  {record.beforeValues && record.beforeValues.length > 0 && (
                    <div className="tvcc-record-comparison">
                      <h5>
                        <i className="fa-light fa-arrow-right-arrow-left"></i>
                        Before/After Comparison
                      </h5>
                      <div className="tvcc-comparison-table">
                        <table>
                          <thead>
                            <tr>
                              <th>Transaction ID</th>
                              <th>Before (L)</th>
                              <th>After (L)</th>
                              <th>Change</th>
                            </tr>
                          </thead>
                          <tbody>
                            {record.beforeValues.slice(0, 5).map((before, idx) => {
                              const after = record.afterValues[idx];
                              const change = after - before;
                              return (
                                <tr key={idx} className={change !== 0 ? 'changed' : ''}>
                                  <td>{record.beforeTransactionIds?.[idx] || idx}</td>
                                  <td>{before.toFixed(2)}</td>
                                  <td>{after.toFixed(2)}</td>
                                  <td className={change > 0 ? 'positive' : change < 0 ? 'negative' : ''}>
                                    {change > 0 ? '+' : ''}{change.toFixed(2)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        {record.beforeValues.length > 5 && (
                          <p className="tvcc-comparison-more">
                            ... and {record.beforeValues.length - 5} more transactions
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Statistics */}
      {history && history.length > 0 && (
        <div className="tvcc-card">
          <h3>
            <i className="fa-light fa-chart-bar"></i>
            Correction Summary
          </h3>

          <div className="tvcc-summary-cards">
            <div className="tvcc-summary-card">
              <span className="tvcc-summary-label">Total Corrections</span>
              <span className="tvcc-summary-value">{history.length}</span>
            </div>
            <div className="tvcc-summary-card">
              <span className="tvcc-summary-label">Total Transactions Corrected</span>
              <span className="tvcc-summary-value">
                {history.reduce((sum, h) => sum + (h.transactionsCorrected || 0), 0)}
              </span>
            </div>
            <div className="tvcc-summary-card">
              <span className="tvcc-summary-label">Successful Corrections</span>
              <span className="tvcc-summary-value tvcc-success">
                {history.filter(h => h.success).length}
              </span>
            </div>
            <div className="tvcc-summary-card">
              <span className="tvcc-summary-label">Failed Corrections</span>
              <span className={`tvcc-summary-value ${history.filter(h => !h.success).length > 0 ? 'tvcc-error' : ''}`}>
                {history.filter(h => !h.success).length}
              </span>
            </div>
          </div>

          <h4>
            <i className="fa-light fa-chart-pie"></i>
            Strategies Used
          </h4>
          <div className="tvcc-strategy-breakdown">
            {Object.entries(
              history.reduce((acc, h) => {
                acc[h.correctionType] = (acc[h.correctionType] || 0) + 1;
                return acc;
              }, {})
            ).map(([strategy, count]) => (
              <div key={strategy} className="tvcc-strategy-breakdown-item">
                <div
                  className="tvcc-strategy-color-box"
                  style={{ backgroundColor: getStrategyColor(strategy) }}
                />
                <span>{strategy}: {count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isProcessing && history && history.length === 0 && (
        <div className="tvcc-card tvcc-empty-state">
          <i className="fa-light fa-history"></i>
          <h3>No Corrections Found</h3>
          <p>No corrections have been made for {selectedTank?.name || 'this tank'} in the selected period</p>
        </div>
      )}

      {/* Error Display */}
      {error.getCorrectionHistory && (
        <div className="tvcc-card tvcc-error-card">
          <div className="tvcc-error-content">
            <i className="fa-light fa-circle-exclamation"></i>
            <div>
              <h4>Error</h4>
              <p>{error.getCorrectionHistory?.message || 'Failed to load history'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Info Panel */}
      {!history && !isProcessing && (
        <div className="tvcc-card tvcc-info-panel">
          <div className="tvcc-info-content">
            <i className="fa-light fa-circle-info"></i>
            <div>
              <h4>About Correction History</h4>
              <ul>
                <li>View all corrections made to tank volumes</li>
                <li>See who made each correction and when</li>
                <li>Review the reason for each correction</li>
                <li>Compare before/after volumes for verification</li>
                <li>All corrections are permanently logged for audit purposes</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CorrectionHistory;
