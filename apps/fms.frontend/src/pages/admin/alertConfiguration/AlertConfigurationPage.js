/**
 * File: AlertConfigurationPage.js
 * Purpose: Admin page for configuring vehicle monitoring alerts:
 *   1. GPS Online Checking — offline threshold, auto-create/auto-close settings
 *   2. Fuel Activity + GPS Offline — fuel window, GPS offline threshold
 * Dependencies: React, DevExtreme, issueTrackerV2Service
 * Last Modified: 2026-02-10
 *
 * Key Functions:
 * - loadData: Fetches templates, device types, auto-close configs, users
 * - handleSave: Persists template + auto-close config changes
 */
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NumberBox } from 'devextreme-react/number-box';
import { TagBox } from 'devextreme-react/tag-box';
import { TextArea } from 'devextreme-react/text-area';
import { Button } from 'devextreme-react/button';
import LoadIndicator from 'devextreme-react/load-indicator';
import notify from 'devextreme/ui/notify';
import issueTrackerV2Service from '../../../services/issueTrackerV2Service';
import { fetchUsers } from '../../../redux/actions/userActions';
import './AlertConfigurationPage.scss';

// Device type names mapped to monitoring scenarios
const GPS_DEVICE_TYPES = ['vehicle', 'gps', 'gps device', 'gps_device'];
const FUEL_DEVICE_TYPES = ['fuel', 'fuel activity', 'fuel_activity', 'no_fuel'];

/** Stable empty array to avoid new reference on each render */
const EMPTY_ARRAY = [];

/** Duration unit multipliers (to minutes) */
const DURATION_UNITS = [
    { key: 'minutes', label: 'Min', factor: 1 },
    { key: 'hours', label: 'Hrs', factor: 60 },
    { key: 'days', label: 'Days', factor: 1440 },
];

/**
 * Auto-detect the best unit for a given minutes value
 */
const detectBestUnit = (totalMinutes) => {
    if (!totalMinutes || totalMinutes <= 0) return 'minutes';
    if (totalMinutes % 1440 === 0) return 'days';
    if (totalMinutes % 60 === 0) return 'hours';
    return 'minutes';
};

/**
 * Duration input with unit selector (minutes / hours / days).
 * Stores & emits the value in minutes internally.
 */
const DurationInput = ({ totalMinutes, onChange, min = 1, max = 10080 }) => {
    const [unit, setUnit] = React.useState(() => detectBestUnit(totalMinutes));

    const unitObj = DURATION_UNITS.find((u) => u.key === unit) || DURATION_UNITS[0];
    const displayValue = totalMinutes ? +(totalMinutes / unitObj.factor).toFixed(2) : '';

    const handleValueChange = (e) => {
        const raw = e.value;
        if (raw == null) return;
        const asMinutes = Math.round(raw * unitObj.factor);
        onChange(Math.max(min, Math.min(max, asMinutes)));
    };

    const handleUnitChange = (newUnit) => {
        setUnit(newUnit);
    };

    // Compute display-friendly min/max for the current unit
    const displayMin = +(min / unitObj.factor).toFixed(2);
    const displayMax = +(max / unitObj.factor).toFixed(2);

    return (
        <div>
            <div className="tw-flex tw-items-stretch tw-gap-0">
                <div className="tw-flex-1">
                    <NumberBox
                        value={displayValue || displayMin}
                        onValueChanged={handleValueChange}
                        min={displayMin}
                        max={displayMax}
                        showSpinButtons={true}
                        step={unit === 'minutes' ? 5 : unit === 'hours' ? 0.5 : 0.5}
                        format={unit === 'minutes' ? '#,##0' : '#,##0.##'}
                    />
                </div>
                <div className="tw-inline-flex tw-rounded-md tw-shadow-sm tw-border tw-border-gray-300 tw-overflow-hidden tw-self-stretch">
                    {DURATION_UNITS.map((u, idx) => (
                        <button
                            key={u.key}
                            type="button"
                            onClick={() => handleUnitChange(u.key)}
                            className={`tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold tw-transition-all tw-duration-150 tw-cursor-pointer
                                ${idx > 0 ? 'tw-border-l tw-border-gray-300' : ''}
                                ${unit === u.key
                                    ? 'tw-bg-blue-600 tw-text-white tw-shadow-inner'
                                    : 'tw-bg-white tw-text-gray-600 hover:tw-bg-gray-100 active:tw-bg-gray-200'
                                }`}
                        >
                            {u.label}
                        </button>
                    ))}
                </div>
            </div>
            <p className="tw-text-xs tw-text-gray-400 tw-mt-1">
                {totalMinutes ? (
                    <>
                        = {totalMinutes.toLocaleString()} min
                        {totalMinutes >= 60 && <> ({(totalMinutes / 60).toFixed(1)} hrs)</>}
                        {totalMinutes >= 1440 && <> ({(totalMinutes / 1440).toFixed(1)} days)</>}
                    </>
                ) : 'Set the offline threshold duration'}
            </p>
        </div>
    );
};

/**
 * Popover info panel — click the (i) icon to show/hide, click outside to dismiss.
 */
const InfoPopover = ({ children, color = 'blue' }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return;
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    const colors = {
        blue: { bg: 'tw-bg-blue-50', border: 'tw-border-blue-200', icon: 'tw-text-blue-500', text: 'tw-text-blue-700', ring: 'tw-ring-blue-300' },
        amber: { bg: 'tw-bg-amber-50', border: 'tw-border-amber-200', icon: 'tw-text-amber-500', text: 'tw-text-amber-700', ring: 'tw-ring-amber-300' },
    };
    const c = colors[color] || colors.blue;

    return (
        <span className="tw-relative tw-inline-block" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={`tw-w-5 tw-h-5 tw-rounded-full tw-border tw-flex tw-items-center tw-justify-center tw-cursor-pointer tw-transition-all
                    ${open ? `${c.bg} ${c.border} tw-ring-2 ${c.ring}` : `tw-bg-white tw-border-gray-300 hover:${c.bg} hover:${c.border}`}`}
                title="Click for more info"
            >
                <i className={`fa-light fa-info tw-text-[10px] ${c.icon}`}></i>
            </button>
            {open && (
                <div className={`tw-absolute tw-z-50 tw-mt-2 tw-left-1/2 tw--translate-x-1/2 tw-w-72 tw-p-3 tw-rounded-lg tw-border ${c.border} ${c.bg} tw-shadow-lg tw-animate-in tw-fade-in`}
                    style={{ animation: 'fadeIn 150ms ease-out' }}>
                    <div className={`tw-text-xs ${c.text} tw-leading-relaxed`}>
                        {children}
                    </div>
                    <div className={`tw-absolute tw--top-1.5 tw-left-1/2 tw--translate-x-1/2 tw-w-3 tw-h-3 tw-rotate-45 ${c.bg} tw-border-l tw-border-t ${c.border}`}></div>
                </div>
            )}
        </span>
    );
};

