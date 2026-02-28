/**
 * File: StepMessageTemplate.js
 * Purpose: Step 6 of Event Expression form — Message template editor with HTML support
 *          and clickable placeholders organized by event type. Includes a live preview
 *          that renders placeholders with sample data. Placeholders can be inserted into
 *          either the message body or the title template via an insert-target toggle.
 * Dependencies: devextreme-react HtmlEditor, TextBox, parent formData/handlers via props
 * Last Modified: 2026-02-19
 *
 * Key Props:
 * - formData: expression form state (messageTemplate, eventType)
 * - onFieldChange(field, value): updates an expression field
 * - policyData: notification policy state (titleTemplate)
 * - onPolicyChange(field, value): updates a policy field
 * - selectedTypeMetadata: metadata for the currently selected event type (alertTypeKey, eventType)
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import HtmlEditor, { Toolbar, Item as ToolbarItem } from 'devextreme-react/html-editor';
import { TextBox } from 'devextreme-react/text-box';
import DeliveryEventTemplate from '../DeliveryEventTemplate';

// ─── Placeholder definitions per event type ───
// Base placeholders available for ALL event types (from FMSEvent.GetTemplateVariables + engine additions)
const BASE_PLACEHOLDERS = [
    { key: 'ExpressionName', label: 'Expression Name', description: 'Name of the event expression that triggered' },
    { key: 'EventType', label: 'Event Type', description: 'Type identifier (e.g., TankStockDiscrepancy)' },
    { key: 'EventCategory', label: 'Event Category', description: 'Business domain category' },
    { key: 'Severity', label: 'Severity', description: 'Event severity: Low, Medium, High, Critical' },
    { key: 'Priority', label: 'Priority', description: 'Expression priority level' },
    { key: 'OccurredAt', label: 'Occurred At', description: 'Timestamp when event occurred' },
    { key: 'TriggeredBy', label: 'Triggered By', description: 'User or system that caused the event' },
    { key: 'Message', label: 'Message', description: 'Auto-generated summary message' },
    { key: 'SiteId', label: 'Site ID', description: 'Numeric site identifier' },
    { key: 'TankId', label: 'Tank ID', description: 'Numeric tank identifier' },
    { key: 'DeviceId', label: 'Device ID', description: 'Numeric device identifier' },
];

// Event-type-specific placeholders — keys match EventTypeName constants from backend
const EVENT_TYPE_PLACEHOLDERS = {
    TankStockDiscrepancy: [
        // Tank / Site
        { key: 'TankName', label: 'Tank Name', description: 'Name of the tank', sample: 'Tank 01 - Diesel' },
        { key: 'SiteName', label: 'Site Name', description: 'Name of the site', sample: 'Main Depot' },
        { key: 'ProductName', label: 'Product Name', description: 'Fuel product name', sample: 'Diesel 50ppm' },
        // Stock Levels
        { key: 'OpeningStock', label: 'Opening Stock', description: 'Start-of-day volume (L)', sample: '45,230.50' },
        { key: 'ClosingStock', label: 'Closing Stock', description: 'Actual closing volume (L)', sample: '38,120.00' },
        { key: 'ExpectedClosingStock', label: 'Expected Closing', description: 'Calculated expected volume (L)', sample: '38,650.25' },
        { key: 'Variance', label: 'Variance', description: 'Difference in liters', sample: '-530.25' },
        { key: 'VariancePercentage', label: 'Variance %', description: 'Difference as percentage', sample: '1.4' },
        { key: 'VarianceType', label: 'Variance Type', description: 'GAIN, LOSS, or BALANCED', sample: 'LOSS' },
        { key: 'Unit', label: 'Unit', description: 'Volume unit', sample: 'Liters' },
        // Transaction Breakdown (from VolumeChangeReasonEnum)
        { key: 'TotalDeliveries', label: 'Total Deliveries', description: 'Fuel deliveries received (L)', sample: '12,000.00' },
        { key: 'TotalDispensing', label: 'Total Dispensing', description: 'All dispensing combined: manual + automated (L)', sample: '19,110.50' },
        { key: 'TotalManualDispensing', label: 'Manual Dispensing', description: 'Manual dispensing transactions only (L)', sample: '4,500.00' },
        { key: 'TotalAutomatedDispensing', label: 'Automated Dispensing', description: 'PTS automated pump dispensing (L)', sample: '14,610.50' },
        { key: 'TotalTransfersIn', label: 'Transfers In', description: 'Volume transferred in from other tanks (L)', sample: '2,000.00' },
        { key: 'TotalTransfersOut', label: 'Transfers Out', description: 'Volume transferred out to other tanks (L)', sample: '-1,500.00' },
        { key: 'TotalInTankDeliveries', label: 'In-Tank Deliveries', description: 'PTS auto-detected in-tank deliveries (L)', sample: '5,000.00' },
        { key: 'TotalAdjustments', label: 'Adjustments', description: 'Manual volume adjustments (L)', sample: '-250.00' },
        // Report / Summary
        { key: 'NetMovement', label: 'Net Movement', description: 'Sum of all transaction volume changes (L)', sample: '-2,360.50' },
        { key: 'TransactionCount', label: 'Transaction Count', description: 'Number of transactions for the day', sample: '24' },
        { key: 'BusinessDate', label: 'Business Date', description: 'Business day date', sample: '19 Feb 2026' },
        { key: 'ReportUrl', label: 'Report URL', description: 'Deep-link to TankVolumeHistory report for this day', sample: 'http://localhost:3000/reports/tank-volume-history?autoApply=1&startDate=2026-02-19&endDate=2026-02-19&tankIds=5&siteIds=1' },
    ],
    SensorVariance: [
        { key: 'TankName', label: 'Tank Name', description: 'Name of the tank', sample: 'Tank 02 - Petrol' },
        { key: 'SiteName', label: 'Site Name', description: 'Name of the site', sample: 'Main Depot' },
        { key: 'ProductName', label: 'Product Name', description: 'Fuel product name', sample: 'ULP 95' },
        { key: 'ManualReading', label: 'Manual Reading', description: 'Manual dip stick reading (L)', sample: '22,450.00' },
        { key: 'SensorReading', label: 'Sensor Reading', description: 'ATG/sensor reading (L)', sample: '22,180.75' },
        { key: 'Variance', label: 'Variance', description: 'Difference in liters', sample: '269.25' },
        { key: 'VariancePercentage', label: 'Variance %', description: 'Difference as percentage', sample: '1.2' },
        { key: 'Unit', label: 'Unit', description: 'Volume unit', sample: 'Liters' },
    ],
    TankLevel: [
        { key: 'TankName', label: 'Tank Name', description: 'Name of the tank', sample: 'Tank 03 - Paraffin' },
        { key: 'SiteName', label: 'Site Name', description: 'Name of the site', sample: 'Branch A' },
        { key: 'ProductName', label: 'Product Name', description: 'Fuel product name', sample: 'Paraffin' },
        { key: 'CurrentLevel', label: 'Current Level', description: 'Current tank volume (L)', sample: '5,200.00' },
        { key: 'TankCapacity', label: 'Tank Capacity', description: 'Total capacity (L)', sample: '50,000.00' },
        { key: 'PercentageFull', label: '% Full', description: 'Fill level percentage', sample: '10.4' },
        { key: 'ProductVolume', label: 'Product Volume', description: 'Product volume (L)', sample: '5,150.00' },
        { key: 'WaterLevel', label: 'Water Level', description: 'Water detected (L)', sample: '50.00' },
        { key: 'Temperature', label: 'Temperature', description: 'Temperature reading (°C)', sample: '24.5' },
        { key: 'UllageVolume', label: 'Ullage Volume', description: 'Remaining capacity (L)', sample: '44,800.00' },
        { key: 'Unit', label: 'Unit', description: 'Volume unit', sample: 'Liters' },
    ],
    DeviceStatus: [
        { key: 'DeviceName', label: 'Device Name', description: 'Name of the device', sample: 'ATG Controller 01' },
        { key: 'DeviceType', label: 'Device Type', description: 'Type of device', sample: 'ATG' },
        { key: 'SiteName', label: 'Site Name', description: 'Site name', sample: 'Main Depot' },
        { key: 'DeviceStatus', label: 'Status', description: 'Current device status', sample: 'Offline' },
        { key: 'PreviousStatus', label: 'Previous Status', description: 'Previous status', sample: 'Online' },
        { key: 'OfflineDuration', label: 'Offline Duration', description: 'How long offline', sample: '2h 15m' },
        { key: 'LastSeenAt', label: 'Last Seen At', description: 'Last communication timestamp', sample: '2026-02-19 14:30:00' },
        { key: 'IpAddress', label: 'IP Address', description: 'Device IP', sample: '192.168.1.100' },
        { key: 'ErrorCode', label: 'Error Code', description: 'Error code if applicable', sample: 'E-TIMEOUT' },
        { key: 'ErrorDescription', label: 'Error Description', description: 'Error details', sample: 'Connection timed out' },
    ],
    PumpAlarm: [
        { key: 'PumpId', label: 'Pump ID', description: 'Numeric pump identifier', sample: '3' },
        { key: 'PumpNumber', label: 'Pump Number', description: 'Pump number', sample: '03' },
        { key: 'PumpName', label: 'Pump Name', description: 'Pump display name', sample: 'Pump 03' },
        { key: 'SiteName', label: 'Site Name', description: 'Site name', sample: 'Forecourt A' },
        { key: 'PumpStatus', label: 'Pump Status', description: 'Current pump state', sample: 'Alarm' },
        { key: 'PreviousStatus', label: 'Previous Status', description: 'Previous state', sample: 'Idle' },
        { key: 'AlarmCode', label: 'Alarm Code', description: 'Alarm code', sample: 'P-OVERFILL' },
        { key: 'AlarmDescription', label: 'Alarm Description', description: 'Alarm details', sample: 'Overfill detected' },
        { key: 'NozzleId', label: 'Nozzle ID', description: 'Nozzle identifier', sample: '2' },
        { key: 'ProductName', label: 'Product Name', description: 'Fuel product', sample: 'Diesel 50ppm' },
    ],
    VehicleGps: [
        { key: 'VehicleId', label: 'Vehicle ID', description: 'Vehicle identifier', sample: '42' },
        { key: 'VehicleName', label: 'Vehicle Name', description: 'Vehicle name', sample: 'Truck 007' },
        { key: 'RegistrationNumber', label: 'Registration', description: 'License plate', sample: 'GP 123-456' },
        { key: 'GpsStatus', label: 'GPS Status', description: 'Current GPS state', sample: 'Lost Signal' },
        { key: 'PreviousStatus', label: 'Previous Status', description: 'Previous state', sample: 'Tracking' },
        { key: 'Latitude', label: 'Latitude', description: 'GPS latitude', sample: '-26.2041' },
        { key: 'Longitude', label: 'Longitude', description: 'GPS longitude', sample: '28.0473' },
        { key: 'LastPositionAt', label: 'Last Position At', description: 'Last known position time', sample: '2026-02-19 13:45:00' },
        { key: 'OfflineDuration', label: 'Offline Duration', description: 'Time since last signal', sample: '45m' },
        { key: 'Speed', label: 'Speed', description: 'Last recorded speed', sample: '120' },
        { key: 'GeofenceName', label: 'Geofence Name', description: 'Geofence boundary name', sample: 'Warehouse Zone' },
    ],
    IssueTracker: [
        { key: 'SubType', label: 'Sub Type', description: 'Issue lifecycle action', sample: 'Created' },
        { key: 'IssueId', label: 'Issue ID', description: 'Issue identifier', sample: '1234' },
        { key: 'IssueTitle', label: 'Issue Title', description: 'Issue title', sample: 'Pump malfunction' },
        { key: 'IssueDescription', label: 'Issue Description', description: 'Detailed description', sample: 'Pump 03 not responding to commands' },
        { key: 'IssuePriority', label: 'Issue Priority', description: 'Priority level', sample: 'High' },
        { key: 'IssueCategory', label: 'Issue Category', description: 'Category', sample: 'Maintenance' },
        { key: 'AssignedTo', label: 'Assigned To', description: 'Assignee name', sample: 'John Doe' },
        { key: 'SiteName', label: 'Site Name', description: 'Related site', sample: 'Main Depot' },
        { key: 'VehicleName', label: 'Vehicle Name', description: 'Related vehicle', sample: 'Truck 007' },
    ],
    Reconciliation: [
        { key: 'SubType', label: 'Sub Type', description: 'Reconciliation event type', sample: 'PolicyCompleted' },
        { key: 'PolicyName', label: 'Policy Name', description: 'Reconciliation policy name', sample: 'Daily Stock Check' },
        { key: 'TankName', label: 'Tank Name', description: 'Tank name', sample: 'Tank 01 - Diesel' },
        { key: 'VarianceLiters', label: 'Variance (L)', description: 'Variance in liters', sample: '150.75' },
        { key: 'VariancePercentage', label: 'Variance %', description: 'Variance percentage', sample: '0.8' },
        { key: 'DiscrepanciesFound', label: 'Discrepancies Found', description: 'Count', sample: '3' },
        { key: 'DiscrepanciesResolved', label: 'Discrepancies Resolved', description: 'Count', sample: '1' },
    ],
    TagMonitoring: [
        { key: 'SubType', label: 'Sub Type', description: 'Tag event sub-type', sample: 'TagScanned' },
        { key: 'VehicleName', label: 'Vehicle Name', description: 'Vehicle name', sample: 'Truck 007' },
        { key: 'TagName', label: 'Tag Name', description: 'RFID/NFC tag name', sample: 'Tag-A1234' },
        { key: 'Location', label: 'Location', description: 'Scan location', sample: 'Entry Gate' },
    ],
    InTankDelivery: [
        { key: 'DeliveryId', label: 'Delivery ID', description: 'Auto-detected delivery identifier', sample: '1042' },
        { key: 'PtsDeviceName', label: 'PTS Device', description: 'PTS controller that detected the delivery', sample: 'PTS-01 Depot' },
        { key: 'TankName', label: 'Tank Name', description: 'Tank where delivery was detected', sample: 'Tank 01 - Diesel' },
        { key: 'SiteName', label: 'Site Name', description: 'Site name', sample: 'Main Depot' },
        { key: 'FuelGrade', label: 'Fuel Grade', description: 'Fuel grade / product type', sample: 'Diesel 50ppm' },
        { key: 'Volume', label: 'Volume (L)', description: 'Delivered volume in liters', sample: '12,500.00' },
        { key: 'PreDeliveryLevel', label: 'Pre-Delivery Level', description: 'Tank level before delivery (L)', sample: '18,200.00' },
        { key: 'PostDeliveryLevel', label: 'Post-Delivery Level', description: 'Tank level after delivery (L)', sample: '30,700.00' },
        { key: 'TankCapacity', label: 'Tank Capacity', description: 'Total tank capacity (L)', sample: '50,000.00' },
        { key: 'VolumePercentage', label: 'Fill %', description: 'Percentage of capacity filled by delivery', sample: '25.0' },
        { key: 'MatchedManualDeliveryId', label: 'Matched Manual ID', description: 'Matched manual delivery ID (if matched)', sample: '305' },
        { key: 'Status', label: 'Status', description: 'Detection status', sample: 'Detected' },
        { key: 'StartTime', label: 'Start Time', description: 'Delivery start timestamp', sample: '2026-02-19 06:15:00' },
        { key: 'EndTime', label: 'End Time', description: 'Delivery end timestamp', sample: '2026-02-19 06:48:00' },
        { key: 'DetectedAt', label: 'Detected At', description: 'When system detected the delivery', sample: '2026-02-19 06:50:12' },
    ],
    ManualDelivery: [
        { key: 'DeliveryId', label: 'Delivery ID', description: 'Manual delivery record ID', sample: '305' },
        { key: 'LpoNumber', label: 'LPO Number', description: 'Local purchase order number', sample: 'LPO-2026-0045' },
        { key: 'TankName', label: 'Tank Name', description: 'Destination tank', sample: 'Tank 01 - Diesel' },
        { key: 'SiteName', label: 'Site Name', description: 'Site name', sample: 'Main Depot' },
        { key: 'ProductName', label: 'Product Name', description: 'Fuel product name', sample: 'Diesel 50ppm' },
        { key: 'SupplierName', label: 'Supplier', description: 'Fuel supplier name', sample: 'TotalEnergies SA' },
        { key: 'ManualDeliveryAmount', label: 'Manual Amount (L)', description: 'Manually entered delivery volume', sample: '15,000.00' },
        { key: 'SensorDeliveryAmount', label: 'Sensor Amount (L)', description: 'Sensor-measured volume (if available)', sample: '14,850.00' },
        { key: 'StockBeforeDelivery', label: 'Stock Before', description: 'Tank volume before delivery (L)', sample: '22,400.00' },
        { key: 'StockAfterDelivery', label: 'Stock After', description: 'Tank volume after delivery (L)', sample: '37,400.00' },
        { key: 'TankCapacity', label: 'Tank Capacity', description: 'Total tank capacity (L)', sample: '50,000.00' },
        { key: 'FillPercentage', label: 'Fill %', description: 'Post-delivery fill percentage', sample: '74.8' },
        { key: 'PricePerLiter', label: 'Price / Liter', description: 'Cost per liter', sample: '21.50' },
        { key: 'TotalCost', label: 'Total Cost', description: 'Total delivery cost', sample: '322,500.00' },
        { key: 'DeliveryTemperature', label: 'Temperature (°C)', description: 'Fuel temperature at delivery', sample: '22.5' },
        { key: 'DeliveryDensity', label: 'Density', description: 'Fuel density at delivery', sample: '0.845' },
        { key: 'DeliveryDate', label: 'Delivery Date', description: 'Date of delivery', sample: '2026-02-19' },
        { key: 'IsSameDay', label: 'Same Day?', description: 'Whether entered on delivery date', sample: 'Yes' },
        { key: 'RecordedByName', label: 'Recorded By', description: 'User who recorded the delivery', sample: 'Jane Smith' },
    ],
    System: [
        { key: 'SubType', label: 'Sub Type', description: 'System event sub-type', sample: 'ScheduledCheck' },
        { key: 'SourceComponent', label: 'Source Component', description: 'Originating system component', sample: 'BackgroundService' },
        { key: 'ReferenceId', label: 'Reference ID', description: 'Related entity ID', sample: '42' },
        { key: 'ReferenceType', label: 'Reference Type', description: 'Related entity type', sample: 'Tank' },
    ],
    EventLifecycle: [
        { key: 'ActiveEventId', label: 'Active Event ID', description: 'ID of the active event', sample: '567' },
        { key: 'ActionType', label: 'Action Type', description: 'Lifecycle action', sample: 'Acknowledged' },
        { key: 'OriginalEventType', label: 'Original Event Type', description: 'Event type that created it', sample: 'TankStockDiscrepancy' },
        { key: 'ActionBy', label: 'Action By', description: 'Who performed the action', sample: 'admin' },
        { key: 'Notes', label: 'Notes', description: 'Action notes', sample: 'Investigated and resolved' },
        { key: 'EscalationLevel', label: 'Escalation Level', description: 'Current escalation level', sample: '2' },
    ],
};

// ─── Sample data for live preview (base fields) ───
const BASE_SAMPLE_DATA = {
    ExpressionName: 'Sample Expression',
    EventType: 'TankStockDiscrepancy',
    EventCategory: 'StockReconciliation',
    Severity: 'High',
    Priority: 'High',
    OccurredAt: '2026-02-19 14:30:00',
    TriggeredBy: 'System',
    Message: 'Sample event message with all details',
    SiteId: '1',
    TankId: '5',
    DeviceId: '12',
};

/**
 * Resolves the actual eventType key from the alertTypeKey.
 * The selectedTypeMetadata.eventType is the backend EventTypeName constant.
 */
