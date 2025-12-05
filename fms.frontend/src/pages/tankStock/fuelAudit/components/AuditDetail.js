import React, { useEffect, useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Button from 'devextreme-react/button';
import Popup from 'devextreme-react/popup';
import TextArea from 'devextreme-react/text-area';
import notify from 'devextreme/ui/notify';
import {
  fetchFuelAuditById,
  calculateAuditVariances,
  finalizeAuditAction,
  cancelAuditAction,
  resolveFlagAction,
  selectCurrentAudit,
  selectLoading,
  clearCurrentAudit
} from '../../../../redux/slices/fuelAuditSlice';

/**
 * AuditDetail Component
 * Detailed view of a single fuel audit
 */
const AuditDetail = () => {
  const { auditId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const audit = useSelector(selectCurrentAudit);
  const loading = useSelector(selectLoading);

  const [showCancelPopup, setShowCancelPopup] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showResolvePopup, setShowResolvePopup] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState(null);
  const [resolution, setResolution] = useState('');

  // Track initialization to prevent DevExtreme DOM conflicts
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (auditId) {
      dispatch(fetchFuelAuditById({ auditId: parseInt(auditId) })).finally(() => {
        // Delay before allowing DevExtreme components to render
        setTimeout(() => setIsInitialized(true), 100);
      });
    }
    return () => {
      dispatch(clearCurrentAudit());
    };
  }, [auditId, dispatch]);

  const handleCalculate = useCallback(async () => {
    try {
      await dispatch(calculateAuditVariances({ auditId: parseInt(auditId) })).unwrap();
      notify('Audit calculated successfully', 'success', 3000);
    } catch (error) {
      notify(error?.message || 'Failed to calculate audit', 'error', 5000);
    }
  }, [auditId, dispatch]);

  const handleFinalize = useCallback(async () => {
    try {
      await dispatch(finalizeAuditAction(parseInt(auditId))).unwrap();
      notify('Audit finalized successfully', 'success', 3000);
    } catch (error) {
      notify(error?.message || 'Failed to finalize audit', 'error', 5000);
    }
  }, [auditId, dispatch]);

  const handleCancel = useCallback(async () => {
    if (!cancelReason.trim()) {
      notify('Please provide a cancellation reason', 'warning', 3000);
      return;
    }
    try {
      await dispatch(cancelAuditAction({ auditId: parseInt(auditId), reason: cancelReason })).unwrap();
      notify('Audit cancelled', 'success', 3000);
      setShowCancelPopup(false);
      setCancelReason('');
    } catch (error) {
      notify(error?.message || 'Failed to cancel audit', 'error', 5000);
    }
  }, [auditId, cancelReason, dispatch]);

  const handleResolveFlag = useCallback(async () => {
    if (!resolution.trim()) {
      notify('Please provide a resolution', 'warning', 3000);
      return;
    }
    try {
      await dispatch(resolveFlagAction({ flagId: selectedFlag.id, resolution })).unwrap();
      notify('Flag resolved', 'success', 3000);
      setShowResolvePopup(false);
      setSelectedFlag(null);
      setResolution('');
    } catch (error) {
      notify(error?.message || 'Failed to resolve flag', 'error', 5000);
    }
  }, [selectedFlag, resolution, dispatch]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatVolume = (volume) => {
    if (volume === null || volume === undefined) return '-';
    return `${volume.toLocaleString()} L`;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      Draft: { className: 'draft', icon: 'fa-file-pen' },
      Calculated: { className: 'calculated', icon: 'fa-calculator' },
      Finalized: { className: 'finalized', icon: 'fa-check-circle' },
      Cancelled: { className: 'cancelled', icon: 'fa-times-circle' }
    };
    const config = statusConfig[status] || statusConfig.Draft;
    return (
      <span className={`status-badge ${config.className}`}>
        <i className={`fa-light ${config.icon}`}></i>
        {status}
      </span>
    );
  };

  const getSeverityClass = (severity) => {
    const map = { Low: 'low', Medium: 'medium', High: 'high', Critical: 'critical' };
    return map[severity] || 'low';
  };

  // Handle continuing a draft audit in the wizard
  const handleContinueDraft = useCallback(() => {
    if (audit) {
      // Navigate to edit mode with the audit ID
      navigate(`/tankstock/fuel-audit/edit/${audit.id}`);
    }
  }, [navigate, audit]);

  // Show loading state with CSS spinner (not <i> to avoid DOM conflicts)
  if (loading.currentAudit || !isInitialized) {
    return (
      <div className="tw-p-6 tw-flex tw-items-center tw-justify-center tw-min-h-[400px]">
        <div className="tw-text-center">
          <div className="tw-w-10 tw-h-10 tw-border-4 tw-border-blue-600 tw-border-t-transparent tw-rounded-full tw-animate-spin tw-mx-auto tw-mb-4"></div>
          <p className="tw-text-gray-500">Loading audit details...</p>
        </div>
      </div>
    );
  }

  if (!audit) {
    return (
      <div className="tw-p-6 tw-flex tw-items-center tw-justify-center tw-min-h-[400px]">
        <div className="tw-text-center">
          <div className="tw-text-4xl tw-text-gray-300 tw-mb-4">📄</div>
          <p className="tw-text-gray-500">Audit not found</p>
          <button
            onClick={() => navigate('/tankstock/fuel-audit/list')}
            className="tw-mt-4 tw-text-blue-600 hover:tw-text-blue-700"
          >
            ← Back to List
          </button>
        </div>
      </div>
    );
  }

  const isEditable = audit.status === 'Draft' || audit.status === 'Calculated';
  const canCalculate = audit.status === 'Draft';
  const canFinalize = audit.status === 'Calculated';
  const canContinueDraft = audit.status === 'Draft';

  return (
    <div className="tw-p-6 audit-detail">
      {/* Header */}
      <div className="tw-bg-white tw-rounded-xl tw-shadow-sm tw-border tw-border-gray-100 tw-p-6 tw-mb-6">
        <div className="tw-flex tw-items-start tw-justify-between">
          <div>
            <button
              onClick={() => navigate('/tankstock/fuel-audit/list')}
              className="tw-text-gray-500 hover:tw-text-gray-700 tw-mb-3 tw-flex tw-items-center tw-gap-2"
            >
              <i className="fa-light fa-arrow-left"></i>
              Back to List
            </button>
            <h1 className="tw-text-2xl tw-font-bold tw-text-gray-800 tw-flex tw-items-center tw-gap-3">
              {audit.auditNumber}
              {getStatusBadge(audit.status)}
            </h1>
            <p className="tw-text-gray-500 tw-mt-1">
              {audit.siteName || 'All Sites'} • {formatDate(audit.auditPeriodStart)} - {formatDate(audit.auditPeriodEnd)}
            </p>
          </div>

          {isEditable && (
            <div className="tw-flex tw-items-center tw-gap-2">
              {canContinueDraft && (
                <Button
                  text="Continue Draft"
                  icon="fa-light fa-pen-to-square"
                  type="default"
                  stylingMode="contained"
                  onClick={handleContinueDraft}
                />
              )}
              {canCalculate && (
                <Button
                  text="Calculate"
                  icon="formula"
                  type="default"
                  onClick={handleCalculate}
                  disabled={loading.calculate}
                />
              )}
              {canFinalize && (
                <Button
                  text="Finalize"
                  icon="check"
                  type="success"
                  onClick={handleFinalize}
                  disabled={loading.finalize}
                />
              )}
              <Button
                text="Cancel Audit"
                icon="close"
                type="danger"
                stylingMode="outlined"
                onClick={() => setShowCancelPopup(true)}
              />
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {audit.status !== 'Draft' && (
          <div className="tw-grid tw-grid-cols-4 tw-gap-4 tw-mt-6 tw-pt-6 tw-border-t tw-border-gray-100">
            <div>
              <div className="tw-text-sm tw-text-gray-500">Expected</div>
              <div className="tw-text-xl tw-font-bold tw-text-gray-800">{formatVolume(audit.totalExpected)}</div>
            </div>
            <div>
              <div className="tw-text-sm tw-text-gray-500">Actual</div>
              <div className="tw-text-xl tw-font-bold tw-text-gray-800">{formatVolume(audit.totalActual)}</div>
            </div>
            <div>
              <div className="tw-text-sm tw-text-gray-500">Variance</div>
              <div className={`tw-text-xl tw-font-bold ${
                Math.abs(audit.totalVariance || 0) > 500 ? 'tw-text-red-600' : 'tw-text-green-600'
              }`}>
                {formatVolume(audit.totalVariance)}
              </div>
            </div>
            <div>
              <div className="tw-text-sm tw-text-gray-500">Variance %</div>
              <div className={`tw-text-xl tw-font-bold ${
                Math.abs(audit.variancePercentage || 0) > 2 ? 'tw-text-red-600' : 'tw-text-green-600'
              }`}>
                {audit.variancePercentage?.toFixed(2) || 0}%
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tank Readings */}
      <div className="detail-section">
        <div className="section-header">
          <h3>
            <i className="fa-light fa-gauge tw-text-blue-600"></i>
            Tank Readings
          </h3>
        </div>
        <div className="section-content">
          {!audit.tankerReadings || audit.tankerReadings.length === 0 ? (
            <div className="tw-text-center tw-py-8 tw-text-gray-500">
              <i className="fa-light fa-database tw-text-3xl tw-mb-2"></i>
              <p>No tank readings yet</p>
            </div>
          ) : (
            <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-4">
              {audit.tankerReadings.map((reading, index) => (
                <div
                  key={index}
                  className={`reading-card ${reading.readingType?.toLowerCase()}`}
                >
                  <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
                    <span className="tw-font-medium tw-text-gray-800">
                      Tank {reading.tankId}
                    </span>
                    <span className={`tw-text-xs tw-px-2 tw-py-1 tw-rounded ${
                      reading.readingType === 'Opening' ? 'tw-bg-blue-100 tw-text-blue-700' : 'tw-bg-green-100 tw-text-green-700'
                    }`}>
                      {reading.readingType}
                    </span>
                  </div>
                  <div className="tw-text-2xl tw-font-bold tw-text-gray-800">
                    {formatVolume(reading.volume)}
                  </div>
                  <div className="tw-text-xs tw-text-gray-500 tw-mt-1">
                    {formatDate(reading.readingDateTime)}
                    {reading.isAutoPopulated && (
                      <span className="tw-ml-2 tw-text-blue-600">
                        <i className="fa-light fa-robot"></i> Auto
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Variances */}
      {audit.variances && audit.variances.length > 0 && (
        <div className="detail-section">
          <div className="section-header">
            <h3>
              <i className="fa-light fa-chart-mixed tw-text-orange-600"></i>
              Variances
            </h3>
          </div>
          <div className="section-content">
            {audit.variances.map((variance, index) => (
              <div key={index} className="variance-row">
                <div>
                  <div className="tw-font-medium tw-text-gray-800">{variance.varianceType}</div>
                  <div className="tw-text-sm tw-text-gray-500">Tank {variance.tankId}</div>
                </div>
                <div className="tw-text-right">
                  <div className={`tw-font-bold ${
                    Math.abs(variance.variancePercentage) > 2 ? 'tw-text-red-600' : 'tw-text-green-600'
                  }`}>
                    {formatVolume(variance.varianceAmount)} ({variance.variancePercentage?.toFixed(2)}%)
                  </div>
                  <div className="tw-text-sm tw-text-gray-500">
                    Expected: {formatVolume(variance.expectedValue)} | Actual: {formatVolume(variance.actualValue)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Flags */}
      {audit.flags && audit.flags.length > 0 && (
        <div className="detail-section">
          <div className="section-header">
            <h3>
              <i className="fa-light fa-flag tw-text-red-600"></i>
              Flags ({audit.flags.filter(f => f.status !== 'Resolved').length} unresolved)
            </h3>
          </div>
          <div className="section-content">
            {audit.flags.map((flag, index) => (
              <div key={index} className={`flag-item ${flag.status === 'Resolved' ? 'resolved' : ''}`}>
                <div className={`flag-icon ${
                  flag.severity === 'Critical' ? 'tw-bg-red-100' :
                  flag.severity === 'High' ? 'tw-bg-orange-100' :
                  flag.severity === 'Medium' ? 'tw-bg-yellow-100' : 'tw-bg-green-100'
                }`}>
                  <i className={`fa-light fa-flag ${
                    flag.severity === 'Critical' ? 'tw-text-red-600' :
                    flag.severity === 'High' ? 'tw-text-orange-600' :
                    flag.severity === 'Medium' ? 'tw-text-yellow-600' : 'tw-text-green-600'
                  }`}></i>
                </div>
                <div className="tw-flex-1">
                  <div className="tw-flex tw-items-center tw-gap-2">
                    <span className="tw-font-medium tw-text-gray-800">{flag.flagType}</span>
                    <span className={`flag-severity ${getSeverityClass(flag.severity)}`}>
                      {flag.severity}
                    </span>
                  </div>
                  <div className="tw-text-sm tw-text-gray-600 tw-mt-1">{flag.description}</div>
                  {flag.resolution && (
                    <div className="tw-text-sm tw-text-green-600 tw-mt-2">
                      <i className="fa-light fa-check-circle tw-mr-1"></i>
                      Resolved: {flag.resolution}
                    </div>
                  )}
                </div>
                {flag.status !== 'Resolved' && isEditable && (
                  <Button
                    text="Resolve"
                    stylingMode="outlined"
                    type="success"
                    onClick={() => {
                      setSelectedFlag(flag);
                      setShowResolvePopup(true);
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cancel Popup */}
      <Popup
        visible={showCancelPopup}
        onHiding={() => setShowCancelPopup(false)}
        title="Cancel Audit"
        width={400}
        height="auto"
        showCloseButton={true}
      >
        <div className="tw-p-4">
          <p className="tw-text-gray-600 tw-mb-4">
            Are you sure you want to cancel this audit? This action cannot be undone.
          </p>
          <TextArea
            value={cancelReason}
            onValueChanged={(e) => setCancelReason(e.value)}
            placeholder="Enter cancellation reason..."
            height={100}
          />
          <div className="tw-flex tw-justify-end tw-gap-2 tw-mt-4">
            <Button text="Cancel" onClick={() => setShowCancelPopup(false)} />
            <Button
              text="Confirm Cancel"
              type="danger"
              onClick={handleCancel}
              disabled={loading.cancel}
            />
          </div>
        </div>
      </Popup>

      {/* Resolve Flag Popup */}
      <Popup
        visible={showResolvePopup}
        onHiding={() => {
          setShowResolvePopup(false);
          setSelectedFlag(null);
          setResolution('');
        }}
        title="Resolve Flag"
        width={400}
        height="auto"
        showCloseButton={true}
      >
        <div className="tw-p-4">
          {selectedFlag && (
            <>
              <div className="tw-mb-4">
                <div className="tw-font-medium tw-text-gray-800">{selectedFlag.flagType}</div>
                <div className="tw-text-sm tw-text-gray-500">{selectedFlag.description}</div>
              </div>
              <TextArea
                value={resolution}
                onValueChanged={(e) => setResolution(e.value)}
                placeholder="Enter resolution description..."
                height={100}
              />
              <div className="tw-flex tw-justify-end tw-gap-2 tw-mt-4">
                <Button text="Cancel" onClick={() => setShowResolvePopup(false)} />
                <Button
                  text="Resolve Flag"
                  type="success"
                  onClick={handleResolveFlag}
                  disabled={loading.resolveFlag}
                />
              </div>
            </>
          )}
        </div>
      </Popup>
    </div>
  );
};

export default AuditDetail;
