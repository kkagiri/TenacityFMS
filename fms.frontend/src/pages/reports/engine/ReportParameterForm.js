/**
 * File: ReportParameterForm.js
 * Purpose: Dynamic filter/parameter form that renders controls based on a report source's
 *          parameter schema. Supports date, lookup, select, number, and text parameter types.
 * Dependencies: React, DevExtreme (DateBox, TagBox, SelectBox, NumberBox, TextBox), Redux lookups
 * Last Modified: 2026-03-11
 *
 * Key Components:
 * - ReportParameterForm: Renders parameter controls from source definition
 */

import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DateBox } from 'devextreme-react/date-box';
import { TagBox } from 'devextreme-react/tag-box';
import { SelectBox } from 'devextreme-react/select-box';
import { NumberBox } from 'devextreme-react/number-box';
import { TextBox } from 'devextreme-react/text-box';
import { fetchSiteList } from '../../../redux/actions/siteActions';
import { fetchVehicleList } from '../../../redux/actions/vehicleActions';
import { fetchVehicleTypes } from '../../../redux/actions/vehicleTypeActions';
import { fetchTanks } from '../../../redux/actions/tankActions';
import { fetchPTSDeviceList } from '../../../redux/actions/ptsActions/ptsDeviceActions';
import { fetchSuppliers } from '../../../redux/actions/SupplierActions';
import { fetchIssueCategories, fetchIssueStatuses } from '../../../redux/actions/issueTrackerActions';
import issueTrackerV2Service from '../../../services/issueTrackerV2Service';

const LIGHT_VEHICLE_TYPE_NAMES = new Set([
    'STAFF BUS',
    'TIPPER',
    'PRIME MOVER',
    'PICK UP',
    'LORRY',
    'PRIVATE',
    'VAN',
]);

const normalizeVehicleTypeName = (value) => String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');

/**
 * Maps lookupSource keys to Redux state selectors and dispatch actions.
 */
