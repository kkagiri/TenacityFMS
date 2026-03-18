/**
 * File: VehicleTrackingDetailPanelContent.js
 * Purpose: Shared vehicle tracking detail information panel for both floating popup and docked layouts.
 * Dependencies: React, Redux, React Router, DevExtreme, tracking helper utilities
 * Last Modified: 2026-03-18
 *
 * Key Components:
 * - VehicleTrackingDetailPanelContent(): Renders the shared header, address, live metrics, and vehicle information content.
 * - SensorCard(): Single live sensor tile.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import LoadIndicator from 'devextreme-react/load-indicator';
import notify from 'devextreme/ui/notify';
import axiosInstance from '../../../../../api/axiosInstance';
import { getVehicleById } from '../../../../../redux/actions/vehicleActions';
import { getVehicleDetailsRoute } from '../../../utils/navigationHelper';
import { getMovementProfileLabel } from '../../../trips/utils/vehicleTripUi';
import {
    formatTrackingLastSeen,
    getVehicleCode,
    getVehicleDriverName,
    getVehicleOperationalStatus,
    getVehicleStatusTone,
} from '../../utils/vehicleTrackingHelpers';
import './VehicleTrackingDetailPopup.scss';

const getValue = (...values) => {
    const firstValue = values.find((value) => value !== null && value !== undefined && value !== '');
    return firstValue ?? '\u2014';
};

const formatBoolean = (value) => {
    if (value === null || value === undefined) {
        return '\u2014';
    }

    return value ? 'Yes' : 'No';
};

const formatTagList = (vehicle) => {
    if (Array.isArray(vehicle?.tags) && vehicle.tags.length > 0) {
        return vehicle.tags
            .map((tag) => tag?.name || tag?.tagName || tag?.value)
            .filter(Boolean)
            .join(', ');
    }

    return getValue(vehicle?.tagName, vehicle?.tagCode);
};

const formatSpeed = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? `${parsed.toFixed(1)} km/h` : '\u2014';
};

const formatHeading = (value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return '\u2014';
    }

    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(parsed / 45) % 8;
    return `${parsed.toFixed(0)}° ${directions[index]}`;
};

const buildDataStripItems = (vehicle, gpsData) => {
    const sensorHealth = gpsData?.sensorHealth || {};

    return [
        {
            key: 'mileage-today',
            icon: 'fa-light fa-arrow-right-long',
            label: "Today's mileage",
            value: getValue(vehicle?.mileageToday != null ? `${vehicle.mileageToday} km` : null),
        },
        {
            key: 'mileage-total',
            icon: 'fa-light fa-gauge-high',
            label: 'Total mileage',
            value: getValue(vehicle?.odometer != null ? `${Number(vehicle.odometer).toLocaleString()} km` : null),
        },
        {
            key: 'gps-time',
            icon: 'fa-light fa-clock',
            label: 'GPS time',
            value: getValue(gpsData?.lastUpdated ? formatTrackingLastSeen(gpsData.lastUpdated) : null, formatTrackingLastSeen(vehicle?.lastSeenAt || vehicle?.lastUpdate)),
        },
        {
            key: 'positioning',
            icon: 'fa-light fa-crosshairs',
            label: 'Positioning',
            value: getValue(gpsData?.positioningMode, sensorHealth.isPositionValid != null ? (sensorHealth.isPositionValid ? 'Valid' : 'Invalid') : null),
        },
        {
            key: 'fuel',
            icon: 'fa-light fa-gas-pump',
            label: 'Fuel (main)',
            value: sensorHealth.fuelLevel != null ? `${Math.floor(sensorHealth.fuelLevel)} L` : '\u2014',
            tone: 'orange',
        },
        {
            key: 'communication',
            icon: 'fa-light fa-signal',
            label: 'Communication',
            value: getValue(gpsData?.communication, gpsData?.protocol),
            tone: 'green',
        },
    ];
};

const SensorCard = ({ label, value, tone }) => (
    <div className="vehicle-tracking-panel__sensor-card">
        <div className="vehicle-tracking-panel__sensor-label">{label}</div>
        <div className={`vehicle-tracking-panel__sensor-value${tone ? ` vehicle-tracking-panel__sensor-value--${tone}` : ''}`}>{value}</div>
    </div>
);

const VehicleTrackingDetailPanelContent = ({
    isDocked = false,
    onClose,
    panelHeaderMouseDown = null,
    vehicleId,
    vehicleSnapshot,
}) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [vehicle, setVehicle] = useState(vehicleSnapshot || null);
    const [gpsData, setGpsData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isGpsLoading, setIsGpsLoading] = useState(false);

    useEffect(() => {
        setVehicle(vehicleSnapshot || null);
    }, [vehicleSnapshot]);

    const loadGpsInformation = useCallback(async () => {
        if (!vehicleId) {
            setGpsData(null);
            return;
        }

        try {
            setIsGpsLoading(true);
            const response = await axiosInstance.get(`/vehicletracking/${vehicleId}/gps-information`);
            if (response.data && (response.data.success || response.data.isSuccess)) {
                setGpsData(response.data.data || null);
                return;
            }

            setGpsData(null);
        } catch (error) {
            console.error('Error loading popup GPS information:', error);
            setGpsData(null);
        } finally {
            setIsGpsLoading(false);
        }
    }, [vehicleId]);

    const loadVehicle = useCallback(async () => {
        if (!vehicleId) {
            setVehicle(vehicleSnapshot || null);
            return;
        }

        setIsLoading(true);
        try {
            const response = await dispatch(getVehicleById(vehicleId));
            setVehicle(response?.data || vehicleSnapshot || null);
        } catch (error) {
            console.error('Error loading vehicle details:', error);
            notify('Unable to load vehicle details', 'error', 3000);
            setVehicle(vehicleSnapshot || null);
        } finally {
            setIsLoading(false);
        }
    }, [dispatch, vehicleId, vehicleSnapshot]);

    useEffect(() => {
        loadVehicle();
    }, [loadVehicle]);

    useEffect(() => {
        loadGpsInformation();
    }, [loadGpsInformation]);

    const handleRefresh = useCallback(() => {
        loadVehicle();
        loadGpsInformation();
    }, [loadGpsInformation, loadVehicle]);

    const resolvedVehicleId = vehicle?.vehicleId || vehicle?.id || vehicleId;
    const statusTone = useMemo(() => getVehicleStatusTone(vehicle || {}), [vehicle]);
    const operationalStatus = useMemo(() => getVehicleOperationalStatus(vehicle || {}), [vehicle]);
    const dataStripItems = useMemo(() => buildDataStripItems(vehicle, gpsData), [gpsData, vehicle]);

    const vehicleCode = getValue(getVehicleCode(vehicle), vehicle?.trackingCode, vehicle?.hyoungNo);
    const vehiclePlate = getValue(vehicle?.plateNumber, vehicle?.plateNo, vehicle?.numberPlate);
    const vehicleMake = getValue(vehicle?.vehicleManufacturerName, vehicle?.manufacturerName, vehicle?.manufacturer?.name);
    const vehicleModel = getValue(vehicle?.vehicleModelName, vehicle?.modelName, vehicle?.model?.name);
    const statusMarker = vehicle?.isOnline === false ? 'offline' : statusTone.marker;

    const statusText = useMemo(() => {
        if (vehicle?.isOnline === false) {
            return 'Offline';
        }

        const spd = Number(gpsData?.speed ?? vehicle?.speed);
        if (spd > 0) {
            return `Moving (${spd.toFixed(0)} km/h)`;
        }

        return operationalStatus;
    }, [gpsData?.speed, operationalStatus, vehicle]);

    const addressText = useMemo(() => {
        const addr = vehicle?.lastAddress || vehicle?.address;
        if (addr) {
            return addr;
        }

        const lat = Number(gpsData?.latitude ?? vehicle?.latitude);
        const lng = Number(gpsData?.longitude ?? vehicle?.longitude);
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
            return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        }

        return null;
    }, [gpsData?.latitude, gpsData?.longitude, vehicle]);

    const gpsTimestampText = useMemo(() => {
        const ts = gpsData?.lastUpdated || vehicle?.lastSeenAt || vehicle?.lastUpdate;
        return ts ? `GPS ${formatTrackingLastSeen(ts)}` : '\u2014';
    }, [gpsData?.lastUpdated, vehicle?.lastSeenAt, vehicle?.lastUpdate]);

    const renderInfoTab = () => {
        const sh = gpsData?.sensorHealth || {};

        const profileFields = [
            { label: 'Hyoung No', value: getValue(getVehicleCode(vehicle), vehicle?.trackingCode, vehicle?.hyoungNo), mono: true },
            { label: 'Number plate', value: vehiclePlate, mono: true },
            { label: 'Type', value: getValue(vehicle?.vehicleTypeName, vehicle?.vehicleType?.name) },
            { label: 'Manufacturer', value: vehicleMake },
            { label: 'Model', value: vehicleModel },
            { label: 'Year', value: getValue(vehicle?.year, vehicle?.modelYear) },
            { label: 'Working site', value: getValue(vehicle?.siteName, vehicle?.workingSiteName) },
            { label: 'Driver', value: getValue(getVehicleDriverName(vehicle), vehicle?.driverName, vehicle?.defaultDriverName) },
            { label: 'Movement profile', value: getValue(vehicle?.movementProfileName, getMovementProfileLabel?.(vehicle?.movementProfile)) },
            { label: 'Company vehicle', value: formatBoolean(vehicle?.isCompanyVehicle) },
        ];

        const specsFields = [
            { label: 'Tank capacity', value: getValue(vehicle?.fuelTankCapacity != null ? `${vehicle.fuelTankCapacity} L` : null), mono: true },
            { label: 'Cargo capacity', value: getValue(vehicle?.cargoCapacity != null ? `${vehicle.cargoCapacity}` : null) },
            { label: 'Expected avg.', value: getValue(vehicle?.expectedAverage != null ? `${vehicle.expectedAverage} L/100km` : null), mono: true },
            { label: 'Passenger cap.', value: getValue(vehicle?.passengerCapacity) },
            { label: 'Tags', value: formatTagList(vehicle) },
        ];

        const sensors = [
            { label: 'Ignition', value: sh.ignitionStatus != null ? (sh.ignitionStatus ? 'On' : 'Off') : '\u2014', tone: sh.ignitionStatus ? 'green' : undefined },
            { label: 'Engine', value: sh.engineStatus != null ? (sh.engineStatus ? 'Running' : 'Stopped') : '\u2014', tone: sh.engineStatus ? 'green' : undefined },
            { label: 'Speed', value: formatSpeed(gpsData?.speed ?? vehicle?.speed) },
            { label: 'Heading', value: formatHeading(gpsData?.heading ?? vehicle?.heading) },
            { label: 'Satellites', value: getValue(sh.satelliteCount) },
            { label: 'Voltage', value: getValue(sh.voltage != null ? `${sh.voltage} V` : null) },
            { label: 'Humidity', value: getValue(sh.humidity != null ? `${sh.humidity}%` : null) },
            { label: 'Signal', value: getValue(sh.gpsSignalStrength, gpsData?.signalStrength) },
            { label: 'Fuel level', value: sh.fuelLevel != null ? `${Math.floor(sh.fuelLevel)} L` : '\u2014', tone: 'orange' },
        ];

        return (
            <div className="vehicle-tracking-panel__info-grid">
                <div className="vehicle-tracking-panel__info-section">
                    <div className="vehicle-tracking-panel__info-section-title">Vehicle profile</div>
                    <div className="vehicle-tracking-panel__info-fields">
                        {profileFields.map((f) => (
                            <div key={f.label} className="vehicle-tracking-panel__info-field">
                                <span className="vehicle-tracking-panel__info-field-label">{f.label}</span>
                                <span className={`vehicle-tracking-panel__info-field-value${f.mono ? ' vehicle-tracking-panel__info-field-value--mono' : ''}`}>{f.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="vehicle-tracking-panel__info-section">
                    <div className="vehicle-tracking-panel__info-section-title">Capacity &amp; Specs</div>
                    <div className="vehicle-tracking-panel__info-fields">
                        {specsFields.map((f) => (
                            <div key={f.label} className="vehicle-tracking-panel__info-field">
                                <span className="vehicle-tracking-panel__info-field-label">{f.label}</span>
                                <span className={`vehicle-tracking-panel__info-field-value${f.mono ? ' vehicle-tracking-panel__info-field-value--mono' : ''}`}>{f.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="vehicle-tracking-panel__info-section">
                    <div className="vehicle-tracking-panel__info-section-title">Live sensors</div>
                    <div className="vehicle-tracking-panel__sensor-grid">
                        {sensors.map((s) => (
                            <SensorCard key={s.label} label={s.label} value={s.value} tone={s.tone} />
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={`vehicle-tracking-panel__content${isDocked ? ' vehicle-tracking-panel__content--docked' : ''}`}>
            <div className={`vehicle-tracking-panel__header${panelHeaderMouseDown && !isDocked ? ' vehicle-tracking-panel__header--draggable' : ''}`} onMouseDown={panelHeaderMouseDown || undefined}>
                <div className="vehicle-tracking-panel__vehicle-icon">
                    <i className="fa-light fa-truck"></i>
                </div>
                <div className="vehicle-tracking-panel__identity">
                    <div className="vehicle-tracking-panel__vehicle-id">{vehicleCode}</div>
                    <div className="vehicle-tracking-panel__vehicle-name">{vehiclePlate} {'\u00B7'} {vehicleMake} {vehicleModel}</div>
                </div>
                <span className={`vehicle-tracking-panel__status-badge vehicle-tracking-panel__status-badge--${statusMarker}`}>
                    {statusText}
                </span>
                <div className="vehicle-tracking-panel__header-right">
                    <button type="button" className="vehicle-tracking-panel__icon-btn" title="Refresh" onClick={handleRefresh}>
                        <i className="fa-light fa-rotate-right"></i>
                    </button>
                    <button
                        type="button"
                        className="vehicle-tracking-panel__icon-btn"
                        title="Open full page"
                        onClick={() => resolvedVehicleId && navigate(getVehicleDetailsRoute(resolvedVehicleId))}
                    >
                        <i className="fa-light fa-arrow-up-right-from-square"></i>
                    </button>
                    {!isDocked ? (
                        <button
                            type="button"
                            className="vehicle-tracking-panel__icon-btn vehicle-tracking-panel__icon-btn--close"
                            title="Close"
                            onClick={onClose}
                        >
                            <i className="fa-light fa-xmark"></i>
                        </button>
                    ) : null}
                </div>
            </div>

            {addressText ? (
                <div className="vehicle-tracking-panel__address">
                    <i className="fa-solid fa-location-dot"></i>
                    <span className="vehicle-tracking-panel__address-text">{addressText}</span>
                    {isGpsLoading
                        ? <LoadIndicator visible={true} height={14} width={14} />
                        : <span className="vehicle-tracking-panel__address-time">{gpsTimestampText}</span>
                    }
                </div>
            ) : null}

            <div className="vehicle-tracking-panel__data-strip" aria-label="Live vehicle indicators">
                {dataStripItems.map((item) => (
                    <div key={item.key} className="vehicle-tracking-panel__data-cell">
                        <div className="vehicle-tracking-panel__data-icon">
                            <i className={item.icon}></i>
                        </div>
                        <div>
                            <div className="vehicle-tracking-panel__data-label">{item.label}</div>
                            <div className={`vehicle-tracking-panel__data-value${item.tone ? ` vehicle-tracking-panel__data-value--${item.tone}` : ''}`}>{item.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="vehicle-tracking-panel__tab-body">
                <div className="vehicle-tracking-panel__tab-scroll">
                    {isLoading && !vehicle ? (
                        <div className="vehicle-tracking-panel__loading">
                            <LoadIndicator visible={true} height={36} width={36} />
                            <span>Loading vehicle details...</span>
                        </div>
                    ) : (
                        renderInfoTab()
                    )}
                </div>
            </div>
        </div>
    );
};

export default VehicleTrackingDetailPanelContent;