/**
 * File: IssueCompletionPopup.js
 * Purpose: Wizard-based issue completion popup with 3 steps:
 *          Step 1 — Select actions performed (toggle cards)
 *          Step 2 — Fill details per action (one at a time with sub-nav)
 *          Step 3 — Review summary + general notes + submit
 * Dependencies: React, DevExtreme (Popup, Button, TextArea, TextBox, SelectBox, LoadIndicator, ScrollView),
 *               issueTrackerV2Service
 * Last Modified: 2026-02-24
 *
 * Key Components:
 * - IssueCompletionPopup: 3-step wizard modal for structured issue completion
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Popup from 'devextreme-react/popup';
import ScrollView from 'devextreme-react/scroll-view';
import { Button } from 'devextreme-react/button';
import TextArea from 'devextreme-react/text-area';
import TextBox from 'devextreme-react/text-box';
import SelectBox from 'devextreme-react/select-box';
import LoadIndicator from 'devextreme-react/load-indicator';
import issueTrackerV2Service from '../../../services/issueTrackerV2Service';

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

function createEmptyDetails() {
    return {
        rootCause: '', notes: '',
        oldDeviceType: '', oldDeviceImei: '', newDeviceType: '', newDeviceImei: '',
        devicePhoneNumber: '', sourceVehicleId: null,
        cameraImei: '', cameraPosition: '', cameraSimNumber: ''
    };
}

/**
 * @param {Object} props
 * @param {boolean} props.visible
 * @param {Function} props.onHide
 * @param {Function} props.onComplete - Called after successful completion
 * @param {number} props.issueId
 * @param {number|null} props.issueTemplateId
 * @param {boolean} props.isProcessing
 * @param {Array} [props.vehicles]
 */
