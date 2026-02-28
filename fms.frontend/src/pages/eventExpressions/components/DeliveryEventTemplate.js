/**
 * File: DeliveryEventTemplate.js
 * Purpose: M365 Admin Center–style preview card for InTankDelivery and ManualDelivery
 *          event expression templates. Renders sample delivery data with placeholder
 *          tokens so users can visualise what the notification will look like.
 * Dependencies: React, DeliveryEventTemplate.scss
 * Last Modified: 2026-02-27
 *
 * Key Components:
 * - DeliveryEventTemplate: wrapper that selects the correct sub-card by eventType
 * - InTankDeliveryCard: detection-focused card (green accent)
 * - ManualDeliveryCard: entry-focused card (blue accent)
 */

import React from 'react';
import './DeliveryEventTemplate.scss';

/* ────────────────────────────────────────────
 *  Sample data — mirrors GetTemplateVariables()
 * ──────────────────────────────────────────── */
const ITD_SAMPLE = {
    DeliveryId: '1042',
    PtsDeviceName: 'PTS-01 Depot',
    TankName: 'Tank 01 - Diesel',
    SiteName: 'Main Depot',
    FuelGrade: 'Diesel 50ppm',
    Volume: '12,500',
    PreDeliveryLevel: '18,200',
    PostDeliveryLevel: '30,700',
    TankCapacity: '50,000',
    VolumePercentage: '25.0',
    MatchedManualDeliveryId: '305',
    Status: 'Detected',
    StartTime: '2026-02-19 06:15',
    EndTime: '2026-02-19 06:48',
    DetectedAt: '2026-02-19 06:50',
};

const MANUAL_SAMPLE = {
    DeliveryId: '305',
    LpoNumber: 'LPO-2026-0045',
    TankName: 'Tank 01 - Diesel',
    SiteName: 'Main Depot',
    ProductName: 'Diesel 50ppm',
    SupplierName: 'TotalEnergies SA',
    ManualDeliveryAmount: '15,000',
    SensorDeliveryAmount: '14,850',
    StockBeforeDelivery: '22,400',
    StockAfterDelivery: '37,400',
    TankCapacity: '50,000',
    FillPercentage: '74.8',
    PricePerLiter: '21.50',
    TotalCost: '322,500.00',
    DeliveryTemperature: '22.5',
    DeliveryDensity: '0.845',
    DeliveryDate: '19 Feb 2026',
    IsSameDay: 'Yes',
    RecordedByName: 'Jane Smith',
};

/* ────────────────────────────────────────────
 *  In-Tank Delivery Card  (green accent)
 * ──────────────────────────────────────────── */
const InTankDeliveryCard = () => (
    <div className="delivery-template delivery-template--itd">
        {/* Header */}
        <div className="delivery-template__header delivery-template__header--itd">
            <div className="delivery-template__header-icon">
                <i className="fa-light fa-truck-ramp-box" />
            </div>
            <div className="delivery-template__header-text">
                <h4 className="delivery-template__title">In-Tank Delivery Detected</h4>
                <span className="delivery-template__subtitle">
                    PTS auto-detected · #{ITD_SAMPLE.DeliveryId}
                </span>
            </div>
            <span className="m365-badge m365-badge--success">{ITD_SAMPLE.Status}</span>
        </div>

        {/* Location strip */}
        <div className="delivery-template__strip">
            <span className="delivery-template__strip-item">
                <i className="fa-light fa-location-dot" /> {ITD_SAMPLE.SiteName}
            </span>
            <span className="delivery-template__strip-sep">·</span>
            <span className="delivery-template__strip-item">
                <i className="fa-light fa-database" /> {ITD_SAMPLE.TankName}
            </span>
            <span className="delivery-template__strip-sep">·</span>
            <span className="delivery-template__strip-item">
                <i className="fa-light fa-server" /> {ITD_SAMPLE.PtsDeviceName}
            </span>
        </div>

        {/* Body */}
        <div className="delivery-template__body">
            {/* Volume section */}
            <div className="delivery-template__section">
                <div className="delivery-template__section-header">
                    <i className="fa-light fa-gauge-high" />
                    <span>Volume</span>
                </div>
                <div className="delivery-template__fields">
                    <Field label="Fuel Grade" value={ITD_SAMPLE.FuelGrade} />
                    <Field label="Volume Delivered" value={`${ITD_SAMPLE.Volume} L`} accent="success" />
                    <Field label="Fill %" value={`${ITD_SAMPLE.VolumePercentage}%`} />
                </div>
            </div>

            {/* Tank Levels section */}
            <div className="delivery-template__section">
                <div className="delivery-template__section-header">
                    <i className="fa-light fa-chart-column" />
                    <span>Tank Levels</span>
                </div>
                <div className="delivery-template__fields">
                    <Field label="Pre-Delivery" value={`${ITD_SAMPLE.PreDeliveryLevel} L`} />
                    <Field label="Post-Delivery" value={`${ITD_SAMPLE.PostDeliveryLevel} L`} accent="success" />
                    <Field label="Tank Capacity" value={`${ITD_SAMPLE.TankCapacity} L`} />
                </div>
            </div>

            {/* Timing section */}
            <div className="delivery-template__section">
                <div className="delivery-template__section-header">
                    <i className="fa-light fa-clock" />
                    <span>Timing</span>
                </div>
                <div className="delivery-template__fields">
                    <Field label="Start" value={ITD_SAMPLE.StartTime} />
                    <Field label="End" value={ITD_SAMPLE.EndTime} />
                    <Field label="Detected" value={ITD_SAMPLE.DetectedAt} />
                </div>
            </div>

            {/* Matching */}
            <div className="delivery-template__section">
                <div className="delivery-template__section-header">
                    <i className="fa-light fa-link" />
                    <span>Matching</span>
                </div>
                <div className="delivery-template__fields">
                    <Field label="Matched Manual ID" value={`#${ITD_SAMPLE.MatchedManualDeliveryId}`} />
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="delivery-template__footer">
            <span className="delivery-template__footer-meta">
                Delivery #{ITD_SAMPLE.DeliveryId} · Severity: Medium
            </span>
        </div>
    </div>
);

