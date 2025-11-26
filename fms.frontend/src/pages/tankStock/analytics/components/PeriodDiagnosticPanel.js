import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { DataGrid } from 'devextreme-react/data-grid';
import { Column, Paging, FilterRow, HeaderFilter, Scrolling } from 'devextreme-react/data-grid';
import { Button } from 'devextreme-react/button';
import { LoadIndicator } from 'devextreme-react/load-indicator';
import './PeriodDiagnosticPanel.scss';

/**
 * PeriodDiagnosticPanel Component
 *
 * Displays comprehensive diagnostic data for a specific tank stock period.
 * Shows all transactions from TankStock, TankVolumeHistory, and TankTransfers tables.
 *
 * @param {Object} props
 * @param {Object} props.diagnosticData - The complete diagnostic data from the backend
 * @param {Object} props.periodInfo - The period metadata (periodNumber, dates, variance)
 * @param {boolean} props.loading - Loading state
 * @param {string} props.error - Error message if any
 * @param {Function} props.onExportJSON - Callback to export data as JSON
 */
const PeriodDiagnosticPanel = ({
  diagnosticData,
  periodInfo,
  loading = false,
  error = null,
  onExportJSON = null
}) => {
  const [activeSection, setActiveSection] = useState('overview');

  // Reset to overview tab when new data is loaded
  useEffect(() => {
    if (diagnosticData && periodInfo) {
      setActiveSection('overview');
    }
  }, [diagnosticData, periodInfo]);

  // Loading state
  if (loading) {
    return (
      <div className="diagnostic-panel-loading">
        <LoadIndicator visible={true} height={60} width={60} />
        <div className="loading-text">Loading diagnostic data...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="diagnostic-panel-error">
        <i className="fa-light fa-circle-exclamation error-icon"></i>
        <div className="error-title">Failed to Load Diagnostic</div>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  // Empty state
  if (!diagnosticData || !periodInfo) {
    return (
      <div className="diagnostic-panel-empty">
        <i className="fa-light fa-microscope empty-icon"></i>
        <div className="empty-message">No diagnostic data available</div>
      </div>
    );
  }

  const { reconciliation, warnings, stockEntries, volumeTransactions, transfers } = diagnosticData;

  // Render section navigation tabs
  const renderSectionTabs = () => (
    <div className="section-tabs">
      <Button
        text="Overview"
        icon="fa-light fa-chart-pie"
        type={activeSection === 'overview' ? 'default' : 'normal'}
        stylingMode={activeSection === 'overview' ? 'contained' : 'text'}
        onClick={() => setActiveSection('overview')}
      />
      <Button
        text="Stock Entries"
        icon="fa-light fa-oil-can"
        type={activeSection === 'stock' ? 'default' : 'normal'}
        stylingMode={activeSection === 'stock' ? 'contained' : 'text'}
        onClick={() => setActiveSection('stock')}
      />
      <Button
        text="Volume Transactions"
        icon="fa-light fa-arrows-rotate"
        type={activeSection === 'volume' ? 'default' : 'normal'}
        stylingMode={activeSection === 'volume' ? 'contained' : 'text'}
        onClick={() => setActiveSection('volume')}
      />
      <Button
        text="Transfers"
        icon="fa-light fa-arrow-right-arrow-left"
        type={activeSection === 'transfers' ? 'default' : 'normal'}
        stylingMode={activeSection === 'transfers' ? 'contained' : 'text'}
        onClick={() => setActiveSection('transfers')}
      />
      <Button
        text="Raw Data"
        icon="fa-light fa-database"
        type={activeSection === 'raw' ? 'default' : 'normal'}
        stylingMode={activeSection === 'raw' ? 'contained' : 'text'}
        onClick={() => setActiveSection('raw')}
      />
    </div>
  );

  // Render period header
  const renderPeriodHeader = () => (
    <div className="period-header">
      <div className="header-grid">
        <div className="header-item">
          <div className="header-label">Period</div>
          <div className="header-value">#{periodInfo.periodNumber}</div>
        </div>
        <div className="header-item">
          <div className="header-label">Date Range</div>
          <div className="header-value date-range">
            {new Date(periodInfo.startDate).toLocaleDateString()} - {new Date(periodInfo.endDate).toLocaleDateString()}
          </div>
        </div>
        <div className="header-item">
          <div className="header-label">Variance</div>
          <div className={`header-value variance ${periodInfo.variance >= 0 ? 'positive' : 'negative'}`}>
            {periodInfo.variance >= 0 ? '+' : ''}{periodInfo.variance.toFixed(2)} L
          </div>
        </div>
        <div className="header-item">
          <div className="header-label">Status</div>
          <div className={`header-value status status-${periodInfo.severity || 'unknown'}`}>
            {(periodInfo.severity || 'unknown').toUpperCase()}
          </div>
        </div>
      </div>
      {onExportJSON && (
        <div className="header-actions">
          <Button
            text="Export JSON"
            icon="fa-light fa-download"
            type="normal"
            onClick={() => onExportJSON(diagnosticData, periodInfo)}
          />
        </div>
      )}
    </div>
  );

  // Render warnings section
  const renderWarnings = () => {
    if (!warnings || warnings.length === 0) {
      return (
        <div className="no-warnings">
          <i className="fa-light fa-circle-check"></i>
          <span>No data quality warnings detected</span>
        </div>
      );
    }

    return (
      <div className="warnings-section">
        <h4 className="section-title">
          <i className="fa-light fa-triangle-exclamation"></i>
          Data Quality Warnings ({warnings.length})
        </h4>
        <div className="warnings-list">
          {warnings.map((warning, index) => (
            <div key={index} className={`warning-item warning-${warning.severity}`}>
              <div className="warning-header">
                {warning.severity === 'critical' && <i className="fa-light fa-circle-exclamation"></i>}
                {warning.severity === 'warning' && <i className="fa-light fa-exclamation-triangle"></i>}
                {warning.severity === 'info' && <i className="fa-light fa-circle-info"></i>}
                <span className="warning-message">{warning.message}</span>
              </div>
              <div className="warning-details">{warning.details}</div>
              {warning.suggestedAction && (
                <div className="warning-action">
                  <i className="fa-light fa-lightbulb"></i>
                  {warning.suggestedAction}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render calculation steps
  const renderCalculationSteps = () => {
    if (!reconciliation?.calculationSteps) return null;

    return (
      <div className="calculation-section">
        <h4 className="section-title">
          <i className="fa-light fa-calculator"></i>
          Calculation Breakdown
        </h4>
        <div className="calculation-steps">
          {reconciliation.calculationSteps.map((step, index) => (
            <div key={index} className="calculation-step">
              {step}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render quick stats
  const renderQuickStats = () => (
    <div className="quick-stats">
      <div className="stat-card">
        <div className="stat-label">Stock Entries</div>
        <div className="stat-value">{stockEntries?.length || 0}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Volume Transactions</div>
        <div className="stat-value">{volumeTransactions?.length || 0}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Transfers</div>
        <div className="stat-value">{transfers?.length || 0}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Warnings</div>
        <div className={`stat-value ${warnings?.length > 0 ? 'warning' : 'success'}`}>
          {warnings?.length || 0}
        </div>
      </div>
    </div>
  );

  // Render overview section
  const renderOverview = () => (
    <div className="overview-section">
      {renderWarnings()}
      {renderCalculationSteps()}
      {renderQuickStats()}
    </div>
  );

  // Render stock entries grid
  const renderStockEntriesGrid = () => (
    <div className="data-grid-section">
      <h4 className="section-title">
        <i className="fa-light fa-oil-can"></i>
        Tank Stock Entries ({stockEntries?.length || 0})
      </h4>
      <DataGrid
        key="stock-entries-grid"
        dataSource={stockEntries || []}
        showBorders={true}
        columnAutoWidth={true}
        wordWrapEnabled={true}
        keyExpr="stockId"
      >
        <FilterRow visible={true} />
        <HeaderFilter visible={true} />
        <Scrolling mode="virtual" />
        <Paging enabled={false} />

        <Column dataField="entryDate" caption="Date" dataType="datetime" format="MM/dd/yyyy HH:mm" width={150} />
        <Column dataField="entryType" caption="Type" width={120} />
        <Column dataField="manualOpeningLevel" caption="Opening (Manual)" dataType="number" format="#,##0.00" width={150} />
        <Column dataField="sensorOpeningLevel" caption="Opening (Sensor)" dataType="number" format="#,##0.00" width={150} />
        <Column dataField="manualClosingLevel" caption="Closing (Manual)" dataType="number" format="#,##0.00" width={150} />
        <Column dataField="sensorClosingLevel" caption="Closing (Sensor)" dataType="number" format="#,##0.00" width={150} />
        <Column dataField="openingMeter" caption="Opening Meter" dataType="number" format="#,##0.00" width={120} />
        <Column dataField="closingMeter" caption="Closing Meter" dataType="number" format="#,##0.00" width={120} />
        <Column dataField="calculatedUsage" caption="Usage" dataType="number" format="#,##0.00" width={100} />
        <Column dataField="recordedBy" caption="Recorded By" width={150} />
        <Column dataField="comments" caption="Comments" width={200} />
      </DataGrid>
    </div>
  );

  // Render volume transactions grid
  const renderVolumeTransactionsGrid = () => (
    <div className="data-grid-section">
      <h4 className="section-title">
        <i className="fa-light fa-arrows-rotate"></i>
        Volume History Transactions ({volumeTransactions?.length || 0})
      </h4>
      <DataGrid
        key="volume-transactions-grid"
        dataSource={volumeTransactions || []}
        showBorders={true}
        columnAutoWidth={true}
        wordWrapEnabled={true}
        keyExpr="historyId"
      >
        <FilterRow visible={true} />
        <HeaderFilter visible={true} />
        <Scrolling mode="virtual" />
        <Paging enabled={false} />

        <Column dataField="timestamp" caption="Timestamp" dataType="datetime" format="MM/dd/yyyy HH:mm:ss" width={170} />
        <Column dataField="changeReason" caption="Change Reason" width={150} />
        <Column dataField="volumeChange" caption="Volume Change" dataType="number" format="#,##0.00" width={130} />
        <Column dataField="volumeAfter" caption="Volume After" dataType="number" format="#,##0.00" width={120} />
        <Column dataField="source" caption="Source" width={120} />
        <Column dataField="transactionReference" caption="Reference" width={100} />
        <Column dataField="recordedBy" caption="Recorded By" width={150} />
        <Column dataField="isDeleted" caption="Deleted" dataType="boolean" width={80} />
      </DataGrid>
    </div>
  );

  // Render transfers grid
  const renderTransfersGrid = () => (
    <div className="data-grid-section">
      <h4 className="section-title">
        <i className="fa-light fa-arrow-right-arrow-left"></i>
        Tank Transfers ({transfers?.length || 0})
      </h4>
      <DataGrid
        key="transfers-grid"
        dataSource={transfers || []}
        showBorders={true}
        columnAutoWidth={true}
        wordWrapEnabled={true}
        keyExpr="transferId"
      >
        <FilterRow visible={true} />
        <HeaderFilter visible={true} />
        <Scrolling mode="virtual" />
        <Paging enabled={false} />

        <Column dataField="transferDate" caption="Date" dataType="datetime" format="MM/dd/yyyy HH:mm" width={150} />
        <Column dataField="direction" caption="Direction" width={100} cellRender={(data) => (
          <span className={`transfer-direction direction-${data.value.toLowerCase()}`}>
            {data.value === 'In' ? '← IN' : '→ OUT'}
          </span>
        )} />
        <Column dataField="sourceTankName" caption="Source Tank" width={120} />
        <Column dataField="destinationTankName" caption="Destination Tank" width={140} />
        <Column dataField="amount" caption="Amount" dataType="number" format="#,##0.00" width={100} />
        <Column dataField="recordedBy" caption="Recorded By" width={150} />
        <Column dataField="notes" caption="Notes" width={200} />
        <Column dataField="isDeleted" caption="Deleted" dataType="boolean" width={80} />
      </DataGrid>
    </div>
  );

  // Render raw data section
  const renderRawData = () => (
    <div className="raw-data-section">
      <h4 className="section-title">
        <i className="fa-light fa-database"></i>
        Raw Data Summary
      </h4>
      <div className="raw-data-info">
        Complete diagnostic data loaded. This shows all transactions from TankStock, TankVolumeHistory, and TankTransfers tables.
      </div>
      <pre className="raw-data-content">
        {JSON.stringify(diagnosticData, null, 2)}
      </pre>
    </div>
  );

  return (
    <div className="period-diagnostic-panel">
      {renderPeriodHeader()}
      {renderSectionTabs()}
      <div className="section-content">
        {activeSection === 'overview' && renderOverview()}
        {activeSection === 'stock' && renderStockEntriesGrid()}
        {activeSection === 'volume' && renderVolumeTransactionsGrid()}
        {activeSection === 'transfers' && renderTransfersGrid()}
        {activeSection === 'raw' && renderRawData()}
      </div>
    </div>
  );
};

PeriodDiagnosticPanel.propTypes = {
  diagnosticData: PropTypes.shape({
    tankId: PropTypes.number,
    tankName: PropTypes.string,
    startDate: PropTypes.string,
    endDate: PropTypes.string,
    stockEntries: PropTypes.array,
    volumeTransactions: PropTypes.array,
    transfers: PropTypes.array,
    reconciliation: PropTypes.shape({
      openingStock: PropTypes.number,
      actualClosing: PropTypes.number,
      expectedClosing: PropTypes.number,
      variance: PropTypes.number,
      variancePercentage: PropTypes.number,
      calculationSteps: PropTypes.arrayOf(PropTypes.string)
    }),
    warnings: PropTypes.arrayOf(PropTypes.shape({
      severity: PropTypes.oneOf(['info', 'warning', 'critical']),
      category: PropTypes.string,
      message: PropTypes.string,
      details: PropTypes.string,
      suggestedAction: PropTypes.string
    }))
  }),
  periodInfo: PropTypes.shape({
    periodNumber: PropTypes.number.isRequired,
    startDate: PropTypes.string.isRequired,
    endDate: PropTypes.string.isRequired,
    variance: PropTypes.number.isRequired,
    severity: PropTypes.oneOf(['acceptable', 'moderate', 'high', 'critical'])
  }),
  loading: PropTypes.bool,
  error: PropTypes.string,
  onExportJSON: PropTypes.func
};

export default PeriodDiagnosticPanel;
