import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, LoadIndicator, TextBox, SelectBox, DateBox } from 'devextreme-react';
import { DataGrid, Column } from 'devextreme-react/data-grid';
import notify from 'devextreme/ui/notify';
import {
  correctRecalculate,
  correctManual,
  correctSingleTransaction,
  correctFromPoint,
  selectAllSequenceBreaks,
  selectCorrectionPlan,
  selectCorrectionExecutionResult,
  selectLoading,
  selectError,
  selectSelectedStrategy,
  setSelectedStrategy,
  clearCorrectionResults
} from '../../../../redux/slices/tankVolumeCorrectionSlice';
import { usePermissions } from '../../../../hooks/usePermissions';

/**
 * Correction Execution Tab
 * PHASE 3: CORRECT - Execute corrections using 4 different strategies
 *
 * Features:
 * - Strategy selection
 * - Strategy-specific parameter forms
 * - Real-time execution monitoring
 * - Results and impact display
 */
const CorrectionExecution = () => {
  const dispatch = useDispatch();
  const { hasPermission } = usePermissions();

  // Local state
  const [selectedTankId, setSelectedTankId] = useState(null);
  const [strategyParams, setStrategyParams] = useState({
    tankId: null,
    fromDate: null,
    toDate: null,
    transactionId: null,
    newVolume: null,
    reason: ''
  });

  // Redux state
  const breaks = useSelector(selectAllSequenceBreaks);
  const plan = useSelector(selectCorrectionPlan);
  const result = useSelector(selectCorrectionExecutionResult);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);
  const selectedStrategy = useSelector(selectSelectedStrategy);

  // Build affected tanks list from plan
  const affectedTanks = plan?.breaksByTank ? Object.entries(plan.breaksByTank).map(([tankId, tankBreaks]) => ({
    tankId: parseInt(tankId),
    breaksCount: tankBreaks.length,
    breaks: tankBreaks,
    steps: plan.correctionSteps?.[tankId] || []
  })) : [];

  // Get tanks
  const tanks = useSelector((state) => state.tank.tanks || []);
  const tanksDataSource = tanks.map(tank => ({
    id: tank.id,
    name: tank.name
  }));

  const canRead = hasPermission('_Read_TankStock');
  const canUpdate = hasPermission('_Update_TankStock');

  // Auto-select recommended strategy from plan
  useEffect(() => {
    if (plan?.recommendedStrategy && !selectedStrategy) {
      dispatch(setSelectedStrategy(plan.recommendedStrategy));
    }
  }, [plan, selectedStrategy, dispatch]);

  // Get selected tank data
  const selectedTankData = affectedTanks.find(t => t.tankId === selectedTankId);

  // Handle tank selection
  const handleTankSelect = (tankId) => {
    setSelectedTankId(tankId);
    setStrategyParams({
      ...strategyParams,
      tankId: tankId
    });
  };

  // Auto-populate dates for RECALCULATE strategy when tank is selected
  useEffect(() => {
    if (selectedStrategy === 'RECALCULATE' && selectedTankData?.breaks && selectedTankData.breaks.length > 0) {
      // Extract dates from breaks for selected tank
      const breakDates = selectedTankData.breaks
        .map(b => b.transactionTimestamp ? new Date(b.transactionTimestamp) : null)
        .filter(d => d !== null);

      if (breakDates.length > 0) {
        // Find min and max dates
        const minDate = new Date(Math.min(...breakDates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...breakDates.map(d => d.getTime())));

        // Auto-populate date range
        setStrategyParams(prev => ({
          ...prev,
          fromDate: minDate,
          toDate: maxDate
        }));
      }
    }
  }, [selectedStrategy, selectedTankId]);

  if (!canRead) {
    return (
      <div className="tvcc-permission-denied-tab">
        <i className="fa-light fa-lock"></i>
        <p>You don't have permission to view this data</p>
      </div>
    );
  }

  if (!canUpdate) {
    return (
      <div className="tvcc-permission-denied-tab">
        <i className="fa-light fa-lock"></i>
        <p>Read-only mode - corrections are disabled</p>
      </div>
    );
  }

  const strategies = [
    {
      key: 'RECALCULATE',
      title: 'RECALCULATE (Recommended)',
      description: 'Bulk rebuild from opening stock baseline',
      icon: 'fa-light fa-calculator',
      best_for: 'Multiple transactions, valid opening stock'
    },
    {
      key: 'MANUAL',
      title: 'MANUAL (Override)',
      description: 'Override with physically verified value',
      icon: 'fa-light fa-pen',
      best_for: 'Single known error with verification'
    },
    {
      key: 'RECALCULATE_SINGLE',
      title: 'RECALCULATE_SINGLE (Isolated)',
      description: 'Fix one broken transaction',
      icon: 'fa-light fa-wrench',
      best_for: 'Single isolated break'
    },
    {
      key: 'RECALCULATE_FROM_POINT',
      title: 'RECALCULATE_FROM_POINT (Complex)',
      description: 'Fix multi-date corruption',
      icon: 'fa-light fa-arrow-right',
      best_for: 'Multi-date corruption'
    }
  ];

  const handleStrategySelect = (strategy) => {
    dispatch(setSelectedStrategy(strategy));
    setStrategyParams({
      tankId: null,
      fromDate: null,
      toDate: null,
      transactionId: null,
      newVolume: null,
      reason: ''
    });
  };

  const handleExecute = async () => {
    // Validate common fields
    if (!strategyParams.reason || strategyParams.reason.trim().length < 3) {
      notify('Please provide a reason (minimum 3 characters)', 'warning', 3000);
      return;
    }

    try {
      let dispatchAction;
      let payload;

      switch (selectedStrategy) {
        case 'RECALCULATE':
          if (!strategyParams.tankId || !strategyParams.fromDate || !strategyParams.toDate) {
            notify('Please select Tank ID and date range', 'warning', 3000);
            return;
          }
          payload = {
            tankId: strategyParams.tankId,
            fromDate: strategyParams.fromDate.toISOString().split('T')[0],
            toDate: strategyParams.toDate.toISOString().split('T')[0],
            reason: strategyParams.reason
          };
          dispatchAction = correctRecalculate;
          break;

        case 'MANUAL':
          if (!strategyParams.transactionId || strategyParams.newVolume === null) {
            notify('Please select Transaction ID and enter new volume', 'warning', 3000);
            return;
          }
          payload = {
            transactionId: strategyParams.transactionId,
            newVolume: parseFloat(strategyParams.newVolume),
            reason: strategyParams.reason
          };
          dispatchAction = correctManual;
          break;

        case 'RECALCULATE_SINGLE':
          if (!strategyParams.transactionId) {
            notify('Please select Transaction ID', 'warning', 3000);
            return;
          }
          payload = {
            transactionId: strategyParams.transactionId,
            reason: strategyParams.reason
          };
          dispatchAction = correctSingleTransaction;
          break;

        case 'RECALCULATE_FROM_POINT':
          if (!strategyParams.transactionId || !strategyParams.toDate) {
            notify('Please select start transaction and end date', 'warning', 3000);
            return;
          }
          payload = {
            startTransactionId: strategyParams.transactionId,
            toDate: strategyParams.toDate.toISOString().split('T')[0],
            reason: strategyParams.reason
          };
          dispatchAction = correctFromPoint;
          break;

        default:
          notify('No strategy selected', 'warning', 3000);
          return;
      }

      await dispatch(dispatchAction(payload)).unwrap();
      notify('Correction executed successfully!', 'success', 3000);
    } catch (err) {
      notify(
        `Error: ${err?.message || 'Failed to execute correction'}`,
        'error',
        5000
      );
    }
  };

  const isProcessing = loading.correctRecalculate || loading.correctManual ||
    loading.correctSingle || loading.correctFromPoint;

  const affectedBreaksForTank = breaks?.filter(b => b.tankId === strategyParams.tankId) || [];

  return (
    <div className="tvcc-correction-execution">
      {/* Plan Summary */}
      {plan && (
        <div className="tvcc-card">
          <h3>
            <i className="fa-light fa-clipboard-list"></i>
            Correction Plan Overview
          </h3>

          <div className="tvcc-plan-summary">
            <div className="tvcc-plan-stat">
              <span className="tvcc-stat-label">Total Breaks:</span>
              <span className="tvcc-stat-value">{plan.totalBreaks || 0}</span>
            </div>
            <div className="tvcc-plan-stat">
              <span className="tvcc-stat-label">Affected Tanks:</span>
              <span className="tvcc-stat-value">{affectedTanks.length}</span>
            </div>
            <div className="tvcc-plan-stat">
              <span className="tvcc-stat-label">Recommended Strategy:</span>
              <span className="tvcc-stat-badge tvcc-primary">
                {plan.recommendedStrategy || 'RECALCULATE'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Affected Tanks Selection */}
      {affectedTanks.length > 0 ? (
        <div className="tvcc-card">
          <h3>
            <i className="fa-light fa-gas-pump"></i>
            Select Tank to Correct ({affectedTanks.length} tanks with issues)
          </h3>

          <p className="tvcc-info-text">
            Choose a tank from the list below to proceed with correction.
            The table shows all tanks with detected sequence breaks.
          </p>

          <DataGrid
            dataSource={affectedTanks}
            keyExpr="tankId"
            showBorders={true}
            showRowLines={true}
            rowAlternationEnabled={true}
            columnAutoWidth={true}
            hoverStateEnabled={true}
            selectedRowKeys={selectedTankId ? [selectedTankId] : []}
            onRowClick={(e) => handleTankSelect(e.data.tankId)}
          >
            <Column
              dataField="tankId"
              caption="Tank ID"
              width={100}
              alignment="center"
            />
            <Column
              dataField="breaksCount"
              caption="Breaks Found"
              width={120}
              alignment="center"
              cellRender={(data) => (
                <span className="tvcc-detail-badge">
                  {data.value}
                </span>
              )}
            />
            <Column
              caption="Correction Steps"
              width={150}
              alignment="center"
              cellRender={(data) => (
                <span className="tvcc-form-hint">
                  {data.data.steps.length} steps
                </span>
              )}
            />
            <Column
              caption="Action"
              width={120}
              alignment="center"
              cellRender={(data) => (
                <Button
                  text="Select"
                  type="default"
                  stylingMode="outlined"
                  onClick={() => handleTankSelect(data.data.tankId)}
                  disabled={selectedTankId === data.data.tankId}
                />
              )}
            />
          </DataGrid>
        </div>
      ) : (
        <div className="tvcc-card">
          <div className="tvcc-empty-input">
            <i className="fa-light fa-clipboard-list"></i>
            <p>No correction plan found. Please run Detection and Planning first.</p>
          </div>
        </div>
      )}

      {/* Selected Tank Details */}
      {selectedTankData && (
        <div className="tvcc-card">
          <h3>
            <i className="fa-light fa-info-circle"></i>
            Tank {selectedTankData.tankId} - Correction Details
          </h3>

          <div className="tvcc-tank-correction-info">
            <div className="tvcc-info-row">
              <strong>Breaks Found:</strong>
              <span>{selectedTankData.breaksCount}</span>
            </div>
            <div className="tvcc-info-row">
              <strong>Correction Steps:</strong>
              <span>{selectedTankData.steps.length} steps planned</span>
            </div>
          </div>

          {/* Show correction steps for selected tank */}
          {selectedTankData.steps.length > 0 && (
            <div className="tvcc-steps-preview">
              <h4>Planned Correction Steps:</h4>
              <div className="tvcc-steps-list">
                {selectedTankData.steps.map((step, index) => (
                  <div key={index} className="tvcc-step-item">
                    <div className="tvcc-step-header">
                      <span className="tvcc-step-number">{step.stepNumber}</span>
                      <div className="tvcc-step-title-group">
                        <h5>{step.action}</h5>
                        <p>{step.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Strategy Selection */}
      {selectedTankId && (
        <div className="tvcc-card">
          <h3>
            <i className="fa-light fa-wand-magic-sparkles"></i>
            Select Correction Strategy
          </h3>

          <div className="tvcc-strategies-selector">
            {strategies.map(strategy => (
              <button
                key={strategy.key}
                className={`tvcc-strategy-option ${selectedStrategy === strategy.key ? 'selected' : ''}`}
                onClick={() => handleStrategySelect(strategy.key)}
              >
                <div className="tvcc-strategy-option-header">
                  <i className={strategy.icon}></i>
                  <span className="tvcc-strategy-option-title">{strategy.title}</span>
                </div>
                <p className="tvcc-strategy-option-desc">{strategy.description}</p>
                <small className="tvcc-strategy-option-best">{strategy.best_for}</small>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Strategy-Specific Parameters */}
      {selectedStrategy && selectedTankId && (
        <div className="tvcc-card">
          <h3>
            <i className="fa-light fa-sliders"></i>
            Correction Parameters
          </h3>

          <div className="tvcc-params-form">
            {selectedStrategy === 'RECALCULATE' && (
              <>
                <div className="tvcc-form-group">
                  <label>Tank *</label>
                  <SelectBox
                    dataSource={tanksDataSource}
                    displayExpr="name"
                    valueExpr="id"
                    placeholder="Select tank..."
                    value={strategyParams.tankId}
                    onValueChanged={(e) => {
                      setStrategyParams({ ...strategyParams, tankId: e.value });
                    }}
                    searchEnabled={true}
                    showClearButton={true}
                  />
                  {strategyParams.tankId && affectedBreaksForTank.length > 0 && (
                    <small className="tvcc-form-hint">
                      {affectedBreaksForTank.length} breaks found for this tank
                    </small>
                  )}
                </div>

                <div className="tvcc-form-group">
                  <label>From Date *</label>
                  <DateBox
                    value={strategyParams.fromDate}
                    onValueChanged={(e) => {
                      setStrategyParams({ ...strategyParams, fromDate: e.value });
                    }}
                    displayFormat="dd/MM/yyyy"
                    showClearButton={true}
                  />
                  {strategyParams.fromDate && selectedTankData?.breaks?.length > 0 && (
                    <small className="tvcc-form-hint">
                      <i className="fa-light fa-circle-info"></i>
                      Auto-populated from earliest break ({selectedTankData.breaks.length} breaks detected)
                    </small>
                  )}
                </div>

                <div className="tvcc-form-group">
                  <label>To Date *</label>
                  <DateBox
                    value={strategyParams.toDate}
                    onValueChanged={(e) => {
                      setStrategyParams({ ...strategyParams, toDate: e.value });
                    }}
                    displayFormat="dd/MM/yyyy"
                    showClearButton={true}
                  />
                  {strategyParams.toDate && selectedTankData?.breaks?.length > 0 && (
                    <small className="tvcc-form-hint">
                      <i className="fa-light fa-circle-info"></i>
                      Auto-populated from latest break
                    </small>
                  )}
                </div>
              </>
            )}

            {selectedStrategy === 'MANUAL' && (
              <>
                <div className="tvcc-form-group">
                  <label>Transaction ID *</label>
                  <TextBox
                    type="number"
                    placeholder="Enter transaction ID..."
                    value={strategyParams.transactionId}
                    onValueChanged={(e) => {
                      setStrategyParams({ ...strategyParams, transactionId: e.value ? parseInt(e.value) : null });
                    }}
                  />
                </div>

                <div className="tvcc-form-group">
                  <label>New Volume (L) *</label>
                  <TextBox
                    type="number"
                    placeholder="Enter verified volume..."
                    value={strategyParams.newVolume}
                    onValueChanged={(e) => {
                      setStrategyParams({ ...strategyParams, newVolume: e.value ? parseFloat(e.value) : null });
                    }}
                  />
                  <small className="tvcc-form-hint">Must be physically verified</small>
                </div>
              </>
            )}

            {selectedStrategy === 'RECALCULATE_SINGLE' && (
              <>
                <div className="tvcc-form-group">
                  <label>Transaction ID *</label>
                  <TextBox
                    type="number"
                    placeholder="Enter transaction ID..."
                    value={strategyParams.transactionId}
                    onValueChanged={(e) => {
                      setStrategyParams({ ...strategyParams, transactionId: e.value ? parseInt(e.value) : null });
                    }}
                  />
                  <small className="tvcc-form-hint">The broken transaction to fix</small>
                </div>
              </>
            )}

            {selectedStrategy === 'RECALCULATE_FROM_POINT' && (
              <>
                <div className="tvcc-form-group">
                  <label>Start Transaction ID *</label>
                  <TextBox
                    type="number"
                    placeholder="Enter start transaction ID..."
                    value={strategyParams.transactionId}
                    onValueChanged={(e) => {
                      setStrategyParams({ ...strategyParams, transactionId: e.value ? parseInt(e.value) : null });
                    }}
                  />
                  <small className="tvcc-form-hint">Where corruption begins</small>
                </div>

                <div className="tvcc-form-group">
                  <label>To Date *</label>
                  <DateBox
                    value={strategyParams.toDate}
                    onValueChanged={(e) => {
                      setStrategyParams({ ...strategyParams, toDate: e.value });
                    }}
                    displayFormat="dd/MM/yyyy"
                    showClearButton={true}
                  />
                  <small className="tvcc-form-hint">Recalculate to this date</small>
                </div>
              </>
            )}

            {/* Common Fields */}
            <div className="tvcc-form-group tvcc-full-width">
              <label>Reason for Correction *</label>
              <TextBox
                placeholder="Explain why this correction is needed..."
                value={strategyParams.reason}
                onValueChanged={(e) => {
                  setStrategyParams({ ...strategyParams, reason: e.value });
                }}
                multiline={true}
                height={80}
              />
              <small className="tvcc-form-hint">Minimum 3 characters required for audit trail</small>
            </div>
          </div>
        </div>
      )}

      {/* Execution Controls */}
      {selectedStrategy && (
        <div className="tvcc-card">
          <div className="tvcc-execution-controls">
            <Button
              text="Execute Correction"
              icon="fa-light fa-check"
              type="success"
              stylingMode="contained"
              onClick={handleExecute}
              disabled={isProcessing}
            >
              {isProcessing && <LoadIndicator width={16} height={16} />}
            </Button>

            {result && (
              <Button
                text="Clear Results"
                icon="fa-light fa-broom"
                type="normal"
                stylingMode="outlined"
                onClick={() => dispatch(clearCorrectionResults())}
              />
            )}
          </div>
        </div>
      )}

      {/* Execution Results */}
      {result && (
        <div className="tvcc-card tvcc-results-card">
          <h3>
            <i className="fa-light fa-check-circle"></i>
            Correction Results
          </h3>

          <div className="tvcc-results-grid">
            <div className={`tvcc-result-stat ${result.success ? 'success' : 'error'}`}>
              <span className="tvcc-result-label">Status</span>
              <span className="tvcc-result-value">
                {result.success ? 'SUCCESS' : 'FAILED'}
              </span>
            </div>

            <div className="tvcc-result-stat">
              <span className="tvcc-result-label">Transactions Corrected</span>
              <span className="tvcc-result-value">{result.transactionsCorrected || 0}</span>
            </div>

            <div className="tvcc-result-stat">
              <span className="tvcc-result-label">Processed</span>
              <span className="tvcc-result-value">{result.totalTransactionsProcessed || 0}</span>
            </div>

            {result.downstreamTransactionsCorrected && (
              <div className="tvcc-result-stat">
                <span className="tvcc-result-label">Cascaded Corrections</span>
                <span className="tvcc-result-value">{result.downstreamTransactionsCorrected}</span>
              </div>
            )}

            {result.volumeDifference && (
              <div className="tvcc-result-stat">
                <span className="tvcc-result-label">Volume Adjusted</span>
                <span className="tvcc-result-value">{result.volumeDifference.toFixed(2)}L</span>
              </div>
            )}
          </div>

          {result.message && (
            <div className="tvcc-result-message">
              <p>{result.message}</p>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {(error.correctRecalculate || error.correctManual || error.correctSingle || error.correctFromPoint) && (
        <div className="tvcc-card tvcc-error-card">
          <div className="tvcc-error-content">
            <i className="fa-light fa-circle-exclamation"></i>
            <div>
              <h4>Correction Failed</h4>
              <p>
                {error.correctRecalculate?.message ||
                  error.correctManual?.message ||
                  error.correctSingle?.message ||
                  error.correctFromPoint?.message ||
                  'An error occurred'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CorrectionExecution;