const LOOKUP_CONFIG = {
    sites: {
        selector: (state) => {
            const raw = state.site?.sites || state.site?.list || [];
            return (Array.isArray(raw) ? raw : []).map((s) => ({
                id: s.siteId || s.id,
                name: s.siteName || s.name || `Site ${s.siteId || s.id}`,
            }));
        },
        fetchAction: fetchSiteList,
    },
    vehicles: {
        selector: (state) => {
            const raw = state.vehicle?.vehicles || state.vehicle?.list || [];
            return (Array.isArray(raw) ? raw : []).map((v) => ({
                id: v.vehicleId || v.id,
                name: v.hyoungNo || v.name || v.vehicleName || `Vehicle ${v.vehicleId || v.id}`,
                vehicleTypeId: v.vehicleTypeId,
                vehicleTypeName: v.vehicleTypeName || v.vehicleType?.name || v.vehicleType?.vehicleTypeName || v.vehicleType || v.typeName || '',
                workingSiteId: v.workingSiteId,
                isKmL:
                    v.averageKmL ??
                    v.AverageKmL ??
                    v.isKmL ??
                    v.IsKmL ??
                    v.isAverageKm ??
                    v.IsAverageKm ??
                    true,
            }));
        },
        fetchAction: fetchVehicleList,
    },
    lightVehicleTypes: {
        selector: (state) => {
            const vehicleTypes = Array.isArray(state.vehicleType?.vehicleTypes)
                ? state.vehicleType.vehicleTypes
                : [];
            return vehicleTypes
                .map((vehicleType) => ({
                    id: vehicleType.vehicleTypeId || vehicleType.id,
                    name: vehicleType.vehicleTypeName || vehicleType.name || `Type ${vehicleType.vehicleTypeId || vehicleType.id}`,
                }))
                .filter((vehicleType) => vehicleType.id && LIGHT_VEHICLE_TYPE_NAMES.has(normalizeVehicleTypeName(vehicleType.name)))
                .sort((a, b) => a.name.localeCompare(b.name));
        },
        fetchAction: fetchVehicleTypes,
    },
    heavyEquipmentTypes: {
        selector: (state) => {
            const vehicleTypes = Array.isArray(state.vehicleType?.vehicleTypes)
                ? state.vehicleType.vehicleTypes
                : [];
            return vehicleTypes
                .map((vehicleType) => ({
                    id: vehicleType.vehicleTypeId || vehicleType.id,
                    name: vehicleType.vehicleTypeName || vehicleType.name || `Type ${vehicleType.vehicleTypeId || vehicleType.id}`,
                }))
                .filter((vehicleType) => vehicleType.id && !LIGHT_VEHICLE_TYPE_NAMES.has(normalizeVehicleTypeName(vehicleType.name)))
                .sort((a, b) => a.name.localeCompare(b.name));
        },
        fetchAction: fetchVehicleTypes,
    },
    tanks: {
        selector: (state) => {
            const raw = state.tank?.tanks || state.tank?.list || [];
            return (Array.isArray(raw) ? raw : []).map((t) => ({
                id: t.id || t.tankId,
                name: t.name || t.tankName || `Tank ${t.id || t.tankId}`,
                siteId: t.siteId,
                fuelGradeId: t.fuelGradeId,
                fuelGradeName: t.fuelGradeName,
            }));
        },
        fetchAction: fetchTanks,
    },
    fuelGrades: {
        selector: (state) => {
            const raw = state.tank?.tanks || state.tank?.list || [];
            const gradeMap = new Map();
            (Array.isArray(raw) ? raw : []).forEach((t) => {
                if (t.fuelGradeId && t.fuelGradeName) {
                    gradeMap.set(t.fuelGradeId, { id: t.fuelGradeId, name: t.fuelGradeName });
                }
            });
            return Array.from(gradeMap.values()).sort((a, b) => a.name.localeCompare(b.name));
        },
        fetchAction: fetchTanks,
    },
    vehicleTypes: {
        selector: (state) => {
            const raw = state.vehicleType?.vehicleTypes || [];
            return (Array.isArray(raw) ? raw : []).map((vt) => ({
                id: vt.vehicleTypeId || vt.id,
                name: vt.vehicleTypeName || vt.name || `Type ${vt.vehicleTypeId || vt.id}`,
            }));
        },
        fetchAction: fetchVehicleTypes,
    },
    ptsDevices: {
        selector: (state) => {
            const raw = state.ptsDevice?.ptsDeviceList || state.ptsDevice?.devices || [];
            return (Array.isArray(raw) ? raw : []).map((d) => ({
                id: d.ptsid || d.ptsDeviceId || d.id,
                name: d.ptsName || d.deviceName || d.name || `Device ${d.ptsid || d.ptsDeviceId || d.id}`,
            }));
        },
        fetchAction: fetchPTSDeviceList,
    },
    suppliers: {
        selector: (state) => {
            const raw = state.supplier?.suppliers || [];
            return (Array.isArray(raw) ? raw : []).map((s) => ({
                id: s.supplierId || s.id,
                name: s.supplierName || s.name || `Supplier ${s.supplierId || s.id}`,
            }));
        },
        fetchAction: fetchSuppliers,
    },
    issueCategories: {
        selector: (state) => {
            const raw = state.issueTracker?.categories || [];
            return (Array.isArray(raw) ? raw : []).map((c) => ({
                id: c.id || c.issueCategoryId,
                name: c.name || c.categoryName || `Category ${c.id || c.issueCategoryId}`,
            }));
        },
        fetchAction: fetchIssueCategories,
    },
    issueStatuses: {
        selector: (state) => {
            const raw = state.issueTracker?.statuses || [];
            return (Array.isArray(raw) ? raw : []).map((s) => ({
                id: s.id || s.statusId || s.status,
                name: s.status || s.name || `Status ${s.id || s.statusId || s.status}`,
            }));
        },
        fetchAction: fetchIssueStatuses,
    },
    issueTemplates: {
        selector: () => [],
        fetcher: async () => {
            const templates = await issueTrackerV2Service.getTemplates();
            return (Array.isArray(templates) ? templates : []).map((t) => ({
                id: t.id || t.issueTemplateId,
                name: t.name || t.templateName || `Template ${t.id || t.issueTemplateId}`,
            }));
        },
    },
};