const resolveEventType = (selectedTypeMetadata) => {
    return selectedTypeMetadata?.eventType || null;
};

const StepMessageTemplate = ({
    formData,
    onFieldChange,
    policyData,
    onPolicyChange,
    selectedTypeMetadata
}) => {
    const [editorMode, setEditorMode] = useState('visual'); // 'visual' | 'html'
    const [showPreview, setShowPreview] = useState(false);
    const [insertTarget, setInsertTarget] = useState('body'); // 'body' | 'title'
    const htmlEditorRef = useRef(null);
    // Track the last value written BY the editor so we can detect external changes
    // (quick-start templates, placeholder inserts in HTML mode) vs internal typing
    const lastEditorValueRef = useRef(formData.messageTemplate || '');

    // Sync external changes into the HtmlEditor without resetting cursor on typing
    useEffect(() => {
        const externalValue = formData.messageTemplate || '';
        if (externalValue !== lastEditorValueRef.current) {
            // Value was changed externally (quick-start template, placeholder insert, etc.)
            lastEditorValueRef.current = externalValue;
            if (htmlEditorRef.current?.instance) {
                htmlEditorRef.current.instance.option('value', externalValue);
            }
        }
    }, [formData.messageTemplate]);

    // Resolve the event type for placeholder lookup
    const eventType = resolveEventType(selectedTypeMetadata);
    const typeSpecificPlaceholders = EVENT_TYPE_PLACEHOLDERS[eventType] || [];

    // ─── Build sample data for preview ───
    const sampleData = useMemo(() => {
        const data = { ...BASE_SAMPLE_DATA };
        // Add type-specific samples
        for (const ph of typeSpecificPlaceholders) {
            if (ph.sample) {
                data[ph.key] = ph.sample;
            }
        }
        return data;
    }, [typeSpecificPlaceholders]);

    // ─── Render preview by replacing {{placeholders}} ───
    const renderedPreview = useMemo(() => {
        let template = formData.messageTemplate || '';
        if (!template) return '<em style="color:#999">No template defined — the default message will be used.</em>';

        for (const [key, value] of Object.entries(sampleData)) {
            const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
            template = template.replace(regex, `<span style="color:#4f46e5;font-weight:600">${value}</span>`);
        }
        // Highlight any remaining unresolved placeholders
        template = template.replace(
            /\{\{(\w+)\}\}/g,
            '<span style="color:#ef4444;font-weight:600;text-decoration:underline" title="Unknown placeholder">{{$1}}</span>'
        );
        return template;
    }, [formData.messageTemplate, sampleData]);

    // ─── Insert placeholder into the editor or title ───
    const insertPlaceholder = useCallback((key) => {
        const tag = `{{${key}}}`;
        if (insertTarget === 'title') {
            // Insert into the title template
            onPolicyChange('titleTemplate', (policyData.titleTemplate || '') + tag);
            return;
        }
        if (editorMode === 'visual' && htmlEditorRef.current) {
            const editor = htmlEditorRef.current.instance;
            const selection = editor.getSelection();
            const index = selection ? selection.index : editor.getLength() - 1;
            editor.insertText(index, tag);
        } else {
            // For HTML source mode: append to template
            onFieldChange('messageTemplate', (formData.messageTemplate || '') + tag);
        }
    }, [editorMode, formData.messageTemplate, onFieldChange, insertTarget, policyData.titleTemplate, onPolicyChange]);

    // ─── Render a placeholder group ───
    const renderPlaceholderGroup = (title, icon, placeholders, colorClass) => (
        <div className="tw-mb-4">
            <h5 className="tw-text-xs tw-font-semibold tw-text-gray-600 tw-mb-2 tw-flex tw-items-center tw-gap-1">
                <i className={`${icon} tw-text-xs ${colorClass}`} />
                {title}
            </h5>
            <div className="tw-flex tw-flex-wrap tw-gap-1">
                {placeholders.map((ph) => (
                    <button
                        key={ph.key}
                        type="button"
                        onClick={() => insertPlaceholder(ph.key)}
                        title={`${ph.description}${ph.sample ? `\nSample: ${ph.sample}` : ''}\nClick to insert`}
                        className="tw-inline-flex tw-items-center tw-bg-white tw-border tw-border-gray-200 tw-rounded tw-px-2 tw-py-0.5 tw-text-xs tw-font-mono tw-text-gray-600 hover:tw-bg-indigo-50 hover:tw-border-indigo-300 hover:tw-text-indigo-700 tw-cursor-pointer tw-transition-colors"
                    >
                        <i className="fa-light fa-plus tw-mr-1 tw-text-[10px] tw-opacity-50" />
                        {`{{${ph.key}}}`}
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div className="tw-flex tw-flex-col xl:tw-flex-row tw-gap-6">
            {/* ─── Left: Editor ─── */}
            <div className="tw-flex-1 tw-min-w-0">
                {/* Title Template */}
                <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-4 tw-mb-4">
                    <h4 className="tw-text-sm tw-font-semibold tw-text-gray-700 tw-mb-3">
                        <i className="fa-light fa-heading tw-mr-2 tw-text-amber-500" />
                        Title Template
                    </h4>
                    <TextBox
                        value={policyData.titleTemplate}
                        onValueChanged={(e) => onPolicyChange('titleTemplate', e.value)}
                        placeholder="e.g., Alert: {{EventType}} - {{Severity}}"
                        width="100%"
                    />
                    <p className="tw-text-xs tw-text-gray-400 tw-mt-1">
                        Used as the notification title / email subject line. Supports {'{{placeholders}}'}.
                        Click <strong>Insert into Title</strong> on the placeholder panel to add tags here.
                    </p>
                </div>

                {/* Attach Report Option — only for TankStockDiscrepancy */}
                {eventType === 'TankStockDiscrepancy' && (
                    <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-4 tw-mb-4">
                        <div className="tw-flex tw-items-center tw-justify-between">
                            <div className="tw-flex tw-items-center tw-gap-3">
                                <i className="fa-light fa-file-pdf tw-text-lg tw-text-red-500" />
                                <div>
                                    <h4 className="tw-text-sm tw-font-semibold tw-text-gray-700">
                                        Attach Tank Volume History Report
                                    </h4>
                                    <p className="tw-text-xs tw-text-gray-400 tw-mt-0.5">
                                        Generate and attach the Tank Volume History report as a PDF file in the notification email.
                                        The report covers the business date of the discrepancy event.
                                    </p>
                                </div>
                            </div>
                            <label className="tw-relative tw-inline-flex tw-items-center tw-cursor-pointer tw-flex-shrink-0 tw-ml-4">
                                <input
                                    type="checkbox"
                                    checked={!!formData.attachReport}
                                    onChange={(e) => onFieldChange('attachReport', e.target.checked)}
                                    className="tw-sr-only tw-peer"
                                />
                                <div className="tw-w-11 tw-h-6 tw-bg-gray-200 tw-rounded-full peer-checked:tw-bg-indigo-600 tw-transition-colors after:tw-content-[''] after:tw-absolute after:tw-top-[2px] after:tw-left-[2px] after:tw-bg-white after:tw-border-gray-300 after:tw-border after:tw-rounded-full after:tw-h-5 after:tw-w-5 after:tw-transition-all peer-checked:after:tw-translate-x-full peer-checked:after:tw-border-white" />
                            </label>
                        </div>
                        {formData.attachReport && (
                            <div className="tw-mt-3 tw-p-2 tw-bg-indigo-50 tw-rounded tw-border tw-border-indigo-100">
                                <p className="tw-text-xs tw-text-indigo-700">
                                    <i className="fa-light fa-circle-info tw-mr-1" />
                                    A PDF of the <strong>Transaction Volume History</strong> report for the affected tank and business date
                                    will be attached to the email. Max attachment size is 7 MB.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Message Template Editor */}
                <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-4 tw-mb-4">
                    <div className="tw-flex tw-items-center tw-justify-between tw-mb-3">
                        <h4 className="tw-text-sm tw-font-semibold tw-text-gray-700">
                            <i className="fa-light fa-file-code tw-mr-2 tw-text-teal-500" />
                            Message Template
                        </h4>
                        <div className="tw-flex tw-items-center tw-gap-2">
                            {/* Mode Toggle */}
                            <div className="tw-inline-flex tw-rounded-full tw-bg-gray-100 tw-p-0.5">
                                <button
                                    type="button"
                                    onClick={() => setEditorMode('visual')}
                                    className={`tw-px-3 tw-py-1 tw-text-xs tw-font-medium tw-rounded-full tw-border-0 tw-transition-all ${editorMode === 'visual'
                                        ? 'tw-bg-white tw-text-indigo-600 tw-shadow-sm'
                                        : 'tw-bg-transparent tw-text-gray-500 hover:tw-text-gray-700'
                                        }`}
                                >
                                    <i className="fa-light fa-eye tw-mr-1" />
                                    Visual
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditorMode('html')}
                                    className={`tw-px-3 tw-py-1 tw-text-xs tw-font-medium tw-rounded-full tw-border-0 tw-transition-all ${editorMode === 'html'
                                        ? 'tw-bg-white tw-text-indigo-600 tw-shadow-sm'
                                        : 'tw-bg-transparent tw-text-gray-500 hover:tw-text-gray-700'
                                        }`}
                                >
                                    <i className="fa-light fa-code tw-mr-1" />
                                    HTML
                                </button>
                            </div>
                            {/* Preview Toggle */}
                            <button
                                type="button"
                                onClick={() => setShowPreview(!showPreview)}
                                className={`tw-px-3 tw-py-1 tw-text-xs tw-font-medium tw-rounded-full tw-border-0 tw-transition-all ${showPreview
                                    ? 'tw-bg-green-100 tw-text-green-700'
                                    : 'tw-bg-gray-100 tw-text-gray-500 hover:tw-text-gray-700'
                                    }`}
                            >
                                <i className="fa-light fa-eye tw-mr-1" />
                                Preview
                            </button>
                        </div>
                    </div>

                    {editorMode === 'visual' ? (
                        <HtmlEditor
                            ref={htmlEditorRef}
                            defaultValue={formData.messageTemplate}
                            onValueChanged={(e) => {
                                lastEditorValueRef.current = e.value;
                                onFieldChange('messageTemplate', e.value);
                            }}
                            minHeight={600}
                            valueType="html"
                        >
                            <Toolbar multiline={false}>
                                <ToolbarItem name="undo" />
                                <ToolbarItem name="redo" />
                                <ToolbarItem name="separator" />
                                <ToolbarItem name="bold" />
                                <ToolbarItem name="italic" />
                                <ToolbarItem name="underline" />
                                <ToolbarItem name="strike" />
                                <ToolbarItem name="separator" />
                                <ToolbarItem name="color" />
                                <ToolbarItem name="background" />
                                <ToolbarItem name="separator" />
                                <ToolbarItem name="orderedList" />
                                <ToolbarItem name="bulletList" />
                                <ToolbarItem name="separator" />
                                <ToolbarItem name="alignLeft" />
                                <ToolbarItem name="alignCenter" />
                                <ToolbarItem name="alignRight" />
                                <ToolbarItem name="separator" />
                                <ToolbarItem name="link" />
                                <ToolbarItem name="header" acceptedValues={[false, 1, 2, 3]} />
                            </Toolbar>
                        </HtmlEditor>
                    ) : (
                        <textarea
                            value={formData.messageTemplate || ''}
                            onChange={(e) => onFieldChange('messageTemplate', e.target.value)}
                            className="tw-w-full tw-p-3 tw-font-mono tw-text-sm tw-border tw-border-gray-200 tw-rounded-lg tw-resize-y focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-indigo-300 focus:tw-border-indigo-300"
                            style={{ height: 600 }}
                            placeholder="<p>Tank <strong>{{TankName}}</strong> at {{SiteName}} detected a {{VarianceType}} of <strong>{{Variance}}</strong> {{Unit}}.</p>"
                            spellCheck={false}
                        />
                    )}

                    <p className="tw-text-xs tw-text-gray-400 tw-mt-2">
                        <i className="fa-light fa-circle-info tw-mr-1" />
                        Supports HTML formatting. Use {'{{PlaceholderName}}'} to insert dynamic values.
                        Overrides the notification policy message template if set.
                    </p>
                </div>

                {/* ─── Live Preview ─── */}
                {showPreview && (
                    <div className="tw-bg-white tw-rounded-lg tw-border tw-border-green-200 tw-p-4">
                        <div className="tw-flex tw-items-center tw-justify-between tw-mb-3">
                            <h4 className="tw-text-sm tw-font-semibold tw-text-gray-700">
                                <i className="fa-light fa-eye tw-mr-2 tw-text-green-500" />
                                Live Preview
                                <span className="tw-text-xs tw-font-normal tw-text-gray-400 tw-ml-2">
                                    (with sample data)
                                </span>
                            </h4>
                        </div>

                        {/* Title preview */}
                        {policyData.titleTemplate && (
                            <div className="tw-mb-3">
                                <label className="tw-text-xs tw-font-medium tw-text-gray-500 tw-block tw-mb-1">Title</label>
                                <div
                                    className="tw-bg-gray-50 tw-rounded tw-p-2 tw-text-sm tw-font-semibold tw-text-gray-800"
                                    dangerouslySetInnerHTML={{
                                        __html: (() => {
                                            let t = policyData.titleTemplate;
                                            for (const [key, value] of Object.entries(sampleData)) {
                                                const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
                                                t = t.replace(regex, `<span style="color:#4f46e5">${value}</span>`);
                                            }
                                            return t;
                                        })()
                                    }}
                                />
                            </div>
                        )}

                        {/* Message preview */}
                        <div>
                            <label className="tw-text-xs tw-font-medium tw-text-gray-500 tw-block tw-mb-1">Message Body</label>
                            <div
                                className="tw-bg-gray-50 tw-rounded tw-p-3 tw-text-sm tw-text-gray-700 tw-leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: renderedPreview }}
                            />
                        </div>

                        <div className="tw-mt-3 tw-p-2 tw-bg-blue-50 tw-rounded tw-border tw-border-blue-100">
                            <p className="tw-text-xs tw-text-blue-600">
                                <i className="fa-light fa-circle-info tw-mr-1" />
                                <strong>Indigo values</strong> = resolved placeholders.
                                <strong className="tw-text-red-500 tw-ml-2">Red underlined</strong> = unrecognized placeholders.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* ─── Right: Placeholder Reference ─── */}
            <div className="tw-w-full xl:tw-w-80 tw-flex-shrink-0">
                <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-4 tw-sticky tw-top-4">
                    <h4 className="tw-text-sm tw-font-semibold tw-text-gray-700 tw-mb-1">
                        <i className="fa-light fa-brackets-curly tw-mr-2 tw-text-indigo-500" />
                        Available Placeholders
                    </h4>
                    <p className="tw-text-xs tw-text-gray-400 tw-mb-3">
                        Click a placeholder to insert it at the cursor position.
                    </p>

                    {/* Insert target toggle: Body vs Title */}
                    <div className="tw-inline-flex tw-rounded-full tw-bg-gray-100 tw-p-0.5 tw-mb-4 tw-w-full">
                        <button
                            type="button"
                            onClick={() => setInsertTarget('body')}
                            className={`tw-flex-1 tw-px-3 tw-py-1.5 tw-text-xs tw-font-medium tw-rounded-full tw-border-0 tw-transition-all ${insertTarget === 'body'
                                ? 'tw-bg-white tw-text-teal-600 tw-shadow-sm'
                                : 'tw-bg-transparent tw-text-gray-500 hover:tw-text-gray-700'
                                }`}
                        >
                            <i className="fa-light fa-file-code tw-mr-1" />
                            Into Body
                        </button>
                        <button
                            type="button"
                            onClick={() => setInsertTarget('title')}
                            className={`tw-flex-1 tw-px-3 tw-py-1.5 tw-text-xs tw-font-medium tw-rounded-full tw-border-0 tw-transition-all ${insertTarget === 'title'
                                ? 'tw-bg-white tw-text-amber-600 tw-shadow-sm'
                                : 'tw-bg-transparent tw-text-gray-500 hover:tw-text-gray-700'
                                }`}
                        >
                            <i className="fa-light fa-heading tw-mr-1" />
                            Into Title
                        </button>
                    </div>

                    {/* Event-type-specific placeholders first (most useful) */}
                    {typeSpecificPlaceholders.length > 0 && (
                        renderPlaceholderGroup(
                            `${selectedTypeMetadata?.displayName || eventType} Fields`,
                            selectedTypeMetadata?.categoryIcon || 'fa-light fa-bolt',
                            typeSpecificPlaceholders,
                            'tw-text-indigo-500'
                        )
                    )}

                    {/* Base placeholders */}
                    {renderPlaceholderGroup(
                        'Common Fields (All Events)',
                        'fa-light fa-globe',
                        BASE_PLACEHOLDERS,
                        'tw-text-gray-400'
                    )}

                    {/* No event type selected hint */}
                    {!eventType && (
                        <div className="tw-bg-amber-50 tw-border tw-border-amber-200 tw-rounded-lg tw-p-3 tw-mt-2">
                            <p className="tw-text-xs tw-text-amber-700">
                                <i className="fa-light fa-triangle-exclamation tw-mr-1" />
                                Select an Event Type in Step 2 to see type-specific placeholders.
                            </p>
                        </div>
                    )}

                    {/* Quick-start templates */}
                    <div className="tw-mt-4 tw-pt-4 tw-border-t tw-border-gray-100">
                        <h5 className="tw-text-xs tw-font-semibold tw-text-gray-600 tw-mb-2">
                            <i className="fa-light fa-wand-magic-sparkles tw-mr-1 tw-text-purple-400" />
                            Quick-Start Templates
                        </h5>
                        {eventType === 'TankStockDiscrepancy' && (
                            <button
                                type="button"
                                onClick={() => onFieldChange('messageTemplate',
                                    '<p><strong>Stock Discrepancy Alert</strong> — {{BusinessDate}}</p>' +
                                    '<p>Site: <strong>{{SiteName}}</strong> | Tank: <strong>{{TankName}}</strong> ({{ProductName}})</p>' +
                                    '<table style="border-collapse:collapse;width:100%;margin:8px 0">' +
                                    '<tr style="background:#f3f4f6"><td style="padding:4px 8px;border:1px solid #e5e7eb;font-weight:600" colspan="2">Stock Levels</td></tr>' +
                                    '<tr><td style="padding:4px 8px;border:1px solid #e5e7eb">Opening Stock</td><td style="padding:4px 8px;border:1px solid #e5e7eb"><strong>{{OpeningStock}}</strong> {{Unit}}</td></tr>' +
                                    '<tr><td style="padding:4px 8px;border:1px solid #e5e7eb">Expected Closing</td><td style="padding:4px 8px;border:1px solid #e5e7eb"><strong>{{ExpectedClosingStock}}</strong> {{Unit}}</td></tr>' +
                                    '<tr><td style="padding:4px 8px;border:1px solid #e5e7eb">Actual Closing</td><td style="padding:4px 8px;border:1px solid #e5e7eb"><strong>{{ClosingStock}}</strong> {{Unit}}</td></tr>' +
                                    '<tr><td style="padding:4px 8px;border:1px solid #e5e7eb">Variance</td><td style="padding:4px 8px;border:1px solid #e5e7eb;color:#dc2626"><strong>{{Variance}}</strong> {{Unit}} ({{VariancePercentage}}%) — {{VarianceType}}</td></tr>' +
                                    '<tr style="background:#f3f4f6"><td style="padding:4px 8px;border:1px solid #e5e7eb;font-weight:600" colspan="2">Transaction Breakdown</td></tr>' +
                                    '<tr><td style="padding:4px 8px;border:1px solid #e5e7eb">Deliveries</td><td style="padding:4px 8px;border:1px solid #e5e7eb">{{TotalDeliveries}} {{Unit}}</td></tr>' +
                                    '<tr><td style="padding:4px 8px;border:1px solid #e5e7eb">Dispensing (Total)</td><td style="padding:4px 8px;border:1px solid #e5e7eb">{{TotalDispensing}} {{Unit}}</td></tr>' +
                                    '<tr><td style="padding:4px 8px;border:1px solid #e5e7eb">&nbsp;&nbsp;• Manual</td><td style="padding:4px 8px;border:1px solid #e5e7eb">{{TotalManualDispensing}} {{Unit}}</td></tr>' +
                                    '<tr><td style="padding:4px 8px;border:1px solid #e5e7eb">&nbsp;&nbsp;• Automated (PTS)</td><td style="padding:4px 8px;border:1px solid #e5e7eb">{{TotalAutomatedDispensing}} {{Unit}}</td></tr>' +
                                    '<tr><td style="padding:4px 8px;border:1px solid #e5e7eb">Transfers In</td><td style="padding:4px 8px;border:1px solid #e5e7eb">{{TotalTransfersIn}} {{Unit}}</td></tr>' +
                                    '<tr><td style="padding:4px 8px;border:1px solid #e5e7eb">Transfers Out</td><td style="padding:4px 8px;border:1px solid #e5e7eb">{{TotalTransfersOut}} {{Unit}}</td></tr>' +
                                    '<tr><td style="padding:4px 8px;border:1px solid #e5e7eb">In-Tank Deliveries</td><td style="padding:4px 8px;border:1px solid #e5e7eb">{{TotalInTankDeliveries}} {{Unit}}</td></tr>' +
                                    '<tr><td style="padding:4px 8px;border:1px solid #e5e7eb">Adjustments</td><td style="padding:4px 8px;border:1px solid #e5e7eb">{{TotalAdjustments}} {{Unit}}</td></tr>' +
                                    '<tr style="background:#f3f4f6"><td style="padding:4px 8px;border:1px solid #e5e7eb;font-weight:600">Net Movement</td><td style="padding:4px 8px;border:1px solid #e5e7eb;font-weight:600">{{NetMovement}} {{Unit}}</td></tr>' +
                                    '</table>' +
                                    '<p style="margin:12px 0"><a href="{{ReportUrl}}" style="display:inline-block;padding:8px 16px;background:#4f46e5;color:#ffffff;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600">View Full Report &rarr;</a></p>' +
                                    '<p style="font-size:12px;color:#6b7280">Transactions: {{TransactionCount}} | Severity: {{Severity}} | Expression: {{ExpressionName}}</p>'
                                )}
                                className="tw-text-left tw-w-full tw-p-2 tw-rounded tw-border tw-border-dashed tw-border-gray-300 tw-text-xs tw-text-gray-600 hover:tw-bg-purple-50 hover:tw-border-purple-300 tw-cursor-pointer tw-transition-colors"
                            >
                                <i className="fa-light fa-table tw-mr-1 tw-text-purple-400" />
                                Stock Discrepancy — Table Layout
                            </button>
                        )}
                        {eventType === 'SensorVariance' && (
                            <button
                                type="button"
                                onClick={() => onFieldChange('messageTemplate',
                                    '<p><strong>Sensor Variance Alert</strong></p>' +
                                    '<p>Site: <strong>{{SiteName}}</strong> | Tank: <strong>{{TankName}}</strong></p>' +
                                    '<table style="border-collapse:collapse;width:100%;margin:8px 0">' +
                                    '<tr><td style="padding:4px 8px;border:1px solid #e5e7eb">Manual Dip Reading</td><td style="padding:4px 8px;border:1px solid #e5e7eb"><strong>{{ManualReading}}</strong> {{Unit}}</td></tr>' +
                                    '<tr><td style="padding:4px 8px;border:1px solid #e5e7eb">Sensor/ATG Reading</td><td style="padding:4px 8px;border:1px solid #e5e7eb"><strong>{{SensorReading}}</strong> {{Unit}}</td></tr>' +
                                    '<tr><td style="padding:4px 8px;border:1px solid #e5e7eb">Variance</td><td style="padding:4px 8px;border:1px solid #e5e7eb;color:#dc2626"><strong>{{Variance}}</strong> {{Unit}} ({{VariancePercentage}}%)</td></tr>' +
                                    '</table>' +
                                    '<p style="font-size:12px;color:#6b7280">Severity: {{Severity}} | Triggered by: {{TriggeredBy}}</p>'
                                )}
                                className="tw-text-left tw-w-full tw-p-2 tw-rounded tw-border tw-border-dashed tw-border-gray-300 tw-text-xs tw-text-gray-600 hover:tw-bg-purple-50 hover:tw-border-purple-300 tw-cursor-pointer tw-transition-colors"
                            >
                                <i className="fa-light fa-table tw-mr-1 tw-text-purple-400" />
                                Sensor Variance — Table Layout
                            </button>
                        )}
                        {eventType === 'InTankDelivery' && (
                            <button
                                type="button"
                                onClick={() => onFieldChange('messageTemplate',
                                    '<p><strong>In-Tank Delivery Detected</strong></p>' +
                                    '<p>Site: <strong>{{SiteName}}</strong> | Tank: <strong>{{TankName}}</strong> | PTS: <strong>{{PtsDeviceName}}</strong></p>' +
                                    '<table style="border-collapse:collapse;width:100%;margin:8px 0">' +
                                    '<tr style="background:#f0fdf4"><td style="padding:4px 8px;border:1px solid #e5e7eb;font-weight:600" colspan="2">Delivery Details</td></tr>' +
                                    '<tr><td style="padding:4px 8px;border:1px solid #e5e7eb">Fuel Grade</td><td style="padding:4px 8px;border:1px solid #e5e7eb"><strong>{{FuelGrade}}</strong></td></tr>' +
                                    '<tr><td style="padding:4px 8px;border:1px solid #e5e7eb">Volume Delivered</td><td style="padding:4px 8px;border:1px solid #e5e7eb;color:#059669"><strong>{{Volume}}</strong> L</td></tr>' +
                                    '<tr><td style="padding:4px 8px;border:1px solid #e5e7eb">Fill %</td><td style="padding:4px 8px;border:1px solid #e5e7eb">{{VolumePercentage}}% of capacity</td></tr>' +
                                    '<tr style="background:#f0fdf4"><td style="padding:4px 8px;border:1px solid #e5e7eb;font-weight:600" colspan="2">Tank Levels</td></tr>' +
                                    '<tr><td style="padding:4px 8px;border:1px solid #e5e7eb">Pre-Delivery Level</td><td style="padding:4px 8px;border:1px solid #e5e7eb">{{PreDeliveryLevel}} L</td></tr>' +
                                    '<tr><td style="padding:4px 8px;border:1px solid #e5e7eb">Post-Delivery Level</td><td style="padding:4px 8px;border:1px solid #e5e7eb"><strong>{{PostDeliveryLevel}}</strong> L</td></tr>' +
                                    '<tr><td style="padding:4px 8px;border:1px solid #e5e7eb">Tank Capacity</td><td style="padding:4px 8px;border:1px solid #e5e7eb">{{TankCapacity}} L</td></tr>' +
                                    '<tr style="background:#f0fdf4"><td style="padding:4px 8px;border:1px solid #e5e7eb;font-weight:600" colspan="2">Timing</td></tr>' +
                                    '<tr><td style="padding:4px 8px;border:1px solid #e5e7eb">Start</td><td style="padding:4px 8px;border:1px solid #e5e7eb">{{StartTime}}</td></tr>' +
                                    '<tr><td style="padding:4px 8px;border:1px solid #e5e7eb">End</td><td style="padding:4px 8px;border:1px solid #e5e7eb">{{EndTime}}</td></tr>' +
                                    '<tr><td style="padding:4px 8px;border:1px solid #e5e7eb">Detected</td><td style="padding:4px 8px;border:1px solid #e5e7eb">{{DetectedAt}}</td></tr>' +
                                    '</table>' +
                                    '<p style="font-size:12px;color:#6b7280">Status: {{Status}} | Matched Manual ID: {{MatchedManualDeliveryId}} | Delivery #{{DeliveryId}}</p>'
                                )}
                                className="tw-text-left tw-w-full tw-p-2 tw-rounded tw-border tw-border-dashed tw-border-gray-300 tw-text-xs tw-text-gray-600 hover:tw-bg-green-50 hover:tw-border-green-300 tw-cursor-pointer tw-transition-colors"
                            >
                                <i className="fa-light fa-truck-ramp-box tw-mr-1 tw-text-green-500" />
                                In-Tank Delivery — Detection Card
                            </button>
                        )}
                        {eventType === 'ManualDelivery' && (
                            <button
                                type="button"
                                onClick={() => onFieldChange('messageTemplate',
                                    '<p><strong>Manual Delivery Entry</strong> — {{DeliveryDate}}</p>' +
                                    '<p>Site: <strong>{{SiteName}}</strong> | Tank: <strong>{{TankName}}</strong></p>' +
                                    '<table style="border-collapse:collapse;width:100%;margin:8px 0">' +
                                    '<tr style="background:#eff6ff"><td style="padding:4px 8px;border:1px solid #e5e7eb;font-weight:600" colspan="2">Delivery Information</td></tr>' +
                                    '<tr><td style="padding:4px 8px;border:1px solid #e5e7eb">LPO Number</td><td style="padding:4px 8px;border:1px solid #e5e7eb"><strong>{{LpoNumber}}</strong></td></tr>' +
                                    '<tr><td style="padding:4px 8px;border:1px solid #e5e7eb">Supplier</td><td style="padding:4px 8px;border:1px solid #e5e7eb">{{SupplierName}}</td></tr>' +
                                    '<tr><td style="padding:4px 8px;border:1px solid #e5e7eb">Product</td><td style="padding:4px 8px;border:1px solid #e5e7eb"><strong>{{ProductName}}</strong></td></tr>' +
                                    '<tr><td style="padding:4px 8px;border:1px solid #e5e7eb">Same Day Entry?</td><td style="padding:4px 8px;border:1px solid #e5e7eb">{{IsSameDay}}</td></tr>' +
                                    '<tr style="background:#eff6ff"><td style="padding:4px 8px;border:1px solid #e5e7eb;font-weight:600" colspan="2">Volume</td></tr>' +
                                    '<tr><td style="padding:4px 8px;border:1px solid #e5e7eb">Manual Amount</td><td style="padding:4px 8px;border:1px solid #e5e7eb;color:#2563eb"><strong>{{ManualDeliveryAmount}}</strong> L</td></tr>' +
                                    '<tr><td style="padding:4px 8px;border:1px solid #e5e7eb">Sensor Amount</td><td style="padding:4px 8px;border:1px solid #e5e7eb">{{SensorDeliveryAmount}} L</td></tr>' +
                                    '<tr><td style="padding:4px 8px;border:1px solid #e5e7eb">Stock Before</td><td style="padding:4px 8px;border:1px solid #e5e7eb">{{StockBeforeDelivery}} L</td></tr>' +
                                    '<tr><td style="padding:4px 8px;border:1px solid #e5e7eb">Stock After</td><td style="padding:4px 8px;border:1px solid #e5e7eb"><strong>{{StockAfterDelivery}}</strong> L</td></tr>' +
                                    '<tr><td style="padding:4px 8px;border:1px solid #e5e7eb">Fill %</td><td style="padding:4px 8px;border:1px solid #e5e7eb">{{FillPercentage}}%</td></tr>' +
                                    '<tr style="background:#eff6ff"><td style="padding:4px 8px;border:1px solid #e5e7eb;font-weight:600" colspan="2">Costing</td></tr>' +
                                    '<tr><td style="padding:4px 8px;border:1px solid #e5e7eb">Price / Liter</td><td style="padding:4px 8px;border:1px solid #e5e7eb">R {{PricePerLiter}}</td></tr>' +
                                    '<tr><td style="padding:4px 8px;border:1px solid #e5e7eb;font-weight:600">Total Cost</td><td style="padding:4px 8px;border:1px solid #e5e7eb;font-weight:600;color:#2563eb">R {{TotalCost}}</td></tr>' +
                                    '</table>' +
                                    '<p style="font-size:12px;color:#6b7280">Temp: {{DeliveryTemperature}}°C | Density: {{DeliveryDensity}} | Recorded by: {{RecordedByName}} | Delivery #{{DeliveryId}}</p>'
                                )}
                                className="tw-text-left tw-w-full tw-p-2 tw-rounded tw-border tw-border-dashed tw-border-gray-300 tw-text-xs tw-text-gray-600 hover:tw-bg-blue-50 hover:tw-border-blue-300 tw-cursor-pointer tw-transition-colors"
                            >
                                <i className="fa-light fa-file-invoice tw-mr-1 tw-text-blue-500" />
                                Manual Delivery — Full Detail Card
                            </button>
                        )}
                        {!eventType && (
                            <p className="tw-text-xs tw-text-gray-400 tw-italic">
                                Select an event type to see quick-start templates.
                            </p>
                        )}
                        {eventType && eventType !== 'TankStockDiscrepancy' && eventType !== 'SensorVariance' && eventType !== 'InTankDelivery' && eventType !== 'ManualDelivery' && (
                            <button
                                type="button"
                                onClick={() => onFieldChange('messageTemplate',
                                    '<p><strong>{{EventType}} Alert</strong> — Severity: {{Severity}}</p>' +
                                    '<p>{{Message}}</p>' +
                                    '<p style="font-size:12px;color:#6b7280">Expression: {{ExpressionName}} | {{OccurredAt}}</p>'
                                )}
                                className="tw-text-left tw-w-full tw-p-2 tw-rounded tw-border tw-border-dashed tw-border-gray-300 tw-text-xs tw-text-gray-600 hover:tw-bg-purple-50 hover:tw-border-purple-300 tw-cursor-pointer tw-transition-colors"
                            >
                                <i className="fa-light fa-file-lines tw-mr-1 tw-text-purple-400" />
                                Generic Alert Template
                            </button>
                        )}
                    </div>

                    {/* Delivery template preview card */}
                    {(eventType === 'InTankDelivery' || eventType === 'ManualDelivery') && (
                        <div className="tw-mt-4 tw-pt-4 tw-border-t tw-border-gray-100">
                            <h5 className="tw-text-xs tw-font-semibold tw-text-gray-600 tw-mb-2">
                                <i className="fa-light fa-eye tw-mr-1 tw-text-green-500" />
                                Sample Delivery Card
                            </h5>
                            <DeliveryEventTemplate eventType={eventType} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StepMessageTemplate;