/* ────────────────────────────────────────────
 *  Manual Delivery Card  (blue accent)
 * ──────────────────────────────────────────── */
const ManualDeliveryCard = () => (
    <div className="delivery-template delivery-template--manual">
        {/* Header */}
        <div className="delivery-template__header delivery-template__header--manual">
            <div className="delivery-template__header-icon">
                <i className="fa-light fa-file-invoice" />
            </div>
            <div className="delivery-template__header-text">
                <h4 className="delivery-template__title">Manual Delivery Entry</h4>
                <span className="delivery-template__subtitle">
                    {MANUAL_SAMPLE.DeliveryDate} · {MANUAL_SAMPLE.LpoNumber}
                </span>
            </div>
            <span className="m365-badge m365-badge--primary">
                {MANUAL_SAMPLE.IsSameDay === 'Yes' ? 'Same Day' : 'Historical'}
            </span>
        </div>

        {/* Location strip */}
        <div className="delivery-template__strip">
            <span className="delivery-template__strip-item">
                <i className="fa-light fa-location-dot" /> {MANUAL_SAMPLE.SiteName}
            </span>
            <span className="delivery-template__strip-sep">·</span>
            <span className="delivery-template__strip-item">
                <i className="fa-light fa-database" /> {MANUAL_SAMPLE.TankName}
            </span>
            <span className="delivery-template__strip-sep">·</span>
            <span className="delivery-template__strip-item">
                <i className="fa-light fa-truck" /> {MANUAL_SAMPLE.SupplierName}
            </span>
        </div>

        {/* Body */}
        <div className="delivery-template__body">
            {/* Delivery Info */}
            <div className="delivery-template__section">
                <div className="delivery-template__section-header">
                    <i className="fa-light fa-circle-info" />
                    <span>Delivery Information</span>
                </div>
                <div className="delivery-template__fields">
                    <Field label="Product" value={MANUAL_SAMPLE.ProductName} />
                    <Field label="Supplier" value={MANUAL_SAMPLE.SupplierName} />
                    <Field label="LPO Number" value={MANUAL_SAMPLE.LpoNumber} />
                    <Field label="Recorded By" value={MANUAL_SAMPLE.RecordedByName} />
                </div>
            </div>

            {/* Volume */}
            <div className="delivery-template__section">
                <div className="delivery-template__section-header">
                    <i className="fa-light fa-gauge-high" />
                    <span>Volume</span>
                </div>
                <div className="delivery-template__fields">
                    <Field label="Manual Amount" value={`${MANUAL_SAMPLE.ManualDeliveryAmount} L`} accent="primary" />
                    <Field label="Sensor Amount" value={`${MANUAL_SAMPLE.SensorDeliveryAmount} L`} />
                    <Field label="Stock Before" value={`${MANUAL_SAMPLE.StockBeforeDelivery} L`} />
                    <Field label="Stock After" value={`${MANUAL_SAMPLE.StockAfterDelivery} L`} accent="primary" />
                    <Field label="Fill %" value={`${MANUAL_SAMPLE.FillPercentage}%`} />
                </div>
            </div>

            {/* Costing */}
            <div className="delivery-template__section">
                <div className="delivery-template__section-header">
                    <i className="fa-light fa-money-bill-wave" />
                    <span>Costing</span>
                </div>
                <div className="delivery-template__fields">
                    <Field label="Price / Liter" value={`R ${MANUAL_SAMPLE.PricePerLiter}`} />
                    <Field label="Total Cost" value={`R ${MANUAL_SAMPLE.TotalCost}`} accent="primary" bold />
                </div>
            </div>

            {/* Quality */}
            <div className="delivery-template__section">
                <div className="delivery-template__section-header">
                    <i className="fa-light fa-temperature-half" />
                    <span>Quality</span>
                </div>
                <div className="delivery-template__fields">
                    <Field label="Temperature" value={`${MANUAL_SAMPLE.DeliveryTemperature} °C`} />
                    <Field label="Density" value={MANUAL_SAMPLE.DeliveryDensity} />
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="delivery-template__footer">
            <span className="delivery-template__footer-meta">
                Delivery #{MANUAL_SAMPLE.DeliveryId} · Severity: Medium · Recorded by {MANUAL_SAMPLE.RecordedByName}
            </span>
        </div>
    </div>
);

/* ────────────────────────────────────────────
 *  Shared Field component
 * ──────────────────────────────────────────── */
const Field = ({ label, value, accent, bold }) => (
    <div className="delivery-template__field">
        <span className="delivery-template__field-label">{label}</span>
        <span
            className={[
                'delivery-template__field-value',
                accent ? `delivery-template__field-value--${accent}` : '',
                bold ? 'delivery-template__field-value--bold' : '',
            ].join(' ').trim()}
        >
            {value}
        </span>
    </div>
);

/* ────────────────────────────────────────────
 *  Main wrapper — selects card by eventType
 * ──────────────────────────────────────────── */
const DeliveryEventTemplate = ({ eventType }) => {
    if (eventType === 'InTankDelivery') return <InTankDeliveryCard />;
    if (eventType === 'ManualDelivery') return <ManualDeliveryCard />;
    return null;
};

export default DeliveryEventTemplate;
