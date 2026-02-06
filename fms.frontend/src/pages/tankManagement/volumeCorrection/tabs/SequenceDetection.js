import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DateBox, SelectBox, Button, LoadIndicator } from 'devextreme-react';
import { DataGrid, Column, Paging, Pager, FilterRow, HeaderFilter, Export } from 'devextreme-react/data-grid';
import notify from 'devextreme/ui/notify';
import {
  validateTankSequence,
  detectAllSequenceBreaks,
  setFilterSeverity,
  selectAllSequenceBreaks,
  selectLoading,
  selectError,
  selectFilterSeverity,
  addBreakToSelection,
  removeBreakFromSelection,
  clearSelectedBreaks,
  selectAllBreaks as selectAllBreaksAction,
  selectBreaksFiltered
} from '../../../../redux/slices/tankVolumeCorrectionSlice';
import { usePermissions } from '../../../../hooks/usePermissions';

/**
 * Sequence Detection Tab
 * PHASE 1: DETECT - Identify sequence breaks and corrupted data
 *
 * Features:
 * - Single tank sequence validation
 * - System-wide break detection
 * - Severity filtering and categorization
 * - Break selection for bulk correction
 */
const SequenceDetection = () => {
  const dispatch = useDispatch();
  const { hasPermission } = usePermissions();
  const [mode, setMode] = useState('detect-all'); // 'detect-all' or 'validate-tank'
  const [selectedTankId, setSelectedTankId] = useState(null);
  const [fromDate, setFromDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const [toDate, setToDate] = useState(new Date());

  // Redux state
  const breaks = useSelector(selectAllSequenceBreaks);
  const filteredBreaks = useSelector(selectBreaksFiltered);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);
  const filterSeverity = useSelector(selectFilterSeverity);

  // Get tanks from Redux
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

  const handleDetectAll = async () => {
    if (!fromDate || !toDate) {
      notify('Please select date range', 'warning', 3000);
      return;
    }

    if (fromDate > toDate) {
      notify('Start date must be before end date', 'warning', 3000);
      return;
    }

    const formattedFrom = fromDate.toISOString().split('T')[0];
    const formattedTo = toDate.toISOString().split('T')[0];

    try {
      await dispatch(
        detectAllSequenceBreaks({ fromDate: formattedFrom, toDate: formattedTo })
      ).unwrap();
      notify('System-wide scan complete', 'success', 3000);
    } catch (err) {
      notify(
        `Error: ${err?.message || 'Failed to detect breaks'}`,
        'error',
        5000
      );
    }
  };

  const handleValidateTank = async () => {
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
        validateTankSequence({ tankId: selectedTankId, fromDate: formattedFrom, toDate: formattedTo })
      ).unwrap();
      notify('Tank validation complete', 'success', 3000);
    } catch (err) {
      notify(
        `Error: ${err?.message || 'Failed to validate tank'}`,
        'error',
        5000
      );
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      'CRITICAL': '#dc2626',
      'HIGH': '#ea580c',
      'MEDIUM': '#f59e0b',
      'LOW': '#eab308',
      'MINIMAL': '#10b981'
    };
    return colors[severity] || '#6b7280';
  };

  const getSeverityIcon = (severity) => {
    const icons = {
      'CRITICAL': 'fa-triangle-exclamation tvcc-severity-critical',
      'HIGH': 'fa-exclamation-circle tvcc-severity-high',
      'MEDIUM': 'fa-circle-exclamation tvcc-severity-medium',
      'LOW': 'fa-circle-info tvcc-severity-low',
      'MINIMAL': 'fa-circle-check tvcc-severity-minimal'
    };
    return icons[severity] || 'fa-circle-question';
  };

  const displayBreaks = filteredBreaks || breaks || [];
  const isProcessing = loading.detectBreaks || loading.validateTank;

  return (
    <div className="tvcc-sequence-detection">
      {/* Detection Mode Selection */}
      <div className="tvcc-card">
        <h3>
          <i className="fa-light fa-magnifying-glass"></i>
          Detection Mode
        </h3>

        <div className="tvcc-mode-selector">
          <button
            className={`tvcc-mode-button ${mode === 'detect-all' ? 'active' : ''}`}
            onClick={() => setMode('detect-all')}
          >
            <i className="fa-light fa-globe"></i>
            <span>System-Wide Scan</span>
            <small>Find all breaks in entire system</small>
          </button>

          <button
            className={`tvcc-mode-button ${mode === 'validate-tank' ? 'active' : ''}`}
            onClick={() => setMode('validate-tank')}
          >
            <i className="fa-light fa-gas-pump"></i>
            <span>Single Tank</span>
            <small>Validate specific tank sequence</small>
          </button>
        </div>
      </div>

      {/* Detection Parameters */}
      <div className="tvcc-card">
        <h3>
          <i className="fa-light fa-sliders"></i>
          Scan Parameters
        </h3>

        <div className="tvcc-parameters-grid">
          {mode === 'validate-tank' && (
            <div className="tvcc-param-group">
              <label>Tank</label>
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
          )}

          <div className="tvcc-param-group">
            <label>Start Date</label>
            <DateBox
              value={fromDate}
              onValueChanged={(e) => setFromDate(e.value)}
              displayFormat="dd/MM/yyyy"
              max={toDate}
              showClearButton={true}
            />
          </div>

          <div className="tvcc-param-group">
            <label>End Date</label>
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
            text={mode === 'detect-all' ? 'Scan System' : 'Validate Tank'}
            icon={mode === 'detect-all' ? 'fa-light fa-magnifying-glass' : 'fa-light fa-check'}
            type="default"
            stylingMode="contained"
            onClick={mode === 'detect-all' ? handleDetectAll : handleValidateTank}
            disabled={isProcessing}
          >
            {isProcessing && <LoadIndicator width={16} height={16} />}
          </Button>
        </div>
      </div>

      {/* Severity Filter */}
      {displayBreaks && displayBreaks.length > 0 && (
        <div className="tvcc-card">
          <h3>
            <i className="fa-light fa-filter"></i>
            Filter by Severity
          </h3>

          <div className="tvcc-severity-filter">
            <button
              className={`tvcc-severity-badge ${!filterSeverity ? 'active' : ''}`}
              onClick={() => dispatch(setFilterSeverity(null))}
            >
              All ({displayBreaks.length})
            </button>
            {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'MINIMAL'].map(severity => {
              const count = (breaks || []).filter(b => b.severity === severity).length;
              return (
                <button
                  key={severity}
                  className={`tvcc-severity-badge tvcc-severity-${severity.toLowerCase()} ${filterSeverity === severity ? 'active' : ''
                    }`}
                  onClick={() => dispatch(setFilterSeverity(filterSeverity === severity ? null : severity))}
                >
                  <i className={`fa-light ${getSeverityIcon(severity)}`}></i>
                  {severity} ({count})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Results */}
      {displayBreaks && displayBreaks.length > 0 && (
        <div className="tvcc-card tvcc-results-card">
          <h3>
            <i className="fa-light fa-list"></i>
            Sequence Breaks Found ({displayBreaks.length})
          </h3>

          <div className="tvcc-grid-wrapper">
            <DataGrid
              dataSource={displayBreaks}
              showBorders={true}
              showRowLines={true}
              rowAlternationEnabled={true}
              hoverStateEnabled={true}
              columnAutoWidth={true}
              allowColumnReordering={true}
              allowColumnResizing={true}
            >
              <FilterRow visible={true} />
              <HeaderFilter visible={true} />
              <Export enabled={true} />
              <Paging enabled={true} defaultPageSize={10} />
              <Pager
                showPageSizeSelector={true}
                allowedPageSizes={[10, 20, 50]}
                showInfo={true}
              />

              <Column
                dataField="severity"
                caption="Severity"
                width={120}
                alignment="center"
                cellRender={(data) => (
                  <div className="tvcc-severity-cell">
                    <i className={`fa-light ${getSeverityIcon(data.value)}`}></i>
                    <span>{data.value}</span>
                  </div>
                )}
              />

              <Column
                dataField="tankId"
                caption="Tank"
                width={80}
                alignment="center"
              />

              <Column
                dataField="transactionId"
                caption="Transaction ID"
                width={120}
                alignment="center"
              />

              <Column
                dataField="expectedVolume"
                caption="Expected Volume (L)"
                width={140}
                dataType="number"
                format="#,##0.00"
                alignment="right"
              />

              <Column
                dataField="actualVolume"
                caption="Actual Volume (L)"
                width={140}
                dataType="number"
                format="#,##0.00"
                alignment="right"
              />

              <Column
                dataField="variance"
                caption="Variance (L)"
                width={120}
                dataType="number"
                format="#,##0.00"
                alignment="right"
                cellRender={(data) => (
                  <span className="tvcc-variance-cell">
                    {data.value > 0 ? '+' : ''}{Number(data.value).toFixed(2)}
                  </span>
                )}
              />

              <Column
                dataField="transactionTimestamp"
                caption="Timestamp"
                dataType="datetime"
                format="dd/MM/yyyy HH:mm:ss"
                width={160}
              />

              <Column
                dataField="changeReason"
                caption="Reason"
                width={200}
              />
            </DataGrid>
          </div>

          <div className="tvcc-results-summary">
            <div className="tvcc-summary-stat">
              <span className="tvcc-stat-label">Total Breaks:</span>
              <span className="tvcc-stat-value">{displayBreaks.length}</span>
            </div>
            <div className="tvcc-summary-stat">
              <span className="tvcc-stat-label">Avg Variance:</span>
              <span className="tvcc-stat-value">
                {(
                  displayBreaks.reduce((sum, b) => sum + Math.abs(b.variance), 0) / displayBreaks.length
                ).toFixed(2)}
                L
              </span>
            </div>
            <div className="tvcc-summary-stat">
              <span className="tvcc-stat-label">Total Variance:</span>
              <span className="tvcc-stat-value">
                {displayBreaks.reduce((sum, b) => sum + Math.abs(b.variance), 0).toFixed(2)}
                L
              </span>
            </div>
          </div>
        </div>
      )}

      {/* No Results */}
      {!isProcessing && breaks && breaks.length === 0 && (
        <div className="tvcc-card tvcc-empty-state">
          <i className="fa-light fa-circle-check"></i>
          <h3>No Sequence Breaks Found</h3>
          <p>All tank volumes are properly sequenced and consistent!</p>
        </div>
      )}

      {/* Error Display */}
      {(error.detectBreaks || error.validateTank) && (
        <div className="tvcc-card tvcc-error-card">
          <div className="tvcc-error-content">
            <i className="fa-light fa-circle-exclamation"></i>
            <div>
              <h4>Error</h4>
              <p>{error.detectBreaks?.message || error.validateTank?.message || 'An error occurred'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isProcessing && (
        <div className="tvcc-card tvcc-loading-card">
          <LoadIndicator />
          <p>Scanning for sequence breaks...</p>
        </div>
      )}
    </div>
  );
};

export default SequenceDetection;
