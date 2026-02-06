/**
 * File: IssuePrintPopup.js
 * Purpose: Print/Share popup dialog for issue details with activity stream
 * Dependencies: React, DevExtreme Popup, IssueActivityStream
 * Last Modified: 2026-02-05
 *
 * Key Components:
 * - IssuePrintPopup: Popup dialog with print-friendly issue details
 */
import React, { useRef, useCallback } from 'react';
import Popup from 'devextreme-react/popup';
import Button from 'devextreme-react/button';
import IssueActivityStream from './IssueActivityStream';

const getStatusColor = (status) => {
    const statusMap = {
        'Open': '#3B82F6',
        'In Progress': '#F59E0B',
        'Resolved': '#10B981',
        'Closed': '#6B7280',
        'Pending': '#F97316',
        'Rejected': '#EF4444'
    };
    return statusMap[status] || '#6B7280';
};

const getPriorityColor = (priority) => {
    const priorityMap = {
        'Critical': '#DC2626',
        'High': '#EA580C',
        'Medium': '#D97706',
        'Low': '#16A34A'
    };
    return priorityMap[priority] || '#6B7280';
};

const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return dateValue;
    return date.toLocaleDateString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

const IssuePrintPopup = ({ visible, onHide, issue }) => {
    const printContentRef = useRef(null);

    const handlePrint = useCallback(() => {
        if (!printContentRef.current) return;

        const printContent = printContentRef.current.innerHTML;
        const printWindow = window.open('', '_blank', 'width=800,height=600');

        if (!printWindow) {
            alert('Please allow popups to print the issue details.');
            return;
        }

        printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Issue #${issue?.id} - ${issue?.title || 'Issue Details'}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: #1f2937;
            line-height: 1.5;
            padding: 20px;
          }
          .print-header {
            border-bottom: 2px solid #3B82F6;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .print-header h1 { font-size: 24px; color: #111827; }
          .print-header .issue-id { color: #6B7280; font-size: 14px; }
          .section { margin-bottom: 20px; }
          .section-title {
            font-size: 14px;
            font-weight: 600;
            color: #374151;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 1px solid #E5E7EB;
          }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
          .info-item { margin-bottom: 10px; }
          .info-label { font-size: 12px; color: #6B7280; text-transform: uppercase; }
          .info-value { font-size: 14px; color: #111827; font-weight: 500; }
          .badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
          }
          .description {
            background: #F9FAFB;
            padding: 15px;
            border-radius: 8px;
            font-size: 14px;
          }
          .timeline-item {
            display: flex;
            gap: 12px;
            padding: 8px 0;
            border-bottom: 1px solid #F3F4F6;
          }
          .timeline-icon {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: #E5E7EB;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            flex-shrink: 0;
          }
          .timeline-content { flex: 1; font-size: 13px; }
          .timeline-time { color: #9CA3AF; font-size: 11px; }
          @media print {
            body { padding: 0; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        ${printContent}
      </body>
      </html>
    `);

        printWindow.document.close();

        // Wait for content to load then print
        setTimeout(() => {
            printWindow.print();
        }, 250);
    }, [issue]);

    const handleShare = useCallback(() => {
        const shareUrl = window.location.href;
        const shareText = `Issue #${issue?.id}: ${issue?.title || 'Issue Details'}`;

        if (navigator.share) {
            navigator.share({
                title: shareText,
                text: `${shareText}\n\nStatus: ${issue?.status}\nPriority: ${issue?.priority}`,
                url: shareUrl
            }).catch(() => {
                // User cancelled or share failed
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(`${shareText}\n${shareUrl}`).then(() => {
                alert('Issue link copied to clipboard!');
            }).catch(() => {
                alert('Unable to copy to clipboard');
            });
        }
    }, [issue]);

    if (!issue) return null;

    return (
        <Popup
            visible={visible}
            onHiding={onHide}
            title={`Print Issue #${issue.id}`}
            showCloseButton={true}
            width={700}
            height="auto"
            maxHeight="90vh"
            dragEnabled={true}
        >
            <div className="tw-flex tw-flex-col tw-h-full">
                {/* Action Buttons */}
                <div className="tw-flex tw-gap-3 tw-mb-4 tw-pb-4 tw-border-b">
                    <Button
                        text="Print"
                        icon="print"
                        type="default"
                        stylingMode="contained"
                        onClick={handlePrint}
                    />
                    <Button
                        text="Share"
                        icon="link"
                        type="normal"
                        stylingMode="outlined"
                        onClick={handleShare}
                    />
                </div>

                {/* Printable Content */}
                <div ref={printContentRef} className="tw-overflow-y-auto tw-flex-1">
                    {/* Header */}
                    <div className="print-header tw-border-b-2 tw-border-blue-500 tw-pb-4 tw-mb-5">
                        <div className="issue-id tw-text-gray-500 tw-text-sm">Issue #{issue.id}</div>
                        <h1 className="tw-text-xl tw-font-bold tw-text-gray-900 tw-mt-1">{issue.title}</h1>
                    </div>

                    {/* Info Grid */}
                    <div className="section tw-mb-5">
                        <div className="section-title tw-text-sm tw-font-semibold tw-text-gray-700 tw-uppercase tw-tracking-wide tw-mb-3 tw-pb-2 tw-border-b">
                            Issue Information
                        </div>
                        <div className="info-grid tw-grid tw-grid-cols-2 tw-gap-4">
                            <div className="info-item">
                                <div className="info-label tw-text-xs tw-text-gray-500 tw-uppercase">Status</div>
                                <div className="info-value">
                                    <span
                                        className="badge tw-inline-block tw-px-3 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium tw-text-white"
                                        style={{ backgroundColor: getStatusColor(issue.status) }}
                                    >
                                        {issue.status}
                                    </span>
                                </div>
                            </div>
                            <div className="info-item">
                                <div className="info-label tw-text-xs tw-text-gray-500 tw-uppercase">Priority</div>
                                <div className="info-value">
                                    <span
                                        className="badge tw-inline-block tw-px-3 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium tw-text-white"
                                        style={{ backgroundColor: getPriorityColor(issue.priority) }}
                                    >
                                        {issue.priority}
                                    </span>
                                </div>
                            </div>
                            <div className="info-item">
                                <div className="info-label tw-text-xs tw-text-gray-500 tw-uppercase">Assigned To</div>
                                <div className="info-value tw-text-sm tw-font-medium tw-text-gray-900">
                                    {issue.assigneeName || 'Unassigned'}
                                </div>
                            </div>
                            <div className="info-item">
                                <div className="info-label tw-text-xs tw-text-gray-500 tw-uppercase">Opened By</div>
                                <div className="info-value tw-text-sm tw-font-medium tw-text-gray-900">
                                    {issue.openerName || 'Unknown'}
                                </div>
                            </div>
                            <div className="info-item">
                                <div className="info-label tw-text-xs tw-text-gray-500 tw-uppercase">Due Date</div>
                                <div className="info-value tw-text-sm tw-font-medium tw-text-gray-900">
                                    {formatDate(issue.dueDate)}
                                </div>
                            </div>
                            <div className="info-item">
                                <div className="info-label tw-text-xs tw-text-gray-500 tw-uppercase">Created Date</div>
                                <div className="info-value tw-text-sm tw-font-medium tw-text-gray-900">
                                    {formatDate(issue.createdAt || issue.createdDate)}
                                </div>
                            </div>
                            {issue.templateName && (
                                <div className="info-item">
                                    <div className="info-label tw-text-xs tw-text-gray-500 tw-uppercase">Template</div>
                                    <div className="info-value tw-text-sm tw-font-medium tw-text-gray-900">
                                        {issue.templateName}
                                    </div>
                                </div>
                            )}
                            {issue.vehicleHyoungNumber && (
                                <div className="info-item">
                                    <div className="info-label tw-text-xs tw-text-gray-500 tw-uppercase">Vehicle</div>
                                    <div className="info-value tw-text-sm tw-font-medium tw-text-gray-900">
                                        {issue.vehicleHyoungNumber}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    {issue.description && (
                        <div className="section tw-mb-5">
                            <div className="section-title tw-text-sm tw-font-semibold tw-text-gray-700 tw-uppercase tw-tracking-wide tw-mb-3 tw-pb-2 tw-border-b">
                                Description
                            </div>
                            <div className="description tw-bg-gray-50 tw-p-4 tw-rounded-lg tw-text-sm tw-text-gray-700">
                                {issue.description}
                            </div>
                        </div>
                    )}

                    {/* Activity Stream */}
                    <div className="section">
                        <div className="section-title tw-text-sm tw-font-semibold tw-text-gray-700 tw-uppercase tw-tracking-wide tw-mb-3 tw-pb-2 tw-border-b">
                            Activity Stream
                        </div>
                        <IssueActivityStream issueId={issue.id} />
                    </div>
                </div>
            </div>
        </Popup>
    );
};

export default IssuePrintPopup;
