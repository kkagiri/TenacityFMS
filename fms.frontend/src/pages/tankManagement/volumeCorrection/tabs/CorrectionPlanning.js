import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, LoadIndicator } from 'devextreme-react';
import { DataGrid, Column, Paging, Pager } from 'devextreme-react/data-grid';
import notify from 'devextreme/ui/notify';
import {
  generateCorrectionPlan,
  selectAllSequenceBreaks,
  selectCorrectionPlan,
  selectLoading,
  selectError,
  selectSelectedStrategy,
  setSelectedStrategy
} from '../../../../redux/slices/tankVolumeCorrectionSlice';
import { usePermissions } from '../../../../hooks/usePermissions';

/**
 * Correction Planning Tab
 * PHASE 2: ANALYZE - Generate correction plans from detected breaks
 *
 * Features:
 * - Plan generation from detected breaks
 * - Strategy recommendation
 * - Step-by-step procedure display
 * - Impact forecast
 */
const CorrectionPlanning = () => {
  const dispatch = useDispatch();
  const { hasPermission } = usePermissions();

  const breaks = useSelector(selectAllSequenceBreaks);
  const plan = useSelector(selectCorrectionPlan);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);
  const selectedStrategy = useSelector(selectSelectedStrategy);

  const canRead = hasPermission('_Read_tankStock');

  if (!canRead) {
    return (
      <div className="tvcc-permission-denied-tab">
        <i className="fa-light fa-lock"></i>
        <p>You don't have permission to view this data</p>
      </div>
    );
  }

  const handleGeneratePlan = async () => {
    if (!breaks || breaks.length === 0) {
      notify('Please run detection first to find breaks', 'warning', 3000);
      return;
    }

    try {
      await dispatch(
        generateCorrectionPlan({ sequenceBreaks: breaks })
      ).unwrap();
      notify('Correction plan generated successfully', 'success', 3000);
    } catch (err) {
      notify(
        `Error: ${err?.message || 'Failed to generate plan'}`,
        'error',
        5000
      );
    }
  };

  const strategyDescriptions = {
    'RECALCULATE': {
      title: 'Recalculate (Recommended)',
      description: 'Bulk rebuild from opening stock baseline',
      best_for: 'Multiple transactions, valid opening stock',
      algorithm: 'NewVolume = Previous.NewVolume + VolumeChange',
      color: 'primary'
    },
    'MANUAL': {
      title: 'Manual Override',
      description: 'Override with physically verified value',
      best_for: 'Single known error with physical verification',
      algorithm: 'transaction.NewVolume = verifiedValue, then cascade downstream',
      color: 'secondary'
    },
    'RECALCULATE_SINGLE': {
      title: 'Recalculate Single',
      description: 'Fix isolated broken transaction',
      best_for: 'Single isolated break detected',
      algorithm: 'Recalculate from previous transaction forward',
      color: 'tertiary'
    },
    'RECALCULATE_FROM_POINT': {
      title: 'Recalculate From Point',
      description: 'Fix multi-date corruption',
      best_for: 'Corruption spanning multiple dates',
      algorithm: 'Recalculate from corruption point to end date',
      color: 'quaternary'
    }
  };

  const noBreaksFound = !breaks || breaks.length === 0;
  const isProcessing = loading.generatePlan;

  return (
    <div className="tvcc-correction-planning">
      {/* Input Status */}
      <div className="tvcc-card">
        <h3>
          <i className="fa-light fa-info-circle"></i>
          Detection Results
        </h3>

        {noBreaksFound ? (
          <div className="tvcc-empty-input">
            <i className="fa-light fa-magnifying-glass"></i>
            <p>No breaks detected. Run the Detection tab first to find issues.</p>
          </div>
        ) : (
          <div className="tvcc-input-summary">
            <div className="tvcc-summary-box">
              <div className="tvcc-summary-value">{breaks.length}</div>
              <div className="tvcc-summary-label">Breaks Found</div>
            </div>
            <div className="tvcc-summary-box">
              <div className="tvcc-summary-value">
                {new Set(breaks.map(b => b.tankId)).size}
              </div>
              <div className="tvcc-summary-label">Affected Tanks</div>
            </div>
            <div className="tvcc-summary-box">
              <div className="tvcc-summary-value">
                {breaks.reduce((sum, b) => sum + Math.abs(b.variance), 0).toFixed(0)}
              </div>
              <div className="tvcc-summary-label">Total Variance (L)</div>
            </div>
          </div>
        )}
      </div>

      {/* Generation Controls */}
      <div className="tvcc-card">
        <h3>
          <i className="fa-light fa-wand-magic-sparkles"></i>
          Generate Plan
        </h3>

        <p className="tvcc-info-text">
          Generate a step-by-step correction plan based on detected breaks.
          The plan will recommend the best correction strategy and show all necessary steps.
        </p>

        <Button
          text="Generate Correction Plan"
          icon="fa-light fa-wand-magic-sparkles"
          type="default"
          stylingMode="contained"
          onClick={handleGeneratePlan}
          disabled={noBreaksFound || isProcessing}
        >
          {isProcessing && <LoadIndicator width={16} height={16} />}
        </Button>
      </div>

      {/* Plan Results */}
      {plan && (
        <div className="tvcc-card">
          <h3>
            <i className="fa-light fa-clipboard-list"></i>
            Correction Plan
          </h3>

          {/* Plan Summary */}
          <div className="tvcc-plan-summary">
            <div className="tvcc-plan-stat">
              <span className="tvcc-stat-label">Total Breaks:</span>
              <span className="tvcc-stat-value">{plan.totalBreaks || 0}</span>
            </div>
            <div className="tvcc-plan-stat">
              <span className="tvcc-stat-label">Affected Tanks:</span>
              <span className="tvcc-stat-value">
                {plan.breaksByTank ? Object.keys(plan.breaksByTank).length : (plan.affectedTanks || 0)}
              </span>
            </div>
            <div className="tvcc-plan-stat">
              <span className="tvcc-stat-label">Total Steps:</span>
              <span className="tvcc-stat-value">
                {plan.correctionSteps ? Object.values(plan.correctionSteps).reduce((sum, steps) => sum + steps.length, 0) : 0}
              </span>
            </div>
            <div className="tvcc-plan-stat">
              <span className="tvcc-stat-label">Recommended Strategy:</span>
              <span className={`tvcc-stat-badge tvcc-${strategyDescriptions[plan.recommendedStrategy]?.color}`}>
                {strategyDescriptions[plan.recommendedStrategy]?.title || 'N/A'}
              </span>
            </div>
          </div>

          {/* Correction Steps by Tank */}
          {plan.correctionSteps && Object.keys(plan.correctionSteps).length > 0 && (
            <div className="tvcc-steps-section">
              <h4>
                <i className="fa-light fa-list-check"></i>
                Correction Steps by Tank ({Object.keys(plan.correctionSteps).length} tanks)
              </h4>

              {Object.entries(plan.correctionSteps).map(([tankId, steps]) => (
                <div key={tankId} className="tvcc-tank-steps-group">
                  <div className="tvcc-tank-header">
                    <h5>
                      <i className="fa-light fa-gas-pump"></i>
                      Tank {tankId}
                    </h5>
                    <span className="tvcc-steps-count">{steps.length} steps</span>
                  </div>

                  <div className="tvcc-steps-list">
                    {steps.map((step, index) => (
                      <div key={index} className="tvcc-step-item">
                        <div className="tvcc-step-header">
                          <span className="tvcc-step-number">{step.stepNumber}</span>
                          <div className="tvcc-step-title-group">
                            <h5>{step.action}</h5>
                            <p>{step.description}</p>
                          </div>
                        </div>
                        {step.affectedTransactionIds && step.affectedTransactionIds.length > 0 && (
                          <div className="tvcc-step-details">
                            <span className="tvcc-detail-badge">
                              {step.affectedTransactionIds.length} transactions affected
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Strategy Info */}
          {plan.recommendedStrategy && (
            <div className="tvcc-strategy-info">
              <h4>
                <i className="fa-light fa-lightbulb"></i>
                Recommended Strategy Details
              </h4>
              <div className={`tvcc-strategy-detail tvcc-${strategyDescriptions[plan.recommendedStrategy]?.color}`}>
                <h5>{strategyDescriptions[plan.recommendedStrategy]?.title}</h5>
                <p className="tvcc-strategy-desc">
                  {strategyDescriptions[plan.recommendedStrategy]?.description}
                </p>
                <p className="tvcc-strategy-best">
                  <strong>Best for:</strong> {strategyDescriptions[plan.recommendedStrategy]?.best_for}
                </p>
                <p className="tvcc-strategy-algo">
                  <strong>Algorithm:</strong> {strategyDescriptions[plan.recommendedStrategy]?.algorithm}
                </p>
              </div>
            </div>
          )}

          {/* Breaks by Tank */}
          {plan.breaksByTank && Object.keys(plan.breaksByTank).length > 0 && (
            <div className="tvcc-breaks-table-section">
              <h4>
                <i className="fa-light fa-list"></i>
                Breaks by Tank ({Object.keys(plan.breaksByTank).length} tanks)
              </h4>

              {Object.entries(plan.breaksByTank).map(([tankId, tankBreaks]) => (
                <div key={tankId} className="tvcc-tank-breaks-section">
                  <div className="tvcc-tank-breaks-header">
                    <h5>
                      <i className="fa-light fa-gas-pump"></i>
                      Tank {tankId}
                    </h5>
                    <span className="tvcc-breaks-count">{tankBreaks.length} breaks</span>
                  </div>

                  <DataGrid
                    dataSource={tankBreaks}
                    showBorders={true}
                    showRowLines={true}
                    rowAlternationEnabled={true}
                    columnAutoWidth={true}
                  >
                    <Paging enabled={true} defaultPageSize={5} />
                    <Pager showPageSizeSelector={true} allowedPageSizes={[5, 10, 20]} showInfo={true} />

                    <Column dataField="transactionId" caption="Txn ID" width={100} alignment="center" />
                    <Column dataField="expectedVolume" caption="Expected (L)" width={120} dataType="number" format="#,##0.00" />
                    <Column dataField="actualVolume" caption="Actual (L)" width={120} dataType="number" format="#,##0.00" />
                    <Column dataField="variance" caption="Variance (L)" width={120} dataType="number" format="#,##0.00" />
                    <Column
                      dataField="severity"
                      caption="Severity"
                      width={100}
                      alignment="center"
                      cellRender={(data) => (
                        <span className={`tvcc-severity-badge tvcc-severity-${data.value?.toLowerCase()}`}>
                          {data.value}
                        </span>
                      )}
                    />
                  </DataGrid>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error.generatePlan && (
        <div className="tvcc-card tvcc-error-card">
          <div className="tvcc-error-content">
            <i className="fa-light fa-circle-exclamation"></i>
            <div>
              <h4>Error</h4>
              <p>{error.generatePlan?.message || 'An error occurred'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isProcessing && (
        <div className="tvcc-card tvcc-loading-card">
          <LoadIndicator />
          <p>Generating correction plan...</p>
        </div>
      )}

      {/* Strategies Reference */}
      {!plan && (
        <div className="tvcc-card tvcc-strategies-reference">
          <h3>
            <i className="fa-light fa-book"></i>
            Correction Strategies Reference
          </h3>

          <div className="tvcc-strategies-grid">
            {Object.entries(strategyDescriptions).map(([key, strategy]) => (
              <div key={key} className={`tvcc-strategy-card tvcc-${strategy.color}`}>
                <h5>{strategy.title}</h5>
                <p className="tvcc-desc">{strategy.description}</p>
                <p className="tvcc-best"><strong>Best for:</strong> {strategy.best_for}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CorrectionPlanning;