const IssueCompletionPopup = ({
    visible, onHide, onComplete, issueId, issueTemplateId,
    isProcessing: externalProcessing = false, vehicles = []
}) => {
    const [step, setStep] = useState(0);
    const [templateActions, setTemplateActions] = useState([]);
    const [loadingActions, setLoadingActions] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Step 0 state
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [showCustom, setShowCustom] = useState(false);
    const [customActionName, setCustomActionName] = useState('');

    // Step 1 state
    const [detailsMap, setDetailsMap] = useState({});
    const [currentDetailIdx, setCurrentDetailIdx] = useState(0);

    // Step 2 state
    const [generalNotes, setGeneralNotes] = useState('');

    const isProcessing = externalProcessing || isSubmitting;

    useEffect(() => {
        if (visible && issueTemplateId) loadTemplateActions();
        if (visible) resetForm();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible, issueTemplateId]);

    const loadTemplateActions = async () => {
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
    };

    const resetForm = () => {
        setStep(0);
        setSelectedIds(new Set());
        setShowCustom(false);
        setCustomActionName('');
        setDetailsMap({});
        setCurrentDetailIdx(0);
        setGeneralNotes('');
    };

    // Computed: list of selected actions (template + optional custom)
    const selectedActions = useMemo(() => {
        const list = templateActions.filter(a => selectedIds.has(a.id));
        if (showCustom && customActionName.trim()) {
            list.push({
                id: '__custom__', name: customActionName.trim(), actionType: 'General',
                requiresDeviceDetails: false, requiresSourceVehicle: false,
                requiresCameraDetails: false, description: null
            });
        }
        return list;
    }, [templateActions, selectedIds, showCustom, customActionName]);

    const toggleAction = useCallback((actionId) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(actionId) ? next.delete(actionId) : next.add(actionId);
            return next;
        });
    }, []);

    const getDetails = useCallback((actionId) =>
        detailsMap[actionId] || createEmptyDetails(), [detailsMap]);

    const updateDetail = useCallback((actionId, field, value) => {
        setDetailsMap(prev => ({
            ...prev,
            [actionId]: { ...(prev[actionId] || createEmptyDetails()), [field]: value }
        }));
    }, []);

    const vehicleDataSource = useMemo(() =>
        vehicles.map(v => ({
            id: v.vehicleId ?? v.id,
            displayName: v.hyoungNo || v.numberPlate || `Vehicle #${v.vehicleId ?? v.id}`
        })), [vehicles]);

    // Navigation
    const canProceedFromSelect = selectedActions.length > 0;
    const currentAction = selectedActions[currentDetailIdx] || null;

    const goNext = () => {
        if (step === 0) {
            setCurrentDetailIdx(0);
            selectedActions.forEach(a => {
                if (!detailsMap[a.id]) setDetailsMap(prev => ({ ...prev, [a.id]: createEmptyDetails() }));
            });
            setStep(1);
        } else if (step === 1) {
            setStep(2);
        }
    };
    const goBack = () => { if (step > 0) setStep(step - 1); };

    // Submit
    const handleSubmit = async () => {
        if (isProcessing) return;
        try {
            setIsSubmitting(true);
            const completionData = {
                actions: selectedActions.map(action => {
                    const d = getDetails(action.id);
                    return {
                        templateActionId: action.id === '__custom__' ? null : action.id,
                        actionName: action.name,
                        rootCause: d.rootCause || null, notes: d.notes || null,
                        oldDeviceType: d.oldDeviceType || null, oldDeviceImei: d.oldDeviceImei || null,
                        newDeviceType: d.newDeviceType || null, newDeviceImei: d.newDeviceImei || null,
                        devicePhoneNumber: d.devicePhoneNumber || null,
                        sourceVehicleId: d.sourceVehicleId || null,
                        cameraImei: d.cameraImei || null, cameraPosition: d.cameraPosition || null,
                        cameraSimNumber: d.cameraSimNumber || null, additionalNotes: null
                    };
                }),
                notes: generalNotes.trim() || null
            };
            await issueTrackerV2Service.completeWithActions(issueId, completionData);
            if (onComplete) onComplete();
        } catch (error) {
            console.error('Error completing issue:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = useCallback(() => {
        if (!isProcessing && onHide) onHide();
    }, [isProcessing, onHide]);

    /* ─── STEP INDICATOR ─── */
    const renderStepIndicator = () => (
        <div className="tw-flex tw-items-center tw-justify-center tw-gap-1 tw-mb-5">
            {STEPS.map((s, i) => {
                const isActive = i === step;
                const isComplete = i < step;
                return (
                    <React.Fragment key={s.key}>
                        {i > 0 && (
                            <div className={`tw-w-10 tw-h-0.5 tw-mx-0.5 ${isComplete ? 'tw-bg-green-500' : 'tw-bg-gray-200'}`} />
                        )}
                        <div className="tw-flex tw-items-center tw-gap-1.5">
                            <div className={`tw-w-7 tw-h-7 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-text-xs tw-font-bold tw-transition-colors ${isComplete ? 'tw-bg-green-500 tw-text-white' :
                                    isActive ? 'tw-bg-blue-600 tw-text-white' :
                                        'tw-bg-gray-200 tw-text-gray-500'
                                }`}>
                                {isComplete ? <i className="fa-light fa-check tw-text-[10px]"></i> : i + 1}
                            </div>
                            <span className={`tw-text-xs tw-font-medium ${isActive ? 'tw-text-blue-700' : isComplete ? 'tw-text-green-700' : 'tw-text-gray-400'
                                }`}>{s.label}</span>
                        </div>
                    </React.Fragment>
                );
            })}
        </div>
    );

    /* ─── STEP 0: SELECT ACTIONS ─── */
    const renderSelectStep = () => {
        if (templateActions.length === 0 && !loadingActions) {
            return (
                <div className="tw-text-center tw-py-8">
                    <i className="fa-light fa-clipboard-list tw-text-4xl tw-text-gray-300 tw-mb-3"></i>
                    <p className="tw-text-sm tw-text-gray-500">No template actions configured.</p>
                    <p className="tw-text-xs tw-text-gray-400 tw-mt-1">You can add a custom action below.</p>
                </div>
            );
        }

        return (
            <div>
                <p className="tw-text-sm tw-text-gray-600 tw-mb-3">
                    Select the actions you performed to resolve this issue:
                </p>
                <div className="tw-space-y-2">
                    {templateActions.map(action => {
                        const isSelected = selectedIds.has(action.id);
                        const style = TYPE_STYLES[action.actionType] || TYPE_STYLES.General;
                        return (
                            <button
                                key={action.id}
                                type="button"
                                className={`tw-w-full tw-text-left tw-flex tw-items-center tw-gap-3 tw-p-3 tw-rounded-lg tw-border-2 tw-transition-all ${isSelected
                                        ? 'tw-border-blue-500 tw-bg-blue-50/60'
                                        : 'tw-border-gray-200 tw-bg-white hover:tw-border-gray-300 hover:tw-bg-gray-50'
                                    }`}
                                onClick={() => toggleAction(action.id)}
                                disabled={isProcessing}
                            >
                                <div className={`tw-w-5 tw-h-5 tw-rounded tw-border-2 tw-flex tw-items-center tw-justify-center tw-transition-colors tw-flex-shrink-0 ${isSelected ? 'tw-bg-blue-500 tw-border-blue-500' : 'tw-border-gray-300'
                                    }`}>
                                    {isSelected && <i className="fa-solid fa-check tw-text-white tw-text-[10px]"></i>}
                                </div>
                                <div className={`tw-w-8 tw-h-8 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-flex-shrink-0 ${style.bg} ${style.text}`}>
                                    <i className={`${style.icon} tw-text-sm`}></i>
                                </div>
                                <div className="tw-flex-1 tw-min-w-0">
                                    <span className="tw-font-medium tw-text-gray-900 tw-text-sm">{action.name}</span>
                                    {action.description && (
                                        <p className="tw-text-xs tw-text-gray-500 tw-mt-0.5 tw-truncate">{action.description}</p>
                                    )}
                                </div>
                                <span className={`tw-text-[10px] tw-px-2 tw-py-0.5 tw-rounded-full tw-font-medium tw-flex-shrink-0 ${style.bg} ${style.text}`}>
                                    {TYPE_LABELS[action.actionType] || 'General'}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Custom action */}
                <div className="tw-mt-4 tw-pt-3 tw-border-t tw-border-dashed tw-border-gray-200">
                    {!showCustom ? (
                        <button type="button"
                            className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-blue-600 hover:tw-text-blue-800"
                            onClick={() => setShowCustom(true)}>
                            <i className="fa-light fa-plus tw-text-xs"></i>Add a custom action
                        </button>
                    ) : (
                        <div className="tw-flex tw-items-center tw-gap-2">
                            <TextBox value={customActionName} onValueChanged={e => setCustomActionName(e.value)}
                                placeholder="Custom action name..." stylingMode="outlined" width="100%" />
                            <Button icon="close" stylingMode="text" hint="Remove"
                                onClick={() => { setShowCustom(false); setCustomActionName(''); }} />
                        </div>
                    )}
                </div>
            </div>
        );
    };

    /* ─── STEP 1: ACTION DETAILS (one at a time) ─── */
    const renderDetailsStep = () => {
        if (!currentAction) return null;

        const details = getDetails(currentAction.id);
        const style = TYPE_STYLES[currentAction.actionType] || TYPE_STYLES.General;
        const showDevice = currentAction.requiresDeviceDetails || currentAction.actionType === 'DeviceChange';
        const showCamera = currentAction.requiresCameraDetails || currentAction.actionType === 'CameraInstall';
        const showSrcVehicle = currentAction.requiresSourceVehicle;
        const total = selectedActions.length;

        return (
            <div>
                {/* Sub-navigation dots */}
                {total > 1 && (
                    <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
                        <button type="button" disabled={currentDetailIdx === 0}
                            className="tw-text-xs tw-text-gray-500 hover:tw-text-gray-800 disabled:tw-opacity-30"
                            onClick={() => setCurrentDetailIdx(i => i - 1)}>
                            <i className="fa-light fa-chevron-left tw-mr-1"></i>Prev
                        </button>
                        <div className="tw-flex tw-gap-1.5">
                            {selectedActions.map((_, i) => (
                                <button key={i} type="button"
                                    className={`tw-w-2 tw-h-2 tw-rounded-full ${i === currentDetailIdx ? 'tw-bg-blue-600' : 'tw-bg-gray-300 hover:tw-bg-gray-400'}`}
                                    onClick={() => setCurrentDetailIdx(i)} />
                            ))}
                        </div>
                        <button type="button" disabled={currentDetailIdx === total - 1}
                            className="tw-text-xs tw-text-gray-500 hover:tw-text-gray-800 disabled:tw-opacity-30"
                            onClick={() => setCurrentDetailIdx(i => i + 1)}>
                            Next<i className="fa-light fa-chevron-right tw-ml-1"></i>
                        </button>
                    </div>
                )}

                {/* Action header */}
                <div className={`tw-flex tw-items-center tw-gap-3 tw-p-3 tw-rounded-lg tw-mb-4 ${style.bg}`}>
                    <div className={`tw-w-9 tw-h-9 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-bg-white/60 ${style.text}`}>
                        <i className={style.icon}></i>
                    </div>
                    <div>
                        <span className="tw-font-semibold tw-text-gray-900 tw-text-sm">{currentAction.name}</span>
                        <span className={`tw-ml-2 tw-text-xs ${style.text}`}>{TYPE_LABELS[currentAction.actionType]}</span>
                        {total > 1 && <span className="tw-ml-2 tw-text-xs tw-text-gray-500">({currentDetailIdx + 1} of {total})</span>}
                    </div>
                </div>

                {/* Root Cause */}
                <div className="tw-mb-3">
                    <label className="tw-text-xs tw-font-semibold tw-text-gray-600 tw-uppercase tw-tracking-wide tw-mb-1 tw-block">Root Cause</label>
                    <TextArea value={details.rootCause} onValueChanged={e => updateDetail(currentAction.id, 'rootCause', e.value)}
                        placeholder="What caused this issue?" height={60} maxLength={1000} disabled={isProcessing} stylingMode="outlined" />
                </div>

                {/* Device Details */}
                {showDevice && (
                    <div className="tw-mb-3 tw-p-3 tw-rounded-lg tw-bg-blue-50/50 tw-border tw-border-blue-200">
                        <div className="tw-flex tw-items-center tw-gap-2 tw-mb-2">
                            <i className="fa-light fa-microchip tw-text-blue-600 tw-text-sm"></i>
                            <span className="tw-text-xs tw-font-semibold tw-text-blue-700 tw-uppercase">Device Details</span>
                        </div>
                        <div className="tw-grid tw-grid-cols-2 tw-gap-2">
                            <TextBox value={details.oldDeviceType} onValueChanged={e => updateDetail(currentAction.id, 'oldDeviceType', e.value)}
                                placeholder="Old Device Type" disabled={isProcessing} stylingMode="outlined" />
                            <TextBox value={details.oldDeviceImei} onValueChanged={e => updateDetail(currentAction.id, 'oldDeviceImei', e.value)}
                                placeholder="Old IMEI" disabled={isProcessing} stylingMode="outlined" />
                            <TextBox value={details.newDeviceType} onValueChanged={e => updateDetail(currentAction.id, 'newDeviceType', e.value)}
                                placeholder="New Device Type" disabled={isProcessing} stylingMode="outlined" />
                            <TextBox value={details.newDeviceImei} onValueChanged={e => updateDetail(currentAction.id, 'newDeviceImei', e.value)}
                                placeholder="New IMEI" disabled={isProcessing} stylingMode="outlined" />
                        </div>
                        <div className="tw-mt-2">
                            <TextBox value={details.devicePhoneNumber} onValueChanged={e => updateDetail(currentAction.id, 'devicePhoneNumber', e.value)}
                                placeholder="Device Phone Number" disabled={isProcessing} stylingMode="outlined" />
                        </div>
                        {showSrcVehicle && vehicleDataSource.length > 0 && (
                            <div className="tw-mt-2">
                                <SelectBox dataSource={vehicleDataSource} value={details.sourceVehicleId}
                                    onValueChanged={e => updateDetail(currentAction.id, 'sourceVehicleId', e.value)}
                                    valueExpr="id" displayExpr="displayName" placeholder="Source Vehicle (device taken from)"
                                    searchEnabled showClearButton disabled={isProcessing} stylingMode="outlined" />
                            </div>
                        )}
                    </div>
                )}

                {/* Camera Details */}
                {showCamera && (
                    <div className="tw-mb-3 tw-p-3 tw-rounded-lg tw-bg-purple-50/50 tw-border tw-border-purple-200">
                        <div className="tw-flex tw-items-center tw-gap-2 tw-mb-2">
                            <i className="fa-light fa-camera tw-text-purple-600 tw-text-sm"></i>
                            <span className="tw-text-xs tw-font-semibold tw-text-purple-700 tw-uppercase">Camera Details</span>
                        </div>
                        <div className="tw-grid tw-grid-cols-2 tw-gap-2">
                            <TextBox value={details.cameraImei} onValueChanged={e => updateDetail(currentAction.id, 'cameraImei', e.value)}
                                placeholder="Camera IMEI" disabled={isProcessing} stylingMode="outlined" />
                            <SelectBox dataSource={CAMERA_POSITIONS} value={details.cameraPosition}
                                onValueChanged={e => updateDetail(currentAction.id, 'cameraPosition', e.value)}
                                valueExpr="value" displayExpr="text" placeholder="Camera Position"
                                showClearButton disabled={isProcessing} stylingMode="outlined" />
                        </div>
                        <div className="tw-mt-2">
                            <TextBox value={details.cameraSimNumber} onValueChanged={e => updateDetail(currentAction.id, 'cameraSimNumber', e.value)}
                                placeholder="Camera SIM Number" disabled={isProcessing} stylingMode="outlined" />
                        </div>
                    </div>
                )}

                {/* Notes */}
                <div>
                    <label className="tw-text-xs tw-font-semibold tw-text-gray-600 tw-uppercase tw-tracking-wide tw-mb-1 tw-block">Notes</label>
                    <TextArea value={details.notes} onValueChanged={e => updateDetail(currentAction.id, 'notes', e.value)}
                        placeholder="Additional notes for this action..." height={50} maxLength={2000} disabled={isProcessing} stylingMode="outlined" />
                </div>
            </div>
        );
    };

    /* ─── STEP 2: REVIEW & SUBMIT ─── */
    const renderReviewStep = () => (
        <div>
            <p className="tw-text-sm tw-text-gray-600 tw-mb-3">Review the actions before completing this issue:</p>

            <div className="tw-space-y-2 tw-mb-4">
                {selectedActions.map((action, i) => {
                    const d = getDetails(action.id);
                    const style = TYPE_STYLES[action.actionType] || TYPE_STYLES.General;
                    const hasAnyDetail = d.rootCause || d.notes || d.oldDeviceImei || d.newDeviceImei || d.cameraImei;
                    return (
                        <div key={action.id} className="tw-flex tw-items-start tw-gap-3 tw-p-3 tw-rounded-lg tw-border tw-border-gray-200 tw-bg-white">
                            <div className={`tw-w-7 tw-h-7 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-flex-shrink-0 ${style.bg} ${style.text}`}>
                                <i className={`${style.icon} tw-text-xs`}></i>
                            </div>
                            <div className="tw-flex-1 tw-min-w-0">
                                <div className="tw-flex tw-items-center tw-gap-2">
                                    <span className="tw-font-medium tw-text-gray-900 tw-text-sm">{action.name}</span>
                                    <i className="fa-light fa-circle-check tw-text-green-500 tw-text-sm"></i>
                                </div>
                                {d.rootCause && (
                                    <p className="tw-text-xs tw-text-gray-500 tw-mt-0.5">
                                        <span className="tw-font-medium">Root Cause:</span> {d.rootCause}
                                    </p>
                                )}
                                {(d.oldDeviceImei || d.newDeviceImei) && (
                                    <p className="tw-text-xs tw-text-gray-500 tw-mt-0.5">
                                        <i className="fa-light fa-microchip tw-mr-1"></i>
                                        {d.oldDeviceImei && `Old: ${d.oldDeviceImei}`}
                                        {d.oldDeviceImei && d.newDeviceImei && ' \u2192 '}
                                        {d.newDeviceImei && `New: ${d.newDeviceImei}`}
                                    </p>
                                )}
                                {d.cameraImei && (
                                    <p className="tw-text-xs tw-text-gray-500 tw-mt-0.5">
                                        <i className="fa-light fa-camera tw-mr-1"></i>
                                        {d.cameraImei}{d.cameraPosition && ` (${d.cameraPosition})`}
                                    </p>
                                )}
                                {d.notes && (
                                    <p className="tw-text-xs tw-text-gray-500 tw-mt-0.5 tw-truncate">
                                        <span className="tw-font-medium">Notes:</span> {d.notes}
                                    </p>
                                )}
                                {!hasAnyDetail && (
                                    <p className="tw-text-xs tw-text-gray-400 tw-mt-0.5 tw-italic">No details provided</p>
                                )}
                            </div>
                            <button type="button"
                                className="tw-text-xs tw-text-blue-600 hover:tw-text-blue-800 tw-flex-shrink-0"
                                onClick={() => { setCurrentDetailIdx(i); setStep(1); }}>
                                Edit
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* General Notes */}
            <div>
                <label className="tw-text-xs tw-font-semibold tw-text-gray-600 tw-uppercase tw-tracking-wide tw-mb-1 tw-block">
                    General Notes <span className="tw-text-gray-400 tw-normal-case">(optional)</span>
                </label>
                <TextArea value={generalNotes} onValueChanged={e => setGeneralNotes(e.value)}
                    placeholder="Any additional completion notes..." height={70} disabled={isProcessing} stylingMode="outlined" />
            </div>
        </div>
    );

    /* ─── FOOTER NAVIGATION ─── */
    const renderFooter = () => (
        <div className="tw-flex tw-items-center tw-justify-between tw-pt-4 tw-border-t tw-border-gray-200 tw-mt-4">
            <div>
                {step > 0 && (
                    <button type="button" onClick={goBack} disabled={isProcessing}
                        className="tw-text-sm tw-text-gray-600 hover:tw-text-gray-900 disabled:tw-opacity-40">
                        <i className="fa-light fa-arrow-left tw-mr-1"></i>Back
                    </button>
                )}
            </div>
            <div className="tw-flex tw-items-center tw-gap-2">
                <Button text="Cancel" stylingMode="text" onClick={handleCancel} disabled={isProcessing} />
                {step === 0 && (
                    <Button text="Next" icon="fa-light fa-arrow-right" type="default" stylingMode="contained"
                        onClick={goNext} disabled={!canProceedFromSelect} />
                )}
                {step === 1 && (
                    <Button text="Review" icon="fa-light fa-eye" type="default" stylingMode="contained" onClick={goNext} />
                )}
                {step === 2 && (
                    <Button text={isProcessing ? 'Completing...' : 'Complete Issue'}
                        icon={!isProcessing ? 'fa-light fa-circle-check' : undefined}
                        type="success" stylingMode="contained" onClick={handleSubmit} disabled={isProcessing} />
                )}
            </div>
        </div>
    );

    /* ─── MAIN RENDER ─── */
    const renderContent = () => {
        if (loadingActions) {
            return (
                <div className="tw-flex tw-items-center tw-justify-center tw-py-12">
                    <LoadIndicator visible height={28} width={28} />
                    <span className="tw-ml-3 tw-text-gray-500 tw-text-sm">Loading actions...</span>
                </div>
            );
        }

        return (
            <div className="tw-p-5">
                {renderStepIndicator()}
                <ScrollView height="calc(70vh - 200px)" showScrollbar="onScroll">
                    {step === 0 && renderSelectStep()}
                    {step === 1 && renderDetailsStep()}
                    {step === 2 && renderReviewStep()}
                </ScrollView>
                {renderFooter()}
            </div>
        );
    };

    return (
        <Popup
            visible={visible}
            onHiding={handleCancel}
            dragEnabled={true}
            showCloseButton={!isProcessing}
            showTitle={false}
            width={720}
            height="auto"
            maxHeight="85vh"
            shading
            shadingColor="rgba(0,0,0,0.4)"
            wrapperAttr={{ class: 'issue-completion-popup' }}
        >
            {renderContent()}
        </Popup>
    );
};

export default IssueCompletionPopup;
