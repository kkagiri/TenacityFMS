/**
 * File: EventExpressionForm.js
 * Purpose: Create/Edit form for Event Expressions. Dynamically renders condition
 *          fields based on the selected event type metadata from the backend.
 * Dependencies: react-redux, react-router-dom, devextreme-react, eventExpressionSlice
 * Last Modified: 2026-02-06
 *
 * Key Features:
 * - Dynamic condition fields based on event type selection
 * - Site/Tank scope selectors
 * - Notification policy picker
 * - Rate limiting controls (expression-level overrides)
 * - Cooldown and max notifications per day
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { TextBox } from 'devextreme-react/text-box';
import { TextArea } from 'devextreme-react/text-area';
import { SelectBox } from 'devextreme-react/select-box';
import { NumberBox } from 'devextreme-react/number-box';
import { Switch } from 'devextreme-react/switch';
import { Button } from 'devextreme-react/button';
import { TagBox } from 'devextreme-react/tag-box';
import { ValidationGroup } from 'devextreme-react/validation-group';
import {
    Validator,
    RequiredRule,
    StringLengthRule,
    RangeRule
} from 'devextreme-react/validator';
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
import { fetctTankbySiteId } from '../../../redux/actions/tankActions';
import { fetchNotificationPolicies } from '../../../redux/actions/notificationActions';
import './EventExpressionForm.scss';

const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];
const SEVERITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];

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

    // Form state
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
        priority: 'Medium',
        createActiveEvent: true,
        messageTemplate: '',
        isActive: true
    });

    // Condition field values (parsed from conditions JSON)
    const [conditionValues, setConditionValues] = useState({});

    // Lookup data from Redux store
    const sites = useSelector((state) => state.site?.sites || []);
    const tanks = useSelector((state) => state.tank?.tanks || []);
    const policies = useSelector((state) => state.notification?.notificationPolicies || []);

    // Load types and lookups on mount
    useEffect(() => {
        dispatch(fetchEventExpressionTypes());
        dispatch(fetchSiteList());
        dispatch(fetchNotificationPolicies());
        return () => {
            dispatch(clearSelectedExpression());
            dispatch(clearErrors());
        };
    }, [dispatch]);

    // Load expression data if editing
    useEffect(() => {
        if (isEditing) {
            dispatch(fetchEventExpressionById(parseInt(id)));
        }
    }, [dispatch, id, isEditing]);

    // Populate form when expression loads
    useEffect(() => {
        if (isEditing && selectedExpression) {
            setFormData({
                name: selectedExpression.name || '',
                description: selectedExpression.description || '',
                eventType: selectedExpression.eventType || '',
                siteIds: selectedExpression.siteId ? [selectedExpression.siteId] : [],
                tankIds: selectedExpression.tankId ? [selectedExpression.tankId] : [],
                deviceId: selectedExpression.deviceId,
                minimumSeverity: selectedExpression.minimumSeverity,
                conditions: selectedExpression.conditions || '{}',
                notificationPolicyId: selectedExpression.notificationPolicyId,
                cooldownMinutes: selectedExpression.cooldownMinutes || 30,
                maxNotificationsPerDay: selectedExpression.maxNotificationsPerDay || 0,
                priority: selectedExpression.priority || 'Medium',
                createActiveEvent: selectedExpression.createActiveEvent ?? true,
                messageTemplate: selectedExpression.messageTemplate || '',
                isActive: selectedExpression.isActive ?? true
            });

            // Parse existing conditions into field values
            try {
                const parsed = JSON.parse(selectedExpression.conditions || '{}');
                setConditionValues(parsed);
            } catch {
                setConditionValues({});
            }
        }
    }, [isEditing, selectedExpression]);

    // Load tanks when sites change
    useEffect(() => {
        if (formData.siteIds && formData.siteIds.length > 0) {
            // Load tanks for the first selected site (API supports single siteId)
            dispatch(fetctTankbySiteId(formData.siteIds[0]));
        }
    }, [dispatch, formData.siteIds]);

    // Get the selected event type metadata
    const selectedTypeMetadata = useMemo(() => {
        return expressionTypes.find((t) => t.eventType === formData.eventType) || null;
    }, [expressionTypes, formData.eventType]);

    // Available conditions for the selected type
    const availableConditions = useMemo(() => {
        return selectedTypeMetadata?.availableConditions || [];
    }, [selectedTypeMetadata]);

    const handleFieldChange = useCallback((field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    }, []);

    const handleConditionChange = useCallback(
        (key, value) => {
            setConditionValues((prev) => {
                const updated = { ...prev, [key]: value };
                // Also update the formData conditions JSON
                setFormData((fdPrev) => ({
                    ...fdPrev,
                    conditions: JSON.stringify(updated)
                }));
                return updated;
            });
        },
        []
    );

    const handleEventTypeChange = useCallback(
        (value) => {
            handleFieldChange('eventType', value);
            // Reset conditions when type changes
            setConditionValues({});
            setFormData((prev) => ({ ...prev, conditions: '{}' }));
        },
        [handleFieldChange]
    );

    const handleSubmit = useCallback(
        async (e) => {
            const validationGroup = e.validationGroup;
            if (!validationGroup) return;

            const validationResult = validationGroup.validate();
            if (!validationResult.isValid) return;

            try {
                const payload = { ...formData };
                // Ensure conditions is a valid JSON string
                if (typeof payload.conditions === 'object') {
                    payload.conditions = JSON.stringify(payload.conditions);
                }
                // Convert multi-select arrays to single values for backend
                payload.siteId = payload.siteIds?.[0] || null;
                payload.tankId = payload.tankIds?.[0] || null;
                delete payload.siteIds;
                delete payload.tankIds;

                let result;
                if (isEditing) {
                    result = await dispatch(
                        updateEventExpression({ id: parseInt(id), payload })
                    ).unwrap();
                } else {
                    result = await dispatch(createEventExpression(payload)).unwrap();
                }

                if (result?.isSuccess !== false) {
                    notify(
                        `Expression ${isEditing ? 'updated' : 'created'} successfully`,
                        'success',
                        3000
                    );
                    navigate('/event-expressions');
                }
            } catch (err) {
                notify(
                    err?.message || `Failed to ${isEditing ? 'update' : 'create'} expression`,
                    'error',
                    5000
                );
            }
        },
        [dispatch, formData, id, isEditing, navigate]
    );

    const handleCancel = useCallback(() => {
        navigate('/event-expressions');
    }, [navigate]);

    // Render a dynamic condition field based on its metadata
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
                case 'boolean':
                    return (
                        <div
                            key={key}
                            className="tw-mb-3 tw-flex tw-items-center tw-justify-between"
                        >
                            <label className="tw-text-sm tw-font-medium tw-text-gray-700">
                                {label}
                            </label>
                            <Switch
                                value={!!value}
                                onValueChanged={(e) => handleConditionChange(key, e.value)}
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

    if (selectedLoading || typesLoading) {
        return (
            <div className="tw-flex tw-items-center tw-justify-center tw-h-64">
                <LoadIndicator visible={true} />
            </div>
        );
    }

    return (
        <div className="event-expression-form tw-p-4 tw-max-w-4xl tw-mx-auto">
            {/* Header */}
            <div className="tw-flex tw-items-center tw-justify-between tw-mb-6">
                <div>
                    <h2 className="tw-text-xl tw-font-semibold tw-text-gray-800">
                        <i className="fa-light fa-waveform-lines tw-mr-2" />
                        {isEditing ? 'Edit Event Expression' : 'Create Event Expression'}
                    </h2>
                    <p className="tw-text-sm tw-text-gray-500 tw-mt-1">
                        {isEditing
                            ? 'Modify the event expression configuration'
                            : 'Define a new rule that triggers notifications when conditions are met'}
                    </p>
                </div>
                <Button
                    text="Back to List"
                    icon="fa-light fa-arrow-left"
                    stylingMode="text"
                    onClick={handleCancel}
                />
            </div>

            <ValidationGroup>
                <div className="tw-grid tw-grid-cols-2 tw-gap-6">
                    {/* ─── Left Column: Basic Info ─── */}
                    <div className="tw-space-y-4">
                        <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-4">
                            <h3 className="tw-text-base tw-font-semibold tw-text-gray-700 tw-mb-3">
                                <i className="fa-light fa-info-circle tw-mr-2" />
                                Basic Information
                            </h3>

                            <div className="tw-mb-3">
                                <label className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1 tw-block">
                                    Name <span className="tw-text-red-500">*</span>
                                </label>
                                <TextBox
                                    value={formData.name}
                                    onValueChanged={(e) => handleFieldChange('name', e.value)}
                                    placeholder="e.g., Low Tank Volume Alert"
                                    width="100%"
                                >
                                    <Validator>
                                        <RequiredRule message="Name is required" />
                                        <StringLengthRule max={100} message="Name must be under 100 characters" />
                                    </Validator>
                                </TextBox>
                            </div>

                            <div className="tw-mb-3">
                                <label className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1 tw-block">
                                    Description
                                </label>
                                <TextArea
                                    value={formData.description}
                                    onValueChanged={(e) => handleFieldChange('description', e.value)}
                                    placeholder="Describe what this expression monitors..."
                                    height={80}
                                    width="100%"
                                />
                            </div>

                            <div className="tw-mb-3">
                                <label className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1 tw-block">
                                    Event Type <span className="tw-text-red-500">*</span>
                                </label>
                                <SelectBox
                                    items={expressionTypes}
                                    displayExpr="displayName"
                                    valueExpr="eventType"
                                    value={formData.eventType}
                                    onValueChanged={(e) => handleEventTypeChange(e.value)}
                                    placeholder="Select event type"
                                    width="100%"
                                    searchEnabled={true}
                                    itemRender={(data) => (
                                        <div>
                                            <div className="tw-font-medium">{data.displayName}</div>
                                            <div className="tw-text-xs tw-text-gray-500">
                                                {data.description}
                                            </div>
                                        </div>
                                    )}
                                >
                                    <Validator>
                                        <RequiredRule message="Event type is required" />
                                    </Validator>
                                </SelectBox>
                            </div>

                            <div className="tw-grid tw-grid-cols-2 tw-gap-3">
                                <div>
                                    <label className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1 tw-block">
                                        Priority
                                    </label>
                                    <SelectBox
                                        items={PRIORITY_OPTIONS}
                                        value={formData.priority}
                                        onValueChanged={(e) => handleFieldChange('priority', e.value)}
                                        width="100%"
                                    />
                                </div>
                                <div>
                                    <label className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1 tw-block">
                                        Min. Severity
                                    </label>
                                    <SelectBox
                                        items={SEVERITY_OPTIONS}
                                        value={formData.minimumSeverity}
                                        onValueChanged={(e) =>
                                            handleFieldChange('minimumSeverity', e.value)
                                        }
                                        placeholder="Any"
                                        showClearButton={true}
                                        width="100%"
                                    />
                                </div>
                            </div>

                            <div className="tw-mt-3 tw-flex tw-items-center tw-justify-between">
                                <label className="tw-text-sm tw-font-medium tw-text-gray-700">
                                    Active
                                </label>
                                <Switch
                                    value={formData.isActive}
                                    onValueChanged={(e) => handleFieldChange('isActive', e.value)}
                                />
                            </div>
                        </div>

                        {/* ─── Scope ─── */}
                        <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-4">
                            <h3 className="tw-text-base tw-font-semibold tw-text-gray-700 tw-mb-3">
                                <i className="fa-light fa-bullseye tw-mr-2" />
                                Scope (Optional)
                            </h3>
                            <p className="tw-text-xs tw-text-gray-500 tw-mb-3">
                                Leave blank to apply to all sites/tanks
                            </p>

                            <div className="tw-mb-3">
                                <label className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1 tw-block">
                                    Site
                                </label>
                                <TagBox
                                    items={sites}
                                    displayExpr="name"
                                    valueExpr="siteId"
                                    value={formData.siteIds}
                                    onValueChanged={(e) => {
                                        handleFieldChange('siteIds', e.value || []);
                                        handleFieldChange('tankIds', []);
                                    }}
                                    placeholder="All Sites"
                                    showClearButton={true}
                                    searchEnabled={true}
                                    width="100%"
                                    multiline={false}
                                    showSelectionControls={true}
                                />
                            </div>

                            <div className="tw-mb-3">
                                <label className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1 tw-block">
                                    Tank
                                </label>
                                <TagBox
                                    items={tanks}
                                    displayExpr="name"
                                    valueExpr="id"
                                    value={formData.tankIds}
                                    onValueChanged={(e) => handleFieldChange('tankIds', e.value || [])}
                                    placeholder={formData.siteIds?.length > 0 ? 'All Tanks' : 'Select a site first'}
                                    showClearButton={true}
                                    searchEnabled={true}
                                    disabled={!formData.siteIds || formData.siteIds.length === 0}
                                    width="100%"
                                    multiline={false}
                                    showSelectionControls={true}
                                />
                            </div>
                        </div>
                    </div>

                    {/* ─── Right Column: Conditions + Actions ─── */}
                    <div className="tw-space-y-4">
                        {/* ─── Dynamic Conditions ─── */}
                        {selectedTypeMetadata && availableConditions.length > 0 && (
                            <div className="tw-bg-white tw-rounded-lg tw-border tw-border-blue-200 tw-p-4">
                                <h3 className="tw-text-base tw-font-semibold tw-text-blue-700 tw-mb-3">
                                    <i className="fa-light fa-sliders tw-mr-2" />
                                    Trigger Conditions ({selectedTypeMetadata.eventType})
                                </h3>
                                <p className="tw-text-xs tw-text-gray-500 tw-mb-3">
                                    Configure the conditions that must be met to trigger this expression
                                </p>
                                {availableConditions.map(renderConditionField)}
                            </div>
                        )}

                        {/* ─── Notification Policy ─── */}
                        <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-4">
                            <h3 className="tw-text-base tw-font-semibold tw-text-gray-700 tw-mb-3">
                                <i className="fa-light fa-bell tw-mr-2" />
                                Notification
                            </h3>

                            <div className="tw-mb-3">
                                <label className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1 tw-block">
                                    Notification Policy <span className="tw-text-red-500">*</span>
                                </label>
                                <SelectBox
                                    items={policies}
                                    displayExpr="name"
                                    valueExpr="id"
                                    value={formData.notificationPolicyId}
                                    onValueChanged={(e) =>
                                        handleFieldChange('notificationPolicyId', e.value)
                                    }
                                    placeholder="Select policy"
                                    searchEnabled={true}
                                    width="100%"
                                >
                                    <Validator>
                                        <RequiredRule message="Notification policy is required" />
                                    </Validator>
                                </SelectBox>
                            </div>

                            <div className="tw-mb-3">
                                <label className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1 tw-block">
                                    Message Template
                                </label>
                                <TextArea
                                    value={formData.messageTemplate}
                                    onValueChanged={(e) =>
                                        handleFieldChange('messageTemplate', e.value)
                                    }
                                    placeholder="e.g., Tank {TankName} volume is {ActualValue}L (threshold: {ThresholdValue}L)"
                                    height={60}
                                    width="100%"
                                />
                            </div>

                            <div className="tw-flex tw-items-center tw-justify-between tw-mb-3">
                                <label className="tw-text-sm tw-font-medium tw-text-gray-700">
                                    Create Active Event
                                </label>
                                <Switch
                                    value={formData.createActiveEvent}
                                    onValueChanged={(e) =>
                                        handleFieldChange('createActiveEvent', e.value)
                                    }
                                />
                            </div>
                        </div>

                        {/* ─── Rate Limiting (expression-level override) ─── */}
                        <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-4">
                            <h3 className="tw-text-base tw-font-semibold tw-text-gray-700 tw-mb-3">
                                <i className="fa-light fa-gauge-high tw-mr-2" />
                                Rate Limiting
                            </h3>
                            <p className="tw-text-xs tw-text-gray-500 tw-mb-3">
                                Overrides the notification policy's rate limits for this expression
                            </p>

                            <div className="tw-grid tw-grid-cols-2 tw-gap-3">
                                <div>
                                    <label className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1 tw-block">
                                        Cooldown (minutes)
                                    </label>
                                    <NumberBox
                                        value={formData.cooldownMinutes}
                                        onValueChanged={(e) =>
                                            handleFieldChange('cooldownMinutes', e.value)
                                        }
                                        min={0}
                                        max={1440}
                                        showSpinButtons={true}
                                        width="100%"
                                    >
                                        <Validator>
                                            <RangeRule min={0} max={1440} message="0-1440 minutes" />
                                        </Validator>
                                    </NumberBox>
                                </div>
                                <div>
                                    <label className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1 tw-block">
                                        Max/Day (0=unlimited)
                                    </label>
                                    <NumberBox
                                        value={formData.maxNotificationsPerDay}
                                        onValueChanged={(e) =>
                                            handleFieldChange('maxNotificationsPerDay', e.value)
                                        }
                                        min={0}
                                        max={1000}
                                        showSpinButtons={true}
                                        width="100%"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── Footer Actions ─── */}
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
                        text={saving ? 'Saving...' : isEditing ? 'Update Expression' : 'Create Expression'}
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
