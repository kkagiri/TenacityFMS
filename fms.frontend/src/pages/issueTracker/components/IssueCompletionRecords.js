/**
 * File: IssueCompletionRecords.js
 * Purpose: Display structured completion records for an issue with collapsible action cards.
 *          Shows completion summary header, expand/collapse controls, and per-action detail panels
 *          with device changes, camera installs, and root cause information.
 * Dependencies: React, DevExtreme LoadIndicator, issueTrackerV2Service
 * Last Modified: 2026-02-24
 *
 * Key Components:
 * - IssueCompletionRecords: Fetches and renders completion records with expandable detail cards
 */
import React, { useEffect, useState, useCallback } from 'react';
import LoadIndicator from 'devextreme-react/load-indicator';
import issueTrackerV2Service from '../../../services/issueTrackerV2Service';

const parseAsUtc = (dateValue) => {
    if (!dateValue) return null;
    if (dateValue instanceof Date) return dateValue;
    const str = String(dateValue).trim();
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(str) && !/[Zz+\-]\d{0,4}$/.test(str)) {
        return new Date(str + 'Z');
    }
    return new Date(str);
};

const formatDate = (dateValue) => {
    const date = parseAsUtc(dateValue);
    if (!date || Number.isNaN(date.getTime())) return '';
    return date.toLocaleString(undefined, {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
    });
};

const TYPE_STYLES = {
    DeviceChange: { bg: 'tw-bg-blue-100', text: 'tw-text-blue-700', icon: 'fa-light fa-microchip', label: 'Device Change' },
    CameraInstall: { bg: 'tw-bg-purple-100', text: 'tw-text-purple-700', icon: 'fa-light fa-camera', label: 'Camera Install' },
    General: { bg: 'tw-bg-gray-100', text: 'tw-text-gray-700', icon: 'fa-light fa-wrench', label: 'General' }
};

/**
 * @param {Object} props
 * @param {number} props.issueId - Issue ID to load records for
 */
