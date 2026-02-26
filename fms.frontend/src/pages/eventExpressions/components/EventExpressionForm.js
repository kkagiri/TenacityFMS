/**
 * File: EventExpressionForm.js
 * Purpose: Orchestrator for Event Expression create/edit. Uses a step-by-step accordion
 *          with inline notification policy creation — no separate policy page needed.
 * Dependencies: react-redux, react-router-dom, devextreme-react, step components,
 *               eventExpressionSlice, notificationsApi
 * Last Modified: 2026-02-14
 *
 * Steps:
 * 1. Basic Information — name, description, priority, severity, active toggle
 * 2. Event Type & Triggers — event type selection, dynamic condition fields
 * 3. Scope — site/tank filters
 * 4. Delivery & Notification — channels, rate limits, cooldown, active event
 * 5. Recipients — users, roles
 * 6. Message Template — HTML editor with placeholders and live preview
 *
 * On save: creates/updates the notification policy first, then saves the expression.
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { NumberBox } from 'devextreme-react/number-box';
import { TextBox } from 'devextreme-react/text-box';
import { SelectBox } from 'devextreme-react/select-box';
import { DateBox } from 'devextreme-react/date-box';
import { Button } from 'devextreme-react/button';
import Accordion, { Item as AccordionItem } from 'devextreme-react/accordion';
import { ValidationGroup } from 'devextreme-react/validation-group';
import { LoadIndicator } from 'devextreme-react/load-indicator';
import notify from 'devextreme/ui/notify';
import {
    fetchEventExpressionById,
    fetchEventExpressionTypes,
    createEventExpression,
    updateEventExpression,
    clearSelectedExpression,
    clearErrors
} from '../../../redux/slices/eventExpressionSlice';
import { fetchSiteList } from '../../../redux/actions/siteActions';
import { fetchAllDepartments } from '../../../redux/actions/userActions';
import notificationsApi from '../../../dataservice/notificationsApi';
import axiosInstance from '../../../api/axiosInstance';
import StepBasicInfo from './steps/StepBasicInfo';
import StepEventTriggers from './steps/StepEventTriggers';
import StepScope from './steps/StepScope';
import StepDelivery from './steps/StepDelivery';
import StepRecipients from './steps/StepRecipients';
import StepMessageTemplate from './steps/StepMessageTemplate';
import './EventExpressionForm.scss';

const STEP_TITLES = [
    '1. Basic Information',
    '2. Event Type & Triggers',
    '3. Scope',
    '4. Delivery & Notification',
    '5. Recipients',
    '6. Message Template'
];

const EventExpressionForm = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = !!id;

    const {
        selectedExpression,
        selectedLoading,
        expressionTypes,
        typesLoading,
        saving,
        saveError
    } = useSelector((state) => state.eventExpressions);

    // ─── Expression form state ───
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        eventType: '',
        siteIds: [],
        tankIds: [],
        deviceId: null,
        minimumSeverity: null,
        conditions: '{}',
        notificationPolicyId: null,
        cooldownMinutes: 30,
        maxNotificationsPerDay: 0,
        maxNotificationsPerHour: 0,
        priority: 'Medium',
        createActiveEvent: true,
        messageTemplate: '',
        attachReport: false,
        isActive: true
    });

    // ─── Inline notification policy state ───
    const [policyData, setPolicyData] = useState({
        enableEmail: true,
        enableSms: false,
        enableSystem: true,
        maxNotificationsPerHour: 10,
        requireAcknowledgment: false,
        titleTemplate: '',
        isActive: true
    });

    // ─── Recipients ───
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [recipientRules, setRecipientRules] = useState({
        dynamicRules: [
            { type: 'SiteUsers', enabled: false },
            { type: 'SiteAdmin', enabled: true },
            { type: 'RolesAtSite', enabled: false, roleIds: [] }
        ]
    });
    const [roles, setRoles] = useState([]);
    const [loadingRecipients, setLoadingRecipients] = useState(true);

    // ─── Condition fields + accordion step ───
    const [conditionValues, setConditionValues] = useState({});
    const [activeStep, setActiveStep] = useState(0);

    // ─── Multi-site scoped tanks (local, not Redux — avoids single-site overwrite) ───
    const [scopeTanks, setScopeTanks] = useState([]);
    const [loadingScopeTanks, setLoadingScopeTanks] = useState(false);

    // Lookup data from Redux store
    const sites = useSelector((state) => state.site?.sites || []);
    const departments = useSelector((state) => state.user?.allDepartments || []);

    // ─── Load types, sites, and recipient options on mount ───
    useEffect(() => {
        dispatch(fetchEventExpressionTypes());
        dispatch(fetchSiteList());
        dispatch(fetchAllDepartments());

        // Load role list for dynamic-rule role picker
        (async () => {
            setLoadingRecipients(true);
            try {
                const rolesRes = await notificationsApi.searchRoles('', 100);
                if (rolesRes.isSuccess) {
                    setRoles(
                        (rolesRes.data || []).map((r) => ({
                            value: r.id,
                            text: r.name || r.id
                        }))
                    );
                }
            } catch (err) {
                console.error('Failed to load roles:', err);
            } finally {
                setLoadingRecipients(false);
            }
        })();

        return () => {
            dispatch(clearSelectedExpression());
            dispatch(clearErrors());
        };
    }, [dispatch]);

    // ─── Load expression + its linked policy when editing ───
    useEffect(() => {
        if (isEditing) {
            dispatch(fetchEventExpressionById(parseInt(id)));
        }
    }, [dispatch, id, isEditing]);

    // Populate form when expression loads
    useEffect(() => {
        if (isEditing && selectedExpression) {
            // Parse conditions first to recover alertTypeKey for dropdown
            let parsedConditions = {};
            try {
                parsedConditions = JSON.parse(selectedExpression.conditions || '{}');
            } catch {
                parsedConditions = {};
            }

            // Recover alertTypeKey: stored in _alertTypeKey, fallback to eventType
            const alertKey = parsedConditions._alertTypeKey || selectedExpression.eventType || '';

            // Recover multi-site selection: stored in _siteIds, fallback to single siteId
            const recoveredSiteIds = Array.isArray(parsedConditions._siteIds) && parsedConditions._siteIds.length > 0
                ? parsedConditions._siteIds
                : (selectedExpression.siteId ? [selectedExpression.siteId] : []);

            // Recover multi-tank selection: stored in _tankIds, fallback to single tankId
            const recoveredTankIds = Array.isArray(parsedConditions._tankIds) && parsedConditions._tankIds.length > 0
                ? parsedConditions._tankIds
                : (selectedExpression.tankId ? [selectedExpression.tankId] : []);

            // Recover attach report flag
            const recoveredAttachReport = !!parsedConditions._attachReport;

            // Strip internal fields from display conditions
            const { _alertTypeKey, _siteIds, _tankIds, _attachReport, ...displayConditions } = parsedConditions;
            setConditionValues(displayConditions);

            setFormData({
                name: selectedExpression.name || '',
                description: selectedExpression.description || '',
                eventType: alertKey,
                siteIds: recoveredSiteIds,
                tankIds: recoveredTankIds,
                deviceId: selectedExpression.deviceId,
                minimumSeverity: selectedExpression.minimumSeverity,
                conditions: JSON.stringify(displayConditions),
                notificationPolicyId: selectedExpression.notificationPolicyId,
                cooldownMinutes: selectedExpression.cooldownMinutes || 30,
                maxNotificationsPerDay: selectedExpression.maxNotificationsPerDay || 0,
                maxNotificationsPerHour: selectedExpression.maxNotificationsPerHour || 0,
                priority: selectedExpression.priority || 'Medium',
                createActiveEvent: selectedExpression.createActiveEvent ?? true,
                messageTemplate: selectedExpression.messageTemplate || '',
                attachReport: recoveredAttachReport,
                isActive: selectedExpression.isActive ?? true
            });

            // Load linked policy data for inline editing
            if (selectedExpression.notificationPolicyId) {
                (async () => {
                    try {
                        const pRes = await notificationsApi.getPolicy(
                            selectedExpression.notificationPolicyId
                        );
                        if (pRes.isSuccess && pRes.data) {
                            const p = pRes.data;
                            setPolicyData({
                                enableEmail: p.enableEmail ?? true,
                                enableSms: p.enableSms ?? false,
                                enableSystem: p.enableSystem ?? true,
                                maxNotificationsPerHour: p.maxNotificationsPerHour ?? 10,
                                requireAcknowledgment: p.requireAcknowledgment ?? false,
                                titleTemplate: p.titleTemplate || '',
                                isActive: p.isActive ?? true
                            });
                            // Load existing static recipients
                            if (p.recipients && Array.isArray(p.recipients)) {
                                setSelectedUserIds(
                                    p.recipients.filter((r) => r.userId).map((r) => r.userId)
                                );
                            }
                            // Load existing dynamic routing rules
                            if (p.recipientRules) {
                                try {
                                    const parsed = JSON.parse(p.recipientRules);
                                    if (parsed && parsed.dynamicRules) {
                                        setRecipientRules(parsed);
                                    }
                                } catch { /* ignore bad JSON */ }
                            }
                        }
                    } catch (err) {
                        console.error('Failed to load linked policy:', err);
                    }
                })();
            }
        }
    }, [isEditing, selectedExpression]);

    // Load tanks for all recovered siteIds during edit
    useEffect(() => {
        if (isEditing && selectedExpression) {
            // Recover siteIds from conditions or single siteId
            let parsedConds = {};
            try { parsedConds = JSON.parse(selectedExpression.conditions || '{}'); } catch { /* ignore */ }
            const recoveredSiteIds = Array.isArray(parsedConds._siteIds) && parsedConds._siteIds.length > 0
                ? parsedConds._siteIds
                : (selectedExpression.siteId ? [selectedExpression.siteId] : []);
            if (recoveredSiteIds.length > 0) {
                fetchTanksForSites(recoveredSiteIds);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditing, selectedExpression]);

    // ─── Derived metadata (find by alertTypeKey, which formData.eventType stores) ───
    const selectedTypeMetadata = useMemo(() => {
        return expressionTypes.find((t) => t.alertTypeKey === formData.eventType) || null;
    }, [expressionTypes, formData.eventType]);

    const availableConditions = useMemo(() => {
        return selectedTypeMetadata?.availableConditions || [];
    }, [selectedTypeMetadata]);

    // ─── Helper: fetch tanks for multiple sites in parallel ───
    const fetchTanksForSites = useCallback(async (siteIds) => {
        if (!siteIds || siteIds.length === 0) {
            setScopeTanks([]);
            return;
        }
        setLoadingScopeTanks(true);
        try {
            const results = await Promise.all(
                siteIds.map((sid) =>
                    axiosInstance.get(`/tank/site/${sid}`).then((res) => {
                        const data = res.data;
                        return Array.isArray(data) ? data : (data?.data || []);
                    }).catch(() => [])
                )
            );
            // Merge and deduplicate by id
            const merged = results.flat();
            const unique = Array.from(new Map(merged.map((t) => [t.id, t])).values());
            setScopeTanks(unique);
        } catch (err) {
            console.error('Failed to load tanks for sites:', err);
            setScopeTanks([]);
        } finally {
            setLoadingScopeTanks(false);
        }
    }, []);

    // ─── Handlers ───
    const handleFieldChange = useCallback((field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    }, []);

    // Load tanks when site selection changes — fetches from ALL selected sites
    const handleSiteChange = useCallback((siteIds) => {
        handleFieldChange('siteIds', siteIds);
        handleFieldChange('tankIds', []);
        fetchTanksForSites(siteIds);
    }, [handleFieldChange, fetchTanksForSites]);

    const handlePolicyChange = useCallback((field, value) => {
        setPolicyData((prev) => ({ ...prev, [field]: value }));
    }, []);

    const handleConditionChange = useCallback((key, value) => {
        setConditionValues((prev) => {
            const updated = { ...prev, [key]: value };
            setFormData((fdPrev) => ({
                ...fdPrev,
                conditions: JSON.stringify(updated)
            }));
            return updated;
        });
    }, []);

    const handleEventTypeChange = useCallback(
        (value) => {
            handleFieldChange('eventType', value);
            setConditionValues({});
            setFormData((prev) => ({ ...prev, conditions: '{}' }));
        },
        [handleFieldChange]
    );

    const handleCancel = useCallback(() => {
        navigate('/event-expressions/expressions');
    }, [navigate]);

    const handleNextStep = useCallback(() => {
        if (activeStep === 0 && !formData.name?.trim()) {
            notify('Please enter a Name before continuing', 'warning', 2500);
            return;
        }
        if (activeStep === 1 && !formData.eventType) {
            notify('Please select an Event Type before continuing', 'warning', 2500);
            return;
        }
        setActiveStep((prev) => Math.min(prev + 1, STEP_TITLES.length - 1));
    }, [activeStep, formData.eventType, formData.name]);

    const handlePreviousStep = useCallback(() => {
        setActiveStep((prev) => Math.max(prev - 1, 0));
    }, []);

    // ─── Dynamic condition field renderer (passed to StepEventTriggers) ───
    const renderConditionField = useCallback(
        (condition) => {
            const { key, label, inputType, isRequired, defaultValue, options } = condition;
            const value = conditionValues[key] ?? defaultValue ?? '';

            switch (inputType) {
                case 'number':
                    return (
                        <div key={key} className="tw-mb-3">
                            <label className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1 tw-block">
                                {label} {isRequired && <span className="tw-text-red-500">*</span>}
                            </label>
                            <NumberBox
                                value={typeof value === 'number' ? value : parseFloat(value) || null}
                                onValueChanged={(e) => handleConditionChange(key, e.value)}
                                showSpinButtons={true}
                                width="100%"
                            />
                        </div>
                    );
                case 'select':
                    return (
                        <div key={key} className="tw-mb-3">
                            <label className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1 tw-block">
                                {label} {isRequired && <span className="tw-text-red-500">*</span>}
                            </label>
                            <SelectBox
                                items={options || []}
                                value={value}
                                onValueChanged={(e) => handleConditionChange(key, e.value)}
                                placeholder={`Select ${label}`}
                                showClearButton={!isRequired}
                                width="100%"
                            />
                        </div>
                    );
                case 'time':
                    return (
                        <div key={key} className="tw-mb-3">
                            <label className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1 tw-block">
                                {label} {isRequired && <span className="tw-text-red-500">*</span>}
                            </label>
                            <DateBox
                                type="time"
                                value={value ? `2000-01-01T${value}:00` : null}
                                onValueChanged={(e) => {
                                    if (e.value) {
                                        const d = new Date(e.value);
                                        const hh = String(d.getHours()).padStart(2, '0');
                                        const mm = String(d.getMinutes()).padStart(2, '0');
                                        handleConditionChange(key, `${hh}:${mm}`);
                                    } else {
                                        handleConditionChange(key, null);
                                    }
                                }}
                                displayFormat="HH:mm"
                                placeholder="Select time"
                                showClearButton={!isRequired}
                                width="100%"
                            />
                        </div>
                    );
                case 'boolean':
                    return (
                        <div key={key} className="tw-mb-3 tw-flex tw-items-center tw-justify-between">
                            <label className="tw-text-sm tw-font-medium tw-text-gray-700">
                                {label}
                            </label>
                            <input
                                type="checkbox"
                                checked={!!value}
                                onChange={(e) => handleConditionChange(key, e.target.checked)}
                                className="tw-h-4 tw-w-4 tw-cursor-pointer"
                            />
                        </div>
                    );
                default:
                    return (
                        <div key={key} className="tw-mb-3">
                            <label className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1 tw-block">
                                {label} {isRequired && <span className="tw-text-red-500">*</span>}
                            </label>
                            <TextBox
                                value={String(value)}
                                onValueChanged={(e) => handleConditionChange(key, e.value)}
                                placeholder={`Enter ${label}`}
                                width="100%"
                            />
                        </div>
                    );
            }
        },
        [conditionValues, handleConditionChange]
    );

    // ─── Submit: create/update policy first, then save expression ───
    const handleSubmit = useCallback(
        async (e) => {
            const validationGroup = e.validationGroup;
            if (validationGroup) {
                const validationResult = validationGroup.validate();
                if (!validationResult.isValid) return;
            }

            try {
                // 1. Build policy payload
                const policyPayload = {
                    name: `${formData.name} - Policy`,
                    description: `Auto-managed policy for expression: ${formData.name}`,
                    notificationType: 'Alert',
                    alertTypeKey: formData.eventType || null,
                    category: selectedTypeMetadata?.category || null,
                    priority: formData.priority,
                    enableEmail: policyData.enableEmail,
                    enableSms: policyData.enableSms,
                    enableSystem: policyData.enableSystem,
                    maxNotificationsPerHour: policyData.maxNotificationsPerHour || 10,
                    maxNotificationsPerDay: formData.maxNotificationsPerDay || 50,
                    cooldownMinutes: formData.cooldownMinutes || 30,
                    titleTemplate:
                        policyData.titleTemplate || 'Alert: {{alarmType}} - {{severity}}',
                    messageTemplate:
                        formData.messageTemplate ||
                        '{{alarmType}} triggered at {{siteName}} with severity {{severity}}',
                    requireAcknowledgment: policyData.requireAcknowledgment,
                    isActive: policyData.isActive,
                    recipientUserIds: selectedUserIds,
                    recipientRules: JSON.stringify(recipientRules)
                };

                let policyId = formData.notificationPolicyId;

                // 2. Create or update the linked notification policy
                if (policyId) {
                    const updateRes = await notificationsApi.updatePolicy(policyId, policyPayload);
                    if (!updateRes.isSuccess) {
                        notify('Failed to update notification policy', 'error', 4000);
                        return;
                    }
                } else {
                    const createRes = await notificationsApi.createPolicy(policyPayload);
                    if (!createRes.isSuccess || !createRes.data?.id) {
                        notify('Failed to create notification policy', 'error', 4000);
                        return;
                    }
                    policyId = createRes.data.id;
                }

                // 3. Resolve real eventType from metadata (alertTypeKey → eventType)
                const resolvedEventType = selectedTypeMetadata?.eventType || formData.eventType;

                // Include _alertTypeKey in conditions for edit-recovery
                let conditionsObj = {};
                try {
                    conditionsObj = typeof formData.conditions === 'string'
                        ? JSON.parse(formData.conditions)
                        : (formData.conditions || {});
                } catch { conditionsObj = {}; }
                conditionsObj._alertTypeKey = formData.eventType;

                // Store multi-site and multi-tank selections in conditions for recovery
                if (formData.siteIds?.length > 0) {
                    conditionsObj._siteIds = formData.siteIds;
                }
                if (formData.tankIds?.length > 0) {
                    conditionsObj._tankIds = formData.tankIds;
                }

                // Store attach report flag
                if (formData.attachReport) {
                    conditionsObj._attachReport = true;
                }

                const expressionPayload = {
                    name: formData.name,
                    description: formData.description,
                    eventType: resolvedEventType,
                    siteId: formData.siteIds?.[0] ?? null,
                    tankId: formData.tankIds?.[0] ?? null,
                    deviceId: formData.deviceId,
                    minimumSeverity: formData.minimumSeverity,
                    conditions: JSON.stringify(conditionsObj),
                    notificationPolicyId: policyId,
                    cooldownMinutes: formData.cooldownMinutes,
                    maxNotificationsPerDay: formData.maxNotificationsPerDay,
                    maxNotificationsPerHour: formData.maxNotificationsPerHour,
                    priority: formData.priority,
                    createActiveEvent: formData.createActiveEvent,
                    messageTemplate: formData.messageTemplate,
                    isActive: formData.isActive
                };

                // 4. Save the expression
                let result;
                if (isEditing) {
                    result = await dispatch(
                        updateEventExpression({ id: parseInt(id), payload: expressionPayload })
                    ).unwrap();
                } else {
                    result = await dispatch(
                        createEventExpression(expressionPayload)
                    ).unwrap();
                }

                if (result?.isSuccess !== false) {
                    notify(
                        `Expression ${isEditing ? 'updated' : 'created'} successfully`,
                        'success',
                        3000
                    );
                    navigate('/event-expressions/expressions');
                }
            } catch (err) {
                notify(
                    err?.message || `Failed to ${isEditing ? 'update' : 'create'} expression`,
                    'error',
                    5000
                );
            }
        },
        [
            dispatch,
            formData,
            policyData,
            selectedUserIds,
            recipientRules,
            selectedTypeMetadata,
            id,
            isEditing,
            navigate
        ]
    );

    // ─── Loading state ───
    if (selectedLoading || typesLoading) {
        return (
            <div className="tw-flex tw-items-center tw-justify-center tw-h-64">
                <LoadIndicator visible={true} />
            </div>
        );
    }

    return (
        <div
            className="event-expression-form tw-p-4 tw-mx-auto"
            style={{ width: '95vw', maxWidth: '90rem' }}
        >
            {/* Header */}
            <div className="tw-flex tw-items-center tw-mb-6">
                <Button
                    text="Back to List"
                    icon="fa-light fa-arrow-left"
                    stylingMode="text"
                    onClick={handleCancel}
                />
            </div>

            <ValidationGroup>
                {/* Step navigation */}
                <div className="tw-mb-4 tw-flex tw-items-center tw-justify-between">
                    <span className="tw-text-sm tw-text-gray-600">
                        Step {activeStep + 1} of {STEP_TITLES.length}
                    </span>
                    <div className="tw-flex tw-gap-2">
                        <Button
                            text="Previous"
                            stylingMode="outlined"
                            icon="fa-light fa-arrow-left"
                            disabled={activeStep === 0}
                            onClick={handlePreviousStep}
                        />
                        <Button
                            text="Next"
                            stylingMode="outlined"
                            icon="fa-light fa-arrow-right"
                            disabled={activeStep === STEP_TITLES.length - 1}
                            onClick={handleNextStep}
                        />
                    </div>
                </div>

                <Accordion
                    className="event-expression-steps"
                    collapsible={false}
                    multiple={false}
                    selectedIndex={activeStep}
                    animationDuration={200}
                    onItemTitleClick={(e) => setActiveStep(e.itemIndex)}
                >
                    {/* Step 1: Basic Information */}
                    <AccordionItem title={STEP_TITLES[0]}>
                        <StepBasicInfo
                            formData={formData}
                            onFieldChange={handleFieldChange}
                        />
                    </AccordionItem>

                    {/* Step 2: Event Type & Triggers */}
                    <AccordionItem title={STEP_TITLES[1]}>
                        <StepEventTriggers
                            formData={formData}
                            onEventTypeChange={handleEventTypeChange}
                            expressionTypes={expressionTypes}
                            selectedTypeMetadata={selectedTypeMetadata}
                            availableConditions={availableConditions}
                            renderConditionField={renderConditionField}
                        />
                    </AccordionItem>

                    {/* Step 3: Scope */}
                    <AccordionItem title={STEP_TITLES[2]}>
                        <StepScope
                            formData={formData}
                            onFieldChange={handleFieldChange}
                            onSiteChange={handleSiteChange}
                            sites={sites}
                            tanks={scopeTanks}
                            loadingTanks={loadingScopeTanks}
                            availableScopeFilters={selectedTypeMetadata?.availableScopeFilters}
                        />
                    </AccordionItem>

                    {/* Step 4: Delivery & Notification */}
                    <AccordionItem title={STEP_TITLES[3]}>
                        <StepDelivery
                            policyData={policyData}
                            onPolicyChange={handlePolicyChange}
                            formData={formData}
                            onFieldChange={handleFieldChange}
                        />
                    </AccordionItem>

                    {/* Step 5: Recipients */}
                    <AccordionItem title={STEP_TITLES[4]}>
                        <StepRecipients
                            selectedUserIds={selectedUserIds}
                            onUserIdsChange={setSelectedUserIds}
                            recipientRules={recipientRules}
                            onRecipientRulesChange={setRecipientRules}
                            roles={roles}
                            sites={sites}
                            departments={departments}
                            loadingData={loadingRecipients}
                        />
                    </AccordionItem>

                    {/* Step 6: Message Template */}
                    <AccordionItem title={STEP_TITLES[5]}>
                        <StepMessageTemplate
                            formData={formData}
                            onFieldChange={handleFieldChange}
                            policyData={policyData}
                            onPolicyChange={handlePolicyChange}
                            selectedTypeMetadata={selectedTypeMetadata}
                        />
                    </AccordionItem>
                </Accordion>

                {/* Footer Actions */}
                <div className="tw-flex tw-items-center tw-justify-end tw-gap-3 tw-mt-6 tw-pt-4 tw-border-t tw-border-gray-200">
                    {saveError && (
                        <span className="tw-text-red-500 tw-text-sm tw-mr-auto">
                            <i className="fa-light fa-circle-exclamation tw-mr-1" />
                            {typeof saveError === 'string'
                                ? saveError
                                : saveError.message || 'Save failed'}
                        </span>
                    )}
                    <Button
                        text="Cancel"
                        stylingMode="outlined"
                        onClick={handleCancel}
                        disabled={saving}
                    />
                    <Button
                        text={
                            saving
                                ? 'Saving...'
                                : isEditing
                                    ? 'Update Expression'
                                    : 'Create Expression'
                        }
                        type="default"
                        stylingMode="contained"
                        icon={saving ? undefined : 'fa-light fa-check'}
                        disabled={saving}
                        useSubmitBehavior={false}
                        onClick={handleSubmit}
                    />
                </div>
            </ValidationGroup>
        </div>
    );
};

export default EventExpressionForm;
