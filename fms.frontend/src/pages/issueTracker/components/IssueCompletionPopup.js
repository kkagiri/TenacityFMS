/**
 * File: IssueCompletionPopup.js
 * Purpose: Workflow-driven issue completion side panel with staged action selection,
 *          inline detail capture, and review summary.
 * Dependencies: React, LoadIndicator, SlidePanel, issueTrackerV2Service
 * Last Modified: 2026-04-23
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import LoadIndicator from 'devextreme-react/load-indicator';
import SlidePanel from '../../../components/ui/SlidePanel';
import issueTrackerV2Service from '../../../services/issueTrackerV2Service';
import IssueCompletionHelpPanel from './IssueCompletionHelpPanel';
import ActionAttachmentsDropzone from './ActionAttachmentsDropzone';
import './IssueCompletionPopup.scss';

const CAMERA_POSITIONS = [
    { value: 'Front', text: 'Front' },
    { value: 'Rear', text: 'Rear' },
    { value: 'Interior', text: 'Interior' },
    { value: 'Left', text: 'Left' },
    { value: 'Right', text: 'Right' },
    { value: 'Dashboard', text: 'Dashboard' }
];

const TYPE_META = {
    General: { tint: '#deecf9', color: '#0078d4', icon: 'fa-light fa-wrench', label: 'General' },
    DeviceChange: { tint: '#fff4ce', color: '#ca5010', icon: 'fa-light fa-microchip', label: 'Device Change' },
    CameraInstall: { tint: '#dff6dd', color: '#107c10', icon: 'fa-light fa-camera', label: 'Camera Install' },
    SensorReplacement: { tint: '#f3e8ff', color: '#8764b8', icon: 'fa-light fa-plug-circle-bolt', label: 'Sensor Replacement' },
    SensorCalibration: { tint: '#fff4ce', color: '#986f0b', icon: 'fa-light fa-ruler-combined', label: 'Sensor Calibration' }
};

const SENSOR_TYPES = [
    { value: 'Ligo', text: 'Ligo' },
    { value: 'ES2', text: 'ES2' },
    { value: 'Analog', text: 'Analog' },
    { value: 'Capacitive', text: 'Capacitive' },
    { value: 'DUT-E', text: 'DUT-E' },
    { value: 'Omnicomm', text: 'Omnicomm' },
    { value: 'Other', text: 'Other' }
];

const SENSOR_REASONS = [
    { value: 'Faulty', text: 'Faulty' },
    { value: 'Upgrade', text: 'Upgrade' },
    { value: 'Missing', text: 'Missing' },
    { value: 'Other', text: 'Other' }
];

const CALIBRATION_RESULTS = [
    { value: 'Pass', text: 'Pass' },
    { value: 'Fail', text: 'Fail' },
    { value: 'Partial', text: 'Partial' }
];

const PANEL_TITLE = 'Mark issue as complete';

function normalizeText(value) {
    return typeof value === 'string' ? value.trim() : '';
}

function validateSelectedAction(action, details) {
    const errors = {};
    const actionType = action.actionType || 'General';

    if (!normalizeText(details.rootCause)) {
        errors.rootCause = 'Root cause is required.';
    }

    if (actionType === 'DeviceChange') {
        if (!normalizeText(details.newDeviceType)) {
            errors.newDeviceType = 'New device type is required.';
        }

        if (!normalizeText(details.newDeviceImei)) {
            errors.newDeviceImei = 'New IMEI is required.';
        }
    }

    if (actionType === 'CameraInstall') {
        if (!normalizeText(details.cameraImei)) {
            errors.cameraImei = 'Camera IMEI is required.';
        }

        if (!normalizeText(details.cameraPosition)) {
            errors.cameraPosition = 'Camera position is required.';
        }
    }

    if (actionType === 'SensorReplacement') {
        if (!normalizeText(details.newSensorType)) {
            errors.newSensorType = 'New sensor type is required.';
        }

        if (!normalizeText(details.sensorReason)) {
            errors.sensorReason = 'Reason is required.';
        }
    }

    if (actionType === 'SensorCalibration') {
        if (!normalizeText(details.calibrationResult)) {
            errors.calibrationResult = 'Calibration result is required.';
        }
    }

    return errors;
}

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
        cameraSimNumber: '',
        oldSensorType: '',
        newSensorType: '',
        sensorReason: '',
        calibrationResult: ''
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
    const [workflow, setWorkflow] = useState(null);
    const [loadingWorkflow, setLoadingWorkflow] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [showCustom, setShowCustom] = useState(false);
    const [customActionName, setCustomActionName] = useState('');
    const [detailsMap, setDetailsMap] = useState({});

    const isProcessing = externalProcessing || isSubmitting;

    const resetForm = useCallback(() => {
        setSelectedIds(new Set());
        setShowCustom(false);
        setCustomActionName('');
        setDetailsMap({});
    }, []);

    const loadWorkflow = useCallback(async () => {
        if (!issueTemplateId) {
            setWorkflow(null);
            return;
        }

        try {
            setLoadingWorkflow(true);
            const nextWorkflow = await issueTrackerV2Service.getWorkflowForCompletion(issueTemplateId);
            setWorkflow(nextWorkflow || null);
        } catch (error) {
            console.error('Error loading completion workflow:', error);
            setWorkflow(null);
        } finally {
            setLoadingWorkflow(false);
        }
    }, [issueTemplateId]);

    useEffect(() => {
        if (!visible) {
            return;
        }

        resetForm();
        loadWorkflow();
    }, [visible, resetForm, loadWorkflow]);

    const workflowStages = useMemo(() => (workflow?.stages || []).map((stage, stageIndex) => ({
        key: stage.id ?? `stage-${stageIndex}`,
        id: stage.id ?? null,
        name: stage.name || `Stage ${stageIndex + 1}`,
        color: stage.color || '#0078d4',
        actions: (stage.actions || []).map((action, actionIndex) => ({
            ...action,
            key: action.id ?? `${stage.id ?? stageIndex}-${actionIndex}`,
            stageId: stage.id ?? null,
            stageName: stage.name || `Stage ${stageIndex + 1}`,
            stageColor: stage.color || '#0078d4'
        }))
    })), [workflow]);

    const templateActions = useMemo(() => workflowStages.flatMap((stage) => stage.actions), [workflowStages]);

    const actionLookup = useMemo(() => new Map(templateActions.map((action) => [action.id, action])), [templateActions]);

    const selectedActions = useMemo(() => {
        const actions = Array.from(selectedIds)
            .map((id) => actionLookup.get(id))
            .filter(Boolean);

        if (showCustom && customActionName.trim()) {
            actions.push({
                id: '__custom__',
                key: '__custom__',
                name: customActionName.trim(),
                actionType: 'General',
                stageName: 'Custom',
                stageColor: '#605e5c',
                requiresDeviceDetails: false,
                requiresSourceVehicle: false,
                requiresCameraDetails: false,
                description: null
            });
        }

        return actions;
    }, [actionLookup, customActionName, selectedIds, showCustom]);

    const getDetails = useCallback((actionId) => detailsMap[actionId] || createEmptyDetails(), [detailsMap]);

    const validationByAction = useMemo(() => Object.fromEntries(
        selectedActions.map((action) => [action.id, validateSelectedAction(action, getDetails(action.id))])
    ), [getDetails, selectedActions]);

    const invalidSelections = useMemo(() => selectedActions
        .map((action) => ({
            action,
            errors: validationByAction[action.id] || {}
        }))
        .filter(({ errors }) => Object.keys(errors).length > 0), [selectedActions, validationByAction]);

    const canSubmit = selectedActions.length > 0 && invalidSelections.length === 0;

    const vehicleDataSource = useMemo(() => vehicles.map((vehicle) => ({
        id: vehicle.vehicleId ?? vehicle.id,
        displayName: vehicle.vehicleCode || vehicle.numberPlate || `Vehicle #${vehicle.vehicleId ?? vehicle.id}`
    })), [vehicles]);

    const showWidePanel = useMemo(() => selectedActions.some((action) => (
        action.actionType === 'DeviceChange'
        || action.actionType === 'CameraInstall'
        || action.actionType === 'SensorReplacement'
        || action.actionType === 'SensorCalibration'
    )), [selectedActions]);

    const updateDetail = useCallback((actionId, field, value) => {
        setDetailsMap((prev) => ({
            ...prev,
            [actionId]: {
                ...(prev[actionId] || createEmptyDetails()),
                [field]: value
            }
        }));
    }, []);

    const handleTextInput = useCallback((actionId, field) => (event) => {
        updateDetail(actionId, field, event.target.value);
    }, [updateDetail]);

    const copyFromPrevious = useCallback((actionId, previousActionId) => {
        setDetailsMap((prev) => {
            const source = prev[previousActionId];
            if (!source) return prev;
            return {
                ...prev,
                [actionId]: {
                    ...(prev[actionId] || createEmptyDetails()),
                    rootCause: source.rootCause || '',
                    notes: source.notes || ''
                }
            };
        });
    }, []);

    const resolveAttachmentCategory = useCallback((actionType) => {
        if (actionType === 'SensorCalibration') return 'Calibration';
        if (actionType === 'DeviceChange' || actionType === 'CameraInstall' || actionType === 'SensorReplacement') {
            return 'Installation';
        }
        return 'General';
    }, []);

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

    const handleCancel = useCallback(() => {
        if (!isProcessing && onHide) {
            onHide();
        }
    }, [isProcessing, onHide]);

    const handleSubmit = useCallback(async () => {
        if (isProcessing || !canSubmit) {
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
                        oldSensorType: details.oldSensorType || null,
                        newSensorType: details.newSensorType || null,
                        sensorReason: details.sensorReason || null,
                        calibrationResult: details.calibrationResult || null,
                        additionalNotes: null
                    };
                })
            };

            await issueTrackerV2Service.completeWithActions(issueId, completionData);
            onComplete?.();
        } catch (error) {
            console.error('Error completing issue:', error);
        } finally {
            setIsSubmitting(false);
        }
    }, [canSubmit, getDetails, isProcessing, issueId, onComplete, selectedActions]);

    const getFieldError = useCallback((actionId, field) => validationByAction[actionId]?.[field] || null, [validationByAction]);

    const getFieldId = useCallback((actionId, field) => `issue-completion-${actionId}-${field}`, []);

    const getInputClassName = useCallback((baseClassName, actionId, field) => {
        const error = getFieldError(actionId, field);
        return error ? `${baseClassName} is-invalid` : baseClassName;
    }, [getFieldError]);

    const renderFieldError = useCallback((actionId, field) => {
        const error = getFieldError(actionId, field);
        return error ? <p className="issue-completion-flow__field-error">{error}</p> : null;
    }, [getFieldError]);

    const [helpOpen, setHelpOpen] = useState(false);

    const headerActions = (
        <div className="issue-completion-flow__header-tools">
            <button
                type="button"
                className="issue-completion-flow__header-help"
                onClick={() => setHelpOpen(true)}
                aria-label="How to use this panel"
                title="How to use this panel"
            >
                <i className="fa-light fa-circle-question"></i>
                <span>Help</span>
            </button>
            <div className="issue-completion-flow__header-mark" aria-hidden="true">
                <i className="fa-light fa-circle-check"></i>
            </div>
        </div>
    );

    const renderActionCard = (action) => {
        const isSelected = selectedIds.has(action.id);
        const meta = TYPE_META[action.actionType] || TYPE_META.General;

        return (
            <label
                key={action.key}
                className={`issue-completion-flow__action-card${isSelected ? ' is-selected' : ''}${isProcessing ? ' is-disabled' : ''}`}
            >
                <input
                    type="checkbox"
                    className="issue-completion-flow__action-checkbox"
                    checked={isSelected}
                    onChange={() => toggleAction(action.id)}
                    disabled={isProcessing}
                    aria-label={action.name}
                />
                <div className="issue-completion-flow__action-icon" style={{ backgroundColor: meta.tint, color: meta.color }}>
                    <i className={meta.icon}></i>
                </div>
                <div className="issue-completion-flow__action-copy">
                    <span className="issue-completion-flow__action-name">{action.name}</span>
                    {action.description && <p className="issue-completion-flow__action-description">{action.description}</p>}
                </div>
                <span className="issue-completion-flow__action-type" style={{ backgroundColor: meta.tint, color: meta.color }}>
                    {meta.label}
                </span>
            </label>
        );
    };

    const renderSelectionSection = () => {
        if (!workflowStages.length && !loadingWorkflow) {
            return (
                <div className="issue-completion-flow__empty-state">
                    <i className="fa-light fa-clipboard-list"></i>
                    <p className="issue-completion-flow__empty-title">No workflow actions configured.</p>
                    <p className="issue-completion-flow__empty-text">You can still add a custom action below and complete the issue.</p>
                </div>
            );
        }

        return (
            <div className="issue-completion-flow__section">
                <div className="issue-completion-flow__section-header">
                    <div>
                        <h4 className="issue-completion-flow__section-title">Select actions performed</h4>
                        <p className="issue-completion-flow__section-text">Choose the actions completed for this issue. The workflow is grouped by stage for faster scanning.</p>
                    </div>
                    <div className="issue-completion-flow__metric-pill">
                        <span className="issue-completion-flow__metric-value">{selectedActions.length}</span>
                        <span className="issue-completion-flow__metric-label">selected</span>
                    </div>
                </div>

                <div className="issue-completion-flow__stage-list">
                    {workflowStages.map((stage) => (
                        <section key={stage.key} className="issue-completion-flow__stage-group">
                            <div className="issue-completion-flow__stage-header">
                                <span className="issue-completion-flow__stage-dot" style={{ backgroundColor: stage.color }}></span>
                                <div>
                                    <h5 className="issue-completion-flow__stage-title">{stage.name}</h5>
                                    <p className="issue-completion-flow__stage-meta">{stage.actions.length} configured action{stage.actions.length === 1 ? '' : 's'}</p>
                                </div>
                            </div>
                            <div className="issue-completion-flow__action-list">
                                {stage.actions.map(renderActionCard)}
                            </div>
                        </section>
                    ))}
                </div>

                <div className="issue-completion-flow__custom-card">
                    {!showCustom ? (
                        <button type="button" className="issue-completion-flow__inline-link" onClick={() => setShowCustom(true)}>
                            <i className="fa-light fa-plus"></i>
                            <span>Add a custom action</span>
                        </button>
                    ) : (
                        <div className="issue-completion-flow__custom-row">
                            <input
                                type="text"
                                className="issue-completion-flow__input"
                                value={customActionName}
                                onChange={(event) => setCustomActionName(event.target.value)}
                                placeholder="Custom action name..."
                                disabled={isProcessing}
                            />
                            <button
                                type="button"
                                className="issue-completion-flow__icon-button"
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

    const renderDetailsSection = () => {
        if (selectedActions.length === 0) {
            return null;
        }

        return (
            <div className="issue-completion-flow__section">
                <div className="issue-completion-flow__section-header">
                    <div>
                        <h4 className="issue-completion-flow__section-title">Capture action details</h4>
                        <p className="issue-completion-flow__section-text">Record the root cause, notes, and device or camera details for each selected action.</p>
                    </div>
                    <div className="issue-completion-flow__metric-pill">
                        <span className="issue-completion-flow__metric-value">{selectedActions.length}</span>
                        <span className="issue-completion-flow__metric-label">selected</span>
                    </div>
                </div>

                <div className="issue-completion-flow__detail-list">
                    {selectedActions.map((action, index) => {
                        const details = getDetails(action.id);
                        const meta = TYPE_META[action.actionType] || TYPE_META.General;
                        const showDevice = action.requiresDeviceDetails || action.actionType === 'DeviceChange';
                        const showCamera = action.requiresCameraDetails || action.actionType === 'CameraInstall';
                        const showSourceVehicle = action.requiresSourceVehicle || action.actionType === 'DeviceChange';
                        const showSensor = action.requiresSensorDetails || action.actionType === 'SensorReplacement';
                        const showCalibration = action.requiresCalibrationResult || action.actionType === 'SensorCalibration';
                        const validationErrors = validationByAction[action.id] || {};
                        const hasErrors = Object.keys(validationErrors).length > 0;

                        return (
                            <div key={action.key || action.id} className="issue-completion-flow__detail-card">
                                <div className="issue-completion-flow__detail-hero">
                                    <div className="issue-completion-flow__detail-icon" style={{ backgroundColor: meta.tint, color: meta.color }}>
                                        <i className={meta.icon}></i>
                                    </div>
                                    <div className="issue-completion-flow__detail-heading">
                                        <span className="issue-completion-flow__detail-title">{action.name}</span>
                                        <div className="issue-completion-flow__detail-meta-row">
                                            <span className="issue-completion-flow__detail-badge" style={{ backgroundColor: meta.tint, color: meta.color }}>{meta.label}</span>
                                            <span className="issue-completion-flow__detail-badge issue-completion-flow__detail-badge--stage">{action.stageName}</span>
                                            {selectedActions.length > 1 && <span className="issue-completion-flow__detail-progress">Action {index + 1} of {selectedActions.length}</span>}
                                            {hasErrors && <span className="issue-completion-flow__detail-badge issue-completion-flow__detail-badge--warning">Needs attention</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="issue-completion-flow__form-grid">
                                    {index > 0 && (
                                        <div className="issue-completion-flow__field issue-completion-flow__field--full issue-completion-flow__copy-row">
                                            <button
                                                type="button"
                                                className="m365-btn m365-btn--text issue-completion-flow__copy-btn"
                                                onClick={() => copyFromPrevious(action.id, selectedActions[index - 1].id)}
                                                disabled={isProcessing}
                                            >
                                                <i className="fa-light fa-clone"></i>
                                                <span>Copy root cause &amp; notes from previous action</span>
                                            </button>
                                        </div>
                                    )}
                                    <div className="issue-completion-flow__field issue-completion-flow__field--full">
                                        <label className="issue-completion-flow__label" htmlFor={getFieldId(action.id, 'rootCause')}>Root cause <span className="issue-completion-flow__required-mark">*</span></label>
                                        <textarea
                                            id={getFieldId(action.id, 'rootCause')}
                                            className={getInputClassName('issue-completion-flow__textarea', action.id, 'rootCause')}
                                            value={details.rootCause}
                                            onChange={handleTextInput(action.id, 'rootCause')}
                                            placeholder="What caused this issue?"
                                            disabled={isProcessing}
                                            rows={3}
                                            maxLength={1000}
                                        />
                                        {renderFieldError(action.id, 'rootCause')}
                                    </div>

                                    {showDevice && (
                                        <div className="issue-completion-flow__group issue-completion-flow__field--full">
                                            <div className="issue-completion-flow__group-title">
                                                <i className="fa-light fa-microchip"></i>
                                                <span>Device details</span>
                                            </div>
                                            <div className="issue-completion-flow__form-grid">
                                                <div className="issue-completion-flow__field">
                                                    <label className="issue-completion-flow__label" htmlFor={getFieldId(action.id, 'oldDeviceType')}>Old device type</label>
                                                    <input id={getFieldId(action.id, 'oldDeviceType')} type="text" className="issue-completion-flow__input" value={details.oldDeviceType} onChange={handleTextInput(action.id, 'oldDeviceType')} disabled={isProcessing} />
                                                </div>
                                                <div className="issue-completion-flow__field">
                                                    <label className="issue-completion-flow__label" htmlFor={getFieldId(action.id, 'oldDeviceImei')}>Old IMEI</label>
                                                    <input id={getFieldId(action.id, 'oldDeviceImei')} type="text" className="issue-completion-flow__input" value={details.oldDeviceImei} onChange={handleTextInput(action.id, 'oldDeviceImei')} disabled={isProcessing} />
                                                </div>
                                                <div className="issue-completion-flow__field">
                                                    <label className="issue-completion-flow__label" htmlFor={getFieldId(action.id, 'newDeviceType')}>New device type <span className="issue-completion-flow__required-mark">*</span></label>
                                                    <input id={getFieldId(action.id, 'newDeviceType')} type="text" className={getInputClassName('issue-completion-flow__input', action.id, 'newDeviceType')} value={details.newDeviceType} onChange={handleTextInput(action.id, 'newDeviceType')} disabled={isProcessing} />
                                                    {renderFieldError(action.id, 'newDeviceType')}
                                                </div>
                                                <div className="issue-completion-flow__field">
                                                    <label className="issue-completion-flow__label" htmlFor={getFieldId(action.id, 'newDeviceImei')}>New IMEI <span className="issue-completion-flow__required-mark">*</span></label>
                                                    <input id={getFieldId(action.id, 'newDeviceImei')} type="text" className={getInputClassName('issue-completion-flow__input', action.id, 'newDeviceImei')} value={details.newDeviceImei} onChange={handleTextInput(action.id, 'newDeviceImei')} disabled={isProcessing} />
                                                    {renderFieldError(action.id, 'newDeviceImei')}
                                                </div>
                                                <div className="issue-completion-flow__field">
                                                    <label className="issue-completion-flow__label" htmlFor={getFieldId(action.id, 'devicePhoneNumber')}>Device phone number</label>
                                                    <input id={getFieldId(action.id, 'devicePhoneNumber')} type="text" className="issue-completion-flow__input" value={details.devicePhoneNumber} onChange={handleTextInput(action.id, 'devicePhoneNumber')} disabled={isProcessing} />
                                                </div>
                                                {showSourceVehicle && vehicleDataSource.length > 0 && (
                                                    <div className="issue-completion-flow__field">
                                                        <label className="issue-completion-flow__label" htmlFor={getFieldId(action.id, 'sourceVehicleId')}>Source vehicle</label>
                                                        <select
                                                            id={getFieldId(action.id, 'sourceVehicleId')}
                                                            className="issue-completion-flow__select"
                                                            value={details.sourceVehicleId ?? ''}
                                                            onChange={(event) => updateDetail(action.id, 'sourceVehicleId', event.target.value ? Number(event.target.value) : null)}
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
                                        <div className="issue-completion-flow__group issue-completion-flow__field--full">
                                            <div className="issue-completion-flow__group-title">
                                                <i className="fa-light fa-camera"></i>
                                                <span>Camera details</span>
                                            </div>
                                            <div className="issue-completion-flow__form-grid">
                                                <div className="issue-completion-flow__field">
                                                    <label className="issue-completion-flow__label" htmlFor={getFieldId(action.id, 'cameraImei')}>Camera IMEI <span className="issue-completion-flow__required-mark">*</span></label>
                                                    <input id={getFieldId(action.id, 'cameraImei')} type="text" className={getInputClassName('issue-completion-flow__input', action.id, 'cameraImei')} value={details.cameraImei} onChange={handleTextInput(action.id, 'cameraImei')} disabled={isProcessing} />
                                                    {renderFieldError(action.id, 'cameraImei')}
                                                </div>
                                                <div className="issue-completion-flow__field">
                                                    <label className="issue-completion-flow__label" htmlFor={getFieldId(action.id, 'cameraPosition')}>Camera position <span className="issue-completion-flow__required-mark">*</span></label>
                                                    <select id={getFieldId(action.id, 'cameraPosition')} className={getInputClassName('issue-completion-flow__select', action.id, 'cameraPosition')} value={details.cameraPosition} onChange={handleTextInput(action.id, 'cameraPosition')} disabled={isProcessing}>
                                                        <option value="">Select camera position</option>
                                                        {CAMERA_POSITIONS.map((position) => (
                                                            <option key={position.value} value={position.value}>{position.text}</option>
                                                        ))}
                                                    </select>
                                                    {renderFieldError(action.id, 'cameraPosition')}
                                                </div>
                                                <div className="issue-completion-flow__field issue-completion-flow__field--full">
                                                    <label className="issue-completion-flow__label" htmlFor={getFieldId(action.id, 'cameraSimNumber')}>Camera SIM number</label>
                                                    <input id={getFieldId(action.id, 'cameraSimNumber')} type="text" className="issue-completion-flow__input" value={details.cameraSimNumber} onChange={handleTextInput(action.id, 'cameraSimNumber')} disabled={isProcessing} />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {showSensor && (
                                        <div className="issue-completion-flow__group issue-completion-flow__field--full">
                                            <div className="issue-completion-flow__group-title">
                                                <i className="fa-light fa-plug-circle-bolt"></i>
                                                <span>Sensor replacement</span>
                                            </div>
                                            <div className="issue-completion-flow__form-grid">
                                                <div className="issue-completion-flow__field">
                                                    <label className="issue-completion-flow__label" htmlFor={getFieldId(action.id, 'oldSensorType')}>Old sensor type</label>
                                                    <select id={getFieldId(action.id, 'oldSensorType')} className="issue-completion-flow__select" value={details.oldSensorType} onChange={handleTextInput(action.id, 'oldSensorType')} disabled={isProcessing}>
                                                        <option value="">Select old sensor type</option>
                                                        {SENSOR_TYPES.map((type) => (
                                                            <option key={type.value} value={type.value}>{type.text}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="issue-completion-flow__field">
                                                    <label className="issue-completion-flow__label" htmlFor={getFieldId(action.id, 'newSensorType')}>New sensor type <span className="issue-completion-flow__required-mark">*</span></label>
                                                    <select id={getFieldId(action.id, 'newSensorType')} className={getInputClassName('issue-completion-flow__select', action.id, 'newSensorType')} value={details.newSensorType} onChange={handleTextInput(action.id, 'newSensorType')} disabled={isProcessing}>
                                                        <option value="">Select new sensor type</option>
                                                        {SENSOR_TYPES.map((type) => (
                                                            <option key={type.value} value={type.value}>{type.text}</option>
                                                        ))}
                                                    </select>
                                                    {renderFieldError(action.id, 'newSensorType')}
                                                </div>
                                                <div className="issue-completion-flow__field issue-completion-flow__field--full">
                                                    <label className="issue-completion-flow__label" htmlFor={getFieldId(action.id, 'sensorReason')}>Reason <span className="issue-completion-flow__required-mark">*</span></label>
                                                    <select id={getFieldId(action.id, 'sensorReason')} className={getInputClassName('issue-completion-flow__select', action.id, 'sensorReason')} value={details.sensorReason} onChange={handleTextInput(action.id, 'sensorReason')} disabled={isProcessing}>
                                                        <option value="">Select reason</option>
                                                        {SENSOR_REASONS.map((reason) => (
                                                            <option key={reason.value} value={reason.value}>{reason.text}</option>
                                                        ))}
                                                    </select>
                                                    {renderFieldError(action.id, 'sensorReason')}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {showCalibration && (
                                        <div className="issue-completion-flow__group issue-completion-flow__field--full">
                                            <div className="issue-completion-flow__group-title">
                                                <i className="fa-light fa-ruler-combined"></i>
                                                <span>Calibration result</span>
                                            </div>
                                            <div className="issue-completion-flow__form-grid">
                                                <div className="issue-completion-flow__field issue-completion-flow__field--full">
                                                    <label className="issue-completion-flow__label" htmlFor={getFieldId(action.id, 'calibrationResult')}>Result <span className="issue-completion-flow__required-mark">*</span></label>
                                                    <select id={getFieldId(action.id, 'calibrationResult')} className={getInputClassName('issue-completion-flow__select', action.id, 'calibrationResult')} value={details.calibrationResult} onChange={handleTextInput(action.id, 'calibrationResult')} disabled={isProcessing}>
                                                        <option value="">Select calibration result</option>
                                                        {CALIBRATION_RESULTS.map((result) => (
                                                            <option key={result.value} value={result.value}>{result.text}</option>
                                                        ))}
                                                    </select>
                                                    {renderFieldError(action.id, 'calibrationResult')}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="issue-completion-flow__field issue-completion-flow__field--full">
                                        <label className="issue-completion-flow__label" htmlFor={getFieldId(action.id, 'notes')}>Action notes</label>
                                        <textarea
                                            id={getFieldId(action.id, 'notes')}
                                            className="issue-completion-flow__textarea"
                                            value={details.notes}
                                            onChange={handleTextInput(action.id, 'notes')}
                                            placeholder="Additional notes for this action..."
                                            disabled={isProcessing}
                                            rows={4}
                                            maxLength={2000}
                                        />
                                    </div>

                                    {issueId && action.id !== '__custom__' && (
                                        <div className="issue-completion-flow__field issue-completion-flow__field--full">
                                            <ActionAttachmentsDropzone
                                                issueId={issueId}
                                                category={resolveAttachmentCategory(action.actionType)}
                                                disabled={isProcessing}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderReviewSection = () => {
        if (selectedActions.length === 0) {
            return null;
        }

        return (
            <div className="issue-completion-flow__section">
                <div className="issue-completion-flow__section-header">
                    <div>
                        <h4 className="issue-completion-flow__section-title">Review and submit</h4>
                        <p className="issue-completion-flow__section-text">Confirm the captured details before submitting the completion record.</p>
                    </div>
                    <div className="issue-completion-flow__metric-pill">
                        <span className="issue-completion-flow__metric-value">{selectedActions.length}</span>
                        <span className="issue-completion-flow__metric-label">actions</span>
                    </div>
                </div>

                <div className="issue-completion-flow__review-list">
                    {selectedActions.map((action) => {
                        const details = getDetails(action.id);
                        const meta = TYPE_META[action.actionType] || TYPE_META.General;
                        const hasAnyDetail = details.rootCause || details.notes || details.oldDeviceImei || details.newDeviceImei || details.cameraImei;
                        const validationErrors = validationByAction[action.id] || {};
                        const errorMessages = Object.values(validationErrors);
                        const isReady = errorMessages.length === 0;

                        return (
                            <div key={action.key || action.id} className="issue-completion-flow__review-card">
                                <div className="issue-completion-flow__review-icon" style={{ backgroundColor: meta.tint, color: meta.color }}>
                                    <i className={meta.icon}></i>
                                </div>
                                <div className="issue-completion-flow__review-copy">
                                    <div className="issue-completion-flow__review-header-row">
                                        <span className="issue-completion-flow__review-title">{action.name}</span>
                                        <span className={`issue-completion-flow__review-status${isReady ? '' : ' issue-completion-flow__review-status--warning'}`}>
                                            <i className={`fa-light ${isReady ? 'fa-circle-check' : 'fa-circle-exclamation'}`}></i>
                                            <span>{isReady ? 'Ready' : 'Needs attention'}</span>
                                        </span>
                                    </div>
                                    <p className="issue-completion-flow__review-line"><strong>Stage:</strong> {action.stageName}</p>
                                    {details.rootCause && <p className="issue-completion-flow__review-line"><strong>Root cause:</strong> {details.rootCause}</p>}
                                    {(details.oldDeviceImei || details.newDeviceImei) && (
                                        <p className="issue-completion-flow__review-line"><strong>Device:</strong> {details.oldDeviceImei && `Old ${details.oldDeviceImei}`}{details.oldDeviceImei && details.newDeviceImei && ' → '}{details.newDeviceImei && `New ${details.newDeviceImei}`}</p>
                                    )}
                                    {details.cameraImei && <p className="issue-completion-flow__review-line"><strong>Camera:</strong> {details.cameraImei}{details.cameraPosition && ` (${details.cameraPosition})`}</p>}
                                    {details.notes && <p className="issue-completion-flow__review-line"><strong>Notes:</strong> {details.notes}</p>}
                                    {!isReady && (
                                        <div className="issue-completion-flow__review-errors">
                                            {errorMessages.map((message) => (
                                                <p key={message} className="issue-completion-flow__review-error">{message}</p>
                                            ))}
                                        </div>
                                    )}
                                    {!hasAnyDetail && <p className="issue-completion-flow__review-empty">No additional details were captured for this action.</p>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderFooter = () => (
        <div className="issue-completion-flow__footer">
            <div>
                {invalidSelections.length > 0 && (
                    <div className="issue-completion-flow__validation-banner">
                        <i className="fa-light fa-circle-exclamation"></i>
                        <span>Complete the required fields for {invalidSelections.length} action{invalidSelections.length === 1 ? '' : 's'} before submitting.</span>
                    </div>
                )}
            </div>
            <div className="issue-completion-flow__footer-actions">
                <button type="button" className="issue-completion-flow__button issue-completion-flow__button--ghost" onClick={handleCancel} disabled={isProcessing}>
                    <i className="fa-light fa-xmark"></i>
                    <span>Cancel</span>
                </button>
                <button type="button" className="issue-completion-flow__button issue-completion-flow__button--success" onClick={handleSubmit} disabled={isProcessing || !canSubmit}>
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
            </div>
        </div>
    );

    const renderContent = () => {
        if (loadingWorkflow) {
            return (
                <div className="issue-completion-flow__loading-state">
                    <LoadIndicator visible height={28} width={28} />
                    <span>Loading completion workflow...</span>
                </div>
            );
        }

        return (
            <div className="issue-completion-flow">
                <div className="issue-completion-flow__hero">
                    <div className="issue-completion-flow__hero-copy">
                        <span className="issue-completion-flow__eyebrow">Issue completion workflow</span>
                        <h3 className="issue-completion-flow__hero-title">Capture the work completed for issue #{issueId}</h3>
                        <p className="issue-completion-flow__hero-text">Select actions from the configured workflow, capture the relevant details inline, and submit from this side panel.</p>
                    </div>
                    <div className="issue-completion-flow__hero-summary">
                        <div className="issue-completion-flow__hero-stat">
                            <span className="issue-completion-flow__hero-stat-value">{templateActions.length}</span>
                            <span className="issue-completion-flow__hero-stat-label">workflow actions</span>
                        </div>
                        <div className="issue-completion-flow__hero-stat">
                            <span className="issue-completion-flow__hero-stat-value">{selectedActions.length}</span>
                            <span className="issue-completion-flow__hero-stat-label">selected</span>
                        </div>
                    </div>
                </div>

                <div className="issue-completion-flow__content">
                    {renderSelectionSection()}
                    {renderDetailsSection()}
                    {renderReviewSection()}
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
            width={showWidePanel ? 1500 : 720}
            headerActions={headerActions}
            panelClassName="issue-completion-panel"
        >
            {renderContent()}
            <IssueCompletionHelpPanel open={helpOpen} onClose={() => setHelpOpen(false)} />
        </SlidePanel>
    );
};

export default IssueCompletionPopup;