const IssueCompletionRecords = ({ issueId }) => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedIds, setExpandedIds] = useState(new Set());

    const loadRecords = useCallback(async () => {
        if (!issueId) return;
        try {
            setLoading(true);
            setError(null);
            const data = await issueTrackerV2Service.getCompletionRecords(issueId);
            setRecords(data || []);
            // Auto-expand first record only
            if (data?.length > 0) {
                setExpandedIds(new Set([data[0].id]));
            }
        } catch (err) {
            console.error('Error loading completion records:', err);
            setError('Failed to load completion records');
            setRecords([]);
        } finally {
            setLoading(false);
        }
    }, [issueId]);

    useEffect(() => { loadRecords(); }, [loadRecords]);

    const toggleExpand = useCallback((id) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }, []);

    const expandAll = () => setExpandedIds(new Set(records.map(r => r.id)));
    const collapseAll = () => setExpandedIds(new Set());

    if (loading) {
        return (
            <div className="tw-flex tw-items-center tw-justify-center tw-py-10">
                <LoadIndicator visible={true} />
                <span className="tw-ml-3 tw-text-gray-500">Loading completion records...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="tw-text-center tw-py-10">
                <i className="fa-light fa-triangle-exclamation tw-text-3xl tw-text-red-400 tw-mb-2"></i>
                <p className="tw-text-sm tw-text-red-600">{error}</p>
                <button onClick={loadRecords} className="tw-mt-2 tw-text-sm tw-text-blue-600 hover:tw-underline">Retry</button>
            </div>
        );
    }

    if (records.length === 0) {
        return (
            <div className="tw-text-center tw-py-10">
                <i className="fa-light fa-clipboard-list tw-text-4xl tw-text-gray-300 tw-mb-3"></i>
                <p className="tw-text-sm tw-text-gray-500">No structured completion records found.</p>
                <p className="tw-text-xs tw-text-gray-400 tw-mt-1">
                    Completion records appear when an issue is completed using the structured form.
                </p>
            </div>
        );
    }

    const completedBy = records[0]?.completedByUserName || 'Unknown';
    const completedAt = records[0]?.completedAt;
    const allExpanded = expandedIds.size === records.length;

    return (
        <div>
            {/* ─── Summary Header ─── */}
            <div className="tw-flex tw-items-center tw-gap-3 tw-mb-4 tw-p-3 tw-rounded-lg tw-bg-green-50 tw-border tw-border-green-200">
                <div className="tw-w-10 tw-h-10 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-bg-green-500 tw-text-white">
                    <i className="fa-light fa-circle-check tw-text-lg"></i>
                </div>
                <div className="tw-flex-1">
                    <p className="tw-text-sm tw-font-semibold tw-text-gray-900">
                        Completed by {completedBy}
                    </p>
                    {completedAt && (
                        <p className="tw-text-xs tw-text-gray-500">{formatDate(completedAt)}</p>
                    )}
                </div>
                <div className="tw-flex tw-items-center tw-gap-2">
                    <span className="tw-text-xs tw-bg-green-100 tw-text-green-700 tw-px-2 tw-py-1 tw-rounded-full tw-font-medium">
                        {records.length} action{records.length !== 1 ? 's' : ''}
                    </span>
                    <button type="button" onClick={allExpanded ? collapseAll : expandAll}
                        className="tw-text-xs tw-text-gray-500 hover:tw-text-gray-700 tw-px-2 tw-py-1 tw-rounded tw-border tw-border-gray-200 hover:tw-bg-gray-50">
                        <i className={`fa-light ${allExpanded ? 'fa-compress' : 'fa-expand'} tw-mr-1`}></i>
                        {allExpanded ? 'Collapse' : 'Expand'} All
                    </button>
                </div>
            </div>

            {/* ─── Action Cards ─── */}
            <div className="tw-space-y-2">
                {records.map((record, index) => {
                    const style = TYPE_STYLES[record.actionType] || TYPE_STYLES.General;
                    const isExpanded = expandedIds.has(record.id);
                    const hasDeviceInfo = record.oldDeviceImei || record.newDeviceImei;
                    const hasCameraInfo = record.cameraImei || record.cameraPosition;
                    const hasDetails = record.rootCause || record.notes || hasDeviceInfo || hasCameraInfo;

                    return (
                        <div key={record.id || index}
                            className="tw-border tw-rounded-lg tw-bg-white tw-overflow-hidden tw-transition-shadow hover:tw-shadow-sm">

                            {/* Compact row — always visible */}
                            <button type="button" onClick={() => toggleExpand(record.id)}
                                className="tw-w-full tw-text-left tw-flex tw-items-center tw-gap-3 tw-p-3 tw-transition-colors hover:tw-bg-gray-50">
                                <div className={`tw-w-8 tw-h-8 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-flex-shrink-0 ${style.bg} ${style.text}`}>
                                    <i className={`${style.icon} tw-text-sm`}></i>
                                </div>
                                <div className="tw-flex-1 tw-min-w-0">
                                    <span className="tw-font-medium tw-text-gray-900 tw-text-sm">{record.actionName}</span>
                                    <span className={`tw-ml-2 tw-text-[10px] tw-px-1.5 tw-py-0.5 tw-rounded-full tw-font-medium ${style.bg} ${style.text}`}>
                                        {style.label}
                                    </span>
                                </div>
                                {/* Quick indicators */}
                                <div className="tw-flex tw-items-center tw-gap-1.5 tw-flex-shrink-0">
                                    {hasDeviceInfo && <i className="fa-light fa-microchip tw-text-blue-400 tw-text-xs" title="Device info"></i>}
                                    {hasCameraInfo && <i className="fa-light fa-camera tw-text-purple-400 tw-text-xs" title="Camera info"></i>}
                                    {record.rootCause && <i className="fa-light fa-magnifying-glass tw-text-amber-400 tw-text-xs" title="Root cause"></i>}
                                </div>
                                <i className={`fa-light fa-chevron-${isExpanded ? 'up' : 'down'} tw-text-gray-400 tw-text-xs tw-flex-shrink-0`}></i>
                            </button>

                            {/* Expanded details */}
                            {isExpanded && hasDetails && (
                                <div className="tw-px-4 tw-pb-4 tw-pt-1 tw-border-t tw-border-gray-100">
                                    <div className="tw-ml-11 tw-space-y-3">
                                        {/* Root Cause */}
                                        {record.rootCause && (
                                            <div>
                                                <span className="tw-text-[10px] tw-font-bold tw-text-amber-600 tw-uppercase tw-tracking-wider">Root Cause</span>
                                                <p className="tw-text-sm tw-text-gray-800 tw-mt-0.5">{record.rootCause}</p>
                                            </div>
                                        )}

                                        {/* Device Details */}
                                        {hasDeviceInfo && (
                                            <div className="tw-p-2.5 tw-rounded-md tw-bg-blue-50/60 tw-border tw-border-blue-100">
                                                <div className="tw-flex tw-items-center tw-gap-1.5 tw-mb-1.5">
                                                    <i className="fa-light fa-microchip tw-text-blue-600 tw-text-xs"></i>
                                                    <span className="tw-text-[10px] tw-font-bold tw-text-blue-700 tw-uppercase tw-tracking-wider">Device</span>
                                                </div>
                                                <div className="tw-grid tw-grid-cols-2 tw-gap-x-4 tw-gap-y-1 tw-text-sm">
                                                    {record.oldDeviceType && <DetailRow label="Old Type" value={record.oldDeviceType} />}
                                                    {record.oldDeviceImei && <DetailRow label="Old IMEI" value={record.oldDeviceImei} mono />}
                                                    {record.newDeviceType && <DetailRow label="New Type" value={record.newDeviceType} />}
                                                    {record.newDeviceImei && <DetailRow label="New IMEI" value={record.newDeviceImei} mono />}
                                                    {record.devicePhoneNumber && <DetailRow label="Phone" value={record.devicePhoneNumber} />}
                                                    {record.sourceVehicleHyoungNo && <DetailRow label="Source Vehicle" value={record.sourceVehicleHyoungNo} />}
                                                </div>
                                            </div>
                                        )}

                                        {/* Camera Details */}
                                        {hasCameraInfo && (
                                            <div className="tw-p-2.5 tw-rounded-md tw-bg-purple-50/60 tw-border tw-border-purple-100">
                                                <div className="tw-flex tw-items-center tw-gap-1.5 tw-mb-1.5">
                                                    <i className="fa-light fa-camera tw-text-purple-600 tw-text-xs"></i>
                                                    <span className="tw-text-[10px] tw-font-bold tw-text-purple-700 tw-uppercase tw-tracking-wider">Camera</span>
                                                </div>
                                                <div className="tw-grid tw-grid-cols-2 tw-gap-x-4 tw-gap-y-1 tw-text-sm">
                                                    {record.cameraImei && <DetailRow label="IMEI" value={record.cameraImei} mono />}
                                                    {record.cameraPosition && <DetailRow label="Position" value={record.cameraPosition} />}
                                                    {record.cameraSimNumber && <DetailRow label="SIM" value={record.cameraSimNumber} />}
                                                </div>
                                            </div>
                                        )}

                                        {/* Notes */}
                                        {record.notes && (
                                            <div>
                                                <span className="tw-text-[10px] tw-font-bold tw-text-gray-500 tw-uppercase tw-tracking-wider">Notes</span>
                                                <p className="tw-text-sm tw-text-gray-700 tw-mt-0.5 tw-whitespace-pre-wrap">{record.notes}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Expanded but no details */}
                            {isExpanded && !hasDetails && (
                                <div className="tw-px-4 tw-pb-3 tw-pt-1 tw-border-t tw-border-gray-100">
                                    <p className="tw-ml-11 tw-text-xs tw-text-gray-400 tw-italic">No additional details recorded for this action.</p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

/** Small helper for label/value rows in device & camera sections */
const DetailRow = ({ label, value, mono = false }) => (
    <div>
        <span className="tw-text-gray-500">{label}:</span>{' '}
        <span className={`tw-text-gray-800 ${mono ? 'tw-font-mono' : ''}`}>{value}</span>
    </div>
);

export default IssueCompletionRecords;