/**
 * Custom toggle switch component (replaces DevExtreme Switch)
 */
const ToggleSwitch = ({ checked, onChange, disabled = false, label = '' }) => (
    <label className="toggle-switch" title={label}>
        <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
        />
        <span className="toggle-slider"></span>
    </label>
);

/**
 * Parse comma-separated user IDs from DefaultAssignee field
 */
const parseAssigneeIds = (value) => {
    if (!value) return EMPTY_ARRAY;
    return value.split(',').map((id) => id.trim()).filter(Boolean);
};

/**
 * Serialize array of user IDs to comma-separated string
 */
const serializeAssigneeIds = (ids) => {
    if (!ids || ids.length === 0) return null;
    return ids.join(',');
};

const AlertConfigurationPage = () => {
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(true);
    const [savingGps, setSavingGps] = useState(false);
    const [savingFuel, setSavingFuel] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [deviceTypes, setDeviceTypes] = useState([]);
    const [autoCloseConfigs, setAutoCloseConfigs] = useState([]);

    // GPS Offline monitoring config
    const [gpsTemplate, setGpsTemplate] = useState(null);
    const [gpsAutoClose, setGpsAutoClose] = useState(null);

    // Fuel + Offline monitoring config
    const [fuelTemplate, setFuelTemplate] = useState(null);
    const [fuelAutoClose, setFuelAutoClose] = useState(null);

    // Users for assignee dropdown - stable selector to avoid new reference
    const users = useSelector((state) => state.user?.users || EMPTY_ARRAY);

    // Memoize parsed assignee IDs so TagBox doesn't see new array references on each render
    const gpsAssigneeIds = useMemo(
        () => parseAssigneeIds(gpsTemplate?.defaultAssignee),
        [gpsTemplate?.defaultAssignee]
    );
    const fuelAssigneeIds = useMemo(
        () => parseAssigneeIds(fuelTemplate?.defaultAssignee),
        [fuelTemplate?.defaultAssignee]
    );

    // Ref to track whether the component has finished initial load (suppresses onValueChanged during hydration)
    const isHydrated = useRef(false);

    // Memoize parsed checker config JSON to avoid new objects each render
    const gpsCheckerConfig = useMemo(() => {
        if (!gpsAutoClose?.checkerConfigJson) return {};
        try { return JSON.parse(gpsAutoClose.checkerConfigJson); } catch { return {}; }
    }, [gpsAutoClose?.checkerConfigJson]);

    const fuelCheckerConfig = useMemo(() => {
        if (!fuelAutoClose?.checkerConfigJson) return {};
        try { return JSON.parse(fuelAutoClose.checkerConfigJson); } catch { return {}; }
    }, [fuelAutoClose?.checkerConfigJson]);

    // ===== Load Data =====
    const loadData = useCallback(async () => {
        isHydrated.current = false;
        setLoading(true);
        try {
            const [templatesRes, deviceTypesRes, autoCloseRes] = await Promise.all([
                issueTrackerV2Service.getTemplates(),
                issueTrackerV2Service.getDeviceTypes(),
                issueTrackerV2Service.getAutoCloseConfigs(),
            ]);

            const allTemplates = templatesRes?.data || templatesRes || [];
            const allDeviceTypes = deviceTypesRes?.data || deviceTypesRes || [];
            const allAutoClose = autoCloseRes?.data || autoCloseRes || [];

            setTemplates(allTemplates);
            setDeviceTypes(allDeviceTypes);
            setAutoCloseConfigs(allAutoClose);

            // Find GPS offline template
            const gpsDeviceTypeIds = allDeviceTypes
                .filter((dt) => GPS_DEVICE_TYPES.includes(dt.name?.toLowerCase()))
                .map((dt) => dt.id);

            const gpsTpl = allTemplates.find(
                (t) => gpsDeviceTypeIds.includes(t.deviceTypeId) && t.canAutoCreate
            ) || allTemplates.find((t) => gpsDeviceTypeIds.includes(t.deviceTypeId)) || null;

            setGpsTemplate(gpsTpl ? { ...gpsTpl } : null);

            if (gpsTpl) {
                const gpsAc = allAutoClose.find((ac) => ac.issueTemplateId === gpsTpl.id) || null;
                setGpsAutoClose(gpsAc ? { ...gpsAc } : null);
            }

            // Find Fuel + Offline template
            const fuelDeviceTypeIds = allDeviceTypes
                .filter((dt) => FUEL_DEVICE_TYPES.includes(dt.name?.toLowerCase()))
                .map((dt) => dt.id);

            const fuelTpl = allTemplates.find(
                (t) => fuelDeviceTypeIds.includes(t.deviceTypeId) && t.canAutoCreate
            ) || allTemplates.find((t) => fuelDeviceTypeIds.includes(t.deviceTypeId)) || null;

            setFuelTemplate(fuelTpl ? { ...fuelTpl } : null);

            if (fuelTpl) {
                const fuelAc = allAutoClose.find((ac) => ac.issueTemplateId === fuelTpl.id) || null;
                setFuelAutoClose(fuelAc ? { ...fuelAc } : null);
            }
        } catch (err) {
            console.error('Failed to load alert configuration:', err);
            notify({ message: 'Failed to load alert configuration', type: 'error', displayTime: 4000 });
        } finally {
            setLoading(false);
            // Allow a tick for React to settle state before accepting onValueChanged events
            setTimeout(() => { isHydrated.current = true; }, 0);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Load users once on mount - separate effect to avoid infinite loop
    useEffect(() => {
        if (!users || users.length === 0) {
            dispatch(fetchUsers());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatch]);

    // ===== DTO Builders (only include fields the backend expects) =====

    /**
     * Build a clean UpdateIssueTemplateDTO — strips read-only/response-only fields.
     * Maps to: UpdateIssueTemplateDTO { Id, DeviceTypeId, Name, TitleTemplate, DescriptionTemplate,
     *   DefaultPriorityId, DefaultStatusId, IsActive, CanAutoCreate, OfflineThresholdMinutes,
     *   DefaultAssignee, CooldownMinutes, CategoryIds }
     */
    const buildTemplatePayload = useCallback((template) => ({
        id: template.id,
        deviceTypeId: template.deviceTypeId,
        name: template.name,
        titleTemplate: template.titleTemplate || null,
        descriptionTemplate: template.descriptionTemplate || null,
        defaultPriorityId: template.defaultPriorityId || null,
        defaultStatusId: template.defaultStatusId || null,
        isActive: !!template.isActive,
        canAutoCreate: !!template.canAutoCreate,
        offlineThresholdMinutes: template.offlineThresholdMinutes || null,
        defaultAssignee: template.defaultAssignee || null,
        cooldownMinutes: template.cooldownMinutes || null,
        categoryIds: template.categoryIds || [],
    }), []);

    /**
     * Build a clean auto-close config DTO for the Upsert (POST) endpoint.
     * Maps to: CreateAutoCloseConfigDTO { IssueTemplateId, IsEnabled, CheckerType,
     *   CheckIntervalSeconds, CheckerConfigJson, AutoCloseWhenSatisfied }
     */
    const buildAutoClosePayload = useCallback((autoClose, templateId, defaultCheckerType) => ({
        issueTemplateId: templateId,
        isEnabled: !!autoClose.isEnabled,
        checkerType: autoClose.checkerType || defaultCheckerType,
        checkIntervalSeconds: autoClose.checkIntervalSeconds || 600,
        checkerConfigJson: autoClose.checkerConfigJson || JSON.stringify({ onlineThresholdMinutes: 15 }),
        autoCloseWhenSatisfied: autoClose.autoCloseWhenSatisfied ?? true,
    }), []);

    /** Validate template fields before saving */
    const validateTemplate = useCallback((template, label) => {
        const errors = [];
        if (!template.offlineThresholdMinutes || template.offlineThresholdMinutes < 1) {
            errors.push('Offline threshold must be at least 1 minute');
        }
        if (!template.name?.trim()) {
            errors.push('Template name is required');
        }
        if (errors.length > 0) {
            notify({ message: `${label}: ${errors.join('. ')}`, type: 'warning', displayTime: 4000 });
            return false;
        }
        return true;
    }, []);

    /**
     * Silent data refresh — re-fetches without showing the loading spinner.
     * Synchronises local state with the server after a save.
     */
    const refreshData = useCallback(async () => {
        try {
            isHydrated.current = false;
            const [templatesRes, deviceTypesRes, autoCloseRes] = await Promise.all([
                issueTrackerV2Service.getTemplates(),
                issueTrackerV2Service.getDeviceTypes(),
                issueTrackerV2Service.getAutoCloseConfigs(),
            ]);

            const allTemplates = templatesRes?.data || templatesRes || [];
            const allDeviceTypes = deviceTypesRes?.data || deviceTypesRes || [];
            const allAutoClose = autoCloseRes?.data || autoCloseRes || [];

            setTemplates(allTemplates);
            setDeviceTypes(allDeviceTypes);
            setAutoCloseConfigs(allAutoClose);

            // Re-resolve GPS template
            const gpsDeviceTypeIds = allDeviceTypes
                .filter((dt) => GPS_DEVICE_TYPES.includes(dt.name?.toLowerCase()))
                .map((dt) => dt.id);
            const gpsTpl = allTemplates.find(
                (t) => gpsDeviceTypeIds.includes(t.deviceTypeId) && t.canAutoCreate
            ) || allTemplates.find((t) => gpsDeviceTypeIds.includes(t.deviceTypeId)) || null;
            setGpsTemplate(gpsTpl ? { ...gpsTpl } : null);
            setGpsAutoClose(gpsTpl
                ? (allAutoClose.find((ac) => ac.issueTemplateId === gpsTpl.id) ? { ...allAutoClose.find((ac) => ac.issueTemplateId === gpsTpl.id) } : null)
                : null
            );

            // Re-resolve Fuel template
            const fuelDeviceTypeIds = allDeviceTypes
                .filter((dt) => FUEL_DEVICE_TYPES.includes(dt.name?.toLowerCase()))
                .map((dt) => dt.id);
            const fuelTpl = allTemplates.find(
                (t) => fuelDeviceTypeIds.includes(t.deviceTypeId) && t.canAutoCreate
            ) || allTemplates.find((t) => fuelDeviceTypeIds.includes(t.deviceTypeId)) || null;
            setFuelTemplate(fuelTpl ? { ...fuelTpl } : null);
            setFuelAutoClose(fuelTpl
                ? (allAutoClose.find((ac) => ac.issueTemplateId === fuelTpl.id) ? { ...allAutoClose.find((ac) => ac.issueTemplateId === fuelTpl.id) } : null)
                : null
            );
        } catch (err) {
            console.error('Failed to refresh alert configuration:', err);
        } finally {
            setTimeout(() => { isHydrated.current = true; }, 0);
        }
    }, []);

    // ===== Save Handlers =====

    const handleSaveGps = useCallback(async () => {
        if (!gpsTemplate) {
            notify({ message: 'No GPS monitoring template found. Create one in Issue Tracker Settings first.', type: 'warning', displayTime: 4000 });
            return;
        }
        if (!validateTemplate(gpsTemplate, 'GPS Config')) return;

        setSavingGps(true);
        try {
            // Step 1: Save template with clean DTO
            const templatePayload = buildTemplatePayload(gpsTemplate);
            await issueTrackerV2Service.updateTemplate(gpsTemplate.id, templatePayload, { silent: true });

            // Step 2: Save auto-close config via Upsert (POST) if user has configured it
            let autoCloseSuccess = true;
            if (gpsAutoClose) {
                try {
                    const autoClosePayload = buildAutoClosePayload(gpsAutoClose, gpsTemplate.id, 'Online');
                    // Always use upsert (POST) — backend handles create-or-update by templateId
                    await issueTrackerV2Service.createAutoCloseConfig(autoClosePayload, { silent: true });
                } catch (acErr) {
                    autoCloseSuccess = false;
                    console.error('Failed to save GPS auto-close config:', acErr);
                }
            }

            // Step 3: Single notification based on outcome
            if (autoCloseSuccess) {
                notify({ message: 'GPS monitoring configuration saved successfully', type: 'success', displayTime: 3000 });
            } else {
                notify({ message: 'GPS template saved, but auto-close configuration failed. Please try again.', type: 'warning', displayTime: 5000 });
            }

            // Step 4: Silent refresh
            await refreshData();
        } catch (err) {
            console.error('Failed to save GPS config:', err);
            notify({ message: err.message || 'Failed to save GPS configuration', type: 'error', displayTime: 4000 });
        } finally {
            setSavingGps(false);
        }
    }, [gpsTemplate, gpsAutoClose, buildTemplatePayload, buildAutoClosePayload, validateTemplate, refreshData]);

    const handleSaveFuel = useCallback(async () => {
        if (!fuelTemplate) {
            notify({ message: 'No Fuel monitoring template found. Create one in Issue Tracker Settings first.', type: 'warning', displayTime: 4000 });
            return;
        }
        if (!validateTemplate(fuelTemplate, 'Fuel Config')) return;

        setSavingFuel(true);
        try {
            // Step 1: Save template with clean DTO
            const templatePayload = buildTemplatePayload(fuelTemplate);
            await issueTrackerV2Service.updateTemplate(fuelTemplate.id, templatePayload, { silent: true });

            // Step 2: Save auto-close config via Upsert (POST) if user has configured it
            let autoCloseSuccess = true;
            if (fuelAutoClose) {
                try {
                    const autoClosePayload = buildAutoClosePayload(fuelAutoClose, fuelTemplate.id, 'FuelActivity');
                    await issueTrackerV2Service.createAutoCloseConfig(autoClosePayload, { silent: true });
                } catch (acErr) {
                    autoCloseSuccess = false;
                    console.error('Failed to save fuel auto-close config:', acErr);
                }
            }

            // Step 3: Single notification based on outcome
            if (autoCloseSuccess) {
                notify({ message: 'Fuel activity monitoring configuration saved successfully', type: 'success', displayTime: 3000 });
            } else {
                notify({ message: 'Fuel template saved, but auto-close configuration failed. Please try again.', type: 'warning', displayTime: 5000 });
            }

            // Step 4: Silent refresh
            await refreshData();
        } catch (err) {
            console.error('Failed to save fuel config:', err);
            notify({ message: err.message || 'Failed to save fuel configuration', type: 'error', displayTime: 4000 });
        } finally {
            setSavingFuel(false);
        }
    }, [fuelTemplate, fuelAutoClose, buildTemplatePayload, buildAutoClosePayload, validateTemplate, refreshData]);

    // ===== Field update helpers (guarded against no-op updates) =====
    const updateGpsField = useCallback((field, value) => {
        if (!isHydrated.current) return;
        setGpsTemplate((prev) => {
            if (!prev) return prev;
            if (prev[field] === value) return prev; // no-op guard
            return { ...prev, [field]: value };
        });
    }, []);

    const updateGpsAutoClose = useCallback((field, value) => {
        if (!isHydrated.current) return;
        setGpsAutoClose((prev) => {
            if (!prev) {
                return { checkerType: 'Online', isEnabled: true, autoCloseWhenSatisfied: true, [field]: value };
            }
            if (prev[field] === value) return prev;
            return { ...prev, [field]: value };
        });
    }, []);

    const updateFuelField = useCallback((field, value) => {
        if (!isHydrated.current) return;
        setFuelTemplate((prev) => {
            if (!prev) return prev;
            if (prev[field] === value) return prev;
            return { ...prev, [field]: value };
        });
    }, []);

    const updateFuelAutoClose = useCallback((field, value) => {
        if (!isHydrated.current) return;
        setFuelAutoClose((prev) => {
            if (!prev) {
                return { checkerType: 'FuelActivity', isEnabled: true, autoCloseWhenSatisfied: true, [field]: value };
            }
            if (prev[field] === value) return prev;
            return { ...prev, [field]: value };
        });
    }, []);

    const parseCheckerConfigJson = useCallback((config) => {
        if (!config?.checkerConfigJson) return {};
        try {
            return JSON.parse(config.checkerConfigJson);
        } catch {
            return {};
        }
    }, []);

    const updateCheckerConfigField = useCallback((setter, config, field, value) => {
        if (!isHydrated.current) return;
        const existing = parseCheckerConfigJson(config);
        if (existing[field] === value) return; // no-op guard
        const updated = { ...existing, [field]: value };
        setter('checkerConfigJson', JSON.stringify(updated));
    }, [parseCheckerConfigJson]);

    // ===== Auto-Setup: Create missing device type + template =====
    const handleSetupGps = useCallback(async () => {
        setSavingGps(true);
        try {
            // Find or create GPS Device type
            let gpsDeviceTypeId = null;
            const existingGpsDt = deviceTypes.find((dt) => GPS_DEVICE_TYPES.includes(dt.name?.toLowerCase()));
            if (existingGpsDt) {
                gpsDeviceTypeId = existingGpsDt.id;
            } else {
                const dtRes = await issueTrackerV2Service.createDeviceType({ name: 'GPS Device', description: 'Vehicle GPS tracking device', isMonitored: true }, { silent: true });
                gpsDeviceTypeId = dtRes?.data?.id || dtRes?.id;
            }

            if (!gpsDeviceTypeId) throw new Error('Failed to resolve GPS device type ID');

            // Create the template
            await issueTrackerV2Service.createTemplate({
                deviceTypeId: gpsDeviceTypeId,
                name: 'GPS Offline',
                titleTemplate: 'GPS Offline - {vehicleName}',
                descriptionTemplate: 'Vehicle GPS device has been offline. Last seen: {lastSeen}.',
                canAutoCreate: true,
                isActive: true,
                offlineThresholdMinutes: 60,
            }, { silent: true });

            notify({ message: 'GPS monitoring template created successfully', type: 'success', displayTime: 3000 });
            await loadData();
        } catch (err) {
            console.error('Failed to setup GPS monitoring:', err);
            notify({ message: 'Failed to create GPS monitoring template', type: 'error', displayTime: 4000 });
        } finally {
            setSavingGps(false);
        }
    }, [deviceTypes, loadData]);

    const handleSetupFuel = useCallback(async () => {
        setSavingFuel(true);
        try {
            // Create a "fuel_activity" device type
            let fuelDeviceTypeId = null;
            const existingFuelDt = deviceTypes.find((dt) => FUEL_DEVICE_TYPES.includes(dt.name?.toLowerCase()));
            if (existingFuelDt) {
                fuelDeviceTypeId = existingFuelDt.id;
            } else {
                const dtRes = await issueTrackerV2Service.createDeviceType({ name: 'fuel_activity', description: 'Fuel activity + GPS offline monitoring', isMonitored: true }, { silent: true });
                fuelDeviceTypeId = dtRes?.data?.id || dtRes?.id;
            }

            if (!fuelDeviceTypeId) throw new Error('Failed to resolve fuel activity device type ID');

            // Create the template
            await issueTrackerV2Service.createTemplate({
                deviceTypeId: fuelDeviceTypeId,
                name: 'Fuel Activity While GPS Offline',
                titleTemplate: 'Fuel Activity While GPS Offline - {vehicleName}',
                descriptionTemplate: 'Vehicle {vehicleName} (Status: {vehicleStatus}) has fuel activity in the last {thresholdDays} days but the GPS device is offline. Last GPS seen: {lastSeen}. This may indicate GPS tampering or device failure.',
                canAutoCreate: true,
                isActive: true,
                offlineThresholdMinutes: 60,
            }, { silent: true });

            notify({ message: 'Fuel activity monitoring template created successfully', type: 'success', displayTime: 3000 });
            await loadData();
        } catch (err) {
            console.error('Failed to setup fuel monitoring:', err);
            notify({ message: 'Failed to create fuel monitoring template', type: 'error', displayTime: 4000 });
        } finally {
            setSavingFuel(false);
        }
    }, [deviceTypes, loadData]);

    // ===== Render =====
    if (loading) {
        return (
            <div className="tw-flex tw-items-center tw-justify-center tw-h-64">
                <LoadIndicator />
            </div>
        );
    }

    return (
        <div className="alert-config-page tw-p-6 tw-max-w-5xl tw-mx-auto">
            <div className="tw-mb-6">
                <h2 className="tw-text-xl tw-font-semibold tw-text-gray-800 tw-mb-1">
                    <i className="fa-light fa-bell-exclamation tw-mr-2 tw-text-orange-500"></i>
                    Alert Configuration
                </h2>
                <p className="tw-text-sm tw-text-gray-500">
                    Configure vehicle monitoring alerts for GPS offline detection and fuel activity validation.
                </p>
            </div>

            {/* ===== GPS Online Checking Card ===== */}
            <div className="config-card tw-mb-6 tw-border tw-rounded-xl tw-bg-white tw-shadow-sm">
                <div className="tw-flex tw-items-center tw-justify-between tw-px-6 tw-py-4 tw-border-b tw-bg-gradient-to-r tw-from-blue-50 tw-to-white tw-rounded-t-xl">
                    <div className="tw-flex tw-items-center tw-gap-3">
                        <div className="tw-w-10 tw-h-10 tw-rounded-lg tw-bg-blue-100 tw-flex tw-items-center tw-justify-center">
                            <i className="fa-light fa-satellite-dish tw-text-blue-600 tw-text-lg"></i>
                        </div>
                        <div>
                            <h3 className="tw-text-base tw-font-semibold tw-text-gray-800">GPS Online Checking</h3>
                            <p className="tw-text-xs tw-text-gray-500">Monitor vehicle GPS devices and create issues when they go offline</p>
                        </div>
                    </div>
                    {gpsTemplate && (
                        <ToggleSwitch
                            checked={!!gpsTemplate.canAutoCreate}
                            onChange={(val) => updateGpsField('canAutoCreate', val)}
                            label="Enable GPS offline monitoring"
                        />
                    )}
                </div>

                {!gpsTemplate ? (
                    <div className="tw-p-6 tw-text-center tw-text-gray-400">
                        <i className="fa-light fa-satellite-dish tw-text-4xl tw-mb-3 tw-block"></i>
                        <p className="tw-text-sm tw-mb-4">No GPS monitoring template configured yet.</p>
                        <Button
                            text={savingGps ? 'Creating...' : 'Setup GPS Monitoring'}
                            type="default"
                            stylingMode="contained"
                            icon="fa-light fa-plus"
                            onClick={handleSetupGps}
                            disabled={savingGps}
                        />
                    </div>
                ) : (
                    <div className="tw-p-6">
                        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-6">
                            {/* Offline Threshold */}
                            <div>
                                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                                    <i className="fa-light fa-clock tw-mr-1 tw-text-gray-400"></i>
                                    Offline Threshold
                                </label>
                                <DurationInput
                                    totalMinutes={gpsTemplate.offlineThresholdMinutes || 60}
                                    onChange={(mins) => updateGpsField('offlineThresholdMinutes', mins)}
                                    min={5}
                                    max={10080}
                                />
                                <p className="tw-text-xs tw-text-amber-600 tw-mt-1">
                                    <i className="fa-light fa-arrow-turn-down-right tw-mr-1"></i>
                                    Overrides the global <em>VehicleOfflineThresholdMinutes</em> in System Config for this template.
                                    If not set, the System Config value is used as fallback.
                                </p>
                            </div>

                            {/* Cooldown Period */}
                            <div>
                                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                                    <i className="fa-light fa-hourglass-clock tw-mr-1 tw-text-gray-400"></i>
                                    Cooldown Period
                                    <InfoPopover color="blue">
                                        After an issue is auto-closed, the system will <strong>not</strong> create a new issue
                                        for the same vehicle until this cooldown period has elapsed.
                                        Set to <strong>0</strong> or leave empty to disable (issues can be re-created immediately).
                                    </InfoPopover>
                                </label>
                                <DurationInput
                                    totalMinutes={gpsTemplate.cooldownMinutes || 0}
                                    onChange={(mins) => updateGpsField('cooldownMinutes', mins || null)}
                                    min={0}
                                    max={10080}
                                />
                                <p className="tw-text-xs tw-text-gray-400 tw-mt-1">
                                    Prevents repeated issue creation for the same vehicle after auto-close
                                </p>
                            </div>

                            {/* Default Assignees (multi-select) */}
                            <div>
                                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                                    <i className="fa-light fa-users tw-mr-1 tw-text-gray-400"></i>
                                    Default Assignees
                                </label>
                                <TagBox
                                    dataSource={users}
                                    displayExpr="userName"
                                    valueExpr="id"
                                    value={gpsAssigneeIds}
                                    onValueChanged={(e) => updateGpsField('defaultAssignee', serializeAssigneeIds(e.value))}
                                    placeholder="Select assignees..."
                                    showClearButton={true}
                                    searchEnabled={true}
                                    multiline={true}
                                    showSelectionControls={true}
                                    applyValueMode="useButtons"
                                    maxDisplayedTags={3}
                                />
                                <p className="tw-text-xs tw-text-gray-400 tw-mt-1">
                                    First selected user will be the primary assignee for auto-created issues
                                </p>
                            </div>

                            {/* Title Template */}
                            <div className="md:tw-col-span-2">
                                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                                    <i className="fa-light fa-heading tw-mr-1 tw-text-gray-400"></i>
                                    Issue Title Template
                                </label>
                                <TextArea
                                    value={gpsTemplate.titleTemplate || 'GPS Offline - {vehicleName}'}
                                    onValueChanged={(e) => updateGpsField('titleTemplate', e.value)}
                                    height={40}
                                    placeholder="GPS Offline - {vehicleName}"
                                />
                                <p className="tw-text-xs tw-text-gray-400 tw-mt-1">
                                    Placeholders: {'{vehicleName}'}, {'{vehicleStatus}'}
                                </p>
                            </div>

                            {/* Description Template */}
                            <div className="md:tw-col-span-2">
                                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                                    <i className="fa-light fa-align-left tw-mr-1 tw-text-gray-400"></i>
                                    Issue Description Template
                                </label>
                                <TextArea
                                    value={gpsTemplate.descriptionTemplate || 'Vehicle {vehicleName} GPS device has been offline. Last seen: {lastSeen}. Vehicle status: {vehicleStatus}.'}
                                    onValueChanged={(e) => updateGpsField('descriptionTemplate', e.value)}
                                    height={60}
                                    placeholder="Vehicle GPS device has been offline. Last seen: {lastSeen}."
                                />
                                <p className="tw-text-xs tw-text-gray-400 tw-mt-1">
                                    Placeholders: {'{vehicleName}'}, {'{vehicleStatus}'}, {'{lastSeen}'}, {'{thresholdMinutes}'}
                                </p>
                            </div>
                        </div>

                        {/* Auto-Close Section */}
                        <div className="tw-mt-6 tw-pt-4 tw-border-t">
                            <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
                                <div>
                                    <h4 className="tw-text-sm tw-font-semibold tw-text-gray-700 tw-flex tw-items-center tw-gap-1.5">
                                        <i className="fa-light fa-rotate tw-mr-1"></i> Auto-Close Settings
                                        <InfoPopover color="blue">
                                            When enabled, the system periodically checks whether the GPS device has come back online.
                                            If the device stays online for at least the <strong>Online Threshold</strong> duration,
                                            the issue is automatically closed and a resolution note is added.
                                            The <strong>Check Interval</strong> controls how often the system checks &mdash;
                                            the shortest interval across all enabled auto-close configs is used.
                                        </InfoPopover>
                                    </h4>
                                    <p className="tw-text-xs tw-text-gray-400">Automatically close the issue when GPS comes back online</p>
                                </div>
                                <ToggleSwitch
                                    checked={gpsAutoClose?.isEnabled ?? false}
                                    onChange={(val) => updateGpsAutoClose('isEnabled', val)}
                                />
                            </div>
                            {gpsAutoClose?.isEnabled && (
                                <>
                                    <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
                                        <div>
                                            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                                                Online Threshold
                                            </label>
                                            <DurationInput
                                                totalMinutes={gpsCheckerConfig.onlineThresholdMinutes || 15}
                                                onChange={(mins) => updateCheckerConfigField(updateGpsAutoClose, gpsAutoClose, 'onlineThresholdMinutes', mins)}
                                                min={1}
                                                max={1440}
                                            />
                                            <p className="tw-text-xs tw-text-gray-400 tw-mt-1">
                                                How long GPS must stay online before the issue is closed
                                            </p>
                                        </div>
                                        <div>
                                            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                                                Check Interval (seconds)
                                            </label>
                                            <NumberBox
                                                value={gpsAutoClose.checkIntervalSeconds || 600}
                                                onValueChanged={(e) => updateGpsAutoClose('checkIntervalSeconds', e.value)}
                                                min={60}
                                                max={86400}
                                                showSpinButtons={true}
                                            />
                                            <p className="tw-text-xs tw-text-gray-400 tw-mt-1">
                                                How often the auto-close service runs to check open issues
                                            </p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="tw-flex tw-justify-end tw-mt-6">
                            <Button
                                text={savingGps ? 'Saving...' : 'Save GPS Configuration'}
                                type="default"
                                stylingMode="contained"
                                icon="fa-light fa-floppy-disk"
                                onClick={handleSaveGps}
                                disabled={savingGps}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* ===== Fuel Activity + GPS Offline Card ===== */}
            <div className="config-card tw-mb-6 tw-border tw-rounded-xl tw-bg-white tw-shadow-sm">
                <div className="tw-flex tw-items-center tw-justify-between tw-px-6 tw-py-4 tw-border-b tw-bg-gradient-to-r tw-from-amber-50 tw-to-white tw-rounded-t-xl">
                    <div className="tw-flex tw-items-center tw-gap-3">
                        <div className="tw-w-10 tw-h-10 tw-rounded-lg tw-bg-amber-100 tw-flex tw-items-center tw-justify-center">
                            <i className="fa-light fa-gas-pump tw-text-amber-600 tw-text-lg"></i>
                        </div>
                        <div>
                            <h3 className="tw-text-base tw-font-semibold tw-text-gray-800">Fuel Activity Validation</h3>
                            <p className="tw-text-xs tw-text-gray-500">Create issues when a vehicle has fuel activity but GPS is offline (suspicious)</p>
                        </div>
                    </div>
                    {fuelTemplate && (
                        <ToggleSwitch
                            checked={!!fuelTemplate.canAutoCreate}
                            onChange={(val) => updateFuelField('canAutoCreate', val)}
                            label="Enable fuel + GPS offline monitoring"
                        />
                    )}
                </div>

                {!fuelTemplate ? (
                    <div className="tw-p-6 tw-text-center tw-text-gray-400">
                        <i className="fa-light fa-gas-pump tw-text-4xl tw-mb-3 tw-block"></i>
                        <p className="tw-text-sm tw-mb-4">No fuel activity monitoring template configured yet.</p>
                        <Button
                            text={savingFuel ? 'Creating...' : 'Setup Fuel Activity Monitoring'}
                            type="default"
                            stylingMode="contained"
                            icon="fa-light fa-plus"
                            onClick={handleSetupFuel}
                            disabled={savingFuel}
                        />
                    </div>
                ) : (
                    <div className="tw-p-6">
                        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-6">
                            {/* GPS Offline Threshold for fuel check */}
                            <div>
                                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                                    <i className="fa-light fa-clock tw-mr-1 tw-text-gray-400"></i>
                                    GPS Offline Threshold
                                </label>
                                <DurationInput
                                    totalMinutes={fuelTemplate.offlineThresholdMinutes || 60}
                                    onChange={(mins) => updateFuelField('offlineThresholdMinutes', mins)}
                                    min={5}
                                    max={10080}
                                />
                                <p className="tw-text-xs tw-text-amber-600 tw-mt-1">
                                    <i className="fa-light fa-arrow-turn-down-right tw-mr-1"></i>
                                    Overrides the global <em>VehicleOfflineThresholdMinutes</em> in System Config for this template.
                                    If not set, the System Config value is used as fallback.
                                </p>
                            </div>

                            {/* Cooldown Period */}
                            <div>
                                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                                    <i className="fa-light fa-hourglass-clock tw-mr-1 tw-text-gray-400"></i>
                                    Cooldown Period
                                    <InfoPopover color="amber">
                                        After an issue is auto-closed, the system will <strong>not</strong> create a new issue
                                        for the same vehicle until this cooldown period has elapsed.
                                        Set to <strong>0</strong> or leave empty to disable (issues can be re-created immediately).
                                    </InfoPopover>
                                </label>
                                <DurationInput
                                    totalMinutes={fuelTemplate.cooldownMinutes || 0}
                                    onChange={(mins) => updateFuelField('cooldownMinutes', mins || null)}
                                    min={0}
                                    max={10080}
                                />
                                <p className="tw-text-xs tw-text-gray-400 tw-mt-1">
                                    Prevents repeated issue creation for the same vehicle after auto-close
                                </p>
                            </div>

                            {/* Default Assignees (multi-select) */}
                            <div>
                                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                                    <i className="fa-light fa-users tw-mr-1 tw-text-gray-400"></i>
                                    Default Assignees
                                </label>
                                <TagBox
                                    dataSource={users}
                                    displayExpr="userName"
                                    valueExpr="id"
                                    value={fuelAssigneeIds}
                                    onValueChanged={(e) => updateFuelField('defaultAssignee', serializeAssigneeIds(e.value))}
                                    placeholder="Select assignees..."
                                    showClearButton={true}
                                    searchEnabled={true}
                                    multiline={true}
                                    showSelectionControls={true}
                                    applyValueMode="useButtons"
                                    maxDisplayedTags={3}
                                />
                                <p className="tw-text-xs tw-text-gray-400 tw-mt-1">
                                    First selected user will be the primary assignee for auto-created issues
                                </p>
                            </div>

                            {/* Info box explaining the logic */}
                            <div className="md:tw-col-span-2 tw-p-4 tw-bg-amber-50 tw-rounded-lg tw-border tw-border-amber-200">
                                <div className="tw-flex tw-items-start tw-gap-2">
                                    <i className="fa-light fa-triangle-exclamation tw-text-amber-500 tw-mt-0.5"></i>
                                    <div className="tw-text-xs tw-text-amber-800">
                                        <strong>Monitoring Scenarios:</strong>
                                        <p className="tw-mt-1 tw-mb-0">Alerts are triggered for <strong>all vehicle statuses</strong> when fuel activity is detected while GPS is offline:</p>
                                        <ul className="tw-list-none tw-mt-2 tw-mb-0 tw-space-y-1.5 tw-pl-0">
                                            <li className="tw-flex tw-items-start tw-gap-2">
                                                <span className="tw-inline-block tw-w-2 tw-h-2 tw-rounded-full tw-bg-green-500 tw-mt-1 tw-flex-shrink-0"></span>
                                                <span><strong>Working</strong> + GPS Offline + Fuel Activity &rarr; Alert (possible GPS failure)</span>
                                            </li>
                                            <li className="tw-flex tw-items-start tw-gap-2">
                                                <span className="tw-inline-block tw-w-2 tw-h-2 tw-rounded-full tw-bg-blue-500 tw-mt-1 tw-flex-shrink-0"></span>
                                                <span><strong>Parked Yard</strong> + GPS Offline + Fuel Activity &rarr; Alert (unexpected fueling while parked)</span>
                                            </li>
                                            <li className="tw-flex tw-items-start tw-gap-2">
                                                <span className="tw-inline-block tw-w-2 tw-h-2 tw-rounded-full tw-bg-orange-500 tw-mt-1 tw-flex-shrink-0"></span>
                                                <span><strong>Workshop</strong> + GPS Offline + Fuel Activity &rarr; Alert (unexpected fueling during maintenance)</span>
                                            </li>
                                            <li className="tw-flex tw-items-start tw-gap-2">
                                                <span className="tw-inline-block tw-w-2 tw-h-2 tw-rounded-full tw-bg-gray-400 tw-mt-1 tw-flex-shrink-0"></span>
                                                <span>GPS Offline + <strong>No Fuel Activity</strong> &rarr; No alert from this monitor</span>
                                            </li>
                                        </ul>
                                        <p className="tw-mt-2 tw-mb-0 tw-text-amber-700">
                                            <i className="fa-light fa-gear tw-mr-1"></i>
                                            Fuel activity lookback window is configured in the <em>System Config</em> tab.
                                            Vehicle status is included in the issue description but is <strong>never changed</strong> automatically.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Title Template */}
                            <div className="md:tw-col-span-2">
                                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                                    <i className="fa-light fa-heading tw-mr-1 tw-text-gray-400"></i>
                                    Issue Title Template
                                </label>
                                <TextArea
                                    value={fuelTemplate.titleTemplate || 'Fuel Activity While GPS Offline - {vehicleName}'}
                                    onValueChanged={(e) => updateFuelField('titleTemplate', e.value)}
                                    height={40}
                                    placeholder="Fuel Activity While GPS Offline - {vehicleName}"
                                />
                                <p className="tw-text-xs tw-text-gray-400 tw-mt-1">
                                    Placeholders: {'{vehicleName}'}, {'{vehicleStatus}'}
                                </p>
                            </div>

                            {/* Description Template */}
                            <div className="md:tw-col-span-2">
                                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                                    <i className="fa-light fa-align-left tw-mr-1 tw-text-gray-400"></i>
                                    Issue Description Template
                                </label>
                                <TextArea
                                    value={fuelTemplate.descriptionTemplate || 'Vehicle {vehicleName} (Status: {vehicleStatus}) has fuel activity in the last {thresholdDays} days but the GPS device is offline. Last GPS seen: {lastSeen}. This may indicate GPS tampering or device failure.'}
                                    onValueChanged={(e) => updateFuelField('descriptionTemplate', e.value)}
                                    height={80}
                                    placeholder="Vehicle {vehicleName} has fuel activity..."
                                />
                                <p className="tw-text-xs tw-text-gray-400 tw-mt-1">
                                    Placeholders: {'{vehicleName}'}, {'{vehicleStatus}'}, {'{lastSeen}'}, {'{thresholdDays}'}, {'{thresholdMinutes}'}
                                </p>
                            </div>
                        </div>

                        {/* Auto-Close Section */}
                        <div className="tw-mt-6 tw-pt-4 tw-border-t">
                            <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
                                <div>
                                    <h4 className="tw-text-sm tw-font-semibold tw-text-gray-700 tw-flex tw-items-center tw-gap-1.5">
                                        <i className="fa-light fa-rotate tw-mr-1"></i> Auto-Close Settings
                                        <InfoPopover color="amber">
                                            When enabled, the system periodically checks whether the GPS device has come back online.
                                            If the device stays online for at least the <strong>Online Threshold</strong> duration,
                                            the issue is automatically closed and a resolution note is added.
                                            The <strong>Check Interval</strong> controls how often the system checks &mdash;
                                            the shortest interval across all enabled auto-close configs is used.
                                        </InfoPopover>
                                    </h4>
                                    <p className="tw-text-xs tw-text-gray-400">Automatically close the issue when GPS comes back online</p>
                                </div>
                                <ToggleSwitch
                                    checked={fuelAutoClose?.isEnabled ?? false}
                                    onChange={(val) => updateFuelAutoClose('isEnabled', val)}
                                />
                            </div>
                            {fuelAutoClose?.isEnabled && (
                                <>
                                    <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
                                        <div>
                                            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                                                Online Threshold
                                            </label>
                                            <DurationInput
                                                totalMinutes={fuelCheckerConfig.onlineThresholdMinutes || 15}
                                                onChange={(mins) => updateCheckerConfigField(updateFuelAutoClose, fuelAutoClose, 'onlineThresholdMinutes', mins)}
                                                min={1}
                                                max={1440}
                                            />
                                            <p className="tw-text-xs tw-text-gray-400 tw-mt-1">
                                                How long GPS must stay online before the issue is closed
                                            </p>
                                        </div>
                                        <div>
                                            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                                                Check Interval (seconds)
                                            </label>
                                            <NumberBox
                                                value={fuelAutoClose.checkIntervalSeconds || 600}
                                                onValueChanged={(e) => updateFuelAutoClose('checkIntervalSeconds', e.value)}
                                                min={60}
                                                max={86400}
                                                showSpinButtons={true}
                                            />
                                            <p className="tw-text-xs tw-text-gray-400 tw-mt-1">
                                                How often the auto-close service runs to check open issues
                                            </p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="tw-flex tw-justify-end tw-mt-6">
                            <Button
                                text={savingFuel ? 'Saving...' : 'Save Fuel Configuration'}
                                type="default"
                                stylingMode="contained"
                                icon="fa-light fa-floppy-disk"
                                onClick={handleSaveFuel}
                                disabled={savingFuel}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AlertConfigurationPage;
