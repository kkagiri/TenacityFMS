/**
 * File: IssueCompletionPopup.js
 * Purpose: Wizard-based issue completion side panel with 3 steps:
 *          Step 1 — Select actions performed
 *          Step 2 — Fill details per action
 *          Step 3 — Review summary and submit
 * Dependencies: React, LoadIndicator, SlidePanel, issueTrackerV2Service
 * Last Modified: 2026-03-06
 *
 * Key Components:
 * - IssueCompletionPopup: 3-step wizard side panel for structured issue completion
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import LoadIndicator from 'devextreme-react/load-indicator';
import SlidePanel from '../../../components/ui/SlidePanel';
import issueTrackerV2Service from '../../../services/issueTrackerV2Service';
import './IssueCompletionPopup.scss';

const STEPS = [
    { key: 'select', label: 'Select Actions' },
    { key: 'details', label: 'Action Details' },
    { key: 'review', label: 'Review & Submit' }
];

const CAMERA_POSITIONS = [
    { value: 'Front', text: 'Front' },
    { value: 'Rear', text: 'Rear' },
    { value: 'Interior', text: 'Interior' },
    { value: 'Left', text: 'Left' },
    { value: 'Right', text: 'Right' },
    { value: 'Dashboard', text: 'Dashboard' }
];

const TYPE_STYLES = {
    General: { bg: 'tw-bg-gray-100', text: 'tw-text-gray-700', icon: 'fa-light fa-wrench' },
    DeviceChange: { bg: 'tw-bg-blue-100', text: 'tw-text-blue-700', icon: 'fa-light fa-microchip' },
    CameraInstall: { bg: 'tw-bg-purple-100', text: 'tw-text-purple-700', icon: 'fa-light fa-camera' }
};

const TYPE_LABELS = { General: 'General', DeviceChange: 'Device Change', CameraInstall: 'Camera Install' };
const PANEL_TITLE = 'Mark issue as complete';

function createEmptyDetails() {
    return {
        rootCause: '',
        notes: '',
        oldDeviceType: '',
        oldDeviceImei: '',
        newDeviceType: '',
        newDeviceImei: '',
        devicePhoneNumber: '',
        sourceVehicleId: null,
        cameraImei: '',
        cameraPosition: '',
        cameraSimNumber: ''
    };
}

const IssueCompletionPopup = ({
    visible,
    onHide,
    onComplete,
    issueId,
    issueTemplateId,
    isProcessing: externalProcessing = false,
    vehicles = []
}) => {
    const [step, setStep] = useState(0);
    const [templateActions, setTemplateActions] = useState([]);
    const [loadingActions, setLoadingActions] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [showCustom, setShowCustom] = useState(false);
    const [customActionName, setCustomActionName] = useState('');
    const [detailsMap, setDetailsMap] = useState({});
    const [currentDetailIdx, setCurrentDetailIdx] = useState(0);
    const [generalNotes, setGeneralNotes] = useState('');

    const isProcessing = externalProcessing || isSubmitting;

    const resetForm = useCallback(() => {
        setStep(0);
        setSelectedIds(new Set());
        setShowCustom(false);
        setCustomActionName('');
        setDetailsMap({});
        setCurrentDetailIdx(0);
        setGeneralNotes('');
    }, []);

    const loadTemplateActions = useCallback(async () => {
        if (!issueTemplateId) {
            setTemplateActions([]);
            return;
        }

        try {
            setLoadingActions(true);
            const actions = await issueTrackerV2Service.getTemplateActionsForCompletion(issueTemplateId);
            setTemplateActions(actions || []);
        } catch (error) {
            console.error('Error loading template actions:', error);
            setTemplateActions([]);
        } finally {
            setLoadingActions(false);
        }
    }, [issueTemplateId]);

    useEffect(() => {
        if (!visible) {
            return;
        }

        resetForm();
        loadTemplateActions();
    }, [visible, resetForm, loadTemplateActions]);

    const selectedActions = useMemo(() => {
        const list = templateActions.filter((action) => selectedIds.has(action.id));
        if (showCustom && customActionName.trim()) {
            list.push({
                id: '__custom__',
                name: customActionName.trim(),
                actionType: 'General',
                requiresDeviceDetails: false,
                requiresSourceVehicle: false,
                requiresCameraDetails: false,
                description: null
            });
        }
        return list;
    }, [templateActions, selectedIds, showCustom, customActionName]);

    const vehicleDataSource = useMemo(() => (
        vehicles.map((vehicle) => ({
            id: vehicle.vehicleId ?? vehicle.id,
            displayName: vehicle.hyoungNo || vehicle.numberPlate || `Vehicle #${vehicle.vehicleId ?? vehicle.id}`
        }))
    ), [vehicles]);

    const currentAction = selectedActions[currentDetailIdx] || null;
    const canProceedFromSelect = selectedActions.length > 0;

    const toggleAction = useCallback((actionId) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(actionId)) {
                next.delete(actionId);
            } else {
                next.add(actionId);
            }
            return next;
        });
    }, []);

    const getDetails = useCallback((actionId) => detailsMap[actionId] || createEmptyDetails(), [detailsMap]);

    const updateDetail = useCallback((actionId, field, value) => {
        setDetailsMap((prev) => ({
            ...prev,
            [actionId]: {
                ...(prev[actionId] || createEmptyDetails()),
                [field]: value
            }
        }));
    }, []);

    const handleNativeInputChange = useCallback((actionId, field) => (event) => {
        updateDetail(actionId, field, event.target.value);
    }, [updateDetail]);

    const goNext = useCallback(() => {
        if (step === 0) {
            setCurrentDetailIdx(0);
            setDetailsMap((prev) => {
                const next = { ...prev };
                selectedActions.forEach((action) => {
                    if (!next[action.id]) {
                        next[action.id] = createEmptyDetails();
                    }
                });
                return next;
            });
            setStep(1);
            return;
        }

        if (step === 1) {
            setStep(2);
        }
    }, [selectedActions, step]);

    const goBack = useCallback(() => {
        if (step > 0) {
            setStep((prev) => prev - 1);
        }
    }, [step]);

    const handleCancel = useCallback(() => {
        if (!isProcessing && onHide) {
            onHide();
        }
    }, [isProcessing, onHide]);

    const handleSubmit = useCallback(async () => {
        if (isProcessing) {
            return;
        }

        try {
            setIsSubmitting(true);
            const completionData = {
                actions: selectedActions.map((action) => {
                    const details = getDetails(action.id);
                    return {
                        templateActionId: action.id === '__custom__' ? null : action.id,
                        actionName: action.name,
                        rootCause: details.rootCause || null,
                        notes: details.notes || null,
                        oldDeviceType: details.oldDeviceType || null,
                        oldDeviceImei: details.oldDeviceImei || null,
                        newDeviceType: details.newDeviceType || null,
                        newDeviceImei: details.newDeviceImei || null,
                        devicePhoneNumber: details.devicePhoneNumber || null,
                        sourceVehicleId: details.sourceVehicleId || null,
                        cameraImei: details.cameraImei || null,
                        cameraPosition: details.cameraPosition || null,
                        cameraSimNumber: details.cameraSimNumber || null,
                        additionalNotes: null
                    };
                }),
                notes: generalNotes.trim() || null
            };

            await issueTrackerV2Service.completeWithActions(issueId, completionData);

            if (onComplete) {
                onComplete();
            }
        } catch (error) {
            console.error('Error completing issue:', error);
        } finally {
            setIsSubmitting(false);
        }
    }, [generalNotes, getDetails, isProcessing, issueId, onComplete, selectedActions]);

    const headerActions = (
        <div className="icp__header-mark" aria-hidden="true">
            <i className="fa-light fa-circle-check"></i>
        </div>
    );

    const renderStepIndicator = () => (
        <div className="icp__steps" aria-label="Completion steps">
            {STEPS.map((stepItem, index) => {
                const isActive = index === step;
                const isComplete = index < step;

                return (
                    <React.Fragment key={stepItem.key}>
                        {index > 0 && <div className={`icp__step-line ${isComplete ? 'is-complete' : ''}`} />}
                        <div className={`icp__step ${isActive ? 'is-active' : ''} ${isComplete ? 'is-complete' : ''}`}>
                            <div className="icp__step-badge">
                                {isComplete ? <i className="fa-light fa-check"></i> : index + 1}
                            </div>
                            <span className="icp__step-label">{stepItem.label}</span>
                        </div>
                    </React.Fragment>
                );
            })}
        </div>
    );

    const renderSelectStep = () => {
        if (templateActions.length === 0 && !loadingActions) {
            return (
                <div className="icp__empty-state">
                    <i className="fa-light fa-clipboard-list"></i>
                    <p className="icp__empty-title">No template actions configured.</p>
                    <p className="icp__empty-text">You can still add a custom action below and complete the issue.</p>
                </div>
            );
        }

        return (
            <div className="icp__section">
                <div className="icp__section-header">
                    <div>
                        <h4 className="icp__section-title">Select actions performed</h4>
                        <p className="icp__section-text">Choose each action completed for this issue. Multiple actions can be recorded.</p>
                    </div>
                    <div className="icp__metric-pill">
                        <span className="icp__metric-value">{selectedActions.length}</span>
                        <span className="icp__metric-label">selected</span>
                    </div>
                </div>

                <div className="icp__action-list">
                    {templateActions.map((action) => {
                        const isSelected = selectedIds.has(action.id);
                        const style = TYPE_STYLES[action.actionType] || TYPE_STYLES.General;

                        return (
                            <button
                                key={action.id}
                                type="button"
                                className={`icp__action-card ${isSelected ? 'is-selected' : ''}`}
                                onClick={() => toggleAction(action.id)}
                                disabled={isProcessing}
                            >
                                <div className={`icp__action-check ${isSelected ? 'is-selected' : ''}`}>
                                    {isSelected && <i className="fa-light fa-check"></i>}
                                </div>
                                <div className={`icp__action-icon ${style.bg} ${style.text}`}>
                                    <i className={style.icon}></i>
                                </div>
                                <div className="icp__action-copy">
                                    <span className="icp__action-name">{action.name}</span>
                                    {action.description && <p className="icp__action-description">{action.description}</p>}
                                </div>
                                <span className={`icp__action-type ${style.bg} ${style.text}`}>
                                    {TYPE_LABELS[action.actionType] || 'General'}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="icp__custom-card">
                    {!showCustom ? (
                        <button type="button" className="icp__inline-link" onClick={() => setShowCustom(true)}>
                            <i className="fa-light fa-plus"></i>
                            <span>Add a custom action</span>
                        </button>
                    ) : (
                        <div className="icp__custom-row">
                            <input
                                type="text"
                                className="icp__input"
                                value={customActionName}
                                onChange={(event) => setCustomActionName(event.target.value)}
                                placeholder="Custom action name..."
                                disabled={isProcessing}
                            />
                            <button
                                type="button"
                                className="icp__icon-button"
                                onClick={() => {
                                    setShowCustom(false);
                                    setCustomActionName('');
                                }}
                                disabled={isProcessing}
                                aria-label="Remove custom action"
                            >
                                <i className="fa-light fa-xmark"></i>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderDetailsStep = () => {
        if (!currentAction) {
            return null;
        }

        const details = getDetails(currentAction.id);
        const style = TYPE_STYLES[currentAction.actionType] || TYPE_STYLES.General;
        const total = selectedActions.length;
        const showDevice = currentAction.requiresDeviceDetails || currentAction.actionType === 'DeviceChange';
        const showCamera = currentAction.requiresCameraDetails || currentAction.actionType === 'CameraInstall';
        const showSourceVehicle = currentAction.requiresSourceVehicle;

        return (
            <div className="icp__section">
                <div className="icp__section-header">
                    <div>
                        <h4 className="icp__section-title">Capture action details</h4>
                        <p className="icp__section-text">Record the root cause, notes, and equipment details for each selected action.</p>
                    </div>
                    <div className="icp__metric-pill">
                        <span className="icp__metric-value">{currentDetailIdx + 1}</span>
                        <span className="icp__metric-label">of {total}</span>
                    </div>
                </div>

                {total > 1 && (
                    <div className="icp__action-nav-shell">
                        <button
                            type="button"
                            disabled={currentDetailIdx === 0}
                            className="icp__nav-button"
                            onClick={() => setCurrentDetailIdx((prev) => prev - 1)}
                        >
                            <i className="fa-light fa-chevron-left"></i>
                            <span>Previous</span>
                        </button>

                        <div className="icp__action-nav-list" role="tablist" aria-label="Selected actions">
                            {selectedActions.map((action, index) => (
                                <button
                                    key={action.id}
                                    type="button"
                                    className={`icp__action-nav-item ${index === currentDetailIdx ? 'is-active' : ''}`}
                                    onClick={() => setCurrentDetailIdx(index)}
                                >
                                    <span className="icp__action-nav-index">{index + 1}</span>
                                    <span className="icp__action-nav-name">{action.name}</span>
                                </button>
                            ))}
                        </div>

                        <button
                            type="button"
                            disabled={currentDetailIdx === total - 1}
                            className="icp__nav-button"
                            onClick={() => setCurrentDetailIdx((prev) => prev + 1)}
                        >
                            <span>Next</span>
                            <i className="fa-light fa-chevron-right"></i>
                        </button>
                    </div>
                )}

                <div className="icp__detail-card">
                    <div className={`icp__detail-hero ${style.bg}`}>
                        <div className={`icp__detail-icon ${style.text}`}>
                            <i className={style.icon}></i>
                        </div>
                        <div className="icp__detail-heading">
                            <span className="icp__detail-title">{currentAction.name}</span>
                            <div className="icp__detail-meta-row">
                                <span className={`icp__detail-badge ${style.bg} ${style.text}`}>{TYPE_LABELS[currentAction.actionType]}</span>
                                {total > 1 && <span className="icp__detail-progress">Action {currentDetailIdx + 1} of {total}</span>}
                            </div>
                        </div>
                    </div>

                    <div className="icp__form-grid">
                        <div className="icp__field icp__field--full">
                            <label className="icp__label">Root cause</label>
                            <textarea
                                className="icp__textarea"
                                value={details.rootCause}
                                onChange={handleNativeInputChange(currentAction.id, 'rootCause')}
                                placeholder="What caused this issue?"
                                disabled={isProcessing}
                                rows={3}
                                maxLength={1000}
                            />
                        </div>

                        {showDevice && (
                            <div className="icp__group icp__group--device icp__field--full">
                                <div className="icp__group-title">
                                    <i className="fa-light fa-microchip"></i>
                                    <span>Device details</span>
                                </div>
                                <div className="icp__form-grid">
                                    <div className="icp__field">
                                        <label className="icp__label">Old device type</label>
                                        <input
                                            type="text"
                                            className="icp__input"
                                            value={details.oldDeviceType}
                                            onChange={handleNativeInputChange(currentAction.id, 'oldDeviceType')}
                                            placeholder="Old device type"
                                            disabled={isProcessing}
                                        />
                                    </div>
                                    <div className="icp__field">
                                        <label className="icp__label">Old IMEI</label>
                                        <input
                                            type="text"
                                            className="icp__input"
                                            value={details.oldDeviceImei}
                                            onChange={handleNativeInputChange(currentAction.id, 'oldDeviceImei')}
                                            placeholder="Old IMEI"
                                            disabled={isProcessing}
                                        />
                                    </div>
                                    <div className="icp__field">
                                        <label className="icp__label">New device type</label>
                                        <input
                                            type="text"
                                            className="icp__input"
                                            value={details.newDeviceType}
                                            onChange={handleNativeInputChange(currentAction.id, 'newDeviceType')}
                                            placeholder="New device type"
                                            disabled={isProcessing}
                                        />
                                    </div>
                                    <div className="icp__field">
                                        <label className="icp__label">New IMEI</label>
                                        <input
                                            type="text"
                                            className="icp__input"
                                            value={details.newDeviceImei}
                                            onChange={handleNativeInputChange(currentAction.id, 'newDeviceImei')}
                                            placeholder="New IMEI"
                                            disabled={isProcessing}
                                        />
                                    </div>
                                    <div className="icp__field">
                                        <label className="icp__label">Device phone number</label>
                                        <input
                                            type="text"
                                            className="icp__input"
                                            value={details.devicePhoneNumber}
                                            onChange={handleNativeInputChange(currentAction.id, 'devicePhoneNumber')}
                                            placeholder="Device phone number"
                                            disabled={isProcessing}
                                        />
                                    </div>
                                    {showSourceVehicle && vehicleDataSource.length > 0 && (
                                        <div className="icp__field">
                                            <label className="icp__label">Source vehicle</label>
                                            <select
                                                className="icp__select"
                                                value={details.sourceVehicleId ?? ''}
                                                onChange={(event) => updateDetail(
                                                    currentAction.id,
                                                    'sourceVehicleId',
                                                    event.target.value ? Number(event.target.value) : null
                                                )}
                                                disabled={isProcessing}
                                            >
                                                <option value="">Select source vehicle</option>
                                                {vehicleDataSource.map((vehicle) => (
                                                    <option key={vehicle.id} value={vehicle.id}>{vehicle.displayName}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {showCamera && (
                            <div className="icp__group icp__group--camera icp__field--full">
                                <div className="icp__group-title">
                                    <i className="fa-light fa-camera"></i>
                                    <span>Camera details</span>
                                </div>
                                <div className="icp__form-grid">
                                    <div className="icp__field">
                                        <label className="icp__label">Camera IMEI</label>
                                        <input
                                            type="text"
                                            className="icp__input"
                                            value={details.cameraImei}
                                            onChange={handleNativeInputChange(currentAction.id, 'cameraImei')}
                                            placeholder="Camera IMEI"
                                            disabled={isProcessing}
                                        />
                                    </div>
                                    <div className="icp__field">
                                        <label className="icp__label">Camera position</label>
                                        <select
                                            className="icp__select"
                                            value={details.cameraPosition}
                                            onChange={handleNativeInputChange(currentAction.id, 'cameraPosition')}
                                            disabled={isProcessing}
                                        >
                                            <option value="">Select camera position</option>
                                            {CAMERA_POSITIONS.map((position) => (
                                                <option key={position.value} value={position.value}>{position.text}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="icp__field icp__field--full">
                                        <label className="icp__label">Camera SIM number</label>
                                        <input
                                            type="text"
                                            className="icp__input"
                                            value={details.cameraSimNumber}
                                            onChange={handleNativeInputChange(currentAction.id, 'cameraSimNumber')}
                                            placeholder="Camera SIM number"
                                            disabled={isProcessing}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="icp__field icp__field--full">
                            <label className="icp__label">Action notes</label>
                            <textarea
                                className="icp__textarea"
                                value={details.notes}
                                onChange={handleNativeInputChange(currentAction.id, 'notes')}
                                placeholder="Additional notes for this action..."
                                disabled={isProcessing}
                                rows={4}
                                maxLength={2000}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderReviewStep = () => (
        <div className="icp__section">
            <div className="icp__section-header">
                <div>
                    <h4 className="icp__section-title">Review and submit</h4>
                    <p className="icp__section-text">Validate the action summary and add any final completion notes before submission.</p>
                </div>
                <div className="icp__metric-pill">
                    <span className="icp__metric-value">{selectedActions.length}</span>
                    <span className="icp__metric-label">actions</span>
                </div>
            </div>

            <div className="icp__review-list">
                {selectedActions.map((action, index) => {
                    const details = getDetails(action.id);
                    const style = TYPE_STYLES[action.actionType] || TYPE_STYLES.General;
                    const hasAnyDetail = details.rootCause || details.notes || details.oldDeviceImei || details.newDeviceImei || details.cameraImei;

                    return (
                        <div key={action.id} className="icp__review-card">
                            <div className={`icp__review-icon ${style.bg} ${style.text}`}>
                                <i className={style.icon}></i>
                            </div>
                            <div className="icp__review-copy">
                                <div className="icp__review-header-row">
                                    <span className="icp__review-title">{action.name}</span>
                                    <span className="icp__review-status">
                                        <i className="fa-light fa-circle-check"></i>
                                        <span>Ready</span>
                                    </span>
                                </div>
                                {details.rootCause && <p className="icp__review-line"><strong>Root cause:</strong> {details.rootCause}</p>}
                                {(details.oldDeviceImei || details.newDeviceImei) && (
                                    <p className="icp__review-line">
                                        <strong>Device:</strong>
                                        {' '}
                                        {details.oldDeviceImei && `Old ${details.oldDeviceImei}`}
                                        {details.oldDeviceImei && details.newDeviceImei && ' → '}
                                        {details.newDeviceImei && `New ${details.newDeviceImei}`}
                                    </p>
                                )}
                                {details.cameraImei && (
                                    <p className="icp__review-line"><strong>Camera:</strong> {details.cameraImei}{details.cameraPosition && ` (${details.cameraPosition})`}</p>
                                )}
                                {details.notes && <p className="icp__review-line"><strong>Notes:</strong> {details.notes}</p>}
                                {!hasAnyDetail && <p className="icp__review-empty">No additional details were captured for this action.</p>}
                            </div>
                            <button
                                type="button"
                                className="icp__inline-link icp__inline-link--compact"
                                onClick={() => {
                                    setCurrentDetailIdx(index);
                                    setStep(1);
                                }}
                            >
                                <i className="fa-light fa-pen"></i>
                                <span>Edit</span>
                            </button>
                        </div>
                    );
                })}
            </div>

            <div className="icp__field icp__field--full">
                <label className="icp__label">General completion notes</label>
                <textarea
                    className="icp__textarea"
                    value={generalNotes}
                    onChange={(event) => setGeneralNotes(event.target.value)}
                    placeholder="Any additional completion notes..."
                    disabled={isProcessing}
                    rows={4}
                />
            </div>
        </div>
    );

    const renderFooter = () => (
        <div className="icp__footer">
            <div>
                {step > 0 && (
                    <button type="button" className="icp__button icp__button--ghost" onClick={goBack} disabled={isProcessing}>
                        <i className="fa-light fa-arrow-left"></i>
                        <span>Back</span>
                    </button>
                )}
            </div>
            <div className="icp__footer-actions">
                <button type="button" className="icp__button icp__button--ghost" onClick={handleCancel} disabled={isProcessing}>
                    <i className="fa-light fa-xmark"></i>
                    <span>Cancel</span>
                </button>

                {step === 0 && (
                    <button type="button" className="icp__button icp__button--primary" onClick={goNext} disabled={!canProceedFromSelect || isProcessing}>
                        <span>Next</span>
                        <i className="fa-light fa-arrow-right"></i>
                    </button>
                )}

                {step === 1 && (
                    <button type="button" className="icp__button icp__button--primary" onClick={goNext} disabled={isProcessing}>
                        <span>Review</span>
                        <i className="fa-light fa-eye"></i>
                    </button>
                )}

                {step === 2 && (
                    <button type="button" className="icp__button icp__button--success" onClick={handleSubmit} disabled={isProcessing}>
                        {isProcessing ? (
                            <>
                                <LoadIndicator visible height={16} width={16} />
                                <span>Completing...</span>
                            </>
                        ) : (
                            <>
                                <i className="fa-light fa-circle-check"></i>
                                <span>Complete issue</span>
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    );

    const renderContent = () => {
        if (loadingActions) {
            return (
                <div className="icp__loading-state">
                    <LoadIndicator visible height={28} width={28} />
                    <span>Loading completion actions...</span>
                </div>
            );
        }

        return (
            <div className="icp">
                <div className="icp__hero">
                    <div className="icp__hero-copy">
                        <span className="icp__eyebrow">Issue resolution workflow</span>
                        <h3 className="icp__hero-title">Capture the work completed for issue #{issueId}</h3>
                        <p className="icp__hero-text">Use the structured workflow below to document each action before completing the issue.</p>
                    </div>
                    <div className="icp__hero-summary">
                        <div className="icp__hero-stat">
                            <span className="icp__hero-stat-value">{templateActions.length}</span>
                            <span className="icp__hero-stat-label">template actions</span>
                        </div>
                        <div className="icp__hero-stat">
                            <span className="icp__hero-stat-value">{selectedActions.length}</span>
                            <span className="icp__hero-stat-label">selected</span>
                        </div>
                    </div>
                </div>

                {renderStepIndicator()}

                <div className="icp__content">
                    {step === 0 && renderSelectStep()}
                    {step === 1 && renderDetailsStep()}
                    {step === 2 && renderReviewStep()}
                </div>

                {renderFooter()}
            </div>
        );
    };

    return (
        <SlidePanel
            open={visible}
            onClose={!isProcessing ? handleCancel : undefined}
            title={PANEL_TITLE}
            width={1000}
            headerActions={headerActions}
            panelClassName="issue-completion-panel"
        >
            {renderContent()}
        </SlidePanel>
    );
};

export default IssueCompletionPopup;