const ReportParameterForm = ({ parameters = [], filters = {}, onFilterChange, excludeKeys = [] }) => {
    const dispatch = useDispatch();
    const [asyncLookupData, setAsyncLookupData] = useState({});

    // Filter out excluded parameter keys (e.g. dateFrom/dateTo in schedule context)
    const effectiveParameters = useMemo(() => {
        if (!excludeKeys.length) return parameters;
        const excluded = new Set(excludeKeys);
        return parameters.filter((p) => !excluded.has(p.key));
    }, [parameters, excludeKeys]);

    // Collect unique lookup sources needed
    const neededLookups = useMemo(() => {
        const set = new Set();
        effectiveParameters.forEach((p) => {
            if (p.type === 'lookup' && p.lookupSource) {
                set.add(p.lookupSource);
            }
        });
        return Array.from(set);
    }, [effectiveParameters]);

    // Dispatch fetch actions for lookup data
    useEffect(() => {
        let isMounted = true;

        neededLookups.forEach((key) => {
            const config = LOOKUP_CONFIG[key];
            if (Array.isArray(config?.fetchActions)) {
                config.fetchActions.forEach((fetchAction) => {
                    if (typeof fetchAction === 'function') {
                        dispatch(fetchAction());
                    }
                });
            } else if (config?.fetchAction) {
                dispatch(config.fetchAction());
            }
        });

        const loadAsyncLookups = async () => {
            const loaded = {};

            for (const key of neededLookups) {
                const config = LOOKUP_CONFIG[key];
                if (typeof config?.fetcher !== 'function') {
                    continue;
                }

                try {
                    const data = await config.fetcher();
                    loaded[key] = Array.isArray(data) ? data : [];
                } catch (error) {
                    // Keep form usable even when optional lookup data fails to load.
                    loaded[key] = [];
                }
            }

            if (isMounted) {
                setAsyncLookupData((prev) => ({ ...prev, ...loaded }));
            }
        };

        loadAsyncLookups();

        return () => {
            isMounted = false;
        };
    }, [dispatch, neededLookups]);

    // Build lookup data object from Redux state (single useSelector call to avoid hook ordering issues)
    const lookupData = useSelector((state) => {
        const data = {};
        neededLookups.forEach((key) => {
            const config = LOOKUP_CONFIG[key];
            data[key] = config?.selector ? config.selector(state) : [];
        });
        return data;
    });

    const handleChange = useCallback(
        (key, value) => {
            if (onFilterChange) {
                onFilterChange(key, value);
            }
        },
        [onFilterChange]
    );

    /**
     * Get filtered lookup data when a parameter depends on another parameter
     */
    const getFilteredLookupData = useCallback(
        (param) => {
            let data = asyncLookupData[param.lookupSource] || lookupData[param.lookupSource] || [];

            if (param.dependsOn && filters[param.dependsOn]) {
                const depValue = filters[param.dependsOn];
                // Support multi-select dependency (array) or single value
                if (Array.isArray(depValue) && depValue.length > 0) {
                    data = data.filter((item) => depValue.includes(item[param.dependsOn]));
                } else if (!Array.isArray(depValue)) {
                    data = data.filter((item) => item[param.dependsOn] === depValue);
                }
            }

            return data;
        },
        [asyncLookupData, lookupData, filters]
    );

    const renderControl = useCallback(
        (param) => {
            const value = filters[param.key];

            switch (param.type) {
                case 'date':
                    return (
                        <DateBox
                            value={value}
                            onValueChanged={(e) => handleChange(param.key, e.value)}
                            type="date"
                            displayFormat="yyyy-MM-dd"
                            showClearButton={!param.required}
                        />
                    );

                case 'lookup': {
                    const data = getFilteredLookupData(param);

                    if (param.multiSelect === false) {
                        return (
                            <SelectBox
                                value={value !== undefined ? value : null}
                                dataSource={data}
                                valueExpr={param.valueExpr || 'id'}
                                displayExpr={param.displayExpr || 'name'}
                                onValueChanged={(e) => handleChange(param.key, e.value)}
                                placeholder={param.placeholder || 'Select...'}
                                showClearButton={!param.required}
                                searchEnabled={true}
                            />
                        );
                    }

                    return (
                        <TagBox
                            value={Array.isArray(value) ? value : (value !== null && value !== undefined ? [value] : [])}
                            dataSource={data}
                            valueExpr={param.valueExpr || 'id'}
                            displayExpr={param.displayExpr || 'name'}
                            onValueChanged={(e) => handleChange(param.key, e.value)}
                            placeholder={param.placeholder || 'Select...'}
                            showClearButton={!param.required}
                            searchEnabled={true}
                            showSelectionControls={true}
                            applyValueMode="instantly"
                            hideSelectedItems={false}
                            multiline={true}
                            maxDisplayedTags={3}
                        />
                    );
                }

                case 'select':
                    return (
                        <SelectBox
                            value={value !== undefined ? value : null}
                            dataSource={param.options || []}
                            valueExpr={param.valueExpr || 'id'}
                            displayExpr={param.displayExpr || 'name'}
                            onValueChanged={(e) => handleChange(param.key, e.value)}
                            placeholder={param.placeholder || 'Select...'}
                            showClearButton={!param.required}
                            searchEnabled={false}
                        />
                    );

                case 'number':
                    return (
                        <NumberBox
                            value={value}
                            onValueChanged={(e) => handleChange(param.key, e.value)}
                            min={param.min}
                            max={param.max}
                            showClearButton={!param.required}
                            placeholder={param.placeholder || ''}
                        />
                    );

                case 'text':
                default:
                    return (
                        <TextBox
                            value={value || ''}
                            onValueChanged={(e) => handleChange(param.key, e.value)}
                            placeholder={param.placeholder || ''}
                            showClearButton={!param.required}
                        />
                    );
            }
        },
        [filters, handleChange, getFilteredLookupData]
    );

    if (!effectiveParameters.length) {
        return (
            <div className="tw-p-4 tw-text-sm tw-text-gray-500 tw-italic">
                No parameters required for this report.
            </div>
        );
    }

    return (
        <div className="report-parameter-form">
            {effectiveParameters.map((param) => (
                <div key={param.key} className="tw-mb-4">
                    <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                        {param.label}
                        {param.required && <span className="tw-text-red-500 tw-ml-1">*</span>}
                    </label>
                    {renderControl(param)}
                </div>
            ))}
        </div>
    );
};

export default ReportParameterForm;
